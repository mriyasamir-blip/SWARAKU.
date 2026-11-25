import { useCallback, useEffect, useRef, useState } from 'react';
import type { GpsTrackingState, UserAccount } from '../types/vore';
import { shouldAutoTrackGps } from '../utils/hierarchyAccess';
import {
  acquireScreenWakeLock,
  browserGeolocationAdapter,
  flushOfflineGpsQueue,
  isRealGpsCoordinate,
  isWakeLockSupported,
  readLivePatroliPref,
  releaseScreenWakeLock,
  saveLivePatroliPref,
  shouldPersistLocationFix,
  syncUserLocationToFirestore,
  updateUserGpsStateInFirestore,
  type GeoFix,
  type GeolocationProviderAdapter,
} from '../services/geolocationTrackerService';

export interface LocationTrackerHookResult {
  isTrackedUser: boolean;
  gpsState: GpsTrackingState;
  livePatroliEnabled: boolean;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  permissionDenied: boolean;
  errorMessage: string | null;
  lastCoords: { latitude: number; longitude: number } | null;
  accuracy: number | null;
  lastSyncedAt: number | null;
  toggleLivePatroli: () => Promise<void>;
  forceRefreshLocation: () => void;
}

/**
 * Global hook `useLocationTracker` untuk Korcam dan Relawan.
 * - Aktif otomatis saat login dengan `watchPosition({ enableHighAccuracy: true })`
 * - Throttling tulis Firestore: setiap 35 detik atau berpindah > 15 meter (Haversine)
 * - Mode Live Patroli: Screen Wake Lock API agar layar tidak tidur di lapangan
 * - Page Visibility API: hidden -> "background", visible -> getCurrentPosition + "online" + re-acquire Wake Lock
 * - Logout / pagehide / beforeunload -> "offline"
 * - Offline Queue: simpan di localStorage dan auto-flush saat kembali online
 */
export function useLocationTracker(
  user: UserAccount | null | undefined,
  userAccounts: UserAccount[] = [],
  adapter: GeolocationProviderAdapter = browserGeolocationAdapter
): LocationTrackerHookResult {
  const isTrackedUser = Boolean(user && shouldAutoTrackGps(user.role));

  const [gpsState, setGpsState] = useState<GpsTrackingState>('offline');
  const [livePatroliEnabled, setLivePatroliEnabled] = useState<boolean>(() => readLivePatroliPref());
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const watchIdRef = useRef<number | string | null>(null);
  const lastFixRef = useRef<GeoFix | null>(null);
  const lastWrittenAtRef = useRef<number>(0);
  const lastWrittenStateRef = useRef<GpsTrackingState | null>(null);
  const wakeLockSentinelRef = useRef<Awaited<ReturnType<typeof acquireScreenWakeLock>>>(null);
  const userRef = useRef<UserAccount | null | undefined>(user);
  const userAccountsRef = useRef<UserAccount[]>(userAccounts);
  const livePatroliRef = useRef<boolean>(livePatroliEnabled);

  userRef.current = user;
  userAccountsRef.current = userAccounts;
  livePatroliRef.current = livePatroliEnabled;

  const persistFix = useCallback(
    async (fix: GeoFix, force = false, explicitState?: GpsTrackingState) => {
      const currentUser = userRef.current;
      if (!currentUser || !shouldAutoTrackGps(currentUser.role)) return;
      if (!isRealGpsCoordinate(fix.latitude, fix.longitude)) return;

      const resolvedState: GpsTrackingState =
        explicitState || (typeof document !== 'undefined' && document.hidden ? 'background' : 'online');

      setLastCoords({ latitude: fix.latitude, longitude: fix.longitude });
      setAccuracy(fix.accuracy);
      setPermissionDenied(false);
      setErrorMessage(null);
      setGpsState(resolvedState);

      const shouldWrite = shouldPersistLocationFix({
        lastFix: lastFixRef.current,
        lastWrittenAt: lastWrittenAtRef.current,
        lastWrittenState: lastWrittenStateRef.current,
        nextFix: fix,
        nextState: resolvedState,
        force,
      });

      if (!shouldWrite) return;

      lastFixRef.current = fix;
      lastWrittenAtRef.current = Date.now();
      lastWrittenStateRef.current = resolvedState;

      const ok = await syncUserLocationToFirestore({
        user: currentUser,
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracy: fix.accuracy,
        gpsState: resolvedState,
        userAccounts: userAccountsRef.current,
      });

      if (ok) {
        setLastSyncedAt(Date.now());
      }
    },
    []
  );

  const handleGeoError = useCallback((err: { code: number; message: string }) => {
    if (err.code === 1) {
      setPermissionDenied(true);
      setErrorMessage('Izin akses lokasi GPS ditolak oleh browser/perangkat.');
      setGpsState('offline');
    } else if (err.code === 2) {
      setErrorMessage('Sinyal GPS tidak tersedia saat ini. Mencoba ulang...');
    } else if (err.code === 3) {
      setErrorMessage('Permintaan GPS melebihi batas waktu. Mencoba ulang...');
    }
  }, []);

  const requestWakeLockNow = useCallback(async () => {
    if (!isWakeLockSupported()) return;
    if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
      setWakeLockActive(true);
      return;
    }
    const sentinel = await acquireScreenWakeLock(() => {
      setWakeLockActive(false);
    });
    wakeLockSentinelRef.current = sentinel;
    setWakeLockActive(Boolean(sentinel));
  }, []);

  const releaseWakeLockNow = useCallback(async () => {
    await releaseScreenWakeLock(wakeLockSentinelRef.current);
    wakeLockSentinelRef.current = null;
    setWakeLockActive(false);
  }, []);

  const toggleLivePatroli = useCallback(async () => {
    const next = !livePatroliRef.current;
    setLivePatroliEnabled(next);
    saveLivePatroliPref(next);

    if (next) {
      await requestWakeLockNow();
      adapter.getCurrentPosition(
        (fix) => {
          persistFix(fix, true, 'online');
        },
        handleGeoError
      );
    } else {
      await releaseWakeLockNow();
    }
  }, [adapter, handleGeoError, persistFix, releaseWakeLockNow, requestWakeLockNow]);

  const forceRefreshLocation = useCallback(() => {
    if (!adapter.isSupported()) {
      setErrorMessage('Perangkat/browser ini tidak mendukung GPS Geolocation.');
      return;
    }
    adapter.getCurrentPosition(
      (fix) => {
        persistFix(fix, true, 'online');
      },
      handleGeoError
    );
  }, [adapter, handleGeoError, persistFix]);

  // Manage Wake Lock automatically when livePatroliEnabled changes
  useEffect(() => {
    if (!isTrackedUser) {
      releaseWakeLockNow();
      return;
    }
    if (livePatroliEnabled) {
      requestWakeLockNow();
    } else {
      releaseWakeLockNow();
    }
  }, [isTrackedUser, livePatroliEnabled, requestWakeLockNow, releaseWakeLockNow]);

  // Main Geolocation Watch + Lifecycle Listeners (Visibility, Online, Pagehide/Beforeunload)
  useEffect(() => {
    if (!isTrackedUser || !user?.id) {
      if (watchIdRef.current !== null) {
        adapter.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsState('offline');
      return;
    }

    if (!adapter.isSupported()) {
      setErrorMessage('Browser tidak mendukung layanan GPS.');
      return;
    }

    // 1. Flush offline queue jika ada saat startup
    flushOfflineGpsQueue(user, userAccountsRef.current).catch(() => {});

    // 2. Ambil posisi pertama segera
    adapter.getCurrentPosition(
      (fix) => {
        persistFix(fix, true, document.hidden ? 'background' : 'online');
      },
      handleGeoError
    );

    // 3. Mulai watchPosition real-time (enableHighAccuracy: true)
    watchIdRef.current = adapter.watchPosition(
      (fix) => {
        persistFix(fix, false);
      },
      handleGeoError
    );

    // 4. Periodic heartbeat safety net (setiap 45 detik jika sedang aktif dan ada fix terakhir)
    const heartbeatInterval = window.setInterval(() => {
      if (!userRef.current || document.hidden) return;
      adapter.getCurrentPosition((fix) => {
        persistFix(fix, false, 'online');
      });
    }, 45_000);

    // 5. Page Visibility API: background vs foreground recovery
    const handleVisibilityChange = () => {
      const currentUser = userRef.current;
      if (!currentUser) return;

      if (document.hidden) {
        setGpsState('background');
        lastWrittenStateRef.current = 'background';
        updateUserGpsStateInFirestore(currentUser, 'background').catch(() => {});
      } else {
        setGpsState('online');
        // Langsung paksa pengambilan koordinat GPS terbaru & kirim dengan gpsState: "online"
        adapter.getCurrentPosition(
          (fix) => {
            persistFix(fix, true, 'online');
          },
          () => {
            updateUserGpsStateInFirestore(currentUser, 'online').catch(() => {});
          }
        );
        // Aktifkan ulang Wake Lock jika Mode Live Tracking menyala
        if (livePatroliRef.current) {
          requestWakeLockNow();
        }
      }
    };

    // 6. Online listener: flush antrean offline
    const handleOnline = () => {
      if (userRef.current) {
        flushOfflineGpsQueue(userRef.current, userAccountsRef.current)
          .then((flushed) => {
            if (flushed) setLastSyncedAt(Date.now());
          })
          .catch(() => {});
        adapter.getCurrentPosition((fix) => {
          persistFix(fix, true, document.hidden ? 'background' : 'online');
        });
      }
    };

    // 7. Pagehide / Beforeunload -> set gpsState: "offline"
    const handlePageExit = () => {
      if (userRef.current) {
        updateUserGpsStateInFirestore(userRef.current, 'offline').catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
      window.clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
      if (watchIdRef.current !== null) {
        adapter.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      releaseWakeLockNow();
    };
  }, [
    isTrackedUser,
    user?.id,
    adapter,
    handleGeoError,
    persistFix,
    requestWakeLockNow,
    releaseWakeLockNow,
  ]);

  return {
    isTrackedUser,
    gpsState,
    livePatroliEnabled,
    wakeLockActive,
    wakeLockSupported: isWakeLockSupported(),
    permissionDenied,
    errorMessage,
    lastCoords,
    accuracy,
    lastSyncedAt,
    toggleLivePatroli,
    forceRefreshLocation,
  };
}

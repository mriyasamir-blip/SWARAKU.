import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
  getDistanceMeters,
  isTrackedRole,
  saveLiveLocation,
  toTrackedRoleLabel,
  type GpsStatus,
  type LiveLocationRecord,
  type UserRole,
} from '../services/locationService';

export interface TrackedUserInfo {
  id: string;
  username?: string;
  nama: string;
  role: UserRole;
  timSuksesId?: string | null;
  timSuksesNama?: string | null;
  didaftarkanOlehTimSukses?: string | null;
  korcamId?: string | null;
  korcamNama?: string | null;
  kota?: string | null;
  kecamatan?: string | null;
  kelurahan?: string | null;
}

interface GpsTrackerModalProps {
  user: TrackedUserInfo | null;
  userAccounts?: TrackedUserInfo[];
}

// Share Live Location tuning: responsive real-time updates + background keep-alive
const THROTTLE_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 20_000;
const MIN_DISTANCE_METERS = 10;

interface WakeLockSentinelLike {
  released?: boolean;
  release: () => Promise<void>;
}

/**
 * Create a lightweight inline Web Worker timer so periodic GPS heartbeats
 * keep ticking reliably even when the user switches apps/tabs (less throttled
 * than main-thread setInterval on mobile browsers).
 */
function createHeartbeatWorker(intervalMs: number): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    return null;
  }
  try {
    const code = `
      let timer = setInterval(() => {
        self.postMessage('tick');
      }, ${Math.max(10_000, intervalMs)});
      self.onmessage = (e) => {
        if (e.data === 'stop') {
          clearInterval(timer);
          self.close();
        }
      };
    `;
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    return worker;
  } catch {
    return null;
  }
}

export const GpsTrackerModal: React.FC<GpsTrackerModalProps> = ({
  user,
  userAccounts = [],
}) => {
  const [status, setStatus] = useState<GpsStatus | 'Menunggu'>('Menunggu');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [retryTick, setRetryTick] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const pendingOfflinePayloadRef = useRef<Omit<LiveLocationRecord, 'lastUpdated'> | null>(null);

  const tracked = Boolean(user && isTrackedRole(user.role));

  // Resolve complete supervisor chain (Korcam -> Korwil) from userAccounts if missing on user doc
  const resolvedHierarchy = useMemo(() => {
    if (!user) {
      return {
        timSuksesId: null as string | null,
        namaTimSukses: null as string | null,
        korcamId: null as string | null,
        namaKorcam: null as string | null,
      };
    }

    const trackedRole = toTrackedRoleLabel(user.role);
    const needsSupervisor = trackedRole === 'Korcam' || trackedRole === 'Relawan';

    let korcamId = trackedRole === 'Relawan' ? user.korcamId || null : null;
    let namaKorcam = trackedRole === 'Relawan' ? user.korcamNama || null : null;
    let timSuksesId = needsSupervisor ? user.timSuksesId || null : null;
    let namaTimSukses = needsSupervisor
      ? user.timSuksesNama || user.didaftarkanOlehTimSukses || null
      : null;

    // Look up parent Korcam to resolve Korcam name and parent Korwil ID
    if (trackedRole === 'Relawan' && userAccounts.length > 0) {
      const parentKorcam = userAccounts.find(
        (acc) =>
          (korcamId && (acc.id === korcamId || acc.username === korcamId)) ||
          (namaKorcam && acc.nama.trim().toLowerCase() === namaKorcam.trim().toLowerCase())
      );
      if (parentKorcam) {
        if (!korcamId) korcamId = parentKorcam.id;
        if (!namaKorcam) namaKorcam = parentKorcam.nama;
        if (!timSuksesId && parentKorcam.timSuksesId) {
          timSuksesId = parentKorcam.timSuksesId;
        }
        if (!namaTimSukses && (parentKorcam.timSuksesNama || parentKorcam.didaftarkanOlehTimSukses)) {
          namaTimSukses =
            parentKorcam.timSuksesNama || parentKorcam.didaftarkanOlehTimSukses || null;
        }
      }
    }

    // Resolve Korwil name if timSuksesId is known
    if (needsSupervisor && timSuksesId && !namaTimSukses && userAccounts.length > 0) {
      const parentKorwil = userAccounts.find(
        (acc) => acc.id === timSuksesId || acc.username === timSuksesId
      );
      if (parentKorwil) {
        namaTimSukses = parentKorwil.nama;
      }
    }

    return {
      timSuksesId,
      namaTimSukses,
      korcamId,
      namaKorcam,
    };
  }, [
    user?.id,
    user?.role,
    user?.timSuksesId,
    user?.timSuksesNama,
    user?.didaftarkanOlehTimSukses,
    user?.korcamId,
    user?.korcamNama,
    userAccounts,
  ]);

  const stopWatching = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== 'undefined' &&
      'geolocation' in navigator
    ) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        // ignore
      }
      watchIdRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      wakeLockRef.current.release().catch(() => {});
    }
    wakeLockRef.current = null;
  }, []);

  const requestWakeLockIfSupported = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    const navWithWakeLock = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };
    if (!navWithWakeLock.wakeLock) return;
    try {
      if (wakeLockRef.current && !wakeLockRef.current.released) return;
      wakeLockRef.current = await navWithWakeLock.wakeLock.request('screen');
    } catch {
      // Browser may block wakeLock on low battery or unsupported contexts — ignore silently
    }
  }, []);

  useEffect(() => {
    stopWatching();
    releaseWakeLock();

    if (!user || !tracked) {
      setStatus('Menunggu');
      setErrorDetail(null);
      setDismissed(false);
      pendingOfflinePayloadRef.current = null;
      return;
    }

    const trackedRole = toTrackedRoleLabel(user.role);
    if (!trackedRole) return;

    const userId = user.id || user.username || '';
    if (!userId) return;

    const { timSuksesId, namaTimSukses, korcamId, namaKorcam } = resolvedHierarchy;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('Ditolak');
      setErrorDetail('Browser perangkat ini tidak mendukung fitur pelacakan GPS.');
      saveLiveLocation({
        userId,
        nama: user.nama,
        role: trackedRole,
        timSuksesId,
        namaTimSukses,
        korcamId,
        namaKorcam,
        latitude: null,
        longitude: null,
        accuracy: null,
        address: '',
        gpsStatus: 'Ditolak',
      }).catch(() => {});
      return;
    }

    let cancelled = false;
    let hasSentInitial = false;
    let lastSentAt = 0;
    let lastLat: number | null = null;
    let lastLng: number | null = null;
    let isSaving = false;

    const pushCoords = async (
      latitude: number,
      longitude: number,
      accuracy: number | null,
      force = false
    ) => {
      if (cancelled) return;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastSentAt;
      const movedMeters =
        lastLat !== null && lastLng !== null
          ? getDistanceMeters(lastLat, lastLng, latitude, longitude)
          : Infinity;

      const shouldSend =
        force ||
        !hasSentInitial ||
        elapsed >= THROTTLE_MS ||
        movedMeters > MIN_DISTANCE_METERS;

      if (!shouldSend || isSaving) return;

      const payload: Omit<LiveLocationRecord, 'lastUpdated'> = {
        userId,
        nama: user.nama,
        role: trackedRole,
        timSuksesId,
        namaTimSukses,
        korcamId,
        namaKorcam,
        latitude,
        longitude,
        accuracy: accuracy !== null && Number.isFinite(accuracy) ? Math.round(accuracy) : null,
        address: '',
        gpsStatus: 'Aktif',
      };

      // If offline, cache latest real GPS fix and flush automatically once back online
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        pendingOfflinePayloadRef.current = payload;
        return;
      }

      isSaving = true;
      try {
        await saveLiveLocation(payload);
        if (cancelled) return;
        pendingOfflinePayloadRef.current = null;
        hasSentInitial = true;
        lastSentAt = Date.now();
        lastLat = latitude;
        lastLng = longitude;
        setStatus('Aktif');
        setErrorDetail(null);
      } catch {
        // Keep latest real fix for retry on next heartbeat/online event
        pendingOfflinePayloadRef.current = payload;
      } finally {
        isSaving = false;
      }
    };

    const handleGeoError = (geoErr: GeolocationPositionError) => {
      if (cancelled) return;
      if (geoErr.code === geoErr.PERMISSION_DENIED) {
        setStatus('Ditolak');
        setErrorDetail(
          'Izin lokasi GPS ditolak. Aktifkan izin lokasi pada browser agar posisi Anda terpantau secara real-time di menu Monitoring.'
        );
        saveLiveLocation({
          userId,
          nama: user.nama,
          role: trackedRole,
          timSuksesId,
          namaTimSukses,
          korcamId,
          namaKorcam,
          latitude: null,
          longitude: null,
          accuracy: null,
          address: '',
          gpsStatus: 'Ditolak',
        }).catch(() => {});
      }
    };

    const startWatcher = () => {
      stopWatching();
      const wid = navigator.geolocation.watchPosition(
        (pos) => {
          pushCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy ?? null,
            false
          ).catch(() => {});
        },
        handleGeoError,
        {
          enableHighAccuracy: true,
          maximumAge: 10_000,
          timeout: 20_000,
        }
      );
      watchIdRef.current = wid;
    };

    const pollImmediateFix = (force = false) => {
      if (cancelled) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pushCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy ?? null,
            force
          ).catch(() => {});
        },
        (geoErr) => {
          // Only report permission denied; transient timeouts while backgrounded are retried on next heartbeat
          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            handleGeoError(geoErr);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10_000,
          timeout: 15_000,
        }
      );
    };

    const flushOfflineIfAny = () => {
      const queued = pendingOfflinePayloadRef.current;
      if (queued && !isSaving && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        isSaving = true;
        saveLiveLocation(queued)
          .then(() => {
            pendingOfflinePayloadRef.current = null;
            hasSentInitial = true;
            lastSentAt = Date.now();
            if (!cancelled) {
              setStatus('Aktif');
              setErrorDetail(null);
            }
          })
          .catch(() => {})
          .finally(() => {
            isSaving = false;
          });
      }
    };

    // 1. Start primary real-time watcher + immediate fix + wake lock
    startWatcher();
    pollImmediateFix(true);
    requestWakeLockIfSupported().catch(() => {});

    // 2. Background Web Worker heartbeat (keeps Share Live Location active even when app is not foregrounded)
    const worker = createHeartbeatWorker(HEARTBEAT_INTERVAL_MS);
    let fallbackInterval: number | null = null;

    const handleHeartbeat = () => {
      if (cancelled) return;
      flushOfflineIfAny();
      const sinceLast = Date.now() - lastSentAt;
      if (sinceLast >= THROTTLE_MS) {
        pollImmediateFix(true);
      }
    };

    if (worker) {
      worker.onmessage = handleHeartbeat;
    } else {
      fallbackInterval = window.setInterval(handleHeartbeat, HEARTBEAT_INTERVAL_MS);
    }

    // 3. Auto-reconnect & instant sync on visibility change, app resume, focus, or network restore
    const handleResumeSync = () => {
      if (cancelled) return;
      flushOfflineIfAny();
      if (document.visibilityState === 'visible') {
        requestWakeLockIfSupported().catch(() => {});
        // Restart watchPosition in case mobile OS paused the previous watcher while backgrounded
        startWatcher();
      }
      pollImmediateFix(true);
    };

    const handleOnline = () => {
      if (cancelled) return;
      flushOfflineIfAny();
      pollImmediateFix(true);
    };

    document.addEventListener('visibilitychange', handleResumeSync);
    window.addEventListener('focus', handleResumeSync);
    window.addEventListener('pageshow', handleResumeSync);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      stopWatching();
      releaseWakeLock();
      if (worker) {
        try {
          worker.postMessage('stop');
          worker.terminate();
        } catch {
          // ignore
        }
      }
      if (fallbackInterval !== null) {
        window.clearInterval(fallbackInterval);
      }
      document.removeEventListener('visibilitychange', handleResumeSync);
      window.removeEventListener('focus', handleResumeSync);
      window.removeEventListener('pageshow', handleResumeSync);
      window.removeEventListener('online', handleOnline);
    };
  }, [
    user?.id,
    user?.username,
    user?.nama,
    user?.role,
    resolvedHierarchy.timSuksesId,
    resolvedHierarchy.namaTimSukses,
    resolvedHierarchy.korcamId,
    resolvedHierarchy.namaKorcam,
    tracked,
    retryTick,
    stopWatching,
    releaseWakeLock,
    requestWakeLockIfSupported,
  ]);

  // Tampilkan modal hanya jika user adalah Korwil / Korcam / Relawan dan izin GPS ditolak
  if (!tracked || status !== 'Ditolak' || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Akses Lokasi GPS Belum Aktif
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {errorDetail ||
                  'Akun Korwil, Korcam, dan Relawan memerlukan izin lokasi GPS agar posisi Share Live Location terpantau secara real-time.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            aria-label="Tutup pemberitahuan GPS"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            Status Anda saat ini tercatat sebagai <strong className="text-rose-700">Ditolak</strong> di
            Monitoring tanpa koordinat palsu.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorDetail(null);
              setStatus('Menunggu');
              setRetryTick((t) => t + 1);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Aktifkan GPS Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};

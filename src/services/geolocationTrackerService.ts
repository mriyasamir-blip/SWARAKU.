import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import type { GpsTrackingState, UserAccount } from '../types/vore';
import { saveLiveLocation, markLocationOffline as markLegacyLiveOffline } from './locationService';

// ============================================================================
// SWARAKU — MODULAR LIVE LOCATION TRACKING SERVICE
// Arsitektur terpisah (GeolocationProviderAdapter) agar mudah diganti ke
// @capacitor-community/background-geolocation ketika dibungkus ke APK Android.
// ============================================================================

export const USER_ACCOUNTS_COLLECTION = 'user_accounts';
export const OFFLINE_GPS_QUEUE_KEY = 'swaraku_offline_gps_queue_v1';
export const LIVE_PATROLI_PREF_KEY = 'swaraku_live_patroli_enabled_v1';

/** Throttle constants: 35 seconds OR > 15 meters (Haversine) */
export const GPS_WRITE_MIN_INTERVAL_MS = 35_000;
export const GPS_WRITE_MIN_DISTANCE_METERS = 15;

export interface GeoFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface OfflineQueuedGpsFix {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  gpsState: GpsTrackingState;
  capturedAt: number;
}

/**
 * Modular provider interface:
 * Implementasi default menggunakan browser `navigator.geolocation`.
 * Untuk build Android APK native, cukup ganti implementasi adapter ini dengan
 * `@capacitor-community/background-geolocation`.
 */
export interface GeolocationProviderAdapter {
  isSupported: () => boolean;
  watchPosition: (
    onFix: (fix: GeoFix) => void,
    onError: (err: { code: number; message: string }) => void
  ) => number | string | null;
  clearWatch: (watchId: number | string | null) => void;
  getCurrentPosition: (
    onFix: (fix: GeoFix) => void,
    onError?: (err: { code: number; message: string }) => void
  ) => void;
}

export const browserGeolocationAdapter: GeolocationProviderAdapter = {
  isSupported: () => typeof navigator !== 'undefined' && 'geolocation' in navigator,

  watchPosition(onFix, onError) {
    if (!this.isSupported()) return null;
    return navigator.geolocation.watchPosition(
      (pos) => {
        onFix({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
          timestamp: pos.timestamp || Date.now(),
        });
      },
      (err) => {
        onError({ code: err.code, message: err.message });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 20_000,
      }
    );
  },

  clearWatch(watchId) {
    if (watchId !== null && typeof watchId === 'number' && this.isSupported()) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  getCurrentPosition(onFix, onError) {
    if (!this.isSupported()) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onFix({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
          timestamp: pos.timestamp || Date.now(),
        });
      },
      (err) => {
        onError?.({ code: err.code, message: err.message });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 15_000,
      }
    );
  },
};

/**
 * Rumus Haversine: hitung jarak perpindahan dalam meter antara 2 titik GPS.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // radius bumi (meter)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validasi apakah koordinat GPS riil (bukan 0,0 atau NaN).
 */
export function isRealGpsCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Cek apakah pembaruan GPS perlu ditulis ke Firestore berdasarkan throttling:
 * - Tulis setiap >= 35 detik, ATAU
 * - Saat berpindah jarak > 15 meter (Haversine), ATAU
 * - Saat status `gpsState` berubah, ATAU `force === true`.
 */
export function shouldPersistLocationFix(params: {
  lastFix: GeoFix | null;
  lastWrittenAt: number;
  lastWrittenState: GpsTrackingState | null;
  nextFix: GeoFix;
  nextState: GpsTrackingState;
  force?: boolean;
}): boolean {
  if (params.force) return true;
  if (!params.lastFix || params.lastWrittenAt === 0) return true;
  if (params.lastWrittenState !== params.nextState) return true;

  const elapsedMs = Date.now() - params.lastWrittenAt;
  if (elapsedMs >= GPS_WRITE_MIN_INTERVAL_MS) return true;

  const movedMeters = haversineDistanceMeters(
    params.lastFix.latitude,
    params.lastFix.longitude,
    params.nextFix.latitude,
    params.nextFix.longitude
  );
  return movedMeters > GPS_WRITE_MIN_DISTANCE_METERS;
}

// ----------------------------------------------------------------------------
// OFFLINE QUEUE (localStorage)
// ----------------------------------------------------------------------------
export function enqueueOfflineGpsFix(fix: OfflineQueuedGpsFix): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_GPS_QUEUE_KEY, JSON.stringify(fix));
  } catch {
    // ignore quota errors
  }
}

export function readOfflineGpsFix(): OfflineQueuedGpsFix | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(OFFLINE_GPS_QUEUE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineQueuedGpsFix;
    if (
      parsed &&
      parsed.userId &&
      isRealGpsCoordinate(parsed.latitude, parsed.longitude)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearOfflineGpsFix(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_GPS_QUEUE_KEY);
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------------
// SCREEN WAKE LOCK API (MODE LIVE PATROLI)
// ----------------------------------------------------------------------------
interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (event: string, listener: () => void) => void;
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export async function acquireScreenWakeLock(
  onRelease?: () => void
): Promise<WakeLockSentinelLike | null> {
  if (!isWakeLockSupported()) return null;
  try {
    const navWithWakeLock = navigator as unknown as {
      wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };
    const sentinel = await navWithWakeLock.wakeLock.request('screen');
    sentinel.addEventListener?.('release', () => {
      onRelease?.();
    });
    return sentinel;
  } catch {
    return null;
  }
}

export async function releaseScreenWakeLock(sentinel: WakeLockSentinelLike | null): Promise<void> {
  if (!sentinel || sentinel.released) return;
  try {
    await sentinel.release();
  } catch {
    // ignore
  }
}

export function readLivePatroliPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LIVE_PATROLI_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveLivePatroliPref(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIVE_PATROLI_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------------
// FIRESTORE PERSISTENCE (user_accounts/{userId} + mirror live_locations/{userId})
// ----------------------------------------------------------------------------

function sanitizeUserDocBase(user: UserAccount): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: user.id,
    role: user.role,
    nama: user.nama,
    username: user.username,
  };
  if (user.email) base.email = user.email;
  if (user.jabatan) base.jabatan = user.jabatan;
  if (user.wilayah) base.wilayah = user.wilayah;
  if (user.provinsi) base.provinsi = user.provinsi;
  if (user.kota) base.kota = user.kota;
  if (user.kecamatan) base.kecamatan = user.kecamatan;
  if (user.kelurahan) base.kelurahan = user.kelurahan;
  if (user.noHp) base.noHp = user.noHp;
  if (user.status) base.status = user.status;
  if (user.timSuksesId) base.timSuksesId = user.timSuksesId;
  if (user.timSuksesNama) base.timSuksesNama = user.timSuksesNama;
  if (user.korcamId) base.korcamId = user.korcamId;
  if (user.korcamNama) base.korcamNama = user.korcamNama;
  return base;
}

/**
 * Simpan titik GPS terbaru + `gpsState` ke dokumen user di `user_accounts/{userId}`
 * dan mirror ke `live_locations/{userId}` agar kompatibel lintas komponen.
 */
export async function syncUserLocationToFirestore(params: {
  user: UserAccount;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  gpsState: GpsTrackingState;
  userAccounts?: UserAccount[];
}): Promise<boolean> {
  const { user, latitude, longitude, accuracy, gpsState, userAccounts = [] } = params;
  if (!user?.id || !isRealGpsCoordinate(latitude, longitude)) return false;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    enqueueOfflineGpsFix({
      userId: user.id,
      latitude,
      longitude,
      accuracy,
      gpsState,
      capturedAt: Date.now(),
    });
    return false;
  }

  const userRef = doc(firestore, USER_ACCOUNTS_COLLECTION, user.id);
  const locationFields = {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    lastLocationUpdate: serverTimestamp(),
    gpsState,
  };

  try {
    await updateDoc(userRef, locationFields);
  } catch {
    // Jika dokumen preset belum pernah dibuat di Firestore, lakukan setDoc merge dengan field wajib
    try {
      await setDoc(
        userRef,
        {
          ...sanitizeUserDocBase(user),
          ...locationFields,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[LocationTracker] Gagal menulis lokasi ke user_accounts:', err);
      enqueueOfflineGpsFix({
        userId: user.id,
        latitude,
        longitude,
        accuracy,
        gpsState,
        capturedAt: Date.now(),
      });
      return false;
    }
  }

  // Mirror ke live_locations agar kompatibel dengan perangkat versi sebelumnya
  const roleLabel =
    user.role === 'tim_sukses' ? 'Korwil' : user.role === 'kader' ? 'Korcam' : 'Relawan';
  const matchedKorcam =
    user.role === 'relawan'
      ? userAccounts.find((u) => u.id === user.korcamId || u.nama === user.korcamNama)
      : undefined;
  const resolvedTimSuksesId = user.timSuksesId || matchedKorcam?.timSuksesId || null;
  const resolvedTimSuksesNama =
    user.timSuksesNama ||
    user.didaftarkanOlehTimSukses ||
    matchedKorcam?.timSuksesNama ||
    null;

  saveLiveLocation({
    userId: user.id,
    nama: user.nama,
    role: roleLabel,
    timSuksesId: resolvedTimSuksesId,
    namaTimSukses: resolvedTimSuksesNama,
    korcamId: user.korcamId || null,
    namaKorcam: user.korcamNama || null,
    latitude,
    longitude,
    accuracy,
    address: [user.kelurahan, user.kecamatan, user.kota].filter(Boolean).join(', '),
    gpsStatus: gpsState === 'offline' ? 'Tidak Aktif' : 'Aktif',
  }).catch(() => {});

  return true;
}

/**
 * Perbarui hanya status `gpsState` (`"online" | "background" | "offline"`)
 * tanpa menimpa koordinat GPS terakhir yang valid.
 */
export async function updateUserGpsStateInFirestore(
  user: UserAccount,
  gpsState: GpsTrackingState
): Promise<void> {
  if (!user?.id) return;
  const userRef = doc(firestore, USER_ACCOUNTS_COLLECTION, user.id);

  try {
    await updateDoc(userRef, {
      gpsState,
      ...(gpsState === 'online' ? { lastLocationUpdate: serverTimestamp() } : {}),
    });
  } catch {
    try {
      await setDoc(
        userRef,
        {
          ...sanitizeUserDocBase(user),
          gpsState,
        },
        { merge: true }
      );
    } catch {
      // ignore background/unload errors
    }
  }

  if (gpsState === 'offline') {
    markLegacyLiveOffline(user.id).catch(() => {});
  }
}

/**
 * Flush antrean lokasi offline dari localStorage saat sinyal internet pulih.
 */
export async function flushOfflineGpsQueue(
  user: UserAccount,
  userAccounts?: UserAccount[]
): Promise<boolean> {
  const queued = readOfflineGpsFix();
  if (!queued || queued.userId !== user.id) return false;
  const ok = await syncUserLocationToFirestore({
    user,
    latitude: queued.latitude,
    longitude: queued.longitude,
    accuracy: queued.accuracy,
    gpsState: typeof document !== 'undefined' && document.hidden ? 'background' : 'online',
    userAccounts,
  });
  if (ok) {
    clearOfflineGpsFix();
  }
  return ok;
}

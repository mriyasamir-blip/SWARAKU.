import {
  collection,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QuerySnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from './swarakuFirestore';

export const KADER_LOCATIONS_COLLECTION = 'kader_locations';
export const GPS_THROTTLE_MS = 30_000; // Maksimal 1 kali kirim per 30 detik
export const GPS_DISTANCE_THRESHOLD_METERS = 20; // Atau saat berpindah > 20 meter
export const STALE_SIGNAL_THRESHOLD_MS = 10 * 60 * 1000; // > 10 menit -> Sinyal Terhenti

export type KaderGpsStatus = 'Aktif' | 'Tidak Aktif' | 'Ditolak';

export interface KaderLocationRecord {
  userId: string;
  namaKader: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address: string;
  gpsStatus: KaderGpsStatus;
  lastUpdatedMs: number;
  lastUpdatedWib: string;
}

export function sanitizeKaderDocId(rawId: string): string {
  const cleaned = String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  return cleaned || 'kader_unknown';
}

/**
 * Menghitung jarak antara dua koordinat GPS dalam satuan meter (rumus Haversine).
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatWibTimestamp(ms: number): string {
  if (!ms || Number.isNaN(ms)) return '-';
  try {
    return (
      new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date(ms)) + ' WIB'
    );
  } catch {
    return new Date(ms).toLocaleString('id-ID');
  }
}

export function isKaderSignalStale(
  record: KaderLocationRecord,
  nowMs: number = Date.now()
): boolean {
  if (record.gpsStatus !== 'Aktif') return false;
  if (!record.lastUpdatedMs) return false;
  return nowMs - record.lastUpdatedMs > STALE_SIGNAL_THRESHOLD_MS;
}

/**
 * Reverse geocoding opsional via Google Maps Geocoder jika SDK Maps sedang termuat.
 * Mengembalikan string kosong jika tidak tersedia (tanpa alamat palsu).
 */
async function tryReverseGeocode(lat: number, lng: number): Promise<string> {
  if (typeof window === 'undefined') return '';
  const gmaps = (window as unknown as {
    google?: {
      maps?: {
        Geocoder?: new () => {
          geocode: (
            req: { location: { lat: number; lng: number } },
            cb: (results: Array<{ formatted_address?: string }> | null, status: string) => void
          ) => void;
        };
      };
    };
  }).google?.maps;

  const GeocoderCtor = gmaps?.Geocoder;
  if (!GeocoderCtor) return '';

  return new Promise((resolve) => {
    try {
      const geocoder = new GeocoderCtor();
      const timer = window.setTimeout(() => resolve(''), 3500);
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        window.clearTimeout(timer);
        if (status === 'OK' && results && results[0]?.formatted_address) {
          resolve(results[0].formatted_address.slice(0, 300));
        } else {
          resolve('');
        }
      });
    } catch {
      resolve('');
    }
  });
}

function parseTimestampMs(raw: unknown): number {
  if (!raw) return 0;
  if (typeof (raw as Timestamp).toMillis === 'function') {
    return (raw as Timestamp).toMillis();
  }
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  return 0;
}

function mapSnapshotToRecords(snap: QuerySnapshot<DocumentData>): KaderLocationRecord[] {
  const list: KaderLocationRecord[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const lastUpdatedMs = parseTimestampMs(d.lastUpdated);
    const gpsStatus: KaderGpsStatus =
      d.gpsStatus === 'Aktif' || d.gpsStatus === 'Tidak Aktif' || d.gpsStatus === 'Ditolak'
        ? d.gpsStatus
        : 'Tidak Aktif';

    const hasValidCoords =
      typeof d.latitude === 'number' &&
      Number.isFinite(d.latitude) &&
      d.latitude >= -90 &&
      d.latitude <= 90 &&
      typeof d.longitude === 'number' &&
      Number.isFinite(d.longitude) &&
      d.longitude >= -180 &&
      d.longitude <= 180;

    list.push({
      userId: String(d.userId || docSnap.id),
      namaKader: String(d.namaKader || d.userId || docSnap.id),
      latitude: hasValidCoords ? d.latitude : undefined,
      longitude: hasValidCoords ? d.longitude : undefined,
      accuracy:
        typeof d.accuracy === 'number' && Number.isFinite(d.accuracy)
          ? Math.round(d.accuracy)
          : undefined,
      address: typeof d.address === 'string' ? d.address : '',
      gpsStatus,
      lastUpdatedMs,
      lastUpdatedWib: formatWibTimestamp(lastUpdatedMs),
    });
  });

  // Urutkan terbaru di atas
  return list.sort((a, b) => b.lastUpdatedMs - a.lastUpdatedMs);
}

/**
 * Menyimpan / menimpa posisi GPS terakhir Kader di collection `kader_locations`.
 */
export async function upsertKaderLocation(params: {
  userId: string;
  namaKader: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}): Promise<void> {
  const docId = sanitizeKaderDocId(params.userId);
  const path = `${KADER_LOCATIONS_COLLECTION}/${docId}`;
  try {
    const clampedAccuracy = Math.max(
      0,
      Math.min(100000, Math.round(Number.isFinite(params.accuracy) ? params.accuracy : 0))
    );
    await setDoc(
      doc(db, KADER_LOCATIONS_COLLECTION, docId),
      {
        userId: docId,
        namaKader: String(params.namaKader || docId).trim().slice(0, 120),
        latitude: Number(params.latitude),
        longitude: Number(params.longitude),
        accuracy: clampedAccuracy,
        address: String(params.address || '').trim().slice(0, 300),
        gpsStatus: 'Aktif' as KaderGpsStatus,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Menulis status `gpsStatus: "Ditolak"` saat izin GPS ditolak (TANPA koordinat palsu).
 */
export async function markKaderGpsDenied(userId: string, namaKader: string): Promise<void> {
  const docId = sanitizeKaderDocId(userId);
  const path = `${KADER_LOCATIONS_COLLECTION}/${docId}`;
  try {
    await setDoc(
      doc(db, KADER_LOCATIONS_COLLECTION, docId),
      {
        userId: docId,
        namaKader: String(namaKader || docId).trim().slice(0, 120),
        gpsStatus: 'Ditolak' as KaderGpsStatus,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Menulis status `gpsStatus: "Tidak Aktif"` saat Kader Logout sebelum sesi ditutup.
 */
export async function markKaderGpsInactive(userId: string, namaKader: string): Promise<void> {
  const docId = sanitizeKaderDocId(userId);
  const path = `${KADER_LOCATIONS_COLLECTION}/${docId}`;
  try {
    await setDoc(
      doc(db, KADER_LOCATIONS_COLLECTION, docId),
      {
        userId: docId,
        namaKader: String(namaKader || docId).trim().slice(0, 120),
        gpsStatus: 'Tidak Aktif' as KaderGpsStatus,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Memulai pelacakan GPS real-time sisi Kader menggunakan `navigator.geolocation.watchPosition`
 * dengan throttle maks 1x per 30 detik atau saat berpindah > 20 meter.
 */
export function startKaderGpsTracking(params: {
  userId: string;
  namaKader: string;
  onStatusChange?: (status: KaderGpsStatus) => void;
}): () => void {
  const { userId, namaKader, onStatusChange } = params;

  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    markKaderGpsDenied(userId, namaKader).catch(() => {});
    onStatusChange?.('Ditolak');
    return () => {};
  }

  let stopped = false;
  let hasSentInitial = false;
  let lastSentAt = 0;
  let lastSentLat: number | null = null;
  let lastSentLng: number | null = null;
  let lastAddress = '';
  let isWriting = false;

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      if (stopped) return;

      const { latitude, longitude, accuracy } = position.coords;
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
      const elapsedMs = now - lastSentAt;
      const movedMeters =
        lastSentLat !== null && lastSentLng !== null
          ? calculateDistanceMeters(lastSentLat, lastSentLng, latitude, longitude)
          : Infinity;

      const shouldSend =
        !hasSentInitial ||
        elapsedMs >= GPS_THROTTLE_MS ||
        movedMeters > GPS_DISTANCE_THRESHOLD_METERS;

      if (!shouldSend || isWriting) return;

      isWriting = true;
      try {
        let resolvedAddress = lastAddress;
        if (!hasSentInitial || movedMeters > GPS_DISTANCE_THRESHOLD_METERS) {
          resolvedAddress = await tryReverseGeocode(latitude, longitude);
          if (resolvedAddress) {
            lastAddress = resolvedAddress;
          }
        }

        if (stopped) return;

        await upsertKaderLocation({
          userId,
          namaKader,
          latitude,
          longitude,
          accuracy,
          address: resolvedAddress,
        });

        hasSentInitial = true;
        lastSentAt = Date.now();
        lastSentLat = latitude;
        lastSentLng = longitude;
        onStatusChange?.('Aktif');
      } catch {
        // Error sudah dicatat secara terstruktur oleh handleFirestoreError
      } finally {
        isWriting = false;
      }
    },
    (geoError) => {
      if (stopped) return;
      if (geoError.code === geoError.PERMISSION_DENIED) {
        markKaderGpsDenied(userId, namaKader).catch(() => {});
        onStatusChange?.('Ditolak');
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 20_000,
    }
  );

  return () => {
    stopped = true;
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch {
      // Abaikan jika watch sudah dibersihkan
    }
  };
}

/**
 * Listener real-time sisi Admin (`onSnapshot`) pada collection `kader_locations`.
 * Pastikan memanggil fungsi unsubscribe yang dikembalikan saat keluar dari halaman.
 */
export function subscribeKaderLocations(
  onUpdate: (records: KaderLocationRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, KADER_LOCATIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      onUpdate(mapSnapshotToRecords(snapshot));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, KADER_LOCATIONS_COLLECTION);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/**
 * Pengambilan manual langsung dari server Firestore untuk tombol "Refresh Data".
 */
export async function fetchKaderLocationsOnce(): Promise<KaderLocationRecord[]> {
  const colRef = collection(db, KADER_LOCATIONS_COLLECTION);
  try {
    const snap = await getDocsFromServer(colRef);
    return mapSnapshotToRecords(snap);
  } catch {
    try {
      const snap = await getDocs(colRef);
      return mapSnapshotToRecords(snap);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, KADER_LOCATIONS_COLLECTION);
    }
  }
}

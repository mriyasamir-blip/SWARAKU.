import {
  collection,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QuerySnapshot,
  type DocumentData,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { handleFirestoreError, OperationType } from './swarakuFirestore';

export type UserRole =
  | 'SuperAdmin'
  | 'Super Admin'
  | 'Admin'
  | 'Korwil'
  | 'Korcam'
  | 'Relawan'
  | 'Tim Sukses'
  | 'Kader'
  | string;

export type TrackedRole = 'Korwil' | 'Korcam' | 'Relawan';
export type GpsStatus = 'Aktif' | 'Tidak Aktif' | 'Ditolak';

export interface LiveLocationRecord {
  userId: string;
  nama: string;
  role: TrackedRole;
  timSuksesId: string | null;
  namaTimSukses: string | null;
  korcamId?: string | null;
  namaKorcam?: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string;
  gpsStatus: GpsStatus;
  lastUpdated: Timestamp | string | number | null;
}

export const COLLECTION_NAME = 'live_locations';

export function sanitizeLocationDocId(rawId: string): string {
  const cleaned = String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  return cleaned || 'user_unknown';
}

function normalizeRoleKey(role?: string | null): string {
  return (role || '').toLowerCase().replace(/[\s_-]+/g, '');
}

/** SuperAdmin & Admin: akses penuh memantau Korwil, Korcam, & Relawan */
export function isFullMonitorRole(role?: string | null): boolean {
  const key = normalizeRoleKey(role);
  return key === 'superadmin' || key === 'admin';
}

/** Korwil (legacy: tim_sukses) */
export function isTimSuksesRole(role?: string | null): boolean {
  const key = normalizeRoleKey(role);
  return key === 'timsukses' || key === 'korwil';
}

export const isKorwilRole = isTimSuksesRole;

/** Korcam (legacy: kader) */
export function isKaderRole(role?: string | null): boolean {
  const key = normalizeRoleKey(role);
  return key === 'kader' || key === 'korcam';
}

export const isKorcamRole = isKaderRole;

/** Relawan */
export function isRelawanRole(role?: string | null): boolean {
  return normalizeRoleKey(role) === 'relawan';
}

/** Korwil, Korcam, & Relawan mengaktifkan pelacakan GPS saat login */
export function isTrackedRole(role?: string | null): boolean {
  return isTimSuksesRole(role) || isKaderRole(role) || isRelawanRole(role);
}

/** SuperAdmin, Admin, Korwil, & Korcam berhak membuka menu Monitoring Relawan */
export function canAccessMonitoring(role?: string | null): boolean {
  return isFullMonitorRole(role) || isTimSuksesRole(role) || isKaderRole(role);
}

export function toTrackedRoleLabel(role?: string | null): TrackedRole | null {
  if (isTimSuksesRole(role)) return 'Korwil';
  if (isKaderRole(role)) return 'Korcam';
  if (isRelawanRole(role)) return 'Relawan';
  return null;
}

function normalizeStoredTrackedRole(rawRole?: string | null): TrackedRole {
  const key = normalizeRoleKey(rawRole);
  if (key === 'timsukses' || key === 'korwil') return 'Korwil';
  if (key === 'kader' || key === 'korcam') return 'Korcam';
  return 'Relawan';
}

/** Hitung jarak antar dua koordinat dalam meter (Haversine) */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapSnapshot(snapshot: QuerySnapshot<DocumentData>): LiveLocationRecord[] {
  return snapshot.docs.map((d) => {
    const data = d.data();
    const hasCoords =
      typeof data.latitude === 'number' &&
      Number.isFinite(data.latitude) &&
      typeof data.longitude === 'number' &&
      Number.isFinite(data.longitude);

    return {
      userId: d.id,
      nama: data.nama || '-',
      role: normalizeStoredTrackedRole(data.role),
      timSuksesId: data.timSuksesId ?? null,
      namaTimSukses: data.namaTimSukses ?? null,
      korcamId: data.korcamId ?? null,
      namaKorcam: data.namaKorcam ?? null,
      latitude: hasCoords ? data.latitude : null,
      longitude: hasCoords ? data.longitude : null,
      accuracy: typeof data.accuracy === 'number' ? Math.round(data.accuracy) : null,
      address: typeof data.address === 'string' ? data.address : '',
      gpsStatus:
        data.gpsStatus === 'Aktif' ||
        data.gpsStatus === 'Tidak Aktif' ||
        data.gpsStatus === 'Ditolak'
          ? data.gpsStatus
          : 'Tidak Aktif',
      lastUpdated: data.lastUpdated ?? null,
    };
  });
}

/** Simpan atau perbarui posisi terakhir user (1 dokumen per userId) */
export async function saveLiveLocation(
  payload: Omit<LiveLocationRecord, 'lastUpdated'>
): Promise<void> {
  const safeUserId = sanitizeLocationDocId(payload.userId);
  const path = `${COLLECTION_NAME}/${safeUserId}`;
  const ref = doc(db, COLLECTION_NAME, safeUserId);
  try {
    const safeTimSuksesId = payload.timSuksesId
      ? sanitizeLocationDocId(payload.timSuksesId)
      : null;
    const safeKorcamId = payload.korcamId
      ? sanitizeLocationDocId(payload.korcamId)
      : null;
    await setDoc(
      ref,
      {
        userId: safeUserId,
        nama: String(payload.nama || safeUserId).trim().slice(0, 120),
        role: payload.role,
        timSuksesId: safeTimSuksesId,
        namaTimSukses: payload.namaTimSukses
          ? String(payload.namaTimSukses).trim().slice(0, 120)
          : null,
        korcamId: safeKorcamId,
        namaKorcam: payload.namaKorcam
          ? String(payload.namaKorcam).trim().slice(0, 120)
          : null,
        latitude:
          typeof payload.latitude === 'number' && Number.isFinite(payload.latitude)
            ? payload.latitude
            : null,
        longitude:
          typeof payload.longitude === 'number' && Number.isFinite(payload.longitude)
            ? payload.longitude
            : null,
        accuracy:
          typeof payload.accuracy === 'number' && Number.isFinite(payload.accuracy)
            ? Math.max(0, Math.min(100000, Math.round(payload.accuracy)))
            : null,
        address: String(payload.address || '').trim().slice(0, 300),
        gpsStatus: payload.gpsStatus,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/** Tandai user offline saat Logout */
export async function markLocationOffline(userId: string): Promise<void> {
  const safeUserId = sanitizeLocationDocId(userId);
  const ref = doc(db, COLLECTION_NAME, safeUserId);
  try {
    await updateDoc(ref, {
      gpsStatus: 'Tidak Aktif' as GpsStatus,
      lastUpdated: serverTimestamp(),
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'not-found') {
      console.error('Gagal memperbarui status offline:', err);
    }
  }
}

function buildRoleScopedQuery(viewerRole: UserRole, safeViewerId: string) {
  const colRef = collection(db, COLLECTION_NAME);
  if (isFullMonitorRole(viewerRole)) {
    return query(colRef);
  }
  if (isTimSuksesRole(viewerRole)) {
    // Korwil memantau seluruh Korcam dan Relawan di bawah koordinasinya
    return query(colRef, where('timSuksesId', '==', safeViewerId));
  }
  // Korcam memantau seluruh Relawan di bawah koordinasinya
  return query(colRef, where('korcamId', '==', safeViewerId));
}

/** Real-time listener sesuai hak akses role */
export function subscribeLocations(
  viewerRole: UserRole,
  viewerId: string,
  onData: (records: LiveLocationRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const safeViewerId = sanitizeLocationDocId(viewerId);
  const q = buildRoleScopedQuery(viewerRole, safeViewerId);

  return onSnapshot(
    q,
    (snapshot) => {
      const mapped = mapSnapshot(snapshot).filter((r) => r.userId !== safeViewerId);
      onData(isFullMonitorRole(viewerRole) ? mapSnapshot(snapshot) : mapped);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      } catch (wrapped) {
        if (onError) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    }
  );
}

/** Ambil ulang data lokasi langsung dari server Firestore saat klik Refresh Data */
export async function fetchLocationsOnce(
  viewerRole: UserRole,
  viewerId: string
): Promise<LiveLocationRecord[]> {
  const safeViewerId = sanitizeLocationDocId(viewerId);
  const q = buildRoleScopedQuery(viewerRole, safeViewerId);

  try {
    const snap = await getDocsFromServer(q);
    const mapped = mapSnapshot(snap);
    return isFullMonitorRole(viewerRole)
      ? mapped
      : mapped.filter((r) => r.userId !== safeViewerId);
  } catch {
    try {
      const snap = await getDocs(q);
      const mapped = mapSnapshot(snap);
      return isFullMonitorRole(viewerRole)
        ? mapped
        : mapped.filter((r) => r.userId !== safeViewerId);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
    }
  }
}

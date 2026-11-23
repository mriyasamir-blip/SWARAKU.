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

export interface MonitoringViewerContext {
  id: string;
  username?: string;
  nama: string;
  role: UserRole;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kaderIds?: string[];
  kaderList?: string[];
}

export interface MonitoringAccountInfo {
  id: string;
  username?: string;
  nama: string;
  role: UserRole;
  status?: 'Aktif' | 'Nonaktif';
  noHp?: string;
  wilayah?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  timSuksesId?: string;
  timSuksesNama?: string;
  didaftarkanOlehTimSukses?: string;
  korcamId?: string;
  korcamNama?: string;
}

export interface EnrichedLiveLocationRecord extends LiveLocationRecord {
  noHp?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  wilayah?: string;
  hasLoggedLocation: boolean;
}

function normText(v?: string | null): string {
  return (v || '').trim().toLowerCase();
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

/** Real-time listener seluruh dokumen live_locations (difilter presisi menggunakan resolveMonitoredLocations) */
export function subscribeAllLiveLocations(
  onData: (records: LiveLocationRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    query(colRef),
    (snapshot) => {
      onData(mapSnapshot(snapshot));
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

/** Fetch sekali langsung dari server Firestore untuk semua live_locations */
export async function fetchAllLiveLocationsOnce(): Promise<LiveLocationRecord[]> {
  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef);
  try {
    const snap = await getDocsFromServer(q);
    return mapSnapshot(snap);
  } catch {
    try {
      const snap = await getDocs(q);
      return mapSnapshot(snap);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
    }
  }
}

/**
 * Gabungkan data real-time `live_locations` dengan daftar akun `user_accounts`
 * sesuai kewenangan hierarki:
 * - SuperAdmin / Admin: Semua Korwil, Korcam, & Relawan
 * - Korwil: Seluruh Korcam & Relawan di bawah koordinasinya (langsung, via Korcam binaan, atau 1 Kota jika belum terikat Korwil lain)
 * - Korcam: Seluruh Relawan di bawah koordinasinya (langsung, atau 1 Kecamatan jika belum terikat Korcam lain)
 * Tanpa koordinat palsu — akun yang belum mengaktifkan GPS tampil dengan latitude/longitude null & status Tidak Aktif.
 */
export function resolveMonitoredLocations(
  viewer: MonitoringViewerContext,
  liveRecords: LiveLocationRecord[],
  userAccounts: MonitoringAccountInfo[] = []
): EnrichedLiveLocationRecord[] {
  const fullAccess = isFullMonitorRole(viewer.role);
  const korwilViewer = isTimSuksesRole(viewer.role);
  const korcamViewer = isKaderRole(viewer.role);

  const safeViewerId = sanitizeLocationDocId(viewer.id);
  const safeViewerUsername = viewer.username ? sanitizeLocationDocId(viewer.username) : '';
  const viewerNameNorm = normText(viewer.nama);
  const viewerKotaNorm = normText(viewer.kota);
  const viewerKecNorm = normText(viewer.kecamatan);
  const viewerKelNorm = normText(viewer.kelurahan);

  const viewerKaderIdSet = new Set(
    (viewer.kaderIds || []).map((id) => sanitizeLocationDocId(id))
  );
  const viewerKaderNameSet = new Set(
    (viewer.kaderList || []).map((n) => normText(n)).filter(Boolean)
  );

  // Map userAccounts by sanitized id
  const accountById = new Map<string, MonitoringAccountInfo>();
  userAccounts.forEach((acc) => {
    const sid = sanitizeLocationDocId(acc.id);
    accountById.set(sid, acc);
    if (acc.username) {
      const sun = sanitizeLocationDocId(acc.username);
      if (!accountById.has(sun)) accountById.set(sun, acc);
    }
  });

  // Identify Korcams belonging to this Korwil (for transitive Relawan matching)
  const myKorcamIds = new Set<string>();
  const myKorcamNames = new Set<string>();

  if (korwilViewer) {
    const checkKorcamBelongsToKorwil = (
      id: string,
      nama: string,
      timSuksesId?: string | null,
      namaTimSukses?: string | null,
      didaftarkanOleh?: string | null,
      kota?: string | null
    ): boolean => {
      const safeTs = timSuksesId ? sanitizeLocationDocId(timSuksesId) : '';
      if (safeTs && (safeTs === safeViewerId || (safeViewerUsername && safeTs === safeViewerUsername))) {
        return true;
      }
      if (viewerNameNorm && (normText(namaTimSukses) === viewerNameNorm || normText(didaftarkanOleh) === viewerNameNorm)) {
        return true;
      }
      if (viewerKaderIdSet.has(id) || (nama && viewerKaderNameSet.has(normText(nama)))) {
        return true;
      }
      // Fallback: Korcam unassigned in same Kota
      if (!safeTs && viewerKotaNorm && normText(kota) === viewerKotaNorm) {
        return true;
      }
      return false;
    };

    userAccounts.forEach((acc) => {
      if (!isKaderRole(acc.role)) return;
      const sid = sanitizeLocationDocId(acc.id);
      if (
        checkKorcamBelongsToKorwil(
          sid,
          acc.nama,
          acc.timSuksesId,
          acc.timSuksesNama,
          acc.didaftarkanOlehTimSukses,
          acc.kota
        )
      ) {
        myKorcamIds.add(sid);
        if (acc.nama) myKorcamNames.add(normText(acc.nama));
      }
    });

    liveRecords.forEach((rec) => {
      if (rec.role !== 'Korcam') return;
      const acc = accountById.get(rec.userId);
      if (
        checkKorcamBelongsToKorwil(
          rec.userId,
          rec.nama,
          rec.timSuksesId || acc?.timSuksesId,
          rec.namaTimSukses || acc?.timSuksesNama,
          acc?.didaftarkanOlehTimSukses,
          acc?.kota
        )
      ) {
        myKorcamIds.add(rec.userId);
        if (rec.nama) myKorcamNames.add(normText(rec.nama));
      }
    });
  }

  // Merge all tracked records from liveRecords + userAccounts
  const mergedMap = new Map<string, EnrichedLiveLocationRecord>();

  liveRecords.forEach((rec) => {
    const acc = accountById.get(rec.userId);
    const resolvedKorcamId = rec.korcamId || (acc?.korcamId ? sanitizeLocationDocId(acc.korcamId) : null);
    const resolvedKorcamAcc = resolvedKorcamId ? accountById.get(resolvedKorcamId) : undefined;
    const resolvedTimSuksesId =
      rec.timSuksesId ||
      (acc?.timSuksesId ? sanitizeLocationDocId(acc.timSuksesId) : null) ||
      (resolvedKorcamAcc?.timSuksesId ? sanitizeLocationDocId(resolvedKorcamAcc.timSuksesId) : null);

    mergedMap.set(rec.userId, {
      ...rec,
      nama: acc?.nama || rec.nama,
      role: acc ? toTrackedRoleLabel(acc.role) || rec.role : rec.role,
      timSuksesId: resolvedTimSuksesId,
      namaTimSukses:
        rec.namaTimSukses ||
        acc?.timSuksesNama ||
        acc?.didaftarkanOlehTimSukses ||
        resolvedKorcamAcc?.timSuksesNama ||
        null,
      korcamId: resolvedKorcamId,
      namaKorcam: rec.namaKorcam || acc?.korcamNama || resolvedKorcamAcc?.nama || null,
      noHp: acc?.noHp,
      kota: acc?.kota,
      kecamatan: acc?.kecamatan,
      kelurahan: acc?.kelurahan,
      wilayah: acc?.wilayah,
      hasLoggedLocation: true,
    });
  });

  // Also include tracked accounts from userAccounts that have NOT yet written a live_locations doc
  userAccounts.forEach((acc) => {
    if (acc.status === 'Nonaktif') return;
    const trackedRole = toTrackedRoleLabel(acc.role);
    if (!trackedRole) return;

    const sid = sanitizeLocationDocId(acc.id);
    if (mergedMap.has(sid)) return;

    const resolvedKorcamId = acc.korcamId ? sanitizeLocationDocId(acc.korcamId) : null;
    const resolvedKorcamAcc = resolvedKorcamId ? accountById.get(resolvedKorcamId) : undefined;
    const resolvedTimSuksesId =
      (acc.timSuksesId ? sanitizeLocationDocId(acc.timSuksesId) : null) ||
      (resolvedKorcamAcc?.timSuksesId ? sanitizeLocationDocId(resolvedKorcamAcc.timSuksesId) : null);

    mergedMap.set(sid, {
      userId: sid,
      nama: acc.nama,
      role: trackedRole,
      timSuksesId: resolvedTimSuksesId,
      namaTimSukses:
        acc.timSuksesNama ||
        acc.didaftarkanOlehTimSukses ||
        resolvedKorcamAcc?.timSuksesNama ||
        null,
      korcamId: resolvedKorcamId,
      namaKorcam: acc.korcamNama || resolvedKorcamAcc?.nama || null,
      latitude: null,
      longitude: null,
      accuracy: null,
      address: '',
      gpsStatus: 'Tidak Aktif',
      lastUpdated: null,
      noHp: acc.noHp,
      kota: acc.kota,
      kecamatan: acc.kecamatan,
      kelurahan: acc.kelurahan,
      wilayah: acc.wilayah,
      hasLoggedLocation: false,
    });
  });

  const allMerged = Array.from(mergedMap.values());

  if (fullAccess) {
    return allMerged;
  }

  return allMerged.filter((rec) => {
    // Never show self in subordinate monitoring list
    if (rec.userId === safeViewerId || (safeViewerUsername && rec.userId === safeViewerUsername)) {
      return false;
    }

    if (korwilViewer) {
      // Korwil memantau Korcam dan Relawan (bukan Korwil lain)
      if (rec.role !== 'Korcam' && rec.role !== 'Relawan') return false;

      if (rec.role === 'Korcam') {
        return myKorcamIds.has(rec.userId);
      }

      // Relawan di bawah Korwil: langsung ke Korwil, atau via salah satu Korcam binaan, atau 1 Kota tanpa Korwil lain
      const directKorwil =
        rec.timSuksesId === safeViewerId ||
        (Boolean(safeViewerUsername) && rec.timSuksesId === safeViewerUsername) ||
        (Boolean(viewerNameNorm) && normText(rec.namaTimSukses) === viewerNameNorm);

      const viaMyKorcam =
        (Boolean(rec.korcamId) && myKorcamIds.has(rec.korcamId as string)) ||
        (Boolean(rec.namaKorcam) && myKorcamNames.has(normText(rec.namaKorcam)));

      const sameKotaFallback =
        !rec.timSuksesId &&
        Boolean(viewerKotaNorm) &&
        normText(rec.kota) === viewerKotaNorm;

      return directKorwil || viaMyKorcam || sameKotaFallback;
    }

    if (korcamViewer) {
      // Korcam memantau Relawan saja
      if (rec.role !== 'Relawan') return false;

      const directKorcam =
        rec.korcamId === safeViewerId ||
        (Boolean(safeViewerUsername) && rec.korcamId === safeViewerUsername) ||
        (Boolean(viewerNameNorm) && normText(rec.namaKorcam) === viewerNameNorm);

      const sameKecFallback =
        !rec.korcamId &&
        Boolean(viewerKecNorm) &&
        normText(rec.kecamatan) === viewerKecNorm;

      const sameKelFallback =
        !rec.korcamId &&
        !viewerKecNorm &&
        Boolean(viewerKelNorm) &&
        normText(rec.kelurahan) === viewerKelNorm;

      return directKorcam || sameKecFallback || sameKelFallback;
    }

    return false;
  });
}

/** Real-time listener sesuai hak akses role (backward compatible) */
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

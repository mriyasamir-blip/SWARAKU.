// Centralized Real-Time Cloud Synchronization Service (Firebase Firestore + Google Maps Precision Geocoding)
// Memastikan 100% konsistensi data multi-perangkat (HP, Tablet, Desktop) secara real-time via onSnapshot.

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore, auth } from '../lib/firebase';
import {
  VoterOcrRecord,
  FormC1Upload,
  FormB1Upload,
  DptVoterRecord,
  UserAccount,
} from '../types/vore';
import type { VoterDoc } from '../types/swaraku';
import { TimSuksesWilayahRecord } from '../data/petaSuaraData';
import { PRESET_ACCOUNTS } from '../data/accountsData';
import {
  resolveAccurateCoordinates,
  lookupSmartCoordinates,
  resolveStableVoterCoordinates,
} from '../utils/geocoding';

export const CLOUD_COLLECTIONS = {
  VOTERS: 'voter_ocr_records',
  TIM_SUKSES: 'tim_sukses_members',
  C1_RECORDS: 'c1_records',
  B1_RECORDS: 'b1_records',
  USER_ACCOUNTS: 'user_accounts',
  SYNC_METADATA: 'sync_metadata',
} as const;

function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

export const LOCAL_CACHE_KEYS = {
  VOTERS: 'swaraku_voter_ocr_records',
  VOTERS_FALLBACK: 'swaraku_voter_records',
  TIM_SUKSES: 'swaraku_timsukses_list',
  C1: 'swaraku_c1_records',
  B1: 'swaraku_b1_records',
  DPT: 'swaraku_dpt_list',
  USER_ACCOUNTS: 'swaraku_user_accounts',
} as const;

// Track active listeners and sync status
export interface CloudSyncState {
  isConnected: boolean;
  lastSyncTimestamp: number;
  activeListenersCount: number;
  totalVotersInCloud: number;
  statusText: string;
}

let syncState: CloudSyncState = {
  isConnected: false,
  lastSyncTimestamp: Date.now(),
  activeListenersCount: 0,
  totalVotersInCloud: 0,
  statusText: 'Menghubungkan ke Cloud Database...',
};

const statusListeners = new Set<(state: CloudSyncState) => void>();

function updateSyncState(partial: Partial<CloudSyncState>) {
  syncState = { ...syncState, ...partial, lastSyncTimestamp: Date.now() };
  statusListeners.forEach((listener) => {
    try {
      listener(syncState);
    } catch {
      // ignore listener error
    }
  });
}

export function subscribeCloudSyncStatus(cb: (state: CloudSyncState) => void): () => void {
  cb(syncState);
  statusListeners.add(cb);
  return () => {
    statusListeners.delete(cb);
  };
}

export function getCloudSyncState(): CloudSyncState {
  return syncState;
}

// -------------------------------------------------------------
// 1. AUTO-HEALING & ACCURATE GEOCODING FOR VOTERS
// -------------------------------------------------------------
const healingInProgress = new Set<string>();

/**
 * Mendeteksi apakah koordinat voter perlu diperbaiki (belum ada, 0, atau fallback usang ke Jaksel padahal bukan Jaksel)
 */
export function isCoordinateErroneousOrMissing(voter: Partial<VoterOcrRecord>): boolean {
  if (typeof voter.lat !== 'number' || typeof voter.lng !== 'number') {
    return true;
  }
  if (voter.lat === 0 && voter.lng === 0) {
    return true;
  }

  const kotaStr = (voter.kabupatenKota || '').toLowerCase();
  const kecStr = (voter.kecamatan || '').toLowerCase();
  const kelStr = (voter.kelurahan || '').toLowerCase();

  // Deteksi kasus Penjaringan / Jakarta Utara yang salah jatuh ke Jakarta Selatan (-6.2615, 106.8106)
  const isStaleJakselDefault =
    Math.abs(voter.lat - -6.2615) < 0.0005 &&
    Math.abs(voter.lng - 106.8106) < 0.0005 &&
    !kotaStr.includes('selatan') &&
    !kecStr.includes('cilandak');

  if (isStaleJakselDefault) return true;

  // Kasus spesifik Penjaringan: jika bukan di rentang lat -6.10 s/d -6.15
  if ((kelStr.includes('penjaringan') || kecStr.includes('penjaringan')) && voter.lat < -6.20) {
    return true;
  }

  return false;
}

/**
 * Memperbaiki koordinat voter lama secara otomatis dan menyimpannya kembali ke Cloud Firestore
 */
export async function autoHealVoterCoordinates(voter: VoterOcrRecord): Promise<VoterOcrRecord> {
  const isOnlineRegistered =
    voter.diinputOlehRole === 'voter' ||
    voter.registrationSource === 'google_sso' ||
    voter.registrationSource === 'manual_signup';
  const cleanId = isOnlineRegistered
    ? voter.id
    : (voter.nik ? voter.nik.replace(/\D/g, '') : voter.id) || voter.id;
  if (!cleanId || healingInProgress.has(cleanId)) {
    return voter;
  }

  healingInProgress.add(cleanId);
  try {
    let finalKota = (voter.kabupatenKota || '').trim();
    if (!finalKota || finalKota === 'Kota Jakarta Selatan') {
      if ((voter.kecamatan || '').toLowerCase().includes('penjaringan')) {
        finalKota = 'Jakarta Utara';
      } else {
        finalKota = finalKota || 'DKI Jakarta';
      }
    }

    const geoResult = await resolveAccurateCoordinates({
      kelurahan: voter.kelurahan || '',
      kecamatan: voter.kecamatan || '',
      kota: finalKota,
      provinsi: voter.provinsi || 'DKI Jakarta',
    });

    const healedVoter: VoterOcrRecord = {
      ...voter,
      kabupatenKota: finalKota,
      lat: geoResult.lat,
      lng: geoResult.lng,
    };

    // Update Firestore silently
    const docRef = doc(firestore, CLOUD_COLLECTIONS.VOTERS, cleanId);
    await setDoc(
      docRef,
      {
        kabupatenKota: finalKota,
        lat: geoResult.lat,
        lng: geoResult.lng,
        geocodedVia: geoResult.resolvedVia,
        autoHealedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return healedVoter;
  } catch (err) {
    console.warn('[Auto-Heal] Gagal memperbaiki koordinat voter:', voter.nik, err);
    return voter;
  } finally {
    healingInProgress.delete(cleanId);
  }
}

export function loyaltyVoterToOcrRecord(
  voter: Pick<
    VoterDoc,
    'uid' | 'fullName' | 'address' | 'region' | 'phone' | 'referralCode' | 'authMethod' | 'createdAt'
  >
): VoterOcrRecord {
  const geo = resolveStableVoterCoordinates({
    uid: voter.uid,
    region: voter.region,
    address: voter.address,
  });

  const regCode =
    voter.referralCode || `SWR-${String(voter.uid || '').slice(0, 6).toUpperCase()}`;

  let waktuDaftar = '';
  const created = voter.createdAt as { toDate?: () => Date } | undefined;
  if (created && typeof created.toDate === 'function') {
    waktuDaftar = created.toDate().toLocaleString('id-ID');
  } else {
    waktuDaftar = new Date().toLocaleString('id-ID');
  }

  const isManual = voter.authMethod === 'manual' || voter.uid.startsWith('vreg_');

  return {
    id: voter.uid,
    voterUid: voter.uid,
    nik: regCode,
    nikMasked: regCode,
    nama: String(voter.fullName || 'PEMILIH').toUpperCase().trim(),
    tempatTglLahir: '-',
    jenisKelamin: '-',
    alamat: voter.address || '-',
    rtRw: '-',
    kelurahan: geo.kelurahan,
    kecamatan: geo.kecamatan,
    kabupatenKota: geo.kabupatenKota,
    provinsi: geo.provinsi,
    tps: 'Reg. Online',
    noHp: voter.phone || '-',
    waktuDaftar,
    statusDpt: 'DPT valid',
    statusRegistrasi: 'TERDAFTAR',
    terdaftarOleh: isManual ? 'Daftar Mandiri (Online)' : 'Google SSO (Online)',
    diinputOlehRole: 'voter',
    diinputOlehNama: voter.fullName,
    registrationSource: isManual ? 'manual_signup' : 'google_sso',
    lat: geo.lat,
    lng: geo.lng,
  };
}

export async function syncLoyaltyVoterToPetaSuara(
  voter: Pick<
    VoterDoc,
    'uid' | 'fullName' | 'address' | 'region' | 'phone' | 'referralCode' | 'authMethod' | 'createdAt'
  >
): Promise<VoterOcrRecord | null> {
  if (!voter?.uid || !voter?.fullName) return null;

  const record = loyaltyVoterToOcrRecord(voter);
  try {
    const docRef = doc(firestore, CLOUD_COLLECTIONS.VOTERS, voter.uid);
    await setDoc(
      docRef,
      cleanForFirestore({
        ...record,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('[CloudSync] Sinkron voter portal ke Peta Suara gagal:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const currentCache = JSON.parse(
        localStorage.getItem(LOCAL_CACHE_KEYS.VOTERS) || '[]'
      ) as VoterOcrRecord[];
      const updatedCache = [
        record,
        ...currentCache.filter((v) => v.id !== record.id && v.voterUid !== voter.uid),
      ];
      localStorage.setItem(LOCAL_CACHE_KEYS.VOTERS, JSON.stringify(updatedCache));
    } catch {
      // ignore localStorage errors
    }
  }

  return record;
}

// -------------------------------------------------------------
// 2. REAL-TIME MULTI-DEVICE LISTENER: VOTERS
// -------------------------------------------------------------
const legacyMigratingNiks = new Set<string>();

function mapDocToVoterOcrRecord(
  docId: string,
  d: Record<string, any>
): { cleanNik: string; record: VoterOcrRecord; sortTime: number } {
  const rawNik = String(d.nik || docId || '').trim();
  const isOnlineRegistered =
    Boolean(d.voterUid) ||
    d.diinputOlehRole === 'voter' ||
    d.registrationSource === 'google_sso' ||
    d.registrationSource === 'manual_signup' ||
    docId.startsWith('vreg_') ||
    !/^\d{8,}$/.test(rawNik);

  const cleanNik = isOnlineRegistered ? docId : rawNik.replace(/\D/g, '') || docId;
  const masked =
    d.nikMasked ||
    (!isOnlineRegistered && cleanNik.length >= 8
      ? `${cleanNik.slice(0, 4)}••••••••${cleanNik.slice(-4)}`
      : rawNik);

  const parsedFallback =
    d.dapilLabel || d.region
      ? resolveStableVoterCoordinates({
          uid: docId,
          region: String(d.dapilLabel || d.region || ''),
          address: String(d.alamat || d.address || ''),
        })
      : null;

  const ttlRaw = String(d.tempatTglLahir || '').trim();
  let parsedTempat = String(d.tempatLahir || '').trim();
  let parsedTanggal = String(d.tanggalLahir || '').trim();
  if ((!parsedTempat || !parsedTanggal) && ttlRaw && ttlRaw !== '-' && ttlRaw.includes(',')) {
    const [t, dt] = ttlRaw.split(',').map((s: string) => s.trim());
    if (!parsedTempat && t) parsedTempat = t;
    if (!parsedTanggal && dt) parsedTanggal = dt;
  }

  const inferredOcrVerified =
    d.ocrVerified === true ||
    d.registrationSource === 'ocr_ktp' ||
    (!isOnlineRegistered &&
      /^\d{16}$/.test(cleanNik) &&
      (Boolean(d.fotoKtpUrl) || (Boolean(ttlRaw) && ttlRaw !== '-') || (Boolean(d.rtRw) && d.rtRw !== '-')));

  const record: VoterOcrRecord = {
    id: d.id || docId,
    voterUid: d.voterUid || undefined,
    nik: rawNik,
    nikMasked: masked,
    nama: String(d.nama || d.fullName || 'VOTER TANPA NAMA').toUpperCase().trim(),
    tempatLahir: parsedTempat || undefined,
    tanggalLahir: parsedTanggal || undefined,
    tempatTglLahir:
      ttlRaw && ttlRaw !== '-'
        ? ttlRaw
        : parsedTempat && parsedTanggal
        ? `${parsedTempat}, ${parsedTanggal}`
        : parsedTempat || parsedTanggal || '-',
    jenisKelamin:
      d.jenisKelamin === 'Perempuan'
        ? 'Perempuan'
        : d.jenisKelamin === '-'
        ? '-'
        : 'Laki-laki',
    alamat: d.alamat || d.address || '-',
    rtRw: d.rtRw || (isOnlineRegistered ? '-' : '001/001'),
    kelurahan: d.kelurahan || parsedFallback?.kelurahan || '',
    kecamatan: d.kecamatan || parsedFallback?.kecamatan || '',
    kabupatenKota: d.kabupatenKota || parsedFallback?.kabupatenKota || '',
    provinsi: d.provinsi || parsedFallback?.provinsi || '',
    tps: d.tps || (isOnlineRegistered ? 'Reg. Online' : 'TPS 001'),
    noHp: d.noHp || d.phone || '-',
    waktuDaftar: d.waktuDaftar || new Date().toLocaleString('id-ID'),
    fotoKtpUrl: d.fotoKtpUrl || undefined,
    ocrVerified: inferredOcrVerified,
    statusDpt: d.statusDpt === 'Perlu cek' ? 'Perlu cek' : 'DPT valid',
    statusRegistrasi: 'TERDAFTAR',
    terdaftarOleh: d.terdaftarOleh || 'Database Cloud',
    diinputOlehRole: d.diinputOlehRole,
    diinputOlehNama: d.diinputOlehNama,
    createdById: d.createdById || undefined,
    korcamId: d.korcamId || undefined,
    korwilId: d.korwilId || undefined,
    registrationSource: d.registrationSource || (inferredOcrVerified ? 'ocr_ktp' : undefined),
    lat: typeof d.lat === 'number' ? d.lat : parsedFallback?.lat,
    lng: typeof d.lng === 'number' ? d.lng : parsedFallback?.lng,
  };

  const sortTime =
    (d.updatedAt ? new Date(String(d.updatedAt)).getTime() : 0) ||
    new Date(record.waktuDaftar).getTime() ||
    0;

  return { cleanNik, record, sortTime };
}

export function subscribeToCloudVoters(
  onUpdate: (voters: VoterOcrRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  updateSyncState({
    activeListenersCount: syncState.activeListenersCount + 1,
    statusText: 'Mendengarkan perubahan Real-Time Cloud Voters...',
  });

  const primaryCollectionRef = collection(firestore, CLOUD_COLLECTIONS.VOTERS);
  const legacyVotersQuery = query(
    collection(firestore, 'voters'),
    where('statusRegistrasi', '==', 'TERDAFTAR')
  );

  const primaryMap = new Map<string, { record: VoterOcrRecord; sortTime: number }>();
  const legacyMap = new Map<string, { record: VoterOcrRecord; sortTime: number }>();
  let primaryLoaded = false;
  let legacyLoaded = false;

  const emitMerged = () => {
    const mergedMap = new Map<string, { record: VoterOcrRecord; sortTime: number }>();

    // Masukkan data historis dari koleksi 'voters' terlebih dahulu
    legacyMap.forEach((val, key) => {
      mergedMap.set(key, val);
    });

    // Prioritaskan data terbaru dari koleksi 'voter_ocr_records'
    primaryMap.forEach((val, key) => {
      mergedMap.set(key, val);
    });

    const entries = Array.from(mergedMap.values());
    entries.sort((a, b) => b.sortTime - a.sortTime);

    const voters = entries.map((e) => e.record);
    const needsHealingList = voters.filter((v) => isCoordinateErroneousOrMissing(v));

    // Sinkronkan diam-diam data legacy ke koleksi primary agar semua perangkat konsisten
    if (primaryLoaded && legacyLoaded) {
      legacyMap.forEach((val, key) => {
        if (!primaryMap.has(key) && !legacyMigratingNiks.has(key)) {
          legacyMigratingNiks.add(key);
          setDoc(
            doc(firestore, CLOUD_COLLECTIONS.VOTERS, key),
            cleanForFirestore({
              ...val.record,
              migratedFromLegacy: true,
              updatedAt: new Date().toISOString(),
            }),
            { merge: true }
          )
            .catch(() => {
              legacyMigratingNiks.delete(key);
            });
        }
      });
    }

    updateSyncState({
      isConnected: true,
      totalVotersInCloud: voters.length,
      statusText: `🟢 Cloud Real-Time Tersinkron (${voters.length} Voter)`,
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_CACHE_KEYS.VOTERS, JSON.stringify(voters));
      } catch (e) {
        console.warn('[Cache] LocalStorage cache notice:', e);
      }
    }

    onUpdate(voters);

    if (needsHealingList.length > 0) {
      needsHealingList.slice(0, 5).forEach((v) => {
        autoHealVoterCoordinates(v);
      });
    }
  };

  const unsubscribePrimary = onSnapshot(
    primaryCollectionRef,
    (snapshot) => {
      primaryMap.clear();
      snapshot.forEach((docSnap) => {
        const mapped = mapDocToVoterOcrRecord(docSnap.id, docSnap.data());
        if (mapped.cleanNik) {
          primaryMap.set(mapped.cleanNik, {
            record: mapped.record,
            sortTime: mapped.sortTime,
          });
        }
      });
      primaryLoaded = true;
      emitMerged();
    },
    (error) => {
      console.warn('[CloudSync] Firestore voter_ocr_records snapshot notice:', error);
      if (!legacyLoaded) {
        updateSyncState({
          isConnected: false,
          statusText: '⚠️ Offline / Cloud Sync Tertunda (Menggunakan Cache)',
        });
        if (onError) onError(error);
      }
    }
  );

  const unsubscribeLegacy = onSnapshot(
    legacyVotersQuery,
    (snapshot) => {
      legacyMap.clear();
      snapshot.forEach((docSnap) => {
        const mapped = mapDocToVoterOcrRecord(docSnap.id, docSnap.data());
        if (mapped.cleanNik) {
          legacyMap.set(mapped.cleanNik, {
            record: mapped.record,
            sortTime: mapped.sortTime,
          });
        }
      });
      legacyLoaded = true;
      emitMerged();
    },
    (error) => {
      console.warn('[CloudSync] Firestore legacy voters snapshot notice:', error);
    }
  );

  return () => {
    updateSyncState({
      activeListenersCount: Math.max(0, syncState.activeListenersCount - 1),
    });
    unsubscribePrimary();
    unsubscribeLegacy();
  };
}

// -------------------------------------------------------------
// 3. REAL-TIME MULTI-DEVICE LISTENER: TIM SUKSES
// -------------------------------------------------------------
export function subscribeToCloudTimSukses(
  onUpdate: (timSuksesList: TimSuksesWilayahRecord[]) => void
): Unsubscribe {
  const tsCollectionRef = collection(firestore, CLOUD_COLLECTIONS.TIM_SUKSES);

  return onSnapshot(
    tsCollectionRef,
    (snapshot) => {
      const list: TimSuksesWilayahRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id || docSnap.id,
          nama: d.nama || '',
          noHp: d.noHp || '',
          kota: d.kota || '',
          kecamatanList: Array.isArray(d.kecamatanList) ? d.kecamatanList : [],
          kelurahanList: Array.isArray(d.kelurahanList) ? d.kelurahanList : [],
          lat: typeof d.lat === 'number' ? d.lat : -6.1264,
          lng: typeof d.lng === 'number' ? d.lng : 106.7885,
          alamat: d.alamat || '',
          jabatan: d.jabatan || 'Koordinator Tim Sukses',
          waktuDaftar: d.waktuDaftar || '',
          status: d.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
        });
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_CACHE_KEYS.TIM_SUKSES, JSON.stringify(list));
        } catch (e) {
          // ignore
        }
      }

      onUpdate(list);
    },
    (err) => {
      console.warn('[CloudSync] Tim Sukses listener notice:', err);
    }
  );
}

// -------------------------------------------------------------
// 4. REAL-TIME MULTI-DEVICE LISTENER: FORM C1 & B1
// -------------------------------------------------------------
export function subscribeToCloudC1(
  onUpdate: (c1Records: FormC1Upload[]) => void
): Unsubscribe {
  const c1Ref = collection(firestore, CLOUD_COLLECTIONS.C1_RECORDS);

  return onSnapshot(
    c1Ref,
    (snapshot) => {
      const list: FormC1Upload[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id || docSnap.id,
          tps: d.tps || '',
          kelurahan: d.kelurahan || '',
          kecamatan: d.kecamatan || '',
          waktuUpload: d.waktuUpload || '',
          saksiNama: d.saksiNama || '',
          suaraPaslon1: Number(d.suaraPaslon1) || 0,
          suaraPaslon2: Number(d.suaraPaslon2) || 0,
          suaraPaslon3: Number(d.suaraPaslon3) || 0,
          suaraTidakSah: Number(d.suaraTidakSah) || 0,
          totalSuaraSah: Number(d.totalSuaraSah) || 0,
          statusVerifikasi: d.statusVerifikasi || 'Terverifikasi',
          fotoC1Url: d.fotoC1Url,
          fileName: d.fileName,
        });
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_CACHE_KEYS.C1, JSON.stringify(list));
        } catch {
          // ignore
        }
      }

      onUpdate(list);
    },
    (err) => console.warn('[CloudSync] C1 listener notice:', err)
  );
}

export function subscribeToCloudB1(
  onUpdate: (b1Records: FormB1Upload[]) => void
): Unsubscribe {
  const b1Ref = collection(firestore, CLOUD_COLLECTIONS.B1_RECORDS);

  return onSnapshot(
    b1Ref,
    (snapshot) => {
      const list: FormB1Upload[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id || docSnap.id,
          kecamatan: d.kecamatan || '',
          kelurahan: d.kelurahan || '',
          dapil: d.dapil || d.kelurahan || '',
          waktuUpload: d.waktuUpload || '',
          koordinatorNama: d.koordinatorNama || '',
          suaraPaslon1: Number(d.suaraPaslon1) || 0,
          suaraPaslon2: Number(d.suaraPaslon2) || 0,
          suaraPaslon3: Number(d.suaraPaslon3) || 0,
          suaraTidakSah: Number(d.suaraTidakSah) || 0,
          totalSuaraSah: Number(d.totalSuaraSah) || 0,
          totalTpsTercakup: Number(d.totalTpsTercakup) || 0,
          statusVerifikasi: d.statusVerifikasi || 'Terverifikasi',
          fotoB1Url: d.fotoB1Url,
          fileName: d.fileName,
        });
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_CACHE_KEYS.B1, JSON.stringify(list));
        } catch {
          // ignore
        }
      }

      onUpdate(list);
    },
    (err) => console.warn('[CloudSync] B1 listener notice:', err)
  );
}

// -------------------------------------------------------------
// 4b. MULTI-DEVICE USER ACCOUNTS SYNC (SUPER ADMIN ACCOUNTS POOL)
// -------------------------------------------------------------
export function subscribeToCloudUserAccounts(
  onUpdate: (accounts: UserAccount[]) => void
): Unsubscribe {
  const usersRef = collection(firestore, CLOUD_COLLECTIONS.USER_ACCOUNTS);

  return onSnapshot(
    usersRef,
    (snapshot) => {
      const list: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id || docSnap.id,
          role: d.role || 'kader',
          nama: d.nama || '',
          username: d.username || '',
          email: d.email || `${d.username || 'user'}@swaraku.com`,
          nik: d.nik || undefined,
          jabatan: d.jabatan || '',
          wilayah: d.wilayah || '',
          provinsi: d.provinsi || undefined,
          kota: d.kota || undefined,
          kecamatan: d.kecamatan || undefined,
          kelurahan: d.kelurahan || undefined,
          points: typeof d.points === 'number' ? d.points : undefined,
          idPegawai: d.idPegawai || undefined,
          divisi: d.divisi || undefined,
          tps: d.tps || undefined,
          noHp: d.noHp || '',
          fotoUrl: d.fotoUrl || '',
          password: d.password || '123456',
          status: (d.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif') as 'Aktif' | 'Nonaktif',
          dibuatPada: d.dibuatPada || '',
          updatedAt: d.updatedAt || undefined,
          timSuksesId: d.timSuksesId || undefined,
          timSuksesNama: d.timSuksesNama || undefined,
          didaftarkanOlehTimSukses: d.didaftarkanOlehTimSukses || undefined,
          korcamId: d.korcamId || undefined,
          korcamNama: d.korcamNama || undefined,
          kaderList: Array.isArray(d.kaderList) ? d.kaderList : undefined,
          kaderIds: Array.isArray(d.kaderIds) ? d.kaderIds : undefined,
          latitude: typeof d.latitude === 'number' ? d.latitude : null,
          longitude: typeof d.longitude === 'number' ? d.longitude : null,
          accuracy: typeof d.accuracy === 'number' ? d.accuracy : null,
          lastLocationUpdate: d.lastLocationUpdate ?? undefined,
          gpsState:
            d.gpsState === 'online' || d.gpsState === 'background' || d.gpsState === 'offline'
              ? d.gpsState
              : undefined,
        });
      });

      // Notify state listeners directly from cloud
      onUpdate(list);
    },
    (err) => console.warn('[CloudSync] User Accounts listener notice:', err)
  );
}

/**
 * Validasi login user langsung ke Cloud Firestore lintas perangkat / browser
 */
export async function authenticateCloudUser(
  usernameOrEmail: string,
  plainPassword: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = plainPassword.trim();

    // 1. Ambil dokumen langsung dari Cloud Firestore (source of truth)
    const snapshot = await getDocs(collection(firestore, CLOUD_COLLECTIONS.USER_ACCOUNTS));
    const cloudUsers: UserAccount[] = [];

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      cloudUsers.push({
        id: d.id || docSnap.id,
        role: d.role || 'kader',
        nama: d.nama || '',
        username: d.username || '',
        email: d.email || `${d.username || 'user'}@swaraku.com`,
        nik: d.nik || undefined,
        jabatan: d.jabatan || '',
        wilayah: d.wilayah || '',
        provinsi: d.provinsi || undefined,
        kota: d.kota || undefined,
        kecamatan: d.kecamatan || undefined,
        kelurahan: d.kelurahan || undefined,
        points: typeof d.points === 'number' ? d.points : undefined,
        idPegawai: d.idPegawai || undefined,
        divisi: d.divisi || undefined,
        tps: d.tps || undefined,
        noHp: d.noHp || '',
        fotoUrl: d.fotoUrl || '',
        password: d.password || '123456',
        status: (d.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif') as 'Aktif' | 'Nonaktif',
        dibuatPada: d.dibuatPada || '',
        updatedAt: d.updatedAt || undefined,
        timSuksesId: d.timSuksesId || undefined,
        timSuksesNama: d.timSuksesNama || undefined,
        didaftarkanOlehTimSukses: d.didaftarkanOlehTimSukses || undefined,
        korcamId: d.korcamId || undefined,
        korcamNama: d.korcamNama || undefined,
        kaderList: Array.isArray(d.kaderList) ? d.kaderList : undefined,
        kaderIds: Array.isArray(d.kaderIds) ? d.kaderIds : undefined,
        latitude: typeof d.latitude === 'number' ? d.latitude : null,
        longitude: typeof d.longitude === 'number' ? d.longitude : null,
        accuracy: typeof d.accuracy === 'number' ? d.accuracy : null,
        lastLocationUpdate: d.lastLocationUpdate ?? undefined,
        gpsState:
          d.gpsState === 'online' || d.gpsState === 'background' || d.gpsState === 'offline'
            ? d.gpsState
            : undefined,
      });
    });

    // 2. Cari kecocokan username atau email
    const matched = cloudUsers.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanInput) ||
        (u.email && u.email.toLowerCase() === cleanInput)
    );

    if (!matched) {
      return {
        success: false,
        error: 'Akun tidak terdaftar di server cloud. Hubungi Super Admin.',
      };
    }

    if (matched.status === 'Nonaktif') {
      return {
        success: false,
        error: 'Akun Anda dinonaktifkan oleh Super Admin. Hubungi administrator.',
      };
    }

    const expectedPass = matched.password || '123456';
    if (cleanPass !== expectedPass) {
      return {
        success: false,
        error: 'Password salah! Pastikan password sesuai yang didaftarkan Super Admin.',
      };
    }

    return {
      success: true,
      user: matched,
    };
  } catch (err: any) {
    console.warn('[CloudAuth] Cloud check notice, fallback to local pool:', err);
    return {
      success: false,
      error: 'Terjadi kendala saat memvalidasi ke server. Periksa koneksi internet.',
    };
  }
}

// -------------------------------------------------------------
// 5. WRITE ACTIONS: SAVE RECORD DIRECTLY TO CLOUD FIRESTORE
// -------------------------------------------------------------
export async function saveVoterToCloud(
  voter: VoterOcrRecord,
  dptRecord?: DptVoterRecord
): Promise<void> {
  const isOnlineRegistered =
    Boolean(voter.voterUid) ||
    voter.diinputOlehRole === 'voter' ||
    voter.registrationSource === 'google_sso' ||
    voter.registrationSource === 'manual_signup';
  const targetDocId = isOnlineRegistered
    ? voter.id
    : (voter.nik ? voter.nik.replace(/\D/g, '') : voter.id) || voter.id;

  // Pastikan koordinat akurat sebelum dikirim ke Cloud
  let lat = voter.lat;
  let lng = voter.lng;

  if (isCoordinateErroneousOrMissing(voter)) {
    try {
      const geoResult = await resolveAccurateCoordinates({
        kelurahan: voter.kelurahan,
        kecamatan: voter.kecamatan,
        kota: voter.kabupatenKota,
        provinsi: voter.provinsi,
      });
      lat = geoResult.lat;
      lng = geoResult.lng;
    } catch {
      const smart = lookupSmartCoordinates(voter.kelurahan, voter.kecamatan, voter.kabupatenKota);
      if (smart) {
        lat = smart.lat;
        lng = smart.lng;
      }
    }
  }

  const payload: VoterOcrRecord = {
    ...voter,
    lat,
    lng,
  };

  // 1. Simpan ke Firestore Centralized
  try {
    const docRef = doc(firestore, CLOUD_COLLECTIONS.VOTERS, targetDocId);
    await setDoc(
      docRef,
      cleanForFirestore({
        ...payload,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (firestoreErr) {
    console.warn('[CloudSync] Firestore voter save notice:', firestoreErr);
  }

  // 2. Simpan ke Cache Lokal (Fallback Offline)
  if (typeof window !== 'undefined') {
    try {
      const currentCache = JSON.parse(
        localStorage.getItem(LOCAL_CACHE_KEYS.VOTERS) || '[]'
      ) as VoterOcrRecord[];
      const updatedCache = [payload, ...currentCache.filter((v) => v.nik !== payload.nik)];
      localStorage.setItem(LOCAL_CACHE_KEYS.VOTERS, JSON.stringify(updatedCache));

      if (dptRecord) {
        const currentDpts = JSON.parse(
          localStorage.getItem(LOCAL_CACHE_KEYS.DPT) || '[]'
        ) as DptVoterRecord[];
        const updatedDpts = [dptRecord, ...currentDpts.filter((d) => d.nik !== dptRecord.nik)];
        localStorage.setItem(LOCAL_CACHE_KEYS.DPT, JSON.stringify(updatedDpts));
      }
    } catch (e) {
      console.warn('[Cache] Write notice:', e);
    }
  }
}

export async function saveTimSuksesToCloud(ts: TimSuksesWilayahRecord): Promise<void> {
  try {
    const docRef = doc(firestore, CLOUD_COLLECTIONS.TIM_SUKSES, ts.id);
    await setDoc(
      docRef,
      cleanForFirestore({
        ...ts,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (e) {
    console.warn('[CloudSync] Firestore tim sukses notice:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      const current = JSON.parse(
        localStorage.getItem(LOCAL_CACHE_KEYS.TIM_SUKSES) || '[]'
      ) as TimSuksesWilayahRecord[];
      const updated = [ts, ...current.filter((item) => item.id !== ts.id)];
      localStorage.setItem(LOCAL_CACHE_KEYS.TIM_SUKSES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

export async function saveC1ToCloud(c1: FormC1Upload): Promise<void> {
  try {
    const docRef = doc(firestore, CLOUD_COLLECTIONS.C1_RECORDS, c1.id);
    await setDoc(
      docRef,
      cleanForFirestore({
        ...c1,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (e) {
    console.warn('[CloudSync] C1 cloud save notice:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      const current = JSON.parse(
        localStorage.getItem(LOCAL_CACHE_KEYS.C1) || '[]'
      ) as FormC1Upload[];
      const updated = [c1, ...current.filter((i) => i.id !== c1.id)];
      localStorage.setItem(LOCAL_CACHE_KEYS.C1, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

export async function saveB1ToCloud(b1: FormB1Upload): Promise<void> {
  try {
    const docRef = doc(firestore, CLOUD_COLLECTIONS.B1_RECORDS, b1.id);
    await setDoc(
      docRef,
      cleanForFirestore({
        ...b1,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (e) {
    console.warn('[CloudSync] B1 cloud save notice:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      const current = JSON.parse(
        localStorage.getItem(LOCAL_CACHE_KEYS.B1) || '[]'
      ) as FormB1Upload[];
      const updated = [b1, ...current.filter((i) => i.id !== b1.id)];
      localStorage.setItem(LOCAL_CACHE_KEYS.B1, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

export async function saveUserAccountToCloud(user: UserAccount): Promise<void> {
  try {
    const docRef = doc(firestore, CLOUD_COLLECTIONS.USER_ACCOUNTS, user.id);
    await setDoc(
      docRef,
      {
        ...user,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[CloudSync] User account save notice:', e);
  }
}

export async function deleteUserAccountFromCloud(userId: string): Promise<void> {
  try {
    const docRef = doc(firestore, CLOUD_COLLECTIONS.USER_ACCOUNTS, userId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[CloudSync] User account delete notice:', e);
  }
}

// -------------------------------------------------------------
// 6. AUTO-MIGRATION: MERGE SEMUA DATA LOCALSTORAGE KE CLOUD
// -------------------------------------------------------------
export async function migrateLocalDataToCloud(): Promise<{
  votersMigrated: number;
  timSuksesMigrated: number;
  c1Migrated: number;
  b1Migrated: number;
}> {
  let votersMigrated = 0;
  let timSuksesMigrated = 0;
  let c1Migrated = 0;
  let b1Migrated = 0;

  if (typeof window === 'undefined') {
    return { votersMigrated, timSuksesMigrated, c1Migrated, b1Migrated };
  }

  try {
    // 1. Ambil data eksisting dari Cloud Firestore (voter_ocr_records + legacy voters) untuk deduplikasi
    const cloudVotersSnapshot = await getDocs(collection(firestore, CLOUD_COLLECTIONS.VOTERS));
    const cloudNikSet = new Set<string>();
    cloudVotersSnapshot.forEach((docSnap) => {
      const d = docSnap.data();
      cloudNikSet.add(docSnap.id);
      const nik = String(d.nik || docSnap.id).replace(/\D/g, '');
      if (nik) cloudNikSet.add(nik);
      if (d.voterUid) cloudNikSet.add(String(d.voterUid));
    });

    // Jika Superadmin Google SSO aktif, sinkronkan semua Voter terdaftar dari koleksi 'voters' ke Peta Suara
    const currentEmail = (auth.currentUser?.email || '').toLowerCase();
    if (
      currentEmail === 'm.riyasamir@gmail.com' ||
      currentEmail === 'admin@swaraku.online'
    ) {
      try {
        const allLoyaltyVotersSnap = await getDocs(collection(firestore, 'voters'));
        for (const docSnap of allLoyaltyVotersSnap.docs) {
          const vData = docSnap.data() as VoterDoc;
          if (vData?.uid && vData?.fullName && !cloudNikSet.has(vData.uid)) {
            await syncLoyaltyVoterToPetaSuara(vData);
            cloudNikSet.add(vData.uid);
            votersMigrated++;
          }
        }
      } catch (allVotersErr) {
        console.warn('[CloudSync] Loyalty voters Peta Suara sync notice:', allVotersErr);
      }
    }

    // Ambil juga data legacy OCR voters di koleksi 'voters' agar tersinkron ke 'voter_ocr_records'
    try {
      const legacySnapshot = await getDocs(
        query(collection(firestore, 'voters'), where('statusRegistrasi', '==', 'TERDAFTAR'))
      );
      for (const docSnap of legacySnapshot.docs) {
        const mapped = mapDocToVoterOcrRecord(docSnap.id, docSnap.data());
        if (mapped.cleanNik && !cloudNikSet.has(mapped.cleanNik)) {
          await saveVoterToCloud(mapped.record);
          cloudNikSet.add(mapped.cleanNik);
          votersMigrated++;
        }
      }
    } catch (legacyErr) {
      console.warn('[CloudSync] Legacy voters migration notice:', legacyErr);
    }

    // 2. Baca local cache
    const rawLocalVoters = [
      ...(JSON.parse(localStorage.getItem(LOCAL_CACHE_KEYS.VOTERS) || '[]') as VoterOcrRecord[]),
      ...(JSON.parse(localStorage.getItem(LOCAL_CACHE_KEYS.VOTERS_FALLBACK) || '[]') as VoterOcrRecord[]),
    ];

    // Deduplikasi voter lokal
    const uniqueLocalVoters = new Map<string, VoterOcrRecord>();
    rawLocalVoters.forEach((v) => {
      const cleanNik = (v.nik || v.id).replace(/\D/g, '');
      if (cleanNik && !uniqueLocalVoters.has(cleanNik)) {
        uniqueLocalVoters.set(cleanNik, v);
      }
    });

    // Upload voter yang belum ada di cloud atau perlu update koordinat
    for (const [nik, v] of uniqueLocalVoters.entries()) {
      if (!cloudNikSet.has(nik) || isCoordinateErroneousOrMissing(v)) {
        await saveVoterToCloud(v);
        votersMigrated++;
      }
    }

    // 3. Migrasi Tim Sukses
    const rawLocalTs = JSON.parse(
      localStorage.getItem(LOCAL_CACHE_KEYS.TIM_SUKSES) || '[]'
    ) as TimSuksesWilayahRecord[];
    const cloudTsSnapshot = await getDocs(collection(firestore, CLOUD_COLLECTIONS.TIM_SUKSES));
    const cloudTsIdSet = new Set<string>();
    cloudTsSnapshot.forEach((d) => cloudTsIdSet.add(d.id));

    for (const ts of rawLocalTs) {
      if (!cloudTsIdSet.has(ts.id)) {
        await saveTimSuksesToCloud(ts);
        timSuksesMigrated++;
      }
    }

    // 4. Migrasi C1
    const rawLocalC1 = JSON.parse(
      localStorage.getItem(LOCAL_CACHE_KEYS.C1) || '[]'
    ) as FormC1Upload[];
    const cloudC1Snapshot = await getDocs(collection(firestore, CLOUD_COLLECTIONS.C1_RECORDS));
    const cloudC1IdSet = new Set<string>();
    cloudC1Snapshot.forEach((d) => cloudC1IdSet.add(d.id));

    for (const c1 of rawLocalC1) {
      if (!cloudC1IdSet.has(c1.id)) {
        await saveC1ToCloud(c1);
        c1Migrated++;
      }
    }

    // 5. Migrasi B1
    const rawLocalB1 = JSON.parse(
      localStorage.getItem(LOCAL_CACHE_KEYS.B1) || '[]'
    ) as FormB1Upload[];
    const cloudB1Snapshot = await getDocs(collection(firestore, CLOUD_COLLECTIONS.B1_RECORDS));
    const cloudB1IdSet = new Set<string>();
    cloudB1Snapshot.forEach((d) => cloudB1IdSet.add(d.id));

    for (const b1 of rawLocalB1) {
      if (!cloudB1IdSet.has(b1.id)) {
        await saveB1ToCloud(b1);
        b1Migrated++;
      }
    }

    // 6. Migrasi Akun Pengguna Super Admin (Multi-Device Login)
    const rawLocalUsers = JSON.parse(
      localStorage.getItem(LOCAL_CACHE_KEYS.USER_ACCOUNTS) || '[]'
    ) as UserAccount[];
    const cloudUsersSnapshot = await getDocs(collection(firestore, CLOUD_COLLECTIONS.USER_ACCOUNTS));
    const cloudUserIdSet = new Set<string>();
    cloudUsersSnapshot.forEach((d) => cloudUserIdSet.add(d.id));

    // Gabungkan akun lokal dan akun preset sistem
    const accountsToSeed = new Map<string, UserAccount>();
    PRESET_ACCOUNTS.forEach((acc) => accountsToSeed.set(acc.id, acc));
    rawLocalUsers.forEach((acc) => accountsToSeed.set(acc.id, acc));

    let usersMigrated = 0;
    for (const [, u] of accountsToSeed.entries()) {
      if (!cloudUserIdSet.has(u.id)) {
        await saveUserAccountToCloud(u);
        usersMigrated++;
      }
    }

    // Hapus penyimpanan lokal akun pengguna agar hanya mengandalkan Cloud Database
    try {
      localStorage.removeItem(LOCAL_CACHE_KEYS.USER_ACCOUNTS);
    } catch {
      // ignore
    }

    updateSyncState({
      isConnected: true,
      statusText: `🟢 Migrasi Cloud Selesai (+${votersMigrated} Voter, +${usersMigrated} Akun)`,
    });
  } catch (err) {
    console.warn('[CloudSync] Migrasi data lokal notice:', err);
  }

  return { votersMigrated, timSuksesMigrated, c1Migrated, b1Migrated };
}

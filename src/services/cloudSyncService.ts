// Centralized Real-Time Cloud Synchronization Service (Firebase Firestore + Google Maps Precision Geocoding)
// Memastikan 100% konsistensi data multi-perangkat (HP, Tablet, Desktop) secara real-time via onSnapshot.

import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import {
  VoterOcrRecord,
  FormC1Upload,
  FormB1Upload,
  DptVoterRecord,
} from '../types/vore';
import { TimSuksesWilayahRecord } from '../data/petaSuaraData';
import { resolveAccurateCoordinates, lookupSmartCoordinates } from '../utils/geocoding';

export const CLOUD_COLLECTIONS = {
  VOTERS: 'voters',
  TIM_SUKSES: 'tim_sukses_members',
  C1_RECORDS: 'c1_records',
  B1_RECORDS: 'b1_records',
  SYNC_METADATA: 'sync_metadata',
} as const;

export const LOCAL_CACHE_KEYS = {
  VOTERS: 'swaraku_voter_ocr_records',
  VOTERS_FALLBACK: 'swaraku_voter_records',
  TIM_SUKSES: 'swaraku_timsukses_list',
  C1: 'swaraku_c1_records',
  B1: 'swaraku_b1_records',
  DPT: 'swaraku_dpt_list',
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
  const cleanId = voter.nik ? voter.nik.replace(/\D/g, '') : voter.id;
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

// -------------------------------------------------------------
// 2. REAL-TIME MULTI-DEVICE LISTENER: VOTERS
// -------------------------------------------------------------
export function subscribeToCloudVoters(
  onUpdate: (voters: VoterOcrRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  updateSyncState({
    activeListenersCount: syncState.activeListenersCount + 1,
    statusText: 'Mendengarkan perubahan Real-Time Cloud Voters...',
  });

  const votersCollectionRef = collection(firestore, CLOUD_COLLECTIONS.VOTERS);

  const unsubscribe = onSnapshot(
    votersCollectionRef,
    (snapshot) => {
      const voters: VoterOcrRecord[] = [];
      const needsHealingList: VoterOcrRecord[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const rawNik = String(d.nik || docSnap.id || '').trim();
        const cleanNik = rawNik.replace(/\D/g, '') || rawNik;
        const masked =
          d.nikMasked ||
          (cleanNik.length >= 8
            ? `${cleanNik.slice(0, 4)}••••••••${cleanNik.slice(-4)}`
            : cleanNik);

        const voterRecord: VoterOcrRecord = {
          id: d.id || docSnap.id,
          nik: cleanNik,
          nikMasked: masked,
          nama: String(d.nama || 'VOTER TANPA NAMA').toUpperCase().trim(),
          tempatTglLahir: d.tempatTglLahir || '-',
          jenisKelamin: d.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
          alamat: d.alamat || '-',
          rtRw: d.rtRw || '001/001',
          kelurahan: d.kelurahan || '',
          kecamatan: d.kecamatan || '',
          kabupatenKota: d.kabupatenKota || '',
          provinsi: d.provinsi || 'DKI Jakarta',
          tps: d.tps || 'TPS 001',
          noHp: d.noHp || '-',
          waktuDaftar: d.waktuDaftar || new Date().toLocaleString('id-ID'),
          fotoKtpUrl: d.fotoKtpUrl || undefined,
          statusDpt: d.statusDpt === 'Perlu cek' ? 'Perlu cek' : 'DPT valid',
          statusRegistrasi: 'TERDAFTAR',
          terdaftarOleh: d.terdaftarOleh || 'Database Cloud',
          diinputOlehRole: d.diinputOlehRole,
          diinputOlehNama: d.diinputOlehNama,
          lat: typeof d.lat === 'number' ? d.lat : undefined,
          lng: typeof d.lng === 'number' ? d.lng : undefined,
        };

        if (isCoordinateErroneousOrMissing(voterRecord)) {
          needsHealingList.push(voterRecord);
        }

        voters.push(voterRecord);
      });

      // Urutkan data voter: Terbaru di paling atas (top of list)
      voters.sort((a, b) => {
        const timeA = new Date(a.waktuDaftar).getTime() || 0;
        const timeB = new Date(b.waktuDaftar).getTime() || 0;
        return timeB - timeA;
      });

      // Update state sinkronisasi & cache lokal (resilience)
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

      // Jalankan auto-healing di latar belakang untuk data lama yang titiknya meleset
      if (needsHealingList.length > 0) {
        needsHealingList.slice(0, 5).forEach((v) => {
          autoHealVoterCoordinates(v);
        });
      }
    },
    (error) => {
      console.warn('[CloudSync] Firestore voters snapshot notice:', error);
      updateSyncState({
        isConnected: false,
        statusText: '⚠️ Offline / Cloud Sync Tertunda (Menggunakan Cache)',
      });
      if (onError) onError(error);
    }
  );

  return () => {
    updateSyncState({
      activeListenersCount: Math.max(0, syncState.activeListenersCount - 1),
    });
    unsubscribe();
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
          dapil: d.dapil || 'DAPIL DKI JAKARTA II',
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
// 5. WRITE ACTIONS: SAVE RECORD DIRECTLY TO CLOUD FIRESTORE
// -------------------------------------------------------------
export async function saveVoterToCloud(
  voter: VoterOcrRecord,
  dptRecord?: DptVoterRecord
): Promise<void> {
  const cleanNik = voter.nik ? voter.nik.replace(/\D/g, '') : voter.id;

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
    const docRef = doc(firestore, CLOUD_COLLECTIONS.VOTERS, cleanNik);
    await setDoc(
      docRef,
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
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
      {
        ...ts,
        updatedAt: new Date().toISOString(),
      },
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
      {
        ...c1,
        updatedAt: new Date().toISOString(),
      },
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
      {
        ...b1,
        updatedAt: new Date().toISOString(),
      },
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
    // 1. Ambil data eksisting dari Cloud Firestore untuk deduplikasi berdasarkan NIK
    const cloudVotersSnapshot = await getDocs(collection(firestore, CLOUD_COLLECTIONS.VOTERS));
    const cloudNikSet = new Set<string>();
    cloudVotersSnapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const nik = String(d.nik || docSnap.id).replace(/\D/g, '');
      if (nik) cloudNikSet.add(nik);
    });

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

    updateSyncState({
      isConnected: true,
      statusText: `🟢 Migrasi Cloud Selesai (+${votersMigrated} Voter Baru)`,
    });
  } catch (err) {
    console.warn('[CloudSync] Migrasi data lokal notice:', err);
  }

  return { votersMigrated, timSuksesMigrated, c1Migrated, b1Migrated };
}

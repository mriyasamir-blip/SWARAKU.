import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import {
  saveVoterToCloud,
  saveTimSuksesToCloud,
  saveC1ToCloud,
  saveB1ToCloud,
  subscribeToCloudVoters,
  subscribeToCloudTimSukses,
  subscribeToCloudC1,
  subscribeToCloudB1,
  subscribeToCloudUserAccounts,
  authenticateCloudUser,
  saveUserAccountToCloud,
  deleteUserAccountFromCloud,
  migrateLocalDataToCloud,
  autoHealVoterCoordinates,
  isCoordinateErroneousOrMissing,
  subscribeCloudSyncStatus,
  getCloudSyncState,
  type CloudSyncState,
} from '../services/cloudSyncService';
import { VoterOcrRecord, DptVoterRecord, FormC1Upload, FormB1Upload } from '../types/vore';
import { TimSuksesWilayahRecord } from '../data/petaSuaraData';

export function getLocalStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed ?? defaultValue;
  } catch (err) {
    console.warn(`Error reading localStorage for key ${key}:`, err);
    return defaultValue;
  }
}

export function setLocalStoredData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing to localStorage for key ${key}:`, err);
  }
}

export async function syncSaveVoter(
  voter: VoterOcrRecord,
  dptRecord?: DptVoterRecord
): Promise<void> {
  return saveVoterToCloud(voter, dptRecord);
}

export async function syncSaveC1(c1: FormC1Upload): Promise<void> {
  return saveC1ToCloud(c1);
}

export async function syncSaveB1(b1: FormB1Upload): Promise<void> {
  return saveB1ToCloud(b1);
}

export async function syncSaveTimSukses(timSukses: TimSuksesWilayahRecord): Promise<void> {
  return saveTimSuksesToCloud(timSukses);
}

export async function fetchRemoteVoters(): Promise<VoterOcrRecord[]> {
  const votersMap = new Map<string, VoterOcrRecord>();

  try {
    const querySnapshot = await getDocs(collection(firestore, 'voters'));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const cleanNik = String(data.nik || docSnap.id).replace(/\D/g, '');
      if (cleanNik) {
        votersMap.set(cleanNik, {
          id: docSnap.id,
          nik: cleanNik,
          nikMasked: data.nikMasked || (cleanNik.length >= 8 ? `${cleanNik.slice(0, 4)}••••••••${cleanNik.slice(-4)}` : cleanNik),
          nama: String(data.nama || '').toUpperCase(),
          tempatTglLahir: data.tempatTglLahir || '-',
          jenisKelamin: data.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
          alamat: data.alamat || '-',
          rtRw: data.rtRw || '001/001',
          kelurahan: data.kelurahan || '',
          kecamatan: data.kecamatan || '',
          kabupatenKota: data.kabupatenKota || '',
          provinsi: data.provinsi || 'DKI Jakarta',
          tps: data.tps || 'TPS 001',
          noHp: data.noHp || '-',
          waktuDaftar: data.waktuDaftar || new Date().toLocaleString('id-ID'),
          fotoKtpUrl: data.fotoKtpUrl,
          statusDpt: data.statusDpt || 'DPT valid',
          statusRegistrasi: 'TERDAFTAR',
          terdaftarOleh: data.terdaftarOleh || 'Database Cloud',
          diinputOlehRole: data.diinputOlehRole,
          diinputOlehNama: data.diinputOlehNama,
          lat: typeof data.lat === 'number' ? data.lat : undefined,
          lng: typeof data.lng === 'number' ? data.lng : undefined,
        });
      }
    });
  } catch (e) {
    console.warn('Fetch remote voters notice:', e);
  }

  return Array.from(votersMap.values());
}

export {
  saveVoterToCloud,
  saveTimSuksesToCloud,
  saveC1ToCloud,
  saveB1ToCloud,
  subscribeToCloudVoters,
  subscribeToCloudTimSukses,
  subscribeToCloudC1,
  subscribeToCloudB1,
  subscribeToCloudUserAccounts,
  authenticateCloudUser,
  saveUserAccountToCloud,
  deleteUserAccountFromCloud,
  migrateLocalDataToCloud,
  autoHealVoterCoordinates,
  isCoordinateErroneousOrMissing,
  subscribeCloudSyncStatus,
  getCloudSyncState,
  type CloudSyncState,
};

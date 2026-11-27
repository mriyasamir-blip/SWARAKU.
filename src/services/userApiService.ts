import { AccountStatus, UserAccount, UserRole } from '../types/vore';
import { getActiveScriptUrl, isScriptUrlConfigured } from '../config/apiConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { PRESET_ACCOUNTS } from '../data/accountsData';
import { formatWilayahLabel, getProvinsiByKota } from '../data/wilayahIndonesia';
import { isAreaMatch, isKorcamRole, isKorwilRole } from '../utils/hierarchyAccess';

const FIRESTORE_USERS_COLLECTION = 'user_accounts';

/**
 * Helper untuk request ke Google Apps Script Web App.
 * Menggunakan mode text/plain untuk body JSON agar menghindari isu CORS Preflight pada Google Apps Script.
 */
async function fetchGoogleScript(action: string, payload: any = {}): Promise<any> {
  const scriptUrl = getActiveScriptUrl();
  if (!scriptUrl || scriptUrl.includes('MASUKKAN_URL_WEB_APP_DISINI')) {
    throw new Error('Google Apps Script SCRIPT_URL belum dikonfigurasi.');
  }

  // Gunakan POST dengan mode cors & redirect: follow (Google Apps Script redirects 302 to googleusercontent)
  const bodyData = JSON.stringify({ action, ...payload });

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: bodyData,
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    // Fallback: coba GET request jika POST gagal karena jaringan/CORS
    try {
      const getUrl = new URL(scriptUrl);
      getUrl.searchParams.append('action', action);
      if (payload.username) getUrl.searchParams.append('username', payload.username);
      if (payload.password) getUrl.searchParams.append('password', payload.password);
      if (payload.id) getUrl.searchParams.append('id', payload.id);

      const getRes = await fetch(getUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
      });
      const getData = await getRes.json();
      return getData;
    } catch (fallbackErr) {
      console.error('[UserApi] Fetch Google Script error:', err);
      throw err;
    }
  }
}

function normalizeUserAccount(u: any): UserAccount {
  if (!u) return u;
  if (typeof u.kaderList === 'string') {
    try {
      const parsed = JSON.parse(u.kaderList);
      u.kaderList = Array.isArray(parsed) ? parsed : [u.kaderList];
    } catch {
      u.kaderList = u.kaderList.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (typeof u.kaderIds === 'string') {
    try {
      const parsed = JSON.parse(u.kaderIds);
      u.kaderIds = Array.isArray(parsed) ? parsed : [u.kaderIds];
    } catch {
      u.kaderIds = u.kaderIds.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return u as UserAccount;
}

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean as Partial<T>;
}

/**
 * 1. Ambil seluruh data user langsung dari Cloud Server (Google Sheets / Firestore).
 * TIDAK MENYIMPAN KE LOCALSTORAGE!
 */
export async function fetchUsersFromCloud(): Promise<UserAccount[]> {
  const accountsMap = new Map<string, UserAccount>();
  // Masukkan preset akun bawaan sebagai baseline
  PRESET_ACCOUNTS.forEach((a) => accountsMap.set(a.id, a));

  // A. Ambil langsung dari Firestore Cloud Database (Utama & Real-Time)
  try {
    const colRef = collection(firestore, FIRESTORE_USERS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      snap.forEach((d) => {
        const u = normalizeUserAccount(d.data());
        if (u && u.id) {
          accountsMap.set(u.id, u);
        }
      });
    } else {
      // Auto-seed baseline akun ke Firestore jika koleksi user_accounts masih kosong
      for (const acc of PRESET_ACCOUNTS) {
        try {
          const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, acc.id);
          await setDoc(docRef, acc, { merge: true });
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('[UserApi] Gagal fetch dari Firestore:', err);
  }

  // B. Jika Google Apps Script Web App aktif, gabungkan juga dari Google Sheets
  if (isScriptUrlConfigured()) {
    try {
      const data = await fetchGoogleScript('getUsers');
      if (data && data.success && Array.isArray(data.users)) {
        data.users.forEach((rawUser: any) => {
          const u = normalizeUserAccount(rawUser);
          if (u && u.id) accountsMap.set(u.id, u);
        });
      }
    } catch (err) {
      console.warn('[UserApi] Gagal fetch dari Google Apps Script:', err);
    }
  }

  return Array.from(accountsMap.values());
}

/**
 * 2. Tambah user baru oleh Super Admin ke Cloud Server secara real-time.
 */
export async function createUserOnCloud(
  user: UserAccount
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  let savedOnGoogleScript = false;
  let serverMessage = '';

  // A. Simpan ke Firestore Real-Time (Prioritas Utama untuk Multi-Device)
  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, user.id);
    await setDoc(
      docRef,
      stripUndefined({
        ...user,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[UserApi] Gagal simpan ke Firestore:', err);
    return { success: false, message: err?.message || 'Gagal menyimpan akun ke Firestore Cloud Database' };
  }

  // B. Simpan juga ke Google Sheets via Google Apps Script jika URL tersedia
  if (isScriptUrlConfigured()) {
    try {
      const res = await fetchGoogleScript('createUser', { user });
      if (res && res.success) {
        savedOnGoogleScript = true;
        serverMessage = 'Data tersimpan di Google Sheets & Cloud Firestore';
      }
    } catch (err: any) {
      console.warn('[UserApi] Notice: Google Apps Script sync skipped:', err);
    }
  }

  return {
    success: true,
    user,
    message: savedOnGoogleScript
      ? serverMessage
      : 'Akun berhasil disimpan ke Cloud Database Firestore (Siap digunakan di semua device)!',
  };
}

/**
 * Simpan multiple user (misalnya saat Tim Sukses dibuat beserta seluruh kader binaannya)
 */
export async function createMultipleUsersOnCloud(
  users: UserAccount[]
): Promise<{ success: boolean; count: number; failed: number; message?: string }> {
  let successCount = 0;
  let failedCount = 0;

  for (const user of users) {
    try {
      const res = await createUserOnCloud(user);
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
      }
    } catch (e) {
      console.error('[UserApi] Error creating user:', user.username, e);
      failedCount++;
    }
  }

  return {
    success: successCount > 0,
    count: successCount,
    failed: failedCount,
    message: `${successCount} akun berhasil disimpan ke Cloud Database Firestore.`,
  };
}

export const ROLE_LABEL_MAP: Record<UserRole, string> = {
  super_admin: 'SuperAdmin',
  admin: 'Admin',
  tim_sukses: 'Korwil',
  kader: 'Korcam',
  relawan: 'Relawan',
};

export const UNREGISTERED_ACCOUNT_ERROR =
  'Akun Anda belum terdaftar. Silakan hubungi Admin atau Koordinator terkait.';

const BOOTSTRAPPED_SUPERADMIN_EMAILS = ['m.riyasamir@gmail.com', 'admin@swaraku.online'];

const LEGACY_USERNAME_ALIAS: Record<string, string> = {
  timsukses: 'acc-timsukses',
  'timsukses@swaraku.com': 'acc-timsukses',
  kader: 'acc-kader',
  'kader@swaraku.com': 'acc-kader',
};

export function normalizeIndonesianPhone(raw?: string | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0062')) return `62${digits.slice(4)}`;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function normalizeFullName(raw?: string | null): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizeNik(raw?: string | null): string {
  return String(raw || '').replace(/\D/g, '');
}

export function getAccountStatusRejectionMessage(user: UserAccount): string | null {
  const status = user.status || 'Aktif';
  if (status === 'Pending') {
    if (user.role === 'relawan') {
      return 'Akun Anda masih berstatus Menunggu Aktivasi (Pending). Silakan tunggu aktivasi dari Korcam di wilayah penugasan Anda.';
    }
    if (user.role === 'kader') {
      return 'Akun Anda masih berstatus Menunggu Aktivasi (Pending). Silakan tunggu aktivasi dari Korwil di wilayah penugasan Anda.';
    }
    return 'Akun Anda masih berstatus Menunggu Aktivasi (Pending). Silakan tunggu aktivasi dari koordinator wilayah Anda.';
  }
  if (status === 'Ditolak') {
    return 'Pendaftaran akun Anda ditolak oleh koordinator wilayah.';
  }
  if (status === 'Nonaktif') {
    return 'Akun Anda sedang dinonaktifkan, silakan hubungi koordinator Anda.';
  }
  return null;
}

export interface DuplicateCheckCandidate {
  nama?: string;
  username?: string;
  email?: string;
  noHp?: string;
  nik?: string;
}

export function checkAccountDuplicates(
  candidate: DuplicateCheckCandidate,
  existingUsers: UserAccount[],
  excludeUserId?: string
): { hasDuplicate: boolean; duplicateFields: string[]; message: string } {
  const cNama = normalizeFullName(candidate.nama);
  const cUsername = String(candidate.username || '').trim().toLowerCase();
  const cEmail = String(candidate.email || '').trim().toLowerCase();
  const cPhone = normalizeIndonesianPhone(candidate.noHp);
  const cNik = normalizeNik(candidate.nik);

  const dupSet = new Set<string>();

  for (const acc of existingUsers) {
    if (!acc) continue;
    if (excludeUserId && acc.id === excludeUserId) continue;

    if (cNama && normalizeFullName(acc.nama) === cNama) {
      dupSet.add('Nama Lengkap');
    }
    if (cUsername && String(acc.username || '').trim().toLowerCase() === cUsername) {
      dupSet.add('Username Login');
    }
    if (cEmail && String(acc.email || '').trim().toLowerCase() === cEmail) {
      dupSet.add('Email');
    }
    if (cPhone && cPhone.length >= 8) {
      const existingPhone = normalizeIndonesianPhone(acc.noHp);
      if (existingPhone && existingPhone === cPhone) {
        dupSet.add('Nomor WhatsApp / HP');
      }
    }
    if (cNik && cNik.length === 16) {
      const existingNik = normalizeNik(acc.nik);
      if (existingNik && existingNik === cNik) {
        dupSet.add('NIK');
      }
    }
  }

  const duplicateFields = Array.from(dupSet);
  if (duplicateFields.length > 0) {
    return {
      hasDuplicate: true,
      duplicateFields,
      message: `Gagal mendaftar: ${duplicateFields.join(' / ')} sudah terdaftar dan tidak dapat digunakan untuk mendaftar ulang.`,
    };
  }

  return { hasDuplicate: false, duplicateFields: [], message: '' };
}

export interface SignUpAccountPayload {
  role: 'relawan' | 'kader';
  nama: string;
  username: string;
  email: string;
  noHp: string;
  password: string;
  nik: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
}

/**
 * 2b. Pendaftaran mandiri (Sign Up) Relawan & Korcam dengan validasi Anti-Duplikasi global
 * (Nama Lengkap, Username, Email, Nomor WA/HP, NIK 16 digit) & status awal 'Pending'.
 */
export async function registerAccountWithDuplicateCheck(
  payload: SignUpAccountPayload
): Promise<{ success: boolean; user?: UserAccount; duplicateFields?: string[]; message: string }> {
  const nama = payload.nama.trim().replace(/\s+/g, ' ');
  const username = payload.username.trim().toLowerCase();
  const email = payload.email.trim().toLowerCase();
  const noHpRaw = payload.noHp.trim();
  const normalizedPhone = normalizeIndonesianPhone(noHpRaw);
  const password = payload.password.trim();
  const nik = normalizeNik(payload.nik);
  const kota = payload.kota.trim();
  const kecamatan = payload.kecamatan.trim();
  const kelurahan = payload.kelurahan.trim();

  if (!nama || nama.length < 3 || nama.length > 120) {
    return { success: false, message: 'Nama Lengkap wajib diisi (minimal 3 karakter).' };
  }
  if (!username || username.length < 3 || username.length > 80 || /\s/.test(username)) {
    return { success: false, message: 'Username Login wajib diisi tanpa spasi (minimal 3 karakter).' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    return { success: false, message: 'Format alamat Email tidak valid.' };
  }
  if (!normalizedPhone || normalizedPhone.length < 10 || normalizedPhone.length > 16) {
    return { success: false, message: 'Nomor WhatsApp / HP tidak valid (minimal 10 digit).' };
  }
  if (!password || password.length < 6 || password.length > 120) {
    return { success: false, message: 'Password wajib diisi minimal 6 karakter.' };
  }
  if (nik.length !== 16) {
    return { success: false, message: 'NIK wajib terdiri dari tepat 16 digit angka.' };
  }
  if (!kota || !kecamatan || !kelurahan) {
    return {
      success: false,
      message: 'Wilayah Penugasan (Kota/Kabupaten, Kecamatan, dan Kelurahan) wajib dipilih lengkap.',
    };
  }

  // Ambil seluruh akun terbaru dari Firestore + preset untuk validasi anti-duplikasi menyeluruh
  const allAccounts = await fetchUsersFromCloud();
  const dupCheck = checkAccountDuplicates(
    { nama, username, email, noHp: noHpRaw, nik },
    allAccounts
  );
  if (dupCheck.hasDuplicate) {
    return {
      success: false,
      duplicateFields: dupCheck.duplicateFields,
      message: dupCheck.message,
    };
  }

  const provinsi = getProvinsiByKota(kota);
  const wilayah = formatWilayahLabel({ kota, kecamatan, kelurahan });

  // Cari koordinator induk berdasarkan wilayah agar otomatis terklaster rapi
  const matchedKorwil = allAccounts.find(
    (u) =>
      isKorwilRole(u.role) &&
      (u.status || 'Aktif') === 'Aktif' &&
      isAreaMatch(u.kota || u.wilayah, kota)
  );
  const matchedKorcam =
    payload.role === 'relawan'
      ? allAccounts.find(
          (u) =>
            isKorcamRole(u.role) &&
            (u.status || 'Aktif') === 'Aktif' &&
            isAreaMatch(u.kecamatan, kecamatan) &&
            (!u.kota || isAreaMatch(u.kota, kota))
        )
      : undefined;

  const newUser: UserAccount = {
    id: `acc-${payload.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: payload.role,
    nama,
    username,
    email,
    nik,
    noHp: noHpRaw.slice(0, 30),
    password,
    jabatan: payload.role === 'relawan' ? 'Relawan Lapangan' : 'Koordinator Kecamatan (Korcam)',
    wilayah: wilayah.slice(0, 160),
    provinsi: provinsi.slice(0, 120),
    kota: kota.slice(0, 120),
    kecamatan: kecamatan.slice(0, 120),
    kelurahan: kelurahan.slice(0, 120),
    status: 'Pending',
    points: 0,
    dibuatPada: new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    ...(matchedKorwil
      ? { timSuksesId: matchedKorwil.id, timSuksesNama: matchedKorwil.nama }
      : {}),
    ...(matchedKorcam
      ? { korcamId: matchedKorcam.id, korcamNama: matchedKorcam.nama }
      : {}),
  };

  const saved = await createUserOnCloud(newUser);
  if (!saved.success) {
    return {
      success: false,
      message: saved.message || 'Gagal menyimpan pendaftaran ke database.',
    };
  }

  const approverLabel = payload.role === 'relawan' ? 'Korcam' : 'Korwil';
  return {
    success: true,
    user: newUser,
    message: `Pendaftaran berhasil! Akun Anda berstatus Menunggu Aktivasi (Pending). Silakan tunggu aktivasi dari ${approverLabel} di wilayah ${kecamatan}, ${kota}.`,
  };
}

/**
 * 3. Validasi Login secara langsung ke Cloud Database (Cross-Device) dengan Whitelist ketat.
 */
export async function loginUserOnCloud(
  usernameOrEmail: string,
  plainPassword?: string,
  allowedRoles?: UserRole | UserRole[]
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  const cleanInput = (usernameOrEmail || '').trim().toLowerCase();
  const cleanPassword = (plainPassword || '').trim();
  const roleList: UserRole[] | null = allowedRoles
    ? Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles]
    : null;

  if (!cleanInput) {
    return { success: false, message: 'Silakan masukkan Username atau Email Anda.' };
  }
  if (!cleanPassword) {
    return { success: false, message: 'Silakan masukkan Kata Sandi atau PIN akun Anda.' };
  }

  const validateMatchedUser = (
    raw: UserAccount
  ): { success: boolean; user?: UserAccount; message?: string } => {
    const targetUser = normalizeUserAccount(raw);
    const statusRejection = getAccountStatusRejectionMessage(targetUser);
    if (statusRejection) {
      return {
        success: false,
        message: statusRejection,
      };
    }

    if (roleList && !roleList.includes(targetUser.role)) {
      const targetTab = targetUser.role === 'relawan' ? 'Relawan' : 'Tim Support';
      return {
        success: false,
        message: `Akun ini terdaftar sebagai ${ROLE_LABEL_MAP[targetUser.role]}. Silakan masuk melalui tab ${targetTab}.`,
      };
    }

    const registeredPassword = (targetUser.password || '123456').trim();
    if (registeredPassword !== cleanPassword) {
      return {
        success: false,
        message: 'Kata sandi atau PIN yang dimasukkan tidak cocok.',
      };
    }

    return { success: true, user: targetUser };
  };

  // A. Validasi langsung ke Firestore Cloud Database (Case-Insensitive & Whitespace-Safe)
  try {
    const colRef = collection(firestore, FIRESTORE_USERS_COLLECTION);
    const snap = await getDocs(colRef);
    let matchedUser: UserAccount | null = null;
    const aliasId = LEGACY_USERNAME_ALIAS[cleanInput];

    snap.forEach((d) => {
      const u = normalizeUserAccount(d.data());
      const uName = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uId = (u.id || '').trim().toLowerCase();
      if (
        uName === cleanInput ||
        uEmail === cleanInput ||
        uId === cleanInput ||
        (aliasId && uId === aliasId)
      ) {
        matchedUser = u;
      }
    });

    if (matchedUser) {
      return validateMatchedUser(matchedUser);
    }
  } catch (err: any) {
    console.warn('[UserApi] Validasi Firestore notice:', err);
  }

  // B. Jika Google Apps Script Web App aktif, coba validasi ke Google Sheets
  if (isScriptUrlConfigured()) {
    try {
      const res = await fetchGoogleScript('login', {
        username: cleanInput,
        password: cleanPassword,
      });
      if (res && res.success && res.user) {
        return validateMatchedUser(res.user as UserAccount);
      }
    } catch (err: any) {
      console.warn('[UserApi] Validasi Google Script notice:', err);
    }
  }

  // C. Fallback kredensial preset bawaan sistem & auto-sync ke Firestore
  const aliasId = LEGACY_USERNAME_ALIAS[cleanInput];
  const presetFound = PRESET_ACCOUNTS.find(
    (u) =>
      (u.username || '').trim().toLowerCase() === cleanInput ||
      (u.email || '').trim().toLowerCase() === cleanInput ||
      (aliasId && u.id === aliasId)
  );

  if (presetFound) {
    const check = validateMatchedUser(presetFound);
    if (!check.success) return check;

    try {
      const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, presetFound.id);
      setDoc(docRef, presetFound, { merge: true }).catch(() => {});
    } catch {
      // ignore
    }

    return { success: true, user: presetFound };
  }

  return {
    success: false,
    message: UNREGISTERED_ACCOUNT_ERROR,
  };
}

/**
 * 3b. Validasi Login SSO / Google untuk Tim Support & Relawan (Wajib Terdaftar di Whitelist Database User).
 */
export async function loginUserByGoogleEmailOnCloud(
  email: string,
  allowedRoles: UserRole[] = ['super_admin', 'admin', 'tim_sukses', 'kader']
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, message: UNREGISTERED_ACCOUNT_ERROR };
  }

  const checkAccount = (
    raw: UserAccount
  ): { success: boolean; user?: UserAccount; message?: string } => {
    const target = normalizeUserAccount(raw);
    const statusRejection = getAccountStatusRejectionMessage(target);
    if (statusRejection) {
      return {
        success: false,
        message: statusRejection,
      };
    }
    if (!allowedRoles.includes(target.role)) {
      const targetTab = target.role === 'relawan' ? 'Relawan' : 'Tim Support';
      return {
        success: false,
        message: `Email ini terdaftar sebagai ${ROLE_LABEL_MAP[target.role]}. Silakan masuk melalui tab ${targetTab}.`,
      };
    }
    return { success: true, user: target };
  };

  // 1. Cek langsung di koleksi user_accounts Firestore (cocokkan kolom email maupun username)
  try {
    const colRef = collection(firestore, FIRESTORE_USERS_COLLECTION);
    const snap = await getDocs(colRef);
    const matches: UserAccount[] = [];
    snap.forEach((d) => {
      const u = normalizeUserAccount(d.data());
      const uEmail = (u.email || '').trim().toLowerCase();
      const uUsername = (u.username || '').trim().toLowerCase();
      if (uEmail === cleanEmail || uUsername === cleanEmail) {
        matches.push(u);
      }
    });
    if (matches.length > 0) {
      const preferredMatch = matches.find((u) => allowedRoles.includes(u.role)) || matches[0];
      return checkAccount(preferredMatch);
    }
  } catch (err) {
    console.warn('[UserApi] Validasi Google SSO Firestore notice:', err);
  }

  // 2. Cek preset akun bawaan & email SuperAdmin utama
  if (BOOTSTRAPPED_SUPERADMIN_EMAILS.includes(cleanEmail)) {
    const baseSuper = PRESET_ACCOUNTS.find((a) => a.role === 'super_admin')!;
    const superAcc: UserAccount = {
      ...baseSuper,
      email: cleanEmail,
    };
    try {
      const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, superAcc.id);
      await setDoc(docRef, stripUndefined({ ...superAcc, updatedAt: new Date().toISOString() }), {
        merge: true,
      });
    } catch {
      // ignore
    }
    return checkAccount(superAcc);
  }

  const presetByEmail = PRESET_ACCOUNTS.find(
    (u) =>
      (u.email || '').trim().toLowerCase() === cleanEmail ||
      (u.username || '').trim().toLowerCase() === cleanEmail
  );
  if (presetByEmail) {
    return checkAccount(presetByEmail);
  }

  // Tolak akses jika email Google tidak ada di database whitelist
  return {
    success: false,
    message: UNREGISTERED_ACCOUNT_ERROR,
  };
}

/**
 * 3c. Tambahkan poin otomatis ke akun penginput (Voter +10, Relawan +25, Korcam/Korwil +50) di Firestore.
 */
export async function awardUserPointsOnCloud(
  userId: string,
  delta: number
): Promise<number | null> {
  if (!userId || !Number.isFinite(delta) || delta <= 0) return null;
  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    const currentPoints =
      snap.exists() && typeof snap.data()?.points === 'number' ? snap.data().points : 0;
    const nextPoints = Math.min(1_000_000, currentPoints + Math.round(delta));
    await setDoc(
      docRef,
      {
        points: nextPoints,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return nextPoints;
  } catch (err) {
    console.warn('[UserApi] Gagal menyimpan poin ke Firestore:', err);
    return null;
  }
}

/**
 * 4. Fetch ulang profil user terbaru berdasarkan userId saat halaman di-refresh.
 */
export async function fetchUserProfileById(userId: string): Promise<UserAccount | null> {
  if (!userId) return null;

  // A. Coba dari Firestore (Prioritas utama untuk foto & relasi kader real-time)
  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return normalizeUserAccount(snap.data());
    }
  } catch (err) {
    console.warn('[UserApi] Fetch user by id dari Firestore gagal:', err);
  }

  // B. Coba dari Google Sheets
  if (isScriptUrlConfigured()) {
    try {
      const res = await fetchGoogleScript('getUserById', { id: userId });
      if (res && res.success && res.user) {
        return normalizeUserAccount(res.user);
      }
    } catch (err) {
      console.warn('[UserApi] Fetch user by id dari Google Script gagal:', err);
    }
  }

  return null;
}

/**
 * 5. Update user di server
 */
export async function updateUserOnCloud(user: UserAccount): Promise<boolean> {
  if (isScriptUrlConfigured()) {
    try {
      await fetchGoogleScript('updateUser', { user });
    } catch (e) {
      console.warn('[UserApi] Update Google Script error:', e);
    }
  }

  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, user.id);
    await setDoc(
      docRef,
      stripUndefined({ ...user, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[UserApi] Update Firestore error:', e);
    return false;
  }
}

/**
 * Update foto profil user ke Firestore Cloud Database (Multi-Device)
 */
export async function updateUserPhotoOnCloud(userId: string, fotoUrl: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, userId);
    await setDoc(
      docRef,
      {
        fotoUrl,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Sync juga ke Google Apps Script jika aktif
    if (isScriptUrlConfigured()) {
      try {
        await fetchGoogleScript('updateUser', { user: { id: userId, fotoUrl } });
      } catch (e) {
        console.warn('[UserApi] Notice: Google Script photo update skipped:', e);
      }
    }

    return true;
  } catch (e) {
    console.error('[UserApi] Update foto profil Firestore error:', e);
    return false;
  }
}

/**
 * 6. Hapus user dari server
 */
export async function deleteUserOnCloud(userId: string): Promise<boolean> {
  if (isScriptUrlConfigured()) {
    try {
      await fetchGoogleScript('deleteUser', { id: userId });
    } catch (e) {
      console.warn('[UserApi] Delete Google Script error:', e);
    }
  }

  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, userId);
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.error('[UserApi] Delete Firestore error:', e);
    return false;
  }
}

/**
 * 7. Ubah status user langsung (Aktif / Pending / Ditolak / Nonaktif) di Firestore.
 */
export async function updateUserStatusOnCloud(
  userId: string,
  nextStatus: AccountStatus
): Promise<boolean> {
  if (!userId) return false;
  if (isScriptUrlConfigured()) {
    try {
      await fetchGoogleScript('updateUser', { user: { id: userId, status: nextStatus } });
    } catch (e) {
      console.warn('[UserApi] Update status Google Script error:', e);
    }
  }

  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, userId);
    await setDoc(
      docRef,
      { status: nextStatus, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[UserApi] Update status Firestore error:', e);
    return false;
  }
}

/**
 * 8. Ubah status user Aktif/Nonaktif di server
 */
export async function toggleUserStatusOnCloud(userId: string): Promise<boolean> {
  if (isScriptUrlConfigured()) {
    try {
      await fetchGoogleScript('toggleStatus', { id: userId });
    } catch (e) {
      console.warn('[UserApi] Toggle status Google Script error:', e);
    }
  }

  try {
    const docRef = doc(firestore, FIRESTORE_USERS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const cur = snap.data() as UserAccount;
      const nextStatus: AccountStatus = cur.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
      await setDoc(docRef, { status: nextStatus, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    }
  } catch (e) {
    console.error('[UserApi] Toggle status Firestore error:', e);
  }
  return false;
}

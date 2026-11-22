import {
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../lib/firebase';
import type {
  ActivityLogDoc,
  AspirationDoc,
  CalegInfoDoc,
  CampaignEventDoc,
  RewardClaimDoc,
  RewardDoc,
  VoterDoc,
} from '../types/swaraku';
import { syncLoyaltyVoterToPetaSuara } from './cloudSyncService';

export const SUPERADMIN_EMAILS: readonly string[] = [
  'm.riyasamir@gmail.com',
  'admin@swaraku.online',
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function clampStr(val: string | undefined | null, maxLen: number): string {
  return String(val ?? '').trim().slice(0, maxLen);
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function makeEmailLookupId(email: string): string {
  const norm = email.trim().toLowerCase();
  const slug = norm.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 48) || 'user';
  return `em_${slug}_${fnv1aHex(norm)}`;
}

export function normalizePhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('62')) return `0${digits.slice(2)}`;
  return digits;
}

export function getReadableDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Server';
  const ua = window.navigator.userAgent;
  let os = 'Desktop';
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return `${os} · ${browser}${isStandalone ? ' (PWA App)' : ''}`.slice(0, 300);
}

export async function loginWithGoogleSSO(): Promise<User> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeVoterProfile(
  uid: string,
  onData: (voter: VoterDoc | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `voters/${uid}`;
  const ref = doc(db, 'voters', uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as VoterDoc);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function recordLoginActivity(voter: Pick<VoterDoc, 'uid' | 'fullName' | 'email'>): Promise<void> {
  const path = 'activity_logs';
  try {
    await addDoc(collection(db, path), {
      uid: voter.uid,
      fullName: clampStr(voter.fullName, 120) || 'Pemilih',
      email: clampStr(voter.email, 150),
      activityType: 'LOGIN',
      deviceInfo: getReadableDeviceInfo(),
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[ActivityLog] Tidak dapat mencatat log login:', error);
  }
}

export interface RegisterVoterInput {
  user: User;
  fullName: string;
  address: string;
  region: string;
  phone: string;
  referralInput?: string;
}

export async function registerVoterProfile({
  user,
  fullName,
  address,
  region,
  phone,
  referralInput,
}: RegisterVoterInput): Promise<{ appliedReferralBonus: boolean }> {
  const uid = user.uid;
  const myCode = `SWR-${uid.substring(0, 6).toUpperCase()}`;
  const cleanRef = clampStr(referralInput, 32).toUpperCase().replace(/[^A-Z0-9\-]/g, '');

  let referrerUid: string | null = null;
  if (cleanRef && cleanRef !== myCode) {
    try {
      const refSnap = await getDoc(doc(db, 'referral_codes', cleanRef));
      if (refSnap.exists()) {
        const refData = refSnap.data() as { uid?: string };
        if (refData?.uid && refData.uid !== uid) {
          referrerUid = refData.uid;
        }
      }
    } catch {
      // Abaikan jika kode referral tidak ditemukan / tidak valid
    }
  }

  const batch = writeBatch(db);

  const voterPayload: Record<string, unknown> = {
    uid,
    fullName: clampStr(fullName, 120),
    address: clampStr(address, 300),
    region: clampStr(region, 120),
    phone: clampStr(phone, 30),
    email: clampStr(user.email || '', 150),
    points: 100,
    referralCode: myCode,
    occupation: '',
    birthDate: '',
    authMethod: 'google',
    createdAt: serverTimestamp(),
  };

  if (referrerUid && cleanRef) {
    voterPayload.referredBy = cleanRef;
  }

  batch.set(doc(db, 'voters', uid), voterPayload);
  batch.set(doc(db, 'referral_codes', myCode), {
    uid,
    referralCode: myCode,
    createdAt: serverTimestamp(),
  });

  if (referrerUid) {
    batch.update(doc(db, 'voters', referrerUid), {
      points: increment(50),
    });
  }

  const logRef = doc(collection(db, 'activity_logs'));
  batch.set(logRef, {
    uid,
    fullName: clampStr(fullName, 120),
    email: clampStr(user.email || '', 150),
    activityType: 'REGISTER & LOGIN',
    deviceInfo: getReadableDeviceInfo(),
    timestamp: serverTimestamp(),
  });

  try {
    await batch.commit();
    await syncLoyaltyVoterToPetaSuara({
      uid,
      fullName: clampStr(fullName, 120),
      address: clampStr(address, 300),
      region: clampStr(region, 120),
      phone: clampStr(phone, 30),
      referralCode: myCode,
      authMethod: 'google',
    }).catch(() => {});
    return { appliedReferralBonus: Boolean(referrerUid) };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `voters/${uid}`);
  }
}

export interface ManualSignUpInput {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  region: string;
  referralInput?: string;
}

export async function registerManualVoterProfile(
  input: ManualSignUpInput
): Promise<{ voter: VoterDoc; appliedReferralBonus: boolean }> {
  const cleanEmail = clampStr(input.email, 150).toLowerCase();
  const cleanName = clampStr(input.fullName, 120);
  const cleanPhone = clampStr(input.phone, 30);
  const cleanAddress = clampStr(input.address, 300);
  const cleanRegion = clampStr(input.region, 120);

  if (cleanName.length < 2) throw new Error('Nama lengkap wajib diisi (minimal 2 karakter).');
  if (cleanPhone.length < 6) throw new Error('Nomor telepon aktif wajib diisi.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Format alamat email tidak valid.');
  }
  if (cleanAddress.length < 5) throw new Error('Alamat lengkap wajib diisi dengan jelas.');
  if (cleanRegion.length < 2) throw new Error('Dapil atau kelurahan wajib diisi.');

  const emailKey = makeEmailLookupId(cleanEmail);
  const existingSignupSnap = await getDoc(doc(db, 'voter_signups', emailKey));
  if (existingSignupSnap.exists()) {
    throw new Error(
      'Email ini sudah terdaftar sebagai pemilih. Silakan masuk melalui tab Masuk menggunakan Email & Nomor Telepon atau Google.'
    );
  }

  const voterId = `vreg_${fnv1aHex(cleanEmail)}_${Date.now().toString(36)}`;
  const myCode = `SWR-${fnv1aHex(voterId).slice(0, 6).toUpperCase()}`;
  const cleanRef = clampStr(input.referralInput, 32).toUpperCase().replace(/[^A-Z0-9\-]/g, '');

  let referrerUid: string | null = null;
  if (cleanRef && cleanRef !== myCode) {
    try {
      const refSnap = await getDoc(doc(db, 'referral_codes', cleanRef));
      if (refSnap.exists()) {
        const refData = refSnap.data() as { uid?: string };
        if (refData?.uid && refData.uid !== voterId) {
          referrerUid = refData.uid;
        }
      }
    } catch {
      // Abaikan jika kode referral tidak valid
    }
  }

  const batch = writeBatch(db);

  const voterPayload: Record<string, unknown> = {
    uid: voterId,
    fullName: cleanName,
    address: cleanAddress,
    region: cleanRegion,
    phone: cleanPhone,
    email: cleanEmail,
    points: 100,
    referralCode: myCode,
    occupation: '',
    birthDate: '',
    authMethod: 'manual',
    createdAt: serverTimestamp(),
  };

  if (referrerUid && cleanRef) {
    voterPayload.referredBy = cleanRef;
  }

  batch.set(doc(db, 'voters', voterId), voterPayload);
  batch.set(doc(db, 'voter_signups', emailKey), {
    voterId,
    email: cleanEmail,
    phone: cleanPhone,
    fullName: cleanName,
    address: cleanAddress,
    region: cleanRegion,
    ...(cleanRef ? { referralInput: cleanRef } : {}),
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'referral_codes', myCode), {
    uid: voterId,
    referralCode: myCode,
    createdAt: serverTimestamp(),
  });

  if (referrerUid) {
    batch.update(doc(db, 'voters', referrerUid), {
      points: increment(50),
    });
  }

  const logRef = doc(collection(db, 'activity_logs'));
  batch.set(logRef, {
    uid: voterId,
    fullName: cleanName,
    email: cleanEmail,
    activityType: 'REGISTER & LOGIN',
    deviceInfo: getReadableDeviceInfo(),
    timestamp: serverTimestamp(),
  });

  try {
    await batch.commit();
    const createdVoter: VoterDoc = {
      uid: voterId,
      fullName: cleanName,
      address: cleanAddress,
      region: cleanRegion,
      phone: cleanPhone,
      email: cleanEmail,
      points: 100,
      referralCode: myCode,
      ...(referrerUid && cleanRef ? { referredBy: cleanRef } : {}),
      occupation: '',
      birthDate: '',
      authMethod: 'manual',
    };
    await syncLoyaltyVoterToPetaSuara(createdVoter).catch(() => {});
    return {
      appliedReferralBonus: Boolean(referrerUid),
      voter: createdVoter,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `voters/${voterId}`);
  }
}

export async function loginManualVoter(email: string, phone: string): Promise<VoterDoc> {
  const cleanEmail = clampStr(email, 150).toLowerCase();
  const cleanPhone = normalizePhone(phone);
  if (!cleanEmail || !cleanPhone) {
    throw new Error('Mohon isi Email dan Nomor Telepon terdaftar Anda.');
  }

  const emailKey = makeEmailLookupId(cleanEmail);
  const signupSnap = await getDoc(doc(db, 'voter_signups', emailKey));
  if (!signupSnap.exists()) {
    throw new Error(
      'Email belum terdaftar. Silakan klik tab Daftar / Sign Up untuk mendaftarkan akun pemilih terlebih dahulu.'
    );
  }

  const signupData = signupSnap.data() as { voterId: string; phone: string };
  if (normalizePhone(signupData.phone) !== cleanPhone) {
    throw new Error('Nomor telepon tidak cocok dengan data pendaftaran Anda.');
  }

  const voterSnap = await getDoc(doc(db, 'voters', signupData.voterId));
  if (!voterSnap.exists()) {
    throw new Error('Profil pemilih tidak ditemukan di server.');
  }

  const voter = voterSnap.data() as VoterDoc;
  recordLoginActivity(voter).catch(() => {});
  return voter;
}

export async function findAndLinkPreRegisteredVoter(user: User): Promise<boolean> {
  if (!user.email) return false;
  const emailKey = makeEmailLookupId(user.email);
  try {
    const signupSnap = await getDoc(doc(db, 'voter_signups', emailKey));
    if (!signupSnap.exists()) return false;
    const data = signupSnap.data() as {
      voterId: string;
      fullName: string;
      address: string;
      region: string;
      phone: string;
      referralInput?: string;
      linkedGoogleUid?: string;
    };
    if (data.linkedGoogleUid && data.linkedGoogleUid !== user.uid) {
      return false;
    }

    await registerVoterProfile({
      user,
      fullName: data.fullName,
      address: data.address,
      region: data.region,
      phone: data.phone,
      referralInput: data.referralInput,
    });

    await updateDoc(doc(db, 'voter_signups', emailKey), {
      linkedGoogleUid: user.uid,
    }).catch(() => {});

    return true;
  } catch {
    return false;
  }
}

export async function updateVoterProfile(
  uid: string,
  patch: {
    fullName: string;
    address: string;
    region: string;
    phone: string;
    occupation: string;
    birthDate: string;
  }
): Promise<void> {
  const path = `voters/${uid}`;
  try {
    await updateDoc(doc(db, 'voters', uid), {
      fullName: clampStr(patch.fullName, 120),
      address: clampStr(patch.address, 300),
      region: clampStr(patch.region, 120),
      phone: clampStr(patch.phone, 30),
      occupation: clampStr(patch.occupation, 100),
      birthDate: clampStr(patch.birthDate, 30),
    });

    try {
      const voterSnap = await getDoc(doc(db, 'voters', uid));
      if (voterSnap.exists()) {
        await syncLoyaltyVoterToPetaSuara(voterSnap.data() as VoterDoc);
      } else {
        await syncLoyaltyVoterToPetaSuara({
          uid,
          fullName: clampStr(patch.fullName, 120),
          address: clampStr(patch.address, 300),
          region: clampStr(patch.region, 120),
          phone: clampStr(patch.phone, 30),
          referralCode: `SWR-${uid.substring(0, 6).toUpperCase()}`,
          authMethod: uid.startsWith('vreg_') ? 'manual' : 'google',
        });
      }
    } catch {
      // Non-fatal Peta Suara sync
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// SUBSCRIPTIONS (VOTERS & SHARED)
// ==========================================

export function subscribeEvents(
  onData: (items: CampaignEventDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'events';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CampaignEventDoc, 'id'>) })));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeRewards(
  onData: (items: RewardDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'rewards';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RewardDoc, 'id'>) })));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeCalegInfo(
  onData: (items: CalegInfoDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'caleg_info';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalegInfoDoc, 'id'>) })));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeMyClaims(
  uid: string,
  onData: (items: RewardClaimDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'reward_claims';
  const q = query(collection(db, path), where('uid', '==', uid), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RewardClaimDoc, 'id'>),
      }));
      items.sort((a, b) => (b.claimedAt?.toMillis?.() || 0) - (a.claimedAt?.toMillis?.() || 0));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeMyAspirations(
  uid: string,
  onData: (items: AspirationDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'aspirations';
  const q = query(collection(db, path), where('uid', '==', uid), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AspirationDoc, 'id'>),
      }));
      items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

// ==========================================
// VOTER TRANSACTIONS (REWARD, RSVP, ASPIRATION)
// ==========================================

export async function redeemRewardAtomic(
  uid: string,
  voter: VoterDoc,
  reward: RewardDoc
): Promise<void> {
  const path = `reward_claims`;
  try {
    await runTransaction(db, async (tx) => {
      const voterRef = doc(db, 'voters', uid);
      const rewardRef = doc(db, 'rewards', reward.id);

      const [voterSnap, rewardSnap] = await Promise.all([
        tx.get(voterRef),
        tx.get(rewardRef),
      ]);

      if (!voterSnap.exists()) throw new Error('Profil pemilih tidak ditemukan.');
      if (!rewardSnap.exists()) throw new Error('Item reward tidak ditemukan.');

      const freshVoter = voterSnap.data() as VoterDoc;
      const freshReward = rewardSnap.data() as Omit<RewardDoc, 'id'>;

      if (freshReward.stock <= 0) {
        throw new Error('Stok barang reward sudah habis.');
      }
      if (freshVoter.points < freshReward.pointCost) {
        throw new Error('Saldo poin Anda belum mencukupi untuk reward ini.');
      }

      const claimRef = doc(collection(db, 'reward_claims'));
      tx.update(voterRef, {
        points: freshVoter.points - freshReward.pointCost,
      });
      tx.update(rewardRef, {
        stock: freshReward.stock - 1,
      });
      tx.set(claimRef, {
        uid,
        voterName: clampStr(freshVoter.fullName || voter.fullName, 120),
        phone: clampStr(freshVoter.phone || voter.phone, 30),
        rewardId: reward.id,
        itemName: clampStr(freshReward.itemName, 140),
        pointUsed: freshReward.pointCost,
        status: 'MENUNGGU',
        claimedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function rsvpEventAtomic(
  uid: string,
  eventId: string,
  attending: boolean
): Promise<{ pointsAwarded: number }> {
  const path = `events/${eventId}`;
  try {
    return await runTransaction(db, async (tx) => {
      const eventRef = doc(db, 'events', eventId);
      const voterRef = doc(db, 'voters', uid);

      const [eventSnap, voterSnap] = await Promise.all([
        tx.get(eventRef),
        tx.get(voterRef),
      ]);

      if (!eventSnap.exists()) throw new Error('Acara tidak ditemukan.');
      if (!voterSnap.exists()) throw new Error('Profil pemilih tidak ditemukan.');

      const eventData = eventSnap.data() as Omit<CampaignEventDoc, 'id'>;
      const voterData = voterSnap.data() as VoterDoc;
      const alreadyYes = (eventData.rsvpYes || []).includes(uid);

      if (attending) {
        tx.update(eventRef, {
          rsvpYes: arrayUnion(uid),
          rsvpNo: arrayRemove(uid),
        });
        if (!alreadyYes) {
          tx.update(voterRef, {
            points: voterData.points + (eventData.pointReward || 0),
            lastEventRsvpId: eventId,
          });
          return { pointsAwarded: eventData.pointReward || 0 };
        }
        return { pointsAwarded: 0 };
      } else {
        tx.update(eventRef, {
          rsvpNo: arrayUnion(uid),
          rsvpYes: arrayRemove(uid),
        });
        return { pointsAwarded: 0 };
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitAspiration(
  voter: VoterDoc,
  message: string
): Promise<void> {
  const path = 'aspirations';
  try {
    await addDoc(collection(db, path), {
      uid: voter.uid,
      voterName: clampStr(voter.fullName, 120),
      region: clampStr(voter.region, 120),
      message: clampStr(message, 1500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==========================================
// SUPERADMIN SUBSCRIPTIONS & MUTATIONS
// ==========================================

export function subscribeAllVoters(
  onData: (items: VoterDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'voters';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const loyaltyVoters = snap.docs
        .map((d) => d.data() as VoterDoc)
        .filter((v) => Boolean(v && v.uid && v.fullName));
      onData(loyaltyVoters);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeActivityLogs(
  onData: (items: ActivityLogDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'activity_logs';
  const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLogDoc, 'id'>) })));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeAllClaims(
  onData: (items: RewardClaimDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'reward_claims';
  const q = query(collection(db, path), orderBy('claimedAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RewardClaimDoc, 'id'>) })));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeAllAspirations(
  onData: (items: AspirationDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'aspirations';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AspirationDoc, 'id'>) })));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function createEventAdmin(input: {
  title: string;
  partyName: string;
  region: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  eventDate: string;
  description?: string;
  eventStatus?: 'Akan Datang' | 'Berlangsung' | 'Selesai';
  pointReward: number;
  address: string;
  lat: number;
  lng: number;
  createdByName?: string;
  createdByRole?: string;
}): Promise<void> {
  const path = 'events';
  const payload: Record<string, unknown> = {
    title: clampStr(input.title, 160),
    partyName: clampStr(input.partyName, 120),
    region: clampStr(input.region, 160),
    eventDate: clampStr(input.eventDate, 60),
    pointReward: Math.max(0, Math.min(10000, Math.round(Number(input.pointReward) || 0))),
    address: clampStr(input.address, 300),
    lat: Number(input.lat),
    lng: Number(input.lng),
    rsvpYes: [],
    rsvpNo: [],
    createdAt: serverTimestamp(),
  };
  if (input.kota?.trim()) payload.kota = clampStr(input.kota, 120);
  if (input.kecamatan?.trim()) payload.kecamatan = clampStr(input.kecamatan, 120);
  if (input.kelurahan?.trim()) payload.kelurahan = clampStr(input.kelurahan, 120);
  if (input.description?.trim()) payload.description = clampStr(input.description, 1200);
  if (input.eventStatus) payload.eventStatus = input.eventStatus;
  if (input.createdByName?.trim()) payload.createdByName = clampStr(input.createdByName, 120);
  if (input.createdByRole?.trim()) payload.createdByRole = clampStr(input.createdByRole, 40);

  try {
    await addDoc(collection(db, path), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEventAdmin(
  eventId: string,
  input: {
    title: string;
    partyName: string;
    region: string;
    kota?: string;
    kecamatan?: string;
    kelurahan?: string;
    eventDate: string;
    description?: string;
    eventStatus?: 'Akan Datang' | 'Berlangsung' | 'Selesai';
    pointReward: number;
    address: string;
    lat: number;
    lng: number;
  }
): Promise<void> {
  const path = `events/${eventId}`;
  const patch: Record<string, unknown> = {
    title: clampStr(input.title, 160),
    partyName: clampStr(input.partyName, 120),
    region: clampStr(input.region, 160),
    eventDate: clampStr(input.eventDate, 60),
    pointReward: Math.max(0, Math.min(10000, Math.round(Number(input.pointReward) || 0))),
    address: clampStr(input.address, 300),
    lat: Number(input.lat),
    lng: Number(input.lng),
    kota: clampStr(input.kota, 120),
    kecamatan: clampStr(input.kecamatan, 120),
    kelurahan: clampStr(input.kelurahan, 120),
    description: clampStr(input.description, 1200),
    eventStatus: input.eventStatus || 'Akan Datang',
  };
  try {
    await updateDoc(doc(db, 'events', eventId), patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateEventStatusAdmin(
  eventId: string,
  eventStatus: 'Akan Datang' | 'Berlangsung' | 'Selesai'
): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await updateDoc(doc(db, 'events', eventId), { eventStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEventAdmin(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createRewardAdmin(input: {
  itemName: string;
  pointCost: number;
  stock: number;
  description: string;
  imageUrl?: string;
  iconKey?: string;
}): Promise<void> {
  const path = 'rewards';
  const payload: Record<string, unknown> = {
    itemName: clampStr(input.itemName, 140),
    pointCost: Math.max(1, Math.min(1000000, Math.round(Number(input.pointCost) || 1))),
    stock: Math.max(0, Math.min(1000000, Math.round(Number(input.stock) || 0))),
    description: clampStr(input.description, 500),
    createdAt: serverTimestamp(),
  };
  if (input.imageUrl?.trim()) payload.imageUrl = input.imageUrl.trim().slice(0, 350000);
  if (input.iconKey?.trim()) payload.iconKey = clampStr(input.iconKey, 40);

  try {
    await addDoc(collection(db, path), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateRewardAdmin(
  rewardId: string,
  input: {
    itemName: string;
    pointCost: number;
    stock: number;
    description: string;
    imageUrl?: string;
    iconKey?: string;
  }
): Promise<void> {
  const path = `rewards/${rewardId}`;
  const patch: Record<string, unknown> = {
    itemName: clampStr(input.itemName, 140),
    pointCost: Math.max(1, Math.min(1000000, Math.round(Number(input.pointCost) || 1))),
    stock: Math.max(0, Math.min(1000000, Math.round(Number(input.stock) || 0))),
    description: clampStr(input.description, 500),
    imageUrl: (input.imageUrl || '').trim().slice(0, 350000),
    iconKey: clampStr(input.iconKey || 'gift', 40),
  };
  try {
    await updateDoc(doc(db, 'rewards', rewardId), patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRewardAdmin(rewardId: string): Promise<void> {
  const path = `rewards/${rewardId}`;
  try {
    await deleteDoc(doc(db, 'rewards', rewardId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function redeemRelawanRewardAtomic(
  relawan: {
    id: string;
    nama: string;
    noHp?: string;
    wilayah?: string;
    kota?: string;
    kecamatan?: string;
    kelurahan?: string;
    points?: number;
  },
  reward: RewardDoc
): Promise<{ newPoints: number; claimId: string }> {
  const path = 'reward_claims';
  const wilayahLabel = [
    relawan.kelurahan ? `Kel. ${relawan.kelurahan.replace(/^kel\.?\s*/i, '')}` : '',
    relawan.kecamatan ? `Kec. ${relawan.kecamatan.replace(/^kec\.?\s*/i, '')}` : '',
    relawan.kota || '',
  ]
    .filter(Boolean)
    .join(', ') || relawan.wilayah || '-';

  try {
    return await runTransaction(db, async (tx) => {
      const userRef = doc(db, 'user_accounts', relawan.id);
      const rewardRef = doc(db, 'rewards', reward.id);

      const [userSnap, rewardSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(rewardRef),
      ]);

      if (!userSnap.exists()) {
        throw new Error('Akun Relawan tidak ditemukan di database.');
      }
      if (!rewardSnap.exists()) {
        throw new Error('Hadiah pada katalog tidak ditemukan.');
      }

      const freshUser = userSnap.data() as { points?: number; nama?: string; noHp?: string };
      const freshReward = rewardSnap.data() as Omit<RewardDoc, 'id'>;
      const currentPoints = typeof freshUser.points === 'number' ? freshUser.points : 0;

      if (freshReward.stock <= 0) {
        throw new Error('Maaf, stok reward ini sudah habis.');
      }
      if (currentPoints < freshReward.pointCost) {
        const kurang = freshReward.pointCost - currentPoints;
        throw new Error(`Poin Anda belum cukup (kurang ${kurang.toLocaleString('id-ID')} Poin).`);
      }

      const newPoints = currentPoints - freshReward.pointCost;
      const claimRef = doc(collection(db, 'reward_claims'));

      tx.update(userRef, { points: newPoints });
      tx.update(rewardRef, { stock: freshReward.stock - 1 });
      tx.set(claimRef, {
        uid: relawan.id,
        voterName: clampStr(freshUser.nama || relawan.nama, 120),
        phone: clampStr(freshUser.noHp || relawan.noHp || '-', 30),
        rewardId: reward.id,
        itemName: clampStr(freshReward.itemName, 140),
        pointUsed: freshReward.pointCost,
        status: 'MENUNGGU',
        accountType: 'relawan',
        userRole: 'Relawan',
        wilayah: clampStr(wilayahLabel, 160),
        claimedAt: serverTimestamp(),
      });

      return { newPoints, claimId: claimRef.id };
    });
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('stok') ||
      error.message.includes('Poin Anda') ||
      error.message.includes('tidak ditemukan')
    )) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function processRewardClaimAdmin(
  claim: RewardClaimDoc,
  nextStatus: 'DISETUJUI' | 'DITOLAK' | 'SELESAI',
  processedBy: string,
  note?: string
): Promise<{ refundedPoints: number }> {
  const path = `reward_claims/${claim.id}`;
  try {
    return await runTransaction(db, async (tx) => {
      const claimRef = doc(db, 'reward_claims', claim.id);
      const claimSnap = await tx.get(claimRef);
      if (!claimSnap.exists()) {
        throw new Error('Data pengajuan klaim tidak ditemukan.');
      }
      const freshClaim = claimSnap.data() as Omit<RewardClaimDoc, 'id'>;
      if (freshClaim.status === 'SELESAI' || freshClaim.status === 'DISERAHKAN' || freshClaim.status === 'DITOLAK') {
        throw new Error('Klaim ini sudah selesai diproses sebelumnya.');
      }

      const updatePayload: Record<string, unknown> = {
        status: nextStatus,
        processedBy: clampStr(processedBy, 120),
      };
      if (note?.trim()) {
        updatePayload.note = clampStr(note, 300);
      }

      let refundedPoints = 0;

      if (nextStatus === 'DITOLAK') {
        // Read user account & reward BEFORE writes inside transaction
        const userAccountRef = doc(db, 'user_accounts', freshClaim.uid);
        const rewardRef = doc(db, 'rewards', freshClaim.rewardId);
        const voterRef = doc(db, 'voters', freshClaim.uid);

        const [userAccSnap, rewardSnap, voterSnap] = await Promise.all([
          tx.get(userAccountRef),
          tx.get(rewardRef),
          freshClaim.accountType === 'relawan' ? Promise.resolve(null) : tx.get(voterRef),
        ]);

        tx.update(claimRef, updatePayload);

        if (userAccSnap.exists()) {
          const curPts = Number((userAccSnap.data() as { points?: number }).points || 0);
          tx.update(userAccountRef, { points: curPts + freshClaim.pointUsed });
          refundedPoints = freshClaim.pointUsed;
        } else if (voterSnap && voterSnap.exists()) {
          const curPts = Number((voterSnap.data() as { points?: number }).points || 0);
          tx.update(voterRef, { points: curPts + freshClaim.pointUsed });
          refundedPoints = freshClaim.pointUsed;
        }

        if (rewardSnap.exists()) {
          const curStock = Number((rewardSnap.data() as { stock?: number }).stock || 0);
          tx.update(rewardRef, { stock: curStock + 1 });
        }
      } else {
        tx.update(claimRef, updatePayload);
      }

      return { refundedPoints };
    });
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('sudah selesai') ||
      error.message.includes('tidak ditemukan')
    )) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createCalegInfoAdmin(input: {
  calegName: string;
  partyName: string;
  region: string;
  description: string;
}): Promise<void> {
  const path = 'caleg_info';
  try {
    await addDoc(collection(db, path), {
      calegName: clampStr(input.calegName, 120),
      partyName: clampStr(input.partyName, 120),
      region: clampStr(input.region, 120),
      description: clampStr(input.description, 1500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCalegInfoAdmin(infoId: string): Promise<void> {
  const path = `caleg_info/${infoId}`;
  try {
    await deleteDoc(doc(db, 'caleg_info', infoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function markClaimDiserahkanAdmin(claimId: string): Promise<void> {
  const path = `reward_claims/${claimId}`;
  try {
    await updateDoc(doc(db, 'reward_claims', claimId), {
      status: 'SELESAI',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Re-export setDoc cleanly if needed by utilities
export { setDoc };

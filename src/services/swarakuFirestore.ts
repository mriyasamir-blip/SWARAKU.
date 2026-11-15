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
    return { appliedReferralBonus: Boolean(referrerUid) };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `voters/${uid}`);
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
      onData(snap.docs.map((d) => d.data() as VoterDoc));
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
  eventDate: string;
  pointReward: number;
  address: string;
  lat: number;
  lng: number;
}): Promise<void> {
  const path = 'events';
  try {
    await addDoc(collection(db, path), {
      title: clampStr(input.title, 160),
      partyName: clampStr(input.partyName, 120),
      region: clampStr(input.region, 120),
      eventDate: clampStr(input.eventDate, 60),
      pointReward: Math.max(0, Math.min(10000, Math.round(Number(input.pointReward) || 0))),
      address: clampStr(input.address, 300),
      lat: Number(input.lat),
      lng: Number(input.lng),
      rsvpYes: [],
      rsvpNo: [],
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
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
}): Promise<void> {
  const path = 'rewards';
  try {
    await addDoc(collection(db, path), {
      itemName: clampStr(input.itemName, 140),
      pointCost: Math.max(1, Math.min(1000000, Math.round(Number(input.pointCost) || 1))),
      stock: Math.max(0, Math.min(1000000, Math.round(Number(input.stock) || 0))),
      description: clampStr(input.description, 400),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
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
      status: 'DISERAHKAN',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Re-export setDoc cleanly if needed by utilities
export { setDoc };

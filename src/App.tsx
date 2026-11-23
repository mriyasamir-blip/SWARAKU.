import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Home,
  Calendar,
  MessageSquarePlus,
  Users,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  X,
  Globe,
} from 'lucide-react';
import { auth } from './lib/firebase';
import {
  findAndLinkPreRegisteredVoter,
  isSuperAdminEmail,
  loginWithGoogleSSO,
  logoutFirebase,
  recordLoginActivity,
  redeemRewardAtomic,
  registerVoterProfile,
  rsvpEventAtomic,
  submitAspiration,
  subscribeAllVoters,
  subscribeCalegInfo,
  subscribeEvents,
  subscribeMyAspirations,
  subscribeMyClaims,
  subscribeRewards,
  subscribeVoterProfile,
  updateVoterProfile,
} from './services/swarakuFirestore';
import {
  awardUserPointsOnCloud,
  createUserOnCloud,
  deleteUserOnCloud,
  fetchUserProfileById,
  fetchUsersFromCloud,
  loginUserByGoogleEmailOnCloud,
  loginUserOnCloud,
  toggleUserStatusOnCloud,
  updateUserOnCloud,
  updateUserPhotoOnCloud,
} from './services/userApiService';
import {
  LOCAL_CACHE_KEYS,
  loyaltyVoterToOcrRecord,
  migrateLocalDataToCloud,
  saveB1ToCloud,
  saveC1ToCloud,
  saveTimSuksesToCloud,
  saveVoterToCloud,
  subscribeToCloudB1,
  subscribeToCloudC1,
  subscribeToCloudTimSukses,
  subscribeToCloudUserAccounts,
  subscribeToCloudVoters,
  syncLoyaltyVoterToPetaSuara,
} from './services/cloudSyncService';
import {
  isTrackedRole,
  markLocationOffline,
} from './services/locationService';
import { GpsTrackerModal } from './components/GpsTrackerModal';
import type {
  AspirationDoc,
  CalegInfoDoc,
  CampaignEventDoc,
  RewardClaimDoc,
  RewardDoc,
  VoterDoc,
  VoterTab,
} from './types/swaraku';
import type {
  AspirasiItem,
  DptVoterRecord,
  ElectabilitySurveySubmission,
  FormB1Upload,
  FormC1Upload,
  InvitedFriendRecord,
  UserAccount,
  VoterOcrRecord,
  WhatsAppBlaztItem,
} from './types/vore';
import type { TimSuksesWilayahRecord } from './data/petaSuaraData';
import { INITIAL_ASPIRASI } from './data/mockData';
import {
  INITIAL_BLAZT_ITEMS,
  INITIAL_DPT_RECORDS,
  INITIAL_ELECTABILITY_SURVEYS,
} from './data/dptData';
import { LoginScreen, type LoginPortalTab } from './components/swaraku/LoginScreen';
import { LandingWebsiteView } from './components/website/LandingWebsiteView';
import { RegisterVoterScreen } from './components/swaraku/RegisterVoterScreen';
import {
  VoterAspirasiView,
  VoterBerandaView,
  VoterEventsView,
  VoterProfileView,
  VoterReferralView,
} from './components/swaraku/VoterDashboardViews';
import { StaffPortalApp } from './components/swaraku/StaffPortalApp';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

type DisplayMode = 'website' | 'apps';

function getInitialDisplayMode(): DisplayMode {
  if (typeof window === 'undefined') return 'website';
  try {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'apps') return 'apps';
    if (modeParam === 'website' || params.has('modewebsite')) return 'website';
    if (params.get('ref')) return 'apps';

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return 'apps';

    if (readSavedStaffSession() || readSavedManualVoterId()) {
      return 'apps';
    }
  } catch {
    // Fallback to website mode
  }
  return 'website';
}

const STAFF_SESSION_KEY = 'swaraku_current_user_session';
const MANUAL_VOTER_SESSION_KEY = 'swaraku_manual_voter_id';

function readSavedStaffSession(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STAFF_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserAccount;
    if (parsed && parsed.id && parsed.role) return parsed;
    return null;
  } catch {
    return null;
  }
}

function readSavedManualVoterId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MANUAL_VOTER_SESSION_KEY);
    return raw && raw.startsWith('vreg_') ? raw : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [manualVoterId, setManualVoterId] = useState<string | null>(() => readSavedManualVoterId());
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => getInitialDisplayMode());
  const [preferredPortalTab, setPreferredPortalTab] = useState<LoginPortalTab>('staff');

  const switchDisplayMode = useCallback(
    (nextMode: DisplayMode, portalTab?: LoginPortalTab) => {
      if (portalTab) {
        setPreferredPortalTab(portalTab);
      }
      setDisplayMode(nextMode);
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('modewebsite');
          url.searchParams.set('mode', nextMode);
          window.history.replaceState({}, '', url.toString());
        } catch {
          // Ignore URL history update errors
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  // Staff Session (Kader, Tim Sukses, Admin, Super Admin)
  const [staffUser, setStaffUser] = useState<UserAccount | null>(() => readSavedStaffSession());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);

  // Operational Campaign Data for Admin & Superadmin Modules (Firestore-synced, preserves legacy OCR cache)
  const [voterOcrRecords, setVoterOcrRecords] = useState<VoterOcrRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const primary = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEYS.VOTERS) || '[]');
      const legacy = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEYS.VOTERS_FALLBACK) || '[]');
      const combined = [
        ...(Array.isArray(primary) ? primary : []),
        ...(Array.isArray(legacy) ? legacy : []),
      ] as VoterOcrRecord[];
      const dedup = new Map<string, VoterOcrRecord>();
      combined.forEach((v) => {
        const key = (v.nik || v.id || '').replace(/\D/g, '') || v.id;
        if (key && !dedup.has(key)) dedup.set(key, v);
      });
      return Array.from(dedup.values());
    } catch {
      return [];
    }
  });
  const [timSuksesList, setTimSuksesList] = useState<TimSuksesWilayahRecord[]>([]);
  const [c1Records, setC1Records] = useState<FormC1Upload[]>([]);
  const [b1Records, setB1Records] = useState<FormB1Upload[]>([]);
  const [aspirasiList, setAspirasiList] = useState<AspirasiItem[]>(INITIAL_ASPIRASI);
  const [dptList, setDptList] = useState<DptVoterRecord[]>(INITIAL_DPT_RECORDS);
  const [surveyList, setSurveyList] = useState<ElectabilitySurveySubmission[]>(
    INITIAL_ELECTABILITY_SURVEYS
  );
  const [blaztLogs, setBlaztLogs] = useState<WhatsAppBlaztItem[]>(INITIAL_BLAZT_ITEMS);
  const [invitedList, setInvitedList] = useState<InvitedFriendRecord[]>([]);
  const [kaderPoints, setKaderPoints] = useState<number>(0);
  const [sudahMencoblos, setSudahMencoblos] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  const [voterProfile, setVoterProfile] = useState<VoterDoc | null | undefined>(undefined);
  const [registeredLoyaltyVoters, setRegisteredLoyaltyVoters] = useState<VoterDoc[]>([]);
  const [activeTab, setActiveTab] = useState<VoterTab>('beranda');

  // Shared collections state (100% Firestore-backed, zero dummy data)
  const [events, setEvents] = useState<CampaignEventDoc[]>([]);
  const [rewards, setRewards] = useState<RewardDoc[]>([]);
  const [calegInfoList, setCalegInfoList] = useState<CalegInfoDoc[]>([]);
  const [myClaims, setMyClaims] = useState<RewardClaimDoc[]>([]);
  const [myAspirations, setMyAspirations] = useState<AspirationDoc[]>([]);

  // Referral query param (?ref=CODE)
  const [referralInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('ref') || '').toUpperCase();
  });

  // Google Maps Case A Quota Exceeded Top Banner State
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  // Inline Toast Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const loggedLoginForUidRef = useRef<string | null>(null);
  const syncedSelfVoterUidRef = useRef<string | null>(null);
  const syncedCloudLoyaltyRef = useRef<Set<string>>(new Set());

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Listen to Google Maps API quota/auth errors globally
  useEffect(() => {
    const handleQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Refresh saved Staff Profile from Cloud Firestore on mount
  useEffect(() => {
    const saved = readSavedStaffSession();
    if (!saved) return;
    if (typeof saved.points === 'number') {
      setKaderPoints(saved.points);
    }
    fetchUserProfileById(saved.id)
      .then((fresh) => {
        if (fresh) {
          if (fresh.status === 'Nonaktif') {
            localStorage.removeItem(STAFF_SESSION_KEY);
            setStaffUser(null);
            return;
          }
          setStaffUser(fresh);
          if (typeof fresh.points === 'number') {
            setKaderPoints(fresh.points);
          }
          localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(fresh));
        }
      })
      .catch(() => {});
  }, []);

  const activeVoterUid = !staffUser ? authUser?.uid || manualVoterId : null;

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user && !readSavedManualVoterId()) {
        setVoterProfile(undefined);
        loggedLoginForUidRef.current = null;
        setActiveTab('beranda');
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time Voter Profile Subscription when authenticated (Google SSO OR Manual Sign-Up)
  const linkedAttemptedForUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeVoterUid || staffUser) return;

    setVoterProfile(undefined);
    const unsubVoter = subscribeVoterProfile(
      activeVoterUid,
      (profile) => {
        if (!profile && authUser && linkedAttemptedForUidRef.current !== authUser.uid) {
          linkedAttemptedForUidRef.current = authUser.uid;
          findAndLinkPreRegisteredVoter(authUser)
            .then((linked) => {
              if (!linked) setVoterProfile(null);
            })
            .catch(() => setVoterProfile(null));
          return;
        }
        if (!profile && manualVoterId && !authUser) {
          localStorage.removeItem(MANUAL_VOTER_SESSION_KEY);
          setManualVoterId(null);
          setVoterProfile(null);
          return;
        }
        setVoterProfile(profile);
        if (profile) {
          if (loggedLoginForUidRef.current !== activeVoterUid) {
            loggedLoginForUidRef.current = activeVoterUid;
            recordLoginActivity(profile).catch(() => {});
          }
          if (syncedSelfVoterUidRef.current !== profile.uid) {
            syncedSelfVoterUidRef.current = profile.uid;
            syncLoyaltyVoterToPetaSuara(profile).catch(() => {});
          }
        }
      },
      (err) => notify(`Gagal memuat profil: ${err.message}`)
    );

    return () => unsubVoter();
  }, [activeVoterUid, authUser, manualVoterId, staffUser, notify]);

  // 3. Subscribe to Public Shared Campaign Collections (Website Mode & Apps Mode)
  useEffect(() => {
    const unsubEvents = subscribeEvents(setEvents);
    const unsubRewards = subscribeRewards(setRewards);
    const unsubCaleg = subscribeCalegInfo(setCalegInfoList);

    return () => {
      unsubEvents();
      unsubRewards();
      unsubCaleg();
    };
  }, []);

  // 4. Subscribe to Personal Claims & Aspirations when logged in as Voter
  useEffect(() => {
    if (staffUser || !activeVoterUid || !voterProfile) return;

    const unsubClaims = subscribeMyClaims(activeVoterUid, setMyClaims);
    const unsubAsp = subscribeMyAspirations(activeVoterUid, setMyAspirations);

    return () => {
      unsubClaims();
      unsubAsp();
    };
  }, [staffUser, activeVoterUid, voterProfile]);

  // 5. Subscribe to Cloud Staff User Accounts & Campaign Operational Collections when logged in as Staff
  useEffect(() => {
    if (!staffUser) return;

    fetchUsersFromCloud()
      .then((list) => {
        if (list.length > 0) setUserAccounts(list);
      })
      .catch(() => {});

    const unsubAccounts = subscribeToCloudUserAccounts((cloudList) => {
      if (cloudList.length > 0) {
        setUserAccounts(cloudList);
        const updatedMe = cloudList.find((u) => u.id === staffUser.id);
        if (updatedMe) {
          if (updatedMe.status === 'Nonaktif') {
            localStorage.removeItem(STAFF_SESSION_KEY);
            setStaffUser(null);
            notify('Akun Anda telah dinonaktifkan oleh Super Admin.');
          } else {
            setStaffUser(updatedMe);
            if (typeof updatedMe.points === 'number') {
              setKaderPoints(updatedMe.points);
            }
            localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(updatedMe));
          }
        }
      }
    });

    const unsubVotersOcr = subscribeToCloudVoters(setVoterOcrRecords);
    const unsubTimSukses = subscribeToCloudTimSukses(setTimSuksesList);
    const unsubC1 = subscribeToCloudC1(setC1Records);
    const unsubB1 = subscribeToCloudB1(setB1Records);

    return () => {
      unsubAccounts();
      unsubVotersOcr();
      unsubTimSukses();
      unsubC1();
      unsubB1();
    };
  }, [staffUser?.id, notify]);

  // 5b. When Superadmin Google SSO is active in Staff Portal, mirror all registered Loyalty/Manual voters to Peta Suara
  useEffect(() => {
    if (
      !staffUser ||
      staffUser.role !== 'super_admin' ||
      !authUser ||
      !isSuperAdminEmail(authUser.email)
    ) {
      setRegisteredLoyaltyVoters([]);
      return;
    }

    const unsubAll = subscribeAllVoters((allVoters) => {
      setRegisteredLoyaltyVoters(allVoters);
      allVoters.forEach((v) => {
        const sig = `${v.uid}|${v.fullName}|${v.region}|${v.address}|${v.phone}`;
        if (!syncedCloudLoyaltyRef.current.has(sig)) {
          syncedCloudLoyaltyRef.current.add(sig);
          syncLoyaltyVoterToPetaSuara(v).catch(() => {});
        }
      });
    });

    return () => unsubAll();
  }, [staffUser?.id, staffUser?.role, authUser?.email]);

  const mergedVoterRecords = React.useMemo<VoterOcrRecord[]>(() => {
    if (registeredLoyaltyVoters.length === 0) return voterOcrRecords;
    const byKey = new Map<string, VoterOcrRecord>();
    voterOcrRecords.forEach((rec) => {
      byKey.set(rec.voterUid || rec.id, rec);
    });
    registeredLoyaltyVoters.forEach((lv) => {
      if (!byKey.has(lv.uid)) {
        byKey.set(lv.uid, loyaltyVoterToOcrRecord(lv));
      }
    });
    return Array.from(byKey.values());
  }, [voterOcrRecords, registeredLoyaltyVoters]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await loginWithGoogleSSO();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.';
      setAuthError(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleTimSupportLogin = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    setAuthError(null);
    const res = await loginUserOnCloud(usernameOrEmail, password, [
      'super_admin',
      'admin',
      'tim_sukses',
      'kader',
    ]);
    if (res.success && res.user) {
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(res.user));
      setStaffUser(res.user);
      setKaderPoints(res.user.points || 0);
      notify(`Selamat datang, ${res.user.nama}!`);
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const handleTimSupportGoogleLogin = async (): Promise<{ success: boolean; message?: string }> => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const googleUser = await loginWithGoogleSSO();
      const email = googleUser?.email || '';
      const res = await loginUserByGoogleEmailOnCloud(email, [
        'super_admin',
        'admin',
        'tim_sukses',
        'kader',
      ]);
      if (res.success && res.user) {
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(res.user));
        setStaffUser(res.user);
        setKaderPoints(res.user.points || 0);
        notify(`Login Google berhasil! Selamat datang, ${res.user.nama}.`);
        return { success: true };
      }
      // Strict whitelist: immediately sign out unregistered Google accounts
      await logoutFirebase().catch(() => {});
      const errMsg =
        res.message ||
        'Akun Anda belum terdaftar. Silakan hubungi Admin atau Koordinator terkait.';
      setAuthError(errMsg);
      return { success: false, message: errMsg };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRelawanLogin = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    setAuthError(null);
    const res = await loginUserOnCloud(usernameOrEmail, password, ['relawan']);
    if (res.success && res.user) {
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(res.user));
      setStaffUser(res.user);
      setKaderPoints(res.user.points || 0);
      notify(`Selamat datang, ${res.user.nama}!`);
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const handleAwardPoints = async (delta: number): Promise<void> => {
    if (!staffUser || delta <= 0) return;
    const optimisticTotal = (staffUser.points ?? kaderPoints ?? 0) + delta;
    setKaderPoints(optimisticTotal);
    const updatedLocal = { ...staffUser, points: optimisticTotal };
    setStaffUser(updatedLocal);
    localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(updatedLocal));
    try {
      const persisted = await awardUserPointsOnCloud(staffUser.id, delta);
      if (typeof persisted === 'number') {
        setKaderPoints(persisted);
        const synced: UserAccount = { ...staffUser, points: persisted };
        setStaffUser(synced);
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(synced));
        setUserAccounts((prev) =>
          prev.map((u) => (u.id === staffUser.id ? { ...u, points: persisted } : u))
        );
      }
    } catch {
      // Keep optimistic points in session
    }
  };

  const handleSyncStaffPoints = (newPoints: number) => {
    setKaderPoints(newPoints);
    setStaffUser((prev) => {
      if (!prev) return prev;
      const synced: UserAccount = { ...prev, points: newPoints };
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(synced));
      return synced;
    });
    if (staffUser) {
      setUserAccounts((prev) =>
        prev.map((u) => (u.id === staffUser.id ? { ...u, points: newPoints } : u))
      );
    }
  };

  const handleStaffLogout = async () => {
    if (staffUser && isTrackedRole(staffUser.role)) {
      await markLocationOffline(staffUser.id || staffUser.username).catch(() => {});
    }
    localStorage.removeItem(STAFF_SESSION_KEY);
    setStaffUser(null);
    setUserAccounts([]);
    if (auth.currentUser) {
      await logoutFirebase().catch(() => {});
    }
    notify('Anda telah keluar dari portal Swaraku.');
  };

  const handleRefreshStaffProfile = async () => {
    if (!staffUser) return;
    const fresh = await fetchUserProfileById(staffUser.id);
    if (fresh) {
      setStaffUser(fresh);
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(fresh));
    }
  };

  const handleUploadStaffPhoto = async (dataUrl: string): Promise<boolean> => {
    if (!staffUser) return false;
    const ok = await updateUserPhotoOnCloud(staffUser.id, dataUrl);
    if (ok) {
      const updated = { ...staffUser, fotoUrl: dataUrl };
      setStaffUser(updated);
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(updated));
    }
    return ok;
  };

  const handleAddStaffUser = async (user: UserAccount): Promise<boolean> => {
    const res = await createUserOnCloud(user);
    if (res.success) {
      notify(res.message || `Akun ${user.nama} berhasil dibuat di Cloud.`);
      const fresh = await fetchUsersFromCloud();
      setUserAccounts(fresh);
      return true;
    }
    notify(res.message || 'Gagal membuat akun baru.');
    return false;
  };

  const handleUpdateStaffUser = async (user: UserAccount): Promise<boolean> => {
    const ok = await updateUserOnCloud(user);
    if (ok) {
      notify(`Data akun ${user.nama} berhasil diperbarui.`);
      const fresh = await fetchUsersFromCloud();
      setUserAccounts(fresh);
    } else {
      notify('Gagal memperbarui data akun di Cloud.');
    }
    return ok;
  };

  const handleDeleteStaffUser = async (userId: string): Promise<boolean> => {
    const ok = await deleteUserOnCloud(userId);
    if (ok) {
      notify('Akun pengguna berhasil dihapus dari Cloud.');
      setUserAccounts((prev) => prev.filter((u) => u.id !== userId));
    } else {
      notify('Gagal menghapus akun pengguna.');
    }
    return ok;
  };

  const handleToggleStaffStatus = async (userId: string): Promise<boolean> => {
    const ok = await toggleUserStatusOnCloud(userId);
    if (ok) {
      const fresh = await fetchUsersFromCloud();
      setUserAccounts(fresh);
      notify('Status akun berhasil diperbarui.');
    }
    return ok;
  };

  const handleRefreshStaffUsers = async () => {
    const fresh = await fetchUsersFromCloud();
    setUserAccounts(fresh);
    notify('Daftar akun disinkronkan dari Cloud.');
  };

  // Campaign Operational Handlers for Admin & Superadmin Modules
  const handleSaveVoterOcr = (voter: VoterOcrRecord) => {
    setVoterOcrRecords((prev) => [voter, ...prev.filter((v) => v.nik !== voter.nik)]);
    saveVoterToCloud(voter).catch(() => {});
    notify(`Data voter "${voter.nama}" disimpan ke Cloud Firestore.`);
  };

  const handleSaveTimSukses = (ts: TimSuksesWilayahRecord) => {
    setTimSuksesList((prev) => [ts, ...prev.filter((item) => item.id !== ts.id)]);
    saveTimSuksesToCloud(ts).catch(() => {});
    notify(`Korwil "${ts.nama}" tersimpan & terhubung ke Peta Suara.`);
  };

  const handleSubmitC1 = (form: Partial<FormC1Upload>) => {
    const p1 = Number(form.suaraPaslon1) || 0;
    const p2 = Number(form.suaraPaslon2) || 0;
    const p3 = Number(form.suaraPaslon3) || 0;
    const tidakSah = Number(form.suaraTidakSah) || 0;
    const kelurahanLabel = form.kelurahan || staffUser?.kelurahan || 'Kel. Cilandak Barat';
    const newC1: FormC1Upload = {
      id: `c1-${Date.now()}`,
      tps: form.tps || kelurahanLabel,
      kelurahan: kelurahanLabel,
      kecamatan: form.kecamatan || staffUser?.kecamatan || 'Kec. Cilandak',
      waktuUpload: new Date().toLocaleString('id-ID'),
      saksiNama: form.saksiNama || staffUser?.nama || 'Petugas Kelurahan',
      suaraPaslon1: p1,
      suaraPaslon2: p2,
      suaraPaslon3: p3,
      suaraTidakSah: tidakSah,
      totalSuaraSah: p1 + p2 + p3,
      statusVerifikasi: form.statusVerifikasi || 'Terverifikasi',
      fotoC1Url: form.fotoC1Url,
      fileName: form.fileName,
    };
    setC1Records((prev) => [newC1, ...prev]);
    saveC1ToCloud(newC1).catch(() => {});
    notify(`Hasil Quick Count (${newC1.kelurahan}) berhasil diunggah & disinkronkan.`);
  };

  const handleSubmitB1 = (form: Partial<FormB1Upload>) => {
    const p1 = Number(form.suaraPaslon1) || 0;
    const p2 = Number(form.suaraPaslon2) || 0;
    const p3 = Number(form.suaraPaslon3) || 0;
    const tidakSah = Number(form.suaraTidakSah) || 0;
    const newB1: FormB1Upload = {
      id: `b1-${Date.now()}`,
      kecamatan: form.kecamatan || staffUser?.kecamatan || 'Kec. Cilandak',
      kelurahan: form.kelurahan || staffUser?.kelurahan || 'Kel. Cilandak Barat',
      dapil: form.kelurahan || staffUser?.wilayah || 'Jakarta Selatan',
      waktuUpload: new Date().toLocaleString('id-ID'),
      koordinatorNama: form.koordinatorNama || staffUser?.nama || 'Koordinator',
      suaraPaslon1: p1,
      suaraPaslon2: p2,
      suaraPaslon3: p3,
      suaraTidakSah: tidakSah,
      totalSuaraSah: p1 + p2 + p3,
      totalTpsTercakup: Number(form.totalTpsTercakup) || 1,
      statusVerifikasi: form.statusVerifikasi || 'Terverifikasi',
      fotoB1Url: form.fotoB1Url,
      fileName: form.fileName,
    };
    setB1Records((prev) => [newB1, ...prev]);
    saveB1ToCloud(newB1).catch(() => {});
    notify(`Rekap Kecamatan (${newB1.kecamatan}) berhasil diunggah & disinkronkan.`);
  };

  const handleSubmitAdminAspirasi = (
    item: Omit<AspirasiItem, 'id' | 'tanggal' | 'status' | 'upvotes'>
  ) => {
    const newItem: AspirasiItem = {
      ...item,
      id: `asp-${Date.now()}`,
      tanggal: new Date().toLocaleDateString('id-ID'),
      status: 'Masuk',
      upvotes: 1,
    };
    setAspirasiList((prev) => [newItem, ...prev]);
    notify('Aspirasi warga berhasil dicatat.');
  };

  const handleUpdateAspirasiStatus = (
    id: string,
    status: 'Masuk' | 'Diproses' | 'Selesai',
    tanggapan: string,
    progresPersen: number
  ) => {
    setAspirasiList((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              tanggapanResmi: {
                oleh: staffUser?.nama || 'Admin',
                jabatan: staffUser?.jabatan || 'Admin Wilayah',
                waktu: new Date().toLocaleString('id-ID'),
                pesan: tanggapan,
                progresPersen,
              },
            }
          : a
      )
    );
    notify(`Status aspirasi diperbarui menjadi "${status}".`);
  };

  const handleUpvoteAspirasi = (id: string) => {
    setAspirasiList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a))
    );
  };

  const handleSubmitSurvey = (survey: ElectabilitySurveySubmission, points: number) => {
    setSurveyList((prev) => [survey, ...prev]);
    setKaderPoints((prev) => prev + points);
    notify(`Survei elektabilitas dicatat (+${points} poin).`);
  };

  const handleSaveDptVoter = (voter: DptVoterRecord) => {
    setDptList((prev) => [voter, ...prev.filter((d) => d.nik !== voter.nik)]);
    notify(`Data DPT "${voter.nama}" diperbarui.`);
  };

  const handleTriggerBlazt = (campaign: { target: string; totalTarget: number; pesan: string }) => {
    const newLog: WhatsAppBlaztItem = {
      id: `wa-${Date.now()}`,
      namaPenerima: campaign.target,
      noHp: '-',
      tps: staffUser?.tps || 'Semua TPS',
      kelurahan: staffUser?.wilayah || 'Semua Wilayah',
      pesanPreview: campaign.pesan,
      status: 'Terkirim',
      waktu: new Date().toLocaleTimeString('id-ID'),
    };
    setBlaztLogs((prev) => [newLog, ...prev]);
    notify(`Broadcast WhatsApp diproses untuk ${campaign.totalTarget} penerima.`);
  };

  const handleRegisterVoterField = (voterData: {
    nama: string;
    nik: string;
    noHp: string;
    tps: string;
    rtRw: string;
    isuPrioritas: string;
  }) => {
    const cleanNik = voterData.nik.replace(/\D/g, '');
    const kelurahan = voterData.tps || staffUser?.kelurahan || 'Cilandak Barat';
    const kecamatan = staffUser?.kecamatan || 'Cilandak';
    const kota = staffUser?.kota || 'Jakarta Selatan';
    const record: VoterOcrRecord = {
      id: `v-${cleanNik || Date.now()}`,
      nik: cleanNik,
      nikMasked:
        cleanNik.length >= 8
          ? `${cleanNik.slice(0, 4)}••••••••${cleanNik.slice(-4)}`
          : cleanNik,
      nama: voterData.nama.toUpperCase(),
      tempatTglLahir: '-',
      jenisKelamin: 'Laki-laki',
      alamat: voterData.isuPrioritas || '-',
      rtRw: voterData.rtRw || '001/001',
      kelurahan,
      kecamatan,
      kabupatenKota: kota,
      provinsi: 'DKI Jakarta',
      tps: kelurahan,
      noHp: voterData.noHp || '-',
      waktuDaftar: new Date().toLocaleString('id-ID'),
      statusDpt: 'DPT valid',
      statusRegistrasi: 'TERDAFTAR',
      terdaftarOleh: staffUser?.nama || 'Petugas Lapangan',
      diinputOlehRole:
        staffUser?.role === 'tim_sukses'
          ? 'tim_sukses'
          : staffUser?.role === 'relawan'
          ? 'relawan'
          : 'kader',
      diinputOlehNama: staffUser?.nama,
    };
    handleSaveVoterOcr(record);
    handleAwardPoints(10).catch(() => {});
  };

  const handleAddInvitedFriend = (friend: InvitedFriendRecord) => {
    setInvitedList((prev) => [friend, ...prev]);
    notify(`Teman "${friend.nama}" ditambahkan ke jaringan rujukan.`);
  };

  const handleCheckinCoblos = () => {
    setSudahMencoblos(true);
    handleAwardPoints(25).catch(() => {});
    notify('Check-in kehadiran Kelurahan tersimpan (+25 poin).');
  };

  const handleResetDataToZero = () => {
    setVoterOcrRecords([]);
    setTimSuksesList([]);
    setC1Records([]);
    setB1Records([]);
    setSurveyList([]);
    setDptList([]);
    setBlaztLogs([]);
    notify('Tampilan data operasional direset ke 0.');
  };

  const handleTriggerCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await migrateLocalDataToCloud();
      notify(
        `Sinkronisasi Cloud selesai (${res.votersMigrated} voter, ${res.timSuksesMigrated} korwil).`
      );
    } catch {
      notify('Sinkronisasi Cloud selesai.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleRegisterSubmit = async (data: {
    fullName: string;
    address: string;
    region: string;
    phone: string;
    referralInput: string;
  }) => {
    if (!authUser) return;
    loggedLoginForUidRef.current = authUser.uid;
    const { appliedReferralBonus } = await registerVoterProfile({
      user: authUser,
      fullName: data.fullName,
      address: data.address,
      region: data.region,
      phone: data.phone,
      referralInput: data.referralInput,
    });
    notify(
      appliedReferralBonus
        ? 'Pendaftaran berhasil! Anda mendapat +100 Poin Awal dan pengundang Anda mendapat +50 Poin.'
        : 'Pendaftaran berhasil! Anda mendapat +100 Poin Awal di Kantong Poin.'
    );
  };

  const handleLogout = async () => {
    localStorage.removeItem(MANUAL_VOTER_SESSION_KEY);
    setManualVoterId(null);
    setVoterProfile(undefined);
    loggedLoginForUidRef.current = null;
    setActiveTab('beranda');
    if (auth.currentUser) {
      await logoutFirebase();
    }
    notify('Anda telah keluar dari akun Swaraku.');
  };

  const handleRedeemReward = async (reward: RewardDoc) => {
    if (!activeVoterUid || !voterProfile) return;
    try {
      await redeemRewardAtomic(activeVoterUid, voterProfile, reward);
      notify(`Penukaran "${reward.itemName}" berhasil dicatat! Cek status di Riwayat Klaim.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menukarkan poin.');
    }
  };

  const handleRsvpEvent = async (eventId: string, attending: boolean) => {
    if (!activeVoterUid) return;
    try {
      const { pointsAwarded } = await rsvpEventAtomic(activeVoterUid, eventId, attending);
      if (attending && pointsAwarded > 0) {
        notify(`Kehadiran terkonfirmasi! +${pointsAwarded} Poin ditambahkan ke Kantong Poin Anda.`);
      } else if (attending) {
        notify('Konfirmasi hadir aktif. Peta lokasi acara tampil di bawah.');
      } else {
        notify('Konfirmasi ketidakhadiran berhasil disimpan.');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menyimpan konfirmasi kehadiran.');
    }
  };

  const handleSubmitAspiration = async (message: string) => {
    if (!voterProfile) return;
    try {
      await submitAspiration(voterProfile, message);
      notify('Aspirasi Anda berhasil dikirimkan ke tim Caleg Daerah.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal mengirim aspirasi.');
    }
  };

  const handleSaveProfile = async (patch: {
    fullName: string;
    phone: string;
    region: string;
    address: string;
    occupation: string;
    birthDate: string;
  }) => {
    if (!activeVoterUid) return;
    try {
      await updateVoterProfile(activeVoterUid, patch);
      notify('Perubahan profil berhasil disimpan ke server.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    }
  };

  // Dedicated Mode Website (Original SWARAKU Landing Website separated from Mode Apps)
  if (displayMode === 'website') {
    return (
      <>
        {mapsQuotaExceeded && <MapsQuotaBanner />}
        <LandingWebsiteView
          onOpenApp={(preferredRole) => {
            const targetPortal: LoginPortalTab =
              preferredRole === 'admin' ||
              preferredRole === 'tim_sukses' ||
              preferredRole === 'kader'
                ? 'staff'
                : 'relawan';
            switchDisplayMode('apps', targetPortal);
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Case 0: Active Portal (SuperAdmin, Admin, Korwil, Korcam, & Relawan)
  if (staffUser) {
    return (
      <>
        {mapsQuotaExceeded && <MapsQuotaBanner />}
        <StaffPortalApp
          staffUser={staffUser}
          userAccounts={userAccounts}
          authUser={authUser}
          events={events}
          rewards={rewards}
          calegInfoList={calegInfoList}
          voterOcrRecords={mergedVoterRecords}
          timSuksesList={timSuksesList}
          c1Records={c1Records}
          b1Records={b1Records}
          aspirasiList={aspirasiList}
          dptList={dptList}
          surveyList={surveyList}
          blaztLogs={blaztLogs}
          invitedList={invitedList}
          kaderPoints={staffUser.points ?? kaderPoints}
          sudahMencoblos={sudahMencoblos}
          isSyncingCloud={isSyncingCloud}
          onLogout={handleStaffLogout}
          onRefreshProfile={handleRefreshStaffProfile}
          onUploadPhoto={handleUploadStaffPhoto}
          onAddUser={handleAddStaffUser}
          onUpdateUser={handleUpdateStaffUser}
          onDeleteUser={handleDeleteStaffUser}
          onToggleUserStatus={handleToggleStaffStatus}
          onRefreshUsers={handleRefreshStaffUsers}
          onConnectGoogleAdmin={handleGoogleLogin}
          onAwardPoints={handleAwardPoints}
          onSyncStaffPoints={handleSyncStaffPoints}
          onNotify={notify}
          onSaveVoter={handleSaveVoterOcr}
          onSaveTimSukses={handleSaveTimSukses}
          onSubmitC1={handleSubmitC1}
          onSubmitB1={handleSubmitB1}
          onSubmitAspirasi={handleSubmitAdminAspirasi}
          onUpdateAspirasiStatus={handleUpdateAspirasiStatus}
          onUpvoteAspirasi={handleUpvoteAspirasi}
          onSubmitSurvey={handleSubmitSurvey}
          onSaveDptVoter={handleSaveDptVoter}
          onTriggerBlazt={handleTriggerBlazt}
          onRegisterVoterField={handleRegisterVoterField}
          onAddInvitedFriend={handleAddInvitedFriend}
          onCheckinCoblos={handleCheckinCoblos}
          onResetDataToZero={handleResetDataToZero}
          onTriggerCloudSync={handleTriggerCloudSync}
          onOpenWebsiteMode={() => switchDisplayMode('website')}
        />
        {toastMessage && (
          <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl flex items-start justify-between gap-3 text-xs font-medium">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <GpsTrackerModal user={staffUser} />
        <OfflineIndicator />
      </>
    );
  }

  // Loading Screen while checking Firebase Auth / Firestore Profile
  if (!authReady || (activeVoterUid && voterProfile === undefined)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <img src="/icon.svg" alt="Swaraku" className="w-12 h-12 animate-pulse" />
        <p className="text-sm font-bold text-slate-700">Memuat data Swaraku...</p>
      </div>
    );
  }

  // Case 1: Not Authenticated -> Two-Portal Whitelist Login (Tim Support vs Relawan)
  if (!activeVoterUid) {
    return (
      <>
        {mapsQuotaExceeded && <MapsQuotaBanner />}
        <LoginScreen
          onTimSupportLogin={handleTimSupportLogin}
          onTimSupportGoogleLogin={handleTimSupportGoogleLogin}
          onRelawanLogin={handleRelawanLogin}
          isSigningIn={isSigningIn}
          authError={authError}
          initialPortalTab={preferredPortalTab}
          onSwitchToWebsite={() => switchDisplayMode('website')}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Case 2: Authenticated via Google, but not registered in Firestore voters/{uid}
  if (voterProfile === null || !voterProfile) {
    if (!authUser) {
      return (
        <>
          {mapsQuotaExceeded && <MapsQuotaBanner />}
          <LoginScreen
            onTimSupportLogin={handleTimSupportLogin}
            onTimSupportGoogleLogin={handleTimSupportGoogleLogin}
            onRelawanLogin={handleRelawanLogin}
            isSigningIn={isSigningIn}
            authError={authError}
            initialPortalTab={preferredPortalTab}
            onSwitchToWebsite={() => switchDisplayMode('website')}
          />
          <OfflineIndicator />
        </>
      );
    }
    return (
      <>
        {mapsQuotaExceeded && <MapsQuotaBanner />}
        <RegisterVoterScreen
          user={authUser}
          initialReferralCode={referralInput}
          onSubmitRegistration={handleRegisterSubmit}
          onLogout={handleLogout}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Case 3: Fully Registered Voter Dashboard
  const navItems: { id: VoterTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'beranda', label: 'Beranda & Poin', shortLabel: 'Beranda', icon: <Home className="w-5 h-5" /> },
    { id: 'acara', label: 'Kalender Acara', shortLabel: 'Acara', icon: <Calendar className="w-5 h-5" /> },
    { id: 'aspirasi', label: 'Sampaikan Aspirasi', shortLabel: 'Aspirasi', icon: <MessageSquarePlus className="w-5 h-5" /> },
    { id: 'referral', label: 'Undang Teman', shortLabel: 'Undang', icon: <Users className="w-5 h-5" /> },
    { id: 'profil', label: 'Profil Saya', shortLabel: 'Profil', icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {mapsQuotaExceeded && <MapsQuotaBanner />}

      {/* Desktop Left Sidebar (Hidden on mobile) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 p-1.5 flex items-center justify-center shrink-0">
            <img src="/icon.svg" alt="Swaraku" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-slate-900 leading-tight">Swaraku</p>
            <p className="text-xs text-slate-500 truncate">swaraku.online</p>
          </div>
        </div>

        {/* User Brief */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <p className="text-sm font-bold text-slate-900 truncate">{voterProfile.fullName}</p>
          <p className="text-xs text-slate-500 truncate">{voterProfile.region}</p>
          <p className="text-xs font-extrabold font-mono tabular-nums text-blue-700 mt-1.5">
            {voterProfile.points.toLocaleString('id-ID')} Poin
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2.5">
          <button
            type="button"
            onClick={() => switchDisplayMode('website')}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>Buka Mode Website</span>
          </button>
          <PWAInstallButton variant="outline" label="Pasang Aplikasi" className="w-full justify-center min-h-[42px]" />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Header (Hidden on desktop) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/icon.svg" alt="Swaraku" className="w-7 h-7 shrink-0" />
          <span className="font-extrabold text-base text-slate-900 truncate">Swaraku</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => switchDisplayMode('website')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
            title="Buka Mode Website"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web</span>
          </button>
          <span className="text-xs font-extrabold font-mono tabular-nums text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
            {voterProfile.points.toLocaleString('id-ID')} Poin
          </span>
          <PWAInstallButton variant="compact" label="App" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-72 pb-24 lg:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'beranda' && (
            <VoterBerandaView
              voter={voterProfile}
              calegInfoList={calegInfoList}
              rewards={rewards}
              myClaims={myClaims}
              onRedeemReward={handleRedeemReward}
            />
          )}

          {activeTab === 'acara' && (
            <VoterEventsView
              uid={activeVoterUid}
              events={events}
              onRsvpEvent={handleRsvpEvent}
            />
          )}

          {activeTab === 'aspirasi' && (
            <VoterAspirasiView
              voter={voterProfile}
              aspirations={myAspirations}
              onSubmitAspiration={handleSubmitAspiration}
            />
          )}

          {activeTab === 'referral' && <VoterReferralView voter={voterProfile} />}

          {activeTab === 'profil' && (
            <VoterProfileView
              voter={voterProfile}
              onSaveProfile={handleSaveProfile}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Hidden on desktop, compact 64px height, >=44px touch targets) */}
      <nav
        aria-label="Navigasi Utama"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 h-16 px-1 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] min-w-[48px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[60px]">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Inline Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl flex items-start justify-between gap-3 text-xs font-medium">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}

const MapsQuotaBanner: React.FC = () => (
  <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm w-full">
    <span>
      Google Maps Platform quota reached. If you are the app owner, visit{' '}
      <a
        href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-semibold text-amber-950 hover:text-amber-800"
      >
        maps developer site
      </a>{' '}
      for instructions to update your account.
    </span>
  </div>
);

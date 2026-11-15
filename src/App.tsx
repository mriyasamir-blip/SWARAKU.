import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Home,
  Calendar,
  MessageSquarePlus,
  Users,
  User as UserIcon,
  Shield,
  LogOut,
  CheckCircle2,
  X,
} from 'lucide-react';
import { auth } from './lib/firebase';
import {
  isSuperAdminEmail,
  loginWithGoogleSSO,
  logoutFirebase,
  recordLoginActivity,
  redeemRewardAtomic,
  registerVoterProfile,
  rsvpEventAtomic,
  submitAspiration,
  subscribeCalegInfo,
  subscribeEvents,
  subscribeMyAspirations,
  subscribeMyClaims,
  subscribeRewards,
  subscribeVoterProfile,
  updateVoterProfile,
} from './services/swarakuFirestore';
import {
  createUserOnCloud,
  deleteUserOnCloud,
  fetchUserProfileById,
  fetchUsersFromCloud,
  loginUserOnCloud,
  toggleUserStatusOnCloud,
  updateUserOnCloud,
  updateUserPhotoOnCloud,
} from './services/userApiService';
import { subscribeToCloudUserAccounts } from './services/cloudSyncService';
import type {
  AspirationDoc,
  CalegInfoDoc,
  CampaignEventDoc,
  RewardClaimDoc,
  RewardDoc,
  VoterDoc,
  VoterTab,
} from './types/swaraku';
import type { UserAccount } from './types/vore';
import { LoginScreen } from './components/swaraku/LoginScreen';
import { RegisterVoterScreen } from './components/swaraku/RegisterVoterScreen';
import {
  VoterAspirasiView,
  VoterBerandaView,
  VoterEventsView,
  VoterProfileView,
  VoterReferralView,
} from './components/swaraku/VoterDashboardViews';
import { SuperadminView } from './components/swaraku/SuperadminView';
import { StaffPortalApp } from './components/swaraku/StaffPortalApp';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

const STAFF_SESSION_KEY = 'swaraku_current_user_session';

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

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Staff Session (Kader, Tim Sukses, Admin, Super Admin)
  const [staffUser, setStaffUser] = useState<UserAccount | null>(() => readSavedStaffSession());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);

  const [voterProfile, setVoterProfile] = useState<VoterDoc | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<VoterTab>('beranda');

  // Shared collections state (100% Firestore-backed, zero dummy data)
  const [events, setEvents] = useState<CampaignEventDoc[]>([]);
  const [rewards, setRewards] = useState<RewardDoc[]>([]);
  const [calegInfoList, setCalegInfoList] = useState<CalegInfoDoc[]>([]);
  const [myClaims, setMyClaims] = useState<RewardClaimDoc[]>([]);
  const [myAspirations, setMyAspirations] = useState<AspirationDoc[]>([]);

  // Referral query param (?ref=CODE)
  const [referralInput, setReferralInput] = useState<string>(() => {
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
    fetchUserProfileById(saved.id)
      .then((fresh) => {
        if (fresh) {
          if (fresh.status === 'Nonaktif') {
            localStorage.removeItem(STAFF_SESSION_KEY);
            setStaffUser(null);
            return;
          }
          setStaffUser(fresh);
          localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(fresh));
        }
      })
      .catch(() => {});
  }, []);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        setVoterProfile(undefined);
        loggedLoginForUidRef.current = null;
        setActiveTab('beranda');
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time Voter Profile Subscription when authenticated (unless using Staff Portal)
  useEffect(() => {
    if (!authUser || staffUser) return;

    setVoterProfile(undefined);
    const unsubVoter = subscribeVoterProfile(
      authUser.uid,
      (profile) => {
        setVoterProfile(profile);
        if (profile && loggedLoginForUidRef.current !== authUser.uid) {
          loggedLoginForUidRef.current = authUser.uid;
          recordLoginActivity(profile).catch(() => {});
        }
      },
      (err) => notify(`Gagal memuat profil: ${err.message}`)
    );

    return () => unsubVoter();
  }, [authUser, staffUser, notify]);

  // 3. Subscribe to Shared Collections for registered Voter OR active Staff User
  useEffect(() => {
    const canViewCampaignData = Boolean(staffUser || (authUser && voterProfile));
    if (!canViewCampaignData) return;

    const unsubEvents = subscribeEvents(setEvents);
    const unsubRewards = subscribeRewards(setRewards);
    const unsubCaleg = subscribeCalegInfo(setCalegInfoList);

    return () => {
      unsubEvents();
      unsubRewards();
      unsubCaleg();
    };
  }, [staffUser, authUser, voterProfile]);

  // 4. Subscribe to Personal Claims & Aspirations when logged in as Voter
  useEffect(() => {
    if (staffUser || !authUser || !voterProfile) return;

    const unsubClaims = subscribeMyClaims(authUser.uid, setMyClaims);
    const unsubAsp = subscribeMyAspirations(authUser.uid, setMyAspirations);

    return () => {
      unsubClaims();
      unsubAsp();
    };
  }, [staffUser, authUser, voterProfile]);

  // 5. Subscribe to Cloud Staff User Accounts when logged in as Staff
  useEffect(() => {
    if (!staffUser) return;

    fetchUsersFromCloud().then((list) => {
      if (list.length > 0) setUserAccounts(list);
    }).catch(() => {});

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
            localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(updatedMe));
          }
        }
      }
    });

    return () => unsubAccounts();
  }, [staffUser?.id, notify]);

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

  const handleStaffLogin = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await loginUserOnCloud(usernameOrEmail, password);
    if (res.success && res.user) {
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(res.user));
      setStaffUser(res.user);
      notify(`Selamat datang, ${res.user.nama}!`);
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const handleStaffLogout = async () => {
    localStorage.removeItem(STAFF_SESSION_KEY);
    setStaffUser(null);
    setUserAccounts([]);
    if (auth.currentUser) {
      await logoutFirebase().catch(() => {});
    }
    notify('Anda telah keluar dari portal Tim Kampanye.');
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
    await logoutFirebase();
    notify('Anda telah keluar dari akun Swaraku.');
  };

  const handleRedeemReward = async (reward: RewardDoc) => {
    if (!authUser || !voterProfile) return;
    try {
      await redeemRewardAtomic(authUser.uid, voterProfile, reward);
      notify(`Penukaran "${reward.itemName}" berhasil dicatat! Cek status di Riwayat Klaim.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menukarkan poin.');
    }
  };

  const handleRsvpEvent = async (eventId: string, attending: boolean) => {
    if (!authUser) return;
    try {
      const { pointsAwarded } = await rsvpEventAtomic(authUser.uid, eventId, attending);
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
    if (!authUser) return;
    try {
      await updateVoterProfile(authUser.uid, patch);
      notify('Perubahan profil berhasil disimpan ke server.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    }
  };

  const isSuperAdmin = Boolean(authUser && isSuperAdminEmail(authUser.email));

  // Case 0: Active Staff Portal (Kader, Tim Sukses, Admin, Super Admin)
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
          onLogout={handleStaffLogout}
          onRefreshProfile={handleRefreshStaffProfile}
          onUploadPhoto={handleUploadStaffPhoto}
          onAddUser={handleAddStaffUser}
          onUpdateUser={handleUpdateStaffUser}
          onDeleteUser={handleDeleteStaffUser}
          onToggleUserStatus={handleToggleStaffStatus}
          onRefreshUsers={handleRefreshStaffUsers}
          onConnectGoogleAdmin={handleGoogleLogin}
          onNotify={notify}
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
        <OfflineIndicator />
      </>
    );
  }

  // Loading Screen while checking Firebase Auth / Firestore Profile
  if (!authReady || (authUser && voterProfile === undefined)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <img src="/icon.svg" alt="Swaraku" className="w-12 h-12 animate-pulse" />
        <p className="text-sm font-bold text-slate-700">Memuat data Swaraku...</p>
      </div>
    );
  }

  // Case 1: Not Authenticated -> Two-Portal Login (Voters Google SSO vs Tim & Admin)
  if (!authUser) {
    return (
      <>
        {mapsQuotaExceeded && <MapsQuotaBanner />}
        <LoginScreen
          referralCode={referralInput}
          onReferralChange={setReferralInput}
          onGoogleLogin={handleGoogleLogin}
          onStaffLogin={handleStaffLogin}
          isSigningIn={isSigningIn}
          authError={authError}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Case 2: Authenticated via Google, but not registered in Firestore voters/{uid}
  if (voterProfile === null || !voterProfile) {
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

  // Case 3: Fully Registered Voter (and optional Superadmin) Dashboard
  const navItems: { id: VoterTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'beranda', label: 'Beranda & Poin', shortLabel: 'Beranda', icon: <Home className="w-5 h-5" /> },
    { id: 'acara', label: 'Kalender Acara', shortLabel: 'Acara', icon: <Calendar className="w-5 h-5" /> },
    { id: 'aspirasi', label: 'Sampaikan Aspirasi', shortLabel: 'Aspirasi', icon: <MessageSquarePlus className="w-5 h-5" /> },
    { id: 'referral', label: 'Undang Teman', shortLabel: 'Undang', icon: <Users className="w-5 h-5" /> },
    { id: 'profil', label: 'Profil Saya', shortLabel: 'Profil', icon: <UserIcon className="w-5 h-5" /> },
  ];

  if (isSuperAdmin) {
    navItems.push({
      id: 'superadmin',
      label: 'Panel Superadmin',
      shortLabel: 'Admin',
      icon: <Shield className="w-5 h-5" />,
    });
  }

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
              uid={authUser.uid}
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

          {activeTab === 'superadmin' && isSuperAdmin && (
            <SuperadminView
              events={events}
              rewards={rewards}
              calegInfoList={calegInfoList}
              onNotify={notify}
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

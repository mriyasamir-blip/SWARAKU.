import React, { useState, useEffect } from 'react';
import {
  ActiveMobileTab,
  AppRole,
  AspirasiCategory,
  AspirasiItem,
  DeviceOS,
  FormC1Upload,
  FormB1Upload,
  MissionItem,
  NewsItem,
  RewardItem,
  VoterProfile,
  DptVoterRecord,
  ElectabilitySurveySubmission,
  WhatsAppBlaztItem,
  InvitedFriendRecord,
  UserAccount,
  UserRole,
  AdminModuleTab,
  VoterOcrRecord,
  QuickCountOcrItem,
} from './types/vore';
import {
  INITIAL_ASPIRASI,
  INITIAL_C1_RECORDS,
  INITIAL_B1_RECORDS,
  INITIAL_MISSIONS,
  INITIAL_NEWS,
  INITIAL_REWARDS,
  INITIAL_VOTER_PROFILE,
  INITIAL_INVITED_FRIENDS,
} from './data/mockData';
import {
  INITIAL_ELECTABILITY_SURVEYS,
  INITIAL_DPT_RECORDS,
  INITIAL_BLAZT_ITEMS,
} from './data/dptData';
import {
  PRESET_ACCOUNTS,
  INITIAL_VOTER_OCR_RECORDS,
} from './data/accountsData';
import { Navbar } from './components/Navbar';
import { MobileFrame } from './components/mobile/MobileFrame';
import { HomeDashboardScreen } from './components/mobile/screens/HomeDashboardScreen';
import { AspirasiScreen } from './components/mobile/screens/AspirasiScreen';
import { MonitoringPetaSuaraScreen } from './components/mobile/screens/MonitoringPetaSuaraScreen';
import { MisiRewardScreen } from './components/mobile/screens/MisiRewardScreen';
import { TpsFinderScreen } from './components/mobile/screens/TpsFinderScreen';
import { ProfileScreen } from './components/mobile/screens/ProfileScreen';
import { GroundOperationsView } from './components/ground/GroundOperationsView';
import { CommandCenterView } from './components/command/CommandCenterView';
import { ConceptRoadmapView } from './components/concept/ConceptRoadmapView';
import { DatabaseVotersView } from './components/timsukses/DatabaseVotersView';
import { KaderDashboardScreen } from './components/kader/KaderDashboardScreen';
import { PendaftaranVoterOcrModal } from './components/kader/PendaftaranVoterOcrModal';
import { QuickCountOcrModal } from './components/kader/QuickCountOcrModal';
import { LoginModal } from './components/auth/LoginModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { LandingWebsiteView } from './components/website/LandingWebsiteView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AiPilcalegModal } from './components/common/AiPilcalegModal';
import {
  MissionSurveyModal,
  NewsDetailModal,
  ReferralModal,
} from './components/common/Modals';
import { QuickCountModal } from './components/common/QuickCountModal';
import { FormC1UploadModal } from './components/common/FormC1UploadModal';
import { FormB1UploadModal } from './components/common/FormB1UploadModal';
import { AutoCekNikModal } from './components/common/AutoCekNikModal';
import { CekTpsAiModal } from './components/common/CekTpsAiModal';
import { WhatsAppBlaztModal } from './components/common/WhatsAppBlaztModal';
import { ElectabilitySurveyModal } from './components/common/ElectabilitySurveyModal';
import { MonitoringPendukungModal } from './components/common/MonitoringPendukungModal';
import { TambahNikUndangTemanModal } from './components/common/TambahNikUndangTemanModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { detectActualDevice, checkIsStandalone } from './utils/device';
import {
  getLocalStoredData,
  setLocalStoredData,
  syncSaveVoter,
  syncSaveC1,
  syncSaveB1,
  syncSaveTimSukses,
  fetchRemoteVoters,
  subscribeToCloudVoters,
  subscribeToCloudTimSukses,
  subscribeToCloudC1,
  subscribeToCloudB1,
  subscribeToCloudUserAccounts,
  saveUserAccountToCloud,
  deleteUserAccountFromCloud,
  migrateLocalDataToCloud,
  subscribeCloudSyncStatus,
  getCloudSyncState,
  CloudSyncState,
} from './utils/storageSync';
import {
  TimSuksesWilayahRecord,
  INITIAL_TIM_SUKSES_LIST,
} from './data/petaSuaraData';
import { ArrowLeft, Globe, RefreshCw } from 'lucide-react';

export default function App() {
  const isStandalone = checkIsStandalone();
  const detectedOS = detectActualDevice();

  // Authentication & Role Account State (1. Tim Sukses, 2. Kader)
  // When user opens the app, display Username & Password Login screen
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swaraku_current_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore error
        }
      }
    }
    return null; // Show Login screen by default on app launch
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [voterOcrRecords, setVoterOcrRecords] = useState<VoterOcrRecord[]>(() =>
    getLocalStoredData('swaraku_voter_ocr_records', [])
  );
  const [timSuksesList, setTimSuksesList] = useState<TimSuksesWilayahRecord[]>(() =>
    getLocalStoredData('swaraku_timsukses_list', [])
  );
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>(getCloudSyncState);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [pendaftaranVoterOcrModalOpen, setPendaftaranVoterOcrModalOpen] = useState(false);
  const [quickCountOcrModalOpen, setQuickCountOcrModalOpen] = useState(false);
  const [databaseVotersModalOpen, setDatabaseVotersModalOpen] = useState(false);

  // Navigation & View Mode State
  // Mode Website Resmi & Inquire Product vs Mode Aplikasi SWARAKU
  const [mainViewMode, setMainViewMode] = useState<'app' | 'website'>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const modeParam = searchParams.get('mode');
      if (modeParam === 'website') return 'website';
      if (modeParam === 'app') return 'app';
      const saved = localStorage.getItem('swaraku_main_view_mode');
      if (saved === 'website' || saved === 'app') return saved;
    }
    return 'app'; // Default to application on launch
  });

  const handleOpenWebsite = () => {
    setMainViewMode('website');
    if (typeof window !== 'undefined') {
      localStorage.setItem('swaraku_main_view_mode', 'website');
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'website');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleOpenApp = (preferredRole?: 'admin' | 'tim_sukses' | 'kader' | 'voter') => {
    setMainViewMode('app');
    if (typeof window !== 'undefined') {
      localStorage.setItem('swaraku_main_view_mode', 'app');
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'app');
      window.history.replaceState({}, '', url.toString());
    }
    if (preferredRole === 'admin') {
      const adminAcc = PRESET_ACCOUNTS.find((a) => a.role === 'admin') || PRESET_ACCOUNTS[0];
      handleLogin(adminAcc);
    } else if (preferredRole === 'tim_sukses') {
      const tsAcc = PRESET_ACCOUNTS.find((a) => a.role === 'tim_sukses') || PRESET_ACCOUNTS[1];
      handleLogin(tsAcc);
    } else if (preferredRole === 'kader') {
      const kaderAcc = PRESET_ACCOUNTS.find((a) => a.role === 'kader') || PRESET_ACCOUNTS[2];
      handleLogin(kaderAcc);
    }
  };

  // Default to Versi Apps (Aplikasi Pemilih Murni) as requested by user
  const [isAppMode, setIsAppMode] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<AppRole>('voter');
  const [deviceOS, setDeviceOS] = useState<DeviceOS>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vore_device_os') as DeviceOS;
      if (saved && (saved === 'android' || saved === 'ios' || saved === 'desktop' || saved === 'responsive')) {
        return saved;
      }
    }
    return detectActualDevice();
  });
  const [activeMobileTab, setActiveMobileTab] = useState<ActiveMobileTab>('beranda');

  const handleDeviceOSChange = (os: DeviceOS) => {
    setDeviceOS(os);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vore_device_os', os);
    }
  };

  // Application Data States (Clean/Empty initial state for Command Center)
  const [profile, setProfile] = useState<VoterProfile>(INITIAL_VOTER_PROFILE);
  const [missions, setMissions] = useState<MissionItem[]>(INITIAL_MISSIONS);
  const [rewards, setRewards] = useState<RewardItem[]>(INITIAL_REWARDS);
  const [aspirasiList, setAspirasiList] = useState<AspirasiItem[]>([]);
  const [c1Records, setC1Records] = useState<FormC1Upload[]>(() =>
    getLocalStoredData('swaraku_c1_records', [])
  );
  const [b1Records, setB1Records] = useState<FormB1Upload[]>(() =>
    getLocalStoredData('swaraku_b1_records', [])
  );
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);

  // New modules states: Survey, DPT, WhatsApp Blazt
  const [surveyList, setSurveyList] = useState<ElectabilitySurveySubmission[]>([]);
  const [dptList, setDptList] = useState<DptVoterRecord[]>(() =>
    getLocalStoredData('swaraku_dpt_list', INITIAL_DPT_RECORDS)
  );
  const [blaztLogs, setBlaztLogs] = useState<WhatsAppBlaztItem[]>([]);

  // Modals State
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [surveyMission, setSurveyMission] = useState<MissionItem | null>(null);
  const [quickCountModalOpen, setQuickCountModalOpen] = useState(false);
  const [c1ModalOpen, setC1ModalOpen] = useState(false);
  const [b1ModalOpen, setB1ModalOpen] = useState(false);
  const [autoCekNikModalOpen, setAutoCekNikModalOpen] = useState(false);
  const [cekTpsAiModalOpen, setCekTpsAiModalOpen] = useState(false);
  const [whatsAppBlaztModalOpen, setWhatsAppBlaztModalOpen] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [monitoringPendukungModalOpen, setMonitoringPendukungModalOpen] = useState(false);
  const [tambahNikModalOpen, setTambahNikModalOpen] = useState(false);
  const [aiPilcalegModalOpen, setAiPilcalegModalOpen] = useState(false);
  const [adminModuleTab, setAdminModuleTab] = useState<AdminModuleTab>('beranda');
  const [invitedFriends, setInvitedFriends] = useState<InvitedFriendRecord[]>(INITIAL_INVITED_FRIENDS);

  // User Accounts State (Super Admin can add/edit/delete roles for Tim Sukses and Kader)
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swaraku_user_accounts');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return PRESET_ACCOUNTS;
  });

  const handleAddUser = (newUser: UserAccount) => {
    setUserAccounts((prev) => {
      const updated = [newUser, ...prev.filter((u) => u.id !== newUser.id)];
      if (typeof window !== 'undefined') {
        localStorage.setItem('swaraku_user_accounts', JSON.stringify(updated));
      }
      return updated;
    });
    // Simpan ke Firestore Real-Time agar langsung tersinkron ke semua device & browser lain
    saveUserAccountToCloud(newUser);
    showToast(`✅ Akun "${newUser.nama}" (${newUser.role === 'tim_sukses' ? 'Tim Sukses' : newUser.role === 'kader' ? 'Kader Lapangan' : newUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}) berhasil didaftarkan & disinkronkan ke Cloud!`);
  };

  const handleDeleteUser = (userId: string) => {
    setUserAccounts((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('swaraku_user_accounts', JSON.stringify(updated));
      }
      return updated;
    });
    // Hapus dari Firestore
    deleteUserAccountFromCloud(userId);
    showToast('🗑️ Akun berhasil dihapus dari sistem & cloud.');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUserAccounts((prev) => {
      let targetUser: UserAccount | null = null;
      const updated = prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = (u.status === 'Nonaktif' ? 'Aktif' : 'Nonaktif') as 'Aktif' | 'Nonaktif';
          targetUser = { ...u, status: nextStatus };
          return targetUser;
        }
        return u;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('swaraku_user_accounts', JSON.stringify(updated));
      }
      if (targetUser) {
        saveUserAccountToCloud(targetUser);
      }
      return updated;
    });
    showToast('🔄 Status akun berhasil diubah & disinkronkan.');
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUserAccounts((prev) => {
      const updated = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem('swaraku_user_accounts', JSON.stringify(updated));
      }
      return updated;
    });
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('swaraku_current_user', JSON.stringify(updatedUser));
      }
    }
    // Update ke Firestore
    saveUserAccountToCloud(updatedUser);
    showToast(`✅ Akun "${updatedUser.nama}" (@${updatedUser.username}) berhasil diperbarui di seluruh perangkat!`);
  };

  // Kader Lapangan State
  const [kaderPoints, setKaderPoints] = useState<number>(0);

  // Toast Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handler: Login as Super Admin, Admin, Tim Sukses, or Kader
  const handleLogin = (account: UserAccount) => {
    setCurrentUser(account);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swaraku_current_user', JSON.stringify(account));
      localStorage.setItem('swaraku_main_view_mode', 'app');
    }
    setMainViewMode('app');
    setIsAppMode(true);
    setCurrentRole('voter');
    setActiveMobileTab('beranda');
    setAdminModuleTab('beranda');
    showToast(
      `👋 Masuk sebagai ${account.nama} (${
        account.role === 'super_admin'
          ? 'Super Admin'
          : account.role === 'admin'
          ? 'Admin'
          : account.role === 'tim_sukses'
          ? 'Tim Sukses'
          : 'Kader Lapangan'
      })`
    );
  };

  // Handler: Logout from SWARAKU
  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('swaraku_current_user');
    }
    showToast('🔒 Anda telah keluar dari aplikasi SWARAKU');
  };

  // Real-Time Multi-Device Cloud Listeners (Firebase Firestore onSnapshot)
  useEffect(() => {
    // 1. Subscribe to Cloud Sync status changes
    const unsubStatus = subscribeCloudSyncStatus(setCloudSyncState);

    // 2. Real-time Voters sync (setiap device yang scan/input langsung update di device lain)
    const unsubVoters = subscribeToCloudVoters((cloudVoters) => {
      setVoterOcrRecords(cloudVoters);
    });

    // 3. Real-time Tim Sukses sync
    const unsubTimSukses = subscribeToCloudTimSukses((cloudTs) => {
      setTimSuksesList(cloudTs);
    });

    // 4. Real-time Form C1 uploads (Tabulasi Quick Count)
    const unsubC1 = subscribeToCloudC1((cloudC1) => {
      setC1Records(cloudC1);
    });

    // 5. Real-time Form B1 uploads (Rekapitulasi Kecamatan)
    const unsubB1 = subscribeToCloudB1((cloudB1) => {
      setB1Records(cloudB1);
    });

    // 6. Real-time User Accounts sync (Super Admin akun pool multi-device)
    const unsubUsers = subscribeToCloudUserAccounts((cloudUsers) => {
      if (cloudUsers.length > 0) {
        setUserAccounts((prev) => {
          // Gabungkan akun cloud dengan preset default agar tidak kehilangan superadmin default
          const map = new Map<string, UserAccount>();
          PRESET_ACCOUNTS.forEach((a) => map.set(a.id, a));
          prev.forEach((a) => map.set(a.id, a));
          cloudUsers.forEach((a) => map.set(a.id, a));
          return Array.from(map.values());
        });
      }
    });

    // 7. Migrasikan data lokal ke Cloud Firestore
    migrateLocalDataToCloud()
      .then((res) => {
        if (res.votersMigrated > 0 || res.timSuksesMigrated > 0) {
          console.log(`[CloudSync] Auto-migration: +${res.votersMigrated} voter, +${res.timSuksesMigrated} tim sukses.`);
        }
      })
      .catch((err) => console.warn('Cloud migration notice:', err));

    return () => {
      unsubStatus();
      unsubVoters();
      unsubTimSukses();
      unsubC1();
      unsubB1();
      unsubUsers();
    };
  }, []);

  const handleManualCloudSync = async () => {
    setIsManualSyncing(true);
    try {
      const res = await migrateLocalDataToCloud();
      showToast(`☁️ Cloud Sinkron Selesai: ${res.votersMigrated} voter disinkronkan ke seluruh perangkat!`);
    } catch {
      showToast('⚠️ Gagal menyinkronkan data cloud.');
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Handler: Save voter from KTP Photo + OCR
  const handleSaveVoterOcr = async (voter: VoterOcrRecord) => {
    setVoterOcrRecords((prev) => {
      const updated = [voter, ...prev.filter((v) => v.nik !== voter.nik)];
      setLocalStoredData('swaraku_voter_ocr_records', updated);
      return updated;
    });

    const newDpt: DptVoterRecord = {
      nik: voter.nik,
      nama: voter.nama,
      jenisKelamin: voter.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
      usia: 32,
      tps: voter.tps,
      kelurahan: voter.kelurahan,
      kecamatan: voter.kecamatan,
      kabupatenKota: voter.kabupatenKota,
      dapil: 'DAPIL DKI JAKARTA II',
      statusDpt: voter.statusDpt === 'DPT valid' ? 'Terdaftar KPU' : 'Belum Terdaftar',
      statusPendukung: 'Pendukung Pasti',
      noHp: voter.noHp,
      waktuVerifikasi: voter.waktuDaftar,
    };
    setDptList((prev) => {
      const updated = [newDpt, ...prev.filter((d) => d.nik !== voter.nik)];
      setLocalStoredData('swaraku_dpt_list', updated);
      return updated;
    });

    setKaderPoints((prev) => prev + 100);
    showToast('✅ Data Voter & Foto berhasil disimpan ke Database dan disinkronkan ke Command Center');
    // Synchronize to Firestore, Cloud SQL, and localStorage
    syncSaveVoter(voter);
  };

  // Handler: Save Tim Sukses Wilayah & Auto-connect to Peta Suara
  const handleSaveTimSukses = (newTs: TimSuksesWilayahRecord) => {
    setTimSuksesList((prev) => {
      const updated = [newTs, ...prev.filter((i) => i.id !== newTs.id)];
      setLocalStoredData('swaraku_timsukses_list', updated);
      return updated;
    });
    syncSaveTimSukses(newTs);
    showToast(`🗺️ Tim Sukses "${newTs.nama}" terdaftar & terhubung ke Peta Suara Google Maps!`);
  };

  // Handler: Kosongkan data Peta Suara ke kondisi awal (0 dummy data)
  const handleResetPetaSuaraToZero = () => {
    setTimSuksesList([]);
    setVoterOcrRecords([]);
    setDptList([]);
    setLocalStoredData('swaraku_timsukses_list', []);
    setLocalStoredData('swaraku_voter_ocr_records', []);
    setLocalStoredData('swaraku_voter_records', []);
    setLocalStoredData('swaraku_dpt_list', []);
    showToast('🧹 Seluruh data wilayah, Tim Sukses, dan Voter telah dikosongkan (0 Data).');
  };

  // Handler: Quick Count C1 OCR Verification & Approve
  const handleApproveQuickCountOcr = (c1Data: FormC1Upload) => {
    setC1Records((prev) => {
      const updated = [c1Data, ...prev.filter((c) => c.id !== c1Data.id)];
      setLocalStoredData('swaraku_c1_records', updated);
      return updated;
    });
    syncSaveC1(c1Data);
    showToast(`📊 Form C1 OCR ${c1Data.tps} (${c1Data.kelurahan}) berhasil diverifikasi & masuk Tabulasi!`);
  };

  // Handler: Quick Count B1 OCR Verification & Approve
  const handleApproveQuickCountOcrB1 = (b1Data: FormB1Upload) => {
    setB1Records((prev) => {
      const updated = [b1Data, ...prev.filter((b) => b.id !== b1Data.id)];
      setLocalStoredData('swaraku_b1_records', updated);
      return updated;
    });
    syncSaveB1(b1Data);
    showToast(`📊 Form B1 Kecamatan ${b1Data.kecamatan} berhasil diverifikasi & masuk Tabulasi!`);
  };

  // Handler: Electability survey submission
  const handleSurveySubmitted = (submission: ElectabilitySurveySubmission, _points: number) => {
    setSurveyList((prev) => [submission, ...prev]);
    showToast('📊 Survei elektabilitas online berhasil dicatat & disinkronkan!');
  };

  // Handler: Save voter from Auto Cek NIK
  const handleSaveDptVoter = (voter: DptVoterRecord) => {
    setDptList((prev) => {
      const updated = [voter, ...prev.filter((d) => d.nik !== voter.nik)];
      setLocalStoredData('swaraku_dpt_list', updated);
      return updated;
    });

    // Synchronize to Database Voters (voterOcrRecords)
    const newVoterOcr: VoterOcrRecord = {
      id: `voter-dpt-${Date.now()}`,
      nik: voter.nik,
      nikMasked: voter.nik.length >= 16 ? `${voter.nik.slice(0, 6)}******${voter.nik.slice(-4)}` : voter.nik,
      nama: voter.nama,
      tempatTglLahir: 'Jakarta, 01-01-1990',
      jenisKelamin: voter.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      alamat: `Kel. ${voter.kelurahan}`,
      rtRw: '001/002',
      kelurahan: voter.kelurahan,
      kecamatan: voter.kecamatan,
      kabupatenKota: voter.kabupatenKota,
      provinsi: 'DKI Jakarta',
      tps: voter.tps,
      noHp: voter.noHp || '0812XXXXXXXX',
      waktuDaftar: 'Baru saja',
      statusDpt: voter.statusDpt === 'Terdaftar KPU' ? 'DPT valid' : 'Perlu cek',
      statusRegistrasi: 'TERDAFTAR',
      terdaftarOleh: currentUser ? `${currentUser.nama} (${currentUser.role})` : 'Kader Lapangan',
    };
    setVoterOcrRecords((prev) => {
      const updated = [newVoterOcr, ...prev.filter((v) => v.nik !== voter.nik)];
      setLocalStoredData('swaraku_voter_ocr_records', updated);
      return updated;
    });

    syncSaveVoter(newVoterOcr);
    showToast(`✅ Data ${voter.nama} (${voter.tps}) berhasil disimpan ke Database Voters & Peta Suara!`);
  };

  // Handler: Add invited friend with manual NIK
  const handleAddInvitedFriend = (friend: InvitedFriendRecord) => {
    setInvitedFriends((prev) => [friend, ...prev]);
    setProfile((prev) => ({
      ...prev,
      totalRujukan: prev.totalRujukan + 1,
    }));

    // Synchronize to Database Voters (voterOcrRecords) and Peta Suara
    const newVoterOcr: VoterOcrRecord = {
      id: `voter-friend-${Date.now()}`,
      nik: friend.nik,
      nikMasked: friend.nikMasked,
      nama: friend.nama,
      tempatTglLahir: 'Jakarta, 15-05-1993',
      jenisKelamin: 'Laki-laki',
      alamat: `Kel. ${friend.kelurahan}`,
      rtRw: '002/005',
      kelurahan: friend.kelurahan,
      kecamatan: friend.kecamatan || 'Kec. Cilandak',
      kabupatenKota: 'Jakarta Selatan',
      provinsi: 'DKI Jakarta',
      tps: friend.tps,
      noHp: friend.noHp || '0812XXXXXXXX',
      waktuDaftar: friend.tanggalUndang || 'Baru saja',
      statusDpt: friend.status === 'Terdaftar KPU' ? 'DPT valid' : 'Perlu cek',
      statusRegistrasi: 'TERDAFTAR',
      terdaftarOleh: currentUser ? `${currentUser.nama} (${currentUser.role})` : 'Kader Lapangan',
    };
    setVoterOcrRecords((prev) => {
      const updated = [newVoterOcr, ...prev.filter((v) => v.nik !== friend.nik)];
      setLocalStoredData('swaraku_voter_ocr_records', updated);
      return updated;
    });

    const newDpt: DptVoterRecord = {
      nik: friend.nik,
      nama: friend.nama,
      jenisKelamin: 'L',
      usia: 31,
      tps: friend.tps,
      kelurahan: friend.kelurahan,
      kecamatan: friend.kecamatan || 'Kec. Cilandak',
      kabupatenKota: 'Jakarta Selatan',
      dapil: 'DAPIL DKI JAKARTA II',
      statusDpt: 'Terdaftar KPU',
      statusPendukung: 'Pendukung Pasti',
      noHp: friend.noHp,
      waktuVerifikasi: 'Baru saja',
    };
    setDptList((prev) => {
      const updated = [newDpt, ...prev.filter((d) => d.nik !== friend.nik)];
      setLocalStoredData('swaraku_dpt_list', updated);
      return updated;
    });

    syncSaveVoter(newVoterOcr);
    showToast(`👥 ${friend.nama} (${friend.tps}) berhasil ditambahkan ke Database Voters & Peta Suara!`);
  };

  // Handler: Trigger WhatsApp Blazt
  const handleTriggerBlazt = (campaign: { target: string; totalTarget: number; pesan: string }) => {
    const newLog: WhatsAppBlaztItem = {
      id: `blazt-${Date.now()}`,
      namaPenerima: `${campaign.target} (${campaign.totalTarget} Kontak)`,
      noHp: 'Broadcast Server',
      tps: 'Semua TPS Terkait',
      kelurahan: 'Dapil Terpilih',
      pesanPreview: campaign.pesan.slice(0, 75) + '...',
      status: 'Terkirim',
      waktu: 'Baru saja',
    };
    setBlaztLogs((prev) => [newLog, ...prev]);
    showToast(`🚀 WhatsApp Blazt terkirim ke ${campaign.totalTarget.toLocaleString('id-ID')} kontak!`);
  };

  // Handler: Claim completed mission
  const handleClaimMission = (id: string) => {
    const target = missions.find((m) => m.id === id);
    if (!target || target.isClaimed) return;

    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isClaimed: true } : m))
    );
    showToast('✓ Agenda kegiatan telah diselesaikan!');
  };

  // Handler: Execute mission action
  const handleExecuteMission = (mission: MissionItem) => {
    if (mission.actionType === 'share') {
      setReferralModalOpen(true);
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, isCompleted: true, progress: 1 } : m))
      );
    } else if (mission.actionType === 'read') {
      setSelectedNews(news[0]);
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, isCompleted: true, progress: 1 } : m))
      );
    } else if (mission.actionType === 'survey') {
      setQuickCountModalOpen(true);
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, isCompleted: true, progress: 1 } : m))
      );
    } else if (mission.actionType === 'checkin') {
      setActiveMobileTab('tps');
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, isCompleted: true, progress: 1 } : m))
      );
    } else if (mission.actionType === 'discuss') {
      setSelectedNews(news[1]);
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, isCompleted: true, progress: 1 } : m))
      );
    }
  };

  // Handler: Complete survey from modal
  const handleCompleteSurveyMission = (missionId: string) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId ? { ...m, isCompleted: true, progress: 1 } : m
      )
    );
    showToast('✓ Agenda kegiatan telah diselesaikan!');
  };

  // Handler: Quick complete mission on home screen
  const handleQuickCompleteMission = (missionId: string) => {
    const target = missions.find((m) => m.id === missionId);
    if (target) {
      handleExecuteMission(target);
    }
  };

  // Handler: Redeem reward
  const handleRedeemReward = (reward: RewardItem) => {
    showToast(`✓ Alokasi merchandise "${reward.nama}" berhasil dikonfirmasi!`);
  };

  // Handler: Submit new citizen aspirasi
  const handleSubmitAspirasi = (data: {
    kategori: AspirasiCategory;
    judul: string;
    deskripsi: string;
    lokasi: string;
  }) => {
    const newAspirasi: AspirasiItem = {
      id: `asp-${Date.now()}`,
      kategori: data.kategori,
      judul: data.judul,
      deskripsi: data.deskripsi,
      lokasi: data.lokasi,
      tanggal: 'Hari ini',
      status: 'Masuk',
      upvotes: 1,
      tanggapanResmi: {
        oleh: 'Tim Desk Aspirasi SWARAKU',
        jabatan: 'Sekretariat Pengaduan Warga',
        waktu: 'Baru saja',
        pesan: 'Aspirasi telah masuk ke sistem dan dalam proses verifikasi tim teknis Dapil.',
        progresPersen: 20,
      },
    };

    setAspirasiList([newAspirasi, ...aspirasiList]);
    showToast('✓ Aspirasi warga berhasil disampaikan ke tim tindak lanjut!');
  };

  // Handler: Upvote aspirasi
  const handleUpvoteAspirasi = (id: string) => {
    setAspirasiList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a))
    );
    showToast('👍 Dukungan aspirasi berhasil ditambahkan!');
  };

  // Handler: Voter check-in "Saya Sudah Mencoblos"
  const handleCheckinCoblos = (photoUrl?: string) => {
    setProfile((prev) => ({
      ...prev,
      sudahMencoblos: true,
      buktiCoblosUrl: photoUrl,
      waktuMencoblos: 'Hari ini 09:15 WIB',
    }));
    showToast('✓ Konfirmasi kehadiran mencoblos di TPS berhasil dicatat!');
  };

  // Handler: Saksi submit Form C1
  const handleSubmitC1 = (c1Data: Partial<FormC1Upload>) => {
    const newRecord: FormC1Upload = {
      id: `c1-${Date.now()}`,
      tps: c1Data.tps || profile.tps,
      kelurahan: c1Data.kelurahan || profile.kelurahan,
      kecamatan: c1Data.kecamatan || profile.kecamatan,
      waktuUpload: 'Baru saja',
      saksiNama: c1Data.saksiNama || profile.nama,
      suaraPaslon1: c1Data.suaraPaslon1 || 0,
      suaraPaslon2: c1Data.suaraPaslon2 || 0,
      suaraPaslon3: c1Data.suaraPaslon3 || 0,
      suaraTidakSah: c1Data.suaraTidakSah || 0,
      totalSuaraSah: c1Data.totalSuaraSah || 0,
      statusVerifikasi: 'Terverifikasi',
      fotoC1Url: c1Data.fotoC1Url,
      fileName: c1Data.fileName,
    };

    setC1Records((prev) => {
      const updated = [newRecord, ...prev];
      setLocalStoredData('swaraku_c1_records', updated);
      return updated;
    });
    syncSaveC1(newRecord);
    showToast('📄 Formulir C1 TPS berhasil diunggah & masuk tabulasi quick count!');
  };

  // Handler: Koordinator / Saksi submit Form B1
  const handleSubmitB1 = (b1Data: Partial<FormB1Upload>) => {
    const newRecord: FormB1Upload = {
      id: `b1-${Date.now()}`,
      kecamatan: b1Data.kecamatan || profile.kecamatan,
      kelurahan: b1Data.kelurahan || `${profile.kelurahan} & Sekitarnya`,
      dapil: b1Data.dapil || profile.dapil,
      waktuUpload: 'Baru saja',
      koordinatorNama: b1Data.koordinatorNama || profile.nama,
      suaraPaslon1: b1Data.suaraPaslon1 || 0,
      suaraPaslon2: b1Data.suaraPaslon2 || 0,
      suaraPaslon3: b1Data.suaraPaslon3 || 0,
      suaraTidakSah: b1Data.suaraTidakSah || 0,
      totalSuaraSah: b1Data.totalSuaraSah || 0,
      totalTpsTercakup: b1Data.totalTpsTercakup || 1,
      statusVerifikasi: 'Terverifikasi',
      fotoB1Url: b1Data.fotoB1Url,
      fileName: b1Data.fileName,
    };

    setB1Records((prev) => {
      const updated = [newRecord, ...prev];
      setLocalStoredData('swaraku_b1_records', updated);
      return updated;
    });
    syncSaveB1(newRecord);
    showToast(`📄 Formulir B1 Kecamatan ${newRecord.kecamatan} berhasil diunggah ke Quick Count!`);
  };

  // Handler: Ground operations register voter
  const handleRegisterVoterField = (voterData: {
    nama: string;
    nik: string;
    noHp: string;
    tps: string;
    rtRw: string;
    isuPrioritas: string;
  }) => {
    setKaderPoints((prev) => prev + 50);
    setProfile((prev) => ({
      ...prev,
      totalRujukan: prev.totalRujukan + 1,
      aktifBulanIni: prev.aktifBulanIni + 1,
    }));

    // Synchronize to Database Voters (voterOcrRecords) and Peta Suara
    const newVoterOcr: VoterOcrRecord = {
      id: `voter-field-${Date.now()}`,
      nik: voterData.nik,
      nikMasked: voterData.nik.length >= 16 ? `${voterData.nik.slice(0, 6)}******${voterData.nik.slice(-4)}` : voterData.nik,
      nama: voterData.nama,
      tempatTglLahir: 'Jakarta, 12-08-1992',
      jenisKelamin: 'Laki-laki',
      alamat: `RT/RW ${voterData.rtRw}, Kel. Sukamaju`,
      rtRw: voterData.rtRw,
      kelurahan: 'Kel. Sukamaju',
      kecamatan: 'Kec. Cilandak',
      kabupatenKota: 'Jakarta Selatan',
      provinsi: 'DKI Jakarta',
      tps: voterData.tps || 'TPS 047',
      noHp: voterData.noHp,
      waktuDaftar: 'Baru saja',
      statusDpt: 'DPT valid',
      statusRegistrasi: 'TERDAFTAR',
      terdaftarOleh: currentUser ? `${currentUser.nama} (${currentUser.role})` : 'Kader Lapangan',
    };
    setVoterOcrRecords((prev) => {
      const updated = [newVoterOcr, ...prev.filter((v) => v.nik !== voterData.nik)];
      setLocalStoredData('swaraku_voter_ocr_records', updated);
      return updated;
    });

    const newDpt: DptVoterRecord = {
      nik: voterData.nik,
      nama: voterData.nama,
      jenisKelamin: 'L',
      usia: 32,
      tps: voterData.tps || 'TPS 047',
      kelurahan: 'Kel. Sukamaju',
      kecamatan: 'Kec. Cilandak',
      kabupatenKota: 'Jakarta Selatan',
      dapil: 'DAPIL DKI JAKARTA II',
      statusDpt: 'Terdaftar KPU',
      statusPendukung: 'Pendukung Pasti',
      noHp: voterData.noHp,
      waktuVerifikasi: 'Baru saja',
    };
    setDptList((prev) => {
      const updated = [newDpt, ...prev.filter((d) => d.nik !== voterData.nik)];
      setLocalStoredData('swaraku_dpt_list', updated);
      return updated;
    });

    syncSaveVoter(newVoterOcr);
    showToast(`✅ Pemilih "${voterData.nama}" berhasil didaftarkan ke Database Voters & Peta Suara! (+50 Poin Kader)`);
  };

  // Handler: Admin updates aspirasi status & feedback
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
                oleh: 'Koordinator Advokasi Dapil',
                jabatan: 'Tim Respon Cepat VRM',
                waktu: 'Baru saja diperbarui',
                pesan: tanggapan,
                progresPersen,
              },
            }
          : a
      )
    );
  };

  // Handler: Kosongkan seluruh data Command Center (sesuai permintaan pengguna)
  const handleClearCommandCenterData = () => {
    setC1Records([]);
    setB1Records([]);
    setSurveyList([]);
    setDptList([]);
    setBlaztLogs([]);
    setAspirasiList([]);
    setLocalStoredData('swaraku_c1_records', []);
    setLocalStoredData('swaraku_b1_records', []);
    setLocalStoredData('swaraku_dpt_list', []);
    showToast('🧹 Semua data Command Center berhasil dikosongkan!');
  };

  // Handler: Muat sampel demo jika ingin menguji visualisasi data
  const handleLoadSampleCommandCenterData = () => {
    setC1Records(INITIAL_C1_RECORDS);
    setB1Records(INITIAL_B1_RECORDS);
    setSurveyList(INITIAL_ELECTABILITY_SURVEYS);
    setDptList(INITIAL_DPT_RECORDS);
    setBlaztLogs(INITIAL_BLAZT_ITEMS);
    setAspirasiList(INITIAL_ASPIRASI);
    setLocalStoredData('swaraku_c1_records', INITIAL_C1_RECORDS);
    setLocalStoredData('swaraku_b1_records', INITIAL_B1_RECORDS);
    setLocalStoredData('swaraku_dpt_list', INITIAL_DPT_RECORDS);
    showToast('📊 Sampel simulasi data pemenangan berhasil dimuat!');
  };

  // If in Website mode, render the full landing website (inspired by SIMCALEG with SWARAKU's modules & Inquire form)
  if (mainViewMode === 'website') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-600 selection:text-white">
        <LandingWebsiteView
          onOpenApp={handleOpenApp}
          onOpenLoginModal={() => {
            handleOpenApp();
            setLoginModalOpen(true);
          }}
        />
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 bg-white border-2 border-cyan-500 text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
            <span>{toastMessage}</span>
          </div>
        )}
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-cyan-600 selection:text-white">
      {/* Top Bar with Top Bar Contract */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        deviceOS={deviceOS}
        onDeviceOSChange={handleDeviceOSChange}
        voterPoints={profile.poinSuara}
        isAppMode={isAppMode}
        onToggleAppMode={(appMode) => {
          setIsAppMode(appMode);
          if (appMode) {
            setCurrentRole('voter');
          }
        }}
        isStandalone={isStandalone}
        detectedOS={detectedOS}
        onOpenCekNik={() => setAutoCekNikModalOpen(true)}
        onOpenWhatsAppBlazt={() => setWhatsAppBlaztModalOpen(true)}
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenWebsite={handleOpenWebsite}
        onTriggerCloudSync={handleManualCloudSync}
        isSyncingCloud={isManualSyncing}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-white border-2 border-cyan-500 text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PWA Offline Indicator */}
      <OfflineIndicator />

      {/* Quick Website Navigation Bar / Back to Website banner (Khusus Layar Desktop / Tablet) */}
      {!isStandalone && (
        <aside aria-label="Kembali ke Website Resmi" className="hidden sm:flex bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white px-4 py-2 text-xs items-center justify-between gap-2 shadow-xs border-b border-slate-700/60 z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">
              Sedang mencoba: <strong className="text-white">Live Demo Aplikasi SWARAKU</strong>
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400 text-[11px]">
              {currentUser ? `Login: ${currentUser.nama}` : 'Pilih Akun Tim Sukses atau Kader'}
            </span>
          </div>
          <button
            onClick={handleOpenWebsite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-lg transition-all text-xs cursor-pointer shadow-xs active:scale-95"
            title="Kembali ke Halaman Penjelasan & Inquire Product (swaraku.com)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <Globe className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Website (swaraku.com)</span>
          </button>
        </aside>
      )}

      {/* Main Content Area: If user not logged in, display Username & Password Login Screen */}
      <main className="flex-1 flex flex-col">
        {!currentUser ? (
          /* Halaman Login Utama SWARAKU (Username, Password, Pilihan Akun Tim Sukses & Kader) */
          <MobileFrame
            activeTab="beranda"
            onTabChange={setActiveMobileTab}
            deviceOS={deviceOS}
            isStandalone={isStandalone}
            hideNav={true}
          >
            <LoginScreen
              onLogin={handleLogin}
              deviceOS={deviceOS}
              onOpenWebsite={handleOpenWebsite}
              userAccounts={userAccounts}
            />
          </MobileFrame>
        ) : (currentUser.role === 'admin' || currentUser.role === 'super_admin') ? (
          /* Halaman Akun Admin / Super Admin */
          <AdminDashboardView
            currentUser={currentUser}
            activeTab={adminModuleTab}
            onTabChange={setAdminModuleTab}
            aspirasiList={aspirasiList}
            c1Records={c1Records}
            b1Records={b1Records}
            surveyList={surveyList}
            dptList={dptList}
            voterOcrRecords={voterOcrRecords}
            blaztLogs={blaztLogs}
            profile={profile}
            kaderPoints={kaderPoints}
            onUpdateAspirasiStatus={handleUpdateAspirasiStatus}
            onSubmitAspirasi={handleSubmitAspirasi}
            onUpvoteAspirasi={handleUpvoteAspirasi}
            onSubmitC1={handleSubmitC1}
            onSubmitB1={handleSubmitB1}
            onSubmitSurvey={handleSurveySubmitted}
            onSaveDptVoter={handleSaveDptVoter}
            onTriggerBlazt={handleTriggerBlazt}
            onRegisterVoterField={handleRegisterVoterField}
            onCheckinCoblos={handleCheckinCoblos}
            onOpenQuickCountModal={() => setQuickCountModalOpen(true)}
            onOpenUploadC1Modal={() => setC1ModalOpen(true)}
            onOpenUploadB1Modal={() => setB1ModalOpen(true)}
            onOpenWhatsAppBlaztModal={() => setWhatsAppBlaztModalOpen(true)}
            onOpenTambahNikModal={() => setTambahNikModalOpen(true)}
            onOpenAiPilcaleg={() => setAiPilcalegModalOpen(true)}
            onOpenDaftarVoterOcrModal={() => setPendaftaranVoterOcrModalOpen(true)}
            onSwitchAccount={() => setLoginModalOpen(true)}
            onLogout={handleLogout}
            onOpenWebsite={handleOpenWebsite}
            userAccounts={userAccounts}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
            timSuksesList={timSuksesList}
            onSaveTimSukses={handleSaveTimSukses}
            onSaveVoter={handleSaveVoterOcr}
            onResetDataToZero={handleResetPetaSuaraToZero}
            onTriggerCloudSync={handleManualCloudSync}
            isSyncingCloud={isManualSyncing}
          />
        ) : (
          /* Halaman Aplikasi Setelah Login (Sesuai Akun Tim Sukses atau Kader) */
          <>
            {(isAppMode || currentRole === 'voter') && (
              <MobileFrame
                activeTab={activeMobileTab}
                onTabChange={setActiveMobileTab}
                deviceOS={deviceOS}
                isStandalone={isStandalone}
                userRole={currentUser?.role}
                appTitle={
                  currentUser?.role === 'kader'
                    ? 'SWARAKU · Aplikasi Kader Lapangan'
                    : currentUser?.role === 'tim_sukses'
                    ? 'SWARAKU · Aplikasi Tim Sukses'
                    : 'SWARAKU · Aplikasi Pemilih'
                }
              >
                {activeMobileTab === 'beranda' && (
                  currentUser.role === 'kader' || currentUser.role === 'tim_sukses' ? (
                    <KaderDashboardScreen
                      userAccount={currentUser}
                      profile={profile}
                      voterCount={voterOcrRecords.length}
                      c1Records={c1Records}
                      b1Records={b1Records}
                      onOpenDaftarVoterOcr={() => setPendaftaranVoterOcrModalOpen(true)}
                      onOpenQuickCountOcr={() => setQuickCountOcrModalOpen(true)}
                      onOpenDatabaseVoters={() => setDatabaseVotersModalOpen(true)}
                      onOpenRekapPaslon={() => setQuickCountModalOpen(true)}
                      onNavigateTab={(tab) => setActiveMobileTab(tab)}
                      onOpenSurvey={() => setSurveyModalOpen(true)}
                      onOpenTambahNik={() => setTambahNikModalOpen(true)}
                      onOpenWhatsAppBlazt={() => setWhatsAppBlaztModalOpen(true)}
                      onSwitchAccount={() => setLoginModalOpen(true)}
                      onOpenCekTpsAi={() => setCekTpsAiModalOpen(true)}
                      onOpenAiPilcaleg={() => setAiPilcalegModalOpen(true)}
                    />
                  ) : (
                    <HomeDashboardScreen
                      profile={profile}
                      missions={missions}
                      news={news}
                      onNavigateTab={(tab) => setActiveMobileTab(tab)}
                      onOpenReferralModal={() => setReferralModalOpen(true)}
                      onOpenNewsDetail={(n) => setSelectedNews(n)}
                      onQuickCompleteMission={handleQuickCompleteMission}
                      onOpenQuickCount={() => setQuickCountModalOpen(true)}
                      onOpenUploadC1={() => setC1ModalOpen(true)}
                      onOpenUploadB1={() => setB1ModalOpen(true)}
                      c1Records={c1Records}
                      b1Records={b1Records}
                      onOpenCekNik={() => setAutoCekNikModalOpen(true)}
                      onOpenWhatsAppBlazt={() => setWhatsAppBlaztModalOpen(true)}
                      onOpenSurvey={() => setSurveyModalOpen(true)}
                      onOpenMonitoringPendukung={() => setMonitoringPendukungModalOpen(true)}
                      onOpenTambahNikModal={() => setTambahNikModalOpen(true)}
                    />
                  )
                )}

                {activeMobileTab === 'aspirasi' && (
                  <AspirasiScreen
                    aspirasiList={aspirasiList}
                    onSubmitAspirasi={handleSubmitAspirasi}
                    onUpvoteAspirasi={handleUpvoteAspirasi}
                  />
                )}

                {(activeMobileTab === 'peta_suara' || activeMobileTab === 'misi') && (
                  <MonitoringPetaSuaraScreen
                    voterList={voterOcrRecords}
                    dptList={dptList}
                    timSuksesList={timSuksesList}
                    currentUser={currentUser}
                    onSaveTimSukses={handleSaveTimSukses}
                    onSaveVoter={handleSaveVoterOcr}
                    onResetDataToZero={handleResetPetaSuaraToZero}
                    onOpenWhatsAppBlazt={() => setWhatsAppBlaztModalOpen(true)}
                    onNavigateTab={(tab) => setActiveMobileTab(tab as ActiveMobileTab)}
                    onOpenTambahNikModal={() => setTambahNikModalOpen(true)}
                  />
                )}

                {activeMobileTab === 'tps' && (
                  <TpsFinderScreen
                    profile={profile}
                    onCheckinCoblos={handleCheckinCoblos}
                    onSubmitC1={handleSubmitC1}
                    onSubmitB1={handleSubmitB1}
                    onOpenQuickCount={() => setQuickCountModalOpen(true)}
                  />
                )}

                {activeMobileTab === 'profil' && (
                  <ProfileScreen
                    profile={profile}
                    onOpenReferralModal={() => setReferralModalOpen(true)}
                    onOpenTambahNikModal={() => setTambahNikModalOpen(true)}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                  />
                )}
              </MobileFrame>
            )}

            {!isAppMode && currentRole === 'database_voters' && (
              <DatabaseVotersView
                voterList={voterOcrRecords}
                onOpenDaftarVoterModal={() => setPendaftaranVoterOcrModalOpen(true)}
              />
            )}

            {!isAppMode && currentRole === 'canvasser' && (
              <GroundOperationsView
                onRegisterVoter={handleRegisterVoterField}
                kaderPoints={kaderPoints}
              />
            )}

            {!isAppMode && currentRole === 'admin' && (
              <CommandCenterView
                aspirasiList={aspirasiList}
                c1Records={c1Records}
                b1Records={b1Records}
                voterList={voterOcrRecords}
                onUpdateAspirasiStatus={handleUpdateAspirasiStatus}
                surveyList={surveyList}
                dptList={dptList}
                onAddDptVoter={handleSaveDptVoter}
                blaztLogs={blaztLogs}
                onTriggerBlazt={handleTriggerBlazt}
                onSubmitC1={handleSubmitC1}
                onSubmitB1={handleSubmitB1}
                onSubmitSurvey={handleSurveySubmitted}
                onClearAllData={handleClearCommandCenterData}
                onLoadSampleData={handleLoadSampleCommandCenterData}
                timSuksesList={timSuksesList}
                onSaveTimSukses={handleSaveTimSukses}
                onSaveVoter={handleSaveVoterOcr}
                onResetDataToZero={handleResetPetaSuaraToZero}
              />
            )}

            {!isAppMode && currentRole === 'concept' && (
              <ConceptRoadmapView
                onSwitchToVoterApp={() => {
                  setCurrentRole('voter');
                  setActiveMobileTab('beranda');
                }}
                onSwitchToCommandCenter={() => setCurrentRole('admin')}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        userAccounts={userAccounts}
      />

      <PendaftaranVoterOcrModal
        isOpen={pendaftaranVoterOcrModalOpen}
        onClose={() => setPendaftaranVoterOcrModalOpen(false)}
        onSaveVoter={handleSaveVoterOcr}
        kaderNama={currentUser?.nama || 'Ahmad Rizky'}
        defaultTps={currentUser?.tps || 'TPS 047'}
      />

      <QuickCountOcrModal
        isOpen={quickCountOcrModalOpen}
        onClose={() => setQuickCountOcrModalOpen(false)}
        onApproveC1={handleApproveQuickCountOcr}
        onApproveB1={handleApproveQuickCountOcrB1}
        saksiNama={currentUser?.nama || 'Ahmad Rizky'}
        defaultTps={currentUser?.tps || 'TPS 047'}
      />

      {/* Mobile/Full Modal for Database Voters */}
      {databaseVotersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-4 overflow-y-auto">
          <div className="max-w-6xl w-full mx-auto my-auto bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full font-mono">
                  DATABASE VOTERS
                </span>
                <span className="text-xs text-slate-500 font-medium">Tim Sukses &amp; Kader</span>
              </div>
              <button
                onClick={() => setDatabaseVotersModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <DatabaseVotersView
              voterList={voterOcrRecords}
              onOpenDaftarVoterModal={() => {
                setDatabaseVotersModalOpen(false);
                setPendaftaranVoterOcrModalOpen(true);
              }}
              onTriggerCloudSync={handleManualCloudSync}
              isSyncingCloud={isManualSyncing}
            />
          </div>
        </div>
      )}

      <ReferralModal
        isOpen={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
        referralCode={profile.referralCode}
      />

      <NewsDetailModal
        news={selectedNews}
        onClose={() => setSelectedNews(null)}
      />

      <MissionSurveyModal
        mission={surveyMission}
        onClose={() => setSurveyMission(null)}
        onComplete={handleCompleteSurveyMission}
      />

      {/* Quick Count Tabulasi Modal (Berdasarkan Unggah Form C1 & B1) */}
      <QuickCountModal
        isOpen={quickCountModalOpen}
        onClose={() => setQuickCountModalOpen(false)}
        c1Records={c1Records}
        b1Records={b1Records}
        onOpenUploadC1={() => {
          setQuickCountModalOpen(false);
          setC1ModalOpen(true);
        }}
        onOpenUploadB1={() => {
          setQuickCountModalOpen(false);
          setB1ModalOpen(true);
        }}
      />

      {/* Form C1 Upload Modal (TPS) */}
      <FormC1UploadModal
        isOpen={c1ModalOpen}
        onClose={() => setC1ModalOpen(false)}
        defaultTps={profile.tps}
        defaultKelurahan={profile.kelurahan}
        defaultKecamatan={profile.kecamatan}
        defaultSaksiNama={profile.nama}
        onSubmitC1={handleSubmitC1}
      />

      {/* Form B1 Upload Modal (Kecamatan / PPK) */}
      <FormB1UploadModal
        isOpen={b1ModalOpen}
        onClose={() => setB1ModalOpen(false)}
        defaultKecamatan={profile.kecamatan}
        defaultKelurahan={`${profile.kelurahan} & Sekitarnya`}
        defaultDapil={profile.dapil}
        defaultKoordinator={profile.nama}
        onSubmitB1={handleSubmitB1}
      />

      {/* Auto Cek NIK KTP DPT KPU Modal */}
      <AutoCekNikModal
        isOpen={autoCekNikModalOpen}
        onClose={() => setAutoCekNikModalOpen(false)}
        onSaveVoter={handleSaveDptVoter}
      />

      {/* AI Cek Lokasi TPS (Gemini Function Calling cari_lokasi_tps) */}
      <CekTpsAiModal
        isOpen={cekTpsAiModalOpen}
        onClose={() => setCekTpsAiModalOpen(false)}
        onSaveVoter={handleSaveDptVoter}
      />

      {/* AI PILCALEG: Strategi Kampanye & Narasi Politik Khusus Admin & Tim Sukses */}
      <AiPilcalegModal
        isOpen={aiPilcalegModalOpen}
        onClose={() => setAiPilcalegModalOpen(false)}
        userRole={currentUser?.role === 'admin' ? 'admin' : 'tim_sukses'}
        onNavigateToBlazt={() => {
          setAiPilcalegModalOpen(false);
          setWhatsAppBlaztModalOpen(true);
        }}
      />

      {/* WhatsApp Blazt Modal */}
      <WhatsAppBlaztModal
        isOpen={whatsAppBlaztModalOpen}
        onClose={() => setWhatsAppBlaztModalOpen(false)}
        blaztLogs={blaztLogs}
        onTriggerBlazt={handleTriggerBlazt}
      />

      {/* Survei Elektabilitas & Survei Offline Modal */}
      <ElectabilitySurveyModal
        isOpen={surveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
        surveyList={surveyList}
        onSubmitSurvey={handleSurveySubmitted}
      />

      {/* Monitoring Pendukung & Kesiapan Logistik Modal */}
      <MonitoringPendukungModal
        isOpen={monitoringPendukungModalOpen}
        onClose={() => setMonitoringPendukungModalOpen(false)}
        dptList={dptList}
        onOpenAutoCekNik={() => {
          setMonitoringPendukungModalOpen(false);
          setAutoCekNikModalOpen(true);
        }}
      />

      {/* Tambah NIK & Undang Teman Manual Modal */}
      <TambahNikUndangTemanModal
        isOpen={tambahNikModalOpen}
        onClose={() => setTambahNikModalOpen(false)}
        profile={profile}
        invitedList={invitedFriends}
        onAddInvitedFriend={handleAddInvitedFriend}
      />

      {/* Floating Toast Notification for App Mode */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-white border-2 border-cyan-500 text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      <OfflineIndicator />

      {/* Footer only displayed in Web Portal mode */}
      {!isAppMode && !isStandalone && (
        <footer className="w-full bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 shadow-xs">
          <p>
            SWARAKU © 2026. Platform Pemenangan Pemilu &amp; Relawan Pemilih Terpadu.
          </p>
        </footer>
      )}
    </div>
  );
}

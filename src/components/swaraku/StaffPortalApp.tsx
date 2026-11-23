import React, { useState, useRef, useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
  Home,
  Users,
  Shield,
  User as UserIcon,
  LogOut,
  Building2,
  UserCheck,
  Sliders,
  MapPin,
  Calendar,
  Camera,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Award,
  Compass,
  Radio,
  Database,
  MessageSquare,
  Bot,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  Globe,
  Navigation,
  UserPlus,
  QrCode,
  Gift,
} from 'lucide-react';
import type {
  AspirasiItem,
  DptVoterRecord,
  ElectabilitySurveySubmission,
  FormB1Upload,
  FormC1Upload,
  InvitedFriendRecord,
  UserAccount,
  UserRole,
  VoterOcrRecord,
  VoterProfile,
  WhatsAppBlaztItem,
} from '../../types/vore';
import type { TimSuksesWilayahRecord } from '../../data/petaSuaraData';
import type { CalegInfoDoc, CampaignEventDoc, RewardDoc } from '../../types/swaraku';
import { UserRoleManagementView } from '../admin/UserRoleManagementView';
import { MonitoringMapView } from '../MonitoringMapView';
import { canAccessMonitoring, isFullMonitorRole } from '../../services/locationService';
import { SuperadminView } from './SuperadminView';
import { EventLocationMap } from '../maps/EventLocationMap';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { isSuperAdminEmail } from '../../services/swarakuFirestore';
import { AspirasiScreen } from '../mobile/screens/AspirasiScreen';
import { MonitoringPetaSuaraScreen } from '../mobile/screens/MonitoringPetaSuaraScreen';
import { DatabaseVotersView } from '../timsukses/DatabaseVotersView';
import { CommandCenterView } from '../command/CommandCenterView';
import { GroundOperationsView } from '../ground/GroundOperationsView';
import { CommandRegistView } from '../registration/CommandRegistView';
import { FormC1UploadModal } from '../common/FormC1UploadModal';
import { FormB1UploadModal } from '../common/FormB1UploadModal';
import { QuickCountModal } from '../common/QuickCountModal';
import { WhatsAppBlaztModal } from '../common/WhatsAppBlaztModal';
import { TambahNikUndangTemanModal } from '../common/TambahNikUndangTemanModal';
import { AiPilcalegModal } from '../common/AiPilcalegModal';
import { PendaftaranVoterOcrModal } from '../kader/PendaftaranVoterOcrModal';
import { QuickCountOcrModal } from '../kader/QuickCountOcrModal';
import { ElectabilitySurveyModal } from '../common/ElectabilitySurveyModal';
import { CekTpsAiModal } from '../common/CekTpsAiModal';
import { AutoCekNikModal } from '../common/AutoCekNikModal';
import { FieldRoleDashboard } from './FieldRoleDashboard';
import { RelawanAgendaRewardView } from '../relawan/RelawanAgendaRewardView';
import { formatWilayahLabel } from '../../data/wilayahIndonesia';

export type StaffTab =
  | 'beranda'
  | 'registrasi'
  | 'agenda_reward'
  | 'peta_suara'
  | 'database_voters'
  | 'kelola_relawan'
  | 'operasi_lapangan'
  | 'aspirasi'
  | 'monitoring_kader'
  | 'kelola_voters'
  | 'command_center'
  | 'kelola_akun'
  | 'profil';

interface StaffPortalAppProps {
  staffUser: UserAccount;
  userAccounts: UserAccount[];
  authUser: User | null;
  events: CampaignEventDoc[];
  rewards: RewardDoc[];
  calegInfoList: CalegInfoDoc[];
  voterOcrRecords: VoterOcrRecord[];
  timSuksesList: TimSuksesWilayahRecord[];
  c1Records: FormC1Upload[];
  b1Records: FormB1Upload[];
  aspirasiList: AspirasiItem[];
  dptList: DptVoterRecord[];
  surveyList: ElectabilitySurveySubmission[];
  blaztLogs: WhatsAppBlaztItem[];
  invitedList: InvitedFriendRecord[];
  kaderPoints: number;
  sudahMencoblos: boolean;
  isSyncingCloud: boolean;
  onLogout: () => void;
  onRefreshProfile: () => Promise<void>;
  onUploadPhoto: (dataUrl: string) => Promise<boolean>;
  onAddUser: (user: UserAccount) => Promise<boolean | void>;
  onUpdateUser: (user: UserAccount) => Promise<boolean | void>;
  onDeleteUser: (userId: string) => Promise<boolean | void>;
  onToggleUserStatus: (userId: string) => Promise<boolean | void>;
  onRefreshUsers: () => Promise<void>;
  onConnectGoogleAdmin: () => Promise<void>;
  onAwardPoints: (delta: number) => Promise<void> | void;
  onSyncStaffPoints: (newPoints: number) => void;
  onNotify: (msg: string) => void;
  onSaveVoter: (voter: VoterOcrRecord) => void;
  onSaveTimSukses: (ts: TimSuksesWilayahRecord) => void;
  onSubmitC1: (form: Partial<FormC1Upload>) => void;
  onSubmitB1: (form: Partial<FormB1Upload>) => void;
  onSubmitAspirasi: (item: Omit<AspirasiItem, 'id' | 'tanggal' | 'status' | 'upvotes'>) => void;
  onUpdateAspirasiStatus: (
    id: string,
    status: 'Masuk' | 'Diproses' | 'Selesai',
    tanggapan: string,
    progresPersen: number
  ) => void;
  onUpvoteAspirasi: (id: string) => void;
  onSubmitSurvey: (survey: ElectabilitySurveySubmission, points: number) => void;
  onSaveDptVoter: (voter: DptVoterRecord) => void;
  onTriggerBlazt: (campaign: { target: string; totalTarget: number; pesan: string }) => void;
  onRegisterVoterField: (voterData: {
    nama: string;
    nik: string;
    noHp: string;
    tps: string;
    rtRw: string;
    isuPrioritas: string;
  }) => void;
  onAddInvitedFriend: (friend: InvitedFriendRecord) => void;
  onCheckinCoblos: (photoUrl?: string) => void;
  onResetDataToZero: () => void;
  onTriggerCloudSync: () => Promise<void>;
  onOpenWebsiteMode?: () => void;
}

const ROLE_META: Record<
  UserRole,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  super_admin: {
    label: 'SuperAdmin',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Shield className="w-4 h-4" />,
  },
  admin: {
    label: 'Admin',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: <Sliders className="w-4 h-4" />,
  },
  tim_sukses: {
    label: 'Korwil',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: <Building2 className="w-4 h-4" />,
  },
  kader: {
    label: 'Korcam',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <UserCheck className="w-4 h-4" />,
  },
  relawan: {
    label: 'Relawan',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Users className="w-4 h-4" />,
  },
};

function getInitials(name: string): string {
  const parts = (name || 'SW').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid.'));
      img.onload = () => {
        const maxSize = 360;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas browser tidak tersedia.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const StaffPortalApp: React.FC<StaffPortalAppProps> = ({
  staffUser,
  userAccounts,
  authUser,
  events,
  rewards,
  calegInfoList,
  voterOcrRecords,
  timSuksesList,
  c1Records,
  b1Records,
  aspirasiList,
  dptList,
  surveyList,
  blaztLogs,
  invitedList,
  kaderPoints,
  sudahMencoblos,
  isSyncingCloud,
  onLogout,
  onRefreshProfile,
  onUploadPhoto,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
  onRefreshUsers,
  onConnectGoogleAdmin,
  onAwardPoints,
  onSyncStaffPoints,
  onNotify,
  onSaveVoter,
  onSaveTimSukses,
  onSubmitC1,
  onSubmitB1,
  onSubmitAspirasi,
  onUpdateAspirasiStatus,
  onUpvoteAspirasi,
  onSubmitSurvey,
  onSaveDptVoter,
  onTriggerBlazt,
  onRegisterVoterField,
  onAddInvitedFriend,
  onResetDataToZero,
  onTriggerCloudSync,
  onOpenWebsiteMode,
}) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('beranda');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Supporting Staff & Field Modals
  const [showC1Modal, setShowC1Modal] = useState(false);
  const [showB1Modal, setShowB1Modal] = useState(false);
  const [showQuickCountModal, setShowQuickCountModal] = useState(false);
  const [showQuickCountOcrModal, setShowQuickCountOcrModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showCekTpsAiModal, setShowCekTpsAiModal] = useState(false);
  const [showAutoCekNikModal, setShowAutoCekNikModal] = useState(false);
  const [showBlaztModal, setShowBlaztModal] = useState(false);
  const [showTambahNikModal, setShowTambahNikModal] = useState(false);
  const [showVoterOcrModal, setShowVoterOcrModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const roleMeta = ROLE_META[staffUser.role] || ROLE_META.relawan;
  const isAdminOrSuper = staffUser.role === 'super_admin' || staffUser.role === 'admin';
  const isKorwil = staffUser.role === 'tim_sukses';
  const isKorcam = staffUser.role === 'kader';
  const isRelawan = staffUser.role === 'relawan';

  // Strict Role Access Matrix
  const canAccessPetaSuara = isAdminOrSuper || isKorwil; // Korcam & Relawan do NOT access Peta Suara
  const canUseAiPilcaleg = isAdminOrSuper || isKorwil;
  const canAccessCampaignPanel = isAdminOrSuper || isKorwil || isKorcam;
  const canAccessFieldOps = isAdminOrSuper || isKorwil || isKorcam;
  const hasGoogleSuperAdmin = Boolean(authUser && isSuperAdminEmail(authUser.email));
  const korwilSupervisor =
    staffUser.timSuksesNama || staffUser.didaftarkanOlehTimSukses || '';

  const relawanCount = useMemo(
    () => userAccounts.filter((u) => u.role === 'relawan').length,
    [userAccounts]
  );

  const myRelawanCount = useMemo(() => {
    if (!isKorcam) return relawanCount;
    return userAccounts.filter(
      (u) =>
        u.role === 'relawan' &&
        (!u.korcamId || u.korcamId === staffUser.id || u.korcamNama === staffUser.nama)
    ).length;
  }, [userAccounts, isKorcam, staffUser.id, staffUser.nama, relawanCount]);

  const wilayahDisplay =
    formatWilayahLabel({
      kota: staffUser.kota || '',
      kecamatan: staffUser.kecamatan || '',
      kelurahan: staffUser.kelurahan || '',
    }) ||
    staffUser.wilayah ||
    '-';

  const handleSaveVoterWithRole = (voter: VoterOcrRecord) => {
    const roleTag: VoterOcrRecord['diinputOlehRole'] =
      staffUser.role === 'tim_sukses'
        ? 'tim_sukses'
        : staffUser.role === 'kader'
        ? 'kader'
        : staffUser.role === 'relawan'
        ? 'relawan'
        : 'admin';
    onSaveVoter({
      ...voter,
      diinputOlehRole: voter.diinputOlehRole || roleTag,
      diinputOlehNama: voter.diinputOlehNama || staffUser.nama,
      terdaftarOleh: voter.terdaftarOleh || staffUser.nama,
    });
  };

  // Derived profile for TambahNikUndangTemanModal
  const staffVoterProfile = useMemo<VoterProfile>(
    () => ({
      nama: staffUser.nama,
      username: staffUser.username,
      nikMasked: staffUser.nik || '3174 •••• •••• 0001',
      noHpMasked: staffUser.noHp || '-',
      dapil: wilayahDisplay,
      tps: staffUser.kelurahan || 'Kelurahan Aktif',
      kelurahan: staffUser.kelurahan || 'Cilandak Barat',
      kecamatan: staffUser.kecamatan || 'Cilandak',
      kota: staffUser.kota || 'Jakarta Selatan',
      poinSuara: kaderPoints,
      tier: 'Gold',
      poinNextTier: 1000,
      tierMaxPoin: 1500,
      totalRujukan: invitedList.length,
      aktifBulanIni: voterOcrRecords.length,
      bergabungMingguIni: voterOcrRecords.length,
      sudahMencoblos,
      lencana: [],
      referralCode: `SW-${(staffUser.username || 'TIM').toUpperCase()}`,
    }),
    [staffUser, wilayahDisplay, kaderPoints, invitedList.length, voterOcrRecords.length, sudahMencoblos]
  );

  // Exact Role-Based Navigation Menu
  const navItems: {
    id: StaffTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string | number;
  }[] = useMemo(() => {
    const items: {
      id: StaffTab;
      label: string;
      shortLabel: string;
      icon: React.ReactNode;
      badge?: string | number;
    }[] = [
      { id: 'beranda', label: 'Beranda', shortLabel: 'Beranda', icon: <Home className="w-5 h-5" /> },
      {
        id: 'registrasi',
        label: 'Menu Registrasi',
        shortLabel: 'Registrasi',
        icon: <QrCode className="w-5 h-5" />,
      },
    ];

    if (isRelawan) {
      items.push({
        id: 'agenda_reward',
        label: 'Agenda & Reward',
        shortLabel: 'Agenda',
        icon: <Gift className="w-5 h-5" />,
        badge: events.length > 0 ? events.length : undefined,
      });
    }

    if (canAccessPetaSuara) {
      items.push({
        id: 'peta_suara',
        label: 'Peta Suara (Google Maps)',
        shortLabel: 'Peta Suara',
        icon: <Compass className="w-5 h-5" />,
        badge: voterOcrRecords.length > 0 ? voterOcrRecords.length : undefined,
      });
    }

    items.push({
      id: 'database_voters',
      label: isRelawan ? 'Database Voter' : 'Database',
      shortLabel: 'Database',
      icon: <Database className="w-5 h-5" />,
      badge: voterOcrRecords.length,
    });

    if (isKorcam) {
      items.push({
        id: 'kelola_relawan',
        label: 'Kelola User Relawan',
        shortLabel: 'Relawan',
        icon: <UserPlus className="w-5 h-5" />,
        badge: myRelawanCount,
      });
    }

    if (canAccessFieldOps) {
      items.push(
        {
          id: 'operasi_lapangan',
          label: 'Operasi Lapangan',
          shortLabel: 'Lapangan',
          icon: <UserCheck className="w-5 h-5" />,
        },
        {
          id: 'aspirasi',
          label: 'Aspirasi Warga',
          shortLabel: 'Aspirasi',
          icon: <MessageSquare className="w-5 h-5" />,
          badge: aspirasiList.length > 0 ? aspirasiList.length : undefined,
        }
      );
    }

    if (canAccessMonitoring(staffUser.role)) {
      items.push({
        id: 'monitoring_kader',
        label: isFullMonitorRole(staffUser.role)
          ? 'Monitoring Relawan & Tim'
          : isKorwil
          ? 'Monitoring Korcam & Relawan'
          : 'Monitoring Relawan',
        shortLabel: 'Monitoring',
        icon: <Navigation className="w-5 h-5" />,
      });
    }

    if (canAccessCampaignPanel) {
      items.push({
        id: 'kelola_voters',
        label: 'Panel Manajemen Kampanye',
        shortLabel: 'Kampanye',
        icon: <Shield className="w-5 h-5" />,
      });
    }

    if (isAdminOrSuper) {
      items.push(
        {
          id: 'command_center',
          label: 'Command Center',
          shortLabel: 'Command',
          icon: <Radio className="w-5 h-5" />,
        },
        {
          id: 'kelola_akun',
          label: 'Kelola Role & User',
          shortLabel: 'Kelola User',
          icon: <Users className="w-5 h-5" />,
          badge: userAccounts.length > 0 ? userAccounts.length : undefined,
        }
      );
    }

    items.push({
      id: 'profil',
      label: 'Profil Saya',
      shortLabel: 'Profil',
      icon: <UserIcon className="w-5 h-5" />,
    });

    return items;
  }, [
    canAccessPetaSuara,
    canAccessFieldOps,
    canAccessCampaignPanel,
    isAdminOrSuper,
    isKorwil,
    isKorcam,
    isRelawan,
    staffUser.role,
    voterOcrRecords.length,
    events.length,
    myRelawanCount,
    aspirasiList.length,
    userAccounts.length,
  ]);

  const handleSelectTab = (tab: StaffTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const ok = await onUploadPhoto(dataUrl);
      if (ok) {
        onNotify('Foto profil berhasil disimpan ke Cloud dan tersinkron di semua perangkat.');
      } else {
        onNotify('Gagal mengunggah foto profil ke Cloud.');
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal memproses gambar.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      const ok = await onUploadPhoto('');
      if (ok) onNotify('Foto profil dihapus.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRefresh = async () => {
    setIsSyncingProfile(true);
    try {
      await onRefreshProfile();
      onNotify('Data profil terbaru telah disinkronkan dari Cloud.');
    } finally {
      setIsSyncingProfile(false);
    }
  };

  const renderAvatar = (sizeClass: string, textClass: string) =>
    staffUser.fotoUrl ? (
      <img
        src={staffUser.fotoUrl}
        alt={`Foto ${staffUser.nama}`}
        className={`${sizeClass} rounded-2xl object-cover border border-slate-200 bg-white shrink-0`}
      />
    ) : (
      <div
        className={`${sizeClass} rounded-2xl bg-slate-900 text-white font-extrabold flex items-center justify-center shrink-0 ${textClass}`}
      >
        {getInitials(staffUser.nama)}
      </div>
    );

  // Mobile bottom navigation displays 4 primary role shortcuts + Menu drawer trigger
  const mobileBottomItems: StaffTab[] = isAdminOrSuper
    ? ['beranda', 'registrasi', 'peta_suara', 'kelola_voters']
    : isKorwil
    ? ['beranda', 'registrasi', 'peta_suara', 'monitoring_kader']
    : isKorcam
    ? ['beranda', 'registrasi', 'kelola_relawan', 'monitoring_kader']
    : ['beranda', 'registrasi', 'agenda_reward', 'database_voters'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 p-1.5 flex items-center justify-center shrink-0">
            <img src="/icon.svg" alt="Swaraku" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-slate-900 leading-tight">Swaraku</p>
            <p className="text-xs text-slate-500 truncate">
              {isRelawan ? 'Portal Relawan' : 'Portal Tim Support'}
            </p>
          </div>
        </div>

        {/* Dynamic User Brief */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
          {renderAvatar('w-11 h-11', 'text-sm')}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{staffUser.nama}</p>
            <p className="text-xs text-slate-500 truncate">@{staffUser.username}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${roleMeta.badgeClass}`}
              >
                {roleMeta.icon}
                <span>{roleMeta.label}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold">
                <Award className="w-3 h-3" />
                {kaderPoints} Poin
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions per Role */}
        <div className="px-4 pt-3 pb-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSelectTab('registrasi')}
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Registrasi</span>
          </button>

          {canUseAiPilcaleg ? (
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI PILCALEG</span>
            </button>
          ) : isKorcam ? (
            <button
              type="button"
              onClick={() => handleSelectTab('kelola_relawan')}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Relawan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectTab('agenda_reward')}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Reward</span>
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-lg shrink-0 ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {onOpenWebsiteMode && (
            <button
              type="button"
              onClick={onOpenWebsiteMode}
              className="w-full min-h-[40px] px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Buka Mode Website</span>
            </button>
          )}
          <PWAInstallButton
            variant="outline"
            label="Pasang Aplikasi"
            className="w-full justify-center min-h-[40px]"
          />
          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[40px] px-4 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 cursor-pointer"
            aria-label={`Buka semua menu ${roleMeta.label}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/icon.svg" alt="Swaraku" className="w-7 h-7 shrink-0" />
          <div className="min-w-0">
            <span className="font-extrabold text-sm text-slate-900 block truncate">
              {staffUser.nama}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-extrabold px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            {kaderPoints} Pts
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${roleMeta.badgeClass}`}
          >
            {roleMeta.label}
          </span>
          <PWAInstallButton variant="compact" label="App" />
        </div>
      </header>

      {/* Mobile Full Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className="w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/icon.svg" alt="Swaraku" className="w-7 h-7" />
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Menu {roleMeta.label}</p>
                  <p className="text-[11px] text-slate-500 truncate">@{staffUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-2">
              {onOpenWebsiteMode && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWebsiteMode();
                  }}
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Buka Mode Website</span>
                </button>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 pb-24 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* 1. BERANDA */}
          {activeTab === 'beranda' && (
            <div className="space-y-6">
              {/* Identity Hero Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {renderAvatar('w-16 h-16', 'text-lg')}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-bold ${roleMeta.badgeClass}`}
                      >
                        {roleMeta.icon}
                        <span>{roleMeta.label}</span>
                      </span>
                      {staffUser.kelurahan && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          Kel. {staffUser.kelurahan}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {kaderPoints.toLocaleString('id-ID')} Poin
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                      {staffUser.nama}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      {staffUser.jabatan} &middot; {wilayahDisplay}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('registrasi')}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Menu Registrasi</span>
                  </button>
                  {canUseAiPilcaleg && (
                    <button
                      type="button"
                      onClick={() => setShowAiModal(true)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bot className="w-4 h-4" />
                      <span>AI PILCALEG</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isSyncingProfile}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingProfile ? 'animate-spin' : ''}`} />
                    <span>{isSyncingProfile ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
                  </button>
                </div>
              </div>

              {/* Admin / SuperAdmin Overview KPI & Quick Access Cards */}
              {isAdminOrSuper && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Total Voter / Konstituen</span>
                        <Database className="w-4 h-4 text-cyan-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {voterOcrRecords.length.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[11px] text-cyan-700 font-medium">
                        Tersinkron ke Kelurahan &amp; Peta Suara
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Akun Relawan Aktif</span>
                        <Users className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {relawanCount.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[11px] text-amber-700 font-medium">
                        Terhubung ke Monitoring Relawan
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Korwil Terpetakan</span>
                        <Compass className="w-4 h-4 text-teal-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {Math.max(
                          timSuksesList.length,
                          userAccounts.filter((u) => u.role === 'tim_sukses').length
                        ).toLocaleString('id-ID')}
                      </p>
                      <span className="text-[11px] text-teal-700 font-medium">
                        Koordinator Wilayah Aktif
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Quick Count &amp; Aspirasi</span>
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {(c1Records.length + b1Records.length + aspirasiList.length).toLocaleString('id-ID')}
                      </p>
                      <span className="text-[11px] text-indigo-700 font-medium">
                        {c1Records.length + b1Records.length} Quick Count · {aspirasiList.length}{' '}
                        Aspirasi
                      </span>
                    </div>
                  </div>

                  {/* Quick Module Cards for Admin / SuperAdmin */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                      Menu Modul Utama {roleMeta.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      <button
                        type="button"
                        onClick={() => handleSelectTab('registrasi')}
                        className="p-4 bg-blue-50/70 hover:bg-blue-100/70 rounded-2xl border border-blue-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Menu Registrasi (Command Regist)
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Primary: Daftar Korwil &amp; Korcam (+50), Relawan (+25), Voter (+10 Poin).
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('peta_suara')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                            <Compass className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Peta Suara (Google Maps)
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Sebaran titik Voter per Kelurahan, Kecamatan, &amp; Kota secara otomatis.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('database_voters')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Database Wilayah</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Daftar Voter, Daftar Relawan, Laporan per Kelurahan, &amp; Quick Count.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('monitoring_kader')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <Navigation className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Monitoring Relawan &amp; Tim
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Pantau lokasi GPS real-time Korwil, Korcam, dan Relawan lintas perangkat.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('kelola_voters')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-blue-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Panel Manajemen Kampanye
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Acara &amp; Peta, Reward &amp; Klaim, Info Caleg, Data Voters, &amp; Log Aspirasi.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('kelola_akun')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-purple-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Kelola Role &amp; User
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              CRUD penuh akun Korwil, Korcam, Relawan, dan Admin (Whitelist).
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0 mt-1" />
                      </button>
                    </div>
                  </section>
                </>
              )}

              {/* Field Operational Dashboard for Korwil, Korcam, & Relawan */}
              {(isKorwil || isKorcam || isRelawan) && (
                <FieldRoleDashboard
                  staffUser={staffUser}
                  voterCount={voterOcrRecords.length}
                  relawanCount={myRelawanCount}
                  c1Records={c1Records}
                  b1Records={b1Records}
                  surveyCount={surveyList.length}
                  invitedCount={invitedList.length}
                  aspirasiCount={aspirasiList.length}
                  kaderPoints={kaderPoints}
                  sudahMencoblos={sudahMencoblos}
                  timSuksesSupervisor={korwilSupervisor}
                  onOpenDaftarVoterOcr={() => setShowVoterOcrModal(true)}
                  onOpenQuickCountOcr={() => setShowQuickCountOcrModal(true)}
                  onOpenUploadC1={() => setShowC1Modal(true)}
                  onOpenRekapPaslon={() => setShowQuickCountModal(true)}
                  onOpenSurvey={() => setShowSurveyModal(true)}
                  onOpenCekTpsAi={() => setShowCekTpsAiModal(true)}
                  onOpenAutoCekNik={() => setShowAutoCekNikModal(true)}
                  onOpenTambahNik={() => setShowTambahNikModal(true)}
                  onOpenWhatsAppBlazt={() => setShowBlaztModal(true)}
                  onOpenAiPilcaleg={() => setShowAiModal(true)}
                  onNavigateTab={handleSelectTab}
                />
              )}

              {/* Shared Info Caleg Daerah */}
              <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-blue-700" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Informasi Partai &amp; Caleg Daerah
                  </h3>
                </div>
                {calegInfoList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    Belum ada informasi Caleg Daerah yang dipublikasikan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calegInfoList.map((caleg) => (
                      <div
                        key={caleg.id}
                        className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 space-y-1.5"
                      >
                        <p className="text-xs font-extrabold text-blue-700 uppercase">
                          {caleg.partyName}
                        </p>
                        <p className="text-base font-extrabold text-slate-900">
                          {caleg.calegName}
                        </p>
                        <p className="text-xs font-semibold text-slate-600">{caleg.region}</p>
                        {caleg.description && (
                          <p className="text-xs text-slate-600 leading-relaxed pt-1">
                            {caleg.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Shared Kalender Acara Kampanye */}
              <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-blue-700" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Kalender Acara Kampanye ({events.length})
                  </h3>
                </div>
                {events.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    Belum ada jadwal kegiatan kampanye yang ditambahkan.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {events.map((ev) => {
                      const isExpanded = expandedEventId === ev.id;
                      return (
                        <div
                          key={ev.id}
                          className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-900">{ev.title}</h4>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {ev.eventDate} &middot; {ev.partyName} &middot; {ev.region}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>{ev.address}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shrink-0 cursor-pointer"
                            >
                              {isExpanded ? 'Tutup Peta' : 'Lihat Peta Lokasi'}
                            </button>
                          </div>
                          {isExpanded && (
                            <EventLocationMap
                              lat={ev.lat}
                              lng={ev.lng}
                              title={ev.title}
                              address={ev.address}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* 2. MENU REGISTRASI (COMMAND REGIST) — ALL ROLES WITH STRICT PERMISSION MATRIX */}
          {activeTab === 'registrasi' && (
            <CommandRegistView
              currentUser={staffUser}
              userAccounts={userAccounts}
              voterOcrRecords={voterOcrRecords}
              onSaveVoter={handleSaveVoterWithRole}
              onAddUser={onAddUser}
              onSaveTimSukses={onSaveTimSukses}
              onAwardPoints={onAwardPoints}
              onNotify={onNotify}
            />
          )}

          {/* 2b. MENU AGENDA & REWARD (KHUSUS RELAWAN) */}
          {activeTab === 'agenda_reward' && isRelawan && (
            <RelawanAgendaRewardView
              currentUser={staffUser}
              currentPoints={kaderPoints}
              events={events}
              rewards={rewards}
              onPointsUpdated={onSyncStaffPoints}
              onNavigateToRegistrasi={() => handleSelectTab('registrasi')}
              onNotify={onNotify}
            />
          )}

          {/* 3. PETA SUARA (GOOGLE MAPS) — SuperAdmin, Admin, & Korwil ONLY (NO Korcam/Relawan) */}
          {activeTab === 'peta_suara' && canAccessPetaSuara && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <MonitoringPetaSuaraScreen
                voterList={voterOcrRecords}
                dptList={dptList}
                timSuksesList={timSuksesList}
                currentUser={staffUser}
                onSaveTimSukses={onSaveTimSukses}
                onSaveVoter={handleSaveVoterWithRole}
                onResetDataToZero={isAdminOrSuper ? () => setConfirmResetOpen(true) : undefined}
                onOpenWhatsAppBlazt={() => setShowBlaztModal(true)}
                onNavigateTab={(tab) => handleSelectTab(tab as StaffTab)}
                onOpenTambahNikModal={() => setShowTambahNikModal(true)}
              />
            </div>
          )}

          {/* 4. DATABASE (4 Sub-Menus: Daftar Voter, Daftar Relawan, Laporan per Kelurahan, Quick Count) */}
          {activeTab === 'database_voters' && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <DatabaseVotersView
                voterList={voterOcrRecords}
                userAccounts={userAccounts}
                c1Records={c1Records}
                b1Records={b1Records}
                canAddRelawan={isAdminOrSuper || isKorwil || isKorcam}
                onOpenDaftarVoterModal={() => setShowVoterOcrModal(true)}
                onOpenCommandRegist={() => handleSelectTab('registrasi')}
                onTriggerCloudSync={onTriggerCloudSync}
                isSyncingCloud={isSyncingCloud}
              />
            </div>
          )}

          {/* 5. KELOLA USER RELAWAN (KHUSUS KORCAM) */}
          {activeTab === 'kelola_relawan' && isKorcam && (
            <UserRoleManagementView
              mode="korcam_relawan"
              userAccounts={userAccounts}
              currentUser={staffUser}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              onToggleUserStatus={onToggleUserStatus}
              onRefreshUsers={onRefreshUsers}
              onAwardPoints={onAwardPoints}
            />
          )}

          {/* 6. MONITORING RELAWAN & KORCAM (GPS REAL-TIME FIRESTORE) */}
          {activeTab === 'monitoring_kader' && canAccessMonitoring(staffUser.role) && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <MonitoringMapView
                currentUser={{
                  id: staffUser.id || staffUser.username,
                  username: staffUser.username,
                  nama: staffUser.nama,
                  role: staffUser.role,
                  kota: staffUser.kota,
                  kecamatan: staffUser.kecamatan,
                  kelurahan: staffUser.kelurahan,
                  kaderIds: staffUser.kaderIds,
                  kaderList: staffUser.kaderList,
                }}
                userAccounts={userAccounts}
              />
            </div>
          )}

          {/* 7. COMMAND CENTER (ADMIN & SUPERADMIN) */}
          {activeTab === 'command_center' && isAdminOrSuper && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <CommandCenterView
                aspirasiList={aspirasiList}
                c1Records={c1Records}
                b1Records={b1Records}
                voterList={voterOcrRecords}
                onUpdateAspirasiStatus={onUpdateAspirasiStatus}
                surveyList={surveyList}
                dptList={dptList}
                onAddDptVoter={onSaveDptVoter}
                blaztLogs={blaztLogs}
                onTriggerBlazt={onTriggerBlazt}
                onSubmitC1={onSubmitC1}
                onSubmitB1={onSubmitB1}
                onSubmitSurvey={onSubmitSurvey}
                timSuksesList={timSuksesList}
                onSaveTimSukses={onSaveTimSukses}
                onSaveVoter={onSaveVoter}
                onResetDataToZero={onResetDataToZero}
              />
            </div>
          )}

          {/* 8. ASPIRASI WARGA */}
          {activeTab === 'aspirasi' && canAccessFieldOps && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <AspirasiScreen
                aspirasiList={aspirasiList}
                onSubmitAspirasi={onSubmitAspirasi}
                onUpvoteAspirasi={onUpvoteAspirasi}
              />
            </div>
          )}

          {/* 9. OPERASI LAPANGAN */}
          {activeTab === 'operasi_lapangan' && canAccessFieldOps && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <GroundOperationsView
                onRegisterVoter={onRegisterVoterField}
                kaderPoints={kaderPoints}
              />
            </div>
          )}

          {/* 10. PANEL MANAJEMEN KAMPANYE (Korwil, Korcam, Admin, SuperAdmin) */}
          {activeTab === 'kelola_voters' && canAccessCampaignPanel && (
            <SuperadminView
              events={events}
              rewards={rewards}
              calegInfoList={calegInfoList}
              onNotify={onNotify}
              hasGoogleSuperAdmin={hasGoogleSuperAdmin}
              onConnectGoogleAdmin={onConnectGoogleAdmin}
              panelTitle="Panel Manajemen Kampanye"
              isSuperAdmin={staffUser.role === 'super_admin'}
              currentUser={staffUser}
            />
          )}

          {/* 11. KELOLA ROLE & USER (Admin & SuperAdmin Full CRUD) */}
          {activeTab === 'kelola_akun' && isAdminOrSuper && (
            <UserRoleManagementView
              mode="full"
              userAccounts={userAccounts}
              currentUser={staffUser}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              onToggleUserStatus={onToggleUserStatus}
              onSaveTimSukses={onSaveTimSukses}
              onRefreshUsers={onRefreshUsers}
              onAwardPoints={onAwardPoints}
            />
          )}

          {/* 12. PROFIL SAYA */}
          {activeTab === 'profil' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
                  {renderAvatar('w-20 h-20', 'text-2xl')}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 truncate">
                        {staffUser.nama}
                      </h2>
                      <p className="text-xs text-slate-500 font-mono">@{staffUser.username}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>
                          {isUploadingPhoto
                            ? 'Mengunggah Foto...'
                            : staffUser.fotoUrl
                            ? 'Ganti Foto Profil'
                            : 'Unggah Foto Profil'}
                        </span>
                      </button>

                      {staffUser.fotoUrl && (
                        <button
                          type="button"
                          disabled={isUploadingPhoto}
                          onClick={handleRemovePhoto}
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identity Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                      <Shield className="w-3.5 h-3.5" /> Role Akses
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">{roleMeta.label}</p>
                    <p className="text-[11px] font-mono font-bold text-amber-700">
                      Total Poin: {kaderPoints.toLocaleString('id-ID')} Poin
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                      <Briefcase className="w-3.5 h-3.5" /> Jabatan / Divisi
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {staffUser.jabatan || '-'}
                    </p>
                    {staffUser.divisi && (
                      <p className="text-[11px] text-slate-500">{staffUser.divisi}</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                      <MapPin className="w-3.5 h-3.5" /> Wilayah Penugasan (Kota / Kec / Kel)
                    </span>
                    <p className="text-sm font-bold text-slate-900">{wilayahDisplay}</p>
                    {staffUser.kelurahan && (
                      <p className="text-[11px] text-emerald-700 font-bold">
                        Kelurahan: {staffUser.kelurahan}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                      <Mail className="w-3.5 h-3.5" /> Email &amp; Telepon
                    </span>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {staffUser.email || '-'}
                    </p>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {staffUser.noHp || '-'}
                    </p>
                  </div>
                </div>

                {isKorcam && korwilSupervisor && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Korwil Pembina</p>
                      <p className="text-sm font-extrabold text-slate-900">{korwilSupervisor}</p>
                    </div>
                  </div>
                )}

                {isRelawan && (staffUser.korcamNama || korwilSupervisor) && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Koordinator Pembina</p>
                      <p className="text-sm font-extrabold text-slate-900">
                        {staffUser.korcamNama || korwilSupervisor}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isSyncingProfile}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingProfile ? 'animate-spin' : ''}`} />
                    <span>Sinkronkan Ulang dari Cloud</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigasi Portal Swaraku"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 h-16 px-1 flex items-center justify-around"
      >
        {mobileBottomItems.map((tabId) => {
          const item = navItems.find((n) => n.id === tabId);
          if (!item) return null;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`min-h-[44px] min-w-[52px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[68px]">{item.shortLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="min-h-[44px] min-w-[52px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Confirm Reset Modal for Peta Suara */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Reset Data Peta Suara ke 0?
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Tindakan ini mengosongkan tampilan daftar voter &amp; wilayah kerja di layar aktif Anda.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDataToZero();
                  setConfirmResetOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supporting Operational Modals */}
      <FormC1UploadModal
        isOpen={showC1Modal}
        onClose={() => setShowC1Modal(false)}
        defaultTps={staffUser.kelurahan || 'Kel. Cilandak Barat'}
        defaultSaksiNama={staffUser.nama}
        onSubmitC1={onSubmitC1}
      />

      <FormB1UploadModal
        isOpen={showB1Modal}
        onClose={() => setShowB1Modal(false)}
        defaultKoordinator={staffUser.nama}
        onSubmitB1={onSubmitB1}
      />

      <QuickCountModal
        isOpen={showQuickCountModal}
        onClose={() => setShowQuickCountModal(false)}
        c1Records={c1Records}
        b1Records={b1Records}
        onOpenUploadC1={() => {
          setShowQuickCountModal(false);
          setShowC1Modal(true);
        }}
        onOpenUploadB1={() => {
          setShowQuickCountModal(false);
          setShowB1Modal(true);
        }}
      />

      <WhatsAppBlaztModal
        isOpen={showBlaztModal}
        onClose={() => setShowBlaztModal(false)}
        blaztLogs={blaztLogs}
        onTriggerBlazt={onTriggerBlazt}
      />

      <TambahNikUndangTemanModal
        isOpen={showTambahNikModal}
        onClose={() => setShowTambahNikModal(false)}
        profile={staffVoterProfile}
        invitedList={invitedList}
        onAddInvitedFriend={onAddInvitedFriend}
      />

      <PendaftaranVoterOcrModal
        isOpen={showVoterOcrModal}
        onClose={() => setShowVoterOcrModal(false)}
        onSaveVoter={handleSaveVoterWithRole}
        defaultTps={staffUser.kelurahan || 'Cilandak Barat'}
        kaderNama={staffUser.nama}
      />

      <QuickCountOcrModal
        isOpen={showQuickCountOcrModal}
        onClose={() => setShowQuickCountOcrModal(false)}
        onApproveC1={(data) => onSubmitC1(data)}
        onApproveB1={(data) => onSubmitB1(data)}
        defaultTps={staffUser.kelurahan || 'Cilandak Barat'}
        saksiNama={staffUser.nama}
      />

      <ElectabilitySurveyModal
        isOpen={showSurveyModal}
        onClose={() => setShowSurveyModal(false)}
        surveyList={surveyList}
        onSubmitSurvey={onSubmitSurvey}
      />

      <CekTpsAiModal
        isOpen={showCekTpsAiModal}
        onClose={() => setShowCekTpsAiModal(false)}
        onSaveVoter={onSaveDptVoter}
      />

      <AutoCekNikModal
        isOpen={showAutoCekNikModal}
        onClose={() => setShowAutoCekNikModal(false)}
        onSaveVoter={onSaveDptVoter}
      />

      {canUseAiPilcaleg && (
        <AiPilcalegModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          userRole={isAdminOrSuper ? 'admin' : 'tim_sukses'}
          onNavigateToBlazt={() => {
            setShowAiModal(false);
            setShowBlaztModal(true);
          }}
        />
      )}
    </div>
  );
};

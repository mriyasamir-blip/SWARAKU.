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
  BadgeCheck,
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
import { SuperadminView } from './SuperadminView';
import { EventLocationMap } from '../maps/EventLocationMap';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { isSuperAdminEmail } from '../../services/swarakuFirestore';
import { AspirasiScreen } from '../mobile/screens/AspirasiScreen';
import { MonitoringPetaSuaraScreen } from '../mobile/screens/MonitoringPetaSuaraScreen';
import { TpsFinderScreen } from '../mobile/screens/TpsFinderScreen';
import { DatabaseVotersView } from '../timsukses/DatabaseVotersView';
import { CommandCenterView } from '../command/CommandCenterView';
import { GroundOperationsView } from '../ground/GroundOperationsView';
import { FormC1UploadModal } from '../common/FormC1UploadModal';
import { FormB1UploadModal } from '../common/FormB1UploadModal';
import { QuickCountModal } from '../common/QuickCountModal';
import { WhatsAppBlaztModal } from '../common/WhatsAppBlaztModal';
import { TambahNikUndangTemanModal } from '../common/TambahNikUndangTemanModal';
import { AiPilcalegModal } from '../common/AiPilcalegModal';
import { PendaftaranVoterOcrModal } from '../kader/PendaftaranVoterOcrModal';

export type StaffTab =
  | 'beranda'
  | 'peta_suara'
  | 'command_center'
  | 'database_voters'
  | 'aspirasi'
  | 'tps'
  | 'operasi_lapangan'
  | 'kelola_voters'
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
    label: 'Super Admin',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Shield className="w-4 h-4" />,
  },
  admin: {
    label: 'Admin',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: <Sliders className="w-4 h-4" />,
  },
  tim_sukses: {
    label: 'Tim Sukses',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: <Building2 className="w-4 h-4" />,
  },
  kader: {
    label: 'Kader',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <UserCheck className="w-4 h-4" />,
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
  onCheckinCoblos,
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

  // Supporting Admin Modals
  const [showC1Modal, setShowC1Modal] = useState(false);
  const [showB1Modal, setShowB1Modal] = useState(false);
  const [showQuickCountModal, setShowQuickCountModal] = useState(false);
  const [showBlaztModal, setShowBlaztModal] = useState(false);
  const [showTambahNikModal, setShowTambahNikModal] = useState(false);
  const [showVoterOcrModal, setShowVoterOcrModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const roleMeta = ROLE_META[staffUser.role] || ROLE_META.kader;
  const isAdminOrSuper = staffUser.role === 'super_admin' || staffUser.role === 'admin';
  const hasGoogleSuperAdmin = Boolean(authUser && isSuperAdminEmail(authUser.email));
  const timSuksesSupervisor =
    staffUser.timSuksesNama || staffUser.didaftarkanOlehTimSukses || '';

  // Derived VoterProfile for legacy TPS / Undang Teman sub-components
  const staffVoterProfile = useMemo<VoterProfile>(
    () => ({
      nama: staffUser.nama,
      username: staffUser.username,
      nikMasked: '3174 •••• •••• 0001',
      noHpMasked: staffUser.noHp || '-',
      dapil: staffUser.wilayah || 'DAPIL DKI JAKARTA II',
      tps: staffUser.tps || 'TPS 047',
      kelurahan: 'Kel. Sukamaju',
      kecamatan: 'Kec. Cilandak',
      kota: 'Jakarta Selatan',
      poinSuara: kaderPoints,
      tier: 'Gold',
      poinNextTier: 1000,
      tierMaxPoin: 1500,
      totalRujukan: invitedList.length,
      aktifBulanIni: voterOcrRecords.length,
      bergabungMingguIni: voterOcrRecords.length,
      sudahMencoblos,
      lencana: [],
      referralCode: `SW-${(staffUser.username || 'STAFF').toUpperCase()}`,
    }),
    [staffUser, kaderPoints, invitedList.length, voterOcrRecords.length, sudahMencoblos]
  );

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
    ];

    if (isAdminOrSuper) {
      items.push(
        {
          id: 'peta_suara',
          label: 'Peta Suara (Google Maps)',
          shortLabel: 'Peta Suara',
          icon: <Compass className="w-5 h-5" />,
          badge: timSuksesList.length > 0 ? timSuksesList.length : undefined,
        },
        {
          id: 'command_center',
          label: 'Command Center',
          shortLabel: 'Command',
          icon: <Radio className="w-5 h-5" />,
        },
        {
          id: 'database_voters',
          label: 'Database Voters',
          shortLabel: 'Data Voters',
          icon: <Database className="w-5 h-5" />,
          badge: voterOcrRecords.length,
        },
        {
          id: 'aspirasi',
          label: 'Aspirasi Warga',
          shortLabel: 'Aspirasi',
          icon: <MessageSquare className="w-5 h-5" />,
          badge: aspirasiList.length > 0 ? aspirasiList.length : undefined,
        },
        {
          id: 'tps',
          label: 'TPS & Info Saksi',
          shortLabel: 'TPS & C1',
          icon: <MapPin className="w-5 h-5" />,
        },
        {
          id: 'operasi_lapangan',
          label: 'Operasi Lapangan',
          shortLabel: 'Lapangan',
          icon: <UserCheck className="w-5 h-5" />,
        }
      );
    }

    if (staffUser.role === 'super_admin') {
      items.push(
        {
          id: 'kelola_voters',
          label: 'Panel Manajemen Superadmin',
          shortLabel: 'Superadmin',
          icon: <Shield className="w-5 h-5" />,
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
    isAdminOrSuper,
    staffUser.role,
    timSuksesList.length,
    voterOcrRecords.length,
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

  // Mobile bottom navigation displays up to 4 key shortcuts + Menu drawer trigger (when Admin/Super Admin)
  const mobileBottomItems: StaffTab[] = isAdminOrSuper
    ? ['beranda', 'peta_suara', 'command_center', 'database_voters']
    : ['beranda', 'profil'];

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
            <p className="text-xs text-slate-500 truncate">Portal Tim Kampanye</p>
          </div>
        </div>

        {/* Dynamic Staff Brief */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
          {renderAvatar('w-11 h-11', 'text-sm')}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{staffUser.nama}</p>
            <p className="text-xs text-slate-500 truncate">@{staffUser.username}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${roleMeta.badgeClass}`}
            >
              {roleMeta.icon}
              <span>{roleMeta.label}</span>
            </span>
          </div>
        </div>

        {/* Quick Actions for Admin & Super Admin */}
        {isAdminOrSuper && (
          <div className="px-4 pt-3 pb-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTriggerCloudSync}
              disabled={isSyncingCloud}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Sinkron...' : 'Sinkron'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI PILCALEG</span>
            </button>
          </div>
        )}

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
          {isAdminOrSuper && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Buka semua menu Admin"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <img src="/icon.svg" alt="Swaraku" className="w-7 h-7 shrink-0" />
          <div className="min-w-0">
            <span className="font-extrabold text-sm text-slate-900 block truncate">
              {staffUser.nama}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdminOrSuper && (
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="h-8 px-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI</span>
            </button>
          )}
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${roleMeta.badgeClass}`}
          >
            {roleMeta.label}
          </span>
          <PWAInstallButton variant="compact" label="App" />
        </div>
      </header>

      {/* Mobile Full Drawer Menu for Admin / Super Admin */}
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

            {isAdminOrSuper && (
              <div className="px-4 pt-3 pb-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onTriggerCloudSync();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isSyncingCloud}
                  className="min-h-[38px] px-2 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>Sinkron Cloud</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="min-h-[38px] px-2 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI PILCALEG</span>
                </button>
              </div>
            )}

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
              {/* Staff Identity Hero Card */}
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
                      {staffUser.tps && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                          {staffUser.tps}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                      {staffUser.nama}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      {staffUser.jabatan} &middot; {staffUser.wilayah}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isAdminOrSuper && (
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
                    <span>{isSyncingProfile ? 'Menyinkronkan...' : 'Sinkronkan Profil'}</span>
                  </button>
                </div>
              </div>

              {/* Admin / Superadmin Command Overview KPI & Quick Access Cards */}
              {isAdminOrSuper && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Data Voters (OCR)</span>
                        <Database className="w-4 h-4 text-cyan-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {voterOcrRecords.length.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[11px] text-cyan-700 font-medium">
                        Tersinkron Cloud Firestore
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Tim Sukses Wilayah</span>
                        <Compass className="w-4 h-4 text-teal-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {timSuksesList.length.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[11px] text-teal-700 font-medium">
                        Terpetakan di Google Maps
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Form C1 &amp; B1 Masuk</span>
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {c1Records.length + b1Records.length}
                      </p>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Rekap Saksi TPS &amp; PPK
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold">Aspirasi Masuk</span>
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {aspirasiList.length}
                      </p>
                      <span className="text-[11px] text-indigo-700 font-medium">
                        Advokasi &amp; Respon Tim
                      </span>
                    </div>
                  </div>

                  {/* Quick Module Cards for Admin / Superadmin */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                      Menu Modul Utama {roleMeta.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                              Peta Suara (Google Maps API)
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Monitoring titik suara voter, korcam, &amp; sebaran wilayah live.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('command_center')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Radio className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Command Center</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              War room tabulasi C1/B1, cek DPT KPU, survei, WA Blazt &amp; logistik.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1" />
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
                            <h4 className="text-sm font-black text-slate-900">Data Voters (OCR)</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Scan e-KTP pemilih, peta titik lokasi, filter TPS &amp; ekspor laporan.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('aspirasi')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Aspirasi Warga</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Catat &amp; pantau tindak lanjut aspirasi warga per wilayah.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('tps')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">TPS &amp; Info Saksi</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Unggah Formulir C1 Plano, Form B1, &amp; pantau Quick Count.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 mt-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('operasi_lapangan')}
                        className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Operasi Lapangan</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Canvassing door-to-door, auto-cek NIK, &amp; WA Blazt relawan.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0 mt-1" />
                      </button>

                      {staffUser.role === 'super_admin' && (
                        <>
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
                                  Panel Manajemen Superadmin
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Kelola jadwal acara + Map Picker, katalog reward, info Caleg, data voters &amp; aktivitas.
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
                                  Daftarkan Admin, Tim Sukses, dan Kader otomatis tersinkron.
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0 mt-1" />
                          </button>
                        </>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Relasi Kader <-> Tim Sukses */}
              {staffUser.role === 'kader' && timSuksesSupervisor && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                      Tim Sukses Pembina Anda
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {timSuksesSupervisor}
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Akun Anda terhubung otomatis di bawah koordinasi Tim Sukses tersebut.
                    </p>
                  </div>
                </div>
              )}

              {staffUser.role === 'tim_sukses' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Daftar Kader Binaan Anda
                      </h3>
                      <p className="text-xs text-slate-500">
                        Kader yang terdaftar bersama akun Tim Sukses Anda di Cloud Database
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-extrabold font-mono">
                      {staffUser.kaderList?.length || 0} Kader
                    </span>
                  </div>

                  {staffUser.kaderList && staffUser.kaderList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {staffUser.kaderList.map((kaderName, idx) => (
                        <div
                          key={`${kaderName}-${idx}`}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(kaderName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {kaderName}
                            </p>
                            <p className="text-xs text-slate-500">Kader Lapangan</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-3">
                      Belum ada kader binaan yang ditautkan ke akun Tim Sukses ini.
                    </p>
                  )}
                </div>
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

          {/* 2. PETA SUARA (GOOGLE MAPS API) */}
          {activeTab === 'peta_suara' && isAdminOrSuper && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <MonitoringPetaSuaraScreen
                voterList={voterOcrRecords}
                dptList={dptList}
                timSuksesList={timSuksesList}
                currentUser={staffUser}
                onSaveTimSukses={onSaveTimSukses}
                onSaveVoter={onSaveVoter}
                onResetDataToZero={() => setConfirmResetOpen(true)}
                onOpenWhatsAppBlazt={() => setShowBlaztModal(true)}
                onNavigateTab={(tab) => handleSelectTab(tab as StaffTab)}
                onOpenTambahNikModal={() => setShowTambahNikModal(true)}
              />
            </div>
          )}

          {/* 3. COMMAND CENTER */}
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

          {/* 4. DATABASE VOTERS (DATA VOTERS) */}
          {activeTab === 'database_voters' && isAdminOrSuper && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <DatabaseVotersView
                voterList={voterOcrRecords}
                onOpenDaftarVoterModal={() => setShowVoterOcrModal(true)}
                onTriggerCloudSync={onTriggerCloudSync}
                isSyncingCloud={isSyncingCloud}
              />
            </div>
          )}

          {/* 5. ASPIRASI */}
          {activeTab === 'aspirasi' && isAdminOrSuper && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <AspirasiScreen
                aspirasiList={aspirasiList}
                onSubmitAspirasi={onSubmitAspirasi}
                onUpvoteAspirasi={onUpvoteAspirasi}
              />
            </div>
          )}

          {/* 6. TPS & INFO SAKSI */}
          {activeTab === 'tps' && isAdminOrSuper && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    TPS &amp; Info Relawan Saksi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kelola lokasi TPS, unggah Form C1 Plano / Form B1, &amp; tabulasi Quick Count.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowC1Modal(true)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Unggah C1
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowB1Modal(true)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Unggah B1
                  </button>
                </div>
              </div>
              <TpsFinderScreen
                profile={staffVoterProfile}
                onCheckinCoblos={onCheckinCoblos}
                onSubmitC1={onSubmitC1}
                onSubmitB1={onSubmitB1}
                onOpenQuickCount={() => setShowQuickCountModal(true)}
              />
            </div>
          )}

          {/* 7. OPERASI LAPANGAN */}
          {activeTab === 'operasi_lapangan' && isAdminOrSuper && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <GroundOperationsView
                onRegisterVoter={onRegisterVoterField}
                kaderPoints={kaderPoints}
              />
            </div>
          )}

          {/* 8. KELOLA ROLE & USER (KHUSUS SUPER ADMIN) */}
          {activeTab === 'kelola_akun' && staffUser.role === 'super_admin' && (
            <UserRoleManagementView
              userAccounts={userAccounts}
              currentUser={staffUser}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              onToggleUserStatus={onToggleUserStatus}
              onSaveTimSukses={onSaveTimSukses}
              onRefreshUsers={onRefreshUsers}
            />
          )}

          {/* 9. PANEL MANAJEMEN SUPERADMIN (KHUSUS SUPER ADMIN) */}
          {activeTab === 'kelola_voters' && staffUser.role === 'super_admin' && (
            <SuperadminView
              events={events}
              rewards={rewards}
              calegInfoList={calegInfoList}
              onNotify={onNotify}
              hasGoogleSuperAdmin={hasGoogleSuperAdmin}
              onConnectGoogleAdmin={onConnectGoogleAdmin}
            />
          )}

          {/* 10. PROFIL SAYA */}
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

                {/* Dynamic Identity Details from Super Admin Cloud Database */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                      <Shield className="w-3.5 h-3.5" /> Role Akses
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">{roleMeta.label}</p>
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
                      <MapPin className="w-3.5 h-3.5" /> Wilayah / Dapil
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {staffUser.wilayah || '-'}
                    </p>
                    {staffUser.tps && (
                      <p className="text-[11px] font-mono text-emerald-700 font-bold">
                        Penugasan: {staffUser.tps}
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

                {staffUser.role === 'kader' && timSuksesSupervisor && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Tim Sukses Pembina</p>
                      <p className="text-sm font-extrabold text-slate-900">{timSuksesSupervisor}</p>
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
        aria-label="Navigasi Portal Tim"
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
        {isAdminOrSuper && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="min-h-[44px] min-w-[52px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span>Menu</span>
          </button>
        )}
      </nav>

      {/* Inline Confirm Reset Modal for Peta Suara */}
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

      {/* Supporting Admin / Campaign Modals */}
      <FormC1UploadModal
        isOpen={showC1Modal}
        onClose={() => setShowC1Modal(false)}
        defaultTps={staffUser.tps || 'TPS 047'}
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
        onSaveVoter={onSaveVoter}
        defaultTps={staffUser.tps || 'TPS 001'}
        kaderNama={staffUser.nama}
      />

      <AiPilcalegModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        userRole="admin"
        onNavigateToBlazt={() => {
          setShowAiModal(false);
          setShowBlaztModal(true);
        }}
      />
    </div>
  );
};

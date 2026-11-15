import React, { useState, useRef } from 'react';
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
  KeyRound,
} from 'lucide-react';
import type { UserAccount, UserRole } from '../../types/vore';
import type { CalegInfoDoc, CampaignEventDoc, RewardDoc } from '../../types/swaraku';
import { UserRoleManagementView } from '../admin/UserRoleManagementView';
import { SuperadminView } from './SuperadminView';
import { EventLocationMap } from '../maps/EventLocationMap';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { isSuperAdminEmail } from '../../services/swarakuFirestore';

type StaffTab = 'beranda' | 'kelola_akun' | 'kelola_voters' | 'profil';

interface StaffPortalAppProps {
  staffUser: UserAccount;
  userAccounts: UserAccount[];
  authUser: User | null;
  events: CampaignEventDoc[];
  rewards: RewardDoc[];
  calegInfoList: CalegInfoDoc[];
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
}) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('beranda');
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const roleMeta = ROLE_META[staffUser.role] || ROLE_META.kader;
  const hasGoogleSuperAdmin = Boolean(authUser && isSuperAdminEmail(authUser.email));
  const timSuksesSupervisor =
    staffUser.timSuksesNama || staffUser.didaftarkanOlehTimSukses || '';

  const navItems: { id: StaffTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'beranda', label: 'Beranda Tim', shortLabel: 'Beranda', icon: <Home className="w-5 h-5" /> },
  ];

  if (staffUser.role === 'super_admin') {
    navItems.push({
      id: 'kelola_akun',
      label: 'Kelola Akun Staff',
      shortLabel: 'Akun',
      icon: <Users className="w-5 h-5" />,
    });
  }

  if (staffUser.role === 'super_admin' || staffUser.role === 'admin') {
    navItems.push({
      id: 'kelola_voters',
      label: 'Voters, Acara & Reward',
      shortLabel: 'Kampanye',
      icon: <Shield className="w-5 h-5" />,
    });
  }

  navItems.push({
    id: 'profil',
    label: 'Profil Saya',
    shortLabel: 'Profil',
    icon: <UserIcon className="w-5 h-5" />,
  });

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 p-1.5 flex items-center justify-center shrink-0">
            <img src="/icon.svg" alt="Swaraku" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-slate-900 leading-tight">Swaraku</p>
            <p className="text-xs text-slate-500 truncate">Portal Tim Kampanye</p>
          </div>
        </div>

        {/* Dynamic Staff Brief */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
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

        {/* Nav Links */}
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
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2.5">
          <PWAInstallButton
            variant="outline"
            label="Pasang Aplikasi"
            className="w-full justify-center min-h-[42px]"
          />
          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/icon.svg" alt="Swaraku" className="w-7 h-7 shrink-0" />
          <div className="min-w-0">
            <span className="font-extrabold text-sm text-slate-900 block truncate">
              {staffUser.nama}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleMeta.badgeClass}`}
          >
            {roleMeta.label}
          </span>
          <PWAInstallButton variant="compact" label="App" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isSyncingProfile}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingProfile ? 'animate-spin' : ''}`} />
                  <span>{isSyncingProfile ? 'Menyinkronkan...' : 'Sinkronkan Profil'}</span>
                </button>
              </div>

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

          {activeTab === 'kelola_akun' && staffUser.role === 'super_admin' && (
            <UserRoleManagementView
              userAccounts={userAccounts}
              currentUser={staffUser}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              onToggleUserStatus={onToggleUserStatus}
              onRefreshUsers={onRefreshUsers}
            />
          )}

          {activeTab === 'kelola_voters' &&
            (staffUser.role === 'super_admin' || staffUser.role === 'admin') && (
              <>
                {hasGoogleSuperAdmin ? (
                  <SuperadminView
                    events={events}
                    rewards={rewards}
                    calegInfoList={calegInfoList}
                    onNotify={onNotify}
                  />
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-xl mx-auto text-center space-y-4 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Verifikasi Google Admin Diperlukan
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Untuk mengakses data sensitif Pemilih (Voters), Riwayat Klaim Reward, Aspirasi Masuk, dan Book Activity Login, verifikasikan sesi Anda menggunakan akun Google Superadmin terdaftar.
                    </p>
                    <button
                      type="button"
                      disabled={isConnectingGoogle}
                      onClick={async () => {
                        setIsConnectingGoogle(true);
                        try {
                          await onConnectGoogleAdmin();
                        } finally {
                          setIsConnectingGoogle(false);
                        }
                      }}
                      className="min-h-[46px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span>
                        {isConnectingGoogle
                          ? 'Menghubungkan Google...'
                          : 'Hubungkan Akun Google Superadmin'}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}

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
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] min-w-[52px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[68px]">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

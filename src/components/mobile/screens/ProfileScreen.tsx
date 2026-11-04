import React, { useState } from 'react';
import { VoterProfile, UserAccount } from '../../../types/vore';
import { APP_IMAGES } from '../../../assets/images';
import { PWAInstallButton } from '../../pwa/PWAInstallButton';
import {
  ShieldCheck,
  Lock,
  Award,
  Users,
  Share2,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  History,
  QrCode,
  Smartphone,
  UserPlus,
  LogOut,
} from 'lucide-react';

interface ProfileScreenProps {
  profile: VoterProfile;
  onOpenReferralModal: () => void;
  onOpenTambahNikModal?: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onOpenReferralModal,
  onOpenTambahNikModal,
  currentUser,
  onLogout,
}) => {
  const [showFullNik, setShowFullNik] = useState(false);
  const [privacyConsentActive, setPrivacyConsentActive] = useState(true);

  return (
    <div className="flex flex-col space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Profil</h1>
        <button
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          aria-label="Pengaturan"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* User Identity Card (Slide 13) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative space-y-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500 shadow-sm bg-slate-100 flex items-center justify-center">
            <img
              src={APP_IMAGES.voterAvatar}
              alt={profile.nama}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/images/vore_voter_avatar_1790655684379.jpg';
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">{profile.nama}</h2>
          <span className="text-xs text-slate-400 font-mono">{profile.username}</span>
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mx-auto w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Terverifikasi e-KTP</span>
          </div>
        </div>

        {/* Region & TPS Info */}
        <div className="w-full pt-3 mt-1 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">Wilayah DAPIL</span>
            <span className="font-bold text-slate-800 line-clamp-1">{profile.dapil}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">TPS Terdaftar</span>
            <span className="font-bold text-slate-800 line-clamp-1">{profile.tps} · {profile.kelurahan}</span>
          </div>
        </div>
      </div>

      {/* Ringkasan Jaringan Rujukan (Slide 13) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">Ringkasan Jaringan Rujukan</h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenTambahNikModal || onOpenReferralModal}
              className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-xl border border-cyan-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
              <span>+ Tambah NIK Teman</span>
            </button>
            <button
              onClick={onOpenReferralModal}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>QR</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-cyan-50 rounded-2xl border border-cyan-100">
            <span className="text-xl font-black font-mono text-cyan-900 block tabular-nums">
              {profile.totalRujukan}
            </span>
            <span className="text-[10px] font-semibold text-cyan-700">Total Rujukan</span>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-xl font-black font-mono text-emerald-900 block tabular-nums">
              {profile.aktifBulanIni}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">Aktif Bulan Ini</span>
          </div>

          <div className="p-2.5 bg-indigo-50 rounded-2xl border border-indigo-100">
            <span className="text-xl font-black font-mono text-indigo-900 block tabular-nums">
              {profile.bergabungMingguIni}
            </span>
            <span className="text-[10px] font-semibold text-indigo-700">Bergabung</span>
          </div>
        </div>

        {/* Status Relawan & Kesiapan TPS Box (Tanpa Poin) */}
        <div className="p-3 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl border border-cyan-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-cyan-800 uppercase block">
              Status Relawan Pemilih
            </span>
            <span className="text-sm font-black text-cyan-950">
              Terverifikasi &amp; Siaga TPS
            </span>
          </div>
          <span className="px-3 py-1 bg-cyan-600 text-white font-extrabold text-xs rounded-full shadow-xs">
            Kader Aktif
          </span>
        </div>
      </div>

      {/* Lencana (Badges) Section (Slide 13) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900">Lencana Kehormatan Warga</h3>
        <div className="grid grid-cols-2 gap-2">
          {profile.lencana.map((l) => (
            <div
              key={l.id}
              className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {l.nama}
                </span>
                <span className="text-[9px] text-slate-500 line-clamp-1">
                  {l.deskripsi}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aktivitas Terbaru (Slide 13) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">Aktivitas Terbaru</h3>
          <span className="text-[10px] text-slate-400">Audit Trail Terenkripsi</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-800">Mengajak 3 teman bergabung</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">Terdaftar DPT</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              <span className="font-semibold text-slate-800">Aspirasi jalan lingkungan diterima</span>
            </div>
            <span className="text-[10px] text-slate-400">3 hari lalu</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-semibold text-slate-800">Menyelesaikan survei kesiapan</span>
            </div>
            <span className="text-[11px] font-semibold text-cyan-700">Tersinkronisasi</span>
          </div>
        </div>
      </div>

      {/* Keamanan, Enkripsi & Kontrol Privasi (Slide 4) */}
      <div className="p-4 bg-gradient-to-br from-slate-50 via-cyan-50/40 to-white text-slate-900 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-700" />
            <h3 className="text-xs font-bold text-slate-900">Privasi &amp; Keamanan Data</h3>
          </div>
          <span className="text-[10px] text-cyan-800 font-mono font-bold bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-200">
            Privacy by Design
          </span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1.5 text-xs shadow-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Nomor Induk Kependudukan (NIK)</span>
            <button
              onClick={() => setShowFullNik(!showFullNik)}
              className="text-cyan-700 hover:text-cyan-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              {showFullNik ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showFullNik ? 'Samarkan' : 'Tinjau'}</span>
            </button>
          </div>
          <p className="font-mono font-bold text-slate-900 tracking-widest text-sm">
            {showFullNik ? '3174 0521 0892 0012' : profile.nikMasked}
          </p>
          <span className="text-[10px] text-slate-500 block">
            NIK terenkripsi SHA-256 dan hanya dapat diakses berdasarkan otorisasi peran (RBAC).
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-600 font-medium">Persetujuan Eksplisit Data (Consent)</span>
          <button
            onClick={() => setPrivacyConsentActive(!privacyConsentActive)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
              privacyConsentActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {privacyConsentActive ? 'Aktif (Diberikan)' : 'Dicabut'}
          </button>
        </div>
      </div>

      {/* Instalasi Aplikasi PWA */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-100">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">SWARAKU Apps (PWA)</h4>
            <p className="text-[11px] text-slate-500">Pasang aplikasi di layar utama perangkat</p>
          </div>
        </div>
        <PWAInstallButton label="Download App" />
      </div>

      {/* Tombol Keluar / Logout Akun */}
      {onLogout && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-2xs"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>
              Keluar dari Akun {currentUser?.nama ? `(${currentUser.nama})` : 'SWARAKU'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

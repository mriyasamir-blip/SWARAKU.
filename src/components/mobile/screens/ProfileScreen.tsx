import React, { useState, useRef } from 'react';
import { VoterProfile, UserAccount } from '../../../types/vore';
import { PWAInstallButton } from '../../pwa/PWAInstallButton';
import {
  ShieldCheck,
  Lock,
  Award,
  Share2,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  Smartphone,
  UserPlus,
  LogOut,
  Building2,
  Shield,
  MapPin,
  Phone,
  Briefcase,
  Sparkles,
  RefreshCw,
  Camera,
  Trash2,
  Upload,
  Check,
  X,
  AlertCircle,
  Users,
  UserCheck,
} from 'lucide-react';

interface ProfileScreenProps {
  profile: VoterProfile;
  onOpenReferralModal: () => void;
  onOpenTambahNikModal?: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onRefreshProfile?: () => Promise<void>;
  onUpdatePhoto?: (newFotoUrl: string) => Promise<boolean | void>;
}

/**
 * Kompresi gambar client-side menggunakan HTML5 Canvas
 * Menghasilkan Data URL JPEG berukuran ringan (~25-45KB) yang aman untuk Cloud Firestore
 */
async function compressImageToDataUrl(file: File, maxDim: number = 320, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onOpenReferralModal,
  onOpenTambahNikModal,
  currentUser,
  onLogout,
  onRefreshProfile,
  onUpdatePhoto,
}) => {
  const [showFullNik, setShowFullNik] = useState(false);
  const [privacyConsentActive, setPrivacyConsentActive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State untuk modal Ganti Foto Profil
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic values prioritizing the authenticated user from Cloud Database / Super Admin
  const displayName = currentUser?.nama || profile.nama;
  const displayUsername = currentUser?.username ? `@${currentUser.username}` : profile.username;
  const displayRoleLabel =
    currentUser?.role === 'super_admin'
      ? 'Super Admin'
      : currentUser?.role === 'admin'
      ? 'Administrator'
      : currentUser?.role === 'tim_sukses'
      ? 'Tim Sukses'
      : 'Kader Relawan TPS';
  const displayJabatan = currentUser?.jabatan || 'Koordinator TPS Lapangan';
  const displayIdPegawai =
    currentUser?.idPegawai || (currentUser?.id ? `ID-${currentUser.id.slice(-6)}` : 'KAD-048');
  const displayDivisi =
    currentUser?.divisi ||
    (currentUser?.role === 'tim_sukses' ? 'Divisi Bappilu & Peta Suara' : 'Divisi Saksi & Relawan');
  const displayWilayah = currentUser?.wilayah || profile.dapil;
  const displayTps = currentUser?.tps || profile.tps;
  const displayNoHp = currentUser?.noHp || '0812-8821-9901';
  const displayStatus = currentUser?.status || 'Aktif';

  // HILANGKAN FOTO BAWAAN SISTEM: HANYA TAMPILKAN FOTO JIKA ADA FOTO KUSTOM YANG SUDAH DIUNGGAH USER/SUPER ADMIN
  const hasCustomPhoto = Boolean(currentUser?.fotoUrl && currentUser.fotoUrl.trim().length > 0);
  const userInitials = (displayName || 'SW')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleManualRefresh = async () => {
    if (!onRefreshProfile) return;
    setIsRefreshing(true);
    try {
      await onRefreshProfile();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenFilePicker = () => {
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Format file harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    try {
      setPhotoError(null);
      const compressedData = await compressImageToDataUrl(file, 320, 0.85);
      setPreviewPhotoUrl(compressedData);
      setIsPhotoModalOpen(true);
    } catch (err: any) {
      setPhotoError('Gagal memproses gambar: ' + (err?.message || 'Error'));
    }
  };

  const handleSavePhoto = async () => {
    if (!previewPhotoUrl || !onUpdatePhoto) return;
    setIsSavingPhoto(true);
    setPhotoError(null);

    try {
      await onUpdatePhoto(previewPhotoUrl);
      setIsPhotoModalOpen(false);
      setPreviewPhotoUrl(null);
    } catch (err: any) {
      setPhotoError('Gagal menyimpan foto ke Cloud: ' + (err?.message || 'Koneksi bermasalah'));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!onUpdatePhoto) return;
    setIsSavingPhoto(true);
    setPhotoError(null);

    try {
      await onUpdatePhoto('');
      setIsPhotoModalOpen(false);
      setPreviewPhotoUrl(null);
    } catch (err: any) {
      setPhotoError('Gagal menghapus foto: ' + (err?.message || 'Koneksi bermasalah'));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-12 text-slate-800">
      {/* Hidden File Input for Profile Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Profil Pengguna</h1>
          <span className="text-[11px] text-slate-500">
            {currentUser ? 'Akun Resmi Terverifikasi Cloud' : 'Data Pemilih Terverifikasi'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onRefreshProfile && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-xl border border-cyan-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="Sinkronkan ulang data profil langsung dari Server Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{isRefreshing ? 'Sinkron...' : 'Sync Server'}</span>
            </button>
          )}
          <button
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Identity Card (Slide 13 & Cloud Auth Profile) */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative space-y-3">
        {/* Avatar Area with Camera Overlay Button */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-cyan-500 shadow-md bg-slate-100 flex items-center justify-center relative">
            {hasCustomPhoto && currentUser?.fotoUrl ? (
              <img
                src={currentUser.fotoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              /* Avatar Inisial Elegan - HILANGKAN FOTO BAWAAN SISTEM */
              <div
                className={`w-full h-full flex items-center justify-center font-black text-2xl text-white shadow-inner select-none ${
                  currentUser?.role === 'super_admin'
                    ? 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                    : currentUser?.role === 'admin'
                    ? 'bg-gradient-to-tr from-teal-700 to-emerald-600'
                    : currentUser?.role === 'tim_sukses'
                    ? 'bg-gradient-to-tr from-cyan-700 to-blue-600'
                    : 'bg-gradient-to-tr from-slate-800 to-slate-950'
                }`}
              >
                {userInitials}
              </div>
            )}
          </div>

          {/* Quick Camera Overlay Button */}
          <button
            type="button"
            onClick={handleOpenFilePicker}
            className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer transition-transform active:scale-90"
            title="Ganti Foto Profil"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Role Badge Indicator */}
          <div className="absolute top-0 left-0 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white border-2 border-white shadow-xs">
            {currentUser?.role === 'tim_sukses' ? (
              <Building2 className="w-3 h-3 text-cyan-300" />
            ) : currentUser?.role === 'super_admin' || currentUser?.role === 'admin' ? (
              <Shield className="w-3 h-3 text-purple-300" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
            )}
          </div>
        </div>

        {/* Action Button: Ganti Foto Profil */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenFilePicker}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-xl border border-cyan-200 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-600" />
            <span>{hasCustomPhoto ? 'Ganti Foto' : 'Pasang Foto Profil'}</span>
          </button>

          {hasCustomPhoto && (
            <button
              type="button"
              onClick={() => {
                setPreviewPhotoUrl(null);
                setIsPhotoModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Kelola Foto Profil"
            >
              <span>Kelola</span>
            </button>
          )}
        </div>

        <div className="w-full space-y-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h2 className="text-base font-black text-slate-900">{displayName}</h2>
            {displayStatus === 'Aktif' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <span>Nonaktif</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-mono font-medium">{displayUsername}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[10px] border border-indigo-200">
              {displayIdPegawai}
            </span>
          </div>

          <div className="pt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              <span>{displayRoleLabel}</span>
            </span>
            <span className="text-xs text-slate-600 font-semibold">{displayJabatan}</span>
          </div>
        </div>

        {/* Region, TPS, & Penugasan Grid */}
        <div className="w-full pt-3 mt-1 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <MapPin className="w-3 h-3 text-cyan-600" />
              <span className="text-[10px] font-semibold">Wilayah / Dapil</span>
            </div>
            <span className="font-bold text-slate-900 block truncate">{displayWilayah}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Building2 className="w-3 h-3 text-teal-600" />
              <span className="text-[10px] font-semibold">TPS &amp; Kelurahan</span>
            </div>
            <span className="font-bold text-slate-900 block truncate">
              {displayTps ? `${displayTps} · ${profile.kelurahan || 'Kelurahan DPT'}` : profile.kelurahan || 'TPS Terdaftar'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Briefcase className="w-3 h-3 text-indigo-600" />
              <span className="text-[10px] font-semibold">Divisi Penugasan</span>
            </div>
            <span className="font-bold text-slate-900 block truncate">{displayDivisi}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1 text-slate-400 mb-0.5">
              <Phone className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-semibold">Kontak WhatsApp</span>
            </div>
            <span className="font-bold font-mono text-slate-900 block truncate">{displayNoHp}</span>
          </div>
        </div>
      </div>

      {/* Informasi Tim Sukses Pembina (Khusus Akun Kader yang Didaftarkan Tim Sukses) */}
      {(currentUser?.timSuksesNama || currentUser?.didaftarkanOlehTimSukses) && (
        <div className="p-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white rounded-3xl border border-cyan-500/40 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>TIM SUKSES PEMBINA</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Terkoordinasi Resmi</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-300 font-medium">Akun kader Anda terhubung &amp; didaftarkan oleh:</div>
            <div className="text-base font-black text-white flex items-center gap-2">
              <span>{currentUser.timSuksesNama || currentUser.didaftarkanOlehTimSukses}</span>
              <span className="text-[10px] font-semibold text-cyan-200 bg-cyan-900/80 px-2 py-0.5 rounded-md border border-cyan-700/50">
                Koordinator Tim Sukses
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
              Setiap Form C1/B1, data DPT, dan hasil survei pemilih yang Anda input di lapangan otomatis tersinkron langsung ke pusat komando &amp; dashboard pemenangan <b>{currentUser.timSuksesNama || currentUser.didaftarkanOlehTimSukses}</b>.
            </p>
          </div>
        </div>
      )}

      {/* Informasi Daftar Kader Binaan (Khusus Akun Tim Sukses) */}
      {currentUser?.role === 'tim_sukses' && currentUser?.kaderList && currentUser.kaderList.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-500/40 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>DAFTAR KADER BINAAN ANDA</span>
            </span>
            <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              {currentUser.kaderList.length} Relawan Terdaftar
            </span>
          </div>

          <div>
            <div className="text-[11px] text-slate-300 mb-2">Relawan dan saksi TPS di bawah koordinasi Anda:</div>
            <div className="flex flex-wrap gap-1.5">
              {currentUser.kaderList.map((kaderName, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{kaderName}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Keamanan, Enkripsi & Kontrol Privasi */}
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

      {/* MODAL: GANTI FOTO PROFIL (TERINTEGRASI FIREBASE CLOUD & LOCALHOST) */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto text-left animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Ganti Foto Profil
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tersinkronisasi otomatis di semua device
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPhotoModalOpen(false);
                  setPreviewPhotoUrl(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {photoError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Preview Box */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-cyan-500 shadow-md bg-slate-100 flex items-center justify-center relative">
                {previewPhotoUrl ? (
                  <img
                    src={previewPhotoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : hasCustomPhoto && currentUser?.fotoUrl ? (
                  <img
                    src={currentUser.fotoUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-3xl text-white bg-slate-800">
                    {userInitials}
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-800">{displayName}</p>
                <p className="text-[11px] text-slate-400 font-mono">@{currentUser?.username || 'user'}</p>
                {previewPhotoUrl && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Gambar baru siap disimpan ke Cloud Database
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleOpenFilePicker}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Pilih Foto dari Perangkat / Kamera</span>
              </button>

              {previewPhotoUrl && (
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isSavingPhoto}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPhoto ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Cloud Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Foto ke Cloud Database</span>
                    </>
                  )}
                </button>
              )}

              {hasCustomPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isSavingPhoto}
                  className="w-full py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Hapus Foto (Gunakan Inisial Nama)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsPhotoModalOpen(false);
                  setPreviewPhotoUrl(null);
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

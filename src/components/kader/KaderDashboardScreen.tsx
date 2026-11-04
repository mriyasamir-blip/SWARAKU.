import React from 'react';
import { UserAccount, VoterProfile, FormC1Upload, FormB1Upload } from '../../types/vore';
import {
  Camera,
  Users,
  BarChart3,
  FileText,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Vote,
  Compass,
  MessageCircle,
  Share2,
  UserPlus,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  Bot,
  Target,
  Lightbulb,
  PhoneCall,
  Shield,
  Radio,
  Check,
} from 'lucide-react';
import { SwarakuLogo } from '../common/SwarakuLogo';

interface KaderDashboardScreenProps {
  userAccount: UserAccount;
  profile: VoterProfile;
  voterCount: number;
  c1Records?: FormC1Upload[];
  b1Records?: FormB1Upload[];
  onOpenDaftarVoterOcr: () => void;
  onOpenQuickCountOcr: () => void;
  onOpenDatabaseVoters: () => void;
  onOpenRekapPaslon: () => void;
  onNavigateTab: (tab: 'beranda' | 'aspirasi' | 'peta_suara' | 'tps' | 'profil') => void;
  onOpenSurvey?: () => void;
  onOpenTambahNik?: () => void;
  onOpenWhatsAppBlazt?: () => void;
  onSwitchAccount?: () => void;
  onOpenCekTpsAi?: () => void;
  onOpenAiPilcaleg?: () => void;
}

export const KaderDashboardScreen: React.FC<KaderDashboardScreenProps> = ({
  userAccount,
  profile,
  voterCount,
  c1Records = [],
  b1Records = [],
  onOpenDaftarVoterOcr,
  onOpenQuickCountOcr,
  onOpenDatabaseVoters,
  onOpenRekapPaslon,
  onNavigateTab,
  onOpenSurvey,
  onOpenTambahNik,
  onOpenWhatsAppBlazt,
  onSwitchAccount,
  onOpenCekTpsAi,
  onOpenAiPilcaleg,
}) => {
  // Aggregate live votes from scanned/uploaded Form C1 & B1
  const c1P1 = c1Records.reduce((acc, c) => acc + c.suaraPaslon1, 0);
  const c1P2 = c1Records.reduce((acc, c) => acc + c.suaraPaslon2, 0);
  const c1P3 = c1Records.reduce((acc, c) => acc + c.suaraPaslon3, 0);
  const c1TidakSah = c1Records.reduce((acc, c) => acc + c.suaraTidakSah, 0);

  const b1P1 = b1Records.reduce((acc, b) => acc + b.suaraPaslon1, 0);
  const b1P2 = b1Records.reduce((acc, b) => acc + b.suaraPaslon2, 0);
  const b1P3 = b1Records.reduce((acc, b) => acc + b.suaraPaslon3, 0);
  const b1TidakSah = b1Records.reduce((acc, b) => acc + b.suaraTidakSah, 0);

  const totalP1 = c1P1 + b1P1;
  const totalP2 = c1P2 + b1P2;
  const totalP3 = c1P3 + b1P3;
  const grandTotalSah = totalP1 + totalP2 + totalP3;
  const totalC1B1Masuk = c1Records.length + b1Records.length;

  const hasC1B1Data = grandTotalSah > 0;
  const pctP1 = hasC1B1Data ? ((totalP1 / grandTotalSah) * 100).toFixed(1) : (voterCount > 0 ? '100%' : '0%');
  const pctP2 = hasC1B1Data ? ((totalP2 / grandTotalSah) * 100).toFixed(1) : '0%';
  const pctP3 = hasC1B1Data ? ((totalP3 / grandTotalSah) * 100).toFixed(1) : '0%';

  const displayP1Votes = hasC1B1Data ? totalP1 : voterCount;
  const displayP2Votes = totalP2;
  const displayP3Votes = totalP3;
  return (
    <div className="flex flex-col space-y-4 pb-8 text-slate-800">
      {/* Top Header: Halo, Ahmad Rizky (Slide 8 & 9) */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-cyan-600/20">
            {(userAccount.nama || 'Ahmad Rizky')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full font-mono">
                {userAccount.role === 'tim_sukses' ? 'AKUN TIM SUKSES' : 'AKUN KADER'}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <SwarakuLogo variant="icon" size={14} />
                <span>
                  {userAccount.role === 'tim_sukses' ? 'SWARAKU Mobile · Tim Sukses' : 'SWARAKU Mobile'}
                </span>
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
              Halo, {userAccount.nama || (userAccount.role === 'tim_sukses' ? 'Bambang H.' : 'Ahmad Rizky')}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {userAccount.jabatan || (userAccount.role === 'tim_sukses' ? 'Direktur Bappilu & Tim Sukses' : 'Relawan Kel. Sukamaju • TPS 047')}
            </p>
          </div>
        </div>

        {onSwitchAccount && (
          <button
            onClick={onSwitchAccount}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            title="Ganti Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ganti Akun</span>
          </button>
        )}
      </div>

      {/* Hero Card: 85% DATA MASUK (Slide 8, 9, 15, 18) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white shadow-xl space-y-3 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-extrabold block">
              TABULASI SUARA TPS &amp; DAPIL
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-teal-300 font-mono tracking-tight">
                {totalC1B1Masuk > 0
                  ? `${Math.min(100, Math.round((totalC1B1Masuk / 20) * 100))}%`
                  : voterCount > 0
                  ? `${Math.min(100, Math.round((voterCount / 500) * 100))}%`
                  : '0%'}
              </span>
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                DATA MASUK
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Status Tabulasi</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {totalC1B1Masuk > 0
                ? `${totalC1B1Masuk} Berkas C1/B1 Terverifikasi`
                : voterCount > 0
                ? `${voterCount} Voter Terverifikasi`
                : 'Siap Input Voter & C1'}
            </span>
          </div>
        </div>

        {/* Voting Percentage Summary */}
        <div className="space-y-2 pt-1 text-xs">
          {/* Paslon 01 (Utama) */}
          <div className="flex items-center justify-between py-1 bg-white/5 px-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-teal-500/30 text-teal-300 font-black text-[10px] flex items-center justify-center font-mono">
                01
              </span>
              <span className="font-bold text-white">Paslon 01</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-teal-300 font-extrabold">{pctP1}%</span>
              <span className="font-mono text-slate-300 font-medium tabular-nums">{displayP1Votes} suara</span>
            </div>
          </div>

          {/* Paslon 02 */}
          <div className="flex items-center justify-between py-1 bg-white/5 px-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-slate-300 font-black text-[10px] flex items-center justify-center font-mono">
                02
              </span>
              <span className="font-medium text-slate-300">Paslon 02</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-white font-bold">{pctP2}%</span>
              <span className="font-mono text-slate-400 font-medium tabular-nums">{displayP2Votes} suara</span>
            </div>
          </div>

          {/* Paslon 03 */}
          <div className="flex items-center justify-between py-1 bg-white/5 px-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-slate-300 font-black text-[10px] flex items-center justify-center font-mono">
                03
              </span>
              <span className="font-medium text-slate-300">Paslon 03</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-white font-bold">{pctP3}%</span>
              <span className="font-mono text-slate-400 font-medium tabular-nums">{displayP3Votes} suara</span>
            </div>
          </div>
        </div>

        <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
          <span>{voterCount} voter terdaftar • OCR terverifikasi</span>
          <span className="text-teal-300 font-bold">{voterCount > 0 ? 'Tabulasi aktif' : 'Menunggu input C1'}</span>
        </div>
      </div>

      {/* Banner AI PILCALEG: Hanya untuk Tim Sukses & Admin (Tidak ditampilkan untuk Kader Lapangan) */}
      {userAccount.role === 'tim_sukses' && (
        <div
          onClick={onOpenAiPilcaleg || onOpenCekTpsAi}
          className="p-3.5 bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 text-white rounded-2xl shadow-sm border border-teal-500/40 flex items-center justify-between gap-3 cursor-pointer hover:border-teal-400 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center font-black group-hover:scale-105 transition-transform shadow-xs shrink-0">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider font-mono">
                  AI PILCALEG
                </span>
                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/40">
                  SIMCALEG
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                AI Intelligence Strategi &amp; Narasi Politik
              </h3>
              <p className="text-[10px] text-slate-300 line-clamp-2">
                Fitur AI simcaleg memberikan informasi mulai dari strategi kampanye hingga narasi-narasi politik yang bisa digunakan oleh kandidat dalam proses kampanye berdasarkan geopolitik dalam suatu wilayah.
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-teal-300 group-hover:bg-teal-500 group-hover:text-white transition-colors shrink-0 relative z-10">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Akses Menu Utama: 4 Tombol Sesuai Slide 8/9/15/18 */}
      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
          {userAccount.role === 'tim_sukses' ? 'Akses Menu Utama Tim Sukses' : 'Akses Menu Utama Kader'}
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Daftar Voter (Slide 3) */}
          <button
            onClick={onOpenDaftarVoterOcr}
            className="p-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-2xl shadow-sm text-left transition-all cursor-pointer flex flex-col justify-between h-28 group relative overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white mb-1 shadow-2xs group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-teal-200 block uppercase font-mono">
                Modul 01
              </span>
              <h3 className="text-sm font-black text-white leading-tight">
                Daftar Voter
              </h3>
              <p className="text-[10px] text-teal-100 font-medium">
                Foto KTP + OCR Otomatis
              </p>
            </div>
          </button>

          {/* 2. Database Voters (Slide 5) */}
          <button
            onClick={onOpenDatabaseVoters}
            className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-sm text-left transition-all cursor-pointer flex flex-col justify-between h-28 group relative overflow-hidden border border-slate-800"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300 mb-1 shadow-2xs group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">
                Modul 02
              </span>
              <h3 className="text-sm font-black text-white leading-tight">
                Database
              </h3>
              <p className="text-[10px] text-slate-300 font-medium">
                Cari, Filter &amp; Ekspor
              </p>
            </div>
          </button>

          {/* 3. Scan C1/B1 (Slide 7) */}
          <button
            onClick={onOpenQuickCountOcr}
            className="p-3.5 bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-800 hover:to-blue-900 text-white rounded-2xl shadow-sm text-left transition-all cursor-pointer flex flex-col justify-between h-28 group relative overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white mb-1 shadow-2xs group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-200 block uppercase font-mono">
                Modul 03
              </span>
              <h3 className="text-sm font-black text-white leading-tight">
                Scan C1/B1
              </h3>
              <p className="text-[10px] text-indigo-100 font-medium">
                OCR Quick Count TPS
              </p>
            </div>
          </button>

          {/* 4. Rekap Paslon */}
          <button
            onClick={onOpenRekapPaslon}
            className="p-3.5 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between h-28 border border-slate-200 group relative overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-1 shadow-2xs group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">
                Hasil Suara
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Rekap Paslon
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Tabulasi Real-Time
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Aktivitas Terbaru (Slide 8/9/15/18) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900">Aktivitas Terbaru</h3>
          <span className="text-[10px] text-slate-400 font-mono">Tersinkronisasi Otomatis</span>
        </div>

        <div className="space-y-2 text-xs">
          {voterCount > 0 ? (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span className="font-semibold text-slate-800">
                  {voterCount} voter terdaftar di TPS {userAccount.tps || '047'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Tersimpan</span>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-slate-800">
                  Belum ada voter terinput
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Siap input</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span className="font-semibold text-slate-800">
                Sistem AI OCR e-KTP &amp; Verifikasi DPT
              </span>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Siap Digunakan</span>
          </div>
        </div>
      </div>

      {/* Fitur Lengkap Tambahan yang Tetap Tersedia (Peta Suara, Survei Online, Tambah NIK) */}
      <div className="space-y-2 pt-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Fitur Lapangan Lainnya
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Peta Suara (Hanya untuk Tim Sukses, disembunyikan untuk Kader Lapangan) */}
          {userAccount.role !== 'kader' && (
            <button
              onClick={() => onNavigateTab('peta_suara')}
              className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-slate-900 block text-xs">Peta Suara</span>
                  <span className="text-[10px] text-slate-400">Monitoring Wilayah</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Survei Online */}
          {onOpenSurvey && (
            <button
              onClick={onOpenSurvey}
              className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Vote className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-slate-900 block text-xs">Survei Online</span>
                  <span className="text-[10px] text-slate-400">Elektabilitas</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Tambah NIK Undang Teman */}
          {onOpenTambahNik && (
            <button
              onClick={onOpenTambahNik}
              className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-slate-900 block text-xs">Tambah NIK</span>
                  <span className="text-[10px] text-slate-400">Undang Teman</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* WhatsApp Blazt */}
          {onOpenWhatsAppBlazt && (
            <button
              onClick={onOpenWhatsAppBlazt}
              className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-slate-900 block text-xs">WA Blazt</span>
                  <span className="text-[10px] text-slate-400">Broadcast Pesan</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Target & Kesiapan Saksi TPS Dapil */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 leading-tight">
                Target &amp; Kesiapan TPS Dapil
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Monitoring Real-Time Saksi Form C1</span>
            </div>
          </div>
          <span className="text-xs font-black text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
            92.4%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: '92.4%' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-0.5">
            <span>462 dari 500 TPS Tercover Saksi</span>
            <span className="text-teal-700 font-bold">38 TPS Menunggu Penugasan</span>
          </div>
        </div>

        {/* 3 Metrics Mini Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Target Suara</span>
            <span className="text-xs font-black text-slate-900 font-mono">125.000</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Voter Terdata</span>
            <span className="text-xs font-black text-cyan-700 font-mono">{voterCount > 0 ? voterCount + 84320 : 84320}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[9px] text-slate-400 block font-bold uppercase">Relawan Aktif</span>
            <span className="text-xs font-black text-teal-700 font-mono">1.248</span>
          </div>
        </div>
      </div>

      {/* Rekomendasi Taktis & Geopolitik AI Hari Ini */}
      <div className="p-3.5 bg-gradient-to-br from-cyan-50/60 via-teal-50/40 to-slate-50 rounded-2xl border border-cyan-200/70 text-xs space-y-2">
        <div className="flex items-center gap-2 text-cyan-900 font-extrabold">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Panduan Taktis Geopolitik Hari Ini</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Prioritaskan sosialisasi door-to-door di wilayah pemilih pemula (TPS 012 - 049). Gunakan pendekatan advokasi ekonomi lokal dan verifikasi e-KTP warga secara berkala.
        </p>
      </div>

      {/* Banner Bantuan & Helpdesk War Room Tim Pemenangan */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-[11px]">Helpdesk Tim War Room 24/7</h4>
            <span className="text-[10px] text-slate-400">Kendala upload C1 / verifikasi NIK</span>
          </div>
        </div>
        <a
          href="https://wa.me/6287886717797?text=Halo%20Tim%20War%20Room%20SWARAKU,%20saya%20butuh%20bantuan%20teknis%20aplikasi."
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3 h-3" />
          <span>Hubungi</span>
        </a>
      </div>

      {/* Enkripsi & Sinkronisasi Aman */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium py-1">
        <Shield className="w-3 h-3 text-teal-600" />
        <span>Enkripsi 256-Bit • Data Tersimpan Otomatis di HP &amp; Server</span>
      </div>
    </div>
  );
};

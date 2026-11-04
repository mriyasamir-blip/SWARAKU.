import React, { useState } from 'react';
import { VoterProfile, NewsItem, MissionItem, FormC1Upload, FormB1Upload } from '../../../types/vore';
import { APP_IMAGES } from '../../../assets/images';
import { SwarakuLogo } from '../../common/SwarakuLogo';
import {
  MapPin,
  MessageSquarePlus,
  Award,
  UserPlus,
  ChevronRight,
  Bell,
  CheckCircle2,
  Sparkles,
  Share2,
  ShieldCheck,
  BarChart3,
  MessageCircle,
  UploadCloud,
  Building2,
  Vote,
  TrendingUp,
  FileText,
  Package,
  PieChart,
  Users,
  Wifi,
  WifiOff,
  Compass,
} from 'lucide-react';

interface HomeDashboardScreenProps {
  profile: VoterProfile;
  missions: MissionItem[];
  news: NewsItem[];
  onNavigateTab: (tab: 'aspirasi' | 'misi' | 'peta_suara' | 'tps' | 'profil') => void;
  onOpenReferralModal: () => void;
  onOpenNewsDetail: (news: NewsItem) => void;
  onQuickCompleteMission: (missionId: string) => void;
  onOpenQuickCount?: () => void;
  onOpenUploadC1?: () => void;
  onOpenUploadB1?: () => void;
  c1Records?: FormC1Upload[];
  b1Records?: FormB1Upload[];
  onOpenCekNik?: () => void;
  onOpenWhatsAppBlazt?: () => void;
  onOpenSurvey?: () => void;
  onOpenMonitoringPendukung?: () => void;
  onOpenTambahNikModal?: () => void;
}

export const HomeDashboardScreen: React.FC<HomeDashboardScreenProps> = ({
  profile,
  missions,
  news,
  onNavigateTab,
  onOpenReferralModal,
  onOpenNewsDetail,
  onQuickCompleteMission,
  onOpenQuickCount,
  onOpenUploadC1,
  onOpenUploadB1,
  c1Records = [],
  b1Records = [],
  onOpenCekNik,
  onOpenWhatsAppBlazt,
  onOpenSurvey,
  onOpenMonitoringPendukung,
  onOpenTambahNikModal,
}) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const featuredNews = news[0];

  // Quick Count Live calculations from connected Form C1 & B1
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
  const grandTotalTidakSah = c1TidakSah + b1TidakSah;
  const grandTotalMasuk = grandTotalSah + grandTotalTidakSah;

  const pctP1 = grandTotalSah > 0 ? ((totalP1 / grandTotalSah) * 100).toFixed(1) : '0';
  const pctP2 = grandTotalSah > 0 ? ((totalP2 / grandTotalSah) * 100).toFixed(1) : '0';
  const pctP3 = grandTotalSah > 0 ? ((totalP3 / grandTotalSah) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col space-y-4 pb-6">
      {/* App Title Brand Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-1.5">
          <SwarakuLogo size={24} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center relative cursor-pointer"
            title="Pemberitahuan"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-600 ring-2 ring-white"></span>
          </button>
        </div>
      </div>

      {/* Notification Toast/Dropdown */}
      {notificationOpen && (
        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-2xl text-xs text-slate-700 space-y-1 animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-cyan-900">
            <span>Pemberitahuan Quick Count</span>
            <button
              onClick={() => setNotificationOpen(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Tutup
            </button>
          </div>
          <p className="text-[11px] text-slate-600">
            Tabulasi Quick Count terhubung dengan {c1Records.length} berkas Form C1 TPS dan {b1Records.length} berkas Form B1 Kecamatan.
          </p>
        </div>
      )}

      {/* Profile summary card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={APP_IMAGES.voterAvatar}
                alt={profile.nama}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold leading-tight">{profile.nama}</h1>
              </div>
              <p className="text-xs text-cyan-100 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-cyan-200" />
                <span>
                  {profile.tps} · {profile.kelurahan}
                </span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-cyan-200 uppercase font-bold tracking-wider block">
              Status DPT
            </span>
            <span className="text-[11px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full inline-block mt-0.5 text-white">
              Terdaftar KPU
            </span>
          </div>
        </div>

        {/* Voter Dapil and Status Info (No Points) */}
        <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-cyan-100">
          <span className="font-medium">Wilayah: {profile.dapil}</span>
          <span className="font-bold text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Relawan Pemilih Aktif
          </span>
        </div>
      </div>

      {/* Program Unggulan Banner */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Program Unggulan Kandidat</span>
          <span className="text-[10px] text-cyan-600 font-semibold">Dapil Jakarta Selatan</span>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-100 group">
          <div className="relative h-44 w-full bg-slate-200">
            <img
              src={APP_IMAGES.heroTransport}
              alt="Transportasi Ramah Lingkungan"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/images/vore_hero_transport_1790655636574.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[11px] font-semibold tracking-wide text-cyan-300 uppercase">
                Transportasi Publik Hijau
              </span>
              <h3 className="text-base font-bold leading-tight mt-1">
                Transportasi Ramah Lingkungan
              </h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-2 leading-relaxed">
                Meningkatkan layanan transportasi publik bersih, terjangkau, dan terkoneksi langsung ke gang perumahan warga.
              </p>
              <div className="mt-2.5 flex items-center justify-between">
                <button
                  onClick={() => onOpenNewsDetail(featuredNews)}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Selengkapnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-300">
                  Target Realisasi: 2027
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Akses Cepat */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Menu Akses Cepat</h2>
        </div>

        {/* HERO FEATURED ACTION CARD 1: SURVEI ONLINE */}
        <div
          onClick={onOpenSurvey}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-700 to-slate-900 text-white shadow-md shadow-cyan-600/15 border border-cyan-400/30 hover:border-cyan-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform"></div>

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-xs">
                <Vote className="w-5 h-5 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-mono shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                    SURVEI ONLINE
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mt-1 group-hover:text-cyan-200 transition-colors">
                  Survei Elektabilitas Paslon
                </h3>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-cyan-300 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
          </div>

          <p className="text-[11px] text-cyan-100/90 mt-2 leading-relaxed font-medium">
            Sistem survei yang memudahkan anda mengukur elektabilitas kandidat secara online.
          </p>

          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10px]">
            <span className="text-cyan-200 font-mono">Sinkronisasi Real-Time</span>
            <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-md">
              Buka Survei Online →
            </span>
          </div>
        </div>

        {/* HERO FEATURED ACTION CARD 2: MONITORING PETA SUARA */}
        <div
          onClick={() => onNavigateTab('peta_suara')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 text-white shadow-md shadow-indigo-600/15 border border-indigo-400/30 hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform"></div>

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-xs">
                <Compass className="w-5 h-5 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-mono shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-950 animate-ping"></span>
                    PETA SUARA
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mt-1 group-hover:text-cyan-200 transition-colors">
                  Monitoring Peta Suara
                </h3>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-cyan-300 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
          </div>

          <p className="text-[11px] text-cyan-100/90 mt-2 leading-relaxed font-medium">
            Tidak semua kandidat mengenal wilayah dapilnya. Lihat peta suara pendukung berdasarkan nama Kab, Kec, Desa hingga TPS untuk wilayah yang sudah ada pendukung maupun yang belum.
          </p>

          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] flex-wrap gap-1.5">
            <span className="text-cyan-200 font-mono text-[10px]">
              2.410 TPS Terisi · 1.010 Blank Spot
            </span>
            <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
              Buka Peta Suara →
            </span>
          </div>
        </div>

        {/* HERO FEATURED ACTION CARD 3: INPUT MANUAL TAMBAH NIK UNDANG TEMAN */}
        {onOpenTambahNikModal && (
          <div
            onClick={onOpenTambahNikModal}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white shadow-md shadow-emerald-600/15 border border-emerald-400/30 hover:border-emerald-300 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform"></div>

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-xs">
                  <UserPlus className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-mono shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                      INPUT MANUAL NIK
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mt-1 group-hover:text-emerald-200 transition-colors">
                    Tambah NIK untuk Undang Teman
                  </h3>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
            </div>

            <p className="text-[11px] text-emerald-100/90 mt-2 leading-relaxed font-medium">
              Input manual 16 digit NIK kawan atau tetangga untuk mengecek DPT KPU, memperluas jaringan pemilih TPS, dan mengirimkan undangan via WhatsApp.
            </p>

            <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] flex-wrap gap-1.5">
              <span className="text-emerald-200 font-mono text-[10px]">
                Validasi DPT Otomatis · Terenkripsi
              </span>
              <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
                + Input NIK Teman →
              </span>
            </div>
          </div>
        )}

        {/* 6-Grid Quick Access Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Quick Count Button */}
          <button
            onClick={onOpenQuickCount}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-cyan-50 border border-slate-200/90 hover:border-cyan-300 transition-all text-center group cursor-pointer shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-100 group-hover:bg-cyan-500 text-cyan-700 group-hover:text-white flex items-center justify-center transition-colors mb-1.5 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 group-hover:text-cyan-900 leading-tight">
              Quick Count
            </span>
          </button>

          {/* Monitoring Peta Suara Button */}
          <button
            onClick={() => onNavigateTab('peta_suara')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 transition-all text-center group cursor-pointer shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-500 text-indigo-700 group-hover:text-white flex items-center justify-center transition-colors mb-1.5 shadow-2xs">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-900 leading-tight">
              Peta Suara
            </span>
          </button>

          {/* WhatsApp Blazt */}
          <button
            onClick={onOpenWhatsAppBlazt}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-green-50 border border-slate-200/90 hover:border-green-300 transition-all text-center group cursor-pointer shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 group-hover:bg-green-500 text-green-700 group-hover:text-white flex items-center justify-center transition-colors mb-1.5 shadow-2xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 group-hover:text-green-900 leading-tight">
              WA Blazt
            </span>
          </button>

          {/* Unggah Form C1 */}
          <button
            onClick={onOpenUploadC1}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200/90 hover:border-teal-300 transition-all text-center group cursor-pointer shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-teal-100 group-hover:bg-teal-500 text-teal-700 group-hover:text-white flex items-center justify-center transition-colors mb-1.5 shadow-2xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 group-hover:text-teal-900 leading-tight">
              Unggah C1
            </span>
          </button>

          {/* Unggah Form B1 */}
          <button
            onClick={onOpenUploadB1}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 transition-all text-center group cursor-pointer shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-500 text-indigo-700 group-hover:text-white flex items-center justify-center transition-colors mb-1.5 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-900 leading-tight">
              Unggah B1
            </span>
          </button>

          {/* Auto Cek NIK */}
          <button
            onClick={onOpenCekNik}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-300 transition-all text-center group cursor-pointer shadow-2xs"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 group-hover:bg-emerald-500 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors mb-1.5 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-900 leading-tight">
              Auto Cek NIK
            </span>
          </button>
        </div>

        {/* Secondary quick bar: Lokasi TPS & Rute */}
        <button
          onClick={() => onNavigateTab('tps')}
          className="w-full p-2.5 bg-white hover:bg-cyan-50 border border-slate-200/90 hover:border-cyan-300 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[11px] font-bold text-slate-800 block truncate">
                Lokasi TPS &amp; Rute Navigasi
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                {profile.tps} · SDN Sukamaju 01
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* QUICK COUNT LIVE WIDGET: BERDASARKAN UNGGAH FORM C1 & B1 (MENGGANTIKAN SIMULASI SURVEI/SIMCALEG) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-extrabold text-white tracking-tight">
                  Quick Count Pemilu Terpadu
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-cyan-300">
                Tabulasi suara real-time dari {c1Records.length} Form C1 &amp; {b1Records.length} Form B1
              </p>
            </div>
          </div>

          <button
            onClick={onOpenQuickCount}
            className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            Buka Tabulasi
          </button>
        </div>

        {/* Live Vote Progress Bars */}
        <div className="space-y-2 pt-1">
          {/* Paslon 01 */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold mb-0.5">
              <span className="text-cyan-300">01. Paslon 01 (Utama)</span>
              <span className="font-mono text-cyan-200">
                {pctP1}% ({totalP1.toLocaleString('id-ID')} Suara)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${pctP1}%` }}
              ></div>
            </div>
          </div>

          {/* Paslon 02 & 03 Mini Bars */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5">
            <div>
              <div className="flex items-center justify-between text-amber-200 mb-0.5 font-bold">
                <span>02. Paslon 02</span>
                <span className="font-mono">{pctP2}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${pctP2}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-rose-300 mb-0.5 font-bold">
                <span>03. Paslon 03</span>
                <span className="font-mono">{pctP3}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-700"
                  style={{ width: `${pctP3}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar to upload C1 & B1 right from home */}
        <div className="pt-2 border-t border-slate-700/70 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-300 font-mono">
            Total {grandTotalMasuk.toLocaleString('id-ID')} Suara Sah &amp; Masuk
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenUploadC1}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-cyan-200 text-[10px] font-bold rounded-lg border border-white/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <UploadCloud className="w-3 h-3" />
              <span>+ Form C1</span>
            </button>
            <button
              onClick={onOpenUploadB1}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-indigo-200 text-[10px] font-bold rounded-lg border border-white/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Building2 className="w-3 h-3" />
              <span>+ Form B1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Monitoring Pendukung & Logistik (Diletakkan pada menu di bawah) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900">Monitoring Pendukung &amp; Logistik</h2>
          </div>
          <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            Umur &amp; Jenis Kelamin
          </span>
        </div>

        <div
          onClick={onOpenMonitoringPendukung}
          className="p-4 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-md border border-indigo-700/50 hover:border-indigo-400 transition-all cursor-pointer group relative overflow-hidden space-y-3"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"></div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                  AKUMULASI &amp; PERSIAPAN LOGISTIK
                </span>
                <h3 className="text-sm font-black text-white group-hover:text-indigo-200 transition-colors">
                  Monitoring Pendukung
                </h3>
              </div>
            </div>

            <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-200 text-[10px] font-bold rounded-lg border border-indigo-400/30 flex items-center gap-1">
              <span>Buka Detail</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Fungsi untuk melihat akumulasi jumlah pendukung dan memetakan berdasarkan Umur serta Jenis Kelamin guna persiapan Logistik pemenangan.
          </p>

          {/* Mini Demographics & Logistics Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[9px] text-slate-400 block font-semibold">Total Pendukung</span>
              <span className="text-sm font-black font-mono text-cyan-300 mt-0.5 block">14.850+</span>
              <span className="text-[8px] text-emerald-400 font-bold">74.2% Target</span>
            </div>

            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[9px] text-slate-400 block font-semibold">Jenis Kelamin</span>
              <span className="text-sm font-black font-mono text-white mt-0.5 block">51.4% P</span>
              <span className="text-[8px] text-indigo-300 font-medium">48.6% L</span>
            </div>

            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[9px] text-slate-400 block font-semibold">Kesiapan Logistik</span>
              <span className="text-sm font-black font-mono text-amber-300 mt-0.5 block">12.000</span>
              <span className="text-[8px] text-slate-300">Pcs Kaos &amp; APK</span>
            </div>
          </div>

          {/* Age Bar breakdown preview */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">
              Gen Z (32%) · Milenial (38%) · Gen X (21%) · Lansia (9%)
            </span>
            <span className="font-extrabold text-cyan-300 flex items-center gap-1 group-hover:underline">
              <span>Alokasi Per TPS</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Kabar Terbaru Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Kabar Terbaru</h2>
          <button
            onClick={() => onOpenNewsDetail(news[1])}
            className="text-xs font-medium text-cyan-600 hover:text-cyan-700 cursor-pointer"
          >
            Lihat semua
          </button>
        </div>

        {/* Featured news card */}
        <div
          onClick={() => onOpenNewsDetail(news[1])}
          className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
            <img
              src={APP_IMAGES.communityGathering}
              alt="Forum Warga"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/images/vore_community_gathering_1790655650965.jpg';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wide">
              {news[1].kategori}
            </span>
            <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-cyan-700 transition-colors">
              {news[1].judul}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
              {news[1].ringkasan}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5">
              <span>{news[1].waktu}</span>
              <span>·</span>
              <span>{news[1].penulis}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors shrink-0" />
        </div>
      </div>
    </div>
  );
};

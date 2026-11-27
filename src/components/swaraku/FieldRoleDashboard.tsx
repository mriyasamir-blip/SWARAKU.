import React, { useMemo } from 'react';
import {
  Camera,
  FileText,
  Database,
  Compass,
  BarChart3,
  ClipboardList,
  SearchCheck,
  UserPlus,
  Send,
  Bot,
  ChevronRight,
  Users,
  Award,
  MessageSquare,
  UserCheck,
  BadgeCheck,
  CreditCard,
  Navigation,
  Shield,
  Sparkles,
  Gift,
} from 'lucide-react';
import type { FormB1Upload, FormC1Upload, UserAccount } from '../../types/vore';
import type { StaffTab } from './StaffPortalApp';
import { formatWilayahLabel } from '../../data/wilayahIndonesia';

interface FieldRoleDashboardProps {
  staffUser: UserAccount;
  voterCount: number;
  relawanCount: number;
  korcamCount?: number;
  pendingTeamCount?: number;
  c1Records: FormC1Upload[];
  b1Records: FormB1Upload[];
  surveyCount: number;
  invitedCount: number;
  aspirasiCount: number;
  kaderPoints: number;
  sudahMencoblos: boolean;
  timSuksesSupervisor: string;
  onOpenDaftarVoterOcr: () => void;
  onOpenQuickCountOcr: () => void;
  onOpenUploadC1: () => void;
  onOpenRekapPaslon: () => void;
  onOpenSurvey: () => void;
  onOpenCekTpsAi: () => void;
  onOpenAutoCekNik: () => void;
  onOpenTambahNik: () => void;
  onOpenWhatsAppBlazt: () => void;
  onOpenAiPilcaleg: () => void;
  onNavigateTab: (tab: StaffTab) => void;
}

function getInitials(name: string): string {
  const parts = (name || 'SW').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export const FieldRoleDashboard: React.FC<FieldRoleDashboardProps> = ({
  staffUser,
  voterCount,
  relawanCount,
  korcamCount = 0,
  pendingTeamCount = 0,
  c1Records,
  b1Records,
  surveyCount,
  invitedCount,
  aspirasiCount,
  kaderPoints,
  timSuksesSupervisor,
  onOpenDaftarVoterOcr,
  onOpenQuickCountOcr,
  onOpenUploadC1,
  onOpenRekapPaslon,
  onOpenSurvey,
  onOpenCekTpsAi,
  onOpenAutoCekNik,
  onOpenTambahNik,
  onOpenWhatsAppBlazt,
  onOpenAiPilcaleg,
  onNavigateTab,
}) => {
  const isKorwil = staffUser.role === 'tim_sukses';
  const isKorcam = staffUser.role === 'kader';
  const isRelawan = staffUser.role === 'relawan';
  const totalFormMasuk = c1Records.length + b1Records.length;

  const wilayahDisplay =
    formatWilayahLabel({
      kota: staffUser.kota || '',
      kecamatan: staffUser.kecamatan || '',
      kelurahan: staffUser.kelurahan || '',
    }) ||
    staffUser.wilayah ||
    'Wilayah Tugas Aktif';

  const tally = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    let tidakSah = 0;

    c1Records.forEach((rec) => {
      p1 += Number(rec.suaraPaslon1 || 0);
      p2 += Number(rec.suaraPaslon2 || 0);
      p3 += Number(rec.suaraPaslon3 || 0);
      tidakSah += Number(rec.suaraTidakSah || 0);
    });

    b1Records.forEach((rec) => {
      p1 += Number(rec.suaraPaslon1 || 0);
      p2 += Number(rec.suaraPaslon2 || 0);
      p3 += Number(rec.suaraPaslon3 || 0);
      tidakSah += Number(rec.suaraTidakSah || 0);
    });

    const totalSah = p1 + p2 + p3;
    const pct = (val: number) => (totalSah > 0 ? ((val / totalSah) * 100).toFixed(1) : '0.0');

    return {
      p1,
      p2,
      p3,
      tidakSah,
      totalSah,
      p1Pct: pct(p1),
      p2Pct: pct(p2),
      p3Pct: pct(p3),
    };
  }, [c1Records, b1Records]);

  // Dedicated streamlined workspace for Relawan
  if (isRelawan) {
    return (
      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab('agenda_reward')}
            className="p-4 bg-white hover:bg-amber-50/40 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold">Poin Relawan</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {kaderPoints.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              Tukar di Katalog Reward →
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('database_voters')}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold">Voter / Konstituen</span>
              <Database className="w-4 h-4 text-cyan-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {voterCount.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Tersinkron ke Peta &amp; Kelurahan</p>
          </button>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold">Kelurahan Tugas</span>
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-black text-slate-900 truncate mt-1">
              {staffUser.kelurahan || staffUser.wilayah || '-'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {staffUser.kecamatan || ''} {staffUser.kota ? `· ${staffUser.kota}` : ''}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold">Koordinator Pembina</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm font-black text-slate-900 truncate mt-1">
              {staffUser.korcamNama || timSuksesSupervisor || 'Korcam Wilayah'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Terhubung ke Monitoring Relawan</p>
          </div>
        </div>

        {/* Primary Action Banner: Command Regist */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Tugas Utama Relawan · +10 Poin / Voter
            </span>
            <h3 className="text-lg sm:text-xl font-black">
              Daftarkan Konstituen (Voter) di Wilayah Anda
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Gunakan <b>Menu Registrasi (Command Regist)</b> dengan metode Scan ID (QR) atau Input Manual. Data Kota, Kecamatan, Kelurahan, &amp; Alamat Lengkap otomatis tersinkron ke Database dan Peta Suara.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('registrasi')}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Buka Menu Registrasi</span>
          </button>
        </div>

        {/* Quick Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => onNavigateTab('registrasi')}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Pendaftaran Konstituen (Voter)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Scan ID (QR) atau input manual dengan struktur Kota → Kecamatan → Kelurahan. +10 Poin otomatis.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 shrink-0 mt-1" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('agenda_reward')}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-blue-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Agenda &amp; Reward</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Lihat jadwal Agenda Partai terbaru, tukarkan poin dengan hadiah Katalog Reward, &amp; pantau Riwayat Klaim.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 shrink-0 mt-1" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('database_voters')}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Database Daftar Voter</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Lihat daftar Voter/Konstituen terdaftar beserta Kelurahan, Kecamatan, Kota, dan Laporan per Kelurahan.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 shrink-0 mt-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Ringkasan Kinerja Lapangan (4-column KPI strip, live data only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('database_voters')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Voter Terdata</span>
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {voterCount.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Tersinkron ke Kelurahan &amp; Peta
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenRekapPaslon}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Quick Count Masuk</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {totalFormMasuk.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {c1Records.length} Kelurahan &middot; {b1Records.length} Kecamatan
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            onNavigateTab(isKorcam ? 'kelola_relawan' : 'kelola_korcam_relawan')
          }
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">
              {isKorcam ? 'Total Relawan' : 'Korcam & Relawan'}
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {(isKorcam ? relawanCount : korcamCount + relawanCount).toLocaleString('id-ID')}
            </p>
            {pendingTeamCount > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {pendingTeamCount} Pending
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {isKorcam
              ? 'Klik untuk Kelola Relawan'
              : `${korcamCount} Korcam · ${relawanCount} Relawan`}
          </p>
        </button>

        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">
              Poin {isKorwil ? 'Korwil' : 'Korcam'}
            </span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {kaderPoints.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {wilayahDisplay}
          </p>
        </div>
      </div>

      {/* 2. Tugas Utama (4 Primary Field Modules) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Modul Kerja Utama {isKorwil ? 'Korwil' : 'Korcam'}
          </h3>
          <span className="text-xs text-slate-500">Pilih tugas untuk mulai</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Primary Command Regist CTA */}
          <button
            type="button"
            onClick={() => onNavigateTab('registrasi')}
            className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl border-2 border-blue-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[100px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Menu Registrasi (Command Regist)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {isKorcam
                    ? 'Primary: Daftar Relawan (+25 Poin) & Voter (+10 Poin).'
                    : 'Daftar Korcam (+50), Relawan (+25), & Voter (+10 Poin).'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
          </button>

          {isKorwil ? (
            <button
              type="button"
              onClick={() => onNavigateTab('kelola_korcam_relawan')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-emerald-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[100px]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Kelola Korcam &amp; Relawan
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Aktivasi pendaftar baru, kelola status Korcam &amp; Relawan di wilayah Anda.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateTab('kelola_relawan')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-emerald-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[100px]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Kelola Relawan
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Aktivasi pendaftar Relawan baru &amp; kelola status Relawan di kecamatan Anda.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-1" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('database_voters')}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[100px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Database Wilayah</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Daftar Voter, Daftar Relawan, Laporan per Kelurahan, &amp; Quick Count.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 shrink-0 mt-1" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('monitoring_kader')}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[100px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {isKorwil ? 'Monitoring Relawan & Korcam' : 'Monitoring Relawan'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isKorwil
                    ? 'Pantau posisi Share Live Location Korcam & Relawan di wilayah Anda secara real-time.'
                    : 'Pantau posisi Share Live Location Relawan binaan Anda secara real-time.'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 shrink-0 mt-1" />
          </button>
        </div>
      </section>

      {/* 3. Alat Bantu Lapangan (Compact 1-Click Utility Strip) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Alat Bantu &amp; Koordinasi Lapangan
          </h3>
          <span className="text-xs text-slate-500">Akses cepat 1 klik</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('kelola_voters')}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="truncate">Panel Kampanye</span>
          </button>

          <button
            type="button"
            onClick={onOpenDaftarVoterOcr}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="truncate">Scan e-KTP</span>
          </button>

          <button
            type="button"
            onClick={onOpenSurvey}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">Survei Online ({surveyCount})</span>
          </button>

          <button
            type="button"
            onClick={onOpenCekTpsAi}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <SearchCheck className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="truncate">Cek DPT AI</span>
          </button>

          <button
            type="button"
            onClick={onOpenAutoCekNik}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="truncate">Auto Cek NIK</span>
          </button>

          <button
            type="button"
            onClick={onOpenWhatsAppBlazt}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4 text-green-600 shrink-0" />
            <span className="truncate">WA Blazt</span>
          </button>
        </div>
      </section>

      {/* 4. 2-Column Operational Workspace: Tabulasi Suara + Koordinasi Role */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Real-Time Quick Count Summary */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hasil Quick Count Paslon (Kelurahan &amp; Kecamatan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {tally.totalSah.toLocaleString('id-ID')} suara sah &middot;{' '}
                  {tally.tidakSah.toLocaleString('id-ID')} tidak sah &middot; {totalFormMasuk}{' '}
                  laporan masuk
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenRekapPaslon}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Rincian Rekap</span>
              </button>
            </div>

            {tally.totalSah > 0 ? (
              <div className="space-y-3.5 pt-1">
                {[
                  {
                    label: 'Paslon 01 (Kandidat Utama)',
                    votes: tally.p1,
                    pct: tally.p1Pct,
                    barClass: 'bg-teal-600',
                  },
                  {
                    label: 'Paslon 02',
                    votes: tally.p2,
                    pct: tally.p2Pct,
                    barClass: 'bg-slate-500',
                  },
                  {
                    label: 'Paslon 03',
                    votes: tally.p3,
                    pct: tally.p3Pct,
                    barClass: 'bg-slate-400',
                  },
                ].map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{row.label}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {row.votes.toLocaleString('id-ID')} suara ({row.pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${row.barClass}`}
                        style={{ width: `${Math.min(100, Number(row.pct))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center space-y-3">
                <p className="text-sm font-bold text-slate-800">
                  Belum ada data Quick Count Kelurahan / Kecamatan yang masuk
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Unggah hasil rekap Kelurahan atau Kecamatan untuk memperbarui grafik tabulasi suara secara otomatis.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onOpenQuickCountOcr}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan OCR Quick Count</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenUploadC1}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Input Manual Kelurahan
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenTambahNik}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Jaringan Rujukan ({invitedCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('aspirasi')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Aspirasi Warga ({aspirasiCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Right: Role-Specific Coordination Panel */}
        <section className="lg:col-span-5 space-y-4">
          {isKorwil ? (
            <>
              {/* AI PILCALEG — Khusus Korwil */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                      Khusus Koordinator Wilayah (Korwil)
                    </p>
                    <h3 className="text-base font-extrabold mt-0.5">AI PILCALEG</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Susun strategi pemenangan Kelurahan &amp; Kecamatan, bahan kampanye WA Blazt, dan analisis isu wilayah bersama asisten AI.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAiPilcaleg}
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>Buka Asisten AI PILCALEG</span>
                </button>
              </div>

              {/* Daftar Korcam Binaan Korwil */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Korcam Binaan Anda
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tersinkronisasi otomatis dengan akun Korwil
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg tabular-nums">
                    {staffUser.kaderList?.length || 0} Korcam
                  </span>
                </div>

                {staffUser.kaderList && staffUser.kaderList.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {staffUser.kaderList.map((korcamName, idx) => (
                      <div
                        key={`${korcamName}-${idx}`}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(korcamName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {korcamName}
                            </p>
                            <p className="text-[11px] text-slate-500">Koordinator Kecamatan (Korcam)</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                          Aktif
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">
                    Belum ada Korcam binaan yang ditautkan. Tambahkan melalui Menu Registrasi (+50 Poin).
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Korcam Coordination & Assignment Panel */
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Koordinasi &amp; Penugasan Korcam
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status wilayah kerja, Relawan binaan, dan Korwil pembina Anda
                  </p>
                </div>

                {timSuksesSupervisor && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <BadgeCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                        Korwil Pembina
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                        {timSuksesSupervisor}
                      </p>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Kota / Kabupaten</span>
                    <span className="font-bold text-slate-900 text-right">
                      {staffUser.kota || staffUser.wilayah || '-'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Kecamatan</span>
                    <span className="font-bold text-slate-900 text-right">
                      {staffUser.kecamatan || '-'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Kelurahan Tugas</span>
                    <span className="font-bold text-emerald-700 text-right">
                      {staffUser.kelurahan || '-'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Relawan Terdaftar</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {relawanCount} Relawan
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateTab('kelola_relawan')}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Kelola Relawan</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('operasi_lapangan')}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Operasi Lapangan</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

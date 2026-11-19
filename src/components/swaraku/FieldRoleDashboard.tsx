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
  MapPin,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  BadgeCheck,
  CreditCard,
} from 'lucide-react';
import type { FormB1Upload, FormC1Upload, UserAccount } from '../../types/vore';
import type { StaffTab } from './StaffPortalApp';

interface FieldRoleDashboardProps {
  staffUser: UserAccount;
  voterCount: number;
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
  c1Records,
  b1Records,
  surveyCount,
  invitedCount,
  aspirasiCount,
  kaderPoints,
  sudahMencoblos,
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
  const isTimSukses = staffUser.role === 'tim_sukses';
  const totalFormMasuk = c1Records.length + b1Records.length;

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
            <span className="text-xs font-semibold">Voters Terdata</span>
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {voterCount.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Daftar online &middot; Scan e-KTP
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenRekapPaslon}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Form C1 &amp; B1</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {totalFormMasuk.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {c1Records.length} C1 &middot; {b1Records.length} B1
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenSurvey}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Survei &amp; Rujukan</span>
            <ClipboardList className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {(surveyCount + invitedCount).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {surveyCount} Survei &middot; {invitedCount} Rujukan
          </p>
        </button>

        {isTimSukses ? (
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold">Kader Binaan</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {(staffUser.kaderList?.length || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {staffUser.wilayah || 'Wilayah binaan aktif'}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold">Poin Kader</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {kaderPoints.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {staffUser.tps || 'Kader Lapangan'} &middot; {aspirasiCount} Aspirasi
            </p>
          </div>
        )}
      </div>

      {/* 2. Tugas Utama (4 Primary Field Modules) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Modul Kerja Utama {isTimSukses ? 'Tim Sukses' : 'Kader Lapangan'}
          </h3>
          <span className="text-xs text-slate-500">Pilih tugas untuk mulai input</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={onOpenDaftarVoterOcr}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[96px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Daftar Voter (Scan e-KTP)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Foto e-KTP pemilih agar langsung masuk Database &amp; Peta Suara.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 shrink-0 mt-1" />
          </button>

          <button
            type="button"
            onClick={onOpenQuickCountOcr}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[96px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Scan Form C1 / B1 (OCR)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Kirim foto plano TPS &amp; rekap kecamatan ke tabulasi Quick Count.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-1" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('database_voters')}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[96px]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Database Voters</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Telusuri daftar pemilih terdata, status verifikasi, &amp; ekspor data.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 shrink-0 mt-1" />
          </button>

          {isTimSukses ? (
            <button
              type="button"
              onClick={() => onNavigateTab('peta_suara')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[96px]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Peta Suara Wilayah
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pantau sebaran titik pemilih &amp; koordinator wilayah di Google Maps.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 shrink-0 mt-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenRekapPaslon}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group min-h-[96px]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Rekap Paslon (Quick Count)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pantau rincian perolehan suara sah dari formulir C1 &amp; B1 masuk.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 shrink-0 mt-1" />
            </button>
          )}
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
          {isTimSukses ? (
            <button
              type="button"
              onClick={onOpenRekapPaslon}
              className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">Rekap Paslon</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateTab('operasi_lapangan')}
              className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">Operasi Lapangan</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSurvey}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">Survei Online</span>
          </button>

          <button
            type="button"
            onClick={onOpenCekTpsAi}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <SearchCheck className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="truncate">Cek TPS AI</span>
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
            onClick={onOpenTambahNik}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Undang Teman</span>
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
                  Tabulasi Suara Live (Form C1 &amp; B1)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {tally.totalSah.toLocaleString('id-ID')} suara sah &middot;{' '}
                  {tally.tidakSah.toLocaleString('id-ID')} tidak sah &middot; {totalFormMasuk}{' '}
                  formulir masuk
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenRekapPaslon}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Rincian Rekap
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
                  Belum ada data Form C1 / B1 yang masuk
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Scan foto formulir C1 Plano atau Form B1 kecamatan untuk memperbarui grafik
                  tabulasi suara secara otomatis.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onOpenQuickCountOcr}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan OCR C1 / B1</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenUploadC1}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Input Manual C1
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('tps')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Buka Modul TPS &amp; Saksi</span>
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
          {isTimSukses ? (
            <>
              {/* AI PILCALEG — Khusus Tim Sukses (Tidak ditampilkan pada akun Kader) */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                      Khusus Koordinator Tim Sukses
                    </p>
                    <h3 className="text-base font-extrabold mt-0.5">AI PILCALEG</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Susun strategi pemenangan dapil, bahan kampanye WA Blazt, dan analisis isu
                      wilayah bersama asisten AI.
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

              {/* Daftar Kader Binaan Tim Sukses */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Kader Binaan Anda
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tersinkronisasi otomatis dengan akun Tim Sukses
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg tabular-nums">
                    {staffUser.kaderList?.length || 0} Kader
                  </span>
                </div>

                {staffUser.kaderList && staffUser.kaderList.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {staffUser.kaderList.map((kaderName, idx) => (
                      <div
                        key={`${kaderName}-${idx}`}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(kaderName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {kaderName}
                            </p>
                            <p className="text-[11px] text-slate-500">Kader Lapangan</p>
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
                    Belum ada kader binaan yang ditautkan ke akun Tim Sukses ini.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Kader Coordination & Assignment Panel */
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Koordinasi &amp; Penugasan Kader
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status wilayah kerja dan pembina Tim Sukses Anda
                  </p>
                </div>

                {timSuksesSupervisor && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <BadgeCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                        Tim Sukses Pembina
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                        {timSuksesSupervisor}
                      </p>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Wilayah / Dapil</span>
                    <span className="font-bold text-slate-900 text-right">
                      {staffUser.wilayah || '-'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500">TPS Penugasan</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {staffUser.tps || 'Belum ditentukan'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Status Check-in TPS</span>
                    <span
                      className={`font-bold inline-flex items-center gap-1 ${
                        sudahMencoblos ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {sudahMencoblos && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {sudahMencoblos ? 'Sudah Check-in' : 'Belum Check-in'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateTab('operasi_lapangan')}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Operasi Lapangan
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('tps')}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Check-in &amp; TPS
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

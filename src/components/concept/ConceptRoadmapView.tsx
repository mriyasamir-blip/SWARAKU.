import React, { useState } from 'react';
import {
  Users,
  Compass,
  HeartHandshake,
  Vote,
  Calendar,
  ChevronRight,
  Shield,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface ConceptRoadmapViewProps {
  onSwitchToVoterApp: () => void;
  onSwitchToCommandCenter: () => void;
}

export const ConceptRoadmapView: React.FC<ConceptRoadmapViewProps> = ({
  onSwitchToVoterApp,
  onSwitchToCommandCenter,
}) => {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [activeRoadmapStep, setActiveRoadmapStep] = useState<number>(1);

  const STAGES = [
    {
      num: '01',
      title: 'Perekrutan',
      subtitle: 'Jangkau digital & lapangan',
      color: 'border-cyan-500 text-cyan-800 bg-cyan-50',
      badgeColor: 'bg-cyan-600 text-white',
      description:
        'Menggabungkan kekuatan digital ads (sosial media ke landing page) dan ground operations door-to-door dengan QR referral unik setiap kader.',
      keyPoints: [
        'Iklan sosial terarah per segmen wilayah',
        'Landing page konversi tinggi dengan atribusi kanal',
        'Door-to-door canvassing dengan QR referral kader',
        'Kader memperoleh Poin Suara langsung saat pemilih mendaftar',
      ],
    },
    {
      num: '02',
      title: 'Onboarding & Profiling',
      subtitle: 'Validasi, petakan, personalisasi',
      color: 'border-teal-500 text-teal-800 bg-teal-50',
      badgeColor: 'bg-teal-600 text-white',
      description:
        'Prinsip privacy by design dengan data minimum dan persetujuan eksplisit. Verifikasi identitas e-KTP terenkripsi, pemetaan otomatis DAPIL & TPS, serta penyerapan isu prioritas pemilih.',
      keyPoints: [
        'Enkripsi NIK & penyamaran data (single source of truth)',
        'Pemetaan presisi ke nomor TPS dan Dapil domisili',
        'Capture aspirasi dan isu prioritas warga di hari pertama',
        'Personalisasi program kerja caleg yang relevan per lingkungan',
      ],
    },
    {
      num: '03',
      title: 'Pendampingan & Retensi',
      subtitle: 'Buktikan, dengarkan, libatkan',
      color: 'border-amber-500 text-amber-800 bg-amber-50',
      badgeColor: 'bg-amber-600 text-white',
      description:
        'Siklus kepercayaan dua arah: Dengarkan aspirasi, tunjukkan progres, kembali dengan aksi nyata. Didukung misi gamifikasi harian & mingguan dengan reward voucher lokal, pulsa, dan sembako.',
      keyPoints: [
        'Transparansi status aspirasi (Masuk → Diproses → Selesai)',
        'Tim Social Media & Interaction Command Center (ICC)',
        'Gamifikasi partisipasi: Misi kecil menuju aksi besar',
        'Reward bermakna: Voucher UMKM, sembako pasar murah, pulsa',
      ],
    },
    {
      num: '04',
      title: 'Mobilisasi Pemilu',
      subtitle: 'Arahkan, pantau, konfirmasi',
      color: 'border-indigo-500 text-indigo-800 bg-indigo-50',
      badgeColor: 'bg-indigo-600 text-white',
      description:
        'Konversi loyalitas digital menjadi kehadiran fisik nyata di TPS. Panduan rute TPS kontekstual, simulasi surat suara, pengingat berjenjang H-7 hingga Hari H, konfirmasi jari bertinta, dan unggah Form C1 quick count.',
      keyPoints: [
        'H-7 & H-1: Notifikasi personal rute jalan kaki ke TPS',
        'Simulasi coblos sah surat suara tahun 2026',
        'Hari H: Check-in konfirmasi "Saya Sudah Mencoblos"',
        'LIVE: Saksi mengunggah Form C1 plano untuk quick count tabulasi',
      ],
    },
  ];

  const ROADMAP = [
    {
      id: 1,
      periode: 'Okt 2026 – Mar 2027',
      fase: 'Awareness & Registrasi',
      fokus: 'Iklan, referral kader, verifikasi DPT',
      status: 'Fase Aktif Saat Ini',
      detail:
        'Membangun fondasi jaringan canvassing lapangan, peluncuran aplikasi mobile pemilih, dan integrasi pangkalan data NIK terenkripsi.',
    },
    {
      id: 2,
      periode: 'Apr – Des 2027',
      fase: 'Community Building',
      fokus: 'Event warga, misi, pembinaan kader',
      status: 'Terjadwal',
      detail:
        'Aktivasi komunitas melalui tantangan misi mingguan, bazar sembako pasar murah, dan pembentukan koordinator RT/RW.',
    },
    {
      id: 3,
      periode: 'Jan – Agu 2028',
      fase: 'Advokasi Isu Lokal',
      fokus: 'Aspirasi, respons cepat, bukti aksi nyata',
      status: 'Terjadwal',
      detail:
        'Menyelesaikan minimal 85% aspirasi fisik (infrastruktur jalan, perbaikan posyandu, penerangan jalan umum) sebagai bukti nyata komitmen caleg/partai.',
    },
    {
      id: 4,
      periode: 'Sep – Des 2028',
      fase: 'Intensifikasi',
      fokus: 'Segmentasi pemilih, canvassing mendalam',
      status: 'Terjadwal',
      detail:
        'Penyisiran pemilih mengambang (undecided voters), micro-targeting kampanye isu tematik, dan simulasi penempatan saksi TPS.',
    },
    {
      id: 5,
      periode: 'Jan – Feb 2029',
      fase: 'Mobilisasi & Pengawalan',
      fokus: 'Turnout TPS, check-in coblos, Form C1 live',
      status: 'Puncak',
      detail:
        'Mobilisasi total kehadiran 90%+ pemilih binaan ke TPS, pengawalan formulir C1 plano melalui quick count terenkripsi.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section (Slide 1) */}
      <div className="p-8 bg-gradient-to-br from-cyan-50 via-sky-50 to-white text-slate-900 rounded-3xl border border-cyan-200/80 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 border border-cyan-200 rounded-full text-xs font-bold text-cyan-800">
            <span>PLATFORM VRM STRATEGIS</span>
            <span>·</span>
            <span>SEPTEMBER 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            SWARAKU
          </h1>
          <p className="text-lg text-cyan-700 font-bold">
            Platform Pemenangan Pemilu &amp; Relawan Pemilih
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Strategi akuisisi hingga mobilisasi pemilih untuk partai politik, calon legislatif (caleg), dan calon presiden (capres). Menghubungkan tata kelola data, komunikasi dua arah, dan kehadiran nyata di bilik suara.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onSwitchToVoterApp}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Uji Coba Aplikasi Pemilih</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSwitchToCommandCenter}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              <span>Buka VRM Command Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 in 1 Concept Breakdown (Slide 2) */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Konsep 4 in 1 SWARAKU Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            *Akuisisi bukan akhir funnel — setiap interaksi memperkaya profil, membangun kepercayaan, dan meningkatkan kesiapan hadir di TPS.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STAGES.map((s, idx) => {
            const isSelected = activeStage === idx + 1;
            return (
              <div
                key={s.num}
                onClick={() => setActiveStage(idx + 1)}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500 bg-white shadow-lg'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-2xl font-black text-slate-400">
                      {s.num}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badgeColor}`}>
                      Pilar {s.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {s.title}
                  </h3>
                  <p className="text-xs text-cyan-700 font-semibold mt-1">
                    {s.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Lihat Rincian</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Stage Detailed Drawer / Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl bg-cyan-600 text-white font-mono font-bold flex items-center justify-center text-sm">
              {STAGES[activeStage - 1].num}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tahap {STAGES[activeStage - 1].num}: {STAGES[activeStage - 1].title} — {STAGES[activeStage - 1].subtitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {STAGES[activeStage - 1].description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {STAGES[activeStage - 1].keyPoints.map((point, i) => (
              <div
                key={i}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-700"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap Retensi Progress 2026 - 2029 (Slide 7) */}
      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="max-w-2xl space-y-1">
          <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider block">
            STRATEGI JANGKA PANJANG
          </span>
          <h2 className="text-2xl font-black text-slate-900">Roadmap Retensi Progress</h2>
          <p className="text-xs text-slate-500">
            Dibangun jauh sebelum hari pemilihan untuk memastikan loyalitas elektoral organik, bukan transaksional sesaat.
          </p>
        </div>

        {/* Horizontal Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {ROADMAP.map((step) => {
            const isCurrent = activeRoadmapStep === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveRoadmapStep(step.id)}
                className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-cyan-500 bg-cyan-50/70 shadow-xs ring-2 ring-cyan-400/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <span className="font-mono text-cyan-700 text-xs font-bold block mb-1">
                  0{step.id} · {step.periode}
                </span>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {step.fase}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {step.fokus}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold">{step.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Roadmap Phase Details */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-800">
              Rincian Fase: {ROADMAP[activeRoadmapStep - 1].fase} ({ROADMAP[activeRoadmapStep - 1].periode})
            </span>
            <span className="text-slate-500 font-medium">
              Fokus: {ROADMAP[activeRoadmapStep - 1].fokus}
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {ROADMAP[activeRoadmapStep - 1].detail}
          </p>
        </div>
      </div>

      {/* 4 in 1 Engagement Concept Core Values (Slide 8 & 15) */}
      <div className="p-8 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-3xl shadow-sm text-center space-y-4">
        <h3 className="text-2xl font-black">
          Bangun Kepercayaan · Rawat Hubungan · Gerakkan Partisipasi
        </h3>
        <p className="text-xs sm:text-sm text-cyan-50 max-w-2xl mx-auto leading-relaxed">
          Personalisasi wilayah memberi konteks. Menu cepat mengurangi friksi. Misi harian membangun kebiasaan. Kabar terbaru membuka ruang interaksi sosial.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold">
          <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xs rounded-full border border-white/30 text-white">
            PERSONAL
          </span>
          <span className="text-cyan-200">·</span>
          <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xs rounded-full border border-white/30 text-white">
            LOKAL
          </span>
          <span className="text-cyan-200">·</span>
          <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xs rounded-full border border-white/30 text-white">
            TERUKUR
          </span>
          <span className="text-cyan-200">·</span>
          <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xs rounded-full border border-white/30 text-white">
            DUA ARAH
          </span>
        </div>
      </div>
    </div>
  );
};

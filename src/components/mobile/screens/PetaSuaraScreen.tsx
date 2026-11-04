import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Filter,
  Users,
  Compass,
  Building2,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  Phone,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { DptVoterRecord } from '../../../types/vore';

interface PetaSuaraScreenProps {
  dptList?: DptVoterRecord[];
  onNavigateTab?: (tab: 'tps' | 'aspirasi' | 'beranda') => void;
  onOpenAutoCekNik?: () => void;
}

interface KelurahanMapData {
  id: string;
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  totalDpt: number;
  targetPendukung: number;
  pendukungTerdata: number;
  totalTps: number;
  statusPenguasaan: 'Kuat' | 'Potensi' | 'Belum Tergarap';
  koordinatorNama: string;
  koordinatorHp: string;
  tpsList: {
    nomor: string;
    alamat: string;
    pendukung: number;
    dpt: number;
    status: 'Kuat' | 'Potensi' | 'Kosong';
  }[];
}

const INITIAL_PETA_WILAYAH: KelurahanMapData[] = [
  {
    id: 'kel-sukamaju',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Cilandak',
    kelurahan: 'Kel. Sukamaju',
    totalDpt: 7200,
    targetPendukung: 4500,
    pendukungTerdata: 3420,
    totalTps: 26,
    statusPenguasaan: 'Kuat',
    koordinatorNama: 'H. Suryadi Pratama',
    koordinatorHp: '0812-9844-7711',
    tpsList: [
      { nomor: 'TPS 047', alamat: 'SDN Sukamaju 01', pendukung: 182, dpt: 285, status: 'Kuat' },
      { nomor: 'TPS 048', alamat: 'Balai RW 04', pendukung: 194, dpt: 290, status: 'Kuat' },
      { nomor: 'TPS 049', alamat: 'Halaman Masjid Al-Ikhlas', pendukung: 145, dpt: 275, status: 'Kuat' },
      { nomor: 'TPS 050', alamat: 'Pos RW 05', pendukung: 75, dpt: 300, status: 'Potensi' },
      { nomor: 'TPS 051', alamat: 'Gedung Serbaguna RT 03', pendukung: 8, dpt: 280, status: 'Kosong' },
    ],
  },
  {
    id: 'kel-cilandak-barat',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Cilandak',
    kelurahan: 'Kel. Cilandak Barat',
    totalDpt: 8900,
    targetPendukung: 5200,
    pendukungTerdata: 3890,
    totalTps: 32,
    statusPenguasaan: 'Kuat',
    koordinatorNama: 'Dra. Endang Wulandari',
    koordinatorHp: '0813-8821-4321',
    tpsList: [
      { nomor: 'TPS 012', alamat: 'SMPN 85 Jakarta', pendukung: 168, dpt: 290, status: 'Kuat' },
      { nomor: 'TPS 013', alamat: 'Taman Wijaya Kusuma', pendukung: 142, dpt: 285, status: 'Kuat' },
      { nomor: 'TPS 014', alamat: 'Balai Warga RT 06', pendukung: 68, dpt: 270, status: 'Potensi' },
      { nomor: 'TPS 015', alamat: 'Lapangan Blok A', pendukung: 12, dpt: 295, status: 'Kosong' },
    ],
  },
  {
    id: 'kel-lebak-bulus',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Cilandak',
    kelurahan: 'Kel. Lebak Bulus',
    totalDpt: 6800,
    targetPendukung: 4200,
    pendukungTerdata: 2450,
    totalTps: 24,
    statusPenguasaan: 'Potensi',
    koordinatorNama: 'Ahmad Fauzi Santoso',
    koordinatorHp: '0817-6421-9988',
    tpsList: [
      { nomor: 'TPS 021', alamat: 'SDN 03 Lebak Bulus', pendukung: 110, dpt: 280, status: 'Potensi' },
      { nomor: 'TPS 022', alamat: 'Kompleks Bona Indah', pendukung: 95, dpt: 275, status: 'Potensi' },
      { nomor: 'TPS 023', alamat: 'Balai RW 02', pendukung: 15, dpt: 290, status: 'Kosong' },
    ],
  },
  {
    id: 'kel-pondok-labu',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Cilandak',
    kelurahan: 'Kel. Pondok Labu',
    totalDpt: 6200,
    targetPendukung: 3800,
    pendukungTerdata: 1980,
    totalTps: 22,
    statusPenguasaan: 'Potensi',
    koordinatorNama: 'Ir. Faisal Akbar',
    koordinatorHp: '0852-1199-3322',
    tpsList: [
      { nomor: 'TPS 030', alamat: 'Puskesmas Pondok Labu', pendukung: 125, dpt: 280, status: 'Potensi' },
      { nomor: 'TPS 031', alamat: 'Balai Pertemuan RW 07', pendukung: 85, dpt: 285, status: 'Potensi' },
      { nomor: 'TPS 032', alamat: 'Jl. Margasatwa Ujung', pendukung: 5, dpt: 290, status: 'Kosong' },
    ],
  },
  {
    id: 'kel-pejaten-barat',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Pasar Minggu',
    kelurahan: 'Kel. Pejaten Barat',
    totalDpt: 7800,
    targetPendukung: 4800,
    pendukungTerdata: 3120,
    totalTps: 28,
    statusPenguasaan: 'Kuat',
    koordinatorNama: 'Budi Santoso, S.T.',
    koordinatorHp: '0812-7711-2299',
    tpsList: [
      { nomor: 'TPS 005', alamat: 'Balai Warga RW 03 Pejaten', pendukung: 165, dpt: 295, status: 'Kuat' },
      { nomor: 'TPS 006', alamat: 'SD Pejaten 02', pendukung: 135, dpt: 280, status: 'Kuat' },
      { nomor: 'TPS 007', alamat: 'Jl. Siaga Raya Pos', pendukung: 18, dpt: 275, status: 'Kosong' },
    ],
  },
  {
    id: 'kel-ragunan',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Pasar Minggu',
    kelurahan: 'Kel. Ragunan',
    totalDpt: 8400,
    targetPendukung: 5200,
    pendukungTerdata: 940,
    totalTps: 30,
    statusPenguasaan: 'Belum Tergarap',
    koordinatorNama: 'Belum Ditugaskan',
    koordinatorHp: '-',
    tpsList: [
      { nomor: 'TPS 018', alamat: 'SDN Ragunan 01', pendukung: 15, dpt: 280, status: 'Kosong' },
      { nomor: 'TPS 019', alamat: 'Balai RW 06 Ragunan', pendukung: 8, dpt: 290, status: 'Kosong' },
      { nomor: 'TPS 020', alamat: 'Jl. Kebagusan Dalam', pendukung: 0, dpt: 275, status: 'Kosong' },
    ],
  },
  {
    id: 'kel-gandaria-selatan',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Cilandak',
    kelurahan: 'Kel. Gandaria Selatan',
    totalDpt: 5900,
    targetPendukung: 3600,
    pendukungTerdata: 420,
    totalTps: 21,
    statusPenguasaan: 'Belum Tergarap',
    koordinatorNama: 'Belum Ditugaskan',
    koordinatorHp: '-',
    tpsList: [
      { nomor: 'TPS 001', alamat: 'Balai Pertemuan RT 01', pendukung: 12, dpt: 285, status: 'Kosong' },
      { nomor: 'TPS 002', alamat: 'Halaman Kelurahan Gandaria', pendukung: 6, dpt: 290, status: 'Kosong' },
      { nomor: 'TPS 003', alamat: 'Jl. Madrasah No. 12', pendukung: 0, dpt: 280, status: 'Kosong' },
    ],
  },
  {
    id: 'kel-melawai',
    kabupaten: 'Kota Jakarta Selatan',
    kecamatan: 'Kec. Kebayoran Baru',
    kelurahan: 'Kel. Melawai',
    totalDpt: 4800,
    targetPendukung: 3000,
    pendukungTerdata: 180,
    totalTps: 18,
    statusPenguasaan: 'Belum Tergarap',
    koordinatorNama: 'Belum Ditugaskan',
    koordinatorHp: '-',
    tpsList: [
      { nomor: 'TPS 004', alamat: 'Balai RW 02 Melawai', pendukung: 5, dpt: 260, status: 'Kosong' },
      { nomor: 'TPS 005', alamat: 'Jl. Panglima Polim V', pendukung: 2, dpt: 270, status: 'Kosong' },
      { nomor: 'TPS 006', alamat: 'Taman Melawai Indah', pendukung: 0, dpt: 280, status: 'Kosong' },
    ],
  },
];

export const PetaSuaraScreen: React.FC<PetaSuaraScreenProps> = ({
  dptList = [],
  onNavigateTab,
  onOpenAutoCekNik,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua Kecamatan');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Kuat' | 'Potensi' | 'Belum Tergarap'>('all');
  const [expandedKelurahanId, setExpandedKelurahanId] = useState<string | null>('kel-sukamaju');

  // Filtered territories
  const filteredWilayah = INITIAL_PETA_WILAYAH.filter((item) => {
    const matchSearch =
      item.kelurahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kecamatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kabupaten.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tpsList.some((t) => t.nomor.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchKec =
      selectedKecamatan === 'Semua Kecamatan' || item.kecamatan === selectedKecamatan;

    const matchStatus =
      statusFilter === 'all' || item.statusPenguasaan === statusFilter;

    return matchSearch && matchKec && matchStatus;
  });

  // Aggregated totals
  const totalWilayahTerdata = INITIAL_PETA_WILAYAH.length;
  const wilayahKuatCount = INITIAL_PETA_WILAYAH.filter((w) => w.statusPenguasaan === 'Kuat').length;
  const wilayahPotensiCount = INITIAL_PETA_WILAYAH.filter((w) => w.statusPenguasaan === 'Potensi').length;
  const wilayahBelumTergarapCount = INITIAL_PETA_WILAYAH.filter((w) => w.statusPenguasaan === 'Belum Tergarap').length;

  const totalPendukungKandidat = INITIAL_PETA_WILAYAH.reduce((acc, w) => acc + w.pendukungTerdata, 0) + dptList.length;
  const totalTargetKandidat = INITIAL_PETA_WILAYAH.reduce((acc, w) => acc + w.targetPendukung, 0);

  return (
    <div className="flex flex-col space-y-4 pb-12 text-slate-800">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
              Monitoring Peta Suara
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800">
              Dapil Terpadu
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pemetaan suara pendukung berjenjang: Kab, Kec, Desa/Kelurahan hingga TPS
          </p>
        </div>

        <button
          onClick={() => {
            if (onOpenAutoCekNik) onOpenAutoCekNik();
          }}
          className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>+ Cek NIK</span>
        </button>
      </div>

      {/* Hero Explanation Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                NAVIGASI BASIS DAPIL
              </span>
              <h2 className="text-base font-black text-white leading-tight">
                Peta Penguasaan Suara Kandidat
              </h2>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-slate-300">
            DAPIL DKI II
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          Tidak semua kandidat mengenal seluruh wilayah dapilnya. Fitur ini membantu kandidat dan tim sukses memetakan persebaran suara pendukung hingga tingkat TPS, menampilkan kelurahan yang sudah memiliki basis pendukung solid maupun wilayah yang belum tergarap sama sekali.
        </p>

        {/* 3 Status Visual Indicators */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <button
            onClick={() => setStatusFilter(statusFilter === 'Kuat' ? 'all' : 'Kuat')}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Kuat'
                ? 'bg-emerald-500/30 border-emerald-400 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <span className="text-[9px] block text-emerald-300 font-bold">🟢 Basis Kuat</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">
              {wilayahKuatCount} Kel.
            </span>
            <span className="text-[8px] text-slate-400">&gt;60% Target</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'Potensi' ? 'all' : 'Potensi')}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Potensi'
                ? 'bg-amber-500/30 border-amber-400 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <span className="text-[9px] block text-amber-300 font-bold">🟡 Potensial</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">
              {wilayahPotensiCount} Kel.
            </span>
            <span className="text-[8px] text-slate-400">20% - 60%</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'Belum Tergarap' ? 'all' : 'Belum Tergarap')}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Belum Tergarap'
                ? 'bg-rose-500/30 border-rose-400 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <span className="text-[9px] block text-rose-300 font-bold">🔴 Belum Ada</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">
              {wilayahBelumTergarapCount} Kel.
            </span>
            <span className="text-[8px] text-rose-300 font-bold">Butuh Tim</span>
          </button>
        </div>
      </div>

      {/* Search & Kecamatan Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama Kab, Kec, Kelurahan/Desa, atau TPS..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {['Semua Kecamatan', 'Kec. Cilandak', 'Kec. Pasar Minggu', 'Kec. Kebayoran Baru'].map((kec) => (
            <button
              key={kec}
              onClick={() => setSelectedKecamatan(kec)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                selectedKecamatan === kec
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {kec}
            </button>
          ))}
        </div>
      </div>

      {/* List of Hierarchical Territories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-800">
            Daftar Wilayah Kelurahan ({filteredWilayah.length})
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Klik kelurahan untuk melihat rincian per TPS
          </span>
        </div>

        {filteredWilayah.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Wilayah Tidak Ditemukan</h4>
            <p className="text-[11px] text-slate-500">
              Coba sesuaikan kata kunci pencarian atau filter status penguasaan.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredWilayah.map((item) => {
              const isExpanded = expandedKelurahanId === item.id;
              const persenCapaian = ((item.pendukungTerdata / item.targetPendukung) * 100).toFixed(1);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-2xs ${
                    item.statusPenguasaan === 'Kuat'
                      ? 'border-emerald-200 hover:border-emerald-300'
                      : item.statusPenguasaan === 'Potensi'
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-rose-200 hover:border-rose-300'
                  }`}
                >
                  {/* Kelurahan Summary Header Bar */}
                  <div
                    onClick={() => setExpandedKelurahanId(isExpanded ? null : item.id)}
                    className="p-3.5 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex items-start gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.statusPenguasaan === 'Kuat'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.statusPenguasaan === 'Potensi'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-xs text-slate-900 leading-tight">
                            {item.kelurahan}
                          </h3>
                          <span
                            className={`text-[9px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider ${
                              item.statusPenguasaan === 'Kuat'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.statusPenguasaan === 'Potensi'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.statusPenguasaan === 'Kuat'
                              ? 'Basis Kuat'
                              : item.statusPenguasaan === 'Potensi'
                              ? 'Potensial'
                              : 'Belum Ada Basis'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {item.kecamatan} · {item.kabupaten} · {item.totalTps} TPS
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <span className="text-xs font-black font-mono text-slate-800 block">
                          {item.pendukungTerdata.toLocaleString('id-ID')} Pendukung
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Target: {item.targetPendukung.toLocaleString('id-ID')} ({persenCapaian}%)
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Area: TPS Hierarchical Breakdown */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/40 text-xs">
                      {/* Coordinator & Contact */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] font-semibold">
                            Koordinator Wilayah Kelurahan:
                          </span>
                          <span className="font-extrabold text-slate-800">{item.koordinatorNama}</span>
                        </div>
                        {item.koordinatorHp !== '-' ? (
                          <a
                            href={`tel:${item.koordinatorHp}`}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{item.koordinatorHp}</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => alert(`📢 Tim relawan telah dialokasikan ke ${item.kelurahan}!`)}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-200 hover:bg-rose-100 cursor-pointer"
                          >
                            Tugaskan Tim Canvassing
                          </button>
                        )}
                      </div>

                      {/* TPS List */}
                      <div className="space-y-1.5">
                        <span className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider block">
                          Peta Basis Per TPS di {item.kelurahan}:
                        </span>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {item.tpsList.map((tps) => (
                            <div
                              key={tps.nomor}
                              className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 text-xs">
                                    {tps.nomor}
                                  </span>
                                  <span
                                    className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                                      tps.status === 'Kuat'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : tps.status === 'Potensi'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {tps.status === 'Kuat'
                                      ? '🟢 Terkuasai'
                                      : tps.status === 'Potensi'
                                      ? '🟡 Sedang Berjalan'
                                      : '🔴 Belum Ada Relawan'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {tps.alamat}
                                </span>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono font-black text-xs text-slate-800">
                                  {tps.pendukung} / {tps.dpt} Pemilih
                                </span>
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  {((tps.pendukung / tps.dpt) * 100).toFixed(0)}% Suara
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action for this village */}
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          Total DPT: {item.totalDpt.toLocaleString('id-ID')} Warga
                        </span>
                        {item.statusPenguasaan === 'Belum Tergarap' ? (
                          <button
                            onClick={() => alert(`🚀 Misi door-to-door relawan dibuat untuk ${item.kelurahan}!`)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim Tim Door-to-Door</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (onNavigateTab) onNavigateTab('tps');
                            }}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Buka Navigasi TPS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

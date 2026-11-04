import React, { useState } from 'react';
import { DptVoterRecord } from '../../types/vore';
import {
  Users,
  Package,
  TrendingUp,
  PieChart,
  Shirt,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Sparkles,
  Download,
  Filter,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  X,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface MonitoringPendukungModalProps {
  isOpen: boolean;
  onClose: () => void;
  dptList: DptVoterRecord[];
  onOpenAutoCekNik?: () => void;
}

export const MonitoringPendukungModal: React.FC<MonitoringPendukungModalProps> = ({
  isOpen,
  onClose,
  dptList,
  onOpenAutoCekNik,
}) => {
  const [activeTab, setActiveTab] = useState<'akumulasi' | 'demografi' | 'logistik' | 'tps_simulator'>('akumulasi');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('Semua Kelurahan');
  const [selectedTpsFilter, setSelectedTpsFilter] = useState<string>('Semua TPS');
  const [simulatorTps, setSimulatorTps] = useState<string>('TPS 047');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Base metrics for Dapil Jakarta Selatan (with dynamic addition from in-memory DPT list)
  const additionalVoters = dptList.length;
  const baseTotalPendukung = 14850 + additionalVoters;
  const targetSuaraKemenangan = 20000;
  const persenCapaian = ((baseTotalPendukung / targetSuaraKemenangan) * 100).toFixed(1);

  // Filter multiplier based on selected kelurahan
  const kelurahanMultiplier: Record<string, number> = {
    'Semua Kelurahan': 1.0,
    'Kel. Sukamaju': 0.35,
    'Kel. Cilandak Barat': 0.28,
    'Kel. Lebak Bulus': 0.22,
    'Kel. Pondok Labu': 0.15,
  };

  const currentMultiplier = kelurahanMultiplier[selectedKelurahan] || 1.0;
  const displayTotal = Math.round(baseTotalPendukung * currentMultiplier);

  // Demografi Umur (Age Breakdown)
  const genZCount = Math.round(displayTotal * 0.32); // 17-27 thn
  const milenialCount = Math.round(displayTotal * 0.38); // 28-43 thn
  const genXCount = Math.round(displayTotal * 0.21); // 44-59 thn
  const boomerCount = Math.round(displayTotal * 0.09); // 60+ thn

  // Demografi Jenis Kelamin (Gender Breakdown)
  const priaCount = Math.round(displayTotal * 0.486); // 48.6%
  const wanitaCount = displayTotal - priaCount; // 51.4%
  const pctPria = ((priaCount / displayTotal) * 100).toFixed(1);
  const pctWanita = ((wanitaCount / displayTotal) * 100).toFixed(1);

  // Logistik Requirements Calculation
  // 1. Kaos Kampanye Resmi:
  const kaosS = Math.round(wanitaCount * 0.35);
  const kaosM = Math.round(wanitaCount * 0.50 + priaCount * 0.15);
  const kaosL = Math.round(wanitaCount * 0.15 + priaCount * 0.45);
  const kaosXL = Math.round(priaCount * 0.30);
  const kaosXXL = Math.round(priaCount * 0.10);
  const totalKaosButuh = displayTotal;
  const totalKaosStok = Math.round(12000 * currentMultiplier);
  const kaosDefisit = Math.max(0, totalKaosButuh - totalKaosStok);

  // 2. Jilbab & Kerudung Khusus Pemilih Perempuan:
  const jilbabButuh = wanitaCount;
  const jilbabStok = Math.round(8000 * currentMultiplier);
  const jilbabDefisit = Math.max(0, jilbabButuh - jilbabStok);

  // 3. Rompi Relawan & Saksi:
  const tpsCount = Math.round(85 * currentMultiplier) || 1;
  const rompiButuh = tpsCount * 4; // 2 saksi + 2 kader per TPS
  const rompiStok = Math.round(400 * currentMultiplier);

  // 4. Paket Sembako / Pasar Murah (Fokus Lansia & Keluarga Rentan):
  const sembakoButuh = Math.round(boomerCount + displayTotal * 0.15);
  const sembakoStok = Math.round(3000 * currentMultiplier);
  const sembakoDefisit = Math.max(0, sembakoButuh - sembakoStok);

  // 5. Merchandise Gen Z & Milenial (Topi, Tumbler, Totebag):
  const merchandiseButuh = Math.round(genZCount * 0.9 + milenialCount * 0.5);
  const merchandiseStok = Math.round(5200 * currentMultiplier);

  // TPS Simulator Data
  const tpsDemographics: Record<
    string,
    { dpt: number; pendukung: number; pria: number; wanita: number; lansia: number; pemuda: number }
  > = {
    'TPS 047': { dpt: 285, pendukung: 182, pria: 88, wanita: 94, lansia: 19, pemuda: 62 },
    'TPS 048': { dpt: 290, pendukung: 194, pria: 95, wanita: 99, lansia: 22, pemuda: 71 },
    'TPS 049': { dpt: 275, pendukung: 165, pria: 80, wanita: 85, lansia: 16, pemuda: 58 },
    'TPS 050': { dpt: 300, pendukung: 210, pria: 102, wanita: 108, lansia: 25, pemuda: 76 },
  };

  const currentTpsData = tpsDemographics[simulatorTps] || tpsDemographics['TPS 047'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200/90 my-auto text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with HD Glow Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-cyan-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-cyan-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Monitoring Pendukung &amp; Logistik
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-xs">
                  AKUMULASI &amp; DEMOGRAFI HD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Akumulasi jumlah pendukung, pemetaan kelompok umur &amp; jenis kelamin guna persiapan logistik kampanye yang presisi.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Wilayah Dropdown Filter */}
            <div className="relative">
              <select
                value={selectedKelurahan}
                onChange={(e) => setSelectedKelurahan(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Semua Kelurahan">Semua Kelurahan (Dapil II)</option>
                <option value="Kel. Sukamaju">Kel. Sukamaju</option>
                <option value="Kel. Cilandak Barat">Kel. Cilandak Barat</option>
                <option value="Kel. Lebak Bulus">Kel. Lebak Bulus</option>
                <option value="Kel. Pondok Labu">Kel. Pondok Labu</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Clean Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('akumulasi')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'akumulasi'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Akumulasi Pendukung</span>
          </button>
          <button
            onClick={() => setActiveTab('demografi')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'demografi'
                ? 'bg-white text-cyan-900 shadow-xs border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-cyan-600" />
            <span>Pemetaan Umur &amp; Gender</span>
          </button>
          <button
            onClick={() => setActiveTab('logistik')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'logistik'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-teal-600" />
            <span>Kesiapan Logistik</span>
          </button>
          <button
            onClick={() => setActiveTab('tps_simulator')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'tps_simulator'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Alokasi Per TPS</span>
          </button>
        </div>

        {/* Tab 1: Akumulasi Pendukung & Progress Target */}
        {activeTab === 'akumulasi' && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-gradient-to-br from-indigo-50 via-cyan-50 to-white rounded-2xl border border-indigo-200 shadow-xs">
                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                  Total Pendukung Terdata
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                  {displayTotal.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{dptList.length} dari auto cek NIK baru</span>
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-teal-50 via-emerald-50 to-white rounded-2xl border border-teal-200 shadow-xs">
                <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">
                  Target Kemenangan
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                  {Math.round(targetSuaraKemenangan * currentMultiplier).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-teal-700 font-bold">
                  Batas aman 1 kursi parlemen
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-cyan-50 via-blue-50 to-white rounded-2xl border border-cyan-200 shadow-xs">
                <span className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider block">
                  Persentase Capaian
                </span>
                <span className="text-2xl font-black font-mono text-cyan-800 mt-1 block">
                  {persenCapaian}%
                </span>
                <div className="w-full bg-cyan-200/80 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Number(persenCapaian))}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-white rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                  Defisit Suara Target
                </span>
                <span className="text-2xl font-black font-mono text-amber-900 mt-1 block">
                  {Math.max(0, Math.round(targetSuaraKemenangan * currentMultiplier) - displayTotal).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-amber-700 font-bold">
                  Perlu penggalangan relawan
                </span>
              </div>
            </div>

            {/* Status Loyalitas Pendukung */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <span className="font-black text-slate-800 text-xs block">
                Klasifikasi Loyalitas &amp; Verifikasi Pendukung:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-white border border-emerald-200 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between text-emerald-800 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pendukung Pasti (Militan)</span>
                    </span>
                    <span className="font-mono">75.7%</span>
                  </div>
                  <span className="text-lg font-black font-mono text-slate-800">
                    {Math.round(displayTotal * 0.757).toLocaleString('id-ID')} Jiwa
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Sudah terverifikasi NIK KTP dan siap mencoblos
                  </p>
                </div>

                <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between text-amber-800 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Swing Voter (Simpatisan)</span>
                    </span>
                    <span className="font-mono">19.5%</span>
                  </div>
                  <span className="text-lg font-black font-mono text-slate-800">
                    {Math.round(displayTotal * 0.195).toLocaleString('id-ID')} Jiwa
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Butuh kunjungan door-to-door kader lanjutan
                  </p>
                </div>

                <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-2xs">
                  <div className="flex items-center justify-between text-blue-800 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Menunggu Sinkronisasi KPU</span>
                    </span>
                    <span className="font-mono">4.8%</span>
                  </div>
                  <span className="text-lg font-black font-mono text-slate-800">
                    {Math.round(displayTotal * 0.048).toLocaleString('id-ID')} Jiwa
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Proses pencocokan NIK di aplikasi cek DPT
                  </p>
                </div>
              </div>
            </div>

            {/* Akumulasi Wilayah Tabel */}
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-black text-slate-800 text-xs">
                  Rincian Akumulasi Pendukung Per Kelurahan (Dapil II):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Terupdate 2026
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { nama: 'Kel. Sukamaju', pendukung: 5180, target: 7000, tps: 28, pct: 74.0 },
                  { nama: 'Kel. Cilandak Barat', pendukung: 4120, target: 5500, tps: 22, pct: 74.9 },
                  { nama: 'Kel. Lebak Bulus', pendukung: 3250, target: 4500, tps: 18, pct: 72.2 },
                  { nama: 'Kel. Pondok Labu', pendukung: 2300, target: 3000, tps: 17, pct: 76.6 },
                ].map((row, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{row.nama}</span>
                      <span className="text-[10px] text-slate-500">
                        {row.tps} TPS · Target: {row.target.toLocaleString('id-ID')} Suara
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-cyan-800 text-xs">
                        {row.pendukung.toLocaleString('id-ID')} Jiwa
                      </span>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-600 h-full rounded-full"
                            style={{ width: `${row.pct}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{row.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Button to Add Voters */}
            <div className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-200 rounded-2xl">
              <div>
                <span className="font-bold text-cyan-950 block text-xs">
                  Ingin Menambah Data Pendukung Baru?
                </span>
                <span className="text-[10px] text-cyan-700">
                  Gunakan Auto Cek NIK DPT KPU untuk memvalidasi e-KTP warga secara otomatis.
                </span>
              </div>
              {onOpenAutoCekNik && (
                <button
                  onClick={onOpenAutoCekNik}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
                >
                  + Tambah NIK Pemilih
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Pemetaan Kelompok Umur & Jenis Kelamin (Demografi HD) */}
        {activeTab === 'demografi' && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            {/* Gender Section Header */}
            <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                <span className="font-black text-xs text-cyan-300">
                  Pemetaan Berdasarkan Jenis Kelamin
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Total: {displayTotal.toLocaleString('id-ID')} Pendukung
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Laki-Laki Card */}
                <div className="p-3.5 bg-white/10 border border-white/15 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-300 text-xs flex items-center gap-1.5">
                      <span className="text-base">👨</span>
                      <span>Laki-Laki</span>
                    </span>
                    <span className="text-lg font-black font-mono text-white">
                      {pctPria}%
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-cyan-200">
                    {priaCount.toLocaleString('id-ID')} Jiwa
                  </div>
                  <div className="p-2 bg-black/20 rounded-lg text-[10px] text-slate-300 space-y-0.5">
                    <span className="font-bold text-cyan-300 block">Kebutuhan Logistik Spesifik:</span>
                    <p>• Kaos Kampanye Ukuran L (45%), XL (30%), XXL (10%)</p>
                    <p>• Rompi Lapangan Relawan &amp; Topi Kampanye</p>
                  </div>
                </div>

                {/* Perempuan Card */}
                <div className="p-3.5 bg-white/10 border border-white/15 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-rose-300 text-xs flex items-center gap-1.5">
                      <span className="text-base">👩</span>
                      <span>Perempuan</span>
                    </span>
                    <span className="text-lg font-black font-mono text-white">
                      {pctWanita}%
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-rose-200">
                    {wanitaCount.toLocaleString('id-ID')} Jiwa
                  </div>
                  <div className="p-2 bg-black/20 rounded-lg text-[10px] text-slate-300 space-y-0.5">
                    <span className="font-bold text-rose-300 block">Kebutuhan Logistik Spesifik:</span>
                    <p>• Jilbab &amp; Kerudung Seragam Relawati (Target: {wanitaCount} pcs)</p>
                    <p>• Kaos Kampanye Ukuran M (50%), S (35%), L (15%)</p>
                    <p>• Paket Sembako Dapur &amp; Goodie Bag Ramah Lingkungan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Breakdown Section */}
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-black text-slate-900 text-xs">
                  Pemetaan Berdasarkan Kelompok Umur:
                </span>
                <span className="text-[10px] text-slate-500">
                  Data Analisis untuk Segmentasi Logistik
                </span>
              </div>

              {/* Gen Z */}
              <div className="p-3 bg-cyan-50/70 border border-cyan-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-cyan-900 flex items-center gap-1">
                    <span>⚡ Gen Z (Usia 17 - 27 Tahun)</span>
                    <span className="text-[9px] bg-cyan-200 text-cyan-800 px-1.5 py-0.2 rounded font-extrabold">32%</span>
                  </span>
                  <span className="font-mono text-cyan-900 font-black">
                    {genZCount.toLocaleString('id-ID')} Jiwa
                  </span>
                </div>
                <div className="w-full bg-cyan-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-600 h-full rounded-full" style={{ width: '32%' }}></div>
                </div>
                <p className="text-[10px] text-slate-600">
                  <strong className="text-cyan-800">Strategi Logistik:</strong> Kaos model slimfit/oversize, tote bag canvas, topi bucket, stiker hologram, lanyard, voucher kuota internet untuk buzzer digital.
                </p>
              </div>

              {/* Milenial */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-indigo-900 flex items-center gap-1">
                    <span>💼 Milenial (Usia 28 - 43 Tahun)</span>
                    <span className="text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded font-extrabold">38%</span>
                  </span>
                  <span className="font-mono text-indigo-900 font-black">
                    {milenialCount.toLocaleString('id-ID')} Jiwa
                  </span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full" style={{ width: '38%' }}></div>
                </div>
                <p className="text-[10px] text-slate-600">
                  <strong className="text-indigo-800">Strategi Logistik:</strong> Kaos polo berkerah, tumbler stainless, flyer program kerja ekonomi/UMKM, kalender dinding, rompi kader.
                </p>
              </div>

              {/* Gen X */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-amber-900 flex items-center gap-1">
                    <span>🏠 Gen X (Usia 44 - 59 Tahun)</span>
                    <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-extrabold">21%</span>
                  </span>
                  <span className="font-mono text-amber-900 font-black">
                    {genXCount.toLocaleString('id-ID')} Jiwa
                  </span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: '21%' }}></div>
                </div>
                <p className="text-[10px] text-slate-600">
                  <strong className="text-amber-800">Strategi Logistik:</strong> Kaos katun reguler ukuran L &amp; XL, payung lipat, buku saku visi misi lingkungan, kalender keluarga, mug keramik.
                </p>
              </div>

              {/* Baby Boomer / Lansia */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-emerald-900 flex items-center gap-1">
                    <span>👵 Baby Boomer &amp; Lansia (60+ Tahun)</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">9%</span>
                  </span>
                  <span className="font-mono text-emerald-900 font-black">
                    {boomerCount.toLocaleString('id-ID')} Jiwa
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full" style={{ width: '9%' }}></div>
                </div>
                <p className="text-[10px] text-slate-600">
                  <strong className="text-emerald-800">Strategi Logistik:</strong> Paket sembako berkah, sarung / sajadah, minyak angin / vitamin lansia, dan layanan pendampingan antar-jemput ke bilik TPS.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Kalkulator & Kesiapan Logistik Kampanye */}
        {activeTab === 'logistik' && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            {/* Alert banner if there's any deficit */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-black text-xs block">
                    Kesiapan Logistik Berdasarkan Proporsi Pendukung ({displayTotal.toLocaleString('id-ID')} Jiwa)
                  </span>
                  <p className="text-[11px] opacity-95">
                    Terdapat defisit {kaosDefisit.toLocaleString('id-ID')} pcs kaos dan {sembakoDefisit.toLocaleString('id-ID')} paket sembako yang perlu segera diajukan pengadaan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => alert('📄 Form Pengajuan Tambahan Logistik telah dicetak ke dokumen PDF!')}
                className="px-3 py-1.5 bg-white text-slate-900 text-xs font-black rounded-xl shrink-0 cursor-pointer shadow-xs hover:bg-slate-100"
              >
                Cetak SPPL
              </button>
            </div>

            {/* Logistics Status Table */}
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-black text-slate-900 text-xs">
                  Tabel Status Kesiapan Logistik Kampanye:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Gudang Logistik Pusat
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {/* 1. Kaos Kampanye */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Shirt className="w-4 h-4 text-cyan-600" />
                        <span>Kaos Kampanye Resmi (S, M, L, XL, XXL)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Kebutuhan: S ({kaosS}), M ({kaosM}), L ({kaosL}), XL ({kaosXL}), XXL ({kaosXXL})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-xs block">
                        {totalKaosStok.toLocaleString('id-ID')} / {totalKaosButuh.toLocaleString('id-ID')} Pcs
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          kaosDefisit > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {kaosDefisit > 0 ? `Defisit ${kaosDefisit.toLocaleString('id-ID')} Pcs` : 'Aman (100%)'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (totalKaosStok / totalKaosButuh) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 2. Jilbab & Kerudung */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className="text-sm">🧕</span>
                        <span>Jilbab &amp; Kerudung Seragam Relawati</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Khusus untuk {wanitaCount.toLocaleString('id-ID')} pendukung perempuan terdata
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-xs block">
                        {jilbabStok.toLocaleString('id-ID')} / {jilbabButuh.toLocaleString('id-ID')} Pcs
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block bg-emerald-100 text-emerald-800">
                        Siap Distribusi
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (jilbabStok / jilbabButuh) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 3. Rompi Relawan & Saksi */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Rompi Lapangan Relawan &amp; Saksi TPS</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Alokasi 4 rompi per TPS ({tpsCount} TPS)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-xs block">
                        {rompiStok} / {rompiButuh} Pcs
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block bg-emerald-100 text-emerald-800">
                        Stok Lengkap
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (rompiStok / rompiButuh) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 4. Paket Sembako Pasar Murah */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-emerald-600" />
                        <span>Paket Sembako / Pasar Murah Gotong Royong</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Prioritas untuk lansia ({boomerCount}) &amp; keluarga pra-sejahtera
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-xs block">
                        {sembakoStok.toLocaleString('id-ID')} / {sembakoButuh.toLocaleString('id-ID')} Paket
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          sembakoDefisit > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sembakoDefisit > 0 ? `Defisit ${sembakoDefisit} Paket` : 'Tercukupi'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (sembakoStok / sembakoButuh) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 5. Merchandise Gen Z & Milenial */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Merchandise Kreatif (Topi, Tumbler, Totebag)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Alokasi generasi muda &amp; simpatisan digital
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-xs block">
                        {merchandiseStok.toLocaleString('id-ID')} / {merchandiseButuh.toLocaleString('id-ID')} Pcs
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block bg-emerald-100 text-emerald-800">
                        Aman
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (merchandiseStok / merchandiseButuh) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Export Actions */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Laporan Kesiapan Gudang Logistik disinkronkan otomatis.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('📥 Laporan Logistik & Demografi (.CSV) berhasil diunduh!')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Ekspor CSV</span>
                </button>
                <button
                  onClick={() => alert('🖨️ Mengirim data SPPL ke mesin cetak antrean posko...')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Surat Jalan Logistik</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Simulator Alokasi Logistik Per TPS */}
        {activeTab === 'tps_simulator' && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-slate-800 block text-xs">
                  Pilih TPS untuk Meninjau Kebutuhan Logistik Lapangan:
                </span>
                <span className="text-[10px] text-slate-500">
                  Sistem otomatis menghitung alokasi seragam &amp; APK sesuai demografi pemilih di TPS tersebut
                </span>
              </div>

              <div className="flex items-center gap-2">
                {['TPS 047', 'TPS 048', 'TPS 049', 'TPS 050'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setSimulatorTps(item)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                      simulatorTps === item
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Details for Selected TPS */}
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    <span>Rincian Demografi &amp; Kebutuhan Logistik: {simulatorTps}</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Lokasi: SDN Sukamaju 01 · Kel. Sukamaju, Kec. Cilandak
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total DPT TPS: {currentTpsData.dpt}</span>
                  <span className="text-xs font-black text-emerald-600">
                    {currentTpsData.pendukung} Pendukung Terdaftar ({((currentTpsData.pendukung / currentTpsData.dpt) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* TPS Demography breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-blue-700 block">Pemilih Pria</span>
                  <span className="text-lg font-black font-mono text-blue-900 mt-0.5 block">
                    {currentTpsData.pria} Jiwa
                  </span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-rose-700 block">Pemilih Wanita</span>
                  <span className="text-lg font-black font-mono text-rose-900 mt-0.5 block">
                    {currentTpsData.wanita} Jiwa
                  </span>
                </div>

                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-cyan-700 block">Pemuda (Gen Z/Milenial)</span>
                  <span className="text-lg font-black font-mono text-cyan-900 mt-0.5 block">
                    {currentTpsData.pemuda} Jiwa
                  </span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-700 block">Lansia (Prioritas)</span>
                  <span className="text-lg font-black font-mono text-amber-900 mt-0.5 block">
                    {currentTpsData.lansia} Jiwa
                  </span>
                </div>
              </div>

              {/* Package packing list for this TPS */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs block">
                  Daftar Paket Logistik yang Siap Dikirim ke Saksi &amp; Kader {simulatorTps}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">📦 Paket Kaos Pendukung TPS:</span>
                    <span className="text-slate-600 block mt-0.5">
                      • Kaos Pria: {Math.round(currentTpsData.pria * 0.9)} pcs (Ukuran L &amp; XL)
                    </span>
                    <span className="text-slate-600 block">
                      • Kaos Wanita: {Math.round(currentTpsData.wanita * 0.9)} pcs (Ukuran S &amp; M)
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">🧕 Paket Seragam Relawati &amp; Jilbab:</span>
                    <span className="text-slate-600 block mt-0.5">
                      • {currentTpsData.wanita} pcs Jilbab Identitas Paslon
                    </span>
                    <span className="text-slate-600 block">
                      • 20 pcs Celemek / Goodie Bag Dapur Warga
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">🛡️ Paket Saksi &amp; Pengawas TPS:</span>
                    <span className="text-slate-600 block mt-0.5">
                      • 2 unit Rompi Resmi Saksi Luar &amp; Dalam
                    </span>
                    <span className="text-slate-600 block">
                      • 1 bundle Form Model C1 Salinan &amp; Alat Tulis
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">🚩 Alat Peraga Kampanye (APK) Radius 200m:</span>
                    <span className="text-slate-600 block mt-0.5">
                      • 2 Spanduk Visi Misi Kandidat
                    </span>
                    <span className="text-slate-600 block">
                      • 15 Bendera Pataka &amp; 100 Flyer Edukasi Coblos
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => alert(`🚚 Status pengiriman logistik untuk ${simulatorTps} diubah ke: 'DALAM PERJALANAN'`)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Kirim Paket Logistik {simulatorTps}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

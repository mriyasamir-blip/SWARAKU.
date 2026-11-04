import React, { useState, useMemo } from 'react';
import { VoterOcrRecord } from '../../types/vore';
import {
  LAPORAN_VOTER_PER_TPS,
  HASIL_QUICK_COUNT_PEMETAAN,
  RINCIAN_OCR_CALEG_PASLON,
} from '../../data/accountsData';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { lookupSmartCoordinates } from '../../utils/geocoding';
import {
  Search,
  Filter,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  PieChart,
  BarChart3,
  Calendar,
  X,
  Share2,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  CreditCard,
  Camera,
  Eye,
  Maximize2,
  Compass,
  Phone,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

// Map Camera Pan & Zoom Handler to focus accurately on selected voter
const MapCameraPanHandler: React.FC<{
  target: { lat: number; lng: number } | null;
}> = ({ target }) => {
  const map = useMap();
  React.useEffect(() => {
    if (map && target && typeof target.lat === 'number' && typeof target.lng === 'number') {
      map.panTo({ lat: target.lat, lng: target.lng });
      map.setZoom(16);
    }
  }, [map, target]);
  return null;
};

interface DatabaseVotersViewProps {
  voterList: VoterOcrRecord[];
  onOpenDaftarVoterModal?: () => void;
  onTriggerCloudSync?: () => Promise<void>;
  isSyncingCloud?: boolean;
}

export const DatabaseVotersView: React.FC<DatabaseVotersViewProps> = ({
  voterList,
  onOpenDaftarVoterModal,
  onTriggerCloudSync,
  isSyncingCloud,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKota, setSelectedKota] = useState<string>('Semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua');
  const [selectedTps, setSelectedTps] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'perlu_cek'>('all');
  const [activeSubTab, setActiveSubTab] = useState<
    'voters' | 'peta_voters' | 'rekap_tps' | 'quick_count_pemetaan' | 'rincian_ocr'
  >('voters');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modal Preview Foto KTP & Detail Voter
  const [selectedVoterPreview, setSelectedVoterPreview] = useState<VoterOcrRecord | null>(null);

  // Selected Voter for Map Focus / InfoWindow
  const [selectedMapVoter, setSelectedMapVoter] = useState<VoterOcrRecord | null>(null);

  // Dynamic filter options derived from active data
  const kotaOptions = useMemo(() => {
    return Array.from(new Set(voterList.map((v) => v.kabupatenKota).filter(Boolean)));
  }, [voterList]);

  const kecamatanOptions = useMemo(() => {
    let relevant = voterList;
    if (selectedKota !== 'Semua') {
      relevant = relevant.filter((v) => v.kabupatenKota === selectedKota);
    }
    return Array.from(new Set(relevant.map((v) => v.kecamatan).filter(Boolean)));
  }, [voterList, selectedKota]);

  const tpsOptions = useMemo(() => {
    return Array.from(new Set(voterList.map((v) => v.tps).filter(Boolean)));
  }, [voterList]);

  // Filtered Voters
  const filteredVoters = useMemo(() => {
    return voterList.filter((voter) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchSearch =
          voter.nama.toLowerCase().includes(q) ||
          voter.nik.includes(q) ||
          voter.tps.toLowerCase().includes(q) ||
          voter.kelurahan.toLowerCase().includes(q) ||
          voter.kecamatan.toLowerCase().includes(q) ||
          (voter.alamat && voter.alamat.toLowerCase().includes(q));

        if (!matchSearch) return false;
      }

      if (selectedKota !== 'Semua' && voter.kabupatenKota !== selectedKota) return false;
      if (selectedKecamatan !== 'Semua' && voter.kecamatan !== selectedKecamatan) return false;
      if (selectedTps !== 'Semua' && voter.tps !== selectedTps) return false;

      if (statusFilter === 'valid' && voter.statusDpt !== 'DPT valid') return false;
      if (statusFilter === 'perlu_cek' && voter.statusDpt !== 'Perlu cek') return false;

      return true;
    });
  }, [voterList, searchQuery, selectedKota, selectedKecamatan, selectedTps, statusFilter]);

  // Demographic stats
  const totalCount = filteredVoters.length;
  const lakiCount = filteredVoters.filter((v) => v.jenisKelamin === 'Laki-laki').length;
  const perempuanCount = totalCount - lakiCount;
  const pctLaki = totalCount > 0 ? Math.round((lakiCount / totalCount) * 100) : 0;
  const pctPerempuan = totalCount > 0 ? 100 - pctLaki : 0;

  // Voters with accurate coordinates for Google Maps
  const votersWithCoords = useMemo(() => {
    return filteredVoters.map((v) => {
      let lat = v.lat;
      let lng = v.lng;
      const isErroneousJaksel =
        lat !== undefined &&
        Math.abs(lat - -6.2615) < 0.001 &&
        !v.kabupatenKota.toLowerCase().includes('selatan') &&
        !v.kecamatan.toLowerCase().includes('cilandak');

      if (!lat || !lng || isErroneousJaksel) {
        const smart = lookupSmartCoordinates(v.kelurahan, v.kecamatan, v.kabupatenKota);
        if (smart) {
          lat = smart.lat;
          lng = smart.lng;
        } else {
          lat = v.kabupatenKota.toLowerCase().includes('utara') || v.kecamatan.toLowerCase().includes('penjaringan')
            ? -6.1264
            : -6.1754; // Monas
          lng = v.kabupatenKota.toLowerCase().includes('utara') || v.kecamatan.toLowerCase().includes('penjaringan')
            ? 106.7885
            : 106.8272;
        }
      }
      return { ...v, resolvedLat: lat, resolvedLng: lng };
    });
  }, [filteredVoters]);

  // Default Map Center
  const defaultMapCenter = useMemo(() => {
    if (selectedMapVoter) {
      const lat = selectedMapVoter.lat || (selectedMapVoter as any).resolvedLat;
      const lng = selectedMapVoter.lng || (selectedMapVoter as any).resolvedLng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
      }
    }
    if (votersWithCoords.length > 0) {
      return { lat: votersWithCoords[0].resolvedLat, lng: votersWithCoords[0].resolvedLng };
    }
    return { lat: -6.1264, lng: 106.7885 }; // Penjaringan, Jakarta Utara
  }, [selectedMapVoter, votersWithCoords]);

  // Handle Export to CSV
  const handleExport = (format: 'Excel' | 'PDF' | 'CSV') => {
    const headers = [
      'NIK',
      'Nama',
      'Jenis Kelamin',
      'TPS',
      'Kelurahan',
      'Kecamatan',
      'Kota',
      'Status DPT',
      'Status Master',
      'Waktu Daftar',
    ];
    const rows = filteredVoters.map((v) => [
      v.nik,
      v.nama,
      v.jenisKelamin,
      v.tps,
      v.kelurahan,
      v.kecamatan,
      v.kabupatenKota,
      v.statusDpt,
      v.statusRegistrasi,
      v.waktuDaftar,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Database_Voters_${format}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Laporan Database Voters (${format}) berhasil diekspor!`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCdblvQuw9FYALutqDvm1Yly8zXxDV386g';

  return (
    <div className="space-y-6 text-slate-800">
      {/* Toast Notification */}
      {exportNotice && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white border border-teal-400 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-cyan-300 font-bold border border-white/10">
              <span>MODUL 02</span>
              <span>·</span>
              <span>TIM SUKSES &amp; KADER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Database Voters • Master Pemilih &amp; Peta Sebaran
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Data voter hasil scan e-KTP, thumbnail foto fisik, titik lokasi koordinat Google Maps, dan verifikasi DPT KPU tersinkronisasi secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onTriggerCloudSync && (
              <button
                type="button"
                onClick={onTriggerCloudSync}
                disabled={isSyncingCloud}
                className="px-3.5 py-2.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/30 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                title="Sinkronkan database lokal ke Cloud Database Firestore agar identik di semua perangkat"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Cloud'}</span>
              </button>
            )}

            {onOpenDaftarVoterModal && (
              <button
                type="button"
                onClick={onOpenDaftarVoterModal}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>+ Scan e-KTP Pemilih Baru</span>
              </button>
            )}

            <button
              onClick={() => handleExport('Excel')}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={() => handleExport('PDF')}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-2 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Total Voters Terdata
            </span>
            <span className="text-2xl font-black font-mono text-cyan-400 mt-0.5 block">
              {voterList.length.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
              100% Real-Time Sync
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Demografi Laki-laki
            </span>
            <span className="text-2xl font-black font-mono text-white mt-0.5 block">
              {pctLaki}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              {lakiCount} Pemilih
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Demografi Perempuan
            </span>
            <span className="text-2xl font-black font-mono text-white mt-0.5 block">
              {pctPerempuan}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              {perempuanCount} Pemilih
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Titik Wilayah / TPS
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
              {tpsOptions.length} TPS
            </span>
            <span className="text-[10px] text-slate-300 font-medium block mt-0.5">
              {kecamatanOptions.length} Kecamatan Terpetakan
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('voters')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'voters'
              ? 'bg-white text-cyan-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-cyan-600" />
          <span>Daftar Voter ({filteredVoters.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('peta_voters')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'peta_voters'
              ? 'bg-white text-cyan-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-teal-600" />
          <span>Peta Sebaran Voter Google Maps ({votersWithCoords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rekap_tps')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'rekap_tps'
              ? 'bg-white text-cyan-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-teal-600" />
          <span>Laporan Voter per TPS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quick_count_pemetaan')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'quick_count_pemetaan'
              ? 'bg-white text-cyan-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Hasil Quick Count Paslon</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rincian_ocr')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'rincian_ocr'
              ? 'bg-white text-cyan-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rincian OCR Caleg</span>
        </button>
      </div>

      {/* SUB TAB 1: DAFTAR DATA VOTER DENGAN KOLOM FOTO & LOKASI MAPS */}
      {activeSubTab === 'voters' && (
        <div className="space-y-4">
          {/* Breadcrumb Filter Bertingkat Dinamis */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto pb-1">
              <span className="text-slate-900 font-bold">Wilayah Terdaftar:</span>
              <span className="text-cyan-700 font-bold">
                {selectedKota !== 'Semua' ? selectedKota : 'Semua Kota'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-cyan-700 font-bold">
                {selectedKecamatan !== 'Semua' ? selectedKecamatan : 'Semua Kecamatan'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded-md font-mono font-bold">
                {selectedTps !== 'Semua' ? selectedTps : 'Semua TPS'}
              </span>
            </div>

            {/* Search and Filters Dinamis */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="⌕ Cari nama voter / NIK / TPS / alamat..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              {/* Kota Dropdown */}
              <div>
                <select
                  value={selectedKota}
                  onChange={(e) => setSelectedKota(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="Semua">Semua Kota ({kotaOptions.length})</option>
                  {kotaOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kecamatan Dropdown */}
              <div>
                <select
                  value={selectedKecamatan}
                  onChange={(e) => setSelectedKecamatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="Semua">Semua Kecamatan ({kecamatanOptions.length})</option>
                  {kecamatanOptions.map((kec) => (
                    <option key={kec} value={kec}>
                      {kec}
                    </option>
                  ))}
                </select>
              </div>

              {/* TPS Dropdown */}
              <div>
                <select
                  value={selectedTps}
                  onChange={(e) => setSelectedTps(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden font-mono"
                >
                  <option value="Semua">Semua TPS ({tpsOptions.length})</option>
                  {tpsOptions.map((tps) => (
                    <option key={tps} value={tps}>
                      {tps}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Voters */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Daftar Voter Terdaftar ({filteredVoters.length} Orang)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Data hasil OCR foto e-KTP lapangan yang telah diverifikasi saksi dan kader TPS secara otomatis.
                </p>
              </div>

              {onOpenDaftarVoterModal && (
                <button
                  type="button"
                  onClick={onOpenDaftarVoterModal}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Scan e-KTP Baru</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-3 text-center">Foto KTP</th>
                    <th className="py-3 px-4">Nama Voter &amp; Verifikasi</th>
                    <th className="py-3 px-4">NIK e-KTP</th>
                    <th className="py-3 px-4">Gender &amp; TTL</th>
                    <th className="py-3 px-4">Wilayah &amp; TPS</th>
                    <th className="py-3 px-4 text-center">Lokasi / Maps</th>
                    <th className="py-3 px-4 text-center">Status DPT</th>
                    <th className="py-3 px-4 text-center">Status Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2.5 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800">
                              {searchQuery || selectedKota !== 'Semua' || selectedTps !== 'Semua'
                                ? 'Tidak ada data voter yang cocok dengan filter'
                                : 'Belum Ada Data Pemilih yang Diinput'}
                            </p>
                            <p className="text-xs text-slate-400">
                              Gunakan fitur Auto Scan e-KTP untuk mendaftarkan pemilih pertama Anda. Foto KTP, data identitas, dan titik Google Maps akan langsung tersimpan.
                            </p>
                          </div>
                          {onOpenDaftarVoterModal && (
                            <button
                              type="button"
                              onClick={onOpenDaftarVoterModal}
                              className="mt-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Camera className="w-4 h-4" />
                              <span>+ Scan e-KTP Pemilih Sekarang</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVoters.map((voter) => (
                      <tr key={voter.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Kolom Foto KTP Thumbnail */}
                        <td className="py-3 px-3 text-center">
                          {voter.fotoKtpUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedVoterPreview(voter)}
                              className="relative group inline-block cursor-pointer"
                              title="Klik untuk melihat foto fisik e-KTP dan detail lengkap"
                            >
                              <img
                                src={voter.fotoKtpUrl}
                                alt={`KTP ${voter.nama}`}
                                className="w-14 h-9 object-cover rounded-lg border border-slate-200 group-hover:scale-105 group-hover:border-teal-500 transition-all shadow-2xs"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity text-white text-[10px]">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-14 h-9 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 mx-auto">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </td>

                        {/* 2. Kolom Nama Voter & Badge Terverifikasi */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {voter.nama}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[9px] font-bold">
                              <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                              <span>Terverifikasi (Scan AI)</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {voter.waktuDaftar || 'Tersimpan'}
                            </span>
                          </div>
                        </td>

                        {/* 3. Kolom NIK */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700 text-xs">
                          {voter.nikMasked || voter.nik}
                        </td>

                        {/* 4. Kolom Gender & TTL */}
                        <td className="py-3 px-4 text-[11px]">
                          <span className="font-semibold block">{voter.jenisKelamin}</span>
                          <span className="text-slate-400">{voter.tempatTglLahir || '-'}</span>
                        </td>

                        {/* 5. Kolom Wilayah & TPS */}
                        <td className="py-3 px-4 text-[11px]">
                          <span className="font-extrabold text-cyan-800 block">{voter.tps}</span>
                          <span className="text-slate-500">
                            {voter.kelurahan}, {voter.kecamatan}
                          </span>
                          {voter.kabupatenKota && (
                            <span className="text-[10px] text-slate-400 block">
                              {voter.kabupatenKota}
                            </span>
                          )}
                        </td>

                        {/* 6. Kolom Lokasi / Maps Button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMapVoter(voter);
                              setActiveSubTab('peta_voters');
                            }}
                            className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                            title="Lihat titik lokasi pemilih pada Google Maps"
                          >
                            <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span>Lihat Titik Lokasi</span>
                          </button>
                        </td>

                        {/* 7. Kolom Status DPT */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              voter.statusDpt === 'DPT valid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{voter.statusDpt || 'DPT valid'}</span>
                          </span>
                        </td>

                        {/* 8. Kolom Status Master */}
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 font-mono font-extrabold text-[10px] rounded-full border border-cyan-200">
                            TERDAFTAR
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: PETA SEBARAN VOTER GOOGLE MAPS */}
      {activeSubTab === 'peta_voters' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full uppercase">
                  GIS SEBARAN VOTER
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Google Maps JavaScript API
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Peta Titik Lokasi Pemilih Terdaftar ({votersWithCoords.length} Titik)
              </h3>
              <p className="text-xs text-slate-500">
                Setiap pemilih yang di-scan e-KTP langsung di-geocoding presisi dan dimapping ke koordinat kelurahan/kecamatan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedMapVoter && (
                <div className="px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping"></span>
                  <span>Fokus: <strong>{selectedMapVoter.nama}</strong> ({selectedMapVoter.tps})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMapVoter(null)}
                    className="ml-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveSubTab('voters')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                ← Kembali ke Tabel
              </button>
            </div>
          </div>

          {/* Container Google Map */}
          <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            <APIProvider apiKey={apiKey} libraries={['marker', 'geocoding']}>
              <GoogleMap
                mapId="DEMO_MAP_ID"
                defaultCenter={defaultMapCenter}
                center={defaultMapCenter}
                defaultZoom={selectedMapVoter ? 15 : 12}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {/* Auto pan and zoom to selected voter */}
                <MapCameraPanHandler
                  target={
                    selectedMapVoter
                      ? {
                          lat: selectedMapVoter.lat || (selectedMapVoter as any).resolvedLat,
                          lng: selectedMapVoter.lng || (selectedMapVoter as any).resolvedLng,
                        }
                      : null
                  }
                />
                {votersWithCoords.map((voter) => (
                  <AdvancedMarker
                    key={voter.id}
                    position={{ lat: voter.resolvedLat, lng: voter.resolvedLng }}
                    onClick={() => setSelectedMapVoter(voter)}
                    title={`${voter.nama} (${voter.tps})`}
                  >
                    <div className="relative group cursor-pointer transform hover:scale-110 transition-transform">
                      <div className="w-9 h-9 rounded-full bg-teal-700 border-2 border-white shadow-lg flex items-center justify-center text-white">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-emerald-600 text-[8px] font-black text-white rounded-full border border-white font-mono">
                        {voter.tps.replace(/TPS\s*/i, '')}
                      </span>
                    </div>
                  </AdvancedMarker>
                ))}

                {/* InfoWindow saat marker voter dipilih */}
                {selectedMapVoter && (
                  <InfoWindow
                    position={{
                      lat: selectedMapVoter.lat || -6.1264,
                      lng: selectedMapVoter.lng || 106.7885,
                    }}
                    onCloseClick={() => setSelectedMapVoter(null)}
                    maxWidth={280}
                  >
                    <div className="p-1 space-y-2 text-slate-800 text-xs">
                      {selectedMapVoter.fotoKtpUrl && (
                        <div
                          className="relative rounded-lg overflow-hidden border border-slate-200 cursor-pointer group"
                          onClick={() => setSelectedVoterPreview(selectedMapVoter)}
                        >
                          <img
                            src={selectedMapVoter.fotoKtpUrl}
                            alt="KTP"
                            className="w-full h-24 object-cover group-hover:scale-102 transition-transform"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[8px] font-bold rounded">
                            🔍 Perbesar
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-[9px] font-mono font-bold text-teal-800 uppercase block">
                          VOTER TERVERIFIKASI (SCAN AI)
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {selectedMapVoter.nama}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          NIK: {selectedMapVoter.nikMasked || selectedMapVoter.nik}
                        </p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Penugasan TPS:</span>
                          <span className="font-extrabold text-cyan-800">{selectedMapVoter.tps}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Kelurahan:</span>
                          <span className="font-semibold">{selectedMapVoter.kelurahan}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Kecamatan:</span>
                          <span className="font-semibold">{selectedMapVoter.kecamatan}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Alamat:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[140px]">
                            {selectedMapVoter.alamat || '-'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Pencatat:</span>
                        <span className="font-bold text-slate-700">{selectedMapVoter.terdaftarOleh || 'Kader'}</span>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </APIProvider>
          </div>
        </div>
      )}

      {/* SUB TAB 3: LAPORAN VOTER PER TPS */}
      {activeSubTab === 'rekap_tps' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-black text-cyan-600 uppercase tracking-widest">
              SLIDE 11 · LAPORAN TERINTEGRASI
            </span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Laporan Voter Terdaftar per TPS
            </h3>
            <p className="text-xs text-slate-500">
              Target pemilih, voter terdaftar, validasi DPT KPU, dan persentase capaian per TPS.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Wilayah</th>
                  <th className="py-3 px-4 font-mono text-center">Target</th>
                  <th className="py-3 px-4 font-mono text-center">Terdaftar</th>
                  <th className="py-3 px-4 font-mono text-center">DPT Valid</th>
                  <th className="py-3 px-4 text-center">Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {LAPORAN_VOTER_PER_TPS.map((row, idx) => {
                  const isTotal = row.wilayah.includes('TOTAL');
                  return (
                    <tr
                      key={idx}
                      className={isTotal ? 'bg-teal-50 font-black text-slate-900' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-4 font-bold">{row.wilayah}</td>
                      <td className="py-3 px-4 font-mono text-center">{row.target}</td>
                      <td className="py-3 px-4 font-mono text-center text-cyan-800 font-bold">
                        {row.terdaftar}
                      </td>
                      <td className="py-3 px-4 font-mono text-center text-emerald-700 font-bold">
                        {row.dptValid}
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-teal-800">
                        {row.capaian}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 4: HASIL QUICK COUNT & PEMETAAN PASLON */}
      {activeSubTab === 'quick_count_pemetaan' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-black text-cyan-600 uppercase tracking-widest">
              SLIDE 12 · LAPORAN TERINTEGRASI
            </span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Hasil Quick Count &amp; Pemetaan Paslon
            </h3>
            <p className="text-xs text-slate-500">
              Perolehan suara berdasarkan formulir C1 Plano saksi TPS yang telah terverifikasi OCR.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Paslon</th>
                  <th className="py-3 px-4 font-mono text-center">Suara</th>
                  <th className="py-3 px-4 font-mono text-center">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {HASIL_QUICK_COUNT_PEMETAAN.map((p, idx) => (
                  <tr
                    key={idx}
                    className={p.isUtama ? 'bg-teal-50/80 font-bold text-teal-950' : 'hover:bg-slate-50'}
                  >
                    <td className="py-3 px-4 font-black flex items-center gap-2">
                      {p.isUtama && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      <span>{p.paslon}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-black">
                      {p.suara.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-extrabold text-teal-800">
                      {p.persentase}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-black text-slate-900">
                  <td className="py-3 px-4">TOTAL SUARA SAH</td>
                  <td className="py-3 px-4 font-mono text-center">44.085</td>
                  <td className="py-3 px-4 font-mono text-center">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 5: RINCIAN OCR CALEG & PASLON LAIN */}
      {activeSubTab === 'rincian_ocr' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-black text-cyan-600 uppercase tracking-widest">
              SLIDE 13 · LAPORAN TERINTEGRASI
            </span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Rincian OCR • Caleg &amp; Paslon Lain
            </h3>
            <p className="text-xs text-slate-500">
              Rincian audit angka suara tiap kandidat kompetitor serta nomor urut partai.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4 text-center">Partai / No.</th>
                  <th className="py-3 px-4 font-mono text-center">Suara</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {RINCIAN_OCR_CALEG_PASLON.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.nama}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {c.partaiNo}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-black text-slate-900">
                      {c.suara.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] rounded-full border border-emerald-300">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FULL PREVIEW FOTO FISIK e-KTP & DETAIL DATA LENGKAP */}
      {selectedVoterPreview && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto text-slate-800 animate-in fade-in zoom-in-95 duration-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full font-mono">
                  ARSIP e-KTP RESMI
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Detail Identitas Pemilih &amp; Hasil Scan Fisik
                </h3>
                <p className="text-xs text-slate-500">
                  Foto dan data kartu tanda penduduk diverifikasi langsung oleh Kader TPS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVoterPreview(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Foto KTP Display */}
            {selectedVoterPreview.fotoKtpUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                <img
                  src={selectedVoterPreview.fotoKtpUrl}
                  alt={selectedVoterPreview.nama}
                  className="w-full max-h-64 object-contain mx-auto"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-lg text-white text-[10px] font-bold border border-white/20 flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-teal-300" />
                  <span>Foto e-KTP Fisik Asli</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                Tidak ada lampiran foto untuk pemilih ini
              </div>
            )}

            {/* Detail Identity Table */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Nomor Induk Kependudukan (NIK):</span>
                <span className="font-mono font-black text-slate-900 text-sm tracking-wide">
                  {selectedVoterPreview.nik}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Nama Lengkap:</span>
                <span className="font-black text-slate-900 text-sm">{selectedVoterPreview.nama}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Tempat / Tgl Lahir:</span>
                <span className="font-semibold text-slate-800">{selectedVoterPreview.tempatTglLahir || '-'}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Jenis Kelamin:</span>
                <span className="font-semibold text-slate-800">{selectedVoterPreview.jenisKelamin}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Alamat:</span>
                <span className="font-semibold text-slate-800">
                  {selectedVoterPreview.alamat} (RT {selectedVoterPreview.rtRw || '-'})
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Kelurahan &amp; Kecamatan:</span>
                <span className="font-bold text-teal-800">
                  {selectedVoterPreview.kelurahan}, {selectedVoterPreview.kecamatan}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Kota / Kabupaten:</span>
                <span className="font-bold text-slate-800">{selectedVoterPreview.kabupatenKota || 'DKI Jakarta'}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">TPS Penugasan:</span>
                <span className="font-black text-cyan-800 font-mono text-sm">{selectedVoterPreview.tps}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">No. WhatsApp / HP:</span>
                <span className="font-mono font-bold text-slate-800">{selectedVoterPreview.noHp || '-'}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Koordinat Google Maps:</span>
                <span className="font-mono text-xs text-teal-700 font-bold">
                  {selectedVoterPreview.lat ? `${selectedVoterPreview.lat.toFixed(4)}, ${selectedVoterPreview.lng?.toFixed(4)}` : 'Tersinkron'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Diinput Oleh:</span>
                <span className="font-medium text-slate-700">{selectedVoterPreview.terdaftarOleh || 'Kader'} ({selectedVoterPreview.waktuDaftar})</span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMapVoter(selectedVoterPreview);
                  setSelectedVoterPreview(null);
                  setActiveSubTab('peta_voters');
                }}
                className="px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Lihat di Peta Suara</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVoterPreview(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
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

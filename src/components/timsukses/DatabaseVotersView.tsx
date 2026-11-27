import React, { useMemo, useState } from 'react';
import type { FormB1Upload, FormC1Upload, UserAccount, VoterOcrRecord } from '../../types/vore';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { SwarakuMapsProvider, SwarakuMapsDiagnosticNotice } from '../maps/SwarakuMapsProvider';
import { lookupSmartCoordinates } from '../../utils/geocoding';
import {
  formatWilayahInput,
  isRelawanRole,
  resolvePenginputName,
} from '../../utils/hierarchyAccess';
import {
  Search,
  Users,
  CheckCircle2,
  Building2,
  MapPin,
  FileSpreadsheet,
  BarChart3,
  X,
  ChevronRight,
  UserCheck,
  CreditCard,
  Eye,
  Compass,
  Phone,
  RefreshCw,
  UserPlus,
  Award,
  ShieldCheck,
  ScanLine,
} from 'lucide-react';
import { VoterDetailModal, isVoterOcrVerified } from '../registration/VoterDetailModal';

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
  userAccounts?: UserAccount[];
  currentUser?: UserAccount | null;
  c1Records?: FormC1Upload[];
  b1Records?: FormB1Upload[];
  canAddRelawan?: boolean;
  onOpenDaftarVoterModal?: () => void;
  onOpenCommandRegist?: () => void;
  onTriggerCloudSync?: () => Promise<void>;
  isSyncingCloud?: boolean;
}

type DatabaseSubTab =
  | 'daftar_voter'
  | 'daftar_relawan'
  | 'laporan_kelurahan'
  | 'quick_count_paslon';

export const DatabaseVotersView: React.FC<DatabaseVotersViewProps> = ({
  voterList,
  userAccounts = [],
  currentUser,
  c1Records = [],
  b1Records = [],
  canAddRelawan = false,
  onOpenDaftarVoterModal,
  onOpenCommandRegist,
  onTriggerCloudSync,
  isSyncingCloud,
}) => {
  const isRelawanViewer = isRelawanRole(currentUser?.role);
  const [activeSubTab, setActiveSubTab] = useState<DatabaseSubTab>('daftar_voter');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKota, setSelectedKota] = useState<string>('Semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('Semua');
  const [onlyOcrVerified, setOnlyOcrVerified] = useState(false);
  const [relawanSearch, setRelawanSearch] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modal Detail Voter & Peta Lokasi Cepat
  const [selectedVoterPreview, setSelectedVoterPreview] = useState<VoterOcrRecord | null>(null);
  const [mapModalVoter, setMapModalVoter] = useState<(VoterOcrRecord & { resolvedLat: number; resolvedLng: number }) | null>(null);

  const ocrVerifiedCount = useMemo(
    () => voterList.filter((v) => isVoterOcrVerified(v)).length,
    [voterList]
  );

  // Dynamic hierarchical filter options (Kota -> Kecamatan -> Kelurahan)
  const kotaOptions = useMemo(() => {
    return Array.from(new Set(voterList.map((v) => v.kabupatenKota).filter(Boolean))).sort();
  }, [voterList]);

  const kecamatanOptions = useMemo(() => {
    const base =
      selectedKota === 'Semua'
        ? voterList
        : voterList.filter((v) => v.kabupatenKota === selectedKota);
    return Array.from(new Set(base.map((v) => v.kecamatan).filter(Boolean))).sort();
  }, [voterList, selectedKota]);

  const kelurahanOptions = useMemo(() => {
    let base = voterList;
    if (selectedKota !== 'Semua') base = base.filter((v) => v.kabupatenKota === selectedKota);
    if (selectedKecamatan !== 'Semua') base = base.filter((v) => v.kecamatan === selectedKecamatan);
    return Array.from(new Set(base.map((v) => v.kelurahan).filter(Boolean))).sort();
  }, [voterList, selectedKota, selectedKecamatan]);

  const filteredVoters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return voterList.filter((voter) => {
      if (q) {
        const match =
          (voter.nama || '').toLowerCase().includes(q) ||
          (voter.nik || '').includes(q) ||
          (voter.kelurahan || '').toLowerCase().includes(q) ||
          (voter.kecamatan || '').toLowerCase().includes(q) ||
          (voter.kabupatenKota || '').toLowerCase().includes(q) ||
          (voter.alamat || '').toLowerCase().includes(q) ||
          (voter.terdaftarOleh || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedKota !== 'Semua' && voter.kabupatenKota !== selectedKota) return false;
      if (selectedKecamatan !== 'Semua' && voter.kecamatan !== selectedKecamatan) return false;
      if (selectedKelurahan !== 'Semua' && voter.kelurahan !== selectedKelurahan) return false;
      if (onlyOcrVerified && !isVoterOcrVerified(voter)) return false;
      return true;
    });
  }, [voterList, searchQuery, selectedKota, selectedKecamatan, selectedKelurahan, onlyOcrVerified]);

  // Relawan list from Cloud userAccounts
  const relawanList = useMemo(() => {
    const base = userAccounts.filter((u) => u.role === 'relawan');
    const q = relawanSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        (r.nama || '').toLowerCase().includes(q) ||
        (r.username || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.kota || '').toLowerCase().includes(q) ||
        (r.kecamatan || '').toLowerCase().includes(q) ||
        (r.kelurahan || '').toLowerCase().includes(q) ||
        (r.wilayah || '').toLowerCase().includes(q)
    );
  }, [userAccounts, relawanSearch]);

  // Live Aggregation: Laporan Voter per Kelurahan (Kota -> Kecamatan -> Kelurahan)
  const laporanPerKelurahan = useMemo(() => {
    const map = new Map<
      string,
      {
        kota: string;
        kecamatan: string;
        kelurahan: string;
        terdaftar: number;
        dptValid: number;
        relawanPenginput: Set<string>;
      }
    >();

    voterList.forEach((v) => {
      const kota = v.kabupatenKota || 'Belum Diisi';
      const kecamatan = v.kecamatan || 'Belum Diisi';
      const kelurahan = v.kelurahan || 'Belum Diisi';
      const key = `${kota}||${kecamatan}||${kelurahan}`;
      const existing = map.get(key);
      if (existing) {
        existing.terdaftar += 1;
        if (v.statusDpt === 'DPT valid') existing.dptValid += 1;
        if (v.terdaftarOleh) existing.relawanPenginput.add(v.terdaftarOleh);
      } else {
        map.set(key, {
          kota,
          kecamatan,
          kelurahan,
          terdaftar: 1,
          dptValid: v.statusDpt === 'DPT valid' ? 1 : 0,
          relawanPenginput: new Set(v.terdaftarOleh ? [v.terdaftarOleh] : []),
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.terdaftar - a.terdaftar);
  }, [voterList]);

  // Live Aggregation: Hasil Quick Count Paslon grouped by Kelurahan & Kecamatan (Zero TPS/Dapil)
  const quickCountSummary = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    let tidakSah = 0;
    const perKelurahan = new Map<
      string,
      { kelurahan: string; kecamatan: string; p1: number; p2: number; p3: number; tidakSah: number; jumlahLaporan: number }
    >();

    const addRow = (kel: string, kec: string, s1: number, s2: number, s3: number, ts: number) => {
      p1 += s1;
      p2 += s2;
      p3 += s3;
      tidakSah += ts;
      const kelClean = (kel || 'Belum Diisi').replace(/^kel\.?\s*/i, '');
      const kecClean = (kec || 'Belum Diisi').replace(/^kec\.?\s*/i, '');
      const key = `${kecClean}||${kelClean}`;
      const cur = perKelurahan.get(key);
      if (cur) {
        cur.p1 += s1;
        cur.p2 += s2;
        cur.p3 += s3;
        cur.tidakSah += ts;
        cur.jumlahLaporan += 1;
      } else {
        perKelurahan.set(key, {
          kelurahan: kelClean,
          kecamatan: kecClean,
          p1: s1,
          p2: s2,
          p3: s3,
          tidakSah: ts,
          jumlahLaporan: 1,
        });
      }
    };

    c1Records.forEach((r) =>
      addRow(r.kelurahan, r.kecamatan, Number(r.suaraPaslon1) || 0, Number(r.suaraPaslon2) || 0, Number(r.suaraPaslon3) || 0, Number(r.suaraTidakSah) || 0)
    );
    b1Records.forEach((r) =>
      addRow(r.kelurahan, r.kecamatan, Number(r.suaraPaslon1) || 0, Number(r.suaraPaslon2) || 0, Number(r.suaraPaslon3) || 0, Number(r.suaraTidakSah) || 0)
    );

    const totalSah = p1 + p2 + p3;
    const pct = (v: number) => (totalSah > 0 ? ((v / totalSah) * 100).toFixed(1) : '0.0');

    return {
      p1,
      p2,
      p3,
      tidakSah,
      totalSah,
      p1Pct: pct(p1),
      p2Pct: pct(p2),
      p3Pct: pct(p3),
      perKelurahan: Array.from(perKelurahan.values()).sort(
        (a, b) => b.p1 + b.p2 + b.p3 - (a.p1 + a.p2 + a.p3)
      ),
    };
  }, [c1Records, b1Records]);

  const resolveVoterCoords = (v: VoterOcrRecord) => {
    if (typeof v.lat === 'number' && typeof v.lng === 'number' && Number.isFinite(v.lat) && Number.isFinite(v.lng)) {
      return { resolvedLat: v.lat, resolvedLng: v.lng };
    }
    const smart = lookupSmartCoordinates(v.kelurahan, v.kecamatan, v.kabupatenKota);
    return {
      resolvedLat: smart?.lat ?? -6.2088,
      resolvedLng: smart?.lng ?? 106.8456,
    };
  };

  const handleExportCsv = () => {
    const headers = [
      'NIK',
      'Nama Voter',
      'No HP',
      'Kota',
      'Kecamatan',
      'Kelurahan',
      'Alamat Lengkap',
      'Penginput',
      'Status DPT',
      'Waktu Daftar',
    ];
    const rows = filteredVoters.map((v) => [
      `"${v.nik || ''}"`,
      `"${v.nama || ''}"`,
      `"${v.noHp || ''}"`,
      `"${v.kabupatenKota || ''}"`,
      `"${v.kecamatan || ''}"`,
      `"${v.kelurahan || ''}"`,
      `"${(v.alamat || '').replace(/"/g, "'")}"`,
      `"${v.terdaftarOleh || ''}"`,
      `"${v.statusDpt || 'DPT valid'}"`,
      `"${v.waktuDaftar || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Database_Voter_Kelurahan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Data Database Voter per Kelurahan berhasil diekspor ke CSV/Excel!');
    setTimeout(() => setExportNotice(null), 3500);
  };

  const totalRelawanCount = userAccounts.filter((u) => u.role === 'relawan').length;

  return (
    <div className="space-y-6 text-slate-800">
      {exportNotice && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white border border-teal-400 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-mono text-cyan-300 font-bold border border-white/10">
              <span>DATABASE TERPADU</span>
              <span>·</span>
              <span>KOTA → KECAMATAN → KELURAHAN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Database Voter, Relawan &amp; Rekap Kelurahan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Seluruh data Voter/Konstituen, daftar akun Relawan, laporan per Kelurahan, serta hasil Quick Count Paslon tersinkronisasi real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onTriggerCloudSync && (
              <button
                type="button"
                onClick={onTriggerCloudSync}
                disabled={isSyncingCloud}
                className="px-3.5 py-2.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
              </button>
            )}

            {(onOpenCommandRegist || onOpenDaftarVoterModal) && (
              <button
                type="button"
                onClick={onOpenCommandRegist || onOpenDaftarVoterModal}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Registrasi Baru</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-4 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Total Voter Terdaftar
            </span>
            <span className="text-2xl font-black font-mono text-cyan-400 mt-0.5 block">
              {voterList.length.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
              Tersinkron ke Peta Suara
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Total Relawan Aktif
            </span>
            <span className="text-2xl font-black font-mono text-amber-300 mt-0.5 block">
              {totalRelawanCount.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-300 font-medium block mt-0.5">
              Akun Whitelist Terdaftar
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Kelurahan Tercakup
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
              {laporanPerKelurahan.length}
            </span>
            <span className="text-[10px] text-slate-300 font-medium block mt-0.5">
              {kecamatanOptions.length} Kecamatan · {kotaOptions.length} Kota
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Total Suara Quick Count
            </span>
            <span className="text-2xl font-black font-mono text-white mt-0.5 block">
              {quickCountSummary.totalSah.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-300 font-medium block mt-0.5">
              {c1Records.length + b1Records.length} Laporan Masuk
            </span>
          </div>
        </div>
      </div>

      {/* 4 Required Database Sub-Menus */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold bg-slate-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('daftar_voter')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'daftar_voter'
              ? 'bg-white text-cyan-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-600" />
          <span>Daftar Voter ({filteredVoters.length})</span>
        </button>

        {!isRelawanViewer && (
          <button
            type="button"
            onClick={() => setActiveSubTab('daftar_relawan')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'daftar_relawan'
                ? 'bg-white text-cyan-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Daftar Relawan ({totalRelawanCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSubTab('laporan_kelurahan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'laporan_kelurahan'
              ? 'bg-white text-cyan-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>Laporan Voter per Kelurahan ({laporanPerKelurahan.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('quick_count_paslon')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'quick_count_paslon'
              ? 'bg-white text-cyan-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Hasil Quick Count Paslon</span>
        </button>
      </div>

      {/* SUB-MENU 1: DAFTAR VOTER (Nama, Kota, Kecamatan, Kelurahan, Alamat, Penginput) */}
      {activeSubTab === 'daftar_voter' && (
        <div className="space-y-4">
          {/* Cascading Filter Bar: Kota -> Kecamatan -> Kelurahan */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto pb-1">
              <span className="text-slate-900 font-bold">Filter Wilayah:</span>
              <span className="text-cyan-700 font-bold">
                {selectedKota !== 'Semua' ? selectedKota : 'Semua Kota'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-cyan-700 font-bold">
                {selectedKecamatan !== 'Semua' ? selectedKecamatan : 'Semua Kecamatan'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded-md font-bold">
                {selectedKelurahan !== 'Semua' ? `Kel. ${selectedKelurahan}` : 'Semua Kelurahan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama voter, NIK, Kelurahan, alamat, atau penginput..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedKota}
                onChange={(e) => {
                  setSelectedKota(e.target.value);
                  setSelectedKecamatan('Semua');
                  setSelectedKelurahan('Semua');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="Semua">Semua Kota ({kotaOptions.length})</option>
                {kotaOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              <select
                value={selectedKecamatan}
                onChange={(e) => {
                  setSelectedKecamatan(e.target.value);
                  setSelectedKelurahan('Semua');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="Semua">Semua Kecamatan ({kecamatanOptions.length})</option>
                {kecamatanOptions.map((kec) => (
                  <option key={kec} value={kec}>
                    {kec}
                  </option>
                ))}
              </select>

              <select
                value={selectedKelurahan}
                onChange={(e) => setSelectedKelurahan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="Semua">Semua Kelurahan ({kelurahanOptions.length})</option>
                {kelurahanOptions.map((kel) => (
                  <option key={kel} value={kel}>
                    Kel. {kel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voter Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    Daftar Voter / Konstituen Terdaftar ({filteredVoters.length} Orang)
                  </h3>
                  {ocrVerifiedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{ocrVerifiedCount} Terverifikasi OCR</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menampilkan struktur wilayah lengkap: Kota, Kecamatan, Kelurahan, Alamat Lengkap, status verifikasi OCR, serta nama penginput.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setOnlyOcrVerified((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                    onlyOcrVerified
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>{onlyOcrVerified ? 'Menampilkan OCR Saja' : 'Filter OCR'}</span>
                </button>
                {onOpenCommandRegist && (
                  <button
                    type="button"
                    onClick={onOpenCommandRegist}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Daftarkan Voter</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">Nama Voter &amp; NIK</th>
                    <th className="py-3 px-4">Kelurahan</th>
                    <th className="py-3 px-4">Kecamatan</th>
                    <th className="py-3 px-4">Kota / Kabupaten</th>
                    <th className="py-3 px-4">Alamat Lengkap</th>
                    <th className="py-3 px-4">Nama Penginput &amp; Wilayah Input</th>
                    <th className="py-3 px-4 text-center">Detail &amp; Peta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                          <CreditCard className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-bold text-slate-800">
                            {searchQuery || selectedKota !== 'Semua' || selectedKelurahan !== 'Semua'
                              ? 'Tidak ada data Voter yang cocok dengan filter.'
                              : 'Belum ada data Voter yang terdaftar.'}
                          </p>
                          <p className="text-xs text-slate-400">
                            Gunakan Menu Registrasi untuk mendaftarkan Konstituen/Voter baru agar langsung tampil di sini dan di Peta Suara.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVoters.map((voter) => {
                      const coords = resolveVoterCoords(voter);
                      const ocrBadge = isVoterOcrVerified(voter);
                      return (
                        <tr key={voter.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              {voter.fotoKtpUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedVoterPreview(voter)}
                                  title="Lihat Foto KTP & Detail"
                                  className="w-12 h-8 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 mt-0.5 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                                >
                                  <img
                                    src={voter.fotoKtpUrl}
                                    alt={`ID ${voter.nama}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : null}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900">
                                    {voter.nama}
                                  </span>
                                  {ocrBadge && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-extrabold">
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                      <span>OCR</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 block">
                                  {voter.nikMasked || voter.nik || '-'}
                                </span>
                                {voter.noHp && voter.noHp !== '-' && (
                                  <span className="text-[10px] font-mono text-slate-400 inline-flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" /> {voter.noHp}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-cyan-800">
                            {voter.kelurahan || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {voter.kecamatan || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {voter.kabupatenKota || '-'}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-slate-700 line-clamp-2">{voter.alamat || '-'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {resolvePenginputName(voter)}
                            </span>
                            <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              {formatWilayahInput(voter)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {voter.waktuDaftar || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedVoterPreview(voter)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Detail</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setMapModalVoter({
                                    ...voter,
                                    resolvedLat: coords.resolvedLat,
                                    resolvedLng: coords.resolvedLng,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Peta</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MENU 2: DAFTAR RELAWAN */}
      {activeSubTab === 'daftar_relawan' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Daftar Akun Relawan Terdaftar ({relawanList.length} Orang)
              </h3>
              <p className="text-xs text-slate-500">
                Seluruh Relawan aktif di whitelist login beserta wilayah Kelurahan, Kecamatan, dan Kota tugasnya.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={relawanSearch}
                  onChange={(e) => setRelawanSearch(e.target.value)}
                  placeholder="Cari nama Relawan / Kelurahan..."
                  className="pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs w-56"
                />
              </div>
              {canAddRelawan && onOpenCommandRegist && (
                <button
                  type="button"
                  onClick={onOpenCommandRegist}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Relawan</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Nama Relawan</th>
                  <th className="py-3 px-4">Username &amp; Email</th>
                  <th className="py-3 px-4">Wilayah Tugas (Kota / Kec / Kel)</th>
                  <th className="py-3 px-4">Koordinator Pembina</th>
                  <th className="py-3 px-4 text-center">Poin</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relawanList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-slate-400">
                      Belum ada akun Relawan yang terdaftar. Daftarkan melalui Menu Registrasi.
                    </td>
                  </tr>
                ) : (
                  relawanList.map((rel) => (
                    <tr key={rel.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block">{rel.nama}</span>
                        <span className="text-[11px] font-mono text-slate-500">{rel.noHp || '-'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <span className="font-bold block">@{rel.username}</span>
                        <span className="text-[11px] text-slate-400">{rel.email || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-cyan-800 block">
                          {rel.kelurahan ? `Kel. ${rel.kelurahan}` : rel.wilayah || '-'}
                        </span>
                        {(rel.kecamatan || rel.kota) && (
                          <span className="text-[11px] text-slate-500">
                            {[rel.kecamatan ? `Kec. ${rel.kecamatan}` : '', rel.kota || ''].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {rel.korcamNama ? (
                          <span className="block">Korcam: <strong>{rel.korcamNama}</strong></span>
                        ) : null}
                        {rel.timSuksesNama ? (
                          <span className="block text-[11px] text-slate-500">Korwil: {rel.timSuksesNama}</span>
                        ) : !rel.korcamNama ? (
                          <span>-</span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold">
                          <Award className="w-3 h-3" />
                          {(rel.points || 0).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rel.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : rel.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-700'
                              : rel.status === 'Nonaktif'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {rel.status || 'Aktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-MENU 3: LAPORAN VOTER PER KELURAHAN */}
      {activeSubTab === 'laporan_kelurahan' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-black text-cyan-600 uppercase tracking-widest">
              REKAPITULASI WILAYAH LIVE
            </span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Laporan Voter Terdaftar per Kelurahan
            </h3>
            <p className="text-xs text-slate-500">
              Ringkasan jumlah Konstituen/Voter per Kelurahan, Kecamatan, dan Kota yang tersinkronisasi langsung dari Menu Registrasi.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kelurahan</th>
                  <th className="py-3 px-4">Kecamatan</th>
                  <th className="py-3 px-4">Kota / Kabupaten</th>
                  <th className="py-3 px-4 font-mono text-center">Total Voter</th>
                  <th className="py-3 px-4 font-mono text-center">DPT Valid</th>
                  <th className="py-3 px-4 font-mono text-center">Penginput Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {laporanPerKelurahan.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-slate-400">
                      Belum ada data Voter masuk untuk diringkas per Kelurahan.
                    </td>
                  </tr>
                ) : (
                  <>
                    {laporanPerKelurahan.map((row) => (
                      <tr
                        key={`${row.kota}-${row.kecamatan}-${row.kelurahan}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="py-3 px-4 font-extrabold text-cyan-900">
                          Kel. {row.kelurahan}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{row.kecamatan}</td>
                        <td className="py-3 px-4 text-slate-600">{row.kota}</td>
                        <td className="py-3 px-4 font-mono text-center font-black text-slate-900">
                          {row.terdaftar.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-mono text-center font-bold text-emerald-700">
                          {row.dptValid.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600">
                          {row.relawanPenginput.size} Orang
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-teal-50 font-black text-slate-900">
                      <td colSpan={3} className="py-3 px-4 uppercase">
                        TOTAL SELURUH KELURAHAN ({laporanPerKelurahan.length} Kelurahan)
                      </td>
                      <td className="py-3 px-4 font-mono text-center text-cyan-900">
                        {voterList.length.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono text-center text-emerald-800">
                        {voterList.filter((v) => v.statusDpt === 'DPT valid').length.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono text-center">—</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-MENU 4: HASIL QUICK COUNT PASLON (Per Kelurahan & Kecamatan) */}
      {activeSubTab === 'quick_count_paslon' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Hasil Quick Count Paslon (Rekap per Kelurahan &amp; Kecamatan)
              </h3>
              <p className="text-xs text-slate-500">
                Total suara sah: <strong className="font-mono text-slate-900">{quickCountSummary.totalSah.toLocaleString('id-ID')}</strong> · Tidak sah: <strong className="font-mono text-slate-900">{quickCountSummary.tidakSah.toLocaleString('id-ID')}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {[
                { label: 'Paslon 01 (Kandidat Utama)', suara: quickCountSummary.p1, pct: quickCountSummary.p1Pct, bar: 'bg-teal-600', bg: 'bg-teal-50 border-teal-200' },
                { label: 'Paslon 02', suara: quickCountSummary.p2, pct: quickCountSummary.p2Pct, bar: 'bg-slate-600', bg: 'bg-slate-50 border-slate-200' },
                { label: 'Paslon 03', suara: quickCountSummary.p3, pct: quickCountSummary.p3Pct, bar: 'bg-slate-400', bg: 'bg-slate-50 border-slate-200' },
              ].map((p) => (
                <div key={p.label} className={`p-4 rounded-2xl border ${p.bg} space-y-2`}>
                  <p className="text-xs font-extrabold text-slate-800">{p.label}</p>
                  <p className="text-2xl font-black font-mono text-slate-900">
                    {p.suara.toLocaleString('id-ID')}{' '}
                    <span className="text-sm font-bold text-slate-600">({p.pct}%)</span>
                  </p>
                  <div className="h-2 rounded-full bg-white overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.bar}`}
                      style={{ width: `${Math.min(100, Number(p.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">Kelurahan</th>
                    <th className="py-3 px-4">Kecamatan</th>
                    <th className="py-3 px-4 text-center font-mono">Paslon 01</th>
                    <th className="py-3 px-4 text-center font-mono">Paslon 02</th>
                    <th className="py-3 px-4 text-center font-mono">Paslon 03</th>
                    <th className="py-3 px-4 text-center font-mono">Total Sah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quickCountSummary.perKelurahan.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-slate-400">
                        Belum ada laporan Quick Count yang masuk per Kelurahan.
                      </td>
                    </tr>
                  ) : (
                    quickCountSummary.perKelurahan.map((row) => (
                      <tr key={`${row.kecamatan}-${row.kelurahan}`} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">Kel. {row.kelurahan}</td>
                        <td className="py-3 px-4 text-slate-600">Kec. {row.kecamatan}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-teal-700">
                          {row.p1.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700">
                          {row.p2.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700">
                          {row.p3.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-slate-900">
                          {(row.p1 + row.p2 + row.p3).toLocaleString('id-ID')}
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

      {/* MODAL DETAIL PROFIL VOTER (TERMASUK STATUS OCR & FOTO KTP) */}
      <VoterDetailModal
        voter={selectedVoterPreview}
        onClose={() => setSelectedVoterPreview(null)}
      />

      {/* MODAL QUICK MAP VIEW FOR SELECTED VOTER */}
      {mapModalVoter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                  <Compass className="w-4 h-4" />
                  <span>Titik Lokasi Voter (Google Maps)</span>
                </div>
                <h3 className="text-base font-black text-slate-900">{mapModalVoter.nama}</h3>
                <p className="text-xs text-slate-500">
                  {mapModalVoter.alamat}, Kel. {mapModalVoter.kelurahan}, Kec. {mapModalVoter.kecamatan}, {mapModalVoter.kabupatenKota}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapModalVoter(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <SwarakuMapsProvider
                fallback={
                  <div className="h-full w-full p-4 bg-slate-50 flex flex-col justify-center">
                    <SwarakuMapsDiagnosticNotice
                      title="Peta interaktif sedang tidak dapat dimuat"
                      subtitle={`Koordinat terpetakan: ${mapModalVoter.resolvedLat.toFixed(5)}, ${mapModalVoter.resolvedLng.toFixed(5)}`}
                    />
                  </div>
                }
              >
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={{ lat: mapModalVoter.resolvedLat, lng: mapModalVoter.resolvedLng }}
                  defaultZoom={16}
                  gestureHandling="greedy"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MapCameraPanHandler
                    target={{ lat: mapModalVoter.resolvedLat, lng: mapModalVoter.resolvedLng }}
                  />
                  <AdvancedMarker
                    position={{ lat: mapModalVoter.resolvedLat, lng: mapModalVoter.resolvedLng }}
                    title={mapModalVoter.nama}
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-700 border-2 border-white shadow-lg flex items-center justify-center text-white">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </AdvancedMarker>
                  <InfoWindow
                    position={{ lat: mapModalVoter.resolvedLat, lng: mapModalVoter.resolvedLng }}
                  >
                    <div className="text-xs text-slate-800 space-y-0.5 max-w-[220px]">
                      <p className="font-black text-slate-900">{mapModalVoter.nama}</p>
                      <p>Kel. {mapModalVoter.kelurahan}, Kec. {mapModalVoter.kecamatan}</p>
                      <p className="text-slate-500">{mapModalVoter.kabupatenKota}</p>
                    </div>
                  </InfoWindow>
                </GoogleMap>
              </SwarakuMapsProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

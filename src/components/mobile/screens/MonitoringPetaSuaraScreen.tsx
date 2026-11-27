import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Users,
  Building2,
  Search,
  Filter,
  RotateCcw,
  UserPlus,
  Lock,
  ChevronRight,
  Layers,
  CheckCircle2,
  Map as MapIcon,
} from 'lucide-react';
import type { DptVoterRecord, UserAccount, VoterOcrRecord } from '../../../types/vore';
import type { TimSuksesWilayahRecord } from '../../../data/petaSuaraData';
import { PetaSuaraGoogleMapsView } from '../../peta/PetaSuaraGoogleMapsView';
import {
  filterScopedVotersForPetaSuara,
  isFullAccessRole,
  isKorcamRole,
  isKorwilRole,
  isRelawanRole,
  resolveUserProvinsi,
  resolveVoterProvinsi,
} from '../../../utils/hierarchyAccess';

// ============================================================================
// SWARAKU — MODUL "PETA SUARA" (MURNI VOTERS LAPANGAN & WILAYAH DINAMIS)
// - Hanya data Konstituen / Voters hasil inputan Korwil, Korcam, & Relawan
// - Tersaring otomatis sesuai Hak Akses Hierarki Wilayah user yang login
// - Zero data dummy / sampel / koordinator palsu / layer non-voter
// - Zero referensi Dapil di seluruh UI, filter, label, dan struktur data
// - Filter Berjenjang Dinamis: Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan/Desa
// - Daftar Kecamatan Dinamis: hanya tampilkan Kecamatan yang benar-benar ada (>=1 voter)
// ============================================================================

export interface MonitoringPetaSuaraScreenProps {
  voterList: VoterOcrRecord[];
  userAccounts?: UserAccount[];
  currentUser?: UserAccount | null;
  targetVoter?: VoterOcrRecord | null;
  onNavigateTab?: (tab: string) => void;
  // Optional legacy props accepted for backward-compatible callers (unused in pure Voter Peta Suara)
  dptList?: DptVoterRecord[];
  timSuksesList?: TimSuksesWilayahRecord[];
  onSaveTimSukses?: (ts: TimSuksesWilayahRecord) => void;
  onSaveVoter?: (voter: VoterOcrRecord) => void;
  onResetDataToZero?: () => void;
  onOpenWhatsAppBlazt?: () => void;
  onOpenTambahNikModal?: () => void;
}

interface KecamatanRecapItem {
  kecamatan: string;
  kota: string;
  provinsi: string;
  totalVoters: number;
  kelurahanCounts: { kelurahan: string; count: number }[];
}

export const MonitoringPetaSuaraScreen: React.FC<MonitoringPetaSuaraScreenProps> = ({
  voterList,
  userAccounts = [],
  currentUser = null,
  targetVoter = null,
  onNavigateTab,
}) => {
  const isFullAccess = isFullAccessRole(currentUser?.role);
  const isKorwil = isKorwilRole(currentUser?.role);
  const isKorcam = isKorcamRole(currentUser?.role);
  const isRelawan = isRelawanRole(currentUser?.role);

  // 1. Saring murni data Voters lapangan sesuai Hak Akses Hierarki Wilayah
  const scopedVoters = useMemo(
    () => filterScopedVotersForPetaSuara(currentUser, voterList, userAccounts),
    [currentUser, voterList, userAccounts]
  );

  // Normalisasi atribut wilayah administratif tiap voter
  const enrichedVoters = useMemo(
    () =>
      scopedVoters.map((v) => ({
        voter: v,
        provinsi: resolveVoterProvinsi(v),
        kota: (v.kabupatenKota || '').trim() || 'Belum Diisi',
        kecamatan: (v.kecamatan || '').trim() || 'Belum Diisi',
        kelurahan: (v.kelurahan || '').trim() || 'Belum Diisi',
      })),
    [scopedVoters]
  );

  // Deteksi kunci wilayah atas untuk Korwil & Korcam
  const lockedProvinsi = useMemo(() => {
    if (!isKorwil && !isKorcam) return '';
    return resolveUserProvinsi(currentUser);
  }, [isKorwil, isKorcam, currentUser]);

  const lockedKota = useMemo(() => {
    if (!isKorwil && !isKorcam) return '';
    return (currentUser?.kota || '').trim();
  }, [isKorwil, isKorcam, currentUser]);

  const lockedKecamatan = useMemo(() => {
    if (!isKorcam) return '';
    return (currentUser?.kecamatan || '').trim();
  }, [isKorcam, currentUser]);

  // 2. State Filter Berjenjang (Cascading Filter): Provinsi -> Kota/Kab -> Kecamatan -> Kelurahan
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('');
  const [selectedKota, setSelectedKota] = useState<string>('');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedVoter, setFocusedVoter] = useState<VoterOcrRecord | null>(targetVoter);

  useEffect(() => {
    if (targetVoter) setFocusedVoter(targetVoter);
  }, [targetVoter]);

  // Opsi Provinsi dinamis dari data voters yang masuk
  const provinsiOptions = useMemo(() => {
    const set = new Set<string>();
    enrichedVoters.forEach((e) => {
      if (e.provinsi && e.provinsi !== 'Lainnya / Belum Diisi') set.add(e.provinsi);
    });
    if (lockedProvinsi && set.size === 0) set.add(lockedProvinsi);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id-ID'));
  }, [enrichedVoters, lockedProvinsi]);

  // Sinkronisasi awal filter terkunci untuk Korwil & Korcam
  useEffect(() => {
    if ((isKorwil || isKorcam) && lockedProvinsi) {
      const matched = provinsiOptions.find(
        (p) => p.toLowerCase() === lockedProvinsi.toLowerCase()
      );
      setSelectedProvinsi(matched || lockedProvinsi);
    }
  }, [isKorwil, isKorcam, lockedProvinsi, provinsiOptions]);

  // Voters setelah filter Provinsi
  const votersAfterProvinsi = useMemo(() => {
    if (!selectedProvinsi) return enrichedVoters;
    const pLower = selectedProvinsi.toLowerCase();
    return enrichedVoters.filter((e) => e.provinsi.toLowerCase() === pLower);
  }, [enrichedVoters, selectedProvinsi]);

  // Opsi Kota / Kabupaten dinamis (disaring oleh Provinsi)
  const kotaOptions = useMemo(() => {
    const set = new Set<string>();
    votersAfterProvinsi.forEach((e) => {
      if (e.kota && e.kota !== 'Belum Diisi') set.add(e.kota);
    });
    if (lockedKota && set.size === 0) set.add(lockedKota);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id-ID'));
  }, [votersAfterProvinsi, lockedKota]);

  useEffect(() => {
    if ((isKorwil || isKorcam) && lockedKota) {
      const matched = kotaOptions.find((k) => k.toLowerCase() === lockedKota.toLowerCase());
      setSelectedKota(matched || lockedKota);
    }
  }, [isKorwil, isKorcam, lockedKota, kotaOptions]);

  // Voters setelah filter Kota / Kabupaten
  const votersAfterKota = useMemo(() => {
    if (!selectedKota) return votersAfterProvinsi;
    const kLower = selectedKota.toLowerCase();
    return votersAfterProvinsi.filter((e) => e.kota.toLowerCase() === kLower);
  }, [votersAfterProvinsi, selectedKota]);

  // Opsi Kecamatan dinamis (disaring oleh Provinsi & Kota/Kab)
  const kecamatanOptions = useMemo(() => {
    const set = new Set<string>();
    votersAfterKota.forEach((e) => {
      if (e.kecamatan && e.kecamatan !== 'Belum Diisi') set.add(e.kecamatan);
    });
    if (lockedKecamatan && set.size === 0) set.add(lockedKecamatan);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id-ID'));
  }, [votersAfterKota, lockedKecamatan]);

  useEffect(() => {
    if (isKorcam && lockedKecamatan) {
      const matched = kecamatanOptions.find(
        (k) => k.toLowerCase() === lockedKecamatan.toLowerCase()
      );
      setSelectedKecamatan(matched || lockedKecamatan);
    }
  }, [isKorcam, lockedKecamatan, kecamatanOptions]);

  // Voters setelah filter Kecamatan
  const votersAfterKecamatan = useMemo(() => {
    if (!selectedKecamatan) return votersAfterKota;
    const kecLower = selectedKecamatan.toLowerCase();
    return votersAfterKota.filter((e) => e.kecamatan.toLowerCase() === kecLower);
  }, [votersAfterKota, selectedKecamatan]);

  // Opsi Kelurahan / Desa dinamis (disaring oleh Provinsi, Kota/Kab, Kecamatan)
  const kelurahanOptions = useMemo(() => {
    const set = new Set<string>();
    votersAfterKecamatan.forEach((e) => {
      if (e.kelurahan && e.kelurahan !== 'Belum Diisi') set.add(e.kelurahan);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id-ID'));
  }, [votersAfterKecamatan]);

  // Voters final setelah seluruh Cascading Filter + Pencarian
  const filteredVoters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return votersAfterKecamatan
      .filter((e) => {
        if (selectedKelurahan && e.kelurahan.toLowerCase() !== selectedKelurahan.toLowerCase()) {
          return false;
        }
        if (q) {
          const v = e.voter;
          const hay = `${v.nama} ${v.nik} ${v.alamat} ${e.kelurahan} ${e.kecamatan} ${e.kota} ${e.provinsi} ${v.diinputOlehNama || ''} ${v.terdaftarOleh || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((e) => e.voter);
  }, [votersAfterKecamatan, selectedKelurahan, searchQuery]);

  // 3. Rekapitulasi Daftar Kecamatan Dinamis (HANYA Kecamatan yang benar-benar ada >= 1 voter!)
  const dynamicKecamatanRecap = useMemo<KecamatanRecapItem[]>(() => {
    const byKec = new Map<
      string,
      {
        kecamatan: string;
        kota: string;
        provinsi: string;
        totalVoters: number;
        kelMap: Map<string, number>;
      }
    >();

    // Gunakan basis votersAfterKota agar user tetap bisa melihat & mengklik kecamatan yang ada di kota/provinsi aktif
    votersAfterKota.forEach((e) => {
      if (!e.kecamatan || e.kecamatan === 'Belum Diisi') return;
      const key = `${e.kota.toLowerCase()}|${e.kecamatan.toLowerCase()}`;
      const existing = byKec.get(key);
      if (existing) {
        existing.totalVoters += 1;
        existing.kelMap.set(e.kelurahan, (existing.kelMap.get(e.kelurahan) || 0) + 1);
      } else {
        const kelMap = new Map<string, number>();
        kelMap.set(e.kelurahan, 1);
        byKec.set(key, {
          kecamatan: e.kecamatan,
          kota: e.kota,
          provinsi: e.provinsi,
          totalVoters: 1,
          kelMap,
        });
      }
    });

    return Array.from(byKec.values())
      .filter((item) => item.totalVoters > 0)
      .map((item) => ({
        kecamatan: item.kecamatan,
        kota: item.kota,
        provinsi: item.provinsi,
        totalVoters: item.totalVoters,
        kelurahanCounts: Array.from(item.kelMap.entries())
          .map(([kelurahan, count]) => ({ kelurahan, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.totalVoters - a.totalVoters);
  }, [votersAfterKota]);

  // Statistik Ringkas Wilayah Dinamis
  const summaryStats = useMemo(() => {
    const provSet = new Set<string>();
    const kotaSet = new Set<string>();
    const kecSet = new Set<string>();
    const kelSet = new Set<string>();

    filteredVoters.forEach((v) => {
      const p = resolveVoterProvinsi(v);
      if (p && p !== 'Lainnya / Belum Diisi') provSet.add(p.toLowerCase());
      if (v.kabupatenKota) kotaSet.add(v.kabupatenKota.trim().toLowerCase());
      if (v.kecamatan) kecSet.add(v.kecamatan.trim().toLowerCase());
      if (v.kelurahan) kelSet.add(v.kelurahan.trim().toLowerCase());
    });

    return {
      totalVoters: filteredVoters.length,
      totalProvinsi: provSet.size,
      totalKota: kotaSet.size,
      totalKecamatan: kecSet.size,
      totalKelurahan: kelSet.size,
    };
  }, [filteredVoters]);

  const handleProvinsiChange = (nextProv: string) => {
    setSelectedProvinsi(nextProv);
    setSelectedKota('');
    setSelectedKecamatan('');
    setSelectedKelurahan('');
    setFocusedVoter(null);
  };

  const handleKotaChange = (nextKota: string) => {
    setSelectedKota(nextKota);
    setSelectedKecamatan('');
    setSelectedKelurahan('');
    setFocusedVoter(null);
  };

  const handleKecamatanChange = (nextKec: string) => {
    setSelectedKecamatan(nextKec);
    setSelectedKelurahan('');
    setFocusedVoter(null);
  };

  const handleResetFilters = () => {
    if (!lockedProvinsi) setSelectedProvinsi('');
    if (!lockedKota) setSelectedKota('');
    if (!lockedKecamatan) setSelectedKecamatan('');
    setSelectedKelurahan('');
    setSearchQuery('');
    setFocusedVoter(null);
  };

  const scopeBadgeText = isFullAccess
    ? 'Akses Penuh Seluruh Indonesia'
    : isKorwil
    ? `Wilayah Korwil: ${currentUser?.kota || currentUser?.wilayah || 'Wilayah Binaan'}`
    : isKorcam
    ? `Wilayah Korcam: ${[currentUser?.kecamatan, currentUser?.kota].filter(Boolean).join(', ') || currentUser?.wilayah || 'Wilayah Binaan'}`
    : isRelawan
    ? `Data Konstituen Inputan Anda (${currentUser?.nama || 'Relawan'})`
    : 'Data Konstituen Lapangan';

  return (
    <div className="space-y-5">
      {/* Header Light Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
            <MapIcon className="w-3.5 h-3.5" />
            <span>{scopeBadgeText}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Peta Suara Konstituen (Voters)
          </h2>
          <p className="text-xs text-slate-600">
            Sebaran real-time Konstituen / Voters murni hasil inputan lapangan, dikelompokkan
            dinamis berdasarkan Provinsi, Kota/Kabupaten, Kecamatan, dan Kelurahan/Desa.
          </p>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('registrasi')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Input Konstituen Baru</span>
          </button>
        )}
      </div>

      {/* KPI Cards Dinamis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-xs font-bold">Total Konstituen</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {summaryStats.totalVoters.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-blue-700 font-medium mt-0.5">
            Dari {scopedVoters.length.toLocaleString('id-ID')} total cakupan Anda
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold">Provinsi &amp; Kota/Kab</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {summaryStats.totalProvinsi}{' '}
            <span className="text-sm font-bold text-slate-400">/ {summaryStats.totalKota}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Provinsi / Kota-Kabupaten terdata</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold">Kecamatan Aktif</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {summaryStats.totalKecamatan}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kecamatan dengan suara masuk</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold">Kelurahan / Desa</span>
            <MapPin className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {summaryStats.totalKelurahan}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Titik kelurahan terpetakan</p>
        </div>
      </div>

      {/* Filter Berjenjang (Cascading Filter): Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan/Desa */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Wilayah Administratif Berjenjang</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Provinsi */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <span>1. Provinsi</span>
              {Boolean(lockedProvinsi) && <Lock className="w-3 h-3 text-slate-400" />}
            </label>
            <select
              value={selectedProvinsi}
              disabled={Boolean(lockedProvinsi)}
              onChange={(e) => handleProvinsiChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-600"
            >
              {!lockedProvinsi && <option value="">Semua Provinsi ({provinsiOptions.length})</option>}
              {provinsiOptions.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Kota / Kabupaten */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <span>2. Kota / Kabupaten</span>
              {Boolean(lockedKota) && <Lock className="w-3 h-3 text-slate-400" />}
            </label>
            <select
              value={selectedKota}
              disabled={Boolean(lockedKota)}
              onChange={(e) => handleKotaChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-600"
            >
              {!lockedKota && <option value="">Semua Kota/Kab ({kotaOptions.length})</option>}
              {kotaOptions.map((kota) => (
                <option key={kota} value={kota}>
                  {kota}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Kecamatan */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <span>3. Kecamatan</span>
              {Boolean(lockedKecamatan) && <Lock className="w-3 h-3 text-slate-400" />}
            </label>
            <select
              value={selectedKecamatan}
              disabled={Boolean(lockedKecamatan)}
              onChange={(e) => handleKecamatanChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-600"
            >
              {!lockedKecamatan && (
                <option value="">Semua Kecamatan ({kecamatanOptions.length})</option>
              )}
              {kecamatanOptions.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Kelurahan / Desa */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              4. Kelurahan / Desa
            </label>
            <select
              value={selectedKelurahan}
              onChange={(e) => {
                setSelectedKelurahan(e.target.value);
                setFocusedVoter(null);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">Semua Kelurahan/Desa ({kelurahanOptions.length})</option>
              {kelurahanOptions.map((kel) => (
                <option key={kel} value={kel}>
                  {kel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Google Map Sebaran Suara */}
      <PetaSuaraGoogleMapsView
        voters={filteredVoters}
        selectedKecamatan={selectedKecamatan}
        selectedKelurahan={selectedKelurahan}
        focusVoter={focusedVoter}
      />

      {/* Rekapitulasi Daftar Kecamatan Dinamis (HANYA Kecamatan dengan >= 1 Voter) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Rekapitulasi Kecamatan Dinamis ({dynamicKecamatanRecap.length} Kecamatan)
            </h3>
            <p className="text-[11px] text-slate-500">
              Hanya menampilkan Kecamatan yang telah memiliki data Konstituen / Voters pada cakupan
              wilayah Anda. Klik Kecamatan untuk menyaring peta.
            </p>
          </div>
        </div>

        {dynamicKecamatanRecap.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Belum ada Kecamatan dengan data konstituen pada filter wilayah ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dynamicKecamatanRecap.map((item) => {
              const isSelected =
                selectedKecamatan.toLowerCase() === item.kecamatan.toLowerCase();
              return (
                <button
                  key={`${item.kota}-${item.kecamatan}`}
                  type="button"
                  onClick={() => {
                    if (isSelected && !lockedKecamatan) {
                      handleKecamatanChange('');
                    } else {
                      handleKecamatanChange(item.kecamatan);
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200/60'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">
                        Kec. {item.kecamatan}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.kota} · {item.provinsi}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-xs font-black tabular-nums shrink-0">
                      {item.totalVoters}
                    </span>
                  </div>

                  {/* Rincian Kelurahan di Kecamatan ini */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/70">
                    {item.kelurahanCounts.slice(0, 4).map((kel) => (
                      <span
                        key={kel.kelurahan}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700"
                      >
                        {kel.kelurahan}: <b className="text-blue-700">{kel.count}</b>
                      </span>
                    ))}
                    {item.kelurahanCounts.length > 4 && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                        +{item.kelurahanCounts.length - 4} kel.
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Daftar Konstituen / Voters Tersaring */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Daftar Konstituen / Voters ({filteredVoters.length.toLocaleString('id-ID')})
            </h3>
            <p className="text-[11px] text-slate-500">
              Klik baris konstituen untuk menyorot lokasi kelurahannya pada Peta Suara.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIK, alamat, penginput..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Nama Konstituen</th>
                <th className="py-3 px-4">Kelurahan / Kecamatan</th>
                <th className="py-3 px-4">Kota/Kab &amp; Provinsi</th>
                <th className="py-3 px-4">Nama Penginput &amp; Wilayah Input</th>
                <th className="py-3 px-4 text-right">Peta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center text-slate-500">
                    Belum ada data konstituen yang cocok dengan filter wilayah saat ini.
                  </td>
                </tr>
              ) : (
                filteredVoters.slice(0, 100).map((voter) => {
                  const prov = resolveVoterProvinsi(voter);
                  const isFocused = focusedVoter?.id === voter.id;
                  const wilayahInputText =
                    [voter.kabupatenKota, voter.kecamatan, voter.kelurahan]
                      .filter((p) => p && p !== '-')
                      .join(' / ') || '-';
                  return (
                    <tr
                      key={voter.id}
                      onClick={() => setFocusedVoter(voter)}
                      className={`cursor-pointer transition-colors ${
                        isFocused ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <p className="font-extrabold text-slate-900">{voter.nama}</p>
                        <p className="text-[11px] font-mono text-slate-500">{voter.nikMasked}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">
                          {voter.kelurahan || '-'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Kec. {voter.kecamatan || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">
                          {voter.kabupatenKota || '-'}
                        </p>
                        <p className="text-[11px] text-slate-500">{prov}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{voter.diinputOlehNama || voter.terdaftarOleh || '-'}</span>
                        </span>
                        <span className="block text-[10px] font-semibold text-cyan-800 mt-0.5">
                          {wilayahInputText}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                          <span>Sorot</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredVoters.length > 100 && (
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
            Menampilkan 100 konstituen pertama dari {filteredVoters.length.toLocaleString('id-ID')}.
            Gunakan filter wilayah atau pencarian untuk mempersempit hasil.
          </div>
        )}
      </div>
    </div>
  );
};

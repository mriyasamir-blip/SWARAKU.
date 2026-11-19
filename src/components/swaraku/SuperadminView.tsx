import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarPlus,
  Gift,
  Building2,
  Users,
  Activity,
  Trash2,
  CheckCircle2,
  Search,
  MapPin,
  Shield,
  KeyRound,
} from 'lucide-react';
import type {
  ActivityLogDoc,
  AspirationDoc,
  CalegInfoDoc,
  CampaignEventDoc,
  RewardClaimDoc,
  RewardDoc,
  SuperadminSection,
  VoterDoc,
} from '../../types/swaraku';
import type { VoterOcrRecord } from '../../types/vore';
import {
  subscribeAllVoters,
  subscribeActivityLogs,
  subscribeAllClaims,
  subscribeAllAspirations,
  createEventAdmin,
  deleteEventAdmin,
  createRewardAdmin,
  deleteRewardAdmin,
  createCalegInfoAdmin,
  deleteCalegInfoAdmin,
  markClaimDiserahkanAdmin,
} from '../../services/swarakuFirestore';
import { subscribeToCloudVoters } from '../../services/cloudSyncService';
import { AdminMapPicker } from '../maps/AdminMapPicker';

interface SuperadminViewProps {
  events: CampaignEventDoc[];
  rewards: RewardDoc[];
  calegInfoList: CalegInfoDoc[];
  onNotify: (msg: string) => void;
  hasGoogleSuperAdmin?: boolean;
  onConnectGoogleAdmin?: () => Promise<void>;
}

export const SuperadminView: React.FC<SuperadminViewProps> = ({
  events,
  rewards,
  calegInfoList,
  onNotify,
  hasGoogleSuperAdmin = true,
  onConnectGoogleAdmin,
}) => {
  const [section, setSection] = useState<SuperadminSection>('acara');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Real-time Superadmin collections
  const [votersList, setVotersList] = useState<VoterDoc[]>([]);
  const [ocrVotersList, setOcrVotersList] = useState<VoterOcrRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogDoc[]>([]);
  const [allClaims, setAllClaims] = useState<RewardClaimDoc[]>([]);
  const [allAspirations, setAllAspirations] = useState<AspirationDoc[]>([]);
  const [voterSearch, setVoterSearch] = useState('');

  useEffect(() => {
    const unsubOcrVoters = subscribeToCloudVoters(setOcrVotersList);

    if (!hasGoogleSuperAdmin) {
      setVotersList([]);
      setActivityLogs([]);
      setAllClaims([]);
      setAllAspirations([]);
      return () => {
        unsubOcrVoters();
      };
    }

    const unsubVoters = subscribeAllVoters(setVotersList, (err) =>
      onNotify(`Gagal memuat data voters: ${err.message}`)
    );
    const unsubLogs = subscribeActivityLogs(setActivityLogs, (err) =>
      onNotify(`Gagal memuat activity logs: ${err.message}`)
    );
    const unsubClaims = subscribeAllClaims(setAllClaims, (err) =>
      onNotify(`Gagal memuat riwayat klaim: ${err.message}`)
    );
    const unsubAsp = subscribeAllAspirations(setAllAspirations, (err) =>
      onNotify(`Gagal memuat aspirasi masuk: ${err.message}`)
    );

    return () => {
      unsubVoters();
      unsubOcrVoters();
      unsubLogs();
      unsubClaims();
      unsubAsp();
    };
  }, [onNotify, hasGoogleSuperAdmin]);

  // Event Form State
  const [evTitle, setEvTitle] = useState('');
  const [evParty, setEvParty] = useState('');
  const [evRegion, setEvRegion] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evPoints, setEvPoints] = useState('25');
  const [evAddress, setEvAddress] = useState('');
  const [evLat, setEvLat] = useState(-6.2088);
  const [evLng, setEvLng] = useState(106.8456);
  const [savingEvent, setSavingEvent] = useState(false);

  // Reward Form State
  const [rwName, setRwName] = useState('');
  const [rwCost, setRwCost] = useState('100');
  const [rwStock, setRwStock] = useState('10');
  const [rwDesc, setRwDesc] = useState('');
  const [savingReward, setSavingReward] = useState(false);

  // Caleg Form State
  const [clName, setClName] = useState('');
  const [clParty, setClParty] = useState('');
  const [clRegion, setClRegion] = useState('');
  const [clDesc, setClDesc] = useState('');
  const [savingCaleg, setSavingCaleg] = useState(false);

  const requireGoogleSuperAdmin = (): boolean => {
    if (hasGoogleSuperAdmin) return true;
    onNotify(
      'Silakan klik tombol "Verifikasi Google Superadmin" di bagian atas panel terlebih dahulu untuk menyimpan atau mengubah data di Cloud Firestore.'
    );
    return false;
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireGoogleSuperAdmin()) return;
    setSavingEvent(true);
    try {
      await createEventAdmin({
        title: evTitle,
        partyName: evParty,
        region: evRegion,
        eventDate: evDate,
        pointReward: Number(evPoints) || 0,
        address: evAddress,
        lat: evLat,
        lng: evLng,
      });
      setEvTitle('');
      setEvParty('');
      setEvRegion('');
      setEvDate('');
      setEvAddress('');
      onNotify('Jadwal acara kampanye berhasil ditambahkan.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menambah acara.');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireGoogleSuperAdmin()) return;
    setSavingReward(true);
    try {
      await createRewardAdmin({
        itemName: rwName,
        pointCost: Number(rwCost) || 1,
        stock: Number(rwStock) || 0,
        description: rwDesc,
      });
      setRwName('');
      setRwDesc('');
      onNotify('Item reward berhasil ditambahkan ke katalog.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menambah reward.');
    } finally {
      setSavingReward(false);
    }
  };

  const handleAddCaleg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireGoogleSuperAdmin()) return;
    setSavingCaleg(true);
    try {
      await createCalegInfoAdmin({
        calegName: clName,
        partyName: clParty,
        region: clRegion,
        description: clDesc,
      });
      setClName('');
      setClParty('');
      setClRegion('');
      setClDesc('');
      onNotify('Informasi Partai & Caleg berhasil disimpan.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menyimpan info Caleg.');
    } finally {
      setSavingCaleg(false);
    }
  };

  const filteredVoters = useMemo(() => {
    const q = voterSearch.trim().toLowerCase();
    if (!q) return votersList;
    return votersList.filter(
      (v) =>
        v.fullName.toLowerCase().includes(q) ||
        v.region.toLowerCase().includes(q) ||
        v.phone.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
    );
  }, [votersList, voterSearch]);

  const filteredOcrVoters = useMemo(() => {
    const q = voterSearch.trim().toLowerCase();
    if (!q) return ocrVotersList;
    return ocrVotersList.filter(
      (v) =>
        v.nama.toLowerCase().includes(q) ||
        v.nik.toLowerCase().includes(q) ||
        v.tps.toLowerCase().includes(q) ||
        v.kelurahan.toLowerCase().includes(q) ||
        v.kecamatan.toLowerCase().includes(q) ||
        v.kabupatenKota.toLowerCase().includes(q)
    );
  }, [ocrVotersList, voterSearch]);

  const pendingClaimsCount = allClaims.filter((c) => c.status === 'MENUNGGU').length;

  const subTabs: { id: SuperadminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'acara', label: 'Acara & Peta', icon: <CalendarPlus className="w-4 h-4" /> },
    { id: 'reward', label: 'Reward & Klaim', icon: <Gift className="w-4 h-4" /> },
    { id: 'caleg', label: 'Info Caleg', icon: <Building2 className="w-4 h-4" /> },
    { id: 'voters', label: 'Data Voters', icon: <Users className="w-4 h-4" /> },
    { id: 'aktivitas', label: 'Log & Aspirasi', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Real-time Summary Metrics */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Panel Manajemen Superadmin
            </h2>
            <p className="text-sm text-slate-600">
              Kelola jadwal acara kampanye, katalog reward, info partai &amp; Caleg, data pemilih, dan laporan aktivitas real-time.
            </p>
          </div>
          {hasGoogleSuperAdmin && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sesi Google Superadmin Terverifikasi</span>
            </span>
          )}
        </div>

        {!hasGoogleSuperAdmin && onConnectGoogleAdmin && (
          <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-indigo-950">
                  Verifikasi Google Superadmin untuk Akses Penuh Data Sensitif &amp; Penulisan Firestore
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Anda login melalui akun Super Admin (Username &amp; Password). Hubungkan akun Google Superadmin terdaftar untuk membuka data Voters Google SSO, Riwayat Klaim, Activity Log, serta menyimpan perubahan Acara/Reward/Caleg.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isConnectingGoogle}
              onClick={async () => {
                setIsConnectingGoogle(true);
                try {
                  await onConnectGoogleAdmin();
                } finally {
                  setIsConnectingGoogle(false);
                }
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {isConnectingGoogle ? 'Menghubungkan...' : 'Verifikasi Google Superadmin'}
              </span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Voters Terdaftar</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
              {votersList.length + ocrVotersList.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Jadwal Acara</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
              {events.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Klaim Menunggu</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-amber-700 mt-1">
              {pendingClaimsCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Aspirasi Masuk</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-blue-700 mt-1">
              {allAspirations.length}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSection(tab.id)}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              section === tab.id
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SECTION 1: ACARA & PETA */}
      {section === 'acara' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddEvent}
            className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xs"
          >
            <h3 className="text-base font-extrabold text-slate-900">
              Tambah Jadwal Kalender Acara
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Acara *</label>
                <input
                  type="text"
                  required
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="Contoh: Dialog Warga & Bakti Sosial"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Partai / Penyelenggara *</label>
                <input
                  type="text"
                  required
                  value={evParty}
                  onChange={(e) => setEvParty(e.target.value)}
                  placeholder="Nama Partai / Tim"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Daerah / Dapil *</label>
                <input
                  type="text"
                  required
                  value={evRegion}
                  onChange={(e) => setEvRegion(e.target.value)}
                  placeholder="Contoh: Kec. Cilandak"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tanggal &amp; Jam *</label>
                <input
                  type="text"
                  required
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                  placeholder="Contoh: 24 Nov 2026, 09.00 WIB"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Poin Kehadiran *</label>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  required
                  value={evPoints}
                  onChange={(e) => setEvPoints(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Alamat Lengkap Lokasi *</label>
                <input
                  type="text"
                  required
                  value={evAddress}
                  onChange={(e) => setEvAddress(e.target.value)}
                  placeholder="Jalan, nomor gedung, kelurahan, kota"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Pilih Titik Lokasi di Google Maps (Klik pada peta)</span>
              </label>
              <AdminMapPicker
                lat={evLat}
                lng={evLng}
                onChange={({ lat, lng }) => {
                  setEvLat(lat);
                  setEvLng(lng);
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={evLat}
                    onChange={(e) => setEvLat(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={evLng}
                    onChange={(e) => setEvLng(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingEvent}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm cursor-pointer"
            >
              {savingEvent ? 'Menyimpan Acara...' : 'Publikasikan Acara'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Daftar Acara Aktif ({events.length})
            </h3>
            {events.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
                Belum ada acara yang dipublikasikan.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-blue-700">
                        {ev.partyName} &middot; {ev.region}
                      </p>
                      <h4 className="text-sm font-extrabold text-slate-900">{ev.title}</h4>
                      <p className="text-xs text-slate-600">{ev.eventDate}</p>
                      <p className="text-xs text-slate-500 truncate">{ev.address}</p>
                      <p className="text-xs font-mono tabular-nums text-emerald-700 font-semibold pt-1">
                        Hadir: {(ev.rsvpYes || []).length} &middot; Tidak Hadir: {(ev.rsvpNo || []).length} &middot; +{ev.pointReward} Poin
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireGoogleSuperAdmin()) return;
                        deleteEventAdmin(ev.id)
                          .then(() => onNotify('Acara dihapus.'))
                          .catch((err) => onNotify(err.message));
                      }}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                      title="Hapus Acara"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: REWARD & KLAIM */}
      {section === 'reward' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAddReward}
              className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xs"
            >
              <h3 className="text-base font-extrabold text-slate-900">
                Tambah Barang Katalog Reward
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Barang / Reward *</label>
                  <input
                    type="text"
                    required
                    value={rwName}
                    onChange={(e) => setRwName(e.target.value)}
                    placeholder="Contoh: Paket Sembako / Kaos Resmi"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Biaya Poin *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={rwCost}
                      onChange={(e) => setRwCost(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Stok Awal *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={rwStock}
                      onChange={(e) => setRwStock(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={rwDesc}
                    onChange={(e) => setRwDesc(e.target.value)}
                    placeholder="Keterangan singkat cara pengambilan atau isi reward"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingReward}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm cursor-pointer"
              >
                {savingReward ? 'Menyimpan...' : 'Simpan ke Katalog'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar Katalog Reward ({rewards.length})
              </h3>
              {rewards.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
                  Belum ada item di katalog reward.
                </div>
              ) : (
                <div className="space-y-3">
                  {rewards.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{item.itemName}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                        <p className="text-xs font-mono tabular-nums text-blue-700 font-bold mt-1">
                          {item.pointCost} Poin &middot; Stok: {item.stock}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!requireGoogleSuperAdmin()) return;
                          deleteRewardAdmin(item.id)
                            .then(() => onNotify('Reward dihapus.'))
                            .catch((err) => onNotify(err.message));
                        }}
                        className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                        title="Hapus Reward"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Klaim Reward */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Riwayat Penukaran Poin / Klaim Reward ({allClaims.length})
              </h3>
            </div>
            {allClaims.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada permintaan penukaran reward.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Pemilih</th>
                      <th className="px-4 py-3">No. WA</th>
                      <th className="px-4 py-3">Reward</th>
                      <th className="px-4 py-3">Poin</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-900">{claim.voterName}</td>
                        <td className="px-4 py-3 font-mono">{claim.phone}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{claim.itemName}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{claim.pointUsed}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold ${
                              claim.status === 'DISERAHKAN'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {claim.status === 'MENUNGGU' ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!requireGoogleSuperAdmin()) return;
                                markClaimDiserahkanAdmin(claim.id)
                                  .then(() => onNotify('Status klaim diperbarui ke DISERAHKAN.'))
                                  .catch((err) => onNotify(err.message));
                              }}
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                            >
                              Tandai Diserahkan
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: INFO PARTAI & CALEG */}
      {section === 'caleg' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddCaleg}
            className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xs"
          >
            <h3 className="text-base font-extrabold text-slate-900">
              Tambah Informasi Partai &amp; Caleg Daerah
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Caleg *</label>
                <input
                  type="text"
                  required
                  value={clName}
                  onChange={(e) => setClName(e.target.value)}
                  placeholder="Nama lengkap beserta gelar"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Partai Politik *</label>
                <input
                  type="text"
                  required
                  value={clParty}
                  onChange={(e) => setClParty(e.target.value)}
                  placeholder="Nama Partai Pengusung"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Daerah / Dapil *</label>
                <input
                  type="text"
                  required
                  value={clRegion}
                  onChange={(e) => setClRegion(e.target.value)}
                  placeholder="Samakan dengan Dapil Voters agar otomatis tampil"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Profil, Visi &amp; Program Kerja *</label>
                <textarea
                  rows={4}
                  required
                  value={clDesc}
                  onChange={(e) => setClDesc(e.target.value)}
                  placeholder="Tuliskan visi, misi, dan program unggulan Caleg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingCaleg}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm cursor-pointer"
            >
              {savingCaleg ? 'Menyimpan...' : 'Publikasikan Info Caleg'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Informasi Caleg Terdaftar ({calegInfoList.length})
            </h3>
            {calegInfoList.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
                Belum ada informasi Caleg yang ditambahkan.
              </div>
            ) : (
              <div className="space-y-3">
                {calegInfoList.map((info) => (
                  <div
                    key={info.id}
                    className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900">{info.calegName}</h4>
                      <p className="text-xs font-bold text-blue-700">
                        {info.partyName} &middot; {info.region}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {info.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireGoogleSuperAdmin()) return;
                        deleteCalegInfoAdmin(info.id)
                          .then(() => onNotify('Info Caleg dihapus.'))
                          .catch((err) => onNotify(err.message));
                      }}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                      title="Hapus Info"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: DATA VOTERS */}
      {section === 'voters' && (
        <div className="space-y-6">
          {/* Tabel Voters e-KTP / Lapangan (OCR) */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Data Pemilih Terdaftar &amp; Peta Suara ({filteredOcrVoters.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Mencakup pemilih Daftar Online, Google SSO, dan pendataan e-KTP yang tampil otomatis di Peta Suara.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={voterSearch}
                  onChange={(e) => setVoterSearch(e.target.value)}
                  placeholder="Cari nama, NIK, wilayah, TPS, atau WA..."
                  className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            {filteredOcrVoters.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada data pemilih e-KTP terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Nama Pemilih</th>
                      <th className="px-4 py-3">NIK</th>
                      <th className="px-4 py-3">Wilayah &amp; TPS</th>
                      <th className="px-4 py-3">No. Telepon</th>
                      <th className="px-4 py-3">Diinput Oleh</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOcrVoters.map((v) => (
                      <tr key={v.nik || v.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {v.fotoKtpUrl && (
                              <img
                                src={v.fotoKtpUrl}
                                alt={`KTP ${v.nama}`}
                                className="w-10 h-7 rounded object-cover border border-slate-200 shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{v.nama}</p>
                              <p className="text-[11px] text-slate-500">{v.tempatTglLahir}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                          {v.nikMasked || v.nik}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-blue-700">
                            {v.tps} &middot; {v.kelurahan}, {v.kecamatan}
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs truncate">
                            {v.alamat} ({v.kabupatenKota})
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono">{v.noHp || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{v.terdaftarOleh || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            {v.statusDpt || 'DPT valid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tabel Voters Loyalty (Google SSO) */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar Pemilih Loyalty Google SSO ({filteredVoters.length})
              </h3>
            </div>

            {filteredVoters.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada pemilih Loyalty Google SSO terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Nama Lengkap</th>
                      <th className="px-4 py-3">Daerah / Alamat</th>
                      <th className="px-4 py-3">No. Telepon</th>
                      <th className="px-4 py-3">Kode Referral</th>
                      <th className="px-4 py-3 text-right">Kantong Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVoters.map((v) => (
                      <tr key={v.uid} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{v.fullName}</p>
                          <p className="text-[11px] text-slate-500">{v.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-blue-700">{v.region}</p>
                          <p className="text-[11px] text-slate-500 max-w-xs truncate">{v.address}</p>
                        </td>
                        <td className="px-4 py-3 font-mono">{v.phone}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{v.referralCode}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-extrabold text-emerald-700">
                          {v.points.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: BOOK ACTIVITY LOGIN & ASPIRASI */}
      {section === 'aktivitas' && (
        <div className="space-y-6">
          {/* Book Activity Login */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Book Activity Login ({activityLogs.length})
              </h3>
            </div>
            {activityLogs.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada catatan aktivitas login.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Pengguna</th>
                      <th className="px-4 py-3">Aktivitas</th>
                      <th className="px-4 py-3">Perangkat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {log.timestamp?.toDate
                            ? log.timestamp.toDate().toLocaleString('id-ID')
                            : 'Baru saja'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{log.fullName}</p>
                          <p className="text-[11px] text-slate-500">{log.email}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-700">{log.activityType}</td>
                        <td className="px-4 py-3 text-slate-600">{log.deviceInfo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daftar Aspirasi Masuk */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar Aspirasi Masuk ({allAspirations.length})
              </h3>
            </div>
            {allAspirations.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada aspirasi yang masuk dari pemilih.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allAspirations.map((asp) => (
                  <div key={asp.id} className="p-4 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-extrabold text-slate-900">
                        {asp.voterName}{' '}
                        <span className="font-semibold text-blue-700">&middot; {asp.region}</span>
                      </span>
                      <span className="text-slate-500 font-mono tabular-nums">
                        {asp.createdAt?.toDate
                          ? asp.createdAt.toDate().toLocaleString('id-ID')
                          : 'Baru saja'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {asp.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

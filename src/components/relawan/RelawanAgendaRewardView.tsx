import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  Gift,
  History,
  MapPin,
  Navigation,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Ticket,
  X,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type {
  CampaignEventDoc,
  EventStatus,
  RewardClaimDoc,
  RewardClaimStatus,
  RewardDoc,
} from '../../types/swaraku';
import type { UserAccount } from '../../types/vore';
import {
  redeemRelawanRewardAtomic,
  subscribeMyClaims,
} from '../../services/swarakuFirestore';
import { EventLocationMap } from '../maps/EventLocationMap';
import { formatWilayahLabel } from '../../data/wilayahIndonesia';

type AgendaRewardTab = 'agenda' | 'reward';

interface RelawanAgendaRewardViewProps {
  currentUser: UserAccount;
  currentPoints: number;
  events: CampaignEventDoc[];
  rewards: RewardDoc[];
  onPointsUpdated: (newPoints: number) => void;
  onNavigateToRegistrasi: () => void;
  onNotify: (msg: string) => void;
  initialSubTab?: AgendaRewardTab;
}

export function renderRewardIcon(iconKey?: string, className = 'w-6 h-6') {
  switch (iconKey) {
    case 'shirt':
      return <Shirt className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'ticket':
      return <Ticket className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'shopping':
      return <ShoppingBag className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'gift':
    default:
      return <Gift className={className} />;
  }
}

export function getClaimStatusMeta(status: RewardClaimStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'MENUNGGU':
      return {
        label: 'Menunggu Konfirmasi',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'DISETUJUI':
      return {
        label: 'Disetujui',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    case 'DITOLAK':
      return {
        label: 'Ditolak (Poin Dikembalikan)',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'SELESAI':
    case 'DISERAHKAN':
    default:
      return {
        label: 'Selesai',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
  }
}

export function getEventStatusMeta(status?: EventStatus): {
  label: EventStatus;
  badgeClass: string;
} {
  switch (status) {
    case 'Berlangsung':
      return {
        label: 'Berlangsung',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'Selesai':
      return {
        label: 'Selesai',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    case 'Akan Datang':
    default:
      return {
        label: 'Akan Datang',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      };
  }
}

export const RelawanAgendaRewardView: React.FC<RelawanAgendaRewardViewProps> = ({
  currentUser,
  currentPoints,
  events,
  rewards,
  onPointsUpdated,
  onNavigateToRegistrasi,
  onNotify,
  initialSubTab = 'agenda',
}) => {
  const [subTab, setSubTab] = useState<AgendaRewardTab>(initialSubTab);

  // Agenda Partai state
  const [agendaSearch, setAgendaSearch] = useState('');
  const [agendaStatusFilter, setAgendaStatusFilter] = useState<'Semua' | EventStatus>('Semua');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Katalog Reward & Claims state
  const [myClaims, setMyClaims] = useState<RewardClaimDoc[]>([]);
  const [confirmReward, setConfirmReward] = useState<RewardDoc | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccessBanner, setRedeemSuccessBanner] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser.id) return;
    const unsub = subscribeMyClaims(
      currentUser.id,
      (claims) => setMyClaims(claims),
      () => {}
    );
    return () => unsub();
  }, [currentUser.id]);

  const filteredEvents = useMemo(() => {
    const q = agendaSearch.trim().toLowerCase();
    return events.filter((ev) => {
      const evStatus: EventStatus = ev.eventStatus || 'Akan Datang';
      if (agendaStatusFilter !== 'Semua' && evStatus !== agendaStatusFilter) return false;
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.partyName.toLowerCase().includes(q) ||
        ev.region.toLowerCase().includes(q) ||
        (ev.kota || '').toLowerCase().includes(q) ||
        (ev.kecamatan || '').toLowerCase().includes(q) ||
        (ev.kelurahan || '').toLowerCase().includes(q) ||
        ev.address.toLowerCase().includes(q) ||
        (ev.description || '').toLowerCase().includes(q)
      );
    });
  }, [events, agendaSearch, agendaStatusFilter]);

  const pendingMyClaimsCount = useMemo(
    () => myClaims.filter((c) => c.status === 'MENUNGGU' || c.status === 'DISETUJUI').length,
    [myClaims]
  );

  const handleConfirmRedeem = async () => {
    if (!confirmReward) return;
    setIsRedeeming(true);
    setRedeemError(null);
    try {
      const { newPoints } = await redeemRelawanRewardAtomic(
        {
          id: currentUser.id,
          nama: currentUser.nama,
          noHp: currentUser.noHp,
          wilayah: currentUser.wilayah,
          kota: currentUser.kota,
          kecamatan: currentUser.kecamatan,
          kelurahan: currentUser.kelurahan,
          points: currentPoints,
        },
        confirmReward
      );
      onPointsUpdated(newPoints);
      const msg = `Klaim "${confirmReward.itemName}" (${confirmReward.pointCost.toLocaleString('id-ID')} Poin) berhasil dikirim! Menunggu konfirmasi dari Koordinator/Admin.`;
      setRedeemSuccessBanner(msg);
      onNotify(msg);
      setConfirmReward(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menukarkan poin.';
      setRedeemError(message);
      onNotify(message);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Top Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Agenda &amp; Reward</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pantau jadwal kegiatan Agenda Partai secara real-time dan tukarkan Poin Relawan Anda dengan hadiah menarik di Katalog Reward.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 shrink-0 self-start sm:self-auto">
            <Award className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
                Poin Aktif Anda
              </p>
              <p className="text-lg font-black font-mono tabular-nums text-amber-950 leading-tight">
                {currentPoints.toLocaleString('id-ID')} Poin
              </p>
            </div>
          </div>
        </div>

        {/* 2 Prominent Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSubTab('agenda')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'agenda'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Agenda Partai</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ${
                subTab === 'agenda' ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}
            >
              {events.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('reward')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'reward'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>Katalog Reward</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-lg ${
                subTab === 'reward' ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}
            >
              {rewards.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* TAB 1: AGENDA PARTAI (REAL-TIME SYNC FROM PANEL KAMPANYE) */}
      {/* ======================================================= */}
      {subTab === 'agenda' && (
        <div className="space-y-4">
          {/* Search & Status Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(['Semua', 'Akan Datang', 'Berlangsung', 'Selesai'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAgendaStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    agendaStatusFilter === status
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={agendaSearch}
                onChange={(e) => setAgendaSearch(e.target.value)}
                placeholder="Cari agenda, Kelurahan, Kecamatan..."
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {events.length === 0
                  ? 'Belum Ada Agenda Partai Terjadwal'
                  : 'Tidak Ada Agenda Sesuai Filter'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {events.length === 0
                  ? 'Setiap acara yang ditambahkan oleh Korwil, Korcam, Admin, atau SuperAdmin melalui Panel Manajemen Kampanye akan otomatis muncul di halaman ini.'
                  : 'Coba ubah kata kunci pencarian atau pilih filter status acara lainnya.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvents.map((ev) => {
                const statusMeta = getEventStatusMeta(ev.eventStatus);
                const isExpanded = expandedEventId === ev.id;
                const wilayahText =
                  formatWilayahLabel({
                    kota: ev.kota || '',
                    kecamatan: ev.kecamatan || '',
                    kelurahan: ev.kelurahan || '',
                  }) || ev.region;
                const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`;

                return (
                  <article
                    key={ev.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 transition-all hover:border-blue-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold ${statusMeta.badgeClass}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{statusMeta.label}</span>
                          </span>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50/70 px-2.5 py-1 rounded-lg">
                            {ev.partyName}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                          {ev.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{ev.eventDate}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{wilayahText}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 flex items-start gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>{ev.address}</span>
                        </p>

                        {ev.description && (
                          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed whitespace-pre-line">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Tutup Peta' : 'Lihat Peta'}</span>
                        </button>

                        <a
                          href={routeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Rute Google Maps</span>
                        </a>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100">
                        <EventLocationMap
                          lat={ev.lat}
                          lng={ev.lng}
                          title={ev.title}
                          address={ev.address}
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 2: KATALOG REWARD & RIWAYAT KLAIM RELAWAN           */}
      {/* ======================================================= */}
      {subTab === 'reward' && (
        <div className="space-y-6">
          {/* Saldo Poin Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Saldo Poin Aktif Relawan
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-white">
                  {currentPoints.toLocaleString('id-ID')}
                </span>
                <span className="text-sm font-bold text-amber-300">Poin</span>
              </div>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Kumpulkan <strong>+10 Poin</strong> setiap kali mendaftarkan Konstituen (Voter) melalui Menu Registrasi, lalu tukarkan langsung dengan hadiah di bawah ini.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToRegistrasi}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Kumpulkan Poin (+10/Voter)</span>
            </button>
          </div>

          {redeemSuccessBanner && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-bold text-emerald-900 leading-relaxed">
                  {redeemSuccessBanner}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRedeemSuccessBanner(null)}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                aria-label="Tutup pesan sukses"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Katalog Hadiah */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-700" />
                <span>Katalog Hadiah Tersedia ({rewards.length})</span>
              </h3>
            </div>

            {rewards.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Katalog Reward Belum Tersedia
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hadiah yang disiapkan oleh Korwil, Korcam, Admin, atau SuperAdmin melalui Panel Manajemen Kampanye akan otomatis tampil di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map((item) => {
                  const isOutOfStock = item.stock <= 0;
                  const shortfall = Math.max(0, item.pointCost - currentPoints);
                  const canRedeem = !isOutOfStock && shortfall === 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between transition-all hover:border-blue-200"
                    >
                      <div>
                        {/* Visual Banner / Image */}
                        {item.imageUrl ? (
                          <div className="h-40 w-full bg-slate-100 relative overflow-hidden border-b border-slate-100">
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-900/85 text-white text-xs font-mono font-extrabold backdrop-blur-xs">
                              {item.pointCost.toLocaleString('id-ID')} Poin
                            </span>
                          </div>
                        ) : (
                          <div className="h-32 w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-amber-50 border-b border-slate-100 flex items-center justify-between px-5">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                              {renderRewardIcon(item.iconKey, 'w-7 h-7')}
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                Tukar Dengan
                              </span>
                              <span className="text-xl font-black font-mono tabular-nums text-blue-800">
                                {item.pointCost.toLocaleString('id-ID')} Poin
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                              {item.itemName}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isOutOfStock ? 'Stok Habis' : `Stok: ${item.stock}`}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed min-h-[32px]">
                            {item.description || 'Hadiah apresiasi resmi untuk Relawan Swaraku.'}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-1.5">
                        <button
                          type="button"
                          disabled={!canRedeem}
                          onClick={() => {
                            setRedeemError(null);
                            setConfirmReward(item);
                          }}
                          className={`w-full min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors ${
                            canRedeem
                              ? 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-4 h-4" />
                          <span>
                            {isOutOfStock
                              ? 'Stok Habis'
                              : shortfall > 0
                              ? 'Poin Belum Cukup'
                              : 'Tukar Poin'}
                          </span>
                        </button>

                        {!isOutOfStock && shortfall > 0 && (
                          <p className="text-[11px] font-semibold text-amber-700 text-center">
                            Kurang {shortfall.toLocaleString('id-ID')} Poin lagi untuk menukar hadiah ini
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Riwayat Klaim Relawan */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Riwayat Klaim Saya ({myClaims.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pantau status persetujuan dan penyerahan hadiah Anda secara real-time.
                  </p>
                </div>
              </div>
              {pendingMyClaimsCount > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  {pendingMyClaimsCount} Sedang Diproses
                </span>
              )}
            </div>

            {myClaims.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada riwayat penukaran poin. Pilih hadiah di Katalog Reward di atas untuk melakukan klaim pertama Anda.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myClaims.map((claim) => {
                  const statusMeta = getClaimStatusMeta(claim.status);
                  const dateLabel = claim.claimedAt?.toDate
                    ? claim.claimedAt.toDate().toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Baru saja';

                  return (
                    <div
                      key={claim.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {claim.itemName}
                          </h4>
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">
                            -{claim.pointUsed.toLocaleString('id-ID')} Poin
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Diajukan pada {dateLabel}
                          {claim.processedBy ? ` · Diproses oleh ${claim.processedBy}` : ''}
                        </p>
                        {claim.note && (
                          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1">
                            Catatan: {claim.note}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold ${statusMeta.badgeClass}`}
                        >
                          {claim.status === 'DITOLAK' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : claim.status === 'SELESAI' || claim.status === 'DISERAHKAN' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{statusMeta.label}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal Konfirmasi Penukaran Poin */}
      {confirmReward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Konfirmasi Penukaran Poin
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Yakin ingin menukarkan{' '}
                    <strong className="text-slate-900">
                      {confirmReward.pointCost.toLocaleString('id-ID')} Poin
                    </strong>{' '}
                    untuk <strong className="text-slate-900">{confirmReward.itemName}</strong>?
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isRedeeming}
                onClick={() => setConfirmReward(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Tutup konfirmasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Saldo Poin Saat Ini</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentPoints.toLocaleString('id-ID')} Poin
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Biaya Penukaran</span>
                <span className="font-mono font-bold text-rose-600">
                  -{confirmReward.pointCost.toLocaleString('id-ID')} Poin
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">Sisa Poin Setelah Tukar</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  {Math.max(0, currentPoints - confirmReward.pointCost).toLocaleString('id-ID')} Poin
                </span>
              </div>
            </div>

            {redeemError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-700 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{redeemError}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pengajuan klaim akan langsung masuk ke Panel Manajemen Kampanye. Jika klaim ditolak oleh Admin/Koordinator, poin Anda akan dikembalikan otomatis.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isRedeeming}
                onClick={() => setConfirmReward(null)}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRedeeming}
                onClick={handleConfirmRedeem}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-extrabold cursor-pointer"
              >
                {isRedeeming ? 'Memproses Klaim...' : 'Ya, Tukar Poin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

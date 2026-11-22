import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Pencil,
  X,
  Upload,
  XCircle,
  Clock,
  Globe,
  ThumbsUp,
} from 'lucide-react';
import type {
  ActivityLogDoc,
  AspirationDoc,
  CalegInfoDoc,
  CampaignEventDoc,
  EventStatus,
  RewardClaimDoc,
  RewardClaimStatus,
  RewardDoc,
  RewardIconKey,
  SuperadminSection,
  VoterDoc,
} from '../../types/swaraku';
import type { UserAccount, VoterOcrRecord } from '../../types/vore';
import {
  subscribeAllVoters,
  subscribeActivityLogs,
  subscribeAllClaims,
  subscribeAllAspirations,
  createEventAdmin,
  updateEventAdmin,
  updateEventStatusAdmin,
  deleteEventAdmin,
  createRewardAdmin,
  updateRewardAdmin,
  deleteRewardAdmin,
  createCalegInfoAdmin,
  deleteCalegInfoAdmin,
  processRewardClaimAdmin,
} from '../../services/swarakuFirestore';
import { subscribeToCloudVoters } from '../../services/cloudSyncService';
import { AdminMapPicker } from '../maps/AdminMapPicker';
import { WilayahSelector, type WilayahValue } from '../common/WilayahSelector';
import { formatWilayahLabel } from '../../data/wilayahIndonesia';
import { lookupSmartCoordinates } from '../../utils/geocoding';
import {
  getClaimStatusMeta,
  getEventStatusMeta,
  renderRewardIcon,
} from '../relawan/RelawanAgendaRewardView';

interface SuperadminViewProps {
  events: CampaignEventDoc[];
  rewards: RewardDoc[];
  calegInfoList: CalegInfoDoc[];
  onNotify: (msg: string) => void;
  hasGoogleSuperAdmin?: boolean;
  onConnectGoogleAdmin?: () => Promise<void>;
  panelTitle?: string;
  isSuperAdmin?: boolean;
  currentUser?: UserAccount;
}

const REWARD_ICON_OPTIONS: { key: RewardIconKey; label: string }[] = [
  { key: 'gift', label: 'Hadiah' },
  { key: 'package', label: 'Sembako' },
  { key: 'shirt', label: 'Kaos / Jaket' },
  { key: 'ticket', label: 'Voucher' },
  { key: 'shopping', label: 'Belanja' },
  { key: 'coffee', label: 'Tumbler' },
  { key: 'smartphone', label: 'Pulsa / HP' },
  { key: 'award', label: 'Penghargaan' },
];

async function compressRewardImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca gambar hadiah.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.onload = () => {
        const maxSide = 480;
        let { width, height } = img;
        if (width > height && width > maxSide) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else if (height > maxSide) {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas browser tidak tersedia.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function getRoleDisplayName(role?: UserAccount['role']): string {
  switch (role) {
    case 'super_admin':
      return 'SuperAdmin';
    case 'admin':
      return 'Admin';
    case 'tim_sukses':
      return 'Korwil';
    case 'kader':
      return 'Korcam';
    case 'relawan':
      return 'Relawan';
    default:
      return 'Tim Support';
  }
}

export const SuperadminView: React.FC<SuperadminViewProps> = ({
  events,
  rewards,
  calegInfoList,
  onNotify,
  hasGoogleSuperAdmin = false,
  onConnectGoogleAdmin,
  panelTitle = 'Panel Manajemen Kampanye',
  isSuperAdmin = false,
  currentUser,
}) => {
  const [section, setSection] = useState<SuperadminSection>('acara');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const isAdminOrSuper =
    isSuperAdmin || currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const operatorLabel = currentUser
    ? `${currentUser.nama} (${getRoleDisplayName(currentUser.role)})`
    : 'Tim Support';

  // Real-time Campaign Panel collections
  const [votersList, setVotersList] = useState<VoterDoc[]>([]);
  const [ocrVotersList, setOcrVotersList] = useState<VoterOcrRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogDoc[]>([]);
  const [allClaims, setAllClaims] = useState<RewardClaimDoc[]>([]);
  const [allAspirations, setAllAspirations] = useState<AspirationDoc[]>([]);
  const [voterSearch, setVoterSearch] = useState('');

  useEffect(() => {
    const unsubOcrVoters = subscribeToCloudVoters(setOcrVotersList);
    const unsubClaims = subscribeAllClaims(setAllClaims, () => {});
    const unsubAsp = subscribeAllAspirations(setAllAspirations, () => {});

    if (!hasGoogleSuperAdmin) {
      setVotersList([]);
      setActivityLogs([]);
      return () => {
        unsubOcrVoters();
        unsubClaims();
        unsubAsp();
      };
    }

    const unsubVoters = subscribeAllVoters(setVotersList, (err) =>
      onNotify(`Gagal memuat data voters: ${err.message}`)
    );
    const unsubLogs = subscribeActivityLogs(setActivityLogs, (err) =>
      onNotify(`Gagal memuat activity logs: ${err.message}`)
    );

    return () => {
      unsubVoters();
      unsubOcrVoters();
      unsubLogs();
      unsubClaims();
      unsubAsp();
    };
  }, [onNotify, hasGoogleSuperAdmin]);

  // Event Form State (Create + Edit)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [evTitle, setEvTitle] = useState('');
  const [evParty, setEvParty] = useState('');
  const [evWilayah, setEvWilayah] = useState<WilayahValue>({
    kota: currentUser?.kota || '',
    kecamatan: currentUser?.kecamatan || '',
    kelurahan: currentUser?.kelurahan || '',
  });
  const [evDate, setEvDate] = useState('');
  const [evStatus, setEvStatus] = useState<EventStatus>('Akan Datang');
  const [evPoints, setEvPoints] = useState('25');
  const [evAddress, setEvAddress] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evLat, setEvLat] = useState(-6.2088);
  const [evLng, setEvLng] = useState(106.8456);
  const [savingEvent, setSavingEvent] = useState(false);

  // Reward Form State (Create + Edit)
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rwName, setRwName] = useState('');
  const [rwCost, setRwCost] = useState('100');
  const [rwStock, setRwStock] = useState('10');
  const [rwDesc, setRwDesc] = useState('');
  const [rwIconKey, setRwIconKey] = useState<RewardIconKey>('gift');
  const [rwImageUrl, setRwImageUrl] = useState('');
  const [savingReward, setSavingReward] = useState(false);
  const rewardFileRef = useRef<HTMLInputElement | null>(null);

  // Claim Processing State
  const [claimFilter, setClaimFilter] = useState<
    'ALL' | 'MENUNGGU' | 'DISETUJUI' | 'SELESAI' | 'DITOLAK'
  >('ALL');
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);
  const [rejectTargetClaim, setRejectTargetClaim] = useState<RewardClaimDoc | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Caleg Form State
  const [clName, setClName] = useState('');
  const [clParty, setClParty] = useState('');
  const [clRegion, setClRegion] = useState('');
  const [clDesc, setClDesc] = useState('');
  const [savingCaleg, setSavingCaleg] = useState(false);

  // Auto-center event map coordinates when WilayahSelector changes
  const handleEventWilayahChange = (next: WilayahValue) => {
    setEvWilayah(next);
    const coords = lookupSmartCoordinates(next.kelurahan, next.kecamatan, next.kota);
    if (coords) {
      setEvLat(coords.lat);
      setEvLng(coords.lng);
    }
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEvTitle('');
    setEvParty('');
    setEvWilayah({
      kota: currentUser?.kota || '',
      kecamatan: currentUser?.kecamatan || '',
      kelurahan: currentUser?.kelurahan || '',
    });
    setEvDate('');
    setEvStatus('Akan Datang');
    setEvPoints('25');
    setEvAddress('');
    setEvDesc('');
  };

  const handleEditEventClick = (ev: CampaignEventDoc) => {
    setEditingEventId(ev.id);
    setEvTitle(ev.title);
    setEvParty(ev.partyName);
    setEvWilayah({
      kota: ev.kota || '',
      kecamatan: ev.kecamatan || '',
      kelurahan: ev.kelurahan || '',
    });
    setEvDate(ev.eventDate);
    setEvStatus(ev.eventStatus || 'Akan Datang');
    setEvPoints(String(ev.pointReward ?? 0));
    setEvAddress(ev.address);
    setEvDesc(ev.description || '');
    setEvLat(ev.lat);
    setEvLng(ev.lng);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const regionLabel =
      formatWilayahLabel(evWilayah) ||
      evWilayah.kelurahan ||
      evWilayah.kecamatan ||
      evWilayah.kota ||
      'Wilayah Kampanye';

    if (regionLabel.trim().length < 2) {
      onNotify('Silakan pilih lokasi Kota, Kecamatan, dan Kelurahan acara.');
      return;
    }

    setSavingEvent(true);
    try {
      if (editingEventId) {
        await updateEventAdmin(editingEventId, {
          title: evTitle,
          partyName: evParty,
          region: regionLabel,
          kota: evWilayah.kota,
          kecamatan: evWilayah.kecamatan,
          kelurahan: evWilayah.kelurahan,
          eventDate: evDate,
          description: evDesc,
          eventStatus: evStatus,
          pointReward: Number(evPoints) || 0,
          address: evAddress,
          lat: evLat,
          lng: evLng,
        });
        onNotify('Agenda acara berhasil diperbarui dan otomatis tersinkron ke akun Relawan.');
      } else {
        await createEventAdmin({
          title: evTitle,
          partyName: evParty,
          region: regionLabel,
          kota: evWilayah.kota,
          kecamatan: evWilayah.kecamatan,
          kelurahan: evWilayah.kelurahan,
          eventDate: evDate,
          description: evDesc,
          eventStatus: evStatus,
          pointReward: Number(evPoints) || 0,
          address: evAddress,
          lat: evLat,
          lng: evLng,
          createdByName: currentUser?.nama || 'Tim Support',
          createdByRole: getRoleDisplayName(currentUser?.role),
        });
        onNotify('Acara berhasil dipublikasikan dan otomatis tampil di Agenda Partai Relawan.');
      }
      resetEventForm();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menyimpan acara.');
    } finally {
      setSavingEvent(false);
    }
  };

  const resetRewardForm = () => {
    setEditingRewardId(null);
    setRwName('');
    setRwCost('100');
    setRwStock('10');
    setRwDesc('');
    setRwIconKey('gift');
    setRwImageUrl('');
    if (rewardFileRef.current) rewardFileRef.current.value = '';
  };

  const handleEditRewardClick = (item: RewardDoc) => {
    setEditingRewardId(item.id);
    setRwName(item.itemName);
    setRwCost(String(item.pointCost));
    setRwStock(String(item.stock));
    setRwDesc(item.description || '');
    setRwIconKey((item.iconKey as RewardIconKey) || 'gift');
    setRwImageUrl(item.imageUrl || '');
  };

  const handleRewardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressRewardImage(file);
      setRwImageUrl(dataUrl);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal memproses gambar hadiah.');
    }
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReward(true);
    try {
      if (editingRewardId) {
        await updateRewardAdmin(editingRewardId, {
          itemName: rwName,
          pointCost: Number(rwCost) || 1,
          stock: Number(rwStock) || 0,
          description: rwDesc,
          iconKey: rwIconKey,
          imageUrl: rwImageUrl,
        });
        onNotify('Item katalog reward berhasil diperbarui.');
      } else {
        await createRewardAdmin({
          itemName: rwName,
          pointCost: Number(rwCost) || 1,
          stock: Number(rwStock) || 0,
          description: rwDesc,
          iconKey: rwIconKey,
          imageUrl: rwImageUrl,
        });
        onNotify('Hadiah baru berhasil ditambahkan dan otomatis tampil di Katalog Reward Relawan.');
      }
      resetRewardForm();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menyimpan reward.');
    } finally {
      setSavingReward(false);
    }
  };

  const handleProcessClaim = async (
    claim: RewardClaimDoc,
    nextStatus: 'DISETUJUI' | 'DITOLAK' | 'SELESAI',
    note?: string
  ) => {
    setProcessingClaimId(claim.id);
    try {
      const { refundedPoints } = await processRewardClaimAdmin(
        claim,
        nextStatus,
        operatorLabel,
        note
      );
      if (nextStatus === 'DITOLAK') {
        onNotify(
          refundedPoints > 0
            ? `Klaim "${claim.itemName}" ditolak. ${refundedPoints.toLocaleString('id-ID')} Poin dikembalikan ke ${claim.voterName} dan stok dipulihkan.`
            : `Klaim "${claim.itemName}" ditolak dan stok dipulihkan.`
        );
      } else if (nextStatus === 'DISETUJUI') {
        onNotify(`Klaim "${claim.itemName}" dari ${claim.voterName} telah DISETUJUI.`);
      } else {
        onNotify(`Klaim "${claim.itemName}" ditandai SELESAI / diserahkan.`);
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal memperbarui status klaim.');
    } finally {
      setProcessingClaimId(null);
    }
  };

  const handleAddCaleg = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const filteredClaims = useMemo(() => {
    if (claimFilter === 'ALL') return allClaims;
    if (claimFilter === 'SELESAI') {
      return allClaims.filter((c) => c.status === 'SELESAI' || c.status === 'DISERAHKAN');
    }
    return allClaims.filter((c) => c.status === claimFilter);
  }, [allClaims, claimFilter]);

  const claimCounts = useMemo(() => {
    const menunggu = allClaims.filter((c) => c.status === 'MENUNGGU').length;
    const disetujui = allClaims.filter((c) => c.status === 'DISETUJUI').length;
    const selesai = allClaims.filter(
      (c) => c.status === 'SELESAI' || c.status === 'DISERAHKAN'
    ).length;
    const ditolak = allClaims.filter((c) => c.status === 'DITOLAK').length;
    return { menunggu, disetujui, selesai, ditolak };
  }, [allClaims]);

  const subTabs: { id: SuperadminSection; label: string; icon: React.ReactNode; badge?: number }[] =
    [
      {
        id: 'acara',
        label: 'Acara & Peta',
        icon: <CalendarPlus className="w-4 h-4" />,
        badge: events.length,
      },
      {
        id: 'reward',
        label: 'Reward & Klaim',
        icon: <Gift className="w-4 h-4" />,
        badge: claimCounts.menunggu > 0 ? claimCounts.menunggu : undefined,
      },
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{panelTitle}</h2>
              {isAdminOrSuper ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-extrabold">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Akses Penuh Lintas Wilayah</span>
                </span>
              ) : currentUser ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-extrabold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {getRoleDisplayName(currentUser.role)} &middot;{' '}
                    {formatWilayahLabel({
                      kota: currentUser.kota || '',
                      kecamatan: currentUser.kecamatan || '',
                      kelurahan: currentUser.kelurahan || '',
                    }) ||
                      currentUser.wilayah ||
                      'Wilayah Tugas'}
                  </span>
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Kelola jadwal acara kampanye &amp; peta (otomatis tampil di Agenda Partai Relawan), katalog reward &amp; proses klaim poin, info Caleg, data Voters, dan log aspirasi secara real-time.
            </p>
          </div>
          {isSuperAdmin && hasGoogleSuperAdmin && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sesi Google SuperAdmin Terverifikasi</span>
            </span>
          )}
        </div>

        {isSuperAdmin && !hasGoogleSuperAdmin && onConnectGoogleAdmin && (
          <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-indigo-950">
                  Verifikasi Google SuperAdmin (Opsional untuk Log Aktivitas Lengkap)
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Acara &amp; Peta, Reward &amp; Klaim, Info Caleg, Data Voter, dan Aspirasi sudah aktif penuh. Hubungkan akun Google SuperAdmin jika ingin membuka Book Activity Login tambahan.
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
                {isConnectingGoogle ? 'Menghubungkan...' : 'Verifikasi Google SuperAdmin'}
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
            <p className="text-xs font-semibold text-slate-500">Agenda Partai Aktif</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
              {events.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Klaim Menunggu</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-amber-700 mt-1">
              {claimCounts.menunggu}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Katalog Reward</p>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-blue-700 mt-1">
              {rewards.length}
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
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                  section === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.id === 'reward'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================================================= */}
      {/* SECTION 1: ACARA & PETA (AUTO-SYNC TO AGENDA PARTAI)    */}
      {/* ======================================================= */}
      {section === 'acara' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveEvent}
            className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingEventId ? 'Edit Jadwal Agenda Partai' : 'Tambah Jadwal Agenda Partai'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Otomatis tersinkron dan tampil di menu <strong>Agenda &amp; Reward → Agenda Partai</strong> seluruh akun Relawan.
                </p>
              </div>
              {editingEventId && (
                <button
                  type="button"
                  onClick={resetEventForm}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Judul Acara *</label>
                <input
                  type="text"
                  required
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="Contoh: Konsolidasi Relawan & Dialog Warga"
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
                <label className="text-xs font-bold text-slate-700">Status Acara *</label>
                <select
                  value={evStatus}
                  onChange={(e) => setEvStatus(e.target.value as EventStatus)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white font-semibold"
                >
                  <option value="Akan Datang">Akan Datang</option>
                  <option value="Berlangsung">Berlangsung</option>
                  <option value="Selesai">Selesai</option>
                </select>
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

              {/* Lokasi Berjenjang Kota -> Kecamatan -> Kelurahan */}
              <div className="sm:col-span-2 pt-1">
                <WilayahSelector
                  value={evWilayah}
                  onChange={handleEventWilayahChange}
                  required
                  compact
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Alamat Lengkap Lokasi *</label>
                <input
                  type="text"
                  required
                  value={evAddress}
                  onChange={(e) => setEvAddress(e.target.value)}
                  placeholder="Jalan, nomor gedung / balai warga, RT/RW"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Deskripsi Acara</label>
                <textarea
                  rows={3}
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  placeholder="Rangkaian kegiatan, dresscode relawan, narasumber, atau informasi penting lainnya..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Titik Lokasi di Google Maps (Klik peta untuk menyesuaikan pin)</span>
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
              {savingEvent
                ? 'Menyimpan Acara...'
                : editingEventId
                ? 'Simpan Perubahan Acara'
                : 'Publikasikan Acara ke Agenda Relawan'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Daftar Agenda Partai Aktif ({events.length})
            </h3>
            {events.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
                Belum ada acara yang dipublikasikan.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => {
                  const statusMeta = getEventStatusMeta(ev.eventStatus);
                  const wilayahText =
                    formatWilayahLabel({
                      kota: ev.kota || '',
                      kecamatan: ev.kecamatan || '',
                      kelurahan: ev.kelurahan || '',
                    }) || ev.region;

                  return (
                    <div
                      key={ev.id}
                      className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                            <span className="text-xs font-bold text-blue-700">{ev.partyName}</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900">{ev.title}</h4>
                          <p className="text-xs font-semibold text-slate-700">{ev.eventDate}</p>
                          <p className="text-xs text-emerald-700 font-semibold">{wilayahText}</p>
                          <p className="text-xs text-slate-500">{ev.address}</p>
                          {ev.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 pt-0.5">
                              {ev.description}
                            </p>
                          )}
                          <p className="text-[11px] font-mono tabular-nums text-slate-500 pt-1">
                            Hadir: {(ev.rsvpYes || []).length} &middot; +{ev.pointReward} Poin
                            {ev.createdByName ? ` · Oleh ${ev.createdByName}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditEventClick(ev)}
                            className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-blue-700 hover:bg-blue-50 cursor-pointer"
                            title="Edit Acara"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteEventAdmin(ev.id)
                                .then(() => onNotify('Acara dihapus dari jadwal.'))
                                .catch((err) => onNotify(err.message));
                            }}
                            className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Hapus Acara"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Status Switcher */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 mr-1">
                          Ubah Status:
                        </span>
                        {(['Akan Datang', 'Berlangsung', 'Selesai'] as const).map((st) => {
                          const isCurrent = (ev.eventStatus || 'Akan Datang') === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              disabled={isCurrent}
                              onClick={() => {
                                updateEventStatusAdmin(ev.id, st)
                                  .then(() =>
                                    onNotify(`Status acara "${ev.title}" diubah ke ${st}.`)
                                  )
                                  .catch((err) => onNotify(err.message));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                isCurrent
                                  ? 'bg-slate-900 text-white cursor-default'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* SECTION 2: REWARD & KLAIM (KATALOG + WORKFLOW KLAIM)    */}
      {/* ======================================================= */}
      {section === 'reward' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveReward}
              className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingRewardId ? 'Edit Item Katalog Reward' : 'Tambah Katalog Reward'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Langsung tampil di <strong>Agenda &amp; Reward → Katalog Reward</strong> Relawan.
                  </p>
                </div>
                {editingRewardId && (
                  <button
                    type="button"
                    onClick={resetRewardForm}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Hadiah / Reward *</label>
                  <input
                    type="text"
                    required
                    value={rwName}
                    onChange={(e) => setRwName(e.target.value)}
                    placeholder="Contoh: Paket Sembako / Kaos Resmi / Voucher Belanja"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Jumlah Poin *</label>
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      required
                      value={rwCost}
                      onChange={(e) => setRwCost(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Stok Tersedia *</label>
                    <input
                      type="number"
                      min={0}
                      max={1000000}
                      required
                      value={rwStock}
                      onChange={(e) => setRwStock(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Pilihan Ikon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pilih Ikon Hadiah</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {REWARD_ICON_OPTIONS.map((opt) => {
                      const selected = rwIconKey === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setRwIconKey(opt.key)}
                          className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                            selected
                              ? 'bg-blue-50 border-blue-600 text-blue-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {renderRewardIcon(opt.key, 'w-4 h-4')}
                          <span className="truncate max-w-full">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Gambar Opsional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Gambar Hadiah (Opsional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={rewardFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleRewardImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => rewardFileRef.current?.click()}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{rwImageUrl ? 'Ganti Gambar' : 'Unggah Gambar'}</span>
                    </button>
                    {rwImageUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={rwImageUrl}
                          alt="Pratinjau hadiah"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRwImageUrl('');
                            if (rewardFileRef.current) rewardFileRef.current.value = '';
                          }}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Deskripsi Hadiah</label>
                  <textarea
                    rows={2}
                    value={rwDesc}
                    onChange={(e) => setRwDesc(e.target.value)}
                    placeholder="Keterangan singkat isi hadiah atau mekanisme pengambilan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingReward}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm cursor-pointer"
              >
                {savingReward
                  ? 'Menyimpan...'
                  : editingRewardId
                  ? 'Simpan Perubahan Hadiah'
                  : 'Simpan ke Katalog Reward'}
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
                      <div className="flex items-center gap-3 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            {renderRewardIcon(item.iconKey, 'w-5 h-5')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {item.itemName}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                            {item.description || '-'}
                          </p>
                          <p className="text-xs font-mono tabular-nums text-blue-700 font-bold mt-1">
                            {item.pointCost.toLocaleString('id-ID')} Poin &middot; Stok:{' '}
                            <span
                              className={item.stock <= 0 ? 'text-rose-600' : 'text-emerald-700'}
                            >
                              {item.stock}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditRewardClick(item)}
                          className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-blue-700 hover:bg-blue-50 cursor-pointer"
                          title="Edit Reward"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteRewardAdmin(item.id)
                              .then(() => onNotify('Reward dihapus dari katalog.'))
                              .catch((err) => onNotify(err.message));
                          }}
                          className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Hapus Reward"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daftar Pengajuan Klaim Reward */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pengajuan Klaim Reward ({allClaims.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proses permintaan penukaran poin Relawan &amp; Pemilih: Menunggu Konfirmasi → Disetujui / Ditolak (poin kembali otomatis) → Selesai.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'ALL', label: `Semua (${allClaims.length})` },
                    { id: 'MENUNGGU', label: `Menunggu (${claimCounts.menunggu})` },
                    { id: 'DISETUJUI', label: `Disetujui (${claimCounts.disetujui})` },
                    { id: 'SELESAI', label: `Selesai (${claimCounts.selesai})` },
                    { id: 'DITOLAK', label: `Ditolak (${claimCounts.ditolak})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setClaimFilter(tab.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      claimFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredClaims.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Belum ada pengajuan klaim pada kategori ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Relawan / Pengaju</th>
                      <th className="px-4 py-3">No. WA</th>
                      <th className="px-4 py-3">Hadiah &amp; Poin</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Proses Klaim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClaims.map((claim) => {
                      const statusMeta = getClaimStatusMeta(claim.status as RewardClaimStatus);
                      const isBusy = processingClaimId === claim.id;
                      const claimedDate = claim.claimedAt?.toDate
                        ? claim.claimedAt.toDate().toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Baru saja';

                      return (
                        <tr key={claim.id} className="hover:bg-slate-50/70 align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{claim.voterName}</span>
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                {claim.userRole || (claim.accountType === 'relawan' ? 'Relawan' : 'Voter')}
                              </span>
                            </div>
                            {claim.wilayah && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{claim.wilayah}</p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">{claimedDate}</p>
                          </td>
                          <td className="px-4 py-3 font-mono whitespace-nowrap">{claim.phone}</td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{claim.itemName}</p>
                            <p className="font-mono font-bold text-blue-700 text-[11px]">
                              {claim.pointUsed.toLocaleString('id-ID')} Poin
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold ${statusMeta.badgeClass}`}
                            >
                              {claim.status === 'DITOLAK' ? (
                                <XCircle className="w-3 h-3" />
                              ) : claim.status === 'SELESAI' || claim.status === 'DISERAHKAN' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>{statusMeta.label}</span>
                            </span>
                            {claim.processedBy && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                Oleh: {claim.processedBy}
                              </p>
                            )}
                            {claim.note && (
                              <p className="text-[10px] text-slate-600 mt-0.5 italic">
                                &ldquo;{claim.note}&rdquo;
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {claim.status === 'MENUNGGU' ? (
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleProcessClaim(claim, 'DISETUJUI')}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleProcessClaim(claim, 'SELESAI')}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Selesai</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRejectTargetClaim(claim);
                                    setRejectReason('');
                                  }}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : claim.status === 'DISETUJUI' ? (
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleProcessClaim(claim, 'SELESAI')}
                                  className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Tandai Selesai</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setRejectTargetClaim(claim);
                                    setRejectReason('');
                                  }}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : claim.status === 'DITOLAK' ? (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                Poin Dikembalikan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Selesai Diserahkan
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                <label className="text-xs font-bold text-slate-700">Kelurahan / Wilayah *</label>
                <input
                  type="text"
                  required
                  value={clRegion}
                  onChange={(e) => setClRegion(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan — Kec. Cilandak"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Profil, Visi &amp; Program Kerja *
                </label>
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
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Data Voter / Konstituen Terdaftar &amp; Peta Suara ({filteredOcrVoters.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Seluruh Voter/Konstituen terdaftar dengan struktur Kota, Kecamatan, Kelurahan, &amp; Alamat Lengkap yang tersinkron ke Peta Suara.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={voterSearch}
                  onChange={(e) => setVoterSearch(e.target.value)}
                  placeholder="Cari nama, NIK, Kelurahan, Kecamatan, Kota..."
                  className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            {filteredOcrVoters.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada data Voter / Konstituen terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Nama Voter</th>
                      <th className="px-4 py-3">NIK</th>
                      <th className="px-4 py-3">Kota / Kecamatan / Kelurahan &amp; Alamat</th>
                      <th className="px-4 py-3">No. Telepon</th>
                      <th className="px-4 py-3">Penginput</th>
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
                                alt={`ID ${v.nama}`}
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
                            Kel. {v.kelurahan || '-'}, Kec. {v.kecamatan || '-'},{' '}
                            {v.kabupatenKota || '-'}
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs truncate">
                            {v.alamat || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono">{v.noHp || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{v.terdaftarOleh || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            {v.statusDpt || 'Terdaftar'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
                          <p className="text-[11px] text-slate-500 max-w-xs truncate">
                            {v.address}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono">{v.phone}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">
                          {v.referralCode}
                        </td>
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

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar Aspirasi Masuk ({allAspirations.length})
              </h3>
            </div>
            {allAspirations.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada aspirasi yang masuk dari warga.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allAspirations.map((asp) => (
                  <div key={asp.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900">
                        {asp.voterName}{' '}
                        <span className="text-blue-700 font-semibold">({asp.region})</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {asp.createdAt?.toDate
                          ? asp.createdAt.toDate().toLocaleString('id-ID')
                          : 'Baru saja'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{asp.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Tolak Klaim (Auto Refund Poin & Stok) */}
      {rejectTargetClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Tolak Pengajuan Klaim?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Klaim <strong>{rejectTargetClaim.itemName}</strong> oleh{' '}
                    <strong>{rejectTargetClaim.voterName}</strong> akan ditolak. Sebanyak{' '}
                    <strong className="text-emerald-700">
                      {rejectTargetClaim.pointUsed.toLocaleString('id-ID')} Poin
                    </strong>{' '}
                    akan dikembalikan otomatis ke saldo pengaju dan stok hadiah ditambah +1.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectTargetClaim(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Alasan Penolakan (Opsional)
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Stok hadiah di posko wilayah sedang kosong sementara"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectTargetClaim(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processingClaimId === rejectTargetClaim.id}
                onClick={async () => {
                  const target = rejectTargetClaim;
                  const reason = rejectReason;
                  setRejectTargetClaim(null);
                  await handleProcessClaim(target, 'DITOLAK', reason);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Ya, Tolak &amp; Kembalikan Poin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

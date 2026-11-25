import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Users,
  Radio,
  Clock,
  WifiOff,
  Search,
  MapPin,
  ShieldCheck,
  UserCheck,
  Navigation,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { firestore } from '../lib/firebase';
import type { GpsTrackingState, UserAccount } from '../types/vore';
import {
  subscribeAllLiveLocations,
  type LiveLocationRecord,
} from '../services/locationService';
import { isRealGpsCoordinate } from '../services/geolocationTrackerService';
import {
  SwarakuMapsProvider,
  SwarakuMapsDiagnosticNotice,
} from './maps/SwarakuMapsProvider';
import {
  canAccessMonitoringRelawan,
  canViewerMonitorTarget,
  isFullAccessRole,
  isKorcamRole,
  isKorwilRole,
  resolveUserProvinsi,
} from '../utils/hierarchyAccess';

// ============================================================================
// SWARAKU — DASHBOARD "MONITORING RELAWAN" (LIVE MAP & DAFTAR REAL-TIME)
// - Akses: Zuper Admin, Super Admin, Admin, Korwil, Korcam (sesuai hierarki wilayah)
// - Diblokir untuk role Relawan
// - Listener real-time onSnapshot ke `user_accounts` (+ merge `live_locations`)
// - 3 Status Visual: Hijau (GPS Online <3m), Kuning/Oranye (Background / 3-10m),
//   Merah/Abu-abu (GPS Offline >10m / logout / belum pernah kirim GPS)
// - Zero static fallback coordinates!
// ============================================================================

const INDONESIA_OVERVIEW_CENTER = { lat: -2.5489, lng: 118.0149 };

type VisualGpsStatus = 'online' | 'background' | 'offline';
type RoleFilterValue = 'semua' | 'korcam' | 'relawan';
type StatusFilterValue = 'semua' | VisualGpsStatus;

interface MonitoredFieldMember {
  id: string;
  nama: string;
  username: string;
  role: 'korcam' | 'relawan';
  roleLabel: 'Korcam' | 'Relawan';
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  wilayahDisplay: string;
  noHp: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  hasRealCoords: boolean;
  rawGpsState: GpsTrackingState;
  visualStatus: VisualGpsStatus;
  lastUpdateMs: number | null;
  lastSeenLabel: string;
  koordinatorLabel: string;
}

interface MonitoringMapViewProps {
  currentUser: UserAccount;
  userAccounts?: UserAccount[];
}

function parseTimestampMs(raw: unknown): number | null {
  if (!raw) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as { toMillis?: () => number; toDate?: () => Date; seconds?: number };
    if (typeof obj.toMillis === 'function') return obj.toMillis();
    if (typeof obj.toDate === 'function') return obj.toDate().getTime();
    if (typeof obj.seconds === 'number') return obj.seconds * 1000;
  }
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Logika 3 Status Visual:
 * - Hijau (GPS Online): gpsState === "online" DAN update terakhir < 3 menit.
 * - Kuning/Oranye (Background / Idle): gpsState === "background" ATAU update terakhir 3–10 menit lalu.
 * - Merah/Abu-abu (GPS Offline): Tidak ada update > 10 menit ATAU gpsState === "offline" / belum pernah kirim GPS.
 */
function computeVisualGpsStatus(
  rawState: GpsTrackingState | undefined,
  lastUpdateMs: number | null,
  hasRealCoords: boolean,
  nowMs: number
): VisualGpsStatus {
  if (!hasRealCoords || !lastUpdateMs || rawState === 'offline') {
    return 'offline';
  }
  const ageMs = Math.max(0, nowMs - lastUpdateMs);
  const THREE_MIN = 3 * 60 * 1000;
  const TEN_MIN = 10 * 60 * 1000;

  if (ageMs > TEN_MIN) {
    return 'offline';
  }
  if (rawState === 'background' || ageMs >= THREE_MIN) {
    return 'background';
  }
  return 'online';
}

function formatLastSeen(lastUpdateMs: number | null, nowMs: number): string {
  if (!lastUpdateMs) return 'Belum pernah aktif';
  const diffSec = Math.max(0, Math.floor((nowMs - lastUpdateMs) / 1000));
  if (diffSec < 15) return 'Baru saja';
  if (diffSec < 60) return `${diffSec} dtk lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return new Date(lastUpdateMs).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildWilayahDisplay(u: UserAccount): string {
  const parts = [u.kelurahan, u.kecamatan, u.kota].filter((p) => Boolean(p && p.trim() && p !== '-'));
  if (parts.length > 0) return parts.join(', ');
  return u.wilayah || 'Wilayah belum diatur';
}

/**
 * Helper internal untuk mengontrol panTo, setZoom, dan fitBounds secara halus
 * menggunakan instance Google Map (`useMap()`).
 */
const MapCameraController: React.FC<{
  focusTarget: MonitoredFieldMember | null;
  focusNonce: number;
  plottableMembers: MonitoredFieldMember[];
}> = ({ focusTarget, focusNonce, plottableMembers }) => {
  const map = useMap();
  const hasAutoFittedRef = useRef(false);

  // Sinkronisasi Daftar -> Peta: panTo & setZoom tepat ke titik marker yang dipilih
  useEffect(() => {
    if (!map || !focusTarget || !focusTarget.hasRealCoords) return;
    if (focusTarget.latitude === null || focusTarget.longitude === null) return;
    map.panTo({ lat: focusTarget.latitude, lng: focusTarget.longitude });
    map.setZoom(16);
  }, [map, focusTarget, focusNonce]);

  // Fit bounds awal sekali saat marker pertama kali muncul
  useEffect(() => {
    if (!map || hasAutoFittedRef.current || plottableMembers.length === 0) return;
    if (plottableMembers.length === 1) {
      const only = plottableMembers[0];
      if (only.latitude !== null && only.longitude !== null) {
        map.panTo({ lat: only.latitude, lng: only.longitude });
        map.setZoom(14);
        hasAutoFittedRef.current = true;
      }
      return;
    }

    const gmaps = (
      window as unknown as {
        google?: {
          maps?: {
            LatLngBounds?: new () => { extend: (pt: { lat: number; lng: number }) => void };
          };
        };
      }
    ).google?.maps;
    if (gmaps?.LatLngBounds) {
      const bounds = new gmaps.LatLngBounds();
      plottableMembers.forEach((m) => {
        if (m.latitude !== null && m.longitude !== null) {
          bounds.extend({ lat: m.latitude, lng: m.longitude });
        }
      });
      map.fitBounds(bounds as Parameters<typeof map.fitBounds>[0], 56);
      hasAutoFittedRef.current = true;
    }
  }, [map, plottableMembers]);

  return null;
};

export const MonitoringMapView: React.FC<MonitoringMapViewProps> = ({
  currentUser,
  userAccounts: propUserAccounts = [],
}) => {
  const [cloudUsers, setCloudUsers] = useState<UserAccount[]>(propUserAccounts);
  const [legacyLiveRecords, setLegacyLiveRecords] = useState<LiveLocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listenerError, setListenerError] = useState<string | null>(null);

  // Filters
  const isViewerKorcam = isKorcamRole(currentUser.role);
  const isViewerKorwil = isKorwilRole(currentUser.role);
  const isViewerFull = isFullAccessRole(currentUser.role);

  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>(
    isViewerKorcam ? 'relawan' : 'semua'
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected member & focus trigger for List -> Map panTo/setZoom + InfoWindow
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);

  // Clock ticker setiap 15 detik agar status 3-menit / 10-menit & Last Seen selalu real-time
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  // Proteksi rute jika role tidak diizinkan (mis. Relawan)
  const hasAccess = canAccessMonitoringRelawan(currentUser.role);

  // Real-time Firestore listener pada koleksi `user_accounts`
  useEffect(() => {
    if (!hasAccess) return;

    setIsLoading(true);
    const unsubUsers = onSnapshot(
      collection(firestore, 'user_accounts'),
      (snap) => {
        const list: UserAccount[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: d.id || docSnap.id,
            role: d.role || 'relawan',
            nama: d.nama || '',
            username: d.username || '',
            email: d.email || '',
            jabatan: d.jabatan || '',
            wilayah: d.wilayah || '',
            provinsi: d.provinsi || undefined,
            kota: d.kota || undefined,
            kecamatan: d.kecamatan || undefined,
            kelurahan: d.kelurahan || undefined,
            noHp: d.noHp || '',
            status: d.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
            timSuksesId: d.timSuksesId || undefined,
            timSuksesNama: d.timSuksesNama || undefined,
            didaftarkanOlehTimSukses: d.didaftarkanOlehTimSukses || undefined,
            korcamId: d.korcamId || undefined,
            korcamNama: d.korcamNama || undefined,
            kaderList: Array.isArray(d.kaderList) ? d.kaderList : undefined,
            kaderIds: Array.isArray(d.kaderIds) ? d.kaderIds : undefined,
            latitude: typeof d.latitude === 'number' ? d.latitude : null,
            longitude: typeof d.longitude === 'number' ? d.longitude : null,
            accuracy: typeof d.accuracy === 'number' ? d.accuracy : null,
            lastLocationUpdate: d.lastLocationUpdate ?? undefined,
            gpsState:
              d.gpsState === 'online' || d.gpsState === 'background' || d.gpsState === 'offline'
                ? d.gpsState
                : undefined,
          });
        });
        setCloudUsers(list);
        setIsLoading(false);
        setListenerError(null);
      },
      (err) => {
        console.warn('[MonitoringRelawan] onSnapshot user_accounts error:', err);
        setListenerError('Koneksi real-time ke database lokasi mengalami gangguan sementara.');
        setIsLoading(false);
      }
    );

    // Secondary listener untuk kompatibilitas koleksi `live_locations`
    const unsubLegacy = subscribeAllLiveLocations(
      (records: LiveLocationRecord[]) => {
        setLegacyLiveRecords(records);
      },
      () => {
        // optional fallback collection
      }
    );

    return () => {
      unsubUsers();
      unsubLegacy();
    };
  }, [hasAccess]);

  // Gabungkan daftar akun dari Firestore + prop jika ada yang belum tersinkron
  const allAccounts = useMemo<UserAccount[]>(() => {
    const byId = new Map<string, UserAccount>();
    propUserAccounts.forEach((u) => {
      if (u?.id) byId.set(u.id, u);
    });
    cloudUsers.forEach((u) => {
      if (u?.id) byId.set(u.id, u);
    });
    return Array.from(byId.values());
  }, [cloudUsers, propUserAccounts]);

  // Map legacy live_locations by userId untuk fallback baca koordinat jika user_accounts belum punya
  const legacyByUserId = useMemo(() => {
    const map = new Map<string, LiveLocationRecord>();
    legacyLiveRecords.forEach((rec) => {
      if (rec.userId) map.set(rec.userId, rec);
    });
    return map;
  }, [legacyLiveRecords]);

  // Terapkan Aturan Hak Akses & Filter Hierarki Wilayah (Poin 1)
  const scopedMembers = useMemo<MonitoredFieldMember[]>(() => {
    if (!hasAccess) return [];

    const visibleUsers = allAccounts.filter((u) =>
      canViewerMonitorTarget(currentUser, u, allAccounts)
    );

    return visibleUsers
      .map((u) => {
        const legacy = legacyByUserId.get(u.id) || legacyByUserId.get(u.username);
        const userLat = isRealGpsCoordinate(u.latitude, u.longitude) ? u.latitude! : null;
        const userLng = isRealGpsCoordinate(u.latitude, u.longitude) ? u.longitude! : null;
        const userTimeMs = parseTimestampMs(u.lastLocationUpdate);

        const legacyHasCoords = legacy ? isRealGpsCoordinate(legacy.latitude, legacy.longitude) : false;
        const legacyTimeMs = legacy ? parseTimestampMs(legacy.lastUpdated) : null;

        // Pilih sumber koordinat terbaru (utamakan user_accounts, fallback ke live_locations jika lebih baru)
        let finalLat: number | null = userLat;
        let finalLng: number | null = userLng;
        let finalAcc: number | null = typeof u.accuracy === 'number' ? u.accuracy : null;
        let finalTimeMs: number | null = userTimeMs;
        let rawState: GpsTrackingState = u.gpsState || 'offline';

        if (
          legacy &&
          legacyHasCoords &&
          (!userLat || (legacyTimeMs && (!userTimeMs || legacyTimeMs > userTimeMs)))
        ) {
          finalLat = legacy.latitude;
          finalLng = legacy.longitude;
          finalAcc = legacy.accuracy ?? finalAcc;
          finalTimeMs = legacyTimeMs ?? finalTimeMs;
          if (!u.gpsState) {
            rawState = legacy.gpsStatus === 'Aktif' ? 'online' : 'offline';
          }
        }

        const hasRealCoords = isRealGpsCoordinate(finalLat, finalLng);
        const visualStatus = computeVisualGpsStatus(rawState, finalTimeMs, hasRealCoords, nowMs);
        const isKorcam = isKorcamRole(u.role);

        return {
          id: u.id,
          nama: u.nama || u.username || 'Tanpa Nama',
          username: u.username || '',
          role: isKorcam ? 'korcam' : 'relawan',
          roleLabel: isKorcam ? 'Korcam' : 'Relawan',
          provinsi: resolveUserProvinsi(u),
          kota: u.kota || '',
          kecamatan: u.kecamatan || '',
          kelurahan: u.kelurahan || '',
          wilayahDisplay: buildWilayahDisplay(u),
          noHp: u.noHp || '-',
          latitude: hasRealCoords ? finalLat : null,
          longitude: hasRealCoords ? finalLng : null,
          accuracy: finalAcc,
          hasRealCoords,
          rawGpsState: rawState,
          visualStatus,
          lastUpdateMs: finalTimeMs,
          lastSeenLabel: formatLastSeen(finalTimeMs, nowMs),
          koordinatorLabel: isKorcam
            ? u.timSuksesNama || u.didaftarkanOlehTimSukses || '-'
            : u.korcamNama || u.timSuksesNama || '-',
        } as MonitoredFieldMember;
      })
      .sort((a, b) => {
        // Prioritaskan Online -> Background -> Offline, lalu nama alfabetis
        const order: Record<VisualGpsStatus, number> = { online: 0, background: 1, offline: 2 };
        if (order[a.visualStatus] !== order[b.visualStatus]) {
          return order[a.visualStatus] - order[b.visualStatus];
        }
        return a.nama.localeCompare(b.nama, 'id-ID');
      });
  }, [hasAccess, allAccounts, currentUser, legacyByUserId, nowMs]);

  // Statistik KPI (bagian atas, sesuai cakupan wilayah user yang login)
  const kpiStats = useMemo(() => {
    const total = scopedMembers.length;
    const totalKorcam = scopedMembers.filter((m) => m.role === 'korcam').length;
    const totalRelawan = scopedMembers.filter((m) => m.role === 'relawan').length;
    const online = scopedMembers.filter((m) => m.visualStatus === 'online').length;
    const background = scopedMembers.filter((m) => m.visualStatus === 'background').length;
    const offline = scopedMembers.filter((m) => m.visualStatus === 'offline').length;
    return { total, totalKorcam, totalRelawan, online, background, offline };
  }, [scopedMembers]);

  // Terapkan filter UI (Peran, Status GPS, Pencarian Nama)
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedMembers.filter((m) => {
      if (isViewerKorcam && m.role !== 'relawan') return false;
      if (!isViewerKorcam && roleFilter !== 'semua' && m.role !== roleFilter) return false;
      if (statusFilter !== 'semua' && m.visualStatus !== statusFilter) return false;
      if (q) {
        const hay = `${m.nama} ${m.username} ${m.wilayahDisplay} ${m.kota} ${m.kecamatan} ${m.kelurahan}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scopedMembers, isViewerKorcam, roleFilter, statusFilter, searchQuery]);

  // Hanya anggota yang memiliki koordinat GPS riil yang di-plot ke peta (ZERO static fallback)
  const plottableMembers = useMemo(
    () => filteredMembers.filter((m) => m.hasRealCoords && m.latitude !== null && m.longitude !== null),
    [filteredMembers]
  );

  const selectedMember = useMemo(
    () => filteredMembers.find((m) => m.id === selectedMemberId) || null,
    [filteredMembers, selectedMemberId]
  );

  const handleSelectRow = (member: MonitoredFieldMember) => {
    setSelectedMemberId(member.id);
    if (member.hasRealCoords) {
      setFocusNonce((n) => n + 1);
    }
  };

  // Proteksi Rute jika role Relawan mencoba masuk
  if (!hasAccess) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">Akses Terbatas</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Menu Monitoring Relawan hanya dapat diakses oleh Admin, Korwil, dan Korcam sesuai
          hierarki wilayah tugas.
        </p>
      </div>
    );
  }

  const scopeTitle = isViewerFull
    ? 'Cakupan Nasional (Seluruh Indonesia — Korcam & Relawan)'
    : isViewerKorwil
    ? `Wilayah Korwil: ${currentUser.kota || currentUser.wilayah || 'Wilayah Binaan'} (Korcam & Relawan)`
    : `Wilayah Korcam: ${[currentUser.kecamatan, currentUser.kota].filter(Boolean).join(', ') || currentUser.wilayah || 'Wilayah Binaan'} (Relawan Binaan)`;

  return (
    <div className="space-y-5">
      {/* Header Light Mode */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>Real-Time Firestore Live Location</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Monitoring Relawan &amp; Tim Lapangan
          </h2>
          <p className="text-xs text-slate-600">{scopeTitle}</p>
        </div>

        {/* Legend Marker */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          {!isViewerKorcam && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Pin Biru = Korcam
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            Pin Hijau = Relawan
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{plottableMembers.length} titik di peta</span>
          </span>
        </div>
      </div>

      {listenerError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{listenerError}</span>
        </div>
      )}

      {/* 1. Kartu Ringkasan Statistik (Bagian Atas) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('semua')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'semua'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold ${
                statusFilter === 'semua' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Total Tim Lapangan
            </span>
            <Users
              className={`w-4 h-4 ${
                statusFilter === 'semua' ? 'text-blue-400' : 'text-blue-600'
              }`}
            />
          </div>
          <p className="text-2xl sm:text-3xl font-black tabular-nums">{kpiStats.total}</p>
          <p
            className={`text-[11px] mt-1 font-medium ${
              statusFilter === 'semua' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {isViewerKorcam
              ? `${kpiStats.totalRelawan} Relawan binaan`
              : `${kpiStats.totalKorcam} Korcam · ${kpiStats.totalRelawan} Relawan`}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'online' ? 'semua' : 'online')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'online'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white hover:bg-emerald-50/50 text-slate-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold ${
                statusFilter === 'online' ? 'text-emerald-100' : 'text-emerald-800'
              }`}
            >
              GPS Online
            </span>
            <Radio
              className={`w-4 h-4 ${
                statusFilter === 'online' ? 'text-white' : 'text-emerald-600'
              }`}
            />
          </div>
          <p className="text-2xl sm:text-3xl font-black tabular-nums">{kpiStats.online}</p>
          <p
            className={`text-[11px] mt-1 font-medium ${
              statusFilter === 'online' ? 'text-emerald-100' : 'text-emerald-700'
            }`}
          >
            Aktif &lt; 3 menit terakhir
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'background' ? 'semua' : 'background')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'background'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white hover:bg-amber-50/60 text-slate-900 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold ${
                statusFilter === 'background' ? 'text-amber-50' : 'text-amber-800'
              }`}
            >
              Background / Idle
            </span>
            <Clock
              className={`w-4 h-4 ${
                statusFilter === 'background' ? 'text-white' : 'text-amber-600'
              }`}
            />
          </div>
          <p className="text-2xl sm:text-3xl font-black tabular-nums">{kpiStats.background}</p>
          <p
            className={`text-[11px] mt-1 font-medium ${
              statusFilter === 'background' ? 'text-amber-50' : 'text-amber-700'
            }`}
          >
            Background atau 3–10 mnt lalu
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'semua' : 'offline')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'offline'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white hover:bg-rose-50/50 text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold ${
                statusFilter === 'offline' ? 'text-rose-100' : 'text-slate-600'
              }`}
            >
              GPS Offline
            </span>
            <WifiOff
              className={`w-4 h-4 ${
                statusFilter === 'offline' ? 'text-white' : 'text-rose-500'
              }`}
            />
          </div>
          <p className="text-2xl sm:text-3xl font-black tabular-nums">{kpiStats.offline}</p>
          <p
            className={`text-[11px] mt-1 font-medium ${
              statusFilter === 'offline' ? 'text-rose-100' : 'text-slate-500'
            }`}
          >
            &gt; 10 menit / Logout / Belum GPS
          </p>
        </button>
      </div>

      {/* 2. Live Map Google Maps API */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Live Map Posisi Tim Lapangan
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-semibold">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Background
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Offline
            </span>
          </div>
        </div>

        <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-100">
          <SwarakuMapsProvider
            fallback={
              <div className="h-full w-full p-4 sm:p-6 overflow-y-auto flex flex-col justify-center bg-slate-50">
                <SwarakuMapsDiagnosticNotice
                  title="Peta Live Google Maps tidak dapat dimuat saat ini"
                  subtitle="Daftar tim lapangan, status GPS real-time, dan koordinat tetap tersedia pada tabel di bawah."
                />
              </div>
            }
          >
            <GoogleMap
              mapId="swaraku-monitoring-relawan-map"
              defaultCenter={INDONESIA_OVERVIEW_CENTER}
              defaultZoom={5}
              gestureHandling="greedy"
              disableDefaultUI={false}
              streetViewControl={false}
              mapTypeControl={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="w-full h-full"
            >
            <MapCameraController
              focusTarget={selectedMember}
              focusNonce={focusNonce}
              plottableMembers={plottableMembers}
            />

            {plottableMembers.map((member) => {
              if (member.latitude === null || member.longitude === null) return null;
              const isSelected = selectedMemberId === member.id;
              const isKorcam = member.role === 'korcam';
              const isOnline = member.visualStatus === 'online';
              const isBackground = member.visualStatus === 'background';

              // Warna pin: Korcam = Biru, Relawan = Hijau; redup/abu-abu jika Offline
              const pinBg = !isOnline && !isBackground
                ? 'bg-slate-400 border-slate-500 text-white opacity-75'
                : isKorcam
                ? 'bg-blue-600 border-white text-white'
                : 'bg-emerald-600 border-white text-white';

              const statusRing = isOnline
                ? isKorcam
                  ? 'ring-4 ring-blue-400/50'
                  : 'ring-4 ring-emerald-400/50'
                : isBackground
                ? 'ring-4 ring-amber-400/70'
                : 'ring-2 ring-slate-300';

              const dotColor = isOnline
                ? 'bg-emerald-400'
                : isBackground
                ? 'bg-amber-400'
                : 'bg-rose-400';

              return (
                <AdvancedMarker
                  key={member.id}
                  position={{ lat: member.latitude, lng: member.longitude }}
                  onClick={() => setSelectedMemberId(member.id)}
                  zIndex={isSelected ? 50 : isOnline ? 30 : isBackground ? 20 : 10}
                >
                  <div className="relative flex flex-col items-center cursor-pointer group">
                    {isOnline && (
                      <span
                        className={`absolute -inset-1.5 rounded-full animate-ping opacity-40 ${
                          isKorcam ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                    <div
                      className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-full border-2 shadow-lg transition-transform ${
                        isSelected ? 'scale-110' : 'group-hover:scale-105'
                      } ${pinBg} ${statusRing}`}
                    >
                      {isKorcam ? (
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="text-[11px] font-extrabold max-w-[110px] truncate">
                        {member.nama.split(' ')[0]}
                      </span>
                      <span className={`w-2 h-2 rounded-full shrink-0 border border-white ${dotColor}`} />
                    </div>
                    <div
                      className={`w-2.5 h-2.5 rotate-45 -mt-1.5 border-r border-b ${
                        !isOnline && !isBackground
                          ? 'bg-slate-400 border-slate-500'
                          : isKorcam
                          ? 'bg-blue-600 border-blue-700'
                          : 'bg-emerald-600 border-emerald-700'
                      }`}
                    />
                  </div>
                </AdvancedMarker>
              );
            })}

            {selectedMember &&
              selectedMember.hasRealCoords &&
              selectedMember.latitude !== null &&
              selectedMember.longitude !== null && (
                <InfoWindow
                  position={{ lat: selectedMember.latitude, lng: selectedMember.longitude }}
                  onCloseClick={() => setSelectedMemberId(null)}
                  pixelOffset={[0, -34]}
                >
                  <div className="min-w-[230px] max-w-[270px] p-1 text-slate-900 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">
                          {selectedMember.nama}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              selectedMember.role === 'korcam'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {selectedMember.roleLabel}
                          </span>
                          <StatusBadge status={selectedMember.visualStatus} compact />
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-700 space-y-1 border-t border-slate-100 pt-2">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          <b>Wilayah:</b> {selectedMember.wilayahDisplay}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <b>Last Seen:</b> {selectedMember.lastSeenLabel}
                        </span>
                      </p>
                      <p className="font-mono text-[10px] text-slate-500">
                        {selectedMember.latitude.toFixed(5)}, {selectedMember.longitude.toFixed(5)}
                        {selectedMember.accuracy ? ` (±${selectedMember.accuracy}m)` : ''}
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${selectedMember.latitude},${selectedMember.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka di Google Maps</span>
                    </a>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </SwarakuMapsProvider>

          {/* Overlay info jika belum ada satupun koordinat GPS riil */}
          {!isLoading && plottableMembers.length === 0 && (
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center">
              <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl px-4 py-2.5 shadow-md text-xs text-slate-700 font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Belum ada tim lapangan dalam filter ini yang mengirimkan titik koordinat GPS aktif.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Filter & Daftar Tim Lapangan */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Daftar Tim Lapangan ({filteredMembers.length})
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
              {/* Pencarian Nama */}
              <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau wilayah..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Filter Peran (khusus Korcam hanya tampil Relawan) */}
              {!isViewerKorcam ? (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilterValue)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  aria-label="Filter Peran"
                >
                  <option value="semua">Semua Peran</option>
                  <option value="korcam">Korcam</option>
                  <option value="relawan">Relawan</option>
                </select>
              ) : (
                <span className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                  Peran: Relawan Binaan
                </span>
              )}

              {/* Filter Status GPS */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                aria-label="Filter Status GPS"
              >
                <option value="semua">Semua Status GPS</option>
                <option value="online">GPS Online</option>
                <option value="background">Background / Idle</option>
                <option value="offline">GPS Offline</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Klik baris nama untuk langsung menggeser peta (pan &amp; zoom) ke lokasi GPS personel
            tersebut dan membuka detail InfoWindow.
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Wilayah Tugas (Kota, Kec, Kel)</th>
                <th className="py-3 px-4">Status GPS</th>
                <th className="py-3 px-4">Last Seen</th>
                <th className="py-3 px-4 text-right">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-slate-500">
                    Tidak ada personel tim lapangan yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isSelected = selectedMemberId === member.id;
                  return (
                    <tr
                      key={member.id}
                      onClick={() => handleSelectRow(member)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 hover:bg-blue-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-900">{member.nama}</p>
                        <p className="text-[11px] text-slate-500">@{member.username}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            member.role === 'korcam'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {member.role === 'korcam' ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          {member.roleLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{member.wilayahDisplay}</p>
                        {member.provinsi && (
                          <p className="text-[10px] text-slate-500">{member.provinsi}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={member.visualStatus} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        {member.lastSeenLabel}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {member.hasRealCoords && member.latitude !== null && member.longitude !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-800 font-mono text-[10px] font-bold">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            Fokus Peta
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 italic">
                            Lokasi GPS belum tersedia
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada personel tim lapangan yang cocok dengan filter saat ini.
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isSelected = selectedMemberId === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelectRow(member)}
                  className={`w-full p-4 text-left space-y-2 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/80' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">
                        {member.nama}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          member.role === 'korcam'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {member.roleLabel}
                      </span>
                    </div>
                    <StatusBadge status={member.visualStatus} />
                  </div>
                  <p className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{member.wilayahDisplay}</span>
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 font-medium">
                      Last Seen: <b className="text-slate-700">{member.lastSeenLabel}</b>
                    </span>
                    {member.hasRealCoords ? (
                      <span className="text-blue-700 font-bold">Lihat di Peta →</span>
                    ) : (
                      <span className="text-slate-400 italic">Lokasi GPS belum tersedia</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: VisualGpsStatus; compact?: boolean }> = ({
  status,
  compact = false,
}) => {
  if (status === 'online') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        GPS Online
      </span>
    );
  }
  if (status === 'background') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        Background / Idle
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-rose-500" />
      GPS Offline
    </span>
  );
};

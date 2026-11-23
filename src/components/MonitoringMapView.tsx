import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Navigation, Radio, RefreshCw } from 'lucide-react';
import {
  fetchAllLiveLocationsOnce,
  isFullMonitorRole,
  isKorcamRole,
  isKorwilRole,
  resolveMonitoredLocations,
  subscribeAllLiveLocations,
  type EnrichedLiveLocationRecord,
  type LiveLocationRecord,
  type MonitoringAccountInfo,
  type MonitoringViewerContext,
  type TrackedRole,
} from '../services/locationService';
import { SwarakuMapsProvider } from './maps/SwarakuMapsProvider';

interface MonitoringMapViewProps {
  currentUser: MonitoringViewerContext;
  userAccounts?: MonitoringAccountInfo[];
}

const STALE_MINUTES = 10;

function toDateObj(val: LiveLocationRecord['lastUpdated']): Date | null {
  if (!val) return null;
  if (
    typeof val === 'object' &&
    'toDate' in val &&
    typeof val.toDate === 'function'
  ) {
    return val.toDate();
  }
  const d = new Date(val as string | number);
  return isNaN(d.getTime()) ? null : d;
}

function formatWib(val: LiveLocationRecord['lastUpdated']): string {
  const d = toDateObj(val);
  if (!d) return 'Belum pernah aktif';
  return (
    d.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  );
}

function formatRelativeTime(val: LiveLocationRecord['lastUpdated'], nowMs: number): string {
  const d = toDateObj(val);
  if (!d) return '';
  const diffSec = Math.max(0, Math.floor((nowMs - d.getTime()) / 1000));
  if (diffSec < 15) return 'Baru saja (Live)';
  if (diffSec < 60) return `${diffSec} dtk lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} hari lalu`;
}

function getEffectiveStatus(
  rec: LiveLocationRecord,
  nowMs: number
): 'Aktif' | 'Sinyal Terhenti' | 'Ditolak' | 'Tidak Aktif' {
  if (rec.gpsStatus === 'Ditolak') return 'Ditolak';
  if (rec.gpsStatus !== 'Aktif') return 'Tidak Aktif';
  const last = toDateObj(rec.lastUpdated);
  if (last && nowMs - last.getTime() > STALE_MINUTES * 60 * 1000) {
    return 'Sinyal Terhenti';
  }
  return 'Aktif';
}

function getStatusSortRank(status: 'Aktif' | 'Sinyal Terhenti' | 'Ditolak' | 'Tidak Aktif'): number {
  if (status === 'Aktif') return 0;
  if (status === 'Sinyal Terhenti') return 1;
  if (status === 'Ditolak') return 2;
  return 3;
}

const MapViewportController: React.FC<{
  records: EnrichedLiveLocationRecord[];
  focusedRecord: EnrichedLiveLocationRecord | null;
}> = ({ records, focusedRecord }) => {
  const map = useMap();
  const hasFittedInitialRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    if (
      focusedRecord &&
      typeof focusedRecord.latitude === 'number' &&
      typeof focusedRecord.longitude === 'number'
    ) {
      map.panTo({ lat: focusedRecord.latitude, lng: focusedRecord.longitude });
      map.setZoom(16);
      return;
    }

    if (records.length === 0 || hasFittedInitialRef.current) return;
    hasFittedInitialRef.current = true;

    if (records.length === 1) {
      map.setCenter({
        lat: records[0].latitude as number,
        lng: records[0].longitude as number,
      });
      map.setZoom(15);
      return;
    }

    const gmaps = (
      window as unknown as {
        google?: {
          maps?: {
            LatLngBounds?: new () => {
              extend: (p: { lat: number; lng: number }) => void;
            };
          };
        };
      }
    ).google?.maps;
    if (gmaps?.LatLngBounds) {
      const bounds = new gmaps.LatLngBounds();
      records.forEach((rec) => {
        if (typeof rec.latitude === 'number' && typeof rec.longitude === 'number') {
          bounds.extend({ lat: rec.latitude, lng: rec.longitude });
        }
      });
      map.fitBounds(bounds as unknown as Parameters<typeof map.fitBounds>[0]);
    }
  }, [map, records, focusedRecord]);

  return null;
};

export const MonitoringMapView: React.FC<MonitoringMapViewProps> = ({
  currentUser,
  userAccounts = [],
}) => {
  const isFullAccess = isFullMonitorRole(currentUser.role);
  const isKorwil = isKorwilRole(currentUser.role);
  const isKorcam = isKorcamRole(currentUser.role);

  const [rawLiveRecords, setRawLiveRecords] = useState<LiveLocationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'Semua' | TrackedRole>('Semua');
  const [korwilFilter, setKorwilFilter] = useState<string>('Semua');
  const [korcamFilter, setKorcamFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<
    'Semua' | 'Aktif' | 'Sinyal Terhenti' | 'Belum Aktif'
  >('Semua');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [focusRequestId, setFocusRequestId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllLiveLocations(
      (data) => {
        setRawLiveRecords(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [refreshTick]);

  // Refresh relative timestamps every 5s for Share Live Location responsiveness
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  const records = useMemo(
    () => resolveMonitoredLocations(currentUser, rawLiveRecords, userAccounts),
    [currentUser, rawLiveRecords, userAccounts]
  );

  const handleRefreshData = async () => {
    setRefreshing(true);
    setNowMs(Date.now());
    try {
      const fresh = await fetchAllLiveLocationsOnce();
      setRawLiveRecords(fresh);
    } catch {
      // Fallback ke re-subscribe listener
    } finally {
      setRefreshing(false);
      setRefreshTick((t) => t + 1);
    }
  };

  const korwilOptions = useMemo(() => {
    if (!isFullAccess) return [];
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.role === 'Korwil') {
        map.set(r.userId, r.nama);
      } else if (r.timSuksesId && r.namaTimSukses && !map.has(r.timSuksesId)) {
        map.set(r.timSuksesId, r.namaTimSukses);
      }
    });
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [records, isFullAccess]);

  const korcamOptions = useMemo(() => {
    if (!isFullAccess && !isKorwil) return [];
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.role === 'Korcam') {
        map.set(r.userId, r.nama);
      } else if (r.korcamId && r.namaKorcam && !map.has(r.korcamId)) {
        map.set(r.korcamId, r.namaKorcam);
      }
    });
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [records, isFullAccess, isKorwil]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = records.filter((rec) => {
      if (
        q &&
        !rec.nama.toLowerCase().includes(q) &&
        !(rec.address || '').toLowerCase().includes(q) &&
        !(rec.kelurahan || '').toLowerCase().includes(q) &&
        !(rec.kecamatan || '').toLowerCase().includes(q) &&
        !(rec.kota || '').toLowerCase().includes(q)
      ) {
        return false;
      }

      if (!isKorcam && roleFilter !== 'Semua' && rec.role !== roleFilter) {
        return false;
      }

      if (isFullAccess && korwilFilter !== 'Semua') {
        const matchKorwil =
          rec.userId === korwilFilter || rec.timSuksesId === korwilFilter;
        if (!matchKorwil) return false;
      }

      if ((isFullAccess || isKorwil) && korcamFilter !== 'Semua') {
        const matchKorcam =
          rec.userId === korcamFilter || rec.korcamId === korcamFilter;
        if (!matchKorcam) return false;
      }

      const eff = getEffectiveStatus(rec, nowMs);
      if (statusFilter === 'Aktif' && eff !== 'Aktif') return false;
      if (statusFilter === 'Sinyal Terhenti' && eff !== 'Sinyal Terhenti') {
        return false;
      }
      if (
        statusFilter === 'Belum Aktif' &&
        eff !== 'Tidak Aktif' &&
        eff !== 'Ditolak'
      ) {
        return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      const rankDiff =
        getStatusSortRank(getEffectiveStatus(a, nowMs)) -
        getStatusSortRank(getEffectiveStatus(b, nowMs));
      if (rankDiff !== 0) return rankDiff;
      const tA = toDateObj(a.lastUpdated)?.getTime() || 0;
      const tB = toDateObj(b.lastUpdated)?.getTime() || 0;
      return tB - tA;
    });
  }, [
    records,
    search,
    isFullAccess,
    isKorwil,
    isKorcam,
    roleFilter,
    korwilFilter,
    korcamFilter,
    statusFilter,
    nowMs,
  ]);

  const stats = useMemo(() => {
    const korwilList = records.filter((r) => r.role === 'Korwil');
    const korcamList = records.filter((r) => r.role === 'Korcam');
    const relawanList = records.filter((r) => r.role === 'Relawan');
    const totalAll = records.length;
    const aktifAll = records.filter((r) => getEffectiveStatus(r, nowMs) === 'Aktif').length;
    return {
      totalKorwil: korwilList.length,
      aktifKorwil: korwilList.filter((r) => getEffectiveStatus(r, nowMs) === 'Aktif').length,
      totalKorcam: korcamList.length,
      aktifKorcam: korcamList.filter((r) => getEffectiveStatus(r, nowMs) === 'Aktif').length,
      totalRelawan: relawanList.length,
      aktifRelawan: relawanList.filter((r) => getEffectiveStatus(r, nowMs) === 'Aktif').length,
      totalAll,
      aktifAll,
      belumAktifAll: totalAll - aktifAll,
    };
  }, [records, nowMs]);

  const validGpsRecords = useMemo(
    () =>
      filteredRecords.filter(
        (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number'
      ),
    [filteredRecords]
  );

  const selectedRecord = useMemo(
    () => validGpsRecords.find((r) => r.userId === selectedUserId) || null,
    [validGpsRecords, selectedUserId]
  );

  const focusedRecord = useMemo(
    () => validGpsRecords.find((r) => r.userId === focusRequestId) || null,
    [validGpsRecords, focusRequestId]
  );

  const initialCenter = useMemo(() => {
    const first = validGpsRecords[0];
    if (first && typeof first.latitude === 'number' && typeof first.longitude === 'number') {
      return { lat: first.latitude, lng: first.longitude };
    }
    return null;
  }, [validGpsRecords]);

  const handleFocusMarker = (rec: EnrichedLiveLocationRecord) => {
    if (rec.latitude === null || rec.longitude === null) return;
    setSelectedUserId(rec.userId);
    setFocusRequestId(rec.userId);
    mapContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const getRoleColorClasses = (role: TrackedRole) => {
    if (role === 'Korwil') {
      return {
        dot: 'bg-blue-600',
        ping: 'bg-blue-400',
        badge: 'bg-blue-100 text-blue-700',
        pill: 'bg-blue-700 text-white border-blue-800',
      };
    }
    if (role === 'Korcam') {
      return {
        dot: 'bg-emerald-600',
        ping: 'bg-emerald-400',
        badge: 'bg-emerald-100 text-emerald-700',
        pill: 'bg-emerald-700 text-white border-emerald-800',
      };
    }
    return {
      dot: 'bg-amber-500',
      ping: 'bg-amber-400',
      badge: 'bg-amber-100 text-amber-800',
      pill: 'bg-slate-900 text-white border-slate-700',
    };
  };

  const headerTitle = isFullAccess
    ? 'Monitoring Relawan, Korcam & Korwil'
    : isKorwil
    ? 'Monitoring Relawan & Korcam'
    : 'Monitoring Relawan';

  const headerSubtitle = isFullAccess
    ? 'Pantau titik Share Live Location GPS seluruh Korwil, Korcam, dan Relawan secara real-time lintas perangkat.'
    : isKorwil
    ? 'Pantau titik Share Live Location GPS seluruh Korcam dan Relawan di wilayah koordinasi Anda secara real-time.'
    : 'Pantau titik Share Live Location GPS seluruh Relawan di bawah koordinasi Anda secara real-time.';

  const showCoordinatorCol = isFullAccess || isKorwil;

  return (
    <div className="space-y-5 bg-white text-gray-900">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Share Live Location Real-Time</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{headerSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleRefreshData}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Menyegarkan...' : 'Refresh Lokasi'}</span>
        </button>
      </div>

      {/* Ringkasan Status */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isFullAccess ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Korwil (Live GPS)</div>
              <div className="mt-1 text-2xl font-bold text-blue-600 tabular-nums">
                {stats.aktifKorwil}{' '}
                <span className="text-sm font-normal text-gray-400">/ {stats.totalKorwil}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Korcam (Live GPS)</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
                {stats.aktifKorcam}{' '}
                <span className="text-sm font-normal text-gray-400">/ {stats.totalKorcam}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Relawan (Live GPS)</div>
              <div className="mt-1 text-2xl font-bold text-amber-600 tabular-nums">
                {stats.aktifRelawan}{' '}
                <span className="text-sm font-normal text-gray-400">/ {stats.totalRelawan}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Total Titik di Peta</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
                {validGpsRecords.length}
              </div>
            </div>
          </>
        ) : isKorwil ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Korcam (Live GPS)</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
                {stats.aktifKorcam}{' '}
                <span className="text-sm font-normal text-gray-400">/ {stats.totalKorcam}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Relawan (Live GPS)</div>
              <div className="mt-1 text-2xl font-bold text-amber-600 tabular-nums">
                {stats.aktifRelawan}{' '}
                <span className="text-sm font-normal text-gray-400">/ {stats.totalRelawan}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Belum Aktif / Terhenti</div>
              <div className="mt-1 text-2xl font-bold text-gray-600 tabular-nums">
                {stats.belumAktifAll}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Titik di Peta</div>
              <div className="mt-1 text-2xl font-bold text-blue-600 tabular-nums">
                {validGpsRecords.length}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Total Relawan Binaan</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
                {stats.totalRelawan}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Relawan Live Terhubung</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
                {stats.aktifRelawan}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Belum Aktif / Terhenti</div>
              <div className="mt-1 text-2xl font-bold text-gray-600 tabular-nums">
                {stats.belumAktifAll}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Titik di Peta</div>
              <div className="mt-1 text-2xl font-bold text-blue-600 tabular-nums">
                {validGpsRecords.length}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isFullAccess
              ? 'Cari nama Korwil / Korcam / Relawan atau Kelurahan...'
              : isKorwil
              ? 'Cari nama Korcam / Relawan atau Kelurahan...'
              : 'Cari nama Relawan atau Kelurahan...'
          }
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        {!isKorcam && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'Semua' | TrackedRole)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="Semua">Semua Role</option>
            {isFullAccess && <option value="Korwil">Korwil</option>}
            <option value="Korcam">Korcam</option>
            <option value="Relawan">Relawan</option>
          </select>
        )}

        {isFullAccess && (
          <select
            value={korwilFilter}
            onChange={(e) => setKorwilFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="Semua">Semua Korwil</option>
            {korwilOptions.map((t) => (
              <option key={t.id} value={t.id}>
                Korwil: {t.nama}
              </option>
            ))}
          </select>
        )}

        {(isFullAccess || isKorwil) && korcamOptions.length > 0 && (
          <select
            value={korcamFilter}
            onChange={(e) => setKorcamFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="Semua">Semua Korcam</option>
            {korcamOptions.map((k) => (
              <option key={k.id} value={k.id}>
                Korcam: {k.nama}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as 'Semua' | 'Aktif' | 'Sinyal Terhenti' | 'Belum Aktif'
            )
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="Semua">Semua Status GPS</option>
          <option value="Aktif">Live Terhubung</option>
          <option value="Sinyal Terhenti">Sinyal Terhenti (&gt;10 mnt)</option>
          <option value="Belum Aktif">Belum Aktif / Ditolak</option>
        </select>
      </div>

      {/* Peta Monitoring */}
      <div
        ref={mapContainerRef}
        className="relative h-[440px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
      >
        {initialCenter && validGpsRecords.length > 0 ? (
          <SwarakuMapsProvider
            fallback={
              <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50 p-6 text-center text-gray-600">
                <p className="text-sm font-semibold text-gray-800">
                  Peta Google Maps tidak dapat dimuat pada domain ini
                </p>
                <p className="mt-1 max-w-md text-xs text-gray-500">
                  Data titik koordinat GPS real-time tetap tampil pada tabel di bawah ini.
                </p>
              </div>
            }
          >
            <GoogleMap
              defaultCenter={initialCenter}
              defaultZoom={14}
              mapId="SWARAKU_LIVE_MONITORING_MAP"
              gestureHandling="greedy"
              mapTypeControl={false}
              streetViewControl={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="h-full w-full"
            >
              <MapViewportController
                records={validGpsRecords}
                focusedRecord={focusedRecord}
              />

              {validGpsRecords.map((rec) => {
                const colors = getRoleColorClasses(rec.role);
                const eff = getEffectiveStatus(rec, nowMs);
                const isLive = eff === 'Aktif';
                const shortName = rec.nama.split(' ').slice(0, 2).join(' ');

                return (
                  <AdvancedMarker
                    key={rec.userId}
                    position={{
                      lat: rec.latitude as number,
                      lng: rec.longitude as number,
                    }}
                    title={`${rec.nama} (${rec.role}) · ${eff}`}
                    onClick={() => setSelectedUserId(rec.userId)}
                  >
                    <div className="flex flex-col items-center cursor-pointer select-none">
                      <span
                        className={`mb-1 px-2 py-0.5 rounded-md border text-[10px] font-bold shadow-sm whitespace-nowrap ${colors.pill}`}
                      >
                        {shortName}
                      </span>
                      <div className="relative flex items-center justify-center">
                        {isLive && (
                          <span
                            className={`absolute inline-flex h-7 w-7 rounded-full opacity-50 animate-ping ${colors.ping}`}
                          />
                        )}
                        <div
                          className={`relative h-4 w-4 rounded-full border-2 border-white shadow-md ${
                            isLive ? colors.dot : 'bg-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {selectedRecord &&
                typeof selectedRecord.latitude === 'number' &&
                typeof selectedRecord.longitude === 'number' && (
                  <InfoWindow
                    position={{
                      lat: selectedRecord.latitude,
                      lng: selectedRecord.longitude,
                    }}
                    onCloseClick={() => setSelectedUserId(null)}
                  >
                    <div className="min-w-[230px] space-y-1.5 text-gray-900">
                      <div className="text-sm font-bold">{selectedRecord.nama}</div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            getRoleColorClasses(selectedRecord.role).badge
                          }`}
                        >
                          {selectedRecord.role}
                        </span>
                        <span
                          className={`font-semibold ${
                            getEffectiveStatus(selectedRecord, nowMs) === 'Aktif'
                              ? 'text-emerald-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {getEffectiveStatus(selectedRecord, nowMs) === 'Aktif'
                            ? 'Live Terhubung'
                            : getEffectiveStatus(selectedRecord, nowMs)}
                        </span>
                      </div>
                      {(selectedRecord.kelurahan || selectedRecord.kecamatan) && (
                        <div className="text-xs text-gray-700">
                          <strong>Wilayah:</strong>{' '}
                          {[
                            selectedRecord.kelurahan ? `Kel. ${selectedRecord.kelurahan}` : '',
                            selectedRecord.kecamatan ? `Kec. ${selectedRecord.kecamatan}` : '',
                            selectedRecord.kota || '',
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      {selectedRecord.namaTimSukses && (
                        <div className="text-xs text-gray-700">
                          <strong>Korwil:</strong> {selectedRecord.namaTimSukses}
                        </div>
                      )}
                      {selectedRecord.namaKorcam && (
                        <div className="text-xs text-gray-700">
                          <strong>Korcam:</strong> {selectedRecord.namaKorcam}
                        </div>
                      )}
                      <div className="text-xs text-gray-700">
                        <strong>Koordinat:</strong>{' '}
                        {selectedRecord.address ||
                          `${selectedRecord.latitude.toFixed(6)}, ${selectedRecord.longitude.toFixed(6)}`}
                      </div>
                      {selectedRecord.accuracy !== null && (
                        <div className="text-[11px] text-gray-500">
                          Akurasi GPS: ±{selectedRecord.accuracy} meter
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500">
                        Update: {formatRelativeTime(selectedRecord.lastUpdated, nowMs)} (
                        {formatWib(selectedRecord.lastUpdated)})
                      </div>
                      <div className="pt-1.5">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRecord.latitude},${selectedRecord.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Rute Google Maps</span>
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
            </GoogleMap>
          </SwarakuMapsProvider>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 p-4">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm text-gray-600 shadow-xs max-w-md space-y-1">
              <p className="font-semibold text-gray-800">
                {loading
                  ? 'Memuat data Share Live Location real-time...'
                  : 'Belum ada titik lokasi GPS aktif yang sesuai filter saat ini.'}
              </p>
              {!loading && (
                <p className="text-xs text-gray-500">
                  Titik live akan langsung muncul di peta saat{' '}
                  {isKorcam ? 'Relawan binaan' : 'Korcam atau Relawan'} mengaktifkan izin GPS pada perangkatnya.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow">
          {isFullAccess && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
              Korwil
            </span>
          )}
          {(isFullAccess || isKorwil) && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" />
              Korcam
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
            Relawan
          </span>
        </div>
      </div>

      {/* Tabel Daftar Monitoring */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama &amp; Wilayah</th>
              <th className="px-4 py-3">Role</th>
              {showCoordinatorCol && <th className="px-4 py-3">Koordinator</th>}
              <th className="px-4 py-3">Status Live GPS</th>
              <th className="px-4 py-3">Lokasi / Koordinat</th>
              <th className="px-4 py-3">Update Terakhir</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={showCoordinatorCol ? 7 : 6}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  Memuat data lokasi real-time...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={showCoordinatorCol ? 7 : 6}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  {records.length === 0
                    ? isKorcam
                      ? 'Belum ada akun Relawan binaan yang terdaftar di wilayah Anda.'
                      : isKorwil
                      ? 'Belum ada akun Korcam atau Relawan binaan yang terdaftar di wilayah Anda.'
                      : 'Belum ada data personel yang terpantau.'
                    : 'Tidak ada data yang cocok dengan filter pencarian.'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const eff = getEffectiveStatus(rec, nowMs);
                const hasCoords =
                  typeof rec.latitude === 'number' &&
                  typeof rec.longitude === 'number';

                const badgeStyle =
                  eff === 'Aktif'
                    ? 'bg-emerald-100 text-emerald-800'
                    : eff === 'Sinyal Terhenti'
                    ? 'bg-amber-100 text-amber-800'
                    : eff === 'Ditolak'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-gray-100 text-gray-600';

                const roleColor = getRoleColorClasses(rec.role);
                const wilayahStr =
                  [
                    rec.kelurahan ? `Kel. ${rec.kelurahan}` : '',
                    rec.kecamatan ? `Kec. ${rec.kecamatan}` : '',
                    rec.kota || '',
                  ]
                    .filter(Boolean)
                    .join(', ') || rec.wilayah || '';

                const relTime = formatRelativeTime(rec.lastUpdated, nowMs);

                return (
                  <tr key={rec.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{rec.nama}</div>
                      {wilayahStr && (
                        <div className="text-[11px] text-gray-500 mt-0.5">{wilayahStr}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor.badge}`}
                      >
                        {rec.role}
                      </span>
                    </td>

                    {showCoordinatorCol && (
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {rec.namaKorcam
                          ? `Korcam: ${rec.namaKorcam}`
                          : rec.namaTimSukses
                          ? `Korwil: ${rec.namaTimSukses}`
                          : '-'}
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
                      >
                        {eff === 'Aktif' && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <span>
                          {eff === 'Aktif'
                            ? 'Live Terhubung'
                            : eff === 'Sinyal Terhenti'
                            ? 'Sinyal Terhenti (>10 mnt)'
                            : eff === 'Ditolak'
                            ? 'Izin GPS Ditolak'
                            : 'Belum Aktif'}
                        </span>
                      </span>
                    </td>

                    <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-600">
                      {rec.address
                        ? rec.address
                        : hasCoords
                        ? `${rec.latitude?.toFixed(6)}, ${rec.longitude?.toFixed(6)}`
                        : 'Menunggu sinyal GPS'}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {relTime ? (
                        <div>
                          <div className="font-semibold text-gray-800">{relTime}</div>
                          <div className="text-[10px] text-gray-400">
                            {formatWib(rec.lastUpdated)}
                          </div>
                        </div>
                      ) : (
                        <span>Belum pernah aktif</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!hasCoords}
                          onClick={() => handleFocusMarker(rec)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Lihat di Peta</span>
                        </button>
                        {hasCoords && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${rec.latitude},${rec.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            title="Buka rute di Google Maps"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Rute</span>
                          </a>
                        )}
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
  );
};

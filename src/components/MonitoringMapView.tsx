import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  fetchLocationsOnce,
  isFullMonitorRole,
  subscribeLocations,
  type LiveLocationRecord,
  type TrackedRole,
  type UserRole,
} from '../services/locationService';
import { SwarakuMapsProvider } from './maps/SwarakuMapsProvider';

interface MonitoringMapViewProps {
  currentUser: {
    id: string;
    nama: string;
    role: UserRole;
  };
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
  if (!d) return '-';
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

const MapViewportController: React.FC<{
  records: LiveLocationRecord[];
  focusedRecord: LiveLocationRecord | null;
}> = ({ records, focusedRecord }) => {
  const map = useMap();

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

    if (records.length === 0) return;

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
}) => {
  const isFullAccess = isFullMonitorRole(currentUser.role);

  const [records, setRecords] = useState<LiveLocationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'Semua' | TrackedRole>('Semua');
  const [korwilFilter, setKorwilFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<
    'Semua' | 'Aktif' | 'Sinyal Terhenti' | 'Belum Aktif'
  >('Semua');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [focusRequestId, setFocusRequestId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeLocations(
      currentUser.role,
      currentUser.id,
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [currentUser.role, currentUser.id, refreshTick]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshData = async () => {
    setRefreshing(true);
    setNowMs(Date.now());
    try {
      const fresh = await fetchLocationsOnce(currentUser.role, currentUser.id);
      setRecords(fresh);
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

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((rec) => {
      if (q && !rec.nama.toLowerCase().includes(q) && !(rec.address || '').toLowerCase().includes(q)) {
        return false;
      }

      if (roleFilter !== 'Semua' && rec.role !== roleFilter) {
        return false;
      }

      if (isFullAccess && korwilFilter !== 'Semua') {
        const matchKorwil =
          rec.userId === korwilFilter || rec.timSuksesId === korwilFilter;
        if (!matchKorwil) return false;
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
  }, [records, search, isFullAccess, roleFilter, korwilFilter, statusFilter, nowMs]);

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

  const handleFocusMarker = (rec: LiveLocationRecord) => {
    if (rec.latitude === null || rec.longitude === null) return;
    setSelectedUserId(rec.userId);
    setFocusRequestId(rec.userId);
    mapContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const getRoleColorClasses = (role: TrackedRole) => {
    if (role === 'Korwil') return { dot: 'bg-blue-600 h-5 w-5', badge: 'bg-blue-100 text-blue-700' };
    if (role === 'Korcam') return { dot: 'bg-emerald-600 h-4 w-4', badge: 'bg-emerald-100 text-emerald-700' };
    return { dot: 'bg-amber-500 h-4 w-4', badge: 'bg-amber-100 text-amber-800' };
  };

  return (
    <div className="space-y-5 bg-white text-gray-900">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isFullAccess
              ? 'Monitoring Relawan, Korcam & Korwil'
              : 'Monitoring Relawan'}
          </h1>
          <p className="text-sm text-gray-500">
            Pantau titik lokasi GPS aktif secara real-time lintas perangkat.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshData}
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
        >
          {refreshing ? 'Menyegarkan...' : 'Refresh Data'}
        </button>
      </div>

      {/* Ringkasan Status */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isFullAccess ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Korwil (GPS Aktif)</div>
              <div className="mt-1 text-2xl font-bold text-blue-600 tabular-nums">
                {stats.aktifKorwil}{' '}
                <span className="text-sm font-normal text-gray-400">/ {stats.totalKorwil}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Korcam (GPS Aktif)</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
                {stats.aktifKorcam}{' '}
                <span className="text-sm font-normal text-gray-400">/ {stats.totalKorcam}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Relawan (GPS Aktif)</div>
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
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">Total Personel Terpantau</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
                {stats.totalAll}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">GPS Aktif</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
                {stats.aktifAll}
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
              ? 'Cari nama Korwil / Korcam / Relawan...'
              : 'Cari nama Relawan / Korcam...'
          }
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

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
          <option value="Aktif">GPS Aktif</option>
          <option value="Sinyal Terhenti">Sinyal Terhenti (&gt;10 mnt)</option>
          <option value="Belum Aktif">Belum Aktif / Ditolak</option>
        </select>
      </div>

      {/* Peta Monitoring */}
      <div
        ref={mapContainerRef}
        className="relative h-[420px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
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
              className="h-full w-full"
            >
              <MapViewportController
                records={validGpsRecords}
                focusedRecord={focusedRecord}
              />

              {validGpsRecords.map((rec) => {
                const colors = getRoleColorClasses(rec.role);
                return (
                  <AdvancedMarker
                    key={rec.userId}
                    position={{
                      lat: rec.latitude as number,
                      lng: rec.longitude as number,
                    }}
                    title={`${rec.nama} (${rec.role})`}
                    onClick={() => setSelectedUserId(rec.userId)}
                  >
                    <div
                      className={`flex items-center justify-center rounded-full border-2 border-white shadow-md cursor-pointer ${colors.dot}`}
                    />
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
                    <div className="min-w-[210px] space-y-1.5 text-gray-900">
                      <div className="text-sm font-bold">{selectedRecord.nama}</div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            getRoleColorClasses(selectedRecord.role).badge
                          }`}
                        >
                          {selectedRecord.role}
                        </span>
                        <span className="text-gray-600">
                          {getEffectiveStatus(selectedRecord, nowMs)}
                        </span>
                      </div>
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
                        <strong>Lokasi:</strong>{' '}
                        {selectedRecord.address ||
                          `${selectedRecord.latitude.toFixed(6)}, ${selectedRecord.longitude.toFixed(6)}`}
                      </div>
                      {selectedRecord.accuracy !== null && (
                        <div className="text-[11px] text-gray-500">
                          Akurasi: ±{selectedRecord.accuracy} meter
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500">
                        Update: {formatWib(selectedRecord.lastUpdated)}
                      </div>
                    </div>
                  </InfoWindow>
                )}
            </GoogleMap>
          </SwarakuMapsProvider>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 p-4">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-xs">
              {loading
                ? 'Memuat data lokasi real-time...'
                : 'Belum ada titik lokasi GPS aktif yang sesuai filter saat ini.'}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-4 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow">
          {isFullAccess && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
              Korwil
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" />
            Korcam
          </span>
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
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Role</th>
              {isFullAccess && <th className="px-4 py-3">Koordinator</th>}
              <th className="px-4 py-3">Status GPS</th>
              <th className="px-4 py-3">Lokasi / Koordinat</th>
              <th className="px-4 py-3">Update Terakhir</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={isFullAccess ? 7 : 6}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  Memuat data lokasi...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={isFullAccess ? 7 : 6}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  Tidak ada data yang cocok.
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
                    ? 'bg-green-100 text-green-700'
                    : eff === 'Sinyal Terhenti'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-600';

                const roleColor = getRoleColorClasses(rec.role);

                return (
                  <tr key={rec.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {rec.nama}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor.badge}`}
                      >
                        {rec.role}
                      </span>
                    </td>

                    {isFullAccess && (
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
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyle}`}
                      >
                        {eff === 'Sinyal Terhenti'
                          ? 'Sinyal Terhenti (>10 mnt)'
                          : eff}
                      </span>
                    </td>

                    <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-600">
                      {rec.address
                        ? rec.address
                        : hasCoords
                        ? `${rec.latitude?.toFixed(6)}, ${rec.longitude?.toFixed(6)}`
                        : '-'}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {formatWib(rec.lastUpdated)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={!hasCoords}
                        onClick={() => handleFocusMarker(rec)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        Lihat di Peta
                      </button>
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

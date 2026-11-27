import React, { useEffect, useMemo, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  RefreshCw,
  MapPin,
  Navigation,
  AlertTriangle,
  WifiOff,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Radio,
} from 'lucide-react';
import {
  fetchKaderLocationsOnce,
  isKaderSignalStale,
  subscribeKaderLocations,
  type KaderLocationRecord,
} from '../../services/kaderLocationService';
import {
  SwarakuMapsProvider,
  SwarakuMapsDiagnosticNotice,
} from '../maps/SwarakuMapsProvider';

interface MonitoringKaderViewProps {
  onNotify?: (msg: string) => void;
}

type StatusFilter = 'semua' | 'aktif' | 'terhenti' | 'ditolak' | 'tidak_aktif';

function formatRelativeAge(lastUpdatedMs: number, nowMs: number): string {
  if (!lastUpdatedMs) return 'Belum tercatat';
  const diffSec = Math.max(0, Math.floor((nowMs - lastUpdatedMs) / 1000));
  if (diffSec < 60) return `${diffSec} dtk lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

const MapFocusController: React.FC<{ target: KaderLocationRecord | null }> = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    if (typeof target.latitude !== 'number' || typeof target.longitude !== 'number') return;
    map.panTo({ lat: target.latitude, lng: target.longitude });
    map.setZoom(16);
  }, [map, target]);

  return null;
};

export const MonitoringKaderView: React.FC<MonitoringKaderViewProps> = ({ onNotify }) => {
  const [records, setRecords] = useState<KaderLocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [selectedKaderId, setSelectedKaderId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Real-time Firestore listener (onSnapshot) dengan pembersihan otomatis saat keluar halaman
  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);

    const unsubscribe = subscribeKaderLocations(
      (nextRecords) => {
        setRecords(nextRecords);
        setLoading(false);
        setErrorMsg(null);
      },
      (err) => {
        setLoading(false);
        setErrorMsg(
          err.message || 'Gagal menyambungkan listener real-time ke koleksi kader_locations.'
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Ticker ringan tiap 30 detik agar indikator "Sinyal Terhenti (>10 mnt)" selalu akurat
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const fresh = await fetchKaderLocationsOnce();
      setRecords(fresh);
      setNowMs(Date.now());
      onNotify?.(`Data GPS Kader diperbarui (${fresh.length} akun terpantau).`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyegarkan data lokasi Kader.';
      setErrorMsg(message);
      onNotify?.('Gagal menyegarkan data GPS Kader dari Firestore.');
    } finally {
      setRefreshing(false);
    }
  };

  const summary = useMemo(() => {
    let aktif = 0;
    let terhenti = 0;
    let ditolak = 0;
    let tidakAktif = 0;

    records.forEach((rec) => {
      if (isKaderSignalStale(rec, nowMs)) {
        terhenti += 1;
      } else if (rec.gpsStatus === 'Aktif') {
        aktif += 1;
      } else if (rec.gpsStatus === 'Ditolak') {
        ditolak += 1;
      } else {
        tidakAktif += 1;
      }
    });

    return {
      total: records.length,
      aktif,
      terhenti,
      ditolak,
      tidakAktif,
    };
  }, [records, nowMs]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((rec) => {
      const stale = isKaderSignalStale(rec, nowMs);
      if (statusFilter === 'aktif' && !(rec.gpsStatus === 'Aktif' && !stale)) return false;
      if (statusFilter === 'terhenti' && !stale) return false;
      if (statusFilter === 'ditolak' && rec.gpsStatus !== 'Ditolak') return false;
      if (statusFilter === 'tidak_aktif' && rec.gpsStatus !== 'Tidak Aktif') return false;

      if (!q) return true;
      return (
        rec.namaKader.toLowerCase().includes(q) ||
        rec.userId.toLowerCase().includes(q) ||
        rec.address.toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, statusFilter, nowMs]);

  // Hanya tampilkan marker untuk Kader yang memiliki koordinat GPS asli dari perangkat
  const locatedRecords = useMemo(
    () =>
      filteredRecords.filter(
        (rec) => typeof rec.latitude === 'number' && typeof rec.longitude === 'number'
      ),
    [filteredRecords]
  );

  const selectedRecord = useMemo(
    () => locatedRecords.find((r) => r.userId === selectedKaderId) || null,
    [locatedRecords, selectedKaderId]
  );

  const mapCenter = useMemo(() => {
    if (
      selectedRecord &&
      typeof selectedRecord.latitude === 'number' &&
      typeof selectedRecord.longitude === 'number'
    ) {
      return { lat: selectedRecord.latitude, lng: selectedRecord.longitude };
    }
    const first = locatedRecords[0];
    if (first && typeof first.latitude === 'number' && typeof first.longitude === 'number') {
      return { lat: first.latitude, lng: first.longitude };
    }
    return null;
  }, [locatedRecords, selectedRecord]);

  const renderStatusBadge = (rec: KaderLocationRecord) => {
    const stale = isKaderSignalStale(rec, nowMs);
    if (stale) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Sinyal Terhenti (&gt;10 mnt)</span>
        </span>
      );
    }

    if (rec.gpsStatus === 'Aktif') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Aktif</span>
        </span>
      );
    }

    if (rec.gpsStatus === 'Ditolak') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold">
          <WifiOff className="w-3.5 h-3.5 text-rose-700 shrink-0" />
          <span>Ditolak</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Tidak Aktif</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">
              Monitoring Kader (GPS Real-Time)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pemantauan posisi GPS langsung lintas perangkat dari koleksi Cloud Firestore{' '}
            <span className="font-mono text-slate-700">kader_locations</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Menyegarkan...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Ringkasan Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-500">Total Kader Terpantau</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums mt-1">{summary.total}</p>
        </div>
        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50">
          <p className="text-xs font-semibold text-emerald-800">GPS Aktif</p>
          <p className="text-2xl font-black text-emerald-900 tabular-nums mt-1">{summary.aktif}</p>
        </div>
        <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60">
          <p className="text-xs font-semibold text-amber-900">Sinyal Terhenti (&gt;10 mnt)</p>
          <p className="text-2xl font-black text-amber-900 tabular-nums mt-1">
            {summary.terhenti}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-600">Ditolak / Tidak Aktif</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums mt-1">
            {summary.ditolak + summary.tidakAktif}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Peta Posisi GPS Kader Asli (Hanya jika ada koordinat real dari perangkat) */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
        {mapCenter && locatedRecords.length > 0 ? (
          <div className="w-full h-[340px] sm:h-[400px]">
            <SwarakuMapsProvider
              fallback={
                <div className="w-full h-full flex flex-col justify-center p-4 sm:p-6 overflow-y-auto bg-slate-50">
                  <SwarakuMapsDiagnosticNotice
                    title="Peta Google Maps tidak dapat dimuat pada domain ini"
                    subtitle="Koordinat GPS asli dari seluruh Kader tetap tersinkronisasi secara real-time di daftar bawah ini."
                  />
                </div>
              }
            >
              <GoogleMap
                defaultCenter={mapCenter}
                defaultZoom={14}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                <MapFocusController target={selectedRecord} />
                {locatedRecords.map((rec) => {
                  const stale = isKaderSignalStale(rec, nowMs);
                  const pinBg = stale
                    ? 'bg-amber-500 border-amber-900 text-slate-950'
                    : rec.gpsStatus === 'Aktif'
                    ? 'bg-emerald-600 border-white text-white'
                    : 'bg-slate-600 border-white text-white';

                  return (
                    <AdvancedMarker
                      key={rec.userId}
                      position={{ lat: rec.latitude!, lng: rec.longitude! }}
                      onClick={() => setSelectedKaderId(rec.userId)}
                    >
                      <div
                        className={`px-2.5 py-1 rounded-full border-2 shadow-md text-[11px] font-extrabold flex items-center gap-1 cursor-pointer ${pinBg}`}
                      >
                        <Navigation className="w-3 h-3 shrink-0" />
                        <span className="max-w-[120px] truncate">{rec.namaKader}</span>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {selectedRecord &&
                  typeof selectedRecord.latitude === 'number' &&
                  typeof selectedRecord.longitude === 'number' && (
                    <InfoWindow
                      position={{ lat: selectedRecord.latitude, lng: selectedRecord.longitude }}
                      onCloseClick={() => setSelectedKaderId(null)}
                    >
                      <div className="p-1 max-w-[240px] space-y-1.5 text-slate-900">
                        <p className="text-xs font-extrabold">{selectedRecord.namaKader}</p>
                        <div>{renderStatusBadge(selectedRecord)}</div>
                        <p className="text-[11px] font-mono text-slate-600">
                          {selectedRecord.latitude.toFixed(6)}, {selectedRecord.longitude.toFixed(6)}
                        </p>
                        {typeof selectedRecord.accuracy === 'number' && (
                          <p className="text-[11px] text-slate-500">
                            Akurasi: ±{selectedRecord.accuracy} meter
                          </p>
                        )}
                        {selectedRecord.address && (
                          <p className="text-[11px] text-slate-600">{selectedRecord.address}</p>
                        )}
                        <p className="text-[11px] text-slate-500">
                          Update: {selectedRecord.lastUpdatedWib}
                        </p>
                      </div>
                    </InfoWindow>
                  )}
              </GoogleMap>
            </SwarakuMapsProvider>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {loading
                ? 'Menghubungkan ke database lokasi GPS Kader...'
                : 'Belum ada koordinat GPS aktif yang diterima dari perangkat Kader'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Titik lokasi akan muncul otomatis di peta segera setelah Kader login di perangkatnya
              dan menyetujui izin akses lokasi GPS.
            </p>
          </div>
        )}
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama Kader, ID, atau alamat..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'aktif', label: 'Aktif' },
              { id: 'terhenti', label: 'Sinyal Terhenti' },
              { id: 'ditolak', label: 'Ditolak' },
              { id: 'tidak_aktif', label: 'Tidak Aktif' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel / Daftar Real-Time Lokasi Kader */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">
          Memuat data real-time dari Firestore...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 space-y-1.5">
          <p className="text-sm font-bold text-slate-800">
            Belum ada data lokasi Kader yang cocok
          </p>
          <p className="text-xs text-slate-500">
            Pastikan akun Kader sudah login dan mengizinkan lokasi GPS pada browser perangkatnya.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Kader</th>
                <th className="py-3 px-4">Status GPS</th>
                <th className="py-3 px-4">Koordinat &amp; Akurasi</th>
                <th className="py-3 px-4">Alamat</th>
                <th className="py-3 px-4">Pembaruan Terakhir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((rec) => {
                const hasCoords =
                  typeof rec.latitude === 'number' && typeof rec.longitude === 'number';
                const isSelected = selectedKaderId === rec.userId;

                return (
                  <tr
                    key={rec.userId}
                    className={`transition-colors ${
                      isSelected ? 'bg-cyan-50/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 align-top">
                      <p className="font-extrabold text-slate-900">{rec.namaKader}</p>
                      <p className="text-[11px] font-mono text-slate-500">{rec.userId}</p>
                    </td>
                    <td className="py-3 px-4 align-top">{renderStatusBadge(rec)}</td>
                    <td className="py-3 px-4 align-top">
                      {hasCoords ? (
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-slate-800 tabular-nums">
                            {rec.latitude!.toFixed(6)}, {rec.longitude!.toFixed(6)}
                          </p>
                          {typeof rec.accuracy === 'number' && (
                            <p className="text-[11px] text-slate-500 tabular-nums">
                              Akurasi ±{rec.accuracy} m
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum ada koordinat</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top max-w-[240px]">
                      <p className="text-slate-700 leading-relaxed">
                        {rec.address || <span className="text-slate-400">-</span>}
                      </p>
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <p className="font-semibold text-slate-800 tabular-nums">
                        {rec.lastUpdatedWib}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {formatRelativeAge(rec.lastUpdatedMs, nowMs)}
                      </p>
                    </td>
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      {hasCoords ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedKaderId(rec.userId)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer"
                          >
                            Fokus Peta
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <span>Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
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
  );
};

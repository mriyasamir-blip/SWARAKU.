import React, { useEffect, useMemo, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Users,
  Building2,
  LocateFixed,
  Layers,
  UserCheck,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import type { VoterOcrRecord } from '../../types/vore';
import { lookupSmartCoordinates } from '../../utils/geocoding';
import { isRealGpsCoordinate } from '../../services/geolocationTrackerService';
import { resolveVoterProvinsi } from '../../utils/hierarchyAccess';
import {
  SwarakuMapsProvider,
  SwarakuMapsDiagnosticNotice,
} from '../maps/SwarakuMapsProvider';

// ============================================================================
// SWARAKU — PETA SUARA GOOGLE MAPS VIEW (MURNI KONSTITUEN / VOTERS)
// - Zero dummy / sample / non-voter layers
// - Zero referensi Dapil
// - Marker klaster Kelurahan/Kecamatan & titik konstituen sesuai filter aktif
// ============================================================================

const INDONESIA_CENTER = { lat: -2.5489, lng: 118.0149 };

export interface VoterMapCluster {
  key: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  lat: number;
  lng: number;
  voters: VoterOcrRecord[];
}

interface PetaSuaraGoogleMapsViewProps {
  voters: VoterOcrRecord[];
  selectedKecamatan?: string;
  selectedKelurahan?: string;
  focusVoter?: VoterOcrRecord | null;
  onSelectCluster?: (cluster: VoterMapCluster) => void;
}

function resolveVoterDisplayCoords(v: VoterOcrRecord): { lat: number; lng: number } | null {
  if (isRealGpsCoordinate(v.lat, v.lng)) {
    return { lat: v.lat!, lng: v.lng! };
  }
  const smart = lookupSmartCoordinates(v.kelurahan, v.kecamatan, v.kabupatenKota);
  if (smart && isRealGpsCoordinate(smart.lat, smart.lng)) {
    return { lat: smart.lat, lng: smart.lng };
  }
  return null;
}

const MapViewportSync: React.FC<{
  clusters: VoterMapCluster[];
  focusCoords: { lat: number; lng: number } | null;
  fitNonce: number;
}> = ({ clusters, focusCoords, fitNonce }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (focusCoords) {
      map.panTo(focusCoords);
      map.setZoom(15);
      return;
    }

    if (clusters.length === 0) {
      map.panTo(INDONESIA_CENTER);
      map.setZoom(5);
      return;
    }

    if (clusters.length === 1) {
      map.panTo({ lat: clusters[0].lat, lng: clusters[0].lng });
      map.setZoom(13);
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
      clusters.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
      map.fitBounds(bounds as Parameters<typeof map.fitBounds>[0], 60);
    }
  }, [map, clusters, focusCoords, fitNonce]);

  return null;
};

export const PetaSuaraGoogleMapsView: React.FC<PetaSuaraGoogleMapsViewProps> = ({
  voters,
  selectedKecamatan,
  selectedKelurahan,
  focusVoter,
  onSelectCluster,
}) => {
  const [activeClusterKey, setActiveClusterKey] = useState<string | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [fitNonce, setFitNonce] = useState(0);

  // Kelompokkan voters per Kelurahan / Kecamatan secara dinamis untuk pin peta yang rapi
  const clusters = useMemo<VoterMapCluster[]>(() => {
    const grouped = new Map<
      string,
      {
        provinsi: string;
        kota: string;
        kecamatan: string;
        kelurahan: string;
        latSum: number;
        lngSum: number;
        coordCount: number;
        voters: VoterOcrRecord[];
      }
    >();

    voters.forEach((v) => {
      const prov = resolveVoterProvinsi(v);
      const kota = (v.kabupatenKota || '').trim() || 'Kota/Kab. Belum Diisi';
      const kec = (v.kecamatan || '').trim() || 'Kecamatan Belum Diisi';
      const kel = (v.kelurahan || '').trim() || kec;
      const key = `${prov.toLowerCase()}|${kota.toLowerCase()}|${kec.toLowerCase()}|${kel.toLowerCase()}`;

      const coords = resolveVoterDisplayCoords(v);
      const existing = grouped.get(key);
      if (existing) {
        existing.voters.push(v);
        if (coords) {
          existing.latSum += coords.lat;
          existing.lngSum += coords.lng;
          existing.coordCount += 1;
        }
      } else {
        grouped.set(key, {
          provinsi: prov,
          kota,
          kecamatan: kec,
          kelurahan: kel,
          latSum: coords ? coords.lat : 0,
          lngSum: coords ? coords.lng : 0,
          coordCount: coords ? 1 : 0,
          voters: [v],
        });
      }
    });

    const result: VoterMapCluster[] = [];
    grouped.forEach((entry, key) => {
      if (entry.coordCount > 0) {
        result.push({
          key,
          provinsi: entry.provinsi,
          kota: entry.kota,
          kecamatan: entry.kecamatan,
          kelurahan: entry.kelurahan,
          lat: entry.latSum / entry.coordCount,
          lng: entry.lngSum / entry.coordCount,
          voters: entry.voters,
        });
      }
    });

    return result.sort((a, b) => b.voters.length - a.voters.length);
  }, [voters]);

  const activeCluster = useMemo(
    () => clusters.find((c) => c.key === activeClusterKey) || null,
    [clusters, activeClusterKey]
  );

  // Jika ada focusVoter dari tabel, arahkan ke klaster voter tersebut
  const focusCoords = useMemo(() => {
    if (!focusVoter) return null;
    return resolveVoterDisplayCoords(focusVoter);
  }, [focusVoter]);

  // Sinkronkan auto-open InfoWindow saat focusVoter berubah
  useEffect(() => {
    if (!focusVoter) return;
    const match = clusters.find((c) => c.voters.some((v) => v.id === focusVoter.id));
    if (match) {
      setActiveClusterKey(match.key);
    }
  }, [focusVoter, clusters]);

  const unmappedCount = useMemo(
    () => voters.filter((v) => !resolveVoterDisplayCoords(v)).length,
    [voters]
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Map Toolbar */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
          <Navigation className="w-4 h-4 text-blue-600" />
          <span>
            Sebaran Suara Konstituen ({voters.length.toLocaleString('id-ID')} Voter di{' '}
            {clusters.length} Titik Wilayah)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{mapTypeId === 'roadmap' ? 'Mode Satelit' : 'Mode Peta'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveClusterKey(null);
              setFitNonce((n) => n + 1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
            <span>Reset Zoom</span>
          </button>
        </div>
      </div>

      {/* Google Map Canvas */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-100">
        <SwarakuMapsProvider
          fallback={
            <div className="h-full w-full p-4 sm:p-6 overflow-y-auto flex flex-col justify-center bg-slate-50">
              <SwarakuMapsDiagnosticNotice
                title="Peta Suara Google Maps dialihkan ke Mode Rekapitulasi"
                subtitle="Rekapitulasi Kecamatan dinamis dan daftar konstituen tetap aktif di bawah."
              />
            </div>
          }
        >
          <GoogleMap
            mapId="swaraku-peta-suara-voters-map"
            defaultCenter={INDONESIA_CENTER}
            defaultZoom={5}
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            streetViewControl={false}
            mapTypeControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
          >
          <MapViewportSync
            clusters={clusters}
            focusCoords={focusCoords}
            fitNonce={fitNonce}
          />

          {clusters.map((cluster) => {
            const count = cluster.voters.length;
            const isSelected =
              activeClusterKey === cluster.key ||
              (selectedKelurahan &&
                cluster.kelurahan.toLowerCase() === selectedKelurahan.toLowerCase()) ||
              (selectedKecamatan &&
                !selectedKelurahan &&
                cluster.kecamatan.toLowerCase() === selectedKecamatan.toLowerCase());

            const pinTone =
              count >= 20
                ? 'bg-emerald-600 border-white text-white'
                : count >= 5
                ? 'bg-blue-600 border-white text-white'
                : 'bg-cyan-600 border-white text-white';

            return (
              <AdvancedMarker
                key={cluster.key}
                position={{ lat: cluster.lat, lng: cluster.lng }}
                onClick={() => {
                  setActiveClusterKey(cluster.key);
                  onSelectCluster?.(cluster);
                }}
                zIndex={isSelected ? 40 : count}
              >
                <div className="flex flex-col items-center cursor-pointer group">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border-2 shadow-md transition-transform ${
                      isSelected ? 'scale-110 ring-4 ring-blue-300/60' : 'group-hover:scale-105'
                    } ${pinTone}`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-black tabular-nums">{count}</span>
                    <span className="text-[10px] font-bold max-w-[100px] truncate hidden sm:inline">
                      {cluster.kelurahan}
                    </span>
                  </div>
                  <div className="w-2.5 h-2.5 rotate-45 -mt-1.5 bg-slate-800/80" />
                </div>
              </AdvancedMarker>
            );
          })}

          {activeCluster && (
            <InfoWindow
              position={{ lat: activeCluster.lat, lng: activeCluster.lng }}
              onCloseClick={() => setActiveClusterKey(null)}
              pixelOffset={[0, -34]}
            >
              <div className="min-w-[240px] max-w-[290px] p-1 text-slate-900 space-y-2.5">
                <div className="border-b border-slate-100 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                      Sebaran Konstituen
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      {activeCluster.voters.length} Voter
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    Kel. {activeCluster.kelurahan}
                  </p>
                  <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      Kec. {activeCluster.kecamatan}, {activeCluster.kota}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500">{activeCluster.provinsi}</p>
                </div>

                {/* Daftar Ringkas Voter di Wilayah Ini */}
                <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                  {activeCluster.voters.slice(0, 8).map((v) => (
                    <div
                      key={v.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]"
                    >
                      <p className="font-bold text-slate-900 truncate">{v.nama}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{v.nikMasked}</p>
                      <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Input: {v.diinputOlehNama || v.terdaftarOleh || '-'}
                        </span>
                      </p>
                    </div>
                  ))}
                  {activeCluster.voters.length > 8 && (
                    <p className="text-[10px] text-center text-slate-500 font-semibold">
                      +{activeCluster.voters.length - 8} konstituen lainnya di wilayah ini
                    </p>
                  )}
                </div>

                <a
                  href={`https://www.google.com/maps?q=${activeCluster.lat},${activeCluster.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka Lokasi di Google Maps</span>
                </a>
              </div>
            </InfoWindow>
          )}
          </GoogleMap>
        </SwarakuMapsProvider>

        {voters.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 bg-white/60 backdrop-blur-[1px]">
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-md text-center max-w-sm space-y-1">
              <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-sm font-extrabold text-slate-900">Belum Ada Data Konstituen</p>
              <p className="text-xs text-slate-600">
                Peta Suara menampilkan data konstituen/voter yang diinput oleh tim lapangan sesuai
                cakupan wilayah Anda.
              </p>
            </div>
          </div>
        )}
      </div>

      {unmappedCount > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-800 font-medium">
          Catatan: {unmappedCount} data konstituen belum memiliki koordinat wilayah presisi, namun
          tetap terhitung dalam rekapitulasi administratif dan daftar di bawah.
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  TimSuksesWilayahRecord,
  PetaWilayahMarker,
  normalizeWilayahName,
} from '../../data/petaSuaraData';
import { lookupSmartCoordinates } from '../../utils/geocoding';
import { VoterOcrRecord, UserAccount } from '../../types/vore';
import {
  Search,
  Filter,
  Users,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Plus,
  Phone,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Compass,
  RotateCcw,
  Info,
} from 'lucide-react';

interface PetaSuaraGoogleMapsViewProps {
  timSuksesList: TimSuksesWilayahRecord[];
  voterList: VoterOcrRecord[];
  currentUser?: UserAccount | null;
  onOpenDaftarTimSukses: (wilayahPreselect?: { kota?: string; kecamatan?: string; kelurahan?: string }) => void;
  onOpenInputVoter: (wilayahPreselect?: { kota?: string; kecamatan?: string; kelurahan?: string; lat?: number; lng?: number }) => void;
  onResetDataToZero?: () => void;
  targetVoter?: VoterOcrRecord | null;
}

// Marker Item Sub-component with Anchored InfoWindow
interface MarkerWithAnchorProps {
  markerData: PetaWilayahMarker;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  onAddVoterInRegion: (m: PetaWilayahMarker) => void;
  onAssignTimSuksesInRegion: (m: PetaWilayahMarker) => void;
}

const MarkerWithAnchor: React.FC<MarkerWithAnchorProps> = ({
  markerData,
  isSelected,
  onSelect,
  onClose,
  onAddVoterInRegion,
  onAssignTimSuksesInRegion,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  // Pin styling based on whether area has coordinator and voters
  const hasKoordinator = markerData.koordinatorNama !== 'Belum ada koordinator';
  const hasVoters = markerData.totalVoters > 0;

  let pinBgColor = '#0284c7'; // Cyan default
  let borderColor = '#0369a1';
  let badgeColor = 'bg-cyan-600';

  if (hasVoters && hasKoordinator) {
    pinBgColor = '#059669'; // Emerald strong
    borderColor = '#047857';
    badgeColor = 'bg-emerald-600';
  } else if (!hasKoordinator) {
    pinBgColor = '#e11d48'; // Rose alert (blank coordinator)
    borderColor = '#be123c';
    badgeColor = 'bg-rose-600';
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: markerData.lat, lng: markerData.lng }}
        onClick={onSelect}
        title={`${markerData.kelurahan}, ${markerData.kecamatan} (${markerData.totalVoters} Suara)`}
      >
        {/* Custom Marker Pin with Voter Count Badge */}
        <div className="relative group cursor-pointer transform transition-transform hover:scale-110 active:scale-95">
          <div
            style={{ backgroundColor: pinBgColor, borderColor }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-lg border-2"
          >
            <MapPin className="w-5 h-5 text-white" />
          </div>

          {/* Floating Badge Voter Count */}
          <span
            className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white ${badgeColor} border-2 border-white shadow-xs font-mono`}
          >
            {markerData.totalVoters}
          </span>

          {/* Tooltip Label on Hover */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-md pointer-events-none z-30">
            {markerData.kelurahan} ({markerData.totalVoters} Suara)
          </div>
        </div>
      </AdvancedMarker>

      {/* Anchored InfoWindow with Detailed Business Breakdown */}
      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={onClose}
          maxWidth={320}
        >
          <div className="p-1 space-y-3 text-slate-800 text-xs font-sans">
            {/* Header: Wilayah Info - Persis sesuai format spesifik */}
            <div className="border-b border-slate-200 pb-2">
              <span className="text-[10px] uppercase font-extrabold text-cyan-700 block tracking-wider">
                {markerData.kota}
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                {markerData.kelurahan}
              </h3>
              <p className="text-[11px] text-slate-700 font-bold mt-0.5">
                {markerData.kecamatan.toLowerCase().startsWith('kecamatan') ? markerData.kecamatan : `Kecamatan ${markerData.kecamatan}`}, {markerData.kota}
              </p>
            </div>

            {/* Koordinator Wilayah */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Koordinator Wilayah / Tim Sukses
              </span>

              {hasKoordinator ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-extrabold text-slate-900 block truncate text-xs">
                      {markerData.koordinatorNama}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      ✓ Penugasan Aktif
                    </span>
                  </div>

                  {markerData.koordinatorHp && markerData.koordinatorHp !== '-' && (
                    <a
                      href={`https://wa.me/62${markerData.koordinatorHp.replace(/^0/, '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WA</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 text-rose-700">
                  <span className="font-bold text-[11px]">Belum ada koordinator</span>
                  <button
                    type="button"
                    onClick={() => onAssignTimSuksesInRegion(markerData)}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md cursor-pointer"
                  >
                    + Tugaskan
                  </button>
                </div>
              )}
            </div>

            {/* Total Suara & Rincian Input (Tim Sukses vs Kader) */}
            <div className="p-2.5 bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-900 uppercase">
                  Total Suara (Voter) Terkumpul
                </span>
                <span className="text-base font-black font-mono text-cyan-900">
                  {markerData.totalVoters}
                </span>
              </div>

              {/* Rincian: Tim Sukses vs Kader */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-cyan-200/70 text-[11px]">
                <div className="p-1.5 bg-white/80 rounded-lg border border-cyan-200">
                  <span className="text-[9px] text-slate-500 block leading-tight font-semibold">
                    Input Tim Sukses
                  </span>
                  <span className="text-xs font-black font-mono text-cyan-700 block mt-0.5">
                    {markerData.voterTimSuksesCount} Voter
                  </span>
                </div>

                <div className="p-1.5 bg-white/80 rounded-lg border border-teal-200">
                  <span className="text-[9px] text-slate-500 block leading-tight font-semibold">
                    Input Kader
                  </span>
                  <span className="text-xs font-black font-mono text-emerald-700 block mt-0.5">
                    {markerData.voterKaderCount} Voter
                  </span>
                </div>
              </div>
            </div>

            {/* DAFTAR FOTO & IDENTITAS VOTER DI TITIK INI */}
            {markerData.recentVoters && markerData.recentVoters.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold text-slate-800">
                    Pemilih Terdaftar di Titik Ini ({markerData.recentVoters.length}):
                  </span>
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                    ✓ Scan AI KTP
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-0.5">
                  {markerData.recentVoters.map((v: VoterOcrRecord) => (
                    <div
                      key={v.id}
                      className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2"
                    >
                      {v.fotoKtpUrl ? (
                        <img
                          src={v.fotoKtpUrl}
                          alt="Foto KTP"
                          className="w-10 h-7 object-cover rounded-md border border-slate-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-7 rounded-md bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400 shrink-0 font-bold">
                          KTP
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-black text-slate-900 block truncate">
                          {v.nama}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                          <span>{v.nikMasked || v.nik}</span>
                          <span>·</span>
                          <span className="text-teal-700 font-bold">{v.tps}</span>
                        </div>
                        {v.alamat && (
                          <span className="text-[8px] text-slate-400 block truncate">
                            {v.alamat} (RT {v.rtRw || '-'})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onAddVoterInRegion(markerData)}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Input Voter di Wilayah Ini</span>
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

// Auto-pan / Camera handler using Google Maps useMap hook
const MapCameraHandler: React.FC<{
  markers: PetaWilayahMarker[];
  selectedMarkerId: string | null;
  targetVoter?: VoterOcrRecord | null;
}> = ({ markers, selectedMarkerId, targetVoter }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // 1. Prioritas Utama: Fokus ke voter spesifik yang diminta user
    if (targetVoter && typeof targetVoter.lat === 'number' && typeof targetVoter.lng === 'number') {
      map.panTo({ lat: targetVoter.lat, lng: targetVoter.lng });
      map.setZoom(16);
      return;
    }

    // 2. Fokus ke marker wilayah yang diklik
    if (selectedMarkerId) {
      const selected = markers.find((m) => m.id === selectedMarkerId);
      if (selected && selected.lat && selected.lng) {
        map.panTo({ lat: selected.lat, lng: selected.lng });
        map.setZoom(15);
        return;
      }
    }

    // 3. Penataan batas multi marker
    if (markers.length === 1) {
      map.panTo({ lat: markers[0].lat, lng: markers[0].lng });
      map.setZoom(14);
    } else if (markers.length > 1) {
      const g = typeof window !== 'undefined' ? (window as any).google : undefined;
      if (g?.maps?.LatLngBounds) {
        const bounds = new g.maps.LatLngBounds();
        let validPoints = 0;
        markers.forEach((m) => {
          if (m.lat && m.lng) {
            bounds.extend({ lat: m.lat, lng: m.lng });
            validPoints++;
          }
        });
        if (validPoints > 0) {
          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        }
      }
    }
  }, [map, markers, selectedMarkerId, targetVoter]);

  return null;
};

export const PetaSuaraGoogleMapsView: React.FC<PetaSuaraGoogleMapsViewProps> = ({
  timSuksesList,
  voterList,
  currentUser,
  onOpenDaftarTimSukses,
  onOpenInputVoter,
  onResetDataToZero,
  targetVoter,
}) => {
  // Filters State
  const [selectedKotaFilter, setSelectedKotaFilter] = useState<string>('Semua');
  const [selectedKecFilter, setSelectedKecFilter] = useState<string>('Semua');
  const [selectedKelFilter, setSelectedKelFilter] = useState<string>('Semua');
  const [selectedKoordinatorFilter, setSelectedKoordinatorFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Marker for InfoWindow
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Google Maps API Key
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
    'AIzaSyCdblvQuw9FYALutqDvm1Yly8zXxDV386g';

  // 1. DYNAMIC AGGREGATION: Build dynamic markers from Tim Sukses & Voters
  // ZERO DUMMY DATA: All markers are generated exclusively from registered data!
  const dynamicMarkers = useMemo<PetaWilayahMarker[]>(() => {
    const markersMap = new Map<string, PetaWilayahMarker>();

    // Step A: Register wilayah from Tim Sukses
    timSuksesList.forEach((ts) => {
      let tsLat = ts.lat;
      let tsLng = ts.lng;
      const isErrTsJaksel =
        tsLat &&
        Math.abs(tsLat - -6.2615) < 0.001 &&
        !ts.kota.toLowerCase().includes('selatan');

      ts.kecamatanList.forEach((kec) => {
        const kelList = ts.kelurahanList.length > 0 ? ts.kelurahanList : ['Seluruh Kelurahan'];
        kelList.forEach((kel) => {
          let resolvedLat = tsLat;
          let resolvedLng = tsLng;
          if (!resolvedLat || !resolvedLng || isErrTsJaksel) {
            const smart = lookupSmartCoordinates(kel, kec, ts.kota);
            if (smart) {
              resolvedLat = smart.lat;
              resolvedLng = smart.lng;
            }
          }

          const key = `${normalizeWilayahName(ts.kota)}_${normalizeWilayahName(kec)}_${normalizeWilayahName(kel)}`;
          if (!markersMap.has(key)) {
            markersMap.set(key, {
              id: key,
              kota: ts.kota,
              kecamatan: kec,
              kelurahan: kel,
              lat: resolvedLat || -6.1264,
              lng: resolvedLng || 106.7885,
              koordinatorNama: ts.nama,
              koordinatorHp: ts.noHp,
              koordinatorRole: 'Tim Sukses',
              totalVoters: 0,
              voterTimSuksesCount: 0,
              voterKaderCount: 0,
              voterListNiks: [],
              terakhirUpdate: ts.waktuDaftar,
            });
          } else {
            // Update coordinator if previously empty
            const existing = markersMap.get(key)!;
            if (existing.koordinatorNama === 'Belum ada koordinator') {
              existing.koordinatorNama = ts.nama;
              existing.koordinatorHp = ts.noHp;
            }
          }
        });
      });
    });

    // Step B: Connect & Aggregate Voters (No static fallback to Jakarta Selatan)
    voterList.forEach((v) => {
      let vKota = v.kabupatenKota?.trim();
      const vKec = v.kecamatan?.trim() || 'Kecamatan Belum Terdata';
      const vKel = v.kelurahan?.trim() || 'Kelurahan Belum Terdata';

      // Fix city if missing or if mistakenly saved as Jakarta Selatan for Penjaringan
      if (!vKota || vKota === 'Kota Jakarta Selatan') {
        if (vKec.toLowerCase().includes('penjaringan')) {
          vKota = 'Jakarta Utara';
        } else if (!vKota) {
          vKota = 'Wilayah Terdaftar';
        }
      }

      // Find matching Tim Sukses for coordinator assignment if available
      const matchingTs = timSuksesList.find((ts) => {
        const kecMatch = ts.kecamatanList.some(
          (k) => normalizeWilayahName(k) === normalizeWilayahName(vKec)
        );
        return kecMatch;
      });

      const key = `${normalizeWilayahName(vKota)}_${normalizeWilayahName(vKec)}_${normalizeWilayahName(vKel)}`;

      let marker = markersMap.get(key);
      if (!marker) {
        let markerLat = v.lat;
        let markerLng = v.lng;

        // Detect if coordinates are the erroneous static fallback (-6.2615)
        const isErroneousJaksel =
          markerLat !== undefined &&
          Math.abs(markerLat - -6.2615) < 0.001 &&
          !vKota.toLowerCase().includes('selatan') &&
          !vKec.toLowerCase().includes('cilandak');

        if (!markerLat || !markerLng || isErroneousJaksel) {
          const smart = lookupSmartCoordinates(vKel, vKec, vKota);
          if (smart) {
            markerLat = smart.lat;
            markerLng = smart.lng;
          } else {
            // Default center if nothing matches (Penjaringan / Jakarta Utara precision)
            markerLat = vKota.toLowerCase().includes('utara') || vKec.toLowerCase().includes('penjaringan')
              ? -6.1264
              : -6.1754; // Monas center, NEVER forced Jakarta Selatan
            markerLng = vKota.toLowerCase().includes('utara') || vKec.toLowerCase().includes('penjaringan')
              ? 106.7885
              : 106.8272;
          }
        }

        // Registered by voter before Tim Sukses existed in that area
        marker = {
          id: key,
          kota: vKota,
          kecamatan: vKec,
          kelurahan: vKel,
          lat: markerLat,
          lng: markerLng,
          koordinatorNama: matchingTs ? matchingTs.nama : 'Belum ada koordinator',
          koordinatorHp: matchingTs ? matchingTs.noHp : undefined,
          totalVoters: 0,
          voterTimSuksesCount: 0,
          voterKaderCount: 0,
          voterListNiks: [],
          recentVoters: [],
          terakhirUpdate: v.waktuDaftar,
        };
        markersMap.set(key, marker);
      }

      // Increment Voter Counters
      marker.totalVoters += 1;
      marker.voterListNiks.push(v.nik);
      if (!marker.recentVoters) marker.recentVoters = [];
      marker.recentVoters.push(v);

      if (v.diinputOlehRole === 'tim_sukses') {
        marker.voterTimSuksesCount += 1;
      } else {
        marker.voterKaderCount += 1; // Default to Kader
      }
    });

    return Array.from(markersMap.values());
  }, [timSuksesList, voterList]);

  // 2. DYNAMIC FILTER OPTIONS (Derived purely from active data)
  const kotaFilterOptions = useMemo(() => {
    return Array.from(new Set(dynamicMarkers.map((m) => m.kota))).filter(Boolean);
  }, [dynamicMarkers]);

  const kecamatanFilterOptions = useMemo(() => {
    const relevant = selectedKotaFilter === 'Semua'
      ? dynamicMarkers
      : dynamicMarkers.filter((m) => m.kota === selectedKotaFilter);
    return Array.from(new Set(relevant.map((m) => m.kecamatan))).filter(Boolean);
  }, [dynamicMarkers, selectedKotaFilter]);

  const kelurahanFilterOptions = useMemo(() => {
    let relevant = dynamicMarkers;
    if (selectedKotaFilter !== 'Semua') {
      relevant = relevant.filter((m) => m.kota === selectedKotaFilter);
    }
    if (selectedKecFilter !== 'Semua') {
      relevant = relevant.filter((m) => m.kecamatan === selectedKecFilter);
    }
    return Array.from(new Set(relevant.map((m) => m.kelurahan))).filter(Boolean);
  }, [dynamicMarkers, selectedKotaFilter, selectedKecFilter]);

  const koordinatorFilterOptions = useMemo(() => {
    const names = timSuksesList.map((ts) => ts.nama);
    return Array.from(new Set(names)).filter(Boolean);
  }, [timSuksesList]);

  // 3. FILTERED MARKERS
  const filteredMarkers = useMemo(() => {
    return dynamicMarkers.filter((m) => {
      if (selectedKotaFilter !== 'Semua' && m.kota !== selectedKotaFilter) return false;
      if (selectedKecFilter !== 'Semua' && m.kecamatan !== selectedKecFilter) return false;
      if (selectedKelFilter !== 'Semua' && m.kelurahan !== selectedKelFilter) return false;
      if (
        selectedKoordinatorFilter !== 'Semua' &&
        m.koordinatorNama !== selectedKoordinatorFilter
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          m.kota.toLowerCase().includes(q) ||
          m.kecamatan.toLowerCase().includes(q) ||
          m.kelurahan.toLowerCase().includes(q) ||
          m.koordinatorNama.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    dynamicMarkers,
    selectedKotaFilter,
    selectedKecFilter,
    selectedKelFilter,
    selectedKoordinatorFilter,
    searchQuery,
  ]);

  // 4. MACRO METRICS
  const grandTotalVoters = voterList.length;
  const totalVoterByTimSukses = voterList.filter((v) => v.diinputOlehRole === 'tim_sukses').length;
  const totalVoterByKader = voterList.filter((v) => v.diinputOlehRole !== 'tim_sukses').length;
  const totalWilayahTerpetakan = dynamicMarkers.length;
  const totalKoordinatorAktif = timSuksesList.length;

  // Auto-fokus dan buka InfoWindow saat targetVoter dipilih dari luar (Command Center / Database Voters)
  useEffect(() => {
    if (targetVoter) {
      const matched = dynamicMarkers.find(
        (m) =>
          m.voterListNiks.includes(targetVoter.nik) ||
          (normalizeWilayahName(m.kelurahan) === normalizeWilayahName(targetVoter.kelurahan) &&
            normalizeWilayahName(m.kecamatan) === normalizeWilayahName(targetVoter.kecamatan))
      );
      if (matched) {
        setSelectedMarkerId(matched.id);
      }
    }
  }, [targetVoter, dynamicMarkers]);

  // Default Map Center (center on target voter if available, then first marker, then Monas)
  const defaultCenter = useMemo(() => {
    if (targetVoter && typeof targetVoter.lat === 'number' && typeof targetVoter.lng === 'number') {
      return { lat: targetVoter.lat, lng: targetVoter.lng };
    }
    if (filteredMarkers.length > 0) {
      return { lat: filteredMarkers[0].lat, lng: filteredMarkers[0].lng };
    }
    return { lat: -6.2088, lng: 106.8456 }; // Monas
  }, [filteredMarkers, targetVoter]);

  return (
    <div className="space-y-4">
      {/* Top Action & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Peta Suara Terpadu (Google Maps API)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
              Live GIS
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Sebaran suara pemilih &amp; wilayah kerja koordinator kecamatan/kelurahan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenDaftarTimSukses()}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-800 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Daftar Tim Sukses</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInputVoter()}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Input Data Voter</span>
          </button>

          {onResetDataToZero && (
            <button
              type="button"
              onClick={onResetDataToZero}
              title="Kosongkan seluruh data Peta Suara ke kondisi awal (0 Data)"
              className="p-2 bg-white hover:bg-slate-100 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Macro Statistics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-gradient-to-br from-slate-900 to-cyan-950 rounded-2xl text-white border border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cyan-300 block">
            Total Voter Terkumpul
          </span>
          <span className="text-xl font-black font-mono text-white mt-1 block">
            {grandTotalVoters.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-300 block mt-0.5">
            Real-Time Terverifikasi
          </span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Titik Wilayah Kerja
          </span>
          <span className="text-xl font-black font-mono text-cyan-800 mt-1 block">
            {totalWilayahTerpetakan}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Kecamatan &amp; Kelurahan
          </span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-cyan-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-cyan-700 block">
            Input Tim Sukses
          </span>
          <span className="text-xl font-black font-mono text-cyan-700 mt-1 block">
            {totalVoterByTimSukses}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {grandTotalVoters > 0 ? Math.round((totalVoterByTimSukses / grandTotalVoters) * 100) : 0}% Total Suara
          </span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">
            Input Kader Lapangan
          </span>
          <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
            {totalVoterByKader}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {grandTotalVoters > 0 ? Math.round((totalVoterByKader / grandTotalVoters) * 100) : 0}% Total Suara
          </span>
        </div>
      </div>

      {/* ZERO DUMMY DATA STATE BANNER (Appears when 0 regions / voters exist) */}
      {dynamicMarkers.length === 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 via-cyan-50 to-emerald-50 border border-cyan-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-700 text-white flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">
                Peta Suara Bersih (0 Data Awal)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                Tidak ada data wilayah statis/dummy. Mulai dengan mendaftarkan <strong>Tim Sukses</strong> untuk menetapkan wilayah kerja (Kecamatan &amp; Kelurahan) atau input <strong>Data Voter</strong> baru. Titik koordinat dan marker Google Maps akan otomatis muncul secara dinamis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenDaftarTimSukses()}
              className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              + Daftar Tim Sukses
            </button>
            <button
              type="button"
              onClick={() => onOpenInputVoter()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              + Input Voter
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Filter Controls Bar */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-cyan-700" />
            <span>Filter Wilayah &amp; Koordinator Dinamis</span>
          </div>

          <div className="relative w-48 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kelurahan, korcam..."
              className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Filter Kota */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kota/Kab:</label>
            <select
              value={selectedKotaFilter}
              onChange={(e) => setSelectedKotaFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="Semua">Semua Kota ({kotaFilterOptions.length})</option>
              {kotaFilterOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kecamatan */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kecamatan:</label>
            <select
              value={selectedKecFilter}
              onChange={(e) => setSelectedKecFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="Semua">Semua Kecamatan ({kecamatanFilterOptions.length})</option>
              {kecamatanFilterOptions.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kelurahan */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kelurahan:</label>
            <select
              value={selectedKelFilter}
              onChange={(e) => setSelectedKelFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="Semua">Semua Kelurahan ({kelurahanFilterOptions.length})</option>
              {kelurahanFilterOptions.map((kel) => (
                <option key={kel} value={kel}>
                  {kel}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Koordinator */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Koordinator:</label>
            <select
              value={selectedKoordinatorFilter}
              onChange={(e) => setSelectedKoordinatorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="Semua">Semua Koordinator ({koordinatorFilterOptions.length})</option>
              {koordinatorFilterOptions.map((kor) => (
                <option key={kor} value={kor}>
                  {kor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Google Maps Render Container */}
      <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-200 shadow-md">
        <APIProvider apiKey={apiKey} libraries={['marker', 'geocoding', 'places']}>
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultZoom={12}
            defaultCenter={defaultCenter}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Auto-pan / Auto-fit bounds on markers */}
            <MapCameraHandler
              markers={filteredMarkers}
              selectedMarkerId={selectedMarkerId}
              targetVoter={targetVoter}
            />

            {filteredMarkers.map((m) => (
              <MarkerWithAnchor
                key={m.id}
                markerData={m}
                isSelected={selectedMarkerId === m.id}
                onSelect={() => setSelectedMarkerId(m.id)}
                onClose={() => setSelectedMarkerId(null)}
                onAddVoterInRegion={(item) => {
                  setSelectedMarkerId(null);
                  onOpenInputVoter({
                    kota: item.kota,
                    kecamatan: item.kecamatan,
                    kelurahan: item.kelurahan,
                    lat: item.lat,
                    lng: item.lng,
                  });
                }}
                onAssignTimSuksesInRegion={(item) => {
                  setSelectedMarkerId(null);
                  onOpenDaftarTimSukses({
                    kota: item.kota,
                    kecamatan: item.kecamatan,
                    kelurahan: item.kelurahan,
                  });
                }}
              />
            ))}
          </GoogleMap>
        </APIProvider>

        {/* Legend Overlay at Bottom Right */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg text-[10px] space-y-1.5 z-10 max-w-xs">
          <span className="font-extrabold text-slate-800 uppercase block tracking-wider">
            Legenda Peta Suara
          </span>
          <div className="space-y-1 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0"></span>
              <span>Ada Koordinator &amp; Suara Masuk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-cyan-600 shrink-0"></span>
              <span>Koordinator Tim Sukses Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-rose-600 shrink-0"></span>
              <span>Belum Ada Koordinator Wilayah</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

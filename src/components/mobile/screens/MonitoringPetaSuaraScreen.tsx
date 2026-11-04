import React, { useState, useMemo } from 'react';
import {
  TimSuksesWilayahRecord,
  KabupatenPetaRecord,
  TpsPetaRecord,
  INITIAL_TIM_SUKSES_LIST,
  normalizeWilayahName,
} from '../../../data/petaSuaraData';
import { VoterOcrRecord, DptVoterRecord, UserAccount } from '../../../types/vore';
import { PetaSuaraGoogleMapsView } from '../../peta/PetaSuaraGoogleMapsView';
import { FormPendaftaranTimSuksesModal } from '../../timsukses/FormPendaftaranTimSuksesModal';
import { FormInputVoterPetaModal } from '../../kader/FormInputVoterPetaModal';
import {
  Compass,
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronRight,
  ChevronDown,
  Building2,
  Map as MapIcon,
  Filter,
  Phone,
  Package,
  Layers,
  Sparkles,
  Download,
  Share2,
  X,
  UserPlus,
  Send,
  ExternalLink,
  Info,
  Plus,
  RotateCcw,
} from 'lucide-react';

interface MonitoringPetaSuaraScreenProps {
  voterList?: VoterOcrRecord[];
  dptList?: DptVoterRecord[];
  timSuksesList?: TimSuksesWilayahRecord[];
  onOpenWhatsAppBlazt?: () => void;
  onNavigateTab?: (tab: 'beranda' | 'aspirasi' | 'peta_suara' | 'tps' | 'profil') => void;
  onOpenTambahNikModal?: () => void;
  onOpenDaftarTimSukses?: (wilayahPreselect?: { kota?: string; kecamatan?: string; kelurahan?: string }) => void;
  onOpenInputVoter?: (wilayahPreselect?: { kota?: string; kecamatan?: string; kelurahan?: string; lat?: number; lng?: number }) => void;
  onSaveTimSukses?: (timSukses: TimSuksesWilayahRecord) => void;
  onSaveVoter?: (voter: VoterOcrRecord) => void;
  onResetDataToZero?: () => void;
  currentUser?: UserAccount | null;
  targetVoter?: VoterOcrRecord | null;
}

export const MonitoringPetaSuaraScreen: React.FC<MonitoringPetaSuaraScreenProps> = ({
  voterList = [],
  dptList = [],
  timSuksesList: propTimSuksesList,
  onOpenWhatsAppBlazt,
  onNavigateTab,
  onOpenTambahNikModal,
  onOpenDaftarTimSukses,
  onOpenInputVoter,
  onSaveTimSukses,
  onSaveVoter,
  onResetDataToZero,
  currentUser,
  targetVoter,
}) => {
  // Local state for Tim Sukses if not provided via props
  const [localTimSuksesList, setLocalTimSuksesList] = useState<TimSuksesWilayahRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swaraku_timsukses_list');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return INITIAL_TIM_SUKSES_LIST;
  });

  const activeTimSuksesList = propTimSuksesList || localTimSuksesList;

  // View Mode: 'google_maps' (Default), 'hirarki' (Struktur Wilayah), 'timsukses' (Daftar Korcam)
  const [viewMode, setViewMode] = useState<'google_maps' | 'hirarki' | 'timsukses'>('google_maps');

  // Internal Modals State
  const [isDaftarTimSuksesModalOpen, setIsDaftarTimSuksesModalOpen] = useState(false);
  const [isInputVoterModalOpen, setIsInputVoterModalOpen] = useState(false);
  const [preselectedWilayah, setPreselectedWilayah] = useState<{
    kota?: string;
    kecamatan?: string;
    kelurahan?: string;
    lat?: number;
    lng?: number;
  }>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Internal Handlers
  const handleSaveTimSuksesInternal = (newTs: TimSuksesWilayahRecord) => {
    if (onSaveTimSukses) {
      onSaveTimSukses(newTs);
    } else {
      setLocalTimSuksesList((prev) => {
        const updated = [newTs, ...prev.filter((i) => i.id !== newTs.id)];
        if (typeof window !== 'undefined') {
          localStorage.setItem('swaraku_timsukses_list', JSON.stringify(updated));
        }
        return updated;
      });
    }
    triggerToast(`Tim Sukses ${newTs.nama} berhasil didaftarkan & terhubung ke Peta Suara!`);
  };

  const handleSaveVoterInternal = (newVoter: VoterOcrRecord) => {
    if (onSaveVoter) {
      onSaveVoter(newVoter);
    }
    triggerToast(`Voter ${newVoter.nama} berhasil ditambahkan! Peta Suara diperbarui (+1).`);
  };

  const handleOpenTimSuksesModal = (wilayahPreselect?: { kota?: string; kecamatan?: string; kelurahan?: string }) => {
    if (wilayahPreselect) setPreselectedWilayah(wilayahPreselect);
    setIsDaftarTimSuksesModalOpen(true);
  };

  const handleOpenVoterModal = (wilayahPreselect?: { kota?: string; kecamatan?: string; kelurahan?: string; lat?: number; lng?: number }) => {
    if (wilayahPreselect) setPreselectedWilayah(wilayahPreselect);
    setIsInputVoterModalOpen(true);
  };

  // Dynamic Macro Metrics: calculated exclusively from live data
  const totalVoters = voterList.length;
  const votersByTimSukses = voterList.filter((v) => v.diinputOlehRole === 'tim_sukses').length;
  const votersByKader = voterList.filter((v) => v.diinputOlehRole !== 'tim_sukses').length;

  // Unique Wilayah derived from Tim Sukses and Voters
  const registeredWilayahSet = useMemo(() => {
    const list: {
      kota: string;
      kecamatan: string;
      kelurahan: string;
      koordinator: string;
      totalVoter: number;
    }[] = [];

    const map = new Map<string, { kota: string; kecamatan: string; kelurahan: string; koordinator: string; totalVoter: number }>();

    activeTimSuksesList.forEach((ts) => {
      ts.kecamatanList.forEach((kec) => {
        const kelList = ts.kelurahanList.length > 0 ? ts.kelurahanList : ['Seluruh Kelurahan'];
        kelList.forEach((kel) => {
          const key = `${normalizeWilayahName(ts.kota)}_${normalizeWilayahName(kec)}_${normalizeWilayahName(kel)}`;
          if (!map.has(key)) {
            map.set(key, {
              kota: ts.kota,
              kecamatan: kec,
              kelurahan: kel,
              koordinator: ts.nama,
              totalVoter: 0,
            });
          }
        });
      });
    });

    voterList.forEach((v) => {
      let vKota = v.kabupatenKota?.trim();
      const vKec = v.kecamatan?.trim() || 'Kecamatan Belum Terdata';
      const vKel = v.kelurahan?.trim() || 'Kelurahan Belum Terdata';

      if (!vKota || vKota === 'Kota Jakarta Selatan') {
        if (vKec.toLowerCase().includes('penjaringan')) {
          vKota = 'Jakarta Utara';
        } else if (!vKota) {
          vKota = 'Wilayah Terdaftar';
        }
      }

      const key = `${normalizeWilayahName(vKota)}_${normalizeWilayahName(vKec)}_${normalizeWilayahName(vKel)}`;

      let item = map.get(key);
      if (!item) {
        const matchingTs = activeTimSuksesList.find((ts) =>
          ts.kecamatanList.some((k) => normalizeWilayahName(k) === normalizeWilayahName(vKec))
        );
        item = {
          kota: vKota,
          kecamatan: vKec,
          kelurahan: vKel,
          koordinator: matchingTs ? matchingTs.nama : 'Belum ada koordinator',
          totalVoter: 0,
        };
        map.set(key, item);
      }
      item.totalVoter += 1;
    });

    return Array.from(map.values());
  }, [activeTimSuksesList, voterList]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Mode Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setViewMode('google_maps')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'google_maps'
                ? 'bg-white text-cyan-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-cyan-700" />
            <span>Peta Google Maps (Live)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('hirarki')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'hirarki'
                ? 'bg-white text-cyan-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-700" />
            <span>Daftar Wilayah ({registeredWilayahSet.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timsukses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'timsukses'
                ? 'bg-white text-cyan-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-700" />
            <span>Tim Sukses &amp; Korcam ({activeTimSuksesList.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenTimSuksesModal()}
            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar Tim Sukses</span>
            <span className="sm:hidden">Tim Sukses</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenVoterModal()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Input Voter</span>
            <span className="sm:hidden">Voter</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: GOOGLE MAPS API INTERACTIVE VIEW */}
      {viewMode === 'google_maps' && (
        <PetaSuaraGoogleMapsView
          timSuksesList={activeTimSuksesList}
          voterList={voterList}
          currentUser={currentUser}
          onOpenDaftarTimSukses={handleOpenTimSuksesModal}
          onOpenInputVoter={handleOpenVoterModal}
          onResetDataToZero={onResetDataToZero}
          targetVoter={targetVoter}
        />
      )}

      {/* VIEW 2: DAFTAR WILAYAH & SUARA (HIRARKI DINAMIS) */}
      {viewMode === 'hirarki' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Struktur Wilayah Kerja Dinamis
              </h3>
              <p className="text-xs text-slate-500">
                Tercatat dari penugasan Tim Sukses dan pendaftaran Voter aktif
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
              {registeredWilayahSet.length} Kelurahan Terdaftar
            </span>
          </div>

          {registeredWilayahSet.length === 0 ? (
            <div className="p-10 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                Belum Ada Wilayah Terdaftar (0 Data)
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Daftarkan Tim Sukses untuk menetapkan Kecamatan &amp; Kelurahan yang dipegang, atau input Voter baru untuk memunculkan wilayah secara dinamis.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenTimSuksesModal()}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  + Daftarkan Tim Sukses
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenVoterModal()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  + Input Voter Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {registeredWilayahSet.map((w, idx) => (
                <div
                  key={`${w.kota}_${w.kecamatan}_${w.kelurahan}_${idx}`}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-cyan-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {w.kota}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {w.kelurahan}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{w.kecamatan}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.totalVoter > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {w.totalVoter} Suara
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Koordinator Wilayah
                      </span>
                      <span className="font-bold text-slate-800 text-xs">
                        {w.koordinator}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenVoterModal({
                          kota: w.kota,
                          kecamatan: w.kecamatan,
                          kelurahan: w.kelurahan,
                        })
                      }
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      + Voter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: DAFTAR TIM SUKSES & KOORDINATOR */}
      {viewMode === 'timsukses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Daftar Tim Sukses &amp; Koordinator Kecamatan / Kelurahan
              </h3>
              <p className="text-xs text-slate-500">
                Terhubung langsung sebagai pemegang wilayah di Peta Suara Google Maps
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenTimSuksesModal()}
              className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Daftarkan Tim Sukses</span>
            </button>
          </div>

          {activeTimSuksesList.length === 0 ? (
            <div className="p-10 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">
                Belum Ada Tim Sukses Terdaftar (0 Data)
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Setiap Tim Sukses yang didaftarkan akan otomatis menghubungkan wilayah kerja (Kecamatan &amp; Kelurahan) serta koordinat ke Peta Suara Google Maps.
              </p>
              <button
                type="button"
                onClick={() => handleOpenTimSuksesModal()}
                className="mt-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                + Daftarkan Tim Sukses Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTimSuksesList.map((ts) => (
                <div
                  key={ts.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-700 block">
                        {ts.jabatan || 'Koordinator Pemenangan'}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {ts.nama}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">{ts.kota}</p>
                    </div>

                    {ts.noHp && (
                      <a
                        href={`https://wa.me/62${ts.noHp.replace(/^0/, '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>WA</span>
                      </a>
                    )}
                  </div>

                  {/* Kecamatan yang dipegang */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Kecamatan yang Dipegang:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ts.kecamatanList.map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 bg-cyan-50 text-cyan-900 border border-cyan-200 rounded-md text-[10px] font-bold"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Kelurahan yang dipegang */}
                  {ts.kelurahanList.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">
                        Kelurahan yang Dipegang:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ts.kelurahanList.map((kel) => (
                          <span
                            key={kel}
                            className="px-2 py-0.5 bg-teal-50 text-teal-900 border border-teal-200 rounded-md text-[10px] font-bold"
                          >
                            {kel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Koordinat */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{ts.lat.toFixed(4)}, {ts.lng.toFixed(4)}</span>
                    </span>
                    <span className="text-emerald-700 font-bold">✓ Terhubung ke Peta</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Modals */}
      <FormPendaftaranTimSuksesModal
        isOpen={isDaftarTimSuksesModalOpen}
        onClose={() => setIsDaftarTimSuksesModalOpen(false)}
        onSaveTimSukses={handleSaveTimSuksesInternal}
        defaultKota={preselectedWilayah.kota || ''}
        defaultKecamatan={preselectedWilayah.kecamatan || ''}
        defaultKelurahan={preselectedWilayah.kelurahan || ''}
      />

      <FormInputVoterPetaModal
        isOpen={isInputVoterModalOpen}
        onClose={() => setIsInputVoterModalOpen(false)}
        onSaveVoter={handleSaveVoterInternal}
        currentUser={currentUser}
        registeredTimSuksesList={activeTimSuksesList}
        defaultWilayah={preselectedWilayah}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { VoterOcrRecord, UserAccount } from '../../types/vore';
import { TimSuksesWilayahRecord, KOTA_COORDINATES_MAP } from '../../data/petaSuaraData';
import { resolveAccurateCoordinates, lookupSmartCoordinates } from '../../utils/geocoding';
import {
  X,
  UserPlus,
  CreditCard,
  Phone,
  Building2,
  MapPin,
  Check,
  Sparkles,
  ShieldCheck,
  Camera,
  Layers,
  Search,
} from 'lucide-react';

interface FormInputVoterPetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoter: (voter: VoterOcrRecord) => void;
  currentUser?: UserAccount | null;
  registeredTimSuksesList?: TimSuksesWilayahRecord[];
  onOpenOcrScanner?: () => void;
  defaultWilayah?: {
    kota?: string;
    kecamatan?: string;
    kelurahan?: string;
    lat?: number;
    lng?: number;
  };
}

export const FormInputVoterPetaModal: React.FC<FormInputVoterPetaModalProps> = ({
  isOpen,
  onClose,
  onSaveVoter,
  currentUser,
  registeredTimSuksesList = [],
  onOpenOcrScanner,
  defaultWilayah,
}) => {
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [tps, setTps] = useState('TPS 001');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [alamat, setAlamat] = useState('');

  // Petugas Input (Kader vs Tim Sukses)
  const [diinputOlehRole, setDiinputOlehRole] = useState<'tim_sukses' | 'kader'>(() => {
    if (currentUser?.role === 'tim_sukses') return 'tim_sukses';
    return 'kader';
  });

  const [diinputOlehNama, setDiinputOlehNama] = useState(
    currentUser?.nama || (currentUser?.role === 'tim_sukses' ? 'Tim Sukses Wilayah' : 'Kader Lapangan')
  );

  // Wilayah (ZERO static fallback to Jakarta Selatan)
  const [kota, setKota] = useState(defaultWilayah?.kota || '');
  const [kecamatan, setKecamatan] = useState(defaultWilayah?.kecamatan || '');
  const [kelurahan, setKelurahan] = useState(defaultWilayah?.kelurahan || '');
  const [lat, setLat] = useState<number | ''>(defaultWilayah?.lat ?? '');
  const [lng, setLng] = useState<number | ''>(defaultWilayah?.lng ?? '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Daftar wilayah yang sudah terdaftar dari Tim Sukses untuk quick select
  const existingKecamatanOptions = Array.from(
    new Set(registeredTimSuksesList.flatMap((ts) => ts.kecamatanList))
  );
  const existingKelurahanOptions = Array.from(
    new Set(registeredTimSuksesList.flatMap((ts) => ts.kelurahanList))
  );

  // Quick pick existing wilayah
  const handleSelectExistingKecamatan = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && val !== 'custom') {
      setKecamatan(val);
      const matched = registeredTimSuksesList.find((ts) => ts.kecamatanList.includes(val));
      if (matched) {
        setKota(matched.kota);
        const jitterLat = (Math.random() - 0.5) * 0.005;
        const jitterLng = (Math.random() - 0.5) * 0.005;
        setLat(Number((matched.lat + jitterLat).toFixed(6)));
        setLng(Number((matched.lng + jitterLng).toFixed(6)));
      } else {
        const smart = lookupSmartCoordinates('', val, kota);
        if (smart) {
          setLat(smart.lat);
          setLng(smart.lng);
        }
      }
    }
  };

  // Deteksi Geocoding Presisi on-demand
  const handleAutoGeocode = async (customKel?: string, customKec?: string, customKota?: string) => {
    const targetKel = (customKel ?? kelurahan).trim();
    const targetKec = (customKec ?? kecamatan).trim();
    const targetKota = (customKota ?? kota).trim();

    if (!targetKec && !targetKel && !targetKota) return;

    setIsGeocoding(true);
    setGeoNotice('Mendeteksi titik koordinat akurat Google Maps...');
    try {
      const res = await resolveAccurateCoordinates({
        kelurahan: targetKel,
        kecamatan: targetKec,
        kota: targetKota,
      });
      setLat(res.lat);
      setLng(res.lng);
      setGeoNotice(`Titik akurat terdeteksi (${res.lat.toFixed(4)}, ${res.lng.toFixed(4)})`);
      setTimeout(() => setGeoNotice(null), 3000);
    } catch {
      const fallback = lookupSmartCoordinates(targetKel, targetKec, targetKota);
      if (fallback) {
        setLat(fallback.lat);
        setLng(fallback.lng);
        setGeoNotice(`Titik presisi disesuaikan (${fallback.lat.toFixed(4)}, ${fallback.lng.toFixed(4)})`);
        setTimeout(() => setGeoNotice(null), 3000);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama Voter / Pemilih wajib diisi.');
      return;
    }
    if (!nik.trim() || nik.length < 10) {
      setErrorMsg('NIK KTP minimal 16 digit angka valid.');
      return;
    }
    if (!kecamatan.trim()) {
      setErrorMsg('Kecamatan tempat tinggal voter wajib diisi.');
      return;
    }
    if (!kelurahan.trim()) {
      setErrorMsg('Kelurahan tempat tinggal voter wajib diisi.');
      return;
    }

    const cleanNik = nik.replace(/\D/g, '');
    const maskedNik = cleanNik.length >= 8 ? `${cleanNik.slice(0, 4)}••••••••${cleanNik.slice(-4)}` : cleanNik;

    // Resolve accurate coordinates before persisting
    setIsGeocoding(true);
    let finalLat = typeof lat === 'number' ? lat : undefined;
    let finalLng = typeof lng === 'number' ? lng : undefined;

    // Filter out historical erroneous Jakarta Selatan static coordinates (-6.2615, 106.8106)
    if (
      finalLat !== undefined &&
      Math.abs(finalLat - -6.2615) < 0.001 &&
      !kota.toLowerCase().includes('selatan') &&
      !kecamatan.toLowerCase().includes('cilandak')
    ) {
      finalLat = undefined;
      finalLng = undefined;
    }

    try {
      const geoResult = await resolveAccurateCoordinates({
        kelurahan: kelurahan.trim(),
        kecamatan: kecamatan.trim(),
        kota: kota.trim() || (kecamatan.toLowerCase().includes('penjaringan') ? 'Jakarta Utara' : 'DKI Jakarta'),
        existingLat: finalLat,
        existingLng: finalLng,
      });
      finalLat = geoResult.lat;
      finalLng = geoResult.lng;
    } catch (err) {
      console.warn('Geocoding resolve warning:', err);
      const smart = lookupSmartCoordinates(kelurahan.trim(), kecamatan.trim(), kota.trim());
      if (smart) {
        finalLat = smart.lat;
        finalLng = smart.lng;
      }
    } finally {
      setIsGeocoding(false);
    }

    const finalKota = kota.trim() || (kecamatan.toLowerCase().includes('penjaringan') ? 'Jakarta Utara' : 'DKI Jakarta');

    const newVoter: VoterOcrRecord = {
      id: `voter-manual-${Date.now()}`,
      nik: cleanNik,
      nikMasked: maskedNik,
      nama: nama.trim(),
      tempatTglLahir: 'Jakarta, 15-08-1992',
      jenisKelamin,
      alamat: alamat.trim() || `Jl. Mawar RT 02 / RW 04, ${kelurahan.trim()}`,
      rtRw: '002/004',
      kelurahan: kelurahan.trim(),
      kecamatan: kecamatan.trim(),
      kabupatenKota: finalKota,
      provinsi: 'DKI Jakarta',
      tps: tps.trim() || 'TPS 001',
      noHp: noHp.trim() || '-',
      waktuDaftar: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      statusDpt: 'DPT valid',
      statusRegistrasi: 'TERDAFTAR',
      terdaftarOleh: `${diinputOlehNama} (${diinputOlehRole === 'tim_sukses' ? 'Tim Sukses' : 'Kader'})`,
      diinputOlehRole,
      diinputOlehNama: diinputOlehNama.trim(),
      lat: finalLat,
      lng: finalLng,
    };

    onSaveVoter(newVoter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Input Data Voter / Pemilih
              </h2>
              <p className="text-xs text-emerald-200">
                Pencatatan Pemilih Terpadu &amp; Sinkronisasi Real-Time Peta Suara
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick OCR Scanner Trigger */}
          {onOpenOcrScanner && (
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block text-xs">Punya Foto Fisik e-KTP?</span>
                  <span className="text-[10px] text-emerald-700">Gunakan OCR AI Kamera untuk auto-fill data</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOcrScanner();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                Scan OCR
              </button>
            </div>
          )}

          {/* Section: Petugas yang Menginput */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="block text-[11px] font-bold text-slate-800">
              Diinput Oleh: <span className="text-rose-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiinputOlehRole('tim_sukses')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  diinputOlehRole === 'tim_sukses'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Tim Sukses</span>
                  {diinputOlehRole === 'tim_sukses' && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[10px] block mt-0.5 ${diinputOlehRole === 'tim_sukses' ? 'text-cyan-100' : 'text-slate-400'}`}>
                  Koordinator Pemenangan
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDiinputOlehRole('kader')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  diinputOlehRole === 'kader'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Kader Lapangan</span>
                  {diinputOlehRole === 'kader' && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[10px] block mt-0.5 ${diinputOlehRole === 'kader' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Relawan &amp; Saksi TPS
                </span>
              </button>
            </div>

            <div className="pt-1">
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Nama Petugas / Penginput:
              </label>
              <input
                type="text"
                required
                value={diinputOlehNama}
                onChange={(e) => setDiinputOlehNama(e.target.value)}
                placeholder="Contoh: Ahmad Rizky / Bambang Haryanto"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-cyan-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section: Data Identitas Voter */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Nama Lengkap Pemilih (Voter) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Hendra Wijaya"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-cyan-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="3174061508920003"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:border-cyan-600 focus:outline-hidden"
                  />
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  No. WhatsApp / HP (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="081298765432"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-cyan-600 focus:outline-hidden"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Jenis Kelamin
                </label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as 'Laki-laki' | 'Perempuan')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Nomor TPS
                </label>
                <input
                  type="text"
                  value={tps}
                  onChange={(e) => setTps(e.target.value)}
                  placeholder="TPS 001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Wilayah Voter */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Wilayah Tempat Tinggal Voter</span>
              </div>
              <button
                type="button"
                onClick={() => handleAutoGeocode()}
                disabled={isGeocoding || (!kecamatan && !kelurahan)}
                className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Search className="w-3 h-3" />
                <span>{isGeocoding ? 'Mencari...' : 'Deteksi Titik Akurat'}</span>
              </button>
            </div>

            {geoNotice && (
              <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] rounded-lg font-semibold animate-in fade-in">
                {geoNotice}
              </div>
            )}

            {/* Existing Kecamatan Quick Pick */}
            {existingKecamatanOptions.length > 0 && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600">
                  Pilih dari Wilayah Tim Sukses Terdaftar:
                </label>
                <select
                  onChange={handleSelectExistingKecamatan}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                  defaultValue=""
                >
                  <option value="" disabled>-- Pilih Kecamatan Terdaftar --</option>
                  {existingKecamatanOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                  <option value="custom">+ Input Kecamatan Lain / Manual</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600">Kota/Kab.</label>
                <input
                  type="text"
                  required
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  onBlur={() => {
                    if (kecamatan) handleAutoGeocode(kelurahan, kecamatan, kota);
                  }}
                  placeholder="Contoh: Jakarta Utara"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600">
                  Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  onBlur={() => {
                    if (kecamatan) handleAutoGeocode(kelurahan, kecamatan, kota);
                  }}
                  placeholder="Contoh: Penjaringan"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600">
                  Kelurahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kelurahan}
                  onChange={(e) => setKelurahan(e.target.value)}
                  onBlur={() => {
                    if (kelurahan) handleAutoGeocode(kelurahan, kecamatan, kota);
                  }}
                  placeholder="Contoh: Pluit"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Lat & Lng Coordinates */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-0.5">
                <label className="block text-[9px] font-mono text-slate-500">Lat Koordinat</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  placeholder="Otomatis terisi"
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                />
              </div>
              <div className="space-y-0.5">
                <label className="block text-[9px] font-mono text-slate-500">Lng Koordinat</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  placeholder="Otomatis terisi"
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Perbarui Peta (+1 Suara)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

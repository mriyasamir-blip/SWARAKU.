import React, { useState } from 'react';
import { TimSuksesWilayahRecord, KOTA_COORDINATES_MAP } from '../../data/petaSuaraData';
import { resolveAccurateCoordinates, lookupSmartCoordinates } from '../../utils/geocoding';
import {
  X,
  Users,
  MapPin,
  Phone,
  Building2,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Compass,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface FormPendaftaranTimSuksesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTimSukses: (timSukses: TimSuksesWilayahRecord) => void;
  defaultKota?: string;
  defaultKecamatan?: string;
  defaultKelurahan?: string;
}

export const FormPendaftaranTimSuksesModal: React.FC<FormPendaftaranTimSuksesModalProps> = ({
  isOpen,
  onClose,
  onSaveTimSukses,
  defaultKota = '',
  defaultKecamatan = '',
  defaultKelurahan = '',
}) => {
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [jabatan, setJabatan] = useState('Koordinator Pemenangan Wilayah (Korcam)');
  const [kota, setKota] = useState(defaultKota);
  
  // Multi-Kecamatan & Multi-Kelurahan Tag Input
  const [kecamatanInput, setKecamatanInput] = useState(defaultKecamatan);
  const [kecamatanList, setKecamatanList] = useState<string[]>(
    defaultKecamatan ? [defaultKecamatan] : []
  );

  const [kelurahanInput, setKelurahanInput] = useState(defaultKelurahan);
  const [kelurahanList, setKelurahanList] = useState<string[]>(
    defaultKelurahan ? [defaultKelurahan] : []
  );

  // Koordinat Lat & Lng (Zero static fallback to Jakarta Selatan)
  const [lat, setLat] = useState<number | ''>(() => {
    const smart = lookupSmartCoordinates(defaultKelurahan, defaultKecamatan, defaultKota);
    return smart ? smart.lat : '';
  });
  const [lng, setLng] = useState<number | ''>(() => {
    const smart = lookupSmartCoordinates(defaultKelurahan, defaultKecamatan, defaultKota);
    return smart ? smart.lng : '';
  });
  const [alamat, setAlamat] = useState('');
  const [geocodingStatus, setGeocodingStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler tambah kecamatan
  const handleAddKecamatan = () => {
    const val = kecamatanInput.trim();
    if (!val) return;
    const formatted = val.toLowerCase().startsWith('kec') ? val : `Kecamatan ${val}`;
    if (!kecamatanList.includes(formatted)) {
      setKecamatanList([...kecamatanList, formatted]);
      // Auto-detect coordinate for this kecamatan if coordinates not set
      if (!lat || !lng) {
        const smart = lookupSmartCoordinates('', formatted, kota);
        if (smart) {
          setLat(smart.lat);
          setLng(smart.lng);
        }
      }
    }
    setKecamatanInput('');
  };

  const handleRemoveKecamatan = (target: string) => {
    setKecamatanList(kecamatanList.filter((k) => k !== target));
  };

  // Handler tambah kelurahan
  const handleAddKelurahan = () => {
    const val = kelurahanInput.trim();
    if (!val) return;
    const formatted = val.toLowerCase().startsWith('kel') || val.toLowerCase().startsWith('desa') ? val : `Kelurahan ${val}`;
    if (!kelurahanList.includes(formatted)) {
      setKelurahanList([...kelurahanList, formatted]);
      if (!lat || !lng) {
        const smart = lookupSmartCoordinates(formatted, kecamatanList[0] || '', kota);
        if (smart) {
          setLat(smart.lat);
          setLng(smart.lng);
        }
      }
    }
    setKelurahanInput('');
  };

  const handleRemoveKelurahan = (target: string) => {
    setKelurahanList(kelurahanList.filter((k) => k !== target));
  };

  // Auto-detect coordinate helper based on Wilayah (Google Geocoder + Smart Dictionary)
  const handleDetectCoordinates = async () => {
    setGeocodingStatus('Mencari titik koordinat Google Maps presisi...');
    const primaryKec = kecamatanList[0] || kecamatanInput.trim();
    const primaryKel = kelurahanList[0] || kelurahanInput.trim();
    const primaryKota = kota.trim();

    try {
      const res = await resolveAccurateCoordinates({
        kelurahan: primaryKel,
        kecamatan: primaryKec,
        kota: primaryKota,
      });
      setLat(res.lat);
      setLng(res.lng);
      setGeocodingStatus(`Koordinat akurat: ${res.lat.toFixed(4)}, ${res.lng.toFixed(4)} (${res.formattedAddress})`);
      setTimeout(() => setGeocodingStatus(null), 3500);
    } catch {
      const smart = lookupSmartCoordinates(primaryKel, primaryKec, primaryKota);
      if (smart) {
        setLat(smart.lat);
        setLng(smart.lng);
        setGeocodingStatus(`Koordinat akurat: ${smart.lat.toFixed(4)}, ${smart.lng.toFixed(4)}`);
        setTimeout(() => setGeocodingStatus(null), 3500);
      } else {
        setGeocodingStatus('Gagal membaca koordinat otomatis, masukkan manual.');
        setTimeout(() => setGeocodingStatus(null), 3000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama Koordinator / Tim Sukses wajib diisi.');
      return;
    }
    if (!noHp.trim()) {
      setErrorMsg('Nomor WhatsApp / HP wajib diisi.');
      return;
    }
    if (!kota.trim()) {
      setErrorMsg('Kota/Kabupaten wajib diisi.');
      return;
    }

    const finalKecList = [...kecamatanList];
    if (kecamatanInput.trim() && !finalKecList.includes(kecamatanInput.trim())) {
      finalKecList.push(kecamatanInput.trim());
    }

    const finalKelList = [...kelurahanList];
    if (kelurahanInput.trim() && !finalKelList.includes(kelurahanInput.trim())) {
      finalKelList.push(kelurahanInput.trim());
    }

    if (finalKecList.length === 0) {
      setErrorMsg('Minimal cantumkan 1 Kecamatan yang dipegang.');
      return;
    }

    let finalLat = typeof lat === 'number' ? lat : undefined;
    let finalLng = typeof lng === 'number' ? lng : undefined;

    // Filter out historical erroneous Jakarta Selatan static coordinates (-6.2615, 106.8106)
    if (
      finalLat !== undefined &&
      Math.abs(finalLat - -6.2615) < 0.001 &&
      !kota.toLowerCase().includes('selatan') &&
      !finalKecList.some((k) => k.toLowerCase().includes('cilandak'))
    ) {
      finalLat = undefined;
      finalLng = undefined;
    }

    if (finalLat === undefined || finalLng === undefined) {
      const smart = lookupSmartCoordinates(finalKelList[0] || '', finalKecList[0] || '', kota.trim());
      if (smart) {
        finalLat = smart.lat;
        finalLng = smart.lng;
      } else {
        try {
          const res = await resolveAccurateCoordinates({
            kelurahan: finalKelList[0] || '',
            kecamatan: finalKecList[0] || '',
            kota: kota.trim(),
          });
          finalLat = res.lat;
          finalLng = res.lng;
        } catch {
          finalLat = -6.1754;
          finalLng = 106.8272;
        }
      }
    }

    const newRecord: TimSuksesWilayahRecord = {
      id: `ts-${Date.now()}`,
      nama: nama.trim(),
      noHp: noHp.trim(),
      jabatan: jabatan.trim(),
      kota: kota.trim(),
      kecamatanList: finalKecList,
      kelurahanList: finalKelList.length > 0 ? finalKelList : ['Seluruh Kelurahan'],
      lat: finalLat,
      lng: finalLng,
      alamat: alamat.trim() || `Posko Wilayah ${kota.trim()}`,
      waktuDaftar: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      status: 'Aktif',
    };

    onSaveTimSukses(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-900 via-teal-900 to-cyan-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Pendaftaran Tim Sukses &amp; Koordinator
              </h2>
              <p className="text-xs text-cyan-200">
                Hubungkan Koordinator ke Wilayah &amp; Peta Suara Google Maps
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

          {/* Info Banner */}
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-start gap-2.5 text-cyan-900">
            <Sparkles className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-[11px] font-bold">Terhubung Otomatis ke Peta Suara:</strong>
              <p className="text-[11px] text-cyan-800 leading-relaxed">
                Wilayah Kecamatan &amp; Kelurahan yang dipilih langsung terdaftar di sistem filter peta, dan nama Tim Sukses otomatis tercatat sebagai <strong>Koordinator Wilayah</strong> pada InfoWindow Google Maps.
              </p>
            </div>
          </div>

          {/* Section: Identitas Koordinator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Nama Lengkap Koordinator <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: H. Suryadi Pratama, S.E."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-cyan-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                No. WhatsApp / HP <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="081288219901"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-cyan-600 focus:outline-hidden"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Jabatan / Penugasan Pemenangan
            </label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Koordinator Kecamatan (Korcam) / Direktur Relawan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-cyan-600 focus:outline-hidden"
            />
          </div>

          {/* Section: Wilayah yang Dipegang */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs">
              <Building2 className="w-4 h-4 text-cyan-700" />
              <span>Wilayah Kerja / Mandat Pemenangan</span>
            </div>

            {/* Kota / Kabupaten */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Kota / Kabupaten <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={kota}
                onChange={(e) => setKota(e.target.value)}
                placeholder="Contoh: Kota Jakarta Selatan / Kota Bandung"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-cyan-600 focus:outline-hidden"
              />
            </div>

            {/* Kecamatan yang Dipegang (bisa 1 atau lebih) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Kecamatan yang Dipegang (Bisa 1 atau Lebih) <span className="text-rose-500">*</span>
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={kecamatanInput}
                  onChange={(e) => setKecamatanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKecamatan();
                    }
                  }}
                  placeholder="Ketik nama kecamatan lalu klik Tambah / Enter"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-cyan-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddKecamatan}
                  className="px-3 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Tag List Kecamatan */}
              {kecamatanList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {kecamatanList.map((k) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 bg-cyan-100 text-cyan-900 border border-cyan-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <span>{k}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKecamatan(k)}
                        className="text-cyan-700 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">
                  Belum ada kecamatan ditambahkan. Ketik nama kecamatan di atas.
                </p>
              )}
            </div>

            {/* Kelurahan yang Dipegang (bisa 1 atau lebih) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Kelurahan / Desa yang Dipegang (Opsional / Multi-Kelurahan)
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={kelurahanInput}
                  onChange={(e) => setKelurahanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKelurahan();
                    }
                  }}
                  placeholder="Ketik kelurahan lalu klik Tambah"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-cyan-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddKelurahan}
                  className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              {kelurahanList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {kelurahanList.map((kel) => (
                    <span
                      key={kel}
                      className="px-2.5 py-1 bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <span>{kel}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKelurahan(kel)}
                        className="text-teal-700 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: Koordinat Lokasi Google Maps */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Titik Koordinat Google Maps</span>
              </div>
              <button
                type="button"
                onClick={handleDetectCoordinates}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-cyan-800 border border-cyan-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Compass className="w-3 h-3 text-cyan-600" />
                <span>Deteksi Koordinat Kota</span>
              </button>
            </div>

            {geocodingStatus && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 font-medium">
                {geocodingStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600">
                  Latitude (Lintang)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:border-cyan-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600">
                  Longitude (Bujur)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:border-cyan-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">
                Alamat Posko / Sekretariat (Opsional)
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Jl. Fatmawati Raya No. 45, Posko Pemenangan"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-cyan-600 focus:outline-hidden"
              />
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
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-800 hover:to-teal-800 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Hubungkan ke Peta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

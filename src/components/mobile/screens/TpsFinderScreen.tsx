import React, { useState, useEffect } from 'react';
import { VoterProfile, FormC1Upload, FormB1Upload } from '../../../types/vore';
import { APP_IMAGES } from '../../../assets/images';
import { AutoCekNikModal } from '../../common/AutoCekNikModal';
import { FormC1UploadModal } from '../../common/FormC1UploadModal';
import { FormB1UploadModal } from '../../common/FormB1UploadModal';
import {
  Navigation,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  UploadCloud,
  MapPin,
  Clock,
  Shield,
  Camera,
  Check,
  Compass,
  AlertCircle,
  CreditCard,
  Calculator,
  Image,
  Building2,
} from 'lucide-react';

interface TpsFinderScreenProps {
  profile: VoterProfile;
  onCheckinCoblos: (photoUrl?: string) => void;
  onSubmitC1: (c1Data: Partial<FormC1Upload>) => void;
  onSubmitB1?: (b1Data: Partial<FormB1Upload>) => void;
  onOpenQuickCount?: () => void;
}

export const TpsFinderScreen: React.FC<TpsFinderScreenProps> = ({
  profile,
  onCheckinCoblos,
  onSubmitC1,
  onSubmitB1,
  onOpenQuickCount,
}) => {
  // Live ticking countdown
  const [timeLeft, setTimeLeft] = useState({
    hari: 7,
    jam: 12,
    menit: 34,
    detik: 56,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.detik > 0) return { ...prev, detik: prev.detik - 1 };
        if (prev.menit > 0) return { ...prev, menit: 59, detik: 59 };
        if (prev.jam > 0) return { ...prev, jam: prev.jam - 1, menit: 59, detik: 59 };
        if (prev.hari > 0) return { ...prev, hari: prev.hari - 1, jam: 23, menit: 59, detik: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modals / sub-views
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showPanduanModal, setShowPanduanModal] = useState(false);
  const [showSimulasiModal, setShowSimulasiModal] = useState(false);
  const [selectedPaslon, setSelectedPaslon] = useState<number | null>(1);
  const [showCoblosCheckinModal, setShowCoblosCheckinModal] = useState(false);
  const [showC1Modal, setShowC1Modal] = useState(false);
  const [showB1Modal, setShowB1Modal] = useState(false);
  const [showCekNikModal, setShowCekNikModal] = useState(false);

  // Form C1 state
  const [c1Paslon1, setC1Paslon1] = useState('145');
  const [c1Paslon2, setC1Paslon2] = useState('62');
  const [c1Paslon3, setC1Paslon3] = useState('24');
  const [c1TidakSah, setC1TidakSah] = useState('4');
  const [fotoC1Url, setFotoC1Url] = useState<string>(
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80'
  );

  // Live Real Count calculations
  const p1 = Number(c1Paslon1) || 0;
  const p2 = Number(c1Paslon2) || 0;
  const p3 = Number(c1Paslon3) || 0;
  const tidakSah = Number(c1TidakSah) || 0;
  const totalSah = p1 + p2 + p3;
  const totalMasuk = totalSah + tidakSah;
  const pctPaslon1 = totalSah > 0 ? ((p1 / totalSah) * 100).toFixed(1) : '0';

  const handleC1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitC1({
      tps: profile.tps,
      kelurahan: profile.kelurahan,
      kecamatan: profile.kecamatan,
      saksiNama: profile.nama,
      suaraPaslon1: p1,
      suaraPaslon2: p2,
      suaraPaslon3: p3,
      suaraTidakSah: tidakSah,
      totalSuaraSah: totalSah,
      fotoC1Url,
      statusVerifikasi: 'Terverifikasi',
    });
    setShowC1Modal(false);
  };

  return (
    <div className="flex flex-col space-y-4 pb-12">
      {/* Top Title & Security Tag */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">TPS &amp; Info</h1>
          <p className="text-xs text-slate-500">
            Panduan lokasi TPS, auto cek DPT NIK KTP, &amp; pelaporan C1.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCekNikModal(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-full border border-cyan-200 transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
            <span>Cek NIK DPT</span>
          </button>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>DPT Sah</span>
          </div>
        </div>
      </div>

      {/* Countdown Card (Slide 12) */}
      <div className="p-4 bg-gradient-to-br from-cyan-50 via-sky-50 to-white text-slate-900 rounded-3xl shadow-xs border border-cyan-200 text-center relative overflow-hidden">
        <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-widest block mb-2">
          Hari Pemilihan Umum 2026
        </span>
        <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {String(timeLeft.hari).padStart(2, '0')}
            </span>
            <span className="block text-[9px] text-slate-500 uppercase font-semibold mt-0.5">
              Hari
            </span>
          </div>
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {String(timeLeft.jam).padStart(2, '0')}
            </span>
            <span className="block text-[9px] text-slate-500 uppercase font-semibold mt-0.5">
              Jam
            </span>
          </div>
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
            <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {String(timeLeft.menit).padStart(2, '0')}
            </span>
            <span className="block text-[9px] text-slate-500 uppercase font-semibold mt-0.5">
              Menit
            </span>
          </div>
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
            <span className="text-2xl font-black font-mono tabular-nums text-cyan-600">
              {String(timeLeft.detik).padStart(2, '0')}
            </span>
            <span className="block text-[9px] text-cyan-700 uppercase font-semibold mt-0.5">
              Detik
            </span>
          </div>
        </div>
      </div>

      {/* TPS Anda Card (Slide 12) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              TPS Anda
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {profile.tps}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>
                {profile.kelurahan}, {profile.kecamatan}, {profile.kota}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Halaman SDN Sukamaju 01 Pagi · Jam Buka: 07.00 - 13.00 WIB
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
            <img
              src={APP_IMAGES.tpsLocation}
              alt="Lokasi TPS"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/images/vore_tps_location_1790655668361.jpg';
              }}
            />
          </div>
        </div>

        {/* Action Buttons for TPS */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => setShowRouteModal(true)}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Petunjuk Jalan ke TPS Saya (280 meter)</span>
          </button>

          <button
            onClick={() => setShowPanduanModal(true)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>Panduan Cara Coblos Sah</span>
          </button>
        </div>
      </div>

      {/* Simulasi Surat Suara Card (Slide 12) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Simulasi Surat Suara</span>
          <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
            Tahun 2026
          </span>
        </div>

        {/* Mini ballot paper preview */}
        <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2 text-center">
          <span className="text-[10px] font-bold tracking-widest text-slate-700 uppercase block">
            Surat Suara Pemilihan Umum Tahun 2026
          </span>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((no) => {
              const isSelected = selectedPaslon === no;
              return (
                <button
                  key={no}
                  type="button"
                  onClick={() => setSelectedPaslon(no)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-cyan-500 shadow-sm ring-2 ring-cyan-400/40'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center mx-auto mb-1.5">
                    {no}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 mx-auto flex items-center justify-center text-xs font-bold text-slate-600 mb-1 border border-slate-200">
                    Paslon {no}
                  </div>
                  <span className="text-[9px] font-semibold text-slate-600 block line-clamp-1">
                    {no === 1 ? 'Aspirasi Rakyat' : no === 2 ? 'Kombinasi Maju' : 'Harapan Bangsa'}
                  </span>

                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-xs">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500">
            Klik nomor paslon untuk melihat simulasi coblos tepat di dalam kotak.
          </p>
        </div>
      </div>

      {/* Pengingat Hari H Milestones (Slide 6 & 12) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-900">Pengingat Menuju Hari H</h2>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-200">
            <span className="block text-xs font-bold text-cyan-800">H-7</span>
            <span className="text-[9px] text-cyan-700 block mt-0.5">Lokasi TPS</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-xs font-bold text-slate-700">H-3</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Cek KTP/DPT</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
            <span className="block text-xs font-bold text-amber-800">H-1</span>
            <span className="text-[9px] text-amber-700 block mt-0.5">Rute &amp; Jadwal</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="block text-xs font-bold text-emerald-800">Hari H</span>
            <span className="text-[9px] text-emerald-700 block mt-0.5">Coblos &amp; C1</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button: "Saya Sudah Mencoblos" (Slide 6 & 12) */}
      <div className="pt-2">
        {profile.sudahMencoblos ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-3xl text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Anda Telah Menggunakan Hak Suara!</span>
            </div>
            <p className="text-xs text-emerald-700">
              Terima kasih telah berkontribusi bagi demokrasi di {profile.tps}. Status kehadiran TPS Anda telah terverifikasi.
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowCoblosCheckinModal(true)}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>✓ Saya Sudah Mencoblos di TPS</span>
          </button>
        )}
      </div>

      {/* Relawan & Saksi C1 & B1 Portal (Slide 6: LIVE Unggah Form C1 · Form B1 · Quick Count) */}
      <div className="p-3.5 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-50/50 text-slate-900 rounded-3xl border border-cyan-200/80 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-700" />
            <span className="text-xs font-bold text-slate-900">Portal Saksi &amp; Rekapitulasi Suara</span>
          </div>
          <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-200">
            Quick Count Live
          </span>
        </div>
        <p className="text-[11px] text-slate-600">
          Kader atau saksi resmi dapat mengunggah file foto/scan Formulir C1 Plano (TPS) serta Formulir B1 (Rekap Kecamatan) untuk tabulasi Quick Count real-time.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={() => setShowC1Modal(true)}
            className="w-full py-2.5 px-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            <span>Unggah Form C1</span>
          </button>

          <button
            onClick={() => setShowB1Modal(true)}
            className="w-full py-2.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Unggah Form B1</span>
          </button>
        </div>

        {onOpenQuickCount && (
          <button
            onClick={onOpenQuickCount}
            className="w-full py-2 bg-white hover:bg-cyan-50 text-cyan-800 text-xs font-bold rounded-xl border border-cyan-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-600" />
            <span>Buka Tabulasi Quick Count Terhubung</span>
          </button>
        )}
      </div>

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Petunjuk Rute ke TPS 047</span>
              <button
                onClick={() => setShowRouteModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stylized map mock */}
            <div className="h-44 bg-cyan-50 rounded-2xl relative overflow-hidden border border-cyan-200 flex flex-col justify-between p-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-900">
                <span>📍 Titik Anda (Jl. Melati 3)</span>
                <span>🏁 TPS 047 (SDN Sukamaju 01)</span>
              </div>
              {/* Walking path line */}
              <div className="w-full flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 bg-white/90 px-3 py-1.5 rounded-full shadow-xs border border-cyan-200">
                  <Compass className="w-4 h-4 text-cyan-600 animate-spin" />
                  <span>Jarak 280 m · 4 Menit Jalan Kaki</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 bg-white/80 p-1.5 rounded-lg">
                Petunjuk: Keluar dari gang Jl. Melati 3 belok kanan, lurus 200m ke gerbang utama SDN Sukamaju 01.
              </p>
            </div>

            <button
              onClick={() => setShowRouteModal(false)}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Tutup Petunjuk
            </button>
          </div>
        </div>
      )}

      {/* Panduan Cara Coblos Modal */}
      {showPanduanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Panduan Coblos Sah 2026</span>
              <button
                onClick={() => setShowPanduanModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">1. Dokumen yang Harus Dibawa</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  e-KTP asli dan formulir C-Pemberitahuan KPU yang telah dibagikan ketua RT.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">2. Di Bilik Suara</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Buka surat suara lebar-lebar. Pastikan tidak ada sobekan awal sebelum dicoblos. Gunakan paku yang disediakan.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">3. Kriteria Suara Sah</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Coblosan harus berada di dalam batas garis kotak paslon yang dipilih (pada nomor, foto, atau nama paslon).
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">4. Celupkan Jari ke Tinta</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Celupkan salah satu jari tangan hingga mengenai kuku sebagai tanda bukti telah menggunakan hak pilih.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPanduanModal(false)}
              className="w-full py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Checkin Coblos Modal (Photo upload / confirmation) */}
      {showCoblosCheckinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Check-in Kehadiran TPS</span>
              <button
                onClick={() => setShowCoblosCheckinModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Konfirmasi Selesai Mencoblos
              </h3>
              <p className="text-xs text-slate-500">
                Unggah foto jari ungu berstempel tinta pemilu sebagai konfirmasi kehadiran nyata di {profile.tps}.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-1">
              <span className="text-xs font-semibold text-slate-700 block">
                Foto Jari Tinta Pemilu Terverifikasi
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block">
                +100 Poin Suara Tambahan
              </span>
            </div>

            <button
              onClick={() => {
                onCheckinCoblos(APP_IMAGES.voterAvatar);
                setShowCoblosCheckinModal(false);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Simpan &amp; Konfirmasi Hadir di TPS
            </button>
          </div>
        </div>
      )}

      {/* Form C1 Saksi Modal with Real File Upload */}
      <FormC1UploadModal
        isOpen={showC1Modal}
        onClose={() => setShowC1Modal(false)}
        defaultTps={profile.tps}
        defaultKelurahan={profile.kelurahan}
        defaultKecamatan={profile.kecamatan}
        defaultSaksiNama={profile.nama}
        onSubmitC1={onSubmitC1}
      />

      {/* Form B1 Kecamatan / PPK Modal with Real File Upload */}
      <FormB1UploadModal
        isOpen={showB1Modal}
        onClose={() => setShowB1Modal(false)}
        defaultKecamatan={profile.kecamatan}
        defaultKelurahan={`${profile.kelurahan} & Sekitarnya`}
        defaultDapil={profile.dapil}
        defaultKoordinator={profile.nama}
        onSubmitB1={(data) => {
          if (onSubmitB1) onSubmitB1(data);
          setShowB1Modal(false);
        }}
      />

      {/* Auto Cek NIK DPT KPU Modal */}
      <AutoCekNikModal
        isOpen={showCekNikModal}
        onClose={() => setShowCekNikModal(false)}
        onSaveVoter={() => {}}
      />
    </div>
  );
};

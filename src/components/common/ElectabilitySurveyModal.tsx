import React, { useState } from 'react';
import { ElectabilitySurveySubmission } from '../../types/vore';
import {
  Vote,
  X,
  Wifi,
  WifiOff,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Users,
  Search,
  Plus,
  Send,
  Download,
  Sparkles,
  HelpCircle,
  FileCheck2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { lookupDptKpu } from '../../data/dptData';

interface ElectabilitySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyList: ElectabilitySurveySubmission[];
  onSubmitSurvey: (submission: ElectabilitySurveySubmission, points: number) => void;
}

export const ElectabilitySurveyModal: React.FC<ElectabilitySurveyModalProps> = ({
  isOpen,
  onClose,
  surveyList,
  onSubmitSurvey,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'tabulasi' | 'riwayat'>('form');

  // Form states
  const [respondenNama, setRespondenNama] = useState('');
  const [respondenNik, setRespondenNik] = useState('');
  const [respondenHp, setRespondenHp] = useState('');
  const [kelurahan, setKelurahan] = useState('Kel. Sukamaju');
  const [tps, setTps] = useState('TPS 047');
  const [pilihanPaslon, setPilihanPaslon] = useState<
    'Paslon 01 (Kandidat Utama)' | 'Paslon 02' | 'Paslon 03' | 'Belum Menentukan'
  >('Paslon 01 (Kandidat Utama)');
  const [tingkatKemantapan, setTingkatKemantapan] = useState<
    'Sangat Mantap' | 'Cukup Mantap' | 'Masih Ragu / Bisa Berubah'
  >('Sangat Mantap');
  const [alasanMemilih, setAlasanMemilih] = useState(
    'Program Kerja Nyata, Merakyat, & Berintegritas'
  );
  const [isuPrioritas, setIsuPrioritas] = useState(
    'Peluang Kerja & Bantuan Modal Usaha UMKM'
  );
  const [catatanAspirasi, setCatatanAspirasi] = useState('');
  const [dptNotice, setDptNotice] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle NIK lookup for rapid field population
  const handleNikInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    setRespondenNik(clean);

    if (clean.length === 16) {
      const dpt = lookupDptKpu(clean);
      if (dpt) {
        setRespondenNama(dpt.nama);
        setKelurahan(dpt.kelurahan);
        setTps(dpt.tps);
        setDptNotice(`✅ Terverifikasi DPT KPU: ${dpt.nama} (${dpt.tps} - ${dpt.kelurahan})`);
      }
    } else {
      setDptNotice(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondenNama.trim()) return;

    const masked = respondenNik.length >= 8
      ? `${respondenNik.slice(0, 4)} •••• •••• ${respondenNik.slice(-4)}`
      : '3174 •••• •••• 9901';

    const newSurvey: ElectabilitySurveySubmission = {
      id: `srv-${Date.now()}`,
      voterNama: respondenNama,
      voterNikMasked: masked,
      tps,
      kelurahan,
      pilihanKandidat: pilihanPaslon,
      alasanMemilih: catatanAspirasi ? `${alasanMemilih} - "${catatanAspirasi}"` : alasanMemilih,
      tingkatKemantapan,
      isuPrioritas,
      waktu: 'Baru saja',
      isOffline: false,
      statusSinkron: 'Tersinkron',
    };

    onSubmitSurvey(newSurvey, 0);

    setIsSubmittedSuccess(true);
    setTimeout(() => {
      setIsSubmittedSuccess(false);
      setRespondenNama('');
      setRespondenNik('');
      setRespondenHp('');
      setCatatanAspirasi('');
      setActiveTab('tabulasi');
    }, 1200);
  };

  // Calculations for real-time tabulasi
  const totalResponden = surveyList.length;
  const p1Count = surveyList.filter((s) => s.pilihanKandidat === 'Paslon 01 (Kandidat Utama)').length;
  const p2Count = surveyList.filter((s) => s.pilihanKandidat === 'Paslon 02').length;
  const p3Count = surveyList.filter((s) => s.pilihanKandidat === 'Paslon 03').length;
  const undecidedCount = surveyList.filter((s) => s.pilihanKandidat === 'Belum Menentukan').length;

  const pctP1 = totalResponden > 0 ? ((p1Count / totalResponden) * 100).toFixed(1) : '0';
  const pctP2 = totalResponden > 0 ? ((p2Count / totalResponden) * 100).toFixed(1) : '0';
  const pctP3 = totalResponden > 0 ? ((p3Count / totalResponden) * 100).toFixed(1) : '0';
  const pctUndecided = totalResponden > 0 ? ((undecidedCount / totalResponden) * 100).toFixed(1) : '0';

  const strongCount = surveyList.filter((s) => s.tingkatKemantapan === 'Sangat Mantap').length;
  const swingCount = surveyList.filter((s) => s.tingkatKemantapan === 'Masih Ragu / Bisa Berubah').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200/90 my-auto text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with HD Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Survei Elektabilitas Paslon
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs">
                  SURVEI ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Sistem survei yang memudahkan anda mengukur elektabilitas kandidat secara online
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online Terhubung</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-cyan-600" />
            <span>Formulir Survei Online</span>
          </button>
          <button
            onClick={() => setActiveTab('tabulasi')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'tabulasi'
                ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
            <span>Tabulasi Elektabilitas</span>
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'riwayat'
                ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Riwayat ({surveyList.length})</span>
          </button>
        </div>

        {/* Tab 1: Form Isi Survei */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs max-h-[65vh] overflow-y-auto pr-1">
            {/* Success message banner */}
            {isSubmittedSuccess && (
              <div className="p-3 bg-emerald-500 text-white rounded-2xl font-bold text-center flex items-center justify-center gap-2 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Data Survei Berhasil Disimpan &amp; Memperbarui Tabulasi!</span>
              </div>
            )}

            {/* Voter / Responden Info Card */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider block">
                1. Data Responden / Pemilih di TPS
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    NIK Responden (16 Digit):
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={respondenNik}
                    onChange={(e) => handleNikInput(e.target.value)}
                    placeholder="Contoh: 3174012508890001"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                  {dptNotice && (
                    <p className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 p-1 rounded-md">
                      {dptNotice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Lengkap Responden:
                  </label>
                  <input
                    type="text"
                    required
                    value={respondenNama}
                    onChange={(e) => setRespondenNama(e.target.value)}
                    placeholder="Masukkan nama warga / pemilih"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    value={respondenHp}
                    onChange={(e) => setRespondenHp(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kelurahan:</label>
                  <select
                    value={kelurahan}
                    onChange={(e) => setKelurahan(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Kel. Sukamaju">Kel. Sukamaju</option>
                    <option value="Kel. Cilandak Barat">Kel. Cilandak Barat</option>
                    <option value="Kel. Lebak Bulus">Kel. Lebak Bulus</option>
                    <option value="Kel. Pondok Labu">Kel. Pondok Labu</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor TPS:</label>
                  <input
                    type="text"
                    value={tps}
                    onChange={(e) => setTps(e.target.value)}
                    placeholder="TPS 047"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Pilihan Kandidat & Elektabilitas */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider block">
                2. Preferensi Paslon &amp; Kemantapan Pilihan
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'Paslon 01 (Kandidat Utama)',
                    label: '01. Paslon 01 (Kandidat Utama)',
                    desc: 'Prioritas & Pilihan Rekomendasi Pemenangan',
                    color: 'border-cyan-500 bg-cyan-50/50 text-cyan-950 ring-1 ring-cyan-400',
                  },
                  {
                    id: 'Paslon 02',
                    label: '02. Paslon 02',
                    desc: 'Kandidat Kompetitor A',
                    color: 'border-slate-200 hover:border-slate-300 bg-white text-slate-800',
                  },
                  {
                    id: 'Paslon 03',
                    label: '03. Paslon 03',
                    desc: 'Kandidat Kompetitor B',
                    color: 'border-slate-200 hover:border-slate-300 bg-white text-slate-800',
                  },
                  {
                    id: 'Belum Menentukan',
                    label: '04. Belum Menentukan (Undecided)',
                    desc: 'Potensi Swing Voter yang Perlu Didekati',
                    color: 'border-amber-300 bg-amber-50/40 text-amber-900',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      pilihanPaslon === item.id ? item.color : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pilihanPaslon"
                      checked={pilihanPaslon === item.id}
                      onChange={() => setPilihanPaslon(item.id as any)}
                      className="mt-0.5 accent-cyan-600"
                    />
                    <div>
                      <span className="font-extrabold text-xs block">{item.label}</span>
                      <span className="text-[10px] opacity-75">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Tingkat Kemantapan */}
              <div className="pt-1">
                <label className="font-bold text-slate-700 block mb-1.5">
                  Tingkat Kemantapan Pilihan Responden:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      val: 'Sangat Mantap',
                      label: 'Sangat Mantap (Loyal)',
                      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                    },
                    {
                      val: 'Cukup Mantap',
                      label: 'Cukup Mantap',
                      color: 'bg-cyan-50 text-cyan-800 border-cyan-300',
                    },
                    {
                      val: 'Masih Ragu / Bisa Berubah',
                      label: 'Masih Ragu (Swing)',
                      color: 'bg-amber-50 text-amber-800 border-amber-300',
                    },
                  ].map((km) => (
                    <button
                      key={km.val}
                      type="button"
                      onClick={() => setTingkatKemantapan(km.val as any)}
                      className={`p-2 rounded-xl text-center border font-bold text-[11px] transition-all cursor-pointer ${
                        tingkatKemantapan === km.val
                          ? `${km.color} ring-2 ring-cyan-500 font-extrabold shadow-2xs`
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {km.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Faktor & Isu Prioritas */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider block">
                3. Faktor Alasan &amp; Isu Prioritas Warga
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Alasan Memilih Kandidat:
                  </label>
                  <select
                    value={alasanMemilih}
                    onChange={(e) => setAlasanMemilih(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Program Kerja Nyata, Merakyat, & Berintegritas">
                      Program Kerja Nyata, Merakyat, &amp; Berintegritas
                    </option>
                    <option value="Rekam jejak terbukti memperjuangkan keluhan warga">
                      Rekam jejak terbukti memperjuangkan keluhan warga
                    </option>
                    <option value="Karakter Jujur, Santun, & Peduli Rakyat Kecil">
                      Karakter Jujur, Santun, &amp; Peduli Rakyat Kecil
                    </option>
                    <option value="Rekomendasi Tokoh Masyarakat / Pemuka Agama">
                      Rekomendasi Tokoh Masyarakat / Pemuka Agama
                    </option>
                    <option value="Visi Pendidikan Gratis & Lapangan Kerja Terbuka">
                      Visi Pendidikan Gratis &amp; Lapangan Kerja Terbuka
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Isu Prioritas yang Diharapkan:
                  </label>
                  <select
                    value={isuPrioritas}
                    onChange={(e) => setIsuPrioritas(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    <option value="Peluang Kerja & Bantuan Modal Usaha UMKM">
                      Peluang Kerja &amp; Bantuan Modal Usaha UMKM
                    </option>
                    <option value="Stabilitas Harga Sembako & Biaya Hidup">
                      Stabilitas Harga Sembako &amp; Biaya Hidup
                    </option>
                    <option value="Perbaikan Saluran Air & Penanganan Banjir">
                      Perbaikan Saluran Air &amp; Penanganan Banjir
                    </option>
                    <option value="Puskesmas Siaga 24 Jam & Layanan Lansia">
                      Puskesmas Siaga 24 Jam &amp; Layanan Lansia
                    </option>
                    <option value="Beasiswa Pendidikan untuk Anak Tidak Mampu">
                      Beasiswa Pendidikan untuk Anak Tidak Mampu
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan Aspirasi / Kebutuhan Khusus Responden (Opsional):
                </label>
                <input
                  type="text"
                  value={catatanAspirasi}
                  onChange={(e) => setCatatanAspirasi(e.target.value)}
                  placeholder="Contoh: Titip perbaikan jalan berlubang di RT 03 dan penyuluhan wirausaha..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Status: <span className="font-bold text-emerald-600">Survei Online Terhubung</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold rounded-xl shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim &amp; Sinkronkan Survei Online</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Tabulasi & Visualisasi Elektabilitas */}
        {activeTab === 'tabulasi' && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            {/* Summary metrics header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-cyan-800 block">Total Responden</span>
                <span className="text-xl font-black font-mono text-cyan-900 mt-0.5 block">
                  {totalResponden.toLocaleString('id-ID')}
                </span>
                <span className="text-[9px] text-cyan-600 font-semibold">Tercatat di Sistem</span>
              </div>

              <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 block">Elektabilitas Paslon 01</span>
                <span className="text-xl font-black font-mono text-emerald-900 mt-0.5 block">
                  {pctP1}%
                </span>
                <span className="text-[9px] text-emerald-600 font-semibold">{p1Count} Suara Responden</span>
              </div>

              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-indigo-800 block">Pemilih Militan</span>
                <span className="text-xl font-black font-mono text-indigo-900 mt-0.5 block">
                  {strongCount}
                </span>
                <span className="text-[9px] text-indigo-600 font-semibold">Pasti Mencoblos</span>
              </div>

              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-amber-800 block">Swing Voter / Ragu</span>
                <span className="text-xl font-black font-mono text-amber-900 mt-0.5 block">
                  {swingCount}
                </span>
                <span className="text-[9px] text-amber-600 font-semibold">Target Sosialisasi</span>
              </div>
            </div>

            {/* HD Visual Electability Progress Bars */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3.5 shadow-md">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="font-extrabold text-xs text-cyan-300">
                  Persentase Elektabilitas Paslon Terkini
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Berdasarkan {totalResponden} Responden Lapangan
                </span>
              </div>

              {/* Paslon 01 */}
              <div>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span className="text-teal-300">01. Paslon 01 (Kandidat Utama)</span>
                  <span className="font-mono text-teal-200">{pctP1}% ({p1Count} Responden)</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(5, Number(pctP1))}%` }}
                  ></div>
                </div>
              </div>

              {/* Paslon 02 */}
              <div>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span className="text-amber-300">02. Paslon 02</span>
                  <span className="font-mono text-amber-200">{pctP2}% ({p2Count} Responden)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(5, Number(pctP2))}%` }}
                  ></div>
                </div>
              </div>

              {/* Paslon 03 */}
              <div>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span className="text-rose-300">03. Paslon 03</span>
                  <span className="font-mono text-rose-200">{pctP3}% ({p3Count} Responden)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-rose-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(5, Number(pctP3))}%` }}
                  ></div>
                </div>
              </div>

              {/* Undecided */}
              <div>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span className="text-slate-300">04. Belum Menentukan (Undecided)</span>
                  <span className="font-mono text-slate-300">{pctUndecided}% ({undecidedCount} Responden)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(5, Number(pctUndecided))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Isu Paling Menentukan di Lapangan */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="font-extrabold text-slate-800 block text-xs">
                Isu &amp; Kebutuhan yang Paling Menentukan Pilihan Warga:
              </span>
              <div className="space-y-1.5">
                {[
                  { isu: 'Peluang Kerja & Bantuan Modal UMKM', pct: 42 },
                  { isu: 'Stabilitas Harga Sembako & Biaya Hidup', pct: 31 },
                  { isu: 'Perbaikan Saluran Air & Drainase Bebas Banjir', pct: 15 },
                  { isu: 'Puskesmas Siaga 24 Jam & Layanan Lansia', pct: 12 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/70 text-xs">
                    <span className="font-semibold text-slate-700">{item.isu}</span>
                    <span className="font-black text-cyan-700 font-mono">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Survei Baru</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Riwayat Responden & Log Sinkronisasi */}
        {activeTab === 'riwayat' && (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-bold text-slate-700">
                Menampilkan {surveyList.length} Entri Survei Lapangan
              </span>
              <button
                onClick={() => {
                  const csvContent =
                    'data:text/csv;charset=utf-8,' +
                    ['Nama,NIK,TPS,Kelurahan,Pilihan,Kemantapan,Isu,Status']
                      .concat(
                        surveyList.map(
                          (s) =>
                            `"${s.voterNama}","${s.voterNikMasked}","${s.tps}","${s.kelurahan}","${s.pilihanKandidat}","${s.tingkatKemantapan}","${s.isuPrioritas}","${s.statusSinkron}"`
                        )
                      )
                      .join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Rekap_Survei_Elektabilitas_${Date.now()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-600" />
                <span>Unduh CSV Rekap</span>
              </button>
            </div>

            <div className="space-y-2">
              {surveyList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-2xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{item.voterNama}</span>
                        <span className="text-[10px] font-mono text-slate-400">{item.voterNikMasked}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {item.tps} · {item.kelurahan}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          item.statusSinkron === 'Tersinkron'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.statusSinkron}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.waktu}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-slate-500">Pilihan: </span>
                      <span className="font-bold text-slate-800">{item.pilihanKandidat}</span>
                    </div>
                    <span className="font-semibold text-cyan-700">{item.tingkatKemantapan}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    Alasan: {item.alasanMemilih} (Isu: {item.isuPrioritas})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AspirasiCategory, AspirasiItem } from '../../../types/vore';
import {
  GraduationCap,
  HeartPulse,
  Briefcase,
  Trees,
  Hammer,
  Send,
  MapPin,
  Paperclip,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  MessageCircle,
} from 'lucide-react';

interface AspirasiScreenProps {
  aspirasiList: AspirasiItem[];
  onSubmitAspirasi: (data: {
    kategori: AspirasiCategory;
    judul: string;
    deskripsi: string;
    lokasi: string;
  }) => void;
  onUpvoteAspirasi: (id: string) => void;
}

const CATEGORY_ITEMS: { id: AspirasiCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'Pendidikan', label: 'Pendidikan', icon: GraduationCap },
  { id: 'Kesehatan', label: 'Kesehatan', icon: HeartPulse },
  { id: 'Lapangan Kerja', label: 'Lapangan Kerja', icon: Briefcase },
  { id: 'Lingkungan', label: 'Lingkungan', icon: Trees },
  { id: 'Infrastruktur', label: 'Infrastruktur', icon: Hammer },
];

export const AspirasiScreen: React.FC<AspirasiScreenProps> = ({
  aspirasiList,
  onSubmitAspirasi,
  onUpvoteAspirasi,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AspirasiCategory>('Infrastruktur');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [lokasi, setLokasi] = useState('Kel. Sukamaju, RT 02 / RW 04, Cilandak');
  const [lampiranAdded, setLampiranAdded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Semua' | AspirasiCategory>('Semua');
  const [expandedAspirasiId, setExpandedAspirasiId] = useState<string | null>('asp-1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) return;

    onSubmitAspirasi({
      kategori: selectedCategory,
      judul,
      deskripsi,
      lokasi,
    });

    setJudul('');
    setDeskripsi('');
    setLampiranAdded(false);
    setFormOpen(false);
  };

  const filteredList =
    activeFilter === 'Semua'
      ? aspirasiList
      : aspirasiList.filter((a) => a.kategori === activeFilter);

  return (
    <div className="flex flex-col space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Aspirasi Warga</h1>
          <p className="text-xs text-slate-500">
            Sampaikan masukan, pantau tindak lanjut dua arah secara transparan.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{formOpen ? 'Tutup Form' : 'Sampaikan Aspirasi'}</span>
        </button>
      </div>

      {/* Form Submission Accordion */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white rounded-2xl border border-cyan-200 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Formulir Aspirasi Baru</span>
            <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
              Respon Tim Dapil
            </span>
          </div>

          {/* Kategori Isu */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
              Pilih Kategori Isu
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORY_ITEMS.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-white shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[9px] leading-tight line-clamp-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Judul Masukan */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Judul Masukan
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Tuliskan ringkasan aspirasi Anda..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Deskripsi Masukan */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Deskripsi Masukan
            </label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan aspirasi Anda secara detail dan dampaknya bagi lingkungan..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden resize-none"
              required
            />
          </div>

          {/* Lokasi */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Lokasi Terkait
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Lampiran */}
          <div>
            <button
              type="button"
              onClick={() => setLampiranAdded(!lampiranAdded)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:border-cyan-500 hover:text-cyan-700 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>
                {lampiranAdded ? '✓ 1 Foto Lokasi Terlampir (bukti_lapangan.jpg)' : 'Tambah Lampiran Foto / Bukti Lokasi (Opsional)'}
              </span>
            </button>
          </div>

          {/* Kirim Button */}
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Aspirasi ke Tim Tindak Lanjut</span>
          </button>
        </form>
      )}

      {/* Siklus Kepercayaan Infographic Banner (Slide 5) */}
      <div className="p-3.5 bg-gradient-to-r from-cyan-50 via-teal-50 to-white text-slate-900 rounded-2xl border border-cyan-200/80 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-cyan-800 tracking-wide text-[10px] uppercase">
            Siklus Kepercayaan Dua Arah
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Transparansi Real-Time</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] relative">
          <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <span className="block font-bold text-slate-800">1. Dengarkan</span>
            <span className="text-[9px] text-slate-500">Aspirasi Masuk</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-cyan-300 shadow-xs">
            <span className="block font-bold text-cyan-700">2. Progres</span>
            <span className="text-[9px] text-slate-500">Kader &amp; Tim Kerja</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-emerald-300 shadow-xs">
            <span className="block font-bold text-emerald-700">3. Solusi</span>
            <span className="text-[9px] text-slate-500">Aksi Nyata</span>
          </div>
        </div>
      </div>

      {/* Status Aspirasi List Header & Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Status Aspirasi Wilayah ({filteredList.length})
          </h2>
          <span className="text-[11px] text-cyan-600 font-medium">Single Source of Truth</span>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveFilter('Semua')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'Semua'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Isu
          </button>
          {CATEGORY_ITEMS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveFilter(c.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === c.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-12 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mx-auto border border-cyan-100">
                <Send className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Aspirasi yang Diinput</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Data sebelumnya telah dikosongkan. Sampaikan aspirasi warga pertama Anda melalui formulir di atas untuk diproses tim kerja!
                </p>
              </div>
            </div>
          ) : (
            filteredList.map((item) => {
            const isExpanded = expandedAspirasiId === item.id;
            const statusColor =
              item.status === 'Selesai'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : item.status === 'Diproses'
                ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-cyan-700 bg-cyan-50 border-cyan-200';

            return (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="font-semibold text-slate-700">{item.kategori}</span>
                      <span>·</span>
                      <span>{item.tanggal}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                      {item.judul}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor} shrink-0`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.deskripsi}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.lokasi}</span>
                </div>

                {/* Progress bar timeline */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                    <span className={item.status === 'Masuk' ? 'text-cyan-600' : ''}>1. Masuk</span>
                    <span className={item.status === 'Diproses' ? 'text-amber-600' : ''}>2. Diproses</span>
                    <span className={item.status === 'Selesai' ? 'text-emerald-600 font-bold' : ''}>
                      3. Selesai
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'Selesai'
                          ? 'w-full bg-emerald-500'
                          : item.status === 'Diproses'
                          ? 'w-2/3 bg-amber-500'
                          : 'w-1/3 bg-cyan-500'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Official Response Toggle */}
                {item.tanggapanResmi && (
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() =>
                        setExpandedAspirasiId(isExpanded ? null : item.id)
                      }
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Tanggapan Resmi Tim Caleg &amp; Progres ({item.tanggapanResmi.progresPersen}%)
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-bold text-slate-800">
                            {item.tanggapanResmi.oleh} ({item.tanggapanResmi.jabatan})
                          </span>
                          <span>{item.tanggapanResmi.waktu}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          "{item.tanggapanResmi.pesan}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upvote & engagement bar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onUpvoteAspirasi(item.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-cyan-600 transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Dukung ({item.upvotes})</span>
                  </button>
                  <span className="text-[10px] text-slate-400">
                    ID: {item.id.toUpperCase()} · Terenkripsi
                  </span>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  MapPin,
  CheckCircle2,
  Share2,
  X,
  Building2,
  Copy,
  Check,
  Compass,
  TrendingUp,
  MessageSquare,
  Users,
  Target,
  ShieldAlert,
  Flame,
  FileText,
  Lightbulb,
} from 'lucide-react';

interface GeopolitikPreset {
  id: string;
  namaWilayah: string;
  karakteristik: string;
  isuKunci: string[];
  targetVoters: string;
}

const GEOPOLITIK_PRESETS: GeopolitikPreset[] = [
  {
    id: 'geo-1',
    namaWilayah: 'DAPIL DKI Jakarta II (Jakarta Selatan, Pusat & Luar Negeri)',
    karakteristik: 'Karakter Urban Metropolitan, Pemilih Kritis, 54% Gen Z & Milenial, Melek Digital',
    isuKunci: ['Ketersediaan Lapangan Kerja Kreatif', 'Perumahan Terjangkau (DP 0%)', 'Transportasi Terintegrasi & Polusi'],
    targetVoters: 'Profesional Muda, Mahasiswa, Komunitas Kreatif & Pekerja Urban',
  },
  {
    id: 'geo-2',
    namaWilayah: 'Jawa Barat Dapil III (Kota Bogor & Kab. Cianjur)',
    karakteristik: 'Perpaduan Urban-Suburban & Basis Religius/Pesantren, UMKM Kuliner & Sektor Pertanian',
    isuKunci: ['Stabilitas Harga Sembako & Pupuk', 'Bantuan Modal UMKM', 'Pendidikan Pesantren & Fasilitas Kesehatan'],
    targetVoters: 'Tokoh Agama/Kyai, Pelaku UMKM, Petani Muda & Emak-emak Pasar',
  },
  {
    id: 'geo-3',
    namaWilayah: 'Jawa Timur Dapil I (Kota Surabaya & Kab. Sidoarjo)',
    karakteristik: 'Pusat Industri & Maritim Jawa Timur, Basis Nahdliyin & Buruh Pabrik, Pemilih Pragmatis-Kritis',
    isuKunci: ['Kepastian Upah Minimum & Ketenagakerjaan', 'Layanan BPJS & Rumah Sakit Bebas Antre', 'Banjir & Tata Ruang'],
    targetVoters: 'Serikat Buruh, Nahdliyin Kultural, Pedagang Sentra Kuliner, Pelajar SMK',
  },
  {
    id: 'geo-4',
    namaWilayah: 'Dapil Luar Jawa (Kawasan Perkebunan, Pesisir & Kepulauan)',
    karakteristik: 'Jarak Antar-Desa Jauh, Basis Kekerabatan & Adat Kuat, Tergantung Komoditas Sawit/Karet/Nelayan',
    isuKunci: ['Harga Komoditas Tani/Perkebunan', 'Infrastruktur Jalan Desa & Jembatan', 'Akses Internet & Sinyal BTS'],
    targetVoters: 'Kepala Desa, Tokoh Adat/Marga, Kelompok Tani/Nelayan, Pemuda Karang Taruna',
  },
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  kategori?: 'strategi' | 'narasi' | 'wa_blazt' | 'counter_isu' | 'analisis_lawan';
  geopolitikInfo?: string;
  rekomendasiAksi?: string[];
}

interface AiPilcalegModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'tim_sukses';
  onNavigateToBlazt?: () => void;
}

export const AiPilcalegModal: React.FC<AiPilcalegModalProps> = ({
  isOpen,
  onClose,
  userRole = 'admin',
  onNavigateToBlazt,
}) => {
  const [selectedGeo, setSelectedGeo] = useState<GeopolitikPreset>(GEOPOLITIK_PRESETS[0]);
  const [activeKategori, setActiveKategori] = useState<'strategi' | 'narasi' | 'wa_blazt' | 'counter_isu' | 'analisis_lawan'>('strategi');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Halo ${userRole === 'admin' ? 'Administrator Utama' : 'Tim Sukses'}! Saya AI PILCALEG (AI Simcaleg Intelligence).\n\nSaya dirancang khusus untuk menganalisis geopolitik wilayah pemilihan dan menyusun **strategi kampanye mikro-targeting**, **narasi pidato persuasif**, **naskah WhatsApp Blazt simpatik**, hingga **counter-narasi isu lawan** yang siap dieksekusi di lapangan.`,
      timestamp: 'Baru saja',
      rekomendasiAksi: [
        'Susun narasi pidato 3 menit untuk Gen Z di wilayah ini',
        'Analisis strategi door-to-door kader untuk swing voters',
        'Buatkan draf pesan WhatsApp Blazt untuk emak-emak dan UMKM',
        'Bagaimana cara counter isu hoaks politik identitas?',
      ],
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateAiResponse = (userPrompt: string, geo: GeopolitikPreset): { text: string; rekomendasi: string[] } => {
    const p = userPrompt.toLowerCase();

    if (p.includes('narasi') || p.includes('pidato') || p.includes('kampanye')) {
      return {
        text: `### 🎙️ REKOMENDASI NARASI KAMPANYE POLITIK (GEOPOLITIK: ${geo.namaWilayah})\n\n**1. Hook Pembuka (Emosional & Kedekatan Lokal):**\n"Bapak, Ibu, dan Sahabat muda sekalian... Setiap saya menyusuri sudut ${geo.namaWilayah.split('(')[0].trim()}, saya melihat kerja keras tanpa lelah: para pedagang yang membuka kios sebelum fajar, anak muda dengan mimpi besar, dan orang tua yang mendoakan masa depan terbaik bagi anak-anaknya."\n\n**2. Core Message (Solusi Nyata & Isu Kunci):**\n"Masyarakat tidak butuh janji di awang-awang. Yang dibutuhkan adalah solusi konkret: **${geo.isuKunci.join('**, **')}**. Kami tidak hadir dengan tangan kosong. Melalui sistem SWARAKU, setiap aspirasi warga TPS tercatat langsung dan menjadi komitmen hitam di atas putih yang diaudit publik!"\n\n**3. Call to Action (Ajakan Memilih & Kawal TPS):**\n"Mari kita kawal suara perubahan ini. Titipkan harapan panjenengan semua di TPS nanti. Jangan biarkan masa depan kita ditentukan oleh orang lain!"`,
        rekomendasi: [
          'Jadikan naskah ini bahan orasi tatap muka 5 menit',
          'Ekspor cuplikan ke WhatsApp Blazt Kader TPS',
          'Buatkan versi singkat 60 detik untuk video TikTok / Reels',
        ],
      };
    }

    if (p.includes('wa') || p.includes('blazt') || p.includes('whatsapp') || p.includes('pesan')) {
      return {
        text: `### 📱 TEMPLATE WHATSAPP BLAZT SIMPATIK BERDASARKAN GEOPOLITIK\n**Wilayah Target:** ${geo.namaWilayah}\n**Segmen:** ${geo.targetVoters}\n\n---\n*Assalamu'alaikum Wr. Wb. / Salam Sejahtera Saudaraku warga [Nama Kelurahan/TPS],*\n\nSemoga Bapak/Ibu sekeluarga senantiasa sehat dan dilimpahkan rezeki.\n\nMenjelang hari pemilihan di [TPS Anda], kami ingin menyampaikan komitmen tulus dari kandidat kita untuk memperjuangkan **${geo.isuKunci[0]}** dan membuka akses **${geo.isuKunci[1]}** yang merata di wilayah kita.\n\n✨ *Suara Anda adalah penentu arah pembangunan.* \nBila ada aspirasi atau keluhan fasilitas di lingkungan RT/RW Bapak/Ibu, silakan sampaikan langsung lewat relawan SWARAKU di TPS.\n\n*Mari bersama kawal TPS dan wujudkan kemajuan nyata!*\n---\n*(Karakter: 142 kata · Tingkat keterbacaan tinggi · Ramah & Non-Agresif)*`,
        rekomendasi: [
          'Kirim via Modul WhatsApp Blazt SWARAKU',
          'Ubah tone menjadi lebih santai untuk pemilih pemula Gen Z',
          'Tambahkan nomor hotline posko pemenangan dapil',
        ],
      };
    }

    if (p.includes('lawan') || p.includes('kompetitor') || p.includes('swot') || p.includes('analisis')) {
      return {
        text: `### 🛡️ ANALISIS GEOPOLITIK KEKUATAN & STRATEGI MENGHADAPI LAWAN\n**Basis Wilayah:** ${geo.namaWilayah}\n\n**1. Keunggulan Kandidat Kita:**\n- Kedekatan jaringan relawan berbasis TPS (didukung data OCR KTP real-time SWARAKU).\n- Narasi fokus pada solusi pragmatis: *${geo.isuKunci.join(', ')}*.\n\n**2. Titik Lemah Kompetitor yang Bisa Diisi:**\n- Kompetitor masih menggunakan kampanye mobilisasi massa konvensional tanpa follow-up micro-targeting per KK.\n- Kurang menyentuh pemilih mengambang (swing voters) yang apatis terhadap janji normatif.\n\n**3. Taktik Terobosan di Lapangan:**\n- Gerakkan 2 kader inti per TPS untuk kunjungan *door-to-door* dengan membawa lembar aspirasi digital.\n- Hindari debat terbuka yang memecah belah; dominasi percakapan di grup WhatsApp RT/RW dengan program bantuan advokasi warga.`,
        rekomendasi: [
          'Prioritaskan 20% TPS dengan margin suara paling tipis',
          'Perkuat saksi militan untuk kawal Form C1 dan B1',
          'Siapkan posko aduan warga di tiap kelurahan',
        ],
      };
    }

    if (p.includes('hoaks') || p.includes('isu') || p.includes('counter') || p.includes('serangan')) {
      return {
        text: `### ⚖️ STRATEGI COUNTER-NARASI & PENANGANAN ISU KRISIS\n**Wilayah Terpapar:** ${geo.namaWilayah}\n\n**Protokol 3C Penanganan Isu:**\n1. **Clarify (Klarifikasi Tanpa Memperbesar Panggung):** Jangan mendebat akun bot/anonim. Rilis fakta berbasis data rekam jejak kerja kandidat.\n2. **Counter with Empathy (Bungkus dengan Empati):** Alihkan narasi: *"Sementara pihak lain sibuk menyebar fitnah, fokus kami tetap pada perut rakyat: bagaimana ${geo.isuKunci[0]} selesai!"*\n3. **Coordinate Ground Force (Instruksi Saksi & Relawan):** Bekali kader di grup WhatsApp dengan 3 poin jawaban singkat (FAQ) untuk menepis keraguan tetangga satu TPS.`,
        rekomendasi: [
          'Bagikan lembar fakta ringkas ke koordinator relawan',
          'Fokuskan juru bicara pada program pro-rakyat',
        ],
      };
    }

    // Default Strategi Kampanye
    return {
      text: `### 🎯 FORMULASI STRATEGI KAMPANYE GEOPOLITIK: ${geo.namaWilayah}\n\n**Profil Karakteristik:** ${geo.karakteristik}\n**Target Utama:** ${geo.targetVoters}\n\n**3 Pilar Strategi Kemenangan Wilayah Ini:**\n1. **Mikro-Targeting Per TPS:** Fokuskan sumber daya pada lumbung suara potensial. Petakan pemilih swing voters menggunakan database voters SWARAKU.\n2. **Narasi Tematik Lokal:** Angkat isu prioritas warga setempat yaitu **${geo.isuKunci.join('**, **')}** dalam setiap pertemuan tatap muka.\n3. **Mobilisasi Saksi & Kader:** Pastikan setiap TPS memiliki minimal 2 saksi terlatih yang siap mengunggah C1 Plano dan Form B1 begitu penghitungan suara rampung.`,
      rekomendasi: [
        'Minta naskah pidato kampanye untuk wilayah ini',
        'Buatkan strategi pendekatan tokoh kunci lokal',
        'Buatkan naskah WhatsApp Blazt untuk koordinator lapangan',
      ],
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: 'Baru saja',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const response = generateAiResponse(content, selectedGeo);
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: 'Baru saja',
        geopolitikInfo: selectedGeo.namaWilayah,
        rekomendasiAksi: response.rekomendasi,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 600);
  };

  const handlePromptChipClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl w-full max-w-4xl h-[92vh] max-h-[820px] shadow-2xl flex flex-col text-slate-100 overflow-hidden relative">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 border-b border-teal-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-teal-500/20">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-mono">
                  AI PILCALEG / SIMCALEG
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {userRole === 'admin' ? 'Akses Super Admin' : 'Akses Tim Sukses'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                AI Intelligence Strategi Kampanye &amp; Geopolitik Wilayah
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Geopolitik Selector & Deskripsi Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-4 sm:px-6 py-2.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-slate-400 font-semibold">Geopolitik Wilayah:</span>
            <select
              value={selectedGeo.id}
              onChange={(e) => {
                const found = GEOPOLITIK_PRESETS.find((g) => g.id === e.target.value);
                if (found) setSelectedGeo(found);
              }}
              className="bg-slate-800 text-teal-200 border border-teal-500/40 rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
            >
              {GEOPOLITIK_PRESETS.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                  {g.namaWilayah}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Fitur AI simcaleg menyusun strategi kampanye hingga narasi politik kandidat berdasarkan geopolitik wilayah.
          </p>
        </div>

        {/* Quick Category Chips */}
        <div className="bg-slate-900/90 px-4 sm:px-6 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => {
              setActiveKategori('strategi');
              handleSendMessage(`Tolong buatkan formulasi strategi pemenangan kampanye untuk wilayah ${selectedGeo.namaWilayah}`);
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-colors cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Strategi Kampanye</span>
          </button>
          <button
            onClick={() => {
              setActiveKategori('narasi');
              handleSendMessage(`Tolong buatkan naskah narasi pidato persuasif kampanye untuk kandidat di wilayah ${selectedGeo.namaWilayah}`);
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Narasi &amp; Pidato Politik</span>
          </button>
          <button
            onClick={() => {
              setActiveKategori('wa_blazt');
              handleSendMessage(`Tolong buatkan template pesan WhatsApp Blazt simpatik bertarget untuk pemilih di wilayah ${selectedGeo.namaWilayah}`);
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Blazt Narasi</span>
          </button>
          <button
            onClick={() => {
              setActiveKategori('analisis_lawan');
              handleSendMessage(`Tolong buatkan analisis SWOT geopolitik dan titik lemah kompetitor di wilayah ${selectedGeo.namaWilayah}`);
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analisis Lawan</span>
          </button>
          <button
            onClick={() => {
              setActiveKategori('counter_isu');
              handleSendMessage(`Tolong berikan strategi counter-narasi isu negatif dan hoaks di wilayah ${selectedGeo.namaWilayah}`);
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Counter Isu / Hoaks</span>
          </button>
        </div>

        {/* Chat Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4 text-slate-950" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-br-xs shadow-md'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-xs shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {msg.sender === 'assistant' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="font-mono text-[10px] text-teal-400">
                        {msg.geopolitikInfo || 'Geopolitik Intelligence SWARAKU'}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-white bg-slate-700/80 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        title="Salin Narasi ke Clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Narasi</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {msg.rekomendasiAksi && msg.rekomendasiAksi.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/50">
                      <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block mb-1.5">
                        Rekomendasi Tindak Lanjut:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.rekomendasiAksi.map((rek, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePromptChipClick(rek)}
                            className="text-[11px] bg-slate-900/90 hover:bg-teal-950 text-slate-300 hover:text-teal-200 border border-slate-700/80 hover:border-teal-500/50 px-2.5 py-1 rounded-lg text-left transition-colors cursor-pointer"
                          >
                            💡 {rek}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-teal-300 p-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4 text-teal-300" />
              </div>
              <span className="animate-pulse">
                AI PILCALEG sedang menganalisis geopolitik dan merumuskan strategi kampanye...
              </span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tanyakan strategi kampanye, narasi pidato, isu lokal, atau counter-isu..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 sm:px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer transition-all"
            >
              <span>Kirim</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

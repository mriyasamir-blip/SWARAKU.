import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  MapPin,
  CheckCircle2,
  Calendar,
  Clock,
  FileCheck,
  Share2,
  ExternalLink,
  X,
  CreditCard,
  User,
  ShieldCheck,
  Building2,
  ArrowRight,
  Database,
  RefreshCw,
  Copy,
  Check,
  Phone,
} from 'lucide-react';
import { DptVoterRecord } from '../../types/vore';

interface TpsLookupData {
  found: boolean;
  nik: string;
  nikMasked: string;
  nama: string;
  jenisKelamin: string;
  tps: string;
  lokasiTps: string;
  alamatTps: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  dapil: string;
  statusDpt: string;
  jamMemilih: string;
  dokumenBawa: string;
  noHp?: string;
  sumberData: string;
  terdaftarDiDatabaseInternal: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  functionCalled?: boolean;
  functionName?: string;
  functionArgs?: any;
  tpsData?: TpsLookupData | null;
}

interface CekTpsAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoter?: (voter: DptVoterRecord) => void;
  initialNik?: string;
}

export const CekTpsAiModal: React.FC<CekTpsAiModalProps> = ({
  isOpen,
  onClose,
  onSaveVoter,
  initialNik,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Halo! Saya Asisten AI SWARAKU yang terintegrasi dengan fitur Gemini Function Calling.\n\nKetikkan atau sebutkan 16 digit NIK e-KTP Anda (atau nama pemilih), dan saya akan secara otomatis mengekstrak NIK tersebut serta memanggil fungsi `cari_lokasi_tps(nik)` untuk mencari lokasi TPS Anda di database DPT.',
      timestamp: 'Baru saja',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTpsData, setActiveTpsData] = useState<TpsLookupData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Handle initialNik if passed
  useEffect(() => {
    if (isOpen && initialNik && initialNik.replace(/\D/g, '').length === 16) {
      handleSendMessage(`Tolong cek lokasi TPS untuk NIK ${initialNik}`);
    }
  }, [isOpen, initialNik]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history format
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/ai/cek-tps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memproses AI pengecekan TPS');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: json.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        functionCalled: json.functionCalled,
        functionName: json.functionName,
        functionArgs: json.functionArgs,
        tpsData: json.tpsData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (json.tpsData) {
        setActiveTpsData(json.tpsData);
      }
    } catch (err: any) {
      console.error('Error calling /api/ai/cek-tps:', err);
      // Fallback cadangan: cek NIK 16 digit via direct endpoint jika AI mengalami gangguan
      const cleanDigits = prompt.replace(/[\s.-]/g, '');
      const nikMatch = cleanDigits.match(/\b\d{16}\b/) || prompt.match(/\b\d{16}\b/);
      let recovered = false;

      if (nikMatch) {
        try {
          const directRes = await fetch(`/api/tps/lookup?nik=${nikMatch[0]}`);
          const directJson = await directRes.json();
          if (directJson.success && directJson.data) {
            const tps = directJson.data;
            const assistantMsg: ChatMessage = {
              id: `assistant-rec-${Date.now()}`,
              sender: 'assistant',
              text: `Halo Bapak/Ibu **${tps.nama}**!\n\nBerdasarkan pengecekan sistem DPT KPU untuk NIK ${tps.nikMasked}, Anda terdaftar di **${tps.tps}** (${tps.lokasiTps}) beralamat di ${tps.alamatTps}.\n\n• **Status DPT:** ${tps.statusDpt}\n• **Dapil:** ${tps.dapil}\n• **Waktu Pencoblosan:** ${tps.jamMemilih}\n• **Dokumen Wajib:** ${tps.dokumenBawa}`,
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              functionCalled: true,
              functionName: 'cari_lokasi_tps',
              functionArgs: { nik: nikMatch[0] },
              tpsData: tps,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setActiveTpsData(tps);
            recovered = true;
          }
        } catch {
          // Abaikan jika offline total
        }
      }

      if (!recovered) {
        const errorMsg: ChatMessage = {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          text: `Silakan ketikkan 16 digit NIK e-KTP Anda (contoh: 3174012508890047), dan sistem akan langsung mencari lokasi TPS Anda di database DPT.`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickChip = (chipText: string) => {
    handleSendMessage(chipText);
  };

  const handleShareWhatsApp = (tps: TpsLookupData) => {
    const text = `*INFORMASI LOKASI TPS PEMILU (SWARAKU)*\n` +
      `Halo Bapak/Ibu *${tps.nama}*!\n\n` +
      `Berdasarkan pengecekan DPT KPU, data pemilih Anda:\n` +
      `• *NIK:* ${tps.nikMasked}\n` +
      `• *TPS:* ${tps.tps}\n` +
      `• *Lokasi Gedung:* ${tps.lokasiTps}\n` +
      `• *Alamat:* ${tps.alamatTps}\n` +
      `• *Status DPT:* ${tps.statusDpt}\n` +
      `• *Waktu Memilih:* ${tps.jamMemilih}\n` +
      `• *Dokumen Wajib:* ${tps.dokumenBawa}\n\n` +
      `Jangan lupa hadir dan gunakan hak pilih Anda! Salam Demokrasi.`;

    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleOpenGoogleMaps = (tps: TpsLookupData) => {
    const query = encodeURIComponent(`${tps.lokasiTps}, ${tps.kelurahan}, ${tps.kecamatan}, Jakarta`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleSaveToVoterDatabase = (tps: TpsLookupData) => {
    if (!onSaveVoter) return;
    const voterRecord: DptVoterRecord = {
      nik: tps.nik,
      nama: tps.nama,
      jenisKelamin: tps.jenisKelamin === 'Perempuan' ? 'P' : 'L',
      usia: 32,
      tps: tps.tps,
      kelurahan: tps.kelurahan,
      kecamatan: tps.kecamatan,
      kabupatenKota: tps.kabupatenKota,
      dapil: tps.dapil,
      statusDpt: 'Terdaftar KPU',
      noHp: tps.noHp || '',
      statusPendukung: 'Pendukung Pasti',
      waktuVerifikasi: 'Diverifikasi via AI Function Calling',
    };
    onSaveVoter(voterRecord);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between border-b border-teal-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg font-black shrink-0">
              <Bot className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  AI Pengecekan Lokasi TPS
                </h2>
                <span className="text-[10px] font-bold text-teal-200 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-500/40 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-teal-300 animate-spin" style={{ animationDuration: '4s' }} />
                  Gemini Function Calling
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Otomatis ekstraksi NIK &amp; panggil skema <code className="text-teal-300 font-mono text-[11px]">cari_lokasi_tps(nik)</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors shrink-0 z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Function Calling Workflow Banner */}
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none font-medium">
            <span className="flex items-center gap-1 font-bold text-teal-800 shrink-0">
              <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center">1</span>
              User input NIK
            </span>
            <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="flex items-center gap-1 font-bold text-teal-800 shrink-0">
              <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center">2</span>
              Gemini Tool Call
            </span>
            <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="flex items-center gap-1 font-bold text-teal-800 shrink-0">
              <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center">3</span>
              Database DPT Lookup
            </span>
            <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="flex items-center gap-1 font-bold text-teal-800 shrink-0">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">✓</span>
              Respons TPS Ramah
            </span>
          </div>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70 min-h-[300px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-xs text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-xs'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                }`}
              >
                {/* Assistant Identity Badge */}
                {msg.sender === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1 text-teal-700 font-bold">
                      <Bot className="w-3.5 h-3.5 text-teal-600" />
                      Gemini TPS Agent
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                  </div>
                )}

                {/* Function Call Badge Notification */}
                {msg.functionCalled && (
                  <div className="mb-2 p-2 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-teal-800">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Function Invoked:</span>
                      <code className="bg-teal-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-teal-900">
                        {msg.functionName || 'cari_lokasi_tps'}({JSON.stringify(msg.functionArgs || {})})
                      </code>
                    </div>
                    <div className="text-[11px] text-teal-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Data berhasil diekstraksi dari database backend SWARAKU</span>
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Interactive TPS Result Card if present */}
                {msg.tpsData && (
                  <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white border border-teal-500/30 shadow-md space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-teal-300 font-bold block">
                          LOKASI TPS DPT RESMI
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                          {msg.tpsData.tps}
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-400/40">
                            Aktif
                          </span>
                        </h4>
                        <p className="text-xs text-teal-100 font-medium mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                          {msg.tpsData.lokasiTps}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-300 block">Pemilih</span>
                        <span className="text-xs font-bold text-white block">{msg.tpsData.nama}</span>
                        <span className="text-[10px] font-mono text-teal-300 block">{msg.tpsData.nikMasked}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-200">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{msg.tpsData.alamatTps}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-teal-200 font-medium">
                        <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Jam Memilih: <strong>{msg.tpsData.jamMemilih}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-teal-200 font-medium">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Wajib Bawa: <strong>{msg.tpsData.dokumenBawa}</strong></span>
                      </div>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenGoogleMaps(msg.tpsData!)}
                        className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Peta / Navigasi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(msg.tpsData!)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Kirim Info via WhatsApp</span>
                      </button>

                      {onSaveVoter && (
                        <button
                          type="button"
                          onClick={() => handleSaveToVoterDatabase(msg.tpsData!)}
                          disabled={savedSuccess}
                          className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-white/20"
                        >
                          {savedSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Tersimpan di DB</span>
                            </>
                          ) : (
                            <>
                              <Database className="w-3.5 h-3.5 text-cyan-300" />
                              <span>Simpan ke Database</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {msg.sender === 'user' && (
                  <div className="text-right text-[10px] text-teal-100 font-mono mt-1 opacity-80">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing / Calling Function Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2 font-bold text-teal-800">
                  <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                  <span>Gemini mengekstrak NIK &amp; memanggil cari_lokasi_tps()...</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Mengambil data TPS dari database DPT KPU &amp; menyusun respons ramah.
                </p>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Contoh Pertanyaan:
          </span>
          <button
            type="button"
            onClick={() => handleQuickChip('Tolong cek TPS untuk NIK 3174012508890047 atas nama Hendra Wijaya')}
            className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 text-slate-700 px-3 py-1 rounded-full border border-slate-200 transition-colors shrink-0 cursor-pointer font-medium"
          >
            🔍 Cek NIK 3174012508890047 (Hendra)
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('Cek lokasi TPS NIK 3174016203920048')}
            className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 text-slate-700 px-3 py-1 rounded-full border border-slate-200 transition-colors shrink-0 cursor-pointer font-medium"
          >
            🔍 Cek NIK 3174016203920048
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('Apa saja syarat dan dokumen yang harus dibawa saat mencoblos di TPS?')}
            className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 text-slate-700 px-3 py-1 rounded-full border border-slate-200 transition-colors shrink-0 cursor-pointer font-medium"
          >
            📋 Dokumen Wajib ke TPS
          </button>
        </div>

        {/* Bottom Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="bg-white border-t border-slate-200 p-3 sm:p-4 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik pertanyaan atau masukkan 16 digit NIK..."
            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 sm:px-5 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>

      </div>
    </div>
  );
};

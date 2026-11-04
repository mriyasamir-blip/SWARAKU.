import React, { useState } from 'react';
import { WhatsAppBlaztItem } from '../../types/vore';
import {
  Send,
  MessageCircle,
  Users,
  CheckCheck,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  FileText,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  PhoneCall,
  UserCheck,
  Share2,
} from 'lucide-react';

interface WhatsAppBlaztModalProps {
  isOpen: boolean;
  onClose: () => void;
  blaztLogs: WhatsAppBlaztItem[];
  onTriggerBlazt: (campaign: {
    target: string;
    totalTarget: number;
    pesan: string;
  }) => void;
}

// Format phone number to WhatsApp international standard (e.g. 0812 -> 62812)
function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length >= 9) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export const WhatsAppBlaztModal: React.FC<WhatsAppBlaztModalProps> = ({
  isOpen,
  onClose,
  blaztLogs,
  onTriggerBlazt,
}) => {
  // Recipient phone numbers (defaults with 4 sample numbers to demonstrate > 3 numbers)
  const [phoneList, setPhoneList] = useState<string[]>([
    '081288219901',
    '081390441122',
    '081776510091',
    '081908772341',
  ]);
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [multiPhoneInput, setMultiPhoneInput] = useState('');
  const [inputMode, setInputMode] = useState<'individual' | 'bulk'>('individual');

  const [selectedTemplate, setSelectedTemplate] = useState('ajakan_coblos');
  const [pesanText, setPesanText] = useState(
    'Salam hangat Bapak/Ibu {nama}, mari bersama wujudkan perubahan nyata. Gunakan hak pilih Anda di {tps} {kelurahan} untuk memenangkan {kandidat}! Bersama kita kawal aspirasi warga.'
  );
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const templates: Record<string, string> = {
    ajakan_coblos:
      'Salam hangat Bapak/Ibu {nama}, mari bersama wujudkan perubahan nyata. Gunakan hak pilih Anda di {tps} {kelurahan} untuk memenangkan {kandidat}! Bersama kita kawal aspirasi warga.',
    undangan_silaturahmi:
      'Undangan Terbuka untuk Bapak/Ibu {nama}: Hadiri temu wicara & dialog aspirasi bersama {kandidat} di Balai Pertemuan {kelurahan}. Suara dan masukan Anda sangat berarti!',
    cek_dpt_tps:
      'Halo {nama}, pastikan Anda telah terdaftar di DPT KPU. Lokasi Anda berada di {tps} {kelurahan}. Buka aplikasi SWARAKU untuk navigasi rute dan panduan simulasi coblos.',
    kawal_c1:
      'PENTING bagi Relawan & Saksi {tps}: Harap foto dan laporkan lembar formulir C1 Plano & Form B1 segera setelah penghitungan suara selesai melalui aplikasi SWARAKU.',
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    setPesanText(templates[key]);
  };

  const handleAddSingleNumber = () => {
    const trimmed = newPhoneInput.trim().replace(/[\s-]/g, '');
    if (!trimmed) return;
    if (!phoneList.includes(trimmed)) {
      setPhoneList([...phoneList, trimmed]);
    }
    setNewPhoneInput('');
  };

  const handleAddBulkNumbers = () => {
    const rawLines = multiPhoneInput.split(/[\n,;]+/);
    const valid = rawLines
      .map((n) => n.trim().replace(/[\s-]/g, ''))
      .filter((n) => n.length >= 8);
    const merged = Array.from(new Set([...phoneList, ...valid]));
    setPhoneList(merged);
    setMultiPhoneInput('');
    setInputMode('individual');
  };

  const handleRemoveNumber = (indexToRemove: number) => {
    setPhoneList(phoneList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddPresetSaksi = () => {
    const presets = ['081211223344', '081322334455', '081533445566', '081844556677'];
    setPhoneList(Array.from(new Set([...phoneList, ...presets])));
  };

  const handleAddPresetRelawan = () => {
    const presets = [
      '085299887766',
      '085788776655',
      '087777665544',
      '089666554433',
      '081299001122',
    ];
    setPhoneList(Array.from(new Set([...phoneList, ...presets])));
  };

  // Preview formatted text for sample contact
  const previewSample = pesanText
    .replace('{nama}', 'Bapak/Ibu Pendukung')
    .replace('{tps}', 'TPS 047')
    .replace('{kelurahan}', 'Kel. Sukamaju')
    .replace('{kandidat}', 'Paslon 01');

  const handleStartBlazt = () => {
    if (phoneList.length === 0) {
      alert('Mohon masukkan minimal 1 nomor telepon penerima terlebih dahulu.');
      return;
    }

    setIsSending(true);
    setProgress(15);
    setSentSuccess(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSending(false);
          setSentSuccess(true);
          onTriggerBlazt({
            target: `${phoneList.length} Kontak Terinput (${phoneList.slice(0, 3).join(', ')}...)`,
            totalTarget: phoneList.length,
            pesan: pesanText,
          });
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  WhatsApp Blazt &amp; Broadcast
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Langsung Terhubung ke WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Input nomor telepon (bisa lebih dari 3 nomor), langsung terhubung ke WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. INPUT NOMOR TELEPON PENERIMA (BISA LEBIH DARI 3 NOMOR) */}
        <div className="space-y-2.5 p-4 bg-gradient-to-br from-emerald-50/50 to-slate-50 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>1. Input Nomor Telepon Penerima:</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {phoneList.length} Nomor Terdaftar
              </span>
            </label>

            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setInputMode('individual')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                  inputMode === 'individual'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200'
                }`}
              >
                + Input Satuan
              </button>
              <button
                type="button"
                onClick={() => setInputMode('bulk')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                  inputMode === 'bulk'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200'
                }`}
              >
                + Input Massal
              </button>
            </div>
          </div>

          {inputMode === 'individual' ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik nomor HP (cth: 081288219901 atau 62812...)"
                value={newPhoneInput}
                onChange={(e) => setNewPhoneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSingleNumber();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-medium focus:border-emerald-600 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSingleNumber}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Nomor</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <textarea
                rows={3}
                placeholder="Tempel / ketik banyak nomor telepon sekaligus (pisahkan dengan koma atau baris baru)&#10;Contoh:&#10;081288219901, 081390441122&#10;081776510091&#10;081908772341&#10;085299887766"
                value={multiPhoneInput}
                onChange={(e) => setMultiPhoneInput(e.target.value)}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono focus:border-emerald-600 focus:outline-hidden leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddBulkNumbers}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Semua Nomor Massal</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick preset buttons to test with >3 numbers instantly */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 font-medium">Tambah Cepat (&gt; 3 Nomor):</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddPresetSaksi}
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                + 4 Nomor Tim Saksi
              </button>
              <button
                type="button"
                onClick={handleAddPresetRelawan}
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                + 5 Nomor Relawan TPS
              </button>
            </div>
          </div>

          {/* List of Entered Phone Numbers with DIRECT WHATSAPP CONNECT BUTTON */}
          <div className="space-y-1.5 pt-1 border-t border-emerald-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1">
                <span>Daftar Nomor Terinput:</span>
                <span className="text-[10px] text-emerald-700 font-normal">
                  (Klik "Hubungkan WA" untuk langsung buka chat WhatsApp per nomor)
                </span>
              </span>

              {phoneList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhoneList([])}
                  className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                >
                  Hapus Semua ({phoneList.length})
                </button>
              )}
            </div>

            {phoneList.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic text-center py-3 bg-white rounded-xl border border-slate-200">
                Belum ada nomor telepon. Masukkan nomor di atas atau klik tambah cepat.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {phoneList.map((phone, idx) => {
                  const formatted = formatWhatsAppNumber(phone);
                  const waUrl = `https://wa.me/${formatted}?text=${encodeURIComponent(previewSample)}`;
                  return (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-xl border border-emerald-200/90 flex items-center justify-between gap-2 shadow-2xs hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">
                          {phone}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold hidden sm:inline">
                          (+{formatted})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* DIRECT WHATSAPP CONNECT BUTTON FOR THIS NUMBER */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setConnectedNumber(phone)}
                          className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer transition-all active:scale-95"
                          title="Langsung Terhubung dengan WhatsApp Nomor Ini"
                        >
                          <MessageCircle className="w-3 h-3 fill-white" />
                          <span>Hubungkan WA</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleRemoveNumber(idx)}
                          className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                          title="Hapus nomor ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. TEMPLATE SELECTOR & PESAN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              2. Template Pesan WhatsApp:
            </label>
            <span className="text-[10px] text-slate-400">Variabel: {'{nama}'}, {'{tps}'}, {'{kandidat}'}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'ajakan_coblos', label: 'Ajakan Coblos TPS' },
              { id: 'undangan_silaturahmi', label: 'Undangan Silaturahmi' },
              { id: 'cek_dpt_tps', label: 'Info Lokasi TPS' },
              { id: 'kawal_c1', label: 'Instruksi C1 & B1 Saksi' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedTemplate === t.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={pesanText}
            onChange={(e) => setPesanText(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Live Preview Box */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pratinjau Pesan yang Dikirimkan:</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700">
              {phoneList.length} Nomor Siap Hubung
            </span>
          </div>
          <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-emerald-100 leading-relaxed shadow-2xs">
            "{previewSample}"
          </p>
        </div>

        {/* Progress Bar when Sending */}
        {isSending && (
          <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-pulse">
            <div className="flex justify-between text-xs font-bold text-emerald-800">
              <span>Mengirim WhatsApp Blazt ({progress}%)...</span>
              <span className="font-mono">
                {Math.round((progress / 100) * phoneList.length)} / {phoneList.length} Nomor
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {sentSuccess && (
          <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                WhatsApp Blazt berhasil terproses untuk {phoneList.length} nomor penerima!
              </span>
            </div>
            {phoneList[0] && (
              <a
                href={`https://wa.me/${formatWhatsAppNumber(phoneList[0])}?text=${encodeURIComponent(previewSample)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <span>Buka di WA</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleStartBlazt}
            disabled={isSending || phoneList.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {isSending
                ? 'Sedang Memproses Blazt...'
                : `Kirim WA Blazt ke ${phoneList.length} Nomor`}
            </span>
          </button>

          {phoneList.length > 0 && (
            <a
              href={`https://wa.me/${formatWhatsAppNumber(phoneList[0])}?text=${encodeURIComponent(previewSample)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="Langsung Buka di Aplikasi WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Buka WA Nomor #1</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

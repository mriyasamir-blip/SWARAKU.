import React, { useState } from 'react';
import { lookupDptKpu } from '../../data/dptData';
import { DptVoterRecord } from '../../types/vore';
import {
  CreditCard,
  Search,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  MapPin,
  Calendar,
  User,
  X,
  PlusCircle,
  Database,
  RefreshCw,
  Sparkles,
  Bot,
  Send,
  Building2,
  ExternalLink,
  Share2,
  Clock,
  FileCheck,
} from 'lucide-react';

interface AutoCekNikModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoter: (voter: DptVoterRecord) => void;
}

export const AutoCekNikModal: React.FC<AutoCekNikModalProps> = ({
  isOpen,
  onClose,
  onSaveVoter,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'ai'>('ai');
  const [nikInput, setNikInput] = useState('');
  const [searchedVoter, setSearchedVoter] = useState<DptVoterRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // AI Chat state for Function Calling
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    functionCalled?: boolean;
    functionName?: string;
    functionArgs?: any;
    tpsData?: any;
  }>>([
    {
      sender: 'assistant',
      text: 'Halo! Saya AI Asisten Pengecekan TPS dengan fitur Gemini Function Calling.\n\nSebutkan atau ketik 16 digit NIK e-KTP Anda (atau nama pemilih), dan AI akan otomatis mengekstrak NIK serta memanggil fungsi cari_lokasi_tps(nik) ke database DPT.',
    },
  ]);

  if (!isOpen) return null;

  const handleSendAiMessage = async (customText?: string) => {
    const textToSend = (customText || aiInput).trim();
    if (!textToSend || aiLoading) return;

    setAiMessages((prev) => [
      ...prev,
      { sender: 'user', text: textToSend },
    ]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/cek-tps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses AI');
      }

      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply,
          functionCalled: data.functionCalled,
          functionName: data.functionName,
          functionArgs: data.functionArgs,
          tpsData: data.tpsData,
        },
      ]);
    } catch (e: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Maaf, kendala jaringan: ${e.message || 'Coba sesaat lagi'}.`,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = (nikToSearch: string) => {
    const clean = nikToSearch.replace(/\D/g, '');
    setNikInput(clean);
    setSavedSuccess(false);

    if (clean.length === 16) {
      setIsSearching(true);
      setTimeout(() => {
        const result = lookupDptKpu(clean);
        setSearchedVoter(result);
        setIsSearching(false);
      }, 400);
    } else {
      setSearchedVoter(null);
    }
  };

  const handleSave = () => {
    if (!searchedVoter) return;
    onSaveVoter(searchedVoter);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const sampleNiks = [
    { label: 'Ahmad Fauzi (TPS 047)', nik: '3174012508890001' },
    { label: 'Dewi Anggraini (TPS 047)', nik: '3174015403920004' },
    { label: 'Hendra Gunawan (TPS 049)', nik: '3174010101850005' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Pengecekan Lokasi TPS &amp; DPT
                </h2>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Didukung AI Function Calling <code className="text-teal-700 font-mono font-bold">cari_lokasi_tps(nik)</code>
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Tanya AI (Function Calling)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
            <span>Input NIK Cepat</span>
          </button>
        </div>

        {/* TAB 1: AI FUNCTION CALLING MODE */}
        {activeTab === 'ai' && (
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-72">
              {aiMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-xs font-medium'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {m.functionCalled && (
                      <div className="mb-1.5 p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[10px] text-teal-900 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                        <span>Function called: cari_lokasi_tps({JSON.stringify(m.functionArgs || {})})</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {m.tpsData && (
                      <div className="mt-2.5 p-2.5 bg-slate-900 text-white rounded-xl border border-teal-500/30 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1">
                          <span className="font-black text-teal-300">{m.tpsData.tps}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                            {m.tpsData.statusDpt}
                          </span>
                        </div>
                        <div className="font-bold">{m.tpsData.lokasiTps}</div>
                        <div className="text-slate-300 text-[10px]">{m.tpsData.alamatTps}</div>
                        <div className="pt-1.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSaveVoter({
                                nik: m.tpsData.nik,
                                nama: m.tpsData.nama,
                                jenisKelamin: m.tpsData.jenisKelamin === 'Perempuan' ? 'P' : 'L',
                                usia: 32,
                                tps: m.tpsData.tps,
                                kelurahan: m.tpsData.kelurahan,
                                kecamatan: m.tpsData.kecamatan,
                                kabupatenKota: m.tpsData.kabupatenKota,
                                dapil: m.tpsData.dapil,
                                statusDpt: 'Terdaftar KPU',
                                noHp: m.tpsData.noHp || '',
                                statusPendukung: 'Pendukung Pasti',
                                waktuVerifikasi: 'AI Verified',
                              });
                              setSavedSuccess(true);
                              setTimeout(() => setSavedSuccess(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 rounded-lg text-white font-bold text-[10px] cursor-pointer"
                          >
                            {savedSuccess ? 'Tersimpan!' : 'Simpan ke Database'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-teal-800 flex items-center gap-2 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>AI mengekstrak NIK &amp; mencari data TPS di database...</span>
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => handleSendAiMessage('Cek TPS NIK 3174012508890047 atas nama Hendra Wijaya')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-full border border-slate-200 shrink-0 cursor-pointer font-medium"
              >
                🔍 NIK Hendra (TPS 047)
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage('Cek NIK 3174016203920048')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-full border border-slate-200 shrink-0 cursor-pointer font-medium"
              >
                🔍 NIK 3174016203920048
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage('Apa saja dokumen yang wajib dibawa saat mencoblos?')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-full border border-slate-200 shrink-0 cursor-pointer font-medium"
              >
                📋 Dokumen Wajib
              </button>
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiMessage();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ketik NIK 16 digit atau tanya AI..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs focus:border-teal-500 outline-none"
              />
              <button
                type="submit"
                disabled={!aiInput.trim() || aiLoading}
                className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MANUAL NIK INPUT FIELD */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Nomor Induk Kependudukan (NIK 16 Digit)</span>
                <span className="text-[11px] font-mono text-cyan-700">
                  {nikInput.length}/16 digit
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={16}
                  value={nikInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Contoh: 3174012508890001"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-mono tracking-wider focus:outline-hidden focus:border-cyan-500 transition-colors"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-3.5 text-cyan-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* Quick Click Samples */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400">Contoh Cepat:</span>
                {sampleNiks.map((s) => (
                  <button
                    key={s.nik}
                    type="button"
                    onClick={() => handleSearch(s.nik)}
                    className="text-[10px] font-semibold bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Auto-Fill Card */}
            {searchedVoter ? (
              <div className="p-4 bg-gradient-to-br from-cyan-50/80 via-white to-teal-50/60 rounded-2xl border-2 border-cyan-300 space-y-3 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between border-b border-cyan-100 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Terdaftar Resmi di DPT KPU</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                    {searchedVoter.tps}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 block">Nama Lengkap</span>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      {searchedVoter.nama}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 block">Nomor TPS</span>
                    <span className="font-extrabold text-cyan-700 text-sm block">
                      {searchedVoter.tps}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 block">Kelurahan / Desa</span>
                    <span className="font-semibold text-slate-800 block">
                      {searchedVoter.kelurahan}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 block">Kecamatan</span>
                    <span className="font-semibold text-slate-800 block">
                      {searchedVoter.kecamatan}
                    </span>
                  </div>
                </div>

                {savedSuccess ? (
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Berhasil Disimpan ke Basis Data Pendukung SWARAKU!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Simpan Otomatis ke Basis Data Pendukung</span>
                  </button>
                )}
              </div>
            ) : (
              nikInput.length > 0 &&
              nikInput.length < 16 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  Masukkan 16 digit NIK lengkap untuk auto-tarik data DPT KPU...
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};



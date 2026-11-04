import React, { useState } from 'react';
import { FormC1Upload, FormB1Upload } from '../../types/vore';
import {
  BarChart3,
  CheckCircle2,
  FileText,
  Building2,
  UploadCloud,
  X,
  Eye,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Award,
  Vote,
  Filter,
} from 'lucide-react';

interface QuickCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  c1Records: FormC1Upload[];
  b1Records: FormB1Upload[];
  onOpenUploadC1: () => void;
  onOpenUploadB1: () => void;
}

export const QuickCountModal: React.FC<QuickCountModalProps> = ({
  isOpen,
  onClose,
  c1Records,
  b1Records,
  onOpenUploadC1,
  onOpenUploadB1,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'c1' | 'b1'>('all');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<{
    title: string;
    type: 'C1' | 'B1';
    wilayah: string;
    pelapor: string;
    fileUrl?: string;
    fileName?: string;
    p1: number;
    p2: number;
    p3: number;
    tidakSah: number;
    totalSah: number;
  } | null>(null);

  if (!isOpen) return null;

  // Aggregate Calculations from Form C1 (TPS level)
  const c1P1 = c1Records.reduce((acc, c) => acc + c.suaraPaslon1, 0);
  const c1P2 = c1Records.reduce((acc, c) => acc + c.suaraPaslon2, 0);
  const c1P3 = c1Records.reduce((acc, c) => acc + c.suaraPaslon3, 0);
  const c1TidakSah = c1Records.reduce((acc, c) => acc + c.suaraTidakSah, 0);
  const c1TotalSah = c1P1 + c1P2 + c1P3;
  const c1TotalMasuk = c1TotalSah + c1TidakSah;

  // Aggregate Calculations from Form B1 (Kecamatan level)
  const b1P1 = b1Records.reduce((acc, b) => acc + b.suaraPaslon1, 0);
  const b1P2 = b1Records.reduce((acc, b) => acc + b.suaraPaslon2, 0);
  const b1P3 = b1Records.reduce((acc, b) => acc + b.suaraPaslon3, 0);
  const b1TidakSah = b1Records.reduce((acc, b) => acc + b.suaraTidakSah, 0);
  const b1TotalSah = b1P1 + b1P2 + b1P3;
  const b1TotalMasuk = b1TotalSah + b1TidakSah;
  const b1TotalTps = b1Records.reduce((acc, b) => acc + b.totalTpsTercakup, 0);

  // Grand Total Aggregation (C1 + B1)
  const grandP1 = c1P1 + b1P1;
  const grandP2 = c1P2 + b1P2;
  const grandP3 = c1P3 + b1P3;
  const grandTotalSah = grandP1 + grandP2 + grandP3;
  const grandTotalTidakSah = c1TidakSah + b1TidakSah;
  const grandTotalMasuk = grandTotalSah + grandTotalTidakSah;

  // Percentages based on active filter
  let p1Votes = grandP1;
  let p2Votes = grandP2;
  let p3Votes = grandP3;
  let activeSah = grandTotalSah;
  let activeTidakSah = grandTotalTidakSah;
  let activeMasuk = grandTotalMasuk;

  if (activeTab === 'c1') {
    p1Votes = c1P1;
    p2Votes = c1P2;
    p3Votes = c1P3;
    activeSah = c1TotalSah;
    activeTidakSah = c1TidakSah;
    activeMasuk = c1TotalMasuk;
  } else if (activeTab === 'b1') {
    p1Votes = b1P1;
    p2Votes = b1P2;
    p3Votes = b1P3;
    activeSah = b1TotalSah;
    activeTidakSah = b1TidakSah;
    activeMasuk = b1TotalMasuk;
  }

  const pctP1 = activeSah > 0 ? ((p1Votes / activeSah) * 100).toFixed(1) : '0.0';
  const pctP2 = activeSah > 0 ? ((p2Votes / activeSah) * 100).toFixed(1) : '0.0';
  const pctP3 = activeSah > 0 ? ((p3Votes / activeSah) * 100).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Quick Count Pemilu Terpadu
                </h2>
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></span>
                  <span>Live dari Form C1 &amp; Form B1</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tabulasi real-time perolehan suara berdasarkan formulir C1 Plano (TPS) &amp; Formulir B1 (Kecamatan) yang diunggah
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Buttons to Upload C1 or B1 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenUploadC1}
            className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border border-cyan-200 rounded-2xl text-left flex items-center justify-between group cursor-pointer transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-cyan-800">
                  + Unggah Form C1
                </span>
                <span className="text-[10px] text-slate-500">Lembar Plano TPS ({c1Records.length} Masuk)</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-cyan-700 bg-white px-2 py-0.5 rounded-lg border border-cyan-200">
              Input TPS
            </span>
          </button>

          <button
            onClick={onOpenUploadB1}
            className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200 rounded-2xl text-left flex items-center justify-between group cursor-pointer transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-800">
                  + Unggah Form B1
                </span>
                <span className="text-[10px] text-slate-500">Model B1-KWK PPK ({b1Records.length} Masuk)</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
              Input PPK
            </span>
          </button>
        </div>

        {/* Filter Tabs: Semua / Form C1 / Form B1 */}
        <div className="flex items-center justify-between bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Gabungan ({c1Records.length + b1Records.length} Berkas)
          </button>
          <button
            onClick={() => setActiveTab('c1')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'c1'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Form C1 TPS ({c1Records.length})
          </button>
          <button
            onClick={() => setActiveTab('b1')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'b1'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Form B1 Kecamatan ({b1Records.length})
          </button>
        </div>

        {/* Big Quick Count Display Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white rounded-3xl shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs">
            <span className="text-cyan-400 font-bold tracking-wide uppercase text-[11px]">
              {activeTab === 'all' && 'Tabulasi Gabungan C1 (TPS) & B1 (Kecamatan)'}
              {activeTab === 'c1' && 'Tabulasi Khusus Hasil Form C1 Plano Saksi TPS'}
              {activeTab === 'b1' && 'Tabulasi Khusus Hasil Form B1 Rekapitulasi PPK'}
            </span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activeMasuk.toLocaleString('id-ID')} Suara Masuk</span>
            </div>
          </div>

          {/* Candidate Bars */}
          <div className="space-y-3.5">
            {/* Paslon 01 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>01. Paslon 01 (Kandidat Utama)</span>
                </span>
                <span className="font-mono font-black text-sm text-cyan-200">
                  {pctP1}% <span className="text-[11px] font-normal text-slate-300">({p1Votes.toLocaleString('id-ID')} Suara)</span>
                </span>
              </div>
              <div className="h-4 w-full bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-cyan-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${pctP1}%` }}
                ></div>
              </div>
            </div>

            {/* Paslon 02 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-200">02. Paslon 02</span>
                <span className="font-mono font-bold text-xs text-amber-100">
                  {pctP2}% <span className="text-[11px] font-normal text-slate-300">({p2Votes.toLocaleString('id-ID')} Suara)</span>
                </span>
              </div>
              <div className="h-3 w-full bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${pctP2}%` }}
                ></div>
              </div>
            </div>

            {/* Paslon 03 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-300">03. Paslon 03</span>
                <span className="font-mono font-bold text-xs text-rose-100">
                  {pctP3}% <span className="text-[11px] font-normal text-slate-300">({p3Votes.toLocaleString('id-ID')} Suara)</span>
                </span>
              </div>
              <div className="h-3 w-full bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-rose-500/30">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-700"
                  style={{ width: `${pctP3}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/60 text-center">
            <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Total Suara Sah</span>
              <span className="text-xs font-black font-mono text-white">
                {activeSah.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Suara Tidak Sah</span>
              <span className="text-xs font-black font-mono text-rose-300">
                {activeTidakSah.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Total C1 TPS</span>
              <span className="text-xs font-black font-mono text-cyan-300">
                {c1Records.length} TPS
              </span>
            </div>
            <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Total B1 PPK</span>
              <span className="text-xs font-black font-mono text-indigo-300">
                {b1Records.length} Kec ({b1TotalTps} TPS)
              </span>
            </div>
          </div>
        </div>

        {/* Tabulated Records List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-600" />
              <span>Daftar Berkas Terverifikasi Quick Count:</span>
            </h3>
            <span className="text-[10px] text-slate-500">
              Klik berkas untuk melihat pratinjau lampiran foto/dokumen
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {/* Form C1 Entries */}
            {(activeTab === 'all' || activeTab === 'c1') &&
              c1Records.map((c) => {
                const total = c.totalSuaraSah || c.suaraPaslon1 + c.suaraPaslon2 + c.suaraPaslon3;
                const pct = total > 0 ? ((c.suaraPaslon1 / total) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={c.id}
                    onClick={() =>
                      setSelectedPreviewDoc({
                        title: `Formulir C1 Plano ${c.tps}`,
                        type: 'C1',
                        wilayah: `${c.tps}, ${c.kelurahan}, ${c.kecamatan}`,
                        pelapor: `Saksi: ${c.saksiNama}`,
                        fileUrl: c.fotoC1Url,
                        fileName: c.fileName || `${c.tps}-C1-Plano.jpg`,
                        p1: c.suaraPaslon1,
                        p2: c.suaraPaslon2,
                        p3: c.suaraPaslon3,
                        tidakSah: c.suaraTidakSah,
                        totalSah: total,
                      })
                    }
                    className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-cyan-400 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-cyan-800">
                            {c.tps} · {c.kelurahan}
                          </span>
                          <span className="text-[9px] font-bold text-cyan-800 bg-cyan-100 px-1.5 py-0.2 rounded-md">
                            Form C1
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          Saksi: {c.saksiNama} · {c.waktuUpload}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-cyan-700">
                          {pct}% P1
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ({c.suaraPaslon1}/{total})
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md inline-flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Terverifikasi</span>
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* Form B1 Entries */}
            {(activeTab === 'all' || activeTab === 'b1') &&
              b1Records.map((b) => {
                const total = b.totalSuaraSah || b.suaraPaslon1 + b.suaraPaslon2 + b.suaraPaslon3;
                const pct = total > 0 ? ((b.suaraPaslon1 / total) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={b.id}
                    onClick={() =>
                      setSelectedPreviewDoc({
                        title: `Formulir Model B1-KWK ${b.kecamatan}`,
                        type: 'B1',
                        wilayah: `${b.kecamatan} (${b.kelurahan})`,
                        pelapor: `Koordinator: ${b.koordinatorNama} · ${b.totalTpsTercakup} TPS`,
                        fileUrl: b.fotoB1Url,
                        fileName: b.fileName || `${b.kecamatan}-Form-B1.jpg`,
                        p1: b.suaraPaslon1,
                        p2: b.suaraPaslon2,
                        p3: b.suaraPaslon3,
                        tidakSah: b.suaraTidakSah,
                        totalSah: total,
                      })
                    }
                    className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-800">
                            {b.kecamatan}
                          </span>
                          <span className="text-[9px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                            Form B1 ({b.totalTpsTercakup} TPS)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {b.koordinatorNama} · {b.waktuUpload}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-indigo-700">
                          {pct}% P1
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ({b.suaraPaslon1.toLocaleString('id-ID')}/{total.toLocaleString('id-ID')})
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md inline-flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{b.statusVerifikasi}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Modal Lightbox for Document/Photo preview */}
        {selectedPreviewDoc && (
          <div className="p-4 bg-slate-50 border border-cyan-200 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase">
                  Pratinjau Berkas {selectedPreviewDoc.type}
                </span>
                <h4 className="text-xs font-extrabold text-slate-900">
                  {selectedPreviewDoc.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {selectedPreviewDoc.wilayah} · {selectedPreviewDoc.pelapor}
                </p>
              </div>
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold hover:bg-slate-300"
              >
                ✕
              </button>
            </div>

            {selectedPreviewDoc.fileUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white max-h-48 flex items-center justify-center">
                <img
                  src={selectedPreviewDoc.fileUrl}
                  alt={selectedPreviewDoc.title}
                  className="w-full h-full object-contain max-h-48"
                />
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Berkas: {selectedPreviewDoc.fileName} (Format PDF Terverifikasi)
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 text-center text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-cyan-800 font-bold block">P01 (Utama)</span>
                <span className="font-mono font-black text-cyan-900">
                  {selectedPreviewDoc.p1.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 font-bold block">P02</span>
                <span className="font-mono font-bold text-slate-700">
                  {selectedPreviewDoc.p2.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-rose-800 font-bold block">P03</span>
                <span className="font-mono font-bold text-slate-700">
                  {selectedPreviewDoc.p3.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Tidak Sah</span>
                <span className="font-mono font-bold text-rose-700">
                  {selectedPreviewDoc.tidakSah.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terhubung otomatis dengan seluruh saksi TPS</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Tutup Tabulasi
          </button>
        </div>
      </div>
    </div>
  );
};

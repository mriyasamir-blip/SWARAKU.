import React, { useState, useRef } from 'react';
import { FormC1Upload } from '../../types/vore';
import {
  FileText,
  UploadCloud,
  Camera,
  X,
  Calculator,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface FormC1UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTps?: string;
  defaultKelurahan?: string;
  defaultKecamatan?: string;
  defaultSaksiNama?: string;
  onSubmitC1: (data: Partial<FormC1Upload>) => void;
}

export const FormC1UploadModal: React.FC<FormC1UploadModalProps> = ({
  isOpen,
  onClose,
  defaultTps = 'TPS 047',
  defaultKelurahan = 'Kel. Sukamaju',
  defaultKecamatan = 'Kec. Cilandak',
  defaultSaksiNama = 'Saksi Mandiri TPS',
  onSubmitC1,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [tps, setTps] = useState(defaultTps);
  const [kelurahan, setKelurahan] = useState(defaultKelurahan);
  const [kecamatan, setKecamatan] = useState(defaultKecamatan);
  const [saksiNama, setSaksiNama] = useState(defaultSaksiNama);

  const [c1Paslon1, setC1Paslon1] = useState('145');
  const [c1Paslon2, setC1Paslon2] = useState('62');
  const [c1Paslon3, setC1Paslon3] = useState('24');
  const [c1TidakSah, setC1TidakSah] = useState('4');

  // File upload state - starts empty so user can choose their file
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  // Live Calculations
  const p1 = Number(c1Paslon1) || 0;
  const p2 = Number(c1Paslon2) || 0;
  const p3 = Number(c1Paslon3) || 0;
  const tidakSah = Number(c1TidakSah) || 0;
  const totalSah = p1 + p2 + p3;
  const totalMasuk = totalSah + tidakSah;
  const pctPaslon1 = totalSah > 0 ? ((p1 / totalSah) * 100).toFixed(1) : '0';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPreviewUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Non-image e.g. PDF
        setPreviewUrl('');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPreviewUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    setPreviewUrl('');
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitC1({
      tps,
      kelurahan,
      kecamatan,
      saksiNama,
      suaraPaslon1: p1,
      suaraPaslon2: p2,
      suaraPaslon3: p3,
      suaraTidakSah: tidakSah,
      totalSuaraSah: totalSah,
      fotoC1Url: previewUrl || 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80',
      fileName: fileName || `Form-C1-Plano-${tps.replace(/\s+/g, '')}.jpg`,
      statusVerifikasi: 'Terverifikasi',
      waktuUpload: 'Baru saja',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Unggah Formulir C1 Plano (TPS)
                </h2>
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-200">
                  Quick Count TPS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload file foto / scan formulir C1 Plano hasil perhitungan suara TPS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Wilayah & Saksi Info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Nomor TPS
              </label>
              <input
                type="text"
                value={tps}
                onChange={(e) => setTps(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:border-cyan-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Kelurahan &amp; Kecamatan
              </label>
              <input
                type="text"
                value={`${kelurahan}, ${kecamatan}`}
                onChange={(e) => setKelurahan(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:border-cyan-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
              Nama Saksi / Pelapor
            </label>
            <input
              type="text"
              value={saksiNama}
              onChange={(e) => setSaksiNama(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:border-cyan-500 focus:outline-hidden"
            />
          </div>

          {/* Upload File Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-cyan-600" />
                <span>Dokumen / Foto Formulir C1 Plano:</span>
              </span>
              <span className="text-[10px] text-cyan-700 font-normal">Kamera atau Galeri File</span>
            </label>

            {/* Hidden Inputs for Real File & Camera Selection */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Quick Action Buttons: Kamera vs File */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-teal-600" />
                <span>Foto via Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-slate-600" />
                <span>Pilih dari Galeri</span>
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center relative ${
                isDragOver
                  ? 'border-cyan-500 bg-cyan-50/80 ring-2 ring-cyan-200'
                  : previewUrl || fileName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-cyan-300 bg-slate-50 hover:bg-cyan-50/50'
              }`}
            >
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="h-32 w-full max-w-xs mx-auto rounded-xl overflow-hidden border border-emerald-300 bg-white relative group">
                    <img
                      src={previewUrl}
                      alt="Pratinjau Formulir C1"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-2 py-1 bg-white text-slate-900 text-[10px] font-bold rounded-lg shadow-sm">
                        Klik untuk Ganti
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[200px]">{fileName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({fileSize})</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 underline cursor-pointer"
                    >
                      Ganti File
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                    >
                      Hapus File
                    </button>
                  </div>
                </div>
              ) : fileName ? (
                /* PDF / non-image file chosen */
                <div className="space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 mx-auto flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{fileName}</p>
                    <span className="text-[10px] text-slate-500">Berkas Dokumen · {fileSize}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-[11px] font-bold text-cyan-700 underline cursor-pointer"
                    >
                      Ganti Berkas
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="text-[11px] font-bold text-rose-600 underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state - prompts user to upload */
                <div className="space-y-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Klik untuk Pilih File Foto / Scan Formulir C1
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih dari galeri foto smartphone atau berkas laptop (JPG, PNG, PDF)
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] rounded-xl shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Pilih File dari Perangkat</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Suara Paslon */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-900 block">
              Isian Perolehan Suara TPS {tps}:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-cyan-900 block mb-0.5">
                  Paslon 01 (Utama)
                </label>
                <input
                  type="number"
                  min="0"
                  value={c1Paslon1}
                  onChange={(e) => setC1Paslon1(e.target.value)}
                  className="w-full px-2 py-1.5 bg-cyan-50 border border-cyan-400 font-extrabold text-cyan-900 rounded-xl font-mono text-xs text-center focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                  Paslon 02
                </label>
                <input
                  type="number"
                  min="0"
                  value={c1Paslon2}
                  onChange={(e) => setC1Paslon2(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 font-bold rounded-xl font-mono text-xs text-center focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                  Paslon 03
                </label>
                <input
                  type="number"
                  min="0"
                  value={c1Paslon3}
                  onChange={(e) => setC1Paslon3(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 font-bold rounded-xl font-mono text-xs text-center focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-rose-700 block mb-0.5">
                  Suara Tidak Sah
                </label>
                <input
                  type="number"
                  min="0"
                  value={c1TidakSah}
                  onChange={(e) => setC1TidakSah(e.target.value)}
                  className="w-full px-2 py-1.5 bg-rose-50 border border-rose-200 font-bold rounded-xl font-mono text-xs text-center text-rose-800 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Perhitungan Otomatis */}
          <div className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-cyan-200 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-950">
              <span className="flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-cyan-600" />
                <span>Kalkulasi Suara Otomatis:</span>
              </span>
              <span className="font-mono text-cyan-800">{totalMasuk} Total Suara Masuk</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-cyan-100">
              <div>
                <span className="text-slate-500 block">Total Suara Sah:</span>
                <span className="font-extrabold text-slate-900 font-mono">{totalSah} Suara</span>
              </div>
              <div>
                <span className="text-slate-500 block">Perolehan Paslon 01:</span>
                <span className="font-extrabold text-emerald-700 font-mono">
                  {pctPaslon1}% ({p1} Suara)
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kirim &amp; Verifikasi Form C1 ke Quick Count</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { FormB1Upload } from '../../types/vore';
import {
  Building2,
  UploadCloud,
  Camera,
  X,
  Calculator,
  CheckCircle2,
  FileCheck,
  FileText,
  Sparkles,
} from 'lucide-react';

interface FormB1UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultKecamatan?: string;
  defaultKelurahan?: string;
  defaultKoordinator?: string;
  defaultDapil?: string;
  onSubmitB1: (data: Partial<FormB1Upload>) => void;
}

export const FormB1UploadModal: React.FC<FormB1UploadModalProps> = ({
  isOpen,
  onClose,
  defaultKecamatan = 'Kec. Cilandak',
  defaultKelurahan = 'Kel. Sukamaju & Sekitarnya (5 Kelurahan)',
  defaultKoordinator = 'Koordinator Saksi Kecamatan',
  defaultDapil = 'DAPIL DKI JAKARTA II (Dapil 3)',
  onSubmitB1,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [kecamatan, setKecamatan] = useState(defaultKecamatan);
  const [kelurahan, setKelurahan] = useState(defaultKelurahan);
  const [koordinatorNama, setKoordinatorNama] = useState(defaultKoordinator);
  const [dapil, setDapil] = useState(defaultDapil);
  const [totalTpsTercakup, setTotalTpsTercakup] = useState('58');

  const [b1Paslon1, setB1Paslon1] = useState('8940');
  const [b1Paslon2, setB1Paslon2] = useState('3420');
  const [b1Paslon3, setB1Paslon3] = useState('1380');
  const [b1TidakSah, setB1TidakSah] = useState('180');

  // File upload state - starts empty so user can choose their file
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  // Live Calculations
  const p1 = Number(b1Paslon1) || 0;
  const p2 = Number(b1Paslon2) || 0;
  const p3 = Number(b1Paslon3) || 0;
  const tidakSah = Number(b1TidakSah) || 0;
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
    onSubmitB1({
      kecamatan,
      kelurahan,
      dapil,
      koordinatorNama,
      totalTpsTercakup: Number(totalTpsTercakup) || 1,
      suaraPaslon1: p1,
      suaraPaslon2: p2,
      suaraPaslon3: p3,
      suaraTidakSah: tidakSah,
      totalSuaraSah: totalSah,
      fotoB1Url: previewUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
      fileName: fileName || `Form-Model-B1-KWK-${kecamatan.replace(/\s+/g, '')}.jpg`,
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Unggah Formulir B1 (Kecamatan / PPK)
                </h2>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                  Model B1-KWK
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload berkas Berita Acara Rekapitulasi Suara Tingkat Kecamatan
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
          {/* Wilayah & Koordinator */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Nama Kecamatan
              </label>
              <input
                type="text"
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Jumlah TPS Tercakup
              </label>
              <input
                type="number"
                min="1"
                value={totalTpsTercakup}
                onChange={(e) => setTotalTpsTercakup(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Kelurahan / Desa Tercakup
              </label>
              <input
                type="text"
                value={kelurahan}
                onChange={(e) => setKelurahan(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Nama Koordinator PPK
              </label>
              <input
                type="text"
                value={koordinatorNama}
                onChange={(e) => setKoordinatorNama(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Upload File Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Dokumen / Foto Formulir B1 Kecamatan:</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-normal">Kamera atau Galeri File</span>
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
                className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
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
                  ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-200'
                  : previewUrl || fileName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-indigo-300 bg-slate-50 hover:bg-indigo-50/50'
              }`}
            >
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="h-32 w-full max-w-xs mx-auto rounded-xl overflow-hidden border border-emerald-300 bg-white relative group">
                    <img
                      src={previewUrl}
                      alt="Pratinjau Formulir B1"
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
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 underline cursor-pointer"
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
                <div className="space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{fileName}</p>
                    <span className="text-[10px] text-slate-500">Berkas Dokumen B1 · {fileSize}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-[11px] font-bold text-indigo-700 underline cursor-pointer"
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
                <div className="space-y-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Klik untuk Pilih File Foto / Scan Formulir Model B1-KWK
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih dokumen hasil rekapitulasi PPK kecamatan dari ponsel atau komputer
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Pilih File dari Perangkat</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Suara Paslon Rekapitulasi Kecamatan */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-900 block">
              Isian Rekapitulasi Suara {kecamatan} ({totalTpsTercakup} TPS):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-indigo-900 block mb-0.5">
                  Paslon 01 (Utama)
                </label>
                <input
                  type="number"
                  min="0"
                  value={b1Paslon1}
                  onChange={(e) => setB1Paslon1(e.target.value)}
                  className="w-full px-2 py-1.5 bg-indigo-50 border border-indigo-400 font-extrabold text-indigo-900 rounded-xl font-mono text-xs text-center focus:outline-hidden"
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
                  value={b1Paslon2}
                  onChange={(e) => setB1Paslon2(e.target.value)}
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
                  value={b1Paslon3}
                  onChange={(e) => setB1Paslon3(e.target.value)}
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
                  value={b1TidakSah}
                  onChange={(e) => setB1TidakSah(e.target.value)}
                  className="w-full px-2 py-1.5 bg-rose-50 border border-rose-200 font-bold rounded-xl font-mono text-xs text-center text-rose-800 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Perhitungan Otomatis */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span className="flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kalkulasi Rekapitulasi Suara PPK:</span>
              </span>
              <span className="font-mono text-indigo-800">{totalMasuk.toLocaleString('id-ID')} Suara Masuk</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-indigo-100">
              <div>
                <span className="text-slate-500 block">Total Suara Sah:</span>
                <span className="font-extrabold text-slate-900 font-mono">{totalSah.toLocaleString('id-ID')} Suara</span>
              </div>
              <div>
                <span className="text-slate-500 block">Perolehan Paslon 01:</span>
                <span className="font-extrabold text-indigo-700 font-mono">
                  {pctPaslon1}% ({p1.toLocaleString('id-ID')} Suara)
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kirim &amp; Verifikasi Form B1 ke Quick Count</span>
          </button>
        </form>
      </div>
    </div>
  );
};

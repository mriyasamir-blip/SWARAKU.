import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CreditCard,
  ImageIcon,
  Loader2,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

export interface KtpOcrExtractionResult {
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  tempatTglLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan' | '';
  alamat: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  fotoKtpThumbnail: string;
  modelUsed?: string;
}

interface ScanKtpOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOcrSuccess: (result: KtpOcrExtractionResult) => void;
}

function resizeDataUrl(
  fileOrDataUrl: File | string,
  maxDimension: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImg = (src: string) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => reject(new Error('Format gambar tidak valid atau file rusak.'));
      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      processImg(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => processImg(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Gagal membaca file gambar dari perangkat.'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export const ScanKtpOcrModal: React.FC<ScanKtpOcrModalProps> = ({
  isOpen,
  onClose,
  onOcrSuccess,
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStageText, setScanStageText] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [liveCameraOpen, setLiveCameraOpen] = useState(false);
  const [liveCameraError, setLiveCameraError] = useState<string | null>(null);

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setLiveCameraOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopLiveCamera();
      setPreviewUrl(null);
      setIsScanning(false);
      setScanStageText('');
      setScanError(null);
      setLiveCameraError(null);
    }
    return () => stopLiveCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  const runGeminiOcr = async (source: File | string) => {
    setScanError(null);
    setLiveCameraError(null);
    stopLiveCamera();
    setIsScanning(true);
    setScanStageText('Mempersiapkan & menajamkan pratinjau foto KTP...');

    try {
      const [ocrImageDataUrl, thumbnailDataUrl] = await Promise.all([
        resizeDataUrl(source, 1440, 0.9),
        resizeDataUrl(source, 560, 0.72),
      ]);

      setPreviewUrl(ocrImageDataUrl);
      setScanStageText('Gemini AI sedang membaca NIK, Nama, TTL, Alamat, Kelurahan & Kecamatan...');

      const response = await fetch('/api/ocr/ktp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: ocrImageDataUrl }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success || !json.data) {
        const message =
          json?.error ||
          'Foto KTP buram atau gagal dibaca oleh OCR. Pastikan seluruh teks KTP terlihat jelas, tidak silau, dan coba pindai ulang.';
        setScanError(message);
        setIsScanning(false);
        return;
      }

      const d = json.data;
      const cleanNik = String(d.nik || '').replace(/\D/g, '').slice(0, 16);
      const cleanNama = String(d.nama || '').trim().toUpperCase();

      if (!cleanNik && !cleanNama) {
        setScanError(
          'NIK dan Nama tidak terbaca dari gambar. Mohon ambil foto KTP dengan pencahayaan terang dan fokus tajam.'
        );
        setIsScanning(false);
        return;
      }

      const tempatLahir = String(d.tempatLahir || '').trim().toUpperCase();
      const tanggalLahir = String(d.tanggalLahir || '').trim();
      const tempatTglLahir =
        String(d.tempatTglLahir || '').trim() ||
        (tempatLahir && tanggalLahir ? `${tempatLahir}, ${tanggalLahir}` : tempatLahir || tanggalLahir);

      const jkLower = String(d.jenisKelamin || '').toLowerCase();
      const jenisKelamin: 'Laki-laki' | 'Perempuan' | '' = jkLower.includes('perempuan')
        ? 'Perempuan'
        : jkLower.includes('laki')
        ? 'Laki-laki'
        : '';

      const extraction: KtpOcrExtractionResult = {
        nik: cleanNik,
        nama: cleanNama,
        tempatLahir,
        tanggalLahir,
        tempatTglLahir,
        jenisKelamin,
        alamat: String(d.alamat || '').trim(),
        rtRw: String(d.rtRw || '').trim(),
        kelurahan: String(d.kelurahan || '').trim(),
        kecamatan: String(d.kecamatan || '').trim(),
        kabupatenKota: String(d.kabupatenKota || '').trim(),
        provinsi: String(d.provinsi || '').trim(),
        fotoKtpThumbnail: thumbnailDataUrl,
        modelUsed: json.modelUsed,
      };

      setIsScanning(false);
      onOcrSuccess(extraction);
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan koneksi saat membaca KTP. Silakan coba lagi.';
      setScanError(msg);
      setIsScanning(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanError('File yang dipilih bukan gambar. Harap unggah file JPG, PNG, atau WEBP.');
      return;
    }
    runGeminiOcr(file);
  };

  const handleOpenLiveWebcam = async () => {
    setScanError(null);
    setLiveCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 }, height: { ideal: 1000 } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch {
      setLiveCameraError(
        'Kamera browser tidak tersedia atau izin ditolak. Gunakan tombol "Ambil Foto dari Kamera" atau "Unggah Gambar" di bawah.'
      );
      cameraInputRef.current?.click();
    }
  };

  const handleCaptureFromLiveCamera = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    runGeminiOcr(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
              <ScanLine className="w-3.5 h-3.5" />
              <span>Scan KTP / ID (OCR Otomatis)</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Pindai e-KTP Konstituen (Voter)
            </h3>
            <p className="text-xs text-slate-500">
              Ambil foto langsung dari kamera atau unggah gambar KTP. Seluruh kolom formulir akan terisi otomatis dan tetap bisa diedit sebelum disimpan.
            </p>
          </div>
          <button
            type="button"
            disabled={isScanning}
            onClick={() => {
              stopLiveCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 cursor-pointer shrink-0"
            aria-label="Tutup modal scan KTP"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Inputs: Native Camera (capture="environment") & File Upload */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />

        {/* Preview & Scanning State */}
        {previewUrl && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/80 bg-slate-950 aspect-[1.58/1] w-full shadow-md">
              <img
                src={previewUrl}
                alt="Pratinjau foto KTP"
                className={`w-full h-full object-contain transition-opacity ${
                  isScanning ? 'opacity-70' : 'opacity-100'
                }`}
              />
              {isScanning && (
                <>
                  <div className="absolute inset-0 bg-emerald-950/30 flex flex-col items-center justify-center p-4 text-center text-white gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600/90 flex items-center justify-center shadow-lg">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <div className="bg-slate-950/80 border border-emerald-400/40 rounded-xl px-3.5 py-2 max-w-xs">
                      <p className="text-xs font-extrabold text-emerald-300 flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Memindai KTP dengan AI OCR...</span>
                      </p>
                      <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                        {scanStageText}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Live Camera Viewfinder (Optional Desktop/Browser Live Capture) */}
        {liveCameraOpen && !isScanning && (
          <div className="space-y-2.5">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[1.58/1] border-2 border-emerald-500 shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex items-end justify-center pb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-emerald-200">
                  Posisikan e-KTP di dalam bingkai
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCaptureFromLiveCamera}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Potret &amp; Pindai KTP</span>
              </button>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal Kamera
              </button>
            </div>
          </div>
        )}

        {/* Error Alert (Blurry / Unreadable / Failed OCR) */}
        {scanError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-300 p-4 space-y-2">
            <div className="flex items-start gap-2.5 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-rose-900">
                  Pemindaian KTP Belum Berhasil
                </p>
                <p className="leading-relaxed">{scanError}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 pl-7">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Foto Ulang Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Pilih Gambar Lain</span>
              </button>
            </div>
          </div>
        )}

        {liveCameraError && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-900">
            {liveCameraError}
          </div>
        )}

        {/* Two Primary Input Options (Camera Capture + File Upload) */}
        {!isScanning && !liveCameraOpen && (
          <div className="space-y-3">
            {!previewUrl && (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-5 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">
                  Pilih Metode Input Foto e-KTP / ID
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pastikan 16 digit NIK, Nama, Tanggal Lahir, dan Alamat terlihat jelas &amp; tidak terpotong.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Ambil Foto dari Kamera</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Unggah Gambar dari Perangkat</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenLiveWebcam}
              className="w-full min-h-[38px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5 text-emerald-700" />
              <span>Gunakan Kamera Langsung (Webcam / Browser)</span>
            </button>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2.5 text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <p className="font-bold text-slate-800">Ekstraksi Otomatis Field e-KTP</p>
                <p>
                  Otomatis mengisi <strong>NIK, Nama, Tempat &amp; Tanggal Lahir, Jenis Kelamin, Alamat, RT/RW, Kelurahan, dan Kecamatan</strong> ke formulir serta mengecek duplikat NIK secara instan.
                </p>
              </div>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 pt-1">
            <CheckCircle2 className="w-4 h-4 animate-pulse" />
            <span>Mohon tunggu sebentar, sedang mengekstrak data JSON...</span>
          </div>
        )}
      </div>
    </div>
  );
};

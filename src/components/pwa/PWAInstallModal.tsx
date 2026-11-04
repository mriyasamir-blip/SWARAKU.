import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { detectActualDevice, getDeviceDisplayName } from '../../utils/device';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Monitor,
  Zap,
  WifiOff,
  ShieldCheck,
  X,
  ArrowRight,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDevice?: (os: 'android' | 'ios' | 'desktop') => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onSelectDevice,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const detected = detectActualDevice();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>(detected);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = detectActualDevice();
      setActivePlatform(current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setDownloading(true);
    localStorage.setItem('vore_device_os', activePlatform);
    if (onSelectDevice) {
      onSelectDevice(activePlatform);
    }

    if (isInstallable) {
      const installed = await install();
      setDownloading(false);
      if (installed) {
        setInstallSuccess(true);
      }
    } else {
      setTimeout(() => {
        setDownloading(false);
      }, 500);
    }
  };

  const handleDownloadOfflineManifest = () => {
    const appInfo = {
      name: 'SWARAKU - Platform Pemenangan & Relawan Pemilih',
      short_name: 'SWARAKU',
      version: '1.0.0',
      url: window.location.origin,
      author: 'Tim Pengembang SWARAKU Platform',
      downloadedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(appInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swaraku-app-shortcut.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-cyan-600 to-teal-500 p-0.5 shadow-sm shrink-0">
              <img src="/icon.svg" alt="SWARAKU App Icon" className="w-full h-full object-cover rounded-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  SWARAKU
                </h2>
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-200">
                  Resmi PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Platform Pemenangan &amp; Relawan Pemilih
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

        {/* Success Alert if already installed */}
        {isInstalled || installSuccess ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-emerald-950">Aplikasi Berhasil Terpasang!</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              SWARAKU kini telah terpasang di layar utama perangkat Anda. Anda dapat membukanya kapan saja seperti aplikasi bawaan (native).
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Tutup &amp; Gunakan Aplikasi
            </button>
          </div>
        ) : (
          <>
            {/* Primary Action Button */}
            <div className="space-y-2">
              <button
                onClick={handleInstallClick}
                disabled={downloading}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloading
                    ? 'Menyiapkan Pemasangan...'
                    : isInstallable
                    ? 'Download & Pasang Aplikasi Sekarang'
                    : 'Pasang di Layar Utama HP / Desktop'}
                </span>
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Gratis · Ukuran Sangat Ringan (&lt;3 MB) · Tanpa Beban Memori
              </p>
            </div>

            {/* Platform Guides Selector */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Petunjuk Pemasangan Sesuai Perangkat:</span>
                <span className="text-[10px] text-cyan-800 bg-cyan-100 font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                  Otomatis Terdeteksi
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePlatform('android');
                    if (onSelectDevice) onSelectDevice('android');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                    activePlatform === 'android'
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {detected === 'android' && (
                    <span className="absolute -top-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                      Device Anda
                    </span>
                  )}
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePlatform('ios');
                    if (onSelectDevice) onSelectDevice('ios');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                    activePlatform === 'ios'
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {detected === 'ios' && (
                    <span className="absolute -top-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                      Device Anda
                    </span>
                  )}
                  <Share2 className="w-4 h-4 text-cyan-600" />
                  <span>iPhone / iOS</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePlatform('desktop');
                    if (onSelectDevice) onSelectDevice('desktop');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer relative ${
                    activePlatform === 'desktop'
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {detected === 'desktop' && (
                    <span className="absolute -top-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                      Device Anda
                    </span>
                  )}
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>Laptop / PC</span>
                </button>
              </div>

              {/* Instructions Details per platform */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                {activePlatform === 'android' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-900 block">Cara Pasang di HP Android:</span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                      <li>Buka peramban Google Chrome atau Samsung Internet.</li>
                      <li>
                        Tekan menu titik tiga (<strong>⋮</strong>) di sudut kanan atas.
                      </li>
                      <li>
                        Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.
                      </li>
                      <li>Ikon SWARAKU Apps akan langsung muncul di beranda ponsel Anda.</li>
                    </ol>
                  </div>
                )}

                {activePlatform === 'ios' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-900 block">Cara Pasang di iPhone / iPad (Safari):</span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                      <li>
                        Buka tautan ini di peramban <strong>Safari</strong>.
                      </li>
                      <li>
                        Tekan tombol <strong>Bagikan (Share icon kotak berpanah ke atas)</strong> di bilah bawah.
                      </li>
                      <li>
                        Gulir ke bawah dan ketuk <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                      </li>
                      <li>Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Selesai!</li>
                    </ol>
                  </div>
                )}

                {activePlatform === 'desktop' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-900 block">Cara Pasang di Komputer / Laptop:</span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                      <li>Gunakan Google Chrome, Microsoft Edge, atau Brave Browser.</li>
                      <li>
                        Klik ikon <strong>Install App (komputer berpanah ke bawah)</strong> di ujung kanan kolom alamat web (URL bar).
                      </li>
                      <li>Pilih <strong>"Install"</strong> untuk membuka SWARAKU dalam jendela aplikasi tersendiri tanpa bilah browser.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* App Key Highlights */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-cyan-50/70 rounded-xl border border-cyan-100 flex items-start gap-2">
                <Zap className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">Buka Instan</span>
                  <span className="text-[10px] text-slate-500">Tanpa repot ketik URL web lagi</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start gap-2">
                <WifiOff className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">Dukungan Offline</span>
                  <span className="text-[10px] text-slate-500">Tetap dapat diakses tanpa sinyal</span>
                </div>
              </div>
            </div>

            {/* Shortcut File Download Fallback */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span className="text-[11px]">Paket Aplikasi Berkas:</span>
              <button
                type="button"
                onClick={handleDownloadOfflineManifest}
                className="text-cyan-700 hover:text-cyan-800 font-semibold text-[11px] underline flex items-center gap-1 cursor-pointer"
              >
                <span>Unduh Berkas Konfigurasi App</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

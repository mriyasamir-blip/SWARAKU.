import React, { useState } from 'react';
import { MapPinOff, RefreshCw, ShieldAlert, X } from 'lucide-react';
import type { UserAccount } from '../types/vore';
import { shouldAutoTrackGps } from '../utils/hierarchyAccess';

// ============================================================================
// SWARAKU — GPS PERMISSION NOTICE MODAL
// Bekerja berdampingan dengan global hook `useLocationTracker` (tidak menduplikasi
// watchPosition agar kuota tulis Firestore hemat & terpusat).
// ============================================================================

interface GpsTrackerModalProps {
  user: UserAccount | null;
  userAccounts?: UserAccount[];
  permissionDenied?: boolean;
  errorMessage?: string | null;
  onRetryPermission?: () => void;
}

export const GpsTrackerModal: React.FC<GpsTrackerModalProps> = ({
  user,
  permissionDenied = false,
  errorMessage = null,
  onRetryPermission,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!user || !shouldAutoTrackGps(user.role) || !permissionDenied || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-rose-200 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <MapPinOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-950">Izin Lokasi GPS Diperlukan</h3>
              <p className="text-[11px] text-rose-700 font-medium">
                Live Location Tracking Tim Lapangan SWARAKU
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-8 h-8 rounded-xl hover:bg-rose-100 text-rose-700 flex items-center justify-center cursor-pointer"
            aria-label="Tutup peringatan GPS"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {errorMessage ||
                'Browser memblokir akses lokasi GPS. Aktifkan izin Lokasi pada pengaturan browser/HP Anda agar posisi Anda tersinkronisasi secara real-time di Dashboard Monitoring Relawan.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={() => {
                onRetryPermission?.();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Aktifkan GPS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

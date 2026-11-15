import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { AlertTriangle } from 'lucide-react';
import type { MapsErrorCode } from '../../main';

const MAPS_LIBRARIES: ('marker')[] = ['marker'];

const PLACEHOLDER_KEYS = new Set([
  'YOUR_GOOGLE_MAPS_API_KEY',
  'MY_GOOGLE_MAPS_API_KEY',
  'YOUR_API_KEY_HERE',
]);

export function getGoogleMapsApiKey(): string {
  const raw =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '' : '';
  const trimmed = String(raw).trim();
  if (!trimmed || PLACEHOLDER_KEYS.has(trimmed) || trimmed.length < 10) {
    return '';
  }
  return trimmed;
}

export type MapsDiagnosticReason =
  | MapsErrorCode
  | 'missing_key'
  | 'script_failed'
  | 'dom_error_overlay';

export function useGoogleMapsDiagnostic(): {
  reason: MapsDiagnosticReason | null;
  hostname: string;
} {
  const [reason, setReason] = useState<MapsDiagnosticReason | null>(() => {
    if (!getGoogleMapsApiKey()) return 'missing_key';
    if (typeof window !== 'undefined' && window.__SWARAKU_MAPS_ERROR__?.code) {
      return window.__SWARAKU_MAPS_ERROR__.code;
    }
    return null;
  });

  useEffect(() => {
    const syncFromGlobal = () => {
      if (!getGoogleMapsApiKey()) {
        setReason('missing_key');
        return;
      }
      if (window.__SWARAKU_MAPS_ERROR__?.code) {
        setReason(window.__SWARAKU_MAPS_ERROR__.code);
      }
    };

    const onMapError = (ev: Event) => {
      const customEv = ev as CustomEvent<{ code?: MapsErrorCode }>;
      if (customEv.detail?.code) {
        setReason(customEv.detail.code);
      } else {
        syncFromGlobal();
      }
    };

    const onQuota = () => {
      setReason((prev) => prev || 'quota_exceeded');
    };

    window.addEventListener('gmp-map-error', onMapError);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => {
      window.removeEventListener('gmp-map-error', onMapError);
      window.removeEventListener('gmp-quota-exceeded', onQuota);
    };
  }, []);

  const hostname =
    typeof window !== 'undefined' ? window.location.hostname || 'domain ini' : 'domain ini';

  return { reason, hostname };
}

export const SwarakuMapsDiagnosticNotice: React.FC<{
  title?: string;
  subtitle?: string;
}> = ({
  title = 'Tampilan Peta Google Maps sedang dialihkan ke Mode Ringkasan Wilayah',
  subtitle = 'Data koordinat & sebaran suara tetap aktif di bawah ini:',
}) => {
  const { reason, hostname } = useGoogleMapsDiagnostic();

  let detailText =
    'Pastikan API Key Google Maps aktif (Maps JavaScript API, pembatasan HTTP referrer mengizinkan domain Anda, dan kuota/billing aktif).';

  if (reason === 'missing_key') {
    detailText = `API Key Google Maps (VITE_GOOGLE_MAPS_API_KEY) belum terpasang saat build untuk domain ${hostname}. Tambahkan secret VITE_GOOGLE_MAPS_API_KEY pada pengaturan deploy lalu build ulang.`;
  } else if (reason === 'referer_not_allowed' || reason === 'auth_failure') {
    detailText = `Domain "${hostname}" belum diizinkan oleh pembatasan HTTP Referrer pada API Key Google Cloud Anda (atau menggunakan preview key AI Studio). Tambahkan https://swaraku.online/* dan https://www.swaraku.online/* di Google Cloud Console > Credentials.`;
  } else if (reason === 'billing_not_enabled') {
    detailText =
      'Akun penagihan (Billing) Google Cloud belum aktif pada project pemilik API Key Google Maps.';
  } else if (reason === 'api_not_activated') {
    detailText =
      'Layanan Maps JavaScript API belum diaktifkan pada project Google Cloud Console untuk API Key ini.';
  } else if (reason === 'invalid_key' || reason === 'expired_key' || reason === 'no_api_keys') {
    detailText =
      'API Key Google Maps tidak valid atau sudah kedaluwarsa. Periksa kembali nilai secret VITE_GOOGLE_MAPS_API_KEY.';
  } else if (reason === 'quota_exceeded') {
    detailText =
      'Kuota harian atau batas permintaan Google Maps Platform API Key ini telah tercapai.';
  } else if (reason === 'project_error' || reason === 'script_failed' || reason === 'dom_error_overlay') {
    detailText = `Google Maps gagal dimuat pada domain "${hostname}". Periksa pengaktifan Maps JavaScript API, pembatasan HTTP referrer (https://swaraku.online/*), dan status billing.`;
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-900 space-y-1">
        <p className="font-bold">{title}</p>
        <p className="leading-relaxed">
          {detailText} {subtitle}
        </p>
      </div>
    </div>
  );
};

interface SwarakuMapsProviderProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const MapsRuntimeGuard: React.FC<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}> = ({ children, fallback }) => {
  const status = useApiLoadingStatus();
  const [runtimeFailed, setRuntimeFailed] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.__SWARAKU_MAPS_ERROR__?.code);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onMapError = () => setRuntimeFailed(true);
    window.addEventListener('gmp-map-error', onMapError);
    window.addEventListener('gmp-quota-exceeded', onMapError);
    return () => {
      window.removeEventListener('gmp-map-error', onMapError);
      window.removeEventListener('gmp-quota-exceeded', onMapError);
    };
  }, []);

  // Watch DOM for Google's injected ".gm-err-container" error dialog
  useEffect(() => {
    const el = containerRef.current;
    if (!el || runtimeFailed) return;

    const checkForGoogleErrorOverlay = () => {
      if (el.querySelector('.gm-err-container') || el.querySelector('.gm-err-title')) {
        setRuntimeFailed(true);
      }
    };

    checkForGoogleErrorOverlay();

    const observer = new MutationObserver(() => {
      checkForGoogleErrorOverlay();
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [runtimeFailed]);

  if (
    runtimeFailed ||
    status === APILoadingStatus.AUTH_FAILURE ||
    status === APILoadingStatus.FAILED
  ) {
    return <>{fallback}</>;
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
};

export const SwarakuMapsProvider: React.FC<SwarakuMapsProviderProps> = ({
  children,
  fallback,
}) => {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return <>{fallback}</>;
  }

  return (
    <APIProvider apiKey={apiKey} libraries={MAPS_LIBRARIES} language="id" region="ID">
      <MapsRuntimeGuard fallback={fallback}>{children}</MapsRuntimeGuard>
    </APIProvider>
  );
};

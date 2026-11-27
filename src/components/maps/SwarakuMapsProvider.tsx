import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react';
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
  origin: string;
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
  const origin =
    typeof window !== 'undefined' ? window.location.origin || '' : '';

  return { reason, hostname, origin };
}

export const SwarakuMapsDiagnosticNotice: React.FC<{
  title?: string;
  subtitle?: string;
}> = ({
  title = 'Tampilan Peta Google Maps sedang dialihkan ke Mode Ringkasan Wilayah',
  subtitle = 'Data koordinat & sebaran suara tetap aktif di bawah ini:',
}) => {
  const { reason, hostname, origin } = useGoogleMapsDiagnostic();
  const [copiedReferrer, setCopiedReferrer] = useState(false);

  const currentReferrerPattern = origin ? `${origin}/*` : `https://${hostname}/*`;
  const isCustomProdDomain =
    hostname === 'swaraku.online' || hostname === 'www.swaraku.online';

  const handleCopyReferrer = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(currentReferrerPattern)
        .then(() => {
          setCopiedReferrer(true);
          window.setTimeout(() => setCopiedReferrer(false), 2500);
        })
        .catch(() => {});
    }
  };

  let detailText =
    'Pastikan API Key Google Maps aktif (Maps JavaScript API, pembatasan HTTP referrer mengizinkan domain Anda, dan kuota/billing aktif).';

  if (reason === 'missing_key') {
    detailText = `API Key Google Maps (VITE_GOOGLE_MAPS_API_KEY) belum terpasang saat build untuk domain ${hostname}. Tambahkan secret VITE_GOOGLE_MAPS_API_KEY pada pengaturan deploy lalu build ulang.`;
  } else if (reason === 'referer_not_allowed' || reason === 'auth_failure') {
    detailText = `URL situs "${currentReferrerPattern}" belum diizinkan pada pembatasan HTTP Referrer (Website restrictions) untuk API Key Google Maps Anda di Google Cloud Console.`;
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
    detailText = `Google Maps gagal dimuat pada domain "${hostname}". Periksa pengaktifan Maps JavaScript API, pembatasan HTTP referrer (${currentReferrerPattern}), dan status billing.`;
  }

  const showReferrerAction =
    reason === 'referer_not_allowed' ||
    reason === 'auth_failure' ||
    reason === 'project_error' ||
    reason === 'dom_error_overlay';

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-900 space-y-2 min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="leading-relaxed">
          {detailText} {subtitle}
        </p>
        {showReferrerAction && (
          <div className="pt-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <code className="px-2 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-mono text-amber-950 break-all">
                {currentReferrerPattern}
              </code>
              <button
                type="button"
                onClick={handleCopyReferrer}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                {copiedReferrer ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin URL Referrer
                  </>
                )}
              </button>
              <a
                href="https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 underline hover:text-amber-700"
              >
                Panduan Referrer Google Cloud
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {!isCustomProdDomain && (
              <p className="text-[11px] text-amber-800">
                Tambahkan URL di atas (serta{' '}
                <span className="font-mono">https://swaraku.online/*</span> dan{' '}
                <span className="font-mono">https://www.swaraku.online/*</span> untuk produksi) pada
                Google Cloud Console &rarr; APIs &amp; Services &rarr; Credentials &rarr; Website
                restrictions.
              </p>
            )}
          </div>
        )}
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
  const hasFatalGlobalError =
    typeof window !== 'undefined' && Boolean(window.__SWARAKU_MAPS_ERROR__?.code);

  if (!apiKey || hasFatalGlobalError) {
    return <>{fallback}</>;
  }

  return (
    <APIProvider apiKey={apiKey} libraries={MAPS_LIBRARIES} language="id" region="ID">
      <MapsRuntimeGuard fallback={fallback}>{children}</MapsRuntimeGuard>
    </APIProvider>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';

const MAPS_LIBRARIES: ('marker')[] = ['marker'];

export function getGoogleMapsApiKey(): string {
  const raw =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '' : '';
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === 'YOUR_GOOGLE_MAPS_API_KEY' || trimmed.length < 10) {
    return '';
  }
  return trimmed;
}

interface SwarakuMapsProviderProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const MapsRuntimeGuard: React.FC<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}> = ({ children, fallback }) => {
  const status = useApiLoadingStatus();
  const [runtimeFailed, setRuntimeFailed] = useState(false);
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
  // ("Halaman ini tidak dapat memuat Google Maps dengan benar. Apakah Anda pemilik situs ini?")
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

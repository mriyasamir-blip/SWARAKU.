import React from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { MapPin, AlertCircle } from 'lucide-react';

interface EventLocationMapProps {
  lat: number;
  lng: number;
  title: string;
  address: string;
}

const MapContent: React.FC<{ lat: number; lng: number; title: string; address: string }> = ({
  lat,
  lng,
  title,
  address,
}) => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="h-60 w-full rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-6 h-6 text-amber-600 mb-2" />
        <p className="text-sm font-semibold text-slate-800">Peta interaktif sedang tidak tersedia</p>
        <p className="text-xs text-slate-600 mt-1 max-w-sm">{address}</p>
        <p className="text-xs font-mono tabular-nums text-slate-500 mt-1">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </div>
    );
  }

  return (
    <div className="h-60 w-full rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={{ lat, lng }}
        center={{ lat, lng }}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker position={{ lat, lng }} title={title}>
          <Pin background="#1d4ed8" borderColor="#1e3a8a" glyphColor="#ffffff" />
        </AdvancedMarker>
      </GoogleMap>
    </div>
  );
};

export const EventLocationMap: React.FC<EventLocationMapProps> = ({
  lat,
  lng,
  title,
  address,
}) => {
  const apiKey =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_MAPS_API_KEY : '';

  if (!apiKey) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800">Lokasi Terkonfirmasi</p>
          <p className="text-sm text-slate-700 mt-0.5">{address}</p>
          <p className="text-xs font-mono tabular-nums text-slate-500 mt-1">
            Koordinat: {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['marker']} language="id" region="ID">
      <MapContent lat={lat} lng={lng} title={title} address={address} />
    </APIProvider>
  );
};

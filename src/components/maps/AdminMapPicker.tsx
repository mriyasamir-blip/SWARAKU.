import React from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useApiLoadingStatus,
  APILoadingStatus,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

interface AdminMapPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

const PickerInner: React.FC<AdminMapPickerProps> = ({ lat, lng, onChange }) => {
  const status = useApiLoadingStatus();

  const handleMapClick = (ev: MapMouseEvent) => {
    const latLng = ev.detail.latLng;
    if (latLng) {
      onChange({
        lat: Number(latLng.lat.toFixed(6)),
        lng: Number(latLng.lng.toFixed(6)),
      });
    }
  };

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="h-64 w-full rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
        <MapPin className="w-6 h-6 text-slate-500 mb-2" />
        <p className="text-sm font-semibold text-slate-800">Peta interaktif belum tersedia</p>
        <p className="text-xs text-slate-600 mt-1">
          Anda tetap dapat mengisi Latitude dan Longitude secara manual di kolom di bawah.
        </p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={{ lat, lng }}
        center={{ lat, lng }}
        defaultZoom={12}
        gestureHandling="greedy"
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker position={{ lat, lng }} title="Titik Lokasi Acara">
          <Pin background="#dc2626" borderColor="#991b1b" glyphColor="#ffffff" />
        </AdvancedMarker>
      </GoogleMap>
    </div>
  );
};

export const AdminMapPicker: React.FC<AdminMapPickerProps> = ({ lat, lng, onChange }) => {
  const apiKey =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_MAPS_API_KEY : '';

  if (!apiKey) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-center gap-2.5">
        <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
        <span>
          Masukkan koordinat Latitude &amp; Longitude acara di bawah ini. Peta interaktif aktif saat kunci Google Maps tersedia.
        </span>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['marker']} language="id" region="ID">
      <PickerInner lat={lat} lng={lng} onChange={onChange} />
    </APIProvider>
  );
};

import React from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { SwarakuMapsProvider } from './SwarakuMapsProvider';

interface AdminMapPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export const AdminMapPicker: React.FC<AdminMapPickerProps> = ({ lat, lng, onChange }) => {
  const handleMapClick = (ev: MapMouseEvent) => {
    const latLng = ev.detail.latLng;
    if (latLng) {
      onChange({
        lat: Number(latLng.lat.toFixed(6)),
        lng: Number(latLng.lng.toFixed(6)),
      });
    }
  };

  const fallback = (
    <div className="h-full w-full rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
      <MapPin className="w-6 h-6 text-slate-500 mb-2" />
      <p className="text-sm font-semibold text-slate-800">Peta interaktif belum tersedia</p>
      <p className="text-xs text-slate-600 mt-1 max-w-sm">
        Anda tetap dapat mengisi Latitude dan Longitude secara manual di kolom di bawah ({lat.toFixed(5)}, {lng.toFixed(5)}).
      </p>
    </div>
  );

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
      <SwarakuMapsProvider fallback={fallback}>
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
      </SwarakuMapsProvider>
    </div>
  );
};

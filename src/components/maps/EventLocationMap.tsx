import React from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { SwarakuMapsProvider } from './SwarakuMapsProvider';

interface EventLocationMapProps {
  lat: number;
  lng: number;
  title: string;
  address: string;
}

export const EventLocationMap: React.FC<EventLocationMapProps> = ({
  lat,
  lng,
  title,
  address,
}) => {
  const fallback = (
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

  return (
    <div className="h-60 w-full rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
      <SwarakuMapsProvider fallback={<div className="h-full flex items-center justify-center p-3">{fallback}</div>}>
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
      </SwarakuMapsProvider>
    </div>
  );
};

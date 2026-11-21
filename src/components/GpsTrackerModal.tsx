import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
  getDistanceMeters,
  isTrackedRole,
  saveLiveLocation,
  toTrackedRoleLabel,
  type GpsStatus,
  type UserRole,
} from '../services/locationService';

export interface TrackedUserInfo {
  id: string;
  username?: string;
  nama: string;
  role: UserRole;
  timSuksesId?: string | null;
  timSuksesNama?: string | null;
  didaftarkanOlehTimSukses?: string | null;
  korcamId?: string | null;
  korcamNama?: string | null;
}

interface GpsTrackerModalProps {
  user: TrackedUserInfo | null;
}

const THROTTLE_MS = 30_000;
const MIN_DISTANCE_METERS = 20;

async function tryReverseGeocode(lat: number, lng: number): Promise<string> {
  if (typeof window === 'undefined') return '';
  const gmaps = (
    window as unknown as {
      google?: {
        maps?: {
          Geocoder?: new () => {
            geocode: (
              req: { location: { lat: number; lng: number } },
              cb: (
                results: Array<{ formatted_address?: string }> | null,
                status: string
              ) => void
            ) => void;
          };
        };
      };
    }
  ).google?.maps;

  const GeocoderCtor = gmaps?.Geocoder;
  if (!GeocoderCtor) return '';

  return new Promise((resolve) => {
    try {
      const geocoder = new GeocoderCtor();
      const timer = window.setTimeout(() => resolve(''), 3500);
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        window.clearTimeout(timer);
        if (status === 'OK' && results && results[0]?.formatted_address) {
          resolve(results[0].formatted_address.slice(0, 300));
        } else {
          resolve('');
        }
      });
    } catch {
      resolve('');
    }
  });
}

export const GpsTrackerModal: React.FC<GpsTrackerModalProps> = ({ user }) => {
  const [status, setStatus] = useState<GpsStatus | 'Menunggu'>('Menunggu');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [retryTick, setRetryTick] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);

  const tracked = Boolean(user && isTrackedRole(user.role));

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        // Abaikan jika sudah dibersihkan
      }
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopWatching();

    if (!user || !tracked) {
      setStatus('Menunggu');
      setErrorDetail(null);
      setDismissed(false);
      return;
    }

    const trackedRole = toTrackedRoleLabel(user.role);
    if (!trackedRole) return;

    const userId = user.id || user.username || '';
    if (!userId) return;

    const needsSupervisor = trackedRole === 'Korcam' || trackedRole === 'Relawan';
    const timSuksesId = needsSupervisor ? user.timSuksesId || null : null;
    const namaTimSukses = needsSupervisor
      ? user.timSuksesNama || user.didaftarkanOlehTimSukses || null
      : null;
    const korcamId = trackedRole === 'Relawan' ? user.korcamId || null : null;
    const namaKorcam = trackedRole === 'Relawan' ? user.korcamNama || null : null;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('Ditolak');
      setErrorDetail('Browser perangkat ini tidak mendukung fitur pelacakan GPS.');
      saveLiveLocation({
        userId,
        nama: user.nama,
        role: trackedRole,
        timSuksesId,
        namaTimSukses,
        korcamId,
        namaKorcam,
        latitude: null,
        longitude: null,
        accuracy: null,
        address: '',
        gpsStatus: 'Ditolak',
      }).catch(() => {});
      return;
    }

    let cancelled = false;
    let hasSentInitial = false;
    let lastSentAt = 0;
    let lastLat: number | null = null;
    let lastLng: number | null = null;
    let lastAddress = '';
    let isSaving = false;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (cancelled) return;
        const { latitude, longitude, accuracy } = pos.coords;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          return;
        }

        const now = Date.now();
        const elapsed = now - lastSentAt;
        const movedMeters =
          lastLat !== null && lastLng !== null
            ? getDistanceMeters(lastLat, lastLng, latitude, longitude)
            : Infinity;

        const shouldSend =
          !hasSentInitial ||
          elapsed >= THROTTLE_MS ||
          movedMeters > MIN_DISTANCE_METERS;

        if (!shouldSend || isSaving) return;

        isSaving = true;
        try {
          let address = lastAddress;
          if (!hasSentInitial || movedMeters > MIN_DISTANCE_METERS) {
            address = await tryReverseGeocode(latitude, longitude);
            if (address) lastAddress = address;
          }

          if (cancelled) return;

          await saveLiveLocation({
            userId,
            nama: user.nama,
            role: trackedRole,
            timSuksesId,
            namaTimSukses,
            korcamId,
            namaKorcam,
            latitude,
            longitude,
            accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
            address,
            gpsStatus: 'Aktif',
          });

          hasSentInitial = true;
          lastSentAt = Date.now();
          lastLat = latitude;
          lastLng = longitude;
          setStatus('Aktif');
          setErrorDetail(null);
        } catch {
          // Error sudah ditangani secara terstruktur oleh locationService
        } finally {
          isSaving = false;
        }
      },
      (geoErr) => {
        if (cancelled) return;
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setStatus('Ditolak');
          setErrorDetail(
            'Izin lokasi GPS ditolak. Aktifkan izin lokasi pada browser agar posisi Anda terpantau di menu Monitoring Relawan.'
          );
          saveLiveLocation({
            userId,
            nama: user.nama,
            role: trackedRole,
            timSuksesId,
            namaTimSukses,
            korcamId,
            namaKorcam,
            latitude: null,
            longitude: null,
            accuracy: null,
            address: '',
            gpsStatus: 'Ditolak',
          }).catch(() => {});
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 20_000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      cancelled = true;
      stopWatching();
    };
  }, [
    user?.id,
    user?.username,
    user?.nama,
    user?.role,
    user?.timSuksesId,
    user?.timSuksesNama,
    user?.didaftarkanOlehTimSukses,
    user?.korcamId,
    user?.korcamNama,
    tracked,
    retryTick,
    stopWatching,
  ]);

  // Tampilkan modal hanya jika user adalah Korwil / Korcam / Relawan dan izin GPS ditolak
  if (!tracked || status !== 'Ditolak' || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Akses Lokasi GPS Belum Aktif
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {errorDetail ||
                  'Akun Korwil, Korcam, dan Relawan memerlukan izin lokasi GPS agar status keberadaan lapangan dapat dipantau secara real-time.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            aria-label="Tutup pemberitahuan GPS"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            Status Anda saat ini tercatat sebagai <strong className="text-rose-700">Ditolak</strong> di
            Monitoring Relawan tanpa koordinat palsu.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorDetail(null);
              setStatus('Menunggu');
              setRetryTick((t) => t + 1);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Aktifkan GPS Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};

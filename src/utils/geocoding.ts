// Utilitas Geocoding Presisi Google Maps & Kamus Koordinat Cerdas Indonesia

export interface LatLngResult {
  lat: number;
  lng: number;
  resolvedVia: 'google_geocoder' | 'smart_lookup' | 'city_center';
  formattedAddress: string;
}

// Kamus Koordinat Presisi untuk Seluruh Kecamatan & Wilayah Utama di Jakarta & Indonesia
// Memastikan bahwa input seperti "Penjaringan, Jakarta Utara" selalu tepat di titik Jakarta Utara!
export const WILAYAH_COORDINATES_DICTIONARY: Record<string, { lat: number; lng: number }> = {
  // === JAKARTA UTARA ===
  'penjaringan': { lat: -6.1264, lng: 106.7885 },
  'kecamatan penjaringan': { lat: -6.1264, lng: 106.7885 },
  'pluit': { lat: -6.1189, lng: 106.7925 },
  'pejagalan': { lat: -6.1342, lng: 106.7917 },
  'kapuk muara': { lat: -6.1305, lng: 106.7667 },
  'kamal muara': { lat: -6.1089, lng: 106.7389 },
  'tanjung priok': { lat: -6.1321, lng: 106.8715 },
  'kecamatan tanjung priok': { lat: -6.1321, lng: 106.8715 },
  'sunter agung': { lat: -6.1412, lng: 106.8625 },
  'sunter jaya': { lat: -6.1539, lng: 106.8789 },
  'koja': { lat: -6.1226, lng: 106.9067 },
  'kecamatan koja': { lat: -6.1226, lng: 106.9067 },
  'rawabadak': { lat: -6.1292, lng: 106.9014 },
  'lagoa': { lat: -6.1214, lng: 106.9142 },
  'cilincing': { lat: -6.1287, lng: 106.9419 },
  'kecamatan cilincing': { lat: -6.1287, lng: 106.9419 },
  'marunda': { lat: -6.1078, lng: 106.9742 },
  'rorotan': { lat: -6.1556, lng: 106.9642 },
  'pademangan': { lat: -6.1362, lng: 106.8407 },
  'kecamatan pademangan': { lat: -6.1362, lng: 106.8407 },
  'ancol': { lat: -6.1245, lng: 106.8317 },
  'kelapa gading': { lat: -6.1623, lng: 106.9078 },
  'kecamatan kelapa gading': { lat: -6.1623, lng: 106.9078 },
  'kelapa gading timur': { lat: -6.1656, lng: 106.9145 },
  'kelapa gading barat': { lat: -6.1589, lng: 106.8989 },
  'pegangsaan dua': { lat: -6.1692, lng: 106.9242 },
  'jakarta utara': { lat: -6.1384, lng: 106.8640 },
  'kota jakarta utara': { lat: -6.1384, lng: 106.8640 },

  // === JAKARTA BARAT ===
  'grogol petamburan': { lat: -6.1667, lng: 106.7891 },
  'kebon jeruk': { lat: -6.1912, lng: 106.7686 },
  'palmerah': { lat: -6.1956, lng: 106.7971 },
  'kembangan': { lat: -6.1868, lng: 106.7350 },
  'cengkareng': { lat: -6.1528, lng: 106.7314 },
  'kalideres': { lat: -6.1436, lng: 106.7027 },
  'tambora': { lat: -6.1444, lng: 106.8042 },
  'taman sari': { lat: -6.1442, lng: 106.8188 },
  'jakarta barat': { lat: -6.1683, lng: 106.7589 },
  'kota jakarta barat': { lat: -6.1683, lng: 106.7589 },

  // === JAKARTA PUSAT ===
  'gambir': { lat: -6.1754, lng: 106.8272 },
  'tanah abang': { lat: -6.1989, lng: 106.8167 },
  'menteng': { lat: -6.1956, lng: 106.8378 },
  'senen': { lat: -6.1892, lng: 106.8475 },
  'cempaka putih': { lat: -6.1818, lng: 106.8683 },
  'johar baru': { lat: -6.1862, lng: 106.8569 },
  'kemayoran': { lat: -6.1627, lng: 106.8557 },
  'sawah besar': { lat: -6.1517, lng: 106.8322 },
  'jakarta pusat': { lat: -6.1818, lng: 106.8227 },
  'kota jakarta pusat': { lat: -6.1818, lng: 106.8227 },

  // === JAKARTA TIMUR ===
  'matraman': { lat: -6.2045, lng: 106.8589 },
  'pulo gadung': { lat: -6.1947, lng: 106.8967 },
  'jatinegara': { lat: -6.2307, lng: 106.8778 },
  'duren sawit': { lat: -6.2345, lng: 106.9142 },
  'kramat jati': { lat: -6.2731, lng: 106.8672 },
  'makasar': { lat: -6.2825, lng: 106.8931 },
  'pasar rebo': { lat: -6.3214, lng: 106.8647 },
  'ciracas': { lat: -6.3312, lng: 106.8789 },
  'cipayung': { lat: -6.3245, lng: 106.9067 },
  'cakung': { lat: -6.1878, lng: 106.9489 },
  'jakarta timur': { lat: -6.2250, lng: 106.9004 },
  'kota jakarta timur': { lat: -6.2250, lng: 106.9004 },

  // === JAKARTA SELATAN ===
  'cilandak': { lat: -6.2932, lng: 106.8016 },
  'kebayoran baru': { lat: -6.2444, lng: 106.7997 },
  'kebayoran lama': { lat: -6.2492, lng: 106.7778 },
  'pesanggrahan': { lat: -6.2489, lng: 106.7583 },
  'pasar minggu': { lat: -6.2889, lng: 106.8389 },
  'jagakarsa': { lat: -6.3342, lng: 106.8286 },
  'mampang prapatan': { lat: -6.2558, lng: 106.8272 },
  'pancoran': { lat: -6.2514, lng: 106.8475 },
  'tebet': { lat: -6.2317, lng: 106.8539 },
  'setiabudi': { lat: -6.2167, lng: 106.8317 },
  'jakarta selatan': { lat: -6.2615, lng: 106.8106 },
  'kota jakarta selatan': { lat: -6.2615, lng: 106.8106 },

  // === KOTA-KOTA LAIN DI INDONESIA ===
  'tangerang': { lat: -6.1783, lng: 106.6319 },
  'tangerang selatan': { lat: -6.2889, lng: 106.7178 },
  'bekasi': { lat: -6.2383, lng: 106.9756 },
  'depok': { lat: -6.4025, lng: 106.7942 },
  'bogor': { lat: -6.5971, lng: 106.8060 },
  'bandung': { lat: -6.9175, lng: 107.6191 },
  'surabaya': { lat: -7.2575, lng: 112.7521 },
  'semarang': { lat: -6.9667, lng: 110.4167 },
  'medan': { lat: 3.5952, lng: 98.6722 },
  'makassar': { lat: -5.1477, lng: 119.4327 },
  'yogyakarta': { lat: -7.7956, lng: 110.3695 },
  'denpasar': { lat: -8.6705, lng: 115.2126 },
  'palembang': { lat: -2.9761, lng: 104.7754 },
  'batam': { lat: 1.0456, lng: 104.0305 },
  'pekanbaru': { lat: 0.5071, lng: 101.4478 },
  'padang': { lat: -0.9471, lng: 100.4172 },
  'bandar lampung': { lat: -5.3971, lng: 105.2668 },
  'malang': { lat: -7.9666, lng: 112.6326 },
  'surakarta': { lat: -7.5755, lng: 110.8243 },
  'solo': { lat: -7.5755, lng: 110.8243 },
};

// Normalisasi string untuk pencarian kamus
export function cleanWilayahKey(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.|kelurahan|kel\.|desa)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Lookup cerdas tanpa pernah memaksakan ke "Jakarta Selatan"
export function lookupSmartCoordinates(
  kelurahan?: string,
  kecamatan?: string,
  kota?: string
): { lat: number; lng: number } | null {
  const kelKey = cleanWilayahKey(kelurahan);
  const kecKey = cleanWilayahKey(kecamatan);
  const kotaKey = cleanWilayahKey(kota);

  // 1. Coba cari berdasarkan nama kelurahan spesifik
  if (kelKey && WILAYAH_COORDINATES_DICTIONARY[kelKey]) {
    return WILAYAH_COORDINATES_DICTIONARY[kelKey];
  }

  // 2. Coba cari berdasarkan nama kecamatan
  if (kecKey && WILAYAH_COORDINATES_DICTIONARY[kecKey]) {
    return WILAYAH_COORDINATES_DICTIONARY[kecKey];
  }

  // 3. Coba cari kecamatan dengan prefix
  const kecFullKey = `kecamatan ${kecKey}`;
  if (WILAYAH_COORDINATES_DICTIONARY[kecFullKey]) {
    return WILAYAH_COORDINATES_DICTIONARY[kecFullKey];
  }

  // 4. Coba cari berdasarkan kota/kabupaten
  if (kotaKey && WILAYAH_COORDINATES_DICTIONARY[kotaKey]) {
    return WILAYAH_COORDINATES_DICTIONARY[kotaKey];
  }

  // Partial substring matches
  for (const [key, coords] of Object.entries(WILAYAH_COORDINATES_DICTIONARY)) {
    if (kecKey && key.includes(kecKey)) return coords;
    if (kelKey && key.includes(kelKey)) return coords;
    if (kotaKey && key.includes(kotaKey)) return coords;
  }

  return null;
}

/**
 * Resolves accurate coordinates via Google Maps Geocoder API with fallback to Indonesia Dictionary.
 * Strictly respects the provided region (e.g. Penjaringan, Jakarta Utara -> -6.1264, 106.7885).
 */
export async function resolveAccurateCoordinates(params: {
  kelurahan?: string;
  kecamatan?: string;
  kota?: string;
  provinsi?: string;
  existingLat?: number;
  existingLng?: number;
}): Promise<LatLngResult> {
  const { kelurahan = '', kecamatan = '', kota = '', provinsi = '', existingLat, existingLng } = params;

  // Build specific query format: "{Kelurahan}, Kecamatan {Kecamatan}, {Kota/Kabupaten}, Indonesia"
  const parts: string[] = [];
  if (kelurahan.trim()) parts.push(kelurahan.trim());
  if (kecamatan.trim()) {
    const kecClean = kecamatan.trim().replace(/^kecamatan\s+/i, '');
    parts.push(`Kecamatan ${kecClean}`);
  }
  if (kota.trim()) parts.push(kota.trim());
  if (provinsi.trim() && !kota.toLowerCase().includes(provinsi.toLowerCase())) {
    parts.push(provinsi.trim());
  }
  parts.push('Indonesia');

  const formattedAddress = parts.join(', ');

  // 1. If existing valid coordinates are already specific and non-default (not 0, 0), and match region lookup:
  const smartMatch = lookupSmartCoordinates(kelurahan, kecamatan, kota);

  // Check if existing lat/lng was an erroneous static default (-6.2615) when user didn't want Jakarta Selatan
  const isErroneousJakselFallback =
    existingLat &&
    Math.abs(existingLat - -6.2615) < 0.0001 &&
    existingLng &&
    Math.abs(existingLng - 106.8106) < 0.0001 &&
    !kota.toLowerCase().includes('selatan') &&
    !kecamatan.toLowerCase().includes('cilandak');

  if (existingLat && existingLng && !isErroneousJakselFallback) {
    return {
      lat: existingLat,
      lng: existingLng,
      resolvedVia: 'smart_lookup',
      formattedAddress,
    };
  }

  // 2. Try Google Maps JavaScript Geocoder API if available in browser
  if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const response = await new Promise<any>((resolve, reject) => {
        geocoder.geocode(
          {
            address: formattedAddress,
            componentRestrictions: { country: 'ID' },
          },
          (results: any[], status: string) => {
            if (status === 'OK' && results && results.length > 0) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoder status: ${status}`));
            }
          }
        );
      });

      if (response?.geometry?.location) {
        const lat = typeof response.geometry.location.lat === 'function'
          ? response.geometry.location.lat()
          : response.geometry.location.lat;
        const lng = typeof response.geometry.location.lng === 'function'
          ? response.geometry.location.lng()
          : response.geometry.location.lng;

        return {
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          resolvedVia: 'google_geocoder',
          formattedAddress: response.formatted_address || formattedAddress,
        };
      }
    } catch (e) {
      // Graceful fallback to smart lookup dictionary
      console.warn('[Geocoding] Google Geocoder fallback triggered:', e);
    }
  }

  // 3. Fallback: Lookup in accurate dictionary
  if (smartMatch) {
    // Add micro jitter (0.001 - 0.003 deg ~ 100-300m) so multiple voters don't completely overlap on exact same pixel
    const jitterLat = (Math.random() - 0.5) * 0.003;
    const jitterLng = (Math.random() - 0.5) * 0.003;

    return {
      lat: Number((smartMatch.lat + jitterLat).toFixed(6)),
      lng: Number((smartMatch.lng + jitterLng).toFixed(6)),
      resolvedVia: 'smart_lookup',
      formattedAddress,
    };
  }

  // 4. Default to Monas Jakarta Pusat (Indonesia center) ONLY if no other match found, NEVER force Jakarta Selatan!
  const defaultIndo = { lat: -6.1754, lng: 106.8272 };
  return {
    lat: defaultIndo.lat,
    lng: defaultIndo.lng,
    resolvedVia: 'city_center',
    formattedAddress,
  };
}

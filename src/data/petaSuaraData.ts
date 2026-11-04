// Data Model & Persistence Peta Suara Terpadu (Zero Dummy Data)

export interface TpsPetaRecord {
  nomorTps: string;
  namaTps: string;
  lokasiAlamat: string;
  totalDpt: number;
  jumlahPendukung: number;
  persentasePenetrasi: number;
  sudahAdaPendukung: boolean;
  namaKoordinatorTps?: string;
  noHpKoordinator?: string;
  statusLogistik?: 'Siap' | 'Kurang' | 'Belum Terdistribusi';
}

export interface KelurahanPetaRecord {
  id: string;
  nama: string;
  kodePos?: string;
  totalTps: number;
  tpsSudahAdaPendukung: number;
  totalDpt: number;
  totalPendukung: number;
  persentasePenetrasi: number;
  sudahAdaPendukung: boolean;
  namaKorkel?: string;
  noHpKorkel?: string;
  lat?: number;
  lng?: number;
  tpsList: TpsPetaRecord[];
}

export interface KecamatanPetaRecord {
  id: string;
  nama: string;
  kabupatenKota: string;
  totalKelurahan: number;
  kelurahanSudahAdaPendukung: number;
  totalTps: number;
  tpsSudahAdaPendukung: number;
  totalDpt: number;
  totalPendukung: number;
  persentasePenetrasi: number;
  sudahAdaPendukung: boolean;
  namaKorcam?: string;
  noHpKorcam?: string;
  lat?: number;
  lng?: number;
  kelurahanList: KelurahanPetaRecord[];
}

export interface KabupatenPetaRecord {
  id: string;
  nama: string;
  dapil: string;
  totalKecamatan: number;
  kecamatanSudahAdaPendukung: number;
  totalKelurahan: number;
  kelurahanSudahAdaPendukung: number;
  totalTps: number;
  tpsSudahAdaPendukung: number;
  totalDpt: number;
  totalPendukung: number;
  persentasePenetrasi: number;
  sudahAdaPendukung: boolean;
  kecamatanList: KecamatanPetaRecord[];
}

// Model Pendaftaran Tim Sukses (Penugasan Wilayah & Koordinat)
export interface TimSuksesWilayahRecord {
  id: string;
  nama: string;
  noHp: string;
  kota: string;
  kecamatanList: string[]; // 1 atau lebih kecamatan yang dipegang
  kelurahanList: string[]; // 1 atau lebih kelurahan yang dipegang
  lat: number;
  lng: number;
  alamat?: string;
  jabatan?: string;
  waktuDaftar: string;
  status: 'Aktif' | 'Nonaktif';
}

// Marker Peta Dinamis untuk Google Maps
export interface PetaWilayahMarker {
  id: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  lat: number;
  lng: number;
  koordinatorNama: string; // Nama Tim Sukses atau "Belum ada koordinator"
  koordinatorHp?: string;
  koordinatorRole?: 'Tim Sukses' | 'Korcam' | 'Korkel' | 'Kader';
  totalVoters: number;
  voterTimSuksesCount: number; // Input oleh Tim Sukses
  voterKaderCount: number;      // Input oleh Kader
  voterListNiks: string[];
  recentVoters?: any[];
  terakhirUpdate?: string;
}

// ZERO DUMMY DATA: Seluruh array awal kosong ([]) sesuai instruksi user
export const INITIAL_PETA_SUARA_DATA: KabupatenPetaRecord[] = [];
export const INITIAL_TIM_SUKSES_LIST: TimSuksesWilayahRecord[] = [];
export const INITIAL_PETA_MARKERS: PetaWilayahMarker[] = [];

// Fallback koordinat kota di Indonesia untuk geocoding default jika offline
export const KOTA_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  'jakarta selatan': { lat: -6.2615, lng: 106.8106 },
  'jakarta pusat': { lat: -6.1818, lng: 106.8227 },
  'jakarta barat': { lat: -6.1683, lng: 106.7589 },
  'jakarta timur': { lat: -6.2250, lng: 106.9004 },
  'jakarta utara': { lat: -6.1384, lng: 106.8640 },
  'bandung': { lat: -6.9175, lng: 107.6191 },
  'surabaya': { lat: -7.2575, lng: 112.7521 },
  'semarang': { lat: -6.9667, lng: 110.4167 },
  'medan': { lat: 3.5952, lng: 98.6722 },
  'makassar': { lat: -5.1477, lng: 119.4327 },
  'yogyakarta': { lat: -7.7956, lng: 110.3695 },
  'denpasar': { lat: -8.6705, lng: 115.2126 },
  'default_indonesia': { lat: -6.2088, lng: 106.8456 }, // Jakarta Pusat Monas
};

// Fungsi utilitas untuk menormalkan teks wilayah
export function normalizeWilayahName(val?: string): string {
  if (!val) return '';
  return val
    .trim()
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.|kelurahan|kel\.|desa)\s+/i, '')
    .trim();
}

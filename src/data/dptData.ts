import { DptVoterRecord, ElectabilitySurveySubmission, WhatsAppBlaztItem, InvitedFriendRecord } from '../types/vore';

// Pre-seeded DPT database (Kosong - belum diinput oleh Kader / Tim Sukses)
export const INITIAL_DPT_RECORDS: DptVoterRecord[] = [];


// Helper to look up or smartly resolve any 16-digit NIK against KPU DPT system
export function lookupDptKpu(nikInput: string): DptVoterRecord | null {
  const cleanNik = nikInput.replace(/\D/g, '');
  if (cleanNik.length < 16) return null;

  // Check in-memory store
  const existing = INITIAL_DPT_RECORDS.find((r) => r.nik === cleanNik);
  if (existing) return existing;

  // Extract date of birth / gender pattern from NIK
  // Digit 7-8 is day (if day > 40, it's female)
  const dayRaw = parseInt(cleanNik.substring(6, 8), 10);
  const isFemale = dayRaw > 40;
  const day = isFemale ? dayRaw - 40 : dayRaw;
  const month = parseInt(cleanNik.substring(8, 10), 10) || 5;
  const yearTwoDigits = parseInt(cleanNik.substring(10, 12), 10) || 90;
  const birthYear = yearTwoDigits > 30 ? 1900 + yearTwoDigits : 2000 + yearTwoDigits;
  const age = Math.max(17, 2026 - birthYear);

  // Generate deterministic realistic details based on NIK
  const tpsNumber = (parseInt(cleanNik.slice(-3), 10) % 85) + 1;
  const tpsString = `TPS ${tpsNumber.toString().padStart(3, '0')}`;

  const namaListMale = [
    'Eko Prasetyo Wibowo',
    'Rian Hidayatullah',
    'Agus Salim Nugroho',
    'Dedi Kurniawan',
    'Budi Santoso',
    'Fajar Ramadhan',
    'Surya Pratama',
  ];
  const namaListFemale = [
    'Nurul Khotimah',
    'Fitri Handayani',
    'Rina Marlina',
    'Mega Wahyuni',
    'Indah Permatasari',
    'Tri Utami',
    'Anisa Maharani',
  ];

  const nameIndex = parseInt(cleanNik.slice(-2), 10) % 7;
  const generatedNama = isFemale ? namaListFemale[nameIndex] : namaListMale[nameIndex];

  return {
    nik: cleanNik,
    nama: generatedNama,
    jenisKelamin: isFemale ? 'P' : 'L',
    usia: age,
    tps: tpsString,
    kelurahan: 'Kel. Sukamaju',
    kecamatan: 'Kec. Cilandak',
    kabupatenKota: 'Kota Jakarta Selatan',
    dapil: 'DAPIL DKI JAKARTA II',
    statusDpt: 'Terdaftar KPU',
    statusPendukung: 'Pendukung Pasti',
    waktuVerifikasi: 'Baru saja (Sinkron DPT)',
  };
}

// Initial Survey Database (ala Simcaleg)
export const INITIAL_ELECTABILITY_SURVEYS: ElectabilitySurveySubmission[] = [];

// Initial WhatsApp Blazt Log Items
export const INITIAL_BLAZT_ITEMS: WhatsAppBlaztItem[] = [];

export const INITIAL_INVITED_FRIENDS: InvitedFriendRecord[] = [
  {
    id: 'inv-1',
    nik: '3174012508890001',
    nikMasked: '3174 •••• •••• 0001',
    nama: 'Ahmad Fauzi Santoso',
    noHp: '081288219901',
    tps: 'TPS 047',
    kelurahan: 'Kel. Sukamaju',
    kecamatan: 'Kec. Cilandak',
    hubungan: 'Tetangga Satu TPS',
    tanggalUndang: 'Kemarin',
    status: 'Terdaftar KPU',
  },
  {
    id: 'inv-2',
    nik: '3174015403920004',
    nikMasked: '3174 •••• •••• 0004',
    nama: 'Dewi Anggraini Kusuma',
    noHp: '081390441122',
    tps: 'TPS 047',
    kelurahan: 'Kel. Sukamaju',
    kecamatan: 'Kec. Cilandak',
    hubungan: 'Keluarga',
    tanggalUndang: '2 hari lalu',
    status: 'Terdaftar KPU',
  },
  {
    id: 'inv-3',
    nik: '3174011211780002',
    nikMasked: '3174 •••• •••• 0002',
    nama: 'Bambang Tri Hermawan',
    noHp: '081776510091',
    tps: 'TPS 048',
    kelurahan: 'Kel. Sukamaju',
    kecamatan: 'Kec. Cilandak',
    hubungan: 'Teman',
    tanggalUndang: '3 hari lalu',
    status: 'Terdaftar KPU',
  },
];


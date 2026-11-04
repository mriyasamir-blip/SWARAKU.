import { UserAccount, VoterOcrRecord, QuickCountOcrItem } from '../types/vore';

export const PRESET_ACCOUNTS: UserAccount[] = [
  {
    id: 'acc-superadmin',
    role: 'super_admin',
    nama: 'Super Admin Utama',
    username: 'superadmin',
    email: 'superadmin@swaraku.com',
    jabatan: 'Super Admin · Pusat Komando & Manajemen Role',
    wilayah: 'Pusat Komando Nasional',
    noHp: '081100112233',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    status: 'Aktif',
    dibuatPada: 'Akun Bawaan Sistem',
  },
  {
    id: 'acc-admin',
    role: 'admin',
    nama: 'Administrator (Admin)',
    username: 'admin',
    email: 'admin@swaraku.com',
    jabatan: 'Admin · Operasional 7 Modul',
    wilayah: 'Pusat Operasional Wilayah',
    noHp: '081122334455',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    status: 'Aktif',
    dibuatPada: 'Akun Bawaan Sistem',
  },
  {
    id: 'acc-timsukses',
    role: 'tim_sukses',
    nama: 'Bambang Haryanto, S.IP',
    username: 'timsukses',
    email: 'timsukses@swaraku.com',
    jabatan: 'Direktur Bappilu & Tim Sukses Pemenangan',
    wilayah: 'DAPIL DKI JAKARTA II',
    noHp: '081299887766',
    fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    status: 'Aktif',
    dibuatPada: 'Akun Bawaan Sistem',
  },
  {
    id: 'acc-kader',
    role: 'kader',
    nama: 'Ahmad Rizky',
    username: 'kader',
    email: 'kader@swaraku.com',
    jabatan: 'Relawan Kel. Sukamaju • TPS 047',
    wilayah: 'Kel. Sukamaju, Kec. Cilandak',
    tps: 'TPS 047',
    noHp: '081344556677',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    status: 'Aktif',
    dibuatPada: 'Akun Bawaan Sistem',
  },
];

export const INITIAL_VOTER_OCR_RECORDS: VoterOcrRecord[] = [];

export const INITIAL_QUICK_COUNT_OCR: QuickCountOcrItem = {
  id: 'qc-ocr-001',
  tps: 'TPS 047',
  kelurahan: 'Kel. Sukamaju',
  kecamatan: 'Kec. Cilandak',
  saksiNama: 'Ahmad Rizky',
  paslon1Suara: 0,
  paslon2Suara: 0,
  paslon3Suara: 0,
  totalSuaraSah: 0,
  akurasiOcrPersen: 0,
  status: 'PENDING',
  waktuVerifikasi: 'Menunggu Form C1 Masuk',
};

// Summary Slide 11: Laporan Voter Terdaftar per TPS
export const LAPORAN_VOTER_PER_TPS = [
  { wilayah: 'TPS 001 Sukamaju', target: 300, terdaftar: 0, dptValid: 0, capaian: '0%' },
  { wilayah: 'TPS 002 Sukamaju', target: 280, terdaftar: 0, dptValid: 0, capaian: '0%' },
  { wilayah: 'TOTAL DAPIL 2', target: 580, terdaftar: 0, dptValid: 0, capaian: '0%' },
];

// Summary Slide 12: Hasil Quick Count & Pemetaan Paslon
export const HASIL_QUICK_COUNT_PEMETAAN = [
  { paslon: 'Paslon Utama (01)', suara: 0, persentase: '0%', isUtama: true },
  { paslon: 'Competitor A (02)', suara: 0, persentase: '0%', isUtama: false },
  { paslon: 'Competitor B (03)', suara: 0, persentase: '0%', isUtama: false },
];

// Summary Slide 13: Rincian OCR Caleg & Paslon Lain
export const RINCIAN_OCR_CALEG_PASLON = [
  { nama: 'Paslon Utama', partaiNo: 'Partai X / 1', suara: 0, status: 'Menunggu C1' },
  { nama: 'Caleg A Kompetitor', partaiNo: 'Partai Y / 1', suara: 0, status: 'Menunggu C1' },
  { nama: 'Caleg B Kompetitor', partaiNo: 'Partai Y / 2', suara: 0, status: 'Menunggu C1' },
  { nama: 'Caleg C Kompetitor', partaiNo: 'Partai Z / 1', suara: 0, status: 'Menunggu C1' },
];

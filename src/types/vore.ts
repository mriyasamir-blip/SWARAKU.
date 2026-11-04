export type AppRole = 'voter' | 'canvasser' | 'admin' | 'concept' | 'database_voters';

export type DeviceOS = 'android' | 'ios' | 'desktop' | 'responsive';

export type ActiveMobileTab = 'beranda' | 'aspirasi' | 'peta_suara' | 'misi' | 'tps' | 'profil';

export type AspirasiCategory = 'Pendidikan' | 'Kesehatan' | 'Lapangan Kerja' | 'Lingkungan' | 'Infrastruktur';

export type AspirasiStatus = 'Masuk' | 'Diproses' | 'Selesai';

export interface AspirasiItem {
  id: string;
  kategori: AspirasiCategory;
  judul: string;
  deskripsi: string;
  lokasi: string;
  lampiranUrl?: string;
  tanggal: string;
  status: AspirasiStatus;
  upvotes: number;
  tanggapanResmi?: {
    oleh: string;
    jabatan: string;
    waktu: string;
    pesan: string;
    progresPersen: number;
  };
}

export interface MissionItem {
  id: string;
  tipe: 'harian' | 'mingguan';
  judul: string;
  deskripsi: string;
  poin: number;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  resetInfo: string;
  actionType: 'share' | 'read' | 'survey' | 'discuss' | 'checkin';
}

export interface RewardItem {
  id: string;
  nama: string;
  kategori: 'voucher_umkm' | 'pulsa' | 'sembako' | 'merchandise';
  poin: number;
  gambar: string;
  stok: number;
  deskripsi: string;
  mitra: string;
}

export interface VoterProfile {
  nama: string;
  username: string;
  nikMasked: string;
  noHpMasked: string;
  dapil: string;
  tps: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  poinSuara: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  poinNextTier: number;
  tierMaxPoin: number;
  totalRujukan: number;
  aktifBulanIni: number;
  bergabungMingguIni: number;
  sudahMencoblos: boolean;
  waktuMencoblos?: string;
  buktiCoblosUrl?: string;
  lencana: { id: string; nama: string; icon: string; deskripsi: string }[];
  referralCode: string;
}

export interface FormC1Upload {
  id: string;
  tps: string;
  kelurahan: string;
  kecamatan: string;
  waktuUpload: string;
  saksiNama: string;
  suaraPaslon1: number;
  suaraPaslon2: number;
  suaraPaslon3: number;
  suaraTidakSah: number;
  totalSuaraSah: number;
  statusVerifikasi: 'Terverifikasi' | 'Menunggu Audit' | 'Perlu Klarifikasi';
  fotoC1Url?: string;
  fileName?: string;
}

export interface FormB1Upload {
  id: string;
  kecamatan: string;
  kelurahan: string;
  dapil: string;
  waktuUpload: string;
  koordinatorNama: string;
  suaraPaslon1: number;
  suaraPaslon2: number;
  suaraPaslon3: number;
  suaraTidakSah: number;
  totalSuaraSah: number;
  totalTpsTercakup: number;
  statusVerifikasi: 'Terverifikasi' | 'Menunggu Audit' | 'Perlu Klarifikasi';
  fotoB1Url?: string;
  fileName?: string;
}

export interface NewsItem {
  id: string;
  kategori: string;
  judul: string;
  ringkasan: string;
  waktu: string;
  gambarUrl?: string;
  penulis: string;
}

export interface DptVoterRecord {
  nik: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  usia: number;
  tps: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  dapil: string;
  statusDpt: 'Terdaftar KPU' | 'Belum Terdaftar';
  noHp?: string;
  statusPendukung: 'Pendukung Pasti' | 'Swing Voter' | 'Belum Diverifikasi';
  waktuVerifikasi?: string;
}

export interface ElectabilitySurveySubmission {
  id: string;
  voterNama: string;
  voterNikMasked: string;
  tps: string;
  kelurahan: string;
  pilihanKandidat: 'Paslon 01 (Kandidat Utama)' | 'Paslon 02' | 'Paslon 03' | 'Belum Menentukan';
  alasanMemilih: string;
  tingkatKemantapan: 'Sangat Mantap' | 'Cukup Mantap' | 'Masih Ragu / Bisa Berubah';
  isuPrioritas: string;
  waktu: string;
  isOffline: boolean;
  statusSinkron: 'Tersinkron' | 'Tersimpan Offline';
}

export interface WhatsAppBlaztItem {
  id: string;
  namaPenerima: string;
  noHp: string;
  tps: string;
  kelurahan: string;
  pesanPreview: string;
  status: 'Terkirim' | 'Gagal' | 'Pending' | 'Dibaca';
  waktu: string;
}

export interface InvitedFriendRecord {
  id: string;
  nik: string;
  nikMasked: string;
  nama: string;
  noHp?: string;
  tps: string;
  kelurahan: string;
  kecamatan?: string;
  hubungan: 'Teman' | 'Keluarga' | 'Tetangga Satu TPS' | 'Rekan Kerja' | 'Lainnya';
  tanggalUndang: string;
  status: 'Terkirim' | 'Terdaftar KPU' | 'Menunggu Konfirmasi';
}

export type UserRole = 'super_admin' | 'admin' | 'tim_sukses' | 'kader';

export type AdminModuleTab =
  | 'beranda'
  | 'aspirasi'
  | 'peta_suara'
  | 'tps'
  | 'database_voters'
  | 'command_center'
  | 'operasi_lapangan'
  | 'manajemen_user';

export interface UserAccount {
  id: string;
  role: UserRole;
  nama: string;
  username: string;
  email: string;
  jabatan: string;
  wilayah: string;
  tps?: string;
  noHp?: string;
  fotoUrl?: string;
  password?: string;
  status?: 'Aktif' | 'Nonaktif';
  dibuatPada?: string;
}

export interface VoterOcrRecord {
  id: string;
  nik: string;
  nikMasked: string;
  nama: string;
  tempatTglLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  alamat: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  tps: string;
  noHp: string;
  waktuDaftar: string;
  fotoKtpUrl?: string;
  statusDpt: 'DPT valid' | 'Perlu cek';
  statusRegistrasi: 'TERDAFTAR';
  terdaftarOleh: string;
  diinputOlehRole?: 'tim_sukses' | 'kader' | 'admin';
  diinputOlehNama?: string;
  lat?: number;
  lng?: number;
}

export interface QuickCountOcrItem {
  id: string;
  tps: string;
  kelurahan: string;
  kecamatan: string;
  saksiNama: string;
  fotoFormUrl?: string;
  paslon1Suara: number;
  paslon2Suara: number;
  paslon3Suara: number;
  totalSuaraSah: number;
  akurasiOcrPersen: number;
  status: 'VERIFIED' | 'PENDING' | 'EDITED';
  waktuVerifikasi: string;
}


import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

// 1. Table users (Kader / Koordinator / Saksi)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  nama: text('nama'),
  role: text('role').default('kader'),
  tps: text('tps').default('TPS 047'),
  kelurahan: text('kelurahan').default('Kel. Sukamaju'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Table voters (Data Pemilih dari OCR Fisik e-KTP)
export const voters = pgTable('voters', {
  id: serial('id').primaryKey(),
  nik: text('nik').notNull().unique(),
  nikMasked: text('nik_masked').notNull(),
  nama: text('nama').notNull(),
  tempatTglLahir: text('tempat_tgl_lahir'),
  jenisKelamin: text('jenis_kelamin').default('Laki-laki'),
  alamat: text('alamat'),
  rtRw: text('rt_rw'),
  kelurahan: text('kelurahan').default('Kel. Sukamaju'),
  kecamatan: text('kecamatan').default('Kec. Cilandak'),
  kabupatenKota: text('kabupaten_kota').default('Jakarta Selatan'),
  provinsi: text('provinsi').default('DKI Jakarta'),
  tps: text('tps').notNull().default('TPS 047'),
  noHp: text('no_hp'),
  fotoKtpUrl: text('foto_ktp_url'),
  statusDpt: text('status_dpt').default('DPT valid'),
  statusRegistrasi: text('status_registrasi').default('TERDAFTAR'),
  terdaftarOleh: text('terdaftar_oleh'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Table aspirasi (Aspirasi Warga Lapangan)
export const aspirasi = pgTable('aspirasi', {
  id: serial('id').primaryKey(),
  kategori: text('kategori').notNull(),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi').notNull(),
  lokasi: text('lokasi').notNull(),
  tps: text('tps').default('TPS 047'),
  namaWarga: text('nama_warga').notNull(),
  status: text('status').notNull().default('Diterima'),
  poinApresiasi: integer('poin_apresiasi').default(50),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Table quick_count_tps (Tabulasi C1 Plano TPS)
export const quickCountTps = pgTable('quick_count_tps', {
  id: serial('id').primaryKey(),
  tps: text('tps').notNull(),
  kelurahan: text('kelurahan').notNull().default('Kel. Sukamaju'),
  kecamatan: text('kecamatan').notNull().default('Kec. Cilandak'),
  saksiNama: text('saksi_nama').notNull(),
  suaraPaslon01: integer('suara_paslon_01').default(0),
  suaraPaslon02: integer('suara_paslon_02').default(0),
  suaraPaslon03: integer('suara_paslon_03').default(0),
  suaraSah: integer('suara_sah').default(0),
  suaraTidakSah: integer('suara_tidak_sah').default(0),
  fotoC1Url: text('foto_c1_url'),
  status: text('status').default('Diverifikasi Saksi'),
  createdAt: timestamp('created_at').defaultNow(),
});

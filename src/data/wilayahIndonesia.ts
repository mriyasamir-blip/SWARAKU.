export interface WilayahKelurahan {
  nama: string;
  lat?: number;
  lng?: number;
}

export interface WilayahKecamatan {
  nama: string;
  kelurahan: string[];
}

export interface WilayahKota {
  nama: string;
  provinsi: string;
  kecamatan: WilayahKecamatan[];
}

export const WILAYAH_INDONESIA: WilayahKota[] = [
  {
    nama: 'Jakarta Selatan',
    provinsi: 'DKI Jakarta',
    kecamatan: [
      {
        nama: 'Cilandak',
        kelurahan: ['Cilandak Barat', 'Cipete Selatan', 'Gandaria Selatan', 'Lebak Bulus', 'Pondok Labu'],
      },
      {
        nama: 'Kebayoran Baru',
        kelurahan: ['Cipete Utara', 'Gandaria Utara', 'Gunung', 'Kramat Pela', 'Melawai', 'Petogogan', 'Pulo', 'Rawa Barat', 'Selong', 'Senayan'],
      },
      {
        nama: 'Kebayoran Lama',
        kelurahan: ['Cipulir', 'Grogol Selatan', 'Grogol Utara', 'Kebayoran Lama Selatan', 'Kebayoran Lama Utara', 'Pondok Pinang'],
      },
      {
        nama: 'Jagakarsa',
        kelurahan: ['Ciganjur', 'Cipedak', 'Jagakarsa', 'Lenteng Agung', 'Srengseng Sawah', 'Tanjung Barat'],
      },
      {
        nama: 'Pasar Minggu',
        kelurahan: ['Cilandak Timur', 'Jati Padang', 'Kebagusan', 'Pasar Minggu', 'Pejaten Barat', 'Pejaten Timur', 'Ragunan'],
      },
      {
        nama: 'Mampang Prapatan',
        kelurahan: ['Bangka', 'Kuningan Barat', 'Mampang Prapatan', 'Pela Mampang', 'Tegal Parang'],
      },
      {
        nama: 'Pancoran',
        kelurahan: ['Cikoko', 'Duren Tiga', 'Kalibata', 'Pancoran', 'Pengadegan', 'Rawajati'],
      },
      {
        nama: 'Pesanggrahan',
        kelurahan: ['Bintaro', 'Pesanggrahan', 'Petukangan Selatan', 'Petukangan Utara', 'Ulujami'],
      },
      {
        nama: 'Setiabudi',
        kelurahan: ['Guntur', 'Karet', 'Karet Kuningan', 'Karet Semanggi', 'Kuningan Timur', 'Menteng Atas', 'Pasar Manggis', 'Setiabudi'],
      },
      {
        nama: 'Tebet',
        kelurahan: ['Bukit Duri', 'Kebon Baru', 'Manggarai', 'Manggarai Selatan', 'Menteng Dalam', 'Tebet Barat', 'Tebet Timur'],
      },
    ],
  },
  {
    nama: 'Jakarta Pusat',
    provinsi: 'DKI Jakarta',
    kecamatan: [
      {
        nama: 'Gambir',
        kelurahan: ['Cideng', 'Duri Pulo', 'Gambir', 'Kebon Kelapa', 'Petojo Selatan', 'Petojo Utara'],
      },
      {
        nama: 'Menteng',
        kelurahan: ['Cikini', 'Gondangdia', 'Kebon Sirih', 'Menteng', 'Pegangsaan'],
      },
      {
        nama: 'Tanah Abang',
        kelurahan: ['Bendungan Hilir', 'Gelora', 'Kampung Bali', 'Karet Tengsin', 'Kebon Kacang', 'Kebon Melati', 'Petamburan'],
      },
      {
        nama: 'Cempaka Putih',
        kelurahan: ['Cempaka Putih Barat', 'Cempaka Putih Timur', 'Rawasari'],
      },
      {
        nama: 'Johar Baru',
        kelurahan: ['Galur', 'Johar Baru', 'Kampung Rawa', 'Tanah Tinggi'],
      },
      {
        nama: 'Kemayoran',
        kelurahan: ['Cempaka Baru', 'Gunung Sahari Selatan', 'Harapan Mulya', 'Kebon Kosong', 'Kemayoran', 'Serdang', 'Sumur Batu', 'Utan Panjang'],
      },
      {
        nama: 'Sawah Besar',
        kelurahan: ['Gunung Sahari Utara', 'Karang Anyar', 'Kartini', 'Mangga Dua Selatan', 'Pasar Baru'],
      },
      {
        nama: 'Senen',
        kelurahan: ['Bungur', 'Kenari', 'Kramat', 'Kwitang', 'Paseban', 'Senen'],
      },
    ],
  },
  {
    nama: 'Jakarta Utara',
    provinsi: 'DKI Jakarta',
    kecamatan: [
      {
        nama: 'Penjaringan',
        kelurahan: ['Kamal Muara', 'Kapuk Muara', 'Pejagalan', 'Penjaringan', 'Pluit'],
      },
      {
        nama: 'Kelapa Gading',
        kelurahan: ['Kelapa Gading Barat', 'Kelapa Gading Timur', 'Pegangsaan Dua'],
      },
      {
        nama: 'Tanjung Priok',
        kelurahan: ['Kebon Bawang', 'Papanggo', 'Sungai Bambu', 'Sunter Agung', 'Sunter Jaya', 'Tanjung Priok', 'Warakas'],
      },
      {
        nama: 'Koja',
        kelurahan: ['Koja', 'Lagoa', 'Rawa Badak Selatan', 'Rawa Badak Utara', 'Tugu Selatan', 'Tugu Utara'],
      },
      {
        nama: 'Cilincing',
        kelurahan: ['Cilincing', 'Kalibaru', 'Marunda', 'Rorotan', 'Semper Barat', 'Semper Timur', 'Sukapura'],
      },
      {
        nama: 'Pademangan',
        kelurahan: ['Ancol', 'Pademangan Barat', 'Pademangan Timur'],
      },
    ],
  },
  {
    nama: 'Jakarta Barat',
    provinsi: 'DKI Jakarta',
    kecamatan: [
      {
        nama: 'Cengkareng',
        kelurahan: ['Cengkareng Barat', 'Cengkareng Timur', 'Duri Kosambi', 'Kapuk', 'Kedaung Kali Angke', 'Rawa Buaya'],
      },
      {
        nama: 'Grogol Petamburan',
        kelurahan: ['Grogol', 'Jelambar', 'Jelambar Baru', 'Tanjung Duren Selatan', 'Tanjung Duren Utara', 'Tomang', 'Wijaya Kusuma'],
      },
      {
        nama: 'Kalideres',
        kelurahan: ['Kalideres', 'Kamal', 'Pegadungan', 'Semanan', 'Tegal Alur'],
      },
      {
        nama: 'Kebon Jeruk',
        kelurahan: ['Duri Kepa', 'Kebon Jeruk', 'Kedoya Selatan', 'Kedoya Utara', 'Kelapa Dua', 'Sukabumi Selatan', 'Sukabumi Utara'],
      },
      {
        nama: 'Kembangan',
        kelurahan: ['Joglo', 'Kembangan Selatan', 'Kembangan Utara', 'Meruya Selatan', 'Meruya Utara', 'Srengseng'],
      },
      {
        nama: 'Palmerah',
        kelurahan: ['Jatipulo', 'Kemanggisan', 'Kota Bambu Selatan', 'Kota Bambu Utara', 'Palmerah', 'Slipi'],
      },
      {
        nama: 'Taman Sari',
        kelurahan: ['Glodok', 'Keagungan', 'Krukut', 'Mangga Besar', 'Maphar', 'Pinangsia', 'Taman Sari', 'Tangki'],
      },
      {
        nama: 'Tambora',
        kelurahan: ['Angke', 'Duri Selatan', 'Duri Utara', 'Jembatan Besi', 'Jembatan Lima', 'Kali Anyar', 'Krendang', 'Pekojan', 'Roa Malaka', 'Tambora', 'Tanah Sereal'],
      },
    ],
  },
  {
    nama: 'Jakarta Timur',
    provinsi: 'DKI Jakarta',
    kecamatan: [
      {
        nama: 'Cakung',
        kelurahan: ['Cakung Barat', 'Cakung Timur', 'Jatinegara', 'Penggilingan', 'Pulo Gebang', 'Rawa Terate', 'Ujung Menteng'],
      },
      {
        nama: 'Cipayung',
        kelurahan: ['Bambu Apus', 'Ceger', 'Cilangkap', 'Cipayung', 'Lubang Buaya', 'Munjul', 'Pondok Ranggon', 'Setu'],
      },
      {
        nama: 'Ciracas',
        kelurahan: ['Cibubur', 'Ciracas', 'Kelapa Dua Wetan', 'Rambutan', 'Susukan'],
      },
      {
        nama: 'Duren Sawit',
        kelurahan: ['Duren Sawit', 'Klender', 'Malaka Jaya', 'Malaka Sari', 'Pondok Bambu', 'Pondok Kelapa', 'Pondok Kopi'],
      },
      {
        nama: 'Jatinegara',
        kelurahan: ['Bali Mester', 'Bidara Cina', 'Cipinang Besar Selatan', 'Cipinang Besar Utara', 'Cipinang Cempedak', 'Cipinang Muara', 'Kampung Melayu', 'Rawa Bunga'],
      },
      {
        nama: 'Kramat Jati',
        kelurahan: ['Balekambang', 'Batu Ampar', 'Cawang', 'Cililitan', 'Dukuh', 'Kramat Jati', 'Tengah'],
      },
      {
        nama: 'Makasar',
        kelurahan: ['Cipinang Melayu', 'Halim Perdanakusuma', 'Kebon Pala', 'Makasar', 'Pinang Ranti'],
      },
      {
        nama: 'Matraman',
        kelurahan: ['Kayu Manis', 'Kebon Manggis', 'Pal Meriam', 'Pisangan Baru', 'Utan Kayu Selatan', 'Utan Kayu Utara'],
      },
      {
        nama: 'Pasar Rebo',
        kelurahan: ['Baru', 'Cijantung', 'Gedong', 'Kalisari', 'Pekayon'],
      },
      {
        nama: 'Pulo Gadung',
        kelurahan: ['Cipinang', 'Jati', 'Jatinegara Kaum', 'Kayu Putih', 'Pisangan Timur', 'Pulo Gadung', 'Rawamangun'],
      },
    ],
  },
  {
    nama: 'Kota Depok',
    provinsi: 'Jawa Barat',
    kecamatan: [
      { nama: 'Beji', kelurahan: ['Beji', 'Beji Timur', 'Kemiri Muka', 'Kukusan', 'Pondok Cina', 'Tanah Baru'] },
      { nama: 'Sukmajaya', kelurahan: ['Abadijaya', 'Baktijaya', 'Cisalak', 'Mekarjaya', 'Sukmajaya', 'Tirtajaya'] },
      { nama: 'Pancoran Mas', kelurahan: ['Depok', 'Depok Jaya', 'Mampang', 'Pancoran Mas', 'Rangkapan Jaya', 'Rangkapan Jaya Baru'] },
      { nama: 'Cinere', kelurahan: ['Cinere', 'Gandul', 'Pangkalan Jati', 'Pangkalan Jati Baru'] },
      { nama: 'Cimanggis', kelurahan: ['Cisalak Pasar', 'Curug', 'Harjamukti', 'Mekarsari', 'Pasir Gunung Selatan', 'Tugu'] },
      { nama: 'Sawangan', kelurahan: ['Bedahan', 'Cinangka', 'Kedaung', 'Pasir Putih', 'Pengasinan', 'Sawangan', 'Sawangan Baru'] },
    ],
  },
  {
    nama: 'Kota Bekasi',
    provinsi: 'Jawa Barat',
    kecamatan: [
      { nama: 'Bekasi Barat', kelurahan: ['Bintara', 'Bintara Jaya', 'Jakasampurna', 'Kota Baru', 'Kranji'] },
      { nama: 'Bekasi Selatan', kelurahan: ['Jakamulya', 'Jakasetia', 'Kayuringin Jaya', 'Marga Jaya', 'Pekayon Jaya'] },
      { nama: 'Bekasi Timur', kelurahan: ['Aren Jaya', 'Bekasi Jaya', 'Duren Jaya', 'Margahayu'] },
      { nama: 'Bekasi Utara', kelurahan: ['Harapan Baru', 'Harapan Jaya', 'Kaliabang Tengah', 'Marga Mulya', 'Perwira', 'Teluk Pucung'] },
      { nama: 'Jatiasih', kelurahan: ['Jatiasih', 'Jatikramat', 'Jatiluhur', 'Jatimekar', 'Jatirasa', 'Jatisari'] },
      { nama: 'Pondok Gede', kelurahan: ['Jatibening', 'Jatibening Baru', 'Jaticempaka', 'Jatimakmur', 'Jatiwaringin'] },
    ],
  },
  {
    nama: 'Kota Tangerang',
    provinsi: 'Banten',
    kecamatan: [
      { nama: 'Ciledug', kelurahan: ['Paninggilan', 'Paninggilan Utara', 'Parung Serab', 'Sudimara Barat', 'Sudimara Jaya', 'Sudimara Selatan', 'Sudimara Timur', 'Tajur'] },
      { nama: 'Cipondoh', kelurahan: ['Cipondoh', 'Cipondoh Indah', 'Cipondoh Makmur', 'Gondrong', 'Kenanga', 'Ketapang', 'Petir', 'Poris Plawad'] },
      { nama: 'Karawaci', kelurahan: ['Bojong Jaya', 'Bugel', 'Cimone', 'Cimone Jaya', 'Gerendeng', 'Karawaci', 'Karawaci Baru', 'Koang Jaya', 'Nusa Jaya', 'Sukajadi'] },
      { nama: 'Tangerang', kelurahan: ['Babakan', 'Buaran Indah', 'Cikokol', 'Kelapa Indah', 'Sukaasih', 'Sukarasa', 'Sukasari', 'Tanah Tinggi'] },
    ],
  },
  {
    nama: 'Kota Tangerang Selatan',
    provinsi: 'Banten',
    kecamatan: [
      { nama: 'Ciputat', kelurahan: ['Cipayung', 'Ciputat', 'Jombang', 'Sawah', 'Sawah Baru', 'Serua', 'Serua Indah'] },
      { nama: 'Ciputat Timur', kelurahan: ['Cempaka Putih', 'Cireundeu', 'Pisangan', 'Pondok Ranji', 'Rempoa', 'Rengas'] },
      { nama: 'Pamulang', kelurahan: ['Bambu Apus', 'Benda Baru', 'Kedaung', 'Pamulang Barat', 'Pamulang Timur', 'Pondok Benda', 'Pondok Cabe Ilir', 'Pondok Cabe Udik'] },
      { nama: 'Pondok Aren', kelurahan: ['Jurangmangu Barat', 'Jurangmangu Timur', 'Parigi', 'Parigi Baru', 'Pondok Aren', 'Pondok Betung', 'Pondok Jaya', 'Pondok Kacang Barat', 'Pondok Kacang Timur', 'Pondok Karya', 'Pondok Pucung'] },
      { nama: 'Serpong', kelurahan: ['Buaran', 'Ciater', 'Cilenggang', 'Lengkong Gudang', 'Lengkong Gudang Timur', 'Lengkong Wetan', 'Rawa Buntu', 'Rawa Mekar Jaya', 'Serpong'] },
    ],
  },
  {
    nama: 'Kota Bogor',
    provinsi: 'Jawa Barat',
    kecamatan: [
      { nama: 'Bogor Tengah', kelurahan: ['Babakan', 'Babakan Pasar', 'Cibogor', 'Ciwaringin', 'Gudang', 'Kebon Kalapa', 'Pabaton', 'Paledang', 'Panjajar', 'Sempur', 'Tegallega'] },
      { nama: 'Bogor Barat', kelurahan: ['Balumbang Jaya', 'Bubulak', 'Cilendek Barat', 'Cilendek Timur', 'Curug', 'Curug Mekar', 'Gunung Batu', 'Loji', 'Margajaya', 'Menteng', 'Pasir Jaya', 'Pasir Kuda', 'Pasir Mulya', 'Semplak', 'Sindangbarang', 'Situgede'] },
      { nama: 'Bogor Selatan', kelurahan: ['Batutulis', 'Bojongkerta', 'Bondongan', 'Cikaret', 'Cipaku', 'Empang', 'Genteng', 'Harjasari', 'Kertamaya', 'Lawanggintung', 'Muarasari', 'Mulyaharja', 'Pakuan', 'Pamoyanan', 'Rancamaya', 'Ranggamekar'] },
      { nama: 'Bogor Timur', kelurahan: ['Baranangsiang', 'Katulampa', 'Sindangrasa', 'Sindangsari', 'Sukasari', 'Tajur'] },
      { nama: 'Bogor Utara', kelurahan: ['Bantarjati', 'Cibuluh', 'Ciluar', 'Cimahpar', 'Ciparigi', 'Kedunghalang', 'Tanah Baru', 'Tegal Gundil'] },
      { nama: 'Tanah Sareal', kelurahan: ['Cibadak', 'Kayumanis', 'Kebon Pedes', 'Kedung Badak', 'Kedung Jaya', 'Kedung Waringin', 'Kencana', 'Mekarwangi', 'Sukadamai', 'Sukaresmi', 'Tanah Sareal'] },
    ],
  },
  {
    nama: 'Kota Bandung',
    provinsi: 'Jawa Barat',
    kecamatan: [
      { nama: 'Bandung Wetan', kelurahan: ['Cihapit', 'Citarum', 'Tamansari'] },
      { nama: 'Coblong', kelurahan: ['Cipaganti', 'Dago', 'Lebak Gede', 'Lebak Siliwangi', 'Sadang Serang', 'Sekeloa'] },
      { nama: 'Cicendo', kelurahan: ['Arjuna', 'Husen Sastranegara', 'Pajajaran', 'Pamoyanan', 'Pasirkaliki', 'Sukaraja'] },
      { nama: 'Sukajadi', kelurahan: ['Cipedes', 'Pasteur', 'Sukabungah', 'Sukagalih', 'Sukawarna'] },
      { nama: 'Buahbatu', kelurahan: ['Cijaura', 'Jatisari', 'Margasari', 'Sekejati'] },
      { nama: 'Antapani', kelurahan: ['Antapani Kidul', 'Antapani Kulon', 'Antapani Tengah', 'Antapani Wetan'] },
    ],
  },
  {
    nama: 'Kota Surabaya',
    provinsi: 'Jawa Timur',
    kecamatan: [
      { nama: 'Gubeng', kelurahan: ['Airlangga', 'Baratajaya', 'Gubeng', 'Kertajaya', 'Mojo', 'Pucang Sewu'] },
      { nama: 'Tegalsari', kelurahan: ['Dr. Sutomo', 'Kedungdoro', 'Keputran', 'Tegalsari', 'Wonorejo'] },
      { nama: 'Wonokromo', kelurahan: ['Darmo', 'Jagir', 'Ngagel', 'Ngagelrejo', 'Sawunggaling', 'Wonokromo'] },
      { nama: 'Rungkut', kelurahan: ['Kali Rungkut', 'Kedung Baruk', 'Medokan Ayu', 'Penjaringan Sari', 'Rungkut Kidul', 'Wonorejo'] },
      { nama: 'Sukolilo', kelurahan: ['Gebang Putih', 'Keputih', 'Klampis Ngasem', 'Medokan Semampir', 'Menur Pumpungan', 'Nginden Jangkungan', 'Semolowaru'] },
    ],
  },
  {
    nama: 'Kota Semarang',
    provinsi: 'Jawa Tengah',
    kecamatan: [
      { nama: 'Semarang Tengah', kelurahan: ['Bangunharjo', 'Brumbungan', 'Gabahan', 'Jagalan', 'Karangkidul', 'Kauman', 'Kembangsari', 'Kranggan', 'Miroto', 'Pandansari', 'Pekunden', 'Pendrikan Kidul', 'Pendrikan Lor', 'Purwodinatan', 'Sekayu'] },
      { nama: 'Tembalang', kelurahan: ['Bulusan', 'Jangli', 'Kedungmundu', 'Kramas', 'Mangunharjo', 'Meteseh', 'Rowosari', 'Sambiroto', 'Sendangguwo', 'Sendangmulyo', 'Tandang', 'Tembalang'] },
      { nama: 'Banyumanik', kelurahan: ['Banyumanik', 'Gedawang', 'Jabungan', 'Ngesrep', 'Padangsari', 'Pedalangan', 'Pudakpayung', 'Srondol Kulon', 'Srondol Wetan', 'Sumurboto', 'Tinjomoyo'] },
    ],
  },
  {
    nama: 'Kota Yogyakarta',
    provinsi: 'DI Yogyakarta',
    kecamatan: [
      { nama: 'Gondokusuman', kelurahan: ['Baciro', 'Demangan', 'Klitren', 'Kotabaru', 'Terban'] },
      { nama: 'Jetis', kelurahan: ['Bumijo', 'Cokrodiningratan', 'Gowongan'] },
      { nama: 'Umbulharjo', kelurahan: ['Giwangan', 'Muja Muju', 'Pandeyan', 'Semaki', 'Sorosutan', 'Tahunan', 'Warungboto'] },
    ],
  },
  {
    nama: 'Kota Medan',
    provinsi: 'Sumatera Utara',
    kecamatan: [
      { nama: 'Medan Baru', kelurahan: ['Babura', 'Darat', 'Merdeka', 'Padang Bulan', 'Petisah Hulu', 'Titi Rantai'] },
      { nama: 'Medan Petisah', kelurahan: ['Petisah Tengah', 'Sei Putih Barat', 'Sei Putih Tengah', 'Sei Putih Timur I', 'Sei Putih Timur II', 'Sei Sikambing D', 'Sekip'] },
      { nama: 'Medan Johor', kelurahan: ['Gedung Johor', 'Kedai Durian', 'Kwala Bekala', 'Pangkalan Masyhur', 'Suka Maju', 'Titi Kuning'] },
    ],
  },
  {
    nama: 'Kota Makassar',
    provinsi: 'Sulawesi Selatan',
    kecamatan: [
      { nama: 'Panakkukang', kelurahan: ['Karampuang', 'Karuwisi', 'Karuwisi Utara', 'Masale', 'Panaikang', 'Pampang', 'Pandang', 'Paropo', 'Sinrijala', 'Tamamaung', 'Tello Baru'] },
      { nama: 'Rappocini', kelurahan: ['Balla Parang', 'Banta-Bantaeng', 'Bonto Makkio', 'Buakana', 'Gunung Sari', 'Karunrung', 'Kassi-Kassi', 'Mapala', 'Minasa Upa', 'Rappocini', 'Tidung'] },
      { nama: 'Tamalate', kelurahan: ['Balang Baru', 'Barombong', 'Bongaya', 'Bonto Duri', 'Jongaya', 'Maccini Sombala', 'Mangasa', 'Mannuruki', 'Pa\'baeng-baeng', 'Parang Tambung', 'Tanjung Merdeka'] },
    ],
  },
  {
    nama: 'Kota Denpasar',
    provinsi: 'Bali',
    kecamatan: [
      { nama: 'Denpasar Barat', kelurahan: ['Dauh Puri', 'Dauh Puri Kangin', 'Dauh Puri Kauh', 'Dauh Puri Klod', 'Padangsambian', 'Padangsambian Kaja', 'Padangsambian Klod', 'Pemecutan', 'Pemecutan Klod', 'Tegal Harum', 'Tegal Kertha'] },
      { nama: 'Denpasar Selatan', kelurahan: ['Panjer', 'Pedungan', 'Pemogan', 'Renon', 'Sanur', 'Sanur Kaja', 'Sanur Kauh', 'Serangan', 'Sesetan', 'Sidakarya'] },
    ],
  },
];

export function getKotaNames(): string[] {
  return WILAYAH_INDONESIA.map((k) => k.nama);
}

export function getKecamatanByKota(kotaName: string): string[] {
  const clean = kotaName.trim().toLowerCase();
  const found = WILAYAH_INDONESIA.find((k) => k.nama.toLowerCase() === clean);
  return found ? found.kecamatan.map((kc) => kc.nama) : [];
}

export function getKelurahanByKecamatan(kotaName: string, kecamatanName: string): string[] {
  const cleanKota = kotaName.trim().toLowerCase();
  const cleanKec = kecamatanName.trim().toLowerCase().replace(/^kec\.?\s*/i, '').replace(/^kecamatan\s*/i, '');
  const foundKota = WILAYAH_INDONESIA.find((k) => k.nama.toLowerCase() === cleanKota);
  if (!foundKota) return [];
  const foundKec = foundKota.kecamatan.find((kc) => kc.nama.toLowerCase() === cleanKec);
  return foundKec ? foundKec.kelurahan : [];
}

export function getProvinsiByKota(kotaName: string): string {
  const clean = kotaName.trim().toLowerCase();
  const found = WILAYAH_INDONESIA.find((k) => k.nama.toLowerCase() === clean);
  return found?.provinsi || 'Indonesia';
}

export function formatWilayahLabel(
  kotaOrObj?: string | { kota?: string; kecamatan?: string; kelurahan?: string },
  kecamatanArg?: string,
  kelurahanArg?: string
): string {
  const kota = typeof kotaOrObj === 'object' && kotaOrObj !== null ? kotaOrObj.kota : kotaOrObj;
  const kecamatan =
    typeof kotaOrObj === 'object' && kotaOrObj !== null ? kotaOrObj.kecamatan : kecamatanArg;
  const kelurahan =
    typeof kotaOrObj === 'object' && kotaOrObj !== null ? kotaOrObj.kelurahan : kelurahanArg;

  const parts = [
    kelurahan ? `Kel. ${kelurahan.replace(/^kel\.?\s*/i, '')}` : '',
    kecamatan ? `Kec. ${kecamatan.replace(/^kec\.?\s*/i, '')}` : '',
    kota || '',
  ].filter(Boolean);
  return parts.join(', ');
}

function toTitleCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanWilayahName(raw: string | undefined, prefixes: RegExp): string {
  return String(raw || '').replace(prefixes, '').replace(/\s+/g, ' ').trim();
}

/**
 * Mencocokkan hasil OCR KTP (kota, kecamatan, kelurahan) dengan hierarki WILAYAH_INDONESIA.
 * Jika KTP tidak mencantumkan kota tetapi kecamatan/kelurahan cocok dengan kamus, kota otomatis diisi.
 */
export function resolveWilayahFromOcr(input: {
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  fallbackKota?: string;
}): { kota: string; kecamatan: string; kelurahan: string } {
  const rawKota = cleanWilayahName(input.kota, /^(kota\s+adm\.?|kota\s+administrasi|kota|kab\.?|kabupaten)\s+/i);
  const rawKec = cleanWilayahName(input.kecamatan, /^(kec\.?|kecamatan)\s+/i);
  const rawKel = cleanWilayahName(input.kelurahan, /^(kel\.?|kelurahan|desa|ds\.?)\s+/i);

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nKota = norm(rawKota);
  const nKec = norm(rawKec);
  const nKel = norm(rawKel);

  // 1. Cari kecocokan langsung di kamus WILAYAH_INDONESIA berdasarkan kecamatan/kelurahan/kota
  let matchedKota = WILAYAH_INDONESIA.find((k) => {
    const nk = norm(k.nama);
    return nKota && (nk === nKota || nk.includes(nKota) || nKota.includes(nk));
  });

  if (!matchedKota && nKec) {
    matchedKota = WILAYAH_INDONESIA.find((k) =>
      k.kecamatan.some((kc) => norm(kc.nama) === nKec)
    );
  }
  if (!matchedKota && nKel) {
    matchedKota = WILAYAH_INDONESIA.find((k) =>
      k.kecamatan.some((kc) => kc.kelurahan.some((kl) => norm(kl) === nKel))
    );
  }

  let finalKota = matchedKota ? matchedKota.nama : rawKota ? toTitleCase(rawKota) : input.fallbackKota || '';
  let finalKec = rawKec ? toTitleCase(rawKec) : '';
  let finalKel = rawKel ? toTitleCase(rawKel) : '';

  if (matchedKota) {
    const matchedKec = matchedKota.kecamatan.find(
      (kc) => nKec && (norm(kc.nama) === nKec || norm(kc.nama).includes(nKec) || nKec.includes(norm(kc.nama)))
    );
    if (matchedKec) {
      finalKec = matchedKec.nama;
      const matchedKel = matchedKec.kelurahan.find(
        (kl) => nKel && (norm(kl) === nKel || norm(kl).includes(nKel) || nKel.includes(norm(kl)))
      );
      if (matchedKel) {
        finalKel = matchedKel;
      }
    } else if (nKel) {
      const kecByKel = matchedKota.kecamatan.find((kc) =>
        kc.kelurahan.some((kl) => norm(kl) === nKel)
      );
      if (kecByKel) {
        finalKec = kecByKel.nama;
        const matchedKel = kecByKel.kelurahan.find((kl) => norm(kl) === nKel);
        if (matchedKel) finalKel = matchedKel;
      }
    }
  }

  return {
    kota: finalKota,
    kecamatan: finalKec,
    kelurahan: finalKel,
  };
}


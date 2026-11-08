/**
 * ============================================================================
 * SWARAKU CLOUD DATABASE API (GOOGLE APPS SCRIPT WEB APP)
 * ============================================================================
 * Skrip backend ini berfungsi sebagai RESTful Web App API untuk mengelola data
 * akun pengguna (Super Admin, Admin, Tim Sukses, Kader) secara terpusat
 * di Google Sheets agar dapat diakses dari perangkat / browser mana pun secara real-time.
 *
 * CARA DEPLOY:
 * 1. Buka Google Sheets baru di https://sheets.new
 * 2. Klik menu "Extensions" (Ekstensi) -> "Apps Script"
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh skrip ini
 * 4. Klik tombol "Save" (ikon disket)
 * 5. Klik tombol "Deploy" di kanan atas -> "New deployment"
 * 6. Pilih tipe: "Web app" (ikon roda gigi di samping 'Select type')
 * 7. Atur konfigurasi:
 *    - Description: "SWARAKU Cloud Database API v1.0"
 *    - Execute as: "Me" (email Anda)
 *    - Who has access: "Anyone" (Siapa saja)  <-- WAJIB PILIH 'Anyone' AGAR TIDAK BLOKIR CORS
 * 8. Klik "Deploy", izinkan hak akses (Authorize access)
 * 9. Salin "Web app URL" (format: https://script.google.com/macros/s/.../exec)
 * 10. Tempelkan URL tersebut ke file frontend: src/config/apiConfig.ts (variabel SCRIPT_URL)
 */

const SHEET_NAME = 'Users';

// Definisi Header Kolom di Google Sheets
const HEADERS = [
  'id',
  'role',
  'nama',
  'username',
  'email',
  'password',
  'idPegawai',
  'divisi',
  'jabatan',
  'wilayah',
  'tps',
  'noHp',
  'status',
  'fotoUrl',
  'dibuatPada',
  'updatedAt'
];

/**
 * Mendapatkan sheet database atau membuatnya otomatis jika belum ada.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    // Format header
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    // Buat akun Super Admin default
    const defaultSuperAdmin = [
      'acc-superadmin-01',
      'super_admin',
      'Super Admin Utama',
      'superadmin',
      'superadmin@swaraku.com',
      'admin123',
      'SA-001',
      'Direktorat Utama & TI',
      'Super Administrator Sistem',
      'DAPIL DKI JAKARTA II',
      '',
      '081288219901',
      'Aktif',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      new Date().toLocaleDateString('id-ID'),
      new Date().toISOString()
    ];
    sheet.appendRow(defaultSuperAdmin);
  }
  return sheet;
}

/**
 * Mengubah baris sheet menjadi array objek JSON
 */
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined && row[index] !== null ? String(row[index]) : '';
    });
    return obj;
  });
}

/**
 * Helper untuk mengembalikan respons JSON dengan CORS headers
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const action = e.parameter.action || 'ping';

    if (action === 'ping') {
      const users = sheetToObjects(sheet);
      return jsonResponse({
        status: 'ok',
        message: 'SWARAKU Cloud Database API Active',
        totalUsers: users.length,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getUsers') {
      const users = sheetToObjects(sheet);
      return jsonResponse({
        success: true,
        users: users
      });
    }

    if (action === 'getUserById') {
      const id = e.parameter.id;
      const users = sheetToObjects(sheet);
      const user = users.find(u => u.id === id);
      if (user) {
        return jsonResponse({ success: true, user: user });
      }
      return jsonResponse({ success: false, message: 'User tidak ditemukan' });
    }

    if (action === 'login') {
      const username = (e.parameter.username || '').toLowerCase().trim();
      const password = (e.parameter.password || '').trim();
      return processLogin(sheet, username, password);
    }

    return jsonResponse({ success: false, message: 'Action tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = e.parameter || {};
      }
    } else {
      body = e.parameter || {};
    }

    const action = body.action || e.parameter.action;

    if (action === 'getUsers') {
      const users = sheetToObjects(sheet);
      return jsonResponse({ success: true, users: users });
    }

    if (action === 'getUserById') {
      const id = body.id || e.parameter.id;
      const users = sheetToObjects(sheet);
      const user = users.find(u => u.id === id);
      if (user) {
        return jsonResponse({ success: true, user: user });
      }
      return jsonResponse({ success: false, message: 'User tidak ditemukan' });
    }

    if (action === 'login') {
      const username = (body.username || e.parameter.username || '').toLowerCase().trim();
      const password = (body.password || e.parameter.password || '').trim();
      return processLogin(sheet, username, password);
    }

    if (action === 'createUser') {
      const user = body.user || body;
      if (!user.username || !user.nama) {
        return jsonResponse({ success: false, message: 'Nama dan Username wajib diisi' });
      }

      const users = sheetToObjects(sheet);
      const cleanUsername = String(user.username).toLowerCase().trim().replace(/\s+/g, '');

      // Cek duplikasi username
      const existing = users.find(u => u.username.toLowerCase() === cleanUsername);
      if (existing) {
        return jsonResponse({
          success: false,
          message: 'Username "' + cleanUsername + '" sudah digunakan akun lain. Silakan pilih username lain.'
        });
      }

      const newId = user.id || 'acc-' + new Date().getTime();
      const now = new Date();
      const dibuatPada = user.dibuatPada || now.toLocaleDateString('id-ID');
      const updatedAt = now.toISOString();

      const newRow = [
        newId,
        user.role || 'kader',
        user.nama || '',
        cleanUsername,
        user.email || (cleanUsername + '@swaraku.com'),
        user.password || '123456',
        user.idPegawai || '',
        user.divisi || '',
        user.jabatan || 'Anggota Tim Lapangan',
        user.wilayah || 'Dapil Terkait',
        user.tps || '',
        user.noHp || '',
        user.status || 'Aktif',
        user.fotoUrl || '',
        dibuatPada,
        updatedAt
      ];

      sheet.appendRow(newRow);

      const createdUser = {};
      HEADERS.forEach((h, i) => {
        createdUser[h] = String(newRow[i]);
      });

      return jsonResponse({
        success: true,
        message: 'Akun berhasil disimpan ke Google Sheets Database',
        user: createdUser
      });
    }

    if (action === 'updateUser') {
      const user = body.user || body;
      const id = user.id;
      if (!id) {
        return jsonResponse({ success: false, message: 'ID User wajib disertakan untuk update' });
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idColIdx = headers.indexOf('id');

      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idColIdx]) === String(id)) {
          rowIndex = i + 1; // 1-indexed baris sheet
          break;
        }
      }

      if (rowIndex === -1) {
        return jsonResponse({ success: false, message: 'Akun dengan ID tersebut tidak ditemukan' });
      }

      const now = new Date().toISOString();
      HEADERS.forEach((header, colIndex) => {
        if (header === 'updatedAt') {
          sheet.getRange(rowIndex, colIndex + 1).setValue(now);
        } else if (user[header] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(user[header]);
        }
      });

      return jsonResponse({
        success: true,
        message: 'Akun berhasil diperbarui di server',
        user: user
      });
    }

    if (action === 'deleteUser') {
      const id = body.id || e.parameter.id;
      if (!id) {
        return jsonResponse({ success: false, message: 'ID User wajib disertakan untuk hapus' });
      }

      const data = sheet.getDataRange().getValues();
      const idColIdx = data[0].indexOf('id');
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idColIdx]) === String(id)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ success: true, message: 'Akun berhasil dihapus dari Google Sheets' });
        }
      }
      return jsonResponse({ success: false, message: 'Akun tidak ditemukan' });
    }

    if (action === 'toggleStatus') {
      const id = body.id || e.parameter.id;
      const data = sheet.getDataRange().getValues();
      const idColIdx = data[0].indexOf('id');
      const statusColIdx = data[0].indexOf('status');

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idColIdx]) === String(id)) {
          const currentStatus = String(data[i][statusColIdx]);
          const newStatus = currentStatus === 'Nonaktif' ? 'Aktif' : 'Nonaktif';
          sheet.getRange(i + 1, statusColIdx + 1).setValue(newStatus);
          return jsonResponse({
            success: true,
            status: newStatus,
            message: 'Status akun diubah menjadi: ' + newStatus
          });
        }
      }
      return jsonResponse({ success: false, message: 'Akun tidak ditemukan' });
    }

    return jsonResponse({ success: false, message: 'Action POST tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Logika autentikasi Login
 */
function processLogin(sheet, username, password) {
  if (!username) {
    return jsonResponse({ success: false, message: 'Username / Email wajib diisi' });
  }

  const users = sheetToObjects(sheet);
  const foundUser = users.find(u =>
    (u.username && u.username.toLowerCase() === username) ||
    (u.email && u.email.toLowerCase() === username)
  );

  if (!foundUser) {
    return jsonResponse({
      success: false,
      message: 'Username / Email "' + username + '" tidak terdaftar di Database Server.'
    });
  }

  if (foundUser.status === 'Nonaktif') {
    return jsonResponse({
      success: false,
      message: 'Akun Anda dinonaktifkan oleh Super Admin. Hubungi Super Admin untuk aktivasi.'
    });
  }

  if (password && foundUser.password && foundUser.password !== password) {
    return jsonResponse({
      success: false,
      message: 'Password / PIN yang dimasukkan salah.'
    });
  }

  return jsonResponse({
    success: true,
    message: 'Login berhasil! Kredensial valid di server.',
    user: foundUser
  });
}

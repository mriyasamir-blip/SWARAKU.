/**
 * ============================================================================
 * KONFIGURASI DATABASE CLOUD (GOOGLE APPS SCRIPT WEB APP / GOOGLE SHEETS)
 * ============================================================================
 * Masukkan URL Web App hasil Deploy Google Sheets (Code.gs) Anda pada konstanta SCRIPT_URL di bawah ini.
 * Pastikan saat Deploy di Google Apps Script:
 * - Execute as: Me (akun Google Anda)
 * - Who has access: Anyone (Siapa saja, bahkan anonim)
 *
 * Contoh URL resmi Google Apps Script:
 * https://script.google.com/macros/s/AKfycb.../exec
 */
export const SCRIPT_URL: string = "MASUKKAN_URL_WEB_APP_DISINI";

/**
 * Mendapatkan URL API aktif (mendukung URL dari konstanta di atas
 * atau yang diinput langsung melalui UI pengaturan Super Admin).
 */
export const getActiveScriptUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('swaraku_custom_api_url');
    if (customUrl && customUrl.trim().startsWith('http')) {
      return customUrl.trim();
    }
  }
  return SCRIPT_URL.trim();
};

export const isScriptUrlConfigured = (): boolean => {
  const url = getActiveScriptUrl();
  return (
    url.length > 0 &&
    !url.includes('MASUKKAN_URL_WEB_APP_DISINI') &&
    url.startsWith('https://script.google.com')
  );
};

export const setCustomScriptUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    if (url && url.trim().startsWith('http')) {
      localStorage.setItem('swaraku_custom_api_url', url.trim());
    } else {
      localStorage.removeItem('swaraku_custom_api_url');
    }
  }
};

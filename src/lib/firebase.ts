import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Gunakan initializeFirestore dengan experimentalAutoDetectLongPolling agar koneksi Firestore
// selalu stabil di berbagai browser, device mobile, container iframe, maupun saat koneksi beralih jaringan
let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? firebaseConfig.firestoreDatabaseId
      : undefined
  );
} catch {
  dbInstance =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
}

export const firestore = dbInstance;

/**
 * Validasi koneksi non-blocking ke Cloud Firestore.
 * Menggunakan getDoc (dengan cache offline fallback) sehingga tidak memicu error unhandled jika jaringan lambat saat booting.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDoc(doc(firestore, 'test', 'connection'));
    console.log('[Firebase] Cloud Firestore terhubung sukses (Localhost & Cloud)');
    return true;
  } catch (error: any) {
    console.warn('[Firebase] Mode jaringan / cache aktif:', error?.message || error);
    return false;
  }
}

// Jalankan validasi secara asinkron setelah window load agar tidak memblokir render awal
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      testFirestoreConnection().catch(() => {});
    }, 1200);
  });
}



import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export const firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Validasi koneksi langsung ke Firestore Cloud pada saat aplikasi boot
import { doc, getDocFromServer } from 'firebase/firestore';

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    console.log('[Firebase] Cloud Firestore terhubung sukses (Localhost & Cloud)');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client offline atau periksa konfigurasi Firebase.');
      return false;
    }
    // Jika dokumen tidak ada tetapi koneksi server tercapai
    return true;
  }
}

testFirestoreConnection().catch(() => {});



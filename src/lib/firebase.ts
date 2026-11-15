import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

const targetDatabaseId =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    targetDatabaseId
  );
} catch {
  dbInstance = targetDatabaseId
    ? getFirestore(app, targetDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;
export const firestore = dbInstance;

// Dukungan opsional Localhost Emulator saat flag VITE_USE_FIREBASE_EMULATOR=true
const useEmulator =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true' &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (useEmulator) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch (err) {
    console.warn('[Firebase] Emulator connection skipped:', err);
  }
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      testFirestoreConnection().catch(() => {});
    }, 1000);
  });
}

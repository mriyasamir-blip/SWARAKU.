import { getApp, getApps, initializeApp } from 'firebase/app';
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
  persistentSingleTabManager,
  memoryLocalCache,
  connectFirestoreEmulator,
  setLogLevel,
  doc,
  getDocFromServer,
  type Firestore,
  type FirestoreSettings,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Hanya tampilkan log tingkat error agar warning retry WebChannel sementara tidak memicu alarm palsu
setLogLevel('error');

const targetDatabaseId =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

function buildLocalCache() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return memoryLocalCache();
  }
  try {
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }
    return persistentLocalCache({
      tabManager: inIframe
        ? persistentSingleTabManager({ forceOwnership: true })
        : persistentMultipleTabManager(),
    });
  } catch {
    return memoryLocalCache();
  }
}

function createFirestoreInstance(): Firestore {
  try {
    const settings: FirestoreSettings & { useFetchStreams?: boolean } = {
      localCache: buildLocalCache(),
      // Gunakan XHR HTTP Long Polling langsung agar bebas dari timeout 10 detik WebChannel
      // maupun abort error Fetch ReadableStream di balik proxy/Cloud Run/iframe.
      experimentalForceLongPolling: true,
      useFetchStreams: false,
      ignoreUndefinedProperties: true,
    };
    return initializeFirestore(app, settings, targetDatabaseId);
  } catch {
    return targetDatabaseId
      ? getFirestore(app, targetDatabaseId)
      : getFirestore(app);
  }
}

const dbInstance = createFirestoreInstance();

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
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error('Please check your Firebase configuration.');
    return false;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  try {
    await getDocFromServer(doc(db, 'events', 'healthcheck_ping'));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('the client is offline') ||
      message.includes('unavailable') ||
      message.includes('Failed to get document')
    ) {
      console.warn('[Firebase] Firestore beroperasi dalam mode offline / menunggu jaringan:', message);
    }
    return false;
  }
}

/**
 * Re-export instance Firebase tunggal yang sudah terkonfigurasi di `src/lib/firebase.ts`.
 * Mendukung environment variables `VITE_FIREBASE_*` saat deploy ke hosting eksternal
 * dengan fallback otomatis ke konfigurasi proyek saat ini.
 */
export { app, auth, db, firestore, googleAuthProvider, testFirestoreConnection } from '../lib/firebase';

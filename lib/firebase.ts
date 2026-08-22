/**
 * Firebase initialization.
 *
 * Config comes from EXPO_PUBLIC_FIREBASE_* env vars (see .env.example).
 * Until a real Firebase project's keys are supplied, `isFirebaseConfigured`
 * is false and lib/auth.ts surfaces a clear Arabic error instead of letting
 * the SDK throw a cryptic "invalid-api-key" deep in a network call.
 */
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// @ts-expect-error — getReactNativePersistence exists at runtime (Metro resolves
// @firebase/auth's "react-native" export condition correctly) but that package's
// exports map lists a `types` condition before `react-native`, and TypeScript
// always matches `types` first, so tsc falls back to the web typings, which
// don't declare it. Verified directly against node_modules/@firebase/auth's
// package.json — this is a types-only gap, not a runtime bug.
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

// A syntactically-valid placeholder so initializeApp() never throws just
// from being called — real network calls will still fail (and are caught)
// until real keys are supplied.
const safeConfig: FirebaseOptions = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: 'placeholder-not-configured',
      authDomain: 'placeholder.firebaseapp.com',
      projectId: 'placeholder',
      appId: '1:0:web:0',
    };

export const firebaseApp = getApps().length ? getApp() : initializeApp(safeConfig);

function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if called twice (e.g. Fast Refresh) — fall back
    // to the already-initialized instance.
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth();

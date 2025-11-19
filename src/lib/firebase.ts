import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAFwO4YRfep5UtlAkGPc46m_Sx3luGFl4s",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "transfernest-12vn4.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "transfernest-12vn4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "transfernest-12vn4.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "476118460094",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:476118460094:web:af1b59d4f9838e923a60ef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Set auth persistence to LOCAL (persists across browser sessions)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

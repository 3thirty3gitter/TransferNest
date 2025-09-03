import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "transfernest-12vn4",
  "appId": "1:476118460094:web:af1b59d4f9838e923a60ef",
  "storageBucket": "transfernest-12vn4.firebasestorage.app",
  "apiKey": "AIzaSyAFwO4YRfep5UtlAkGPc46m_Sx3luGFl4s",
  "authDomain": "transfernest-12vn4.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "476118460094"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

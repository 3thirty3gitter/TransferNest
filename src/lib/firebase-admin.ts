/**
 * @fileOverview Centralized Firebase Admin initialization.
 */

import * as admin from 'firebase-admin';

let app: admin.app.App;

try {
  if (!admin.apps.length) {
    // Try to initialize with service account from environment
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      try {
        // Parse the service account JSON (could be base64 encoded or raw JSON)
        let credentials;
        try {
          // Try base64 decode first
          credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf8'));
        } catch {
          // If that fails, try parsing as raw JSON
          credentials = JSON.parse(serviceAccount);
        }
        
        app = admin.initializeApp({
          credential: admin.credential.cert(credentials),
        });
        console.log('[Firebase Admin] Initialized with service account');
      } catch (parseError) {
        console.error('[Firebase Admin] Failed to parse service account credentials:', parseError);
        throw new Error('Invalid service account credentials format');
      }
    } else {
      // Try default credentials (works in some environments like Cloud Functions)
      console.warn('[Firebase Admin] No service account found, attempting default initialization');
      app = admin.initializeApp();
      console.log('[Firebase Admin] Initialized with default credentials');
    }
  } else {
    app = admin.apps[0] as admin.app.App;
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization error:', error);
  throw error;
}

export function getFirestore() {
  if (!app) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.firestore(app);
}

export function getStorage() {
  if (!app) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.storage(app);
}

export function getAuth() {
  if (!app) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.auth(app);
}

export default app;


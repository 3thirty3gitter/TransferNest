/**
 * @fileOverview Centralized Firebase Admin initialization.
 */

const admin = require('firebase-admin');

let app: any = null;
let initialized = false;

// Storage bucket name - matches Firebase project
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'transfernest-12vn4.firebasestorage.app';

function initializeApp() {
  if (initialized) {
    return app;
  }

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
            storageBucket: STORAGE_BUCKET,
          });
          console.log('[Firebase Admin] Initialized with service account, bucket:', STORAGE_BUCKET);
        } catch (parseError) {
          console.error('[Firebase Admin] Failed to parse service account credentials:', parseError);
          throw new Error('Invalid service account credentials format');
        }
      } else {
        // Try default credentials (works in some environments like Cloud Functions)
        console.warn('[Firebase Admin] No service account found, attempting default initialization');
        app = admin.initializeApp({
          storageBucket: STORAGE_BUCKET,
        });
        console.log('[Firebase Admin] Initialized with default credentials, bucket:', STORAGE_BUCKET);
      }
    } else {
      app = admin.apps[0];
    }
    initialized = true;
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error);
    throw error;
  }
  
  return app;
}

export function getFirestore() {
  const appInstance = initializeApp();
  if (!appInstance) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.firestore(appInstance);
}

export function getStorage() {
  const appInstance = initializeApp();
  if (!appInstance) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.storage(appInstance);
}

export function getAuth() {
  const appInstance = initializeApp();
  if (!appInstance) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.auth(appInstance);
}

/**
 * Get company settings from Firestore using Admin SDK (for server-side use)
 */
export async function getCompanySettingsAdmin(): Promise<any> {
  const db = getFirestore();
  try {
    const settingsDoc = await db.collection('settings').doc('company-settings').get();
    
    if (!settingsDoc.exists) {
      console.warn('[Firebase Admin] Company settings not found');
      return null;
    }
    
    return settingsDoc.data();
  } catch (error) {
    console.error('[Firebase Admin] Error fetching company settings:', error);
    return null;
  }
}

export default { initializeApp };


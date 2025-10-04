/**
 * @fileOverview Centralized Firebase Admin initialization.
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export function getFirestore() {
  return admin.firestore();
}

export { admin };

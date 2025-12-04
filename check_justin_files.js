
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function checkFiles() {
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      try {
        let credentials;
        try {
          credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf8'));
        } catch {
          credentials = JSON.parse(serviceAccount);
        }
        admin.initializeApp({
          credential: admin.credential.cert(credentials),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
      } catch (e) {
        console.error('Failed to parse service account', e);
        process.exit(1);
      }
    } else {
      admin.initializeApp({
        storageBucket: 'transfernest-12vn4.firebasestorage.app' // Correct bucket from firebase.ts
      });
    }
  }

  const bucket = admin.storage().bucket('transfernest-12vn4.firebasestorage.app'); // Correct bucket
  const userId = '1xecqbmzI9fwQF89IvpkJNsg0Iy1'; // Justin's ID

  console.log(`Checking files for user: ${userId}`);

  try {
    // Check uploads folder
    const [uploadFiles] = await bucket.getFiles({ prefix: `uploads/${userId}/` });
    console.log(`Found ${uploadFiles.length} files in uploads/`);
    uploadFiles.forEach(f => console.log(` - ${f.name} (${(f.metadata.size / 1024 / 1024).toFixed(2)} MB)`));

    // Check orders folder (where final print files usually go)
    const [orderFiles] = await bucket.getFiles({ prefix: `orders/${userId}/` });
    console.log(`Found ${orderFiles.length} files in orders/`);
    orderFiles.forEach(f => console.log(` - ${f.name} (${(f.metadata.size / 1024 / 1024).toFixed(2)} MB)`));

  } catch (e) {
    console.error('Error listing files:', e);
  }
}

checkFiles();

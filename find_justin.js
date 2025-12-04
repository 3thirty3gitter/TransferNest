
const admin = require('firebase-admin');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function findJustin() {
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
      console.log('No service account key found, trying default init...');
      admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    }
  }

  const db = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket();

  console.log('Searching for Justin Gilfoil...');

  // 1. Search Users
  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.get();
  
  const foundUsers = [];
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const name = data.firstName ? `${data.firstName} ${data.lastName}` : data.displayName || 'Unknown';
    const email = data.email || 'Unknown';
    
    if (
      (name && name.toLowerCase().includes('justin')) || 
      (name && name.toLowerCase().includes('gilfoil')) ||
      (email && email.toLowerCase().includes('justin'))
    ) {
      console.log(`Found User: ${name} (${email}) - ID: ${doc.id}`);
      foundUsers.push({ id: doc.id, name, email });
    }
  }

  if (foundUsers.length === 0) {
    console.log('No users found matching "Justin" or "Gilfoil".');
  }

  // 2. List files for found users
  for (const user of foundUsers) {
    console.log(`\nChecking files for user: ${user.name} (${user.id})`);
    try {
      const [uploadFiles] = await bucket.getFiles({ prefix: `uploads/${user.id}/` });
      const [orderFiles] = await bucket.getFiles({ prefix: `orders/${user.id}/` });
      
      const allFiles = [...uploadFiles, ...orderFiles];
      
      if (allFiles.length === 0) {
        console.log('  No files found.');
      } else {
        console.log(`  Found ${allFiles.length} files:`);
        for (const file of allFiles) {
            // Get signed URL for access
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            });
            console.log(`  - ${file.name}`);
            console.log(`    URL: ${url}`);
        }
      }
    } catch (e) {
      console.error(`  Error listing files for user ${user.id}:`, e);
    }
  }
}

findJustin().catch(console.error);

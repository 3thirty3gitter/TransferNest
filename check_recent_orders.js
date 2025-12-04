
const admin = require('firebase-admin');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function checkOrders() {
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
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    }
  }

  const db = admin.firestore();
  const userId = '1xecqbmzI9fwQF89IvpkJNsg0Iy1';
  
  console.log(`Checking orders for user: ${userId}`);
  
  try {
    const snapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (snapshot.empty) {
      console.log('No orders found.');
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('------------------------------------------------');
      console.log(`Order ID: ${doc.id}`);
      console.log(`Created At: ${data.createdAt ? data.createdAt.toDate() : 'N/A'}`);
      console.log(`Status: ${data.status}`);
      console.log(`Total: ${data.total}`);
      console.log(`Payment ID: ${data.paymentId}`);
      console.log(`Items: ${data.items ? data.items.length : 0}`);
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

checkOrders();


const admin = require('firebase-admin');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function restoreOrder() {
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
  
  const files = [
    { name: "0e9e36b8-692c-4619-bbec-c017f02ba76a.png", url: "https://storage.googleapis.com/transfernest-12vn4.firebasestorage.app/uploads%2F1xecqbmzI9fwQF89IvpkJNsg0Iy1%2F0e9e36b8-692c-4619-bbec-c017f02ba76a.png" },
    { name: "13e61c77-a320-49ba-b834-51a5a16c73e0.png", url: "https://storage.googleapis.com/transfernest-12vn4.firebasestorage.app/uploads%2F1xecqbmzI9fwQF89IvpkJNsg0Iy1%2F13e61c77-a320-49ba-b834-51a5a16c73e0.png" },
    { name: "91c76ad2-0a3b-4ec7-9669-8738f75a9e88.png", url: "https://storage.googleapis.com/transfernest-12vn4.firebasestorage.app/uploads%2F1xecqbmzI9fwQF89IvpkJNsg0Iy1%2F91c76ad2-0a3b-4ec7-9669-8738f75a9e88.png" },
    { name: "9217e273-2b6b-410e-abfb-433fa942836c.png", url: "https://storage.googleapis.com/transfernest-12vn4.firebasestorage.app/uploads%2F1xecqbmzI9fwQF89IvpkJNsg0Iy1%2F9217e273-2b6b-410e-abfb-433fa942836c.png" },
    { name: "abc707b5-1738-499c-8b41-c3e823ad9b88.png", url: "https://storage.googleapis.com/transfernest-12vn4.firebasestorage.app/uploads%2F1xecqbmzI9fwQF89IvpkJNsg0Iy1%2Fabc707b5-1738-499c-8b41-c3e823ad9b88.png" }
  ];

  const orderData = {
    userId: userId,
    customerInfo: {
      firstName: "Justin",
      lastName: "GILFOIL",
      email: "justin@gilfoil.com",
      country: "Canada"
    },
    status: "paid",
    paymentStatus: "paid",
    total: 53.24,
    subtotal: 53.24, // Approximate
    tax: 0,
    shipping: 0,
    currency: "CAD",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: files.map(f => ({
      id: Math.random().toString(36).substring(7),
      name: "Restored Design",
      quantity: 1,
      sheetSize: "Unknown",
      totalPrice: 0,
      images: []
    })),
    printFiles: files.map(f => ({
      filename: f.name,
      url: f.url,
      size: 0,
      dimensions: { width: 0, height: 0, dpi: 300 }
    })),
    restored: true,
    note: "Manually restored from found uploads"
  };

  console.log("Creating restored order...");
  const res = await db.collection('orders').add(orderData);
  console.log(`Order created successfully! ID: ${res.id}`);
}

restoreOrder().catch(console.error);

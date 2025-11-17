const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProducts() {
  try {
    const productsSnapshot = await db.collection('products').get();
    
    console.log(`\nTotal products in database: ${productsSnapshot.size}\n`);
    
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Product ID:', doc.id);
      console.log('Name:', data.name);
      console.log('Sheet Size:', data.sheetSize);
      console.log('Is Active:', data.isActive);
      console.log('Price Per Inch:', data.pricePerInch);
      console.log('---');
    });
    
    // Check active products specifically
    const activeSnapshot = await db.collection('products')
      .where('isActive', '==', true)
      .get();
    
    console.log(`\nActive products: ${activeSnapshot.size}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkProducts();

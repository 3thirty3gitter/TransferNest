// Script to seed initial products into Firestore
// Run with: node scripts/seed-products.mjs

import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const products = [
  {
    name: '13" Gang Sheet',
    description: 'Perfect for standard t-shirts, logos, and smaller designs. The cost-effective choice for most businesses.',
    sheetSize: '13',
    pricePerInch: 0.45,
    basePrice: 0,
    isActive: true,
    badge: 'MOST POPULAR',
    badgeColor: 'from-blue-500 to-cyan-500',
    gradient: 'from-blue-400 to-cyan-400',
    buttonGradient: 'from-blue-600 to-cyan-600',
    buttonHoverGradient: 'from-blue-700 to-cyan-700',
    checkmarkColor: 'text-cyan-400',
    features: [
      'Ideal for logos & standard designs',
      'Most economical option',
      'Perfect for t-shirt businesses'
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: '17" Gang Sheet',
    description: 'Ideal for oversized prints, hoodies, and maximizing designs per sheet for high-volume orders.',
    sheetSize: '17',
    pricePerInch: 0.67,
    basePrice: 0,
    isActive: true,
    badge: 'MAXIMUM SIZE',
    badgeColor: 'from-purple-500 to-pink-500',
    gradient: 'from-purple-400 to-pink-400',
    buttonGradient: 'from-purple-600 to-pink-600',
    buttonHoverGradient: 'from-purple-700 to-pink-700',
    checkmarkColor: 'text-purple-400',
    features: [
      'Perfect for oversized designs',
      'More designs per sheet',
      'Great for hoodies & jackets'
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

async function seedProducts() {
  console.log('🌱 Seeding products...');
  
  try {
    // Check if products already exist
    const productsSnap = await db.collection('products').get();
    
    if (productsSnap.size > 0) {
      console.log('⚠️  Products already exist. Skipping seed.');
      console.log(`   Found ${productsSnap.size} existing products.`);
      return;
    }
    
    // Add products
    for (const product of products) {
      const docRef = await db.collection('products').add(product);
      console.log(`✅ Created product: ${product.name} (${docRef.id})`);
    }
    
    console.log('✨ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

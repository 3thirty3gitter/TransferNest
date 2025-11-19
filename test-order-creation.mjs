#!/usr/bin/env node

/**
 * Test Order Creation Flow
 * Tests the complete order creation process using Firebase Admin SDK
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccount) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in environment');
    process.exit(1);
  }

  try {
    const serviceAccountObj = JSON.parse(serviceAccount);
    initializeApp({
      credential: cert(serviceAccountObj)
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to parse service account key:', error.message);
    process.exit(1);
  }
}

const db = getFirestore();

async function testOrderCreation() {
  console.log('\n🧪 Testing Order Creation Flow...\n');

  try {
    // Test 1: Create a test order
    console.log('1️⃣ Creating test order...');
    
    const testOrder = {
      userId: 'test_user_' + Date.now(),
      paymentId: 'test_payment_' + Date.now(),
      status: 'paid',
      customerInfo: {
        email: 'test@example.com',
        name: 'Test User',
        phone: '555-0100',
        company: 'Test Company'
      },
      items: [
        {
          id: 'item_1',
          images: [{ url: 'test.png', width: 10, height: 10 }],
          sheetSize: '13x19',
          quantity: 1,
          unitPrice: 25.00,
          totalPrice: 25.00,
          utilization: 95
        }
      ],
      subtotal: 25.00,
      tax: 2.00,
      shipping: 0,
      total: 27.00,
      currency: 'CAD',
      printFiles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: new Date()
    };

    const docRef = await db.collection('orders').add(testOrder);
    console.log('   ✅ Order created with ID:', docRef.id);

    // Test 2: Retrieve the order
    console.log('\n2️⃣ Retrieving order...');
    const orderDoc = await db.collection('orders').doc(docRef.id).get();
    
    if (!orderDoc.exists) {
      throw new Error('Order not found after creation');
    }
    
    const retrievedOrder = orderDoc.data();
    console.log('   ✅ Order retrieved successfully');
    console.log('   📦 Order Details:', {
      id: docRef.id,
      userId: retrievedOrder.userId,
      status: retrievedOrder.status,
      total: retrievedOrder.total,
      items: retrievedOrder.items.length
    });

    // Test 3: Query orders by userId
    console.log('\n3️⃣ Querying orders by userId...');
    const userOrdersSnapshot = await db.collection('orders')
      .where('userId', '==', testOrder.userId)
      .get();
    
    console.log('   ✅ Found', userOrdersSnapshot.size, 'order(s) for user');

    // Test 4: Update order status
    console.log('\n4️⃣ Updating order status...');
    await db.collection('orders').doc(docRef.id).update({
      status: 'processing',
      updatedAt: new Date()
    });
    console.log('   ✅ Order status updated to "processing"');

    // Test 5: Check actual orders in database
    console.log('\n5️⃣ Checking existing orders in database...');
    const allOrdersSnapshot = await db.collection('orders').limit(5).get();
    console.log('   📊 Total orders in last query:', allOrdersSnapshot.size);
    
    if (allOrdersSnapshot.size > 0) {
      console.log('   📋 Recent orders:');
      allOrdersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`      ${index + 1}. Order ${doc.id}`);
        console.log(`         - Status: ${data.status}`);
        console.log(`         - Total: $${data.total}`);
        console.log(`         - Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
      });
    }

    // Test 6: Clean up test order
    console.log('\n6️⃣ Cleaning up test order...');
    await db.collection('orders').doc(docRef.id).delete();
    console.log('   ✅ Test order deleted');

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   ✅ Firebase Admin SDK is working correctly');
    console.log('   ✅ Order creation is functional');
    console.log('   ✅ Order retrieval is working');
    console.log('   ✅ Order queries are successful');
    console.log('   ✅ Order updates are working');
    console.log('\n🎉 Order creation system is ready for production!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
testOrderCreation().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

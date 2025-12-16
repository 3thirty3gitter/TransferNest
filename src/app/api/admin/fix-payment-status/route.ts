import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdmin } from '@/lib/auth-admin';

/**
 * One-time migration API to fix payment status on existing orders
 * GET /api/admin/fix-payment-status - Preview orders that need fixing
 * POST /api/admin/fix-payment-status - Actually fix them
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all orders that have a paymentId but no paymentStatus
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef.get();
    
    const ordersToFix: Array<{id: string; orderNumber: string; paymentId: string; currentStatus: string}> = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // If order has a paymentId but paymentStatus is missing or not 'paid'
      if (data.paymentId && data.paymentStatus !== 'paid' && data.paymentStatus !== 'refunded') {
        ordersToFix.push({
          id: doc.id,
          orderNumber: data.orderNumber || doc.id.slice(-8),
          paymentId: data.paymentId,
          currentStatus: data.paymentStatus || 'undefined'
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Found ${ordersToFix.length} orders that need payment status fix`,
      ordersToFix,
      action: 'POST to this endpoint to fix them'
    });
  } catch (error) {
    console.error('Error checking orders:', error);
    return NextResponse.json({ error: 'Failed to check orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find and fix all orders that have a paymentId but no paymentStatus
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef.get();
    
    const batch = adminDb.batch();
    let fixedCount = 0;
    const fixedOrders: string[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // If order has a paymentId but paymentStatus is missing or not set properly
      if (data.paymentId && data.paymentStatus !== 'paid' && data.paymentStatus !== 'refunded') {
        batch.update(doc.ref, { paymentStatus: 'paid' });
        fixedCount++;
        fixedOrders.push(data.orderNumber || doc.id.slice(-8));
      }
    });

    if (fixedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Fixed payment status for ${fixedCount} orders`,
      fixedOrders
    });
  } catch (error) {
    console.error('Error fixing orders:', error);
    return NextResponse.json({ error: 'Failed to fix orders' }, { status: 500 });
  }
}

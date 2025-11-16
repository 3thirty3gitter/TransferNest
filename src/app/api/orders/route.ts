import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');

    if (!userId && !status) {
      return NextResponse.json(
        { error: 'Either userId or status is required' },
        { status: 400 }
      );
    }

    console.log('[Orders API] Fetching orders:', { userId, status, limit: limitParam });

    let db;
    try {
      db = getFirestore();
    } catch (dbError) {
      console.error('[Orders API] Firebase Admin initialization error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Could not connect to Firestore'
        },
        { status: 500 }
      );
    }

    const ordersRef = db.collection('orders');
    let queryRef: any = ordersRef;

    if (userId) {
      queryRef = queryRef.where('userId', '==', userId);
    }
    
    if (status) {
      queryRef = queryRef.where('status', '==', status);
    }

    // Only add orderBy if we have the composite index or no where clause
    // For userId queries, we'll sort client-side to avoid index requirement
    if (!userId || status) {
      queryRef = queryRef.orderBy('createdAt', 'desc');
    }

    if (limitParam) {
      queryRef = queryRef.limit(parseInt(limitParam));
    }

    console.log('[Orders API] Executing query...');
    const snapshot = await queryRef.get();
    console.log('[Orders API] Query successful, docs:', snapshot.size);

    let orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
      paidAt: doc.data().paidAt?.toDate?.()?.toISOString?.() || null,
      shippedAt: doc.data().shippedAt?.toDate?.()?.toISOString?.() || null,
      deliveredAt: doc.data().deliveredAt?.toDate?.()?.toISOString?.() || null,
    }));

    // Sort client-side if we couldn't sort in the query
    if (userId && !status) {
      orders = orders.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    console.log('[Orders API] Returning', orders.length, 'orders');

    return NextResponse.json({
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('[Orders API] Error fetching orders:', error);
    console.error('[Orders API] Error details:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, trackingNumber, additionalData } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const orderRef = db.collection('orders').doc(orderId);
    
    const updateData: any = {
      status,
      updatedAt: new Date(),
      ...additionalData
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    await orderRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
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

    const db = getFirestore();
    const ordersRef = db.collection('orders');
    let queryRef: any = ordersRef;

    if (userId) {
      queryRef = queryRef.where('userId', '==', userId);
    }
    
    if (status) {
      queryRef = queryRef.where('status', '==', status);
    }

    queryRef = queryRef.orderBy('createdAt', 'desc');

    if (limitParam) {
      queryRef = queryRef.limit(parseInt(limitParam));
    }

    const snapshot = await queryRef.get();
    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
      paidAt: doc.data().paidAt?.toDate?.()?.toISOString?.() || null,
      shippedAt: doc.data().shippedAt?.toDate?.()?.toISOString?.() || null,
      deliveredAt: doc.data().deliveredAt?.toDate?.()?.toISOString?.() || null,
    }));

    return NextResponse.json({
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
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
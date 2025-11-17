import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const ordersSnapshot = await db.collection('orders').limit(10).get();
    
    const orders = ordersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.customerInfo?.email || data.email || 'no email',
        status: data.status,
        paymentStatus: data.paymentStatus,
        total: data.total,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || 'no date',
        hasUserId: !!data.userId,
        userIdType: typeof data.userId,
      };
    });

    return NextResponse.json({
      totalOrders: ordersSnapshot.size,
      orders,
      message: 'Orders retrieved successfully'
    });

  } catch (error) {
    console.error('[Check Orders] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

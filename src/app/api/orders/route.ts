import { NextRequest, NextResponse } from 'next/server';
import { OrderManager, Order } from '@/lib/order-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (!userId && !status) {
      return NextResponse.json(
        { error: 'Either userId or status is required' },
        { status: 400 }
      );
    }

    const orderManager = new OrderManager();
    let orders: Order[] = [];

    if (userId) {
      // Get orders for a specific user
      orders = await orderManager.getUserOrders(
        userId, 
        limit ? parseInt(limit) : undefined
      );
    } else if (status) {
      // Get orders by status (admin functionality)
      orders = await orderManager.getOrdersByStatus(
        status as any, 
        limit ? parseInt(limit) : undefined
      );
    }

    return NextResponse.json({
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
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

    const orderManager = new OrderManager();
    
    if (trackingNumber) {
      await orderManager.addTrackingNumber(orderId, trackingNumber);
    } else {
      await orderManager.updateOrderStatus(orderId, status, additionalData);
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
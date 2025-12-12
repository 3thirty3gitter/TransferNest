import { NextRequest, NextResponse } from 'next/server';
import { OrderManagerAdmin } from '@/lib/order-manager-admin';
import { verifyAdminRequest } from '@/lib/admin-auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authResult = await verifyAdminRequest(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.message }, { status: 401 });
  }

  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderManager = new OrderManagerAdmin();
    const order = await orderManager.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH - Cancel an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authResult = await verifyAdminRequest(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.message }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderManager = new OrderManagerAdmin();

    if (action === 'cancel') {
      await orderManager.cancelOrder(orderId, reason);
      return NextResponse.json({ 
        success: true, 
        message: 'Order cancelled successfully' 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an order permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authResult = await verifyAdminRequest(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.message }, { status: 401 });
  }

  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderManager = new OrderManagerAdmin();
    await orderManager.deleteOrder(orderId);

    return NextResponse.json({ 
      success: true, 
      message: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

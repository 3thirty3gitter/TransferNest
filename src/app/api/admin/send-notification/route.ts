import { NextRequest, NextResponse } from 'next/server';
import { OrderManagerAdmin } from '@/lib/order-manager-admin';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { 
  sendOrderConfirmationEmail,
  sendOrderUpdateEmail, 
  sendOrderReadyForPickupEmail,
  EmailOrderDetails 
} from '@/lib/email';

export async function POST(request: NextRequest) {
  const authResult = await verifyAdminRequest(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.message }, { status: 401 });
  }

  try {
    const { orderId, type, trackingNumber } = await request.json();

    if (!orderId || !type) {
      return NextResponse.json(
        { error: 'Order ID and notification type are required' },
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

    // Check if we have a customer email
    const customerEmail = order.customerInfo?.email;
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No customer email found for this order' },
        { status: 400 }
      );
    }

    const emailDetails: EmailOrderDetails = {
      orderId,
      customerName: order.customerInfo 
        ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}`
        : 'Valued Customer',
      customerEmail,
      items: order.items || [],
      total: order.total || 0,
      shippingAddress: order.customerInfo?.shippingAddress || (order as any).shippingAddress
    };

    let result: { success: boolean; error?: unknown; data?: unknown };

    switch (type) {
      case 'confirmation':
        console.log('[SEND NOTIFICATION] Sending order confirmation to:', customerEmail);
        result = await sendOrderConfirmationEmail(emailDetails);
        break;

      case 'shipped':
        console.log('[SEND NOTIFICATION] Sending shipped notification to:', customerEmail);
        result = await sendOrderUpdateEmail(
          emailDetails, 
          'shipped', 
          trackingNumber || (order as any).trackingNumber || (order as any).shippingInfo?.trackingNumber
        );
        break;

      case 'pickup':
        console.log('[SEND NOTIFICATION] Sending pickup ready notification to:', customerEmail);
        result = await sendOrderReadyForPickupEmail(emailDetails);
        break;

      case 'update':
        console.log('[SEND NOTIFICATION] Sending status update to:', customerEmail);
        result = await sendOrderUpdateEmail(emailDetails, order.status);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    console.log('[SEND NOTIFICATION] Result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${type} notification sent successfully`,
        recipient: customerEmail
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

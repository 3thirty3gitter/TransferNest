import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, sendOrderUpdateEmail, sendOrderReadyForPickupEmail } from '@/lib/email';
import { OrderManagerAdmin } from '@/lib/order-manager-admin';

export async function POST(request: NextRequest) {
  try {
    const { orderId, type, emailOverride } = await request.json();

    if (!orderId || !type) {
      return NextResponse.json({ error: 'Missing orderId or type' }, { status: 400 });
    }

    // Fetch order details
    const orderManager = new OrderManagerAdmin();
    const order = await orderManager.getOrder(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prepare email details
    const emailDetails = {
      orderId: order.id || orderId,
      customerName: order.customerInfo?.firstName ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : 'Valued Customer',
      customerEmail: emailOverride || order.customerInfo?.email || '',
      items: order.items || [],
      total: order.total || 0,
      shippingAddress: order.customerInfo?.shippingAddress
    };

    let result;

    switch (type) {
      case 'confirmation':
        result = await sendOrderConfirmationEmail(emailDetails);
        break;
      case 'update':
        result = await sendOrderUpdateEmail(emailDetails, 'printing');
        break;
      case 'shipped':
        result = await sendOrderUpdateEmail(emailDetails, 'shipped', 'TEST-TRACKING-123');
        break;
      case 'pickup':
        result = await sendOrderReadyForPickupEmail(emailDetails);
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: `Email (${type}) sent successfully to ${emailDetails.customerEmail}` });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

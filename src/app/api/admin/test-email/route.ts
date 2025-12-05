import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, sendOrderUpdateEmail, sendOrderReadyForPickupEmail, sendAdminNewOrderEmail } from '@/lib/email';
import { OrderManagerAdmin } from '@/lib/order-manager-admin';

// Mock order data for testing without a real order
const MOCK_ORDER_DATA = {
  id: 'TEST-ORDER-123456',
  customerInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com'
  },
  items: [
    {
      sheetSize: '22x60',
      quantity: 2,
      totalPrice: 45.00,
      unitPrice: 22.50
    },
    {
      sheetSize: '22x24',
      quantity: 1,
      totalPrice: 15.00,
      unitPrice: 15.00
    }
  ],
  total: 67.50,
  subtotal: 60.00,
  tax: 7.50,
  shipping: 0,
  shippingAddress: {
    line1: '123 Test Street',
    city: 'Edmonton',
    state: 'AB',
    postalCode: 'T5T 1T1',
    country: 'CA'
  }
};

export async function POST(request: NextRequest) {
  try {
    const { orderId, type, emailOverride, useMockData } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Missing email type' }, { status: 400 });
    }

    if (!emailOverride) {
      return NextResponse.json({ error: 'Missing recipient email' }, { status: 400 });
    }

    let order;

    if (useMockData) {
      // Use mock data for testing
      order = MOCK_ORDER_DATA;
    } else {
      // Fetch real order
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      const orderManager = new OrderManagerAdmin();
      order = await orderManager.getOrder(orderId);

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    // Prepare email details
    const emailDetails = {
      orderId: order.id || orderId || 'TEST-ORDER-123456',
      customerName: order.customerInfo?.firstName ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : 'Valued Customer',
      customerEmail: emailOverride,
      items: order.items || [],
      total: order.total || 0,
      shippingAddress: (order as any).shippingAddress || (order.customerInfo as any)?.shippingAddress
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
        result = await sendOrderUpdateEmail(emailDetails, 'shipped', 'TEST-TRACKING-123456789');
        break;
      case 'pickup':
        result = await sendOrderReadyForPickupEmail(emailDetails);
        break;
      case 'admin_new_order':
        result = await sendAdminNewOrderEmail(emailDetails, emailOverride);
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test email (${type}) sent to ${emailOverride}` 
      });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

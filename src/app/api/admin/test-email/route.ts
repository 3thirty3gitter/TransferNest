import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/microsoft-graph';
import { getEmailTemplateAdmin } from '@/lib/services/email-template-service-admin';
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

// Helper to process template with variables
async function getProcessedTemplate(templateId: string, variables: Record<string, any>) {
  const template = await getEmailTemplateAdmin(templateId);
  if (!template) return null;

  let html = template.htmlContent;
  let subject = template.subject;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const valStr = value === undefined || value === null ? '' : String(value);
    html = html.replace(regex, valStr);
    subject = subject.replace(regex, valStr);
  });

  return { html, subject };
}

// Build items table HTML
function buildItemsTable(items: any[]): string {
  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr style="border-bottom: 1px solid #d1d5db;">
        <th style="text-align: left; padding: 8px;">Item</th>
        <th style="text-align: right; padding: 8px;">Price</th>
      </tr>
      ${items.map(item => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px;">
            ${item.sheetSize}" Gang Sheet (x${item.quantity})
          </td>
          <td style="text-align: right; padding: 8px;">
            $${(item.totalPrice || 0).toFixed(2)}
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, type, emailOverride, useMockData } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Missing email type' }, { status: 400 });
    }

    if (!emailOverride) {
      return NextResponse.json({ error: 'Missing recipient email' }, { status: 400 });
    }

    let order: any;

    if (useMockData) {
      order = MOCK_ORDER_DATA;
    } else {
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      const orderManager = new OrderManagerAdmin();
      order = await orderManager.getOrder(orderId);

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    const orderIdDisplay = order.id || orderId || 'TEST-ORDER-123456';
    const customerName = order.customerInfo?.firstName 
      ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}` 
      : 'Valued Customer';
    const items = order.items || [];
    const total = order.total || 0;
    const itemsTable = buildItemsTable(items);

    let templateResult;
    let emailSubject: string;
    let emailHtml: string;

    switch (type) {
      case 'confirmation':
        templateResult = await getProcessedTemplate('order_confirmation', {
          customerName,
          orderId: orderIdDisplay,
          itemsTable,
          total: total.toFixed(2)
        });
        if (!templateResult) {
          // Fallback HTML
          emailSubject = `Order Confirmation - #${orderIdDisplay}`;
          emailHtml = `
            <h1>Thank you for your order!</h1>
            <p>Hi ${customerName},</p>
            <p>Your order #${orderIdDisplay} has been confirmed.</p>
            ${itemsTable}
            <p><strong>Total: $${total.toFixed(2)} CAD</strong></p>
            <p>Thank you for choosing DTF Wholesale!</p>
          `;
        } else {
          emailSubject = templateResult.subject;
          emailHtml = templateResult.html;
        }
        break;

      case 'update':
        templateResult = await getProcessedTemplate('order_status_update', {
          customerName,
          orderId: orderIdDisplay,
          statusMessage: 'Your order is now being printed! Our team is ensuring everything looks perfect.',
          status: 'Printing'
        });
        if (!templateResult) {
          emailSubject = `Order Update - #${orderIdDisplay}`;
          emailHtml = `
            <h1>Order Status Update</h1>
            <p>Hi ${customerName},</p>
            <p>Your order #${orderIdDisplay} is now being printed!</p>
            <p>Our team is ensuring everything looks perfect.</p>
          `;
        } else {
          emailSubject = templateResult.subject;
          emailHtml = templateResult.html;
        }
        break;

      case 'shipped':
        const trackingNumber = 'TEST-TRACKING-123456789';
        templateResult = await getProcessedTemplate('order_shipped', {
          customerName,
          orderId: orderIdDisplay,
          trackingNumber,
          trackingUrl: `https://www.canadapost.ca/track-reperage/en#/search?searchFor=${trackingNumber}`
        });
        if (!templateResult) {
          emailSubject = `Your Order Has Shipped! - #${orderIdDisplay}`;
          emailHtml = `
            <h1>Your Order Has Shipped!</h1>
            <p>Hi ${customerName},</p>
            <p>Great news! Your order #${orderIdDisplay} has been shipped.</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          `;
        } else {
          emailSubject = templateResult.subject;
          emailHtml = templateResult.html;
        }
        break;

      case 'pickup':
        templateResult = await getProcessedTemplate('order_ready_pickup', {
          customerName,
          orderId: orderIdDisplay,
          pickupAddress: '201-5415 Calgary Trail NW, Edmonton, AB T6H 4J9',
          pickupHours: 'Monday - Friday: 9am - 5pm'
        });
        if (!templateResult) {
          emailSubject = `Your Order is Ready for Pickup! - #${orderIdDisplay}`;
          emailHtml = `
            <h1>Your Order is Ready!</h1>
            <p>Hi ${customerName},</p>
            <p>Your order #${orderIdDisplay} is ready for pickup!</p>
            <p><strong>Address:</strong> 201-5415 Calgary Trail NW, Edmonton, AB T6H 4J9</p>
            <p><strong>Hours:</strong> Monday - Friday: 9am - 5pm</p>
          `;
        } else {
          emailSubject = templateResult.subject;
          emailHtml = templateResult.html;
        }
        break;

      case 'admin_new_order':
        templateResult = await getProcessedTemplate('admin_new_order', {
          orderId: orderIdDisplay,
          customerName,
          total: total.toFixed(2),
          adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dtf-wholesale.ca'}/admin/jobs/${orderIdDisplay}`
        });
        if (!templateResult) {
          emailSubject = `🆕 New Order Received - #${orderIdDisplay}`;
          emailHtml = `
            <h1>New Order Received!</h1>
            <p>A new order has been placed.</p>
            <p><strong>Order ID:</strong> #${orderIdDisplay}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Total:</strong> $${total.toFixed(2)} CAD</p>
          `;
        } else {
          emailSubject = templateResult.subject;
          emailHtml = templateResult.html;
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Send via Microsoft 365
    await sendEmail(emailOverride, emailSubject, emailHtml);

    return NextResponse.json({ 
      success: true, 
      message: `Test email (${type}) sent to ${emailOverride}` 
    });

  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    }, { status: 500 });
  }
}
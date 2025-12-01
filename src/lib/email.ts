import { Resend } from 'resend';

const getResend = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

export interface EmailOrderDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  total: number;
  shippingAddress?: any;
}

export async function sendOrderConfirmationEmail(details: EmailOrderDetails) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email sending.');
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { orderId, customerName, customerEmail, items, total } = details;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Order Confirmed!</h1>
        <p>Hi ${customerName},</p>
        <p>Thank you for your business! Your order has been received and is being processed.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Summary</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          
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
                  $${item.totalPrice.toFixed(2)}
                </td>
              </tr>
            `).join('')}
            <tr>
              <td style="padding: 8px; font-weight: bold;">Total</td>
              <td style="text-align: right; padding: 8px; font-weight: bold;">$${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p>We will notify you when your order ships.</p>
        
        <p>Best regards,<br/>The DTF Wholesale Team</p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-wholesale.ca>',
      to: [customerEmail],
      subject: `Order Confirmation #${orderId}`,
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNewOrderEmail(details: EmailOrderDetails) {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'Missing API Key' };
  }

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS 
    ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',') 
    : ['admin@dtfwholesale.ca']; // Fallback

  try {
    const { orderId, customerName, total } = details;

    const html = `
      <div style="font-family: sans-serif;">
        <h1>New Order Received!</h1>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/jobs/${orderId}">View Order in Admin Panel</a></p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'DTF Wholesale System <system@dtf-wholesale.ca>',
      to: adminEmails,
      subject: `[New Order] #${orderId} - $${total.toFixed(2)}`,
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending admin email:', error);
    return { success: false, error };
  }
}

export async function sendOrderUpdateEmail(details: EmailOrderDetails, status: string, trackingNumber?: string) {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { orderId, customerName, customerEmail } = details;

    let statusMessage = '';
    let subject = `Order Update #${orderId}`;

    switch (status) {
      case 'printing':
        statusMessage = 'Your order is now being printed! Our team is ensuring everything looks perfect.';
        break;
      case 'shipped':
        statusMessage = 'Great news! Your order has been shipped.';
        subject = `Order Shipped #${orderId}`;
        break;
      case 'completed':
        statusMessage = 'Your order has been marked as completed. Thank you for choosing DTF Wholesale!';
        break;
      default:
        statusMessage = `Your order status has been updated to: ${status}`;
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Order Update</h1>
        <p>Hi ${customerName},</p>
        <p>${statusMessage}</p>
        
        ${trackingNumber ? `
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          </div>
        ` : ''}

        <p>You can check the status of your order at any time by logging into your account.</p>
        
        <p>Best regards,<br/>The DTF Wholesale Team</p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-wholesale.ca>',
      to: [customerEmail],
      subject: subject,
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending update email:', error);
    return { success: false, error };
  }
}

export async function sendOrderReadyForPickupEmail(details: EmailOrderDetails) {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { orderId, customerName, customerEmail } = details;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Ready for Pickup!</h1>
        <p>Hi ${customerName},</p>
        <p>Good news! Your order <strong>#${orderId}</strong> is ready for pickup.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Pickup Location</h3>
          <p>
            DTF Wholesale<br/>
            201-5415 Calgary Trail NW<br/>
            Edmonton, AB T6H 4J9
          </p>
          <p><strong>Hours:</strong> Mon-Fri: 9am - 5pm</p>
        </div>

        <p>Please bring your order number when you come to collect your items.</p>
        
        <p>Best regards,<br/>The DTF Wholesale Team</p>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-wholesale.ca>',
      to: [customerEmail],
      subject: `Ready for Pickup: Order #${orderId}`,
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending pickup email:', error);
    return { success: false, error };
  }
}

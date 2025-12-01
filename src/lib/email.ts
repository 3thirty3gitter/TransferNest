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
      from: 'DTF Wholesale <orders@dtfwholesale.ca>',
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
      from: 'DTF Wholesale System <system@dtfwholesale.ca>',
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

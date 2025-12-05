import { Resend } from 'resend';
import { getEmailTemplateAdmin } from './services/email-template-service-admin';

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

export async function sendOrderConfirmationEmail(details: EmailOrderDetails) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email sending.');
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { orderId, customerName, customerEmail, items, total } = details;

    const itemsTable = `
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
    `;

    const template = await getProcessedTemplate('order_confirmation', {
      orderId,
      customerName,
      total: total.toFixed(2),
      itemsTable
    });

    if (!template) throw new Error('Template not found');

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-canada.ca>',
      to: [customerEmail],
      subject: template.subject,
      html: template.html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNewOrderEmail(details: EmailOrderDetails, recipientOverride?: string) {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'Missing API Key' };
  }

  const adminEmails = recipientOverride 
    ? [recipientOverride]
    : (process.env.NEXT_PUBLIC_ADMIN_EMAILS 
        ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',') 
        : ['admin@dtfwholesale.ca']); // Fallback

  try {
    const { orderId, customerName, total } = details;

    const template = await getProcessedTemplate('admin_new_order', {
      orderId,
      customerName,
      total: total.toFixed(2),
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/jobs/${orderId}`
    });

    if (!template) throw new Error('Template not found');

    const data = await resend.emails.send({
      from: 'DTF Wholesale System <orders@dtf-canada.ca>',
      to: adminEmails,
      subject: template.subject,
      html: template.html,
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

    let templateId = 'order_status_update';
    let statusMessage = '';

    if (status === 'shipped') {
      templateId = 'order_shipped';
    } else {
      switch (status) {
        case 'printing':
          statusMessage = 'Your order is now being printed! Our team is ensuring everything looks perfect.';
          break;
        case 'completed':
          statusMessage = 'Your order has been marked as completed. Thank you for choosing DTF Wholesale!';
          break;
        default:
          statusMessage = `Your order status has been updated to: ${status}`;
      }
    }

    const trackingInfo = trackingNumber ? `
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      </div>
    ` : '';

    const template = await getProcessedTemplate(templateId, {
      orderId,
      customerName,
      statusMessage,
      trackingNumber: trackingNumber || '',
      trackingInfo
    });

    if (!template) throw new Error('Template not found');

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-canada.ca>',
      to: [customerEmail],
      subject: template.subject,
      html: template.html,
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

    const template = await getProcessedTemplate('order_ready_pickup', {
      orderId,
      customerName
    });

    if (!template) throw new Error('Template not found');

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-canada.ca>',
      to: [customerEmail],
      subject: template.subject,
      html: template.html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending pickup email:', error);
    return { success: false, error };
  }
}

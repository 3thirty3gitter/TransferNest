import { Resend } from 'resend';
import { getEmailTemplate } from './services/email-template-service';
import { getFirestore } from './firebase-admin';

const getResend = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

interface NotificationSettings {
  orderNotificationEmail: string;
  generalInquiryEmail: string;
  notifyOnOrderPlaced: boolean;
  notifyOnPaymentReceived: boolean;
  notifyOnGeneralInquiry: boolean;
}

async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const db = getFirestore();
    const settingsDoc = await db.collection('settings').doc('company-settings').get();
    
    if (!settingsDoc.exists) {
      return null;
    }
    
    const data = settingsDoc.data();
    return data?.notifications || null;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }
}

export interface EmailOrderDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  total: number;
  shippingAddress?: any;
  deliveryMethod?: 'shipping' | 'pickup';
}

async function getProcessedTemplate(templateId: string, variables: Record<string, any>) {
  const template = await getEmailTemplate(templateId);
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
    const { orderId, customerName, customerEmail, items, total, deliveryMethod } = details;

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

    // Determine which template to use based on delivery method
    const templateId = deliveryMethod === 'pickup' ? 'order_confirmation_pickup' : 'order_confirmation';

    const template = await getProcessedTemplate(templateId, {
      orderId,
      customerName,
      total: total.toFixed(2),
      itemsTable
    });

    if (!template) throw new Error('Template not found');

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-wholesale.ca>',
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

export async function sendAdminNewOrderEmail(details: EmailOrderDetails) {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'Missing API Key' };
  }

  // Fetch notification settings from Firestore
  const notificationSettings = await getNotificationSettings();
  
  // Check if notifications are enabled
  if (notificationSettings && !notificationSettings.notifyOnOrderPlaced) {
    console.log('[EMAIL] Order placed notifications disabled, skipping admin email');
    return { success: true, data: null, skipped: true };
  }
  
  // Build recipient list from settings
  const adminEmails: string[] = [];
  
  // Add order notification email from settings if configured
  if (notificationSettings?.orderNotificationEmail) {
    adminEmails.push(notificationSettings.orderNotificationEmail);
  }
  
  // Fallback to environment variable if no target email configured
  if (adminEmails.length === 0) {
    const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    if (envEmails) {
      adminEmails.push(...envEmails.split(',').map(e => e.trim()));
    }
  }
  
  // Final fallback
  if (adminEmails.length === 0) {
    console.warn('[EMAIL] No admin email configured for notifications');
    return { success: false, error: 'No admin email configured' };
  }

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
      from: 'DTF Wholesale System <system@dtf-wholesale.ca>',
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

export async function sendOrderUpdateEmail(details: EmailOrderDetails, status: string, trackingNumber?: string, trackingUrl?: string) {
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
        ${trackingUrl ? `<p><a href="${trackingUrl}" style="color: #3b82f6;">Track Package</a></p>` : ''}
      </div>
    ` : '';

    const template = await getProcessedTemplate(templateId, {
      orderId,
      customerName,
      statusMessage,
      trackingNumber: trackingNumber || '',
      trackingUrl: trackingUrl || '',
      trackingInfo
    });

    if (!template) throw new Error('Template not found');

    const data = await resend.emails.send({
      from: 'DTF Wholesale <orders@dtf-wholesale.ca>',
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

export async function sendOrderShippedEmail(details: EmailOrderDetails, trackingNumber: string, trackingUrl: string) {
  return sendOrderUpdateEmail(details, 'shipped', trackingNumber, trackingUrl);
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
      from: 'DTF Wholesale <orders@dtf-wholesale.ca>',
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

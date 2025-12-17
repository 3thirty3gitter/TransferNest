import { sendEmail } from './microsoft-graph';
import { getEmailTemplateAdmin } from './services/email-template-service-admin';

export interface EmailOrderDetails {
  orderId: string;
  orderNumber?: string; // Custom order number (e.g., DTFW-1110)
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
  try {
    const { orderId, orderNumber, customerName, customerEmail, items, total } = details;
    const displayOrderNumber = orderNumber || orderId.slice(-8).toUpperCase();

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
              $${(item.totalPrice || item.pricing?.total || 0).toFixed(2)}
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
      orderNumber: displayOrderNumber,
      customerName,
      total: total.toFixed(2),
      itemsTable
    });

    if (!template) {
      // Fallback HTML if no template
      const fallbackHtml = `
        <h1>Thank you for your order!</h1>
        <p>Hi ${customerName},</p>
        <p>Your order #${displayOrderNumber} has been confirmed.</p>
        ${itemsTable}
        <p>Thank you for choosing DTF Wholesale!</p>
      `;
      await sendEmail(customerEmail, `Order Confirmation - #${displayOrderNumber}`, fallbackHtml);
    } else {
      await sendEmail(customerEmail, template.subject, template.html);
    }

    console.log('[EMAIL] Order confirmation sent to:', customerEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNewOrderEmail(details: EmailOrderDetails, recipientOverride?: string) {
  console.log('[EMAIL] sendAdminNewOrderEmail called with:', {
    orderId: details.orderId,
    orderNumber: details.orderNumber,
    customerName: details.customerName,
    recipientOverride
  });
  
  const adminEmails = recipientOverride 
    ? [recipientOverride]
    : (process.env.NEXT_PUBLIC_ADMIN_EMAILS 
        ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',') 
        : ['orders@dtf-wholesale.ca']); // Fallback

  console.log('[EMAIL] Admin emails resolved to:', adminEmails);

  try {
    const { orderId, orderNumber, customerName, total } = details;
    const displayOrderNumber = orderNumber || orderId.slice(-8).toUpperCase();

    const template = await getProcessedTemplate('admin_new_order', {
      orderId,
      orderNumber: displayOrderNumber,
      customerName,
      total: total.toFixed(2),
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/jobs/${orderId}`
    });

    const fallbackHtml = `
      <h1>🆕 New Order Received!</h1>
      <p><strong>Order:</strong> #${displayOrderNumber}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Total:</strong> $${total.toFixed(2)} CAD</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/jobs/${orderId}">View Order in Admin</a></p>
    `;

    // Send to each admin email
    for (const email of adminEmails) {
      if (template) {
        await sendEmail(email.trim(), template.subject, template.html);
      } else {
        await sendEmail(email.trim(), `🆕 New Order - #${displayOrderNumber}`, fallbackHtml);
      }
    }

    console.log('[EMAIL] Admin notification sent to:', adminEmails.join(', '));
    return { success: true };
  } catch (error) {
    console.error('Error sending admin email:', error);
    return { success: false, error };
  }
}

export async function sendOrderUpdateEmail(details: EmailOrderDetails, status: string, trackingNumber?: string) {
  try {
    const { orderId, orderNumber, customerName, customerEmail } = details;
    const displayOrderNumber = orderNumber || orderId.slice(-8).toUpperCase();

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
      orderNumber: displayOrderNumber,
      customerName,
      statusMessage,
      trackingNumber: trackingNumber || '',
      trackingInfo
    });

    if (!template) {
      const fallbackHtml = `
        <h1>Order Update</h1>
        <p>Hi ${customerName},</p>
        <p>Your order #${displayOrderNumber} has been updated.</p>
        <p>${statusMessage}</p>
        ${trackingInfo}
      `;
      await sendEmail(customerEmail, `Order Update - #${displayOrderNumber}`, fallbackHtml);
    } else {
      await sendEmail(customerEmail, template.subject, template.html);
    }

    console.log('[EMAIL] Order update sent to:', customerEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending update email:', error);
    return { success: false, error };
  }
}

export async function sendOrderReadyForPickupEmail(details: EmailOrderDetails) {
  try {
    const { orderId, orderNumber, customerName, customerEmail } = details;
    const displayOrderNumber = orderNumber || orderId.slice(-8).toUpperCase();

    const template = await getProcessedTemplate('order_ready_pickup', {
      orderId,
      orderNumber: displayOrderNumber,
      customerName
    });

    if (!template) {
      const fallbackHtml = `
        <h1>Your Order is Ready for Pickup!</h1>
        <p>Hi ${customerName},</p>
        <p>Great news! Your order #${displayOrderNumber} is ready for pickup.</p>
        <p><strong>Address:</strong> 201-5415 Calgary Trail NW, Edmonton, AB T6H 4J9</p>
        <p><strong>Hours:</strong> Monday - Friday: 9am - 5pm</p>
      `;
      await sendEmail(customerEmail, `Your Order is Ready! - #${displayOrderNumber}`, fallbackHtml);
    } else {
      await sendEmail(customerEmail, template.subject, template.html);
    }

    console.log('[EMAIL] Pickup notification sent to:', customerEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending pickup email:', error);
    return { success: false, error };
  }
}

// Abandoned Cart Recovery Email
export interface AbandonedCartEmailDetails {
  email: string;
  customerName?: string;
  items: any[];
  estimatedTotal: number;
  emailType: 'first' | 'second' | 'final';
  cartId: string;
}

export async function sendAbandonedCartRecoveryEmail(details: AbandonedCartEmailDetails) {
  try {
    const { email, customerName, items, estimatedTotal, emailType, cartId } = details;
    const name = customerName || 'Valued Customer';
    
    // Different messaging based on email type
    const emailContent = getAbandonedCartEmailContent(emailType, name, items, estimatedTotal);
    
    // Try to use template, fallback to built-in
    const template = await getProcessedTemplate(`abandoned_cart_${emailType}`, {
      customerName: name,
      itemCount: items?.length || 0,
      estimatedTotal: estimatedTotal.toFixed(2),
      cartId
    });

    const html = template?.html || emailContent.html;
    const subject = template?.subject || emailContent.subject;

    await sendEmail(email, subject, html);
    
    console.log(`[EMAIL] Abandoned cart ${emailType} email sent to:`, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    return { success: false, error };
  }
}

function getAbandonedCartEmailContent(
  emailType: 'first' | 'second' | 'final',
  customerName: string,
  items: any[],
  estimatedTotal: number
) {
  const itemsHtml = items && items.length > 0 
    ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${items.map(item => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px;">
              <strong>${item.name || 'Gang Sheet'}</strong><br/>
              <span style="color: #6b7280; font-size: 14px;">
                ${item.sheetSize || ''}" sheet • ${item.placedItemsCount || 0} items
              </span>
            </td>
            <td style="padding: 12px; text-align: right;">
              $${(item.estimatedPrice || 0).toFixed(2)}
            </td>
          </tr>
        `).join('')}
        <tr>
          <td style="padding: 12px; font-weight: bold;">Total</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">
            $${estimatedTotal.toFixed(2)}
          </td>
        </tr>
      </table>
    `
    : '';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dtfwhiz.com';
  
  const contents = {
    first: {
      subject: 'Did you forget something? Your gang sheet is waiting!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Hi ${customerName}! 👋</h1>
          <p style="font-size: 16px; color: #334155;">
            We noticed you created an amazing gang sheet but didn't complete your order. 
            Don't worry - your design is still waiting for you!
          </p>
          ${itemsHtml}
          <p style="font-size: 16px; color: #334155;">
            Ready to finish your order? Click below to pick up where you left off.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/cart" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Complete My Order
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b;">
            Questions? Reply to this email or contact us at orders@dtf-wholesale.ca
          </p>
        </div>
      `
    },
    second: {
      subject: 'Your gang sheet misses you! 🎨',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Still thinking it over, ${customerName}?</h1>
          <p style="font-size: 16px; color: #334155;">
            Your custom gang sheet is still saved and ready to print. 
            We don't want you to miss out on your awesome design!
          </p>
          ${itemsHtml}
          <p style="font-size: 16px; color: #334155;">
            <strong>Need help?</strong> Our team is here to answer any questions about 
            DTF printing, sizing, or anything else.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/cart" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Return to My Cart
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b;">
            <strong>Fast Turnaround:</strong> Orders placed by 2pm ship same day!
          </p>
        </div>
      `
    },
    final: {
      subject: 'Last chance! Your gang sheet will expire soon ⏰',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Final reminder, ${customerName}!</h1>
          <p style="font-size: 16px; color: #334155;">
            Your custom gang sheet is about to expire. This is your last chance 
            to complete your order before we clear it from our system.
          </p>
          ${itemsHtml}
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              ⚠️ <strong>Don't lose your work!</strong> Complete your order now to 
              preserve your gang sheet design.
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/cart" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Complete Order Now
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b;">
            If you have any issues, please reach out to us at orders@dtf-wholesale.ca
          </p>
        </div>
      `
    }
  };

  return contents[emailType];
}

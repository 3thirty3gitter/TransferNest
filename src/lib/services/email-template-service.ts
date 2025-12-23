import { getFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  description?: string;
  variables: string[];
  updatedAt: Date;
}

const COLLECTION = 'email_templates';

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation (Shipping)',
    subject: 'Order Confirmed, thank you! #{{orderId}}',
    description: 'Sent to customer when order is placed (Shipping)',
    variables: ['customerName', 'orderId', 'total', 'itemsTable', 'shippingAddress'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3b82f6;">Order Confirmed, thank you!</h1>
  <p>Hi {{customerName}},</p>
  <p>Thank you for your business! Your order has been received and is being processed.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0;">Order Summary</h2>
    <p><strong>Order ID:</strong> {{orderId}}</p>
    
    {{itemsTable}}
    
    <p style="margin-top: 10px; font-size: 1.1em;"><strong>Total: \${{total}}</strong></p>
  </div>

  <p>We will notify you when your order ships.</p>
  
  <p>Best regards,<br/>The DTF Wholesale Team</p>
</div>`,
    updatedAt: new Date()
  },
  {
    id: 'order_confirmation_pickup',
    name: 'Order Confirmation (Pickup)',
    subject: 'Order Confirmed, thank you! #{{orderId}}',
    description: 'Sent to customer when order is placed (Pickup)',
    variables: ['customerName', 'orderId', 'total', 'itemsTable'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3b82f6;">Order Confirmed, thank you!</h1>
  <p>Hi {{customerName}},</p>
  <p>Thank you for your business! Your order has been received and is being processed.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0;">Order Summary</h2>
    <p><strong>Order ID:</strong> {{orderId}}</p>
    
    {{itemsTable}}
    
    <p style="margin-top: 10px; font-size: 1.1em;"><strong>Total: \${{total}}</strong></p>
  </div>

  <p>We will notify you when your order is ready for pickup.</p>
  
  <p>Best regards,<br/>The DTF Wholesale Team</p>
</div>`,
    updatedAt: new Date()
  },
  {
    id: 'admin_new_order',
    name: 'Admin New Order Notification',
    subject: '[New Order] #{{orderId}} - \${{total}}',
    description: 'Sent to admin when new order is placed',
    variables: ['orderId', 'customerName', 'total', 'adminUrl'],
    htmlContent: `<div style="font-family: sans-serif;">
  <h1>New Order Received!</h1>
  <p><strong>Order ID:</strong> {{orderId}}</p>
  <p><strong>Customer:</strong> {{customerName}}</p>
  <p><strong>Total:</strong> \${{total}}</p>
  <p><a href="{{adminUrl}}">View Order in Admin Panel</a></p>
</div>`,
    updatedAt: new Date()
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    subject: 'Your order is shipped #{{orderId}}',
    description: 'Sent when order status changes to shipped',
    variables: ['customerName', 'orderId', 'trackingNumber', 'trackingUrl'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3b82f6;">Your order is shipped!</h1>
  <p>Hi {{customerName}},</p>
  <p>Great news! Your order #{{orderId}} has been shipped.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
    <p><a href="{{trackingUrl}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Track Your Package</a></p>
  </div>

  <p>You can check the status of your order at any time by logging into your account.</p>
  
  <p>Best regards,<br/>The DTF Wholesale Team</p>
</div>`,
    updatedAt: new Date()
  },
  {
    id: 'order_status_update',
    name: 'Order Status Update',
    subject: 'Order Update #{{orderId}}',
    description: 'Sent for general status updates (Printing, Completed, etc.)',
    variables: ['customerName', 'orderId', 'statusMessage', 'trackingInfo'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3b82f6;">Order Update</h1>
  <p>Hi {{customerName}},</p>
  <p>{{statusMessage}}</p>
  
  {{trackingInfo}}

  <p>You can check the status of your order at any time by logging into your account.</p>
  
  <p>Best regards,<br/>The DTF Wholesale Team</p>
</div>`,
    updatedAt: new Date()
  },
  {
    id: 'order_ready_pickup',
    name: 'Ready for Pickup',
    subject: 'Your order is ready for pickup: Order #{{orderId}}',
    description: 'Sent when order is marked ready for pickup',
    variables: ['customerName', 'orderId'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #10b981;">Your order is ready for pickup!</h1>
  <p>Hi {{customerName}},</p>
  <p>Good news! Your order <strong>#{{orderId}}</strong> is ready for pickup.</p>
  
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
</div>`,
    updatedAt: new Date()
  },
  // Cart Recovery Emails - Professional Table-Based HTML
  {
    id: 'cart_recovery_1',
    name: 'Cart Recovery - First Reminder',
    subject: 'You left something behind! 🛒',
    description: 'Sent 1 hour after cart abandonment - friendly first reminder',
    variables: ['firstName', 'customerName', 'cartItemsTable', 'cartTotal', 'recoveryUrl', 'companyName', 'supportEmail', 'logoUrl', 'websiteUrl'],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You left something behind!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 40px 30px 40px;">
              <a href="{{websiteUrl}}" style="text-decoration: none;">
                <img src="{{logoUrl}}" alt="{{companyName}}" width="200" style="max-width: 200px; height: auto; display: block;">
              </a>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.3;">
                Hey {{firstName}}! 👋
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                We noticed you were working on some awesome DTF transfers but didn't complete your order. No worries – your cart is still waiting for you!
              </p>
            </td>
          </tr>
          
          <!-- Cart Items Section -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a2e;">
                      🛒 Your Cart
                    </h2>
                    {{cartItemsTable}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 16px;">
                      <tr>
                        <td style="font-size: 18px; font-weight: 700; color: #1a1a2e;">
                          Estimated Total:
                        </td>
                        <td align="right" style="font-size: 24px; font-weight: 700; color: #0066cc;">
                          ${'$'}{{cartTotal}} CAD
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); border-radius: 8px;">
                    <a href="{{recoveryUrl}}" style="display: inline-block; padding: 16px 48px; font-size: 18px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">
                      Complete Your Order →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Help Section -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #718096; text-align: center;">
                Questions about our DTF transfers? Just reply to this email or contact us at
                <a href="mailto:{{supportEmail}}" style="color: #0066cc; text-decoration: none; font-weight: 500;">{{supportEmail}}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 30px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                      {{companyName}}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                      Premium DTF Transfers in Canada
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    updatedAt: new Date()
  },
  {
    id: 'cart_recovery_2',
    name: 'Cart Recovery - Second Reminder',
    subject: 'Still thinking about your DTF transfers? 💭',
    description: 'Sent 24 hours after first email - friendly follow-up',
    variables: ['firstName', 'customerName', 'cartItemsTable', 'cartTotal', 'recoveryUrl', 'companyName', 'supportEmail', 'logoUrl', 'websiteUrl'],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Still thinking it over?</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 40px 30px 40px;">
              <a href="{{websiteUrl}}" style="text-decoration: none;">
                <img src="{{logoUrl}}" alt="{{companyName}}" width="200" style="max-width: 200px; height: auto; display: block;">
              </a>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.3;">
                Still thinking it over, {{firstName}}? 💭
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                Just wanted to check in! Your custom DTF transfers are still saved and ready to go whenever you are.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                We know choosing the right print provider is a big decision. If there's anything we can help with – questions about sizing, turnaround times, or the printing process – we're here for you!
              </p>
            </td>
          </tr>
          
          <!-- Why Choose Us Section -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 8px; border-left: 4px solid #0066cc;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">
                      💡 Why customers love our DTF transfers:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #334155;">✓ Vibrant, long-lasting colors</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #334155;">✓ Easy heat-press application</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #334155;">✓ Fast turnaround on custom orders</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #334155;">✓ No minimum order requirements</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Cart Items Section -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a2e;">
                      🛒 Your Saved Cart
                    </h2>
                    {{cartItemsTable}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 16px;">
                      <tr>
                        <td style="font-size: 18px; font-weight: 700; color: #1a1a2e;">
                          Total:
                        </td>
                        <td align="right" style="font-size: 24px; font-weight: 700; color: #0066cc;">
                          ${'$'}{{cartTotal}} CAD
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); border-radius: 8px;">
                    <a href="{{recoveryUrl}}" style="display: inline-block; padding: 16px 48px; font-size: 18px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">
                      Complete Your Order →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Help Section -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #718096; text-align: center;">
                Have questions? Just hit reply – we'd love to help! Or reach us at
                <a href="mailto:{{supportEmail}}" style="color: #0066cc; text-decoration: none; font-weight: 500;">{{supportEmail}}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 30px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                      {{companyName}}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                      Premium DTF Transfers in Canada
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    updatedAt: new Date()
  },
  {
    id: 'cart_recovery_3',
    name: 'Cart Recovery - Final Reminder',
    subject: "We'd hate to see you go! 💙",
    description: 'Sent 72 hours after second email - final friendly reminder',
    variables: ['firstName', 'customerName', 'cartItemsTable', 'cartTotal', 'recoveryUrl', 'companyName', 'supportEmail', 'logoUrl', 'websiteUrl'],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>We'd hate to see you go!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 40px 30px 40px;">
              <a href="{{websiteUrl}}" style="text-decoration: none;">
                <img src="{{logoUrl}}" alt="{{companyName}}" width="200" style="max-width: 200px; height: auto; display: block;">
              </a>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.3;">
                {{firstName}}, we'd hate to see you go! 💙
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                This is just a final, friendly reminder that your custom DTF transfers are still waiting for you. We understand life gets busy, but we wanted to make sure you didn't forget about them!
              </p>
            </td>
          </tr>
          
          <!-- Urgency Notice -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0; font-size: 15px; color: #92400e; line-height: 1.5;">
                      <strong>⏰ Just a heads up:</strong><br>
                      After this reminder, we won't send any more emails about this cart. If you're still interested, now's a great time to complete your order!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Cart Items Section -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a2e;">
                      🛒 Your Saved Cart
                    </h2>
                    {{cartItemsTable}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 16px;">
                      <tr>
                        <td style="font-size: 18px; font-weight: 700; color: #1a1a2e;">
                          Total:
                        </td>
                        <td align="right" style="font-size: 24px; font-weight: 700; color: #0066cc;">
                          ${'$'}{{cartTotal}} CAD
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Personal Message -->
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                {{firstName}}, if something is holding you back – pricing questions, sizing concerns, or anything else – we're genuinely here to help. Just reply to this email!
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); border-radius: 8px;">
                    <a href="{{recoveryUrl}}" style="display: inline-block; padding: 16px 48px; font-size: 18px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">
                      Complete Your Order →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Help Section -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #718096; text-align: center;">
                Thanks for considering us, {{firstName}}! We hope to see you soon. 🙂<br><br>
                Questions? <a href="mailto:{{supportEmail}}" style="color: #0066cc; text-decoration: none; font-weight: 500;">{{supportEmail}}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 30px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                      {{companyName}}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                      Premium DTF Transfers in Canada
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    updatedAt: new Date()
  }
];

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const db = getFirestore();
  try {
    const snapshot = await db.collection(COLLECTION).get();
    
    // Get existing template IDs
    const existingIds = new Set(snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.id));
    
    // Find missing default templates
    const missingTemplates = DEFAULT_TEMPLATES.filter(t => !existingIds.has(t.id));
    
    // Add any missing default templates
    if (missingTemplates.length > 0) {
      const batch = db.batch();
      missingTemplates.forEach(t => {
        const docRef = db.collection(COLLECTION).doc(t.id);
        batch.set(docRef, {
          ...t,
          updatedAt: Timestamp.fromDate(t.updatedAt)
        });
      });
      await batch.commit();
      console.log(`[EmailTemplates] Added ${missingTemplates.length} missing templates: ${missingTemplates.map(t => t.id).join(', ')}`);
    }
    
    // Re-fetch if we added new templates, otherwise use existing
    if (missingTemplates.length > 0) {
      const updatedSnapshot = await db.collection(COLLECTION).get();
      return updatedSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as EmailTemplate[];
    }
    
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as EmailTemplate[];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

export async function saveEmailTemplate(template: EmailTemplate): Promise<void> {
  const db = getFirestore();
  await db.collection(COLLECTION).doc(template.id).set({
    ...template,
    updatedAt: Timestamp.now()
  });
}

export async function resetEmailTemplate(id: string): Promise<void> {
  const db = getFirestore();
  const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
  if (!defaultTemplate) throw new Error('Default template not found');
  
  await db.collection(COLLECTION).doc(id).set({
    ...defaultTemplate,
    updatedAt: Timestamp.now()
  });
}

// Reset all recovery email templates to defaults
export async function resetAllRecoveryTemplates(): Promise<void> {
  const db = getFirestore();
  const recoveryTemplateIds = ['cart_recovery_1', 'cart_recovery_2', 'cart_recovery_3'];
  
  for (const id of recoveryTemplateIds) {
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) {
      await db.collection(COLLECTION).doc(id).set({
        ...defaultTemplate,
        updatedAt: Timestamp.now()
      });
    }
  }
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  const db = getFirestore();
  try {
    const docSnap = await db.collection(COLLECTION).doc(id).get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        updatedAt: data?.updatedAt?.toDate() || new Date()
      } as EmailTemplate;
    }
    
    // Fallback to default if not in DB
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) return defaultTemplate;
    
    return null;
  } catch (error) {
    console.error(`Error fetching template ${id}:`, error);
    return null;
  }
}

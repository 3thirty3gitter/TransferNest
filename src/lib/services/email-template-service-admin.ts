/**
 * Server-side email template service using Firebase Admin SDK
 * For use in API routes
 */

import { getFirestore } from '@/lib/firebase-admin';

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

// Default templates - fallback if not in Firestore
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmation #{{orderId}}',
    description: 'Sent to customer when order is placed',
    variables: ['customerName', 'orderId', 'total', 'itemsTable', 'shippingAddress'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3b82f6;">Order Confirmed!</h1>
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
    subject: 'Order Shipped #{{orderId}}',
    description: 'Sent when order status changes to shipped',
    variables: ['customerName', 'orderId', 'trackingNumber'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3b82f6;">Order Shipped!</h1>
  <p>Hi {{customerName}},</p>
  <p>Great news! Your order #{{orderId}} has been shipped.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
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
    subject: 'Ready for Pickup: Order #{{orderId}}',
    description: 'Sent when order is marked ready for pickup',
    variables: ['customerName', 'orderId'],
    htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #10b981;">Ready for Pickup!</h1>
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
  }
];

export async function getEmailTemplateAdmin(id: string): Promise<EmailTemplate | null> {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        updatedAt: data?.updatedAt?.toDate() || new Date()
      } as EmailTemplate;
    }
    
    // Fallback to default if not in DB
    console.log(`[EMAIL TEMPLATE] Template ${id} not in Firestore, using default`);
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) return defaultTemplate;
    
    console.error(`[EMAIL TEMPLATE] Template ${id} not found in defaults either`);
    return null;
  } catch (error) {
    console.error(`[EMAIL TEMPLATE] Error fetching template ${id}:`, error);
    // On error, try to return default template
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) {
      console.log(`[EMAIL TEMPLATE] Using default template for ${id} due to error`);
      return defaultTemplate;
    }
    return null;
  }
}

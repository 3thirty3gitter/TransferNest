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
  // Cart Recovery Emails
  {
    id: 'cart_recovery_1',
    name: 'Cart Recovery - First Reminder',
    subject: 'You left something behind! 🛒',
    description: 'Sent 1 hour after cart abandonment - friendly first reminder',
    variables: ['firstName', 'customerName', 'cartItemsTable', 'cartTotal', 'recoveryUrl', 'companyName', 'supportEmail'],
    htmlContent: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0066cc; margin: 0;">{{companyName}}</h1>
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">Hey {{firstName}}! 👋</h2>
  
  <p>{{firstName}}, we noticed you were working on some awesome DTF transfers but didn't complete your order. No worries – your cart is still waiting for you!</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Cart:</h3>
    {{cartItemsTable}}
    <p style="margin-top: 15px; font-size: 18px;"><strong>Estimated Total: ${'$'}{{cartTotal}} CAD</strong></p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{recoveryUrl}}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Complete Your Order →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    If you have any questions about our DTF transfers or need help with your order, just reply to this email or contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">{{companyName}}</p>
</div>`,
    updatedAt: new Date()
  },
  {
    id: 'cart_recovery_2',
    name: 'Cart Recovery - Second Reminder',
    subject: 'Still thinking about your DTF transfers? 💭',
    description: 'Sent 24 hours after first email - friendly follow-up',
    variables: ['firstName', 'customerName', 'cartItemsTable', 'cartTotal', 'recoveryUrl', 'companyName', 'supportEmail'],
    htmlContent: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0066cc; margin: 0;">{{companyName}}</h1>
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">Hey {{firstName}}, still thinking it over? 💭</h2>
  
  <p>{{firstName}}, we just wanted to check in! Your custom DTF transfers are still saved and ready to go whenever you are.</p>
  
  <p>We know choosing the right print provider is a big decision. If there's anything we can help with – questions about sizing, turnaround times, or the printing process – we're here for you!</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Saved Cart:</h3>
    {{cartItemsTable}}
    <p style="margin-top: 15px; font-size: 18px;"><strong>Total: ${'$'}{{cartTotal}} CAD</strong></p>
  </div>
  
  <div style="background: #e3f2fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; color: #1565c0;">
      <strong>💡 Why customers love our DTF transfers:</strong><br>
      • Vibrant, long-lasting colors<br>
      • Easy heat-press application<br>
      • Fast turnaround on custom orders<br>
      • No minimum order requirements
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{recoveryUrl}}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Complete Your Order →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    Have questions? Just hit reply – {{firstName}}, we'd love to help! Or reach us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">{{companyName}}</p>
</div>`,
    updatedAt: new Date()
  },
  {
    id: 'cart_recovery_3',
    name: 'Cart Recovery - Final Reminder',
    subject: "We'd hate to see you go! 💙",
    description: 'Sent 72 hours after second email - final friendly reminder',
    variables: ['firstName', 'customerName', 'cartItemsTable', 'cartTotal', 'recoveryUrl', 'companyName', 'supportEmail'],
    htmlContent: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0066cc; margin: 0;">{{companyName}}</h1>
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">{{firstName}}, we'd hate to see you go! 💙</h2>
  
  <p>This is just a final, friendly reminder that your custom DTF transfers are still waiting for you. We understand life gets busy, but we wanted to make sure you didn't forget about them!</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Saved Cart:</h3>
    {{cartItemsTable}}
    <p style="margin-top: 15px; font-size: 18px;"><strong>Total: ${'$'}{{cartTotal}} CAD</strong></p>
  </div>
  
  <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; color: #7c6800;">
      <strong>⏰ Just a heads up:</strong><br>
      After this reminder, we won't send any more emails about this cart. If you're still interested, now's a great time to complete your order!
    </p>
  </div>
  
  <p>{{firstName}}, if something is holding you back – pricing questions, sizing concerns, or anything else – we're genuinely here to help. Just reply to this email!</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{recoveryUrl}}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Complete Your Order →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    Thanks for considering us, {{firstName}}! We hope to see you soon. 🙂<br><br>
    Questions? <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">{{companyName}}</p>
</div>`,
    updatedAt: new Date()
  }
];

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const db = getFirestore();
  try {
    const snapshot = await db.collection(COLLECTION).get();
    if (snapshot.empty) {
      // Seed defaults if empty
      const batch = db.batch();
      DEFAULT_TEMPLATES.forEach(t => {
        const docRef = db.collection(COLLECTION).doc(t.id);
        batch.set(docRef, {
          ...t,
          updatedAt: Timestamp.fromDate(t.updatedAt)
        });
      });
      await batch.commit();
      return DEFAULT_TEMPLATES;
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

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';

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

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    if (snapshot.empty) {
      // Seed defaults if empty
      await Promise.all(DEFAULT_TEMPLATES.map(t => 
        setDoc(doc(db, COLLECTION, t.id), {
          ...t,
          updatedAt: Timestamp.fromDate(t.updatedAt)
        })
      ));
      return DEFAULT_TEMPLATES;
    }
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as EmailTemplate[];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

export async function saveEmailTemplate(template: EmailTemplate): Promise<void> {
  await setDoc(doc(db, COLLECTION, template.id), {
    ...template,
    updatedAt: Timestamp.now()
  });
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id,
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
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

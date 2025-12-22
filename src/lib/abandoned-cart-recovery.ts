/**
 * Abandoned Cart Recovery Engine
 * 
 * Handles automated recovery emails with personal touch:
 * - Email 1 (after 1 hour): Friendly reminder
 * - Email 2 (after 24 hours): Second gentle reminder
 * - Email 3 (after 72 hours): Final reminder (optional)
 */

import { getFirestore } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/microsoft-graph';
import { 
  AbandonedCart, 
  getCartsNeedingRecovery, 
  recordRecoveryEmail 
} from '@/lib/abandoned-carts';
import { getEmailTemplate } from '@/lib/services/email-template-service';

// ============ Types ============

export interface RecoveryEmailConfig {
  enabled: boolean;
  
  // Email 1: Friendly reminder (no discount)
  email1: {
    enabled: boolean;
    delayHours: number;  // Hours after cart abandonment
    subject: string;
  };
  
  // Email 2: Reminder with discount
  email2: {
    enabled: boolean;
    delayHours: number;  // Hours after email 1
    subject: string;
    discountPercent: number;  // e.g., 10 for 10%
    discountValidDays: number;  // How long the code is valid
  };
  
  // Email 3: Final reminder with bigger discount (optional)
  email3: {
    enabled: boolean;
    delayHours: number;  // Hours after email 2
    subject: string;
    discountPercent: number;  // e.g., 15 for 15%
    discountValidDays: number;
  };
  
  // Branding
  companyName: string;
  companyLogo?: string;
  supportEmail: string;
  websiteUrl: string;
}

export interface RecoveryResult {
  processed: number;
  emailsSent: number;
  errors: string[];
  details: Array<{
    cartId: string;
    email: string;
    emailType: 'first' | 'second' | 'final';
    success: boolean;
    error?: string;
    discountCode?: string;
  }>;
}

// Default configuration
export const DEFAULT_RECOVERY_CONFIG: RecoveryEmailConfig = {
  enabled: true,
  email1: {
    enabled: true,
    delayHours: 1,
    subject: "You left something behind! 🛒",
  },
  email2: {
    enabled: true,
    delayHours: 24,
    subject: "Still thinking about your DTF transfers? 💭",
    discountPercent: 0,
    discountValidDays: 0,
  },
  email3: {
    enabled: true,
    delayHours: 72,
    subject: "We'd hate to see you go! 💙",
    discountPercent: 0,
    discountValidDays: 0,
  },
  companyName: "DTF Wholesale",
  supportEmail: "hello@dtf-wholesale.ca",
  websiteUrl: "https://dtf-wholesale.ca",
};

// ============ Discount Code Generation ============

/**
 * Cancel any existing recovery discount codes for a cart
 */
async function cancelPreviousRecoveryDiscounts(cartId: string): Promise<number> {
  const db = getFirestore();
  
  // Find all active recovery discounts for this cart
  const existingDiscounts = await db.collection('discounts')
    .where('abandonedCartId', '==', cartId)
    .where('isActive', '==', true)
    .get();
  
  let cancelledCount = 0;
  
  for (const doc of existingDiscounts.docs) {
    await doc.ref.update({
      isActive: false,
      cancelledAt: new Date(),
      cancelReason: 'Superseded by newer recovery discount',
      updatedAt: new Date(),
    });
    cancelledCount++;
    console.log(`[RECOVERY] Cancelled previous discount: ${doc.data().code}`);
  }
  
  return cancelledCount;
}

/**
 * Generate a unique discount code for cart recovery
 * Automatically cancels any previous recovery discounts for this cart
 */
export async function generateRecoveryDiscountCode(
  cartId: string,
  discountPercent: number,
  validDays: number,
  emailType: 'second' | 'final'
): Promise<string> {
  const db = getFirestore();
  
  // Cancel any previous recovery discounts for this cart
  const cancelledCount = await cancelPreviousRecoveryDiscounts(cartId);
  if (cancelledCount > 0) {
    console.log(`[RECOVERY] Cancelled ${cancelledCount} previous discount(s) for cart ${cartId}`);
  }
  
  // Generate unique code: RECOVER-{percentage}-{random}
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `RECOVER${discountPercent}-${randomPart}`;
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (validDays * 24 * 60 * 60 * 1000));
  
  // Create the discount in Firestore (using admin SDK)
  const discountData = {
    code: code,
    description: `Cart Recovery - ${discountPercent}% off (${emailType} email)`,
    type: 'percentage',
    value: discountPercent,
    
    // No minimum order
    minimumOrderAmount: 0,
    
    // Single use
    maxUses: 1,
    maxUsesPerCustomer: 1,
    currentUses: 0,
    
    // Validity
    isActive: true,
    startDate: now,
    endDate: expiresAt,
    
    // Restrictions
    firstOrderOnly: false,
    combinable: false,
    excludeSaleItems: false,
    
    // Tracking
    createdAt: now,
    updatedAt: now,
    createdBy: 'system-recovery',
    
    // Link to abandoned cart
    abandonedCartId: cartId,
    recoveryEmailType: emailType,
    
    // Stats
    totalSavingsGiven: 0,
  };
  
  await db.collection('discounts').doc(code).set(discountData);
  
  console.log(`[RECOVERY] Created discount code: ${code} (${discountPercent}% off, expires ${expiresAt.toISOString()})`);
  
  return code;
}

// ============ Email Templates ============

function getRecoveryUrl(config: RecoveryEmailConfig, cartId: string): string {
  return `${config.websiteUrl}/recover-cart/${cartId}`;
}

// Generate cart items HTML table
function generateCartItemsTable(items: AbandonedCart['items']): string {
  if (!items || items.length === 0) {
    return '<p style="color: #666;">Your cart items are waiting for you!</p>';
  }
  
  const rows = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.thumbnailUrl ? `<img src="${item.thumbnailUrl}" alt="${item.name || 'Item'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name || 'DTF Transfer'}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.imageCount || 0} images • ${item.sheetSize || '?'}" sheet</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.estimatedPrice || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `<table style="width: 100%; border-collapse: collapse;">${rows}</table>`;
}

// Generate email from database template with variable substitution
async function generateEmailFromTemplate(
  templateId: 'cart_recovery_1' | 'cart_recovery_2' | 'cart_recovery_3',
  cart: AbandonedCart,
  config: RecoveryEmailConfig
): Promise<{ subject: string; html: string } | null> {
  try {
    const template = await getEmailTemplate(templateId);
    if (!template) {
      console.error(`[RECOVERY] Template ${templateId} not found, falling back to hardcoded`);
      return null;
    }

    const recoveryUrl = getRecoveryUrl(config, cart.id);
    const firstName = cart.customerName ? cart.customerName.split(' ')[0] : 'there';
    const cartItemsTable = generateCartItemsTable(cart.items);
    const cartTotal = (cart.estimatedTotal || 0).toFixed(2);

    // Variable substitutions
    const variables: Record<string, string> = {
      firstName,
      customerName: cart.customerName || 'Valued Customer',
      cartItemsTable,
      cartTotal,
      recoveryUrl,
      companyName: config.companyName,
      supportEmail: config.supportEmail,
      websiteUrl: config.websiteUrl,
    };

    // Replace all variables in the template
    let htmlContent = template.htmlContent;
    let subject = template.subject;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    // Wrap in email HTML structure
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  ${htmlContent}
</body>
</html>
    `.trim();

    return { subject, html };
  } catch (error) {
    console.error(`[RECOVERY] Error generating email from template ${templateId}:`, error);
    return null;
  }
}

function generateEmail1Template(
  cart: AbandonedCart,
  config: RecoveryEmailConfig
): string {
  const recoveryUrl = getRecoveryUrl(config, cart.id);
  const items = cart.items || [];
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.thumbnailUrl ? `<img src="${item.thumbnailUrl}" alt="${item.name || 'Item'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name || 'DTF Transfer'}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.imageCount || 0} images • ${item.sheetSize || '?'}" sheet</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.estimatedPrice || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    ${config.companyLogo ? `<img src="${config.companyLogo}" alt="${config.companyName}" style="max-height: 60px;">` : `<h1 style="color: #0066cc; margin: 0;">${config.companyName}</h1>`}
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">Hey${cart.customerName ? ` ${cart.customerName.split(' ')[0]}` : ' there'}! 👋</h2>
  
  <p>${cart.customerName ? `${cart.customerName.split(' ')[0]}, we` : 'We'} noticed you were working on some awesome DTF transfers but didn't complete your order. No worries – your cart is still waiting for you!</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Cart:</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding: 12px; font-weight: bold;">Estimated Total:</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #0066cc;">
          $${(cart.estimatedTotal || 0).toFixed(2)} CAD
        </td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${recoveryUrl}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Complete Your Order →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    If you have any questions about our DTF transfers or need help with your order, just reply to this email or contact us at <a href="mailto:${config.supportEmail}">${config.supportEmail}</a>.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    ${config.companyName}<br>
    <a href="${config.websiteUrl}" style="color: #0066cc;">${config.websiteUrl.replace('https://', '')}</a>
  </p>
  
</body>
</html>
  `;
}

function generateEmail2Template(
  cart: AbandonedCart,
  config: RecoveryEmailConfig
): string {
  const recoveryUrl = getRecoveryUrl(config, cart.id);
  const items = cart.items || [];
  const firstName = cart.customerName ? cart.customerName.split(' ')[0] : '';
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.thumbnailUrl ? `<img src="${item.thumbnailUrl}" alt="${item.name || 'Item'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name || 'DTF Transfer'}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.imageCount || 0} images • ${item.sheetSize || '?'}" sheet</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.estimatedPrice || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    ${config.companyLogo ? `<img src="${config.companyLogo}" alt="${config.companyName}" style="max-height: 60px;">` : `<h1 style="color: #0066cc; margin: 0;">${config.companyName}</h1>`}
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">${firstName ? `Hey ${firstName}` : 'Hey there'}, still thinking it over? 💭</h2>
  
  <p>${firstName ? `${firstName}, we` : 'We'} just wanted to check in! Your custom DTF transfers are still saved and ready to go whenever you are.</p>
  
  <p>We know choosing the right print provider is a big decision. If there's anything we can help with – questions about sizing, turnaround times, or the printing process – we're here for you!</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Saved Cart:</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding: 12px; font-weight: bold;">Total:</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #0066cc;">
          $${(cart.estimatedTotal || 0).toFixed(2)} CAD
        </td>
      </tr>
    </table>
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
    <a href="${recoveryUrl}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Complete Your Order →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    Have questions? Just hit reply – ${firstName ? `${firstName}, ` : ''}we'd love to help! Or reach us at <a href="mailto:${config.supportEmail}">${config.supportEmail}</a>.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    ${config.companyName}<br>
    <a href="${config.websiteUrl}" style="color: #0066cc;">${config.websiteUrl.replace('https://', '')}</a>
  </p>
  
</body>
</html>
  `;
}

function generateEmail3Template(
  cart: AbandonedCart,
  config: RecoveryEmailConfig
): string {
  const recoveryUrl = getRecoveryUrl(config, cart.id);
  const items = cart.items || [];
  const firstName = cart.customerName ? cart.customerName.split(' ')[0] : '';
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.thumbnailUrl ? `<img src="${item.thumbnailUrl}" alt="${item.name || 'Item'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name || 'DTF Transfer'}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.imageCount || 0} images • ${item.sheetSize || '?'}" sheet</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.estimatedPrice || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    ${config.companyLogo ? `<img src="${config.companyLogo}" alt="${config.companyName}" style="max-height: 60px;">` : `<h1 style="color: #0066cc; margin: 0;">${config.companyName}</h1>`}
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">${firstName ? `${firstName}, we` : 'We'}'d hate to see you go! 💙</h2>
  
  <p>This is just a final, friendly reminder that your custom DTF transfers are still waiting for you. We understand life gets busy, but we wanted to make sure you didn't forget about them!</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Saved Cart:</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding: 12px; font-weight: bold;">Total:</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #0066cc;">
          $${(cart.estimatedTotal || 0).toFixed(2)} CAD
        </td>
      </tr>
    </table>
  </div>
  
  <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; color: #7c6800;">
      <strong>⏰ Just a heads up:</strong><br>
      After this reminder, we won't send any more emails about this cart. If you're still interested, now's a great time to complete your order!
    </p>
  </div>
  
  <p>${firstName ? `${firstName}, if` : 'If'} something is holding you back – pricing questions, sizing concerns, or anything else – we're genuinely here to help. Just reply to this email!</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${recoveryUrl}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Complete Your Order →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    Thanks for considering us${firstName ? `, ${firstName}` : ''}! We hope to see you soon. 🙂<br><br>
    Questions? <a href="mailto:${config.supportEmail}">${config.supportEmail}</a>
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    ${config.companyName}<br>
    <a href="${config.websiteUrl}" style="color: #0066cc;">${config.websiteUrl.replace('https://', '')}</a>
  </p>
  
</body>
</html>
  `;
}

// ============ Main Recovery Function ============

/**
 * Process all abandoned carts that need recovery emails
 * This should be called by a cron job every hour
 */
export async function processAbandonedCartRecovery(
  config: RecoveryEmailConfig = DEFAULT_RECOVERY_CONFIG
): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    processed: 0,
    emailsSent: 0,
    errors: [],
    details: [],
  };

  if (!config.enabled) {
    console.log('[RECOVERY] Recovery emails are disabled');
    return result;
  }

  try {
    const cartsNeedingRecovery = await getCartsNeedingRecovery();
    console.log(`[RECOVERY] Found ${cartsNeedingRecovery.length} carts needing recovery`);

    for (const cart of cartsNeedingRecovery) {
      result.processed++;
      
      try {
        let emailType: 'first' | 'second' | 'final';
        let emailHtml: string;
        let subject: string;
        let templateId: 'cart_recovery_1' | 'cart_recovery_2' | 'cart_recovery_3';

        // Determine which email to send (no discount codes - just friendly reminders)
        if (cart.recoveryEmailsSent === 0 && config.email1.enabled) {
          emailType = 'first';
          templateId = 'cart_recovery_1';
          subject = config.email1.subject;
        } else if (cart.recoveryEmailsSent === 1 && config.email2.enabled) {
          emailType = 'second';
          templateId = 'cart_recovery_2';
          subject = config.email2.subject;
        } else if (cart.recoveryEmailsSent === 2 && config.email3.enabled) {
          emailType = 'final';
          templateId = 'cart_recovery_3';
          subject = config.email3.subject;
        } else {
          // Skip this cart
          continue;
        }

        // Try to get email from database template first
        const templateEmail = await generateEmailFromTemplate(templateId, cart, config);
        
        if (templateEmail) {
          emailHtml = templateEmail.html;
          // Subject was already set from config above, keep it or use template subject as fallback
          if (!subject) {
            subject = templateEmail.subject;
          }
        } else {
          // Fallback to hardcoded templates
          if (emailType === 'first') {
            emailHtml = generateEmail1Template(cart, config);
          } else if (emailType === 'second') {
            emailHtml = generateEmail2Template(cart, config);
          } else {
            emailHtml = generateEmail3Template(cart, config);
          }
        }

        // Send the email
        await sendEmail(cart.email!, subject, emailHtml);
        
        // Record that we sent the email (no discount code)
        await recordRecoveryEmail(cart.id, emailType);
        
        result.emailsSent++;
        result.details.push({
          cartId: cart.id,
          email: cart.email!,
          emailType,
          success: true,
        });
        
        console.log(`[RECOVERY] Sent ${emailType} email to ${cart.email} for cart ${cart.id}`);

      } catch (error: any) {
        const errorMsg = `Failed to send email for cart ${cart.id}: ${error.message}`;
        result.errors.push(errorMsg);
        result.details.push({
          cartId: cart.id,
          email: cart.email || 'unknown',
          emailType: 'first',
          success: false,
          error: error.message,
        });
        console.error(`[RECOVERY] ${errorMsg}`);
      }
    }

  } catch (error: any) {
    result.errors.push(`Recovery processing error: ${error.message}`);
    console.error(`[RECOVERY] Processing error:`, error);
  }

  console.log(`[RECOVERY] Complete: ${result.emailsSent} emails sent, ${result.errors.length} errors`);
  return result;
}

// ============ Configuration Management ============

/**
 * Get recovery configuration from Firestore
 */
export async function getRecoveryConfig(): Promise<RecoveryEmailConfig> {
  try {
    const db = getFirestore();
    const doc = await db.collection('settings').doc('abandonedCartRecovery').get();
    
    if (doc.exists) {
      return { ...DEFAULT_RECOVERY_CONFIG, ...doc.data() } as RecoveryEmailConfig;
    }
  } catch (error) {
    console.error('[RECOVERY] Error getting config:', error);
  }
  
  return DEFAULT_RECOVERY_CONFIG;
}

/**
 * Save recovery configuration to Firestore
 */
export async function saveRecoveryConfig(config: Partial<RecoveryEmailConfig>): Promise<void> {
  const db = getFirestore();
  await db.collection('settings').doc('abandonedCartRecovery').set(
    { ...config, updatedAt: new Date() },
    { merge: true }
  );
}

// ============ Manual Recovery ============

/**
 * Send a recovery email manually to a specific cart
 * Note: Discount codes have been removed - emails are now personal reminders only
 */
export async function sendManualRecoveryEmail(
  cartId: string,
  emailType: 'first' | 'second' | 'final'
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getFirestore();
    const cartDoc = await db.collection('abandonedCarts').doc(cartId).get();
    
    if (!cartDoc.exists) {
      return { success: false, error: 'Cart not found' };
    }
    
    const cart = { id: cartDoc.id, ...cartDoc.data() } as AbandonedCart;
    
    if (!cart.email) {
      return { success: false, error: 'No email address for this cart' };
    }
    
    const config = await getRecoveryConfig();
    let emailHtml: string;
    let subject: string;
    
    // Map email type to template ID
    const templateId: 'cart_recovery_1' | 'cart_recovery_2' | 'cart_recovery_3' = 
      emailType === 'first' ? 'cart_recovery_1' :
      emailType === 'second' ? 'cart_recovery_2' : 'cart_recovery_3';
    
    // Try to get email from database template first
    const templateEmail = await generateEmailFromTemplate(templateId, cart, config);
    
    if (templateEmail) {
      emailHtml = templateEmail.html;
      // Use subject from admin config (allows override), fallback to template subject
      if (emailType === 'first') {
        subject = config.email1.subject || templateEmail.subject;
      } else if (emailType === 'second') {
        subject = config.email2.subject || templateEmail.subject;
      } else {
        subject = config.email3.subject || templateEmail.subject;
      }
    } else {
      // Fallback to hardcoded templates
      if (emailType === 'first') {
        subject = config.email1.subject;
        emailHtml = generateEmail1Template(cart, config);
      } else if (emailType === 'second') {
        subject = config.email2.subject;
        emailHtml = generateEmail2Template(cart, config);
      } else {
        subject = config.email3.subject;
        emailHtml = generateEmail3Template(cart, config);
      }
    }
    
    await sendEmail(cart.email, subject, emailHtml);
    await recordRecoveryEmail(cart.id, emailType);
    
    console.log(`[RECOVERY] Successfully sent ${emailType} email to ${cart.email}`);
    return { success: true };
    
  } catch (error: any) {
    console.error('[RECOVERY] sendManualRecoveryEmail error:', error?.message || error);
    console.error('[RECOVERY] Error stack:', error?.stack);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

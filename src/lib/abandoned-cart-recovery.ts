/**
 * Abandoned Cart Recovery Engine
 * 
 * Handles automated recovery emails with escalating incentives:
 * - Email 1 (after 1 hour): Friendly reminder
 * - Email 2 (after 24 hours): Reminder with discount offer
 * - Email 3 (after 72 hours): Final reminder with bigger discount (optional)
 */

import { getFirestore } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/microsoft-graph';
import { 
  AbandonedCart, 
  getCartsNeedingRecovery, 
  recordRecoveryEmail 
} from '@/lib/abandoned-carts';

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
    subject: "Still thinking about it? Here's 10% off! 🎉",
    discountPercent: 10,
    discountValidDays: 7,
  },
  email3: {
    enabled: true,
    delayHours: 72,
    subject: "Last chance! 15% off your DTF order 🔥",
    discountPercent: 15,
    discountValidDays: 3,
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

function generateEmail1Template(
  cart: AbandonedCart,
  config: RecoveryEmailConfig
): string {
  const itemsHtml = cart.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.thumbnailUrl ? `<img src="${item.thumbnailUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.imageCount} images • ${item.sheetSize}" sheet</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.estimatedPrice.toFixed(2)}
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
  
  <h2 style="color: #333; margin-bottom: 20px;">Hey${cart.customerName ? ` ${cart.customerName.split(' ')[0]}` : ''}! 👋</h2>
  
  <p>We noticed you were working on some awesome DTF transfers but didn't complete your order. No worries – your cart is still waiting for you!</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Cart:</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding: 12px; font-weight: bold;">Estimated Total:</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #0066cc;">
          $${cart.estimatedTotal.toFixed(2)} CAD
        </td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${config.websiteUrl}/cart" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
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
  config: RecoveryEmailConfig,
  discountCode: string
): string {
  const itemsHtml = cart.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.imageCount} images • ${item.sheetSize}" sheet</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.estimatedPrice.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const discountAmount = cart.estimatedTotal * (config.email2.discountPercent / 100);
  const newTotal = cart.estimatedTotal - discountAmount;

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
  
  <!-- Discount Banner -->
  <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px 0; font-size: 28px;">🎉 ${config.email2.discountPercent}% OFF Your Order!</h2>
    <p style="margin: 0; opacity: 0.9;">Use code at checkout:</p>
    <div style="background: rgba(255,255,255,0.2); border: 2px dashed rgba(255,255,255,0.5); border-radius: 6px; padding: 12px 24px; margin-top: 12px; display: inline-block;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${discountCode}</span>
    </div>
    <p style="margin: 12px 0 0 0; font-size: 14px; opacity: 0.8;">
      Expires in ${config.email2.discountValidDays} days
    </p>
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">Still thinking about it${cart.customerName ? `, ${cart.customerName.split(' ')[0]}` : ''}?</h2>
  
  <p>We get it – sometimes you need a little extra time. But your custom DTF transfers are too good to leave behind! Here's a special discount just for you.</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Cart:</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px; color: #666;">Original Total:</td>
        <td style="padding: 12px; text-align: right; color: #666; text-decoration: line-through;">
          $${cart.estimatedTotal.toFixed(2)} CAD
        </td>
      </tr>
      <tr>
        <td style="padding: 12px; color: #28a745; font-weight: bold;">Your Discount (${config.email2.discountPercent}% off):</td>
        <td style="padding: 12px; text-align: right; color: #28a745; font-weight: bold;">
          -$${discountAmount.toFixed(2)} CAD
        </td>
      </tr>
      <tr style="background: #e8f5e9;">
        <td style="padding: 12px; font-weight: bold; font-size: 18px;">New Total:</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #0066cc;">
          $${newTotal.toFixed(2)} CAD
        </td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${config.websiteUrl}/cart" style="display: inline-block; background: #28a745; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
      Claim Your ${config.email2.discountPercent}% Discount →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">
    Questions? Just reply to this email or contact us at <a href="mailto:${config.supportEmail}">${config.supportEmail}</a>.
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
  config: RecoveryEmailConfig,
  discountCode: string
): string {
  const discountAmount = cart.estimatedTotal * (config.email3.discountPercent / 100);
  const newTotal = cart.estimatedTotal - discountAmount;

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
  
  <!-- Urgency Banner -->
  <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px 0; font-size: 24px;">⏰ Last Chance! ${config.email3.discountPercent}% OFF</h2>
    <p style="margin: 0; font-size: 16px;">This is our final offer – don't miss out!</p>
    <div style="background: rgba(255,255,255,0.2); border: 2px dashed rgba(255,255,255,0.5); border-radius: 6px; padding: 12px 24px; margin-top: 12px; display: inline-block;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${discountCode}</span>
    </div>
    <p style="margin: 12px 0 0 0; font-size: 14px; opacity: 0.9;">
      ⚡ Expires in ${config.email3.discountValidDays} days – Act now!
    </p>
  </div>
  
  <h2 style="color: #333; margin-bottom: 20px;">This is it${cart.customerName ? `, ${cart.customerName.split(' ')[0]}` : ''}! 🔥</h2>
  
  <p>Your custom DTF transfers are still waiting, and we really don't want you to miss out. This is our <strong>best offer</strong> – ${config.email3.discountPercent}% off your entire order!</p>
  
  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; color: #856404;">
      <strong>⚡ Why order now?</strong><br>
      • Premium DTF transfers with vibrant colors<br>
      • Fast turnaround on custom gang sheets<br>
      • Easy heat-press application<br>
      • Your biggest discount yet: <strong>${config.email3.discountPercent}% off!</strong>
    </p>
  </div>
  
  <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 8px 0; color: #666;">Your Total with Discount:</p>
    <p style="margin: 0;">
      <span style="text-decoration: line-through; color: #999; font-size: 18px;">$${cart.estimatedTotal.toFixed(2)}</span>
      <span style="font-size: 32px; font-weight: bold; color: #28a745; margin-left: 12px;">$${newTotal.toFixed(2)} CAD</span>
    </p>
    <p style="margin: 8px 0 0 0; color: #28a745; font-weight: bold;">You save $${discountAmount.toFixed(2)}!</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${config.websiteUrl}/cart" style="display: inline-block; background: #dc3545; color: white; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 18px;">
      🛒 Complete My Order Now
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px; text-align: center;">
    This is our final reminder. After this, your cart items may not be saved.<br>
    Questions? Contact us at <a href="mailto:${config.supportEmail}">${config.supportEmail}</a>
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
        let discountCode: string | undefined;

        // Determine which email to send
        if (cart.recoveryEmailsSent === 0 && config.email1.enabled) {
          emailType = 'first';
          subject = config.email1.subject;
          emailHtml = generateEmail1Template(cart, config);
        } else if (cart.recoveryEmailsSent === 1 && config.email2.enabled) {
          emailType = 'second';
          subject = config.email2.subject;
          // Generate discount code for email 2
          discountCode = await generateRecoveryDiscountCode(
            cart.id,
            config.email2.discountPercent,
            config.email2.discountValidDays,
            'second'
          );
          emailHtml = generateEmail2Template(cart, config, discountCode);
        } else if (cart.recoveryEmailsSent === 2 && config.email3.enabled) {
          emailType = 'final';
          subject = config.email3.subject;
          // Generate bigger discount code for email 3
          discountCode = await generateRecoveryDiscountCode(
            cart.id,
            config.email3.discountPercent,
            config.email3.discountValidDays,
            'final'
          );
          emailHtml = generateEmail3Template(cart, config, discountCode);
        } else {
          // Skip this cart
          continue;
        }

        // Send the email
        await sendEmail(cart.email!, subject, emailHtml);
        
        // Record that we sent the email
        await recordRecoveryEmail(cart.id, emailType, discountCode);
        
        result.emailsSent++;
        result.details.push({
          cartId: cart.id,
          email: cart.email!,
          emailType,
          success: true,
          discountCode,
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
 */
export async function sendManualRecoveryEmail(
  cartId: string,
  emailType: 'first' | 'second' | 'final',
  customDiscountPercent?: number
): Promise<{ success: boolean; error?: string; discountCode?: string }> {
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
    let discountCode: string | undefined;
    
    if (emailType === 'first') {
      subject = config.email1.subject;
      emailHtml = generateEmail1Template(cart, config);
    } else if (emailType === 'second') {
      const discountPercent = customDiscountPercent || config.email2.discountPercent;
      discountCode = await generateRecoveryDiscountCode(
        cart.id,
        discountPercent,
        config.email2.discountValidDays,
        'second'
      );
      subject = config.email2.subject;
      emailHtml = generateEmail2Template(
        cart, 
        { ...config, email2: { ...config.email2, discountPercent } },
        discountCode
      );
    } else {
      const discountPercent = customDiscountPercent || config.email3.discountPercent;
      discountCode = await generateRecoveryDiscountCode(
        cart.id,
        discountPercent,
        config.email3.discountValidDays,
        'final'
      );
      subject = config.email3.subject;
      emailHtml = generateEmail3Template(
        cart,
        { ...config, email3: { ...config.email3, discountPercent } },
        discountCode
      );
    }
    
    await sendEmail(cart.email, subject, emailHtml);
    await recordRecoveryEmail(cart.id, emailType, discountCode);
    
    console.log(`[RECOVERY] Successfully sent ${emailType} email to ${cart.email}`);
    return { success: true, discountCode };
    
  } catch (error: any) {
    console.error('[RECOVERY] sendManualRecoveryEmail error:', error?.message || error);
    console.error('[RECOVERY] Error stack:', error?.stack);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

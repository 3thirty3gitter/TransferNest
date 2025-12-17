import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { getAbandonedCart, recordRecoveryEmail } from '@/lib/abandoned-carts';
import { sendAbandonedCartRecoveryEmail } from '@/lib/email';

/**
 * POST /api/admin/abandoned-carts/send-recovery
 * Send a recovery email for an abandoned cart
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cartId, emailType } = await request.json();

    if (!cartId || !emailType) {
      return NextResponse.json(
        { error: 'cartId and emailType are required' },
        { status: 400 }
      );
    }

    if (!['first', 'second', 'final'].includes(emailType)) {
      return NextResponse.json(
        { error: 'emailType must be first, second, or final' },
        { status: 400 }
      );
    }

    // Get the cart
    const cart = await getAbandonedCart(cartId);
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (!cart.email) {
      return NextResponse.json(
        { error: 'Cart has no email address' },
        { status: 400 }
      );
    }

    if (cart.recovered) {
      return NextResponse.json(
        { error: 'Cart has already been recovered' },
        { status: 400 }
      );
    }

    // Check if this email type was already sent (based on email count)
    const emailTypeIndex: Record<string, number> = { first: 1, second: 2, final: 3 };
    if (cart.recoveryEmailsSent >= emailTypeIndex[emailType]) {
      return NextResponse.json(
        { error: `${emailType} email was already sent` },
        { status: 400 }
      );
    }

    // Send the recovery email
    const result = await sendAbandonedCartRecoveryEmail({
      email: cart.email,
      customerName: cart.customerName,
      items: cart.items,
      estimatedTotal: cart.estimatedTotal,
      emailType,
      cartId
    });

    if (result.success) {
      // Record the email was sent
      await recordRecoveryEmail(cartId, emailType);
      
      return NextResponse.json({ 
        success: true, 
        message: `${emailType} recovery email sent to ${cart.email}`
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[ADMIN] Error sending recovery email:', error);
    return NextResponse.json(
      { error: 'Failed to send recovery email' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { getAbandonedCart } from '@/lib/abandoned-carts';
import { sendManualRecoveryEmail } from '@/lib/abandoned-cart-recovery';

/**
 * POST /api/admin/abandoned-carts/send-recovery
 * Send a recovery email for an abandoned cart
 * Now uses the recovery engine with discount code generation
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cartId, emailType, customDiscountPercent } = await request.json();

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

    // Get the cart to validate it exists
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

    // Send the recovery email using the new recovery engine
    const result = await sendManualRecoveryEmail(
      cartId, 
      emailType as 'first' | 'second' | 'final',
      customDiscountPercent
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `${emailType} recovery email sent to ${cart.email}`,
        discountCode: result.discountCode
      });
    } else {
      console.error('[ADMIN] Recovery email failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[ADMIN] Error sending recovery email:', error?.message || error);
    console.error('[ADMIN] Stack:', error?.stack);
    return NextResponse.json(
      { error: 'Failed to send recovery email', details: error?.message },
      { status: 500 }
    );
  }
}

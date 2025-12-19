import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCart } from '@/lib/abandoned-carts';

/**
 * GET /api/abandoned-carts/restore/[cartId]
 * Returns the cart items for a given abandoned cart ID
 * Used by the recovery flow to restore the cart
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;
    
    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID is required' }, { status: 400 });
    }
    
    const cart = await getAbandonedCart(cartId);
    
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }
    
    if (cart.recovered) {
      return NextResponse.json({ 
        error: 'This cart has already been recovered',
        recovered: true,
        orderId: cart.recoveredOrderId
      }, { status: 400 });
    }
    
    // Return the cart items and any discount code
    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        items: cart.items,
        estimatedTotal: cart.estimatedTotal,
        email: cart.email,
        customerName: cart.customerName,
        // Include recovery email history to get the discount code
        lastDiscountCode: cart.recoveryEmailHistory?.slice(-1)[0]?.discountCode,
      }
    });
    
  } catch (error: any) {
    console.error('[CART_RESTORE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to restore cart', details: error?.message },
      { status: 500 }
    );
  }
}

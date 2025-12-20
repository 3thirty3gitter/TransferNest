import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCart } from '@/lib/abandoned-carts';
import { getFirestore } from '@/lib/firebase-admin';

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
    
    // Mark the cart as being restored (track the recovery attempt)
    try {
      const db = getFirestore();
      await db.collection('abandonedCarts').doc(cartId).update({
        lastRestoredAt: new Date(),
        restoreCount: (cart as any).restoreCount ? (cart as any).restoreCount + 1 : 1,
      });
    } catch (updateError) {
      console.warn('[CART_RESTORE] Failed to update restore tracking:', updateError);
      // Continue anyway - don't block the restore
    }
    
    // Log recovery data availability
    const firstItem = cart.items?.[0];
    console.log('[CART_RESTORE] Restoring cart:', {
      cartId,
      itemCount: cart.items?.length || 0,
      hasFullData: !!(firstItem?.images?.length),
      hasPlacedItems: !!(firstItem?.placedItems?.length),
      hasLayout: !!firstItem?.layout,
    });
    
    // Return the cart items with FULL recovery data (images, placedItems, layout, pricing)
    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        items: cart.items,  // Now includes full recovery data
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

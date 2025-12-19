import { NextRequest, NextResponse } from 'next/server';
import { 
  upsertAbandonedCart, 
  updateCartStage, 
  markCartAsRecovered,
  getAbandonedCart,
  type AbandonmentStage,
  type AbandonedCartItem 
} from '@/lib/abandoned-carts';

/**
 * API endpoint to track abandoned carts
 * Called from client-side when users interact with the nesting tool and cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, ...data } = body;

    console.log('[ABANDONED_CART_API] Received request:', { action, sessionId, hasData: !!data });

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    switch (action) {
      case 'track': {
        // Track/update cart state
        try {
          console.log('[ABANDONED_CART_API] Calling upsertAbandonedCart...');
          const cartId = await upsertAbandonedCart(sessionId, {
            userId: data.userId,
            email: data.email,
            customerName: data.customerName,
            phone: data.phone,
            items: data.items as AbandonedCartItem[],
            estimatedTotal: data.estimatedTotal || 0,
            stage: data.stage as AbandonmentStage,
            stageDetails: data.stageDetails,
            referrer: data.referrer,
            userAgent: data.userAgent,
          });
          
          console.log('[ABANDONED_CART_API] Successfully created/updated cart:', cartId);
          return NextResponse.json({ success: true, cartId });
        } catch (trackError: any) {
          console.error('[ABANDONED_CART_API] Track error:', trackError?.message || trackError);
          console.error('[ABANDONED_CART_API] Track error stack:', trackError?.stack);
          // Return success anyway - abandoned cart tracking should not block the user
          return NextResponse.json({ success: true, cartId: null, warning: 'tracking_failed', error: trackError?.message });
        }
      }

      case 'stage': {
        // Update just the stage
        try {
          await updateCartStage(
            sessionId, 
            data.stage as AbandonmentStage, 
            data.details
          );
          
          return NextResponse.json({ success: true });
        } catch (stageError: any) {
          console.error('[ABANDONED_CART_API] Stage update error:', stageError?.message || stageError);
          return NextResponse.json({ success: true, warning: 'stage_update_failed', error: stageError?.message });
        }
      }

      case 'recovered': {
        // Mark as recovered (order completed)
        try {
          await markCartAsRecovered(sessionId, data.orderId);
          
          return NextResponse.json({ success: true });
        } catch (recoveredError: any) {
          console.error('[ABANDONED_CART_API] Recovery mark error:', recoveredError?.message || recoveredError);
          return NextResponse.json({ success: true, warning: 'recovery_mark_failed', error: recoveredError?.message });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[ABANDONED_CART_API] Request error:', error?.message || error);
    // Return success to not block users - tracking is non-critical
    return NextResponse.json(
      { success: true, warning: 'tracking_unavailable', error: error?.message },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('id');

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 });
    }

    const cart = await getAbandonedCart(cartId);
    
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('[ABANDONED_CART] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    );
  }
}

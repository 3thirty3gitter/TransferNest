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

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    switch (action) {
      case 'track': {
        // Track/update cart state
        try {
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
          
          return NextResponse.json({ success: true, cartId });
        } catch (trackError) {
          console.error('[ABANDONED_CART] Track error:', trackError);
          // Return success anyway - abandoned cart tracking should not block the user
          return NextResponse.json({ success: true, cartId: null, warning: 'tracking_failed' });
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
        } catch (stageError) {
          console.error('[ABANDONED_CART] Stage update error:', stageError);
          return NextResponse.json({ success: true, warning: 'stage_update_failed' });
        }
      }

      case 'recovered': {
        // Mark as recovered (order completed)
        try {
          await markCartAsRecovered(sessionId, data.orderId);
          
          return NextResponse.json({ success: true });
        } catch (recoveredError) {
          console.error('[ABANDONED_CART] Recovery mark error:', recoveredError);
          return NextResponse.json({ success: true, warning: 'recovery_mark_failed' });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[ABANDONED_CART] Error:', error);
    // Return success to not block users - tracking is non-critical
    return NextResponse.json(
      { success: true, warning: 'tracking_unavailable' },
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

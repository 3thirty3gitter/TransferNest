import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { getAbandonedCarts, type AbandonmentStage, type AbandonedCart } from '@/lib/abandoned-carts';

/**
 * Convert Firestore Timestamps to ISO strings for JSON serialization
 */
function serializeCart(cart: AbandonedCart): any {
  const convertTimestamp = (ts: any): string | null => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
    if (ts._seconds !== undefined) return new Date(ts._seconds * 1000).toISOString();
    if (ts.seconds !== undefined) return new Date(ts.seconds * 1000).toISOString();
    if (ts instanceof Date) return ts.toISOString();
    return ts; // Already a string
  };

  return {
    ...cart,
    createdAt: convertTimestamp(cart.createdAt),
    updatedAt: convertTimestamp(cart.updatedAt),
    lastActivityAt: convertTimestamp(cart.lastActivityAt),
    abandonedAt: convertTimestamp(cart.abandonedAt),
    lastRecoveryEmailAt: convertTimestamp(cart.lastRecoveryEmailAt),
    recoveredAt: convertTimestamp(cart.recoveredAt),
    recoveryEmailHistory: cart.recoveryEmailHistory?.map(email => ({
      ...email,
      sentAt: convertTimestamp(email.sentAt),
    })),
  };
}

/**
 * GET /api/admin/abandoned-carts
 * Fetch abandoned carts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') as AbandonmentStage | null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const recoveredOnly = searchParams.get('recovered') === 'true';

    const carts = await getAbandonedCarts({
      stage: stage || undefined,
      recovered: recoveredOnly ? true : undefined,
      limit
    });

    // Serialize timestamps to ISO strings for proper JSON handling
    const serializedCarts = carts.map(serializeCart);

    return NextResponse.json({ success: true, carts: serializedCarts });
  } catch (error) {
    console.error('[ADMIN] Error fetching abandoned carts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abandoned carts' },
      { status: 500 }
    );
  }
}

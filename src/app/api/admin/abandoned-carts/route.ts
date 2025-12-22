import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { getAbandonedCarts, type AbandonmentStage } from '@/lib/abandoned-carts';

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

    return NextResponse.json({ success: true, carts });
  } catch (error) {
    console.error('[ADMIN] Error fetching abandoned carts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abandoned carts' },
      { status: 500 }
    );
  }
}

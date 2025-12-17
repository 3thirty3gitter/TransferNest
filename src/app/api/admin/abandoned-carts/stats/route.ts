import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { getAbandonedCartStats } from '@/lib/abandoned-carts';

/**
 * GET /api/admin/abandoned-carts/stats
 * Get abandoned cart statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getAbandonedCartStats();

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('[ADMIN] Error fetching abandoned cart stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

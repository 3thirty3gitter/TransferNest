import { NextRequest, NextResponse } from 'next/server';
import { validateDiscountCode, recordDiscountUsage } from '@/lib/discounts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      orderTotal,
      itemCount,
      customerId,
      customerOrderCount,
      productIds,
      sheetSizes
    } = body;

    // Validate required fields
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Discount code is required' },
        { status: 400 }
      );
    }

    if (typeof orderTotal !== 'number' || orderTotal < 0) {
      return NextResponse.json(
        { valid: false, message: 'Invalid order total' },
        { status: 400 }
      );
    }

    // Validate the discount code
    const result = await validateDiscountCode(
      code,
      orderTotal,
      itemCount || 1,
      customerId,
      customerOrderCount,
      productIds,
      sheetSizes
    );

    // Return validation result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}

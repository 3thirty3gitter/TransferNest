import { NextRequest, NextResponse } from 'next/server';
import { sendManualRecoveryEmail } from '@/lib/abandoned-cart-recovery';

/**
 * API endpoint for sending manual recovery emails from admin panel
 * Note: Emails are now personal reminders without discount codes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, emailType } = body;
    
    if (!cartId) {
      return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
    }
    
    if (!emailType || !['first', 'second', 'final'].includes(emailType)) {
      return NextResponse.json({ error: 'Valid emailType is required (first, second, or final)' }, { status: 400 });
    }
    
    console.log(`[MANUAL_RECOVERY] Sending ${emailType} email for cart ${cartId}`);
    
    const result = await sendManualRecoveryEmail(
      cartId, 
      emailType as 'first' | 'second' | 'final'
    );
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `${emailType} recovery email sent successfully`
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('[MANUAL_RECOVERY] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

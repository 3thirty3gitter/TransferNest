import { NextRequest, NextResponse } from 'next/server';
import { 
  processAbandonedCartRecovery, 
  getRecoveryConfig,
  saveRecoveryConfig,
  type RecoveryEmailConfig 
} from '@/lib/abandoned-cart-recovery';

/**
 * Cron endpoint for processing abandoned cart recovery emails
 * 
 * This endpoint should be called by a scheduled job (e.g., Vercel Cron)
 * every hour to process abandoned carts and send recovery emails.
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

// GET: Process abandoned cart recovery (called by cron)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow if no secret is set (development) or if it matches
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[RECOVERY_CRON] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[RECOVERY_CRON] Starting abandoned cart recovery processing...');
    
    // Get current config
    const config = await getRecoveryConfig();
    
    if (!config.enabled) {
      return NextResponse.json({ 
        success: true, 
        message: 'Recovery emails are disabled',
        processed: 0,
        emailsSent: 0 
      });
    }
    
    // Process abandoned carts
    const result = await processAbandonedCartRecovery(config);
    
    console.log('[RECOVERY_CRON] Processing complete:', result);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
    
  } catch (error: any) {
    console.error('[RECOVERY_CRON] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Update recovery configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;
    
    if (action === 'get-config') {
      const currentConfig = await getRecoveryConfig();
      return NextResponse.json({ success: true, config: currentConfig });
    }
    
    if (action === 'save-config') {
      if (!config) {
        return NextResponse.json({ error: 'Config is required' }, { status: 400 });
      }
      
      await saveRecoveryConfig(config as Partial<RecoveryEmailConfig>);
      return NextResponse.json({ success: true, message: 'Configuration saved' });
    }
    
    if (action === 'test-run') {
      // Run recovery processing immediately (for testing)
      const currentConfig = await getRecoveryConfig();
      const result = await processAbandonedCartRecovery(currentConfig);
      return NextResponse.json({ success: true, ...result });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('[RECOVERY_CONFIG] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

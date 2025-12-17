import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/firebase-admin';

/**
 * POST /api/error-telemetry
 * Receives client-side error reports and stores them in Firestore
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      errorMessage,
      errorStack,
      errorName,
      component,
      action,
      userId,
      sessionId,
      browser,
      imageCount,
      sheetWidth,
      totalCopies,
      metadata,
    } = body;

    // Validate required fields
    if (!errorMessage) {
      return NextResponse.json({ error: 'errorMessage is required' }, { status: 400 });
    }

    const db = getFirestore();
    
    // Store error in Firestore
    const errorDoc = {
      // Error details
      errorMessage: errorMessage.substring(0, 1000), // Limit message length
      errorStack: errorStack?.substring(0, 5000), // Limit stack length
      errorName,
      
      // Context
      component,
      action,
      userId: userId || null,
      sessionId,
      
      // Browser info (parsed for easy querying)
      browserInfo: browser ? {
        userAgent: browser.userAgent?.substring(0, 500),
        platform: browser.platform,
        screenSize: browser.screenWidth && browser.screenHeight 
          ? `${browser.screenWidth}x${browser.screenHeight}` 
          : null,
        devicePixelRatio: browser.devicePixelRatio,
        memory: browser.memory?.usedJSHeapSize 
          ? Math.round(browser.memory.usedJSHeapSize / (1024 * 1024)) + 'MB'
          : null,
        webgl: browser.webgl,
        touchSupport: browser.touchSupport,
        connectionType: browser.connectionType,
        onLine: browser.onLine,
      } : null,
      
      // Parsed browser for easy filtering
      browserType: parseBrowserType(browser?.userAgent),
      isMobile: detectMobile(browser?.userAgent),
      
      // App state
      imageCount,
      sheetWidth,
      totalCopies,
      
      // Additional metadata
      metadata: metadata ? JSON.stringify(metadata).substring(0, 2000) : null,
      
      // Timestamps
      createdAt: Timestamp.now(),
      date: new Date().toISOString().split('T')[0], // For daily aggregation
    };

    await db.collection('errorTelemetry').add(errorDoc);

    // Log to server console for immediate visibility
    console.error('[ERROR_TELEMETRY] Received:', {
      error: errorMessage.substring(0, 100),
      component,
      action,
      browser: errorDoc.browserType,
      isMobile: errorDoc.isMobile,
      sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERROR_TELEMETRY] Failed to store error:', error);
    // Don't fail the request - errors in error reporting shouldn't cause more issues
    return NextResponse.json({ success: false });
  }
}

/**
 * GET /api/error-telemetry
 * Admin endpoint to retrieve recent errors (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    // Simple auth check - could be enhanced with proper admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const component = searchParams.get('component');
    const date = searchParams.get('date');

    let query = db.collection('errorTelemetry')
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limit, 100));

    if (action) {
      query = query.where('action', '==', action);
    }
    if (component) {
      query = query.where('component', '==', component);
    }
    if (date) {
      query = query.where('date', '==', date);
    }

    const snapshot = await query.get();
    const errors = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get summary stats
    const today = new Date().toISOString().split('T')[0];
    const todayQuery = await db.collection('errorTelemetry')
      .where('date', '==', today)
      .count()
      .get();

    return NextResponse.json({
      success: true,
      errors,
      stats: {
        todayCount: todayQuery.data().count,
        returnedCount: errors.length,
      },
    });
  } catch (error) {
    console.error('[ERROR_TELEMETRY] Failed to retrieve errors:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve errors' },
      { status: 500 }
    );
  }
}

// Helper functions

function parseBrowserType(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
  if (ua.includes('msie') || ua.includes('trident')) return 'IE';
  
  return 'Other';
}

function detectMobile(userAgent?: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/.test(ua);
}

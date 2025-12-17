'use client';

/**
 * Error Telemetry Service
 * Captures client-side errors with full context for debugging production issues
 */

export interface ErrorContext {
  // Error details
  errorMessage: string;
  errorStack?: string;
  errorName?: string;
  
  // Location in app
  component?: string;
  action?: string;  // e.g., 'nesting', 'upload', 'checkout'
  
  // User context
  userId?: string;
  sessionId?: string;
  
  // Browser environment
  browser: BrowserInfo;
  
  // App state context
  imageCount?: number;
  sheetWidth?: number;
  totalCopies?: number;
  
  // Additional context
  metadata?: Record<string, any>;
}

export interface BrowserInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  cookiesEnabled: boolean;
  onLine: boolean;
  memory?: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
  webgl?: string;
  hardwareConcurrency?: number;
  touchSupport: boolean;
  connectionType?: string;
}

/**
 * Gather browser environment info for debugging
 */
export function getBrowserInfo(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      platform: 'server',
      language: 'en',
      screenWidth: 0,
      screenHeight: 0,
      devicePixelRatio: 1,
      cookiesEnabled: false,
      onLine: true,
      touchSupport: false,
    };
  }

  const nav = navigator as any;
  
  // Get WebGL info for GPU debugging
  let webglInfo: string | undefined;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglInfo = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch {
    // WebGL not available
  }

  // Get memory info (Chrome only)
  let memoryInfo: BrowserInfo['memory'];
  try {
    if ((performance as any).memory) {
      const mem = (performance as any).memory;
      memoryInfo = {
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
        totalJSHeapSize: mem.totalJSHeapSize,
        usedJSHeapSize: mem.usedJSHeapSize,
      };
    }
  } catch {
    // Memory API not available
  }

  // Get connection type
  let connectionType: string | undefined;
  try {
    if (nav.connection) {
      connectionType = nav.connection.effectiveType || nav.connection.type;
    }
  } catch {
    // Connection API not available
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    memory: memoryInfo,
    webgl: webglInfo,
    hardwareConcurrency: navigator.hardwareConcurrency,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    connectionType,
  };
}

/**
 * Get or create a session ID for tracking errors across a user session
 */
export function getErrorSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('error_session_id');
  if (!sessionId) {
    sessionId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('error_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Report an error to the telemetry API
 */
export async function reportError(
  error: Error | string,
  context: Partial<Omit<ErrorContext, 'browser' | 'errorMessage' | 'errorStack' | 'errorName'>>
): Promise<void> {
  try {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const payload: ErrorContext = {
      errorMessage: errorObj.message,
      errorStack: errorObj.stack,
      errorName: errorObj.name,
      browser: getBrowserInfo(),
      sessionId: getErrorSessionId(),
      ...context,
    };

    // Log to console for development debugging
    console.error('[ERROR_TELEMETRY]', {
      message: payload.errorMessage,
      component: payload.component,
      action: payload.action,
      browser: `${payload.browser.platform} - ${payload.browser.userAgent.substring(0, 100)}...`,
    });

    // Send to API (fire and forget)
    await fetch('/api/error-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail - don't cause more errors while reporting errors
    });
  } catch {
    // Never throw from error reporting
  }
}

/**
 * Create a wrapped function that reports errors automatically
 */
export function withErrorReporting<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: Partial<Omit<ErrorContext, 'browser' | 'errorMessage' | 'errorStack' | 'errorName'>>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await reportError(error as Error, context);
      throw error; // Re-throw to let caller handle
    }
  }) as T;
}

/**
 * Parse browser info to detect known compatibility issues
 */
export function detectBrowserIssues(info: BrowserInfo): string[] {
  const issues: string[] = [];
  const ua = info.userAgent.toLowerCase();

  // Safari WebAssembly/SharedArrayBuffer issues
  if (ua.includes('safari') && !ua.includes('chrome')) {
    issues.push('Safari may have limited WebAssembly support for background removal');
  }

  // iOS browsers (all use Safari engine)
  if (/iphone|ipad|ipod/.test(ua)) {
    issues.push('iOS browsers have memory limitations for large image processing');
  }

  // Old browsers
  if (ua.includes('msie') || ua.includes('trident')) {
    issues.push('Internet Explorer is not supported');
  }

  // Low memory
  if (info.memory?.jsHeapSizeLimit && info.memory.jsHeapSizeLimit < 500 * 1024 * 1024) {
    issues.push('Low memory device detected');
  }

  // Slow connection
  if (info.connectionType === 'slow-2g' || info.connectionType === '2g') {
    issues.push('Slow network connection may cause upload timeouts');
  }

  // No WebGL (might indicate limited GPU/canvas support)
  if (!info.webgl) {
    issues.push('No WebGL support detected - canvas operations may be limited');
  }

  return issues;
}

/**
 * Format error for user-friendly display while preserving technical details
 */
export function formatErrorForUser(error: Error | string, action?: string): {
  title: string;
  description: string;
  technicalDetails?: string;
} {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const message = errorObj.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return {
      title: 'Network Error',
      description: 'Unable to connect to our servers. Please check your internet connection and try again.',
      technicalDetails: errorObj.message,
    };
  }

  // Memory errors
  if (message.includes('memory') || message.includes('heap') || message.includes('allocation')) {
    return {
      title: 'Memory Limit Reached',
      description: 'Your browser ran out of memory. Try closing other tabs or using fewer/smaller images.',
      technicalDetails: errorObj.message,
    };
  }

  // Canvas errors
  if (message.includes('canvas') || message.includes('context')) {
    return {
      title: 'Image Processing Error',
      description: 'Unable to process your images. Try using smaller images or a different browser.',
      technicalDetails: errorObj.message,
    };
  }

  // CORS errors
  if (message.includes('cors') || message.includes('cross-origin')) {
    return {
      title: 'Image Access Error',
      description: 'Unable to access one of your images. Please try re-uploading the image.',
      technicalDetails: errorObj.message,
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('504') || message.includes('timed out')) {
    return {
      title: 'Request Timeout',
      description: 'The operation took too long. Try with fewer images or contact support if this persists.',
      technicalDetails: errorObj.message,
    };
  }

  // Generic error
  const actionText = action ? ` during ${action}` : '';
  return {
    title: 'Something Went Wrong',
    description: `An error occurred${actionText}. Please try again or contact support if this persists.`,
    technicalDetails: errorObj.message,
  };
}

'use client';

import { useEffect } from 'react';
import { reportError, getBrowserInfo } from '@/lib/error-telemetry';

/**
 * Global Error Handler Component
 * Catches unhandled errors and promise rejections
 * Add this to your root layout to capture all client-side errors
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      // Ignore errors from browser extensions
      if (event.filename?.includes('chrome-extension://') || 
          event.filename?.includes('moz-extension://')) {
        return;
      }

      const error = event.error || new Error(event.message);
      
      reportError(error, {
        component: 'GlobalErrorHandler',
        action: 'window-error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });

      // Don't prevent default - let browser console show the error too
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));

      reportError(error, {
        component: 'GlobalErrorHandler',
        action: 'unhandled-rejection',
      });
    };

    // Add listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Log browser info on mount for debugging
    const browserInfo = getBrowserInfo();
    console.log('[GlobalErrorHandler] Browser info:', {
      platform: browserInfo.platform,
      userAgent: browserInfo.userAgent.substring(0, 80) + '...',
      memory: browserInfo.memory ? `${Math.round((browserInfo.memory.usedJSHeapSize || 0) / (1024 * 1024))}MB used` : 'N/A',
      webgl: browserInfo.webgl ? 'Available' : 'Not available',
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Check browser compatibility on page load
 * Returns warnings for known issues
 */
export function useBrowserCompatibilityCheck(): string[] {
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const browserInfo = getBrowserInfo();
    const issues: string[] = [];

    // Check for WebAssembly support (needed for background removal)
    if (typeof WebAssembly === 'undefined') {
      issues.push('Your browser does not support WebAssembly. Some features may not work.');
    }

    // Check for SharedArrayBuffer (needed for multi-threaded WASM)
    if (typeof SharedArrayBuffer === 'undefined') {
      // This is expected on many browsers - don't warn, just note it
      console.log('[Compatibility] SharedArrayBuffer not available - background removal will use single-threaded mode');
    }

    // Check memory
    if (browserInfo.memory?.jsHeapSizeLimit && browserInfo.memory.jsHeapSizeLimit < 256 * 1024 * 1024) {
      issues.push('Your device has limited memory. Consider using fewer images.');
    }

    // Check for known problematic browsers
    const ua = browserInfo.userAgent.toLowerCase();
    if (ua.includes('msie') || ua.includes('trident')) {
      issues.push('Internet Explorer is not supported. Please use Chrome, Firefox, or Edge.');
    }

    setWarnings(issues);
  }, []);

  return warnings;
}

import { useState } from 'react';

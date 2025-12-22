'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import type { AbandonmentStage, AbandonedCartItem } from '@/lib/abandoned-carts';

/**
 * Hook to track user sessions for abandoned cart recovery
 * 
 * Automatically tracks:
 * - Session ID generation
 * - Cart state changes
 * - Stage progression through the funnel
 */

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('dtf_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('dtf_session_id', sessionId);
  }
  return sessionId;
}

export function useAbandonedCartTracking() {
  const { user } = useAuth();
  const { items, totalPrice } = useCart();
  const lastTrackedRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');

  // Initialize session ID on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Track cart state
  const trackCart = useCallback(async (
    stage: AbandonmentStage,
    additionalData?: {
      email?: string;
      customerName?: string;
      phone?: string;
      stageDetails?: string;
    }
  ) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    // Convert cart items to abandoned cart items with FULL recovery data
    const abandonedItems: AbandonedCartItem[] = items.map(item => ({
      name: item.name,
      sheetSize: item.sheetSize,
      sheetWidth: item.sheetWidth || parseInt(item.sheetSize),
      sheetLength: item.sheetLength || item.layout?.sheetHeight || 0,
      imageCount: item.images?.length || 0,
      estimatedPrice: item.pricing?.total || 0,
      thumbnailUrl: item.thumbnailUrl,
      placedItemsCount: item.placedItems?.length || item.layout?.totalCopies || 0,
      utilization: item.layout?.utilization,
      
      // Full recovery data - store images with their Firebase Storage URLs
      images: item.images?.map(img => ({
        id: img.id,
        url: img.url,                   // Firebase Storage URL (persistent)
        width: img.width,
        height: img.height,
        aspectRatio: img.aspectRatio,
        copies: img.copies,
        dataAiHint: img.dataAiHint,
      })),
      
      // Store placed items for gang sheet recreation
      placedItems: item.placedItems?.map(placed => ({
        id: placed.id,
        url: placed.url,
        x: placed.x,
        y: placed.y,
        width: placed.width,
        height: placed.height,
        originalWidth: placed.originalWidth,
        originalHeight: placed.originalHeight,
        rotated: placed.rotated,
        copyIndex: placed.copyIndex,
      })),
      
      // Store full layout data
      layout: item.layout ? {
        positions: item.layout.positions,
        utilization: item.layout.utilization,
        totalCopies: item.layout.totalCopies,
        sheetWidth: item.layout.sheetWidth,
        sheetHeight: item.layout.sheetHeight,
      } : undefined,
      
      // Store pricing data
      pricing: item.pricing ? {
        basePrice: item.pricing.basePrice,
        total: item.pricing.total,
        sqInchPrice: (item.pricing as any).sqInchPrice,
        perUnitPrice: (item.pricing as any).perUnitPrice,
        breakdown: (item.pricing as any).breakdown,
      } : undefined,
    }));

    // Create tracking payload
    const payload = {
      action: 'track',
      sessionId,
      userId: user?.uid,
      email: user?.email || additionalData?.email,
      customerName: additionalData?.customerName,
      phone: additionalData?.phone,
      items: abandonedItems,
      estimatedTotal: totalPrice,
      stage,
      stageDetails: additionalData?.stageDetails,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    // Avoid duplicate tracking
    const payloadKey = JSON.stringify({ stage, itemCount: items.length, total: totalPrice });
    if (payloadKey === lastTrackedRef.current) return;
    lastTrackedRef.current = payloadKey;

    try {
      await fetch('/api/abandoned-carts/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[ABANDONED_CART] Tracking failed:', error);
    }
  }, [items, totalPrice, user]);

  // Update just the stage
  const updateStage = useCallback(async (
    stage: AbandonmentStage,
    details?: string
  ) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    try {
      await fetch('/api/abandoned-carts/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stage',
          sessionId,
          stage,
          details,
        }),
      });
    } catch (error) {
      console.error('[ABANDONED_CART] Stage update failed:', error);
    }
  }, []);

  // Mark as recovered when order completes
  const markRecovered = useCallback(async (orderId: string) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    try {
      await fetch('/api/abandoned-carts/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recovered',
          sessionId,
          orderId,
        }),
      });
    } catch (error) {
      console.error('[ABANDONED_CART] Recovery marking failed:', error);
    }
  }, []);

  // Get current session ID
  const getSession = useCallback(() => sessionIdRef.current, []);

  return {
    trackCart,
    updateStage,
    markRecovered,
    getSessionId: getSession,
  };
}

/**
 * Convenience functions for specific tracking points
 */

export function useImageUploadTracking() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>('');
  const lastTrackedCountRef = useRef<number>(0);
  
  // Initialize session ID on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Call when user uploads images to the nesting tool
  const trackImageUpload = useCallback(async (imageCount: number, sheetWidth: number) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    
    // Only track if image count increased (avoid duplicate tracking)
    if (imageCount <= lastTrackedCountRef.current) return;
    lastTrackedCountRef.current = imageCount;

    console.log('[ABANDONED_CART] trackImageUpload called:', { imageCount, sheetWidth });

    const payload = {
      action: 'track',
      sessionId,
      userId: user?.uid,
      email: user?.email,
      items: [{
        name: `DTF Sheet ${sheetWidth}" (in progress)`,
        sheetSize: String(sheetWidth),
        sheetWidth: sheetWidth,
        sheetLength: 0,
        imageCount: imageCount,
        estimatedPrice: 0,
        placedItemsCount: 0,
      }],
      estimatedTotal: 0,
      stage: 'image_upload',
      stageDetails: `${imageCount} image(s) uploaded`,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    try {
      await fetch('/api/abandoned-carts/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[ABANDONED_CART] Image upload tracking failed:', error);
    }
  }, [user]);

  return { trackImageUpload };
}

export function useNestingTracking() {
  const { trackCart, updateStage } = useAbandonedCartTracking();

  // Call when user generates a gang sheet
  const trackNestingComplete = useCallback(() => {
    trackCart('nesting');
  }, [trackCart]);

  return { trackNestingComplete };
}

export function useCartTracking() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>('');
  
  // Initialize session ID on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // Call when user adds item to cart - pass the FULL cart item with images and layouts
  const trackAddToCart = useCallback(async (item?: {
    name: string;
    sheetSize: string;
    sheetWidth?: number;
    sheetLength?: number;
    imageCount?: number;
    estimatedPrice?: number;
    thumbnailUrl?: string;
    placedItemsCount?: number;
    utilization?: number;
    // Full recovery data
    images?: Array<{
      id: string;
      url: string;
      width: number;
      height: number;
      aspectRatio: number;
      copies: number;
      dataAiHint?: string;
    }>;
    placedItems?: Array<{
      id: string;
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
      originalWidth?: number;
      originalHeight?: number;
      rotated?: boolean;
      copyIndex?: number;
    }>;
    layout?: {
      positions: any[];
      utilization: number;
      totalCopies: number;
      sheetWidth: number;
      sheetHeight: number;
    };
    pricing?: {
      basePrice: number;
      total: number;
      sqInchPrice?: number;
      perUnitPrice?: number;
      breakdown?: any[];
    };
  }) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      console.log('[ABANDONED_CART] No session ID, skipping tracking');
      return;
    }

    console.log('[ABANDONED_CART] trackAddToCart called with item:', item?.name, 'has images:', !!(item?.images?.length));

    // Create tracking payload with FULL recovery data
    const payload = {
      action: 'track',
      sessionId,
      userId: user?.uid,
      email: user?.email,
      items: item ? [{
        name: item.name,
        sheetSize: item.sheetSize,
        sheetWidth: item.sheetWidth || 0,
        sheetLength: item.sheetLength || 0,
        imageCount: item.images?.length || item.imageCount || 0,
        estimatedPrice: item.pricing?.total || item.estimatedPrice || 0,
        thumbnailUrl: item.thumbnailUrl,
        placedItemsCount: item.placedItems?.length || item.placedItemsCount || 0,
        utilization: item.layout?.utilization || item.utilization,
        // Full recovery data
        images: item.images?.map(img => ({
          id: img.id,
          url: img.url,
          width: img.width,
          height: img.height,
          aspectRatio: img.aspectRatio,
          copies: img.copies,
          dataAiHint: img.dataAiHint,
        })),
        placedItems: item.placedItems?.map(placed => ({
          id: placed.id,
          url: placed.url,
          x: placed.x,
          y: placed.y,
          width: placed.width,
          height: placed.height,
          originalWidth: placed.originalWidth,
          originalHeight: placed.originalHeight,
          rotated: placed.rotated,
          copyIndex: placed.copyIndex,
        })),
        layout: item.layout,
        pricing: item.pricing,
      }] : [],
      estimatedTotal: item?.pricing?.total || item?.estimatedPrice || 0,
      stage: 'cart',
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    try {
      console.log('[ABANDONED_CART] Sending tracking request with full data...');
      const response = await fetch('/api/abandoned-carts/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log('[ABANDONED_CART] Tracking response:', result);
    } catch (error) {
      console.error('[ABANDONED_CART] Tracking failed:', error);
    }
  }, [user]);

  return { trackAddToCart };
}

export function useCheckoutTracking() {
  const { trackCart, updateStage, markRecovered } = useAbandonedCartTracking();

  // Call when user starts checkout
  const trackCheckoutStart = useCallback((customerInfo?: {
    email?: string;
    customerName?: string;
    phone?: string;
  }) => {
    trackCart('checkout', customerInfo);
  }, [trackCart]);

  // Call when payment fails
  const trackPaymentFailed = useCallback((reason?: string) => {
    updateStage('payment_failed', reason);
  }, [updateStage]);

  // Call when order completes successfully
  const trackOrderComplete = useCallback((orderId: string) => {
    markRecovered(orderId);
  }, [markRecovered]);

  return { trackCheckoutStart, trackPaymentFailed, trackOrderComplete };
}

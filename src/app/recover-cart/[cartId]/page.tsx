'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/cart-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, CheckCircle, AlertCircle, Package } from 'lucide-react';
import Link from 'next/link';
import type { AbandonedCartItem } from '@/lib/abandoned-carts';

interface RestoreResponse {
  success?: boolean;
  error?: string;
  recovered?: boolean;
  orderId?: string;
  cart?: {
    id: string;
    items: AbandonedCartItem[];
    estimatedTotal: number;
    email?: string;
    customerName?: string;
  };
}

export default function RecoverCartPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, items: currentCartItems } = useCart();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-recovered'>('loading');
  const [error, setError] = useState<string>('');
  const [restoredItems, setRestoredItems] = useState<AbandonedCartItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const cartId = params.cartId as string;
  
  useEffect(() => {
    const restoreCart = async () => {
      try {
        const response = await fetch(`/api/abandoned-carts/restore/${cartId}`);
        const data: RestoreResponse = await response.json();
        
        if (!response.ok) {
          if (data.recovered) {
            setStatus('already-recovered');
            setOrderId(data.orderId || null);
            return;
          }
          throw new Error(data.error || 'Failed to restore cart');
        }
        
        if (data.success && data.cart?.items) {
          // Add items to cart with FULL recovery data
          for (const item of data.cart.items) {
            // Check if we have full recovery data (images, placedItems, layout)
            const hasFullData = item.images && item.images.length > 0;
            
            // Create a cart item from the abandoned cart data
            const cartItem = {
              name: item.name,
              sheetSize: item.sheetSize as '11' | '13' | '17',
              
              // Restore original images if available
              images: hasFullData ? item.images!.map(img => ({
                id: img.id,
                url: img.url,
                width: img.width,
                height: img.height,
                aspectRatio: img.aspectRatio,
                copies: img.copies,
                dataAiHint: img.dataAiHint,
              })) : [],
              
              // Restore full layout data if available
              layout: item.layout ? {
                positions: item.layout.positions || [],
                utilization: item.layout.utilization || item.utilization || 0,
                totalCopies: item.layout.totalCopies || item.placedItemsCount,
                sheetWidth: item.layout.sheetWidth || item.sheetWidth,
                sheetHeight: item.layout.sheetHeight || item.sheetLength,
              } : {
                positions: [],
                utilization: item.utilization || 0,
                totalCopies: item.placedItemsCount,
                sheetWidth: item.sheetWidth,
                sheetHeight: item.sheetLength,
              },
              
              // Restore pricing data if available
              pricing: item.pricing ? {
                basePrice: item.pricing.basePrice,
                total: item.pricing.total,
                sqInchPrice: item.pricing.sqInchPrice || 0,
                perUnitPrice: item.pricing.perUnitPrice || 0,
                breakdown: item.pricing.breakdown || [],
              } : {
                basePrice: item.estimatedPrice,
                total: item.estimatedPrice,
                sqInchPrice: 0,
                perUnitPrice: 0,
                breakdown: [],
              },
              
              quantity: 1,
              sheetWidth: item.sheetWidth,
              sheetLength: item.sheetLength,
              
              // Restore placed items if available
              placedItems: item.placedItems || [],
              
              thumbnailUrl: item.thumbnailUrl,
              
              // Flag for recovered carts
              isRecoveredCart: true,
              hasFullRecoveryData: hasFullData,
            };
            
            addItem(cartItem as any);
          }
          
          setRestoredItems(data.cart.items);
          setStatus('success');
          
          // Auto-redirect to cart after 3 seconds
          setTimeout(() => {
            router.push('/cart');
          }, 3000);
        } else {
          throw new Error('No items to restore');
        }
        
      } catch (err: any) {
        console.error('Cart restore error:', err);
        setError(err.message || 'Failed to restore your cart');
        setStatus('error');
      }
    };
    
    if (cartId) {
      restoreCart();
    }
  }, [cartId, addItem, router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Restoring Your Cart...'}
            {status === 'success' && 'Cart Restored!'}
            {status === 'error' && 'Unable to Restore Cart'}
            {status === 'already-recovered' && 'Order Already Completed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Please wait while we restore your cart...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              
              <p className="text-center text-muted-foreground">
                We've restored {restoredItems.length} item(s) to your cart.
              </p>
              
              <div className="space-y-2 w-full">
                {restoredItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.imageCount} images • ${item.estimatedPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Redirecting to cart in 3 seconds...
              </p>
              
              <Button asChild className="w-full">
                <Link href="/cart">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Go to Cart Now
                </Link>
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              
              <p className="text-center text-muted-foreground">
                {error}
              </p>
              
              <p className="text-sm text-muted-foreground text-center">
                Don't worry! You can still create a new order. We're here to help if you need assistance.
              </p>
              
              <div className="flex gap-2 w-full">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/">
                    Go Home
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/nesting-tool">
                    Create New Order
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          {status === 'already-recovered' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
              
              <p className="text-center text-muted-foreground">
                Great news! This order has already been completed.
              </p>
              
              {orderId && (
                <p className="text-sm text-muted-foreground">
                  Order ID: <span className="font-mono">{orderId}</span>
                </p>
              )}
              
              <div className="flex gap-2 w-full">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/orders">
                    View Orders
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/nesting-tool">
                    Create New Order
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

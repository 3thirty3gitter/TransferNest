
'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import type { CartItem } from '@/app/schema';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import CartItemRow from '@/components/cart-item-row';
import { useToast } from '@/hooks/use-toast';
import { getCartItemsAction, removeCartItemAction } from '@/app/actions';

export default function CartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCartItems() {
      if (user) {
        setIsLoading(true);
        try {
          const items = await getCartItemsAction(user.uid);
          setCartItems(items);
        } catch (error) {
            console.error("Failed to fetch cart items:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your cart. Please try again.' });
            setCartItems([]);
        } finally {
            setIsLoading(false);
        }
      } else {
        // If there's no user, clear cart and stop loading
        setIsLoading(false);
        setCartItems([]);
      }
    }
    fetchCartItems();
  }, [user, toast]);

  const handleRemoveItem = async (docId: string) => {
    const result = await removeCartItemAction(docId);
    if (result.success) {
      setCartItems(currentItems => currentItems.filter(item => item.id !== docId));
      toast({ title: 'Item Removed', description: 'The item has been removed from your cart.' });
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price, 0);
  }, [cartItems]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container py-8">
         <Button asChild variant="ghost" className="mb-4">
            <Link href="/nesting-tool">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Nesting Tool
            </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Your Shopping Cart</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                        </div>
                    ) : cartItems.length > 0 ? (
                        <div className="space-y-4">
                            {cartItems.map(item => (
                                <CartItemRow key={item.id} item={item} onRemove={handleRemoveItem} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Your cart is empty</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Looks like you haven’t added any gang sheets yet.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/nesting-tool">Start Building</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes</span>
                        <span>Calculated at checkout</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>Calculated at checkout</span>
                    </div>
                </CardContent>
                <Separator />
                <CardFooter className="flex-col items-stretch gap-4 pt-6">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Estimated Total</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <Button size="lg" disabled={cartItems.length === 0}>
                        Proceed to Checkout
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

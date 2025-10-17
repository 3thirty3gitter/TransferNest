'use client';'use client';'use client';'use client';



import { useCart } from '@/contexts/cart-context';

import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui/button';import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ShoppingCart } from 'lucide-react';import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import Link from 'next/link';

import { Input } from '@/components/ui/input';import { Button } from '@/components/ui/button';'use client';

export default function CartPage() {

  const { items, totalItems, totalPrice, removeItem } = useCart();import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';

  const { user } = useAuth();

import { useCart } from '@/contexts/cart-context';import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

  if (!user) {

    return (import { useAuth } from '@/contexts/auth-context';

      <div className="container mx-auto px-4 py-8 text-center">

        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />import { useState } from 'react';import { Input } from '@/components/ui/input';import { Button } from '@/components/ui/button';

        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>

        <p className="text-muted-foreground mb-4">You need to be signed in to view your cart.</p>import Link from 'next/link';

        <Button asChild>

          <Link href="/login">Sign In</Link>import { Badge } from '@/components/ui/badge';import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';

        </Button>

      </div>

    );

  }export default function CartPage() {import { useCart } from '@/contexts/cart-context';import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';import { useState, useEffect, useMemo } from 'react';



  if (items.length === 0) {  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

    return (

      <div className="container mx-auto px-4 py-8 text-center">  const { user } = useAuth();import { useAuth } from '@/contexts/auth-context';

        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />

        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>  const [isCheckingOut, setIsCheckingOut] = useState(false);

        <p className="text-muted-foreground mb-4">Start building your DTF sheets with our nesting tool.</p>

        <div className="space-x-4">import { useState } from 'react';import { Input } from '@/components/ui/input';import Header from '@/components/layout/header';

          <Button asChild>

            <Link href="/nesting-tool-13">Build 13" Sheet</Link>  if (!user) {

          </Button>

          <Button variant="outline" asChild>    return (import Link from 'next/link';

            <Link href="/nesting-tool-17">Build 17" Sheet</Link>

          </Button>      <div className="container mx-auto px-4 py-8">

        </div>

      </div>        <div className="text-center">import { Badge } from '@/components/ui/badge';import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';import Footer from '@/components/layout/footer';

    );

  }          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />



  return (          <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>

    <div className="container mx-auto px-4 py-8">

      <h1 className="text-3xl font-bold mb-8">Your Cart ({totalItems} items)</h1>          <p className="text-muted-foreground mb-4">

      

      <div className="space-y-4">            You need to be signed in to view your cart.export default function CartPage() {import { useCart } from '@/contexts/cart-context';import { Button } from '@/components/ui/button';

        {items.map((item) => (

          <Card key={item.id}>          </p>

            <CardHeader>

              <div className="flex justify-between items-start">          <Button asChild>  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

                <div>

                  <CardTitle>{item.name}</CardTitle>            <Link href="/login">Sign In</Link>

                  <p className="text-sm text-muted-foreground">

                    {item.sheetSize}" DTF Sheet • {item.layout.totalCopies} designs • {item.layout.utilization.toFixed(1)}% utilization          </Button>  const { user } = useAuth();import { useAuth } from '@/contexts/auth-context';import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

                  </p>

                </div>        </div>

                <Button variant="outline" onClick={() => removeItem(item.id)}>Remove</Button>

              </div>      </div>  const [isCheckingOut, setIsCheckingOut] = useState(false);

            </CardHeader>

            <CardContent>    );

              <div className="flex justify-between items-center">

                <div>  }import { useState } from 'react';import { Separator } from '@/components/ui/separator';

                  <p>Base: ${item.pricing.basePrice.toFixed(2)} + Setup: ${item.pricing.setupFee.toFixed(2)}</p>

                  <p className="font-medium">${item.pricing.total.toFixed(2)} each</p>

                </div>

                <div className="text-right">  if (items.length === 0) {  if (!user) {

                  <p>Quantity: {item.quantity}</p>

                  <p className="font-bold text-lg">${(item.pricing.total * item.quantity).toFixed(2)}</p>    return (

                </div>

              </div>      <div className="container mx-auto px-4 py-8">    return (import Link from 'next/link';import { useAuth } from '@/contexts/auth-context';

            </CardContent>

          </Card>        <div className="text-center">

        ))}

                  <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />      <div className="container mx-auto px-4 py-8">

        <Card>

          <CardContent className="pt-6">          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>

            <div className="flex justify-between text-xl font-bold">

              <span>Total: ${totalPrice.toFixed(2)}</span>          <p className="text-muted-foreground mb-4">        <div className="text-center">import { Badge } from '@/components/ui/badge';import type { CartItem } from '@/app/schema';

              <Button size="lg">Checkout</Button>

            </div>            Start building your DTF sheets with our nesting tool.

          </CardContent>

        </Card>          </p>          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />

      </div>

    </div>          <div className="space-x-4">

  );

}            <Button asChild>          <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>import Link from 'next/link';

              <Link href="/nesting-tool-13">Build 13&quot; Sheet</Link>

            </Button>          <p className="text-muted-foreground mb-4">

            <Button variant="outline" asChild>

              <Link href="/nesting-tool-17">Build 17&quot; Sheet</Link>            You need to be signed in to view your cart.export default function CartPage() {import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';

            </Button>

          </div>          </p>

        </div>

      </div>          <Button asChild>  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();import CartItemRow from '@/components/cart-item-row';

    );

  }            <Link href="/login">Sign In</Link>



  const handleQuantityChange = (itemId: string, newQuantity: number) => {          </Button>  const { user } = useAuth();import { useToast } from '@/hooks/use-toast';

    if (newQuantity < 1) {

      removeItem(itemId);        </div>

    } else {

      updateQuantity(itemId, newQuantity);      </div>  const [isCheckingOut, setIsCheckingOut] = useState(false);import { getCartItemsAction, removeCartItemAction } from '@/app/actions';

    }

  };    );



  const handleCheckout = async () => {  }

    setIsCheckingOut(true);

    try {

      console.log('Starting checkout process...');

    } catch (error) {  if (items.length === 0) {  if (!user) {export default function CartPage() {

      console.error('Checkout error:', error);

    } finally {    return (

      setIsCheckingOut(false);

    }      <div className="container mx-auto px-4 py-8">    return (  const { user } = useAuth();

  };

        <div className="text-center">

  return (

    <div className="container mx-auto px-4 py-8">          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />      <div className="container mx-auto px-4 py-8">  const { toast } = useToast();

      <div className="flex items-center justify-between mb-8">

        <h1 className="text-3xl font-bold">Your Cart</h1>          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>

        <Badge variant="secondary" className="text-lg px-3 py-1">

          {totalItems} {totalItems === 1 ? 'item' : 'items'}          <p className="text-muted-foreground mb-4">        <div className="text-center">  const [cartItems, setCartItems] = useState<CartItem[]>([]);

        </Badge>

      </div>            Start building your DTF sheets with our nesting tool.



      <div className="grid gap-8 lg:grid-cols-3">          </p>          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />  const [isLoading, setIsLoading] = useState(true);

        <div className="lg:col-span-2 space-y-4">

          {items.map((item) => (          <div className="space-x-4">

            <Card key={item.id}>

              <CardHeader className="pb-4">            <Button asChild>          <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>

                <div className="flex items-start justify-between">

                  <div>              <Link href="/nesting-tool-13">Build 13" Sheet</Link>

                    <CardTitle className="text-lg">{item.name}</CardTitle>

                    <p className="text-sm text-muted-foreground">            </Button>          <p className="text-muted-foreground mb-4">  useEffect(() => {

                      {item.sheetSize}&quot; DTF Sheet • {item.layout.totalCopies} designs • {item.layout.utilization.toFixed(1)}% utilization

                    </p>            <Button variant="outline" asChild>

                  </div>

                  <Button              <Link href="/nesting-tool-17">Build 17" Sheet</Link>            You need to be signed in to view your cart.    async function fetchCartItems() {

                    variant="ghost"

                    size="sm"            </Button>

                    onClick={() => removeItem(item.id)}

                    className="text-destructive hover:text-destructive"          </div>          </p>      if (user) {

                  >

                    <Trash2 className="h-4 w-4" />        </div>

                  </Button>

                </div>      </div>          <Button asChild>        setIsLoading(true);

              </CardHeader>

              <CardContent>    );

                <div className="space-y-4">

                  <div className="grid grid-cols-4 gap-2">  }            <Link href="/login">Sign In</Link>        try {

                    {item.images.slice(0, 4).map((image, index) => (

                      <div key={image.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">

                        <img

                          src={image.url}  const handleQuantityChange = (itemId: string, newQuantity: number) => {          </Button>          const items = await getCartItemsAction(user.uid);

                          alt={`Design ${index + 1}`}

                          className="object-cover w-full h-full"    if (newQuantity < 1) {

                        />

                        {image.copies > 1 && (      removeItem(itemId);        </div>          setCartItems(items);

                          <Badge className="absolute top-1 right-1 text-xs">

                            {image.copies}x    } else {

                          </Badge>

                        )}      updateQuantity(itemId, newQuantity);      </div>        } catch (error) {

                      </div>

                    ))}    }

                    {item.images.length > 4 && (

                      <div className="aspect-square rounded-md bg-muted flex items-center justify-center">  };    );            console.error("Failed to fetch cart items:", error);

                        <span className="text-sm text-muted-foreground">

                          +{item.images.length - 4}

                        </span>

                      </div>  const handleCheckout = async () => {  }            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your cart. Please try again.' });

                    )}

                  </div>    setIsCheckingOut(true);



                  <div className="flex items-center justify-between">    try {            setCartItems([]);

                    <div className="space-y-1">

                      <div className="text-sm text-muted-foreground">      console.log('Starting checkout process...');

                        Base: ${item.pricing.basePrice.toFixed(2)} + Setup: ${item.pricing.setupFee.toFixed(2)}

                      </div>    } catch (error) {  if (items.length === 0) {        } finally {

                      <div className="font-medium">

                        ${item.pricing.total.toFixed(2)} each      console.error('Checkout error:', error);

                      </div>

                    </div>    } finally {    return (            setIsLoading(false);



                    <div className="flex items-center space-x-3">      setIsCheckingOut(false);

                      <div className="flex items-center space-x-2">

                        <Button    }      <div className="container mx-auto px-4 py-8">        }

                          variant="outline"

                          size="sm"  };

                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}

                        >        <div className="text-center">      } else {

                          <Minus className="h-3 w-3" />

                        </Button>  return (

                        <Input

                          type="number"    <div className="container mx-auto px-4 py-8">          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />        // If there's no user, clear cart and stop loading

                          min="1"

                          value={item.quantity}      <div className="flex items-center justify-between mb-8">

                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}

                          className="w-16 text-center"        <h1 className="text-3xl font-bold">Your Cart</h1>          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>        setIsLoading(false);

                        />

                        <Button        <Badge variant="secondary" className="text-lg px-3 py-1">

                          variant="outline"

                          size="sm"          {totalItems} {totalItems === 1 ? 'item' : 'items'}          <p className="text-muted-foreground mb-4">        setCartItems([]);

                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}

                        >        </Badge>

                          <Plus className="h-3 w-3" />

                        </Button>      </div>            Start building your DTF sheets with our nesting tool.      }

                      </div>

                      <div className="font-bold text-lg">

                        ${(item.pricing.total * item.quantity).toFixed(2)}

                      </div>      <div className="grid gap-8 lg:grid-cols-3">          </p>    }

                    </div>

                  </div>        <div className="lg:col-span-2 space-y-4">

                </div>

              </CardContent>          {items.map((item) => (          <div className="space-x-4">    fetchCartItems();

            </Card>

          ))}            <Card key={item.id}>

        </div>

              <CardHeader className="pb-4">            <Button asChild>  }, [user, toast]);

        <div>

          <Card className="sticky top-4">                <div className="flex items-start justify-between">

            <CardHeader>

              <CardTitle>Order Summary</CardTitle>                  <div>              <Link href="/nesting-tool-13">Build 13" Sheet</Link>

            </CardHeader>

            <CardContent className="space-y-4">                    <CardTitle className="text-lg">{item.name}</CardTitle>

              <div className="space-y-2">

                {items.map((item) => (                    <p className="text-sm text-muted-foreground">            </Button>  const handleRemoveItem = async (docId: string) => {

                  <div key={item.id} className="flex justify-between text-sm">

                    <span>{item.name} × {item.quantity}</span>                      {item.sheetSize}" DTF Sheet • {item.layout.totalCopies} designs • {item.layout.utilization.toFixed(1)}% utilization

                    <span>${(item.pricing.total * item.quantity).toFixed(2)}</span>

                  </div>                    </p>            <Button variant="outline" asChild>    const result = await removeCartItemAction(docId);

                ))}

              </div>                  </div>

              

              <div className="border-t pt-4">                  <Button              <Link href="/nesting-tool-17">Build 17" Sheet</Link>    if (result.success) {

                <div className="flex justify-between text-lg font-bold">

                  <span>Total</span>                    variant="ghost"

                  <span>${totalPrice.toFixed(2)}</span>

                </div>                    size="sm"            </Button>      setCartItems(currentItems => currentItems.filter(item => item.id !== docId));

              </div>

                    onClick={() => removeItem(item.id)}

              <div className="space-y-2">

                <Button                     className="text-destructive hover:text-destructive"          </div>      toast({ title: 'Item Removed', description: 'The item has been removed from your cart.' });

                  onClick={handleCheckout}

                  disabled={isCheckingOut || items.length === 0}                  >

                  className="w-full"

                  size="lg"                    <Trash2 className="h-4 w-4" />        </div>      window.dispatchEvent(new CustomEvent('cartUpdated'));

                >

                  {isCheckingOut ? (                  </Button>

                    <>

                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />                </div>      </div>    } else {

                      Processing...

                    </>              </CardHeader>

                  ) : (

                    <>              <CardContent>    );      toast({ variant: 'destructive', title: 'Error', description: result.error });

                      <CreditCard className="mr-2 h-4 w-4" />

                      Checkout                <div className="space-y-4">

                    </>

                  )}                  <div className="grid grid-cols-4 gap-2">  }    }

                </Button>

                                    {item.images.slice(0, 4).map((image, index) => (

                <Button 

                  variant="outline"                       <div key={image.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">  };

                  onClick={clearCart}

                  className="w-full"                        <img

                >

                  Clear Cart                          src={image.url}  const handleQuantityChange = (itemId: string, newQuantity: number) => {

                </Button>

              </div>                          alt={`Design ${index + 1}`}



              <div className="text-xs text-muted-foreground space-y-1">                          className="object-cover w-full h-full"    if (newQuantity < 1) {  const subtotal = useMemo(() => {

                <p>• High-quality DTF prints ready for heat press</p>

                <p>• 300 DPI print resolution</p>                        />

                <p>• Fast turnaround time</p>

                <p>• Satisfaction guaranteed</p>                        {image.copies > 1 && (      removeItem(itemId);    return cartItems.reduce((acc, item) => acc + item.price, 0);

              </div>

            </CardContent>                          <Badge className="absolute top-1 right-1 text-xs">

          </Card>

        </div>                            {image.copies}x    } else {  }, [cartItems]);

      </div>

    </div>                          </Badge>

  );

}                        )}      updateQuantity(itemId, newQuantity);

                      </div>

                    ))}    }  return (

                    {item.images.length > 4 && (

                      <div className="aspect-square rounded-md bg-muted flex items-center justify-center">  };    <div className="flex flex-col min-h-screen bg-background">

                        <span className="text-sm text-muted-foreground">

                          +{item.images.length - 4}      <Header />

                        </span>

                      </div>  const handleCheckout = async () => {      <main className="flex-1 container py-8">

                    )}

                  </div>    setIsCheckingOut(true);         <Button asChild variant="ghost" className="mb-4">



                  <div className="flex items-center justify-between">    try {            <Link href="/nesting-tool-13">

                    <div className="space-y-1">

                      <div className="text-sm text-muted-foreground">      // TODO: Implement Stripe checkout            <ArrowLeft className="mr-2 h-4 w-4" />

                        Base: ${item.pricing.basePrice.toFixed(2)} + Setup: ${item.pricing.setupFee.toFixed(2)}

                      </div>      console.log('Starting checkout process...');            Back to Nesting Tool

                      <div className="font-medium">

                        ${item.pricing.total.toFixed(2)} each      // This will be implemented in the next step            </Link>

                      </div>

                    </div>    } catch (error) {        </Button>



                    <div className="flex items-center space-x-3">      console.error('Checkout error:', error);

                      <div className="flex items-center space-x-2">

                        <Button    } finally {        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                          variant="outline"

                          size="sm"      setIsCheckingOut(false);          <div className="lg:col-span-2">

                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}

                        >    }            <Card>

                          <Minus className="h-3 w-3" />

                        </Button>  };                <CardHeader>

                        <Input

                          type="number"                    <CardTitle className="text-2xl font-headline">Your Shopping Cart</CardTitle>

                          min="1"

                          value={item.quantity}  return (                </CardHeader>

                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}

                          className="w-16 text-center"    <div className="container mx-auto px-4 py-8">                <CardContent>

                        />

                        <Button      <div className="flex items-center justify-between mb-8">                    {isLoading ? (

                          variant="outline"

                          size="sm"        <h1 className="text-3xl font-bold">Your Cart</h1>                         <div className="flex justify-center items-center h-48">

                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}

                        >        <Badge variant="secondary" className="text-lg px-3 py-1">                            <Loader2 className="h-12 w-12 animate-spin text-primary"/>

                          <Plus className="h-3 w-3" />

                        </Button>          {totalItems} {totalItems === 1 ? 'item' : 'items'}                        </div>

                      </div>

                      <div className="font-bold text-lg">        </Badge>                    ) : cartItems.length > 0 ? (

                        ${(item.pricing.total * item.quantity).toFixed(2)}

                      </div>      </div>                        <div className="space-y-4">

                    </div>

                  </div>                            {cartItems.map(item => (

                </div>

              </CardContent>      <div className="grid gap-8 lg:grid-cols-3">                                <CartItemRow key={item.id} item={item} onRemove={handleRemoveItem} />

            </Card>

          ))}        {/* Cart Items */}                            ))}

        </div>

        <div className="lg:col-span-2 space-y-4">                        </div>

        <div>

          <Card className="sticky top-4">          {items.map((item) => (                    ) : (

            <CardHeader>

              <CardTitle>Order Summary</CardTitle>            <Card key={item.id}>                         <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">

            </CardHeader>

            <CardContent className="space-y-4">              <CardHeader className="pb-4">                            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />

              <div className="space-y-2">

                {items.map((item) => (                <div className="flex items-start justify-between">                            <h3 className="mt-4 text-lg font-medium">Your cart is empty</h3>

                  <div key={item.id} className="flex justify-between text-sm">

                    <span>{item.name} × {item.quantity}</span>                  <div>                            <p className="mt-2 text-sm text-muted-foreground">

                    <span>${(item.pricing.total * item.quantity).toFixed(2)}</span>

                  </div>                    <CardTitle className="text-lg">{item.name}</CardTitle>                                Looks like you haven’t added any gang sheets yet.

                ))}

              </div>                    <p className="text-sm text-muted-foreground">                            </p>

              

              <div className="border-t pt-4">                      {item.sheetSize}" DTF Sheet • {item.layout.totalCopies} designs • {item.layout.utilization.toFixed(1)}% utilization                            <Button asChild className="mt-6">

                <div className="flex justify-between text-lg font-bold">

                  <span>Total</span>                    </p>                                <Link href="/nesting-tool-13">Start Building</Link>

                  <span>${totalPrice.toFixed(2)}</span>

                </div>                  </div>                            </Button>

              </div>

                  <Button                        </div>

              <div className="space-y-2">

                <Button                     variant="ghost"                    )}

                  onClick={handleCheckout}

                  disabled={isCheckingOut || items.length === 0}                    size="sm"                </CardContent>

                  className="w-full"

                  size="lg"                    onClick={() => removeItem(item.id)}            </Card>

                >

                  {isCheckingOut ? (                    className="text-destructive hover:text-destructive"          </div>

                    <>

                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />                  >          <div className="lg:col-span-1 lg:sticky lg:top-24">

                      Processing...

                    </>                    <Trash2 className="h-4 w-4" />            <Card>

                  ) : (

                    <>                  </Button>                <CardHeader>

                      <CreditCard className="mr-2 h-4 w-4" />

                      Checkout                </div>                    <CardTitle className="font-headline">Order Summary</CardTitle>

                    </>

                  )}              </CardHeader>                </CardHeader>

                </Button>

                              <CardContent>                <CardContent className="space-y-4">

                <Button 

                  variant="outline"                 <div className="space-y-4">                    <div className="flex justify-between">

                  onClick={clearCart}

                  className="w-full"                  {/* Images Preview */}                        <span className="text-muted-foreground">Subtotal</span>

                >

                  Clear Cart                  <div className="grid grid-cols-4 gap-2">                        <span>${subtotal.toFixed(2)}</span>

                </Button>

              </div>                    {item.images.slice(0, 4).map((image, index) => (                    </div>



              <div className="text-xs text-muted-foreground space-y-1">                      <div key={image.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">                     <div className="flex justify-between">

                <p>• High-quality DTF prints ready for heat press</p>

                <p>• 300 DPI print resolution</p>                        <img                        <span className="text-muted-foreground">Taxes</span>

                <p>• Fast turnaround time</p>

                <p>• Satisfaction guaranteed</p>                          src={image.url}                        <span>Calculated at checkout</span>

              </div>

            </CardContent>                          alt={`Design ${index + 1}`}                    </div>

          </Card>

        </div>                          className="object-cover w-full h-full"                     <div className="flex justify-between">

      </div>

    </div>                        />                        <span className="text-muted-foreground">Shipping</span>

  );

}                        {image.copies > 1 && (                        <span>Calculated at checkout</span>

                          <Badge className="absolute top-1 right-1 text-xs">                    </div>

                            {image.copies}x                </CardContent>

                          </Badge>                <Separator />

                        )}                <CardFooter className="flex-col items-stretch gap-4 pt-6">

                      </div>                    <div className="flex justify-between text-lg font-bold">

                    ))}                        <span>Estimated Total</span>

                    {item.images.length > 4 && (                        <span>${subtotal.toFixed(2)}</span>

                      <div className="aspect-square rounded-md bg-muted flex items-center justify-center">                    </div>

                        <span className="text-sm text-muted-foreground">                    <Button size="lg" disabled={cartItems.length === 0}>

                          +{item.images.length - 4}                        Proceed to Checkout

                        </span>                    </Button>

                      </div>                </CardFooter>

                    )}            </Card>

                  </div>          </div>

        </div>

                  {/* Pricing and Quantity */}      </main>

                  <div className="flex items-center justify-between">      <Footer />

                    <div className="space-y-1">    </div>

                      <div className="text-sm text-muted-foreground">  );

                        Base: ${item.pricing.basePrice.toFixed(2)} + Setup: ${item.pricing.setupFee.toFixed(2)}}

                      </div>
                      <div className="font-medium">
                        ${item.pricing.total.toFixed(2)} each
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="font-bold text-lg">
                        ${(item.pricing.total * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.pricing.total * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Checkout
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  className="w-full"
                >
                  Clear Cart
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• High-quality DTF prints ready for heat press</p>
                <p>• 300 DPI print resolution</p>
                <p>• Fast turnaround time</p>
                <p>• Satisfaction guaranteed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
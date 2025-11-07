'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { initSquarePayments, squareConfig } from '@/lib/square';

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardPayment, setCardPayment] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  
  // Customer information state
  const [customerInfo, setCustomerInfo] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
  }, [user, items, router]);

  // Initialize Square Payments
  useEffect(() => {
    const initPayments = async () => {
      try {
        if (!window.Square) {
          // Square SDK not loaded yet, will retry
          return;
        }
        
        const paymentsInstance = await initSquarePayments();
        setPayments(paymentsInstance);
        
        // Initialize card payment form
        const card = await paymentsInstance.card();
        await card.attach('#card-container');
        setCardPayment(card);
        
      } catch (error) {
        console.error('Failed to initialize Square payments:', error);
        toast({
          title: "Payment System Error",
          description: "Failed to load payment system. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    // Load Square SDK if not already loaded
    if (!window.Square) {
      const script = document.createElement('script');
      script.src = squareConfig.environment === 'production' 
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.onload = initPayments;
      document.head.appendChild(script);
    } else {
      initPayments();
    }
  }, [toast]);

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'] as const;
    
    for (const field of required) {
      if (!customerInfo[field]?.trim()) {
        toast({
          title: "Missing Information",
          description: `Please fill in all required fields.`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    if (!cardPayment) {
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm() || !cardPayment || !user) return;
    
    setIsLoading(true);
    
    try {
      // Tokenize the payment method
      const result = await cardPayment.tokenize();
      
      if (result.status === 'OK') {
        const paymentAmount = Math.round(totalPrice * 100);
        
        console.log('[CHECKOUT] Preparing payment:', {
          amount: paymentAmount,
          totalPrice,
          currency: 'CAD',
          itemCount: items.length
        });

        // Send payment to your backend
        const response = await fetch('/api/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: result.token,
            amount: paymentAmount,
            currency: 'CAD',
            customerInfo,
            cartItems: items,
            userId: user.uid,
          }),
        });
        
        const paymentResult = await response.json();
        
        if (paymentResult.success) {
          // Clear cart and redirect to success page
          clearCart();
          toast({
            title: "Payment Successful!",
            description: "Your order has been processed. You'll receive a confirmation email shortly.",
          });
          router.push(`/order-confirmation/${paymentResult.orderId}`);
        } else {
          throw new Error(paymentResult.error || 'Payment failed');
        }
      } else {
        throw new Error(result.errors?.[0]?.detail || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred processing your payment. Please try again.";
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || items.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={customerInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={customerInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={customerInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                  />
              </div>
            </div>
            <div>
              <Label htmlFor="zipCode">Postal Code *</Label>
              <Input
                id="zipCode"
                value={customerInfo.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                id="card-container"
                className="min-h-[60px] border rounded-md p-3 bg-background"
              >
                {/* Square card form will be inserted here */}
              </div>
              <div className="flex items-center mt-4 text-sm text-muted-foreground">
                <Lock className="mr-2 h-4 w-4" />
                Your payment information is secure and encrypted
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.sheetSize}" DTF Sheet • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.pricing.total * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at delivery</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay ${totalPrice.toFixed(2)}
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Secure payment processing by Square</p>
                <p>• 256-bit SSL encryption</p>
                <p>• Your card information is never stored</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
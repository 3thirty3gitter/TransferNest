'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, ArrowLeft, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <Header />
      <div className="h-16"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></span>
                Contact Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-slate-200 font-semibold">First Name *</Label>
                    <Input
                      id="firstName"
                      value={customerInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-slate-200 font-semibold">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={customerInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-200 font-semibold">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-200 font-semibold">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"></span>
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="text-slate-200 font-semibold">Address *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-slate-200 font-semibold">City *</Label>
                    <Input
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-slate-200 font-semibold">State *</Label>
                    <Input
                      id="state"
                      value={customerInfo.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                    />
                </div>
              </div>
              <div>
                <Label htmlFor="zipCode" className="text-slate-200 font-semibold">Postal Code *</Label>
                <Input
                  id="zipCode"
                  value={customerInfo.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                />
              </div>
            </div>
          </div>

            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Payment Information
              </h2>
              <div 
                id="card-container"
                className="min-h-[60px] border border-white/20 rounded-xl p-4 bg-white/5"
              >
                {/* Square card form will be inserted here */}
              </div>
              <div className="flex items-center mt-4 text-sm text-slate-400">
                <Lock className="mr-2 h-4 w-4" />
                Your payment information is secure and encrypted
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="glass-strong rounded-2xl p-6 border border-white/10 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></span>
                Order Summary
              </h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-3 border-b border-white/10">
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-slate-400">
                          {item.sheetSize}" DTF Sheet • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-white">
                        ${(item.pricing.total * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-400">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>Calculated at delivery</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                      <span className="text-white">Total</span>
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      Pay ${totalPrice.toFixed(2)}
                    </>
                  )}
                </button>

                <div className="text-xs text-slate-400 space-y-1 pt-4">
                  <p>• Secure payment processing by Square</p>
                  <p>• 256-bit SSL encryption</p>
                  <p>• Your card information is never stored</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
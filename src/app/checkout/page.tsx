'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useCheckoutTracking } from '@/hooks/use-abandoned-cart-tracking';
import { initSquarePayments, squareConfig } from '@/lib/square';
import { calculateTax, formatTaxBreakdown } from '@/lib/tax-calculator';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AddressAutocomplete from '@/components/address-autocomplete';

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { trackCheckoutStart, trackPaymentFailed, trackOrderComplete } = useCheckoutTracking();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardPayment, setCardPayment] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  
  // Delivery method state
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [useShippingAddress, setUseShippingAddress] = useState(false);
  
  // Customer information state (includes billing/contact address)
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'CA',
  });

  // Separate shipping address (only if different from contact)
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'CA',
  });

  // Shipping Rates State
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentComplete, setPaymentComplete] = useState(false);
  
  // Discount Code State
  const [discountCode, setDiscountCode] = useState('');
  const [discountCodeError, setDiscountCodeError] = useState<string | null>(null);
  const [discountCodeSuccess, setDiscountCodeSuccess] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    discountId: string;
    freeShipping?: boolean;
  } | null>(null);

  // Redirect if not authenticated or cart is empty (but not after successful payment)
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Don't redirect to cart if payment was just completed (cart is being cleared)
    if (items.length === 0 && !paymentComplete) {
      router.push('/cart');
      return;
    }
    
    // Track checkout start for abandoned cart recovery
    if (user && items.length > 0 && !paymentComplete) {
      trackCheckoutStart();
    }

    // Load customer profile from Firestore
    const loadCustomerProfile = async () => {
      try {
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          
          if (profileData.discountPercentage) {
            setDiscountPercentage(profileData.discountPercentage);
          }

          setCustomerInfo({
            email: user.email || '',
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            city: profileData.city || '',
            state: profileData.state || '',
            zipCode: profileData.zipCode || '',
            country: profileData.country || 'CA',
          });
        } else {
          // Fallback to basic user info if no profile exists
          setCustomerInfo(prev => {
            const updates: any = { email: user.email || '' };
            
            if (user.displayName) {
              const nameParts = user.displayName.trim().split(' ');
              if (nameParts.length >= 2) {
                updates.firstName = nameParts[0];
                updates.lastName = nameParts.slice(1).join(' ');
              } else if (nameParts.length === 1) {
                updates.firstName = nameParts[0];
              }
            }
            
            return { ...prev, ...updates };
          });
        }
      } catch (error) {
        console.error('Error loading customer profile:', error);
        // Still populate email even if profile load fails
        setCustomerInfo(prev => ({ ...prev, email: user.email || '' }));
      }
    };

    loadCustomerProfile();

    // Load company settings
    fetch('/api/company-settings')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setCompanySettings(result.data);
        }
      })
      .catch(err => console.error('Failed to load company settings:', err));
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

  const handleShippingInputChange = (field: string, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch shipping rates when address changes
  useEffect(() => {
    const fetchRates = async () => {
      if (deliveryMethod !== 'shipping') {
        setShippingRates([]);
        setSelectedShippingRate(null);
        return;
      }

      const addressToUse = useShippingAddress ? shippingAddress : customerInfo;
      
      // Check if we have enough info to fetch rates
      if (!addressToUse.address || !addressToUse.city || !addressToUse.state || !addressToUse.zipCode) {
        return;
      }

      setIsFetchingRates(true);
      setShippingError(null);
      setShippingRates([]);
      setSelectedShippingRate(null);

      try {
        const response = await fetch('/api/shipping/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: addressToUse,
            items: items
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setShippingRates(data.rates);
          // Auto-select cheapest option
          if (data.rates.length > 0) {
            setSelectedShippingRate(data.rates[0]);
          }
        } else {
          setShippingError(data.message || 'Failed to fetch shipping rates');
        }
      } catch (error) {
        console.error('Error fetching rates:', error);
        setShippingError('Unable to load shipping rates');
      } finally {
        setIsFetchingRates(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchRates, 1000);
    return () => clearTimeout(timer);
  }, [deliveryMethod, useShippingAddress, shippingAddress, customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.zipCode, items]);

  // Calculate shipping cost (accounting for free shipping discount)
  const shippingCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    if (appliedDiscount?.freeShipping) return 0;
    return selectedShippingRate ? parseFloat(selectedShippingRate.rate) : 0;
  }, [deliveryMethod, selectedShippingRate, appliedDiscount]);

  // Calculate discount amount from both profile discount and promo codes
  const discountAmount = useMemo(() => {
    // Profile-based percentage discount
    let profileDiscount = (totalPrice * discountPercentage) / 100;
    
    // Promo code discount
    let promoDiscount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        promoDiscount = (totalPrice * appliedDiscount.value) / 100;
      } else if (appliedDiscount.type === 'fixed') {
        promoDiscount = Math.min(appliedDiscount.value, totalPrice);
      }
      // free_shipping type doesn't add to discountAmount, handled separately
    }
    
    return profileDiscount + promoDiscount;
  }, [totalPrice, discountPercentage, appliedDiscount]);

  const discountedSubtotal = totalPrice - discountAmount;

  // Calculate tax dynamically based on contact location (postal code determines tax)
  const taxCalculation = useMemo(() => {
    const taxableAmount = discountedSubtotal + shippingCost;
    
    // Tax is ALWAYS based on contact information province/state
    if (customerInfo.state && customerInfo.country) {
      return calculateTax(taxableAmount, customerInfo.state, customerInfo.country);
    }
    
    // Default to Ontario if no state selected yet
    return calculateTax(taxableAmount, 'ON', 'CA');
  }, [discountedSubtotal, shippingCost, customerInfo.state, customerInfo.country]);

  const orderTotal = discountedSubtotal + shippingCost + taxCalculation.total;

  // Apply discount code
  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountCodeError('Please enter a discount code');
      return;
    }
    
    setIsValidatingCode(true);
    setDiscountCodeError(null);
    setDiscountCodeSuccess(null);
    
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          orderTotal: totalPrice,
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          customerId: user?.uid,
          sheetSizes: items.map(item => item.sheetSize?.toString())
        })
      });
      
      const result = await response.json();
      
      if (result.valid && result.discount) {
        setAppliedDiscount({
          code: result.discount.code,
          type: result.discount.type,
          value: result.discount.value,
          discountId: result.discount.id,
          freeShipping: result.freeShipping
        });
        setDiscountCodeSuccess(result.message);
        setDiscountCode('');
      } else {
        setDiscountCodeError(result.message || 'Invalid discount code');
      }
    } catch (error) {
      setDiscountCodeError('Failed to validate discount code');
    } finally {
      setIsValidatingCode(false);
    }
  };
  
  // Remove applied discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeSuccess(null);
  };

  const validateForm = () => {
    const contactRequired = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'] as const;
    
    // Validate contact information (always required, includes address for tax calculation)
    for (const field of contactRequired) {
      if (!customerInfo[field]?.trim()) {
        toast({
          title: "Missing Information",
          description: `Please fill in all contact information fields.`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Validate separate shipping address if shipping is selected AND different address is chosen
    if (deliveryMethod === 'shipping' && useShippingAddress) {
      const shippingRequired = ['address', 'city', 'state', 'zipCode'] as const;
      for (const field of shippingRequired) {
        if (!shippingAddress[field]?.trim()) {
          toast({
            title: "Missing Shipping Address",
            description: `Please fill in all shipping address fields.`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    
    // Validate shipping rate selection
    if (deliveryMethod === 'shipping' && !selectedShippingRate) {
      toast({
        title: "Shipping Method Required",
        description: "Please select a shipping method.",
        variant: "destructive",
      });
      return false;
    }

    // Skip payment validation if order total is 0 (100% discount)
    if (orderTotal > 0 && !cardPayment) {
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
    // Prevent double-click race condition
    if (isLoading) {
      console.log('[CHECKOUT] Payment already in progress, ignoring duplicate click');
      return;
    }
    
    // Skip cardPayment check if order total is 0
    if (!validateForm() || (!cardPayment && orderTotal > 0) || !user) return;
    
    setIsLoading(true);
    
    try {
      let token = '100-PERCENT-DISCOUNT';
      
      // Only tokenize if there is a payment amount
      if (orderTotal > 0 && cardPayment) {
        // Tokenize the payment method
        const result = await cardPayment.tokenize();
        
        if (result.status !== 'OK') {
          throw new Error(result.errors?.[0]?.detail || 'Payment failed');
        }
        token = result.token!;
      }
      
      const paymentAmount = Math.round(orderTotal * 100);
      
      console.log('[CHECKOUT] Preparing payment payload:', {
        token,
        paymentAmount,
        orderTotal,
        discountPercentage,
        discountAmount
      });

      // Send payment to your backend
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: token,
          amount: paymentAmount,
          currency: 'CAD',
          customerInfo,
          shippingAddress: deliveryMethod === 'shipping' && useShippingAddress ? shippingAddress : customerInfo,
          deliveryMethod,
          useShippingAddress,
          cartItems: items,
          userId: user.uid,
          taxAmount: taxCalculation.total,
          taxRate: taxCalculation.rate,
          taxBreakdown: {
            gst: taxCalculation.gst,
            pst: taxCalculation.pst,
            hst: taxCalculation.hst,
          },
          shippingCost,
          shippingRate: selectedShippingRate,
          discountPercentage,
          discountAmount,
          // Promo code info
          promoCode: appliedDiscount ? {
            code: appliedDiscount.code,
            discountId: appliedDiscount.discountId,
            type: appliedDiscount.type,
            value: appliedDiscount.value,
            freeShipping: appliedDiscount.freeShipping
          } : null,
        }),
      });
      
      const paymentResult = await response.json();
      
      if (paymentResult.success) {
        // Mark payment as complete to prevent cart redirect race condition
        setPaymentComplete(true);
        
        // Track order completion for abandoned cart recovery
        trackOrderComplete(paymentResult.orderId);
        
        // Clear cart and redirect to success page
        clearCart();
        toast({
          title: "Order Successful!",
          description: "Your order has been processed. You'll receive a confirmation email shortly.",
        });
        router.push(`/order-confirmation/${paymentResult.orderId}`);
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred processing your payment. Please try again.";
      
      // Track payment failure for abandoned cart recovery
      trackPaymentFailed(errorMessage);
      
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
      <div className="h-40"></div>
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
                <div>
                  <Label htmlFor="contact-address" className="text-slate-200 font-semibold">Address *</Label>
                  <AddressAutocomplete
                    value={customerInfo.address}
                    onChange={(value) => handleInputChange('address', value)}
                    onAddressSelect={(components) => {
                      setCustomerInfo(prev => ({
                        ...prev,
                        address: components.address,
                        city: components.city,
                        state: components.state,
                        zipCode: components.zipCode,
                        country: components.country,
                      }));
                    }}
                    placeholder="Start typing your address..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                    country={customerInfo.country}
                  />
                </div>
                <div>
                  <Label htmlFor="contact-country" className="text-slate-200 font-semibold">Country *</Label>
                  <select
                    id="contact-country"
                    value={customerInfo.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 mt-2 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CA" className="bg-slate-800">Canada</option>
                    <option value="US" className="bg-slate-800">United States</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-city" className="text-slate-200 font-semibold">City *</Label>
                    <Input
                      id="contact-city"
                      value={customerInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-state" className="text-slate-200 font-semibold">
                      {customerInfo.country === 'CA' ? 'Province' : 'State'} *
                    </Label>
                    <Input
                      id="contact-state"
                      value={customerInfo.state}
                      onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                      required
                      placeholder={customerInfo.country === 'CA' ? 'e.g., ON' : 'e.g., CA'}
                      maxLength={2}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact-zipCode" className="text-slate-200 font-semibold">
                    {customerInfo.country === 'CA' ? 'Postal Code' : 'ZIP Code'} *
                  </Label>
                  <Input
                    id="contact-zipCode"
                    value={customerInfo.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value.toUpperCase())}
                    required
                    placeholder={customerInfo.country === 'CA' ? 'A1A 1A1' : '12345'}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"></span>
                Delivery Method
              </h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('shipping')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    deliveryMethod === 'shipping'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                      deliveryMethod === 'shipping' ? 'border-blue-500' : 'border-white/40'
                    }`}>
                      {deliveryMethod === 'shipping' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">Ship to Address</div>
                      <div className="text-sm text-slate-400 mt-1">
                        We'll ship your order to your address
                      </div>
                      <div className="text-sm text-blue-400 mt-1">
                        {selectedShippingRate 
                          ? `$${parseFloat(selectedShippingRate.rate).toFixed(2)}` 
                          : 'Calculated at next step'}
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    deliveryMethod === 'pickup'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                      deliveryMethod === 'pickup' ? 'border-purple-500' : 'border-white/40'
                    }`}>
                      {deliveryMethod === 'pickup' && (
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">Local Pickup</div>
                      <div className="text-sm text-slate-400 mt-1">
                        Pick up your order at our location
                      </div>
                      <div className="text-sm text-purple-400 mt-1">
                        {companySettings?.companyInfo?.pickupInfo?.address || '133 Church St, St Catharines, ON L2R 3C7'}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {deliveryMethod === 'shipping' && (
              <div className="glass-strong rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"></span>
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <input
                      type="checkbox"
                      id="useShippingAddress"
                      checked={useShippingAddress}
                      onChange={(e) => setUseShippingAddress(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-blue-500 bg-white/10 checked:bg-blue-500 cursor-pointer"
                    />
                    <Label htmlFor="useShippingAddress" className="text-white font-medium cursor-pointer">
                      Ship to a different address
                    </Label>
                  </div>

                  {!useShippingAddress && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <p className="text-slate-300 text-sm mb-2">Shipping to:</p>
                      <p className="text-white font-medium">{customerInfo.address || 'Address not entered'}</p>
                      <p className="text-white">{customerInfo.city && customerInfo.state && customerInfo.zipCode
                        ? `${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode}`
                        : 'City, Province/State, Postal Code not entered'}
                      </p>
                      <p className="text-white">{customerInfo.country === 'CA' ? 'Canada' : 'United States'}</p>
                    </div>
                  )}

                  {useShippingAddress && (
                    <>
                      <div>
                        <Label htmlFor="shipping-address" className="text-slate-200 font-semibold">Address *</Label>
                        <AddressAutocomplete
                          value={shippingAddress.address}
                          onChange={(value) => handleShippingInputChange('address', value)}
                          onAddressSelect={(components) => {
                            setShippingAddress(prev => ({
                              ...prev,
                              address: components.address,
                              city: components.city,
                              state: components.state,
                              zipCode: components.zipCode,
                              country: components.country,
                            }));
                          }}
                          placeholder="Start typing your shipping address..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                          country={shippingAddress.country}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-country" className="text-slate-200 font-semibold">Country *</Label>
                        <select
                          id="shipping-country"
                          value={shippingAddress.country}
                          onChange={(e) => handleShippingInputChange('country', e.target.value)}
                          required
                          className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 mt-2 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="CA" className="bg-slate-800">Canada</option>
                          <option value="US" className="bg-slate-800">United States</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shipping-city" className="text-slate-200 font-semibold">City *</Label>
                          <Input
                            id="shipping-city"
                            value={shippingAddress.city}
                            onChange={(e) => handleShippingInputChange('city', e.target.value)}
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-state" className="text-slate-200 font-semibold">
                            {shippingAddress.country === 'CA' ? 'Province' : 'State'} *
                          </Label>
                          <Input
                            id="shipping-state"
                            value={shippingAddress.state}
                            onChange={(e) => handleShippingInputChange('state', e.target.value.toUpperCase())}
                            required
                            placeholder={shippingAddress.country === 'CA' ? 'e.g., ON' : 'e.g., CA'}
                            maxLength={2}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shipping-zipCode" className="text-slate-200 font-semibold">
                          {shippingAddress.country === 'CA' ? 'Postal Code' : 'ZIP Code'} *
                        </Label>
                        <Input
                          id="shipping-zipCode"
                          value={shippingAddress.zipCode}
                          onChange={(e) => handleShippingInputChange('zipCode', e.target.value.toUpperCase())}
                          required
                          placeholder={shippingAddress.country === 'CA' ? 'A1A 1A1' : '12345'}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 mt-2"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Shipping Rates Selection */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Shipping Method</h3>
                  
                  {isFetchingRates ? (
                    <div className="flex items-center justify-center p-8 bg-white/5 rounded-xl border border-white/10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-slate-300">Calculating shipping rates...</span>
                    </div>
                  ) : shippingError ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      {shippingError}
                    </div>
                  ) : shippingRates.length > 0 ? (
                    <div className="space-y-3">
                      {shippingRates.map((rate) => (
                        <button
                          key={rate.id}
                          type="button"
                          onClick={() => setSelectedShippingRate(rate)}
                          className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                            selectedShippingRate?.id === rate.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedShippingRate?.id === rate.id ? 'border-blue-500' : 'border-white/40'
                            }`}>
                              {selectedShippingRate?.id === rate.id && (
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-white">{rate.service}</div>
                              <div className="text-xs text-slate-400">
                                {rate.delivery_days ? `${rate.delivery_days} business days` : 'Standard shipping'}
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-white">
                            ${parseFloat(rate.rate).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-sm text-center">
                      Enter your full address to see shipping rates
                    </div>
                  )}
                </div>
              </div>
            )}

            {deliveryMethod === 'pickup' && (
              <div className="glass-strong rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></span>
                  Pickup Information
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-white font-medium mb-2">Pickup Location:</p>
                    {companySettings?.companyInfo?.pickupInfo?.address ? (
                      <>
                        <p className="text-slate-300 mb-2">{companySettings.companyInfo.pickupInfo.address}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companySettings.companyInfo.pickupInfo.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Open in Google Maps
                        </a>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-300 mb-2">133 Church St</p>
                        <p className="text-slate-300 mb-2">St Catharines, ON L2R 3C7</p>
                        <a
                          href="https://www.google.com/maps/search/?api=1&query=133+Church+St,+St+Catharines,+ON+L2R+3C7"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Open in Google Maps
                        </a>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-white font-medium mb-2">Hours:</p>
                    {companySettings?.companyInfo?.pickupInfo?.hours ? (
                      Object.entries(companySettings.companyInfo.pickupInfo.hours)
                        .sort(([dayA], [dayB]) => {
                          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                          return days.indexOf(dayA.toLowerCase()) - days.indexOf(dayB.toLowerCase());
                        })
                        .map(([day, hours]: [string, any]) => (
                        <p key={day} className="text-slate-300 capitalize">
                          {day}: {hours}
                        </p>
                      ))
                    ) : (
                      <>
                        <p className="text-slate-300">Monday - Friday: 9:00 AM - 5:00 PM</p>
                        <p className="text-slate-300">Saturday: 10:00 AM - 2:00 PM</p>
                        <p className="text-slate-300">Sunday: Closed</p>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-300 text-sm">
                      <strong>Note:</strong> {companySettings?.companyInfo?.pickupInfo?.instructions || "You'll receive an email when your order is ready for pickup. Please bring your order confirmation and a valid ID."}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                
                {/* Discount Code Input */}
                <div className="border-t border-white/10 pt-4">
                  <Label className="text-slate-200 text-sm">Have a promo code?</Label>
                  {appliedDiscount ? (
                    <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-mono font-bold">{appliedDiscount.code}</span>
                        <span className="text-green-300 text-sm">
                          {appliedDiscount.type === 'percentage' && `${appliedDiscount.value}% off`}
                          {appliedDiscount.type === 'fixed' && `$${appliedDiscount.value} off`}
                          {appliedDiscount.type === 'free_shipping' && 'Free shipping'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value.toUpperCase());
                          setDiscountCodeError(null);
                        }}
                        placeholder="Enter code"
                        className="bg-white/10 border-white/20 text-white font-mono uppercase flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && applyDiscountCode()}
                      />
                      <button
                        type="button"
                        onClick={applyDiscountCode}
                        disabled={isValidatingCode || !discountCode.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        {isValidatingCode ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {discountCodeError && (
                    <p className="text-red-400 text-sm mt-1">{discountCodeError}</p>
                  )}
                  {discountCodeSuccess && !appliedDiscount && (
                    <p className="text-green-400 text-sm mt-1">{discountCodeSuccess}</p>
                  )}
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                    {discountPercentage > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Account Discount ({discountPercentage}%)</span>
                        <span>-${((totalPrice * discountPercentage) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {appliedDiscount && appliedDiscount.type !== 'free_shipping' && (
                      <div className="flex justify-between text-green-400">
                        <span>Promo: {appliedDiscount.code}</span>
                        <span>
                          {appliedDiscount.type === 'percentage' && `-${appliedDiscount.value}%`}
                          {appliedDiscount.type === 'fixed' && `-$${(appliedDiscount.value || 0).toFixed(2)}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className={shippingCost > 0 ? "text-white" : "text-green-400"}>
                        {appliedDiscount?.freeShipping ? (
                          <span className="flex items-center gap-1">
                            <span className="line-through text-slate-500">${parseFloat(selectedShippingRate?.rate || '0').toFixed(2)}</span>
                            Free
                          </span>
                        ) : shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax {customerInfo.state && `(${customerInfo.state})`}</span>
                      <span className="text-white">${taxCalculation.total.toFixed(2)}</span>
                    </div>
                    {taxCalculation.gst > 0 && (
                      <div className="flex justify-between text-sm text-slate-400 pl-4">
                        <span>GST (5%)</span>
                        <span>${taxCalculation.gst.toFixed(2)}</span>
                      </div>
                    )}
                    {taxCalculation.pst > 0 && (
                      <div className="flex justify-between text-sm text-slate-400 pl-4">
                        <span>PST ({(taxCalculation.pst / (totalPrice + shippingCost) * 100).toFixed(2)}%)</span>
                        <span>${taxCalculation.pst.toFixed(2)}</span>
                      </div>
                    )}
                    {taxCalculation.hst > 0 && (
                      <div className="flex justify-between text-sm text-slate-400 pl-4">
                        <span>HST ({(taxCalculation.rate * 100).toFixed(1)}%)</span>
                        <span>${taxCalculation.hst.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                      <span className="text-white">Total</span>
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${orderTotal.toFixed(2)}</span>
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
                      Pay ${orderTotal.toFixed(2)}
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
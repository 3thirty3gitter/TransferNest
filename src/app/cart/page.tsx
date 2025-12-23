'use client';

import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, ArrowRight, Package, ShieldCheck, RefreshCw, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import CopyrightModal from '@/components/copyright-modal';

export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem } = useCart();
  const { user } = useAuth();
  const [isCopyrightModalOpen, setIsCopyrightModalOpen] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // Check if any items are recovered from abandoned cart
  const hasRecoveredItems = items.some(item => (item as any).isRecoveredCart);
  const recoveredItemsCount = items.filter(item => (item as any).isRecoveredCart).length;

  useEffect(() => {
    if (hasRecoveredItems) {
      setShowRecoveryBanner(true);
      // Auto-hide banner after 10 seconds
      const timer = setTimeout(() => setShowRecoveryBanner(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [hasRecoveredItems]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
        <Header />
        <div className="h-40"></div>
        <div className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="max-w-md w-full glass-strong p-8 rounded-2xl border border-white/10 text-center">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Please Sign In</h1>
            <p className="text-slate-300 mb-8">
              You need to be signed in to view your cart and complete your purchase.
            </p>
            <Link 
              href="/login"
              className="block w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Sign In
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
        <Header />
        <div className="h-40"></div>
        <div className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="max-w-md w-full glass-strong p-8 rounded-2xl border border-white/10 text-center">
            <div className="w-20 h-20 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Your cart is empty</h1>
            <p className="text-slate-300 mb-8">
              Start creating your custom DTF gang sheets today. High quality, fast turnaround.
            </p>
            <Link 
              href="/nesting-tool"
              className="block w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Create Gang Sheet
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      <Header />
      <div className="h-40"></div>
      
      {/* Recovery Banner */}
      {showRecoveryBanner && hasRecoveredItems && (
        <div className="bg-gradient-to-r from-green-600/90 to-emerald-600/90 border-b border-green-400/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    Welcome back! We've restored {recoveredItemsCount} item{recoveredItemsCount !== 1 ? 's' : ''} to your cart.
                  </p>
                  <p className="text-green-100 text-sm">
                    Your gang sheet{recoveredItemsCount !== 1 ? 's are' : ' is'} ready to complete checkout.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowRecoveryBanner(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-400" />
            Your Cart
            <span className="text-lg font-normal text-slate-400 ml-2">({totalItems} items)</span>
          </h1>
          <Link 
            href="/nesting-tool"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-1"
          >
            + Add more items
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item.id}
                className="glass-strong rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Item Preview (Placeholder or actual preview if available) */}
                  <div className="w-full sm:w-32 h-32 bg-slate-800/50 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden relative">
                    {item.thumbnailUrl ? (
                      <Image 
                        src={item.thumbnailUrl} 
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <Package className="h-10 w-10 text-slate-600" />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                            {item.sheetSize}" Gang Sheet
                          </span>
                          <span className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                            DTF Transfer
                          </span>
                          {(item as any).isRecoveredCart && (
                            <span className="px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-medium">
                              Restored
                            </span>
                          )}
                        </div>
                        {/* Edit link for recovered items with full data */}
                        {(item as any).hasFullRecoveryData && item.images && item.images.length > 0 && (
                          <Link 
                            href={`/nesting-tool?restore=${item.id}`}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Gang Sheet
                          </Link>
                        )}
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                        title="Remove item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div className="text-slate-400 text-sm">
                        <p>Quantity: <span className="text-white font-medium">{item.quantity}</span></p>
                        <p>Unit Price: <span className="text-white font-medium">${item.pricing.total.toFixed(2)}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          ${(item.pricing.total * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-strong rounded-2xl p-6 border border-white/10 sticky top-44">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Shipping</span>
                  <span className="text-slate-500 text-sm">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax</span>
                  <span className="text-slate-500 text-sm">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-slate-200 font-medium">Estimated Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-right">CAD Currency</p>
              </div>

              <button 
                onClick={() => setIsCopyrightModalOpen(true)}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 group"
              >
                Proceed to Checkout
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure Checkout via Square</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <CopyrightModal 
        open={isCopyrightModalOpen} 
        onClose={() => setIsCopyrightModalOpen(false)} 
      />
    </div>
  );
}

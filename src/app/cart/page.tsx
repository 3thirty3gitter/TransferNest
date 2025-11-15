'use client';

import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { ShoppingCart, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Header />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="glass-strong rounded-3xl p-12 text-center max-w-md mx-auto border border-white/20">
            <ShoppingCart className="mx-auto h-16 w-16 text-slate-400 mb-6" />
            <h1 className="text-3xl font-bold text-white mb-3">Please Sign In</h1>
            <p className="text-slate-300 mb-6">You need to be signed in to view your cart.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105"
            >
              Sign In Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Header />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="glass-strong rounded-3xl p-12 text-center max-w-md mx-auto border border-white/20">
            <ShoppingCart className="mx-auto h-16 w-16 text-slate-400 mb-6" />
            <h1 className="text-3xl font-bold text-white mb-3">Your cart is empty</h1>
            <p className="text-slate-300 mb-6">Start creating your custom DTF gang sheets.</p>
            <Link
              href="/nesting-tool"
              className="inline-flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all hover:scale-105"
            >
              <Sparkles className="h-5 w-5" />
              Start Creating
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <Header />
      <div className="h-16"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Cart</h1>
          <p className="text-slate-300">{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="glass-strong rounded-2xl p-6 border border-white/10 hover:scale-102 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-slate-400">
                      {item.sheetSize}" DTF Sheet • {item.layout.totalCopies} designs
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all hover:scale-110"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <div className="text-slate-300">
                    <p className="text-sm">Sheet Size: {item.layout.sheetWidth}" × {item.layout.sheetHeight}"</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      ${(item.pricing.total * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-strong rounded-2xl p-6 border border-white/10 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></span>
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-400">Free</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax</span>
                  <span className="text-sm">Calculated at checkout</span>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">Total</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl text-center"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/nesting-tool"
                className="block w-full mt-3 py-3 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl transition-all text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { CheckCircle2, Download, Home, Package, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you'd fetch order details from your backend
    // For now, we'll just show the confirmation
    setLoading(false);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center glass-strong rounded-2xl p-12 border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      <Header />
      <div className="h-16"></div>
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      </div>

      <div className="container mx-auto p-6 max-w-3xl relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
          {/* Success Icon with Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="h-20 w-20 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Payment Successful!
            </h1>
            <p className="text-xl text-slate-300">Thank you for your order</p>
          </div>

          {/* Order Details Card */}
          <div className="w-full glass-strong rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Package className="h-6 w-6 text-green-400" />
                Order Details
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-slate-300">Order Number:</span>
                <span className="font-mono font-bold text-white text-lg">{orderId}</span>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
                <p className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-400" />
                  What happens next?
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </span>
                    <span>You'll receive a confirmation email with your order details</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </span>
                    <span>Your print-ready gang sheet files are being prepared</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </span>
                    <span>We'll notify you when your order is ready for production</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </span>
                    <span>Track your order status in the Orders section</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Package className="h-5 w-5" />
                  View My Orders
                  <ArrowRight className="h-5 w-5" />
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push('/')}
                    className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </button>
                  <button
                    onClick={() => router.push('/nesting-tool')}
                    className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Another
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Message */}
          <p className="text-center text-sm text-slate-400 max-w-md">
            Have questions about your order? Contact us at{' '}
            <a href="mailto:support@transfernest.com" className="text-green-400 hover:text-green-300 hover:underline transition-colors">
              support@transfernest.com
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

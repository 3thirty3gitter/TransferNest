'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Home, Package, Sparkles, Clock, Truck, Heart } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { getCompanySettings, type CompanySettings } from '@/lib/company-settings';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confettiVisible, setConfettiVisible] = useState(true);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    // In a real implementation, you'd fetch order details from your backend
    // For now, we'll just show the confirmation
    setLoading(false);
    
    // Hide confetti after animation
    const timer = setTimeout(() => setConfettiVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getCompanySettings();
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    }
    loadSettings();
  }, []);

  const email = settings?.companyInfo?.email || 'support@dtfwholesale.ca';
  const phone = settings?.companyInfo?.phone || '587-405-3005';

  if (loading) {
    return (
      <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Header />
      <div className="h-20"></div>
      
      {/* Confetti Effect */}
      {confettiVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col items-center space-y-8">
          
          {/* Success Icon with Animation */}
          <div className="relative animate-bounce-in">
            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6 shadow-2xl">
              <CheckCircle2 className="h-20 w-20 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Order Confirmed! 🎉
            </h1>
            <p className="text-2xl text-slate-300 font-medium">
              Thank you for your business!
            </p>
            <p className="text-lg text-slate-400 max-w-2xl">
              We truly appreciate you choosing DTF Wholesale Canada. Your order has been received and we're already getting started on bringing your designs to life!
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="w-full glass-strong border-slate-700/50 animate-slide-up">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="flex items-center gap-2 text-2xl text-white">
                <Package className="h-6 w-6 text-purple-400" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-xl text-purple-400">#{orderId}</span>
              </div>
              
              {/* What Happens Next */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <p className="text-lg font-semibold text-white">What happens next?</p>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 group">
                    <div className="bg-green-500/20 rounded-full p-1.5 mt-0.5 group-hover:bg-green-500/30 transition-colors">
                      <Mail className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Confirmation Email</p>
                      <p className="text-sm text-slate-400">You'll receive a detailed email with your order summary and invoice</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 group">
                    <div className="bg-blue-500/20 rounded-full p-1.5 mt-0.5 group-hover:bg-blue-500/30 transition-colors">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Gang Sheet Optimization</p>
                      <p className="text-sm text-slate-400">Our AI is already nesting your designs for perfect print efficiency</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 group">
                    <div className="bg-purple-500/20 rounded-full p-1.5 mt-0.5 group-hover:bg-purple-500/30 transition-colors">
                      <Clock className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Production (24-48 hours)</p>
                      <p className="text-sm text-slate-400">Your DTF transfers will be printed with professional quality</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 group">
                    <div className="bg-pink-500/20 rounded-full p-1.5 mt-0.5 group-hover:bg-pink-500/30 transition-colors">
                      <Truck className="h-4 w-4 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Shipping & Tracking</p>
                      <p className="text-sm text-slate-400">We'll notify you when your order ships with tracking information</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/30" 
                  size="lg"
                  onClick={() => router.push('/orders')}
                >
                  <Package className="mr-2 h-5 w-5" />
                  View My Orders
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-300"
                    onClick={() => router.push('/')}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-300"
                    onClick={() => router.push('/nesting-tool')}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Another
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thank You Message */}
          <div className="text-center space-y-4 animate-fade-in max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full">
              <Heart className="h-4 w-4 text-pink-400 animate-pulse" />
              <span className="text-sm text-pink-300 font-medium">Made with love by 3Thirty3 Ltd.</span>
            </div>
            
            <p className="text-slate-400">
              Questions about your order? We're here to help!<br />
              Contact us at{' '}
              <a 
                href={`mailto:${email}`} 
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors font-medium"
              >
                {email}
              </a>
              {' '}or call{' '}
              <a 
                href={`tel:${phone.replace(/[^0-9+]/g, '')}`} 
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors font-medium"
              >
                {phone}
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out 0.3s both;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.5s both;
        }
      `}</style>
    </div>
  );
}

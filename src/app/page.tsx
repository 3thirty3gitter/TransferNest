'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Star, UploadCloud, Wand2, ShoppingCart, Scissors, Sparkles, Zap, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/layout/footer';

interface Product {
  id: string;
  name: string;
  description: string;
  sheetSize: string;
  pricePerInch: number;
  basePrice: number;
  isActive: boolean;
  badge?: string;
  badgeColor?: string;
  gradient?: string;
  buttonGradient?: string;
  buttonHoverGradient?: string;
  checkmarkColor?: string;
  features?: string[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('isActive', '==', true), orderBy('sheetSize'));
        const snapshot = await getDocs(q);
        
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      <Header />
      {/* Spacer for fixed header */}
      <div className="h-16"></div>
      <main className="flex-1">
        {/* Hero Section with Animated Gradient Background */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed"></div>
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          </div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0wLTRoMnYtMmgtMnYyem0tMiAwdjJoMnYtMmgtMnptMC00aDJ2LTJoLTJ2MnptLTIgNHYyaDJ2LTJoLTJ6bTItMnYtMmgtMnYyaDJ6bS0yLTJ2LTJoLTJ2Mmgyem0tMiAwdi0yaC0ydjJoMnptMCAyaDJ2LTJoLTJ2MnptMCAydjJoMnYtMmgtMnptLTIgMHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

          <div className="container relative z-10 text-center px-4">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong mb-8 animate-float">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium">Canada's Premier DTF Transfer Service</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="text-white">Apparel Business</span>
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed">
              Premium DTF transfers with cutting-edge nesting technology. Upload your designs, 
              watch our AI optimize your gang sheets, and get professional results in minutes.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-6 text-lg glow group">
                <Link href="/nesting-tool" className="flex items-center gap-2">
                  Start Creating <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass-strong border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg">
                <Link href="#features" className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> See How It Works
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="glass rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">90%+</div>
                <div className="text-sm text-slate-400 mt-2">Utilization Rate</div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">$0.45</div>
                <div className="text-sm text-slate-400 mt-2">Per Linear Inch</div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">24hr</div>
                <div className="text-sm text-slate-400 mt-2">Turnaround</div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center gap-2 text-white/60">
              <span className="text-sm font-medium">Scroll to explore</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 to-transparent"></div>
          
          <div className="container relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
                <Scissors className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium">Choose Your Size</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Gang Sheet Sizes
                </span>
              </h2>
              <p className="max-w-3xl mx-auto text-slate-300 text-lg">
                Pick the perfect size for your project. Both options deliver professional results.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {loading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
                  <p className="mt-4 text-slate-300">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <p className="text-slate-300">No products available at this time.</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="glass-strong rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 hover:glow group">
                    <div className="p-8 md:p-10">
                      {product.badge && (
                        <div className={`inline-flex px-3 py-1 rounded-full bg-gradient-to-r ${product.badgeColor || 'from-blue-500 to-cyan-500'} text-white text-sm font-semibold mb-4`}>
                          {product.badge}
                        </div>
                      )}
                      <h3 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h3>
                      <p className="text-slate-300 text-lg leading-relaxed mb-8">
                        {product.description}
                      </p>
                      
                      {product.features && product.features.length > 0 && (
                        <ul className="space-y-3 mb-8">
                          {product.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-slate-300">
                              <CheckCircle className={`h-5 w-5 ${product.checkmarkColor || 'text-cyan-400'} flex-shrink-0`} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${product.gradient || 'from-blue-400 to-cyan-400'} bg-clip-text text-transparent`}>
                            ${product.pricePerInch.toFixed(2)}
                          </span>
                          <span className="text-slate-400 text-lg">/ linear inch</span>
                        </div>
                      </div>

                      <Button asChild size="lg" className={`w-full bg-gradient-to-r ${product.buttonGradient || 'from-blue-600 to-cyan-600'} hover:${product.buttonHoverGradient || 'from-blue-700 to-cyan-700'} text-white border-0 py-6 text-lg group-hover:scale-105 transition-transform`}>
                        <Link href="/nesting-tool" className="flex items-center justify-center gap-2">
                          <Scissors className="h-5 w-5" />
                          Build {product.sheetSize}" Sheet
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32 relative">
          <div className="container relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Powered by AI</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Why We're Different
                </span>
              </h2>
              <p className="max-w-3xl mx-auto text-slate-300 text-lg">
                Industry-leading technology meets unbeatable quality. Experience the future of DTF transfers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature Card 1 */}
              <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-300 group hover:glow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Wand2 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI-Powered Nesting</h3>
                <p className="text-slate-300 leading-relaxed">
                  Our intelligent algorithm achieves 90%+ sheet utilization, maximizing your ROI and minimizing waste on every order.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-300 group hover:glow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Star className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Premium Quality</h3>
                <p className="text-slate-300 leading-relaxed">
                  Vibrant colors, incredible detail, and a soft hand feel. Our transfers are engineered for excellence.
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-300 group hover:glow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Wash Tested</h3>
                <p className="text-slate-300 leading-relaxed">
                  Exceptional washability and stretch resistance. Your designs stay vibrant wash after wash.
                </p>
              </div>

              {/* Feature Card 4 */}
              <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-300 group hover:glow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Wholesale Pricing</h3>
                <p className="text-slate-300 leading-relaxed">
                  Pay by the inch and save big. Just $0.45/inch for 13" sheets and $0.59/inch for 17" sheets.
                </p>
              </div>

              {/* Feature Card 5 */}
              <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-300 group hover:glow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-slate-300 leading-relaxed">
                  Upload, nest, and order in minutes. Get your transfers delivered in 24-48 hours across Canada.
                </p>
              </div>

              {/* Feature Card 6 */}
              <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-300 group hover:glow">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Simple Workflow</h3>
                <p className="text-slate-300 leading-relaxed">
                  Upload your designs, let AI optimize placement, review, and checkout. It's that easy.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Showcase Section */}
        <section className="py-24 md:py-32 relative">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">Professional Results</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    Vibrant Prints,
                  </span>
                  <br />
                  <span className="text-white">Ready to Press</span>
                </h2>
                
                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                  From intricate logos to full-color graphics, our DTF transfers capture every detail with stunning clarity. 
                  Arrive at your door ready to press onto any fabric.
                </p>

                <div className="space-y-4">
                  <div className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Full-Color & Gradients</h4>
                        <p className="text-slate-300">No limitations on colors or design complexity. Print photo-realistic images with ease.</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Works on Any Fabric</h4>
                        <p className="text-slate-300">Perfect for cotton, polyester, blends, and more. One solution for all your needs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Fast Application</h4>
                        <p className="text-slate-300">Simple heat press application saves valuable production time. Just press and peel.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 relative">
                <div className="relative h-[500px] lg:h-[600px] rounded-3xl overflow-hidden glass-strong p-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
                  <Image 
                    src="https://picsum.photos/800/1000" 
                    alt="Colorful DTF transfers showcase"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover rounded-2xl"
                  />
                </div>
                
                {/* Floating Stats */}
                <div className="absolute -bottom-6 -left-6 glass-strong rounded-2xl p-6 max-w-[200px] hover:scale-110 transition-transform">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">10,000+</div>
                  <div className="text-sm text-slate-300 mt-1">Designs Printed</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 gradient-mesh opacity-30"></div>
          
          {/* Glass Container */}
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-12 md:p-16 text-center hover:scale-105 transition-all duration-500">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Join Hundreds of Happy Customers</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Ready to Transform
                </span>
                <br />
                <span className="text-white">Your Apparel Business?</span>
              </h2>

              <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
                Experience the quality and convenience of TransferNest. Create your first gang sheet in minutes and see the difference premium DTF transfers make.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-10 py-7 text-lg glow-accent group">
                  <Link href="/nesting-tool" className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Start Your Order Now
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="glass-strong border-white/30 text-white hover:bg-white/10 px-10 py-7 text-lg">
                  <Link href="/cart" className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    View Cart
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">90%+</div>
                    <div className="text-sm text-slate-400">Efficiency Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">24-48h</div>
                    <div className="text-sm text-slate-400">Delivery Time</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">100%</div>
                    <div className="text-sm text-slate-400">Canadian Made</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">500+</div>
                    <div className="text-sm text-slate-400">Happy Clients</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float-delayed"></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

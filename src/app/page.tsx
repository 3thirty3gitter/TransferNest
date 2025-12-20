'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Star, UploadCloud, Wand2, ShoppingCart, Scissors, Sparkles, Zap, TrendingUp, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/layout/footer';
import { useRouter } from 'next/navigation';
import { SEOFAQSection } from '@/components/seo/faq-section';

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
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleOpenWizard = () => {
    // Navigate to nesting tool with a query parameter to auto-open wizard
    router.push('/nesting-tool-17?openWizard=true');
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        
        console.log('Active products from DB:', productsData.map(p => ({ id: p.id, name: p.name, sheetSize: p.sheetSize })));
        console.log('Product count:', productsData.length);
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
      <div className="h-40"></div>
      <main className="flex-1">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/dtf-wholesale-candada-proudly-canadian.jpg"
              alt="DTF Wholesale Canada - Proudly Canadian"
              fill
              priority
              className="object-cover"
              quality={95}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-blue-950/60 to-slate-900/70"></div>
          </div>

          <div className="container relative z-10 text-center px-4">
            {/* Welcome Banner */}
            <div className="mb-8 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm md:text-base text-slate-200">
                🎉 Welcome to our new website! Questions? Contact us at{' '}
                <a href="mailto:orders@dtf-wholesale.ca" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  orders@dtf-wholesale.ca
                </a>
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="text-white">Apparel Business</span>
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed">
              Canadian owned and operated. Premium custom DTF transfers printed in Edmonton, Alberta. 
              Upload your designs, watch our AI optimize your gang sheets, and get professional results in minutes.
              100% Satisfaction Guaranteed.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-6 text-lg glow group">
                <Link href="/nesting-tool" className="flex items-center gap-2">
                  Build My Gang Sheet <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
              {/* Stat 1 */}
              <div className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 duration-300 text-center group">
                <div className="w-12 h-12 mx-auto bg-pink-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-pink-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">Fast Shipping</div>
                <div className="text-sm text-slate-400">Shipped within 24 hours from Edmonton</div>
                <div className="text-xs text-cyan-400 mt-1">Local pickup available!</div>
              </div>

              {/* Stat 2 */}
              <div className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 duration-300 text-center group">
                <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">Canadian</div>
                <div className="text-sm text-slate-400">Owned & Operated</div>
              </div>

              {/* Stat 3 */}
              <div className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 duration-300 text-center group">
                <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">Guaranteed</div>
                <div className="text-sm text-slate-400">100% Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* NEW: Size Wizard Feature Highlight */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-blue-950/40 to-transparent"></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

          <div className="container relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Content */}
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-bounce">
                    <Wand2 className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium">✨ NEW: Size Helper Wizard</span>
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                      Not Sure What Size?
                    </span>
                    <br />
                    <span className="text-white">We'll Help You Choose!</span>
                  </h2>
                  
                  <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-8">
                    New to DTF printing? Our friendly wizard walks you through 3 simple steps to determine 
                    the perfect print sizes for your project. No guesswork needed!
                  </p>

                  <div className="space-y-4 mb-10">
                    <div className="glass-strong rounded-2xl p-5 hover:scale-105 transition-transform flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Select Your Garment</h4>
                        <p className="text-slate-400">T-shirt, hoodie, tote bag, hat, or more</p>
                      </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-5 hover:scale-105 transition-transform flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Upload Your Design</h4>
                        <p className="text-slate-400">See your artwork on an interactive mockup</p>
                      </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-5 hover:scale-105 transition-transform flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Pick Locations & Quantities</h4>
                        <p className="text-slate-400">Front, back, sleeves - we recommend the perfect sizes</p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleOpenWizard} size="lg" className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-10 py-7 text-lg glow-accent group">
                    <Wand2 className="h-6 w-6" />
                    Try the Size Helper
                    <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </Button>

                  <p className="text-sm text-slate-400 mt-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Perfect for beginners • Takes less than 2 minutes
                  </p>
                </div>

                {/* Right: Visual */}
                <div className="relative">
                  <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all duration-500">
                    <div className="space-y-6">
                      {/* Mock wizard preview */}
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold">What are you printing on?</h3>
                          <div className="text-sm text-slate-400">Step 1 of 3</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {['👕', '🧥', '👜'].map((emoji, i) => (
                            <div key={i} className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 text-center hover:scale-110 transition-transform cursor-pointer border border-purple-500/30">
                              <div className="text-4xl mb-2">{emoji}</div>
                              <div className="text-xs font-medium">{['T-Shirt', 'Hoodie', 'Tote'][i]}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full"></div>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full"></div>
                      </div>

                      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-6 border border-green-500/30">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg mb-2 text-green-300">Recommended Sizes</h4>
                            <div className="space-y-1 text-sm text-slate-300">
                              <div>✓ Front Chest: 12" × 16"</div>
                              <div>✓ Full Back: 14" × 18"</div>
                              <div>✓ Sleeves: 3" × 4"</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -top-4 -right-4 glass-strong rounded-2xl p-4 hover:scale-110 transition-transform">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">2min</div>
                      <div className="text-xs text-slate-400 mt-1">Average Time</div>
                    </div>
                  </div>
                </div>
              </div>
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
                  Pay by the inch and save big. Just $0.67/inch for 17" wide sheets.
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
                    src="/DTF-Wholesale-Canada-premium-print.jpg" 
                    alt="DTF Wholesale Canada Premium Print Quality"
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
                Experience the quality and convenience of DTF Wholesale. Create your first gang sheet in minutes and see the difference premium DTF transfers make.
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

        {/* FAQ Section - SEO Optimized */}
        <SEOFAQSection />
      </main>
      <Footer />
    </div>
  );
}

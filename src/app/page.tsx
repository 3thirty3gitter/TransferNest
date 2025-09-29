
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Star, UploadCloud, Wand2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-card py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-50"></div>
           <div className="container relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tighter">
              Wholesale DTF Transfers in Canada
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Vibrant, durable, and ready-to-press Direct-to-Film transfers for your apparel business. Unbeatable quality and pricing, delivered fast.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/nesting-tool">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                Why Choose DTF Wholesale Canada?
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-muted-foreground text-lg">
                We provide top-tier DTF transfers that will elevate your products and streamline your production.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-card rounded-lg shadow-sm text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-headline font-semibold">Premium Quality</h3>
                <p className="mt-2 text-muted-foreground">
                  Our transfers boast vibrant colors, incredible detail, and a soft hand feel that your customers will love.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg shadow-sm text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-headline font-semibold">Durable & Long-Lasting</h3>
                <p className="mt-2 text-muted-foreground">
                  Engineered for excellent washability and stretch resistance, ensuring your designs look great over time.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg shadow-sm text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-headline font-semibold">Wholesale Pricing</h3>
                <p className="mt-2 text-muted-foreground">
                  Maximize your profits with our competitive gang sheet pricing. The more you print, the more you save.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                Create Your Custom Gang Sheet in 3 Easy Steps
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-muted-foreground text-lg">
                Our intelligent nesting tool makes it simple to create print-ready gang sheets.
              </p>
            </div>
            <div className="relative mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2"></div>
               <div className="absolute top-1/2 left-0 w-full flex justify-around -translate-y-1/2">
                   <div className="w-1/3 h-0.5 bg-primary"></div>
                   <div className="w-1/3 h-0.5 bg-primary"></div>
               </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-xl border-4 border-card">1</div>
                  <UploadCloud className="my-6 h-12 w-12 text-accent"/>
                  <h3 className="text-xl font-headline font-semibold">Upload Your Designs</h3>
                  <p className="mt-2 text-muted-foreground">Add all your artwork to our easy-to-use image manager.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-xl border-4 border-card">2</div>
                  <Wand2 className="my-6 h-12 w-12 text-accent"/>
                  <h3 className="text-xl font-headline font-semibold">Arrange Your Sheet</h3>
                  <p className="mt-2 text-muted-foreground">Use our AI tool to automatically nest your images for maximum efficiency.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-xl border-4 border-card">3</div>
                  <ShoppingCart className="my-6 h-12 w-12 text-accent"/>
                  <h3 className="text-xl font-headline font-semibold">Place Your Order</h3>
                  <p className="mt-2 text-muted-foreground">Add your completed gang sheet to the cart and check out. It's that simple!</p>
              </div>
            </div>
            <div className="text-center mt-12">
               <Button asChild size="lg">
                <Link href="/nesting-tool">
                  Build Your Gang Sheet
                  <Wand2 className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <section className="py-16 md:py-24">
            <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Vibrant Prints, Ready to Press</h2>
                    <p className="mt-4 text-muted-foreground text-lg">
                        From intricate logos to full-color graphics, our DTF transfers capture every detail with stunning clarity. They arrive at your door ready for you to press onto t-shirts, hoodies, hats, and more.
                    </p>
                    <ul className="mt-6 space-y-4">
                        <li className="flex items-start">
                            <CheckCircle className="h-6 w-6 text-accent mr-3 mt-1 flex-shrink-0" />
                            <span><span className="font-semibold">Full-Color & Gradients:</span> No limitations on colors or complexity.</span>
                        </li>
                         <li className="flex items-start">
                            <CheckCircle className="h-6 w-6 text-accent mr-3 mt-1 flex-shrink-0" />
                            <span><span className="font-semibold">For Any Fabric:</span> Works perfectly on cotton, polyester, blends, and more.</span>
                        </li>
                         <li className="flex items-start">
                            <CheckCircle className="h-6 w-6 text-accent mr-3 mt-1 flex-shrink-0" />
                            <span><span className="font-semibold">Fast Application:</span> Simple heat press application saves you valuable production time.</span>
                        </li>
                    </ul>
                </div>
                <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
                     <Image 
                        src="https://picsum.photos/600/400" 
                        alt="Colorful DTF transfers on a t-shirt"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        data-ai-hint="colorful t-shirt"
                      />
                </div>
            </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-card">
          <div className="container py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              Ready to Upgrade Your Apparel?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg">
              Experience the quality and convenience of DTF Wholesale Canada. Create your first gang sheet today and see the difference.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/nesting-tool">
                  Start Your Order <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

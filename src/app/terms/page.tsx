import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Header />
      <div className="h-20"></div>
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="glass-strong rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          
          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
              <p>
                By accessing and using DTF Wholesale's services, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Service Description</h2>
              <p>
                DTF Wholesale provides DTF (Direct-to-Film) transfer printing services with AI-powered 
                gang sheet nesting. We offer tools to upload designs, optimize layouts, and order 
                professional transfers for apparel decoration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Only upload content you have rights to use</li>
                <li>Not upload offensive, illegal, or copyrighted content without permission</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
              <p>
                You retain all rights to the designs you upload. By using our service, you grant us 
                permission to process, reproduce, and print your designs solely for the purpose of 
                fulfilling your orders.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Orders and Payment</h2>
              <p>
                All orders are subject to acceptance. Prices are subject to change. Payment is processed 
                securely through Square. Refunds may be issued at our discretion for defective products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Shipping and Returns</h2>
              <p>
                We aim to ship orders within 24 hours. Shipping times vary by location. Returns are 
                accepted for defective products within 14 days of receipt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
              <p>
                DTF Wholesale is not liable for indirect, incidental, or consequential damages arising 
                from the use of our services. Our total liability shall not exceed the amount paid 
                for the specific order in question.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of our services 
                after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
              <p>
                For questions about these Terms of Service, contact us at support@dtfwholesale.ca
              </p>
            </section>

            <p className="text-sm text-slate-400 mt-8">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

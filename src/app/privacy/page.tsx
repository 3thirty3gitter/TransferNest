import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Header />
      <div className="h-28"></div>
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="glass-strong rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          
          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
              <p>
                We collect information you provide directly to us, including your name, email address, 
                and uploaded images when you use our DTF transfer services. We also automatically collect 
                certain information about your device and how you interact with our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process your orders and provide our services</li>
                <li>Send you order confirmations and updates</li>
                <li>Respond to your comments and questions</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. 
                Your images are stored securely in Firebase Storage, and payment information is 
                processed through Square's secure payment gateway.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. 
                Contact us at support@dtfwholesale.ca to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at 
                support@dtfwholesale.ca
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

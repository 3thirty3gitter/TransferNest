'use client';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useState, useEffect } from 'react';
import { getCompanySettings, type CompanySettings } from '@/lib/company-settings';

export default function TermsOfService() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);

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

  const email = settings?.companyInfo?.email || 'orders@dtf-wholesale.ca';
  const phone = settings?.companyInfo?.phone || '587-405-3005';
  const address = settings?.companyInfo?.address ? (
    `${settings.companyInfo.address.street}, ${settings.companyInfo.address.city}, ${settings.companyInfo.address.state}`
  ) : (
    '201-5415 Calgary Trail NW, Edmonton, Alberta'
  );

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Header />
      <div className="h-40"></div>
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="glass-strong rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          
          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
              <p>
                By accessing and using TransferNest's services (operated by 3Thirty3 Ltd. o/a DTF Wholesale Canada), 
                including our website, design tools, nesting wizard, direct nesting tool, or placing any order, 
                you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                If you do not agree to these terms in their entirety, you must immediately cease using our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Service Description</h2>
              <p>
                TransferNest (operated by 3Thirty3 Ltd. o/a DTF Wholesale Canada) provides DTF (Direct-to-Film) 
                transfer printing services with AI-powered gang sheet nesting and a conversational design wizard. 
                We offer multiple tools to upload designs, optimize layouts, specify product placements, and order 
                professional transfers for apparel decoration.
              </p>
              <p>
                Our services include but are not limited to: image upload and management, automated nesting algorithms, 
                product mockup previews, size recommendations, custom print file generation, order fulfillment, and 
                direct-to-customer nesting tools for manual layout optimization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Design Wizard and Size Specifications</h2>
              <p className="font-semibold text-amber-300">
                ⚠️ CRITICAL: You are solely responsible for all size specifications entered through our design wizard 
                or nesting tool.
              </p>
              <p>When using our design wizard or direct nesting tool, you acknowledge and agree that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Size recommendations are industry guidelines only and may not be appropriate for your specific garments</li>
                <li>You must physically measure your actual garments with a measuring tape before finalizing sizes</li>
                <li>The same design dimensions will appear different on different garment sizes (e.g., Youth vs. Adult 4XL)</li>
                <li>You are responsible for understanding how design size relates to garment size</li>
                <li>Aspect ratios are maintained automatically - changing width adjusts height proportionally</li>
                <li>By typing your name in the signature field, you confirm you have verified all measurements</li>
                <li><strong>NO REFUNDS, RETURNS, OR REPRINTS</strong> will be issued for size-related issues if you provided incorrect specifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property and Content Ownership</h2>
              <p className="font-semibold text-red-300">
                ⚠️ CRITICAL: You represent and warrant that you own or have obtained all necessary rights, licenses, 
                and permissions for any content you upload.
              </p>
              <p>By uploading content to our platform, you represent and warrant that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You own the content or have explicit legal authorization to use it commercially</li>
                <li>Your content does not infringe upon any copyright, trademark, patent, trade secret, right of publicity, right of privacy, or other intellectual property rights of any third party</li>
                <li>You have obtained all necessary model releases, property releases, and permissions for any persons, logos, brands, or properties depicted in your content</li>
                <li>Your content does not violate any law, statute, ordinance, or regulation</li>
                <li>Your content is not defamatory, libelous, obscene, pornographic, threatening, harassing, or hateful</li>
              </ul>
              <p className="font-semibold text-red-300 mt-3">
                INDEMNIFICATION: You agree to indemnify, defend, and hold harmless 3Thirty3 Ltd. o/a DTF Wholesale Canada, 
                TransferNest, its owners, officers, employees, contractors, and agents from any and all claims, demands, damages, 
                liabilities, losses, costs, and expenses (including reasonable attorney's fees and court costs) arising 
                from or related to: (a) any actual or alleged intellectual property infringement, (b) any breach of 
                these representations and warranties, (c) any third-party claims related to your uploaded content, 
                (d) any legal actions or proceedings arising from the production or distribution of your designs.
              </p>
              <p className="mt-3">
                You retain all rights to the designs you upload. By using our service, you grant us a limited, 
                non-exclusive, worldwide license to process, reproduce, store, and print your designs solely for 
                the purpose of fulfilling your orders and providing our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">User Responsibilities and Conduct</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, complete, and truthful information in all interactions</li>
                <li>Maintain the security and confidentiality of your account credentials</li>
                <li>Only upload content you have explicit legal rights to use commercially</li>
                <li>Not upload offensive, illegal, infringing, defamatory, or inappropriate content</li>
                <li>Not use our services for any unlawful purpose or to violate any laws</li>
                <li>Not attempt to circumvent any security features or access restrictions</li>
                <li>Not engage in any activity that could damage, disable, or impair our services</li>
                <li>Not use automated systems (bots, scrapers) without written permission</li>
                <li>Comply with all applicable federal, state, and local laws and regulations</li>
                <li>Verify all specifications, sizes, quantities, and details before finalizing orders</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Orders, Pricing, and Payment</h2>
              <p>
                All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any 
                order for any reason including but not limited to: suspected copyright infringement, inappropriate content, 
                pricing errors, technical issues, suspected fraud, or unavailability of materials.
              </p>
              <p>
                Prices are subject to change without notice. The price charged will be the price displayed at checkout. 
                All prices are in Canadian Dollars (CAD) unless otherwise specified. Applicable taxes will be added at checkout.
              </p>
              <p>
                Payment is processed securely through Square and/or Stripe. By providing payment information, you represent 
                that you are authorized to use the payment method and authorize us to charge all fees incurred.
              </p>
              <p>
                All sales are final once production begins. Order modifications or cancellations must be requested immediately 
                and are not guaranteed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Production and Quality</h2>
              <p>
                We strive to produce high-quality DTF transfers. However, print quality depends on many factors including 
                your original image resolution, file format, color profiles, and design complexity.
              </p>
              <p>Quality-related conditions:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We recommend uploading high-resolution images (300 DPI minimum)</li>
                <li>Colors may vary slightly from screen display due to printing process and monitor calibration</li>
                <li>We are not responsible for pixelation or quality issues resulting from low-resolution uploads</li>
                <li>Small text and fine details may not reproduce clearly depending on size and resolution</li>
                <li>Our automated nesting may rotate designs for optimal sheet utilization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Shipping, Delivery, and Returns</h2>
              <p>
                We aim to ship orders within 24-48 business hours after order confirmation. Shipping times vary by 
                carrier and destination. We are not responsible for carrier delays, lost packages (after confirmed delivery), 
                or customs delays for international shipments.
              </p>
              <p>
                <strong>Return Policy:</strong> Due to the custom nature of our products, returns are only accepted for 
                manufacturing defects (e.g., printing errors, damaged transfers, incorrect items shipped). Returns must 
                be requested within 14 days of delivery with photographic evidence.
              </p>
              <p>
                <strong>NO RETURNS OR REFUNDS</strong> will be provided for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Size-related issues when you provided the specifications</li>
                <li>Color variations from your screen display</li>
                <li>Low quality resulting from low-resolution uploads</li>
                <li>Copyright or intellectual property disputes</li>
                <li>Changes in your design requirements after production begins</li>
                <li>Customer error in specifications, quantities, or product selection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
              <p className="font-semibold text-amber-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <p>
                3Thirty3 Ltd. o/a DTF Wholesale Canada, TransferNest, and all affiliated entities, officers, directors, 
                employees, contractors, and agents SHALL NOT BE LIABLE for any indirect, incidental, special, consequential, 
                punitive, or exemplary damages arising from or related to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use or inability to use our services</li>
                <li>Any errors, mistakes, or inaccuracies in content or services</li>
                <li>Personal injury or property damage resulting from your use of our services</li>
                <li>Unauthorized access to our servers or any data stored therein</li>
                <li>Interruption or cessation of services</li>
                <li>Any bugs, viruses, or harmful code transmitted through our services</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Copyright infringement claims by third parties</li>
                <li>Size-related issues or customer specification errors</li>
              </ul>
              <p className="mt-3">
                OUR TOTAL LIABILITY to you for any claim arising from or related to these terms or our services 
                SHALL NOT EXCEED the amount you paid for the specific order in question, or $100 CAD, whichever is less.
              </p>
              <p className="mt-3">
                These limitations apply regardless of the legal theory (contract, tort, negligence, strict liability, 
                or otherwise) and even if we have been advised of the possibility of such damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Warranty Disclaimer</h2>
              <p className="font-semibold">
                OUR SERVICES AND PRODUCTS ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS 
                FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="mt-3">
                We do not warrant that our services will be uninterrupted, secure, error-free, or that defects will 
                be corrected. We make no warranties about the accuracy, reliability, completeness, or timeliness of 
                our services, content, or products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Data Privacy and Security</h2>
              <p>
                We collect and process personal information as described in our Privacy Policy. By using our services, 
                you consent to such collection and processing. While we implement reasonable security measures, we cannot 
                guarantee absolute security of data transmitted or stored.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to our services at any time, with or without 
                notice, for any reason including but not limited to: violation of these terms, suspected fraudulent 
                activity, copyright infringement, abusive behavior, or failure to pay amounts owed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Governing Law and Disputes</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of the Province 
                of Alberta, Canada, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these terms or our services shall be resolved through binding arbitration 
                in accordance with the Arbitration Act (Alberta), except for intellectual property disputes and claims 
                for injunctive relief which may be brought in the courts of Alberta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Severability</h2>
              <p>
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions 
                shall continue in full force and effect. The invalid provision shall be modified to the minimum 
                extent necessary to make it valid and enforceable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
              <p>
                We reserve the right to modify, amend, or update these terms at any time without prior notice. 
                Changes will be effective immediately upon posting to our website. Your continued use of our 
                services after changes constitutes acceptance of the modified terms. It is your responsibility 
                to review these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Entire Agreement</h2>
              <p>
                These Terms of Service, together with our Privacy Policy and any other policies referenced herein, 
                constitute the entire agreement between you and 3Thirty3 Ltd. o/a DTF Wholesale Canada regarding 
                your use of our services and supersede all prior agreements and understandings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
              <p>
                For questions about these Terms of Service, intellectual property concerns, or general inquiries, 
                contact us at:
              </p>
              <div className="mt-3 space-y-1">
                <p><strong>Legal Name:</strong> 3Thirty3 Ltd. o/a DTF Wholesale Canada</p>
                <p><strong>Operating As:</strong> TransferNest / DTF Wholesale Canada</p>
                <p><strong>Address:</strong> {address}</p>
                <p><strong>Phone:</strong> {phone}</p>
                <p><strong>Email:</strong> {email}</p>
              </div>
            </section>

            <p className="text-sm text-slate-400 mt-8 pt-8 border-t border-slate-700">
              Last updated: November 28, 2025<br />
              Version: 2.0 - Comprehensive Protection Update
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

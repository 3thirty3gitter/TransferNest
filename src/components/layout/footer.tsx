'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings, type CompanySettings } from '@/lib/company-settings';

export default function Footer() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getCompanySettings();
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading company settings for footer:', error);
      }
    }
    loadSettings();
  }, []);

  // Always use the official contact email
  const email = 'orders@dtf-wholesale.ca';
  const phone = settings?.companyInfo?.phone || '587-405-3005';
  const address = settings?.companyInfo?.address ? (
    <>
      {settings.companyInfo.address.street}<br/>
      {settings.companyInfo.address.city}, {settings.companyInfo.address.state} {settings.companyInfo.address.zipCode}
    </>
  ) : (
    <>201-5415 Calgary Trail NW<br/>Edmonton, AB T6H 4J9</>
  );

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-transparent to-black/20 backdrop-blur-sm mt-20" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Image 
                src="/DTF Wholesale Canadian Owned.png" 
                alt="DTF Wholesale Canada Logo" 
                width={234} 
                height={65} 
                className="h-auto w-40"
              />
            </div>
            <p className="text-sm text-slate-400">
              DTF Wholesale Canada - A 3Thirty3 Company
            </p>
            <p className="text-sm text-slate-400">
              Premium DTF transfers with cutting-edge AI nesting technology. Proudly Canadian owned and operated in Edmonton, Alberta.
            </p>
          </div>

          {/* Quick Links - SEO internal linking */}
          <nav aria-label="Quick Links">
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/nesting-tool-17" className="text-slate-400 hover:text-white transition-colors">
                  Gang Sheet Builder
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-400 hover:text-white transition-colors">
                  DTF Printing Blog
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-slate-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-slate-400 hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-slate-400 hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-slate-400 hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact - with microdata */}
          <div itemScope itemType="https://schema.org/LocalBusiness">
            <meta itemProp="name" content="DTF Wholesale Canada" />
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`mailto:${email}`} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2" itemProp="email">
                  <Mail className="h-4 w-4" />
                  {email}
                </a>
              </li>
              <li>
                <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2" itemProp="telephone">
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              </li>
              <li className="text-slate-400 flex items-start gap-2" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <span itemProp="streetAddress">201-5415 Calgary Trail NW</span><br/>
                  <span itemProp="addressLocality">Edmonton</span>, <span itemProp="addressRegion">AB</span> <span itemProp="postalCode">T6H 4J9</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Business Hours & Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Business Hours</h3>
            <ul className="space-y-2 text-sm text-slate-400 mb-6">
              <li>Mon - Fri: 9am - 5pm MST</li>
              <li>Sat, Sun & Holidays: Closed</li>
            </ul>
            <h3 className="text-white font-semibold mb-3">Our Services</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>Custom DTF Transfers</li>
              <li>Gang Sheet Printing</li>
              <li>Rush Order Processing</li>
              <li>Canada-Wide Shipping</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} DTF Wholesale Canada. All Rights Reserved.
          </p>
          <nav aria-label="Legal" className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

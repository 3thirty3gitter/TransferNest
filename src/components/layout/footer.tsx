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
    <footer className="border-t border-white/10 bg-gradient-to-b from-transparent to-black/20 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Image 
                src="/DTF Wholesale Canadian Owned.png" 
                alt="DTF Wholesale" 
                width={234} 
                height={65} 
                className="h-auto w-40"
              />
            </div>
            <p className="text-sm text-slate-400">
              DTF Wholesale Canada - A 3Thirty3 Company
            </p>
            <p className="text-sm text-slate-400">
              Premium DTF transfers with cutting-edge AI nesting technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/nesting-tool" className="text-slate-400 hover:text-white transition-colors">
                  Create Gang Sheet
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-slate-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-slate-400 hover:text-white transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-slate-400 hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`mailto:${email}`} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {email}
                </a>
              </li>
              <li>
                <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              </li>
              <li className="text-slate-400 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4">Business Hours</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Mon - Fri: 9am - 5pm MST</li>
              <li>Sat, Sun & Holidays: Closed</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} DTF Wholesale. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

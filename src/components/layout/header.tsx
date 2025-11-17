'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, LogOut, ShoppingCart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsShrunk(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const headerClasses = `
    fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-lg transition-all duration-300 ease-in-out
    ${isShrunk ? 'h-24' : 'h-32'}
  `;

  const logoClasses = `
    transition-all duration-300 ease-in-out object-contain
    ${isShrunk ? 'h-16 w-auto' : 'h-20 w-auto'}
  `;

  const navLinkClasses = `
    px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 ease-in-out
    ${isShrunk ? 'text-xs' : 'text-sm'}
  `;

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.png" 
              alt="DTF Wholesale" 
              width={234} 
              height={65} 
              className={logoClasses}
              priority
            />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 font-medium text-white">
            <Link href="/nesting-tool" className={navLinkClasses}>
              Create Gang Sheet
            </Link>
            <Link href="/#features" className={navLinkClasses}>
              Features
            </Link>
            <Link href="/cart" className={`relative ${navLinkClasses} flex items-center gap-2`}>
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {totalItems > 0 && (
                <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 px-2 py-0.5 text-xs shadow-lg animate-pulse">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/account" className="flex items-center space-x-2 text-white hover:opacity-80 transition-opacity">
                  <User className="h-4 w-4" />
                  <span className={`${isShrunk ? 'text-xs' : 'text-sm'} transition-all duration-300`}>{user.displayName || user.email}</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className={`text-white font-semibold rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 ease-in-out flex items-center gap-2 ${isShrunk ? 'px-3 py-1.5 text-xs bg-white/20' : 'px-4 py-2 text-sm bg-white/20'}`}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className={`text-white font-semibold rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 ease-in-out ${isShrunk ? 'px-3 py-1.5 text-xs bg-white/20' : 'px-4 py-2 text-sm bg-white/20'}`}>
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg border-t border-white/20">
          <nav className="px-4 py-4 space-y-3">
            <Link 
              href="/nesting-tool" 
              className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Gang Sheet
            </Link>
            <Link 
              href="/#features" 
              className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/cart" 
              className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center justify-between"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </span>
              {totalItems > 0 && (
                <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 shadow-lg animate-pulse">
                  {totalItems}
                </Badge>
              )}
            </Link>
            
            <div className="border-t border-white/20 pt-3">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    {user.displayName || user.email}
                  </Link>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="block text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

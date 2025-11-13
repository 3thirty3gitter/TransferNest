'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/contexts/cart-context';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, LogOut, ShoppingCart, Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.3)'}}>
            <Sparkles className="h-6 w-6" />
            <span>TransferNest</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-white">
            <Link href="/nesting-tool" className="group relative px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
              <span className="flex items-center gap-2">
                Create Gang Sheet
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                  New
                </span>
              </span>
            </Link>
            <Link href="/#features" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
              Features
            </Link>
            <Link href="/cart" className="relative px-4 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2">
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
                <div className="flex items-center space-x-2 text-white">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.displayName || user.email}</span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/30 hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/30 hover:bg-white/30 transition-colors">
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
              <span className="flex items-center justify-between">
                <span>Create Gang Sheet</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                  New
                </span>
              </span>
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
                  <div className="text-white px-4 py-2 text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user.displayName || user.email}
                  </div>
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

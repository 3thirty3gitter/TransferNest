'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, LogOut } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold font-headline text-primary md:text-3xl">
          DTF Wholesale Canada
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/nesting-tool-13" className="text-foreground hover:text-primary transition-colors">
            Build Your 13" Sheet
          </Link>
          <Link href="/nesting-tool-17" className="text-foreground hover:text-primary transition-colors">
            Build Your 17" Sheet
          </Link>
          <Link href="/cart" className="text-foreground hover:text-primary transition-colors">
            Cart
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{user.displayName || user.email}</span>
              </div>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                size="sm"
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

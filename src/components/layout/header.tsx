
'use client';

import { ShoppingCart, User, LogOut, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';


export default function Header() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  // TODO: Re-implement cart count fetching with a robust client-side data fetching strategy.
  // The previous implementation using server actions was causing server-side rendering crashes.
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCartCount(0); // Clear cart count on sign out
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-bold font-headline text-primary md:text-3xl">
          DTF Wholesale Canada
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button asChild variant="ghost">
             <Link href="/nesting-tool">Nesting Tool</Link>
          </Button>
           <Button asChild variant="ghost" className="hidden sm:inline-flex">
             <Link href="/nesting-tester">
                <TestTube2 className="mr-2 h-4 w-4" />
                Nesting Tester
             </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
            <Link href="/cart">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                    <Badge variant="destructive" className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0">{cartCount}</Badge>
                )}
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

import { ShoppingCart, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Header() {
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
          <Button variant="ghost" size="icon" aria-label="Shopping Cart">
            <ShoppingCart className="h-6 w-6" />
          </Button>
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>
    </header>
  );
}

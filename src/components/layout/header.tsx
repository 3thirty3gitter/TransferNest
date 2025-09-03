import { ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary md:text-3xl">
          TransferNest
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
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

import Link from 'next/link';

export default function Header() {
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
      </div>
    </div>
  );
}

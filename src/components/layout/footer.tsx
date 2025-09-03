import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} DTF Wholesale Canada. All Rights Reserved.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/terms" className="text-muted-foreground hover:text-primary">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-primary">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

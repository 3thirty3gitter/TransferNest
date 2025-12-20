import type { Metadata } from 'next';
import { PAGE_METADATA, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.checkout.title,
  description: PAGE_METADATA.checkout.description,
  keywords: PAGE_METADATA.checkout.keywords,
  alternates: {
    canonical: `${SITE_CONFIG.url}/checkout`,
  },
  robots: {
    index: false, // Checkout pages shouldn't be indexed
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

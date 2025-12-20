import type { Metadata } from 'next';
import { PAGE_METADATA, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.cart.title,
  description: PAGE_METADATA.cart.description,
  keywords: PAGE_METADATA.cart.keywords,
  alternates: {
    canonical: `${SITE_CONFIG.url}/cart`,
  },
  robots: {
    index: false, // Cart pages shouldn't be indexed
    follow: true,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

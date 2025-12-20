import type { Metadata } from 'next';
import { PAGE_METADATA, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.orders.title,
  description: PAGE_METADATA.orders.description,
  keywords: PAGE_METADATA.orders.keywords,
  alternates: {
    canonical: `${SITE_CONFIG.url}/orders`,
  },
  robots: {
    index: false, // Orders page shouldn't be indexed
    follow: true,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

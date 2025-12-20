import type { Metadata } from 'next';
import { PAGE_METADATA, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.account.title,
  description: PAGE_METADATA.account.description,
  keywords: PAGE_METADATA.account.keywords,
  alternates: {
    canonical: `${SITE_CONFIG.url}/account`,
  },
  robots: {
    index: false, // Account pages shouldn't be indexed
    follow: true,
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

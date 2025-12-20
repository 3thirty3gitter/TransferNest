import type { Metadata } from 'next';
import { PAGE_METADATA, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.login.title,
  description: PAGE_METADATA.login.description,
  keywords: PAGE_METADATA.login.keywords,
  alternates: {
    canonical: `${SITE_CONFIG.url}/login`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

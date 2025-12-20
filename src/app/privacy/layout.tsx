import type { Metadata } from 'next';
import { PAGE_METADATA, SITE_CONFIG, generateBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.privacy.title,
  description: PAGE_METADATA.privacy.description,
  keywords: PAGE_METADATA.privacy.keywords,
  alternates: {
    canonical: `${SITE_CONFIG.url}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const breadcrumb = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Privacy Policy', url: '/privacy' },
]);

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}

import type { Metadata } from 'next';
import { SITE_CONFIG, generateBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Terms of Service | DTF Wholesale Canada',
  description: 'Read the terms and conditions for using DTF Wholesale Canada services. Includes size specification policies, intellectual property guidelines, and order terms.',
  keywords: ['terms of service', 'DTF terms', 'conditions', 'printing terms', 'refund policy'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Breadcrumb for terms page
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Terms of Service', url: '/terms' },
]);

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}

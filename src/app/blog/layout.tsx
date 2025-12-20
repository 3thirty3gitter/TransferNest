import type { Metadata } from 'next';
import { PAGE_METADATA, SITE_CONFIG, DEFAULT_OG_IMAGE, generateBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.blog.title,
  description: PAGE_METADATA.blog.description,
  keywords: PAGE_METADATA.blog.keywords,
  openGraph: {
    title: 'DTF Printing Blog | Tips, Tutorials & News',
    description: 'Expert DTF printing tips, tutorials, and industry news from Canadian professionals. Learn heat press techniques, business tips, and more.',
    url: `${SITE_CONFIG.url}/blog`,
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DTF Wholesale Canada Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DTF Printing Blog | Tips & Tutorials',
    description: 'Learn DTF printing techniques from Canadian experts. Free guides and tutorials.',
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/blog`,
  },
};

// Generate breadcrumb schema for blog pages
const blogBreadcrumb = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Blog', url: '/blog' },
]);

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogBreadcrumb) }}
      />
      {children}
    </>
  );
}

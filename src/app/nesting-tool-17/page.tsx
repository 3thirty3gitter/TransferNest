import type { Metadata } from 'next';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import NestingTool from '@/components/nesting-tool';
import { Suspense } from 'react';
import { PAGE_METADATA, SITE_CONFIG, DEFAULT_OG_IMAGE, generateBreadcrumbSchema, generateProductSchema, generateHowToSchema } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: PAGE_METADATA.nestingTool.title,
  description: PAGE_METADATA.nestingTool.description,
  keywords: PAGE_METADATA.nestingTool.keywords,
  openGraph: {
    title: 'Free DTF Gang Sheet Builder | Create Custom Layouts Online',
    description: 'Use our free online gang sheet builder to maximize your DTF transfer value. Upload images, arrange layouts, and order custom DTF transfers instantly.',
    url: `${SITE_CONFIG.url}/nesting-tool-17`,
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DTF Gang Sheet Builder - Create Custom Layouts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free DTF Gang Sheet Builder',
    description: 'Upload your designs, arrange them on gang sheets, get instant pricing. No minimums!',
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/nesting-tool-17`,
  },
};

// Structured data for this page
const pageJsonLd = [
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Gang Sheet Builder', url: '/nesting-tool-17' },
  ]),
  generateProductSchema({
    name: 'Custom DTF Gang Sheet',
    description: 'Create your own gang sheet layout with our free online builder. Upload multiple designs, arrange them efficiently, and order custom DTF transfers.',
    price: 15.00,
    sheetSize: '22" x 17"',
  }),
  generateHowToSchema({
    name: 'How to Create a DTF Gang Sheet',
    description: 'Step-by-step guide to creating a custom DTF gang sheet using our online builder.',
    totalTime: 'PT10M',
    steps: [
      { name: 'Upload Your Designs', text: 'Click the upload button and select your PNG, JPG, or WebP image files. You can upload multiple designs at once.' },
      { name: 'Set Design Sizes', text: 'Specify the print size for each design. Our AI can recommend optimal sizes based on your images.' },
      { name: 'Arrange on Sheet', text: 'Our algorithm automatically arranges your designs efficiently, or you can manually adjust positions.' },
      { name: 'Review and Order', text: 'Preview your gang sheet layout, check the pricing, and add to cart when ready.' },
    ],
  }),
];

function NestingToolFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glass-strong rounded-2xl p-8">
        <div className="animate-pulse text-white">Loading your workspace...</div>
      </div>
    </div>
  )
}

export default async function NestingTool17Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const openWizard = resolvedSearchParams.openWizard === 'true';

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Page-specific structured data */}
      {pageJsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      
      <Header />
      {/* Spacer for fixed header */}
      <div className="h-40"></div>
      <main className="flex-1">
        <Suspense fallback={<NestingToolFallback/>}>
          <NestingTool sheetWidth={17} openWizard={openWizard} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

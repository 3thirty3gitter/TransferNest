import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { GlobalErrorHandler } from '@/components/global-error-handler';
import { 
  SITE_CONFIG, 
  DEFAULT_OG_IMAGE,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebsiteSchema,
  generateServiceSchema,
  generateFAQSchema,
  COMMON_FAQS
} from '@/lib/seo-config';

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f172a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'DTF Wholesale Canada | Custom Direct to Film Transfers | Edmonton, Alberta',
    template: '%s | DTF Wholesale Canada',
  },
  description: SITE_CONFIG.description,
  keywords: [
    'DTF transfers Canada', 
    'Direct to Film Edmonton', 
    'Custom DTF transfers', 
    'Wholesale DTF Canada', 
    'Edmonton t-shirt printing', 
    'DTF gang sheets Canada',
    'gang sheet builder',
    'custom t-shirt transfers',
    'heat press transfers Canada',
    'bulk DTF printing',
    'DTF printing service Canada',
    'custom apparel printing Edmonton',
    'no minimum DTF transfers',
    'DTF wholesale pricing',
  ],
  metadataBase: new URL(SITE_CONFIG.url),
  
  // Alternate language versions
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'en-CA': SITE_CONFIG.url,
    },
  },
  
  // Authors and publisher
  authors: [{ name: 'DTF Wholesale Canada', url: SITE_CONFIG.url }],
  creator: 'DTF Wholesale Canada',
  publisher: 'DTF Wholesale Canada',
  
  // Robots directives
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Category for better classification
  category: 'Printing Services',
  
  // Open Graph
  openGraph: {
    title: 'DTF Wholesale Canada | Premium Direct to Film Transfers',
    description: 'Canadian owned and operated in Edmonton, Alberta. High-quality DTF transfers with 100% satisfaction guaranteed. No minimums, fast turnaround.',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DTF Wholesale Canada - Premium DTF Transfers, Proudly Canadian',
        type: 'image/jpeg',
      },
      {
        url: '/DTF-Wholesale-Canada-premium-print.jpg',
        width: 1200,
        height: 630,
        alt: 'DTF Wholesale Canada Premium Print Quality',
        type: 'image/jpeg',
      },
    ],
    countryName: 'Canada',
  },
  
  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'DTF Wholesale Canada | Custom Direct to Film Transfers',
    description: 'Canadian owned DTF transfers. Premium quality, no minimums, fast shipping across Canada. Try our free gang sheet builder!',
    images: [DEFAULT_OG_IMAGE],
    creator: '@dtfwholesaleca',
    site: '@dtfwholesaleca',
  },
  
  // Verification tags (add your verification codes here)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  
  // App-specific metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DTF Wholesale',
  },
  
  // Format detection
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

// Combine all structured data schemas for comprehensive SEO
const jsonLdSchemas = [
  generateOrganizationSchema(),
  generateLocalBusinessSchema(),
  generateWebsiteSchema(),
  generateServiceSchema(),
  generateFAQSchema(COMMON_FAQS.slice(0, 5)), // Top 5 FAQs for homepage
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <html lang="en-CA" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        
        {/* DNS Prefetch for third-party services */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Fonts with display swap for better CLS */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* Google Maps (if needed) */}
        {apiKey && (
          <script
            src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`}
            async
            defer
          ></script>
        )}
        
        {/* Structured Data - Multiple Schemas */}
        {jsonLdSchemas.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className="font-body antialiased">
        <GlobalErrorHandler />
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

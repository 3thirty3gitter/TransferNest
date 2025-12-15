import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';

export const metadata: Metadata = {
  title: 'DTF Wholesale Canada | Custom Direct to Film Transfers | Edmonton, Alberta',
  description: 'Canadian owned and operated. Premium custom DTF transfers printed in Edmonton, Alberta. No minimums, fast turnaround, and 100% satisfaction guaranteed. The best direct to film transfers in Canada.',
  keywords: ['DTF transfers Canada', 'Direct to Film Edmonton', 'Custom DTF transfers', 'Wholesale DTF Canada', 'Edmonton t-shirt printing', 'DTF gang sheets Canada'],
  metadataBase: new URL('https://dtf-wholesale.ca'),
  openGraph: {
    title: 'DTF Wholesale Canada | Premium Direct to Film Transfers',
    description: 'Canadian owned and operated in Edmonton, Alberta. High-quality DTF transfers with 100% satisfaction guaranteed.',
    url: 'https://dtf-wholesale.ca',
    siteName: 'DTF Wholesale Canada',
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: '/dtf-wholesale-candada-proudly-canadian.jpg',
        width: 1200,
        height: 630,
        alt: 'DTF Wholesale Canada - Proudly Canadian',
      },
    ],
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'DTF Wholesale Canada',
  image: 'https://dtf-wholesale.ca/dtf-wholesale-candada-proudly-canadian.jpg',
  description: 'Premium custom DTF transfers printed in Edmonton, Alberta. Canadian owned and operated.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '201-5415 Calgary Trail NW',
    addressLocality: 'Edmonton',
    addressRegion: 'AB',
    postalCode: 'T6H 4J9',
    addressCountry: 'CA'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 53.5461,
    longitude: -113.4938
  },
  url: 'https://dtf-wholesale.ca',
  telephone: '+15874053005',
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
      ],
      opens: '09:00',
      closes: '17:00'
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        {apiKey && (
          <script
            src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`}
            async
            defer
          ></script>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
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

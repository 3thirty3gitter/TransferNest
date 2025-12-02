import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';

export const metadata: Metadata = {
  title: 'DTF Wholesale Canada | Custom Direct to Film Transfers | Edmonton, Alberta',
  description: 'Canadian owned and operated. Premium custom DTF transfers printed in Edmonton, Alberta. No minimums, same-day shipping, and 100% satisfaction guaranteed. The best direct to film transfers in Canada.',
  keywords: ['DTF transfers Canada', 'Direct to Film Edmonton', 'Custom DTF transfers', 'Wholesale DTF Canada', 'Edmonton t-shirt printing', 'DTF gang sheets Canada'],
  openGraph: {
    title: 'DTF Wholesale Canada | Premium Direct to Film Transfers',
    description: 'Canadian owned and operated in Edmonton, Alberta. High-quality DTF transfers with 100% satisfaction guaranteed.',
    url: 'https://transfernest.ca',
    siteName: 'DTF Wholesale Canada',
    locale: 'en_CA',
    type: 'website',
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
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'DTF Wholesale Canada',
  image: 'https://transfernest.ca/dtf-wholesale-candada-proudly-canadian.jpg',
  description: 'Premium custom DTF transfers printed in Edmonton, Alberta. Canadian owned and operated.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Edmonton',
    addressLocality: 'Edmonton',
    addressRegion: 'AB',
    addressCountry: 'CA'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 53.5461,
    longitude: -113.4938
  },
  url: 'https://transfernest.ca',
  telephone: '+15555555555', // Placeholder, should be updated if real number exists
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

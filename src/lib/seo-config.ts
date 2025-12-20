/**
 * Centralized SEO Configuration
 * All meta tags, structured data, and SEO settings
 */

export const SITE_CONFIG = {
  name: 'DTF Wholesale Canada',
  tagline: 'Premium Direct to Film Transfers',
  url: 'https://dtf-wholesale.ca',
  description: 'Canadian owned and operated. Premium custom DTF transfers printed in Edmonton, Alberta. No minimums, fast turnaround, and 100% satisfaction guaranteed. The best direct to film transfers in Canada.',
  locale: 'en_CA',
  twitterHandle: '@dtfwholesaleca',
  email: 'orders@dtf-wholesale.ca',
  phone: '+15874053005',
  address: {
    street: '201-5415 Calgary Trail NW',
    city: 'Edmonton',
    province: 'AB',
    postalCode: 'T6H 4J9',
    country: 'CA',
  },
  coordinates: {
    latitude: 53.4631,
    longitude: -113.4938,
  },
  socialProfiles: [
    'https://www.facebook.com/dtfwholesalecanada',
    'https://www.instagram.com/dtfwholesalecanada',
    'https://www.tiktok.com/@dtfwholesalecanada',
  ],
  businessHours: {
    weekdays: { open: '09:00', close: '17:00' },
    saturday: null, // closed
    sunday: null, // closed
  },
  foundingDate: '2024',
  priceRange: '$$',
};

export const DEFAULT_OG_IMAGE = '/dtf-wholesale-candada-proudly-canadian.jpg';

/**
 * Page-specific metadata configurations
 */
export const PAGE_METADATA = {
  home: {
    title: 'DTF Wholesale Canada | Custom Direct to Film Transfers | Edmonton, Alberta',
    description: 'Canadian owned and operated. Premium custom DTF transfers printed in Edmonton, Alberta. No minimums, fast turnaround, gang sheets, and 100% satisfaction guaranteed. Best DTF transfers in Canada.',
    keywords: ['DTF transfers Canada', 'Direct to Film Edmonton', 'Custom DTF transfers', 'Wholesale DTF Canada', 'Edmonton t-shirt printing', 'DTF gang sheets Canada', 'custom t-shirt transfers', 'heat press transfers Canada', 'bulk DTF printing'],
  },
  nestingTool: {
    title: 'DTF Gang Sheet Builder | Create Custom Transfer Layouts | DTF Wholesale Canada',
    description: 'Use our free online gang sheet builder to maximize your DTF transfer value. Upload images, arrange layouts, and order custom DTF transfers. No minimums, instant pricing, Canadian made.',
    keywords: ['DTF gang sheet builder', 'gang sheet creator', 'DTF layout tool', 'custom transfer layout', 'bulk DTF design', 'gang sheet software free', 'DTF print calculator'],
  },
  blog: {
    title: 'DTF Printing Tips, Tutorials & Industry News | DTF Wholesale Canada Blog',
    description: 'Learn DTF printing techniques, business tips, and stay updated with the latest in direct-to-film transfer technology. Expert guides from Canadian DTF professionals.',
    keywords: ['DTF printing tips', 'DTF tutorials', 'heat press guide', 'DTF business tips', 'direct to film guide', 'DTF printing blog'],
  },
  cart: {
    title: 'Your Cart | DTF Wholesale Canada',
    description: 'Review your custom DTF transfer order. Free shipping on orders over $150. Fast turnaround times.',
    keywords: ['DTF order', 'custom transfers cart', 'DTF checkout'],
  },
  checkout: {
    title: 'Checkout | DTF Wholesale Canada',
    description: 'Complete your DTF transfer order. Secure payment, fast shipping across Canada.',
    keywords: ['DTF checkout', 'order DTF transfers'],
  },
  account: {
    title: 'My Account | DTF Wholesale Canada',
    description: 'Manage your DTF Wholesale Canada account. View orders, track shipments, and manage your profile.',
    keywords: ['DTF account', 'order history', 'DTF login'],
  },
  orders: {
    title: 'My Orders | DTF Wholesale Canada',
    description: 'Track your DTF transfer orders. View order history and shipment status.',
    keywords: ['DTF orders', 'order tracking', 'shipment status'],
  },
  privacy: {
    title: 'Privacy Policy | DTF Wholesale Canada',
    description: 'Learn how DTF Wholesale Canada protects your personal information and privacy rights.',
    keywords: ['privacy policy', 'data protection', 'DTF privacy'],
  },
  terms: {
    title: 'Terms of Service | DTF Wholesale Canada',
    description: 'Read the terms and conditions for using DTF Wholesale Canada services.',
    keywords: ['terms of service', 'DTF terms', 'conditions'],
  },
  login: {
    title: 'Login | DTF Wholesale Canada',
    description: 'Sign in to your DTF Wholesale Canada account to manage orders and access exclusive features.',
    keywords: ['DTF login', 'sign in', 'customer login'],
  },
};

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE}`,
    description: SITE_CONFIG.description,
    email: SITE_CONFIG.email,
    telephone: SITE_CONFIG.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.province,
      postalCode: SITE_CONFIG.address.postalCode,
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.coordinates.latitude,
      longitude: SITE_CONFIG.coordinates.longitude,
    },
    sameAs: SITE_CONFIG.socialProfiles,
    foundingDate: SITE_CONFIG.foundingDate,
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    knowsAbout: [
      'DTF Printing',
      'Direct to Film Transfers',
      'Custom T-Shirt Printing',
      'Heat Press Transfers',
      'Gang Sheet Printing',
      'Wholesale Printing',
    ],
  };
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_CONFIG.url}/#localbusiness`,
    name: SITE_CONFIG.name,
    image: `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE}`,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    priceRange: SITE_CONFIG.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.province,
      postalCode: SITE_CONFIG.address.postalCode,
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.coordinates.latitude,
      longitude: SITE_CONFIG.coordinates.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: SITE_CONFIG.businessHours.weekdays?.open,
        closes: SITE_CONFIG.businessHours.weekdays?.close,
      },
    ],
    sameAs: SITE_CONFIG.socialProfiles,
    paymentAccepted: ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay'],
    currenciesAccepted: 'CAD',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'DTF Transfer Products',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: 'Custom DTF Gang Sheets',
            description: 'Custom DTF transfers on gang sheets. Upload your designs and we print them.',
          },
        },
      ],
    },
  };
}

/**
 * Generate FAQ structured data for AI search optimization
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Common FAQ items for DTF business
 */
export const COMMON_FAQS = [
  {
    question: 'What is DTF printing?',
    answer: 'DTF (Direct to Film) printing is a modern printing technology where designs are printed onto a special film and then transferred to fabric using heat. It works on virtually any fabric color and type, including cotton, polyester, and blends. DTF transfers are durable, vibrant, and don\'t require weeding like vinyl.',
  },
  {
    question: 'How long do DTF transfers last?',
    answer: 'DTF transfers are highly durable and can last 50+ washes when applied correctly. We use premium inks and adhesive powder to ensure long-lasting, crack-resistant prints. Proper heat press application at 300-325°F for 15-20 seconds ensures maximum durability.',
  },
  {
    question: 'What is a gang sheet?',
    answer: 'A gang sheet is a printing layout where multiple designs are arranged on a single sheet to maximize material usage and reduce cost. Our online gang sheet builder lets you upload multiple images and arrange them efficiently. You only pay for the sheet size, regardless of how many designs fit.',
  },
  {
    question: 'Do you have minimum orders?',
    answer: 'No, DTF Wholesale Canada has no minimum order requirement. You can order a single gang sheet or bulk quantities. Our gang sheet builder calculates instant pricing so you know exactly what you\'ll pay before ordering.',
  },
  {
    question: 'What is the turnaround time?',
    answer: 'Standard turnaround is 2-3 business days. Rush orders can be processed in 1 business day for an additional fee. We ship across Canada with tracking included on all orders.',
  },
  {
    question: 'What file formats do you accept?',
    answer: 'We accept PNG (recommended for best quality), JPG, JPEG, and WebP files. For best results, upload high-resolution images (300 DPI or higher) with transparent backgrounds. Our system automatically removes backgrounds if needed.',
  },
  {
    question: 'Do you ship across Canada?',
    answer: 'Yes! We ship to all provinces and territories in Canada. Free shipping is available on orders over $150. Standard shipping typically takes 2-5 business days depending on location. We also offer local pickup in Edmonton, Alberta.',
  },
  {
    question: 'How do I apply DTF transfers?',
    answer: 'Apply DTF transfers using a heat press at 300-325°F (150-165°C) for 15-20 seconds with medium-firm pressure. Peel warm after 3-5 seconds, then do a final press for 5 seconds with parchment paper. Always pre-press your garment to remove moisture.',
  },
  {
    question: 'Can DTF transfers be applied to any color fabric?',
    answer: 'Yes! Unlike some printing methods, DTF transfers have a white base layer that allows vibrant colors on both light and dark fabrics. They work on cotton, polyester, cotton-poly blends, nylon, and many other fabrics.',
  },
  {
    question: 'Are your DTF transfers ready to press?',
    answer: 'Yes, all our DTF transfers come ready to press. They are pre-printed with adhesive powder already applied and cured. Just cut around your design, position it on the garment, and heat press. No weeding, no extra steps.',
  },
];

/**
 * Generate WebSite structured data for sitelinks search box
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    publisher: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-CA',
  };
}

/**
 * Generate Product structured data
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  sheetSize: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE}`,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_CONFIG.url}/nesting-tool-17`,
      priceCurrency: 'CAD',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@id': `${SITE_CONFIG.url}/#organization`,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Generate Article structured data for blog posts
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image || `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author || 'DTF Wholesale Canada Team',
    },
    publisher: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

/**
 * Generate HowTo structured data for tutorials
 */
export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string; image?: string }[];
  totalTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime || 'PT30M',
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}

/**
 * Generate Service structured data
 */
export function generateServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Custom DTF Transfer Printing',
    description: 'Professional DTF (Direct to Film) transfer printing services. Upload your designs and we print high-quality, ready-to-press transfers shipped across Canada.',
    provider: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    serviceType: 'Printing Service',
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'DTF Printing Services',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Gang Sheet Printing',
          description: 'Custom gang sheets with your designs arranged efficiently',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Rush Printing',
          description: 'Same-day or next-day printing for urgent orders',
        },
      ],
    },
  };
}

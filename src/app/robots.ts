import { MetadataRoute } from 'next';

/**
 * Enhanced robots.txt with AI crawler support
 * Optimized for both traditional search engines and AI-powered search
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://dtf-wholesale.ca';
  
  return {
    rules: [
      // Main crawlers - allow everything public
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/recover-cart/',
          '/order-confirmation/',
          '/_next/',
          '/algorithm-test/',
          '/algorithm-report/',
          '/terms-test/',
        ],
      },
      // Google AI (Bard/Gemini)
      {
        userAgent: 'Google-Extended',
        allow: [
          '/',
          '/blog/',
          '/nesting-tool-17/',
          '/privacy/',
          '/llms.txt',
        ],
        disallow: ['/admin/', '/api/', '/recover-cart/'],
      },
      // OpenAI / ChatGPT
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/blog/',
          '/nesting-tool-17/',
          '/privacy/',
          '/llms.txt',
        ],
        disallow: ['/admin/', '/api/', '/recover-cart/'],
      },
      // ChatGPT User Agent
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/blog/',
          '/nesting-tool-17/',
          '/llms.txt',
        ],
        disallow: ['/admin/', '/api/', '/recover-cart/'],
      },
      // Claude / Anthropic
      {
        userAgent: 'anthropic-ai',
        allow: [
          '/',
          '/blog/',
          '/nesting-tool-17/',
          '/llms.txt',
        ],
        disallow: ['/admin/', '/api/', '/recover-cart/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/blog/',
          '/nesting-tool-17/',
          '/llms.txt',
        ],
        disallow: ['/admin/', '/api/', '/recover-cart/'],
      },
      // Cohere AI
      {
        userAgent: 'cohere-ai',
        allow: [
          '/',
          '/blog/',
          '/llms.txt',
        ],
        disallow: ['/admin/', '/api/'],
      },
      // Perplexity
      {
        userAgent: 'PerplexityBot',
        allow: [
          '/',
          '/blog/',
          '/nesting-tool-17/',
          '/llms.txt',
        ],
        disallow: ['/admin/', '/api/', '/recover-cart/'],
      },
      // Bing AI / Copilot
      {
        userAgent: 'bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/recover-cart/'],
        crawlDelay: 1,
      },
      // Common Content Aggregators
      {
        userAgent: 'CCBot',
        allow: ['/blog/', '/llms.txt'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

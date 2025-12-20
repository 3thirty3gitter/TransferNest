import { MetadataRoute } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

const BASE_URL = 'https://dtf-wholesale.ca';

/**
 * Dynamic sitemap generator
 * Includes all static pages and dynamic blog posts
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Main product page - gang sheet builder
    {
      url: `${BASE_URL}/nesting-tool-17`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    // Blog index
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Cart
    {
      url: `${BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Account pages
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/account`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/orders`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    // Legal pages
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Fetch dynamic blog posts from Firestore
  let blogPages: MetadataRoute.Sitemap = [];
  
  try {
    initializeFirebaseAdmin();
    const db = getFirestore();
    const postsSnapshot = await db
      .collection('blogPosts')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .get();

    blogPages = postsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const publishedAt = data.publishedAt?.toDate?.() || new Date();
      const updatedAt = data.updatedAt?.toDate?.() || publishedAt;
      
      return {
        url: `${BASE_URL}/blog/${data.slug}`,
        lastModified: updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });
  } catch (error) {
    console.error('[SITEMAP] Error fetching blog posts:', error);
    // Continue without blog posts if there's an error
  }

  return [...staticPages, ...blogPages];
}

/**
 * Blog Manager - Server-side (Firebase Admin)
 * For use in API routes
 */

import { getFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  coverImage?: string;
  coverImageBase64?: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  publishedAt?: Timestamp | FieldValue | null;
}

const COLLECTION_NAME = 'blog_posts';

/**
 * Get all published blog posts
 */
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  } catch (error) {
    console.error('[Blog Admin] Error getting published posts:', error);
    return [];
  }
}

/**
 * Get all blog posts (including drafts) - for admin
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  } catch (error) {
    console.error('[Blog Admin] Error getting all posts:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as BlogPost;
  } catch (error) {
    console.error('[Blog Admin] Error getting post by slug:', error);
    return null;
  }
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    } as BlogPost;
  } catch (error) {
    console.error('[Blog Admin] Error getting post by id:', error);
    return null;
  }
}

/**
 * Create a new blog post
 */
export async function createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION_NAME).doc();
    
    const now = FieldValue.serverTimestamp();
    const blogData = {
      ...post,
      createdAt: now,
      updatedAt: now,
      publishedAt: post.status === 'published' ? now : null,
    };
    
    await docRef.set(blogData);
    console.log(`[Blog Admin] Created post: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[Blog Admin] Error creating post:', error);
    return null;
  }
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<boolean> {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    
    const updateData: any = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    // If publishing for the first time, set publishedAt
    if (updates.status === 'published') {
      const existing = await docRef.get();
      if (existing.exists && !existing.data()?.publishedAt) {
        updateData.publishedAt = FieldValue.serverTimestamp();
      }
    }
    
    await docRef.update(updateData);
    console.log(`[Blog Admin] Updated post: ${id}`);
    return true;
  } catch (error) {
    console.error('[Blog Admin] Error updating post:', error);
    return false;
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    const db = getFirestore();
    await db.collection(COLLECTION_NAME).doc(id).delete();
    console.log(`[Blog Admin] Deleted post: ${id}`);
    return true;
  } catch (error) {
    console.error('[Blog Admin] Error deleting post:', error);
    return false;
  }
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return true;
    }
    
    // If we're updating an existing post, check if the found doc is the same
    if (excludeId && snapshot.docs.length === 1 && snapshot.docs[0].id === excludeId) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Blog Admin] Error checking slug:', error);
    return false;
  }
}

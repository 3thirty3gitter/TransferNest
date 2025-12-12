import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  coverImage?: string;
  coverImageBase64?: string; // For storing generated images temporarily
  tags: string[];
  status: 'draft' | 'published';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
}

const COLLECTION_NAME = 'blog_posts';

/**
 * Get all published blog posts
 */
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const blogRef = collection(db, COLLECTION_NAME);
    const q = query(
      blogRef, 
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  } catch (error) {
    console.error('Error getting published blog posts:', error);
    return [];
  }
}

/**
 * Get all blog posts (including drafts) - for admin
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const blogRef = collection(db, COLLECTION_NAME);
    const q = query(blogRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  } catch (error) {
    console.error('Error getting all blog posts:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const blogRef = collection(db, COLLECTION_NAME);
    const q = query(blogRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as BlogPost;
  } catch (error) {
    console.error('Error getting blog post by slug:', error);
    return null;
  }
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as BlogPost;
  } catch (error) {
    console.error('Error getting blog post by id:', error);
    return null;
  }
}

/**
 * Create a new blog post
 */
export async function createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const blogRef = collection(db, COLLECTION_NAME);
    const docRef = doc(blogRef);
    
    const now = Timestamp.now();
    const blogData = {
      ...post,
      createdAt: now,
      updatedAt: now,
      publishedAt: post.status === 'published' ? now : null,
    };
    
    await setDoc(docRef, blogData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating blog post:', error);
    return null;
  }
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    // If publishing for the first time, set publishedAt
    if (updates.status === 'published') {
      const existing = await getDoc(docRef);
      if (existing.exists() && !existing.data().publishedAt) {
        (updateData as any).publishedAt = Timestamp.now();
      }
    }
    
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating blog post:', error);
    return false;
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  try {
    const blogRef = collection(db, COLLECTION_NAME);
    const q = query(blogRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return true;
    }
    
    // If we're updating an existing post, check if the found doc is the same
    if (excludeId && snapshot.docs.length === 1 && snapshot.docs[0].id === excludeId) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}

import { NextResponse } from 'next/server';
import { getPublishedBlogPosts } from '@/lib/blog-manager-admin';

// GET - List all published blog posts (public)
export async function GET() {
  try {
    const posts = await getPublishedBlogPosts();
    
    // Transform posts for public consumption (remove internal fields)
    const publicPosts = posts.map(post => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      author: post.author,
      coverImage: post.coverImage || post.coverImageBase64 || '',
      tags: post.tags,
    }));

    return NextResponse.json({ posts: publicPosts });
  } catch (error) {
    console.error('[Blog Public API] Error getting posts:', error);
    return NextResponse.json({ posts: [] });
  }
}

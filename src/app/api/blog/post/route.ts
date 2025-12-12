import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/blog-manager';

// GET - Get a single published blog post by slug (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    const post = await getBlogPostBySlug(slug);
    
    // Only return if published
    if (!post || post.status !== 'published') {
      return NextResponse.json({ post: null });
    }

    // Transform for public consumption
    const publicPost = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      author: post.author,
      coverImage: post.coverImage || post.coverImageBase64 || '',
      tags: post.tags,
    };

    return NextResponse.json({ post: publicPost });
  } catch (error) {
    console.error('[Blog Post API] Error getting post:', error);
    return NextResponse.json({ post: null });
  }
}

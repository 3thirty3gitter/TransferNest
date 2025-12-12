import { NextRequest, NextResponse } from 'next/server';
import { 
  createBlogPost, 
  updateBlogPost, 
  getAllBlogPosts, 
  deleteBlogPost,
  isSlugAvailable,
  type BlogPost 
} from '@/lib/blog-manager';

// GET - List all blog posts (admin)
export async function GET() {
  try {
    const posts = await getAllBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('[Blog API] Error getting posts:', error);
    return NextResponse.json(
      { error: 'Failed to get blog posts' },
      { status: 500 }
    );
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      slug, 
      excerpt, 
      content, 
      author, 
      tags, 
      coverImage,
      coverImageBase64,
      status = 'draft' 
    } = body;

    // Validation
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Check slug availability
    const slugAvailable = await isSlugAvailable(slug);
    if (!slugAvailable) {
      return NextResponse.json(
        { error: 'Slug already exists. Please choose a different URL slug.' },
        { status: 400 }
      );
    }

    const post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      slug,
      excerpt: excerpt || '',
      content,
      author: author || 'The DTF Wholesale Team',
      tags: tags || [],
      coverImage: coverImage || '',
      coverImageBase64: coverImageBase64 || '',
      date: new Date().toISOString().split('T')[0],
      status,
    };

    const postId = await createBlogPost(post);
    
    if (!postId) {
      throw new Error('Failed to create blog post');
    }

    console.log(`[Blog API] Created blog post: ${postId} (${status})`);

    return NextResponse.json({ 
      success: true, 
      id: postId,
      message: status === 'published' ? 'Blog post published!' : 'Blog post saved as draft'
    });
  } catch (error) {
    console.error('[Blog API] Error creating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

// PATCH - Update existing blog post
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // If slug is being updated, check availability
    if (updates.slug) {
      const slugAvailable = await isSlugAvailable(updates.slug, id);
      if (!slugAvailable) {
        return NextResponse.json(
          { error: 'Slug already exists. Please choose a different URL slug.' },
          { status: 400 }
        );
      }
    }

    const success = await updateBlogPost(id, updates);
    
    if (!success) {
      throw new Error('Failed to update blog post');
    }

    console.log(`[Blog API] Updated blog post: ${id}`);

    return NextResponse.json({ 
      success: true,
      message: updates.status === 'published' ? 'Blog post published!' : 'Blog post updated'
    });
  } catch (error) {
    console.error('[Blog API] Error updating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteBlogPost(id);
    
    if (!success) {
      throw new Error('Failed to delete blog post');
    }

    console.log(`[Blog API] Deleted blog post: ${id}`);

    return NextResponse.json({ 
      success: true,
      message: 'Blog post deleted'
    });
  } catch (error) {
    console.error('[Blog API] Error deleting post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}

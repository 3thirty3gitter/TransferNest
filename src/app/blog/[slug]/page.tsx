import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { getPostBySlug, BlogPost } from '@/lib/blog';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { 
  SITE_CONFIG, 
  DEFAULT_OG_IMAGE, 
  generateArticleSchema, 
  generateBreadcrumbSchema 
} from '@/lib/seo-config';
import { getBlogPostBySlug } from '@/lib/blog-manager-admin';
import { BlogPostFooter } from './blog-post-footer';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Fetch post data - used by both metadata and page
async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    // First try Firestore
    const firestorePost = await getBlogPostBySlug(slug);
    if (firestorePost && firestorePost.status === 'published') {
      return {
        slug: firestorePost.slug,
        title: firestorePost.title,
        excerpt: firestorePost.excerpt || '',
        content: firestorePost.content,
        date: firestorePost.date,
        author: firestorePost.author,
        coverImage: firestorePost.coverImage || firestorePost.coverImageBase64 || '',
        tags: firestorePost.tags,
      };
    }
    
    // Fallback to static posts
    const staticPost = getPostBySlug(slug);
    return staticPost || null;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    const staticPost = getPostBySlug(slug);
    return staticPost || null;
  }
}

// Generate dynamic metadata for each blog post - critical for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }
  
  const postUrl = `${SITE_CONFIG.url}/blog/${post.slug}`;
  const imageUrl = post.coverImage || DEFAULT_OG_IMAGE;
  
  return {
    title: post.title,
    description: post.excerpt || `Read about ${post.title} on the DTF Wholesale Canada blog.`,
    keywords: [...post.tags, 'DTF printing', 'Canada', 'custom transfers'],
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read about ${post.title} on the DTF Wholesale Canada blog.`,
      url: postUrl,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Read about ${post.title}`,
      images: [imageUrl],
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Generate structured data for this article
  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt || post.title,
    datePublished: post.date,
    author: post.author,
    image: post.coverImage || `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE}`,
    url: `${SITE_CONFIG.url}/blog/${post.slug}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <Header />
      <div className="h-40"></div>
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li>/</li>
              <li className="text-slate-300 truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <article itemScope itemType="https://schema.org/Article" className="glass-strong rounded-3xl overflow-hidden border border-white/10">
            {/* Cover Image */}
            {post.coverImage && (
              <div className="relative h-64 md:h-96 w-full">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                  priority
                  itemProp="image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
              </div>
            )}
            
            {/* Header Section */}
            <header className="p-8 md:p-12 border-b border-white/10 bg-slate-900/50">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium"
                    itemProp="keywords"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Title */}
              <h1 
                className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight"
                itemProp="headline"
              >
                {post.title}
              </h1>

              {/* Author and Date */}
              <div className="flex flex-wrap items-center gap-6 text-slate-300">
                <div className="flex items-center gap-2" itemProp="author" itemScope itemType="https://schema.org/Person">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white" itemProp="name">{post.author}</div>
                    <div className="text-xs text-slate-400">Author</div>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <time 
                      dateTime={post.date}
                      itemProp="datePublished"
                      className="text-sm font-medium text-white"
                    >
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </time>
                    <div className="text-xs text-slate-400">Published</div>
                  </div>
                </div>
              </div>

              {/* Hidden description for SEO */}
              {post.excerpt && (
                <meta itemProp="description" content={post.excerpt} />
              )}
            </header>

            {/* Content Section */}
            <div className="p-8 md:p-12" itemProp="articleBody">
              <div 
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                  prose-strong:text-white
                  prose-ul:text-slate-300 prose-li:marker:text-blue-500
                  prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/10 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:text-slate-200
                "
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Footer with Social Sharing */}
            <BlogPostFooter postTitle={post.title} postUrl={`${SITE_CONFIG.url}/blog/${post.slug}`} />
          </article>

          {/* Related Content CTA */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold text-white mb-4">Ready to Start Printing?</h3>
            <p className="text-slate-400 mb-6">
              Create your own custom DTF transfers with our easy-to-use gang sheet builder.
            </p>
            <Link 
              href="/nesting-tool-17"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all"
            >
              Try the Gang Sheet Builder
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

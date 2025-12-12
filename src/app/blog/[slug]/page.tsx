'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { getPostBySlug } from '@/lib/blog';
import { Calendar, User, ArrowLeft, Tag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      <Header />
      <div className="h-40"></div>
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <article className="glass-strong rounded-3xl overflow-hidden border border-white/10">
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
              </div>
            )}
            
            {/* Header Section */}
            <div className="p-8 md:p-12 border-b border-white/10 bg-slate-900/50">
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{post.author}</div>
                    <div className="text-xs text-slate-400">Author</div>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-400">Published</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 md:p-12">
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

            {/* Footer Section */}
            <div className="p-8 md:p-12 border-t border-white/10 bg-slate-900/30">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-white font-bold mb-1">Enjoyed this article?</h3>
                  <p className="text-slate-400 text-sm">Share it with your network or start your own project.</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                    <Link href="/nesting-tool">Start Creating</Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

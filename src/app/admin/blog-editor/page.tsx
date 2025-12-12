'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Wand2, 
  Image as ImageIcon, 
  Loader2, 
  Eye, 
  Save, 
  Layout,
  Columns,
  FileText,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  Send,
  FileEdit,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

type BlogLayout = 'standard' | 'magazine' | 'minimal' | 'featured';

interface GeneratedSection {
  type: 'heading' | 'paragraph' | 'list' | 'blockquote' | 'image';
  content: string;
  level?: number; // for headings (h2, h3, h4)
}

export default function BlogEditorPage() {
  const { toast } = useToast();
  
  // Blog metadata
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('The DTF Wholesale Team');
  const [tags, setTags] = useState('');
  
  // Content
  const [content, setContent] = useState('');
  const [layout, setLayout] = useState<BlogLayout>('standard');
  
  // Image generation
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // AI content generation
  const [topicPrompt, setTopicPrompt] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  
  // Save/Publish state
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  
  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  // Generate cover image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter an image prompt.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: 'professional blog header, modern, clean, vibrant',
          aspectRatio: '16:9',
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedImage(data.image);
      toast({
        title: 'Image Generated!',
        description: 'Your cover image has been created.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate blog content with AI
  const handleGenerateContent = async () => {
    if (!topicPrompt.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for the blog post.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingContent(true);
    try {
      const response = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicPrompt,
          style: 'professional, informative, SEO-optimized',
          targetLength: 'medium', // short, medium, long
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Set generated content
      if (data.title) setTitle(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.content) setContent(data.content);
      if (data.tags) setTags(data.tags.join(', '));
      if (data.imagePrompt) setImagePrompt(data.imagePrompt);

      toast({
        title: 'Content Generated!',
        description: 'Your blog post has been drafted. Review and edit as needed.',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!title || !slug || !content) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in title, slug, and content.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const method = postId ? 'PATCH' : 'POST';
      const body = {
        ...(postId && { id: postId }),
        title,
        slug,
        excerpt,
        content,
        author,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        coverImageBase64: generatedImage || '',
        status: 'draft',
      };

      const response = await fetch('/api/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.id) {
        setPostId(data.id);
      }

      toast({
        title: 'Draft Saved!',
        description: 'Your blog post has been saved as a draft.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save draft',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish blog post
  const handlePublish = async () => {
    if (!title || !slug || !content) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in title, slug, and content before publishing.',
        variant: 'destructive',
      });
      return;
    }

    if (!excerpt) {
      toast({
        title: 'Missing Excerpt',
        description: 'Please add an excerpt (SEO description) before publishing.',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);
    try {
      const method = postId ? 'PATCH' : 'POST';
      const body = {
        ...(postId && { id: postId }),
        title,
        slug,
        excerpt,
        content,
        author,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        coverImageBase64: generatedImage || '',
        status: 'published',
      };

      const response = await fetch('/api/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.id) {
        setPostId(data.id);
      }

      toast({
        title: '🎉 Published!',
        description: 'Your blog post is now live!',
      });
    } catch (error) {
      toast({
        title: 'Publish Failed',
        description: error instanceof Error ? error.message : 'Failed to publish',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Copy blog code to clipboard (legacy)
  const handleCopyCode = () => {
    const blogCode = `{
    slug: '${slug}',
    title: '${title.replace(/'/g, "\\'")}',
    excerpt: '${excerpt.replace(/'/g, "\\'")}',
    content: \`
${content}
    \`,
    date: '${new Date().toISOString().split('T')[0]}',
    author: '${author}',
    tags: [${tags.split(',').map(t => `'${t.trim()}'`).join(', ')}],
    coverImage: '${generatedImage ? '/images/blog/new-post.jpg' : ''}'
  }`;
    
    navigator.clipboard.writeText(blogCode);
    toast({
      title: 'Copied!',
      description: 'Blog code copied to clipboard.',
    });
  };

  // Clear form and start new post
  const handleNewPost = () => {
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setTags('');
    setTopicPrompt('');
    setImagePrompt('');
    setGeneratedImage(null);
    setPostId(null);
    toast({
      title: 'New Post',
      description: 'Form cleared. Start creating your new blog post!',
    });
  };

  // Layout previews
  const layouts: { id: BlogLayout; name: string; description: string; icon: React.ReactNode }[] = [
    { id: 'standard', name: 'Standard', description: 'Classic blog layout with hero image', icon: <FileText className="h-5 w-5" /> },
    { id: 'magazine', name: 'Magazine', description: 'Bold typography, immersive images', icon: <Layout className="h-5 w-5" /> },
    { id: 'minimal', name: 'Minimal', description: 'Clean, text-focused design', icon: <FileText className="h-5 w-5" /> },
    { id: 'featured', name: 'Featured', description: 'Large hero with overlay text', icon: <Columns className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/settings" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-400" />
                Blog Editor
              </h1>
              <p className="text-slate-400 mt-1">
                Create and edit blog posts with AI assistance
                {postId && <span className="text-emerald-400 ml-2">• Saved</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleNewPost}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <FileEdit className="h-4 w-4 mr-2" />
              New Post
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Content Generator */}
            <div className="glass-strong rounded-2xl p-6 border border-purple-500/20">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-400" />
                AI Content Generator
              </h2>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter a topic (e.g., 'Benefits of DTF printing for small businesses')"
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  className="flex-1 bg-white/5 border-white/10 text-white"
                />
                <Button
                  onClick={handleGenerateContent}
                  disabled={isGeneratingContent}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGeneratingContent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Blog Metadata */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-bold mb-4">Post Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter blog title..."
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      placeholder="url-friendly-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="excerpt">Excerpt (SEO Description)</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description for search results..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white h-20"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="DTF Printing, Tips, Guide"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-bold mb-4">Content (HTML)</h2>
              <Textarea
                placeholder="<h2>Introduction</h2>
<p>Start writing your blog post here...</p>

<h3>Section Title</h3>
<p>Add more content...</p>

<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-white/5 border-white/10 text-white font-mono text-sm h-96"
              />
              <p className="text-xs text-slate-400 mt-2">
                Use HTML tags: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a href=""&gt;, &lt;blockquote&gt;
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Layout Selection */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-400" />
                Layout Style
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {layouts.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      layout === l.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {l.icon}
                      <span className="font-medium text-sm">{l.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">{l.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image Generator */}
            <div className="glass-strong rounded-2xl p-6 border border-emerald-500/20">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-400" />
                Cover Image
              </h2>
              
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={generatedImage}
                      alt="Generated cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedImage(null)}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg bg-slate-800/50 border border-dashed border-white/20 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No image yet</p>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Describe the cover image you want...

Example: Professional DTF printing workshop with colorful transfers being produced"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-24 text-sm"
                  />
                  <Button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-bold mb-4">Quick Insert</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContent(content + '\n\n<h2>New Section</h2>\n<p>Content here...</p>')}
                  className="border-white/20 text-white hover:bg-white/10 text-xs"
                >
                  + Section
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContent(content + '\n\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>')}
                  className="border-white/20 text-white hover:bg-white/10 text-xs"
                >
                  + List
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContent(content + '\n\n<blockquote>\n  <strong>Pro Tip:</strong> Your tip here...\n</blockquote>')}
                  className="border-white/20 text-white hover:bg-white/10 text-xs"
                >
                  + Tip Box
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContent(content + '\n\n<p><a href="/nesting-tool">Build your gang sheet</a> today!</p>')}
                  className="border-white/20 text-white hover:bg-white/10 text-xs"
                >
                  + CTA Link
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 z-50 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Preview: {layout} layout</h2>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close Preview
                </Button>
              </div>
              
              <div className="glass-strong rounded-3xl overflow-hidden max-w-4xl mx-auto">
                {/* Cover Image */}
                {generatedImage && (
                  <div className={`relative ${layout === 'featured' ? 'h-96' : 'h-64'} w-full`}>
                    <img
                      src={generatedImage}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                    {layout === 'featured' && (
                      <div className="absolute bottom-8 left-8 right-8">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tags.split(',').map((tag, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                        <h1 className="text-4xl font-bold text-white">{title || 'Blog Title'}</h1>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className={`p-8 ${layout === 'minimal' ? 'max-w-2xl mx-auto' : ''}`}>
                  {layout !== 'featured' && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tags.split(',').filter(t => t.trim()).map((tag, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                      <h1 className={`font-bold text-white mb-4 ${layout === 'magazine' ? 'text-5xl' : 'text-3xl'}`}>
                        {title || 'Blog Title'}
                      </h1>
                    </>
                  )}
                  
                  <div className="flex items-center gap-4 text-slate-400 text-sm mb-8">
                    <span>{author}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  
                  <div 
                    className="prose prose-invert prose-lg max-w-none
                      prose-headings:text-white prose-headings:font-bold
                      prose-p:text-slate-300 prose-p:leading-relaxed
                      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                      prose-strong:text-white
                      prose-ul:text-slate-300 prose-li:marker:text-blue-500
                      prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/10 prose-blockquote:p-4 prose-blockquote:rounded-r-lg"
                    dangerouslySetInnerHTML={{ __html: content || '<p>Start writing to see preview...</p>' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

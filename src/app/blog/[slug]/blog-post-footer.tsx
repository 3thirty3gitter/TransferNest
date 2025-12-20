'use client';

import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

interface BlogPostFooterProps {
  postTitle: string;
  postUrl: string;
}

export function BlogPostFooter({ postTitle, postUrl }: BlogPostFooterProps) {
  const [copied, setCopied] = useState(false);

  const shareText = encodeURIComponent(`Check out "${postTitle}" from DTF Wholesale Canada`);
  const shareUrl = encodeURIComponent(postUrl);

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <footer className="p-8 md:p-12 border-t border-white/10 bg-slate-900/30">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-white font-bold mb-1">Enjoyed this article?</h3>
          <p className="text-slate-400 text-sm">Share it with your network or start your own project.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {/* Social Share Buttons */}
          <a
            href={socialLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-lg transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Tweet</span>
          </a>
          
          <a
            href={socialLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#4267B2]/20 hover:bg-[#4267B2]/30 border border-[#4267B2]/30 text-[#4267B2] rounded-lg transition-colors"
            aria-label="Share on Facebook"
          >
            <Facebook className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Share</span>
          </a>
          
          <a
            href={socialLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/30 text-[#0A66C2] rounded-lg transition-colors"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Post</span>
          </a>
          
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 text-white rounded-lg transition-colors"
            aria-label="Copy link"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="hidden sm:inline text-sm text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}

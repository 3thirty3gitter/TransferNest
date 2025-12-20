/**
 * SEO-Optimized Image Component
 * Provides lazy loading, proper sizing, and alt text handling
 */

import Image, { ImageProps } from 'next/image';

interface SEOImageProps extends Omit<ImageProps, 'alt'> {
  alt: string; // Make alt required
  caption?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Optimized image component with SEO best practices
 * - Automatic lazy loading
 * - Proper aspect ratio handling
 * - Caption support for accessibility
 */
export function SEOImage({
  alt,
  caption,
  loading = 'lazy',
  fetchPriority = 'auto',
  priority = false,
  ...props
}: SEOImageProps) {
  // If priority is set, use eager loading
  const effectiveLoading = priority ? undefined : loading;
  
  const imageElement = (
    <Image
      alt={alt}
      loading={effectiveLoading}
      priority={priority}
      {...props}
    />
  );

  if (caption) {
    return (
      <figure>
        {imageElement}
        <figcaption className="text-sm text-slate-400 mt-2 text-center">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return imageElement;
}

export default SEOImage;

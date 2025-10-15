// src/hooks/use-image-upload.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { processImageFiles, processImageFilesLocal, type ImageUploadProgress } from '@/lib/image-upload';
import type { ManagedImage } from '@/lib/nesting-algorithm';

export function useImageUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const uploadImages = useCallback(async (
    files: FileList,
    onSuccess?: (images: ManagedImage[]) => void
  ) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress([]);

    try {
      let processedImages: ManagedImage[];

      if (user?.uid) {
        // Production: Upload to Firebase Storage
        processedImages = await processImageFiles(
          files,
          user.uid,
          setUploadProgress
        );
      } else {
        // Development: Use local blob URLs
        processedImages = await processImageFilesLocal(files);
        
        // Show progress for local processing too
        const mockProgress = Array.from(files).map((file, index) => ({
          id: `local-${Date.now()}-${index}`,
          file,
          progress: 100,
          status: 'complete' as const
        }));
        setUploadProgress(mockProgress);
      }

      // Filter out failed uploads
      const successfulImages = processedImages.filter(img => img !== null);

      if (successfulImages.length === 0) {
        setError('No images could be processed successfully');
        return;
      }

      onSuccess?.(successfulImages);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload images';
      setError(errorMessage);
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
    setError(null);
  }, []);

  return {
    uploadImages,
    isUploading,
    uploadProgress,
    error,
    clearProgress
  };
}

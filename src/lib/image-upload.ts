// src/lib/image-upload.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import type { ManagedImage } from './nesting-algorithm';

export interface ImageUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface ProcessedImageData {
  width: number;
  height: number;
  aspectRatio: number;
  fileSize: number;
}

/**
 * Get image dimensions and metadata from file
 */
export function getImageDimensions(file: File): Promise<ProcessedImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        fileSize: file.size
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please use JPG, PNG, WebP, or SVG.' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  return { valid: true };
}

/**
 * Upload image to Firebase Storage
 */
export async function uploadImageToStorage(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Create unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${userId}/${timestamp}_${sanitizedName}`;
    
    // Create storage reference
    const storageRef = ref(storage, `images/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Process and upload multiple image files
 */
export async function processImageFiles(
  files: FileList,
  userId: string,
  onProgress?: (uploads: ImageUploadProgress[]) => void
): Promise<ManagedImage[]> {
  const uploads: ImageUploadProgress[] = Array.from(files).map((file, index) => ({
    id: `upload-${Date.now()}-${index}`,
    file,
    progress: 0,
    status: 'pending'
  }));

  onProgress?.(uploads);

  const processedImages: ManagedImage[] = [];

  for (let i = 0; i < uploads.length; i++) {
    const upload = uploads[i];
    
    try {
      // Update status to processing
      upload.status = 'processing';
      onProgress?.(uploads);

      // Validate file
      const validation = validateImageFile(upload.file);
      if (!validation.valid) {
        upload.status = 'error';
        upload.error = validation.error;
        onProgress?.(uploads);
        continue;
      }

      // Get image dimensions
      const imageData = await getImageDimensions(upload.file);

      // Update status to uploading
      upload.status = 'uploading';
      onProgress?.(uploads);

      // Upload to Firebase Storage
      const downloadURL = await uploadImageToStorage(
        upload.file,
        userId,
        (progress) => {
          upload.progress = progress;
          onProgress?.(uploads);
        }
      );      // Create ManagedImage object
      const managedImage: ManagedImage = {
        id: upload.id,
        url: downloadURL,
        width: Math.round(imageData.width / 72), // Convert pixels to inches (72 DPI)
        height: Math.round(imageData.height / 72),
        aspectRatio: imageData.aspectRatio,
        copies: 1,
        dataAiHint: upload.file.name
      };

      processedImages.push(managedImage);

      // Mark as complete
      upload.status = 'complete';
      upload.progress = 100;
      onProgress?.(uploads);

    } catch (error) {
      upload.status = 'error';
      upload.error = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.(uploads);
    }
  }

  return processedImages;
}

/**
 * For development/local use - create managed images from local files
 */
export async function processImageFilesLocal(files: FileList): Promise<ManagedImage[]> {
  const processedImages: ManagedImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        console.warn(`Skipping ${file.name}: ${validation.error}`);
        continue;
      }

      // Get image dimensions
      const imageData = await getImageDimensions(file);

      // Create blob URL for local preview
      const blobUrl = URL.createObjectURL(file);      // Create ManagedImage object
      const managedImage: ManagedImage = {
        id: `local-${Date.now()}-${i}`,
        url: blobUrl,
        width: Math.max(1, Math.round(imageData.width / 72)), // Convert pixels to inches (72 DPI), min 1"
        height: Math.max(1, Math.round(imageData.height / 72)),
        aspectRatio: imageData.aspectRatio,
        copies: 1,
        dataAiHint: file.name
      };

      processedImages.push(managedImage);

    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
    }
  }

  return processedImages;
}

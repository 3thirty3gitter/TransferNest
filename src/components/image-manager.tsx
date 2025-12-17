
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ManagedImage } from '@/lib/nesting-algorithm';
import { ImageCard } from './image-card';
import { uploadImage } from '@/services/storage';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { reportError, formatErrorForUser, getBrowserInfo, detectBrowserIssues } from '@/lib/error-telemetry';
import WizardTrigger from './wizard-trigger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { removeBackground } from '@imgly/background-removal';

// Maximum usable width for gang sheets (17" - 0.5" margins = 16.5")
const MAX_IMAGE_WIDTH_INCHES = 16.5;

// Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

type ImageManagerProps = {
  images: ManagedImage[];
  onImagesChange: (images: ManagedImage[]) => void;
  openWizard?: boolean;
};

export default function ImageManager({
  images,
  onImagesChange,
  openWizard = false,
}: ImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [oversizedWarning, setOversizedWarning] = useState<{ show: boolean; fileName: string; width: number } | null>(null);
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const processImageFile = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload images.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const newImages: ManagedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File",
            description: `${file.name} is not a valid image file.`,
            variant: "destructive",
          });
          continue;
        }

        try {
          // Upload to Firebase Storage
          const url = await uploadImage(file, user.uid);
          
          // Get image dimensions
          const { width, height } = await processImageFile(file);
          
          // Convert to inches (assuming 300 DPI)
          // This ensures the default size is print-ready, not raw pixels
          const widthInches = parseFloat((width / 300).toFixed(2));
          const heightInches = parseFloat((height / 300).toFixed(2));
          
          // Check if image is too wide for the sheet
          const isOversized = widthInches > MAX_IMAGE_WIDTH_INCHES;
          if (isOversized) {
            setOversizedWarning({ show: true, fileName: file.name, width: widthInches });
          }
          
          // Create ManagedImage object
          const managedImage: ManagedImage = {
            id: `img-${Date.now()}-${i}`,
            url,
            width: widthInches,
            height: heightInches,
            aspectRatio: width / height,
            copies: 1,
          };
          
          newImages.push(managedImage);
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          
          // Report error with context
          reportError(error as Error, {
            component: 'ImageManager',
            action: 'upload-single',
            userId: user?.uid,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            },
          });
          
          const userError = formatErrorForUser(error as Error, 'image upload');
          toast({
            title: userError.title,
            description: `${file.name}: ${userError.description}`,
            variant: "destructive",
          });
        }
      }
      
      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast({
          title: "Upload Successful",
          description: `Successfully uploaded ${newImages.length} image(s).`,
        });
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Report error with context
      reportError(error as Error, {
        component: 'ImageManager',
        action: 'upload-batch',
        userId: user?.uid,
        imageCount: files?.length || 0,
      });
      
      const userError = formatErrorForUser(error as Error, 'image upload');
      toast({
        title: userError.title,
        description: userError.description,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  const handleUpdateImage = (id: string, updates: Partial<ManagedImage>) => {
    onImagesChange(images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  };

  const handleDuplicateImage = (id: string) => {
    const imageToClone = images.find(img => img.id === id);
    if (imageToClone) {
      const newImage = { 
        ...imageToClone, 
        id: `${imageToClone.id}-copy-${Date.now()}` 
      };
      onImagesChange([...images, newImage]);
    }
  };

  const handleTrimImage = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;

    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = image.url;
      });

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(img, 0, 0);
      
      // Get image data to find non-transparent bounds
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;
      
      let minX = width, minY = height, maxX = 0, maxY = 0;
      let hasContent = false;
      
      // Scan for non-transparent pixels (alpha > 0)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 0) {
            hasContent = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
      if (!hasContent) {
        toast({
          title: "Nothing to Trim",
          description: "The image appears to be fully transparent.",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate new dimensions
      const trimmedWidth = maxX - minX + 1;
      const trimmedHeight = maxY - minY + 1;
      
      // Check if there's actually anything to trim
      if (trimmedWidth === width && trimmedHeight === height) {
        toast({
          title: "Already Trimmed",
          description: "This image has no transparent borders to remove.",
        });
        return;
      }
      
      // Create trimmed canvas
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = trimmedWidth;
      trimmedCanvas.height = trimmedHeight;
      const trimmedCtx = trimmedCanvas.getContext('2d');
      if (!trimmedCtx) throw new Error('Could not get trimmed canvas context');
      
      // Draw the trimmed portion
      trimmedCtx.drawImage(
        canvas,
        minX, minY, trimmedWidth, trimmedHeight,
        0, 0, trimmedWidth, trimmedHeight
      );
      
      // Convert to data URL
      const trimmedDataUrl = trimmedCanvas.toDataURL('image/png');
      
      // Calculate new dimensions in inches (maintaining 300 DPI)
      const newWidthInches = parseFloat((trimmedWidth / 300).toFixed(2));
      const newHeightInches = parseFloat((trimmedHeight / 300).toFixed(2));
      const newAspectRatio = trimmedWidth / trimmedHeight;
      
      // Update the image
      onImagesChange(images.map(img => 
        img.id === id 
          ? { 
              ...img, 
              url: trimmedDataUrl, 
              width: newWidthInches, 
              height: newHeightInches,
              aspectRatio: newAspectRatio
            } 
          : img
      ));
      
      toast({
        title: "Image Trimmed",
        description: `Removed transparent borders. New size: ${newWidthInches}" × ${newHeightInches}"`,
      });
      
    } catch (error) {
      console.error('Trim error:', error);
      toast({
        title: "Trim Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBackground = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;

    setRemovingBgId(id);
    
    try {
      console.log('🎨 Starting client-side background removal with @imgly/background-removal');
      
      // Suppress ONNX Runtime threading warnings (they're expected in browser)
      const originalError = console.error;
      console.error = (...args: unknown[]) => {
        const msg = String(args[0] || '');
        if (msg.includes('crossOriginIsolated') || msg.includes('multi-threading')) {
          return; // Suppress these expected warnings
        }
        originalError.apply(console, args);
      };
      
      // Use the free, unlimited client-side background removal with BEST quality settings
      const config = {
        model: 'isnet' as const,
        output: {
          format: 'image/png' as const,
          quality: 1.0,
          type: 'foreground' as const,
        },
        progress: (key: string, current: number, total: number) => {
          console.log(`Background removal progress: ${key} ${current}/${total}`);
        },
        debug: false,
      };

      // Remove background using client-side AI
      const blob = await removeBackground(image.url, config);
      
      // Restore console.error
      console.error = originalError;
      
      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      // Update the image with the new URL
      onImagesChange(images.map(img => 
        img.id === id ? { ...img, url: dataUrl } : img
      ));

      console.log('✅ Background removed successfully (100% free, unlimited)');
      
      toast({
        title: "Background Removed",
        description: "The background has been successfully removed from your image.",
      });

    } catch (error) {
      console.error('Background removal error:', error);
      
      // Report error with browser context - this is often a compatibility issue
      const browserInfo = getBrowserInfo();
      const browserIssues = detectBrowserIssues(browserInfo);
      
      reportError(error as Error, {
        component: 'ImageManager',
        action: 'background-removal',
        userId: user?.uid,
        metadata: {
          imageId: id,
          browserIssues,
          webglSupported: !!browserInfo.webgl,
          memory: browserInfo.memory,
        },
      });
      
      // Show user-friendly error with browser-specific advice
      let description = error instanceof Error ? error.message : "An unexpected error occurred.";
      
      // Check for common browser compatibility issues
      if (browserIssues.length > 0) {
        description = `${browserIssues[0]}. Try using Chrome or Firefox for best results.`;
      } else if (description.includes('wasm') || description.includes('WebAssembly')) {
        description = "Your browser doesn't fully support this feature. Try using Chrome or Firefox.";
      } else if (description.includes('memory') || description.includes('heap')) {
        description = "Not enough memory. Try closing other tabs or using a smaller image.";
      }
      
      toast({
        title: "Background Removal Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setRemovingBgId(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <>
      {/* Oversized Image Warning Dialog */}
      <AlertDialog open={oversizedWarning?.show} onOpenChange={(open) => !open && setOversizedWarning(null)}>
        <AlertDialogContent className="bg-slate-900 border border-white/10">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <AlertDialogTitle className="text-white">Image Too Wide</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-300 mt-4">
              <span className="font-medium text-white">{oversizedWarning?.fileName}</span> is{' '}
              <span className="font-semibold text-amber-400">{oversizedWarning?.width.toFixed(1)}"</span> wide, 
              which exceeds the maximum printable width of{' '}
              <span className="font-semibold text-emerald-400">{MAX_IMAGE_WIDTH_INCHES}"</span>.
              <br /><br />
              Please resize this image using the width/height controls below before nesting your layout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setOversizedWarning(null)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="glass-strong rounded-2xl p-6 shadow-xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400"></span>
            Your Images
          </h2>
        <div className="flex flex-wrap items-center gap-3">
          <WizardTrigger 
            onImagesAdded={(newImages) => onImagesChange([...images, ...newImages])} 
            autoOpen={openWizard}
          />
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              disabled={isUploading}
              multiple
          />
          <button 
            onClick={handleUploadClick} 
            disabled={isUploading}
            className="h-11 px-8 min-w-[265px] w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-md transition-all hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="hidden sm:inline">Add your {getOrdinal(images.length + 1)} image</span>
                <span className="sm:hidden">Add Image</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div>
        {images.length > 0 ? (
          <div className="space-y-6">
            {images.map((image) => (              <ImageCard
                key={image.id}
                image={image}
                onUpdate={handleUpdateImage}
                onRemove={handleRemoveImage}
                onDuplicate={handleDuplicateImage}
                onTrim={handleTrimImage}
                onRemoveBackground={handleRemoveBackground}
                isRemovingBg={removingBgId === image.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/20 rounded-xl bg-white/5">
             <p className="text-slate-300">No images uploaded yet.</p>
            <p className="text-sm text-slate-400 mt-1">Click "Add your 1st image" to get started!</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

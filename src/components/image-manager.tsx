
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
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}. Please try again.`,
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
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during upload.",
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

  const handleTrimImage = (id: string) => {
    // Placeholder for trim functionality
    console.log('Trim image:', id);
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

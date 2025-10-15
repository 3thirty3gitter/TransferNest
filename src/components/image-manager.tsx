
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import type { ManagedImage } from '@/lib/nesting-algorithm';
import { ImageCard } from './image-card';

type ImageManagerProps = {
  images: ManagedImage[];
  onImagesChange: (images: ManagedImage[]) => void;
};

export default function ImageManager({
  images,
  onImagesChange,
}: ImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Simple file handling for now - in production this would process the images
      console.log('Files selected:', files.length);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl">Your Images</CardTitle>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            disabled={false}
            multiple
        />        <Button onClick={handleUploadClick} size="sm" disabled={false}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
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
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
             <p className="text-muted-foreground">No images uploaded yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Upload" to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import type { ManagedImage } from './nesting-tool';
import { ImageCard } from './image-card';

type ImageManagerProps = {
  images: ManagedImage[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<Omit<ManagedImage, 'id' | 'url' | 'aspectRatio'>>) => void;
  onDuplicateImage: (id: string) => void;
  isUploading: boolean;
};

export default function ImageManager({
  images,
  onFileChange,
  onRemoveImage,
  onUpdateImage,
  onDuplicateImage,
  isUploading,
}: ImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            onChange={onFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            disabled={isUploading}
            multiple
        />
        <Button onClick={handleUploadClick} size="sm" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        {images.length > 0 ? (
          <div className="space-y-6">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onUpdate={onUpdateImage}
                onRemove={onRemoveImage}
                onDuplicate={onDuplicateImage}
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

'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

type Image = {
  id: string;
  url: string;
  dataAiHint: string;
  width: number;
  height: number;
};

type ImageManagerProps = {
  images: Image[];
  onAddImage: () => void;
  onRemoveImage: (id: string) => void;
};

export default function ImageManager({ images, onAddImage, onRemoveImage }: ImageManagerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl">Your Images</CardTitle>
        <Button onClick={onAddImage} size="sm" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group aspect-square">
                <Image
                  src={image.url}
                  alt={`Uploaded image ${image.id}`}
                  fill
                  sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 10vw"
                  className="object-cover rounded-md border transition-all group-hover:opacity-75"
                  data-ai-hint={image.dataAiHint}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveImage(image.id)}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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

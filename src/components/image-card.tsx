
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, Minus, Plus, Scissors } from 'lucide-react';
import type { ManagedImage } from './nesting-tool';

type ImageCardProps = {
  image: ManagedImage;
  onUpdate: (id: string, updates: Partial<Omit<ManagedImage, 'id' | 'url' | 'aspectRatio'>>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTrim: (id: string) => void;
};

export function ImageCard({ image, onUpdate, onRemove, onDuplicate, onTrim }: ImageCardProps) {

  const handleDimensionChange = (dimension: 'width' | 'height', value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      if (dimension === 'width') {
        onUpdate(image.id, {
          width: numericValue,
          height: numericValue / image.aspectRatio,
        });
      } else {
        onUpdate(image.id, {
          height: numericValue,
          width: numericValue * image.aspectRatio,
        });
      }
    }
  };

  const handleCopiesChange = (newCopies: number) => {
    onUpdate(image.id, { copies: Math.max(1, newCopies) });
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-4 relative aspect-video flex items-center justify-center">
        <Image
          src={image.url}
          alt={`Uploaded image ${image.id}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 80vw, (max-width: 1200px) 30vw, 25vw"
          data-ai-hint={image.dataAiHint}
        />
      </div>
      <div className="p-4 space-y-4">
        
        {/* Copies Input */}
        <div className="flex items-center justify-between">
            <Label htmlFor={`copies-${image.id}`} className="font-semibold">Quantity</Label>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCopiesChange(image.copies - 1)}>
                    <Minus className="h-4 w-4" />
                </Button>
                <Input
                    id={`copies-${image.id}`}
                    type="number"
                    value={image.copies}
                    onChange={(e) => handleCopiesChange(parseInt(e.target.value, 10) || 1)}
                    className="w-16 h-8 text-center"
                    min="1"
                />
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCopiesChange(image.copies + 1)}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label htmlFor={`width-${image.id}`} className="w-16">Width</Label>
                <Input
                    id={`width-${image.id}`}
                    type="number"
                    value={image.width.toFixed(2)}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    className="h-8"
                />
                <span className="text-sm text-muted-foreground">in</span>
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor={`height-${image.id}`} className="w-16">Height</Label>
                 <Input
                    id={`height-${image.id}`}
                    type="number"
                    value={image.height.toFixed(2)}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    className="h-8"
                />
                <span className="text-sm text-muted-foreground">in</span>
            </div>
        </div>

        <Badge variant="secondary">High quality - DPI: 300</Badge>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => onTrim(image.id)}>
            <Scissors className="mr-2 h-4 w-4" />
            Trim
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(image.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(image.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

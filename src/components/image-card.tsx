
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, Minus, Plus, Scissors, AlertTriangle } from 'lucide-react';
import type { ManagedImage } from '@/lib/nesting-algorithm';

// Maximum usable width for gang sheets (17" - 0.5" margins = 16.5")
const MAX_IMAGE_WIDTH_INCHES = 16.5;

type ImageCardProps = {
  image: ManagedImage;
  onUpdate: (id: string, updates: Partial<Omit<ManagedImage, 'id' | 'url' | 'aspectRatio'>>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTrim: (id: string) => void;
};

export function ImageCard({ image, onUpdate, onRemove, onDuplicate, onTrim }: ImageCardProps) {
  const [localWidth, setLocalWidth] = useState(image.width.toFixed(2));
  const [localHeight, setLocalHeight] = useState(image.height.toFixed(2));
  
  const isOversized = image.width > MAX_IMAGE_WIDTH_INCHES;

  useEffect(() => {
    setLocalWidth(image.width.toFixed(2));
    setLocalHeight(image.height.toFixed(2));
  }, [image.width, image.height]);

  const handleDimensionChange = (dimension: 'width' | 'height', value: string) => {
    if (dimension === 'width') {
      setLocalWidth(value);
    } else {
      setLocalHeight(value);
    }
  };
  
  const triggerUpdate = (dimension: 'width' | 'height') => {
    const value = dimension === 'width' ? localWidth : localHeight;
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      // Round to 2 decimal places to avoid floating point issues
      const rounded = Math.round(numericValue * 100) / 100;
      if (dimension === 'width') {
        const newHeight = Math.round((rounded / image.aspectRatio) * 100) / 100;
        onUpdate(image.id, {
          width: rounded,
          height: newHeight,
        });
      } else {
        const newWidth = Math.round((rounded * image.aspectRatio) * 100) / 100;
        onUpdate(image.id, {
          height: rounded,
          width: newWidth,
        });
      }
    } else {
      // If input is invalid, revert to last known good state
      setLocalWidth(image.width.toFixed(2));
      setLocalHeight(image.height.toFixed(2));
    }
  };


  const handleCopiesChange = (newCopies: number) => {
    // Ensure copies is a positive integer
    const validCopies = Math.max(1, Math.floor(Math.abs(newCopies)));
    onUpdate(image.id, { copies: validCopies });
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden ${isOversized ? 'border-amber-500/50 ring-2 ring-amber-500/20' : ''}`}>
      <div className="bg-muted p-4 relative aspect-video flex items-center justify-center">
        <Image
          src={image.url}
          alt={`Uploaded image ${image.id}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 80vw, (max-width: 1200px) 30vw, 25vw"
          data-ai-hint={image.dataAiHint}
        />
        {isOversized && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Too Wide
          </div>
        )}
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
            {isOversized && (
              <p className="text-amber-400 text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Reduce width to {MAX_IMAGE_WIDTH_INCHES}" or less
              </p>
            )}
            <div className="flex items-center gap-2">
                <Label htmlFor={`width-${image.id}`} className={`w-16 shrink-0 ${isOversized ? 'text-amber-400' : ''}`}>Width</Label>
                <div className="relative flex-1">
                    <Input
                        id={`width-${image.id}`}
                        type="number"
                        value={localWidth}
                        onChange={(e) => handleDimensionChange('width', e.target.value)}
                        onBlur={() => triggerUpdate('width')}
                        className={`h-8 pr-8 ${isOversized ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">in</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor={`height-${image.id}`} className="w-16 shrink-0">Height</Label>
                <div className="relative flex-1">
                    <Input
                        id={`height-${image.id}`}
                        type="number"
                        value={localHeight}
                        onChange={(e) => handleDimensionChange('height', e.target.value)}
                        onBlur={() => triggerUpdate('height')}
                        className="h-8 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">in</span>
                </div>
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

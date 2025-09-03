
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ManagedImage } from './nesting-tool';
import { Check, Copy } from 'lucide-react';

interface ImageEditDialogProps {
  image: ManagedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, copies: number, width: number, height: number) => void;
}

export function ImageEditDialog({ image, isOpen, onClose, onSave }: ImageEditDialogProps) {
  const [width, setWidth] = useState(image?.width || 0);
  const [height, setHeight] = useState(image?.height || 0);
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (image) {
      setWidth(image.width);
      setHeight(image.height);
      setCopies(1);
    }
  }, [image]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseFloat(e.target.value);
    if (!isNaN(newWidth) && image) {
      setWidth(newWidth);
      setHeight(newWidth / image.aspectRatio);
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseFloat(e.target.value);
    if (!isNaN(newHeight) && image) {
      setHeight(newHeight);
      setWidth(newHeight * image.aspectRatio);
    }
  };
  
  const handleSave = () => {
    if (image) {
      onSave(image.id, copies, width, height);
      onClose();
    }
  };

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <DialogDescription>
            Adjust the size and quantity of your image. Changes will be applied to all selected copies.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Width (in)
            </Label>
            <Input
              id="width"
              type="number"
              value={width.toFixed(2)}
              onChange={handleWidthChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              Height (in)
            </Label>
            <Input
              id="height"
              type="number"
              value={height.toFixed(2)}
              onChange={handleHeightChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="copies" className="text-right">
              Copies
            </Label>
            <Input
              id="copies"
              type="number"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3"
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

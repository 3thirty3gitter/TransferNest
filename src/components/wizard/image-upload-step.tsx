'use client';

import React, { useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImageUploadStepProps {
  onUpload: (file: File, previewUrl: string) => void;
  currentImage: string | null;
}

export default function ImageUploadStep({ onUpload, currentImage }: ImageUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onUpload(file, previewUrl);
  }, [onUpload]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onUpload(file, previewUrl);
  }, [onUpload]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Upload Your Image</h3>
        <p className="text-muted-foreground">
          PNG, JPG, or SVG files
        </p>
      </div>

      <div className="flex justify-center">
        {currentImage ? (
          <Card className="p-6 w-full max-w-md">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={currentImage}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-2">✓ Image uploaded successfully</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleButtonClick}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace Image
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card
            className="p-12 border-2 border-dashed hover:border-primary transition-colors w-full max-w-md"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="p-6 bg-primary/10 rounded-full">
                <Upload className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-4">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleButtonClick}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <p className="text-sm text-muted-foreground">
                  or drag and drop your file here
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
          visibility: 'hidden'
        }}
      />
    </div>
  );
}

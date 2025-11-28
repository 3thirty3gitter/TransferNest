'use client';

import React, { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadStepProps {
  onUpload: (file: File, previewUrl: string) => void;
  currentImage: string | null;
}

export default function ImageUploadStep({ onUpload, currentImage }: ImageUploadStepProps) {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    onUpload(file, previewUrl);
  }, [onUpload]);

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
                <div>
                  <input
                    id="replace-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="replace-image" className="inline-block cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                      <Upload className="h-4 w-4 mr-2" />
                      Replace Image
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="w-full max-w-md">
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Card
              className="p-12 border-2 border-dashed hover:border-primary transition-colors"
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
                    onClick={() => document.getElementById('file-upload')?.click()}
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
          </div>
        )}
      </div>
    </div>
  );
}

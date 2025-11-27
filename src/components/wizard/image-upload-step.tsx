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
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Upload Your Design</h3>
        <p className="text-muted-foreground">
          Upload the artwork you want to print on your garment
        </p>
      </div>

      <div className="mt-6">
        {currentImage ? (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full max-w-md aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
          <Card
            className="p-12 border-2 border-dashed hover:border-primary transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <ImageIcon className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-1">
                    Drop your image here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, SVG up to 10MB
                  </p>
                </div>
                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </div>
              </div>
            </label>
          </Card>
        )}
      </div>
    </div>
  );
}

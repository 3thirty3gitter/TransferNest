'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useRef } from 'react';
import type { ManagedImage } from '@/lib/nesting-algorithm';
import { useImageUpload } from '@/hooks/use-image-upload';

type ImageManagerProps = {
  images: ManagedImage[];
  onImagesChange: (images: ManagedImage[]) => void;
};

export default function ImageManager({
  images,
  onImagesChange,
}: ImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImages, isUploading, uploadProgress, error, clearProgress } = useImageUpload();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await uploadImages(files, (newImages) => {
      onImagesChange([...images, ...newImages]);
      // Clear the input so the same files can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  const handleUpdateCopies = (id: string, copies: number) => {
    onImagesChange(images.map(img => 
      img.id === id ? { ...img, copies: Math.max(1, copies) } : img
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
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
          disabled={isUploading}
          multiple
        />
        <Button 
          onClick={handleUploadClick} 
          size="sm" 
          disabled={isUploading}
          className="relative"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Images'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Upload Progress</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearProgress}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {uploadProgress.map((upload) => (
              <div key={upload.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(upload.status)}
                    <span className="truncate max-w-48">{upload.file.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {upload.status === 'complete' ? '100%' : `${upload.progress}%`}
                  </span>
                </div>
                <Progress value={upload.progress} className="h-1" />
                {upload.error && (
                  <p className="text-xs text-red-500">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Images Grid */}
        {images.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">
              {images.length} image{images.length !== 1 ? 's' : ''} ready for nesting
            </h4>
            {images.map((image) => (
              <div key={image.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <img 
                    src={image.url} 
                    alt={image.dataAiHint || 'Image'} 
                    className="w-12 h-12 object-cover rounded border"
                  />
                  <div>
                    <p className="font-medium text-sm truncate max-w-32">
                      {image.dataAiHint || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {image.width}" × {image.height}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium">Copies:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={image.copies}
                      onChange={(e) => handleUpdateCopies(image.id, parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 text-xs border rounded text-center"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveImage(image.id)}
                    className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No images uploaded yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload PNG, JPG, WebP, or SVG files to get started
            </p>
            <Button onClick={handleUploadClick} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LOCATION_INFO } from '@/lib/wizard-config';
import { GarmentType, PrintLocation } from '@/types/wizard';
import Image from 'next/image';
import { Package, ImageIcon, MapPin, Hash } from 'lucide-react';

interface ImagePlacement {
  imageId: string;
  imageName: string;
  imageFile: File;
  imagePreview: string;
  location: PrintLocation;
  quantity: number;
  recommendedWidth: number;
  customWidth?: number;
  productType: GarmentType;
}

interface WizardLivePreviewProps {
  productType: GarmentType | null;
  productName: string;
  currentImageName: string;
  currentImagePreview: string | null;
  placements: ImagePlacement[];
}

export default function WizardLivePreview({
  productType,
  productName,
  currentImageName,
  currentImagePreview,
  placements
}: WizardLivePreviewProps) {
  return (
    <Card className="h-full bg-slate-50 dark:bg-slate-900 border-2">
      <div className="p-6 border-b bg-white dark:bg-slate-800">
        <h3 className="font-bold text-lg mb-1">Order Summary</h3>
        <p className="text-sm text-muted-foreground">Live preview of your selections</p>
      </div>

      <ScrollArea className="h-[calc(85vh-120px)]">
        <div className="p-6 space-y-6">
          {/* Product Info */}
          {productType && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Product</p>
                  <p className="font-semibold capitalize">{productType}</p>
                  {productName && (
                    <p className="text-sm text-muted-foreground mt-1">"{productName}"</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Image Preview */}
          {currentImagePreview && currentImageName && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Current Image</p>
                  <p className="font-semibold">"{currentImageName}"</p>
                </div>
              </div>
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-white dark:bg-slate-800 border">
                <Image
                  src={currentImagePreview}
                  alt={currentImageName}
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>
          )}

          {/* Placements List */}
          {placements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Added Placements</h4>
                <Badge variant="secondary">{placements.length}</Badge>
              </div>
              
              <div className="space-y-3">
                {placements.map((placement, index) => (
                  <Card key={placement.imageId} className="p-3 bg-white dark:bg-slate-800">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 rounded overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                        <Image
                          src={placement.imagePreview}
                          alt={placement.imageName}
                          fill
                          className="object-contain p-1"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1 truncate">
                          {placement.imageName}
                        </p>
                        
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {LOCATION_INFO[placement.location]?.label || placement.location}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{placement.quantity}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {placement.customWidth || placement.recommendedWidth}"
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!productType && placements.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Start by selecting a product type
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

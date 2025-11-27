'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Edit2, Check } from 'lucide-react';
import { LOCATION_INFO } from '@/lib/wizard-config';
import { GarmentType, PrintLocation } from '@/types/wizard';
import Image from 'next/image';

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

interface WizardReviewStepProps {
  placements: ImagePlacement[];
  onUpdateWidth: (placementId: string, newWidth: number) => void;
  onComplete: () => void;
}

export default function WizardReviewStep({ placements, onUpdateWidth, onComplete }: WizardReviewStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempWidth, setTempWidth] = useState<string>('');

  const handleEditClick = (placement: ImagePlacement) => {
    setEditingId(placement.imageId);
    setTempWidth(String(placement.customWidth || placement.recommendedWidth));
  };

  const handleSaveWidth = (placementId: string) => {
    const width = parseFloat(tempWidth);
    if (!isNaN(width) && width > 0 && width <= 20) {
      onUpdateWidth(placementId, width);
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setTempWidth('');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Review Your Prints</h2>
        <p className="text-muted-foreground text-lg">
          These are industry-standard recommended sizes. You can adjust the width if needed.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          💡 Height will automatically adjust to maintain your design's aspect ratio
        </p>
      </div>

      {/* Placements List */}
      <div className="space-y-4 mb-8">
        {placements.map((placement, index) => {
          const isEditing = editingId === placement.imageId;
          const displayWidth = placement.customWidth || placement.recommendedWidth;
          
          return (
            <Card key={placement.imageId} className="p-6">
              <div className="flex items-start gap-6">
                {/* Image Preview */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={placement.imagePreview}
                    alt={placement.imageName}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{placement.imageName}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="capitalize">
                          {placement.productType}
                        </Badge>
                        <Badge variant="outline">
                          {LOCATION_INFO[placement.location]?.label || placement.location}
                        </Badge>
                        <Badge variant="outline">
                          {placement.quantity} {placement.quantity === 1 ? 'copy' : 'copies'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Width Control */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Width:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            step="0.5"
                            value={tempWidth}
                            onChange={(e) => setTempWidth(e.target.value)}
                            className="w-20 h-9"
                            autoFocus
                          />
                          <span className="text-sm font-medium">inches</span>
                          <Button
                            size="sm"
                            onClick={() => handleSaveWidth(placement.imageId)}
                            className="h-9"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-9"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{displayWidth}"</span>
                          {placement.customWidth && placement.customWidth !== placement.recommendedWidth && (
                            <span className="text-xs text-muted-foreground line-through">
                              (was {placement.recommendedWidth}")
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(placement)}
                            className="h-8"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  {!placement.customWidth && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Recommended size for {placement.productType}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">{placements.length}</span> placement
                {placements.length !== 1 ? 's' : ''}
              </p>
              <p>
                <span className="font-medium">
                  {placements.reduce((sum, p) => sum + p.quantity, 0)}
                </span>{' '}
                total print{placements.reduce((sum, p) => sum + p.quantity, 0) !== 1 ? 's' : ''}
              </p>
              <p>
                <span className="font-medium">
                  {new Set(placements.map(p => p.productType)).size}
                </span>{' '}
                product type{new Set(placements.map(p => p.productType)).size !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Complete Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        onClick={onComplete}
      >
        Add to Nesting Tool
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Your prints will be added to the nesting tool where our AI will optimize the layout
      </p>
    </div>
  );
}

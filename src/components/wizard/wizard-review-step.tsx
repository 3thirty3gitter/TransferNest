'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Edit2, Check, Ruler, AlertCircle, Lock } from 'lucide-react';
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
  const [signature, setSignature] = useState<string>('');
  const [showSignatureError, setShowSignatureError] = useState(false);

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

  const handleCompleteClick = () => {
    if (!signature.trim()) {
      setShowSignatureError(true);
      return;
    }
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Review Your Prints</h2>
        <p className="text-muted-foreground text-lg">
          These are industry-standard recommended sizes. You can adjust the width if needed.
        </p>
      </div>

      {/* Important Sizing Information */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Ruler className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-900 dark:text-blue-100">
                📏 Important: Garment Size Matters!
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                The same design will look <strong>different sizes on different garments</strong>. For example, 
                a 9.5" design on a Youth Small shirt will look much larger than the same 9.5" design on an Adult 4XL shirt.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Why Can't I Change Height?
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Your image has a fixed <strong>aspect ratio</strong> (the relationship between width and height). 
                When you change the width, the height automatically adjusts to keep your design looking correct and not stretched or squished.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Think of it like a photo:</strong> If you make a photo wider, it has to get taller too, or it would look weird!
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-300 dark:border-amber-700">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <AlertCircle className="w-4 h-4" />
                Before You Continue - Use a Measuring Tape!
              </h4>
              <ul className="text-sm space-y-2 text-amber-900 dark:text-amber-100">
                <li>• <strong>Lay a garment flat</strong> (the actual size you're printing on)</li>
                <li>• <strong>Measure with a tape measure</strong> to see if the width looks right</li>
                <li>• <strong>Remember:</strong> Small shirts need smaller designs, large shirts can handle bigger designs</li>
                <li>• <strong>Check both dimensions:</strong> Make sure width AND height fit comfortably on your garment</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Placements List */}
      <div className="space-y-4 mb-8">
        {placements.map((placement, index) => {
          const isEditing = editingId === placement.imageId;
          const displayWidth = placement.customWidth || placement.recommendedWidth;
          
          // Calculate height based on aspect ratio
          const getImageDimensions = async () => {
            return new Promise<{ width: number; height: number }>((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const heightInInches = displayWidth / aspectRatio;
                resolve({ width: displayWidth, height: heightInInches });
              };
              img.src = placement.imagePreview;
            });
          };

          // For display purposes, we'll calculate height synchronously
          const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);
          
          React.useEffect(() => {
            getImageDimensions().then(setDimensions);
          }, [displayWidth, placement.imagePreview]);
          
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
                  <div className="flex items-center gap-4 mb-2">
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

                  {/* Height Display (Auto-calculated) */}
                  {dimensions && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Height:</span>
                      <span className="text-lg font-semibold text-muted-foreground">
                        {dimensions.height.toFixed(2)}"
                      </span>
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground italic">
                        (auto-calculated to prevent stretching)
                      </span>
                    </div>
                  )}

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

      {/* Signature / Acceptance */}
      <Card className="p-6 mb-6 border-2 border-amber-500 dark:border-amber-600">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Important: Size Confirmation Required</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                By typing your name below, you confirm that you have:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 mb-4 ml-4">
                <li>✓ Reviewed all print sizes (width and height)</li>
                <li>✓ Used a measuring tape on your actual garments</li>
                <li>✓ Verified the designs will fit properly on your chosen garment sizes</li>
                <li>✓ Understand that we are not responsible if the final prints don't match your expectations</li>
              </ul>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                ⚠️ We cannot accept returns or refunds for size-related issues after production begins.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signature" className="text-sm font-medium">
              Type your full name to accept these sizes:
            </label>
            <Input
              id="signature"
              type="text"
              placeholder="Enter your full name"
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                setShowSignatureError(false);
              }}
              className={`text-lg ${showSignatureError ? 'border-red-500' : ''}`}
            />
            {showSignatureError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please type your name to confirm you've reviewed and accept these sizes
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Complete Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        onClick={handleCompleteClick}
        disabled={!signature.trim()}
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

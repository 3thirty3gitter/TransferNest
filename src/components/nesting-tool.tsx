'use client';

import React, { useState } from 'react';
import { executeNesting, ManagedImage, NestingResult } from '@/lib/nesting-algorithm';
import SheetPreview from './sheet-preview';
import ImageManager from './image-manager';
import { Button } from './ui/button';

interface NestingToolProps {
  sheetWidth: number;
}

export default function NestingTool({ sheetWidth }: NestingToolProps) {
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const performNesting = async () => {
    if (images.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const result = executeNesting(images, sheetWidth);
      setNestingResult(result);
    } catch (error) {
      console.error('Nesting failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel - Controls */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Nesting Configuration</h2>
            
            {/* Results Display */}
            {nestingResult && (
              <div className="mt-4 p-3 bg-muted rounded">
                <h3 className="font-medium mb-2">Results</h3>
                <div className="text-sm space-y-1">
                  <div>Placed: {nestingResult.placedItems.length}/{nestingResult.totalCount}</div>
                  <div>Failed: {nestingResult.failedCount}</div>
                  <div>Utilization: {(nestingResult.areaUtilizationPct * 100).toFixed(1)}%</div>
                  <div>Sheet Length: {nestingResult.sheetLength.toFixed(2)}"</div>
                  <div>Cost: ${(nestingResult.sheetLength * (sheetWidth === 13 ? 0.45 : 0.59)).toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Manual Re-nest Button */}
            <Button 
              onClick={performNesting}
              disabled={images.length === 0 || isProcessing}
              className="w-full mt-4"
            >
              {isProcessing ? 'Processing...' : 'Nest Images'}
            </Button>
          </div>

          {/* Image Management */}
          <ImageManager 
            images={images}
            onImagesChange={setImages}
          />
        </div>

        {/* Right Panel - Sheet Preview */}
        <div className="lg:w-2/3">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {sheetWidth}" Gang Sheet Preview
              </h2>
              {nestingResult && (
                <div className="text-sm text-muted-foreground">
                  MaxRects Algorithm • {(nestingResult.areaUtilizationPct * 100).toFixed(1)}% Utilization
                </div>
              )}
            </div>
            
            <SheetPreview
              nestingResult={nestingResult}
              sheetWidth={sheetWidth}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

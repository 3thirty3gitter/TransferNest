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

  const addDemoImages = () => {
    const demoImages: ManagedImage[] = [
      {
        id: 'demo-1',
        url: 'https://picsum.photos/300/200?random=1',
        width: 4,
        height: 3,
        aspectRatio: 4/3,
        copies: 2,
        dataAiHint: 'Demo Logo 1'
      },
      {
        id: 'demo-2',
        url: 'https://picsum.photos/200/200?random=2',
        width: 3,
        height: 3,
        aspectRatio: 1,
        copies: 1,
        dataAiHint: 'Demo Square Design'
      },
      {
        id: 'demo-3',
        url: 'https://picsum.photos/400/150?random=3',
        width: 5,
        height: 2,
        aspectRatio: 2.5,
        copies: 3,
        dataAiHint: 'Demo Banner'
      }
    ];
    setImages([...images, ...demoImages]);
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

            {/* Demo Button */}
            <Button 
              onClick={addDemoImages}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Add Demo Images
            </Button>

            {/* Manual Re-nest Button */}
            <Button 
              onClick={performNesting}
              disabled={images.length === 0 || isProcessing}
              className="w-full mt-4"
            >
              {isProcessing ? 'Processing...' : 'Nest Images'}
            </Button>

            {/* Add Demo Images Button */}
            <Button 
              onClick={addDemoImages}
              className="w-full mt-2"
            >
              Add Demo Images
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
              sheetWidth={sheetWidth}
              sheetLength={nestingResult?.sheetLength || 0}
              nestedLayout={nestingResult?.placedItems || null}
              isLoading={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

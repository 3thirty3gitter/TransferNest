'use client';

import React, { useState } from 'react';
import { executeNesting, ManagedImage, NestingResult } from '@/lib/nesting-algorithm';
import SheetPreview from './sheet-preview';
import ImageManager from './image-manager';
import NestingProgressModal from './nesting-progress-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Download } from 'lucide-react';

interface NestingToolProps {
  sheetWidth?: number; // Optional now, defaults to 13
}

export default function NestingTool({ sheetWidth: initialWidth = 13 }: NestingToolProps) {
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetWidth, setSheetWidth] = useState<13 | 17>(initialWidth as 13 | 17);
  
  // Progress modal state
  const [modalStage, setModalStage] = useState<'preparing' | 'genetic-algorithm' | 'optimizing' | 'complete'>('preparing');
  const [modalProgress, setModalProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [bestUtilization, setBestUtilization] = useState(0);
  
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const performNesting = async () => {
    if (images.length === 0) return;

    // Set modal state FIRST - this makes it appear instantly
    setIsProcessing(true);
    setModalStage('preparing');
    setModalProgress(10);
    setBestUtilization(0);
    setCurrentGeneration(0);

    // Give UI time to render the modal before starting heavy computation
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Validate images before nesting
      console.log('🔍 Nesting Input Validation:');
      images.forEach((img, idx) => {
        console.log(`  Image ${idx}: ${img.id}`, {
          width: img.width,
          height: img.height,
          copies: img.copies,
          aspectRatio: img.aspectRatio,
          dimensions_valid: Number.isFinite(img.width) && Number.isFinite(img.height) && img.width > 0 && img.height > 0,
          copies_valid: Number.isFinite(img.copies) && img.copies >= 1
        });
      });

      // Update to genetic algorithm stage
      setModalStage('genetic-algorithm');
      setModalProgress(20);
      
      // Brief pause to show stage transition
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate generation progress (in real implementation, this would come from GA callbacks)
      const progressInterval = setInterval(() => {
        setCurrentGeneration(prev => {
          const next = prev + 1;
          if (next <= 40) {
            setModalProgress(20 + (next / 40) * 70); // 20% to 90%
            setBestUtilization(prev => Math.min(prev + Math.random() * 2, 87));
            return next;
          }
          return prev;
        });
      }, 100); // Update every 100ms for smooth progress

      const result = executeNesting(images, sheetWidth);
      
      clearInterval(progressInterval);
      
      setModalStage('optimizing');
      setModalProgress(95);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
      
      console.log('📊 Nesting Result:', {
        total_items: result.totalCount,
        placed_items: result.placedItems.length,
        failed_items: result.failedCount,
        utilization: (result.areaUtilizationPct * 100).toFixed(1) + '%',
        sheet_length: result.sheetLength
      });
      
      setModalProgress(100);
      setModalStage('complete');
      setBestUtilization(result.areaUtilizationPct * 100);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Show completion
      
      setNestingResult(result);
    } catch (error) {
      console.error('Nesting failed:', error);
      toast({
        title: "Nesting Failed",
        description: "An error occurred while processing your layout.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };  const calculatePricing = () => {
    if (!nestingResult) return { basePrice: 0, setupFee: 0, total: 0 };
    
    const totalDesigns = nestingResult.placedItems.length;
    const sheetSizeNum = sheetWidth === 17 ? 17 : 13;
    
    // Base pricing logic (adjust as needed)
    const basePrice = nestingResult.sheetLength * (sheetWidth === 13 ? 0.45 : 0.59);
    const setupFee = totalDesigns * 2.50; // $2.50 per unique design
    const total = basePrice + setupFee;
    
    return { basePrice, setupFee, total };
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    if (!nestingResult || images.length === 0) {
      toast({
        title: "No Layout to Add",
        description: "Please upload images and nest them first.",
        variant: "destructive",
      });
      return;
    }

    const pricing = calculatePricing();
    const sheetSizeStr = sheetWidth === 17 ? '17' : '13';
    
    const cartItem = {
      name: `Custom DTF Sheet ${sheetSizeStr}"`,
      sheetSize: sheetSizeStr as '13' | '17',
      images,
      layout: {
        positions: nestingResult.placedItems.map((item: any) => ({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          imageId: item.id || item.image?.id || 'unknown',
          copyIndex: item.copyIndex || 0,
          rotated: item.rotated || false,
        })),
        utilization: nestingResult.areaUtilizationPct * 100,
        totalCopies: nestingResult.placedItems.length,
      },
      pricing,
      quantity: 1,
    };

    addItem(cartItem);
    
    toast({
      title: "Added to Cart!",
      description: `Your ${sheetSizeStr}" DTF sheet layout has been added to cart.`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Progress Modal */}
      <NestingProgressModal
        isOpen={isProcessing}
        stage={modalStage}
        progress={modalProgress}
        currentGeneration={currentGeneration}
        totalGenerations={40}
        bestUtilization={bestUtilization}
        itemCount={images.reduce((sum, img) => sum + img.copies, 0)}
      />
      
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel - Controls (Sticky) */}
        <div className="lg:w-1/3 space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Nesting Configuration</h2>

            {/* Sheet Width Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Sheet Width</label>
              <div className="flex gap-2">
                <Button
                  variant={sheetWidth === 13 ? 'default' : 'outline'}
                  onClick={() => setSheetWidth(13)}
                  className="flex-1"
                  size="sm"
                >
                  13"
                </Button>
                <Button
                  variant={sheetWidth === 17 ? 'default' : 'outline'}
                  onClick={() => setSheetWidth(17)}
                  className="flex-1"
                  size="sm"
                >
                  17"
                </Button>
              </div>
            </div>

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
                  
                  {/* Pricing Breakdown */}
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <div className="text-sm font-medium mb-2">Pricing Breakdown:</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>${calculatePricing().basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Setup Fee ({nestingResult.placedItems.length} designs):</span>
                        <span>${calculatePricing().setupFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Total:</span>
                        <span>${calculatePricing().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="mt-4 space-y-2">
                    <Button 
                      onClick={handleAddToCart}
                      disabled={!user}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    
                    {!user && (
                      <p className="text-xs text-muted-foreground text-center">
                        Please sign in to add items to cart
                      </p>
                    )}
                  </div>
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

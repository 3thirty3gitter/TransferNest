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

// Development-only logging
const debugLog = (...args: any[]) => {
  // Only log in development or when explicitly enabled
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log(...args);
  }
};

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
      debugLog('🔍 Nesting Input Validation:');
      images.forEach((img, idx) => {
        debugLog(`  Image ${idx}: ${img.id}`, {
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
      
      debugLog('📊 Nesting Result:', {
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
    const setupFee = totalDesigns * 2.50; // $2.50 per unique design (hidden for now)
    const total = basePrice; // Setup fee excluded from total
    
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
        <div className="lg:w-1/3 space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="glass-strong rounded-2xl p-6 shadow-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></span>
              Configuration
            </h2>

            {/* Sheet Width Selector */}
            <div className="mb-6">
              <label className="text-sm font-semibold mb-3 block text-slate-300">Sheet Width</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSheetWidth(13)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    sheetWidth === 13 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  13"
                </button>
                <button
                  onClick={() => setSheetWidth(17)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    sheetWidth === 17 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  17"
                </button>
              </div>
            </div>

            {/* Results Display */}
            {nestingResult && (
              <div className="mt-6 p-5 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                <h3 className="font-bold mb-4 text-white text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></span>
                  Your Gang Sheet
                </h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-sm">Sheet Length:</span>
                    <span className="font-bold text-white">{nestingResult.sheetLength.toFixed(2)}"</span>
                  </div>
                  
                  {/* Pricing Breakdown */}
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-sm font-semibold mb-3 text-white">Pricing Breakdown</div>
                    <div className="space-y-2 text-sm">\n                      <div className="flex justify-between py-1">
                        <span className="text-slate-300">Base Price:</span>
                        <span className="font-semibold text-white">${calculatePricing().basePrice.toFixed(2)}</span>
                      </div>
                      {/* Setup Fee - Commented out for now, can be re-enabled later
                      <div className="flex justify-between">
                        <span>Setup Fee ({nestingResult.placedItems.length} designs):</span>
                        <span>${calculatePricing().setupFee.toFixed(2)}</span>
                      </div>
                      */}
                      <div className="flex justify-between font-bold border-t border-white/20 pt-3 mt-2">
                        <span className="text-white">Total:</span>
                        <span className="text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${calculatePricing().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="mt-5 space-y-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={!user}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </button>
                    
                    {!user && (
                      <p className="text-xs text-slate-400 text-center">
                        Please sign in to add items to cart
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Re-nest Button */}
            <button
              onClick={performNesting}
              disabled={images.length === 0 || isProcessing}
              className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isProcessing ? 'Processing...' : '✨ Nest Images'}
            </button>
          </div>

          {/* Image Management */}
          <ImageManager 
            images={images}
            onImagesChange={setImages}
          />
        </div>

        {/* Right Panel - Sheet Preview */}
        <div className="lg:w-2/3">
          <div className="glass-strong rounded-2xl p-6 shadow-xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"></span>
                Live Preview
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0">
                  {sheetWidth}"
                </Badge>
              </h2>
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

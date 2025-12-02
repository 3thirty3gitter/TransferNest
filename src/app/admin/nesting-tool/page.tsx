'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { executeNesting, ManagedImage, NestingResult } from '@/lib/nesting-algorithm';
import SheetPreview from '@/components/sheet-preview';
import ImageManager from '@/components/image-manager';
import NestingProgressModal from '@/components/nesting-progress-modal';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminNestingTool() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetWidth, setSheetWidth] = useState<13 | 17>(17);

  // Progress modal state
  const [modalStage, setModalStage] = useState<'preparing' | 'genetic-algorithm' | 'optimizing' | 'complete'>('preparing');
  const [modalProgress, setModalProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [bestUtilization, setBestUtilization] = useState(0);

  useEffect(() => {
    loadJobFromSession();
    setLoading(false);
  }, []);

  const loadJobFromSession = () => {
    try {
      const jobData = sessionStorage.getItem('adminEditorJob');
      if (jobData) {
        const job = JSON.parse(jobData);

        // Load images
        if (job.images && Array.isArray(job.images)) {
          setImages(job.images);
        }

        // Load sheet width
        if (job.sheetWidth) {
          setSheetWidth(job.sheetWidth as 13 | 17);
        }

        // Load nesting result
        if (job.placedItems && job.sheetLength) {
          const result: NestingResult = {
            placedItems: job.placedItems,
            sheetLength: job.sheetLength,
            areaUtilizationPct: job.layout?.utilization ? job.layout.utilization / 100 : 0,
            totalCount: job.placedItems.length,
            failedCount: 0,
            sortStrategy: 'admin-loaded',
            packingMethod: 'admin-loaded'
          };
          setNestingResult(result);
        }

        // Clear the session storage
        sessionStorage.removeItem('adminEditorJob');

        console.log('Loaded job from session:', job.orderId);
      }
    } catch (error) {
      console.error('Error loading job from session:', error);
    }
  };

  const performNesting = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setModalStage('preparing');
    setModalProgress(10);
    setBestUtilization(0);
    setCurrentGeneration(0);

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      setModalStage('genetic-algorithm');
      setModalProgress(20);

      await new Promise(resolve => setTimeout(resolve, 100));

      const progressInterval = setInterval(() => {
        setCurrentGeneration(prev => {
          const next = prev + 1;
          if (next <= 40) {
            setModalProgress(20 + (next / 40) * 70);
            setBestUtilization(prev => Math.min(prev + Math.random() * 2, 87));
            return next;
          }
          return prev;
        });
      }, 100);

      const result = await executeNesting(images, sheetWidth);

      clearInterval(progressInterval);

      setModalStage('optimizing');
      setModalProgress(95);

      await new Promise(resolve => setTimeout(resolve, 500));

      setModalProgress(100);
      setModalStage('complete');
      setBestUtilization(result.areaUtilizationPct * 100);

      await new Promise(resolve => setTimeout(resolve, 1500));

      setNestingResult(result);
    } catch (error) {
      console.error('Nesting failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculatePricing = () => {
    if (!nestingResult) return { basePrice: 0, total: 0 };

    const basePrice = nestingResult.sheetLength * (sheetWidth === 13 ? 0.45 : 0.67);

    return { basePrice, total: basePrice };
  };

  const handleDownload = async () => {
    if (!nestingResult) return;

    try {
      // Create a canvas to render the gang sheet
      const canvas = document.createElement('canvas');
      const dpi = 300; // High resolution for printing
      const pixelsPerInch = dpi;

      canvas.width = sheetWidth * pixelsPerInch;
      canvas.height = nestingResult.sheetLength * pixelsPerInch;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Transparent background (default)
      // Do NOT fill with white
      // ctx.fillStyle = 'white';
      // ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and draw all images with proper CORS handling
      const imagePromises = nestingResult.placedItems.map(item => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();

          // Try to load with CORS first
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            try {
              ctx.save();

              if (item.rotated) {
                // item.width and item.height are original dimensions (not swapped)
                const x = item.x * pixelsPerInch;
                const y = item.y * pixelsPerInch;
                const drawWidth = item.width * pixelsPerInch;
                const drawHeight = item.height * pixelsPerInch;

                // Position for rotation: rotate 90 degrees clockwise
                // Visual top-left of rotated image corresponds to original bottom-left (0, height)
                // So we translate to (x + height, y)
                ctx.translate(x + drawHeight, y);
                ctx.rotate(Math.PI / 2);

                // Draw the image in its original orientation
                ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
              } else {
                // Non-rotated images draw normally
                const displayWidth = item.width * pixelsPerInch;
                const displayHeight = item.height * pixelsPerInch;
                ctx.drawImage(
                  img,
                  item.x * pixelsPerInch,
                  item.y * pixelsPerInch,
                  displayWidth,
                  displayHeight
                );
              }

              ctx.restore();
              resolve();
            } catch (error) {
              console.error('Error drawing image:', error);
              resolve(); // Continue even if one image fails
            }
          };

          img.onerror = (error) => {
            console.error('Error loading image:', item.url, error);
            resolve(); // Continue even if one image fails to load
          };

          img.src = item.url;
        });
      });

      await Promise.all(imagePromises);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gangsheet-${sheetWidth}inch-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating download:', error);
      alert('Failed to generate download. Please check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading nesting tool...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <NestingProgressModal
        isOpen={isProcessing}
        stage={modalStage}
        progress={modalProgress}
        currentGeneration={currentGeneration}
        totalGenerations={40}
        bestUtilization={bestUtilization}
        itemCount={images.reduce((sum, img) => sum + img.copies, 0)}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Internal Nesting Tool
            </h1>
            <p className="text-slate-400 mt-1">Create gang sheets for internal production</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:w-1/3 space-y-6 lg:sticky lg:top-6 lg:h-fit">
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
                    onClick={() => setSheetWidth(17)}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  >
                    17" Wide Sheets
                  </button>
                </div>
              </div>

              {/* Results Display */}
              {nestingResult && (
                <div className="mt-6 p-5 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                  <h3 className="font-bold mb-4 text-white text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></span>
                    Production Sheet
                  </h3>
                  <div className="space-y-3 text-slate-200">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-sm">Sheet Length:</span>
                      <span className="font-bold text-white">{nestingResult.sheetLength.toFixed(2)}"</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-sm">Utilization:</span>
                      <span className="font-bold text-white">{(nestingResult.areaUtilizationPct * 100).toFixed(1)}%</span>
                    </div>

                    {/* Pricing */}
                    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-sm font-semibold mb-3 text-white">Production Cost</div>
                      <div className="flex justify-between font-bold pt-2">
                        <span className="text-white">Total:</span>
                        <span className="text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          ${calculatePricing().total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="mt-5">
                      <button
                        onClick={handleDownload}
                        className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Download className="h-5 w-5" />
                        Download Gang Sheet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Nest Button */}
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

          {/* Right Panel - Preview */}
          <div className="lg:w-2/3">
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

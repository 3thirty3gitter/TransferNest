
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NestedLayout } from '@/app/schema';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useRef, useState, useEffect } from 'react';

type SheetPreviewProps = {
  sheetWidth: number;
  sheetLength: number;
  nestedLayout: NestedLayout | null | undefined;
  isLoading: boolean;
};

const PIXELS_PER_INCH = 40; // Base rendering resolution

export default function SheetPreview({
  sheetWidth,
  sheetLength,
  nestedLayout,
  isLoading,
}: SheetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState(300);

  const displayWidth = sheetWidth * PIXELS_PER_INCH;
  const displayHeight = sheetLength > 0 ? sheetLength * PIXELS_PER_INCH : 300;

  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Add a small padding effect by not scaling to the absolute edge
        const newScale = containerWidth < displayWidth ? (containerWidth - 16) / displayWidth : 1;
        setScale(newScale);
        setContainerHeight(displayHeight * newScale);
      }
    };

    // Initial calculation
    calculateScale();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [displayWidth, displayHeight]);

  const memoizedLayout = useMemo(() => nestedLayout || [], [nestedLayout]);

  const checkerboardStyle = {
    backgroundImage:
      'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  };

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Live Preview</CardTitle>
        <CardDescription>
          Your {sheetWidth}" wide sheet layout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="relative w-full bg-muted/50 rounded-lg border flex items-center justify-center"
          style={{ height: `${containerHeight}px`, transition: 'height 0.5s ease-in-out' }}
        >
          <div
            className="relative bg-white shadow-inner transition-all duration-500"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              ...checkerboardStyle
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 font-semibold">Nesting images...</p>
              </div>
            )}
            {!isLoading && memoizedLayout.length === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold text-muted-foreground">Your sheet is empty</p>
                <p className="text-sm text-muted-foreground">Upload and arrange images to see a preview.</p>
              </div>
            )}
            {memoizedLayout
              .filter(item => item && item.url)
              .map((item, index) => (
              <div
                key={item.id ? `${item.id}-${index}` : `${item.url}-${index}`}
                className={cn(
                  'absolute transition-all duration-500',
                  'data-[state=loading]:opacity-0',
                  'data-[state=loaded]:opacity-100 data-[state=loaded]:animate-in data-[state=loaded]:fade-in data-[state=loaded]:zoom-in-95'
                )}
                data-state={isLoading ? 'loading' : 'loaded'}
                style={{
                  left: `${item.x * PIXELS_PER_INCH}px`,
                  top: `${item.y * PIXELS_PER_INCH}px`,
                  width: `${item.width * PIXELS_PER_INCH}px`,
                  height: `${item.height * PIXELS_PER_INCH}px`,
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                <Image
                  src={item.url}
                  alt={`Nested image`}
                  width={item.width * PIXELS_PER_INCH}
                  height={item.height * PIXELS_PER_INCH}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

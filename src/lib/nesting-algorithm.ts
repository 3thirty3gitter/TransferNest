// src/lib/nesting-algorithm.ts
// Optimized nesting using maxrects-packer library
import { MaxRectsPacker } from 'maxrects-packer';

export type ManagedImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  copies: number;
  dataAiHint?: string;
};

export type NestedImage = {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
};

export type NestingResult = {
  placedItems: NestedImage[];
  sheetLength: number;
  areaUtilizationPct: number;
  totalCount: number;
  failedCount: number;
  sortStrategy: SortStrategy;
  packingMethod: PackingMethod;
};

export type SortStrategy = 'largest-first' | 'smallest-first' | 'width-first' | 'height-first' | 'AREA_DESC' | 'HEIGHT_DESC' | 'WIDTH_DESC' | 'PERIMETER_DESC';
export type PackingMethod = 'bottom-left-fill' | 'maxrects' | 'BottomLeft' | 'maxrects-packer';

export const VIRTUAL_SHEET_HEIGHT = 10000; // Virtual height for calculations

// Optimized MaxRects-Packer based nesting
export function executeNesting(
  images: ManagedImage[],
  sheetWidth: number
): NestingResult {
  // Flatten images with copies
  const allImages: (ManagedImage & { copyIndex: number })[] = [];
  images.forEach(img => {
    for (let i = 0; i < img.copies; i++) {
      allImages.push({ ...img, copyIndex: i });
    }
  });

  // Sort by area (largest first) for better packing
  allImages.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  // Create custom rectangle objects for packing
  interface PackingRect {
    x: number;
    y: number;
    width: number;
    height: number;
    imageData?: {
      image: ManagedImage & { copyIndex: number };
      rotated: boolean;
    };
  }

  // Use the library's packing algorithm
  const packer = new MaxRectsPacker(
    sheetWidth,
    VIRTUAL_SHEET_HEIGHT,
    0, // No padding
    {
      smart: true,
      pot: false,
      square: false,
      allowRotation: true, // KEY: Enable rotation!
      tag: false,
      border: 0
    }
  );

  const placedItems: NestedImage[] = [];
  let failedCount = 0;

  // Pack each image with both orientations
  for (const image of allImages) {
    // Try to pack - the library will handle rotation internally
    const rect = packer.add(
      image.width,
      image.height,
      {
        imageId: `${image.id}-${image.copyIndex}`,
        originalWidth: image.width,
        originalHeight: image.height
      }
    );

    if (rect) {
      // Check if rotation was applied
      const rotated = (rect.width === image.height && rect.height === image.width);

      const placedItem: NestedImage = {
        id: `${image.id}-${image.copyIndex}`,
        url: image.url,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        rotated
      };

      placedItems.push(placedItem);

      // Debug logging
      if (rotated) {
        console.log(`[ROTATED] ${image.id}: ${image.width}×${image.height} → ${rect.width}×${rect.height} at (${rect.x}, ${rect.y})`);
      }
    } else {
      failedCount++;
    }
  }

  // Calculate metrics
  const maxY = placedItems.length > 0
    ? Math.max(...placedItems.map(item => item.y + item.height))
    : 0;

  const totalArea = sheetWidth * maxY;
  const usedArea = placedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
  const utilization = totalArea > 0 ? usedArea / totalArea : 0;

  return {
    placedItems,
    sheetLength: maxY,
    areaUtilizationPct: utilization,
    totalCount: allImages.length,
    failedCount,
    sortStrategy: 'largest-first',
    packingMethod: 'maxrects-packer'
  };
}


// Re-export for compatibility
export function executeEnhancedNesting(
  images: ManagedImage[],
  sheetWidth: number
) {
  return executeNesting(images, sheetWidth);
}

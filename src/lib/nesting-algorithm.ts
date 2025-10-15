// src/lib/nesting-algorithm.ts
// Client-side nesting algorithm - no server dependencies

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
export type PackingMethod = 'bottom-left-fill' | 'maxrects' | 'BottomLeft';

export const VIRTUAL_SHEET_HEIGHT = 1000; // Virtual height for calculations

// Simple MaxRects-based nesting algorithm
export function executeNesting(
  images: ManagedImage[],
  sheetWidth: number
): NestingResult {
  const placedItems: NestedImage[] = [];
  const freeRectangles: { x: number; y: number; width: number; height: number }[] = [
    { x: 0, y: 0, width: sheetWidth, height: VIRTUAL_SHEET_HEIGHT }
  ];

  // Flatten images with copies
  const allImages: (ManagedImage & { copyIndex: number })[] = [];
  images.forEach(img => {
    for (let i = 0; i < img.copies; i++) {
      allImages.push({ ...img, copyIndex: i });
    }
  });

  // Sort by area (largest first)
  allImages.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  let maxY = 0;

  for (const image of allImages) {
    let bestRect = null;
    let bestY = Infinity;

    // Find the best fitting rectangle (lowest Y position)
    for (const rect of freeRectangles) {
      if (rect.width >= image.width && rect.height >= image.height) {
        if (rect.y < bestY) {
          bestY = rect.y;
          bestRect = rect;
        }
      }
    }

    if (bestRect) {
      // Place the image
      const placedItem: NestedImage = {
        id: `${image.id}-${image.copyIndex}`,
        url: image.url,
        x: bestRect.x,
        y: bestRect.y,
        width: image.width,
        height: image.height,
        rotated: false
      };
      
      placedItems.push(placedItem);
      maxY = Math.max(maxY, bestRect.y + image.height);

      // Remove the used rectangle
      const rectIndex = freeRectangles.indexOf(bestRect);
      freeRectangles.splice(rectIndex, 1);

      // Split the rectangle if needed
      if (bestRect.width > image.width) {
        freeRectangles.push({
          x: bestRect.x + image.width,
          y: bestRect.y,
          width: bestRect.width - image.width,
          height: image.height
        });
      }

      if (bestRect.height > image.height) {
        freeRectangles.push({
          x: bestRect.x,
          y: bestRect.y + image.height,
          width: bestRect.width,
          height: bestRect.height - image.height
        });
      }
    }
  }

  const totalArea = sheetWidth * maxY;
  const usedArea = placedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
  const utilization = totalArea > 0 ? usedArea / totalArea : 0;

  return {
    placedItems,
    sheetLength: maxY,
    areaUtilizationPct: utilization,
    totalCount: allImages.length,
    failedCount: allImages.length - placedItems.length,
    sortStrategy: 'largest-first',
    packingMethod: 'maxrects'
  };
}

// Re-export for compatibility
export function executeEnhancedNesting(
  images: ManagedImage[],
  sheetWidth: number
) {
  return executeNesting(images, sheetWidth);
}

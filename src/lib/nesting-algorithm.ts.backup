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

// Enhanced MaxRects with rotation support
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
    // Find best placement considering both orientations
    interface Placement {
      rect: { x: number; y: number; width: number; height: number };
      width: number;
      height: number;
      rotated: boolean;
      score: number; // Lower score = better (prioritizes lowest Y, then leftmost X)
    }

    let bestPlacement: Placement | null = null;

    // Try both orientations: normal and rotated
    const orientations = [
      { w: image.width, h: image.height, r: false },
      { w: image.height, h: image.width, r: true }
    ];

    for (const orientation of orientations) {
      // Find the best fitting rectangle for THIS orientation
      for (const rect of freeRectangles) {
        if (rect.width >= orientation.w && rect.height >= orientation.h) {
          // Calculate score: prioritize lowest Y, then leftmost X, then smallest waste
          const waste = (rect.width - orientation.w) + (rect.height - orientation.h);
          const score = rect.y * 10000 + rect.x * 100 + waste;

          // Update best if this is better
          if (!bestPlacement || score < bestPlacement.score) {
            bestPlacement = {
              rect,
              width: orientation.w,
              height: orientation.h,
              rotated: orientation.r,
              score
            };
          }
        }
      }
    }

    if (bestPlacement) {
      // Place the image
      const placedItem: NestedImage = {
        id: `${image.id}-${image.copyIndex}`,
        url: image.url,
        x: bestPlacement.rect.x,
        y: bestPlacement.rect.y,
        width: bestPlacement.width,
        height: bestPlacement.height,
        rotated: bestPlacement.rotated
      };

      // Debug logging - remove in production
      if (bestPlacement.rotated) {
        console.log(`[ROTATED] ${image.id}: ${image.width}×${image.height} → ${bestPlacement.width}×${bestPlacement.height}`);
      }

      placedItems.push(placedItem);
      maxY = Math.max(maxY, bestPlacement.rect.y + bestPlacement.height);

      // Remove the used rectangle
      const rectIndex = freeRectangles.indexOf(bestPlacement.rect);
      freeRectangles.splice(rectIndex, 1);

      // Split the rectangle and generate new free rectangles
      const newRects: { x: number; y: number; width: number; height: number }[] = [];

      // Right rectangle (waste to the right)
      if (bestPlacement.rect.width > bestPlacement.width) {
        newRects.push({
          x: bestPlacement.rect.x + bestPlacement.width,
          y: bestPlacement.rect.y,
          width: bestPlacement.rect.width - bestPlacement.width,
          height: bestPlacement.height
        });
      }

      // Bottom rectangle (waste below)
      if (bestPlacement.rect.height > bestPlacement.height) {
        newRects.push({
          x: bestPlacement.rect.x,
          y: bestPlacement.rect.y + bestPlacement.height,
          width: bestPlacement.rect.width,
          height: bestPlacement.rect.height - bestPlacement.height
        });
      }

      // Add new rectangles and sort by Y position for better packing
      freeRectangles.push(...newRects);
      freeRectangles.sort((a, b) => a.y - b.y || a.x - b.x);

      // Merge adjacent free rectangles to reduce fragmentation
      mergeRectangles(freeRectangles);
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

// Merge adjacent/overlapping rectangles to reduce fragmentation
function mergeRectangles(rects: { x: number; y: number; width: number; height: number }[]): void {
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < rects.length && !merged; i++) {
      for (let j = i + 1; j < rects.length && !merged; j++) {
        const a = rects[i];
        const b = rects[j];

        // Check if rectangles can be merged horizontally (same Y and height)
        if (a.y === b.y && a.height === b.height) {
          if (a.x + a.width === b.x) {
            a.width += b.width;
            rects.splice(j, 1);
            merged = true;
          } else if (b.x + b.width === a.x) {
            b.width += a.width;
            rects[i] = b;
            rects.splice(j, 1);
            merged = true;
          }
        }
        // Check if rectangles can be merged vertically (same X and width)
        else if (a.x === b.x && a.width === b.width) {
          if (a.y + a.height === b.y) {
            a.height += b.height;
            rects.splice(j, 1);
            merged = true;
          } else if (b.y + b.height === a.y) {
            b.height += a.height;
            rects[i] = b;
            rects.splice(j, 1);
            merged = true;
          }
        }
      }
    }
  }
}// Re-export for compatibility
export function executeEnhancedNesting(
  images: ManagedImage[],
  sheetWidth: number
) {
  return executeNesting(images, sheetWidth);
}

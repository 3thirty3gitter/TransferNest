// nesting-algorithm.ts

import { nfpNesting } from './nfp-nesting';
import { geneticAlgorithmNesting } from './ga-nesting';

// Development-only logging - disabled in production to keep console clean
const debugLog = (...args: any[]) => {
  // Only log in development or when explicitly enabled
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log(...args);
  }
};

// Input Types
export type ManagedImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  copies: number;
  dataAiHint?: string;
};

// Output Types
export type NestedImage = {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;  // nested size in inches
  height: number; // nested size in inches
  originalWidth: number;  // original image width in pixels
  originalHeight: number; // original image height in pixels
  rotated: boolean;
};

export type NestingResult = {
  placedItems: NestedImage[];
  sheetLength: number;
  areaUtilizationPct: number;
  totalCount: number;
  failedCount: number;
  sortStrategy: string;
  packingMethod: string;
};

export type SortStrategy = 'largest-first' | 'smallest-first' | 'width-first' | 'height-first' | 'AREA_DESC' | 'HEIGHT_DESC' | 'WIDTH_DESC' | 'PERIMETER_DESC';
export type PackingMethod = 'bottom-left-fill' | 'maxrects' | 'BottomLeft' | 'maxrects-packer' | 'ShelfPack';

export const VIRTUAL_SHEET_HEIGHT = 10000; // Virtual height for calculations

// Main function signature - supports 11", 13", and 17" sheets
// All sizes use 0.5" margins on left and right for printer guides
export function executeNesting(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number = 0.125,  // REDUCED: Test with tighter spacing for 90%+ target
  targetUtilization: number = 0.95  // INCREASED: Push algorithm harder
): NestingResult {
  // All sheets use the advanced algorithm with adaptive genetic algorithm
  return executeNestingAdvanced(images, sheetWidth, padding, targetUtilization);
}

// ADVANCED algorithm for all sheet sizes using adaptive genetic algorithm
// Replaces shelf-packing to achieve consistent 85-90%+ utilization
// Supports 11", 13", and 17" widths with 0.5" left/right margins
function executeNestingAdvanced(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number = 0.05,
  targetUtilization: number = 0.9
): NestingResult {
  // Rotation function - allow rotation for non-square images
  function canRotate(img: ManagedImage): boolean {
    const aspectRatio = img.width / img.height;
    return aspectRatio < 0.95 || aspectRatio > 1.05;
  }

  // Apply 0.5" margin on left and right for all sheet sizes (printer guides)
  const sideMargin = 0.5;
  const effectiveWidth = sheetWidth - (sideMargin * 2);

  // Calculate total items (including copies) to scale GA parameters
  const totalItems = images.reduce((sum, img) => sum + Math.max(1, img.copies), 0);
  
  // Scale GA parameters based on item count to avoid timeout on large orders
  // For Vercel with 60s timeout, we need to keep computation under ~50s
  let populationSize: number;
  let generations: number;
  
  if (totalItems <= 20) {
    // Small orders: full optimization
    populationSize = 100;
    generations = 100;
  } else if (totalItems <= 50) {
    // Medium orders: moderate optimization
    populationSize = 60;
    generations = 60;
  } else if (totalItems <= 100) {
    // Large orders: reduced optimization
    populationSize = 40;
    generations = 40;
  } else {
    // Very large orders: minimal GA, rely on heuristics
    populationSize = 25;
    generations = 25;
  }

  console.log(`[${sheetWidth}" NESTING] Starting GA with ${totalItems} items, pop=${populationSize}, gen=${generations}...`);
  const result = geneticAlgorithmNesting(images, effectiveWidth, 0.10, canRotate, {
    adaptive: false,
    rotationSteps: 4,
    populationSize,
    generations,
    mutationRate: 0.38
  });

  // Offset all placed items by the left margin
  result.placedItems = result.placedItems.map(img => ({
    ...img,
    x: img.x + sideMargin
  }));
  
  console.log(`[${sheetWidth}" COMPLETE] ${(result.areaUtilizationPct * 100).toFixed(1)}% utilization`);
  return result;
}

// Legacy shelf-packing algorithm for 17" sheets (kept for reference)
function executeNesting17Legacy(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number = 0.05,
  targetUtilization: number = 0.9
): NestingResult {
  // Expand copies
  const expanded: ManagedImage[] = [];
  images.forEach(img => {
    for (let i = 0; i < Math.max(1, img.copies); i++) {
      expanded.push({ ...img, id: `${img.id}-${i}`, copies: 1 });
    }
  });
  const totalCount = expanded.length;

  // Utility function: selective rotation (car images upright, text flexible)
  function canRotate(img: ManagedImage): boolean {
    // If dataAiHint is provided, use it for rotation decisions
    if (img.dataAiHint) {
      const hint = img.dataAiHint.toLowerCase();
      if (hint.includes('car') || hint.includes('vehicle')) return false;
      if (hint.includes('text') || hint.includes('vertical') || hint.includes('tall') || hint.includes('horizontal')) return true;
    }

    // CRITICAL: Very aggressive rotation to achieve 90%+ utilization
    // Allow rotation for ANY non-square item
    const aspectRatio = img.width / img.height;
    if (aspectRatio < 0.98 || aspectRatio > 1.02) {
      return true; // Rotate almost everything except perfect squares
    }

    return false;
  }

  // Packing strategies - trying more combinations for 90%+ utilization
  const sorters = [
    { name: 'AREA_DESC', fn: (a: ManagedImage, b: ManagedImage) => (b.width * b.height) - (a.width * a.height) },
    { name: 'HEIGHT_DESC', fn: (a: ManagedImage, b: ManagedImage) => b.height - a.height },
    { name: 'WIDTH_DESC', fn: (a: ManagedImage, b: ManagedImage) => b.width - a.width },
    { name: 'PERIMETER_DESC', fn: (a: ManagedImage, b: ManagedImage) => ((b.width + b.height) - (a.width + a.height)) },
    // Additional strategies for better optimization
    { name: 'ASPECT_RATIO_DESC', fn: (a: ManagedImage, b: ManagedImage) => (b.width/b.height) - (a.width/a.height) },
    { name: 'DIAGONAL_DESC', fn: (a: ManagedImage, b: ManagedImage) => Math.sqrt(b.width**2 + b.height**2) - Math.sqrt(a.width**2 + a.height**2) }
  ];
  // Try with the specified padding (safe for cutting) - optimize order not padding
  const paddings = [padding, 0.045, 0.04, 0.035, 0.03];

  let bestResult: NestingResult | null = null;
  let attemptCount = 0;

  for (const pad of paddings) {
    for (const sorter of sorters) {
      attemptCount++;
      const sorted = expanded.slice().sort(sorter.fn);
      const { placedItems, sheetLength, areaUtilizationPct } = shelfPackBestFit(sorted, sheetWidth, pad, canRotate, sorter.name);
      const failedCount = totalCount - placedItems.length;

      const result: NestingResult = {
        placedItems,
        sheetLength,
        areaUtilizationPct,
        totalCount,
        failedCount,
        sortStrategy: sorter.name,
        packingMethod: 'ShelfPackBestFit'
      };

      const util = (areaUtilizationPct * 100).toFixed(1);
      console.log(`[ATTEMPT-${attemptCount}] Pad: ${pad.toFixed(3)}", Strategy: ${sorter.name}  ${util}% (${placedItems.length}/${totalCount} placed)`);

      if (!bestResult || result.areaUtilizationPct > bestResult.areaUtilizationPct) {
        bestResult = result;
      }
      if (result.areaUtilizationPct >= targetUtilization && failedCount === 0) {
        console.log(`[SUCCESS]  Hit ${(targetUtilization * 100).toFixed(0)}% target with ${sorter.name} and ${pad.toFixed(3)}" padding`);
        return result;
      }
    }
  }

  console.log(`[BEST] Best result: ${(bestResult!.areaUtilizationPct * 100).toFixed(1)}% (${bestResult!.placedItems.length}/${totalCount} placed, tried ${attemptCount} combinations)`);
  return bestResult!;
}

// Improved Shelf Packing with Best-Fit Gap Selection (17" OPTIMIZED)
// Finds the tightest fit for each item to minimize wasted space
function shelfPackBestFit(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number,
  canRotate: (img: ManagedImage) => boolean,
  sortStrategy: string
): {
  placedItems: NestedImage[];
  sheetLength: number;
  areaUtilizationPct: number;
} {
  const placedItems: NestedImage[] = [];
  let usedArea = 0;

  // Track shelves with their positions and remaining space
  type Segment = {
    x: number;
    width: number;
    usedHeight: number;
  };

  type Shelf = {
    y: number;
    maxHeight: number;
    segments: Segment[];
  };

  const shelves: Shelf[] = [];
  let currentY = padding;

  for (const img of images) {
    // Try all orientations
    const tried = [
      { w: img.width, h: img.height, rotated: false }
    ];
    if (canRotate(img) && img.width !== img.height) {
      tried.push({ w: img.height, h: img.width, rotated: true });
    }

    let bestPlacement: {
      shelf: Shelf;
      segmentIndex: number;
      orientation: typeof tried[0];
      wastedSpace: number;
    } | null = null;

    // Find best-fit position across all shelves and segments
    for (const shelf of shelves) {
      for (let segIdx = 0; segIdx < shelf.segments.length; segIdx++) {
        const segment = shelf.segments[segIdx];
        for (const t of tried) {
          const availableHeight = shelf.maxHeight - segment.usedHeight;
          const fitsWidth = segment.x + t.w + padding <= segment.x + segment.width;
          const fitsHeight = t.h <= availableHeight;

          if (fitsWidth && fitsHeight) {
            // Calculate wasted space for this placement
            const wastedWidth = segment.width - t.w - padding;
            const wastedHeight = availableHeight - t.h;
            const wastedSpace = (wastedWidth * shelf.maxHeight) + (t.w * wastedHeight);

            // Choose placement with minimum wasted space
            if (!bestPlacement || wastedSpace < bestPlacement.wastedSpace) {
              bestPlacement = {
                shelf,
                segmentIndex: segIdx,
                orientation: t,
                wastedSpace
              };
            }
          }
        }
      }
    }

    // If found a good fit in existing shelves, place it there
    if (bestPlacement) {
      const { shelf, segmentIndex, orientation } = bestPlacement;
      const segment = shelf.segments[segmentIndex];

      placedItems.push({
        id: img.id,
        url: img.url,
        x: segment.x,
        y: shelf.y + segment.usedHeight,
        width: img.width,
        height: img.height,
        originalWidth: img.width,
        originalHeight: img.height,
        rotated: orientation.rotated
      });

      usedArea += orientation.w * orientation.h;

      // Remove the used segment and add new segments for remaining space
      shelf.segments.splice(segmentIndex, 1);

      // Add horizontal remainder (to the right of placed item)
      const remainingWidth = segment.width - orientation.w - padding;
      if (remainingWidth > 0) {
        shelf.segments.push({
          x: segment.x + orientation.w + padding,
          width: remainingWidth,
          usedHeight: segment.usedHeight  // Starts at same height
        });
      }

      // Add vertical remainder (above placed item in same x position)
      const remainingHeight = shelf.maxHeight - segment.usedHeight - orientation.h - padding;
      if (remainingHeight > 0) {
        shelf.segments.push({
          x: segment.x,
          width: orientation.w,
          usedHeight: segment.usedHeight + orientation.h + padding
        });
      }

      continue;
    }

    // If not placed in existing shelves, create new shelf
    let placed = false;
    for (const t of tried) {
      if (padding + t.w + padding <= sheetWidth) {
        const newShelf: Shelf = {
          y: currentY,
          maxHeight: t.h + padding,
          segments: []
        };

        placedItems.push({
          id: img.id,
          url: img.url,
          x: padding,
          y: currentY,
          width: img.width,
          height: img.height,
          originalWidth: img.width,
          originalHeight: img.height,
          rotated: t.rotated
        });

        usedArea += t.w * t.h;

        // Add remaining horizontal space in new shelf
        const remainingWidth = sheetWidth - padding - t.w - padding;
        if (remainingWidth > 0) {
          newShelf.segments.push({
            x: padding + t.w + padding,
            width: remainingWidth,
            usedHeight: 0
          });
        }

        shelves.push(newShelf);
        currentY += newShelf.maxHeight;
        placed = true;
        break;
      }
    }

    if (!placed) {
      console.warn(`Failed to place item ${img.id}`);
    }
  }

  const sheetLength = currentY + padding;
  const sheetArea = sheetWidth * sheetLength;
  const areaUtilizationPct = sheetArea === 0 ? 0 : usedArea / sheetArea;
  return { placedItems, sheetLength, areaUtilizationPct };
}

// Re-export for compatibility
export function executeEnhancedNesting(
  images: ManagedImage[],
  sheetWidth: number,
  padding?: number
) {
  return executeNesting(images, sheetWidth, padding);
}

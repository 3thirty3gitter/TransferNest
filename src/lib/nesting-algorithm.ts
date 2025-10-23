// nesting-algorithm.ts

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
  sortStrategy: string;
  packingMethod: string;
};

export type SortStrategy = 'largest-first' | 'smallest-first' | 'width-first' | 'height-first' | 'AREA_DESC' | 'HEIGHT_DESC' | 'WIDTH_DESC' | 'PERIMETER_DESC';
export type PackingMethod = 'bottom-left-fill' | 'maxrects' | 'BottomLeft' | 'maxrects-packer' | 'ShelfPack';

export const VIRTUAL_SHEET_HEIGHT = 10000; // Virtual height for calculations

// Main function signature
export function executeNesting(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number = 0.05,
  targetUtilization: number = 0.9
): NestingResult {
  // Expand copies
  const expanded: ManagedImage[] = [];
  images.forEach(img => {
    for (let i = 0; i < Math.max(1, img.copies); i++) {
      expanded.push({ ...img, copies: 1 });
    }
  });
  const totalCount = expanded.length;

  // Utility function: selective rotation (car images upright, text flexible)
  function canRotate(img: ManagedImage): boolean {
    // If dataAiHint is provided, use it for rotation decisions
    if (img.dataAiHint) {
      const hint = img.dataAiHint.toLowerCase();
      if (hint.includes('car') || hint.includes('vehicle')) return false;
      if (hint.includes('text') || hint.includes('vertical') || hint.includes('tall')) return true;
    }
    
    // If no hint provided, use aspect ratio to determine rotation eligibility
    // Allow rotation for tall/narrow items (aspect ratio < 0.8 or > 1.25)
    // This helps pack vertical items horizontally and vice versa
    const aspectRatio = img.width / img.height;
    if (aspectRatio < 0.8 || aspectRatio > 1.25) {
      return true; // Tall or wide items can rotate
    }
    
    return false; // Square-ish items stay as-is
  }

  // Packing strategies
  const sorters = [
    { name: 'HEIGHT_DESC', fn: (a: ManagedImage, b: ManagedImage) => b.height - a.height },
    { name: 'WIDTH_DESC', fn: (a: ManagedImage, b: ManagedImage) => b.width - a.width },
    { name: 'AREA_DESC', fn: (a: ManagedImage, b: ManagedImage) => (b.width * b.height) - (a.width * a.height) },
    { name: 'PERIMETER_DESC', fn: (a: ManagedImage, b: ManagedImage) => ((b.width + b.height) - (a.width + a.height)) }
  ];
  const paddings = [padding, 0.03, 0.02, 0.01, 0];

  let bestResult: NestingResult | null = null;
  let attemptCount = 0;

  for (const pad of paddings) {
    for (const sorter of sorters) {
      attemptCount++;
      const sorted = expanded.slice().sort(sorter.fn);
      const { placedItems, sheetLength, areaUtilizationPct } = shelfPack(sorted, sheetWidth, pad, canRotate, sorter.name);
      const failedCount = totalCount - placedItems.length;
      
      const result: NestingResult = {
        placedItems,
        sheetLength,
        areaUtilizationPct,
        totalCount,
        failedCount,
        sortStrategy: sorter.name,
        packingMethod: 'ShelfPack'
      };
      
      const util = (areaUtilizationPct * 100).toFixed(1);
      console.log(`[ATTEMPT-${attemptCount}] Pad: ${pad.toFixed(3)}", Strategy: ${sorter.name} → ${util}% (${placedItems.length}/${totalCount} placed)`);
      
      if (!bestResult || result.areaUtilizationPct > bestResult.areaUtilizationPct) {
        bestResult = result;
      }
      if (result.areaUtilizationPct >= targetUtilization && failedCount === 0) {
        console.log(`[SUCCESS] ✓ Hit ${(targetUtilization * 100).toFixed(0)}% target with ${sorter.name} and ${pad.toFixed(3)}" padding`);
        return result;
      }
    }
  }
  
  console.log(`[BEST] Best result: ${(bestResult!.areaUtilizationPct * 100).toFixed(1)}% (${bestResult!.placedItems.length}/${totalCount} placed, tried ${attemptCount} combinations)`);
  return bestResult!;
}

// Shelf Packing Algorithm with Multi-Level Shelf Support
// Each shelf can have multiple "levels" to fill vertical space efficiently
function shelfPack(
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
  type Shelf = {
    y: number;           // Y position of shelf top
    maxHeight: number;   // Tallest item in this shelf
    segments: Array<{    // Horizontal segments in this shelf
      x: number;         // X start position
      width: number;     // Available width
      usedHeight: number; // Height used so far in this segment
    }>;
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

    let placed = false;
    
    // Try to fit in existing shelves first (fill vertically)
    for (const shelf of shelves) {
      for (const segment of shelf.segments) {
        for (const t of tried) {
          const availableHeight = shelf.maxHeight - segment.usedHeight;
          const fitsWidth = segment.x + t.w + padding <= segment.x + segment.width;
          const fitsHeight = t.h <= availableHeight;
          
          if (fitsWidth && fitsHeight) {
            // Place item in this segment
            placedItems.push({
              id: img.id,
              url: img.url,
              x: segment.x,
              y: shelf.y + segment.usedHeight,
              width: img.width,
              height: img.height,
              rotated: t.rotated
            });
            
            usedArea += t.w * t.h;
            
            // Split segment into used and remaining horizontal space
            const remainingWidth = segment.width - t.w - padding;
            segment.usedHeight += t.h + padding;
            
            if (remainingWidth > 0) {
              shelf.segments.push({
                x: segment.x + t.w + padding,
                width: remainingWidth,
                usedHeight: segment.usedHeight - t.h - padding // Start at same height as item just placed
              });
            }
            
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (placed) break;
    }
    
    // If not placed in existing shelves, create new shelf
    if (!placed) {
      for (const t of tried) {
        if (padding + t.w + padding <= sheetWidth) {
          const newShelf: Shelf = {
            y: currentY,
            maxHeight: t.h + padding,
            segments: [{
              x: padding,
              width: sheetWidth - 2 * padding,
              usedHeight: t.h + padding
            }]
          };
          
          placedItems.push({
            id: img.id,
            url: img.url,
            x: padding,
            y: currentY,
            width: img.width,
            height: img.height,
            rotated: t.rotated
          });
          
          usedArea += t.w * t.h;
          
          // Split remaining horizontal space in new shelf
          const remainingWidth = sheetWidth - padding - t.w - padding;
          if (remainingWidth > 0) {
            newShelf.segments.push({
              x: padding + t.w + padding,
              width: remainingWidth,
              usedHeight: 0 // Available from top of shelf
            });
          }
          
          shelves.push(newShelf);
          currentY += newShelf.maxHeight;
          placed = true;
          break;
        }
      }
    }
    
    // If still can't place, skip this item (shouldn't happen with proper sizing)
    if (!placed) {
      console.warn(`Failed to place item ${img.id}`);
    }
  }

  const sheetLength = currentY + padding; // Add bottom padding
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

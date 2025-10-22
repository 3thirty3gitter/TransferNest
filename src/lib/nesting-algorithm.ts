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
    if (!img.dataAiHint) return false;
    const hint = img.dataAiHint.toLowerCase();
    if (hint.includes('car')) return false;
    if (hint.includes('text') || hint.includes('vertical') || hint.includes('tall')) return true;
    return false;
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

  for (const pad of paddings) {
    for (const sorter of sorters) {
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
      if (!bestResult || result.areaUtilizationPct > bestResult.areaUtilizationPct) {
        bestResult = result;
      }
      if (result.areaUtilizationPct >= targetUtilization && failedCount === 0) {
        return result;
      }
    }
  }
  return bestResult!;
}

// Shelf Packing Algorithm (with selective per-item rotation)
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
  let x = 0, y = 0, shelfHeight = 0;
  const placedItems: NestedImage[] = [];
  let usedArea = 0;

  for (const img of images) {
    // Try both orientations if allowed, else only original
    let tried = [
      { w: img.width, h: img.height, rotated: false }
    ];
    if (canRotate(img) && img.width !== img.height) {
      tried.push({ w: img.height, h: img.width, rotated: true });
    }
    
    // Find orientation that fits this shelf, preferring least shelf height increase
    let fit = null;
    for (const t of tried) {
      if (t.w > sheetWidth) continue; // Can't fit at all
      if (x + t.w <= sheetWidth) {
        // Fits in current shelf
        fit = t;
        break;
      }
    }
    
    // If none fits in current shelf, move to new shelf and retry
    if (!fit) {
      y += shelfHeight + padding;
      x = 0;
      shelfHeight = 0;
      for (const t of tried) {
        if (t.w <= sheetWidth) {
          fit = t;
          break;
        }
      }
      if (!fit) continue; // Still doesn't fit
    }
    
    placedItems.push({
      id: img.id,
      url: img.url,
      x,
      y,
      width: img.width,    // Report original, per interface
      height: img.height,  // Report original, per interface
      rotated: fit.rotated
    });
    
    usedArea += img.width * img.height; // Use original dimensions for area calculation
    x += fit.w + padding;
    if (fit.h > shelfHeight) shelfHeight = fit.h;
  }
  
  const sheetLength = y + shelfHeight;
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

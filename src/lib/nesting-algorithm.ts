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
  sheetWidth: number,
  padding?: number,  // Optional padding override for testing
  targetUtilization: number = 0.90  // Target 90% utilization, retry if below
): NestingResult {
  // Validate and normalize images
  const validatedImages = images.filter(img => {
    // Check dimensions are valid numbers
    if (!Number.isFinite(img.width) || !Number.isFinite(img.height) || 
        img.width <= 0 || img.height <= 0) {
      console.warn(`Invalid image dimensions: ${img.id} (${img.width}x${img.height})`);
      return false;
    }
    // Check copies is valid
    if (!Number.isFinite(img.copies) || img.copies < 1) {
      console.warn(`Invalid copies count: ${img.id} (${img.copies})`);
      return false;
    }
    return true;
  });

  if (validatedImages.length === 0) {
    console.warn('No valid images to nest');
    return {
      placedItems: [],
      sheetLength: 0,
      areaUtilizationPct: 0,
      totalCount: 0,
      failedCount: 0,
      sortStrategy: 'largest-first',
      packingMethod: 'maxrects-packer'
    };
  }

  // Flatten images with copies
  const allImages: (ManagedImage & { copyIndex: number })[] = [];
  validatedImages.forEach(img => {
    const numCopies = Math.max(1, Math.floor(img.copies)); // Ensure integer copies
    for (let i = 0; i < numCopies; i++) {
      allImages.push({ ...img, copyIndex: i });
    }
  });

  // Define sorting strategies to try
  type SortStrategy = (a: any, b: any) => number;
  
  const sortStrategies: { name: string; fn: SortStrategy }[] = [
    {
      name: 'AREA_DESC',
      fn: (a, b) => (b.width * b.height) - (a.width * a.height),  // Largest area first
    },
    {
      name: 'WIDTH_DESC',
      fn: (a, b) => {
        if (b.width !== a.width) return b.width - a.width;
        return b.height - a.height;
      },
    },
    {
      name: 'HEIGHT_DESC',
      fn: (a, b) => {
        if (b.height !== a.height) return b.height - a.height;
        return b.width - a.width;
      },
    },
    {
      name: 'PERIMETER_DESC',
      fn: (a, b) => (2 * (b.width + b.height)) - (2 * (a.width + a.height)),
    },
  ];

  // Try packing with different strategies AND padding values until we hit target utilization
  let bestResult: NestingResult | null = null;
  let attemptCount = 0;
  
  // Expanded padding values to try - MORE aggressive to reduce space waste
  const paddingValues = [
    0.02,             // Ultra-aggressive (most tight)
    0.01,             // Minimal spacing
    padding ?? 0.05,  // User override or default 0.05
    0.03,             // Aggressive
    0.0,              // No padding - theoretical max
  ];

  for (const tryPadding of paddingValues) {
    for (const strategy of sortStrategies) {
      // Make a copy to sort
      const sortedImages = [...allImages];
      sortedImages.sort(strategy.fn);

      // Pack with this strategy and padding combo (enableRotation for aggressive attempts)
      const enableRotation = tryPadding <= 0.02;  // Enable rotation for tighter packing
      const result = packImages(sortedImages, sheetWidth, tryPadding, enableRotation);
      attemptCount++;

      const util = (result.areaUtilizationPct * 100).toFixed(1);
      const rotStr = enableRotation ? " [ROT]" : "";
      console.log(`[RETRY-${attemptCount}] Pad: ${tryPadding.toFixed(2)}", Strategy: ${strategy.name}${rotStr} → ${util}% util`);

      // Check if this is the best so far
      if (!bestResult || result.areaUtilizationPct > bestResult.areaUtilizationPct) {
        bestResult = result;
      }

      // If we hit target, stop trying
      if (result.areaUtilizationPct >= targetUtilization) {
        console.log(`[RETRY-SUCCESS] Hit target ${(targetUtilization * 100).toFixed(0)}% with ${tryPadding.toFixed(2)}" padding, ${strategy.name}${rotStr}`);
        return result;
      }
    }
  }

  // Return best result even if it didn't hit target
  if (bestResult) {
    console.log(`[RETRY-BEST] Best result: ${(bestResult.areaUtilizationPct * 100).toFixed(1)}% (tried ${attemptCount} combinations)`);
    return bestResult;
  }

  // Fallback - should never reach here
  return {
    placedItems: [],
    sheetLength: 0,
    areaUtilizationPct: 0,
    totalCount: allImages.length,
    failedCount: allImages.length,
    sortStrategy: 'largest-first',
    packingMethod: 'maxrects-packer'
  };
}

// Helper function to perform the actual packing with a given sort order
function packImages(
  sortedImages: (ManagedImage & { copyIndex: number })[],
  sheetWidth: number,
  padding: number,
  allowRotation: boolean = false
): NestingResult {
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
  const PADDING = padding ?? 0.05; // Reduced from 0.08" to 0.05" for better utilization
  
  let placedItems: NestedImage[] = [];
  let failedCount = 0;
  
  // CRITICAL FIX: Let MaxRects handle spacing internally via padding parameter
  // DO NOT add padding to item dimensions - that causes double-spacing waste
  const packer = new MaxRectsPacker(
    sheetWidth,
    VIRTUAL_SHEET_HEIGHT,
    PADDING,  // Packer will maintain this spacing between ALL items automatically
    {
      smart: true,      // Smart packing
      pot: false,       // Not power-of-two
      square: false,    // Not square required
      allowRotation: allowRotation,  // Enable/disable rotation based on strategy
      tag: false,       // No tagging
      border: 0         // No border
    }
  );

  console.log(`[NESTING] Packer initialized: width=${sheetWidth}", height=${VIRTUAL_SHEET_HEIGHT}", spacing=${PADDING}" [ROT: ${allowRotation}]`);
  console.log(`[NESTING] Total images to pack: ${sortedImages.length}`);

  // Pack items at their ACTUAL dimensions - packer handles spacing internally
  for (const image of sortedImages) {
    // CORRECT: Pack at real dimensions, let MaxRects maintain spacing
    const packedWidth = image.width;    // Actual width (no artificial inflation)
    const packedHeight = image.height;  // Actual height (no artificial inflation)
    
    // Try to pack - the library will handle rotation internally
    packer.add(
      packedWidth,
      packedHeight,
      {
        imageId: `${image.id}-${image.copyIndex}`,
        originalWidth: image.width,
        originalHeight: image.height,
        url: image.url
      }
    );
  }

  // MaxRects creates multiple bins - we need to process ALL of them
  console.log(`[PACKING] Created ${packer.bins.length} bin(s)`);

  // Extract placed items from ALL bins
  for (let binIndex = 0; binIndex < packer.bins.length; binIndex++) {
    const bin = packer.bins[binIndex];
    
    for (const rect of bin.rects) {
      const imageData = rect.data as any;
      
      // CRITICAL: Check if item is within sheet bounds
      const itemRight = rect.x + imageData.originalWidth;
      const itemLeft = rect.x;
      
      // If item extends beyond bounds, don't add it to placed items
      if (itemLeft < 0 || itemRight > sheetWidth) {
        console.error(`[ENFORCEMENT] Rejecting ${imageData.imageId}: x=${rect.x}, width=${imageData.originalWidth}, right=${itemRight}, max=${sheetWidth}`);
        failedCount++;
      } else {
        // Check if rotation was applied
        const rotated = (rect.width === imageData.originalHeight && rect.height === imageData.originalWidth);

        const placedItem: NestedImage = {
          id: imageData.imageId,
          url: imageData.url,
          x: rect.x,
          y: rect.y,
          width: imageData.originalWidth,
          height: imageData.originalHeight,
          rotated
        };

        placedItems.push(placedItem);

        // Debug logging
        if (rotated) {
          console.log(`[ROTATED] ${imageData.imageId}: ${imageData.originalWidth}×${imageData.originalHeight} → ${rect.width}×${rect.height} at (${rect.x}, ${rect.y})`);
        }
      }
    }
  }

  // Check if any items failed to pack (should be 0 now)
  failedCount = sortedImages.length - placedItems.length;

  // Calculate metrics
  const maxY = placedItems.length > 0
    ? Math.max(...placedItems.map(item => item.y + item.height))
    : 0;

  // Check for items outside sheet bounds (safety check)
  const itemsOutOfBounds = placedItems.filter(item => item.x + item.width > sheetWidth);
  if (itemsOutOfBounds.length > 0) {
    console.warn(`[CRITICAL] ${itemsOutOfBounds.length} items placed outside sheet width (${sheetWidth}"):`, 
      itemsOutOfBounds.map(i => `${i.id} at x=${i.x}, width=${i.width}, right=${i.x + i.width}`)
    );
  }
  
  // Log if significant failures occurred
  if (failedCount > 0) {
    const failureRate = ((failedCount / sortedImages.length) * 100).toFixed(1);
    console.warn(`[WARNING] Failed to place ${failedCount}/${sortedImages.length} items (${failureRate}% failure rate)`);
  }

  const totalArea = sheetWidth * maxY;
  const usedArea = placedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
  const utilization = totalArea > 0 ? usedArea / totalArea : 0;

  console.log(`[RESULT] Sheet: ${sheetWidth}" × ${maxY.toFixed(2)}", Items: ${placedItems.length}/${sortedImages.length}, Utilization: ${(utilization * 100).toFixed(1)}%`);

  return {
    placedItems,
    sheetLength: maxY,
    areaUtilizationPct: utilization,
    totalCount: sortedImages.length,
    failedCount,
    sortStrategy: 'largest-first',
    packingMethod: 'maxrects-packer'
  };
}


// Re-export for compatibility
export function executeEnhancedNesting(
  images: ManagedImage[],
  sheetWidth: number,
  padding?: number
) {
  return executeNesting(images, sheetWidth, padding);
}

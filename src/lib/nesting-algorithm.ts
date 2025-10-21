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

  // Try packing with different strategies until we hit target utilization
  let bestResult: NestingResult | null = null;
  let attemptCount = 0;

  for (const strategy of sortStrategies) {
    // Make a copy to sort
    const sortedImages = [...allImages];
    sortedImages.sort(strategy.fn);

    // Pack with this strategy
    const result = packImages(sortedImages, sheetWidth, padding ?? 0.08);
    attemptCount++;

    console.log(`[RETRY-${attemptCount}] Strategy: ${strategy.name} → ${(result.areaUtilizationPct * 100).toFixed(1)}% util`);

    // Check if this is the best so far
    if (!bestResult || result.areaUtilizationPct > bestResult.areaUtilizationPct) {
      bestResult = result;
    }

    // If we hit target, stop trying
    if (result.areaUtilizationPct >= targetUtilization) {
      console.log(`[RETRY-SUCCESS] Hit target ${(targetUtilization * 100).toFixed(0)}% utilization with ${strategy.name}`);
      return result;
    }
  }

  // Return best result even if it didn't hit target
  if (bestResult) {
    console.log(`[RETRY-BEST] Best result: ${(bestResult.areaUtilizationPct * 100).toFixed(1)}% (tried ${attemptCount} strategies)`);
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
  padding: number
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
  const PADDING = padding ?? 0.08; // Default 0.08" if not specified, or use provided value
  
  let placedItems: NestedImage[] = [];
  let failedCount = 0;
  
  // Initialize packer WITHOUT padding parameter - we'll handle spacing differently
  const packer = new MaxRectsPacker(
    sheetWidth,
    VIRTUAL_SHEET_HEIGHT,
    0,  // No padding - we'll add spacing by increasing item sizes
    {
      smart: true,      // Smart packing
      pot: false,       // Not power-of-two
      square: false,    // Not square required
      allowRotation: false,  // No rotation
      tag: false,       // No tagging
      border: 0         // No border
    }
  );

  console.log(`[NESTING] Packer initialized: width=${sheetWidth}", height=${VIRTUAL_SHEET_HEIGHT}", spacing=${PADDING}"`);
  console.log(`[NESTING] Total images to pack: ${sortedImages.length}`);

  // Pack each image with both orientations
  for (const image of sortedImages) {
    // Add spacing only to right and bottom (0.15" right, 0.15" bottom margins)
    // This is more efficient than adding to both sides
    const packedWidth = image.width + PADDING;  // Space on right
    const packedHeight = image.height + PADDING; // Space on bottom
    
    // Try to pack - the library will handle rotation internally
    const rect = packer.add(
      packedWidth,
      packedHeight,
      {
        imageId: `${image.id}-${image.copyIndex}`,
        originalWidth: image.width,
        originalHeight: image.height
      }
    );

    if (rect) {
      // CRITICAL: Check if item is within sheet bounds (using actual item width, not padded)
      const itemRight = rect.x + image.width;
      const itemLeft = rect.x;
      
      // If item extends beyond bounds, don't add it to placed items
      if (itemLeft < 0 || itemRight > sheetWidth) {
        console.error(`[ENFORCEMENT] Rejecting ${image.id}-${image.copyIndex}: x=${rect.x}, width=${image.width}, right=${itemRight}, max=${sheetWidth}`);
        failedCount++;
      } else {
        // Check if rotation was applied
        const rotated = (rect.width === image.height && rect.height === image.width);

        const placedItem: NestedImage = {
          id: `${image.id}-${image.copyIndex}`,
          url: image.url,
          x: rect.x,
          y: rect.y,
          width: image.width,
          height: image.height,
          rotated
        };

        placedItems.push(placedItem);

        // Debug logging
        if (rotated) {
          console.log(`[ROTATED] ${image.id}: ${image.width}×${image.height} → ${rect.width}×${rect.height} at (${rect.x}, ${rect.y})`);
        }
      }
    } else {
      failedCount++;
      console.warn(`[FAILED] Could not pack ${image.id}-${image.copyIndex} (${image.width}×${image.height})`);
    }
  }

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

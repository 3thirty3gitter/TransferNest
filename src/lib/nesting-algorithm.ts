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
  const PADDING = 0.15; // 0.15 inches spacing between images
  const packer = new MaxRectsPacker(
    sheetWidth,
    VIRTUAL_SHEET_HEIGHT,
    PADDING,  // Add 0.15" spacing between all items
    {
      smart: true,
      pot: false,
      square: false,
      allowRotation: false,
      tag: false,
      border: 0
    }
  );

  console.log(`[NESTING] Packer initialized: width=${sheetWidth}", height=${VIRTUAL_SHEET_HEIGHT}", padding=${PADDING}"`);

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

      // Debug logging for items outside bounds
      if (rect.x + rect.width > sheetWidth) {
        console.warn(`[WARNING] Item ${image.id}-${image.copyIndex} extends beyond sheet width: x=${rect.x}, width=${rect.width}, total=${rect.x + rect.width}, sheetWidth=${sheetWidth}`);
      }

      // Debug logging
      if (rotated) {
        console.log(`[ROTATED] ${image.id}: ${image.width}×${image.height} → ${rect.width}×${rect.height} at (${rect.x}, ${rect.y})`);
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

  const totalArea = sheetWidth * maxY;
  const usedArea = placedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
  const utilization = totalArea > 0 ? usedArea / totalArea : 0;

  console.log(`[RESULT] Sheet: ${sheetWidth}" × ${maxY.toFixed(2)}", Items: ${placedItems.length}/${allImages.length}, Utilization: ${(utilization * 100).toFixed(1)}%`);

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

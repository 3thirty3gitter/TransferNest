
// src/lib/nesting-algorithm.ts

/**
 * @fileoverview A robust 2D bin packing algorithm for nesting images onto a sheet.
 * Implements the MaxRects algorithm with multiple heuristics.
 * This is a complete rewrite to ensure stability and correctness.
 */

// --- Data Contracts ---
export type ManagedImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  copies: number;
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

// --- Algorithm Internals & Types ---
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ExpandedImage = {
  id: string;
  url: string;
  width: number;
  height: number;
};

type Node = Rect & { score1: number; score2: number };

export type SortStrategy = 'AREA_DESC' | 'PERIMETER_DESC' | 'HEIGHT_DESC' | 'WIDTH_DESC';
export type PackingMethod = 'BestShortSideFit' | 'BestLongSideFit' | 'BestAreaFit' | 'BottomLeft';

export const VIRTUAL_SHEET_HEIGHT = 100000;
const ITEM_SPACING = 0.125;
const EPSILON = 1e-6;

// --- Main Packer Class ---
class MaxRectsBinPack {
  private freeRectangles: Rect[] = [];
  public sheetWidth: number;
  public sheetHeight: number;

  constructor(width: number, height: number) {
    this.sheetWidth = width;
    this.sheetHeight = height;
    this.freeRectangles.push({ x: 0, y: 0, width, height });
  }

   private findPositionForNewNode(
    width: number,
    height: number,
    method: PackingMethod
  ): Node {
    let bestNode: Node = { x: 0, y: 0, width: 0, height: 0, score1: Infinity, score2: Infinity };

    for (const freeRect of this.freeRectangles) {
      if (freeRect.width >= width && freeRect.height >= height) {
        let score1: number, score2: number;
        switch (method) {
          case 'BestShortSideFit':
            score1 = Math.min(freeRect.width - width, freeRect.height - height);
            score2 = Math.max(freeRect.width - width, freeRect.height - height);
            break;
          case 'BestLongSideFit':
            score1 = Math.max(freeRect.width - width, freeRect.height - height);
            score2 = Math.min(freeRect.width - width, freeRect.height - height);
            break;
          case 'BestAreaFit':
            score1 = freeRect.width * freeRect.height - width * height;
            score2 = Infinity;
            break;
          case 'BottomLeft':
            score1 = freeRect.y + height;
            score2 = freeRect.x;
            break;
        }

        if (score1 < bestNode.score1 || (score1 === bestNode.score1 && score2 < bestNode.score2)) {
          bestNode = {
            x: freeRect.x,
            y: freeRect.y,
            width: width,
            height: height,
            score1,
            score2,
          };
        }
      }
    }
    return bestNode;
  }
  
  insert(width: number, height: number, method: PackingMethod): (Rect & { rotated: boolean }) | null {
    const newNode = this.findPositionForNewNode(width, height, method);
    
    // Try to rotate
    const rotatedNode = this.findPositionForNewNode(height, width, method);

    // If both don't fit
    if (newNode.score1 === Infinity && rotatedNode.score1 === Infinity) {
      return null;
    }

    let placedNode: Rect & { rotated: boolean };

    // Compare scores. <= allows tie-breaking which is important.
    if (newNode.score1 <= rotatedNode.score1 && newNode.score2 <= rotatedNode.score2) {
      placedNode = { ...newNode, rotated: false };
    } else {
      placedNode = { ...rotatedNode, rotated: true };
    }

    if (placedNode.width === 0 || placedNode.height === 0) {
      return null; // Should not happen with score checks, but as a safeguard.
    }
    
    this.splitFreeNode(placedNode);
    this.pruneFreeList();

    return placedNode;
  }

  private splitFreeNode(usedNode: Rect): void {
      const newFreeRects: Rect[] = [];
      for (const freeRect of this.freeRectangles) {
          if (!this.isOverlapping(usedNode, freeRect)) {
              newFreeRects.push(freeRect);
              continue;
          }

          // Top split
          if (usedNode.y > freeRect.y + EPSILON) {
              newFreeRects.push({ x: freeRect.x, y: freeRect.y, width: freeRect.width, height: usedNode.y - freeRect.y });
          }
          // Bottom split
          if (usedNode.y + usedNode.height < freeRect.y + freeRect.height - EPSILON) {
              newFreeRects.push({ x: freeRect.x, y: usedNode.y + usedNode.height, width: freeRect.width, height: (freeRect.y + freeRect.height) - (usedNode.y + usedNode.height) });
          }
          // Left split
          if (usedNode.x > freeRect.x + EPSILON) {
              newFreeRects.push({ x: freeRect.x, y: usedNode.y, width: usedNode.x - freeRect.x, height: usedNode.height });
          }
          // Right split
          if (usedNode.x + usedNode.width < freeRect.x + freeRect.width - EPSILON) {
              newFreeRects.push({ x: usedNode.x + usedNode.width, y: usedNode.y, width: (freeRect.x + freeRect.width) - (usedNode.x + usedNode.width), height: usedNode.height });
          }
      }
      this.freeRectangles = newFreeRects;
  }

  private isOverlapping(rect1: Rect, rect2: Rect): boolean {
      return rect1.x < rect2.x + rect2.width - EPSILON &&
             rect1.x + rect1.width > rect2.x + EPSILON &&
             rect1.y < rect2.y + rect2.height - EPSILON &&
             rect1.y + rect1.height > rect2.y + EPSILON;
  }

  private pruneFreeList(): void {
    let i = 0;
    while (i < this.freeRectangles.length) {
        let j = i + 1;
        while (j < this.freeRectangles.length) {
            const r1 = this.freeRectangles[i];
            const r2 = this.freeRectangles[j];
            if (r2.x >= r1.x - EPSILON && r2.y >= r1.y - EPSILON && r2.x + r2.width <= r1.x + r1.width + EPSILON && r2.y + r2.height <= r1.y + r1.height + EPSILON) {
                this.freeRectangles.splice(j, 1); // r2 is inside r1
            } else if (r1.x >= r2.x - EPSILON && r1.y >= r2.y - EPSILON && r1.x + r1.width <= r2.x + r2.width + EPSILON && r1.y + r1.height <= r2.y + r2.height + EPSILON) {
                this.freeRectangles.splice(i, 1); // r1 is inside r2
                i--; // Decrement i to re-check the new element at this index
                break;
            } else {
                j++;
            }
        }
        i++;
    }
  }
}

// --- Helper Functions ---
function expandImages(images: ManagedImage[]): ExpandedImage[] {
  return images.flatMap(img =>
    Array(img.copies).fill(null).map(() => ({
      id: img.id,
      url: img.url,
      width: img.width,
      height: img.height,
    }))
  );
}

function sortImages(images: ExpandedImage[], strategy: SortStrategy): void {
  images.sort((a, b) => {
    switch (strategy) {
      case 'AREA_DESC':
        return (b.width * b.height) - (a.width * a.height);
      case 'PERIMETER_DESC':
        return (b.width + b.height) - (a.width + a.height);
      case 'HEIGHT_DESC':
        return b.height - a.height;
      case 'WIDTH_DESC':
        return b.width - a.width;
      default:
        return 0;
    }
  });
}

function calculateOccupancy(placedItems: NestedImage[], sheetWidth: number, sheetLength: number): number {
    if (sheetWidth <= 0 || sheetLength <= 0 || placedItems.length === 0) {
        return 0;
    }
    const totalItemArea = placedItems.reduce((acc, item) => acc + item.width * item.height, 0);
    const totalSheetArea = sheetWidth * sheetLength;
    return totalItemArea / totalSheetArea;
}

// --- Main Exported Function ---
export function executeNesting(
  images: ManagedImage[],
  sheetWidth: number,
  sheetHeight: number = VIRTUAL_SHEET_HEIGHT,
  sortStrategy: SortStrategy = 'AREA_DESC',
  packingMethod: PackingMethod = 'BestShortSideFit'
): NestingResult {
  const allImages = expandImages(images);
  sortImages(allImages, sortStrategy);

  const packer = new MaxRectsBinPack(sheetWidth, sheetHeight);
  const placedItems: NestedImage[] = [];
  let failedCount = 0;

  for (const image of allImages) {
    const spacedWidth = image.width + ITEM_SPACING;
    const spacedHeight = image.height + ITEM_SPACING;
    
    const node = packer.insert(
      spacedWidth,
      spacedHeight,
      packingMethod
    );

    if (node) {
      placedItems.push({
        id: image.id,
        url: image.url,
        x: node.x,
        y: node.y,
        width: node.rotated ? image.height : image.width,
        height: node.rotated ? image.width : image.height,
        rotated: node.rotated,
      });
    } else {
      failedCount++;
    }
  }

  const finalSheetLength = placedItems.length > 0
      ? Math.max(...placedItems.map(item => item.y + item.height + ITEM_SPACING))
      : 0;

  const areaUtilizationPct = calculateOccupancy(placedItems, sheetWidth, finalSheetLength);
  
  const result: NestingResult = {
    placedItems,
    sheetLength: finalSheetLength,
    areaUtilizationPct,
    totalCount: allImages.length,
    failedCount,
    sortStrategy,
    packingMethod,
  };
  
  return result;
}

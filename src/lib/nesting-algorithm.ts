
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

  insert(width: number, height: number, method: PackingMethod): Rect | null {
    let bestNode: Rect & { score1?: number, score2?: number } = { x: 0, y: 0, width: 0, height: 0 };
    let bestScore1 = Infinity;
    let bestScore2 = Infinity;

    const tryPlace = (w: number, h: number): Rect | null => {
        for (const freeRect of this.freeRectangles) {
            if (freeRect.width >= w && freeRect.height >= h) {
                let score1: number, score2: number;
                switch (method) {
                    case 'BestShortSideFit':
                        score1 = Math.min(freeRect.width - w, freeRect.height - h);
                        score2 = Math.max(freeRect.width - w, freeRect.height - h);
                        break;
                    case 'BestLongSideFit':
                        score1 = Math.max(freeRect.width - w, freeRect.height - h);
                        score2 = Math.min(freeRect.width - w, freeRect.height - h);
                        break;
                    case 'BestAreaFit':
                        score1 = freeRect.width * freeRect.height - w * h;
                        score2 = Infinity;
                        break;
                    case 'BottomLeft':
                        score1 = freeRect.y + h;
                        score2 = freeRect.x;
                        break;
                }

                if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
                    bestScore1 = score1;
                    bestScore2 = score2;
                    bestNode = { x: freeRect.x, y: freeRect.y, width: w, height: h };
                }
            }
        }
        return null;
    }
    
    // Try original orientation
    tryPlace(width, height);
    const originalNode = { ...bestNode };
    const originalScore1 = bestScore1;
    const originalScore2 = bestScore2;

    // Reset and try rotated
    bestScore1 = Infinity;
    bestScore2 = Infinity;
    tryPlace(height, width);
    const rotatedNode = { ...bestNode };

    // If no fit found at all
    if (originalScore1 === Infinity && bestScore1 === Infinity) {
        return null;
    }
    
    let placedNode: Rect & { rotated: boolean };

    // Compare original and rotated results
    if (originalScore1 < bestScore1 || (originalScore1 === bestScore1 && originalScore2 < bestScore2)) {
      placedNode = { ...originalNode, rotated: false };
    } else {
      placedNode = { ...rotatedNode, rotated: true };
    }
    
    this.splitFreeNode(placedNode);
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
          if (usedNode.y > freeRect.y) {
              newFreeRects.push({ x: freeRect.x, y: freeRect.y, width: freeRect.width, height: usedNode.y - freeRect.y });
          }
          // Bottom split
          if (usedNode.y + usedNode.height < freeRect.y + freeRect.height) {
              newFreeRects.push({ x: freeRect.x, y: usedNode.y + usedNode.height, width: freeRect.width, height: (freeRect.y + freeRect.height) - (usedNode.y + usedNode.height) });
          }
          // Left split
          if (usedNode.x > freeRect.x) {
              newFreeRects.push({ x: freeRect.x, y: freeRect.y, width: usedNode.x - freeRect.x, height: freeRect.height });
          }
          // Right split
          if (usedNode.x + usedNode.width < freeRect.x + freeRect.width) {
              newFreeRects.push({ x: usedNode.x + usedNode.width, y: freeRect.y, width: (freeRect.x + freeRect.width) - (usedNode.x + usedNode.width), height: freeRect.height });
          }
      }
      this.freeRectangles = newFreeRects;
      this.pruneFreeList();
  }

  private isOverlapping(rect1: Rect, rect2: Rect): boolean {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
  }

  private pruneFreeList(): void {
    let i = 0;
    while (i < this.freeRectangles.length) {
        let j = i + 1;
        while (j < this.freeRectangles.length) {
            const r1 = this.freeRectangles[i];
            const r2 = this.freeRectangles[j];
            if (r2.x >= r1.x && r2.y >= r1.y && r2.x + r2.width <= r1.x + r1.width && r2.y + r2.height <= r1.y + r1.height) {
                this.freeRectangles.splice(j, 1); // r2 is inside r1
            } else if (r1.x >= r2.x && r1.y >= r2.y && r1.x + r1.width <= r2.x + r2.width && r1.y + r1.height <= r2.y + r2.height) {
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

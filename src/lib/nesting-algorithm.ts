
// src/lib/nesting-algorithm.ts

/**
 * @fileoverview A 2D bin packing algorithm for nesting images onto a sheet.
 * Implements the MaxRects algorithm with multiple heuristics.
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
  sortStrategy: string;
  packingMethod: string;
};

// --- Algorithm Internals & Types ---
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Node = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  score: number;
};

type ExpandedImage = {
  id: string;
  url: string;
  width: number;
  height: number;
};

export type SortStrategy = 'AREA_DESC' | 'PERIMETER_DESC' | 'HEIGHT_DESC' | 'WIDTH_DESC';
export type PackingMethod = 'BestShortSideFit' | 'BestLongSideFit' | 'BestAreaFit';

export const VIRTUAL_SHEET_HEIGHT = 100000;
const ITEM_SPACING = 0.125;
const EPSILON = 1e-6;

// --- Main Packer Class ---
class MaxRectsBinPack {
  private freeRectangles: Rect[] = [];

  constructor(width: number, height: number) {
    this.freeRectangles.push({ x: 0, y: 0, width, height });
  }

  insert(
    width: number,
    height: number,
    method: PackingMethod
  ): Node | null {
    const node = this.findPositionForNewNode(width, height, method);
    const rotatedNode = this.findPositionForNewNode(height, width, method);

    let bestNode: Node = { x: 0, y: 0, width: 0, height: 0, rotated: false, score: Infinity };

    if (node.score <= rotatedNode.score) {
        bestNode = { ...node, width: width, height: height, rotated: false };
    } else {
        bestNode = { ...rotatedNode, width: height, height: width, rotated: true };
    }

    if (bestNode.score === Infinity) {
      return null;
    }

    this.splitFreeNode(bestNode);
    return bestNode;
  }

   private findPositionForNewNode(
    width: number,
    height: number,
    method: PackingMethod
  ): Node {
    let bestNode: Node = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotated: false, 
      score: Infinity,
    };

    for (let i = 0; i < this.freeRectangles.length; i++) {
        const rect = this.freeRectangles[i];
        if (width <= rect.width + EPSILON && height <= rect.height + EPSILON) {
            let score: number;
            switch (method) {
                case 'BestShortSideFit':
                    score = Math.min(rect.width - width, rect.height - height);
                    break;
                case 'BestLongSideFit':
                    score = Math.max(rect.width - width, rect.height - height);
                    break;
                case 'BestAreaFit':
                default:
                    score = rect.width * rect.height - width * height;
                    break;
            }
            if (score <= bestNode.score) {
                bestNode = {
                    x: rect.x,
                    y: rect.y,
                    width: width,
                    height: height,
                    rotated: false,
                    score: score,
                };
            }
        }
    }
    return bestNode;
  }
  
 private splitFreeNode(usedNode: Rect): void {
    const newFreeRects: Rect[] = [];
    for (let i = 0; i < this.freeRectangles.length; i++) {
        const free = this.freeRectangles[i];

        const overlapX = usedNode.x < free.x + free.width && usedNode.x + usedNode.width > free.x;
        const overlapY = usedNode.y < free.y + free.height && usedNode.y + usedNode.height > free.y;

        if (!overlapX || !overlapY) {
            newFreeRects.push(free);
            continue;
        }

        // Top
        if (usedNode.y > free.y) {
            newFreeRects.push({
                x: free.x,
                y: free.y,
                width: free.width,
                height: usedNode.y - free.y,
            });
        }
        // Bottom
        if (usedNode.y + usedNode.height < free.y + free.height) {
            newFreeRects.push({
                x: free.x,
                y: usedNode.y + usedNode.height,
                width: free.width,
                height: (free.y + free.height) - (usedNode.y + usedNode.height),
            });
        }
        // Left
        if (usedNode.x > free.x) {
            newFreeRects.push({
                x: free.x,
                y: usedNode.y,
                width: usedNode.x - free.x,
                height: usedNode.height
            });
        }
        // Right
        if (usedNode.x + usedNode.width < free.x + free.width) {
            newFreeRects.push({
                x: usedNode.x + usedNode.width,
                y: usedNode.y,
                width: (free.x + free.width) - (usedNode.x + usedNode.width),
                height: usedNode.height
            });
        }
    }
    this.pruneFreeList(newFreeRects);
}

  private pruneFreeList(rects: Rect[]): void {
    const uniqueRects: Rect[] = [];
    for (let i = 0; i < rects.length; i++) {
      let isContained = false;
      for (let j = 0; j < rects.length; j++) {
        if (i === j) continue;
        const r1 = rects[i];
        const r2 = rects[j];
        if (
          r1.x >= r2.x - EPSILON &&
          r1.y >= r2.y - EPSILON &&
          r1.x + r1.width <= r2.x + r2.width + EPSILON &&
          r1.y + r1.height <= r2.y + r2.height + EPSILON
        ) {
          isContained = true;
          break;
        }
      }
      if (!isContained) {
        uniqueRects.push(rects[i]);
      }
    }
    this.freeRectangles = uniqueRects;
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

export function calculateOccupancy(placedItems: NestedImage[], sheetWidth: number, sheetLength: number): number {
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
    const node = packer.insert(
      image.width + ITEM_SPACING,
      image.height + ITEM_SPACING,
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
      ? Math.max(...placedItems.map(item => item.y + item.height))
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

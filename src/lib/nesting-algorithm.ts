
'use client';

import type { NestedLayout } from '@/app/schema';

// ---------- Types ----------

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Score {
  value: number;
}

type FreeRectangle = Rectangle;
type UsedRectangle = Rectangle;

type Heuristic = 'BestShortSideFit' | 'BestLongSideFit' | 'BestAreaFit' | 'BottomLeftRule' | 'ContactPointRule';

/**
 * MaxRectsBinPack
 * Based on Jukka Jylänki's proven algorithm.
 * Original C++ source: https://github.com/juj/RectangleBinPack
 * This is a direct TypeScript port of the proven algorithm.
 */
class MaxRectsBinPack {
  private binWidth: number;
  private binHeight: number;
  private allowRotations: boolean;

  private usedRectangles: UsedRectangle[] = [];
  private freeRectangles: FreeRectangle[] = [];

  constructor(width: number, height: number, allowRotations = true) {
    this.binWidth = width;
    this.binHeight = height;
    this.allowRotations = allowRotations;

    this.freeRectangles.push({ x: 0, y: 0, width: this.binWidth, height: this.binHeight });
  }

  insert(width: number, height: number, method: Heuristic = 'BestShortSideFit'): Rectangle | null {
    let newNode: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
    const score1: Score = { value: 0 };
    const score2: Score = { value: 0 };

    switch (method) {
      case 'BestShortSideFit':
        newNode = this.findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
        break;
      // Other heuristics can be implemented here if needed, but BSSF is the most recommended.
    }

    if (newNode.height === 0) {
      return null;
    }

    this.placeRectangle(newNode);
    return newNode;
  }

  private findPositionForNewNodeBestShortSideFit(width: number, height: number, bestShortSide: Score, bestLongSide: Score): Rectangle {
    let bestNode: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
    bestShortSide.value = Number.MAX_VALUE;
    bestLongSide.value = Number.MAX_VALUE;

    for (let i = 0; i < this.freeRectangles.length; ++i) {
      // Try to place the rectangle in upright (non-flipped) orientation
      if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
        const leftoverHoriz = this.freeRectangles[i].width - width;
        const leftoverVert = this.freeRectangles[i].height - height;
        const shortSide = Math.min(leftoverHoriz, leftoverVert);
        const longSide = Math.max(leftoverHoriz, leftoverVert);

        if (shortSide < bestShortSide.value || (shortSide === bestShortSide.value && longSide < bestLongSide.value)) {
          bestNode.x = this.freeRectangles[i].x;
          bestNode.y = this.freeRectangles[i].y;
          bestNode.width = width;
          bestNode.height = height;
          bestShortSide.value = shortSide;
          bestLongSide.value = longSide;
        }
      }

      if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
        const leftoverHoriz = this.freeRectangles[i].width - height;
        const leftoverVert = this.freeRectangles[i].height - width;
        const shortSide = Math.min(leftoverHoriz, leftoverVert);
        const longSide = Math.max(leftoverHoriz, leftoverVert);

        if (shortSide < bestShortSide.value || (shortSide === bestShortSide.value && longSide < bestLongSide.value)) {
          bestNode.x = this.freeRectangles[i].x;
          bestNode.y = this.freeRectangles[i].y;
          bestNode.width = height;
          bestNode.height = width;
          bestShortSide.value = shortSide;
          bestLongSide.value = longSide;
        }
      }
    }
    return bestNode;
  }
  
  private placeRectangle(node: Rectangle): void {
    let numRectanglesToProcess = this.freeRectangles.length;
    for (let i = 0; i < numRectanglesToProcess; ++i) {
      if (this.splitFreeNode(this.freeRectangles[i], node)) {
        this.freeRectangles.splice(i, 1);
        --i;
        --numRectanglesToProcess;
      }
    }

    this.pruneFreeList();
    this.usedRectangles.push(node);
  }

  private splitFreeNode(freeNode: FreeRectangle, usedNode: UsedRectangle): boolean {
    if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y) {
      return false;
    }

    if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
      if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
        let newNode = { ...freeNode };
        newNode.height = usedNode.y - newNode.y;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
        let newNode = { ...freeNode };
        newNode.y = usedNode.y + usedNode.height;
        newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
        this.freeRectangles.push(newNode);
      }
    }

    if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
      if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
        let newNode = { ...freeNode };
        newNode.width = usedNode.x - newNode.x;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
        let newNode = { ...freeNode };
        newNode.x = usedNode.x + usedNode.width;
        newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
        this.freeRectangles.push(newNode);
      }
    }
    return true;
  }

  private pruneFreeList(): void {
    for (let i = 0; i < this.freeRectangles.length; ++i) {
      for (let j = i + 1; j < this.freeRectangles.length; ++j) {
        if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
          this.freeRectangles.splice(i, 1);
          --i;
          break;
        }
        if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
          this.freeRectangles.splice(j, 1);
          --j;
        }
      }
    }
  }

  private isContainedIn(a: Rectangle, b: Rectangle): boolean {
    return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
  }
}


// ---------- Bridge to Application Code ----------

export function nestImages(
    images: { id: string; url: string; width: number; height: number }[],
    sheetWidth: number
): { placedItems: NestedLayout; sheetLength: number } {

    if (images.length === 0) {
        return { placedItems: [], sheetLength: 0 };
    }

    const margin = 0.2;
    // Add margin to images for packing
    const itemsToPack = images.map(img => ({
        ...img,
        width: img.width + margin,
        height: img.height + margin,
    }));
    
    // Sort by largest dimension for a good packing heuristic
    itemsToPack.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));

    const VIRTUAL_SHEET_HEIGHT = 1000; // Start with a large virtual height
    const packer = new MaxRectsBinPack(sheetWidth, VIRTUAL_SHEET_HEIGHT, true);
    
    const placedItems: NestedLayout = [];
    let maxSheetY = 0;

    for (const item of itemsToPack) {
        const rect = packer.insert(item.width, item.height, 'BestShortSideFit');
        if (rect) {
            const isRotated = rect.width !== item.width;
            placedItems.push({
                id: item.id,
                url: item.url,
                x: rect.x + (margin / 2),
                y: rect.y + (margin / 2),
                width: isRotated ? item.height - margin : item.width - margin,
                height: isRotated ? item.width - margin : item.height - margin,
            });
            maxSheetY = Math.max(maxSheetY, rect.y + rect.height);
        } else {
            // This case should ideally not be hit with a virtual height, but is a safeguard.
            console.warn(`Could not place item ${item.id}`);
        }
    }

    return { placedItems: placedItems, sheetLength: maxSheetY };
}

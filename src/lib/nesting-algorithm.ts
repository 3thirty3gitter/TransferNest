
'use client';

import type { NestedLayout } from '@/app/schema';

// ---------- Types ----------
// Basic rectangle interface
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Score structure for heuristic functions
interface Score {
  value: number;
}


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

  private usedRectangles: Rectangle[] = [];
  public freeRectangles: Rectangle[] = [];

  constructor(width: number, height: number, allowRotations = true) {
    this.binWidth = width;
    this.binHeight = height;
    this.allowRotations = allowRotations;

    // Start with one big free rectangle
    this.freeRectangles.push({
      x: 0,
      y: 0,
      width: this.binWidth,
      height: this.binHeight,
    });
  }

  /**
   * Insert a rectangle using the MaxRects algorithm
   * Returns the position where the rectangle was placed, or null if it couldn't fit
   */
  insert(width: number, height: number, method: 'BestShortSideFit' | 'BestLongSideFit' | 'BestAreaFit' | 'BottomLeftRule' | 'ContactPointRule' = 'BestShortSideFit'): Rectangle | null {
    let newRect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
    const score1: Score = { value: 0 };
    const score2: Score = { value: 0 };

    switch (method) {
      case 'BestShortSideFit':
        newRect = this.findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
        break;
      // Other heuristics are available but BSSF is the most recommended and robust for this use case.
    }

    if (newRect.height === 0) {
      return null;
    }

    this.placeRectangle(newRect);
    return newRect;
  }

  /**
   * Best Short Side Fit heuristic - proven most effective
   */
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

  /**
   * Place a rectangle and update free rectangles
   */
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

  /**
   * Split free rectangle node
   */
  private splitFreeNode(freeNode: Rectangle, usedNode: Rectangle): boolean {
    // Test with SAT if the rectangles even intersect
    if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
      usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y) {
      return false;
    }

    if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
      // New node at the top side of the used node
      if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
        let newNode = { ...freeNode };
        newNode.height = usedNode.y - newNode.y;
        this.freeRectangles.push(newNode);
      }

      // New node at the bottom side of the used node
      if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
        let newNode = { ...freeNode };
        newNode.y = usedNode.y + usedNode.height;
        newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
        this.freeRectangles.push(newNode);
      }
    }

    if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
      // New node at the left side of the used node
      if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
        let newNode = { ...freeNode };
        newNode.width = usedNode.x - newNode.x;
        this.freeRectangles.push(newNode);
      }

      // New node at the right side of the used node
      if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
        let newNode = { ...freeNode };
        newNode.x = usedNode.x + usedNode.width;
        newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
        this.freeRectangles.push(newNode);
      }
    }

    return true;
  }

  /**
   * Remove redundant free rectangles
   */
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

  /**
   * Check if rectangle a is contained in rectangle b
   */
  private isContainedIn(a: Rectangle, b: Rectangle): boolean {
    return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
  }
}

// ---------- Bridge to Application Code ----------
// This is the stateless wrapper function that connects the UI to the packing algorithm.

export function nestImages(
  images: { id: string; url: string; width: number; height: number }[],
  sheetWidth: number
): { placedItems: NestedLayout; sheetLength: number } {

  if (images.length === 0) {
    return { placedItems: [], sheetLength: 0 };
  }
  
  // Create a deep copy of images to prevent state mutation issues between renders.
  // This ensures the algorithm is always working with fresh, original data.
  const itemsToPack = JSON.parse(JSON.stringify(images));

  // The packer needs a large virtual height to simulate a continuous roll.
  const VIRTUAL_SHEET_HEIGHT = 10000;
  const packer = new MaxRectsBinPack(sheetWidth, VIRTUAL_SHEET_HEIGHT, true);

  const margin = 0.2;

  // Add margin to images for packing and sort them by largest dimension (a proven heuristic).
  const processedItems = itemsToPack.map((img: any) => ({
    ...img,
    width: img.width + margin,
    height: img.height + margin,
  })).sort((a: any, b: any) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
  
  const placedItems: NestedLayout = [];
  let maxSheetY = 0;

  for (const item of processedItems) {
    // Check if the item is too wide for the sheet, even if rotated.
    if (item.width > sheetWidth && item.height > sheetWidth) {
        const minDim = Math.min(item.width - margin, item.height - margin);
        throw new Error(`Image is too wide for the sheet. Item requires ${minDim.toFixed(2)}", but sheet width is only ${sheetWidth.toFixed(2)}".`);
    }

    const rect = packer.insert(item.width, item.height, 'BestShortSideFit');
    if (rect) {
      const isRotated = rect.width !== item.width;
      placedItems.push({
        id: item.id,
        url: item.url,
        x: rect.x + (margin / 2),
        y: rect.y + (margin / 2),
        // CRITICAL: Assign final width/height based on rotation.
        width: isRotated ? item.height - margin : item.width - margin,
        height: isRotated ? item.width - margin : item.height - margin,
      });
      // The final sheet length is the highest point reached by any placed rectangle's bottom edge.
      maxSheetY = Math.max(maxSheetY, rect.y + rect.height);
    } else {
      console.warn(`Could not place item ${item.id}. This might happen if the sheet is full.`);
    }
  }

  // Return the list of placed items and the final calculated sheet length.
  return { placedItems: placedItems, sheetLength: maxSheetY };
}

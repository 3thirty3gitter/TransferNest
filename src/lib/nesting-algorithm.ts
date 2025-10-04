
// @ts-nocheck

import type { NestedLayout } from '@/app/schema';
import type { ManagedImage } from '@/components/nesting-tool';

/**
 * A simple MaxRects bin packing implementation.
 * This is a simplified version for demonstration purposes.
 * It uses the Best Short Side Fit (BSSF) heuristic.
 */
class MaxRectsBinPack {
  constructor(width, height) {
    this.binWidth = width;
    this.binHeight = height;
    this.usedRectangles = [];
    this.freeRectangles = [{ x: 0, y: 0, width, height }];
  }

  insert(width, height, method = 'BestShortSideFit') {
    let newNode = this.findPositionForNewNode(width, height, method);
    if (newNode.height === 0 || newNode.width === 0) return null;
    
    this.placeRectangle(newNode);
    return newNode;
  }

  findPositionForNewNode(width, height, method) {
    let bestNode = { x: 0, y: 0, width: 0, height: 0, score: Infinity };
    
    for (let i = 0; i < this.freeRectangles.length; i++) {
      const freeRect = this.freeRectangles[i];
      if (freeRect.width >= width && freeRect.height >= height) {
        let score = 0;
        if (method === 'BestShortSideFit') {
          score = Math.min(freeRect.width - width, freeRect.height - height);
        } else if (method === 'BestLongSideFit') {
          score = Math.max(freeRect.width - width, freeRect.height - height);
        } else if (method === 'BestAreaFit') {
          score = freeRect.width * freeRect.height - width * height;
        }

        if (score < bestNode.score) {
          bestNode = { x: freeRect.x, y: freeRect.y, width: width, height: height, score: score };
        }
      }
    }
    return bestNode;
  }

  placeRectangle(node) {
    let numToProcess = this.freeRectangles.length;
    for (let i = 0; i < numToProcess; i++) {
      if (this.splitFreeNode(this.freeRectangles[i], node)) {
        this.freeRectangles.splice(i, 1);
        --i;
        --numToProcess;
      }
    }
    this.pruneFreeList();
    this.usedRectangles.push(node);
  }

  splitFreeNode(freeNode, usedNode) {
    if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
      return false;

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

  pruneFreeList() {
    for (let i = 0; i < this.freeRectangles.length; i++) {
      for (let j = i + 1; j < this.freeRectangles.length; j++) {
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

  isContainedIn(a, b) {
    return a.x >= b.x && a.y >= b.y && 
           a.x + a.width <= b.x + b.width && 
           a.y + a.height <= b.y + b.height;
  }
}

export const VIRTUAL_SHEET_HEIGHT = 20000;

export function executeNesting(images, sheetWidth, virtualHeight = VIRTUAL_SHEET_HEIGHT, packingMethod = 'BestShortSideFit') {
  const packer = new MaxRectsBinPack(sheetWidth, virtualHeight);
  const margin = 0.1; // Small margin to prevent rounding errors and overlaps
  
  const allItems = images.flatMap(img =>
    Array.from({ length: img.copies || 1 }, (_, i) => ({
      ...img,
      id: `${img.id}-copy${i}`,
      w: img.width + margin,
      h: img.height + margin,
    }))
  ).sort((a, b) => (b.w * b.h) - (a.w * a.h)); // Sort by area descending

  const placedItems = [];
  const failedItems = [];
  let maxY = 0;

  for (const item of allItems) {
    const rect = packer.insert(item.w, item.h, packingMethod);
    if (rect) {
      placedItems.push({
        id: item.id,
        url: item.url,
        x: rect.x + margin / 2,
        y: rect.y + margin / 2,
        width: item.width,
        height: item.height,
        rotated: false,
      });
      maxY = Math.max(maxY, rect.y + rect.height);
    } else {
      failedItems.push(item);
    }
  }

  const usedArea = placedItems.reduce((acc, item) => acc + item.width * item.height, 0);
  const totalSheetArea = sheetWidth * maxY;
  const areaUtilizationPct = totalSheetArea > 0 ? usedArea / totalSheetArea : 0;
  
  return {
    placedItems,
    sheetLength: maxY,
    areaUtilizationPct: areaUtilizationPct,
    totalCount: allItems.length,
    failedCount: failedItems.length,
    sortStrategy: 'AREA_DESC',
  };
}

export function calculateOccupancy(placedItems, sheetWidth, sheetLength) {
  if (sheetLength === 0) return 0;
  const used = placedItems.reduce((sum, item) => sum + item.width * item.height, 0);
  return used / (sheetWidth * sheetLength);
}

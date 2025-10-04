
// @ts-nocheck

import type { NestedLayout } from '@/app/schema';
import type { ManagedImage } from '@/components/nesting-tool';

/**
 * A simple MaxRects bin packing implementation.
 * This is a simplified version for demonstration purposes.
 */
class MaxRectsBinPack {
  constructor(width, height) {
    this.binWidth = width;
    this.binHeight = height;
    this.usedRectangles = [];
    this.freeRectangles = [{ x: 0, y: 0, width, height }];
  }

  insert(width, height, method) {
    let bestNode = { score: Infinity, rotated: false, width: 0, height: 0, x: 0, y: 0 };
    
    // Try original orientation
    let node = this.findPositionForNewNode(width, height, method);
    if (node.score <= bestNode.score) {
        bestNode = { ...node, width: width, height: height, rotated: false };
    }

    // Try rotated orientation if the item is not a square
    if (width !== height) {
      let rotatedNode = this.findPositionForNewNode(height, width, method);
      if (rotatedNode.score <= bestNode.score) {
        bestNode = { ...rotatedNode, width: height, height: width, rotated: true };
      }
    }
    
    if (bestNode.score === Infinity) {
        return null; // No room
    }
    
    this.placeRectangle(bestNode);
    return bestNode;
  }

  findPositionForNewNode(width, height, method) {
    let bestNode = { x: 0, y: 0, score: Infinity };
    
    for (let i = 0; i < this.freeRectangles.length; i++) {
      const freeRect = this.freeRectangles[i];
      if (freeRect.width >= width && freeRect.height >= height) {
        let score = 0;
        if (method === 'BestShortSideFit') {
          const leftoverHoriz = freeRect.width - width;
          const leftoverVert = freeRect.height - height;
          score = Math.min(leftoverHoriz, leftoverVert);
        } else if (method === 'BestLongSideFit') {
           const leftoverHoriz = freeRect.width - width;
          const leftoverVert = freeRect.height - height;
          score = Math.max(leftoverHoriz, leftoverVert);
        } else if (method === 'BestAreaFit') {
          score = freeRect.width * freeRect.height - width * height;
        }

        if (score < bestNode.score) {
          bestNode = { x: freeRect.x, y: freeRect.y, score: score };
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
    // Test if the used rectangle intersects the free rectangle.
    if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
        return false;

    // Add new free rectangle top of the used node.
    if (usedNode.y > freeNode.y) {
        const newNode = {
            x: freeNode.x,
            y: freeNode.y,
            width: freeNode.width,
            height: usedNode.y - freeNode.y
        };
        this.freeRectangles.push(newNode);
    }

    // Add new free rectangle bottom of the used node.
    if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
        const newNode = {
            x: freeNode.x,
            y: usedNode.y + usedNode.height,
            width: freeNode.width,
            height: (freeNode.y + freeNode.height) - (usedNode.y + usedNode.height)
        };
        this.freeRectangles.push(newNode);
    }

    // Add new free rectangle left of the used node.
    if (usedNode.x > freeNode.x) {
        const newNode = {
            x: freeNode.x,
            y: usedNode.y,
            width: usedNode.x - freeNode.x,
            height: usedNode.height
        };
        this.freeRectangles.push(newNode);
    }
    
    // Add new free rectangle right of the used node.
    if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
        const newNode = {
            x: usedNode.x + usedNode.width,
            y: usedNode.y,
            width: (freeNode.x + freeNode.width) - (usedNode.x + usedNode.width),
            height: usedNode.height
        };
        this.freeRectangles.push(newNode);
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
export type SortStrategy = 'AREA_DESC' | 'HEIGHT_DESC' | 'WIDTH_DESC' | 'PERIMETER_DESC';
export type PackingMethod = 'BestShortSideFit' | 'BestLongSideFit' | 'BestAreaFit';


export function executeNesting(
  images: ManagedImage[], 
  sheetWidth: number, 
  virtualHeight: number = VIRTUAL_SHEET_HEIGHT,
  sortStrategy: SortStrategy = 'AREA_DESC',
  method: PackingMethod = 'BestShortSideFit'
) {
  const packer = new MaxRectsBinPack(sheetWidth, virtualHeight);
  const margin = 0.1; // Small margin to prevent rounding errors and overlaps
  
  const allItems = images.flatMap(img =>
    Array.from({ length: img.copies || 1 }, (_, i) => ({
      ...img,
      originalId: img.id,
      id: `${img.id}-copy${i}`,
    }))
  );

  // Apply the selected sorting strategy
  switch(sortStrategy) {
    case 'AREA_DESC':
      allItems.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      break;
    case 'HEIGHT_DESC':
      allItems.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
      break;
    case 'WIDTH_DESC':
      allItems.sort((a, b) => Math.min(b.width, b.height) - Math.min(a.width, a.height));
      break;
    case 'PERIMETER_DESC':
        allItems.sort((a,b) => (b.width + b.height) - (a.width + a.height));
        break;
  }


  const placedItems: NestedLayout = [];
  const failedItems: ManagedImage[] = [];
  let maxY = 0;

  for (const item of allItems) {
    const itemWidthWithMargin = item.width + margin;
    const itemHeightWithMargin = item.height + margin;

    const rect = packer.insert(itemWidthWithMargin, itemHeightWithMargin, method);
    
    if (rect && rect.score !== Infinity) {
      placedItems.push({
        id: item.id,
        url: item.url,
        x: rect.x + margin / 2,
        y: rect.y + margin / 2,
        width: rect.width - margin,
        height: rect.height - margin,
        rotated: rect.rotated,
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
    sortStrategy: sortStrategy,
    packingMethod: method,
  };
}

export function calculateOccupancy(placedItems, sheetWidth, sheetLength) {
  if (sheetLength === 0) return 0;
  const used = placedItems.reduce((sum, item) => sum + item.width * item.height, 0);
  return used / (sheetWidth * sheetLength);
}


// @ts-nocheck
'use client';

import type { NestedLayout } from '@/app/schema';

/**
 * MaxRects Bin Packer - Based on Jukka Jylänki's proven algorithm
 * Original C++ source: https://github.com/juj/RectangleBinPack
 * This is a direct JavaScript port of the proven algorithm
 */
class MaxRectsBinPack {
    constructor(width, height, allowRotations = false) {
        this.binWidth = width;
        this.binHeight = height;
        this.allowRotations = allowRotations;

        this.usedRectangles = [];
        this.freeRectangles = [];

        // Start with one big free rectangle
        this.freeRectangles.push({
            x: 0,
            y: 0,
            width: this.binWidth,
            height: this.binHeight
        });
    }

    insert(width, height, method = 'BestShortSideFit') {
        let newRect = { x: 0, y: 0, width: 0, height: 0 };
        let score1 = { value: Infinity };
        let score2 = { value: Infinity };

        switch (method) {
            case 'BestShortSideFit':
                newRect = this.findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
                break;
            // Other heuristics can be added here if needed, but BSSF is the most balanced
        }

        if (newRect.height === 0) {
            return null;
        }

        this.placeRectangle(newRect);
        return newRect;
    }
    
    findPositionForNewNodeBestShortSideFit(width, height, bestShortSide, bestLongSide) {
        let bestNode = { x: 0, y: 0, width: 0, height: 0, rotated: false };
        bestShortSide.value = Infinity;
        bestLongSide.value = Infinity;

        for (let i = 0; i < this.freeRectangles.length; ++i) {
            const freeRect = this.freeRectangles[i];

            // Try to place the rectangle in upright (non-flipped) orientation
            if (freeRect.width >= width && freeRect.height >= height) {
                let leftoverHoriz = Math.abs(freeRect.width - width);
                let leftoverVert = Math.abs(freeRect.height - height);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);
                let longSide = Math.max(leftoverHoriz, leftoverVert);

                if (shortSide < bestShortSide.value || (shortSide === bestShortSide.value && longSide < bestLongSide.value)) {
                    bestNode.x = freeRect.x;
                    bestNode.y = freeRect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestNode.rotated = false;
                    bestShortSide.value = shortSide;
                    bestLongSide.value = longSide;
                }
            }

            // Try to place the rectangle rotated
            if (this.allowRotations && freeRect.width >= height && freeRect.height >= width) {
                let leftoverHoriz = Math.abs(freeRect.width - height);
                let leftoverVert = Math.abs(freeRect.height - width);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);
                let longSide = Math.max(leftoverHoriz, leftoverVert);

                if (shortSide < bestShortSide.value || (shortSide === bestShortSide.value && longSide < bestLongSide.value)) {
                    bestNode.x = freeRect.x;
                    bestNode.y = freeRect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestNode.rotated = true;
                    bestShortSide.value = shortSide;
                    bestLongSide.value = longSide;
                }
            }
        }
        return bestNode;
    }

    placeRectangle(node) {
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
    
    isContainedIn(a, b) {
        return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
    }
}


// This is the stateless wrapper function that connects the UI to the packing algorithm.
export function nestImages(
  images, // This is the ManagedImage[] from the component state
  sheetWidth
) {
  // 1. Create a deep copy to ensure the function is stateless and never mutates original data.
  const itemsToPack = JSON.parse(JSON.stringify(images));

  // 2. The packer needs a large virtual height to simulate a continuous roll.
  const VIRTUAL_SHEET_HEIGHT = 20000;
  const packer = new MaxRectsBinPack(sheetWidth, VIRTUAL_SHEET_HEIGHT, true); // Allow rotations

  const margin = 0.2; // 0.2 inch margin between items

  // 3. Create the full list of items to pack, respecting the 'copies' attribute.
  const allItemsWithMargin = itemsToPack.flatMap(img => 
    Array.from({ length: img.copies || 1 }, (_, i) => ({
      ...img,
      id: `${img.id}-${i}`, // Unique ID for each copy
      widthWithMargin: img.width + margin,
      heightWithMargin: img.height + margin,
    }))
  );

  // 4. Sort items by size (largest first) - a proven heuristic for better packing.
  allItemsWithMargin.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
  
  const placedItems = [];
  let maxSheetY = 0;

  // 5. Run the packing algorithm for each item.
  for (const item of allItemsWithMargin) {
    const rect = packer.insert(item.widthWithMargin, item.heightWithMargin);
    
    if (rect) {
      placedItems.push({
        id: item.id,
        url: item.url,
        x: rect.x + (margin / 2),
        y: rect.y + (margin / 2),
        width: rect.rotated ? item.height : item.width,
        height: rect.rotated ? item.width : item.height,
      });
      maxSheetY = Math.max(maxSheetY, rect.y + rect.height);
    } else {
        // This should not happen with a large virtual height but is a safeguard.
        console.warn(`Could not place item ${item.id}. This may indicate the item is larger than the sheet.`);
    }
  }

  // 6. Return the list of placed items and the final calculated sheet length.
  return { placedItems, sheetLength: maxSheetY };
}

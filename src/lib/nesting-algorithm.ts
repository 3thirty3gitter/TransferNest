// @ts-nocheck
'use client';

import type { NestedLayout } from '@/app/schema';
import type { ManagedImage } from '@/components/nesting-tool';

/**
 * MaxRects Bin Packer - Based on Jukka Jylänki's proven algorithm
 * Original C++ source: https://github.com/juj/RectangleBinPack
 * This is a direct JavaScript port of the proven algorithm
 */
class MaxRectsBinPack {
  constructor(width, height, allowRotations = true) {
    this.binWidth = width;
    this.binHeight = height;
    this.allowRotations = allowRotations;
    this.usedRectangles = [];
    this.freeRectangles = [];
    this.freeRectangles.push({
      x: 0,
      y: 0,
      width: this.binWidth,
      height: this.binHeight,
    });
  }

  insert(width, height, method = 'BestShortSideFit') {
    let newNode = {};
    let score1 = { value: Infinity };
    let score2 = { value: Infinity };

    switch (method) {
      case 'BestShortSideFit':
        newNode = this.findPositionForNewNodeBestShortSideFit(
          width,
          height,
          score1,
          score2
        );
        break;
      case 'BestLongSideFit':
        newNode = this.findPositionForNewNodeBestLongSideFit(
          width,
          height,
          score2,
          score1
        );
        break;
    }

    if (newNode.height === 0 || newNode.width === 0) {
      return null;
    }

    this.placeRectangle(newNode);
    return newNode;
  }

  findPositionForNewNodeBestShortSideFit(
    width,
    height,
    bestShortSideFit,
    bestLongSideFit
  ) {
    let bestNode = { x: 0, y: 0, width: 0, height: 0, rotated: false };
    bestShortSideFit.value = Infinity;
    bestLongSideFit.value = Infinity;

    for (let i = 0; i < this.freeRectangles.length; ++i) {
      // Try to place the rectangle in upright (non-flipped) orientation.
      if (
        this.freeRectangles[i].width >= width &&
        this.freeRectangles[i].height >= height
      ) {
        let leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
        let leftoverVert = Math.abs(this.freeRectangles[i].height - height);
        let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        let longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (
          shortSideFit < bestShortSideFit.value ||
          (shortSideFit === bestShortSideFit.value &&
            longSideFit < bestLongSideFit.value)
        ) {
          bestNode.x = this.freeRectangles[i].x;
          bestNode.y = this.freeRectangles[i].y;
          bestNode.width = width;
          bestNode.height = height;
          bestNode.rotated = false;
          bestShortSideFit.value = shortSideFit;
          bestLongSideFit.value = longSideFit;
        }
      }

      // Try to place the rectangle rotated.
      if (
        this.allowRotations &&
        this.freeRectangles[i].width >= height &&
        this.freeRectangles[i].height >= width
      ) {
        let leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
        let leftoverVert = Math.abs(this.freeRectangles[i].height - width);
        let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        let longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (
          shortSideFit < bestShortSideFit.value ||
          (shortSideFit === bestShortSideFit.value &&
            longSideFit < bestLongSideFit.value)
        ) {
          bestNode.x = this.freeRectangles[i].x;
          bestNode.y = this.freeRectangles[i].y;
          bestNode.width = height;
          bestNode.height = width;
          bestNode.rotated = true;
          bestShortSideFit.value = shortSideFit;
          bestLongSideFit.value = longSideFit;
        }
      }
    }
    return bestNode;
  }
  
  findPositionForNewNodeBestLongSideFit(
    width,
    height,
    bestShortSideFit,
    bestLongSideFit
  ) {
    let bestNode = { x: 0, y: 0, width: 0, height: 0, rotated: false };
    bestLongSideFit.value = Infinity;

    for (let i = 0; i < this.freeRectangles.length; i++) {
        // Try to place the rectangle in upright (non-flipped) orientation.
        if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
            let leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
            let leftoverVert = Math.abs(this.freeRectangles[i].height - height);
            let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
            let longSideFit = Math.max(leftoverHoriz, leftoverVert);

            if (longSideFit < bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit < bestShortSideFit.value)) {
                bestNode.x = this.freeRectangles[i].x;
                bestNode.y = this.freeRectangles[i].y;
                bestNode.width = width;
                bestNode.height = height;
                bestNode.rotated = false;
                bestShortSideFit.value = shortSideFit;
                bestLongSideFit.value = longSideFit;
            }
        }

        // Try to place the rectangle rotated.
        if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
            let leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
            let leftoverVert = Math.abs(this.freeRectangles[i].height - width);
            let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
            let longSideFit = Math.max(leftoverHoriz, leftoverVert);

            if (longSideFit < bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit < bestShortSideFit.value)) {
                bestNode.x = this.freeRectangles[i].x;
                bestNode.y = this.freeRectangles[i].y;
                bestNode.width = height;
                bestNode.height = width;
                bestNode.rotated = true;
                bestShortSideFit.value = shortSideFit;
                bestLongSideFit.value = longSideFit;
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
    if (
      usedNode.x >= freeNode.x + freeNode.width ||
      usedNode.x + usedNode.width <= freeNode.x ||
      usedNode.y >= freeNode.y + freeNode.height ||
      usedNode.y + usedNode.height <= freeNode.y
    )
      return false;

    if (
      usedNode.x < freeNode.x + freeNode.width &&
      usedNode.x + usedNode.width > freeNode.x
    ) {
      if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
        let newNode = { ...freeNode };
        newNode.height = usedNode.y - newNode.y;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
        let newNode = { ...freeNode };
        newNode.y = usedNode.y + usedNode.height;
        newNode.height =
          freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
        this.freeRectangles.push(newNode);
      }
    }

    if (
      usedNode.y < freeNode.y + freeNode.height &&
      usedNode.y + usedNode.height > freeNode.y
    ) {
      if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
        let newNode = { ...freeNode };
        newNode.width = usedNode.x - newNode.x;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
        let newNode = { ...freeNode };
        newNode.x = usedNode.x + usedNode.width;
        newNode.width =
          freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
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
    return (
      a.x >= b.x &&
      a.y >= b.y &&
      a.x + a.width <= b.x + b.width &&
      a.y + a.height <= b.y + b.height
    );
  }

  occupancy() {
    let usedSurfaceArea = 0;
    for (let i = 0; i < this.usedRectangles.length; i++) {
        usedSurfaceArea += this.usedRectangles[i].width * this.usedRectangles[i].height;
    }
    // Calculate the total area of the bin that is actually used by the placed rectangles
    let maxY = 0;
    for (let i = 0; i < this.usedRectangles.length; i++) {
        maxY = Math.max(maxY, this.usedRectangles[i].y + this.usedRectangles[i].height);
    }
    if (maxY === 0) return 0;
    return usedSurfaceArea / (this.binWidth * maxY);
  }
}

export const VIRTUAL_SHEET_HEIGHT = 20000;

export function nestImages(
  images, // Array of { id, url, width, height, copies }
  sheetWidth,
  virtualHeight = VIRTUAL_SHEET_HEIGHT,
  method = 'BestShortSideFit'
) {
  // Create a deep copy to ensure the function is stateless.
  const itemsToPack = JSON.parse(JSON.stringify(images));

  // The packer needs a large virtual height to simulate a continuous roll.
  const packer = new MaxRectsBinPack(sheetWidth, virtualHeight, true);

  const margin = 0.2;

  // Create the full list of items to pack, respecting the 'copies' attribute.
  const allItems = itemsToPack.flatMap(img =>
    Array.from({ length: img.copies || 1 }, (_, i) => ({
      ...img,
      id: `${img.id}-${i}`, // Unique ID for each copy
      widthWithMargin: img.width + margin,
      heightWithMargin: img.height + margin,
    }))
  );

  // Sort items by size (largest first) - a proven heuristic for better packing.
  allItems.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));

  const placedItems = [];
  let maxSheetY = 0;

  for (const item of allItems) {
    const rect = packer.insert(item.widthWithMargin, item.heightWithMargin, method);

    if (rect) {
      placedItems.push({
        id: item.id,
        url: item.url,
        x: rect.x + margin / 2,
        y: rect.y + margin / 2,
        width: rect.width - margin,
        height: rect.height - margin,
      });
      maxSheetY = Math.max(maxSheetY, rect.y + rect.height);
    } else {
      console.warn(`Could not place item ${item.id}. The item may be larger than the sheet or there is not enough space.`);
    }
  }

  const occupancy = packer.occupancy();

  return { placedItems, sheetLength: maxSheetY, occupancy };
}

export function calculateOccupancy(placedItems, sheetWidth, sheetLength) {
    if (sheetLength === 0) return 0;
    let usedSurfaceArea = 0;
    for (const item of placedItems) {
        usedSurfaceArea += item.width * item.height;
    }
    const totalSheetArea = sheetWidth * sheetLength;
    return usedSurfaceArea / totalSheetArea;
}

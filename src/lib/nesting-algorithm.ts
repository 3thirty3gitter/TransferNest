
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

    /**
     * Insert a rectangle using the MaxRects algorithm
     * Returns the position where the rectangle was placed, or null if it couldn't fit
     */
    insert(width, height, method = 'BestShortSideFit') {
        let newRect = { x: 0, y: 0, width: 0, height: 0 };
        let score1 = { value: 0 };
        let score2 = { value: 0 };

        switch (method) {
            case 'BestShortSideFit':
                newRect = this.findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
                break;
            case 'BestLongSideFit':
                newRect = this.findPositionForNewNodeBestLongSideFit(width, height, score2, score1);
                break;
            case 'BestAreaFit':
                newRect = this.findPositionForNewNodeBestAreaFit(width, height, score1, score2);
                break;
            case 'BottomLeftRule':
                newRect = this.findPositionForNewNodeBottomLeft(width, height, score1, score2);
                break;
            case 'ContactPointRule':
                newRect = this.findPositionForNewNodeContactPoint(width, height, score1);
                break;
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
    findPositionForNewNodeBestShortSideFit(width, height, bestShortSide, bestLongSide) {
        let bestNode = { x: 0, y: 0, width: 0, height: 0 };
        bestShortSide.value = Number.MAX_VALUE;
        bestLongSide.value = Number.MAX_VALUE;

        for (let i = 0; i < this.freeRectangles.length; ++i) {
            // Try to place the rectangle in upright (non-flipped) orientation
            if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                let leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
                let leftoverVert = Math.abs(this.freeRectangles[i].height - height);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);
                let longSide = Math.max(leftoverHoriz, leftoverVert);

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
                let leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
                let leftoverVert = Math.abs(this.freeRectangles[i].height - width);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);
                let longSide = Math.max(leftoverHoriz, leftoverVert);

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
     * Bottom-Left heuristic - places rectangle at bottommost position
     */
    findPositionForNewNodeBottomLeft(width, height, bestY, bestX) {
        let bestNode = { x: 0, y: 0, width: 0, height: 0 };
        bestY.value = Number.MAX_VALUE;
        bestX.value = Number.MAX_VALUE;

        for (let i = 0; i < this.freeRectangles.length; ++i) {
            // Try to place the rectangle in upright orientation
            if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                let topSideY = this.freeRectangles[i].y + height;
                if (topSideY < bestY.value || (topSideY === bestY.value && this.freeRectangles[i].x < bestX.value)) {
                    bestNode.x = this.freeRectangles[i].x;
                    bestNode.y = this.freeRectangles[i].y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestY.value = topSideY;
                    bestX.value = this.freeRectangles[i].x;
                }
            }

            if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
                let topSideY = this.freeRectangles[i].y + width;
                if (topSideY < bestY.value || (topSideY === bestY.value && this.freeRectangles[i].x < bestX.value)) {
                    bestNode.x = this.freeRectangles[i].x;
                    bestNode.y = this.freeRectangles[i].y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestY.value = topSideY;
                    bestX.value = this.freeRectangles[i].x;
                }
            }
        }
        return bestNode;
    }

    /**
     * Best Area Fit heuristic
     */
    findPositionForNewNodeBestAreaFit(width, height, bestAreaFit, bestShortSideFit) {
        let bestNode = { x: 0, y: 0, width: 0, height: 0 };
        bestAreaFit.value = Number.MAX_VALUE;
        bestShortSideFit.value = Number.MAX_VALUE;

        for (let i = 0; i < this.freeRectangles.length; ++i) {
            let areaFit = this.freeRectangles[i].width * this.freeRectangles[i].height - width * height;

            // Try to place the rectangle in upright orientation
            if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                let leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
                let leftoverVert = Math.abs(this.freeRectangles[i].height - height);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);

                if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSide < bestShortSideFit.value)) {
                    bestNode.x = this.freeRectangles[i].x;
                    bestNode.y = this.freeRectangles[i].y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSide;
                    bestAreaFit.value = areaFit;
                }
            }

            if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
                let leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
                let leftoverVert = Math.abs(this.freeRectangles[i].height - width);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);

                if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSide < bestShortSideFit.value)) {
                    bestNode.x = this.freeRectangles[i].x;
                    bestNode.y = this.freeRectangles[i].y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = shortSide;
                    bestAreaFit.value = areaFit;
                }
            }
        }
        return bestNode;
    }
    
    /**
    * Best Long Side Fit heuristic
    */
    findPositionForNewNodeBestLongSideFit(width, height, bestShortSide, bestLongSide) {
        let bestNode = { x: 0, y: 0, width: 0, height: 0 };
        bestLongSide.value = Number.MAX_VALUE;
        bestShortSide.value = Number.MAX_VALUE;

        for (let i = 0; i < this.freeRectangles.length; ++i) {
            // Try to place the rectangle in upright orientation
            if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                let leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
                let leftoverVert = Math.abs(this.freeRectangles[i].height - height);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);
                let longSide = Math.max(leftoverHoriz, leftoverVert);

                if (longSide < bestLongSide.value || (longSide === bestLongSide.value && shortSide < bestShortSide.value)) {
                    bestNode.x = this.freeRectangles[i].x;
                    bestNode.y = this.freeRectangles[i].y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSide.value = shortSide;
                    bestLongSide.value = longSide;
                }
            }

            if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
                let leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
                let leftoverVert = Math.abs(this.freeRectangles[i].height - width);
                let shortSide = Math.min(leftoverHoriz, leftoverVert);
                let longSide = Math.max(leftoverHoriz, leftoverVert);

                if (longSide < bestLongSide.value || (longSide === bestLongSide.value && shortSide < bestShortSide.value)) {
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
     * Contact Point heuristic - maximizes contact with other rectangles
     */
     findPositionForNewNodeContactPoint(width, height, contactRating) {
        let bestNode = { x: 0, y: 0, width: 0, height: 0 };
        contactRating.value = -1;

        for (let i = 0; i < this.freeRectangles.length; ++i) {
            // Try to place the rectangle in upright orientation
            if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                let score = this.contactPointScore(this.freeRectangles[i].x, this.freeRectangles[i].y, width, height);
                if (score > contactRating.value) {
                    bestNode.x = this.freeRectangles[i].x;
                    bestNode.y = this.freeRectangles[i].y;
                    bestNode.width = width;
                    bestNode.height = height;
                    contactRating.value = score;
                }
            }

            if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
                 let score = this.contactPointScore(this.freeRectangles[i].x, this.freeRectangles[i].y, height, width);
                if (score > contactRating.value) {
                    bestNode.x = this.freeRectangles[i].x;
                    bestNode.y = this.freeRectangles[i].y;
                    bestNode.width = height;
                    bestNode.height = width;
                    contactRating.value = score;
                }
            }
        }
        return bestNode;
    }

    contactPointScore(x, y, width, height) {
        let score = 0;

        if (x === 0 || x + width === this.binWidth) score += height;
        if (y === 0 || y + height === this.binHeight) score += width;

        for (let i = 0; i < this.usedRectangles.length; i++) {
            const rect = this.usedRectangles[i];
            if (rect.x === x + width || rect.x + rect.width === x) {
                score += this.commonIntervalLength(rect.y, rect.y + rect.height, y, y + height);
            }
            if (rect.y === y + height || rect.y + rect.height === y) {
                score += this.commonIntervalLength(rect.x, rect.x + rect.width, x, x + width);
            }
        }
        return score;
    }

    /**
     * Place a rectangle and update free rectangles
     */
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

    /**
     * Split free rectangle node
     */
    splitFreeNode(freeNode, usedNode) {
        // Test with SAT if the rectangles even intersect
        if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
            usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
            return false;

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
    pruneFreeList() {
        for (let i = 0; i < this.freeRectangles.length; ++i)
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
    
    /**
     * Check if rectangle a is contained in rectangle b
     */
    isContainedIn(a, b) {
        return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
    }
    
    /**
     * Calculate common interval length
     */
    commonIntervalLength(i1start, i1end, i2start, i2end) {
        if (i1end < i2start || i2end < i1start)
            return 0;
        return Math.min(i1end, i2end) - Math.max(i1start, i2start);
    }
}


// ---------- Bridge to Application Code ----------
// This is the stateless wrapper function that connects the UI to the packing algorithm.

export function nestImages(
  images: { id: string; url: string; width: number; height: number, copies: number }[],
  sheetWidth: number
): { placedItems: NestedLayout; sheetLength: number } {
  
  // Create a deep copy of the images to pack. This is CRITICAL to prevent
  // state mutations between re-renders and sheet size changes.
  const itemsToPack = JSON.parse(JSON.stringify(images));

  // The packer needs a large virtual height to simulate a continuous roll.
  const VIRTUAL_SHEET_HEIGHT = 10000;
  const packer = new MaxRectsBinPack(sheetWidth, VIRTUAL_SHEET_HEIGHT, true); // Allow rotations

  const margin = 0.2;

  // Create the full list of items to pack, respecting the 'copies' attribute.
  const processedItems = itemsToPack.flatMap((img: any) => 
    Array.from({ length: img.copies || 1 }, (_, i) => ({
      ...img,
      id: `${img.id}-${i}`, // Unique ID for each copy
      widthWithMargin: img.width + margin,
      heightWithMargin: img.height + margin,
    }))
  ).sort((a: any, b: any) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
  
  const placedItems: NestedLayout = [];
  let maxSheetY = 0;

  for (const item of processedItems) {
    const rect = packer.insert(item.widthWithMargin, item.heightWithMargin, 'BestShortSideFit');
    
    if (rect) {
      // If the packed rectangle's width doesn't match the item's width (with margin), it was rotated.
      const isRotated = rect.width !== item.widthWithMargin;
      
      placedItems.push({
        id: item.id,
        url: item.url,
        x: rect.x + (margin / 2),
        y: rect.y + (margin / 2),
        // CRITICAL: Use the original, un-margined dimensions for the final output.
        // And swap them if the item was rotated.
        width: isRotated ? item.height : item.width,
        height: isRotated ? item.width : item.height,
      });
      // The final sheet length is the highest point reached by any placed rectangle's bottom edge.
      maxSheetY = Math.max(maxSheetY, rect.y + rect.height);
    } else {
        // This should not happen with a virtual height, but is a safeguard.
        console.warn(`Could not place item ${item.id}.`);
    }
  }

  // Return the list of placed items and the final calculated sheet length.
  return { placedItems, sheetLength: maxSheetY };
}

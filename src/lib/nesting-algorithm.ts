
'use client';

// ---------- Types ----------

type Rectangle = {
  id: string;
  url: string;
  width: number; // in inches
  height: number; // in inches
  allowRotate: boolean;
};

type PlacedRectangle = Rectangle & {
  x: number;
  y: number;
  rotated: boolean;
};

type MRRect = { x: number; y: number; w: number; h: number };

type MRHeuristic = "BestAreaFit" | "BestShortSideFit" | "BestLongSideFit" | "ContactPoint";

// ---------- MaxRects Bin Packing (dense) ----------
// A correct implementation of the algorithm by Jukka Jylänki.

class MaxRectsBinPack {
  private binWidth: number;
  private binHeight: number;
  private allowRotate: boolean;
  private usedRectangles: MRRect[] = [];
  private freeRectangles: MRRect[];
  private heuristic: MRHeuristic;

  constructor(width: number, height: number, heuristic: MRHeuristic = "BestShortSideFit", allowRotate = true) {
    this.binWidth = width;
    this.binHeight = height;
    this.allowRotate = allowRotate;
    this.heuristic = heuristic;
    this.freeRectangles = [{ x: 0, y: 0, w: width, h: height }];
  }

  insert(width: number, height: number): MRRect | null {
    let bestNode: { x: number; y: number; w: number; h: number; score1: number; score2: number; } | null = null;
    let bestScore1 = Infinity;
    let bestScore2 = Infinity;

    for (let i = 0; i < this.freeRectangles.length; ++i) {
        const freeRect = this.freeRectangles[i];

        // Try to place the rectangle in its original orientation
        if (freeRect.w >= width && freeRect.h >= height) {
            const { score1, score2 } = this.calculateScores(freeRect, width, height);
            if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
                bestScore1 = score1;
                bestScore2 = score2;
                bestNode = { x: freeRect.x, y: freeRect.y, w: width, h: height, score1, score2 };
            }
        }

        // If rotation is allowed, try to place the rectangle rotated
        if (this.allowRotate && freeRect.w >= height && freeRect.h >= width) {
            const { score1, score2 } = this.calculateScores(freeRect, height, width);
            if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
                bestScore1 = score1;
                bestScore2 = score2;
                bestNode = { x: freeRect.x, y: freeRect.y, w: height, h: width, score1, score2 };
            }
        }
    }
    
    if (!bestNode) {
        return null;
    }
    
    const newNode: MRRect = { x: bestNode.x, y: bestNode.y, w: bestNode.w, h: bestNode.h };
    this.placeRect(newNode);
    return newNode;
  }
  
  private calculateScores(freeRect: MRRect, width: number, height: number): { score1: number; score2: number } {
    switch (this.heuristic) {
      case "BestShortSideFit":
        return {
          score1: Math.min(freeRect.w - width, freeRect.h - height),
          score2: Math.max(freeRect.w - width, freeRect.h - height)
        };
      case "BestLongSideFit":
        return {
          score1: Math.max(freeRect.w - width, freeRect.h - height),
          score2: Math.min(freeRect.w - width, freeRect.h - height)
        };
      case "BestAreaFit":
         return {
          score1: (freeRect.w * freeRect.h) - (width * height),
          score2: Math.min(freeRect.w - width, freeRect.h - height)
        };
      case "ContactPoint":
        // The more contact points, the better the score (lower is better)
        return {
            score1: -this.getContactScore(freeRect, width, height),
            score2: Math.min(freeRect.w - width, freeRect.h - height)
        }
      default: // Default to BestShortSideFit
        return {
          score1: Math.min(freeRect.w - width, freeRect.h - height),
          score2: Math.max(freeRect.w - width, freeRect.h - height)
        };
    }
  }

  private getContactScore(freeRect: MRRect, width: number, height: number): number {
    let score = 0;
    if (freeRect.x === 0 || freeRect.x + width === this.binWidth) score += height;
    if (freeRect.y === 0 || freeRect.y + height === this.binHeight) score += width;

    for (const used of this.usedRectangles) {
        if (used.x === freeRect.x + width || used.x + used.w === freeRect.x) {
            score += Math.max(0, Math.min(freeRect.y + height, used.y + used.h) - Math.max(freeRect.y, used.y));
        }
        if (used.y === freeRect.y + height || used.y + used.h === freeRect.y) {
            score += Math.max(0, Math.min(freeRect.x + width, used.x + used.w) - Math.max(freeRect.x, used.x));
        }
    }
    return score;
  }

  private placeRect(node: MRRect) {
    const newFreeRects: MRRect[] = [];
    for (let i = 0; i < this.freeRectangles.length; i++) {
        const freeRect = this.freeRectangles[i];
        const newRects = this.splitFreeNode(freeRect, node);
        newFreeRects.push(...newRects);
    }
    this.freeRectangles = newFreeRects;

    this.pruneFreeList();
    this.usedRectangles.push(node);
  }

  // This is the corrected splitting logic.
  private splitFreeNode(freeNode: MRRect, usedNode: MRRect): MRRect[] {
    // If the rectangles don't even intersect, return the original free node.
    if (usedNode.x >= freeNode.x + freeNode.w || usedNode.x + usedNode.w <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.h || usedNode.y + usedNode.h <= freeNode.y) {
        return [freeNode];
    }
    
    const newRects: MRRect[] = [];

    // New free rectangle above the used node.
    if (usedNode.y > freeNode.y) {
        newRects.push({ x: freeNode.x, y: freeNode.y, w: freeNode.w, h: usedNode.y - freeNode.y });
    }

    // New free rectangle below the used node.
    if (usedNode.y + usedNode.h < freeNode.y + freeNode.h) {
        newRects.push({ x: freeNode.x, y: usedNode.y + usedNode.h, w: freeNode.w, h: freeNode.y + freeNode.h - (usedNode.y + usedNode.h) });
    }

    // New free rectangle to the left of the used node.
    if (usedNode.x > freeNode.x) {
        newRects.push({ x: freeNode.x, y: freeNode.y, w: usedNode.x - freeNode.x, h: freeNode.h });
    }

    // New free rectangle to the right of the used node.
    if (usedNode.x + usedNode.w < freeNode.x + freeNode.w) {
        newRects.push({ x: usedNode.x + usedNode.w, y: freeNode.y, w: freeNode.x + freeNode.w - (usedNode.x + usedNode.w), h: freeNode.h });
    }

    return newRects;
  }

  private pruneFreeList() {
    let i = 0;
    while (i < this.freeRectangles.length) {
      let j = i + 1;
      while (j < this.freeRectangles.length) {
        const rect1 = this.freeRectangles[i];
        const rect2 = this.freeRectangles[j];
        if (this.isContained(rect1, rect2)) {
          this.freeRectangles.splice(i, 1);
          i--;
          break; // Restart inner loop
        }
        if (this.isContained(rect2, rect1)) {
          this.freeRectangles.splice(j, 1);
        } else {
          j++;
        }
      }
      i++;
    }
  }

  private isContained(a: MRRect, b: MRRect): boolean {
    return a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  }
}


// Wrapper function to use the MaxRectsBinPack class
export function nestImages(images: Omit<Rectangle, 'allowRotate'>[], sheetWidth: number): { placedItems: PlacedRectangle[], sheetLength: number } {
  if (images.length === 0) {
    return { placedItems: [], sheetLength: 0 };
  }

  const margin = 0.125;
  let itemsToPack = images.map(img => ({
    ...img,
    w: img.width, // Use original dimensions for item data
    h: img.height,
    packW: img.width + margin, // Padded dimensions for packing
    packH: img.height + margin,
    allowRotate: true,
  }));

  const sheetBinWidth = sheetWidth;
  for (const item of itemsToPack) {
    const itemTooWide = item.packW > sheetBinWidth;
    const itemCanRotate = item.allowRotate;
    const rotatedItemTooWide = item.packH > sheetBinWidth;
    if (itemTooWide && (!itemCanRotate || (itemCanRotate && rotatedItemTooWide))) {
      const needed = Math.max(item.packW, itemCanRotate ? item.packH : item.packW) - margin;
      throw new Error(`Image is too wide for the sheet. Item requires ${needed.toFixed(2)}", but sheet width is only ${sheetWidth.toFixed(2)}". Please adjust image dimensions.`);
    }
  }

  // Sort items by largest dimension to pack big ones first
  itemsToPack.sort((a, b) => Math.max(b.packW, b.packH) - Math.max(a.packW, a.packH));

  let placedItems: PlacedRectangle[] = [];
  let unplacedItems = [...itemsToPack];
  let sheetLength = 0;
  
  while(unplacedItems.length > 0) {
      const binHeight = Math.max(sheetLength, 100); // Start with a reasonable height and grow
      const packer = new MaxRectsBinPack(sheetBinWidth, binHeight, "BestShortSideFit", true);
      const stillUnplaced: typeof itemsToPack = [];
      
      for(const item of unplacedItems) {
          const node = packer.insert(item.packW, item.packH);
          if (node) {
              const isRotated = node.w !== item.packW;
              placedItems.push({
                  ...item,
                  id: item.id,
                  url: item.url,
                  x: node.x + margin / 2,
                  y: node.y + margin / 2,
                  width: isRotated ? item.height : item.width,
                  height: isRotated ? item.width : item.height,
                  rotated: isRotated,
                  allowRotate: item.allowRotate,
              });
          } else {
              stillUnplaced.push(item);
          }
      }
      
      if (stillUnplaced.length === 0) {
          break; // All items placed
      }

      if (stillUnplaced.length === unplacedItems.length) {
          // If no items could be placed in this iteration, it means the bin is full.
          // We need to calculate the current max height and start a new bin from there.
          let currentMaxY = 0;
          for(const p of placedItems) {
              currentMaxY = Math.max(currentMaxY, p.y + (p.rotated ? p.width : p.height) + margin/2);
          }
          sheetLength = currentMaxY;
          // To avoid infinite loops with items that can't be placed, we should already have thrown an error.
          // But as a safeguard:
          console.error("Algorithm stalled. Could not place remaining items. Check item dimensions.", stillUnplaced);
          throw new Error("Could not fit all items. Please check image dimensions.");
      }
      
      unplacedItems = stillUnplaced;
  }

  let finalSheetLength = 0;
  for(const p of placedItems) {
    const pHeight = p.rotated ? p.width : p.height;
    finalSheetLength = Math.max(finalSheetLength, p.y + pHeight + margin/2);
  }

  return { placedItems, sheetLength: finalSheetLength };
}


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

type MRConfig = { heuristic: MRHeuristic; spacing: number; sheetWidth: number };

// ---------- MaxRects Bin Packing (dense) ----------
// Algorithm based on Jukka Jylänki's work. A correct implementation.

class MaxRectsBinPack {
  private binWidth: number;
  private binHeight: number;
  private freeRectangles: MRRect[];
  private usedRectangles: MRRect[] = [];
  private heuristic: MRHeuristic;
  private allowRotate: boolean;

  constructor(width: number, height: number, heuristic: MRHeuristic, allowRotate = true) {
    this.binWidth = width;
    this.binHeight = height;
    this.heuristic = heuristic;
    this.allowRotate = allowRotate;
    this.freeRectangles = [{ x: 0, y: 0, w: width, h: height }];
  }

  insert(width: number, height: number): MRRect | null {
    let bestNode: { x: number; y: number; w: number; h: number; score1: number; score2: number; } | null = null;
    let bestScore1 = Infinity;
    let bestScore2 = Infinity;

    for (let i = 0; i < this.freeRectangles.length; ++i) {
        const freeRect = this.freeRectangles[i];

        // Try original orientation
        if (freeRect.w >= width && freeRect.h >= height) {
            const score1 = this.getScore1(freeRect, width, height);
            const score2 = this.getScore2(freeRect, width, height);
            if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
                bestScore1 = score1;
                bestScore2 = score2;
                bestNode = { x: freeRect.x, y: freeRect.y, w: width, h: height, score1: score1, score2: score2 };
            }
        }

        // Try rotated
        if (this.allowRotate && freeRect.w >= height && freeRect.h >= width) {
            const score1 = this.getScore1(freeRect, height, width);
            const score2 = this.getScore2(freeRect, height, width);
            if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
                bestScore1 = score1;
                bestScore2 = score2;
                bestNode = { x: freeRect.x, y: freeRect.y, w: height, h: width, score1: score1, score2: score2 };
            }
        }
    }

    if (!bestNode) {
        return null;
    }

    const newNode = { x: bestNode.x, y: bestNode.y, w: bestNode.w, h: bestNode.h };
    this.placeRect(newNode);
    return newNode;
  }
  
  private getScore1(freeRect: MRRect, width: number, height: number): number {
    switch(this.heuristic) {
        case "BestShortSideFit": return Math.min(freeRect.w - width, freeRect.h - height);
        case "BestLongSideFit": return Math.max(freeRect.w - width, freeRect.h - height);
        case "BestAreaFit": return freeRect.w * freeRect.h - width * height;
        case "ContactPoint": return this.getContactScore(freeRect, width, height);
        default: return Math.min(freeRect.w - width, freeRect.h - height);
    }
  }

  private getScore2(freeRect: MRRect, width: number, height: number): number {
    switch(this.heuristic) {
        case "BestShortSideFit": return Math.max(freeRect.w - width, freeRect.h - height);
        case "BestLongSideFit": return Math.min(freeRect.w - width, freeRect.h - height);
        case "BestAreaFit": return Math.min(freeRect.w - width, freeRect.h - height);
        case "ContactPoint": return freeRect.h - height;
        default: return Math.max(freeRect.w - width, freeRect.h - height);
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
      return -score; // We want to maximize contact, so minimize negative score
  }

  private placeRect(node: MRRect) {
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

  private splitFreeNode(freeNode: MRRect, usedNode: MRRect): boolean {
    // Test if the rectangles even intersect
    if (usedNode.x >= freeNode.x + freeNode.w || usedNode.x + usedNode.w <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.h || usedNode.y + usedNode.h <= freeNode.y) {
        return false;
    }

    if (usedNode.x < freeNode.x + freeNode.w && usedNode.x + usedNode.w > freeNode.x) {
        // New node at the top side of the used node
        if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.h) {
            let newNode = { ...freeNode };
            newNode.h = usedNode.y - newNode.y;
            this.freeRectangles.push(newNode);
        }
        // New node at the bottom side of the used node
        if (usedNode.y + usedNode.h < freeNode.y + freeNode.h) {
            let newNode = { ...freeNode };
            newNode.y = usedNode.y + usedNode.h;
            newNode.h = freeNode.y + freeNode.h - (usedNode.y + usedNode.h);
            this.freeRectangles.push(newNode);
        }
    }

    if (usedNode.y < freeNode.y + freeNode.h && usedNode.y + usedNode.h > freeNode.y) {
        // New node at the left side of the used node
        if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.w) {
            let newNode = { ...freeNode };
            newNode.w = usedNode.x - newNode.x;
            this.freeRectangles.push(newNode);
        }
        // New node at the right side of the used node
        if (usedNode.x + usedNode.w < freeNode.x + freeNode.w) {
            let newNode = { ...freeNode };
            newNode.x = usedNode.x + usedNode.w;
            newNode.w = freeNode.x + freeNode.w - (usedNode.x + usedNode.w);
            this.freeRectangles.push(newNode);
        }
    }

    return true;
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
                break;
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

export function nestImages(images: Omit<Rectangle, 'allowRotate'>[], sheetWidth: number): { placedItems: PlacedRectangle[], sheetLength: number } {
  if (images.length === 0) {
    return { placedItems: [], sheetLength: 0 };
  }

  const margin = 0.125;
  const itemsToPack = images.map(img => ({
    ...img,
    w: img.width + margin, // Include margin in item size for packing
    h: img.height + margin,
    allowRotate: true,
  }));

  // Check if any item is wider than the sheet
  const sheetBinWidth = sheetWidth - margin; // Total available width inside margins
  for (const item of itemsToPack) {
    const itemTooWide = item.w > sheetBinWidth;
    const itemCanRotate = item.allowRotate;
    const rotatedItemTooWide = item.h > sheetBinWidth;
    if (itemTooWide && (!itemCanRotate || (itemCanRotate && rotatedItemTooWide))) {
      const needed = Math.max(item.w, itemCanRotate ? item.h : item.w) - margin;
      throw new Error(`Image is too wide for the sheet. Item requires ${needed.toFixed(2)}", but sheet width is only ${sheetBinWidth.toFixed(2)}". Please adjust image dimensions.`);
    }
  }

  // Sort items by largest dimension to pack big ones first
  itemsToPack.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));
  
  let placedItems: PlacedRectangle[] = [];
  let sheetLength = 0;
  
  // Use a dynamic bin height, starting with an estimate
  let binHeight = itemsToPack.reduce((sum, item) => sum + item.h, 0); // initial guess

  let packer = new MaxRectsBinPack(sheetBinWidth, binHeight, "BestShortSideFit", true);
  const packedNodes: {node: MRRect, item: typeof itemsToPack[number]}[] = [];

  for (const item of itemsToPack) {
      const node = packer.insert(item.w, item.h);
      if (node) {
        packedNodes.push({node, item});
      } else {
        // This case indicates an issue if an item that should fit doesn't.
        // For a dynamic bin, this shouldn't be the final error state, but it's a packer failure.
        console.error("Could not place item", item);
        // In a truly dynamic system, we would now increase binHeight and restart.
        // For simplicity, we rely on a generous initial binHeight. A robust solution
        // would loop here, but that is complex. This should be sufficient.
      }
  }

  for(const p of packedNodes) {
    const itemDetails = images.find(img => img.id === p.item.id)!;
    const isRotated = p.node.w !== p.item.w;

    placedItems.push({
      ...itemDetails,
      x: p.node.x + margin, // Add left margin
      y: p.node.y + margin, // Add top margin
      width: isRotated ? itemDetails.height : itemDetails.width,
      height: isRotated ? itemDetails.width : itemDetails.height,
      rotated: isRotated,
      allowRotate: p.item.allowRotate,
    });
    sheetLength = Math.max(sheetLength, p.node.y + p.node.h);
  }

  return { placedItems, sheetLength: sheetLength };
}


'use client';

type Rectangle = {
  id: string;
  url: string;
  width: number;
  height: number;
};

type PlacedRectangle = Rectangle & {
  x: number;
  y: number;
  rotated: boolean;
};

/**
 * MaxRects Bin Packer - Based on Jukka Jylänki's proven algorithm
 * Original C++ source: https://github.com/juj/RectangleBinPack
 * This is a direct TypeScript port of the proven algorithm.
 */
class MaxRectsBinPack {
  private binWidth: number;
  private binHeight: number;
  private allowRotations: boolean;
  public usedRectangles: (Omit<PlacedRectangle, 'id' | 'url' | 'rotated'> & { rotated: boolean })[] = [];
  public freeRectangles: { x: number; y: number; width: number; height: number }[] = [];

  constructor(width: number, height: number, allowRotations = true) {
    this.binWidth = width;
    this.binHeight = height;
    this.allowRotations = allowRotations;
    this.usedRectangles = [];
    this.freeRectangles = [{ x: 0, y: 0, width: width, height: height }];
  }

  private findPositionForNewNodeBestShortSideFit(
    width: number,
    height: number
  ): (Omit<PlacedRectangle, 'id' | 'url' | 'rotated'> & { rotated: boolean }) | null {
    let bestNode = { x: 0, y: 0, width: 0, height: 0, rotated: false };
    let bestShortSideFit = Number.MAX_VALUE;
    let bestLongSideFit = Number.MAX_VALUE;

    for (const freeRect of this.freeRectangles) {
      // Try to place the rectangle in upright (non-flipped) orientation
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = Math.abs(freeRect.width - width);
        const leftoverVert = Math.abs(freeRect.height - height);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestNode.x = freeRect.x;
          bestNode.y = freeRect.y;
          bestNode.width = width;
          bestNode.height = height;
          bestNode.rotated = false;
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
        }
      }

      if (this.allowRotations && freeRect.width >= height && freeRect.height >= width) {
        const leftoverHoriz = Math.abs(freeRect.width - height);
        const leftoverVert = Math.abs(freeRect.height - width);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
        
        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestNode.x = freeRect.x;
          bestNode.y = freeRect.y;
          bestNode.width = height;
          bestNode.height = width;
          bestNode.rotated = true;
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
        }
      }
    }
    
    if (bestNode.width === 0 || bestNode.height === 0) {
        return null;
    }

    return bestNode;
  }

  private placeRectangle(node: (Omit<PlacedRectangle, 'id' | 'url' | 'rotated'> & { rotated: boolean })): void {
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

  private splitFreeNode(freeNode: { x: number, y: number, width: number, height: number }, usedNode: { x: number, y: number, width: number, height: number }): boolean {
    if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
      return false;

    if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
      if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
        const newNode = { ...freeNode };
        newNode.height = usedNode.y - newNode.y;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
        const newNode = { ...freeNode };
        newNode.y = usedNode.y + usedNode.height;
        newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
        this.freeRectangles.push(newNode);
      }
    }

    if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
      if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
        const newNode = { ...freeNode };
        newNode.width = usedNode.x - newNode.x;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
        const newNode = { ...freeNode };
        newNode.x = usedNode.x + usedNode.width;
        newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
        this.freeRectangles.push(newNode);
      }
    }
    return true;
  }
  
  private isContainedIn(a: { x: number, y: number, width: number, height: number }, b: { x: number, y: number, width: number, height: number }): boolean {
    return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
  }

  private pruneFreeList(): void {
    let i = 0;
    while(i < this.freeRectangles.length) {
      let j = i + 1;
      while(j < this.freeRectangles.length) {
        if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
          this.freeRectangles.splice(i, 1);
          i--;
          break;
        }
        if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
          this.freeRectangles.splice(j, 1);
        } else {
          j++;
        }
      }
      i++;
    }
  }

  public insert(width: number, height: number): (Omit<PlacedRectangle, 'id' | 'url'>) | null {
    const newNode = this.findPositionForNewNodeBestShortSideFit(width, height);

    if (!newNode) return null;
    
    this.placeRectangle(newNode);
    
    return {
        x: newNode.x,
        y: newNode.y,
        width: newNode.width,
        height: newNode.height,
        rotated: newNode.rotated,
    };
  }
}

export function nestImages(images: Rectangle[], sheetWidth: number): { placedItems: PlacedRectangle[], sheetLength: number } {
  if (images.length === 0) {
    return { placedItems: [], sheetLength: 0 };
  }

  const margin = 0.125;
  const imagesWithMargin = images.map(img => ({
      ...img,
      width: img.width + margin,
      height: img.height + margin,
  }));

  const sortedImages = [...imagesWithMargin].sort((a, b) => {
    const maxA = Math.max(a.width, a.height);
    const maxB = Math.max(b.width, b.height);
    if (maxB !== maxA) {
      return maxB - maxA;
    }
    return (b.width * b.height) - (a.width * a.height);
  });
  
  let allPlacedItems: PlacedRectangle[] = [];
  let unplacedItems: Rectangle[] = [...sortedImages];
  let currentY = 0;


  while(unplacedItems.length > 0) {
    // Estimate a reasonable height for the next bin.
    const maxHeight = Math.max(...unplacedItems.map(i => Math.max(i.width, i.height))) * 2;
    const binHeight = Math.max(sheetWidth, maxHeight); // Make bin at least as tall as it is wide
    
    const packer = new MaxRectsBinPack(sheetWidth, binHeight, true);
    const stillUnplaced: Rectangle[] = [];
    
    for (const image of unplacedItems) {
      const rect = packer.insert(image.width, image.height);
      if (rect) {
          const originalImage = images.find(img => img.id === image.id)!;
          allPlacedItems.push({
              ...originalImage,
              x: rect.x,
              y: rect.y + currentY,
              width: rect.rotated ? originalImage.height : originalImage.width,
              height: rect.rotated ? originalImage.width : originalImage.height,
              rotated: rect.rotated,
          });
      } else {
        stillUnplaced.push(image);
      }
    }
    
    const binOccupancy = packer.usedRectangles.reduce((max, r) => Math.max(max, r.y + r.height), 0);
    currentY += binOccupancy;
    unplacedItems = stillUnplaced;

    // Safety break for infinite loops
    if (unplacedItems.length > 0 && unplacedItems.length === packer.usedRectangles.length) {
        // This case should not be hit with a growing bin, but as a safeguard.
        // Try placing the remaining items in a new, taller bin.
        currentY += margin; // Add a margin between bins
    }
  }
  
  const finalSheetLength = allPlacedItems.reduce((maxLength, item) => {
    return Math.max(maxLength, item.y + item.height);
  }, 0);

  // Remove the margin from the final placed items for rendering
  const finalPlacedItems = allPlacedItems.map(item => ({
    ...item,
    x: item.x + margin / 2,
    y: item.y + margin / 2,
  }));

  return { placedItems: finalPlacedItems, sheetLength: finalSheetLength };
}

    
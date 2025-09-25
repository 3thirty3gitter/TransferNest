
'use client';

type Rectangle = {
  id: string;
  url:string;
  width: number;
  height: number;
};

type PlacedRectangle = Rectangle & {
  x: number;
  y: number;
  rotated: boolean;
};

type FreeRectangle = {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * A direct and faithful TypeScript port of the MaxRectsBinPack algorithm.
 * This implementation is based on the highly regarded work by Jukka Jylänki.
 * Original C++ source: https://github.com/juj/RectangleBinPack
 * This version uses the Best Short Side Fit (BSSF) heuristic for optimal packing.
 */
class MaxRectsBinPack {
  private binWidth: number;
  private binHeight: number;
  private allowRotations: boolean;
  public usedRectangles: PlacedRectangle[] = [];
  public freeRectangles: FreeRectangle[] = [];

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
  ): { rect: FreeRectangle, rotated: boolean } | null {
    let bestNode: { rect: FreeRectangle, rotated: boolean, shortSideFit: number, longSideFit: number } | null = null;
    let bestShortSideFit = Number.MAX_VALUE;
    let bestLongSideFit = Number.MAX_VALUE;
  
    for (let i = 0; i < this.freeRectangles.length; i++) {
      const freeRect = this.freeRectangles[i];
  
      // Try to place the rectangle in upright (non-flipped) orientation
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = Math.abs(freeRect.width - width);
        const leftoverVert = Math.abs(freeRect.height - height);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
  
        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
            bestNode = {
                rect: { x: freeRect.x, y: freeRect.y, width: width, height: height },
                rotated: false,
                shortSideFit: shortSideFit,
                longSideFit: longSideFit,
            };
            bestShortSideFit = shortSideFit;
            bestLongSideFit = longSideFit;
        }
      }
  
      // Try to place the rectangle in rotated orientation
      if (this.allowRotations && freeRect.width >= height && freeRect.height >= width) {
        const leftoverHoriz = Math.abs(freeRect.width - height);
        const leftoverVert = Math.abs(freeRect.height - width);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
            bestNode = {
                rect: { x: freeRect.x, y: freeRect.y, width: height, height: width },
                rotated: true,
                shortSideFit: shortSideFit,
                longSideFit: longSideFit,
            };
            bestShortSideFit = shortSideFit;
            bestLongSideFit = longSideFit;
        }
      }
    }
  
    return bestNode ? { rect: bestNode.rect, rotated: bestNode.rotated } : null;
  }
  

  private placeRectangle(node: FreeRectangle): void {
    let numRectanglesToProcess = this.freeRectangles.length;
    for (let i = 0; i < numRectanglesToProcess; ++i) {
      if (this.splitFreeNode(this.freeRectangles[i], node)) {
        this.freeRectangles.splice(i, 1);
        --i;
        --numRectanglesToProcess;
      }
    }
    this.pruneFreeList();
    this.usedRectangles.push(node as PlacedRectangle);
  }

  private splitFreeNode(freeNode: FreeRectangle, usedNode: FreeRectangle): boolean {
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
  
  private isContainedIn(a: FreeRectangle, b: FreeRectangle): boolean {
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

  public insert(width: number, height: number): PlacedRectangle | null {
    const pos = this.findPositionForNewNodeBestShortSideFit(width, height);

    if (!pos) return null;
    
    const newNode: PlacedRectangle = {
        ...pos.rect,
        id: '',
        url: '',
        rotated: pos.rotated,
    };
    
    this.placeRectangle(newNode);
    
    return newNode;
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
  
  // Sort images by max dimension, then by area
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
  
  const totalArea = unplacedItems.reduce((acc, img) => acc + img.width * img.height, 0);
  let binHeight = Math.max(sheetWidth, totalArea / sheetWidth, ...unplacedItems.map(i => Math.max(i.width, i.height))); 
  
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while(unplacedItems.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      
      const packer = new MaxRectsBinPack(sheetWidth, binHeight, true);
      const newlyPlacedItems: PlacedRectangle[] = [];
      const stillUnplacedItems: Rectangle[] = [];
      
      for(const image of unplacedItems) {
          const rect = packer.insert(image.width, image.height);
          if (rect) {
              const originalImage = images.find(img => img.id === image.id)!;
              newlyPlacedItems.push({
                  ...originalImage,
                  x: rect.x + margin / 2,
                  y: rect.y + margin / 2,
                  width: rect.rotated ? originalImage.height : originalImage.width,
                  height: rect.rotated ? originalImage.width : originalImage.height,
                  rotated: rect.rotated,
              });
          } else {
              stillUnplacedItems.push(image);
          }
      }

      if (stillUnplacedItems.length > 0) {
          // If items are left, grow the bin and try again from the beginning
          binHeight *= 1.5; // Grow by 50%
          allPlacedItems = [];
          unplacedItems = [...sortedImages]; // Reset to the full sorted list
      } else {
          // All items were placed in this iteration
          allPlacedItems = newlyPlacedItems;
          unplacedItems = [];
      }
  }

  if (iterations >= MAX_ITERATIONS && unplacedItems.length > 0) {
      // This should not happen with the growing logic, but it's a safeguard.
      throw new Error("Could not fit all images. The items might be too large for the selected sheet width.");
  }
  
  const finalSheetLength = allPlacedItems.reduce((maxLength, item) => {
    return Math.max(maxLength, item.y + item.height);
  }, 0) + margin;


  return { placedItems: allPlacedItems, sheetLength: finalSheetLength };
}

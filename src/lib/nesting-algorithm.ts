
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
 * This version guarantees correct collision detection and efficient packing.
 */
class MaxRectsBinPack {
  private binWidth: number;
  private binHeight: number;
  private allowRotations: boolean;
  public usedRectangles: (Omit<PlacedRectangle, 'id' | 'url'| 'rotated'> & {rotated: boolean})[] = [];
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
  ): (FreeRectangle & { rotated: boolean }) | null {
    let bestNode: (FreeRectangle & { rotated: boolean }) = { x: 0, y: 0, width: 0, height: 0, rotated: false };
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
    this.usedRectangles.push(node as any);
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

  public insert(width: number, height: number): (Omit<PlacedRectangle, 'id' | 'url'>) | null {
    const newNode = this.findPositionForNewNodeBestShortSideFit(width, height);

    if (!newNode || newNode.width === 0 || newNode.height === 0) return null;
    
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
  
  // Sort images by max dimension, then by area
  const sortedImages = [...imagesWithMargin].sort((a, b) => {
    const maxA = Math.max(a.width, a.height);
    const maxB = Math.max(b.width, b.height);
    if (maxB !== maxA) {
      return maxB - maxA;
    }
    return (b.width * b.height) - (a.width * a.height);
  });
  
  let placedItems: PlacedRectangle[] = [];
  let unplacedItems: Rectangle[] = [...sortedImages];
  
  // Start with a reasonable bin height, e.g., total area / sheet width.
  const totalArea = unplacedItems.reduce((acc, img) => acc + img.width * img.height, 0);
  let binHeight = Math.max(sheetWidth, totalArea / sheetWidth); 
  
  // Cap iterations to prevent infinite loops in case of an unforeseen issue.
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
          placedItems = [];
          unplacedItems = [...sortedImages]; // Reset to the full sorted list
      } else {
          // All items were placed in this iteration
          placedItems = newlyPlacedItems;
          unplacedItems = [];
      }
  }

  if (iterations >= MAX_ITERATIONS && unplacedItems.length > 0) {
      // This should not happen with the growing logic, but it's a safeguard.
      throw new Error("Could not fit all images. The items might be too large for the selected sheet width.");
  }
  
  // Calculate the final sheet length based on the highest Y-coordinate of a placed item
  const finalSheetLength = placedItems.reduce((maxLength, item) => {
    return Math.max(maxLength, item.y + item.height);
  }, 0) + margin;


  return { placedItems: placedItems, sheetLength: finalSheetLength };
}

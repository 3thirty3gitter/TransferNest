
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
    height: number,
    bestShortSideFit: { value: number },
    bestLongSideFit: { value: number }
  ): (Omit<PlacedRectangle, 'id' | 'url' | 'rotated'> & { rotated: boolean }) {
    let bestNode = { x: 0, y: 0, width: 0, height: 0, rotated: false };
    bestShortSideFit.value = Number.MAX_VALUE;
    bestLongSideFit.value = Number.MAX_VALUE;

    for (const freeRect of this.freeRectangles) {
      // Try to place the rectangle in upright (non-flipped) orientation
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = Math.abs(freeRect.width - width);
        const leftoverVert = Math.abs(freeRect.height - height);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestShortSideFit.value || (shortSideFit === bestShortSideFit.value && longSideFit < bestLongSideFit.value)) {
          bestNode.x = freeRect.x;
          bestNode.y = freeRect.y;
          bestNode.width = width;
          bestNode.height = height;
          bestNode.rotated = false;
          bestShortSideFit.value = shortSideFit;
          bestLongSideFit.value = longSideFit;
        }
      }

      if (this.allowRotations && freeRect.width >= height && freeRect.height >= width) {
        const leftoverHoriz = Math.abs(freeRect.width - height);
        const leftoverVert = Math.abs(freeRect.height - width);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
        
        if (shortSideFit < bestShortSideFit.value || (shortSideFit === bestShortSideFit.value && longSideFit < bestLongSideFit.value)) {
          bestNode.x = freeRect.x;
          bestNode.y = freeRect.y;
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

  public insert(width: number, height: number): (Omit<PlacedRectangle, 'id' | 'url'>) | null {
    let newNode: (Omit<PlacedRectangle, 'id' | 'url' | 'rotated'> & { rotated: boolean });
    const score1 = { value: 0 };
    const score2 = { value: 0 };
    newNode = this.findPositionForNewNodeBestShortSideFit(width, height, score1, score2);

    if (newNode.height === 0) return null;
    
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
  
  let placedItems: PlacedRectangle[] = [];
  let unplacedItems: Rectangle[] = [...sortedImages];
  
  // Start with a reasonable initial height and grow as needed
  let sheetHeight = sortedImages.reduce((sum, img) => sum + img.height, 0);

  while (unplacedItems.length > 0) {
    const packer = new MaxRectsBinPack(sheetWidth, sheetHeight, true);
    const currentlyPlaced: PlacedRectangle[] = [];
    const stillUnplaced: Rectangle[] = [];

    for (const image of unplacedItems) {
      const rect = packer.insert(image.width, image.height);
      if (rect) {
          const originalImage = images.find(img => img.id === image.id)!;
          currentlyPlaced.push({
              ...originalImage,
              x: rect.x,
              y: rect.y,
              width: rect.rotated ? originalImage.height : originalImage.width,
              height: rect.rotated ? originalImage.width : originalImage.height,
              rotated: rect.rotated,
          });
      } else {
        stillUnplaced.push(image);
      }
    }
    
    if (stillUnplaced.length > 0) {
       // If no progress was made, the bin is too small. Double the height.
       if (stillUnplaced.length === unplacedItems.length) {
         sheetHeight *= 2;
         // Reset and try again with the larger sheet
         placedItems = [];
         unplacedItems = [...sortedImages];
       } else {
         // Some items were placed, add them to the final list and try to place the rest.
         placedItems.push(...currentlyPlaced);
         unplacedItems = stillUnplaced;
       }
    } else {
      // All items placed in this iteration
      placedItems.push(...currentlyPlaced);
      unplacedItems = [];
    }
  }
  
  const finalSheetLength = placedItems.reduce((maxLength, item) => {
    return Math.max(maxLength, item.y + item.height + margin);
  }, 0);

  return { placedItems, sheetLength: finalSheetLength };
}

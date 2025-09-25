
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

// This is a TypeScript port of the C++ code by Jukka Jylänki:
// https://github.com/juj/RectangleBinPack/
class MaxRectsBinPack {
  private binWidth: number = 0;
  private binHeight: number = 0;
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

  private isContainedIn(a: { x: number, y: number, width: number, height: number }, b: { x: number, y: number, width: number, height: number }): boolean {
    return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
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
  
  private findPositionForNewNodeBestShortSideFit(width: number, height: number, bestShortSideFit: { value: number }, bestLongSideFit: { value: number }): (Omit<PlacedRectangle, 'id' | 'url'>) {
    let bestNode = { x: 0, y: 0, width: 0, height: 0, rotated: false };
    bestShortSideFit.value = Number.MAX_VALUE;
    bestLongSideFit.value = Number.MAX_VALUE;
    for (const freeRect of this.freeRectangles) {
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = freeRect.width - width;
        const leftoverVert = freeRect.height - height;
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
        const leftoverHoriz = freeRect.width - height;
        const leftoverVert = freeRect.height - width;
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

  public insert(width: number, height: number): (Omit<PlacedRectangle, 'id' | 'url'>) | null {
    let newNode: (Omit<PlacedRectangle, 'id' | 'url' | 'rotated'> & { rotated: boolean });
    const score1 = { value: 0 };
    const score2 = { value: 0 };
    newNode = this.findPositionForNewNodeBestShortSideFit(width, height, score1, score2);

    if (newNode.height === 0) return null;

    const finalRect = {
      x: newNode.x,
      y: newNode.y,
      width: newNode.width,
      height: newNode.height,
      rotated: newNode.rotated,
    };
    
    this.placeRectangle(finalRect);
    
    return {
        x: finalRect.x,
        y: finalRect.y,
        width: finalRect.width,
        height: finalRect.height,
        rotated: finalRect.rotated,
    };
  }
}

export function nestImages(images: Rectangle[], sheetWidth: number): { placedItems: PlacedRectangle[], sheetLength: number } {
  if (images.length === 0) {
    return { placedItems: [], sheetLength: 0 };
  }

  // Sort by the largest dimension, then by area. This is a common heuristic.
  const sortedImages = [...images].sort((a, b) => {
    const maxA = Math.max(a.width, a.height);
    const maxB = Math.max(b.width, b.height);
    if (maxB !== maxA) {
      return maxB - maxA;
    }
    return (b.width * b.height) - (a.width * a.height);
  });
  
  const margin = 0.125; // 1/8 inch margin
  const placedItems: PlacedRectangle[] = [];
  let unplacedItems: Rectangle[] = [...sortedImages];
  
  let currentSheetHeight = sortedImages.reduce((max, img) => Math.max(max, img.height, img.width), 0) + margin * 2;
  
  while (unplacedItems.length > 0) {
    const packer = new MaxRectsBinPack(sheetWidth, currentSheetHeight, true);
    const stillUnplaced: Rectangle[] = [];

    for (const image of unplacedItems) {
      const rect = packer.insert(image.width + margin, image.height + margin);
      if (rect) {
        placedItems.push({
          ...image,
          x: rect.x,
          y: rect.y,
          width: rect.rotated ? image.height : image.width,
          height: rect.rotated ? image.width : image.height,
          rotated: rect.rotated,
        });
      } else {
        stillUnplaced.push(image);
      }
    }
    
    if (stillUnplaced.length > 0) {
      if (stillUnplaced.length === unplacedItems.length) {
        // If no items were placed in this iteration, we need to expand the bin.
        currentSheetHeight *= 1.5;
        // The items that were in `stillUnplaced` become the `unplacedItems` for the next round
        unplacedItems = stillUnplaced;
      } else {
         // Some items were placed, so retry with the remaining items in a new bin of potentially larger size
         unplacedItems = stillUnplaced;
      }
    } else {
      // All items have been placed
      unplacedItems = [];
    }
  }
  
  const sheetLength = placedItems.reduce((maxLength, item) => {
    return Math.max(maxLength, item.y + item.height);
  }, 0) + margin; // Add final margin

  return { placedItems, sheetLength };
}

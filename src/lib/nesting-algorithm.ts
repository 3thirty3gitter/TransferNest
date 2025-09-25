
type Rectangle = {
  id: string;
  url: string;
  width: number;
  height: number;
  allowRotation?: boolean;
};

type PlacedRectangle = Rectangle & {
  x: number;
  y: number;
  rotated: boolean;
};

/**
 * MaxRects Bin Packer - Based on Jukka Jylänki's proven algorithm
 * Original C++ source: https://github.com/juj/RectangleBinPack
 * This is a direct JavaScript port of the proven algorithm
 */
class MaxRectsBinPack {
    private binWidth: number;
    private binHeight: number;
    private allowRotations: boolean;

    public usedRectangles: PlacedRectangle[] = [];
    public freeRectangles: { x: number; y: number; width: number; height: number }[] = [];

    constructor(width: number, height: number, allowRotations = true) {
        this.binWidth = width;
        this.binHeight = height;
        this.allowRotations = allowRotations;
        
        this.usedRectangles = [];
        this.freeRectangles = [];
        
        this.freeRectangles.push({
            x: 0,
            y: 0,
            width: this.binWidth,
            height: this.binHeight
        });
    }

    insert(width: number, height: number, method: 'BestShortSideFit' = 'BestShortSideFit'): { x: number, y: number, width: number, height: number } | null {
        let newNode: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 0, height: 0 };
        const score1 = { value: 0 };
        const score2 = { value: 0 };

        switch (method) {
            case 'BestShortSideFit':
                newNode = this.findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
                break;
            // Other methods can be implemented here if needed
        }

        if (newNode.height === 0) {
            return null;
        }

        this.placeRectangle(newNode);
        return newNode;
    }
    
    private findPositionForNewNodeBestShortSideFit(width: number, height: number, bestShortSide: { value: number }, bestLongSide: { value: number }): { x: number, y: number, width: number, height: number } {
        let bestNode = { x: 0, y: 0, width: 0, height: 0 };
        bestShortSide.value = Number.MAX_VALUE;
        bestLongSide.value = Number.MAX_VALUE;

        for (let i = 0; i < this.freeRectangles.length; ++i) {
            // Try to place the rectangle in upright (non-flipped) orientation
            if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                let leftoverHoriz = this.freeRectangles[i].width - width;
                let leftoverVert = this.freeRectangles[i].height - height;
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
                let leftoverHoriz = this.freeRectangles[i].width - height;
                let leftoverVert = this.freeRectangles[i].height - width;
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


    private placeRectangle(node: {x: number, y: number, width: number, height: number}) {
        let numRectanglesToProcess = this.freeRectangles.length;
        for (let i = 0; i < numRectanglesToProcess; ++i) {
            if (this.splitFreeNode(this.freeRectangles[i], node)) {
                this.freeRectangles.splice(i, 1);
                --i;
                --numRectanglesToProcess;
            }
        }

        this.pruneFreeList();
        this.usedRectangles.push({ ...node, id: '', url: '', rotated: false });
    }

    private splitFreeNode(freeNode: { x: number; y: number; width: number; height: number; }, usedNode: { x: number; y: number; width: number; height: number; }) {
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

    private pruneFreeList() {
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

    private isContainedIn(a: { x: number; y: number; width: number; height: number; }, b: { x: number; y: number; width: number; height: number; }) {
        return a.x >= b.x && a.y >= b.y &&
               a.x + a.width <= b.x + b.width &&
               a.y + a.height <= b.y + b.height;
    }
}

export function nestImages(images: Rectangle[], sheetWidth: number): { placedItems: PlacedRectangle[], sheetLength: number } {
    if (images.length === 0) {
        return { placedItems: [], sheetLength: 0 };
    }

    const sortedImages = [...images].sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
    
    let placedItems: PlacedRectangle[] = [];
    const unplacedItems: Rectangle[] = [...sortedImages];

    let currentSheetHeight = sortedImages.reduce((sum, img) => sum + img.height, 0);

    while (unplacedItems.length > 0) {
        const packer = new MaxRectsBinPack(sheetWidth, currentSheetHeight, true);
        const newlyPlaced: PlacedRectangle[] = [];
        const stillUnplaced: Rectangle[] = [];

        for(const image of unplacedItems) {
            const rect = packer.insert(image.width, image.height);
            if (rect) {
                newlyPlaced.push({
                    ...image,
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    rotated: rect.width !== image.width,
                });
            } else {
                stillUnplaced.push(image);
            }
        }
        
        placedItems = placedItems.concat(newlyPlaced);

        if(stillUnplaced.length > 0 && newlyPlaced.length === 0) {
             // If no new items could be placed, increase height to avoid infinite loop
             currentSheetHeight *= 1.5;
        }

        if (stillUnplaced.length === 0) {
            break; // All items placed
        }
        unplacedItems.splice(0, unplacedItems.length, ...stillUnplaced);
    }
    
    const sheetLength = placedItems.reduce((maxLength, item) => {
        return Math.max(maxLength, item.y + item.height);
    }, 0);

    return { placedItems, sheetLength };
}

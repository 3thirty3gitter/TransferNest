
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

class FixedMaxRectsBinPack {
    private binWidth: number;
    private binHeight: number;
    private allowRotations: boolean;
    private margin: number;

    public usedRectangles: PlacedRectangle[] = [];
    public freeRectangles: { x: number; y: number; width: number; height: number }[] = [];

    constructor(width: number, height: number, allowRotations = true) {
        this.binWidth = width;
        this.binHeight = height;
        this.allowRotations = allowRotations;
        this.margin = 3 / 40; // 3px margin converted to inches

        this.usedRectangles = [];
        this.freeRectangles = [];
        
        this.freeRectangles.push({
            x: this.margin,
            y: this.margin,
            width: this.binWidth - (2 * this.margin),
            height: this.binHeight - (2 * this.margin)
        });
    }

    insert(width: number, height: number, method: 'BestShortSideFit' = 'BestShortSideFit'): (Omit<PlacedRectangle, 'id' | 'url'>) | null {
        const marginWidth = width + this.margin;
        const marginHeight = height + this.margin;
        
        let bestRect: (Omit<PlacedRectangle, 'id' | 'url'>) | null = null;
        let bestScore = Number.MAX_VALUE;
        let bestSecondaryScore = Number.MAX_VALUE;

        for (let i = 0; i < this.freeRectangles.length; i++) {
            const freeRect = this.freeRectangles[i];
            
            if (freeRect.width >= marginWidth && freeRect.height >= marginHeight) {
                const score = this.scoreRect(freeRect, marginWidth, marginHeight, method);
                if (score.primary < bestScore || 
                   (score.primary === bestScore && score.secondary < bestSecondaryScore)) {
                    bestRect = {
                        x: freeRect.x,
                        y: freeRect.y,
                        width: width,
                        height: height,
                        rotated: false
                    };
                    bestScore = score.primary;
                    bestSecondaryScore = score.secondary;
                }
            }
            
            if (this.allowRotations && 
                freeRect.width >= marginHeight && 
                freeRect.height >= marginWidth &&
                width !== height) {
                const score = this.scoreRect(freeRect, marginHeight, marginWidth, method);
                if (score.primary < bestScore || 
                   (score.primary === bestScore && score.secondary < bestSecondaryScore)) {
                    bestRect = {
                        x: freeRect.x,
                        y: freeRect.y,
                        width: height,
                        height: width,
                        rotated: true
                    };
                    bestScore = score.primary;
                    bestSecondaryScore = score.secondary;
                }
            }
        }

        if (bestRect) {
            this.placeRectangle(bestRect);
            return bestRect;
        }
        
        return null;
    }

    private scoreRect(freeRect: {width:number, height:number}, width: number, height: number, method: string) {
        switch (method) {
            case 'BestShortSideFit':
                const leftoverHoriz = freeRect.width - width;
                const leftoverVert = freeRect.height - height;
                return {
                    primary: Math.min(leftoverHoriz, leftoverVert),
                    secondary: Math.max(leftoverHoriz, leftoverVert)
                };
            
            case 'BestAreaFit':
                return {
                    primary: freeRect.width * freeRect.height - width * height,
                    secondary: Math.min(freeRect.width - width, freeRect.height - height)
                };
            
            case 'BottomLeftRule':
                return {
                    primary: freeRect.y,
                    secondary: freeRect.x
                };
                
            default:
                return { primary: 0, secondary: 0 };
        }
    }

    private placeRectangle(rect: Omit<PlacedRectangle, 'id' | 'url'>) {
        this.usedRectangles.push(rect as PlacedRectangle);
        
        const newFreeRects: { x: number; y: number; width: number; height: number }[] = [];
        
        for (const freeRect of this.freeRectangles) {
            const splits = this.splitFreeRectangle(freeRect, rect);
            newFreeRects.push(...splits);
        }
        
        this.freeRectangles = newFreeRects;
        this.removeDuplicateRectangles();
    }

    private splitFreeRectangle(freeRect: { x: number; y: number; width: number; height: number; }, usedRect: Omit<PlacedRectangle, 'id' | 'url'>) {
        const splits: { x: number; y: number; width: number; height: number }[] = [];
        
        const usedX = usedRect.x;
        const usedY = usedRect.y;
        const usedWidth = usedRect.width + this.margin;
        const usedHeight = usedRect.height + this.margin;
        
        if (usedX >= freeRect.x + freeRect.width || 
            usedX + usedWidth <= freeRect.x ||
            usedY >= freeRect.y + freeRect.height || 
            usedY + usedHeight <= freeRect.y) {
            splits.push(freeRect);
            return splits;
        }
        
        if (usedX > freeRect.x) {
            splits.push({ x: freeRect.x, y: freeRect.y, width: usedX - freeRect.x, height: freeRect.height });
        }
        
        if (usedX + usedWidth < freeRect.x + freeRect.width) {
            splits.push({ x: usedX + usedWidth, y: freeRect.y, width: freeRect.x + freeRect.width - (usedX + usedWidth), height: freeRect.height });
        }
        
        if (usedY > freeRect.y) {
            splits.push({ x: freeRect.x, y: freeRect.y, width: freeRect.width, height: usedY - freeRect.y });
        }
        
        if (usedY + usedHeight < freeRect.y + freeRect.height) {
            splits.push({ x: freeRect.x, y: usedY + usedHeight, width: freeRect.width, height: freeRect.y + freeRect.height - (usedY + usedHeight) });
        }
        
        return splits.filter(rect => rect.width > 0 && rect.height > 0);
    }

    private removeDuplicateRectangles() {
        for (let i = 0; i < this.freeRectangles.length; i++) {
            for (let j = i + 1; j < this.freeRectangles.length; j++) {
                if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
                    this.freeRectangles.splice(i, 1);
                    i--;
                    break;
                }
                if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
                    this.freeRectangles.splice(j, 1);
                    j--;
                }
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
    let unplacedItems: Rectangle[] = [...sortedImages];
    
    let currentSheetHeight = sortedImages.reduce((max, img) => Math.max(max, img.height), 0) * 2;
    
    while (unplacedItems.length > 0) {
        const packer = new FixedMaxRectsBinPack(sheetWidth, currentSheetHeight, true);
        const newlyPlacedThisRound: PlacedRectangle[] = [];
        const stillUnplaced: Rectangle[] = [];

        for (const image of unplacedItems) {
            const rect = packer.insert(image.width, image.height, 'BestShortSideFit');
            if (rect) {
                newlyPlacedThisRound.push({
                    ...image,
                    ...rect,
                });
            } else {
                stillUnplaced.push(image);
            }
        }
        
        placedItems.push(...newlyPlacedThisRound);
        unplacedItems = stillUnplaced;

        if (unplacedItems.length > 0 && newlyPlacedThisRound.length === 0) {
            currentSheetHeight *= 1.5; 
        }
    }
    
    const sheetLength = placedItems.reduce((maxLength, item) => {
        const itemHeight = item.rotated ? item.width : item.height;
        return Math.max(maxLength, item.y + itemHeight);
    }, 0) + (3 / 40); // Add final margin

    return { placedItems, sheetLength };
}

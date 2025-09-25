
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

class BottomLeftFillNester {
  private sheetWidth: number;
  private placedRectangles: PlacedRectangle[] = [];
  
  constructor(sheetWidth: number) {
    this.sheetWidth = sheetWidth;
  }
  
  nest(images: Rectangle[]): { placedItems: PlacedRectangle[], sheetLength: number } {
    this.placedRectangles = [];
    
    const sortedImages = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    for (const image of sortedImages) {
        const position = this.findBestPosition(image);
        if (position) {
            this.placeRectangle({
                ...image,
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
                rotated: position.rotated,
            });
        } else {
            console.warn(`Could not find a position for image ${image.id}`);
        }
    }

    const sheetLength = this.placedRectangles.reduce((maxLength, item) => {
        return Math.max(maxLength, item.y + item.height);
    }, 0);

    const placedItems = this.placedRectangles.map(item => {
        return {
            id: item.id,
            url: item.url,
            x: item.x,
            y: item.y,
            width: item.rotated ? item.height : item.width, 
            height: item.rotated ? item.width : item.height,
            rotated: item.rotated,
        }
    });

    return {
      placedItems,
      sheetLength,
    };
  }

  private findBestPosition(rect: Rectangle) {
    let bestPosition: (PlacedRectangle & { area: number }) | null = null;

    const testPoints: {x: number, y: number}[] = [{ x: 0, y: 0 }];

    this.placedRectangles.forEach(p => {
        testPoints.push({ x: p.x + p.width, y: p.y });
        testPoints.push({ x: p.x, y: p.y + p.height });
        testPoints.push({ x: p.x + p.width, y: p.y + p.height });
    });

    for (const point of testPoints) {
        const rotations = this.getRotations(rect);
        for (const rotatedRect of rotations) {

            const x = point.x;
            const y = point.y;
            
            if (x + rotatedRect.width > this.sheetWidth) continue;
            
            if (this.canPlaceAt(x, y, rotatedRect.width, rotatedRect.height)) {
                const score = y + rotatedRect.height;
                const currentPosition = {
                  ...rect,
                  ...rotatedRect,
                  x,
                  y,
                  area: rotatedRect.width * rotatedRect.height,
                };
                if (!bestPosition || score < (bestPosition.y + bestPosition.height)) {
                    bestPosition = currentPosition
                }
            }

            for (const placed of this.placedRectangles) {
                const testY = placed.y + placed.height;
                if(x + rotatedRect.width > this.sheetWidth) continue;
                if(this.canPlaceAt(x, testY, rotatedRect.width, rotatedRect.height)) {
                     const score = testY + rotatedRect.height;
                     if(!bestPosition || score < (bestPosition.y + bestPosition.height)) {
                        bestPosition = {
                            ...rect,
                            ...rotatedRect,
                            x,
                            y: testY,
                            area: rotatedRect.width * rotatedRect.height,
                        }
                     }
                }
            }
        }
    }
    return bestPosition;
  }


  private getRotations(rect: Rectangle) {
    const rotations = [{ width: rect.width, height: rect.height, rotated: false }];
    
    if (rect.width !== rect.height && (rect.allowRotation ?? true)) {
      rotations.push({ width: rect.height, height: rect.width, rotated: true });
    }
    
    return rotations;
  }
  
  private canPlaceAt(x: number, y: number, width: number, height: number): boolean {
    if (x < 0 || y < 0 || x + width > this.sheetWidth) {
      return false;
    }

    for (const placed of this.placedRectangles) {
      if (
        x < placed.x + placed.width &&
        x + width > placed.x &&
        y < placed.y + placed.height &&
        y + height > placed.y
      ) {
        return false;
      }
    }
    return true;
  }

  private placeRectangle(rect: PlacedRectangle) {
    this.placedRectangles.push(rect);
  }
}

export function nestImages(images: Rectangle[], sheetWidth: number) {
    const nester = new BottomLeftFillNester(sheetWidth);
    const rectsToNest: Rectangle[] = images.map(img => ({...img, allowRotation: true}));
    return nester.nest(rectsToNest);
}

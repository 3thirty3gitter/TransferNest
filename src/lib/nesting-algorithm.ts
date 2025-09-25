
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
    
    // Create a copy and sort images by area (descending) for better packing
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
            // This case should be handled - maybe add to a list of unplaced items
            console.warn(`Could not find a position for image ${image.id}`);
        }
    }

    const sheetLength = this.placedRectangles.reduce((maxLength, item) => {
        return Math.max(maxLength, item.y + item.height);
    }, 0);

    // Return a new object that matches the expected NestedLayout schema
    const placedItems = this.placedRectangles.map(item => {
        const originalImage = images.find(img => img.id === item.id);
        return {
            id: item.id,
            url: item.url,
            x: item.x,
            y: item.y,
            width: originalImage!.width, // Return original dimensions
            height: originalImage!.height,
            // rotated: item.rotated // This property is not in the schema, so we omit it
        }
    });

    return {
      placedItems,
      sheetLength,
    };
  }

  private findBestPosition(rect: Rectangle) {
    let bestPosition: (PlacedRectangle & { area: number }) | null = null;
    const rotations = this.getRotations(rect);

    for (const rotatedRect of rotations) {
      if (rotatedRect.width > this.sheetWidth) continue;

      // Start at y=0 and move upwards
      for (let y = 0; ; y++) {
        let canPlace = false;
        // Check along the x-axis for a spot
        for (let x = 0; x <= this.sheetWidth - rotatedRect.width; x++) {
          if (this.canPlaceAt(x, y, rotatedRect.width, rotatedRect.height)) {
            const currentPosition = {
              ...rect,
              ...rotatedRect,
              x,
              y,
              area: rotatedRect.width * rotatedRect.height,
            };
            // The first position found at the lowest y is the best one (bottom-left approach)
            return currentPosition;
          }
        }
        // If we couldn't place it at this y level, and there's an obstacle above, stop.
        if (this.isShelf(y)) {
           break;
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
    if (x + width > this.sheetWidth) {
      return false;
    }

    for (const placed of this.placedRectangles) {
      if (
        x < placed.x + placed.width &&
        x + width > placed.x &&
        y < placed.y + placed.height &&
        y + height > placed.y
      ) {
        return false; // Overlap detected
      }
    }
    return true;
  }

  private isShelf(y: number): boolean {
    // A "shelf" is the top edge of any placed rectangle
    for (const placed of this.placedRectangles) {
        if(placed.y + placed.height > y) return true;
    }
    return false;
  }

  private placeRectangle(rect: PlacedRectangle) {
    this.placedRectangles.push(rect);
  }
}

export function nestImages(images: Rectangle[], sheetWidth: number) {
    const nester = new BottomLeftFillNester(sheetWidth);
    return nester.nest(images);
}

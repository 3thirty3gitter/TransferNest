// column-packing.ts
// Alternative packing strategy for 13" sheets with many small items
// Uses a column-based approach that works better for narrow widths

export type ManagedImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  copies: number;
  dataAiHint?: string;
};

export type NestedImage = {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
};

const VIRTUAL_SHEET_HEIGHT = 10000;

/**
 * Column-based packing for narrow sheets with many items
 * Divides the sheet into vertical columns and fills each column optimally
 */
export function columnPackNarrow(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number,
  canRotate: (img: ManagedImage) => boolean
): {
  placedItems: NestedImage[];
  sheetLength: number;
  areaUtilizationPct: number;
} {
  const placedItems: NestedImage[] = [];
  let usedArea = 0;

  // Sort by height descending for better column filling
  const sortedImages = images.slice().sort((a, b) => b.height - a.height);

  type Column = {
    x: number;
    width: number;
    currentY: number;
    items: NestedImage[];
  };

  const columns: Column[] = [];
  let maxY = padding;

  for (const img of sortedImages) {
    const orientations = [
      { w: img.width, h: img.height, rotated: false }
    ];
    if (canRotate(img) && img.width !== img.height) {
      // Prefer orientation that fits column width better
      orientations.push({ w: img.height, h: img.width, rotated: true });
    }

    let placed = false;

    // Try to fit in existing columns
    for (const col of columns) {
      for (const orientation of orientations) {
        const fitsWidth = orientation.w + padding <= col.width;
        if (fitsWidth) {
          // Place in this column
          placedItems.push({
            id: img.id,
            url: img.url,
            x: col.x,
            y: col.currentY,
            width: img.width,
            height: img.height,
            rotated: orientation.rotated
          });

          col.items.push(placedItems[placedItems.length - 1]);
          col.currentY += orientation.h + padding;
          usedArea += img.width * img.height;
          maxY = Math.max(maxY, col.currentY);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    if (placed) continue;

    // Create new column
    for (const orientation of orientations) {
      const newColumnX = columns.length === 0
        ? padding
        : columns[columns.length - 1].x + columns[columns.length - 1].width + padding;

      if (newColumnX + orientation.w + padding <= sheetWidth) {
        const newColumn: Column = {
          x: newColumnX,
          width: orientation.w + padding,
          currentY: padding + orientation.h + padding,
          items: []
        };

        placedItems.push({
          id: img.id,
          url: img.url,
          x: newColumnX,
          y: padding,
          width: img.width,
          height: img.height,
          rotated: orientation.rotated
        });

        newColumn.items.push(placedItems[placedItems.length - 1]);
        columns.push(newColumn);
        usedArea += img.width * img.height;
        maxY = Math.max(maxY, newColumn.currentY);
        placed = true;
        break;
      }
    }

    if (!placed) {
      console.warn(`Failed to place item ${img.id} in column packing`);
    }
  }

  const sheetLength = maxY + padding;
  const sheetArea = sheetWidth * sheetLength;
  const areaUtilizationPct = sheetArea === 0 ? 0 : usedArea / sheetArea;

  return { placedItems, sheetLength, areaUtilizationPct };
}

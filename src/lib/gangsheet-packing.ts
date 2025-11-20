// gangsheet-packing.ts
// Commercial-grade gangsheet packing algorithm
// Based on strategies used by professional DTF gangsheet builders

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
  originalWidth: number;
  originalHeight: number;
  rotated: boolean;
};

const VIRTUAL_SHEET_HEIGHT = 10000;

/**
 * Multi-pass gangsheet packing with gap-filling
 * Pass 1: Pack large items using shelf-packing
 * Pass 2: Fill gaps with smaller items using skyline algorithm
 */
export function gangsheetPack(
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

  // Sort by area (large to small) for better initial packing
  const sorted = images.slice().sort((a, b) => (b.width * b.height) - (a.width * a.height));

  // Split into size tiers for multi-pass packing
  const totalArea = sorted.reduce((sum, img) => sum + img.width * img.height, 0);
  const avgArea = totalArea / sorted.length;
  
  const largeItems = sorted.filter(img => img.width * img.height >= avgArea * 1.5);
  const mediumItems = sorted.filter(img => {
    const area = img.width * img.height;
    return area < avgArea * 1.5 && area >= avgArea * 0.5;
  });
  const smallItems = sorted.filter(img => img.width * img.height < avgArea * 0.5);

  console.log(`[GANGSHEET] Items: ${largeItems.length} large, ${mediumItems.length} medium, ${smallItems.length} small`);

  // Skyline structure for tracking available space
  type SkylineSegment = {
    x: number;
    y: number;
    width: number;
  };

  const skyline: SkylineSegment[] = [{
    x: padding,
    y: padding,
    width: sheetWidth - 2 * padding
  }];

  let maxY = padding;

  // Helper: Find best position using skyline algorithm
  function findBestPosition(itemWidth: number, itemHeight: number): {
    segment: SkylineSegment;
    segmentIndex: number;
    y: number;
    wastedHeight: number;
  } | null {
    let bestFit: any = null;
    let bestWaste = Infinity;

    for (let i = 0; i < skyline.length; i++) {
      const segment = skyline[i];
      
      // Check if item fits starting at this segment
      let totalWidth = 0;
      let maxSegmentY = segment.y;
      
      for (let j = i; j < skyline.length && totalWidth < itemWidth + padding; j++) {
        totalWidth += skyline[j].width;
        maxSegmentY = Math.max(maxSegmentY, skyline[j].y);
      }

      if (totalWidth >= itemWidth + padding && segment.x + itemWidth + padding <= sheetWidth) {
        // Calculate wasted space
        const wastedHeight = maxSegmentY - segment.y;
        const wastedArea = wastedHeight * itemWidth;

        if (wastedArea < bestWaste) {
          bestWaste = wastedArea;
          bestFit = {
            segment,
            segmentIndex: i,
            y: maxSegmentY,
            wastedHeight
          };
        }
      }
    }

    return bestFit;
  }

  // Helper: Place item and update skyline
  function placeItem(img: ManagedImage, x: number, y: number, w: number, h: number, rotated: boolean) {
    placedItems.push({
      id: img.id,
      url: img.url,
      x,
      y,
      width: img.width,
      height: img.height,
      originalWidth: img.width,
      originalHeight: img.height,
      rotated
    });

    usedArea += img.width * img.height;
    maxY = Math.max(maxY, y + h + padding);

    // Update skyline: Remove segments covered by this item and add new segment on top
    const itemLeft = x;
    const itemRight = x + w + padding;
    const itemTop = y + h + padding;

    // Remove or trim segments that are covered
    const newSkyline: SkylineSegment[] = [];
    
    for (const seg of skyline) {
      const segRight = seg.x + seg.width;
      
      // Segment is completely to the left or right - keep it
      if (segRight <= itemLeft || seg.x >= itemRight) {
        newSkyline.push(seg);
      }
      // Segment is partially covered on the left
      else if (seg.x < itemLeft && segRight > itemLeft) {
        newSkyline.push({
          x: seg.x,
          y: seg.y,
          width: itemLeft - seg.x
        });
        // If it also extends past the right, add that part too
        if (segRight > itemRight) {
          newSkyline.push({
            x: itemRight,
            y: seg.y,
            width: segRight - itemRight
          });
        }
      }
      // Segment is partially covered on the right
      else if (seg.x < itemRight && segRight > itemRight) {
        newSkyline.push({
          x: itemRight,
          y: seg.y,
          width: segRight - itemRight
        });
      }
      // Segment is completely covered - don't add it
    }

    // Add the new segment on top of the placed item
    newSkyline.push({
      x: itemLeft,
      y: itemTop,
      width: w + padding
    });

    // Sort and merge
    newSkyline.sort((a, b) => a.x - b.x);
    
    // Merge adjacent segments at the same height
    skyline.length = 0;
    for (let i = 0; i < newSkyline.length; i++) {
      if (skyline.length > 0) {
        const last = skyline[skyline.length - 1];
        const lastRight = last.x + last.width;
        if (Math.abs(last.y - newSkyline[i].y) < 0.01 && Math.abs(lastRight - newSkyline[i].x) < 0.01) {
          // Merge
          last.width += newSkyline[i].width;
          continue;
        }
      }
      skyline.push(newSkyline[i]);
    }
  }

  // PASS 1: Pack large items
  for (const img of largeItems) {
    const orientations = [
      { w: img.width, h: img.height, rotated: false }
    ];
    if (canRotate(img)) {
      orientations.push({ w: img.height, h: img.width, rotated: true });
    }

    let placed = false;
    for (const orientation of orientations) {
      const fit = findBestPosition(orientation.w, orientation.h);
      if (fit) {
        placeItem(img, fit.segment.x, fit.y, orientation.w, orientation.h, orientation.rotated);
        placed = true;
        break;
      }
    }

    if (!placed) {
      console.warn(`[GANGSHEET] Failed to place large item ${img.id}`);
    }
  }

  // PASS 2: Pack medium items into remaining spaces
  for (const img of mediumItems) {
    const orientations = [
      { w: img.width, h: img.height, rotated: false }
    ];
    if (canRotate(img)) {
      orientations.push({ w: img.height, h: img.width, rotated: true });
    }

    let placed = false;
    for (const orientation of orientations) {
      const fit = findBestPosition(orientation.w, orientation.h);
      if (fit) {
        placeItem(img, fit.segment.x, fit.y, orientation.w, orientation.h, orientation.rotated);
        placed = true;
        break;
      }
    }

    if (!placed) {
      console.warn(`[GANGSHEET] Failed to place medium item ${img.id}`);
    }
  }

  // PASS 3: Fill gaps with small items
  for (const img of smallItems) {
    const orientations = [
      { w: img.width, h: img.height, rotated: false }
    ];
    if (canRotate(img)) {
      orientations.push({ w: img.height, h: img.width, rotated: true });
    }

    let placed = false;
    for (const orientation of orientations) {
      const fit = findBestPosition(orientation.w, orientation.h);
      if (fit) {
        placeItem(img, fit.segment.x, fit.y, orientation.w, orientation.h, orientation.rotated);
        placed = true;
        break;
      }
    }

    if (!placed) {
      console.warn(`[GANGSHEET] Failed to place small item ${img.id}`);
    }
  }

  const sheetLength = maxY + padding;
  const sheetArea = sheetWidth * sheetLength;
  const areaUtilizationPct = sheetArea === 0 ? 0 : usedArea / sheetArea;

  return { placedItems, sheetLength, areaUtilizationPct };
}

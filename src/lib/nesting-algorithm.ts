
'use client';

// ---------- Types ----------

type Rectangle = {
  id: string;
  url: string;
  width: number; // in inches
  height: number; // in inches
  allowRotate: boolean;
};

type PlacedRectangle = Rectangle & {
  x: number;
  y: number;
  rotated: boolean;
};

type MRRect = { x: number; y: number; w: number; h: number };

type MRHeuristic = "BestAreaFit" | "BestShortSideFit" | "BestLongSideFit" | "ContactPoint";

type MRConfig = { heuristic: MRHeuristic; spacing: number; sheetWidth: number };

// ---------- MaxRects Bin Packing (dense) ----------
// Algorithm based on Jukka Jylänki's work.

function packMaxRectsOnce(
  items: Array<{ w: number; h: number; id: string; url: string; allowRotate: boolean }>,
  cfg: MRConfig
): { placements: PlacedRectangle[]; sheetHeight: number; unplaced: typeof items } {
  const { spacing, sheetWidth, heuristic } = cfg;
  const H_MAX = 200000; // virtual tall bin
  const pad = Math.max(0, spacing);
  const wants = items.map(it => ({ ...it, W: it.w + pad, H: it.h + pad }));

  let free: MRRect[] = [{ x: 0, y: 0, w: sheetWidth, h: H_MAX }];
  const used: Array<{ r: MRRect; item: typeof wants[number]; rotated: boolean }> = [];
  const unplaced: typeof wants = [];

  function contactPointScore(x: number, y: number, w: number, h: number) {
    let score = 0;
    if (x === 0 || x + w === sheetWidth) score += h;
    if (y === 0) score += w;
    for (const u of used) {
      const r = u.r;
      if (r.x === x + w || r.x + r.w === x) {
        score += Math.max(0, Math.min(y + h, r.y + r.h) - Math.max(y, r.y));
      }
      if (r.y === y + h || r.y + r.h === y) {
        score += Math.max(0, Math.min(x + w, r.x + r.w) - Math.max(x, r.x));
      }
    }
    return score;
  }

  function scoreRect(fr: MRRect, w: number, h: number) {
    if (w > fr.w || h > fr.h) return null;
    const leftoverHoriz = fr.w - w;
    const leftoverVert = fr.h - h;
    const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
    const longSideFit = Math.max(leftoverHoriz, leftoverVert);
    const areaFit = fr.w * fr.h - w * h;
    const contact = contactPointScore(fr.x, fr.y, w, h);
    
    switch (heuristic) {
        case "BestShortSideFit": return { primary: shortSideFit, secondary: longSideFit };
        case "BestLongSideFit": return { primary: longSideFit, secondary: shortSideFit };
        case "BestAreaFit": return { primary: areaFit, secondary: shortSideFit };
        case "ContactPoint": return { primary: -contact, secondary: shortSideFit }; // Negative to maximize contact
        default: return { primary: shortSideFit, secondary: longSideFit };
    }
  }
  
  function choosePosition(w: number, h: number) {
    let best: { fr: MRRect; x: number; y: number; scoreA: number; scoreB: number } | null = null;
    for (const fr of free) {
      const score = scoreRect(fr, w, h);
      if (!score) continue;
      
      if (!best || score.primary < best.scoreA || (score.primary === best.scoreA && score.secondary < best.scoreB)) {
        best = { fr, x: fr.x, y: fr.y, scoreA: score.primary, scoreB: score.secondary };
      }
    }
    return best;
  }
  
  function splitFreeNode(freeRect: MRRect, usedRect: MRRect): MRRect[] {
    // Test if the rectangles even intersect.
    if (usedRect.x >= freeRect.x + freeRect.w || usedRect.x + usedRect.w <= freeRect.x ||
        usedRect.y >= freeRect.y + freeRect.h || usedRect.y + usedRect.h <= freeRect.y) {
      return [freeRect];
    }
    
    const newFreeRects: MRRect[] = [];
    
    // New free rectangle above the used one.
    if (usedRect.y > freeRect.y) {
      newFreeRects.push({
        x: freeRect.x,
        y: freeRect.y,
        w: freeRect.w,
        h: usedRect.y - freeRect.y
      });
    }
    
    // New free rectangle below the used one.
    if (usedRect.y + usedRect.h < freeRect.y + freeRect.h) {
      newFreeRects.push({
        x: freeRect.x,
        y: usedRect.y + usedRect.h,
        w: freeRect.w,
        h: (freeRect.y + freeRect.h) - (usedRect.y + usedRect.h)
      });
    }
    
    // New free rectangle to the left of the used one.
    if (usedRect.x > freeRect.x) {
      newFreeRects.push({
        x: freeRect.x,
        y: freeRect.y,
        w: usedRect.x - freeRect.x,
        h: freeRect.h
      });
    }
    
    // New free rectangle to the right of the used one.
    if (usedRect.x + usedRect.w < freeRect.x + freeRect.w) {
      newFreeRects.push({
        x: usedRect.x + usedRect.w,
        y: freeRect.y,
        w: (freeRect.x + freeRect.w) - (usedRect.x + usedRect.w),
        h: freeRect.h
      });
    }

    return newFreeRects.filter(r => r.w > 0 && r.h > 0);
  }

  function pruneFreeList() {
      let i = 0;
      while (i < free.length) {
          let j = i + 1;
          while (j < free.length) {
              const a = free[i];
              const b = free[j];
              if (!a || !b) { j++; continue; }
              // if b is contained in a, remove b
              if (a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h) {
                  free.splice(j, 1);
              } 
              // if a is contained in b, remove a
              else if (b.x <= a.x && b.y <= a.y && b.x + b.w >= a.x + a.w && b.y + b.h >= a.y + a.h) {
                  free.splice(i, 1);
                  i--; // restart checks for the new item at index i
                  break; 
              } else {
                  j++;
              }
          }
          if (j === free.length) { // only increment i if we didn't break
              i++;
          }
      }
  }


  const order = [...wants].sort((A, B) => Math.max(B.W, B.H) - Math.max(A.W, A.H));

  for (const it of order) {
    const nat = choosePosition(it.W, it.H);
    const rot = it.allowRotate ? choosePosition(it.H, it.W) : null;
    
    let take: { fr: MRRect; x: number; y: number; rotated: boolean; scoreA: number, scoreB: number } | null = null;
    
    if (nat && rot) {
        if (nat.scoreA < rot.scoreA || (nat.scoreA === rot.scoreA && nat.scoreB < rot.scoreB)) {
            take = { ...nat, rotated: false };
        } else {
            take = { ...rot, rotated: true };
        }
    } else if (nat) {
        take = { ...nat, rotated: false };
    } else if (rot) {
        take = { ...rot, rotated: true };
    }
    
    if (!take) { 
      unplaced.push(it);
      continue;
    }

    const w = take.rotated ? it.H : it.W; 
    const h = take.rotated ? it.W : it.H;
    const usedRect: MRRect = { x: take.x, y: take.y, w, h };
    
    const newFree: MRRect[] = [];
    for (const fr of free) {
        newFree.push(...splitFreeNode(fr, usedRect));
    }
    free = newFree;
    pruneFreeList();
    
    used.push({ r: usedRect, item: it, rotated: take.rotated });
  }

  const placements: PlacedRectangle[] = used.map(u => ({
    id: u.item.id,
    url: u.item.url,
    x: u.r.x + pad / 2,
    y: u.r.y + pad / 2,
    width: u.rotated ? u.item.height : u.item.width,
    height: u.rotated ? u.item.width : u.item.height,
    rotated: u.rotated,
    allowRotate: u.item.allowRotate,
  }));
  
  const sheetHeight = placements.length ? Math.max(...placements.map(p => p.y + p.height + pad / 2)) : 0;
  
  return { placements, sheetHeight, unplaced: unplaced.map(u => items.find(i => i.id === u.id)!) };
}

export function nestImages(images: Omit<Rectangle, 'allowRotate'>[], sheetWidth: number): { placedItems: PlacedRectangle[], sheetLength: number } {
  if (images.length === 0) {
    return { placedItems: [], sheetLength: 0 };
  }

  const margin = 0.125;
  const itemsToPack = images.map(img => ({
    ...img,
    w: img.width,
    h: img.height,
    allowRotate: true,
  }));
  
  // Check if any item is wider than the sheet
  const sheetBinWidth = sheetWidth - (margin * 2);
  for (const item of itemsToPack) {
      if (item.w > sheetBinWidth && item.h > sheetBinWidth) {
          throw new Error(`Image is too wide for the sheet. Item width: ${item.w.toFixed(2)}", Sheet width: ${sheetBinWidth.toFixed(2)}". Please adjust image dimensions.`);
      }
  }
  
  let currentItems = [...itemsToPack];
  let placedItems: PlacedRectangle[] = [];
  let currentY = 0;

  while(currentItems.length > 0) {
    const { placements, unplaced } = packMaxRectsOnce(currentItems, { 
      heuristic: "BestShortSideFit",
      spacing: margin,
      sheetWidth: sheetBinWidth 
    });

    if (placements.length === 0 && unplaced.length > 0) {
        // This case should be handled by the pre-check, but as a fallback.
        throw new Error("Could not fit all images. An item might be wider than the sheet. Please adjust image dimensions.");
    }
    
    let maxHeightThisBin = 0;
    for(const p of placements) {
      placedItems.push({
        ...p,
        y: p.y + currentY, // adjust y position by current total length
      });
      maxHeightThisBin = Math.max(maxHeightThisBin, p.y + p.height);
    }

    currentY += maxHeightThisBin;
    currentItems = unplaced;
  }

  const finalSheetLength = placedItems.reduce((maxLength, item) => {
      return Math.max(maxLength, item.y + item.height);
  }, 0) + margin;

  // Final placement list needs to have margin added to x and y.
  const finalPlacements = placedItems.map(p => ({
    ...p,
    x: p.x + margin,
    y: p.y + margin
  }));

  return { placedItems: finalPlacements, sheetLength: finalSheetLength };
}

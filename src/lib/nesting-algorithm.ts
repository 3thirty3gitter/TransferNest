
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
    for (const u of used) {
      const r = u.r;
      if (r.x === x + w || r.x + r.w === x) {
        const top = Math.max(r.y, y), bottom = Math.min(r.y + r.h, y + h);
        score += Math.max(0, bottom - top);
      }
      if (r.y === y + h || r.y + r.h === y) {
        const left = Math.max(r.x, x), right = Math.min(r.x + r.w, x + w);
        score += Math.max(0, right - left);
      }
    }
    if (x === 0 || x + w === sheetWidth) score += h; // touch bin sides
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

  function splitFreeNode(f: MRRect, u: MRRect) {
    const out: MRRect[] = [];
    if (u.x >= f.x + f.w || u.x + u.w <= f.x || u.y >= f.y + f.h || u.y + u.h <= f.y) return [f];
    if (u.y > f.y) out.push({ x: f.x, y: f.y, w: f.w, h: u.y - f.y });
    if (u.y + u.h < f.y + f.h) out.push({ x: f.x, y: u.y + u.h, w: f.w, h: f.y + f.h - (u.y + u.h) });
    const top = Math.max(f.y, u.y), bottom = Math.min(f.y + f.h, u.y + u.h);
    if (u.x > f.x) out.push({ x: f.x, y: top, w: u.x - f.x, h: bottom - top });
    if (u.x + u.w < f.x + f.w) out.push({ x: u.x + u.w, y: top, w: f.x + f.w - (u.x + u.w), h: bottom - top });
    return out.filter(r => r.w > 0 && r.h > 0);
  }

  function prune() {
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        const a = free[i], b = free[j];
        if (!a || !b) continue;
        if (a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h) { free.splice(i, 1); i--; break; }
        if (b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h) { free.splice(j, 1); j--; }
      }
    }
    let merged = true;
    while (merged) {
      merged = false;
      outer: for (let i = 0; i < free.length; i++) {
        for (let j = i + 1; j < free.length; j++) {
          const a = free[i], b = free[j];
          if (a.y === b.y && a.h === b.h && (a.x + a.w === b.x || b.x + b.w === a.x)) {
            const nx = Math.min(a.x, b.x); const nw = a.w + b.w; free.splice(j, 1); free[i] = { x: nx, y: a.y, w: nw, h: a.h }; merged = true; break outer;
          }
          if (a.x === b.x && a.w === b.w && (a.y + a.h === b.y || b.y + b.h === a.y)) {
            const ny = Math.min(a.y, b.y); const nh = a.h + b.h; free.splice(j, 1); free[i] = { x: a.x, y: ny, w: a.w, h: nh }; merged = true; break outer;
          }
        }
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
    for (const fr of free) newFree.push(...splitFreeNode(fr, usedRect));
    free = newFree; prune();
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
  
  let currentItems = [...itemsToPack];
  let placedItems: PlacedRectangle[] = [];
  let currentY = 0;

  while(currentItems.length > 0) {
    const sheetBinWidth = sheetWidth - (margin * 2);

    const { placements, unplaced } = packMaxRectsOnce(currentItems, { 
      heuristic: "BestShortSideFit",
      spacing: margin,
      sheetWidth: sheetBinWidth 
    });

    if (placements.length === 0 && unplaced.length > 0) {
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

  // Final placement list needs to have margin added to x.
  const finalPlacements = placedItems.map(p => ({
    ...p,
    x: p.x + margin,
    y: p.y + margin
  }));

  return { placedItems: finalPlacements, sheetLength: finalSheetLength };
}

    
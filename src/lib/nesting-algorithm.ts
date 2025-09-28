
'use client';

// ---------- Types ----------

type Rectangle = {
  id: string;
  url: string;
  width: number; // in inches
  height: number; // in inches
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
// Algorithm provided by user, based on Jukka Jylänki's work.
// This is a direct implementation to ensure correctness and performance.

function packMaxRectsOnce(
  items: Array<{ w: number; h: number; id: string; allowRotate: boolean }>,
  cfg: MRConfig
): { placements: PlacedRectangle[]; sheetHeight: number; unplaced: any[] } {
  const { spacing, sheetWidth, heuristic } = cfg;
  const H_MAX = 200000; // virtual tall bin
  const pad = Math.max(0, Math.round(spacing));
  const wants = items.map(it => ({ ...it, W: Math.max(1, Math.round(it.w + pad)), H: Math.max(1, Math.round(it.h + pad)) }));

  let free: MRRect[] = [{ x: 0, y: 0, w: Math.max(1, Math.round(sheetWidth)), h: H_MAX }];
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
    const a = fr.w * fr.h - w * h; // area fit
    const c = contactPointScore(fr.x, fr.y, w, h);
    return { a, shortSideFit, longSideFit, c };
  }

  function choosePosition(w: number, h: number) {
    let best: { fr: MRRect; x: number; y: number; scoreA: number; scoreB: number } | null = null;
    for (const fr of free) {
      const sc = scoreRect(fr, w, h);
      if (!sc) continue;
      let sA = 0, sB = 0;
      if (heuristic === "BestAreaFit") { sA = sc.a; sB = sc.shortSideFit; }
      else if (heuristic === "BestShortSideFit") { sA = sc.shortSideFit; sB = sc.longSideFit; }
      else if (heuristic === "BestLongSideFit") { sA = sc.longSideFit; sB = sc.shortSideFit; }
      else { sA = -sc.c; sB = sc.shortSideFit; } // ContactPoint (maximize c)
      if (!best || sA < best.scoreA || (sA === best.scoreA && sB < best.scoreB)) {
        best = { fr, x: fr.x, y: fr.y, scoreA: sA, scoreB: sB };
      }
    }
    return best && { fr: best.fr, x: best.x, y: best.y };
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
    const take = nat && rot ? ((nat.y < (rot?.y ?? Infinity) || (nat.y === (rot?.y ?? Infinity) && nat.x <= (rot?.x ?? Infinity))) ? { ...nat, rotated: false } : { ...rot!, rotated: true })
                             : nat ? { ...nat, rotated: false } : rot ? { ...rot, rotated: true } : null;
    
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

  const getOriginalItem = (item: typeof wants[number]): Rectangle => {
    const original = items.find(orig => orig.id === item.id);
    if (!original) throw new Error(`Could not find original item for id ${item.id}`);
    return original;
  }

  const placements: PlacedRectangle[] = used.map(u => {
    const originalItem = getOriginalItem(u.item);
    return {
      id: u.item.id,
      url: originalItem.url,
      x: u.r.x + Math.floor(pad / 2),
      y: u.r.y + Math.floor(pad / 2),
      width: u.rotated ? originalItem.height : originalItem.width,
      height: u.rotated ? originalItem.width : originalItem.height,
      rotated: u.rotated,
    };
  });
  
  const sheetHeight = placements.length ? Math.max(...placements.map(p => p.y + p.height)) + Math.floor(pad / 2) : 0;
  return { placements, sheetHeight: Math.ceil(sheetHeight), unplaced };
}


export function nestImages(images: Rectangle[], sheetWidth: number): { placedItems: PlacedRectangle[], sheetLength: number } {
  if (images.length === 0) {
    return { placedItems: [], sheetLength: 0 };
  }

  const margin = 0.125;
  const heuristic: MRHeuristic = "BestShortSideFit";
  const itemsToPack = images.map(img => ({
    ...img,
    allowRotate: true,
  }));
  
  let currentItems = [...itemsToPack];
  let placedItems: PlacedRectangle[] = [];
  let sheetLength = 0;

  const MAX_ITERATIONS = 100;
  let iterations = 0;

  while(currentItems.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const sheetBinWidth = sheetWidth - (margin * 2);

    const { placements, sheetHeight, unplaced } = packMaxRectsOnce(currentItems, { 
      heuristic, 
      spacing: margin,
      sheetWidth: sheetBinWidth 
    });

    for(const p of placements) {
      placedItems.push({
        ...p,
        y: p.y + sheetLength, // adjust y position by current total length
      });
    }

    if (placements.length > 0) {
      sheetLength += sheetHeight;
    }
    
    currentItems = unplaced.map(u => {
      const original = itemsToPack.find(i => i.id === u.id);
      if (!original) throw new Error("Unplaced item not found in original list");
      return original;
    });

    if(unplaced.length > 0 && placements.length === 0) {
      // If we are in a state where nothing can be placed, even on a new sheet,
      // it means an item is too large for the bin width.
       throw new Error("Could not fit all images. An item might be wider than the sheet. Please adjust image dimensions.");
    }
  }

  if (iterations >= MAX_ITERATIONS && currentItems.length > 0) {
    console.error("Max iterations reached, not all items were placed.", { remaining: currentItems.length });
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

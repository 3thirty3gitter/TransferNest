
'use client';

import type { NestedLayout } from '@/app/schema';

// ---------- Types ----------

type Rectangle = {
  id: string;
  url: string;
  width: number; // in inches
  height: number; // in inches
};

export type PlacedRectangle = Rectangle & {
  x: number;
  y: number;
  rotated: boolean;
};

type MRRect = { x: number; y: number; w: number; h: number };

type MRHeuristic = "BestAreaFit" | "BestShortSideFit" | "BestLongSideFit" | "ContactPoint";


// ---------- Bridge to Application Code ----------

export function nestImages(
    images: { id: string; url: string; width: number; height: number }[],
    sheetWidth: number
): { placedItems: NestedLayout; sheetLength: number } {

    if (images.length === 0) {
        return { placedItems: [], sheetLength: 0 };
    }

    const margin = 0.2;
    const itemsToPack = images.map(img => ({
        w: img.width,
        h: img.height,
        id: img.id,
        url: img.url,
        name: img.id,
        allowRotate: true,
    }));

    // Check if any image is too wide for the sheet and scale it down if necessary
    for (const item of itemsToPack) {
        if (item.w > sheetWidth && item.h > sheetWidth) {
             const needed = Math.min(item.w, item.h);
             throw new Error(`Image is too wide for the sheet. Item requires ${needed.toFixed(2)}", but sheet width is only ${sheetWidth.toFixed(2)}". Please adjust image dimensions.`);
        }
        if (item.w > sheetWidth && (!item.allowRotate || item.h > sheetWidth)) {
            const scaleRatio = sheetWidth / item.w;
            const originalItemInPack = itemsToPack.find(i => i.id === item.id);
            if (originalItemInPack) {
              originalItemInPack.w = sheetWidth;
              originalItemInPack.h = item.h * scaleRatio;
            }
        }
    }

    // ---------- MaxRects Bin Packing (Dense) ----------
    function packMaxRects(
      items: Array<{ w: number; h: number; id: string; name: string; allowRotate: boolean; url: string; }>,
      cfgSheetWidth: number,
      spacing: number,
      heuristic: MRHeuristic = "BestShortSideFit",
      restarts = 8
    ): { placements: PlacedRectangle[]; sheetHeight: number } {
      
      function packMaxRectsOnce(
        runItems: Array<{ w: number; h: number; id: string; name: string; allowRotate: boolean; url: string }>,
      ): { placements: PlacedRectangle[]; sheetHeight: number } {
        const H_MAX = 200000; // virtual tall bin
        const pad = Math.max(0, spacing);
        const wants = runItems.map(it => ({ ...it, W: it.w + pad, H: it.h + pad }));
      
        let free: MRRect[] = [{ x: 0, y: 0, w: cfgSheetWidth, h: H_MAX }];
        const used: Array<{ r: MRRect; item: typeof wants[number]; rotated: boolean }> = [];
      
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
          if (x === 0 || x + w === cfgSheetWidth) score += h; // touch bin sides
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
      
        function splitFreeNode(f: MRRect, u: MRRect): MRRect[] {
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
      
        const order = [...wants].sort((A, B) => Math.max(B.W, B.H) - Math.max(A.W, A.H) || Math.min(B.W, B.H) - Math.min(A.W, A.H));
        for (const it of order) {
          const nat = choosePosition(it.W, it.H);
          const rot = it.allowRotate && it.W !== it.H ? choosePosition(it.H, it.W) : null;
          let take = null;

          if (nat && rot) {
            if (nat.y < rot.y) {
              take = { ...nat, rotated: false };
            } else if (rot.y < nat.y) {
              take = { ...rot, rotated: true };
            } else {
              take = nat.x <= rot.x ? { ...nat, rotated: false } : { ...rot, rotated: true };
            }
          } else if (nat) {
            take = { ...nat, rotated: false };
          } else if (rot) {
            take = { ...rot, rotated: true };
          }
      
          if (!take) { 
              console.warn("MaxRects: couldn't place", it.name); 
              continue; 
          }
      
          const w = take.rotated ? it.H : it.W;
          const h = take.rotated ? it.W : it.H;
          const usedRect: MRRect = { x: take.x, y: take.y, w, h };
          
          const newFree: MRRect[] = [];
          for (const fr of free) newFree.push(...splitFreeNode(fr, usedRect));
          free = newFree;
          prune();
          used.push({ r: usedRect, item: it, rotated: take.rotated });
        }
      
        const placements: PlacedRectangle[] = used.map(u => ({
          id: u.item.id,
          url: u.item.url,
          x: u.r.x + (pad / 2),
          y: u.r.y + (pad / 2),
          width: u.rotated ? u.item.h : u.item.w,
          height: u.rotated ? u.item.w : u.item.h,
          rotated: u.rotated,
        }));
        const sheetHeight = placements.length ? Math.max(...placements.map(p => p.y + p.height + (pad / 2))) : 0;
        return { placements, sheetHeight };
      }

      let best: { placements: PlacedRectangle[]; sheetHeight: number } | null = null;
      const base = [...items];
      const rng = (seed: number) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      let rnd = rng(items.length * 97 + 13);
    
      for (let r = 0; r < Math.max(1, restarts); r++) {
        const shuffled = [...base].sort((a, b) => (Math.max(b.w, b.h) - Math.max(a.w, a.h)) || (rnd() - 0.5));
        const attempt = packMaxRectsOnce(shuffled);
        if (!best || attempt.sheetHeight < best.sheetHeight) best = attempt;
      }
      return best || { placements: [], sheetHeight: 0 };
    }
    
    const result = packMaxRects(itemsToPack, sheetWidth, margin, "BestShortSideFit", 16);
    
    return { placedItems: result.placements, sheetLength: result.sheetHeight };
}

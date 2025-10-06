import { recordNestingRun } from "@/lib/nesting-telemetry";
// src/lib/nesting-algorithm.ts

// -------- Contracts (as required by host app) --------
export type ManagedImage = {
  id: string;
  url: string;
  width: number;       // inches
  height: number;      // inches
  aspectRatio: number; // width / height
  copies: number;
};

export type NestingResult = {
  placedItems: {
    id: string;
    url: string;
    x: number;       // top-left, inches
    y: number;       // top-left, inches
    width: number;   // placed width (no spacing inflation)
    height: number;  // placed height (no spacing inflation)
    rotated: boolean;
  }[];
  sheetLength: number;
  areaUtilizationPct: number; // ratio in [0..1]
  totalCount: number;
  failedCount: number;
  sortStrategy: string;
  packingMethod: string;
};

// -------- Tunables (safe defaults) --------
const SHEET_MARGIN = 0.125; // inches around entire sheet
const ITEM_SPACING = 0.125; // gap between items (both axes)
const EPS = 1e-6;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// -------- Internal types --------
type Expanded = { id: string; url: string; w: number; h: number; ord: number };
type Placed = { id: string; url: string; x: number; y: number; w: number; h: number; rotated: boolean };
type Rect = { x: number; y: number; w: number; h: number };

// -------- Helpers --------
function expandCopies(images: ManagedImage[]): { items: Expanded[]; total: number } {
  const items: Expanded[] = [];
  let total = 0, ord = 0;
  for (const img of images) {
    const c = Math.max(0, Math.floor(img.copies || 0));
    total += c;
    for (let i = 0; i < c; i++) items.push({ id: img.id, url: img.url, w: img.width, h: img.height, ord: ord++ });
  }
  return { items, total };
}

function sortForPacking(items: Expanded[]): void {
  items.sort((a, b) => {
    const maxA = Math.max(a.w, a.h), maxB = Math.max(b.w, b.h);
    if (maxA !== maxB) return maxB - maxA;
    const areaA = a.w * a.h, areaB = b.w * b.h;
    if (areaA !== areaB) return areaB - areaA;
    return a.ord - b.ord;
  });
}

function utilization(placed: Placed[], sheetWidth: number, sheetLength: number): number {
  if (!placed.length || sheetWidth <= 0 || sheetLength <= 0) return 0;
  const used = placed.reduce((s, p) => s + p.w * p.h, 0);
  return r3(Math.max(0, Math.min(1, used / (sheetWidth * sheetLength))));
}

function rectsOverlap(a: Placed, b: Placed): boolean {
  return !(
    a.x + a.w <= b.x + EPS ||
    b.x + b.w <= a.x + EPS ||
    a.y + a.h <= b.y + EPS ||
    b.y + b.h <= a.y + EPS
  );
}

function validateNoOverlaps(placed: Placed[]): void {
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++)
      if (rectsOverlap(placed[i], placed[j])) placed[j].y = r3(placed[j].y + EPS * 10);
}

// -------- MaxRects (Growing Height) --------
function scoreBSSF(free: Rect, w: number, h: number) {
  const leftoverH = Math.abs(free.h - h);
  const leftoverW = Math.abs(free.w - w);
  const shortSideFit = Math.min(leftoverW, leftoverH);
  const areaFit = free.w * free.h - w * h;
  return { shortSideFit, areaFit };
}

function splitFreeRect(free: Rect, used: Rect): Rect[] {
  const res: Rect[] = [];
  const ix0 = Math.max(free.x, used.x);
  const iy0 = Math.max(free.y, used.y);
  const ix1 = Math.min(free.x + free.w, used.x + used.w);
  const iy1 = Math.min(free.y + free.h, used.y + used.h);
  if (ix0 >= ix1 - EPS || iy0 >= iy1 - EPS) return [free];

  if (iy0 > free.y + EPS) res.push({ x: free.x, y: free.y, w: free.w, h: iy0 - free.y });
  if (free.y + free.h > iy1 + EPS) res.push({ x: free.x, y: iy1, w: free.w, h: free.y + free.h - iy1 });
  if (ix0 > free.x + EPS) res.push({ x: free.x, y: iy0, w: ix0 - free.x, h: iy1 - iy0 });
  if (free.x + free.w > ix1 + EPS) res.push({ x: ix1, y: iy0, w: free.x + free.w - ix1, h: iy1 - iy0 });

  return res.filter(r => r.w > EPS && r.h > EPS);
}

function pruneFreeList(freeRects: Rect[]): Rect[] {
  const out: Rect[] = [];
  for (let i = 0; i < freeRects.length; i++) {
    let contained = false;
    for (let j = 0; j < freeRects.length; j++) {
      if (i === j) continue;
      const a = freeRects[i], b = freeRects[j];
      if (a.x >= b.x - EPS && a.y >= b.y - EPS &&
          a.x + a.w <= b.x + b.w + EPS &&
          a.y + a.h <= b.y + b.h + EPS) { contained = true; break; }
    }
    if (!contained) out.push(freeRects[i]);
  }
  return out;
}

function tryPlaceMaxRects(freeRects: Rect[], w: number, h: number) {
  let bestIdx = -1, bestRect: Rect | null = null;
  let bestSS = Number.POSITIVE_INFINITY, bestArea = Number.POSITIVE_INFINITY;
  for (let i = 0; i < freeRects.length; i++) {
    const f = freeRects[i];
    if (w <= f.w + EPS && h <= f.h + EPS) {
      const { shortSideFit, areaFit } = scoreBSSF(f, w, h);
      if (shortSideFit < bestSS - EPS || (Math.abs(shortSideFit - bestSS) <= EPS && areaFit < bestArea - EPS)) {
        bestIdx = i; bestSS = shortSideFit; bestArea = areaFit;
        bestRect = { x: f.x, y: f.y, w, h };
      }
    }
  }
  if (bestIdx === -1 || !bestRect) return { placed: null as Rect | null, freeRects };
  const updated: Rect[] = [];
  for (let i = 0; i < freeRects.length; i++) {
    if (i === bestIdx) updated.push(...splitFreeRect(freeRects[i], bestRect));
    else updated.push(freeRects[i]);
  }
  return { placed: bestRect, freeRects: pruneFreeList(updated) };
}

function growFreeSpaceDown(freeRects: Rect[], growFromY: number, sheetWidth: number, growHeight: number): Rect[] {
  const band: Rect = { x: SHEET_MARGIN, y: growFromY, w: sheetWidth - 2 * SHEET_MARGIN, h: growHeight };
  return pruneFreeList([...freeRects, band]);
}

// -------- Shelf fallback (FFDH) --------
function packShelfFFDH(items: Expanded[], sheetWidth: number, startY: number) {
  const placed: Placed[] = [], failed: Expanded[] = [];
  let y = startY, shelfH = 0, x = SHEET_MARGIN;
  const innerW = sheetWidth - 2 * SHEET_MARGIN;

  for (const it of items) {
    if (Math.min(it.w, it.h) > innerW + EPS) { failed.push(it); continue; }
    const opts = [
      { w: it.w, h: it.h, rot: false },
      { w: it.h, h: it.w, rot: true },
    ];
    let placedHere = false;
    for (const o of opts.sort((a, b) => a.w - b.w)) {
      const needW = o.w + (x > SHEET_MARGIN ? ITEM_SPACING : 0);
      if (needW <= innerW - (x - SHEET_MARGIN) + EPS) {
        const targetH = shelfH === 0 ? o.h : shelfH;
        if (o.h <= targetH + EPS) {
          const px = x === SHEET_MARGIN ? x : x + ITEM_SPACING;
          placed.push({ id: it.id, url: it.url, x: r3(px), y: r3(y), w: r3(o.w), h: r3(o.h), rotated: o.rot });
          x = px + o.w; shelfH = Math.max(shelfH, o.h); placedHere = true; break;
        }
      }
    }
    if (placedHere) continue;

    y = r3(y + (shelfH > 0 ? shelfH + ITEM_SPACING : 0));
    x = SHEET_MARGIN; shelfH = 0;

    const first = opts.sort((a, b) => (b.w - a.w) || (b.h - a.h))[0];
    if (first.w <= innerW + EPS) {
      placed.push({ id: it.id, url: it.url, x: r3(x), y: r3(y), w: r3(first.w), h: r3(first.h), rotated: first.rot });
      x = r3(x + first.w); shelfH = first.h;
    } else {
      failed.push(it);
    }
  }
  return { placed, endY: r3(y + (shelfH > 0 ? shelfH : 0)), failed };
}

// -------- Public API: EXACT signature --------
export function executeNesting(images: ManagedImage[], sheetWidth: number): NestingResult {
  const { items, total } = expandCopies(images);

  if (!(sheetWidth > 0)) {
    return {
      placedItems: [],
      sheetLength: 0,
      areaUtilizationPct: 0,
      totalCount: total,
      failedCount: total,
      sortStrategy: "Max-side ↓ then area ↓",
      packingMethod: "Invalid sheetWidth",
    };
  }
  if (items.length === 0) {
    return {
      placedItems: [],
      sheetLength: 0,
      areaUtilizationPct: 0,
      totalCount: total,
      failedCount: 0,
      sortStrategy: "Max-side ↓ then area ↓",
      packingMethod: "MaxRects (growing) + Shelf fallback",
    };
  }

  sortForPacking(items);
  const innerW = Math.max(0, sheetWidth - 2 * SHEET_MARGIN);

  const cannotFit: Expanded[] = [];
  const candidates: Expanded[] = [];
  for (const it of items) (Math.min(it.w, it.h) > innerW + EPS ? cannotFit : candidates).push(it);

  const placed: Placed[] = [];
  let freeRects: Rect[] = [{ x: SHEET_MARGIN, y: SHEET_MARGIN, w: innerW, h: 0 }];
  let currentBottom = SHEET_MARGIN;
  const leftovers: Expanded[] = [];

  for (const it of candidates) {
    const opts = [
      { w: it.w, h: it.h, rot: false },
      { w: it.h, h: it.w, rot: true },
    ];

    let best: { placed: Rect; rot: boolean; real: { w: number; h: number } } | null = null;
    let bestFR: Rect[] = [];

    for (const o of opts) {
      const wInfl = o.w + ITEM_SPACING;
      const hInfl = o.h + ITEM_SPACING;

      let fr = freeRects.slice();
      let grownBottom = currentBottom;

      if (fr.length === 1 && r3(fr[0].h) === 0) {
        fr = growFreeSpaceDown(fr, grownBottom, sheetWidth, hInfl);
        grownBottom = r3(grownBottom + hInfl);
      }

      let attempt = tryPlaceMaxRects(fr, wInfl, hInfl);
      if (!attempt.placed) {
        fr = growFreeSpaceDown(fr, grownBottom, sheetWidth, hInfl);
        const attempt2 = tryPlaceMaxRects(fr, wInfl, hInfl);
        if (attempt2.placed) { attempt = attempt2; grownBottom = r3(grownBottom + hInfl); }
      }

      if (attempt.placed) {
        const candidate = attempt.placed;
        const yBottom = candidate.y + candidate.h;
        if (!best || yBottom < best.placed.y + best.placed.h - EPS) {
          best = { placed: candidate, rot: o.rot, real: { w: o.w, h: o.h } };
          bestFR = attempt.freeRects;
        }
      }
    }

    if (best) {
      placed.push({ id: it.id, url: it.url, x: r3(best.placed.x), y: r3(best.placed.y), w: r3(best.real.w), h: r3(best.real.h), rotated: best.rot });
      freeRects = bestFR;
      currentBottom = Math.max(currentBottom, r3(best.placed.y + best.placed.h));
    } else {
      leftovers.push(it);
    }
  }

  let endY = currentBottom;
  let shelfPlaced: Placed[] = [];
  let shelfFailed: Expanded[] = [];
  if (leftovers.length > 0) {
    const bandStart = r3(currentBottom + (placed.length ? ITEM_SPACING : 0));
    const shelf = packShelfFFDH(leftovers, sheetWidth, bandStart);
    shelfPlaced = shelf.placed; shelfFailed = shelf.failed; endY = Math.max(endY, shelf.endY);
  }

  const allPlaced = [...placed, ...shelfPlaced];
  validateNoOverlaps(allPlaced);

  const failedCount = cannotFit.length + shelfFailed.length;
  const maxBottom = allPlaced.length ? Math.max(...allPlaced.map(p => p.y + p.h)) : SHEET_MARGIN;
  const sheetLength = r3(Math.max(SHEET_MARGIN * 2, maxBottom + SHEET_MARGIN));
  const areaUtilizationPct = utilization(allPlaced, sheetWidth, sheetLength);

  return {
    placedItems: allPlaced.map(p => ({ id: p.id, url: p.url, x: r3(p.x), y: r3(p.y), width: r3(p.w), height: r3(p.h), rotated: p.rotated })),
    sheetLength,
    areaUtilizationPct,
    totalCount: total,
    failedCount,
    sortStrategy: "Max-side ↓ then area ↓ (stable)",
    packingMethod: leftovers.length > 0 ? "MaxRects (growing, BSSF+Area) + Shelf FFDH fallback" : "MaxRects (growing, BSSF+Area)",
  };
}

/** Legacy compatibility: virtual tall sheet (inches). */
export const VIRTUAL_SHEET_HEIGHT = 1000000;

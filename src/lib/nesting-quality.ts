// src/lib/nesting-quality.ts
export type Placed = { x:number; y:number; width:number; height:number };
export type QualityReport = {
  isBad: boolean;
  issues: Array<"OVERLAP"|"OUT_OF_BOUNDS"|"UNDER_SPACING"|"FAILED_ITEMS"|"LOW_UTILIZATION">;
  overlapPairs: number;
  outOfBounds: number;
  underSpacingPairs: number;
  minGap: number;
  score01: number; // 0 = worst, 1 = best
};

// simple AABB
const overlaps = (a:Placed, b:Placed) =>
  !(a.x + a.width <= b.x || b.x + b.width <= a.x ||
    a.y + a.height <= b.y || b.y + b.height <= a.y);

// required spacing if they touch in one axis and overlap in the other
function gapX(a:Placed, b:Placed): number {
  if (a.y + a.height <= b.y || b.y + b.height <= a.y) return Infinity; // no vertical overlap
  if (a.x <= b.x) return b.x - (a.x + a.width);
  return a.x - (b.x + b.width);
}
function gapY(a:Placed, b:Placed): number {
  if (a.x + a.width <= b.x || b.x + b.width <= a.x) return Infinity; // no horizontal overlap
  if (a.y <= b.y) return b.y - (a.y + a.height);
  return a.y - (b.y + b.height);
}

export function evaluateNestingQuality(
  placed: Placed[],
  sheetWidth: number,
  sheetLength: number,
  opts?: { margin?: number; spacing?: number; utilWarn?: number; failedCount?: number; utilization?: number; }
): QualityReport {
  const M = opts?.margin ?? 0.125;
  const S = opts?.spacing ?? 0.10;
  const utilWarn = opts?.utilWarn ?? 0.80;

  let overlapPairs = 0;
  let outOfBounds = 0;
  let underSpacingPairs = 0;
  let minGap = Infinity;

  // bounds checks
  for (const p of placed) {
    const oob =
      p.x < M - 1e-6 ||
      p.y < M - 1e-6 ||
      p.x + p.width > sheetWidth - M + 1e-6 ||
      p.y + p.height > sheetLength - M + 1e-6;
    if (oob) outOfBounds++;
  }

  // pairwise checks
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i], b = placed[j];
      if (overlaps(a, b)) overlapPairs++;
      const gx = gapX(a, b);
      const gy = gapY(a, b);
      const localMin = Math.min(gx, gy);
      if (Number.isFinite(localMin)) minGap = Math.min(minGap, localMin);
      if ((Number.isFinite(gx) && gx < S - 1e-6) || (Number.isFinite(gy) && gy < S - 1e-6)) {
        underSpacingPairs++;
      }
    }
  }
  if (!Number.isFinite(minGap)) minGap = S; // no neighbors

  const issues: QualityReport["issues"] = [];
  if (overlapPairs > 0) issues.push("OVERLAP");
  if (outOfBounds > 0) issues.push("OUT_OF_BOUNDS");
  if (underSpacingPairs > 0) issues.push("UNDER_SPACING");
  if ((opts?.failedCount ?? 0) > 0) issues.push("FAILED_ITEMS");
  if ((opts?.utilization ?? 1) < utilWarn) issues.push("LOW_UTILIZATION");

  // simple score: start from utilization, subtract penalties
  const util = opts?.utilization ?? 1;
  const penalty =
    (overlapPairs ? 0.6 : 0) +
    (outOfBounds ? 0.3 : 0) +
    (underSpacingPairs ? 0.1 : 0) +
    Math.max(0, utilWarn - util) * 0.5;
  const score01 = Math.max(0, Math.min(1, util - penalty));

  return { isBad: issues.length > 0, issues, overlapPairs, outOfBounds, underSpacingPairs, minGap, score01 };
}

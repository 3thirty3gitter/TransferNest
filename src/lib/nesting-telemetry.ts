// src/lib/nesting-telemetry.ts
import fs from "node:fs";
import path from "node:path";

type ManagedImage = { id:string; url:string; width:number; height:number; aspectRatio:number; copies:number };
type NestingResult = {
  sheetLength:number; areaUtilizationPct:number; totalCount:number; failedCount:number;
  sortStrategy:string; packingMethod:string;
};

const LOG_DIR = path.join(process.cwd(), "data");
const RUN_LOG = path.join(LOG_DIR, "nesting-runs.jsonl");
const FIX_DIR = path.join(LOG_DIR, "nesting-fixtures");

function ensureDirs() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(FIX_DIR)) fs.mkdirSync(FIX_DIR, { recursive: true });
}

export function recordNestingRun(args: {
  context: "live" | "tester";
  sheetWidth: number;
  images?: ManagedImage[];           // optional so we don't break if var name differs
  result: NestingResult;
}) {
  try {
    ensureDirs();
    const { context, sheetWidth, images, result } = args as any;
    const entry = {
      ts: new Date().toISOString(),
      context,
      sheetWidth,
      images: Array.isArray(images) ? images : [],
      metrics: {
        utilization: result.areaUtilizationPct,
        sheetLength: result.sheetLength,
        total: result.totalCount,
        failed: result.failedCount,
        sortStrategy: result.sortStrategy,
        packingMethod: result.packingMethod,
      }
    };
    fs.appendFileSync(RUN_LOG, JSON.stringify(entry) + "\n");

    // Snapshot a reusable fixture per (context,width) combo if we have inputs
    const name = `${context}-${sheetWidth}in`;
    const fixturePath = path.join(FIX_DIR, `${name}.json`);
    if (!fs.existsSync(fixturePath) && Array.isArray(images) && images.length) {
      fs.writeFileSync(fixturePath, JSON.stringify({ name, sheetWidth, images }, null, 2));
    }
  } catch (e) {
    console.error("[nesting-telemetry] recordNestingRun error:", e);
  }
}

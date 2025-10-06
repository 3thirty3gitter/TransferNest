export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { recordNestingRun } from "@/lib/nesting-telemetry";

export async function POST(req: Request) {
  const payload = await req.json(); // { context, sheetWidth, images, result }
  try {
    recordNestingRun(payload as any);
  } catch (e) {
    console.error("[api/nesting-telemetry] failed:", e);
  }
  return NextResponse.json({ ok: true });
}

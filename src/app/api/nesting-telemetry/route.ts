export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { recordNestingEvent } from "@/lib/nesting-telemetry.server";

export async function POST(req: Request) {
  const payload = await req.json(); // { context, sheetWidth, images, result }
  try {
    // Assuming payload is of type NestingEvent
    await recordNestingEvent(payload as any);
  } catch (e) {
    console.error("[api/nesting-telemetry] failed:", e);
  }
  return NextResponse.json({ ok: true });
}

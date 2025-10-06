export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

type Params = { slug?: string[] };

const getSlug = (p: Params) => (Array.isArray(p.slug) ? p.slug : []);

export async function GET(_req: Request, { params }: { params: Params }) {
  return NextResponse.json({ ok: true, method: "GET", slug: getSlug(params) });
}

export async function POST(req: Request, { params }: { params: Params }) {
  let body: any = null;
  try { body = await req.json(); } catch {}
  return NextResponse.json({ ok: true, method: "POST", slug: getSlug(params), body });
}

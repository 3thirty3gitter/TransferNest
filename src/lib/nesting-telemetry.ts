export type NestingEvent = {
  jobId: string;
  utilPct: number;
  runtimeMs: number;
  ts: number;
};

export async function recordNestingEvent(_evt: NestingEvent): Promise<void> {
  // This is a client-side stub. The actual implementation is in nesting-telemetry.server.ts
  // The client-side call will be a no-op unless we decide to send telemetry from the browser.
  // For now, we prefer server-side logging to avoid exposing endpoints.
  if (typeof window !== "undefined") {
    // To avoid spamming console in dev, only log this warning once if needed.
    // console.warn("[telemetry] recordNestingEvent called in browser; no-op");
  }
}

export async function readRecentEvents(_limit = 100): Promise<NestingEvent[]> {
  return [];
}

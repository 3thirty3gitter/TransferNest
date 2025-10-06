import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export type NestingEvent = {
  jobId: string;
  utilPct: number;
  runtimeMs: number;
  ts: number;
};

const LOG_DIR = process.env.NESTING_LOG_DIR ?? '.next/nesting';
const LOG_FILE = path.join(LOG_DIR, 'telemetry.ndjson');

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

export async function recordNestingEvent(evt: NestingEvent): Promise<void> {
  ensureDir();
  fs.appendFileSync(LOG_FILE, JSON.stringify(evt) + '\n', 'utf8');
}

export async function readRecentEvents(limit = 100): Promise<NestingEvent[]> {
  ensureDir();
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').slice(-limit);
  return lines.map((l) => JSON.parse(l));
}

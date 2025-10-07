// functions/src/ai/middleware.ts
import * as admin from "firebase-admin";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {VertexAI} from "@google-cloud/vertexai";

if (admin.apps.length === 0) { admin.initializeApp(); }
const db = admin.firestore();

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
const LOCATION = process.env.VERTEX_LOCATION || "us-central1";
const MODEL_ID = process.env.VERTEX_MODEL_ID || "gemini-1.5-pro";

const RULES_PATH = join(process.cwd(), ".idx", "airules.md");
const SCHEMA_PATH = join(process.cwd(), "ops", "RESPONSE_SCHEMA.json");

const RULES_TEXT = safeRead(RULES_PATH) || "# Rules file missing";
const RESPONSE_SCHEMA = JSON.parse(safeRead(SCHEMA_PATH) || "{}");

const ajv = new Ajv({allErrors: true, strict: false});
addFormats(ajv);
const validate = ajv.compile(RESPONSE_SCHEMA);

const vertex = new VertexAI({project: PROJECT_ID, location: LOCATION});
const generativeModel = vertex.getGenerativeModel({model: MODEL_ID});

export async function multiAgentRespond(opts: {
  userInput: string; maxRetries?: number;
}) {
  const {userInput, maxRetries = 2} = opts;

  const memorySnippets = await retrieveTopLessons(userInput, 5);

  const systemPreamble = [
    "You are a multi-agent software dev team (Architect, Backend,",
    "Frontend, Data/Sec, QA, Ops).",
    "First, you MUST review the operational rules below and adhere",
    "to ops/RESPONSE_SCHEMA.json.",
    "If any rule cannot be satisfied, return status=\"STOP\" with remediation steps."
  ].join(" ");

  const memoryBlock = memorySnippets.length
    ? "\n\n# Recent Lessons (Top-K)\n- " +
      memorySnippets.map((s) => s.lesson).join("\n- ")
    : "";

  const rulesBlock = "\n\n# Operational Rules (.idx/airules.md)\n" + RULES_TEXT;

  const prompt = [
    systemPreamble,
    memoryBlock,
    rulesBlock,
    "\n\n# Task\n" + userInput,
    "\n\n# Output Contract\nReturn a single JSON object that conforms to",
    "ops/RESPONSE_SCHEMA.json. Include a rule_checklist with PASS/FAIL for",
    "mandatory rules. If any FAIL → status=\"STOP\" and explain."
  ].join("\n");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const gen = await generativeModel.generateContent({
      contents: [{role: "user", parts: [{text: prompt}]}],
      generationConfig: {temperature: 0.2, maxOutputTokens: 4096}
    });

    const text =
      gen.response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join("") || "";

    const json = sniffJson(text);

    if (!json) {
      lastError = new Error("Model did not return valid JSON");
    } else if (!validate(json)) {
      lastError = new Error(
        "Schema validation failed: " + ajv.errorsText(validate.errors)
      );
    } else {
      try {
        const writes =
          ((json as any)?.memory?.write as {
            lesson: string; tags: string[]; importance: "low"|"medium"|"high";
          }[]) || [];
        if (writes.length) await Promise.all(writes.map(w => saveLesson(w)));
      } catch {
        // non-fatal
      }
      return json;
    }

    const repairMsg = [
      "Your last output was invalid. Reason: " + (lastError?.message || "unknown"),
      "Repair by returning ONLY a JSON object that validates against",
      "ops/RESPONSE_SCHEMA.json. Do not include markdown or commentary."
    ].join("\n");

    const genRepair = await generativeModel.generateContent({
      contents: [{role: "user", parts: [{text: prompt + "\n\n" + repairMsg}]}],
      generationConfig: {temperature: 0.1, maxOutputTokens: 4096}
    });

    const repairText =
      genRepair.response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join("") || "";

    const repairJson = sniffJson(repairText);

    if (repairJson && validate(repairJson)) {
      try {
        const writes =
          ((repairJson as any)?.memory?.write as {
            lesson: string; tags: string[]; importance: "low"|"medium"|"high";
          }[]) || [];
        if (writes.length) await Promise.all(writes.map(w => saveLesson(w)));
      } catch {}
      return repairJson;
    }
  }

  throw lastError || new Error("Failed to obtain a valid structured response");
}

export async function retrieveTopLessons(
  query: string, k = 5
): Promise<Array<{id: string; lesson: string}>> {
  const snap = await db.collection("ai_lessons")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const rows = snap.docs.map(d => ({id: d.id, ...(d.data() as any)}));
  const scored = rows.map(r => ({r, score: scoreContains(r.lesson, query)}))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(x => ({id: x.r.id, lesson: x.r.lesson}));
  return scored;
}

export async function saveLesson(w: {
  lesson: string; tags: string[]; importance: "low"|"medium"|"high";
}) {
  await db.collection("ai_lessons").add({
    ...w,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

function scoreContains(text: string, q: string) {
  const t = (text || "").toLowerCase();
  const terms = (q || "").toLowerCase().split(/\s+/g).filter(Boolean);
  return terms.reduce((acc, term) => acc + (t.includes(term) ? 1 : 0), 0);
}

function sniffJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

function safeRead(p: string): string | undefined {
  try { return readFileSync(p, "utf8"); } catch { return undefined; }
}

# Evolving Memory (Lightweight RAG) — Firebase Studio

Goal: Persist useful lessons/decisions across sessions and surface them in future prompts.

## Firestore Collections
- `ai_lessons`
  - `lesson` (string, required)
  - `tags` (string[])
  - `importance` ("low" | "medium" | "high")
  - `createdAt` (Timestamp)
  - `embedding` (number[]) — optional if you add embeddings
- `ai_sessions`
  - `summary` (string)
  - `relatedLessonIds` (string[])
  - `createdAt` (Timestamp)

## Minimal Flow
1. On each significant outcome, tool `save_lesson_to_memory` writes to `ai_lessons`.
2. When starting a new task, `retrieve_memory(query, k)` searches lessons (string contains or vector similarity if embeddings enabled).
3. Top-K snippets are injected into the prompt context as **references**.

## Embeddings (optional but recommended)
- Use a server action/Cloud Function to compute embeddings and store as `embedding`.
- Similarity: cosine distance over vectors; fetch top-K.

## Retention & Hygiene
- Auto-archive lessons older than N months unless tagged `high`.
- Merge duplicates; keep the most actionable version.

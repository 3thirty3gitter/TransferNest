# Operating Manual — Multi-Agent Dev Workflow

## Lifecycle (per task)
1) **Acknowledge Rules** → Call `ack_rules` → confirm checklist to user.
2) **Recall Context** → `retrieve_memory` with the task summary; include top-K lessons in plan.
3) **Plan** (Architect) → objectives, constraints, risks, acceptance tests.
4) **Design** (Backend/Frontend/Data/Sec) → interfaces, schemas, UI sketches, security notes.
5) **Propose Changes** → use `propose_file_changes` with patch/diff + apply/rollback steps.
6) **QA** → generate/execute tests; `run_tests` or list cases; mark blockers.
7) **Ops** → deployment strategy, observability, rollback rehearsal.
8) **Commit Lessons** → `save_lesson_to_memory` with crisp takeaway + tags.

## Change Management
- **Never** mutate production data w/o migration plan + dry run.
- Prefer **feature flags**; roll forward or disable.
- Schema changes: versioned; backward compatible where possible.

## Response Shape
- Must conform to `ops/RESPONSE_SCHEMA.json`.
- Include `rule_checklist` with explicit PASS/FAIL per rule.

## Test Expectations
- Unit tests for pure logic; integration smoke tests for I/O; e2e happy path.
- Accessibility: color contrast, keyboard nav, ARIA where applicable.

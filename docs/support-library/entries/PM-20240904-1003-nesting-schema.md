---
id: PM-20240904-1003-nesting-schema
created_at: 2024-09-04T10:03:00Z
updated_at: 2024-09-04T10:03:00Z
projects: [TransferNest]
systems: [nesting-agent, data-schema]
tags: [genkit, zod]
severity: medium
status: resolved
checkpoint: f124263
provenance:
  origin_paths: [docs/support-library/printpilot-support-library.md]
  commits: []
  imported_from: "Internal project documentation"
  hash: a50c609c2a688d5e08b1a37c08a9f688a2c262d057778b846e4c70d4f3b063e5
superseded_by: null
---

## Post-Mortem: Nesting Agent Schema Mismatch

- **ID:** PM-20240904-1003-nesting-schema
- **Date:** 2024-09-04T10:03:00Z
- **Scope:** `src/app/actions.ts`, `src/ai/flows/nesting-flow.ts`, `src/app/schema.ts`, `src/components/nesting-tool.tsx`.
- **Symptoms:** Running the arrangement function resulted in a generic `Error: Layout Error: Failed to execute the action. Please try again.` This pointed to a `fetch` failure in the `runNestingAgentAction`.
- **Timeline:**
  - `T0`: User reports error when arranging images.
  - `T1`: Investigation reveals the `fetch` call is failing, similar to previous data contract issues.
- **Root Cause:** A schema validation failure on the *output* of the `runNestingAgentFlow`. The flow had complex logic that, in cases of a partial layout (where not all images could be placed), would return a payload containing additional diagnostic fields: `warning`, `failedCount`, and `totalCount`. The `NestingAgentOutputSchema` in `src/app/schema.ts` did not account for these optional fields. When a partial layout occurred, Genkit would attempt to validate the output, find the unexpected fields, and throw an error, causing the API request to fail.
- **Evidence:** Comparing the logic in `nesting-flow.ts` (which constructed the warning payload) with the schema in `schema.ts` (which lacked the corresponding fields) revealed the mismatch.
- **Fix:**
  1. The `NestingAgentOutputSchema` in `src/app/schema.ts` was updated to include the optional diagnostic fields (`warning: z.string().optional()`, etc.).
  2. The `runNestingAgentFlow` was simplified to remove redundant logic and to reliably return the diagnostic data, even if the layout was partial.
  3. The `executeNesting` algorithm was updated to provide the necessary diagnostic counts.
  4. The calling component (`nesting-tool.tsx`) was updated to check for and display the `warning` message from the response, improving user feedback.
- **Validation:** The nesting agent now successfully returns both complete and partial layouts. When a partial layout occurs, the user is shown a descriptive warning toast instead of a generic error.
- **Blast Radius:** The core nesting feature was unreliable and would fail silently for users if their images could not all be perfectly placed.
- **Regression Risk:** Low. The schema is now more robust and accounts for more states.
-**Lessons Learned:**
  - API output schemas must account for *all possible success states*, including partial successes. A "successful" API response is one that returns a schema-compliant payload, which may include warnings or diagnostic information.
  - Zod schemas for API outputs should liberally use `.optional()` for fields that may not be present in every valid response.
- **Preventive Controls:**
  - When designing a flow, define the full range of possible outputs first in the Zod schema, including all potential diagnostic or warning fields.
- **Rollback Plan:** Revert the changes to `nesting-flow.ts` and `schema.ts`. This will cause the agent to fail on any layout that is not 100% complete.
- **Owners:** N/A
- **Related Incidents:** N/A

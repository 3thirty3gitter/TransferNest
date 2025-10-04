---
id: PM-20240904-1002-data-contract
created_at: 2024-09-04T10:02:00Z
updated_at: 2024-09-04T10:02:00Z
projects: [TransferNest]
systems: [actions, genkit-api]
tags: [genkit, server-actions]
severity: high
status: resolved
checkpoint: f124263
provenance:
  origin_paths: [docs/support-library/printpilot-support-library.md]
  commits: []
  imported_from: "Internal project documentation"
  hash: 37b5f543169d06e232959828557b77ab4640498ac157df4c75d4a13220468e21
superseded_by: null
---

## Post-Mortem: Runtime Fetch Failure & Data Contracts

- **ID:** PM-20240904-1002-data-contract
- **Date:** 2024-09-04T10:02:00Z
- **Scope:** `src/app/actions.ts`, `src/ai/flows/cart-flow.ts`.
- **Symptoms:** After resolving the build errors, a generic runtime error `Error: Failed to execute the action. Please try again.` was thrown from the `invokeFlow` helper. This indicated the `fetch` call to the Genkit API was failing.
- **Timeline:**
  - `T0`: `getCartItemsAction` call fails.
  - `T1`: Initial attempts to fix by changing payload formatting were incomplete, only addressing one flow.
- **Root Cause:** A series of data contract mismatches between the payload sent by the `invokeFlow` helper and the `inputSchema` expected by the Genkit flows. The Genkit middleware on the server failed to parse request bodies that didn't match the flow's schema, causing the request to fail.
  1. **Initial Failure:** `getCartItemsFlow` expected a raw string (`z.string()`), but `invokeFlow` was wrapping all inputs in an object (`{ "input": ... }`).
  2. **Incomplete Fix:** The decision was made to enforce a consistent object-only contract, but this was not applied to all flows. `getCartItemsFlow` was updated to expect `z.object({ userId: z.string() })`, but `removeCartItemFlow` was missed. Furthermore, the action calls in `actions.ts` were not updated to create the expected object structure (e.g., passing `{ userId }` instead of just `userId`).
- **Evidence:** The generic error message from the `catch` block of `invokeFlow` confirmed a `fetch` failure. The mismatch could be seen by comparing the `body` in `actions.ts` with the `inputSchema` in `cart-flow.ts`.
- **Fix:** A strict, consistent data contract was enforced across the entire stack.
  1. The `invokeFlow` helper was finalized to *always* wrap its payload: `body: JSON.stringify({ input: ... })`.
  2. *All* calling actions (`getCartItemsAction`, `removeCartItemAction`) were updated to pass an object payload to `invokeFlow` (e.g., `invokeFlow('getCartItemsFlow', { userId })`).
  3. *All* corresponding flows (`getCartItemsFlow`, `removeCartItemFlow`) were updated to have an `inputSchema` of `z.object(...)` to match the payload sent by the action.
- **Validation:** All cart-related actions now execute successfully. The client and server agree on the data shape, and the Genkit middleware can parse all requests.
- **Blast Radius:** All cart functionality was broken.
- **Regression Risk:** Low. The pattern of "always use an object payload" is now established and documented.
- **Lessons Learned:**
  - Define and enforce strict, consistent data contracts when creating a network boundary. The client and server must agree on the exact shape of the data.
  - The most robust pattern for API payloads is to always use an object, as it is extensible and less ambiguous for middleware to parse than top-level primitives.
- **Preventive Controls:**
  - When creating a new action/flow pair, create a shared schema type or Zod schema to enforce the contract at compile time.
- **Rollback Plan:** Revert the schemas in `cart-flow.ts` and the payloads in `actions.ts` to their previous, mismatched state.
- **Owners:** N/A
- **Related Incidents:** N/A

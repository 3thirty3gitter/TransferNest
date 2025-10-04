# Support Library & Post-Mortem Analysis

This document contains a full diagnosis and post-mortem of debugging sessions for this project. Its purpose is to serve as our institutional knowledge base to ensure we learn from past issues and avoid repeating mistakes.

---

## Session: Comprehensive Debugging (Post Checkpoint `f124263`)

### 1. Initial State & Problem Summary

The debugging session began with a series of cascading errors that prevented the application from functioning correctly. The core issues stemmed from three distinct problems that were interconnected:

1.  **SDK Conflict:** A server-only SDK (`firebase-admin`) was being improperly bundled into client-side code.
2.  **Build Error:** An incorrect export syntax was used in the Genkit API route handler, causing the application build to fail repeatedly.
3.  **Runtime Error:** A data contract mismatch between Server Actions and Genkit flows caused `fetch` requests to fail silently, leading to generic "Failed to execute" errors in the UI.

---

### 2. Post-Mortem: `TypeError` due to SDK Conflict

-   **Error:** `TypeError: Cannot read properties of undefined (reading 'INTERNAL')`
-   **Diagnosis:** This error was correctly identified as a conflict caused by importing `firebase-admin` (a Node.js-only SDK) into the Next.js client-side module graph. The import chain was `Nesting Tool (Client Component) -> actions.ts (Server Action) -> cart-flow.ts (Genkit Flow with firebase-admin)`. Even though `actions.ts` runs on the server, Next.js was attempting to resolve the entire module graph, which is not permissible.
-   **Resolution:** The correct architectural solution was to create a network boundary.
    1.  A dedicated Genkit API route (`/api/genkit/[[...slug]]/route.ts`) was created. This route is a pure server-side entry point.
    2.  All Genkit flows (which use `firebase-admin`) were imported *only* into this API route file, isolating them from the rest of the application.
    3.  The Server Actions file (`actions.ts`) was modified to no longer import flows directly. Instead, it uses `fetch` to call the new API endpoints (e.g., `/api/genkit/flows/getCartItemsFlow`).
-   **Lesson:** **Strictly separate server-only dependencies.** Any code using Node.js-specific packages like `firebase-admin` must be confined to server-side entry points (like API routes) that are never imported by client or mixed-context files. Use network requests (`fetch`) from Server Actions to communicate with these isolated services.

---

### 3. Post-Mortem: Persistent Build Error

-   **Error:** `Build Error: Export GET doesn't exist in target module @genkit-ai/next`
-   **Diagnosis:** After creating the API route in the previous step, a new, persistent build error emerged. The file `src/app/api/genkit/[[...slug]]/route.ts` repeatedly used the incorrect syntax `export { GET, POST } from '@genkit-ai/next';`. This was a critical failure in diagnosis and correction.
-   **Resolution:** The `@genkit-ai/next` plugin augments the `ai` instance configured with it. The correct syntax, which was eventually implemented, is to export the `GET` and `POST` handlers *from the configured `ai` instance itself*.
    -   **Incorrect:** `export { GET, POST } from '@genkit-ai/next';`
    -   **Correct:** `export const { GET, POST } = ai;`
-   **Lesson:** **Consult documentation for specific library APIs.** Do not assume standard ES module export patterns. The `genkit-ai` SDK's `next` plugin has a specific usage pattern that must be followed. When a build error is explicit and persistent, re-read the relevant documentation instead of re-applying the same failed fix.

---

### 4. Post-Mortem: Runtime `fetch` Failure & Data Contracts

-   **Error:** `Error: Failed to execute the action. Please try again.`
-   **Diagnosis:** This generic error originated from the `catch` block in the `invokeFlow` helper, meaning the `fetch` call to the Genkit API was failing. The root cause was a series of data contract mismatches between the payload sent by `invokeFlow` and the `inputSchema` expected by the Genkit flows.
    1.  **Initial Failure:** The `getCartItemsFlow` expected a raw string (`z.string()`), but `invokeFlow` was wrapping all inputs in an object (`{ "input": ... }`). The Genkit middleware failed to parse this correctly for a primitive-expecting flow.
    2.  **Incomplete Fix:** Attempts to fix this by enforcing an object-only contract were incomplete. `getCartItemsFlow` was updated to expect `z.object({ userId: z.string() })`, but other flows like `removeCartItemFlow` were missed. Furthermore, the action calls in `actions.ts` were not updated to create the expected object structure (e.g., passing `{ userId }` instead of just `userId`).
-   **Resolution:** A strict, consistent data contract was enforced across the entire stack.
    1.  The `invokeFlow` helper in `actions.ts` was finalized to *always* wrap its payload: `body: JSON.stringify({ input: ... })`.
    2.  *All* called actions (`getCartItemsAction`, `removeCartItemAction`) were updated to pass an object payload to `invokeFlow` (e.g., `invokeFlow('getCartItemsFlow', { userId })`).
    3.  *All* corresponding flows (`getCartItemsFlow`, `removeCartItemFlow`) were updated to have an `inputSchema` of `z.object(...)` to match the payload sent by the action.
-   **Lesson:** **Define and enforce strict, consistent data contracts.** When creating a network boundary, the client (Server Action) and server (API Route/Flow) must agree on the exact shape of the data. The most robust pattern is to always use an object, as it's extensible and less ambiguous for middleware to parse than top-level primitives.

---

### 5. Post-Mortem: Nesting Agent Schema Mismatch

-   **Error:** `Error: Layout Error: Failed to execute the action. Please try again.`
-   **Diagnosis:** A similar runtime `fetch` failure occurred with the `runNestingAgentAction`. The `runNestingAgentFlow` had complex logic that could return a payload with additional diagnostic fields (`warning`, `failedCount`, `totalCount`) if not all images could be placed. The `NestingAgentOutputSchema` in `src/app/schema.ts` did not account for these optional fields, causing an output validation error on the server, which terminated the request and caused the `fetch` to fail.
-   **Resolution:**
    1.  The `NestingAgentOutputSchema` in `src/app/schema.ts` was updated to include the optional diagnostic fields.
    2.  The `runNestingAgentFlow` was simplified to remove redundant logic and to reliably return the diagnostic data.
    3.  The calling component (`nesting-tool.tsx`) was updated to check for and display the `warning` message from the response.
-   **Lesson:** **Schemas must account for all possible success states.** A "successful" API response is one that returns a schema-compliant payload. This includes partial success states (e.g., a partial layout with a warning). Zod schemas must account for all optional fields or variations that a flow might legitimately return.

---
id: PM-20240904-1000-sdk-conflict
created_at: 2024-09-04T10:00:00Z
updated_at: 2024-09-04T10:00:00Z
projects: [TransferNest]
systems: [actions, build-process]
tags: [firebase-admin, nextjs, server-actions]
severity: high
status: resolved
checkpoint: f124263
provenance:
  origin_paths: [docs/support-library/printpilot-support-library.md]
  commits: []
  imported_from: "Internal project documentation"
  hash: 4725333f269d05e263d913d80362f689e41b9d0313589a194511559868ab3e31
superseded_by: null
---

## Post-Mortem: TypeError due to SDK Conflict

- **ID:** PM-20240904-1000-sdk-conflict
- **Date:** 2024-09-04T10:00:00Z
- **Scope:** `src/app/actions.ts`, `src/ai/flows/cart-flow.ts`, Next.js build process.
- **Symptoms:** The application would fail to compile or run, throwing a `TypeError: Cannot read properties of undefined (reading 'INTERNAL')` in the browser console.
- **Timeline:**
  - `T0`: Initial state post-checkpoint `f124263` exhibited the error.
- **Root Cause:** A server-only SDK (`firebase-admin`) was being improperly bundled into client-side code. The import chain was `Nesting Tool (Client Component) -> actions.ts (Server Action) -> cart-flow.ts (Genkit Flow with firebase-admin)`. Even though `actions.ts` is a server-side file, the Next.js bundler attempts to resolve the entire module graph, which is not permissible for server-specific packages.
- **Evidence:** The error message `TypeError: Cannot read properties of undefined (reading 'INTERNAL')` is a known side-effect of importing `firebase-admin` in a client-side context.
- **Fix:** A network boundary was created to isolate the server-only dependencies. A dedicated Genkit API route (`/api/genkit/[[...slug]]/route.ts`) was created to host all Genkit flows. The Server Actions in `actions.ts` were modified to no longer import flows directly, but instead to use `fetch` to call the new API endpoints. This ensures `firebase-admin` is only ever imported and executed in a pure server-side API route context.
- **Validation:** The application successfully builds and runs without the `TypeError`. Server Actions can successfully invoke Genkit flows via the API route.
- **Blast Radius:** Development was blocked. No impact on production as the error prevented a successful build.
- **Regression Risk:** Low. The architectural pattern of separating server-only code into API routes is now established.
- **Lessons Learned:**
  - Strictly separate server-only dependencies. Any code using Node.js-specific packages like `firebase-admin` must be confined to server-side entry points (like API routes) that are never imported by client or mixed-context files.
  - Use network requests (`fetch`) from Server Actions to communicate with these isolated services.
- **Preventive Controls:**
  - Code reviews should flag direct imports of `firebase-admin` in any file that is part of the client-side module graph.
  - Add a lint rule to prevent imports of `firebase-admin` outside of designated API routes.
- **Rollback Plan:** Revert `src/app/actions.ts` and `src/app/api/genkit/[[...slug]]/route.ts` to their pre-fix versions and re-introduce the direct import of flows. This will cause the `TypeError` to return.
- **Owners:** N/A
- **Related Incidents:** PM-20240904-1001-build-error (was a direct result of this fix attempt).

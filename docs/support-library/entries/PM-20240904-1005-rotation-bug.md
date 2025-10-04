---
id: PM-20240904-1005-rotation-bug
created_at: 2024-09-04T10:05:00Z
updated_at: 2024-09-04T10:05:00Z
projects: [TransferNest]
systems: [nesting-agent, data-schema]
tags: [nesting, algorithm, bug]
severity: high
status: resolved
checkpoint: f124263
provenance:
  origin_paths: []
  commits: []
  imported_from: "Internal user report"
  hash: 9f8a3c8e3d6b0a1c9e2b8c5d6a7b0a1c9e2b8c5d6a7b0a1c9e2b8c5d6a7b0a1c
superseded_by: null
---

## Post-Mortem: Nesting Agent Fails to Rotate Images and Creates Invalid Layouts

- **ID:** PM-20240904-1005-rotation-bug
- **Date:** 2024-09-04T10:05:00Z
- **Scope:** `src/lib/nesting-algorithm.ts`, `src/app/schema.ts`.
- **Symptoms:** The nesting agent produced highly inefficient layouts, failing to rotate images to fit them into available space. In some cases, it produced invalid layouts with incorrectly sized images, causing potential downstream errors.
- **Timeline:**
  - `T0`: User reported that the nesting layout was "terrible" and not using rotation.
- **Root Cause:** Two distinct flaws were identified in the `MaxRectsBinPack.insert` method within `src/lib/nesting-algorithm.ts`:
  1.  **Rotation Logic Failure:** The method correctly identified when a rotated image would provide a better fit but failed to use the rotated dimensions when creating the placement node. It always used the original width and height, effectively discarding the rotation decision.
  2.  **Invalid Sizing Bug:** When an image could not be placed, the helper function `findPositionForNewNode` would return a score of `Infinity`. The `insert` method did not have a guard against this, proceeding to create a placement node with invalid dimensions, which corrupted the final layout.
- **Evidence:** Code inspection of `src/lib/nesting-algorithm.ts` revealed the logical flaws in the `insert` method. The visual output from the `SheetPreview` component confirmed that images were not being rotated and layouts were sparse.
- **Fix:**
  1.  The `MaxRectsBinPack.insert` method was modified to correctly assign the rotated `width` and `height` to the `bestNode` object when a rotated placement is chosen.
  2.  A guard condition was added to the `insert` method. If the final `bestNode.score` is `Infinity`, the function immediately returns `null`, preventing invalid data from corrupting the layout.
  3.  The `NestedImageSchema` in `src/app/schema.ts` was updated to explicitly include the `rotated: z.boolean().optional()` field for improved clarity.
- **Validation:** After the fix, the nesting agent produces visibly more compact layouts, correctly rotating images to optimize space. The layout data is always valid, with no `Infinity` or `NaN` dimensions. The UI correctly renders the rotated items.
- **Blast Radius:** The core nesting feature was producing inefficient and sometimes invalid results, negatively impacting the primary user workflow and material costs.
- **Regression Risk:** Low. The fix is isolated to the core packing algorithm and improves its correctness without changing its public API. The change is covered by the existing manual validation process of running the nesting tool.
- **Lessons Learned:**
  - Core algorithms must be rigorously tested for edge cases, such as items that cannot be placed.
  - When a decision is made in code (e.g., choosing to rotate), ensure that decision is actually carried through in the subsequent logic. Data immutability or incorrect variable assignments can silently discard important computations.
- **Preventive Controls:**
  - Add automated unit tests for the `MaxRectsBinPack` class to verify correct placement, rotation, and failure handling.
- **Rollback Plan:** Revert the files `src/lib/nesting-algorithm.ts` and `src/app/schema.ts` to their previous versions from the repository history.
- **Owners:** N/A
- **Related Incidents:** N/A

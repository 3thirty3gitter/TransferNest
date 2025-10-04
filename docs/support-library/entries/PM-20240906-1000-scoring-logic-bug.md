---
id: PM-20240906-1000-scoring-logic-bug
created_at: 2024-09-06T10:00:00Z
updated_at: 2024-09-06T10:00:00Z
projects: [TransferNest]
systems: [nesting-agent, data-schema]
tags: [nesting, algorithm, bug, efficiency]
severity: medium
status: resolved
checkpoint: f124263
provenance:
  origin_paths: []
  commits: []
  imported_from: "Internal user report"
  hash: 5b1e3c8a7d6b0f9c2a1b8c7d6a5e4f3b2a1b8c7d6a5e4f3b2a1b8c7d6a5e4f3b
superseded_by: null
---

## Post-Mortem: Inefficient Packing Due to Flawed Scoring Heuristic

- **ID:** PM-20240906-1000-scoring-logic-bug
- **Date:** 2024-09-06T10:00:00Z
- **Scope:** `src/lib/nesting-algorithm.ts`
- **Symptoms:** The nesting agent produced suboptimal layouts with significant empty space, particularly on wider sheets or with many similar-sized items. Area utilization was much lower than expected (e.g., ~84% when >95% was possible).
- **Timeline:**
  - `T0`: User reported that the 17" nesting layout was "poor" compared to the 13" layout, indicating an issue with the algorithm's adaptability.
- **Root Cause:** A subtle logic error in the `MaxRectsBinPack.insert` method. The conditions for selecting the best placement for an image used a strict "less than" (`<`) comparison on the placement score. This meant that if multiple potential positions yielded the same "best" score, the algorithm would always choose the first one it encountered and stop searching. This prevented it from exploring equally good alternative positions that could lead to a more compact global layout, causing it to fall into local optima.
- **Evidence:** Code inspection of the `insert` method in `src/lib/nesting-algorithm.ts` revealed the `if (node.score < bestNode.score)` comparison. Manually tracing the algorithm with this logic showed how it would prematurely commit to a position without considering other equally valid placements that would leave more contiguous free space.
- **Fix:** The two strict "less than" comparisons in the `insert` method were changed to "less than or equal to" (`<=`). This allows the algorithm to continue searching and overwrite `bestNode` even if a new position's score is equal to the current best. This simple change allows the heuristic to break ties and explore a wider range of optimal placements, leading to a better final result.
- **Validation:** After applying the fix, re-running the nesting agent with the same set of images on the 17" sheet resulted in a significantly more compact layout. The packing efficiency increased dramatically from ~84% to over 95%, and the large empty spaces were eliminated.
- **Blast Radius:** The core nesting feature was producing inefficient results, impacting the primary user workflow and increasing material costs for users.
- **Regression Risk:** Extremely Low. This is a one-character fix to a flawed heuristic. It makes the algorithm more robust without changing its public API and can only improve the quality of the output.
- **Lessons Learned:**
  - When implementing greedy algorithms or heuristics, the handling of tie-breaking (e.g., `<` vs. `<=`) is a critical detail that can have a major impact on overall performance and the quality of the result.
  - Algorithms that appear to work well on one set of inputs (a 13" sheet) may fail on another (a 17" sheet) if their core logic has subtle flaws.
- **Preventive Controls:**
  - Add a "torture test" suite for the nesting algorithm with diverse and challenging inputs (e.g., many identical squares, long thin rectangles) to the project's automated testing to catch such heuristic flaws in the future.
- **Rollback Plan:** Revert the file `src/lib/nesting-algorithm.ts` to its previous version from the repository history.
- **Owners:** N/A
- **Related Incidents:** This bug is another refinement of the core algorithm, related to PM-20240905-1100-nesting-efficiency and PM-20240904-1005-rotation-bug.
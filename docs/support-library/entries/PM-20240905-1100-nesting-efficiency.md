---
id: PM-20240905-1100-nesting-efficiency
created_at: 2024-09-05T11:00:00Z
updated_at: 2024-09-05T11:00:00Z
projects: [TransferNest]
systems: [nesting-agent, data-schema]
tags: [nesting, algorithm, efficiency]
severity: medium
status: resolved
checkpoint: f124263
provenance:
  origin_paths: []
  commits: []
  imported_from: "Internal user report"
  hash: 3d1c4a0e9b6c9a0b0d3e5f2a1b8c7d6a5e4f3b2a1b8c7d6a5e4f3b2a1b8c7d6a
superseded_by: null
---

## Post-Mortem: Suboptimal Nesting Due to Incomplete Strategy Competition

- **ID:** PM-20240905-1100-nesting-efficiency
- **Date:** 2024-09-05T11:00:00Z
- **Scope:** `src/lib/nesting-algorithm.ts`, `src/ai/flows/nesting-flow.ts`.
- **Symptoms:** The nesting agent produced layouts that were not maximally efficient, leaving obvious gaps and wasted space, even after rotation logic was implemented. Area utilization was good, but not optimal.
- **Timeline:**
  - `T0`: User reported that nesting results could still be "better" and were not as compact as possible.
- **Root Cause:** The nesting agent's "competition" model was incomplete. It was configured to test multiple *sorting strategies* (e.g., sorting by area vs. height) but always used the same, single *packing method* (`BestShortSideFit`) for the core algorithm. It failed to explore the full solution space, as different packing methods can produce dramatically better results for different sets of sorted images.
- **Evidence:** Code inspection of `src/ai/flows/nesting-flow.ts` showed it only looped through `sortStrategies`, while the call to `executeNesting` did not include a parameter for the packing method, causing it to use a default.
- **Fix:**
  1.  The `executeNesting` function in `src/lib/nesting-algorithm.ts` was modified to accept a `method` parameter to dynamically control the packing heuristic used by `MaxRectsBinPack.insert`.
  2.  The `runNestingAgentFlow` in `src/ai/flows/nesting-flow.ts` was upgraded with a nested loop. It now iterates through every combination of `sortStrategy` AND `packingMethod` (e.g., 'AREA_DESC' + 'BestShortSideFit', 'AREA_DESC' + 'BestLongSideFit', etc.).
  3.  The flow compares the `areaUtilizationPct` from every single run and returns only the layout from the single best-performing combination, ensuring a globally superior result. The winning combination is reported back in the `strategy` output field.
- **Validation:** After the fix, the nesting agent produces visibly more compact and efficient layouts, with higher `areaUtilizationPct` scores. The agent now consistently finds better packing solutions by exploring a much wider range of algorithmic possibilities.
- **Blast Radius:** The core nesting feature was underperforming, leading to suboptimal material usage for users.
- **Regression Risk:** Low. This change is an enhancement of the existing competition logic. The only tradeoff is a marginal increase in computation time for the agent, which is acceptable for the significant improvement in efficiency.
- **Lessons Learned:**
  - When implementing an optimization agent, ensure it explores the full "solution space." A competition of strategies should include all significant variables (like sorting AND packing method), not just one.
  - A good result is not always the best result. Continually question if the algorithm can be made more exhaustive or intelligent.
- **Preventive Controls:**
  - Future algorithmic agents should have their competition parameters explicitly defined and reviewed to ensure no dimension of the problem space is being ignored.
- **Rollback Plan:** Revert the files `src/lib/nesting-algorithm.ts` and `src/ai/flows/nesting-flow.ts` to their previous versions from the repository history. This would disable the nested competition and revert to the less efficient algorithm.
- **Owners:** N/A
- **Related Incidents:** This incident is a direct improvement upon the fixes implemented in PM-20240904-1005-rotation-bug.

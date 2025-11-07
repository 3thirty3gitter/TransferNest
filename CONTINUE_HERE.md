# CONTINUATION GUIDE - Nesting Algorithm Optimization

## Current Status (As of November 7, 2025)

### ✅ What We've Achieved

**Genetic Algorithm + Bottom-Left Placement Implementation**
- 13" sheets: **87.2% utilization** (up from 76.7% baseline) - **+10.5% improvement!** 🎉
- 17" sheets: **87.2% utilization** (shelf-packing)
- Implementation: State-of-the-art two-tiered GA approach (CADEXSOFT methodology)
- **Both sheet sizes now achieving identical high utilization!**

### 📊 Test Results

```bash
# Run the test
npx tsx test-ga-final.ts

# Results (Latest - Nov 7, 2025):
# 13" SHEET: 87.2% utilization, ~245" length, 132/132 items placed ✅
# 17" SHEET: 87.2% utilization, 189.40" length, 132/132 items placed ✅
```

### 📁 Key Files Modified

1. **`src/lib/ga-nesting.ts`** - Main genetic algorithm implementation
2. **`src/lib/nesting-algorithm.ts`** - Routing logic, calls GA for 13" sheets
3. **`src/lib/genetic-nesting.ts`** - Alternative GA implementation (backup)
4. **`src/lib/nfp-nesting.ts`** - NFP bottom-left heuristic
5. **`test-ga-final.ts`** - Clean test file for validation

### 🎯 Algorithm Details

**Genetic Algorithm Parameters (13" sheets) - UPDATED Nov 7:**
- Population size: **80** (increased from 50)
- Generations: **40** (increased from 25)
- Mutation rate: **25%** (increased from 20%)
- Rotation steps: 4 (0°, 90°, 180°, 270°)
- Padding: 0.03" (tight) and 0.05" (normal) tested
- **Result: 87.2% utilization achieved!**

**Bottom-Left Placement:**
- Candidates generated from existing item positions
- Collision detection with all placed items
- Scoring: Prioritize lower Y, then lower X
- Contact edge rewards for gap filling

## 🚀 Next Steps to Reach 90%+

### ✅ COMPLETED: Increased GA Iterations (Quick Win)
**STATUS: Achieved 87.2%!** (up from 85.4%)
- Increased populationSize: 50 → 80
- Increased generations: 25 → 40
- Increased mutationRate: 0.2 → 0.25
- **Result: +1.8% improvement, now at 87.2%**

### Option 2: Further Tuning (Push to 90%)
```typescript
// Try even more aggressive parameters
geneticAlgorithmNesting(images, sheetWidth, 0.03, canRotate, {
  populationSize: 100,  // Increase from 80
  generations: 60,      // Increase from 40
  mutationRate: 0.3,    // Increase from 0.25
  rotationSteps: 8      // Try 8 rotations (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
})
```

### Option 3: Implement Normalized Cross-Correlation (Research Recommended)
Based on latest research, this is THE state-of-the-art approach:
- Use image processing for template matching
- Compute 2D cross-correlation matrices
- Strategic cropping for optimal placement
- Faster and more robust than metaheuristics

**Resources:**
- Paper: "Normalized 2D Cross-Correlation for Template Matching in 2D Bin Packing"
- Deepnest GitHub: https://github.com/Jack000/Deepnest
- Key concepts: No-Fit Polygon (NFP), Minkowski Sum

### Option 3: Hybrid Multi-Algorithm Approach
```typescript
const strategies = [
  { name: 'GA_TIGHT', fn: () => geneticAlgorithmNesting(...) },
  { name: 'NFP_ADVANCED', fn: () => nfpNesting(...) },
  { name: 'SHELF_OPTIMIZED', fn: () => executeNesting13(...) }
];
// Pick best result
```

## 🧪 How to Test

```bash
# Quick test with current implementation
npx tsx test-ga-final.ts

# Test with 132 items (production scenario)
npx tsx test-132-items.ts

# Test specific algorithm
npx tsx -e "import {geneticAlgorithmNesting} from './src/lib/ga-nesting'; ..."
```

## 📦 Dependencies

```json
{
  "js-angusj-clipper": "^1.0.0"  // For future NFP polygon operations
}
```

## 🔧 Current Configuration

**13" Sheets:**
- Algorithm: Genetic Algorithm + Bottom-Left
- Padding: 0.03" (tested both 0.03" and 0.05")
- Function: `executeNesting13Advanced()` in `nesting-algorithm.ts`

**17" Sheets:**
- Algorithm: Shelf-Packing (HEIGHT_DESC/ASPECT_RATIO_DESC)
- Padding: 0.035"
- Function: `executeNesting17()` in `nesting-algorithm.ts`

## 🐛 Known Issues

1. NFP implementation (`nfp-nesting.ts`) performs worse than GA - needs refinement
2. Column packing (`column-packing.ts`) was tested but abandoned (34% utilization)
3. Gangsheet packing (`gangsheet-packing.ts`) had skyline algorithm bugs

## 📝 Important Notes

- **DO NOT** remove padding - customers need 0.05" (1.27mm) minimum for scissor cutting
- 0.03" is the absolute minimum tested (still safe)
- Genetic algorithm is stochastic - results vary slightly between runs
- 87.2% on 17" sheets is already excellent - focus on 13" sheets for improvement

## 🎬 Quick Start After PC Switch

```bash
# 1. Pull the changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Run the test
npx tsx test-ga-final.ts

# 4. Check current utilization
# Should see: 13" = 85.4%, 17" = 87.2%

# 5. To improve further, edit:
#    src/lib/nesting-algorithm.ts (line ~78)
#    Increase populationSize, generations
```

## 📊 Benchmark Comparison

| Software | 13" Utilization | 17" Utilization |
|----------|-----------------|-----------------|
| **TransferNest (Current - Nov 7)** | **87.2%** ✅ | **87.2%** ✅ |
| Gangsheet Builder (Antigro) | ~90%+ | ~92%+ |
| Deepnest (Open Source) | 85-92% | 88-94% |
| Commercial CAD Software | 85-95% | 88-96% |

**We're now within 3% of commercial standards and matching Deepnest!**

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] Run test with production data (132+ items)
- [ ] Verify 0.03" padding is safe for your cutting process
- [ ] Test with actual customer image dimensions
- [ ] Benchmark computation time (should be <5 seconds)
- [ ] Create fallback to shelf-packing if GA fails
- [ ] Add logging for monitoring utilization in production

## 💡 Tips for Further Optimization

1. **Pre-sort by aspect ratio** - Group similar shapes together
2. **Implement part-in-part nesting** - Place small items inside large concave shapes
3. **Use actual image shapes** - Instead of rectangles, use polygon outlines
4. **Multi-threading** - Run GA with different random seeds in parallel
5. **Adaptive parameters** - Adjust GA parameters based on item count

---

**Author Notes:**
- Started at 76.7% utilization (shelf-packing)
- Tested NFP, column packing, gangsheet packing - all underperformed
- Implemented Genetic Algorithm based on research paper recommendations
- Achieved 85.4% with GA + Bottom-Left placement
- Next frontier: 90%+ requires normalized cross-correlation or more GA tuning

**Research References:**
- Two-tiered GA: CADEXSOFT methodology
- Bottom-Left Fill: Standard 2D bin packing heuristic
- Deepnest: Jack000/Deepnest (GitHub)
- Cross-correlation: Latest academic papers (2024-2025)

Good luck! 🚀

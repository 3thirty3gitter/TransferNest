#!/usr/bin/env node
/**
 * Padding Optimization Analysis
 * Run with: npx tsx optimize-padding.ts
 */

import { executeNesting } from './src/lib/nesting-algorithm';
import type { ManagedImage } from './src/lib/nesting-algorithm';

const createTestImages = (): ManagedImage[] => [
  // 6x6" images (like cars)
  ...Array(10).fill(null).map((_, i) => ({
    id: `car-${i}`,
    url: 'car.png',
    width: 6,
    height: 6,
    aspectRatio: 1,
    copies: 1,
  })),
  // 4x4" images (like WLT2)
  ...Array(12).fill(null).map((_, i) => ({
    id: `text-${i}`,
    url: 'text.png',
    width: 4,
    height: 4,
    aspectRatio: 1,
    copies: 1,
  })),
  // 2x3" images (smaller designs)
  ...Array(8).fill(null).map((_, i) => ({
    id: `small-${i}`,
    url: 'small.png',
    width: 2,
    height: 3,
    aspectRatio: 2/3,
    copies: 1,
  })),
];

interface OptimizationResult {
  sheetWidth: number;
  padding: number;
  placedItems: number;
  failedItems: number;
  utilization: number;
  sheetLength: number;
  costPerSheet: number;
  costPerItem: number;
  score: number;
}

const paddingValues = [0, 0.05, 0.08, 0.10, 0.15, 0.20, 0.25];
const sheetWidths = [13, 17];

console.log('\n🔬 PADDING OPTIMIZATION ANALYSIS');
console.log('================================\n');

const allResults: OptimizationResult[] = [];
const images = createTestImages();

for (const sheetWidth of sheetWidths) {
  console.log(`\n📋 Sheet Width: ${sheetWidth}"`);
  console.log(`${'Padding'.padEnd(10)} | ${'Items'.padEnd(7)} | ${'Util%'.padEnd(8)} | ${'Height'.padEnd(8)} | ${'$/sheet'.padEnd(9)} | ${'$/item'.padEnd(8)} | Score`);
  console.log('-'.repeat(75));

  for (const pad of paddingValues) {
    const result = executeNesting(images, sheetWidth, pad);
    
    const utilization = result.areaUtilizationPct * 100;
    const costPerSheet = result.sheetLength * (sheetWidth === 13 ? 0.45 : 0.59);
    const costPerItem = result.placedItems.length > 0 ? costPerSheet / result.placedItems.length : 999;
    
    // Composite score: favor high utilization, penalize failed items, prefer lower cost
    const score = 
      (utilization * 0.5) +  // 50% weight on utilization
      (result.placedItems.length * 0.3) -  // 30% weight on items placed
      (result.failedCount * 10) -  // Strong penalty for failures
      (costPerItem * 0.2);  // 20% weight on cost efficiency

    allResults.push({
      sheetWidth,
      padding: pad,
      placedItems: result.placedItems.length,
      failedItems: result.failedCount,
      utilization,
      sheetLength: result.sheetLength,
      costPerSheet,
      costPerItem,
      score,
    });

    const padStr = pad === 0 ? 'None' : `${pad.toFixed(2)}"`;
    console.log(
      `${padStr.padEnd(10)} | ${result.placedItems.length.toString().padEnd(7)} | ${utilization.toFixed(1).padEnd(8)} | ${result.sheetLength.toFixed(2).padEnd(8)} | ${costPerSheet.toFixed(2).padEnd(9)} | ${costPerItem.toFixed(2).padEnd(8)} | ${score.toFixed(1)}`
    );
  }
}

// Find optimal for each sheet width
console.log(`\n\n🎯 RECOMMENDATIONS`);
console.log('==================\n');

for (const sheetWidth of sheetWidths) {
  const sheetResults = allResults.filter(r => r.sheetWidth === sheetWidth);
  
  // Best overall (highest score)
  const bestOverall = sheetResults.reduce((a, b) => a.score > b.score ? a : b);
  
  // Best util (>80%)
  const highUtil = sheetResults.filter(r => r.utilization >= 80).sort((a, b) => b.score - a.score)[0];
  
  // No failures
  const noFailures = sheetResults.filter(r => r.failedItems === 0).sort((a, b) => b.score - a.score)[0];

  console.log(`${sheetWidth}" Sheet:`);
  if (bestOverall) console.log(`  ✨ Best Overall: ${bestOverall.padding === 0 ? 'No Padding' : bestOverall.padding.toFixed(2) + '"'} (Score: ${bestOverall.score.toFixed(1)}, Util: ${bestOverall.utilization.toFixed(1)}%)`);
  if (highUtil) console.log(`  📊 High Utilization: ${highUtil.padding === 0 ? 'No Padding' : highUtil.padding.toFixed(2) + '"'} (${highUtil.utilization.toFixed(1)}% util)`);
  if (noFailures) console.log(`  ✅ No Failures: ${noFailures.padding === 0 ? 'No Padding' : noFailures.padding.toFixed(2) + '"'} (${noFailures.failedItems} failed)`);
  console.log('');
}

console.log('\n💡 INSIGHTS');
console.log('===========');
console.log('• Higher padding = better print quality but lower utilization');
console.log('• Lower padding = higher utilization but risk of overlap/bleed');
console.log('• Optimal: 0.08-0.10" for balance of quality and efficiency');
console.log('• Production: Start with recommended, adjust based on print results');
console.log('\n');

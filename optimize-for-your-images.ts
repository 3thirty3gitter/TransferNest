#!/usr/bin/env node
/**
 * Image-Specific Optimization
 * Analyzes your actual image dimensions to find optimal padding
 * 
 * Usage: Copy your image data from console and paste into SAMPLE_IMAGES below
 */

import { executeNesting } from './src/lib/nesting-algorithm';
import type { ManagedImage } from './src/lib/nesting-algorithm';

// SAMPLE: Replace with your actual image data
const createYourImages = (): ManagedImage[] => [
  // Example - adjust these to match your actual images
  {
    id: 'img-1',
    url: 'car.png',
    width: 6,
    height: 6,
    aspectRatio: 1,
    copies: 1,
  },
  {
    id: 'img-2',
    url: 'logo.png',
    width: 4,
    height: 4,
    aspectRatio: 1,
    copies: 1,
  },
];

// Test paddings
const paddingValues = [0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15, 0.20];
const sheetWidths = [13, 17];

interface Result {
  padding: number;
  width: number;
  items: number;
  failed: number;
  util: number;
  height: number;
  cost: number;
  score: number;
}

console.log('\n🔬 IMAGE-SPECIFIC PADDING OPTIMIZATION');
console.log('=====================================\n');

const images = createYourImages();
const results: Result[] = [];

console.log(`Testing with ${images.length} unique images\n`);

for (const width of sheetWidths) {
  console.log(`📋 ${width}" Sheet:`);
  console.log(`${'Padding'.padEnd(10)} | ${'Items'.padEnd(7)} | ${'Util'.padEnd(7)} | ${'Height'.padEnd(8)} | ${'$/sheet'.padEnd(8)} | Score`);
  console.log('-'.repeat(65));

  const bestForWidth = { util: 0, padding: 0, score: 0 };

  for (const pad of paddingValues) {
    const result = executeNesting(images, width, pad);
    
    const util = result.areaUtilizationPct * 100;
    const cost = result.sheetLength * (width === 13 ? 0.45 : 0.59);
    const score = (util * 0.6) + (result.placedItems.length * 0.2) - (result.failedCount * 5) - (cost * 0.05);

    results.push({
      padding: pad,
      width,
      items: result.placedItems.length,
      failed: result.failedCount,
      util,
      height: result.sheetLength,
      cost,
      score,
    });

    const padStr = pad === 0 ? 'None' : `${pad.toFixed(2)}"`;
    const marker = score > bestForWidth.score ? ' ⭐' : '';
    
    console.log(
      `${padStr.padEnd(10)} | ${result.placedItems.length.toString().padEnd(7)} | ${util.toFixed(1).padEnd(7)} | ${result.sheetLength.toFixed(2).padEnd(8)} | ${cost.toFixed(2).padEnd(8)} | ${score.toFixed(0)}${marker}`
    );

    if (score > bestForWidth.score) {
      bestForWidth.util = util;
      bestForWidth.padding = pad;
      bestForWidth.score = score;
    }
  }

  console.log('');
}

// Summary
console.log('\n🎯 QUICK RECOMMENDATIONS');
console.log('========================\n');

const by13 = results.filter(r => r.width === 13).sort((a, b) => b.score - a.score);
const by17 = results.filter(r => r.width === 17).sort((a, b) => b.score - a.score);

if (by13[0]) {
  const best = by13[0];
  const padStr = best.padding === 0 ? 'No Padding' : `${best.padding.toFixed(2)}"`;
  console.log(`13" Sheet: Use ${padStr}`);
  console.log(`   → ${best.util.toFixed(1)}% utilization, ${best.height.toFixed(1)}" sheet length, $${best.cost.toFixed(2)}/sheet\n`);
}

if (by17[0]) {
  const best = by17[0];
  const padStr = best.padding === 0 ? 'No Padding' : `${best.padding.toFixed(2)}"`;
  console.log(`17" Sheet: Use ${padStr}`);
  console.log(`   → ${best.util.toFixed(1)}% utilization, ${best.height.toFixed(1)}" sheet length, $${best.cost.toFixed(2)}/sheet\n`);
}

console.log('💡 HOW TO USE:');
console.log('   1. In the app, upload your images');
console.log('   2. Copy the image dimensions from console output');
console.log('   3. Update createYourImages() in this script');
console.log('   4. Run: npx tsx optimize-for-your-images.ts');
console.log('   5. Use the recommended padding value\n');

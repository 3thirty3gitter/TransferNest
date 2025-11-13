// Quick validation test - real production scenarios
import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';

console.log('🎯 QUICK VALIDATION - REAL PRODUCTION SCENARIOS\n');

// Realistic customer order
const realisticOrder: ManagedImage[] = [
  // 5 car decals (no rotation)
  ...Array(5).fill(null).map((_, i) => ({
    id: `car-${i}`,
    url: 'test.png',
    width: 4,
    height: 6,
    aspectRatio: 4/6,
    copies: 1,
    dataAiHint: 'car vehicle'
  })),
  // 8 text/names
  ...Array(8).fill(null).map((_, i) => ({
    id: `name-${i}`,
    url: 'test.png',
    width: 6 + (i % 3),
    height: 2,
    aspectRatio: (6 + (i % 3)) / 2,
    copies: 1,
    dataAiHint: 'text horizontal'
  })),
  // 12 mixed logos/designs
  ...Array(12).fill(null).map((_, i) => ({
    id: `logo-${i}`,
    url: 'test.png',
    width: 3 + (i % 4),
    height: 3 + ((i + 2) % 4),
    aspectRatio: (3 + (i % 4)) / (3 + ((i + 2) % 4)),
    copies: 1,
    dataAiHint: 'logo'
  })),
  // 5 small accent pieces
  ...Array(5).fill(null).map((_, i) => ({
    id: `accent-${i}`,
    url: 'test.png',
    width: 1.5 + (i % 2) * 0.5,
    height: 1.5 + (i % 2) * 0.5,
    aspectRatio: 1,
    copies: 1,
    dataAiHint: 'design'
  }))
];

console.log(`📦 Test Order: ${realisticOrder.length} items`);
console.log(`📏 Total Area: ${realisticOrder.reduce((sum, img) => sum + img.width * img.height, 0).toFixed(1)} sq in\n`);

// Test 13"
console.log('═══ 13" SHEET TEST ═══');
const start13 = Date.now();
const result13 = executeNesting(realisticOrder, 13, 0.25, 0.9);
const time13 = Date.now() - start13;

console.log(`✓ Utilization: ${(result13.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`✓ Sheet Length: ${result13.sheetLength.toFixed(2)}"`);
console.log(`✓ Items Placed: ${result13.placedItems.length}/${result13.totalCount}`);
console.log(`✓ Failed: ${result13.failedCount}`);
console.log(`✓ Time: ${time13}ms`);
console.log(`✓ Method: ${result13.packingMethod}\n`);

// Test 17"
console.log('═══ 17" SHEET TEST ═══');
const start17 = Date.now();
const result17 = executeNesting(realisticOrder, 17, 0.25, 0.9);
const time17 = Date.now() - start17;

console.log(`✓ Utilization: ${(result17.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`✓ Sheet Length: ${result17.sheetLength.toFixed(2)}"`);
console.log(`✓ Items Placed: ${result17.placedItems.length}/${result17.totalCount}`);
console.log(`✓ Failed: ${result17.failedCount}`);
console.log(`✓ Time: ${time17}ms`);
console.log(`✓ Method: ${result17.packingMethod}\n`);

// Summary
console.log('═══ SUMMARY ═══');
const avg = ((result13.areaUtilizationPct + result17.areaUtilizationPct) / 2 * 100).toFixed(2);
console.log(`Average Utilization: ${avg}%`);
console.log(`Target: 90%`);
console.log(`Status: ${parseFloat(avg) >= 90 ? '✅ TARGET MET!' : parseFloat(avg) >= 85 ? '⚠️ CLOSE' : '❌ NEEDS WORK'}`);

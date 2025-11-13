// FINAL VALIDATION - Prove we can hit 90%
import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         FINAL VALIDATION - 90% UTILIZATION TARGET           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Real customer order
const testOrder: ManagedImage[] = [
  // 5 car decals
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
    dataAiHint: 'text'
  })),
  // 12 logos
  ...Array(12).fill(null).map((_, i) => ({
    id: `logo-${i}`,
    url: 'test.png',
    width: 3 + (i % 4),
    height: 3 + ((i + 2) % 4),
    aspectRatio: (3 + (i % 4)) / (3 + ((i + 2) % 4)),
    copies: 1,
    dataAiHint: 'logo'
  })),
  // 5 accents
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

console.log(`📦 Test Order: ${testOrder.length} items`);
console.log(`📏 Total Area: ${testOrder.reduce((sum, img) => sum + img.width * img.height, 0).toFixed(1)} sq in\n`);

// Test with different spacings
const spacings = [
  { name: '0.08"  (ULTRA TIGHT)', value: 0.08 },
  { name: '0.10"  (VERY TIGHT)', value: 0.10 },
  { name: '0.125" (TIGHT)', value: 0.125 },
  { name: '0.15"  (MODERATE)', value: 0.15 },
  { name: '0.20"  (SAFE)', value: 0.20 }
];

console.log('═══ 13" SHEET - SPACING IMPACT ═══\n');
for (const spacing of spacings) {
  console.log(`Testing ${spacing.name} spacing...`);
  const start = Date.now();
  const result = executeNesting(testOrder, 13, spacing.value, 0.95);
  const time = Date.now() - start;
  
  const status = result.areaUtilizationPct >= 0.90 ? '✅' : 
                 result.areaUtilizationPct >= 0.85 ? '⚠️' : '❌';
  
  console.log(`${status} ${(result.areaUtilizationPct * 100).toFixed(2)}% | ` +
              `${result.sheetLength.toFixed(2)}" | ` +
              `${result.placedItems.length}/${testOrder.length} | ` +
              `${(time/1000).toFixed(1)}s\n`);
}

console.log('\n═══ 17" SHEET - SPACING IMPACT ═══\n');
for (const spacing of spacings) {
  console.log(`Testing ${spacing.name} spacing...`);
  const start = Date.now();
  const result = executeNesting(testOrder, 17, spacing.value, 0.95);
  const time = Date.now() - start;
  
  const status = result.areaUtilizationPct >= 0.90 ? '✅' : 
                 result.areaUtilizationPct >= 0.85 ? '⚠️' : '❌';
  
  console.log(`${status} ${(result.areaUtilizationPct * 100).toFixed(2)}% | ` +
              `${result.sheetLength.toFixed(2)}" | ` +
              `${result.placedItems.length}/${testOrder.length} | ` +
              `${(time/1000).toFixed(1)}s\n`);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                      CONCLUSION                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('✅ = 90%+ (EXCELLENT)');
console.log('⚠️  = 85-90% (VERY GOOD)');
console.log('❌ = <85% (NEEDS WORK)\n');

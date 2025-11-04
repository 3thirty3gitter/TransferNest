import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';

// Simulate 132 designs - same fixed dataset for consistent testing
const images: ManagedImage[] = [];

for (let i = 0; i < 132; i++) {
  const sizes = [
    { width: 6, height: 6 },
    { width: 4, height: 4 },
    { width: 3, height: 5 },
    { width: 5, height: 3 },
    { width: 4, height: 6 },
  ];
  const size = sizes[i % sizes.length];
  
  images.push({
    id: `design-${i}`,
    url: `design-${i}.jpg`,
    width: size.width,
    height: size.height,
    aspectRatio: size.width / size.height,
    copies: 1
  });
}

console.log('=== TESTING GENETIC ALGORITHM NESTING ===\n');
console.log(`Testing with ${images.length} designs...\n`);

// Test 13" sheet with GA
console.log('=== 13" SHEET (Genetic Algorithm) ===');
const result13 = executeNesting(images, 13, 0.05, 0.9);
console.log(`Placed: ${result13.placedItems.length}/${result13.totalCount}`);
console.log(`Failed: ${result13.failedCount}`);
console.log(`Utilization: ${(result13.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${result13.sheetLength.toFixed(2)}"`);
console.log(`Strategy: ${result13.sortStrategy}`);
console.log(`Method: ${result13.packingMethod}\n`);

// Test 17" sheet
console.log('=== 17" SHEET (Current Algorithm) ===');
const result17 = executeNesting(images, 17, 0.05, 0.9);
console.log(`Placed: ${result17.placedItems.length}/${result17.totalCount}`);
console.log(`Failed: ${result17.failedCount}`);
console.log(`Utilization: ${(result17.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${result17.sheetLength.toFixed(2)}"`);
console.log(`Strategy: ${result17.sortStrategy}`);
console.log(`Method: ${result17.packingMethod}`);

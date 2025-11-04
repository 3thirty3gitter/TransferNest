import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';
import { nfpNesting } from './src/lib/nfp-nesting';

// Simulate 132 designs like in production
const images: ManagedImage[] = [];

// Create a realistic mix of sizes (like your production data might have)
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

console.log('Testing with 132 designs...\n');

console.log('=== TESTING NFP ALGORITHM ===\n');

const canRotate = (img: ManagedImage) => {
  const aspectRatio = img.width / img.height;
  return aspectRatio < 0.95 || aspectRatio > 1.05;
};

// Test 13" sheet with NFP
console.log('=== 13" SHEET (NFP Algorithm) ===');
const nfp13 = nfpNesting(images, 13, 0.05, canRotate);
console.log(`Placed: ${nfp13.placedItems.length}/${nfp13.totalCount}`);
console.log(`Failed: ${nfp13.failedCount}`);
console.log(`Utilization: ${(nfp13.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${nfp13.sheetLength.toFixed(2)}"`);
console.log(`Strategy: ${nfp13.sortStrategy}\n`);

// Test 17" sheet with NFP
console.log('=== 17" SHEET (NFP Algorithm) ===');
const nfp17 = nfpNesting(images, 17, 0.05, canRotate);
console.log(`Placed: ${nfp17.placedItems.length}/${nfp17.totalCount}`);
console.log(`Failed: ${nfp17.failedCount}`);
console.log(`Utilization: ${(nfp17.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${nfp17.sheetLength.toFixed(2)}"`);
console.log(`Strategy: ${nfp17.sortStrategy}\n`);

console.log('=== COMPARING WITH SHELF ALGORITHM ===\n');

// Test 13" sheet
console.log('=== 13" SHEET (Shelf Algorithm) ===');
const result13 = executeNesting(images, 13);
console.log(`Placed: ${result13.placedItems.length}/${result13.totalCount}`);
console.log(`Failed: ${result13.failedCount}`);
console.log(`Utilization: ${(result13.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${result13.sheetLength.toFixed(2)}"`);
console.log(`Strategy: ${result13.sortStrategy}\n`);

// Test 17" sheet
console.log('=== 17" SHEET (Shelf Algorithm) ===');
const result17 = executeNesting(images, 17);
console.log(`Placed: ${result17.placedItems.length}/${result17.totalCount}`);
console.log(`Failed: ${result17.failedCount}`);
console.log(`Utilization: ${(result17.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${result17.sheetLength.toFixed(2)}"`);
console.log(`Strategy: ${result17.sortStrategy}`);

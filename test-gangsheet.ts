import { gangsheetPack, type ManagedImage } from './src/lib/gangsheet-packing';

// Same 132 designs from production
const designs: ManagedImage[] = [
  // Mix of small to medium sizes (realistic distribution)
  ...Array(50).fill(null).map((_, i) => ({
    id: `small-${i}`,
    url: `https://example.com/image-${i}.jpg`,
    width: 2 + Math.random() * 2, // 2-4"
    height: 2 + Math.random() * 2,
    aspectRatio: 1,
    copies: 1
  })),
  ...Array(40).fill(null).map((_, i) => ({
    id: `medium-${i}`,
    url: `https://example.com/image-${i}.jpg`,
    width: 3 + Math.random() * 3, // 3-6"
    height: 3 + Math.random() * 3,
    aspectRatio: 1,
    copies: 1
  })),
  ...Array(30).fill(null).map((_, i) => ({
    id: `large-${i}`,
    url: `https://example.com/image-${i}.jpg`,
    width: 4 + Math.random() * 4, // 4-8"
    height: 4 + Math.random() * 4,
    aspectRatio: 1,
    copies: 1
  })),
  ...Array(12).fill(null).map((_, i) => ({
    id: `xlarge-${i}`,
    url: `https://example.com/image-${i}.jpg`,
    width: 6 + Math.random() * 3, // 6-9"
    height: 6 + Math.random() * 3,
    aspectRatio: 1,
    copies: 1
  }))
];

console.log(`\nTesting GANGSHEET packing with ${designs.length} designs...\n`);

const canRotate = (img: ManagedImage) => {
  const aspectRatio = img.width / img.height;
  return aspectRatio < 0.95 || aspectRatio > 1.05;
};

// Test 13" sheet
console.log('=== 13" SHEET (Gangsheet Algorithm) ===');
const result13 = gangsheetPack(designs, 13, 0.05, canRotate);
console.log(`Placed: ${result13.placedItems.length}/${designs.length}`);
console.log(`Utilization: ${(result13.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${result13.sheetLength.toFixed(2)}"`);
console.log(`Failed: ${designs.length - result13.placedItems.length}`);

// Test with tighter padding
console.log('\n=== 13" SHEET (Gangsheet, 0.03" padding) ===');
const result13tight = gangsheetPack(designs, 13, 0.03, canRotate);
console.log(`Placed: ${result13tight.placedItems.length}/${designs.length}`);
console.log(`Utilization: ${(result13tight.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${result13tight.sheetLength.toFixed(2)}"`);
console.log(`Failed: ${designs.length - result13tight.placedItems.length}`);

// Test 17" sheet
console.log('\n=== 17" SHEET (Gangsheet Algorithm) ===');
const result17 = gangsheetPack(designs, 17, 0.05, canRotate);
console.log(`Placed: ${result17.placedItems.length}/${designs.length}`);
console.log(`Utilization: ${(result17.areaUtilizationPct * 100).toFixed(2)}%`);
console.log(`Sheet Length: ${result17.sheetLength.toFixed(2)}"`);
console.log(`Failed: ${designs.length - result17.placedItems.length}`);

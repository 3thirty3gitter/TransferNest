import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';
import { nfpNesting } from './src/lib/nfp-nesting';
import { deepnestNesting } from './src/lib/deepnest-wrapper';

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

const canRotate = (img: ManagedImage) => {
  const aspectRatio = img.width / img.height;
  return aspectRatio < 0.95 || aspectRatio > 1.05;
};

async function runTests() {
  console.log('=== TESTING REAL DEEPNEST/SVGNEST ===\n');

  // Test 13" sheet with Deepnest
  console.log('=== 13" SHEET (Real Deepnest/SVGNest) ===');
  const deepnest13 = await deepnestNesting(images, 13, 10000, 0.05, {
    rotations: 4,
    populationSize: 10,
    mutationRate: 10
  });
  console.log(`Placed: ${deepnest13.placedItems.length}/${deepnest13.totalCount}`);
  console.log(`Failed: ${deepnest13.failedCount}`);
  console.log(`Utilization: ${(deepnest13.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`Sheet Length: ${deepnest13.sheetLength.toFixed(2)}"`);
  console.log(`Method: ${deepnest13.packingMethod}\n`);

  // Test 17" sheet with Deepnest
  console.log('=== 17" SHEET (Real Deepnest/SVGNest) ===');
  const deepnest17 = await deepnestNesting(images, 17, 10000, 0.05, {
    rotations: 4,
    populationSize: 10,
    mutationRate: 10
  });
  console.log(`Placed: ${deepnest17.placedItems.length}/${deepnest17.totalCount}`);
  console.log(`Failed: ${deepnest17.failedCount}`);
  console.log(`Utilization: ${(deepnest17.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`Sheet Length: ${deepnest17.sheetLength.toFixed(2)}"`);
  console.log(`Method: ${deepnest17.packingMethod}\n`);

  console.log('=== COMPARISON: Our NFP vs Current Shelf ===\n');

  // Our NFP implementation
  console.log('=== 13" SHEET (Our NFP) ===');
  const nfp13 = nfpNesting(images, 13, 0.05, canRotate);
  console.log(`Utilization: ${(nfp13.areaUtilizationPct * 100).toFixed(2)}%\n`);

  // Current shelf algorithm
  console.log('=== 13" SHEET (Current Shelf) ===');
  const shelf13 = executeNesting(images, 13, 0.05);
  console.log(`Utilization: ${(shelf13.areaUtilizationPct * 100).toFixed(2)}%`);
}

runTests().catch(console.error);

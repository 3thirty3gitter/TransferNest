// Boundary Violation Diagnostic Tool
// Checks if any images are placed outside the sheet width boundary

import { executeNesting, type ManagedImage, type NestedImage } from './src/lib/nesting-algorithm';

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║          BOUNDARY VIOLATION DIAGNOSTIC TEST                       ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

/**
 * Check if a placed item violates the sheet width boundary
 */
function checkBoundaryViolation(
  item: NestedImage,
  sheetWidth: number,
  padding: number = 0.125
): { violated: boolean; overflow: number; details: string } {
  // Calculate the actual width the item occupies on the sheet
  // If rotated, the item's height becomes its width on the sheet
  const occupiedWidth = item.rotated ? item.height : item.width;
  
  // Calculate the right edge position (including padding)
  const rightEdge = item.x + occupiedWidth + padding;
  
  // Check if it exceeds the sheet width
  const violated = rightEdge > sheetWidth + 0.001; // Small tolerance for floating point
  const overflow = violated ? rightEdge - sheetWidth : 0;
  
  const details = `ID: ${item.id}, X: ${item.x.toFixed(2)}", Width: ${occupiedWidth.toFixed(2)}", ` +
    `Rotated: ${item.rotated}, Right Edge: ${rightEdge.toFixed(2)}", Sheet Width: ${sheetWidth}"`;
  
  return { violated, overflow, details };
}

/**
 * Analyze a nesting result for boundary violations
 */
function analyzeBoundaryViolations(
  placedItems: NestedImage[],
  sheetWidth: number,
  padding: number = 0.125
): {
  violations: Array<{ item: NestedImage; overflow: number; details: string }>;
  totalViolations: number;
  maxOverflow: number;
  isClean: boolean;
} {
  const violations: Array<{ item: NestedImage; overflow: number; details: string }> = [];
  let maxOverflow = 0;
  
  for (const item of placedItems) {
    const check = checkBoundaryViolation(item, sheetWidth, padding);
    if (check.violated) {
      violations.push({ item, overflow: check.overflow, details: check.details });
      maxOverflow = Math.max(maxOverflow, check.overflow);
    }
  }
  
  return {
    violations,
    totalViolations: violations.length,
    maxOverflow,
    isClean: violations.length === 0
  };
}

// Test Case 1: Simple batch with 45 purple car images (as mentioned by user)
console.log('═══════════════════════════════════════════════════════════════════\n');
console.log('TEST CASE 1: 45 Purple Car Images (User Scenario)\n');
console.log('───────────────────────────────────────────────────────────────────\n');

const carImages: ManagedImage[] = Array(45).fill(null).map((_, i) => ({
  id: `purple-car-${i}`,
  url: 'purple-car.png',
  width: 4.5,  // Typical car decal size
  height: 3.0,
  aspectRatio: 1.5,
  copies: 1,
  dataAiHint: 'car'
}));

// Test on 17" sheet
const result17_cars = executeNesting(carImages, 17, 0.125, 0.95);
console.log(`Placed: ${result17_cars.placedItems.length}/${result17_cars.totalCount}`);
console.log(`Sheet Length: ${result17_cars.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(result17_cars.areaUtilizationPct * 100).toFixed(2)}%\n`);

const analysis17_cars = analyzeBoundaryViolations(result17_cars.placedItems, 17, 0.125);

if (analysis17_cars.isClean) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${analysis17_cars.totalViolations} boundary violations found!\n`);
  console.log(`Maximum overflow: ${analysis17_cars.maxOverflow.toFixed(3)}"\n`);
  console.log('Violations:\n');
  analysis17_cars.violations.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.details}`);
    console.log(`     Overflow: ${v.overflow.toFixed(3)}"\n`);
  });
}

// Test Case 2: Mixed batch (cars + other images)
console.log('\n═══════════════════════════════════════════════════════════════════\n');
console.log('TEST CASE 2: Mixed Batch (45 Cars + Mixed Images)\n');
console.log('───────────────────────────────────────────────────────────────────\n');

const mixedImages: ManagedImage[] = [
  ...carImages,
  ...Array(20).fill(null).map((_, i) => ({
    id: `logo-${i}`,
    url: 'logo.png',
    width: 3.5,
    height: 3.5,
    aspectRatio: 1,
    copies: 1,
    dataAiHint: 'logo'
  })),
  ...Array(15).fill(null).map((_, i) => ({
    id: `text-${i}`,
    url: 'text.png',
    width: 6.0,
    height: 2.0,
    aspectRatio: 3,
    copies: 1,
    dataAiHint: 'text'
  }))
];

const result17_mixed = executeNesting(mixedImages, 17, 0.125, 0.95);
console.log(`Total Images: ${mixedImages.length}`);
console.log(`Placed: ${result17_mixed.placedItems.length}/${result17_mixed.totalCount}`);
console.log(`Sheet Length: ${result17_mixed.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(result17_mixed.areaUtilizationPct * 100).toFixed(2)}%\n`);

const analysis17_mixed = analyzeBoundaryViolations(result17_mixed.placedItems, 17, 0.125);

if (analysis17_mixed.isClean) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${analysis17_mixed.totalViolations} boundary violations found!\n`);
  console.log(`Maximum overflow: ${analysis17_mixed.maxOverflow.toFixed(3)}"\n`);
  console.log('First 10 violations:\n');
  analysis17_mixed.violations.slice(0, 10).forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.details}`);
    console.log(`     Overflow: ${v.overflow.toFixed(3)}"\n`);
  });
  if (analysis17_mixed.violations.length > 10) {
    console.log(`  ... and ${analysis17_mixed.violations.length - 10} more violations\n`);
  }
}

// Test Case 3: Edge case - images close to sheet width
console.log('\n═══════════════════════════════════════════════════════════════════\n');
console.log('TEST CASE 3: Edge Case - Large Images Near Sheet Width\n');
console.log('───────────────────────────────────────────────────────────────────\n');

const edgeImages: ManagedImage[] = [
  { id: 'large-1', url: 'large.png', width: 16.5, height: 10, aspectRatio: 1.65, copies: 1, dataAiHint: 'design' },
  { id: 'large-2', url: 'large.png', width: 15, height: 12, aspectRatio: 1.25, copies: 1, dataAiHint: 'design' },
  { id: 'wide-1', url: 'wide.png', width: 14, height: 4, aspectRatio: 3.5, copies: 1, dataAiHint: 'text' },
  ...Array(20).fill(null).map((_, i) => ({
    id: `small-${i}`,
    url: 'small.png',
    width: 3,
    height: 3,
    aspectRatio: 1,
    copies: 1,
    dataAiHint: 'logo'
  }))
];

const result17_edge = executeNesting(edgeImages, 17, 0.125, 0.95);
console.log(`Total Images: ${edgeImages.length}`);
console.log(`Placed: ${result17_edge.placedItems.length}/${result17_edge.totalCount}`);
console.log(`Sheet Length: ${result17_edge.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(result17_edge.areaUtilizationPct * 100).toFixed(2)}%\n`);

const analysis17_edge = analyzeBoundaryViolations(result17_edge.placedItems, 17, 0.125);

if (analysis17_edge.isClean) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${analysis17_edge.totalViolations} boundary violations found!\n`);
  console.log(`Maximum overflow: ${analysis17_edge.maxOverflow.toFixed(3)}"\n`);
  console.log('Violations:\n');
  analysis17_edge.violations.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.details}`);
    console.log(`     Overflow: ${v.overflow.toFixed(3)}"\n`);
  });
}

// Test Case 4: 13" sheet for comparison
console.log('\n═══════════════════════════════════════════════════════════════════\n');
console.log('TEST CASE 4: 13" Sheet Boundary Check\n');
console.log('───────────────────────────────────────────────────────────────────\n');

const result13_cars = executeNesting(carImages.slice(0, 30), 13, 0.125, 0.95);
console.log(`Placed: ${result13_cars.placedItems.length}/${result13_cars.totalCount}`);
console.log(`Sheet Length: ${result13_cars.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(result13_cars.areaUtilizationPct * 100).toFixed(2)}%\n`);

const analysis13_cars = analyzeBoundaryViolations(result13_cars.placedItems, 13, 0.125);

if (analysis13_cars.isClean) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${analysis13_cars.totalViolations} boundary violations found!\n`);
  console.log(`Maximum overflow: ${analysis13_cars.maxOverflow.toFixed(3)}"\n`);
  console.log('Violations:\n');
  analysis13_cars.violations.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.details}`);
    console.log(`     Overflow: ${v.overflow.toFixed(3)}"\n`);
  });
}

// Summary Report
console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                        SUMMARY REPORT                             ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

const allTests = [
  { name: '17" - 45 Car Images', analysis: analysis17_cars },
  { name: '17" - Mixed Batch (80 items)', analysis: analysis17_mixed },
  { name: '17" - Edge Case (Large Images)', analysis: analysis17_edge },
  { name: '13" - 30 Car Images', analysis: analysis13_cars }
];

let totalViolations = 0;
let cleanTests = 0;

allTests.forEach((test, i) => {
  const status = test.analysis.isClean ? '✅ PASS' : '❌ FAIL';
  console.log(`Test ${i + 1}: ${test.name}`);
  console.log(`  Status: ${status}`);
  console.log(`  Violations: ${test.analysis.totalViolations}`);
  if (!test.analysis.isClean) {
    console.log(`  Max Overflow: ${test.analysis.maxOverflow.toFixed(3)}"`);
  }
  console.log();
  
  totalViolations += test.analysis.totalViolations;
  if (test.analysis.isClean) cleanTests++;
});

console.log('─────────────────────────────────────────────────────────────────\n');
console.log(`Overall: ${cleanTests}/${allTests.length} tests passed`);
console.log(`Total boundary violations across all tests: ${totalViolations}\n`);

if (totalViolations === 0) {
  console.log('🎉 SUCCESS: All nesting respects sheet width boundaries!\n');
  console.log('The "overflow" you\'re seeing in the UI is likely a display/rendering issue,');
  console.log('not an actual nesting algorithm bug.\n');
} else {
  console.log('⚠️  WARNING: Boundary violations detected in nesting algorithm!\n');
  console.log('Action items:');
  console.log('1. Review bottomLeftPlacement function in ga-nesting.ts');
  console.log('2. Check width boundary validation logic');
  console.log('3. Verify padding is correctly applied\n');
}

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                      TEST COMPLETE                                ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

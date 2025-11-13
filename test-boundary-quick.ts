// Quick Boundary Violation Check
// Uses moderate parameters for fast testing

import { geneticAlgorithmNesting } from './src/lib/ga-nesting';
import type { ManagedImage, NestedImage } from './src/lib/nesting-algorithm';

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║          QUICK BOUNDARY VIOLATION CHECK                           ║');
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

// Test 1: 45 Car Images (User's scenario)
console.log('TEST 1: 45 Car Images on 17" Sheet (User Scenario)\n');

const carImages: ManagedImage[] = Array(45).fill(null).map((_, i) => ({
  id: `purple-car-${i}`,
  url: 'purple-car.png',
  width: 4.5,
  height: 3.0,
  aspectRatio: 1.5,
  copies: 1,
  dataAiHint: 'car'
}));

const canRotateCar = (img: ManagedImage) => {
  if (img.dataAiHint?.toLowerCase().includes('car')) return false;
  return true;
};

// Use FAST parameters for testing
const result17 = geneticAlgorithmNesting(carImages, 17, 0.125, canRotateCar, {
  adaptive: false,
  populationSize: 50,  // Much faster
  generations: 30,     // Much faster
  mutationRate: 0.25
});

console.log(`Placed: ${result17.placedItems.length}/${result17.totalCount}`);
console.log(`Sheet Length: ${result17.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(result17.areaUtilizationPct * 100).toFixed(2)}%\n`);

// Check for violations
let violations = 0;
let maxOverflow = 0;

console.log('Checking boundary violations...\n');

for (const item of result17.placedItems) {
  const check = checkBoundaryViolation(item, 17, 0.125);
  if (check.violated) {
    violations++;
    maxOverflow = Math.max(maxOverflow, check.overflow);
    console.log(`❌ VIOLATION #${violations}:`);
    console.log(`   ${check.details}`);
    console.log(`   Overflow: ${check.overflow.toFixed(3)}"\n`);
  }
}

if (violations === 0) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${violations} boundary violations found!\n`);
  console.log(`Maximum overflow: ${maxOverflow.toFixed(3)}"\n`);
}

// Test 2: Mixed batch
console.log('\n' + '═'.repeat(70));
console.log('\nTEST 2: Mixed Batch (Cars + Logos + Text) on 17" Sheet\n');

const mixedImages: ManagedImage[] = [
  ...carImages.slice(0, 30),
  ...Array(15).fill(null).map((_, i) => ({
    id: `logo-${i}`,
    url: 'logo.png',
    width: 3.5,
    height: 3.5,
    aspectRatio: 1,
    copies: 1,
    dataAiHint: 'logo'
  })),
  ...Array(10).fill(null).map((_, i) => ({
    id: `text-${i}`,
    url: 'text.png',
    width: 6.0,
    height: 2.0,
    aspectRatio: 3,
    copies: 1,
    dataAiHint: 'text'
  }))
];

const canRotateMixed = (img: ManagedImage) => {
  if (img.dataAiHint?.toLowerCase().includes('car')) return false;
  return true;
};

const resultMixed = geneticAlgorithmNesting(mixedImages, 17, 0.125, canRotateMixed, {
  adaptive: false,
  populationSize: 50,
  generations: 30,
  mutationRate: 0.25
});

console.log(`Placed: ${resultMixed.placedItems.length}/${resultMixed.totalCount}`);
console.log(`Sheet Length: ${resultMixed.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(resultMixed.areaUtilizationPct * 100).toFixed(2)}%\n`);

let violationsMixed = 0;
let maxOverflowMixed = 0;

console.log('Checking boundary violations...\n');

for (const item of resultMixed.placedItems) {
  const check = checkBoundaryViolation(item, 17, 0.125);
  if (check.violated) {
    violationsMixed++;
    maxOverflowMixed = Math.max(maxOverflowMixed, check.overflow);
    if (violationsMixed <= 5) {  // Show first 5
      console.log(`❌ VIOLATION #${violationsMixed}:`);
      console.log(`   ${check.details}`);
      console.log(`   Overflow: ${check.overflow.toFixed(3)}"\n`);
    }
  }
}

if (violationsMixed === 0) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${violationsMixed} boundary violations found!\n`);
  console.log(`Maximum overflow: ${maxOverflowMixed.toFixed(3)}"\n`);
  if (violationsMixed > 5) {
    console.log(`(Showing first 5 violations, ${violationsMixed - 5} more hidden)\n`);
  }
}

// Test 3: Large images near boundary
console.log('\n' + '═'.repeat(70));
console.log('\nTEST 3: Large Images Near 17" Boundary\n');

const largeImages: ManagedImage[] = [
  { id: 'large-1', url: 'large.png', width: 16.5, height: 10, aspectRatio: 1.65, copies: 1, dataAiHint: 'design' },
  { id: 'large-2', url: 'large.png', width: 15, height: 12, aspectRatio: 1.25, copies: 1, dataAiHint: 'design' },
  { id: 'large-3', url: 'large.png', width: 16, height: 8, aspectRatio: 2, copies: 1, dataAiHint: 'design' },
  ...Array(10).fill(null).map((_, i) => ({
    id: `small-${i}`,
    url: 'small.png',
    width: 3,
    height: 3,
    aspectRatio: 1,
    copies: 1,
    dataAiHint: 'logo'
  }))
];

const canRotateLarge = (img: ManagedImage) => true;

const resultLarge = geneticAlgorithmNesting(largeImages, 17, 0.125, canRotateLarge, {
  adaptive: false,
  populationSize: 30,
  generations: 20,
  mutationRate: 0.25
});

console.log(`Placed: ${resultLarge.placedItems.length}/${resultLarge.totalCount}`);
console.log(`Sheet Length: ${resultLarge.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(resultLarge.areaUtilizationPct * 100).toFixed(2)}%\n`);

let violationsLarge = 0;
let maxOverflowLarge = 0;

console.log('Checking boundary violations...\n');

for (const item of resultLarge.placedItems) {
  const check = checkBoundaryViolation(item, 17, 0.125);
  if (check.violated) {
    violationsLarge++;
    maxOverflowLarge = Math.max(maxOverflowLarge, check.overflow);
    console.log(`❌ VIOLATION #${violationsLarge}:`);
    console.log(`   ${check.details}`);
    console.log(`   Overflow: ${check.overflow.toFixed(3)}"\n`);
  }
}

if (violationsLarge === 0) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${violationsLarge} boundary violations found!\n`);
  console.log(`Maximum overflow: ${maxOverflowLarge.toFixed(3)}"\n`);
}

// Test 4: 13" sheet
console.log('\n' + '═'.repeat(70));
console.log('\nTEST 4: 30 Car Images on 13" Sheet\n');

const result13 = geneticAlgorithmNesting(carImages.slice(0, 30), 13, 0.125, canRotateCar, {
  adaptive: false,
  populationSize: 50,
  generations: 30,
  mutationRate: 0.25
});

console.log(`Placed: ${result13.placedItems.length}/${result13.totalCount}`);
console.log(`Sheet Length: ${result13.sheetLength.toFixed(2)}"`);
console.log(`Utilization: ${(result13.areaUtilizationPct * 100).toFixed(2)}%\n`);

let violations13 = 0;
let maxOverflow13 = 0;

console.log('Checking boundary violations...\n');

for (const item of result13.placedItems) {
  const check = checkBoundaryViolation(item, 13, 0.125);
  if (check.violated) {
    violations13++;
    maxOverflow13 = Math.max(maxOverflow13, check.overflow);
    console.log(`❌ VIOLATION #${violations13}:`);
    console.log(`   ${check.details}`);
    console.log(`   Overflow: ${check.overflow.toFixed(3)}"\n`);
  }
}

if (violations13 === 0) {
  console.log('✅ PASS: No boundary violations detected!\n');
} else {
  console.log(`❌ FAIL: ${violations13} boundary violations found!\n`);
  console.log(`Maximum overflow: ${maxOverflow13.toFixed(3)}"\n`);
}

// Final Summary
console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                        SUMMARY REPORT                             ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

const totalViolations = violations + violationsMixed + violationsLarge + violations13;
const totalTests = 4;
const passedTests = [violations, violationsMixed, violationsLarge, violations13].filter(v => v === 0).length;

console.log(`Tests Passed: ${passedTests}/${totalTests}`);
console.log(`Total Violations: ${totalViolations}\n`);

console.log('Test Results:');
console.log(`  Test 1 (17" - 45 Cars):        ${violations === 0 ? '✅ PASS' : `❌ FAIL (${violations} violations)`}`);
console.log(`  Test 2 (17" - Mixed 55 items): ${violationsMixed === 0 ? '✅ PASS' : `❌ FAIL (${violationsMixed} violations)`}`);
console.log(`  Test 3 (17" - Large Images):   ${violationsLarge === 0 ? '✅ PASS' : `❌ FAIL (${violationsLarge} violations)`}`);
console.log(`  Test 4 (13" - 30 Cars):        ${violations13 === 0 ? '✅ PASS' : `❌ FAIL (${violations13} violations)`}`);
console.log();

if (totalViolations === 0) {
  console.log('🎉 SUCCESS: All tests passed! No boundary violations detected.\n');
  console.log('CONCLUSION: The algorithm correctly respects sheet width boundaries.');
  console.log('The "overflow" you observed in the UI is likely a display/rendering issue,');
  console.log('not an algorithm bug. Check the sheet-preview.tsx component.\n');
} else {
  console.log('⚠️  WARNING: Boundary violations detected!\n');
  console.log('CONCLUSION: There is a bug in the nesting algorithm.');
  console.log('Review the bottomLeftPlacement function in ga-nesting.ts.\n');
  console.log('Specific areas to check:');
  console.log('  1. Width boundary validation (line ~437)');
  console.log('  2. Rotated image dimension handling');
  console.log('  3. Padding calculation\n');
}

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                      TEST COMPLETE                                ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

// Direct test of nesting algorithm - run with: node --loader ts-node/esm test-nesting.ts
import { executeNesting, ManagedImage } from './src/lib/nesting-algorithm.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: Record<string, any>;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error)
    });
    console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const sheetWidth = 2000;

// Test 1: Single image
test('should pack single image without rotation', () => {
  const images: ManagedImage[] = [
    {
      id: 'img1',
      url: 'test.jpg',
      width: 500,
      height: 300,
      aspectRatio: 500 / 300,
      copies: 1,
    }
  ];

  const result = executeNesting(images, sheetWidth);
  
  assert(result.placedItems.length === 1, `Expected 1 placed item, got ${result.placedItems.length}`);
  assert(result.placedItems[0].id === 'img1-0', `Expected id 'img1-0', got '${result.placedItems[0].id}'`);
  assert(result.failedCount === 0, `Expected 0 failed items, got ${result.failedCount}`);
});

// Test 2: Multiple images with copies
test('should pack multiple images with copies', () => {
  const images: ManagedImage[] = [
    {
      id: 'img1',
      url: 'test1.jpg',
      width: 500,
      height: 300,
      aspectRatio: 500 / 300,
      copies: 2,
    },
    {
      id: 'img2',
      url: 'test2.jpg',
      width: 400,
      height: 400,
      aspectRatio: 1,
      copies: 1,
    }
  ];

  const result = executeNesting(images, sheetWidth);

  assert(result.totalCount === 3, `Expected 3 total items, got ${result.totalCount}`);
  assert(result.placedItems.length + result.failedCount === 3, `Placed + failed should equal total`);
  assert(result.sheetLength > 0, `Sheet length should be > 0, got ${result.sheetLength}`);
});

// Test 3: Utilization calculation
test('should calculate utilization percentage correctly', () => {
  const images: ManagedImage[] = [
    {
      id: 'img1',
      url: 'test.jpg',
      width: 500,
      height: 300,
      aspectRatio: 500 / 300,
      copies: 1,
    }
  ];

  const result = executeNesting(images, sheetWidth);
  
  assert(result.areaUtilizationPct > 0, `Utilization should be > 0, got ${result.areaUtilizationPct}`);
  assert(result.areaUtilizationPct <= 1, `Utilization should be <= 1, got ${result.areaUtilizationPct}`);
});

// Test 4: Large batch with rotation enabled
test('should achieve good utilization with large batch', () => {
  const images: ManagedImage[] = [
    {
      id: 'img1',
      url: 'test1.jpg',
      width: 600,
      height: 400,
      aspectRatio: 600 / 400,
      copies: 4,
    },
    {
      id: 'img2',
      url: 'test2.jpg',
      width: 500,
      height: 500,
      aspectRatio: 1,
      copies: 2,
    }
  ];

  const result = executeNesting(images, sheetWidth);

  console.log(`\n  📊 Utilization Details:`);
  console.log(`     Total items: ${result.totalCount}`);
  console.log(`     Placed: ${result.placedItems.length}`);
  console.log(`     Failed: ${result.failedCount}`);
  console.log(`     Sheet length: ${result.sheetLength}mm`);
  console.log(`     Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);

  assert(result.areaUtilizationPct > 0.5, `Utilization should be > 50%, got ${(result.areaUtilizationPct * 100).toFixed(2)}%`);
});

// Test 5: Very tight packing scenario
test('should handle maximum density packing', () => {
  const images: ManagedImage[] = [
    {
      id: 'square1',
      url: 'sq1.jpg',
      width: 400,
      height: 400,
      aspectRatio: 1,
      copies: 3,
    },
    {
      id: 'square2',
      url: 'sq2.jpg',
      width: 400,
      height: 400,
      aspectRatio: 1,
      copies: 2,
    }
  ];

  const result = executeNesting(images, sheetWidth);

  console.log(`\n  📊 Dense Packing Details:`);
  console.log(`     Placed: ${result.placedItems.length}/${result.totalCount}`);
  console.log(`     Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);

  assert(result.placedItems.length === 5, `Expected to place all 5 items`);
  assert(result.areaUtilizationPct > 0.7, `Dense packing should exceed 70% utilization`);
});

// Test 6: Rotation detection
test('should detect and apply rotations', () => {
  const images: ManagedImage[] = [
    {
      id: 'portrait',
      url: 'portrait.jpg',
      width: 300,
      height: 500,
      aspectRatio: 300 / 500,
      copies: 1,
    }
  ];

  const result = executeNesting(images, sheetWidth);

  assert(result.placedItems.length === 1, `Expected 1 placed item`);
  // rotated property should exist (true or false)
  assert(result.placedItems[0].rotated !== undefined, `rotated property should be defined`);

  if (result.placedItems[0].rotated) {
    console.log(`\n  🔄 Rotation Applied: 300×500 → ${result.placedItems[0].width}×${result.placedItems[0].height}`);
  }
});

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log(`TEST SUMMARY`);
console.log(`${'='.repeat(60)}`);

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\n✅ Passed: ${passed}/${results.length}`);
if (failed > 0) {
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`\nFailed Tests:`);
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}`);
    if (r.error) console.log(`    ${r.error}`);
  });
}

console.log(`\n${'='.repeat(60)}`);
process.exit(failed > 0 ? 1 : 0);

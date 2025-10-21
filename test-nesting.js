// Simple CommonJS test script for nesting algorithm
const { executeNesting } = require('./src/lib/nesting-algorithm.ts');

console.log('Testing Nesting Algorithm...\n');

const sheetWidth = 2000;
const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Single image
test('Single image packing', () => {
  const images = [
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
  
  if (result.placedItems.length !== 1) throw new Error(`Expected 1, got ${result.placedItems.length}`);
  if (result.failedCount !== 0) throw new Error(`Expected 0 failed, got ${result.failedCount}`);
  console.log(`   Placed: ${result.placedItems.length}, Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);
});

// Test 2: Multiple images
test('Multiple images with copies', () => {
  const images = [
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

  if (result.totalCount !== 3) throw new Error(`Expected 3 items, got ${result.totalCount}`);
  if (result.sheetLength <= 0) throw new Error(`Invalid sheet length`);
  console.log(`   Placed: ${result.placedItems.length}/${result.totalCount}, Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);
});

// Test 3: Utilization
test('Utilization calculation', () => {
  const images = [
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
  
  if (result.areaUtilizationPct <= 0 || result.areaUtilizationPct > 1) {
    throw new Error(`Invalid utilization: ${result.areaUtilizationPct}`);
  }
});

// Test 4: Large batch
test('Large batch with good utilization', () => {
  const images = [
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

  console.log(`   Total: ${result.totalCount}, Placed: ${result.placedItems.length}, Failed: ${result.failedCount}`);
  console.log(`   Sheet: ${result.sheetLength}mm, Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);

  if (result.areaUtilizationPct < 0.5) {
    console.log(`   ⚠️  WARNING: Utilization below 50%`);
  }
});

// Test 5: Dense packing
test('Maximum density with square items', () => {
  const images = [
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

  console.log(`   Placed: ${result.placedItems.length}/${result.totalCount}, Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);
  if (result.placedItems.length !== 5) throw new Error(`Expected all 5 items placed`);
});

// Test 6: Rotation
test('Rotation detection', () => {
  const images = [
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

  if (result.placedItems.length !== 1) throw new Error(`Expected 1 placed item`);
  if (result.placedItems[0].rotated === undefined) throw new Error(`rotated property not set`);

  const rotated = result.placedItems[0].rotated;
  console.log(`   Rotation: ${rotated ? 'APPLIED' : 'NOT APPLIED'} (${result.placedItems[0].width}×${result.placedItems[0].height})`);
});

// Summary
console.log(`\n${'='.repeat(60)}`);
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`SUMMARY: ${passed}/${results.length} tests passed`);
if (failed > 0) {
  console.log(`\nFailed tests:`);
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.name}: ${r.error}`);
  });
}
console.log(`${'='.repeat(60)}\n`);

process.exit(failed > 0 ? 1 : 0);

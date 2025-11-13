// Comprehensive Algorithm Validation Test
// Tests 13" vs 17" performance with identical image sets
// Compares standard vs adaptive mode for both sizes

import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';
import { geneticAlgorithmNesting } from './src/lib/ga-nesting';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  TRANSFERNEST ALGORITHM VALIDATION - PRODUCTION READINESS   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Test Scenarios
const testSets = {
  small_uniform: {
    name: 'Small Uniform (10 identical items)',
    images: Array(10).fill(null).map((_, i) => ({
      id: `uniform-${i}`,
      url: 'test.png',
      width: 4,
      height: 4,
      aspectRatio: 1,
      copies: 1,
      dataAiHint: 'logo'
    }))
  },
  
  medium_mixed: {
    name: 'Medium Mixed (20 varied items)',
    images: [
      // Large squares
      ...Array(5).fill(null).map((_, i) => ({
        id: `large-sq-${i}`,
        url: 'test.png',
        width: 6,
        height: 6,
        aspectRatio: 1,
        copies: 1,
        dataAiHint: 'logo'
      })),
      // Medium rectangles
      ...Array(8).fill(null).map((_, i) => ({
        id: `med-rect-${i}`,
        url: 'test.png',
        width: 5,
        height: 3,
        aspectRatio: 5/3,
        copies: 1,
        dataAiHint: 'text'
      })),
      // Small various
      ...Array(7).fill(null).map((_, i) => ({
        id: `small-${i}`,
        url: 'test.png',
        width: 2 + (i % 3),
        height: 2 + ((i + 1) % 3),
        aspectRatio: (2 + (i % 3)) / (2 + ((i + 1) % 3)),
        copies: 1,
        dataAiHint: 'design'
      }))
    ]
  },
  
  large_diverse: {
    name: 'Large Diverse (40 highly varied items)',
    images: [
      // Very large items
      ...Array(3).fill(null).map((_, i) => ({
        id: `xlarge-${i}`,
        url: 'test.png',
        width: 8 + i,
        height: 7 + i,
        aspectRatio: (8 + i) / (7 + i),
        copies: 1,
        dataAiHint: 'design'
      })),
      // Tall items (no rotation - cars)
      ...Array(5).fill(null).map((_, i) => ({
        id: `car-${i}`,
        url: 'test.png',
        width: 3,
        height: 7,
        aspectRatio: 3/7,
        copies: 1,
        dataAiHint: 'car'
      })),
      // Wide items
      ...Array(6).fill(null).map((_, i) => ({
        id: `wide-${i}`,
        url: 'test.png',
        width: 8,
        height: 2,
        aspectRatio: 4,
        copies: 1,
        dataAiHint: 'text'
      })),
      // Random small-medium mix
      ...Array(26).fill(null).map((_, i) => ({
        id: `random-${i}`,
        url: 'test.png',
        width: 2 + (i % 5),
        height: 2 + ((i * 2) % 4),
        aspectRatio: (2 + (i % 5)) / (2 + ((i * 2) % 4)),
        copies: 1,
        dataAiHint: i % 3 === 0 ? 'car' : 'design'
      }))
    ]
  },
  
  realistic_batch: {
    name: 'Realistic Customer Order (30 items)',
    images: [
      // 5 car decals (no rotation)
      ...Array(5).fill(null).map((_, i) => ({
        id: `car-decal-${i}`,
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
    ]
  },
  
  worst_case: {
    name: 'Worst Case (many large items)',
    images: Array(15).fill(null).map((_, i) => ({
      id: `large-${i}`,
      url: 'test.png',
      width: 7 + (i % 3),
      height: 6 + (i % 2),
      aspectRatio: (7 + (i % 3)) / (6 + (i % 2)),
      copies: 1,
      dataAiHint: 'design'
    }))
  }
};

// Test both algorithms with same data
function runComparisonTest(testSet: { name: string; images: ManagedImage[] }) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${testSet.name}`);
  console.log(`Items: ${testSet.images.length}, Total Area: ${testSet.images.reduce((sum, img) => sum + img.width * img.height, 0).toFixed(1)} sq in`);
  console.log(`${'='.repeat(70)}\n`);
  
  const results: any = {};
  
  // Test 13" Standard (non-adaptive)
  console.log('🔹 13" STANDARD (fixed params: 80 pop, 40 gen)');
  const start13std = Date.now();
  const result13std = executeNesting(testSet.images, 13, 0.25, 0.9);
  const time13std = Date.now() - start13std;
  results['13_standard'] = {
    utilization: result13std.areaUtilizationPct,
    length: result13std.sheetLength,
    placed: result13std.placedItems.length,
    failed: result13std.failedCount,
    time: time13std
  };
  console.log(`   ✓ Utilization: ${(result13std.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`   ✓ Sheet Length: ${result13std.sheetLength.toFixed(2)}"`);
  console.log(`   ✓ Placed: ${result13std.placedItems.length}/${testSet.images.length}`);
  console.log(`   ✓ Time: ${time13std}ms\n`);
  
  // Test 13" Adaptive (enable adaptive mode)
  console.log('🔹 13" ADAPTIVE (dynamic params based on batch)');
  const canRotate13 = (img: ManagedImage) => {
    if (img.dataAiHint) {
      const hint = img.dataAiHint.toLowerCase();
      if (hint.includes('car') || hint.includes('vehicle')) return false;
      if (hint.includes('text') || hint.includes('vertical') || hint.includes('tall') || hint.includes('horizontal')) return true;
    }
    const aspectRatio = img.width / img.height;
    return aspectRatio < 0.95 || aspectRatio > 1.05;
  };
  const start13adapt = Date.now();
  const result13adapt = geneticAlgorithmNesting(testSet.images, 13, 0.25, canRotate13, { adaptive: true });
  const time13adapt = Date.now() - start13adapt;
  results['13_adaptive'] = {
    utilization: result13adapt.areaUtilizationPct,
    length: result13adapt.sheetLength,
    placed: result13adapt.placedItems.length,
    failed: result13adapt.failedCount,
    time: time13adapt
  };
  console.log(`   ✓ Utilization: ${(result13adapt.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`   ✓ Sheet Length: ${result13adapt.sheetLength.toFixed(2)}"`);
  console.log(`   ✓ Placed: ${result13adapt.placedItems.length}/${testSet.images.length}`);
  console.log(`   ✓ Time: ${time13adapt}ms\n`);
  
  // Test 17" Standard (non-adaptive)
  console.log('🔹 17" STANDARD (fixed params: 80 pop, 40 gen)');
  const canRotate17 = (img: ManagedImage) => {
    if (img.dataAiHint) {
      const hint = img.dataAiHint.toLowerCase();
      if (hint.includes('car') || hint.includes('vehicle')) return false;
      if (hint.includes('text') || hint.includes('vertical') || hint.includes('tall') || hint.includes('horizontal')) return true;
    }
    const aspectRatio = img.width / img.height;
    return aspectRatio < 0.95 || aspectRatio > 1.05;
  };
  const start17std = Date.now();
  const result17std = geneticAlgorithmNesting(testSet.images, 17, 0.25, canRotate17, { 
    populationSize: 80,
    generations: 40,
    mutationRate: 0.25,
    adaptive: false
  });
  const time17std = Date.now() - start17std;
  results['17_standard'] = {
    utilization: result17std.areaUtilizationPct,
    length: result17std.sheetLength,
    placed: result17std.placedItems.length,
    failed: result17std.failedCount,
    time: time17std
  };
  console.log(`   ✓ Utilization: ${(result17std.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`   ✓ Sheet Length: ${result17std.sheetLength.toFixed(2)}"`);
  console.log(`   ✓ Placed: ${result17std.placedItems.length}/${testSet.images.length}`);
  console.log(`   ✓ Time: ${time17std}ms\n`);
  
  // Test 17" Adaptive (current production method)
  console.log('🔹 17" ADAPTIVE (dynamic params - CURRENT PRODUCTION)');
  const start17adapt = Date.now();
  const result17adapt = executeNesting(testSet.images, 17, 0.25, 0.9);
  const time17adapt = Date.now() - start17adapt;
  results['17_adaptive'] = {
    utilization: result17adapt.areaUtilizationPct,
    length: result17adapt.sheetLength,
    placed: result17adapt.placedItems.length,
    failed: result17adapt.failedCount,
    time: time17adapt
  };
  console.log(`   ✓ Utilization: ${(result17adapt.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`   ✓ Sheet Length: ${result17adapt.sheetLength.toFixed(2)}"`);
  console.log(`   ✓ Placed: ${result17adapt.placedItems.length}/${testSet.images.length}`);
  console.log(`   ✓ Time: ${time17adapt}ms\n`);
  
  // Analysis
  console.log('📊 ANALYSIS:');
  console.log('─'.repeat(70));
  
  // Best utilization
  const bestUtil = Math.max(
    results['13_standard'].utilization,
    results['13_adaptive'].utilization,
    results['17_standard'].utilization,
    results['17_adaptive'].utilization
  );
  
  console.log(`🏆 Best Utilization: ${(bestUtil * 100).toFixed(2)}%`);
  Object.keys(results).forEach(key => {
    if (results[key].utilization === bestUtil) {
      console.log(`   Winner: ${key.toUpperCase()}`);
    }
  });
  
  // Adaptive vs Standard comparison
  const adaptive13Gain = ((results['13_adaptive'].utilization - results['13_standard'].utilization) * 100).toFixed(2);
  const adaptive17Gain = ((results['17_adaptive'].utilization - results['17_standard'].utilization) * 100).toFixed(2);
  
  console.log(`\n📈 Adaptive Mode Impact:`);
  console.log(`   13": ${adaptive13Gain > '0' ? '+' : ''}${adaptive13Gain}% ${parseFloat(adaptive13Gain) > 0 ? '✓ IMPROVEMENT' : '✗ WORSE'}`);
  console.log(`   17": ${adaptive17Gain > '0' ? '+' : ''}${adaptive17Gain}% ${parseFloat(adaptive17Gain) > 0 ? '✓ IMPROVEMENT' : '✗ WORSE'}`);
  
  // Sheet width comparison
  const width13Best = Math.max(results['13_standard'].utilization, results['13_adaptive'].utilization);
  const width17Best = Math.max(results['17_standard'].utilization, results['17_adaptive'].utilization);
  const widthDiff = ((width17Best - width13Best) * 100).toFixed(2);
  
  console.log(`\n📏 Sheet Width Comparison:`);
  console.log(`   13" best: ${(width13Best * 100).toFixed(2)}%`);
  console.log(`   17" best: ${(width17Best * 100).toFixed(2)}%`);
  console.log(`   Difference: ${widthDiff > '0' ? '+' : ''}${widthDiff}% ${parseFloat(widthDiff) > 0 ? '(17" better)' : '(13" better)'}`);
  
  // Performance check
  console.log(`\n⚡ Performance Check:`);
  const allPassed = Object.values(results).every((r: any) => r.failed === 0);
  console.log(`   All items placed: ${allPassed ? '✓ YES' : '✗ NO'}`);
  
  const avgUtil = Object.values(results).reduce((sum: number, r: any) => sum + r.utilization, 0) / 4;
  console.log(`   Average utilization: ${(avgUtil * 100).toFixed(2)}%`);
  console.log(`   Production ready: ${avgUtil > 0.85 ? '✓ YES (>85%)' : '⚠ NEEDS WORK'}`);
  
  return results;
}

// Run all tests
const allResults: any = {};
for (const [key, testSet] of Object.entries(testSets)) {
  allResults[key] = runComparisonTest(testSet);
}

// Final Summary
console.log('\n\n');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    FINAL SUMMARY                             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Calculate averages
const avgResults: any = {
  '13_standard': { util: 0, time: 0 },
  '13_adaptive': { util: 0, time: 0 },
  '17_standard': { util: 0, time: 0 },
  '17_adaptive': { util: 0, time: 0 }
};

const testCount = Object.keys(allResults).length;
Object.values(allResults).forEach((testResult: any) => {
  Object.keys(avgResults).forEach(key => {
    avgResults[key].util += testResult[key].utilization;
    avgResults[key].time += testResult[key].time;
  });
});

Object.keys(avgResults).forEach(key => {
  avgResults[key].util /= testCount;
  avgResults[key].time /= testCount;
});

console.log('📊 AVERAGE PERFORMANCE ACROSS ALL TESTS:\n');
console.table({
  '13" Standard': {
    'Avg Utilization': `${(avgResults['13_standard'].util * 100).toFixed(2)}%`,
    'Avg Time': `${avgResults['13_standard'].time.toFixed(0)}ms`
  },
  '13" Adaptive': {
    'Avg Utilization': `${(avgResults['13_adaptive'].util * 100).toFixed(2)}%`,
    'Avg Time': `${avgResults['13_adaptive'].time.toFixed(0)}ms`
  },
  '17" Standard': {
    'Avg Utilization': `${(avgResults['17_standard'].util * 100).toFixed(2)}%`,
    'Avg Time': `${avgResults['17_standard'].time.toFixed(0)}ms`
  },
  '17" Adaptive': {
    'Avg Utilization': `${(avgResults['17_adaptive'].util * 100).toFixed(2)}%`,
    'Avg Time': `${avgResults['17_adaptive'].time.toFixed(0)}ms`
  }
});

console.log('\n🎯 RECOMMENDATIONS:\n');

// Determine best configuration
const best13 = avgResults['13_adaptive'].util > avgResults['13_standard'].util ? 'ADAPTIVE' : 'STANDARD';
const best17 = avgResults['17_adaptive'].util > avgResults['17_standard'].util ? 'ADAPTIVE' : 'STANDARD';

console.log(`✓ 13" sheets should use: ${best13} mode`);
console.log(`✓ 17" sheets should use: ${best17} mode`);

const overall = (avgResults['13_standard'].util + avgResults['13_adaptive'].util + 
                avgResults['17_standard'].util + avgResults['17_adaptive'].util) / 4;

console.log(`\n✓ Overall average utilization: ${(overall * 100).toFixed(2)}%`);
console.log(`✓ Production readiness: ${overall > 0.85 ? '✅ READY' : '⚠️ NEEDS OPTIMIZATION'}`);

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                   VALIDATION COMPLETE                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

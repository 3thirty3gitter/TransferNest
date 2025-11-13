// Extensive Algorithm Testing Suite
// Tests 20 different scenarios with increasing complexity
// Measures utilization, performance, and algorithm effectiveness

import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║     EXTENSIVE NESTING ALGORITHM TEST - 20 SCENARIOS              ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

interface TestScenario {
  id: number;
  name: string;
  description: string;
  images: ManagedImage[];
  complexity: 'Simple' | 'Medium' | 'Complex' | 'Very Complex';
}

interface TestResult {
  scenarioId: number;
  scenarioName: string;
  complexity: string;
  imageCount: number;
  totalArea: number;
  
  // 13" Results
  util13: number;
  length13: number;
  placed13: number;
  failed13: number;
  time13: number;
  sheets13: number;
  
  // 17" Results
  util17: number;
  length17: number;
  placed17: number;
  failed17: number;
  time17: number;
  sheets17: number;
}

// Helper function to generate random images with specific characteristics
function generateImages(
  count: number,
  sizeRange: { min: number; max: number },
  aspectRatios: number[],
  hints: string[]
): ManagedImage[] {
  const images: ManagedImage[] = [];
  
  for (let i = 0; i < count; i++) {
    const baseSize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
    const aspectRatio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)];
    const width = baseSize;
    const height = baseSize / aspectRatio;
    const hint = hints[Math.floor(Math.random() * hints.length)];
    
    images.push({
      id: `img-${i}`,
      url: 'test.png',
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
      aspectRatio,
      copies: 1,
      dataAiHint: hint
    });
  }
  
  return images;
}

// Define 20 test scenarios with increasing complexity
const scenarios: TestScenario[] = [
  // SIMPLE SCENARIOS (1-5): 20-50 images
  {
    id: 1,
    name: 'Uniform Small Items',
    description: '20 identical small squares',
    complexity: 'Simple',
    images: Array(20).fill(null).map((_, i) => ({
      id: `uniform-${i}`,
      url: 'test.png',
      width: 3,
      height: 3,
      aspectRatio: 1,
      copies: 1,
      dataAiHint: 'logo'
    }))
  },
  {
    id: 2,
    name: 'Mixed Small Items',
    description: '30 small items with varying sizes',
    complexity: 'Simple',
    images: generateImages(30, { min: 2, max: 4 }, [1, 1.2, 0.8], ['logo', 'design'])
  },
  {
    id: 3,
    name: 'Text-Heavy Batch',
    description: '40 horizontal text items',
    complexity: 'Simple',
    images: generateImages(40, { min: 4, max: 8 }, [3, 4, 5], ['text', 'horizontal'])
  },
  {
    id: 4,
    name: 'Car Decals',
    description: '25 vertical car decals (no rotation)',
    complexity: 'Simple',
    images: generateImages(25, { min: 3, max: 5 }, [0.6, 0.7], ['car', 'vehicle'])
  },
  {
    id: 5,
    name: 'Mixed Aspect Ratios',
    description: '50 items with diverse aspect ratios',
    complexity: 'Simple',
    images: generateImages(50, { min: 2, max: 6 }, [0.5, 1, 1.5, 2, 3], ['design', 'logo', 'text'])
  },
  
  // MEDIUM SCENARIOS (6-10): 50-100 images
  {
    id: 6,
    name: 'E-commerce Order',
    description: '60 items simulating real customer order',
    complexity: 'Medium',
    images: [
      ...generateImages(15, { min: 3, max: 5 }, [0.7], ['car', 'vehicle']),
      ...generateImages(20, { min: 4, max: 8 }, [3, 4], ['text']),
      ...generateImages(20, { min: 3, max: 5 }, [1, 1.2], ['logo']),
      ...generateImages(5, { min: 1.5, max: 2.5 }, [1], ['design'])
    ]
  },
  {
    id: 7,
    name: 'Large Item Mix',
    description: '50 items with some very large pieces',
    complexity: 'Medium',
    images: [
      ...generateImages(10, { min: 8, max: 12 }, [1, 1.5], ['design']),
      ...generateImages(40, { min: 2, max: 5 }, [1, 1.5, 2], ['logo', 'text'])
    ]
  },
  {
    id: 8,
    name: 'Small + Medium Mix',
    description: '80 items with bimodal size distribution',
    complexity: 'Medium',
    images: [
      ...generateImages(40, { min: 1.5, max: 3 }, [1, 1.2], ['logo']),
      ...generateImages(40, { min: 4, max: 7 }, [1.5, 2], ['design'])
    ]
  },
  {
    id: 9,
    name: 'Extreme Aspect Ratios',
    description: '70 items with very elongated shapes',
    complexity: 'Medium',
    images: generateImages(70, { min: 3, max: 8 }, [0.3, 0.4, 4, 5, 6], ['text', 'design'])
  },
  {
    id: 10,
    name: 'Realistic Batch 1',
    description: '100 items representing typical production order',
    complexity: 'Medium',
    images: [
      ...generateImages(20, { min: 3, max: 5 }, [0.7], ['car']),
      ...generateImages(30, { min: 4, max: 8 }, [3, 4], ['text']),
      ...generateImages(35, { min: 2, max: 5 }, [1, 1.5], ['logo']),
      ...generateImages(15, { min: 1.5, max: 3 }, [1], ['design'])
    ]
  },
  
  // COMPLEX SCENARIOS (11-15): 100-150 images
  {
    id: 11,
    name: 'High Volume Order',
    description: '120 mixed items simulating bulk order',
    complexity: 'Complex',
    images: [
      ...generateImages(30, { min: 2, max: 4 }, [1, 1.2], ['logo']),
      ...generateImages(40, { min: 3, max: 6 }, [1.5, 2], ['design']),
      ...generateImages(30, { min: 4, max: 8 }, [3, 4], ['text']),
      ...generateImages(20, { min: 3, max: 5 }, [0.7], ['car'])
    ]
  },
  {
    id: 12,
    name: 'Size Diversity',
    description: '110 items with full size spectrum',
    complexity: 'Complex',
    images: [
      ...generateImages(20, { min: 1, max: 2 }, [1], ['small logo']),
      ...generateImages(40, { min: 3, max: 5 }, [1, 1.5], ['medium design']),
      ...generateImages(30, { min: 6, max: 9 }, [1.5, 2], ['large design']),
      ...generateImages(20, { min: 10, max: 12 }, [1, 1.5], ['extra large'])
    ]
  },
  {
    id: 13,
    name: 'Multi-Customer Batch',
    description: '130 items from multiple orders combined',
    complexity: 'Complex',
    images: [
      ...generateImages(25, { min: 2, max: 4 }, [1], ['customer 1']),
      ...generateImages(30, { min: 3, max: 6 }, [1.5, 2], ['customer 2']),
      ...generateImages(35, { min: 4, max: 8 }, [3], ['customer 3']),
      ...generateImages(20, { min: 3, max: 5 }, [0.7], ['customer 4']),
      ...generateImages(20, { min: 2, max: 5 }, [1, 2], ['customer 5'])
    ]
  },
  {
    id: 14,
    name: 'Challenging Shapes',
    description: '100 items with difficult-to-pack shapes',
    complexity: 'Complex',
    images: [
      ...generateImages(30, { min: 2, max: 4 }, [0.3, 0.4], ['very tall']),
      ...generateImages(30, { min: 2, max: 4 }, [5, 6], ['very wide']),
      ...generateImages(40, { min: 3, max: 6 }, [1, 1.5, 2], ['mixed'])
    ]
  },
  {
    id: 15,
    name: 'Production Scale',
    description: '150 items representing full production run',
    complexity: 'Complex',
    images: [
      ...generateImages(35, { min: 3, max: 5 }, [0.7], ['car decals']),
      ...generateImages(45, { min: 4, max: 8 }, [3, 4], ['names']),
      ...generateImages(50, { min: 2, max: 5 }, [1, 1.5], ['logos']),
      ...generateImages(20, { min: 1.5, max: 3 }, [1], ['accents'])
    ]
  },
  
  // VERY COMPLEX SCENARIOS (16-20): 150-200 images
  {
    id: 16,
    name: 'Mega Batch 1',
    description: '160 items - stress test volume',
    complexity: 'Very Complex',
    images: generateImages(160, { min: 2, max: 8 }, [0.5, 1, 1.5, 2, 3, 4], ['mixed', 'design', 'text', 'logo'])
  },
  {
    id: 17,
    name: 'Extreme Diversity',
    description: '170 items with maximum variety',
    complexity: 'Very Complex',
    images: [
      ...generateImages(30, { min: 1, max: 2 }, [1], ['tiny']),
      ...generateImages(40, { min: 2, max: 4 }, [0.5, 1, 2], ['small']),
      ...generateImages(50, { min: 4, max: 7 }, [0.7, 1.5, 3], ['medium']),
      ...generateImages(30, { min: 7, max: 10 }, [1, 1.5], ['large']),
      ...generateImages(20, { min: 10, max: 13 }, [1, 2], ['huge'])
    ]
  },
  {
    id: 18,
    name: 'Multi-Day Production',
    description: '180 items from combined daily orders',
    complexity: 'Very Complex',
    images: [
      ...generateImages(45, { min: 3, max: 5 }, [0.7], ['car orders']),
      ...generateImages(55, { min: 4, max: 8 }, [3, 4], ['text orders']),
      ...generateImages(60, { min: 2, max: 6 }, [1, 1.5, 2], ['logo orders']),
      ...generateImages(20, { min: 1.5, max: 3 }, [1], ['misc orders'])
    ]
  },
  {
    id: 19,
    name: 'Maximum Complexity',
    description: '190 items with worst-case characteristics',
    complexity: 'Very Complex',
    images: [
      ...generateImages(40, { min: 2, max: 4 }, [0.3, 0.4], ['very tall narrow']),
      ...generateImages(40, { min: 2, max: 4 }, [5, 6, 7], ['very wide flat']),
      ...generateImages(50, { min: 6, max: 10 }, [1, 1.5], ['large squares']),
      ...generateImages(60, { min: 1.5, max: 3 }, [1, 1.2], ['small mixed'])
    ]
  },
  {
    id: 20,
    name: 'Ultimate Stress Test',
    description: '200 items - maximum volume test',
    complexity: 'Very Complex',
    images: [
      ...generateImages(50, { min: 3, max: 5 }, [0.6, 0.7, 0.8], ['cars']),
      ...generateImages(60, { min: 4, max: 8 }, [2.5, 3, 3.5, 4], ['text']),
      ...generateImages(70, { min: 2, max: 6 }, [0.8, 1, 1.2, 1.5, 2], ['logos']),
      ...generateImages(20, { min: 1, max: 3 }, [1], ['small'])
    ]
  }
];

// Run tests
const results: TestResult[] = [];

console.log('Starting test execution...\n');
console.log('This will take several minutes due to aggressive GA parameters.\n');

for (const scenario of scenarios) {
  console.log(`${'═'.repeat(70)}`);
  console.log(`SCENARIO ${scenario.id}/20: ${scenario.name}`);
  console.log(`Complexity: ${scenario.complexity} | Items: ${scenario.images.length}`);
  console.log(`Description: ${scenario.description}`);
  console.log(`${'─'.repeat(70)}`);
  
  const totalArea = scenario.images.reduce((sum, img) => sum + img.width * img.height, 0);
  
  // Test 13" sheet
  console.log('Testing 13" sheet...');
  const start13 = Date.now();
  const result13 = executeNesting(scenario.images, 13, 0.125, 0.95);
  const time13 = Date.now() - start13;
  const sheets13 = Math.ceil(scenario.images.length / result13.placedItems.length);
  
  console.log(`  ✓ Utilization: ${(result13.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`  ✓ Sheet Length: ${result13.sheetLength.toFixed(2)}"`);
  console.log(`  ✓ Placed: ${result13.placedItems.length}/${scenario.images.length}`);
  console.log(`  ✓ Time: ${(time13 / 1000).toFixed(1)}s`);
  console.log(`  ✓ Est. Sheets: ${sheets13}`);
  
  // Test 17" sheet
  console.log('Testing 17" sheet...');
  const start17 = Date.now();
  const result17 = executeNesting(scenario.images, 17, 0.125, 0.95);
  const time17 = Date.now() - start17;
  const sheets17 = Math.ceil(scenario.images.length / result17.placedItems.length);
  
  console.log(`  ✓ Utilization: ${(result17.areaUtilizationPct * 100).toFixed(2)}%`);
  console.log(`  ✓ Sheet Length: ${result17.sheetLength.toFixed(2)}"`);
  console.log(`  ✓ Placed: ${result17.placedItems.length}/${scenario.images.length}`);
  console.log(`  ✓ Time: ${(time17 / 1000).toFixed(1)}s`);
  console.log(`  ✓ Est. Sheets: ${sheets17}`);
  
  // Store results
  results.push({
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    complexity: scenario.complexity,
    imageCount: scenario.images.length,
    totalArea,
    util13: result13.areaUtilizationPct,
    length13: result13.sheetLength,
    placed13: result13.placedItems.length,
    failed13: result13.failedCount,
    time13,
    sheets13,
    util17: result17.areaUtilizationPct,
    length17: result17.sheetLength,
    placed17: result17.placedItems.length,
    failed17: result17.failedCount,
    time17,
    sheets17
  });
  
  console.log();
}

// Generate comprehensive report
console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                     COMPREHENSIVE REPORT                          ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

// Summary statistics
const avg13Util = results.reduce((sum, r) => sum + r.util13, 0) / results.length;
const avg17Util = results.reduce((sum, r) => sum + r.util17, 0) / results.length;
const avg13Time = results.reduce((sum, r) => sum + r.time13, 0) / results.length;
const avg17Time = results.reduce((sum, r) => sum + r.time17, 0) / results.length;

const min13Util = Math.min(...results.map(r => r.util13));
const max13Util = Math.max(...results.map(r => r.util13));
const min17Util = Math.min(...results.map(r => r.util17));
const max17Util = Math.max(...results.map(r => r.util17));

console.log('📊 OVERALL STATISTICS\n');
console.log('13" Sheets:');
console.log(`  Average Utilization: ${(avg13Util * 100).toFixed(2)}%`);
console.log(`  Range: ${(min13Util * 100).toFixed(2)}% - ${(max13Util * 100).toFixed(2)}%`);
console.log(`  Average Time: ${(avg13Time / 1000).toFixed(1)}s`);
console.log(`  90%+ Scenarios: ${results.filter(r => r.util13 >= 0.90).length}/20`);
console.log(`  85%+ Scenarios: ${results.filter(r => r.util13 >= 0.85).length}/20\n`);

console.log('17" Sheets:');
console.log(`  Average Utilization: ${(avg17Util * 100).toFixed(2)}%`);
console.log(`  Range: ${(min17Util * 100).toFixed(2)}% - ${(max17Util * 100).toFixed(2)}%`);
console.log(`  Average Time: ${(avg17Time / 1000).toFixed(1)}s`);
console.log(`  90%+ Scenarios: ${results.filter(r => r.util17 >= 0.90).length}/20`);
console.log(`  85%+ Scenarios: ${results.filter(r => r.util17 >= 0.85).length}/20\n`);

// By complexity
console.log('\n📈 PERFORMANCE BY COMPLEXITY\n');
const complexities = ['Simple', 'Medium', 'Complex', 'Very Complex'];

for (const complexity of complexities) {
  const filtered = results.filter(r => r.complexity === complexity);
  if (filtered.length === 0) continue;
  
  const avg13 = filtered.reduce((sum, r) => sum + r.util13, 0) / filtered.length;
  const avg17 = filtered.reduce((sum, r) => sum + r.util17, 0) / filtered.length;
  const avgTime13 = filtered.reduce((sum, r) => sum + r.time13, 0) / filtered.length;
  const avgTime17 = filtered.reduce((sum, r) => sum + r.time17, 0) / filtered.length;
  
  console.log(`${complexity}:`);
  console.log(`  13": ${(avg13 * 100).toFixed(2)}% avg util, ${(avgTime13 / 1000).toFixed(1)}s avg time`);
  console.log(`  17": ${(avg17 * 100).toFixed(2)}% avg util, ${(avgTime17 / 1000).toFixed(1)}s avg time\n`);
}

// Detailed results table
console.log('\n📋 DETAILED RESULTS TABLE\n');
console.log('┌─────┬──────────────────────────────┬───────┬──────────┬──────────┬─────────┬─────────┐');
console.log('│  #  │ Scenario Name                │ Items │  13% Util│  17% Util│ 13" Time│ 17" Time│');
console.log('├─────┼──────────────────────────────┼───────┼──────────┼──────────┼─────────┼─────────┤');

for (const result of results) {
  const name = result.scenarioName.padEnd(28).substring(0, 28);
  const id = result.scenarioId.toString().padStart(3);
  const items = result.imageCount.toString().padStart(5);
  const util13 = `${(result.util13 * 100).toFixed(1)}%`.padStart(8);
  const util17 = `${(result.util17 * 100).toFixed(1)}%`.padStart(8);
  const time13 = `${(result.time13 / 1000).toFixed(1)}s`.padStart(7);
  const time17 = `${(result.time17 / 1000).toFixed(1)}s`.padStart(7);
  
  console.log(`│ ${id} │ ${name} │ ${items} │ ${util13} │ ${util17} │ ${time13} │ ${time17} │`);
}

console.log('└─────┴──────────────────────────────┴───────┴──────────┴──────────┴─────────┴─────────┘\n');

// Best and worst performers
console.log('\n🏆 BEST PERFORMERS\n');
const best13 = results.sort((a, b) => b.util13 - a.util13)[0];
const best17 = results.sort((a, b) => b.util17 - a.util17)[0];

console.log(`Best 13" Utilization: Scenario ${best13.scenarioId} - ${best13.scenarioName}`);
console.log(`  ${(best13.util13 * 100).toFixed(2)}% with ${best13.imageCount} items\n`);

console.log(`Best 17" Utilization: Scenario ${best17.scenarioId} - ${best17.scenarioName}`);
console.log(`  ${(best17.util17 * 100).toFixed(2)}% with ${best17.imageCount} items\n`);

// Insights
console.log('\n💡 KEY INSIGHTS\n');

const avgItemsPerScenario = results.reduce((sum, r) => sum + r.imageCount, 0) / results.length;
const totalProcessingTime = results.reduce((sum, r) => sum + r.time13 + r.time17, 0);

console.log(`✓ Average items per scenario: ${avgItemsPerScenario.toFixed(0)}`);
console.log(`✓ Total processing time: ${(totalProcessingTime / 1000 / 60).toFixed(1)} minutes`);
console.log(`✓ Overall average utilization: ${((avg13Util + avg17Util) / 2 * 100).toFixed(2)}%`);
console.log(`✓ 13" vs 17" utilization diff: ${((avg13Util - avg17Util) * 100).toFixed(2)}%`);

const completionRate13 = results.reduce((sum, r) => sum + (r.placed13 / r.imageCount), 0) / results.length;
const completionRate17 = results.reduce((sum, r) => sum + (r.placed17 / r.imageCount), 0) / results.length;

console.log(`✓ 13" avg placement rate: ${(completionRate13 * 100).toFixed(1)}%`);
console.log(`✓ 17" avg placement rate: ${(completionRate17 * 100).toFixed(1)}%`);

// Gap analysis
const gapAnalysis = results.map(r => {
  const targetArea = r.totalArea;
  const actual13Area = r.util13 * (13 * r.length13);
  const actual17Area = r.util17 * (17 * r.length17);
  const gap13 = ((actual13Area - targetArea) / actual13Area) * 100;
  const gap17 = ((actual17Area - targetArea) / actual17Area) * 100;
  return { gap13, gap17 };
});

const avgGap13 = gapAnalysis.reduce((sum, g) => sum + g.gap13, 0) / gapAnalysis.length;
const avgGap17 = gapAnalysis.reduce((sum, g) => sum + g.gap17, 0) / gapAnalysis.length;

console.log(`✓ 13" avg wasted space: ${avgGap13.toFixed(1)}%`);
console.log(`✓ 17" avg wasted space: ${avgGap17.toFixed(1)}%`);

console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                    TEST COMPLETE                                  ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

console.log(`📁 Results saved to memory for analysis`);
console.log(`⏱️  Total test duration: ${(totalProcessingTime / 1000 / 60).toFixed(1)} minutes\n`);

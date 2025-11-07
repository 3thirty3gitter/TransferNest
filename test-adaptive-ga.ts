#!/usr/bin/env tsx
// Test adaptive genetic algorithm with diverse image batches

import { executeNesting, type ManagedImage } from './src/lib/nesting-algorithm';

interface TestScenario {
  name: string;
  description: string;
  images: ManagedImage[];
}

// Create test scenarios with varying diversity
const scenarios: TestScenario[] = [
  {
    name: "Uniform Sizes",
    description: "10 images all the same size (3x3), varying copies",
    images: [
      { id: '1', url: '', width: 3, height: 3, copies: 5, aspectRatio: 1 },
      { id: '2', url: '', width: 3, height: 3, copies: 8, aspectRatio: 1 },
      { id: '3', url: '', width: 3, height: 3, copies: 3, aspectRatio: 1 },
      { id: '4', url: '', width: 3, height: 3, copies: 12, aspectRatio: 1 },
      { id: '5', url: '', width: 3, height: 3, copies: 6, aspectRatio: 1 },
      { id: '6', url: '', width: 3, height: 3, copies: 4, aspectRatio: 1 },
      { id: '7', url: '', width: 3, height: 3, copies: 9, aspectRatio: 1 },
      { id: '8', url: '', width: 3, height: 3, copies: 7, aspectRatio: 1 },
      { id: '9', url: '', width: 3, height: 3, copies: 2, aspectRatio: 1 },
      { id: '10', url: '', width: 3, height: 3, copies: 10, aspectRatio: 1 },
    ]
  },
  {
    name: "Moderate Diversity",
    description: "5 different sizes, mixed copies",
    images: [
      { id: '1', url: '', width: 2, height: 2, copies: 8, aspectRatio: 1 },
      { id: '2', url: '', width: 3, height: 3, copies: 6, aspectRatio: 1 },
      { id: '3', url: '', width: 4, height: 4, copies: 4, aspectRatio: 1 },
      { id: '4', url: '', width: 5, height: 5, copies: 3, aspectRatio: 1 },
      { id: '5', url: '', width: 6, height: 6, copies: 2, aspectRatio: 1 },
    ]
  },
  {
    name: "High Size Diversity",
    description: "10 different sizes, 1-3 copies each",
    images: [
      { id: '1', url: '', width: 1.5, height: 2, copies: 2, aspectRatio: 0.75 },
      { id: '2', url: '', width: 2.5, height: 3, copies: 3, aspectRatio: 0.83 },
      { id: '3', url: '', width: 3, height: 4, copies: 1, aspectRatio: 0.75 },
      { id: '4', url: '', width: 4, height: 3, copies: 2, aspectRatio: 1.33 },
      { id: '5', url: '', width: 5, height: 2.5, copies: 1, aspectRatio: 2 },
      { id: '6', url: '', width: 2, height: 5, copies: 2, aspectRatio: 0.4 },
      { id: '7', url: '', width: 3.5, height: 3.5, copies: 3, aspectRatio: 1 },
      { id: '8', url: '', width: 6, height: 2, copies: 1, aspectRatio: 3 },
      { id: '9', url: '', width: 4.5, height: 4, copies: 2, aspectRatio: 1.125 },
      { id: '10', url: '', width: 2, height: 6, copies: 1, aspectRatio: 0.33 },
    ]
  },
  {
    name: "Extreme Aspect Ratios",
    description: "Mix of very wide and very tall images",
    images: [
      { id: '1', url: '', width: 8, height: 1.5, copies: 5, aspectRatio: 5.33 },
      { id: '2', url: '', width: 1.5, height: 8, copies: 5, aspectRatio: 0.19 },
      { id: '3', url: '', width: 6, height: 2, copies: 4, aspectRatio: 3 },
      { id: '4', url: '', width: 2, height: 6, copies: 4, aspectRatio: 0.33 },
      { id: '5', url: '', width: 3, height: 3, copies: 6, aspectRatio: 1 },
      { id: '6', url: '', width: 10, height: 1, copies: 3, aspectRatio: 10 },
      { id: '7', url: '', width: 1, height: 10, copies: 3, aspectRatio: 0.1 },
      { id: '8', url: '', width: 5, height: 2.5, copies: 5, aspectRatio: 2 },
    ]
  },
  {
    name: "Wild Mix",
    description: "10 sizes with extreme variety in copies and dimensions",
    images: [
      { id: '1', url: '', width: 1, height: 1, copies: 20, aspectRatio: 1 },
      { id: '2', url: '', width: 7, height: 1.5, copies: 1, aspectRatio: 4.67 },
      { id: '3', url: '', width: 2.5, height: 2.5, copies: 10, aspectRatio: 1 },
      { id: '4', url: '', width: 1.5, height: 7, copies: 2, aspectRatio: 0.21 },
      { id: '5', url: '', width: 4, height: 3, copies: 5, aspectRatio: 1.33 },
      { id: '6', url: '', width: 3, height: 5, copies: 3, aspectRatio: 0.6 },
      { id: '7', url: '', width: 6, height: 2, copies: 4, aspectRatio: 3 },
      { id: '8', url: '', width: 2, height: 2, copies: 15, aspectRatio: 1 },
      { id: '9', url: '', width: 5, height: 4, copies: 2, aspectRatio: 1.25 },
      { id: '10', url: '', width: 8, height: 1, copies: 1, aspectRatio: 8 },
    ]
  },
  {
    name: "Production Scale",
    description: "Large batch with 15 different designs",
    images: [
      { id: '1', url: '', width: 3, height: 3, copies: 12, aspectRatio: 1 },
      { id: '2', url: '', width: 4, height: 2.5, copies: 8, aspectRatio: 1.6 },
      { id: '3', url: '', width: 2, height: 4, copies: 10, aspectRatio: 0.5 },
      { id: '4', url: '', width: 5, height: 3, copies: 6, aspectRatio: 1.67 },
      { id: '5', url: '', width: 2.5, height: 2.5, copies: 15, aspectRatio: 1 },
      { id: '6', url: '', width: 6, height: 2, copies: 5, aspectRatio: 3 },
      { id: '7', url: '', width: 3.5, height: 4, copies: 8, aspectRatio: 0.875 },
      { id: '8', url: '', width: 4.5, height: 3.5, copies: 7, aspectRatio: 1.29 },
      { id: '9', url: '', width: 2, height: 6, copies: 4, aspectRatio: 0.33 },
      { id: '10', url: '', width: 3, height: 5, copies: 6, aspectRatio: 0.6 },
      { id: '11', url: '', width: 7, height: 2, copies: 3, aspectRatio: 3.5 },
      { id: '12', url: '', width: 2.5, height: 3.5, copies: 9, aspectRatio: 0.71 },
      { id: '13', url: '', width: 4, height: 4, copies: 5, aspectRatio: 1 },
      { id: '14', url: '', width: 5.5, height: 2.5, copies: 4, aspectRatio: 2.2 },
      { id: '15', url: '', width: 3, height: 3, copies: 8, aspectRatio: 1 },
    ]
  }
];

console.log('🧬 ADAPTIVE GENETIC ALGORITHM TEST SUITE');
console.log('=' .repeat(80));
console.log('Testing GA performance with varying image diversity\n');

const results: Array<{
  scenario: string;
  totalItems: number;
  uniqueSizes: number;
  utilization13: number;
  utilization17: number;
}> = [];

for (const scenario of scenarios) {
  console.log(`\n📦 ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  
  const totalItems = scenario.images.reduce((sum, img) => sum + img.copies, 0);
  const uniqueSizes = new Set(scenario.images.map(img => `${img.width}x${img.height}`)).size;
  
  console.log(`   Total items: ${totalItems}, Unique sizes: ${uniqueSizes}`);
  
  // Test 13" sheet
  console.log('\n   🔷 Testing 13" sheet...');
  const result13 = executeNesting(scenario.images, 13);
  const util13 = (result13.areaUtilizationPct * 100).toFixed(1);
  console.log(`   ✓ 13" sheet: ${util13}% utilization, ${result13.sheetLength.toFixed(1)}" length`);
  
  // Test 17" sheet
  console.log('   🔷 Testing 17" sheet...');
  const result17 = executeNesting(scenario.images, 17);
  const util17 = (result17.areaUtilizationPct * 100).toFixed(1);
  console.log(`   ✓ 17" sheet: ${util17}% utilization, ${result17.sheetLength.toFixed(1)}" length`);
  
  results.push({
    scenario: scenario.name,
    totalItems,
    uniqueSizes,
    utilization13: parseFloat(util13),
    utilization17: parseFloat(util17)
  });
}

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('📊 SUMMARY RESULTS');
console.log('='.repeat(80));
console.log('\n┌─────────────────────────┬───────┬───────┬─────────┬─────────┐');
console.log('│ Scenario                │ Items │ Sizes │ 13" (%) │ 17" (%) │');
console.log('├─────────────────────────┼───────┼───────┼─────────┼─────────┤');

results.forEach(r => {
  const scenario = r.scenario.padEnd(23);
  const items = r.totalItems.toString().padStart(5);
  const sizes = r.uniqueSizes.toString().padStart(5);
  const util13 = r.utilization13.toFixed(1).padStart(7);
  const util17 = r.utilization17.toFixed(1).padStart(7);
  console.log(`│ ${scenario} │ ${items} │ ${sizes} │ ${util13} │ ${util17} │`);
});

console.log('└─────────────────────────┴───────┴───────┴─────────┴─────────┘');

// Calculate averages
const avg13 = results.reduce((sum, r) => sum + r.utilization13, 0) / results.length;
const avg17 = results.reduce((sum, r) => sum + r.utilization17, 0) / results.length;

console.log('\n📈 Average Utilization:');
console.log(`   13" sheets: ${avg13.toFixed(1)}%`);
console.log(`   17" sheets: ${avg17.toFixed(1)}%`);

// Check if we hit targets
const target = 90;
const passing13 = results.filter(r => r.utilization13 >= target).length;
const passing17 = results.filter(r => r.utilization17 >= target).length;

console.log(`\n🎯 Target Achievement (90%+):`);
console.log(`   13" sheets: ${passing13}/${results.length} scenarios`);
console.log(`   17" sheets: ${passing17}/${results.length} scenarios`);

if (avg13 >= 88 && avg17 >= 88) {
  console.log('\n✅ EXCELLENT: Adaptive algorithm achieves 88%+ average across all scenarios!');
} else if (avg13 >= 85 && avg17 >= 85) {
  console.log('\n✓ GOOD: Algorithm achieves 85%+ average utilization');
} else {
  console.log('\n⚠️  NEEDS IMPROVEMENT: Average utilization below 85%');
}

console.log('\n' + '='.repeat(80));

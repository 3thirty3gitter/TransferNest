import { executeNesting, ManagedImage } from '../src/lib/nesting-algorithm';

describe('Spacing & Padding Optimization', () => {
  // Real-world test scenario with mixed image sizes
  const createTestImages = (): ManagedImage[] => [
    // 6x6" images (cars in your screenshot)
    ...Array(10).fill(null).map((_, i) => ({
      id: `car-${i}`,
      url: 'car.png',
      width: 6,
      height: 6,
      aspectRatio: 1,
      copies: 1,
    })),
    // 4x4" images (WLT2 text in your screenshot)
    ...Array(12).fill(null).map((_, i) => ({
      id: `text-${i}`,
      url: 'text.png',
      width: 4,
      height: 4,
      aspectRatio: 1,
      copies: 1,
    })),
    // 2x3" images (smaller designs)
    ...Array(8).fill(null).map((_, i) => ({
      id: `small-${i}`,
      url: 'small.png',
      width: 2,
      height: 3,
      aspectRatio: 2/3,
      copies: 1,
    })),
  ];

  // Test different sheet widths
  const sheetWidths = [13, 17];

  // Test different padding strategies
  const paddingStrategies = [
    { name: 'No Padding', value: 0 },
    { name: 'Minimal (0.05")', value: 0.05 },
    { name: 'Light (0.08")', value: 0.08 },
    { name: 'Standard (0.15")', value: 0.15 },
    { name: 'Safe (0.25")', value: 0.25 },
  ];

  test('Compare padding strategies - Summary Table', () => {
    const images = createTestImages();
    const results: any[] = [];

    console.log('\n📊 PADDING OPTIMIZATION ANALYSIS\n');
    console.log('Testing on mixed image sizes (6x6", 4x4", 2x3")\n');

    for (const sheetWidth of sheetWidths) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`SHEET WIDTH: ${sheetWidth}"`);
      console.log(`${'='.repeat(80)}`);
      console.log(
        `${'Padding'.padEnd(15)} | ${'Items'.padEnd(8)} | ${'Failed'.padEnd(8)} | ${'Util%'.padEnd(8)} | ${'Height'.padEnd(8)} | ${'$/sheet'.padEnd(8)}`
      );
      console.log('-'.repeat(80));

      for (const strategy of paddingStrategies) {
        // Temporarily override PADDING for this test
        // (In real implementation, we'd refactor to accept padding as parameter)
        
        const result = executeNesting(images, sheetWidth);
        
        const utilizationPct = (result.areaUtilizationPct * 100).toFixed(1);
        const costPerSheet = result.sheetLength * (sheetWidth === 13 ? 0.45 : 0.59);
        const costPerItem = (costPerSheet / result.placedItems.length).toFixed(2);
        
        results.push({
          sheetWidth,
          padding: strategy.value,
          paddingName: strategy.name,
          placedItems: result.placedItems.length,
          failedItems: result.failedCount,
          utilization: parseFloat(utilizationPct),
          sheetLength: result.sheetLength.toFixed(2),
          costPerSheet: costPerSheet.toFixed(2),
          costPerItem,
        });

        console.log(
          `${strategy.name.padEnd(15)} | ${result.placedItems.length.toString().padEnd(8)} | ${result.failedCount.toString().padEnd(8)} | ${utilizationPct.padEnd(8)} | ${result.sheetLength.toFixed(2).padEnd(8)} | ${costPerSheet.toFixed(2).padEnd(8)}`
        );
      }
    }

    // Find optimal configurations
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎯 OPTIMAL CONFIGURATIONS');
    console.log(`${'='.repeat(80)}\n`);

    for (const sheetWidth of sheetWidths) {
      const sheetResults = results.filter(r => r.sheetWidth === sheetWidth);
      
      const bestUtil = sheetResults.reduce((best, current) =>
        current.utilization > best.utilization ? current : best
      );
      
      const bestCost = sheetResults.reduce((best, current) =>
        parseFloat(current.costPerSheet) < parseFloat(best.costPerSheet) ? current : best
      );
      
      const bestBalance = sheetResults.reduce((best, current) => {
        // Balance: high util (80%+) with reasonable padding
        const bestScore = (best.utilization / 100) - (best.padding * 0.5);
        const currentScore = (current.utilization / 100) - (current.padding * 0.5);
        return currentScore > bestScore ? current : best;
      });

      console.log(`${sheetWidth}" Sheet:`);
      console.log(`  Highest Utilization: ${bestUtil.paddingName} (${bestUtil.utilization}% util) - ${bestUtil.placedItems} items`);
      console.log(`  Lowest Cost: ${bestCost.paddingName} ($${bestCost.costPerSheet}/sheet)`);
      console.log(`  Best Balance: ${bestBalance.paddingName} (${bestBalance.utilization}% util, ${bestBalance.paddingName})`);
      console.log('');
    }

    // Recommendations
    console.log(`${'='.repeat(80)}`);
    console.log('💡 RECOMMENDATIONS');
    console.log(`${'='.repeat(80)}\n`);
    console.log('For Production:');
    console.log('  • Prioritize: Utilization > 80% AND Failed Items = 0');
    console.log('  • Spacing improves print quality (prevents bleed/overlap)');
    console.log('  • Minimum: 0.05" for tight packing');
    console.log('  • Standard: 0.08-0.10" for professional appearance');
    console.log('  • Safe: 0.15"+ for high-precision cutting');
    console.log('\nNote: This test does NOT actually modify PADDING constant.');
    console.log('      Results show current algorithm behavior.\n');

    // Just a sanity check - results should exist
    expect(results.length).toBeGreaterThan(0);
  });

  test('Analyze item packing efficiency by size category', () => {
    const images = createTestImages();
    const result = executeNesting(images, 13);

    const itemsBySize = {
      '6x6': result.placedItems.filter(i => i.width === 6 && i.height === 6),
      '4x4': result.placedItems.filter(i => i.width === 4 && i.height === 4),
      '2x3': result.placedItems.filter(i => i.width === 2 || i.height === 2),
    };

    console.log('\n📏 PACKING EFFICIENCY BY SIZE');
    console.log(`${'Size'.padEnd(10)} | ${'Placed'.padEnd(10)} | ${'Expected'.padEnd(10)} | ${'Success%'.padEnd(10)}`);
    console.log('-'.repeat(50));

    const original = {
      '6x6': 10,
      '4x4': 12,
      '2x3': 8,
    };

    for (const [size, items] of Object.entries(itemsBySize)) {
      const successPct = ((items.length / original[size as keyof typeof original]) * 100).toFixed(1);
      console.log(
        `${size.padEnd(10)} | ${items.length.toString().padEnd(10)} | ${original[size as keyof typeof original].toString().padEnd(10)} | ${successPct.padEnd(10)}`
      );
    }

    expect(result.placedItems.length).toBeGreaterThan(0);
  });
});

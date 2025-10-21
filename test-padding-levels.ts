import { executeNesting } from './src/lib/nesting-algorithm';
import type { ManagedImage } from './src/lib/nesting-algorithm';

// Simulate your image mix
const images: ManagedImage[] = Array(126).fill(null).map((_, i) => ({
  id: `img-${i}`,
  url: 'test.jpg',
  width: 4 + (Math.random() * 3),  // 4-7" random
  height: 3 + (Math.random() * 4), // 3-7" random
  aspectRatio: 1,
  copies: 1,
}));

console.log('\n📊 PADDING REDUCTION ANALYSIS (126 items)');
console.log('Padding | Utilization | Height | Cost/Sheet');
console.log('--------|--------------|--------|----------');

const paddings = [0.08, 0.06, 0.04, 0.02, 0];

for (const pad of paddings) {
  const result = executeNesting(images, 13, pad);
  const util = (result.areaUtilizationPct * 100).toFixed(1);
  const height = result.sheetLength.toFixed(1);
  const cost = (result.sheetLength * 0.45).toFixed(2);
  const padStr = pad === 0 ? 'None' : `${pad.toFixed(2)}"`;
  console.log(`${padStr.padEnd(7)} | ${util.padEnd(12)}% | ${height.padEnd(6)}" | $${cost}`);
}

console.log('\n💡 Recommendation: Pick the padding that gives 80%+ util with acceptable print quality\n');

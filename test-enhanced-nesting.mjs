import { executeEnhancedNesting } from './src/lib/nesting-algorithm.js';

const testImages = [
  { id: '1', url: 'test1.png', width: 4, height: 6, aspectRatio: 0.67, copies: 2 },
  { id: '2', url: 'test2.png', width: 3, height: 4, aspectRatio: 0.75, copies: 1 },
  { id: '3', url: 'test3.png', width: 2, height: 8, aspectRatio: 0.25, copies: 3 }
];

console.log('Testing Enhanced BLF Algorithm...');
const result = executeEnhancedNesting(testImages, 13, 'BottomLeftFill');
console.log('Results:', {
  placedCount: result.placedItems.length,
  failedCount: result.failedCount,
  sheetLength: result.sheetLength.toFixed(2),
  utilization: (result.areaUtilizationPct * 100).toFixed(1) + '%'
});

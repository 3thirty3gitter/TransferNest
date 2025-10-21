#!/usr/bin/env node
/**
 * Diagnostic Script - Check current packing behavior
 */

import { executeNesting } from './src/lib/nesting-algorithm';
import type { ManagedImage } from './src/lib/nesting-algorithm';

// Test with simple cases to see what's happening
const simpleTest = (): ManagedImage[] => [
  {
    id: 'test-1',
    url: 'test.jpg',
    width: 6,
    height: 6,
    aspectRatio: 1,
    copies: 10,
  },
];

const complexTest = (): ManagedImage[] => [
  // 6x6 cars
  { id: 'car', url: 'car.png', width: 6, height: 6, aspectRatio: 1, copies: 10 },
  // 4x4 text
  { id: 'text', url: 'text.png', width: 4, height: 4, aspectRatio: 1, copies: 12 },
  // 2x3 small
  { id: 'small', url: 'small.png', width: 2, height: 3, aspectRatio: 2/3, copies: 8 },
];

console.log('\n🔍 DIAGNOSTIC: Current Packing Behavior\n');

console.log('=== TEST 1: Simple 6x6" items ===');
const simple13 = executeNesting(simpleTest(), 13);
console.log(`13" Sheet: ${simple13.placedItems.length}/${simple13.totalCount} items, ${simple13.areaUtilizationPct * 100 | 0}% util, ${simple13.sheetLength.toFixed(2)}" height`);
console.log(`  Config: 0.08" padding (default)\n`);

const simple17 = executeNesting(simpleTest(), 17);
console.log(`17" Sheet: ${simple17.placedItems.length}/${simple17.totalCount} items, ${simple17.areaUtilizationPct * 100 | 0}% util, ${simple17.sheetLength.toFixed(2)}" height\n`);

console.log('=== TEST 2: Mixed sizes (car, text, small) ===');
const complex13 = executeNesting(complexTest(), 13);
console.log(`13" Sheet: ${complex13.placedItems.length}/${complex13.totalCount} items, ${complex13.areaUtilizationPct * 100 | 0}% util, ${complex13.sheetLength.toFixed(2)}" height\n`);

const complex17 = executeNesting(complexTest(), 17);
console.log(`17" Sheet: ${complex17.placedItems.length}/${complex17.totalCount} items, ${complex17.areaUtilizationPct * 100 | 0}% util, ${complex17.sheetLength.toFixed(2)}" height\n`);

console.log('=== TEST 3: Check padding effect ===');
const noPad = executeNesting(simpleTest(), 13, 0);
const lightPad = executeNesting(simpleTest(), 13, 0.08);
const heavyPad = executeNesting(simpleTest(), 13, 0.25);

console.log(`No Padding:   ${noPad.areaUtilizationPct * 100 | 0}% util, ${noPad.sheetLength.toFixed(2)}" height`);
console.log(`0.08" Padding: ${lightPad.areaUtilizationPct * 100 | 0}% util, ${lightPad.sheetLength.toFixed(2)}" height`);
console.log(`0.25" Padding: ${heavyPad.areaUtilizationPct * 100 | 0}% util, ${heavyPad.sheetLength.toFixed(2)}" height\n`);

console.log('💡 If utilization is much lower than expected:');
console.log('   - Check image dimensions (width/height)');
console.log('   - Verify aspect ratios are correct');
console.log('   - Look at packer initialization (is padding being applied?)');
console.log('   - Check if items are being rejected (enforcement checks)\n');

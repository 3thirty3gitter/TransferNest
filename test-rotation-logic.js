// Test the rotation logic to understand what's happening

console.log('\n=== ROTATION LOGIC TEST ===\n');

// Scenario: Image is 8" × 4" (wide), needs to be rotated to fit tall
const originalWidth = 8;
const originalHeight = 4;
const dpi = 300;
const isRotated = true;

console.log('Original image:', originalWidth, '×', originalHeight, 'inches');
console.log('Rotated:', isRotated);
console.log('');

// Current code logic:
const imageWidth = Math.round(originalWidth * dpi);  // 2400px
const imageHeight = Math.round(originalHeight * dpi); // 1200px

console.log('Step 1 - Resize to original orientation:');
console.log('  imageWidth:', imageWidth, 'px');
console.log('  imageHeight:', imageHeight, 'px');
console.log('  Buffer is: 2400 × 1200 (wide)');
console.log('');

if (isRotated) {
  console.log('Step 2 - Rotate -90 degrees:');
  console.log('  Buffer becomes: 1200 × 2400 (tall)');
  console.log('');
  
  console.log('Step 3 - Extract (CURRENT CODE):');
  console.log('  width: imageHeight =', imageHeight, 'px');
  console.log('  height: imageWidth =', imageWidth, 'px');
  console.log('  Extracting: 1200 × 2400 from 1200 × 2400 buffer ✓');
  console.log('');
  
  console.log('Step 4 - Composite to canvas:');
  console.log('  Placing 1200 × 2400 buffer at position (x, y)');
  console.log('  This matches the rotated dimensions! ✓');
}

console.log('\n=== WAIT, THEN WHY STRETCHING? ===\n');

console.log('Hypothesis: The issue might be:');
console.log('1. Sharp.composite() might be resizing the input buffer');
console.log('2. The blend mode might not be enough');
console.log('3. We need to verify extract() is working correctly');
console.log('');

console.log('Solution: Add explicit composite options:');
console.log('  - gravity: "northwest" (no centering)');
console.log('  - blend: "over" (already added)');
console.log('  - premultiplied: false (if needed)');


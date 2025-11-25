
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function testSharpRotation() {
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 400);

    // Scenario:
    // Original Image: 100x50 (Wide) - "NELLA'S MOM"
    // Rotated Slot on Sheet: 50x100 (Tall)

    const originalWidth = 100;
    const originalHeight = 50;

    const slotWidth = 50;  // = originalHeight
    const slotHeight = 100; // = originalWidth

    const x = 100;
    const y = 100;

    // Draw Slot Outline (Green)
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, slotWidth, slotHeight);

    // Create Mock Image Buffer (Wide 100x50)
    const imgBuffer = await sharp({
        create: {
            width: originalWidth,
            height: originalHeight,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 } // Red
        }
    })
        .composite([{
            input: Buffer.from(`
      <svg width="${originalWidth}" height="${originalHeight}">
        <text x="10" y="30" font-size="20" fill="blue">MOM</text>
        <rect x="0" y="0" width="10" height="10" fill="black" />
      </svg>
    `),
            top: 0,
            left: 0
        }])
        .png()
        .toBuffer();

    // --- THE NEW LOGIC ---

    console.log('Original Buffer created.');

    // 1. Pre-Rotate with Sharp
    console.log('Rotating buffer with Sharp...');
    const rotatedBuffer = await sharp(imgBuffer)
        .rotate(90)
        .toBuffer();

    // 2. Load into Canvas
    const image = await loadImage(rotatedBuffer);

    console.log(`Loaded Image Dimensions: ${image.width}x${image.height}`);
    // Expect: 50x100

    // 3. Draw directly into slot
    // No ctx.rotate, No ctx.translate (other than position)
    // We use the slot dimensions (which match the rotated image dimensions)
    ctx.drawImage(image, x, y, slotWidth, slotHeight);

    const outPath = path.join(process.cwd(), 'test_sharp_rotation.png');
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log('Saved to', outPath);
}

testSharpRotation();

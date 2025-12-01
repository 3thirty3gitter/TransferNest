
const sharp = require('sharp');
const fs = require('fs');

async function test() {
  console.log('Creating transparent canvas...');
  
  const width = 300;
  const height = 300;
  
  // Method 1: create with background alpha 0
  const canvas = sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });
  
  // Add a red square in the middle to see if it composites correctly
  const redSquare = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  }).png().toBuffer();
  
  const output = await canvas
    .composite([{ input: redSquare, left: 100, top: 100 }])
    .png()
    .toBuffer();
    
  await fs.promises.writeFile('test_output.png', output);
  console.log('Saved test_output.png');
  
  // Check metadata
  const metadata = await sharp(output).metadata();
  console.log('Metadata:', {
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
    space: metadata.space
  });
  
  // Check corner pixel (should be transparent)
  const raw = await sharp(output)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer();
    
  console.log('Corner pixel (RGBA):', raw[0], raw[1], raw[2], raw[3]);
}

test().catch(console.error);

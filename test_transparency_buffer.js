
const sharp = require('sharp');
const fs = require('fs');

async function test() {
  console.log('Testing Buffer.alloc transparency...');
  const width = 100;
  const height = 100;
  const buffer = Buffer.alloc(width * height * 4, 0);
  
  const canvas = sharp(buffer, {
    raw: { width, height, channels: 4 }
  });
  
  const output = await canvas
    .png({ palette: false })
    .toBuffer();
    
  const meta = await sharp(output).metadata();
  console.log('Metadata:', {
    channels: meta.channels,
    hasAlpha: meta.hasAlpha,
    space: meta.space
  });
  
  const raw = await sharp(output).raw().toBuffer();
  console.log('First pixel (RGBA):', raw[0], raw[1], raw[2], raw[3]);
  
  if (raw[0] === 0 && raw[3] === 0) {
    console.log('SUCCESS: Pixel is transparent black');
  } else {
    console.log('FAILURE: Pixel is not transparent');
  }
}
test().catch(console.error);

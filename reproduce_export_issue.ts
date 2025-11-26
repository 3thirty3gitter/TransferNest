
import { PrintExportGenerator } from './src/lib/print-export';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Mock global fetch
global.fetch = async (url: string | URL | Request) => {
    console.log(`[MOCK] Fetching ${url}`);

    // Create a 100x50 image (Wide)
    const width = 100;
    const height = 50;

    const imgBuffer = await sharp({
        create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 } // Red background
        }
    })
        .composite([{
            input: Buffer.from(`
            <svg width="${width}" height="${height}">
                <text x="10" y="30" font-size="20" fill="blue">TEST</text>
                <rect x="0" y="0" width="10" height="10" fill="black" />
            </svg>
        `),
            top: 0,
            left: 0
        }])
        .png()
        .toBuffer();

    return {
        ok: true,
        status: 200,
        arrayBuffer: async () => imgBuffer,
    } as unknown as Response;
};

async function runTest() {
    const generator = new PrintExportGenerator();

    // Scenario: Rotated image
    // Original: 100x50 (Wide)
    // Rotated in layout: 50x100 (Tall)

    const images = [
        {
            id: 'test-img-1',
            url: 'http://mock/image.png',
            x: 1, // inches
            y: 1, // inches
            width: 100, // pixels (raw width from nesting)
            height: 50, // pixels (raw height from nesting)
            originalWidth: 100,
            originalHeight: 50,
            rotated: true
        }
    ];

    console.log('Generating print file...');
    const result = await generator.generatePrintFile(images as any, '13', { dpi: 300 }); // 300 DPI

    const outPath = path.join(process.cwd(), 'reproduce_output.png');
    fs.writeFileSync(outPath, result.buffer);
    console.log(`Saved output to ${outPath}`);
    console.log('Dimensions:', result.dimensions);
}

runTest().catch(console.error);

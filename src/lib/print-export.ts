import { NestedImage } from '@/lib/nesting-algorithm';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';

export interface PrintExportOptions {
    dpi: number;
    sheetSize: '13' | '17';
    format: 'png' | 'pdf';
    quality: number;
}

export interface PrintExportResult {
    buffer: Buffer;
    filename: string;
    dimensions: {
        width: number;
        height: number;
        dpi: number;
    };
    metadata: {
        imageCount: number;
        totalArea: number;
        utilization: number;
    };
}

const SHEET_DIMENSIONS = {
    '13': { width: 13, height: 19 },
    '17': { width: 17, height: 22 }
} as const;

export class PrintExportGenerator {
    private readonly defaultOptions: PrintExportOptions = {
        dpi: 300,
        sheetSize: '13',
        format: 'png',
        quality: 100
    };

    async generatePrintFile(
        images: NestedImage[],
        sheetSize: '13' | '17',
        options: Partial<PrintExportOptions> = {}
    ): Promise<PrintExportResult> {
        const opts = { ...this.defaultOptions, sheetSize, ...options };
        const sheet = SHEET_DIMENSIONS[sheetSize];

        // CRITICAL: Assume source images are 300 DPI (standard for uploaded graphics)
        const SOURCE_DPI = 300;
        const EXPORT_DPI = opts.dpi;

        const pixelWidth = Math.round(sheet.width * EXPORT_DPI);
        const pixelHeight = Math.round(sheet.height * EXPORT_DPI);

        const totalArea = images.reduce((sum, img) => sum + (img.width * img.height), 0);
        const sheetArea = sheet.width * sheet.height;
        const utilization = Math.round((totalArea / sheetArea) * 100);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `dtf-print-${sheetSize}x-${opts.dpi}dpi-${timestamp}.png`;

        console.log(`[PRINT] Generating print file: ${filename}`, {
            imageCount: images.length,
            dimensions: `${pixelWidth}x${pixelHeight}px`,
            utilization: `${utilization}%`,
            method: 'node-canvas'
        });

        // Create canvas at exact print resolution
        const canvas = createCanvas(pixelWidth, pixelHeight);
        const ctx = canvas.getContext('2d');

        // White background for print
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, pixelWidth, pixelHeight);

        // Fetch and draw each image
        for (const imgData of images) {
            try {
                if (!imgData.url || imgData.url.trim() === '') {
                    console.warn(`[PRINT] Skipping image ${imgData.id} - no URL`);
                    continue;
                }

                // Download image from Firebase URL using native fetch
                console.log(`[PRINT] Fetching ${imgData.id} from ${imgData.url.substring(0, 60)}...`);

                const response = await fetch(imgData.url);

                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const imgBuffer = Buffer.from(arrayBuffer);

                // Load as image (node-canvas handles PNG/JPG)
                const image = await loadImage(imgBuffer);

                // CRITICAL FIX #1: Convert PIXEL dimensions to INCHES
                // Algorithm stores raw pixels in width/height fields, but they're documented as inches
                const widthInches = imgData.width / SOURCE_DPI;   // Convert pixels to inches
                const heightInches = imgData.height / SOURCE_DPI; // Convert pixels to inches

                // x, y ARE in inches (algorithm converts positions correctly), so:
                const xPx = imgData.x * EXPORT_DPI;  // Position in export pixels
                const yPx = imgData.y * EXPORT_DPI;

                // Frame dimensions in export pixels (inches * EXPORT_DPI)
                const frameWidthPx = widthInches * EXPORT_DPI;   // Should equal imgData.width (pixels)
                const frameHeightPx = heightInches * EXPORT_DPI; // Should equal imgData.height (pixels)

                console.log(`[PRINT] Drawing ${imgData.id} at (${Math.round(xPx)}, ${Math.round(yPx)}) size ${Math.round(frameWidthPx)}x${Math.round(frameHeightPx)}px${imgData.rotated ? ' [ROTATED]' : ''}`);

                ctx.save();

                if (imgData.rotated) {
                    // CRITICAL FIX #2: Match preview's CSS transform order and origin
                    // Preview: Container at (x*40, y*40), swapped dimensions
                    // Inner div: original size, rotate(90deg) translateY(-100%), origin top-left

                    // Step 1: Position to top-left of rotated container
                    const containerLeft = xPx;
                    const containerTop = yPx;

                    // Step 2: Apply transforms matching CSS order
                    ctx.translate(containerLeft, containerTop);                    // Container position
                    ctx.rotate(Math.PI / 2);                                       // rotate(90deg)
                    ctx.translate(0, -frameWidthPx);                               // translateY(-100%) of original width

                    // Step 3: Draw image centered within original frame
                    ctx.drawImage(
                        image,
                        -frameWidthPx / 2,   // Center in original frame
                        -frameHeightPx / 2,
                        frameWidthPx,        // Original dimensions
                        frameHeightPx
                    );

                } else {
                    // Non-rotated: Simple positioning
                    ctx.drawImage(
                        image,
                        xPx,
                        yPx,
                        frameWidthPx,
                        frameHeightPx
                    );
                }

                ctx.restore();

            } catch (error) {
                console.error(`[PRINT] Failed to process image ${imgData.id}:`, error);
                // Draw placeholder for failed images
                ctx.fillStyle = '#cccccc';
                ctx.fillRect(imgData.x * EXPORT_DPI, imgData.y * EXPORT_DPI,
                    (imgData.width / SOURCE_DPI) * EXPORT_DPI,
                    (imgData.height / SOURCE_DPI) * EXPORT_DPI);

                // Add error text to placeholder
                ctx.fillStyle = '#ff0000';
                ctx.font = `${20 * (EXPORT_DPI / 72)}px sans-serif`;
                ctx.fillText('Image Failed', imgData.x * EXPORT_DPI + 10, imgData.y * EXPORT_DPI + 50);
            }
        }

        // Export to PNG buffer
        let pngBuffer = canvas.toBuffer('image/png');

        // Embed DPI metadata using Sharp
        try {
            pngBuffer = await sharp(pngBuffer)
                .withMetadata({ density: EXPORT_DPI })
                .png()
                .toBuffer();
        } catch (sharpError) {
            console.warn('[PRINT] Sharp metadata embedding failed, returning raw canvas buffer:', sharpError);
            // Continue with raw buffer if sharp fails
        }

        console.log(`✅ [PRINT] Generated print file: ${filename} (${(pngBuffer.length / 1024).toFixed(2)} KB)`);

        return {
            buffer: pngBuffer,
            filename,
            dimensions: {
                width: pixelWidth,
                height: pixelHeight,
                dpi: opts.dpi
            },
            metadata: {
                imageCount: images.length,
                totalArea: Math.round(totalArea * 100) / 100,
                utilization
            }
        };
    }

    async generatePreview(
        images: NestedImage[],
        sheetSize: '13' | '17',
        previewWidth: number = 800
    ): Promise<{ width: number; height: number; metadata: any }> {
        const sheet = SHEET_DIMENSIONS[sheetSize];
        const aspectRatio = sheet.height / sheet.width;
        const previewHeight = Math.round(previewWidth * aspectRatio);

        return {
            width: previewWidth,
            height: previewHeight,
            metadata: {
                imageCount: images.length,
                sheetSize,
                format: 'preview'
            }
        };
    }

    calculatePrintPricing(images: NestedImage[], sheetSize: '13' | '17') {
        const sheet = SHEET_DIMENSIONS[sheetSize];
        const totalSheetArea = sheet.width * sheet.height;

        const usedArea = images.reduce((total, img) => {
            return total + (img.width * img.height);
        }, 0);

        const utilization = usedArea / totalSheetArea;

        const basePricing = {
            '13': { base: 15.00, perSqIn: 0.75 },
            '17': { base: 25.00, perSqIn: 0.65 }
        };

        const pricing = basePricing[sheetSize];
        const imageArea = usedArea;
        const materialCost = pricing.base + (imageArea * pricing.perSqIn);

        return {
            materialCost: Math.round(materialCost * 100) / 100,
            utilization: Math.round(utilization * 100),
            totalArea: Math.round(usedArea * 100) / 100,
            sheetArea: totalSheetArea,
            imageCount: images.length
        };
    }
}

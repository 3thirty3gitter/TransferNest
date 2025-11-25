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

    const pixelWidth = Math.round(sheet.width * opts.dpi);
    const pixelHeight = Math.round(sheet.height * opts.dpi);

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

        // Calculate pixel positions and frame size at target DPI
        const posX = imgData.x * opts.dpi;
        const posY = imgData.y * opts.dpi;
        const frameW = imgData.width * opts.dpi;
        const frameH = imgData.height * opts.dpi;

        console.log(`[PRINT] Drawing ${imgData.id} at (${Math.round(posX)}, ${Math.round(posY)}) size ${Math.round(frameW)}x${Math.round(frameH)}px${imgData.rotated ? ' [ROTATED]' : ''}`);

        if (imgData.rotated) {
          // Replicate CSS rotate(90deg) transform around center of frame
          ctx.save();

          // ROBUST FIX:
          // 1. Translate to top-left of slot
          ctx.translate(posX, posY);

          // 2. Rotate 90 degrees
          ctx.rotate(Math.PI / 2);

          // 3. Translate by SLOT WIDTH (frameW)
          // Because Y axis is Left, -frameW moves Right by Slot Width.
          ctx.translate(0, -frameW);

          // 4. Draw Image with SWAPPED dimensions (Original Height x Original Width)
          // frameH is the Slot Height (Original Width)
          // frameW is the Slot Width (Original Height)
          // So we draw frameH x frameW
          ctx.drawImage(image, 0, 0, frameHeightPx, frameWidthPx); // Wait, variable names changed. frameH, frameW
          // frameH is height in pixels (from imgData.height).
          // frameW is width in pixels (from imgData.width).
          // If rotated, imgData.width/height are the SLOT dimensions?
          // Let's check nesting algorithm.
          // NestedImage: width/height are "nested size in inches".
          // If rotated, width/height are swapped?
          // In nesting-algorithm.ts, if rotated, we push { w: img.height, h: img.width }.
          // So NestedImage.width IS the slot width (which was image height).
          // So frameW IS the slot width.
          // frameH IS the slot height.

          // So if we draw frameH x frameW, we are drawing (Slot Height) x (Slot Width).
          // Slot Height = Original Width.
          // Slot Width = Original Height.
          // So we are drawing Original Width x Original Height.
          // This is correct.

          ctx.drawImage(image, 0, 0, frameH, frameW);

          ctx.restore();
        } else {
          // Non-rotated: draw directly at position
          ctx.drawImage(image, posX, posY, frameW, frameH);
        }

      } catch (error) {
        console.error(`[PRINT] Failed to process image ${imgData.id}:`, error);
        // Draw placeholder for failed images
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(imgData.x * opts.dpi, imgData.y * opts.dpi, imgData.width * opts.dpi, imgData.height * opts.dpi);

        // Add error text to placeholder
        ctx.fillStyle = '#ff0000';
        ctx.font = `${20 * (opts.dpi / 72)}px sans-serif`;
        ctx.fillText('Image Failed', imgData.x * opts.dpi + 10, imgData.y * opts.dpi + 50);
      }
    }

    // Export to PNG buffer
    let pngBuffer = canvas.toBuffer('image/png');

    // Embed 300 DPI metadata using Sharp (for print software compatibility)
    try {
      pngBuffer = await sharp(pngBuffer)
        .withMetadata({ density: opts.dpi })
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
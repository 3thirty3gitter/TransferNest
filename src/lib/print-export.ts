import { NestedImage } from '@/lib/nesting-algorithm';
import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';
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

        // Download image from Firebase URL
        console.log(`[PRINT] Fetching ${imgData.id} from ${imgData.url.substring(0, 60)}...`);
        const response = await axios.get(imgData.url, { 
          responseType: 'arraybuffer',
          timeout: 10000
        });
        const imgBuffer = Buffer.from(response.data);

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
          ctx.translate(posX + frameW / 2, posY + frameH / 2);
          ctx.rotate(Math.PI / 2); // 90 degrees
          // Draw centered in rotated space
          ctx.drawImage(image, -frameW / 2, -frameH / 2, frameW, frameH);
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
      }
    }

    // Export to PNG buffer
    let pngBuffer = canvas.toBuffer('image/png');

    // Embed 300 DPI metadata using Sharp (for print software compatibility)
    pngBuffer = await sharp(pngBuffer)
      .withMetadata({ density: opts.dpi })
      .png()
      .toBuffer();

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
import sharp from 'sharp';
import { NestedImage } from '@/lib/nesting-algorithm';

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
}

// Sheet dimensions in inches
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
    
    // Calculate pixel dimensions at specified DPI
    const pixelWidth = Math.round(sheet.width * opts.dpi);
    const pixelHeight = Math.round(sheet.height * opts.dpi);

    // Create base canvas with white background
    const baseCanvas = sharp({
      create: {
        width: pixelWidth,
        height: pixelHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // Process each image and position it on the canvas
    const compositeImages = await Promise.all(
      images.map(async (img) => {
        // Convert image position from inches to pixels
        const left = Math.round(img.x * opts.dpi);
        const top = Math.round(img.y * opts.dpi);
        const width = Math.round(img.width * opts.dpi);
        const height = Math.round(img.height * opts.dpi);

        // Load and resize the image
        let imageBuffer: Buffer;
        // NestedImage has url property instead of file
        const response = await fetch(img.url);
        imageBuffer = Buffer.from(await response.arrayBuffer());

        // Resize image to exact dimensions with high quality
        const resizedImage = await sharp(imageBuffer)
          .resize(width, height, {
            fit: 'fill',
            kernel: sharp.kernel.lanczos3
          })
          .png({ quality: 100, compressionLevel: 0 })
          .toBuffer();

        return {
          input: resizedImage,
          left,
          top
        };
      })
    );

    // Composite all images onto the base canvas
    const finalImage = await baseCanvas
      .composite(compositeImages)
      .png({
        quality: opts.quality,
        compressionLevel: 1,
        progressive: false
      })
      .toBuffer();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dtf-print-${sheetSize}x-${opts.dpi}dpi-${timestamp}.png`;

    return {
      buffer: finalImage,
      filename,
      dimensions: {
        width: pixelWidth,
        height: pixelHeight,
        dpi: opts.dpi
      }
    };
  }

  /**
   * Generate a print preview at lower resolution for web display
   */
  async generatePreview(
    images: NestedImage[],
    sheetSize: '13' | '17',
    previewWidth: number = 800
  ): Promise<Buffer> {
    const sheet = SHEET_DIMENSIONS[sheetSize];
    const aspectRatio = sheet.height / sheet.width;
    const previewHeight = Math.round(previewWidth * aspectRatio);

    // Calculate scale factor
    const scaleFactor = previewWidth / sheet.width;

    const baseCanvas = sharp({
      create: {
        width: previewWidth,
        height: previewHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    const compositeImages = await Promise.all(
      images.map(async (img) => {
        const left = Math.round(img.x * scaleFactor);
        const top = Math.round(img.y * scaleFactor);
        const width = Math.round(img.width * scaleFactor);
        const height = Math.round(img.height * scaleFactor);

        let imageBuffer: Buffer;
        const response = await fetch(img.url);
        imageBuffer = Buffer.from(await response.arrayBuffer());

        const resizedImage = await sharp(imageBuffer)
          .resize(width, height, {
            fit: 'fill',
            kernel: sharp.kernel.lanczos3
          })
          .png({ quality: 80 })
          .toBuffer();

        return {
          input: resizedImage,
          left,
          top
        };
      })
    );

    return await baseCanvas
      .composite(compositeImages)
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Calculate print pricing based on sheet utilization
   */
  calculatePrintPricing(images: NestedImage[], sheetSize: '13' | '17') {
    const sheet = SHEET_DIMENSIONS[sheetSize];
    const totalSheetArea = sheet.width * sheet.height;
    
    const usedArea = images.reduce((total, img) => {
      return total + (img.width * img.height);
    }, 0);

    const utilization = usedArea / totalSheetArea;
    
    // Base pricing per sheet
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
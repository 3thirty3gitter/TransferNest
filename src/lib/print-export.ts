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

    console.log(`Print file queued: ${filename}`, {
      imageCount: images.length,
      dimensions: `${pixelWidth}x${pixelHeight}px`,
      utilization: `${utilization}%`
    });

    return {
      buffer: Buffer.alloc(0),
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
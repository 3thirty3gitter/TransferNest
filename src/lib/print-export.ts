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
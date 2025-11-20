import { NestedImage } from '@/lib/nesting-algorithm';
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

    console.log(`Generating print file: ${filename}`, {
      imageCount: images.length,
      dimensions: `${pixelWidth}x${pixelHeight}px`,
      utilization: `${utilization}%`
    });

    // Create a blank white canvas
    const canvas = sharp({
      create: {
        width: pixelWidth,
        height: pixelHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // Composite all images onto the sheet
    const compositeOps = await Promise.all(
      images.map(async (img) => {
        try {
          // Validate image coordinates
          if (typeof img.x !== 'number' || typeof img.y !== 'number' || 
              typeof img.width !== 'number' || typeof img.height !== 'number' ||
              isNaN(img.x) || isNaN(img.y) || isNaN(img.width) || isNaN(img.height)) {
            console.error('[PRINT] Invalid image coordinates:', img);
            return null;
          }

          // Convert inches to pixels
          const left = Math.round(img.x * opts.dpi);
          const top = Math.round(img.y * opts.dpi);
          
          // Handle rotation: when rotated, the displayed dimensions are swapped
          const isRotated = (img as any).rotated === true;
          const width = Math.round(img.width * opts.dpi);
          const height = Math.round(img.height * opts.dpi);

          // Validate pixel values
          if (isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
            console.error('[PRINT] Invalid pixel calculations:', { left, top, width, height, img });
            return null;
          }

          console.log(`[PRINT] Image ${img.id}: ${left},${top} ${width}x${height}px${isRotated ? ' (ROTATED)' : ''} from ${img.url || 'no url'}`);

          // Load actual image from URL if available
          let imageBuffer: Buffer;
          
          if (img.url && img.url.trim() !== '') {
            try {
              // Fetch the image
              const response = await fetch(img.url);
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
              }
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              // Use original dimensions if available, otherwise calculate from nested size
              const origWidth = (img as any).originalWidth;
              const origHeight = (img as any).originalHeight;
              
              let sharpImage;
              
              if (origWidth && origHeight) {
                // We have original dimensions - use them directly
                console.log(`[PRINT] Using original dimensions: ${origWidth}x${origHeight}px`);
                
                if (isRotated) {
                  // Rotate first, then the rotated image will match the frame
                  sharpImage = sharp(buffer)
                    .rotate(90)
                    .resize(width, height, { 
                      fit: 'contain',
                      background: { r: 255, g: 255, b: 255, alpha: 0 }
                    });
                } else {
                  // No rotation needed, just resize to frame
                  sharpImage = sharp(buffer)
                    .resize(width, height, { 
                      fit: 'contain',
                      background: { r: 255, g: 255, b: 255, alpha: 0 }
                    });
                }
              } else {
                // Fallback to old logic if original dimensions not available
                let targetWidth = width;
                let targetHeight = height;
                
                if (isRotated) {
                  targetWidth = height;
                  targetHeight = width;
                }
                
                sharpImage = sharp(buffer).resize(targetWidth, targetHeight, { 
                  fit: 'contain',
                  background: { r: 255, g: 255, b: 255, alpha: 0 }
                });
                
                if (isRotated) {
                  sharpImage = sharpImage.rotate(90);
                }
              }
              
              imageBuffer = await sharpImage.png().toBuffer();
                
              console.log(`[PRINT] Loaded and resized image from ${img.url.substring(0, 50)}...`);
            } catch (fetchError) {
              console.error(`[PRINT] Failed to fetch image from ${img.url}:`, fetchError);
              // Fallback to placeholder
              imageBuffer = await sharp({
                create: {
                  width,
                  height,
                  channels: 4,
                  background: { r: 200, g: 200, b: 200, alpha: 0.5 }
                }
              })
                .png()
                .toBuffer();
            }
          } else {
            // No URL provided, use placeholder
            console.warn(`[PRINT] No URL for image ${img.id}, using placeholder`);
            imageBuffer = await sharp({
              create: {
                width,
                height,
                channels: 4,
                background: { r: 200, g: 200, b: 200, alpha: 0.5 }
              }
            })
              .png()
              .toBuffer();
          }

          return {
            input: imageBuffer,
            left,
            top
          };
        } catch (error) {
          console.error(`Failed to process image ${img.id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed composites
    const validComposites = compositeOps.filter((op): op is NonNullable<typeof op> => op !== null);

    // Generate the final image
    const buffer = validComposites.length > 0
      ? await canvas.composite(validComposites).png({ quality: opts.quality }).toBuffer()
      : await canvas.png({ quality: opts.quality }).toBuffer();

    console.log(`✅ Generated print file: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);

    return {
      buffer,
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
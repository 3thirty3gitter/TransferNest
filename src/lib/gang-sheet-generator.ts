/**
 * Gang Sheet Generator - Core logic for generating print-ready PNG files
 * Can be called directly from server-side code without HTTP
 */

import { PrintFileStorageAdmin } from '@/lib/print-storage-admin';

const sharp = require('sharp');

export interface PlacedItem {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  rotated?: boolean;
}

export interface GangSheetOptions {
  placedItems: PlacedItem[];
  sheetWidth: number;
  sheetLength: number;
  userId: string;
  orderId?: string;
  customerInfo?: {
    firstName: string;
    lastName: string;
  };
}

export interface GangSheetResult {
  success: boolean;
  pngUrl: string;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
  };
  size: number;
}

/**
 * Generate a gang sheet PNG and upload it to Firebase Storage
 */
export async function generateGangSheet(options: GangSheetOptions): Promise<GangSheetResult> {
  const { placedItems, sheetWidth, sheetLength, userId, orderId, customerInfo } = options;

  // Validate required fields
  if (!placedItems || !Array.isArray(placedItems)) {
    throw new Error('placedItems array is required');
  }

  if (!sheetWidth || !sheetLength) {
    throw new Error('sheetWidth and sheetLength are required');
  }

  if (!userId) {
    throw new Error('userId is required');
  }

  console.log('[GANG_SHEET] Generating PNG:', {
    itemCount: placedItems.length,
    sheetWidth,
    sheetLength,
    firstItem: placedItems[0] ? {
      id: placedItems[0].id,
      x: placedItems[0].x,
      y: placedItems[0].y,
      width: placedItems[0].width,
      height: placedItems[0].height,
      hasUrl: !!placedItems[0].url
    } : null
  });

  const dpi = 300;
  const pixelWidth = Math.round(sheetWidth * dpi);
  const pixelHeight = Math.round(sheetLength * dpi);

  console.log('[GANG_SHEET] Canvas dimensions:', {
    inches: `${sheetWidth}x${sheetLength}"`,
    pixels: `${pixelWidth}x${pixelHeight}px`,
    dpi
  });

  sharp.cache(false);
  
  // Create blank transparent canvas
  const transparentPixels = Buffer.alloc(pixelWidth * pixelHeight * 4, 0);
  
  const canvas = sharp(transparentPixels, {
    raw: {
      width: pixelWidth,
      height: pixelHeight,
      channels: 4
    },
    limitInputPixels: false
  });

  // Composite all images onto the sheet
  const compositeOps = await Promise.all(
    placedItems.map(async (img: PlacedItem) => {
      try {
        if (typeof img.x !== 'number' || typeof img.y !== 'number' || 
            typeof img.width !== 'number' || typeof img.height !== 'number') {
          console.error('[GANG_SHEET] Invalid image coordinates:', img);
          return null;
        }

        const isRotated = img.rotated === true;
        const left = Math.round(img.x * dpi);
        const top = Math.round(img.y * dpi);
        const imageWidth = Math.round(img.width * dpi);
        const imageHeight = Math.round(img.height * dpi);

        console.log(`[GANG_SHEET] Image ${img.id}: position ${left},${top} size ${imageWidth}x${imageHeight}px${isRotated ? ' (rotated)' : ''}`);

        let imageBuffer: Buffer;
        
        if (img.url && img.url.trim() !== '') {
          try {
            const response = await fetch(img.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            let processedImage = sharp(buffer)
              .ensureAlpha()
              .resize(imageWidth, imageHeight, { fit: 'fill' });
            
            if (isRotated) {
              processedImage = processedImage.rotate(-90, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
            }
            
            const tempBuffer = await processedImage.png({ palette: false, force: true }).toBuffer();
            const tempMeta = await sharp(tempBuffer).metadata();
            
            const expectedWidth = isRotated ? imageHeight : imageWidth;
            const expectedHeight = isRotated ? imageWidth : imageHeight;
            
            if (tempMeta.width !== expectedWidth || tempMeta.height !== expectedHeight) {
              imageBuffer = await sharp(tempBuffer)
                .extract({
                  left: 0,
                  top: 0,
                  width: Math.min(expectedWidth, tempMeta.width || expectedWidth),
                  height: Math.min(expectedHeight, tempMeta.height || expectedHeight)
                })
                .png({ palette: false, force: true })
                .toBuffer();
            } else {
              imageBuffer = tempBuffer;
            }
          } catch (fetchError) {
            console.error(`[GANG_SHEET] Failed to fetch ${img.url}:`, fetchError);
            const placeholderWidth = isRotated ? imageHeight : imageWidth;
            const placeholderHeight = isRotated ? imageWidth : imageHeight;
            imageBuffer = await sharp({
              create: { width: placeholderWidth, height: placeholderHeight, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 0.5 } }
            }).png().toBuffer();
          }
        } else {
          console.warn(`[GANG_SHEET] No URL for image ${img.id}`);
          const placeholderWidth = isRotated ? imageHeight : imageWidth;
          const placeholderHeight = isRotated ? imageWidth : imageHeight;
          imageBuffer = await sharp({
            create: { width: placeholderWidth, height: placeholderHeight, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 0.5 } }
          }).png().toBuffer();
        }

        return { input: imageBuffer, left, top };
      } catch (error) {
        console.error(`[GANG_SHEET] Failed to process image ${img.id}:`, error);
        return null;
      }
    })
  );

  const validComposites = compositeOps.filter((op): op is NonNullable<typeof op> => op !== null);

  console.log('[GANG_SHEET] Compositing', validComposites.length, 'images');

  const pngBuffer = validComposites.length > 0
    ? await canvas
        .composite(validComposites.map(op => ({
          input: op.input,
          left: op.left,
          top: op.top,
          blend: 'over',
          gravity: 'northwest',
        })))
        .png({ 
          compressionLevel: 9,
          adaptiveFiltering: false,
          force: true,
          palette: false
        })
        .toBuffer()
    : await canvas
        .png({ 
          compressionLevel: 9,
          adaptiveFiltering: false,
          force: true,
          palette: false
        })
        .toBuffer();

  const meta = await sharp(pngBuffer).metadata();
  console.log('[GANG_SHEET] Output metadata:', {
    channels: meta.channels,
    hasAlpha: meta.hasAlpha,
    space: meta.space,
    size: pngBuffer.length
  });

  console.log('[GANG_SHEET] Generated PNG:', (pngBuffer.length / 1024).toFixed(2), 'KB');

  // Upload to Firebase Storage
  const storage = new PrintFileStorageAdmin();
  
  let uploadResult;
  if (orderId && customerInfo) {
    const customerName = `${customerInfo.firstName}_${customerInfo.lastName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const orderNumber = orderId.slice(-8);
    const sheetDimensions = `${sheetWidth}x${Math.round(sheetLength)}`;
    const filename = `${orderNumber}_${customerName}_${sheetDimensions}.png`;
    
    console.log('[GANG_SHEET] Uploading to orders folder:', { userId, orderId, filename });
    
    uploadResult = await storage.uploadPrintFile(
      pngBuffer,
      filename,
      orderId,
      userId
    );
  } else {
    const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `gangsheet_${sheetWidth}x${Math.round(sheetLength)}.png`;
    
    console.log('[GANG_SHEET] Uploading to cart folder:', { userId, cartItemId, filename });
    
    uploadResult = await storage.uploadCartFile(
      pngBuffer,
      filename,
      cartItemId,
      userId
    );
  }

  console.log('[GANG_SHEET] Upload successful:', uploadResult.url);

  return {
    success: true,
    pngUrl: uploadResult.url,
    dimensions: {
      width: sheetWidth,
      height: sheetLength,
      dpi: 300
    },
    size: pngBuffer.length
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { PrintExportGenerator } from '@/lib/print-export';
import { PrintFileStorageAdmin } from '@/lib/print-storage-admin';

/**
 * API endpoint to generate a gang sheet PNG and upload it to Firebase Storage
 * Used when adding items to cart - generates the print-ready PNG
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placedItems, sheetWidth, sheetLength, userId, orderId, customerInfo } = body;

    // Validate required fields
    if (!placedItems || !Array.isArray(placedItems)) {
      return NextResponse.json(
        { error: 'placedItems array is required' },
        { status: 400 }
      );
    }

    if (!sheetWidth || !sheetLength) {
      return NextResponse.json(
        { error: 'sheetWidth and sheetLength are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('[GANG_SHEET] Generating PNG for cart item:', {
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

    // Generate the gang sheet PNG using print-export
    // The PrintExportGenerator expects the exact sheet dimensions to create the canvas
    const generator = new PrintExportGenerator();
    
    // CRITICAL: We need to generate with EXACT dimensions, not fixed 13x19 or 17x22
    // Create a custom canvas based on actual nested dimensions
    const dpi = 300;
    const pixelWidth = Math.round(sheetWidth * dpi);
    const pixelHeight = Math.round(sheetLength * dpi);

    console.log('[GANG_SHEET] Canvas dimensions:', {
      inches: `${sheetWidth}x${sheetLength}"`,
      pixels: `${pixelWidth}x${pixelHeight}px`,
      dpi
    });

    // We'll use sharp directly to create the exact canvas we need
    const sharp = require('sharp');
    
    // Create blank white canvas
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
      placedItems.map(async (img: any) => {
        try {
          // Validate coordinates
          if (typeof img.x !== 'number' || typeof img.y !== 'number' || 
              typeof img.width !== 'number' || typeof img.height !== 'number') {
            console.error('[GANG_SHEET] Invalid image coordinates:', img);
            return null;
          }

          // Handle rotation: when rotated=true, the item's width/height represent the original dimensions
          // but on the sheet, it occupies a height×width space (swapped)
          const isRotated = img.rotated === true;
          
          // Convert inches to pixels for the SHEET POSITION
          const left = Math.round(img.x * dpi);
          const top = Math.round(img.y * dpi);
          
          // Image dimensions in its original orientation
          const imageWidth = Math.round(img.width * dpi);
          const imageHeight = Math.round(img.height * dpi);

          console.log(`[GANG_SHEET] Image ${img.id}: position ${left},${top} size ${imageWidth}x${imageHeight}px${isRotated ? ' (rotated)' : ''}`);

          // Load actual image from URL
          let imageBuffer: Buffer;
          
          if (img.url && img.url.trim() !== '') {
            try {
              const response = await fetch(img.url);
              if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
              }
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              // Resize to exact dimensions first
              let processedImage = sharp(buffer).resize(imageWidth, imageHeight, { fit: 'fill' });
              
              // If rotated, rotate and then extract the exact dimensions we need
              if (isRotated) {
                // Rotate -90 degrees (counterclockwise)
                processedImage = processedImage.rotate(-90);
                // After rotation, sharp expands canvas. Extract just the rotated dimensions.
                // A rotated W×H image becomes H×W, so extract that exact size
                processedImage = processedImage.extract({
                  left: 0,
                  top: 0,
                  width: imageHeight,  // After rotation, original height becomes width
                  height: imageWidth   // After rotation, original width becomes height
                });
              }
              
              // Get metadata to verify dimensions
              const metadata = await processedImage.metadata();
              console.log(`[GANG_SHEET] Final buffer dimensions: ${metadata.width}x${metadata.height}px`);
              
              imageBuffer = await processedImage.png().toBuffer();
                
              console.log(`[GANG_SHEET] Loaded and ${isRotated ? 'rotated ' : ''}image from URL`);
            } catch (fetchError) {
              console.error(`[GANG_SHEET] Failed to fetch ${img.url}:`, fetchError);
              // Fallback to placeholder
              let placeholderWidth = isRotated ? imageHeight : imageWidth;
              let placeholderHeight = isRotated ? imageWidth : imageHeight;
              imageBuffer = await sharp({
                create: { width: placeholderWidth, height: placeholderHeight, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 0.5 } }
              }).png().toBuffer();
            }
          } else {
            // No URL, use placeholder
            console.warn(`[GANG_SHEET] No URL for image ${img.id}`);
            let placeholderWidth = isRotated ? imageHeight : imageWidth;
            let placeholderHeight = isRotated ? imageWidth : imageHeight;
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

    // Filter out failed operations
    const validComposites = compositeOps.filter((op): op is NonNullable<typeof op> => op !== null);

    console.log('[GANG_SHEET] Compositing', validComposites.length, 'images');

    // Generate final image with explicit composite options to prevent stretching
    const pngBuffer = validComposites.length > 0
      ? await canvas.composite(validComposites.map(op => ({
          input: op.input,
          left: op.left,
          top: op.top,
          blend: 'over',        // Don't blend/resize, just overlay
          gravity: 'northwest', // Top-left positioning, no centering
          premultiplied: false  // Don't pre-multiply alpha
        }))).png({ quality: 100 }).toBuffer()
      : await canvas.png({ quality: 100 }).toBuffer();

    console.log('[GANG_SHEET] Generated PNG:', (pngBuffer.length / 1024).toFixed(2), 'KB');

    // Upload to Firebase Storage
    const storage = new PrintFileStorageAdmin();
    
    // If orderId is provided, save to orders folder, otherwise to cart folder
    let uploadResult;
    if (orderId && customerInfo) {
      // Format customer name and filename for order
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
      // Save to cart folder (legacy support if needed)
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

    // Return the storage URL and metadata
    return NextResponse.json({
      success: true,
      pngUrl: uploadResult.url,
      dimensions: {
        width: sheetWidth,
        height: sheetLength,
        dpi: 300
      },
      size: pngBuffer.length
    });

  } catch (error) {
    console.error('[GANG_SHEET] Error generating gang sheet:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate gang sheet', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

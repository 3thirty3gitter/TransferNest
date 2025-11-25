import { NextRequest, NextResponse } from 'next/server';
import { PrintFileStorageAdmin } from '@/lib/print-storage-admin';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';

/**
 * Gang Sheet Export - FIXED Nov 25, 2025
 * Corrects pixel-to-inch conversion and rotation transform order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placedItems, sheetWidth, sheetLength, userId, orderId, customerInfo } = body;

    // Validation
    if (!placedItems || !Array.isArray(placedItems)) {
      return NextResponse.json({ error: 'placedItems array is required' }, { status: 400 });
    }
    if (!sheetWidth || !sheetLength) {
      return NextResponse.json({ error: 'sheetWidth and sheetLength are required' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('[GANG_SHEET] Generating PNG:', {
      itemCount: placedItems.length,
      sheetWidth,
      sheetLength
    });

    // CRITICAL: Assume source images are 300 DPI (standard for uploaded graphics)
    const SOURCE_DPI = 300;
    const EXPORT_DPI = 300;

    // Convert sheet dimensions to pixels
    const canvasWidth = Math.round(sheetWidth * EXPORT_DPI);
    const canvasHeight = Math.round(sheetLength * EXPORT_DPI);
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // White background for print
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Process each image with CORRECT unit conversion
    for (const imgData of placedItems) {
      try {
        if (!imgData.url || imgData.url.trim() === '') {
          console.warn(`[GANG_SHEET] Skipping ${imgData.id} - no URL`);
          continue;
        }

        console.log(`[GANG_SHEET] Processing ${imgData.id}:`, {
          x: imgData.x,
          y: imgData.y,
          width: imgData.width,  // This is actually PIXELS from nesting
          height: imgData.height,
          rotated: imgData.rotated
        });

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

        // Load image
        const response = await fetch(imgData.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const imgBuffer = Buffer.from(arrayBuffer);
        const image = await loadImage(imgBuffer);

        console.log(`[GANG_SHEET] ${imgData.id} - Image: ${image.width}x${image.height}px`);
        console.log(`[GANG_SHEET] ${imgData.id} - Frame: ${frameWidthPx.toFixed(0)}x${frameHeightPx.toFixed(0)}px at (${xPx.toFixed(0)}, ${yPx.toFixed(0)})`);

        ctx.save();

        if (imgData.rotated) {
          // CRITICAL FIX #2: Match preview's CSS transform order and origin
          // Preview: Container at (x*40, y*40), swapped dimensions
          // Inner div: original size, rotate(90deg) translateY(-100%), origin top-left

          // Step 1: Position to top-left of rotated container
          const containerLeft = xPx;
          const containerTop = yPx;
          const containerWidth = frameHeightPx;  // SWAPPED for rotated container
          const containerHeight = frameWidthPx;  // SWAPPED for rotated container

          // Step 2: Apply transforms matching CSS order
          ctx.translate(containerLeft, containerTop);                    // Container position
          ctx.rotate(Math.PI / 2);                                       // rotate(90deg)
          ctx.translate(0, -frameWidthPx);                               // translateY(-100%) of original width

          // Step 3: Draw image centered within original frame (object-contain logic here if needed)
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
        console.error(`[GANG_SHEET] Failed to process ${imgData.id}:`, error);
        // Placeholder
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(imgData.x * EXPORT_DPI, imgData.y * EXPORT_DPI,
          (imgData.width / SOURCE_DPI) * EXPORT_DPI,
          (imgData.height / SOURCE_DPI) * EXPORT_DPI);
      }
    }

    // Export PNG with DPI metadata
    let pngBuffer = canvas.toBuffer('image/png');
    pngBuffer = await sharp(pngBuffer)
      .withMetadata({ density: EXPORT_DPI })
      .png()
      .toBuffer();

    console.log('[GANG_SHEET] PNG generated:', (pngBuffer.length / 1024).toFixed(2), 'KB');

    // Upload to storage (unchanged)
    const storage = new PrintFileStorageAdmin();
    let uploadResult;
    if (orderId && customerInfo) {
      const customerName = `${customerInfo.firstName}_${customerInfo.lastName}`.replace(/[^a-zA-Z0-9_]/g, '_');
      const orderNumber = orderId.slice(-8);
      const sheetDimensions = `${sheetWidth}x${Math.round(sheetLength)}`;
      const filename = `${orderNumber}_${customerName}_${sheetDimensions}.png`;
      console.log('[GANG_SHEET] Uploading to orders:', { userId, orderId, filename });
      uploadResult = await storage.uploadPrintFile(pngBuffer, filename, orderId, userId);
    } else {
      const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filename = `gangsheet_${sheetWidth}x${Math.round(sheetLength)}.png`;
      console.log('[GANG_SHEET] Uploading to cart:', { userId, cartItemId, filename });
      uploadResult = await storage.uploadCartFile(pngBuffer, filename, cartItemId, userId);
    }

    console.log('[GANG_SHEET] Upload successful:', uploadResult.url);

    return NextResponse.json({
      success: true,
      pngUrl: uploadResult.url,
      dimensions: { width: sheetWidth, height: sheetLength, dpi: EXPORT_DPI },
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

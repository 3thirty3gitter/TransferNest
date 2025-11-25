import { NextRequest, NextResponse } from 'next/server';
import { PrintExportGenerator } from '@/lib/print-export';
import { PrintFileStorageAdmin } from '@/lib/print-storage-admin';
import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';
import sharp from 'sharp';

/**
 * API endpoint to generate a gang sheet PNG and upload it to Firebase Storage
 * Uses Canvas-based rendering for pixel-perfect export matching preview
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

    // Generate gang sheet using Canvas-based rendering (matches preview exactly)
    const dpi = 300;
    const pixelWidth = Math.round(sheetWidth * dpi);
    const pixelHeight = Math.round(sheetLength * dpi);

    console.log('[GANG_SHEET] Canvas dimensions:', {
      inches: `${sheetWidth}x${sheetLength}"`,
      pixels: `${pixelWidth}x${pixelHeight}px`,
      dpi
    });

    // Create canvas at exact print resolution
    const canvas = createCanvas(pixelWidth, pixelHeight);
    const ctx = canvas.getContext('2d');

    // White background for print
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, pixelWidth, pixelHeight);

    // Fetch and draw each image using Canvas (replicates preview logic exactly)
    for (const imgData of placedItems) {
      try {
        if (!imgData.url || imgData.url.trim() === '') {
          console.warn(`[GANG_SHEET] Skipping image ${imgData.id} - no URL`);
          continue;
        }

        // Download image from Firebase URL
        console.log(`[GANG_SHEET] Fetching ${imgData.id} from ${imgData.url.substring(0, 60)}...`);
        const response = await axios.get(imgData.url, { 
          responseType: 'arraybuffer',
          timeout: 10000
        });
        const imgBuffer = Buffer.from(response.data);

        // Load as image (node-canvas handles PNG/JPG)
        const image = await loadImage(imgBuffer);

        // Convert inch measurements to pixels at 300 DPI
        const frameWidthPx = imgData.width * dpi;
        const frameHeightPx = imgData.height * dpi;
        const xPx = imgData.x * dpi;
        const yPx = imgData.y * dpi;

        console.log(`[GANG_SHEET] Drawing ${imgData.id} at (${Math.round(xPx)}, ${Math.round(yPx)}) frame ${Math.round(frameWidthPx)}x${Math.round(frameHeightPx)}px${imgData.rotated ? ' [ROTATED]' : ''}`);

        // Save canvas state
        ctx.save();

        // CRITICAL: For rotated items, the placement position is based on rotated dimensions
        // So we need to translate to center based on the ROTATED frame size
        const placementWidth = imgData.rotated ? frameHeightPx : frameWidthPx;
        const placementHeight = imgData.rotated ? frameWidthPx : frameHeightPx;
        
        ctx.translate(xPx + placementWidth / 2, yPx + placementHeight / 2);

        if (imgData.rotated) {
          // Rotate 90 degrees
          ctx.rotate(Math.PI / 2);
          
          // CRITICAL: After rotation, coordinate system is rotated
          // Must SWAP width and height in the drawing call
          // The rotated frame is now height × width
          ctx.drawImage(
            image,
            -frameHeightPx / 2,  // SWAP: use height as x offset
            -frameWidthPx / 2,   // SWAP: use width as y offset
            frameHeightPx,       // SWAP: use height as width
            frameWidthPx         // SWAP: use width as height
          );
        } else {
          // Non-rotated: draw with original dimensions
          ctx.drawImage(
            image,
            -frameWidthPx / 2,
            -frameHeightPx / 2,
            frameWidthPx,
            frameHeightPx
          );
        }

        // Restore canvas state for next image
        ctx.restore();

      } catch (error) {
        console.error(`[GANG_SHEET] Failed to process image ${imgData.id}:`, error);
        // Draw placeholder for failed images
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(imgData.x * dpi, imgData.y * dpi, imgData.width * dpi, imgData.height * dpi);
      }
    }

    // Export to PNG buffer
    let pngBuffer = canvas.toBuffer('image/png');

    // Embed 300 DPI metadata using Sharp (for print software compatibility)
    pngBuffer = await sharp(pngBuffer)
      .withMetadata({ density: dpi })
      .png()
      .toBuffer();

    console.log('✅ [GANG_SHEET] Generated PNG:', (pngBuffer.length / 1024).toFixed(2), 'KB');

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

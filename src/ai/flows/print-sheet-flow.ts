
'use server';
/**
 * @fileOverview A server-side flow to generate and upload a print-ready PNG from a layout.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CartFlowInputSchema, NestedLayoutSchema } from '@/app/schema';
import { admin } from '@/lib/firebase-admin';
import { createCanvas, loadImage } from 'canvas';

const PRINT_DPI = 300;

export const generateAndUploadPrintSheetFlow = ai.defineFlow(
  {
    name: 'generateAndUploadPrintSheetFlow',
    inputSchema: CartFlowInputSchema,
    outputSchema: z.string(), // Returns the public URL of the uploaded PNG
  },
  async ({ layout, sheetWidth, sheetLength, userId }) => {
    const canvas = createCanvas(sheetWidth * PRINT_DPI, sheetLength * PRINT_DPI);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Load all images from their URLs
      const imagePromises = layout.map(item => loadImage(item.url));
      const loadedImages = await Promise.all(imagePromises);

      // Draw each image onto the canvas
      loadedImages.forEach((img, index) => {
        const item = layout[index];
        const itemWidthPx = item.width * PRINT_DPI;
        const itemHeightPx = item.height * PRINT_DPI;
        const itemXPx = item.x * PRINT_DPI;
        const itemYPx = item.y * PRINT_DPI;

        ctx.save();
        if (item.rotated) {
          const centerX = itemXPx + itemHeightPx / 2;
          const centerY = itemYPx + itemWidthPx / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -itemWidthPx / 2, -itemHeightPx / 2, itemWidthPx, itemHeightPx);
        } else {
          ctx.drawImage(img, itemXPx, itemYPx, itemWidthPx, itemHeightPx);
        }
        ctx.restore();
      });

      // Get the default storage bucket
      const bucket = admin.storage().bucket();
      
      // Generate a unique filename for the PNG
      const fileName = `generated-sheets/${userId}/${new Date().getTime()}.png`;
      const file = bucket.file(fileName);

      // Get the canvas buffer and upload it
      const buffer = canvas.toBuffer('image/png');
      
      await file.save(buffer, {
        metadata: {
          contentType: 'image/png',
        },
      });

      // Make the file public and return its URL
      await file.makePublic();
      return file.publicUrl();

    } catch (error: any) {
      console.error('Error generating or uploading print sheet:', error);
      throw new Error('Failed to generate or upload the print-ready PNG.');
    }
  }
);

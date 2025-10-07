
'use client';

import type { NestedLayout } from "@/app/schema";
import { uploadImage } from "@/services/storage";

const PRINT_DPI = 300;

type GenerateSheetParams = {
    layout: NestedLayout;
    sheetWidth: number;
    sheetLength: number;
    userId: string;
};

/**
 * Loads an image from a URL, handling cross-origin issues by fetching it as a blob.
 * @param src The URL of the image to load.
 * @returns A promise that resolves with the loaded HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Use fetch to get the image as a blob, which bypasses CORS issues for drawing.
    fetch(src, { mode: 'cors' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        const img = new Image();
        img.onload = () => {
          // The object URL does not need to be revoked immediately.
          // It will be revoked after the canvas has been fully drawn.
          resolve(img);
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(img.src); // Clean up if loading fails.
          reject(new Error(`Failed to load image from generated blob. Error: ${err}`));
        };
        img.src = URL.createObjectURL(blob);
      })
      .catch(fetchError => {
        // This can happen if there's a network error or the initial fetch fails.
        reject(new Error(`Failed to fetch image: ${src}. Error: ${fetchError.message}`));
      });
  });
}


/**
 * Converts a data URL to a Blob.
 * @param dataUrl The data URL to convert.
 * @returns A Blob representation of the data URL.
 */
function dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL format');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}


/**
 * Generates a print-ready PNG from a nested layout, uploads it to storage,
 * and returns the public URL.
 * @param params - The layout, dimensions, and user ID.
 * @returns The public URL of the generated and uploaded PNG.
 */
export async function generateAndUploadPrintSheet({ layout, sheetWidth, sheetLength, userId }: GenerateSheetParams): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = sheetWidth * PRINT_DPI;
    canvas.height = sheetLength * PRINT_DPI;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not create canvas context');
    }
    
    // Set a transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const loadedImages: HTMLImageElement[] = [];

    try {
        const imageElements = await Promise.all(layout.map(item => loadImage(item.url)));
        loadedImages.push(...imageElements); // Store loaded images for later cleanup

        layout.forEach((item, index) => {
            const img = imageElements[index];
            const itemWidthPx = item.width * PRINT_DPI;
            const itemHeightPx = item.height * PRINT_DPI;
            const itemXPx = item.x * PRINT_DPI;
            const itemYPx = item.y * PRINT_DPI;

            ctx.save();
            
            if (item.rotated) {
                // For rotated items, translate to the item's top-left corner,
                // then translate to the rotation center, rotate, and draw.
                const centerX = itemXPx + itemHeightPx / 2;
                const centerY = itemYPx + itemWidthPx / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(90 * Math.PI / 180);
                // Draw the image centered on the new origin.
                ctx.drawImage(img, -itemWidthPx / 2, -itemHeightPx / 2, itemWidthPx, itemHeightPx);

            } else {
                ctx.drawImage(img, itemXPx, itemYPx, itemWidthPx, itemHeightPx);
            }
            
            ctx.restore();
        });

        const dataUrl = canvas.toDataURL('image/png');
        const blob = dataURLtoBlob(dataUrl);
        const file = new File([blob], 'gang-sheet.png', { type: 'image/png' });

        // Use the existing upload service
        const pngUrl = await uploadImage(file, userId);
        return pngUrl;

    } catch (error) {
        console.error('Error during print sheet generation:', error);
        throw new Error('Failed to generate or upload the print-ready PNG.');
    } finally {
        // **CRITICAL FIX**: Clean up all blob URLs after the drawing process is complete.
        loadedImages.forEach(img => {
            if (img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
    }
}


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
 * Loads an image from a URL, handling cross-origin issues.
 * @param src The URL of the image to load.
 * @returns A promise that resolves with the loaded HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // This is crucial for drawing images from Firebase Storage onto a canvas
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src}. Error: ${err}`));
        img.src = src;
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

    try {
        const imageElements = await Promise.all(layout.map(item => loadImage(item.url)));

        layout.forEach((item, index) => {
            const img = imageElements[index];
            const itemWidth = item.width * PRINT_DPI;
            const itemHeight = item.height * PRINT_DPI;
            const itemX = item.x * PRINT_DPI;
            const itemY = item.y * PRINT_DPI;

            ctx.save();
            
            // The drawing logic needs to account for rotation
            if (item.rotated) {
                // Translate to the center of the rotated image's final position
                ctx.translate(itemX + itemHeight / 2, itemY + itemWidth / 2);
                // Rotate 90 degrees
                ctx.rotate(90 * Math.PI / 180);
                 // Draw the image centered at the new origin
                ctx.drawImage(img, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight);
            } else {
                ctx.drawImage(img, itemX, itemY, itemWidth, itemHeight);
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
    }
}

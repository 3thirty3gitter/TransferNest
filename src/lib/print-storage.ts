import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PrintExportResult } from '@/lib/print-export';

export interface UploadResult {
  filename: string;
  url: string;
  path: string;
  size: number;
}

export class PrintFileStorage {
  /**
   * Upload a print file to Firebase Storage
   */
  async uploadPrintFile(
    printResult: PrintExportResult,
    orderId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Create a path structure: orders/{userId}/{orderId}/{filename}
      const filePath = `orders/${userId}/${orderId}/${printResult.filename}`;
      const storageRef = ref(storage, filePath);

      // Upload the file
      const uploadResult = await uploadBytes(storageRef, printResult.buffer, {
        contentType: 'image/png',
        customMetadata: {
          orderId,
          userId,
          dpi: printResult.dimensions.dpi.toString(),
          width: printResult.dimensions.width.toString(),
          height: printResult.dimensions.height.toString(),
          generatedAt: new Date().toISOString()
        }
      });

      // Get the download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      return {
        filename: printResult.filename,
        url: downloadURL,
        path: filePath,
        size: printResult.buffer.length
      };

    } catch (error) {
      console.error('Error uploading print file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload print file: ${errorMessage}`);
    }
  }

  /**
   * Upload multiple print files for an order
   */
  async uploadOrderPrintFiles(
    printResults: PrintExportResult[],
    orderId: string,
    userId: string
  ): Promise<UploadResult[]> {
    const uploadPromises = printResults.map(result => 
      this.uploadPrintFile(result, orderId, userId)
    );

    try {
      const results = await Promise.all(uploadPromises);
      console.log(`Uploaded ${results.length} print files for order ${orderId}`);
      return results;
    } catch (error) {
      console.error('Error uploading multiple print files:', error);
      throw error;
    }
  }

  /**
   * Generate a secure download link for a print file
   */
  async getSecureDownloadLink(filePath: string, expirationMinutes: number = 60): Promise<string> {
    try {
      const storageRef = ref(storage, filePath);
      
      // For production, you might want to use signed URLs with expiration
      // For now, return the public download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error getting download link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get download link: ${errorMessage}`);
    }
  }

  /**
   * Delete print files for an order (for cleanup or refunds)
   */
  async deletePrintFiles(filePaths: string[]): Promise<void> {
    try {
      const { deleteObject } = await import('firebase/storage');
      
      const deletePromises = filePaths.map(async (filePath) => {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      });

      await Promise.all(deletePromises);
      console.log(`Deleted ${filePaths.length} print files`);
    } catch (error) {
      console.error('Error deleting print files:', error);
      throw error;
    }
  }
}
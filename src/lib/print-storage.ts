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
  async uploadPrintFile(
    buffer: Buffer,
    filename: string,
    orderId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      const filePath = `orders/${userId}/${orderId}/${filename}`;
      const storageRef = ref(storage, filePath);

      const uploadResult = await uploadBytes(storageRef, buffer, {
        contentType: 'image/png',
        customMetadata: {
          orderId,
          userId,
          dpi: '300',
          generatedAt: new Date().toISOString()
        }
      });

      const downloadURL = await getDownloadURL(uploadResult.ref);

      return {
        filename,
        url: downloadURL,
        path: filePath,
        size: buffer.length
      };
    } catch (error) {
      console.error('Error uploading print file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload print file: ${errorMessage}`);
    }
  }

  async uploadPrintResult(
    printResult: PrintExportResult,
    orderId: string,
    userId: string
  ): Promise<UploadResult> {
    return this.uploadPrintFile(
      printResult.buffer,
      printResult.filename,
      orderId,
      userId
    );
  }

  async uploadOrderPrintFiles(
    printResults: PrintExportResult[],
    orderId: string,
    userId: string
  ): Promise<UploadResult[]> {
    const uploadPromises = printResults.map(result =>
      this.uploadPrintResult(result, orderId, userId)
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

  async getSecureDownloadLink(filePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, filePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get download link: ${errorMessage}`);
    }
  }

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
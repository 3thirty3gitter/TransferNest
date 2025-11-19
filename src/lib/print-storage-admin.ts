import { getStorage } from '@/lib/firebase-admin';
import { PrintExportResult } from '@/lib/print-export';

export interface UploadResult {
  filename: string;
  url: string;
  path: string;
  size: number;
}

export class PrintFileStorageAdmin {
  async uploadPrintFile(
    buffer: Buffer,
    filename: string,
    orderId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket();
      const filePath = `orders/${userId}/${orderId}/${filename}`;
      const file = bucket.file(filePath);

      await file.save(buffer, {
        contentType: 'image/png',
        metadata: {
          metadata: {
            orderId,
            userId,
            dpi: '300',
            generatedAt: new Date().toISOString()
          }
        }
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Get the public URL
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

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

    return Promise.all(uploadPromises);
  }

  async deletePrintFile(filePath: string): Promise<void> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(filePath);

      await file.delete();
      console.log(`Print file deleted: ${filePath}`);
    } catch (error) {
      console.error('Error deleting print file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete print file: ${errorMessage}`);
    }
  }

  async deleteOrderPrintFiles(orderId: string, userId: string): Promise<void> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket();
      const prefix = `orders/${userId}/${orderId}/`;

      const [files] = await bucket.getFiles({ prefix });

      const deletePromises = files.map((file: any) => file.delete());
      await Promise.all(deletePromises);

      console.log(`Deleted ${files.length} print files for order ${orderId}`);
    } catch (error) {
      console.error('Error deleting order print files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete order print files: ${errorMessage}`);
    }
  }
}

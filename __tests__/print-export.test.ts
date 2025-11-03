import { PrintExportGenerator } from '../src/lib/print-export';
import { NestedImage } from '../src/lib/nesting-algorithm';

describe('Print Export', () => {
  let generator: PrintExportGenerator;

  beforeEach(() => {
    generator = new PrintExportGenerator();
  });

  test('should generate print file with correct dimensions', async () => {
    const images: NestedImage[] = [
      {
        id: 'img1-0',
        url: 'test1.jpg',
        x: 0.5,
        y: 0.5,
        width: 4,
        height: 4,
        rotated: false
      },
      {
        id: 'img2-0',
        url: 'test2.jpg',
        x: 5,
        y: 0.5,
        width: 6,
        height: 3,
        rotated: false
      }
    ];

    const result = await generator.generatePrintFile(images, '13', {
      dpi: 300,
      format: 'png',
      quality: 100
    });

    // Check dimensions
    expect(result.dimensions.width).toBe(13 * 300); // 3900px
    expect(result.dimensions.height).toBe(19 * 300); // 5700px
    expect(result.dimensions.dpi).toBe(300);

    // Check metadata
    expect(result.metadata.imageCount).toBe(2);
    expect(result.metadata.totalArea).toBe(16 + 18); // 4x4 + 6x3 = 34 sq in

    // Check buffer is generated
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);

    // Check filename format
    expect(result.filename).toMatch(/dtf-print-13x-300dpi-\d{4}-\d{2}-\d{2}/);

    console.log(`Generated print file: ${result.filename}`);
    console.log(`  Size: ${(result.buffer.length / 1024).toFixed(2)} KB`);
    console.log(`  Dimensions: ${result.dimensions.width}x${result.dimensions.height}px`);
    console.log(`  Utilization: ${result.metadata.utilization}%`);
  });

  test('should handle empty image array', async () => {
    const result = await generator.generatePrintFile([], '17');

    expect(result.metadata.imageCount).toBe(0);
    expect(result.metadata.totalArea).toBe(0);
    expect(result.buffer.length).toBeGreaterThan(0); // Should still generate blank sheet
  });

  test('should generate preview with correct aspect ratio', async () => {
    const images: NestedImage[] = [
      {
        id: 'img1-0',
        url: 'test.jpg',
        x: 0.5,
        y: 0.5,
        width: 4,
        height: 4,
        rotated: false
      }
    ];

    const preview = await generator.generatePreview(images, '13', 800);

    expect(preview.width).toBe(800);
    // 13x19 sheet: aspect ratio = 19/13 = 1.46
    expect(preview.height).toBe(Math.round(800 * (19 / 13)));
    expect(preview.metadata.imageCount).toBe(1);
  });

  test('should calculate pricing correctly', () => {
    const images: NestedImage[] = [
      {
        id: 'img1-0',
        url: 'test1.jpg',
        x: 0.5,
        y: 0.5,
        width: 4,
        height: 4,
        rotated: false
      },
      {
        id: 'img2-0',
        url: 'test2.jpg',
        x: 5,
        y: 0.5,
        width: 6,
        height: 3,
        rotated: false
      }
    ];

    const pricing13 = generator.calculatePrintPricing(images, '13');
    
    // Base $15 + (34 sq in * $0.75) = $15 + $25.50 = $40.50
    expect(pricing13.materialCost).toBeCloseTo(40.50, 2);
    expect(pricing13.totalArea).toBe(34); // 16 + 18
    expect(pricing13.imageCount).toBe(2);

    const pricing17 = generator.calculatePrintPricing(images, '17');
    
    // Base $25 + (34 sq in * $0.65) = $25 + $22.10 = $47.10
    expect(pricing17.materialCost).toBeCloseTo(47.10, 2);
  });

  test('should handle different DPI settings', async () => {
    const images: NestedImage[] = [
      {
        id: 'img1-0',
        url: 'test.jpg',
        x: 0.5,
        y: 0.5,
        width: 4,
        height: 4,
        rotated: false
      }
    ];

    const result150 = await generator.generatePrintFile(images, '13', { dpi: 150 });
    const result300 = await generator.generatePrintFile(images, '13', { dpi: 300 });

    // 300 DPI should be exactly double 150 DPI
    expect(result300.dimensions.width).toBe(result150.dimensions.width * 2);
    expect(result300.dimensions.height).toBe(result150.dimensions.height * 2);
  });

  test('should handle rotated images', async () => {
    const images: NestedImage[] = [
      {
        id: 'img1-0',
        url: 'test.jpg',
        x: 0.5,
        y: 0.5,
        width: 6,
        height: 3,
        rotated: true // Width and height are swapped
      }
    ];

    const result = await generator.generatePrintFile(images, '13');

    expect(result.metadata.imageCount).toBe(1);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  test('should handle sheet size boundaries', async () => {
    const images: NestedImage[] = [
      {
        id: 'edge-0',
        url: 'test.jpg',
        x: 12.5, // Near edge of 13" sheet
        y: 18.5, // Near edge of 19" height
        width: 0.4,
        height: 0.4,
        rotated: false
      }
    ];

    const result = await generator.generatePrintFile(images, '13');

    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.metadata.imageCount).toBe(1);
  });
});

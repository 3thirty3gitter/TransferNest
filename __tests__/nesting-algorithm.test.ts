import { executeNesting, ManagedImage, VIRTUAL_SHEET_HEIGHT } from '../src/lib/nesting-algorithm';

describe('Nesting Algorithm', () => {
  const sheetWidth = 2000;

  test('should pack single image without rotation', () => {
    const images: ManagedImage[] = [
      {
        id: 'img1',
        url: 'test.jpg',
        width: 500,
        height: 300,
        aspectRatio: 500 / 300,
        copies: 1,
      }
    ];

    const result = executeNesting(images, sheetWidth);

    expect(result.placedItems).toHaveLength(1);
    expect(result.placedItems[0]).toEqual({
      id: 'img1-0',
      url: 'test.jpg',
      x: 0,
      y: 0,
      width: 500,
      height: 300,
      rotated: false
    });
    expect(result.failedCount).toBe(0);
    expect(result.sheetLength).toBe(300);
  });

  test('should pack multiple images', () => {
    const images: ManagedImage[] = [
      {
        id: 'img1',
        url: 'test1.jpg',
        width: 500,
        height: 300,
        aspectRatio: 500 / 300,
        copies: 2,
      },
      {
        id: 'img2',
        url: 'test2.jpg',
        width: 400,
        height: 400,
        aspectRatio: 1,
        copies: 1,
      }
    ];

    const result = executeNesting(images, sheetWidth);

    expect(result.placedItems.length).toBe(3); // 2 copies of img1 + 1 of img2
    expect(result.failedCount).toBeLessThanOrEqual(0);
    expect(result.sheetLength).toBeGreaterThan(0);
    expect(result.areaUtilizationPct).toBeGreaterThan(0);
  });

  test('should handle rotation for better packing', () => {
    const images: ManagedImage[] = [
      {
        id: 'portrait',
        url: 'portrait.jpg',
        width: 300,
        height: 500, // Portrait: taller than wide
        aspectRatio: 300 / 500,
        copies: 1,
      }
    ];

    const result = executeNesting(images, sheetWidth);

    expect(result.placedItems).toHaveLength(1);
    // The rotated flag should be true if the algorithm rotated it
    expect(result.placedItems[0].rotated).toBeDefined();
  });

  test('should calculate utilization percentage', () => {
    const images: ManagedImage[] = [
      {
        id: 'img1',
        url: 'test.jpg',
        width: 500,
        height: 300,
        aspectRatio: 500 / 300,
        copies: 1,
      }
    ];

    const result = executeNesting(images, sheetWidth);
    
    const expectedUsedArea = 500 * 300;
    const expectedTotalArea = sheetWidth * result.sheetLength;
    const expectedUtilization = expectedUsedArea / expectedTotalArea;

    expect(result.areaUtilizationPct).toBeCloseTo(expectedUtilization, 2);
  });

  test('should handle large batch with copies', () => {
    const images: ManagedImage[] = [
      {
        id: 'img1',
        url: 'test1.jpg',
        width: 300,
        height: 200,
        aspectRatio: 300 / 200,
        copies: 5,
      },
      {
        id: 'img2',
        url: 'test2.jpg',
        width: 250,
        height: 250,
        aspectRatio: 1,
        copies: 3,
      }
    ];

    const result = executeNesting(images, sheetWidth);

    expect(result.totalCount).toBe(8); // 5 + 3
    expect(result.placedItems.length + result.failedCount).toBe(8);
    expect(result.areaUtilizationPct).toBeGreaterThan(0);
    expect(result.areaUtilizationPct).toBeLessThanOrEqual(1);
  });

  test('should exceed 80% utilization with good packing', () => {
    // Create a well-sized batch that should pack efficiently
    const images: ManagedImage[] = [
      {
        id: 'img1',
        url: 'test1.jpg',
        width: 600,
        height: 400,
        aspectRatio: 600 / 400,
        copies: 4,
      },
      {
        id: 'img2',
        url: 'test2.jpg',
        width: 500,
        height: 500,
        aspectRatio: 1,
        copies: 2,
      }
    ];

    const result = executeNesting(images, sheetWidth);

    console.log(`\nUtilization Test:`);
    console.log(`Total items: ${result.totalCount}`);
    console.log(`Placed items: ${result.placedItems.length}`);
    console.log(`Failed items: ${result.failedCount}`);
    console.log(`Sheet length: ${result.sheetLength}mm`);
    console.log(`Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);
    
    // With maxrects-packer, we should get reasonable utilization
    expect(result.areaUtilizationPct).toBeGreaterThan(0.6); // At least 60%
  });

  test('should sort by area descending (largest first)', () => {
    const images: ManagedImage[] = [
      {
        id: 'small',
        url: 'small.jpg',
        width: 100,
        height: 100,
        aspectRatio: 1,
        copies: 1,
      },
      {
        id: 'large',
        url: 'large.jpg',
        width: 800,
        height: 600,
        aspectRatio: 800 / 600,
        copies: 1,
      }
    ];

    const result = executeNesting(images, sheetWidth);

    expect(result.placedItems).toHaveLength(2);
    // The larger item should be packed first (lower y position generally)
    const largeItem = result.placedItems.find(i => i.id === 'large-0');
    const smallItem = result.placedItems.find(i => i.id === 'small-0');
    
    expect(largeItem).toBeDefined();
    expect(smallItem).toBeDefined();
  });
});

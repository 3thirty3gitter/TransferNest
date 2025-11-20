// deepnest-wrapper.ts
// Wrapper for any-nest (SVGNest) library - proven commercial-grade nesting

import type { ManagedImage, NestedImage, NestingResult } from './nesting-algorithm';

// @ts-ignore - any-nest doesn't have types
import { nest } from 'any-nest';

/**
 * Use the proven SVGNest/Deepnest algorithm for commercial-grade nesting (85-95% utilization)
 */
export async function deepnestNesting(
  images: ManagedImage[],
  sheetWidth: number,
  sheetHeight: number = 10000,
  padding: number = 0.05,
  config?: {
    rotations?: number; // Number of rotation angles to try (default: 4 = 0°, 90°, 180°, 270°)
    populationSize?: number; // Genetic algorithm population size
    mutationRate?: number; // Mutation rate for GA
    spacing?: number; // Override padding
  }
): Promise<NestingResult> {
  // Expand copies into individual items
  const expanded: ManagedImage[] = [];
  images.forEach(img => {
    for (let i = 0; i < Math.max(1, img.copies); i++) {
      expanded.push({ ...img, id: `${img.id}-${i}`, copies: 1 });
    }
  });

  // Convert to any-nest format (array of polygon points)
  const parts = expanded.map(img => {
    // Create rectangle polygon for each image
    return {
      points: [
        { x: 0, y: 0 },
        { x: img.width, y: 0 },
        { x: img.width, y: img.height },
        { x: 0, y: img.height }
      ],
      id: img.id,
      source: img
    };
  });

  // Define the bin (sheet) as a polygon
  const bin = {
    points: [
      { x: 0, y: 0 },
      { x: sheetWidth, y: 0 },
      { x: sheetWidth, y: sheetHeight },
      { x: 0, y: sheetHeight }
    ]
  };

  // Configure nesting parameters (Deepnest defaults)
  const nestConfig = {
    spacing: config?.spacing ?? padding,
    rotations: config?.rotations ?? 4, // Try 0°, 90°, 180°, 270°
    populationSize: config?.populationSize ?? 10,
    mutationRate: config?.mutationRate ?? 10,
    useHoles: false, // We don't have holes in DTF transfers
    exploreConcave: true, // Better packing for irregular shapes
    placementType: 'gravity' // Bottom-left placement (best for rectangular sheets)
  };

  try {
    // Run the nesting algorithm
    const result = await nest({
      parts,
      bin,
      config: nestConfig
    });

    // Convert result back to our format
    const placedItems: NestedImage[] = [];
    let usedArea = 0;
    let maxY = 0;

    if (result && result.placements && result.placements.length > 0) {
      // Get the first (best) placement
      const placement = result.placements[0];
      
      for (const item of placement) {
        const source = item.source || expanded.find(img => img.id === item.id);
        if (!source) continue;

        placedItems.push({
          id: item.id,
          url: source.url,
          x: item.x,
          y: item.y,
          width: source.width,
          height: source.height,
          originalWidth: source.width,
          originalHeight: source.height,
          rotated: item.rotation !== 0
        });

        usedArea += source.width * source.height;
        maxY = Math.max(maxY, item.y + source.height);
      }
    }

    const sheetLength = maxY + padding;
    const sheetArea = sheetWidth * sheetLength;
    const areaUtilizationPct = sheetArea === 0 ? 0 : usedArea / sheetArea;

    return {
      placedItems,
      sheetLength,
      areaUtilizationPct,
      totalCount: expanded.length,
      failedCount: expanded.length - placedItems.length,
      sortStrategy: 'DEEPNEST_GA',
      packingMethod: 'SVGNest'
    };
  } catch (error) {
    console.error('Deepnest error:', error);
    
    // Fallback: return empty result
    return {
      placedItems: [],
      sheetLength: 0,
      areaUtilizationPct: 0,
      totalCount: expanded.length,
      failedCount: expanded.length,
      sortStrategy: 'DEEPNEST_GA',
      packingMethod: 'SVGNest'
    };
  }
}

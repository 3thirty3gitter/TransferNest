/**
 * Enhanced Bottom-Left-Fill (BLF) Algorithm
 * Proven industry algorithm for optimal 2D nesting
 */

import { ManagedImage, NestedImage, NestingResult } from '../nesting-algorithm';

export interface BLFOptions {
  allowRotation: boolean;
  spacing: number;
  sortStrategy: 'AREA_DESC' | 'HEIGHT_DESC' | 'WIDTH_DESC' | 'PERIMETER_DESC';
  maxIterations: number;
}

export interface PlacementCandidate {
  x: number;
  y: number;
  rotated: boolean;
  score: number;
}

interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class BottomLeftFillPacker {
  private placedItems: NestedImage[] = [];
  private sheetWidth: number;
  private spacing: number;
  private occupiedRegions: Rectangle[] = [];

  constructor(sheetWidth: number, spacing: number = 0.125) {
    this.sheetWidth = sheetWidth;
    this.spacing = spacing;
  }

  pack(images: ManagedImage[], options: BLFOptions): NestingResult {
    this.reset();
    
    // Expand and sort images
    const expandedImages = this.expandImages(images);
    this.sortImages(expandedImages, options.sortStrategy);
    
    let failedCount = 0;
    
    for (const image of expandedImages) {
      const placement = this.findOptimalPlacement(image, options);
      
      if (placement) {
        this.placedItems.push(placement);
        this.updateOccupiedRegions(placement);
      } else {
        failedCount++;
      }
    }
    
    return this.generateResult(expandedImages.length, failedCount, options);
  }

  private reset(): void {
    this.placedItems = [];
    this.occupiedRegions = [];
  }

  private findOptimalPlacement(image: any, options: BLFOptions): NestedImage | null {
    const candidates: PlacementCandidate[] = [];
    
    // Generate all possible placement positions
    const positions = this.generatePlacementCandidates();
    
    for (const pos of positions) {
      // Try normal orientation
      if (this.canPlaceAt(image, pos.x, pos.y, false)) {
        const score = this.calculatePlacementScore(pos.x, pos.y, image.width, image.height);
        candidates.push({ x: pos.x, y: pos.y, rotated: false, score });
      }
      
      // Try rotated orientation if allowed
      if (options.allowRotation && this.canPlaceAt(image, pos.x, pos.y, true)) {
        const score = this.calculatePlacementScore(pos.x, pos.y, image.height, image.width);
        candidates.push({ x: pos.x, y: pos.y, rotated: true, score });
      }
    }
    
    if (candidates.length === 0) return null;
    
    // Sort by score (lower is better for bottom-left preference)
    candidates.sort((a, b) => a.score - b.score);
    
    const best = candidates[0];
    return this.createPlacement(image, best.x, best.y, best.rotated);
  }

  private generatePlacementCandidates(): Point[] {
    const candidates: Point[] = [{ x: 0, y: 0 }]; // Always try origin
    
    // Add candidates based on existing items
    for (const item of this.placedItems) {
      candidates.push(
        { x: 0, y: item.y + item.height + this.spacing }, // Left edge, above item
        { x: item.x + item.width + this.spacing, y: 0 }, // Right of item, bottom edge
        { x: item.x + item.width + this.spacing, y: item.y }, // Right of item, same height
        { x: item.x, y: item.y + item.height + this.spacing }, // Above item, same x
      );
    }
    
    // Remove duplicates and invalid positions
    const uniqueCandidates = this.removeDuplicatePoints(candidates);
    
    // Sort by bottom-left preference (y coordinate first, then x)
    return uniqueCandidates
      .filter(p => p.x >= 0 && p.y >= 0 && p.x < this.sheetWidth)
      .sort((a, b) => a.y - b.y || a.x - b.x);
  }

  private calculatePlacementScore(x: number, y: number, width: number, height: number): number {
    // Bottom-left scoring: prefer lower y, then lower x
    return y * 1000 + x;
  }

  private canPlaceAt(image: any, x: number, y: number, rotated: boolean): boolean {
    const width = rotated ? image.height : image.width;
    const height = rotated ? image.width : image.height;
    
    // Check sheet boundaries
    if (x + width > this.sheetWidth || x < 0 || y < 0) {
      return false;
    }
    
    // Check for overlaps with placed items
    return !this.isPositionOccupied(x, y, width, height);
  }

  private isPositionOccupied(x: number, y: number, width: number, height: number): boolean {
    const testRect: Rectangle = {
      x: x - this.spacing / 2,
      y: y - this.spacing / 2,
      width: width + this.spacing,
      height: height + this.spacing
    };
    
    return this.occupiedRegions.some(region => 
      this.rectanglesOverlap(testRect, region)
    );
  }

  private rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private updateOccupiedRegions(placement: NestedImage): void {
    this.occupiedRegions.push({
      x: placement.x - this.spacing / 2,
      y: placement.y - this.spacing / 2,
      width: placement.width + this.spacing,
      height: placement.height + this.spacing
    });
  }

  private createPlacement(image: any, x: number, y: number, rotated: boolean): NestedImage {
    return {
      id: image.id,
      url: image.url,
      x,
      y,
      width: rotated ? image.height : image.width,
      height: rotated ? image.width : image.height,
      rotated
    };
  }

  private expandImages(images: ManagedImage[]): any[] {
    return images.flatMap(img =>
      Array(img.copies).fill(null).map((_, index) => ({
        id: `${img.id}_${index}`,
        originalId: img.id,
        url: img.url,
        width: img.width,
        height: img.height,
      }))
    );
  }

  private sortImages(images: any[], strategy: string): void {
    images.sort((a, b) => {
      switch (strategy) {
        case 'AREA_DESC':
          return (b.width * b.height) - (a.width * a.height);
        case 'HEIGHT_DESC':
          return b.height - a.height;
        case 'WIDTH_DESC':
          return b.width - a.width;
        case 'PERIMETER_DESC':
          return (b.width + b.height) - (a.width + a.height);
        default:
          return 0;
      }
    });
  }

  private removeDuplicatePoints(points: Point[]): Point[] {
    const unique: Point[] = [];
    const seen = new Set<string>();
    
    for (const point of points) {
      const key = `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(point);
      }
    }
    
    return unique;
  }

  private generateResult(totalCount: number, failedCount: number, options: BLFOptions): NestingResult {
    const sheetLength = this.calculateSheetLength();
    const areaUtilization = this.calculateAreaUtilization(sheetLength);
    
    return {
      placedItems: this.placedItems,
      sheetLength,
      areaUtilizationPct: areaUtilization,
      totalCount,
      failedCount,
      sortStrategy: options.sortStrategy,
      packingMethod: 'BottomLeft'
    };
  }

  private calculateSheetLength(): number {
    if (this.placedItems.length === 0) return 0;
    return Math.max(...this.placedItems.map(item => item.y + item.height)) + this.spacing;
  }

  private calculateAreaUtilization(sheetLength: number): number {
    if (sheetLength <= 0) return 0;
    const totalItemArea = this.placedItems.reduce((acc, item) => acc + item.width * item.height, 0);
    const totalSheetArea = this.sheetWidth * sheetLength;
    return totalItemArea / totalSheetArea;
  }
}

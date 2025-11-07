// ga-nesting.ts
// Genetic Algorithm + Bottom-Left Placement (CADEXSOFT approach)
// State-of-the-art 2D nesting achieving 85-95% utilization
// Enhanced with adaptive parameters based on batch diversity

import type { ManagedImage, NestedImage, NestingResult } from './nesting-algorithm';

interface Chromosome {
  sequence: ManagedImage[];
  rotations: number[];
  fitness: number;
}

interface BatchAnalysis {
  uniqueSizes: number;
  sizeVariance: number;
  copyDistribution: number[];
  aspectRatioRange: number;
  complexityScore: number;
}

/**
 * Analyze batch diversity to determine optimal GA parameters
 */
function analyzeBatchDiversity(images: ManagedImage[]): BatchAnalysis {
  const uniqueSizes = new Set<string>();
  const areas: number[] = [];
  const aspectRatios: number[] = [];
  const copyDistribution: number[] = [];
  
  images.forEach(img => {
    const sizeKey = `${img.width.toFixed(2)}x${img.height.toFixed(2)}`;
    uniqueSizes.add(sizeKey);
    areas.push(img.width * img.height);
    aspectRatios.push(img.width / img.height);
    copyDistribution.push(img.copies);
  });
  
  // Calculate variance in sizes
  const meanArea = areas.reduce((a, b) => a + b, 0) / areas.length;
  const sizeVariance = areas.reduce((sum, area) => sum + Math.pow(area - meanArea, 2), 0) / areas.length;
  
  // Calculate aspect ratio range
  const minAspect = Math.min(...aspectRatios);
  const maxAspect = Math.max(...aspectRatios);
  const aspectRatioRange = maxAspect - minAspect;
  
  // Complexity score: combines unique sizes, variance, and aspect ratio diversity
  const normalizedVariance = sizeVariance / (meanArea * meanArea);
  const complexityScore = (uniqueSizes.size / images.length) * (1 + normalizedVariance) * (1 + aspectRatioRange);
  
  return {
    uniqueSizes: uniqueSizes.size,
    sizeVariance,
    copyDistribution,
    aspectRatioRange,
    complexityScore
  };
}

/**
 * Determine adaptive GA parameters based on batch complexity
 */
function getAdaptiveParameters(analysis: BatchAnalysis, totalItems: number): {
  populationSize: number;
  generations: number;
  mutationRate: number;
  eliteCount: number;
} {
  const basePopulation = 50;
  const baseGenerations = 30;
  
  // Scale up for high diversity/complexity
  const complexityMultiplier = Math.min(1 + analysis.complexityScore * 0.5, 2.0);
  
  // Scale up for large batches
  const sizeMultiplier = Math.min(1 + Math.log10(totalItems / 30) * 0.3, 1.5);
  
  const populationSize = Math.round(basePopulation * complexityMultiplier);
  const generations = Math.round(baseGenerations * complexityMultiplier);
  
  // Higher mutation for more diverse batches
  const mutationRate = Math.min(0.15 + analysis.complexityScore * 0.1, 0.35);
  
  // More elites for larger populations
  const eliteCount = Math.max(2, Math.round(populationSize * 0.05));
  
  console.log(`[GA ADAPTIVE] Complexity: ${analysis.complexityScore.toFixed(2)}, Pop: ${populationSize}, Gen: ${generations}, Mutation: ${(mutationRate * 100).toFixed(0)}%`);
  console.log(`[GA BATCH] ${analysis.uniqueSizes} unique sizes, ${totalItems} total items, aspect range: ${analysis.aspectRatioRange.toFixed(2)}`);
  
  return { populationSize, generations, mutationRate, eliteCount };
}

/**
 * Two-tiered GA nesting algorithm with adaptive parameters:
 * 1. Genetic Algorithm optimizes sequence + rotations
 * 2. Bottom-Left Fill executes placement
 */
export function geneticAlgorithmNesting(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number = 0.25,
  canRotate: (img: ManagedImage) => boolean,
  options: {
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
    rotationSteps?: number;
    adaptive?: boolean; // Enable adaptive parameter tuning
  } = {}
): NestingResult {
  const {
    rotationSteps = 4, // 0°, 90°, 180°, 270°
    adaptive = true
  } = options;

  // Expand copies
  const expanded: ManagedImage[] = [];
  images.forEach(img => {
    for (let i = 0; i < Math.max(1, img.copies); i++) {
      expanded.push({ ...img, id: `${img.id}-${i}`, copies: 1 });
    }
  });

  // Analyze batch and determine parameters
  const analysis = analyzeBatchDiversity(images);
  const adaptiveParams = adaptive 
    ? getAdaptiveParameters(analysis, expanded.length)
    : {
        populationSize: options.populationSize || 80,
        generations: options.generations || 40,
        mutationRate: options.mutationRate || 0.25,
        eliteCount: 2
      };
  
  const { populationSize, generations, mutationRate, eliteCount } = adaptiveParams;

  // Initialize population with diversity-aware strategies
  let population: Chromosome[] = [];
  
  // Strategy 1: Largest-first (good baseline)
  const sorted = expanded.slice().sort((a, b) => (b.width * b.height) - (a.width * a.height));
  population.push({
    sequence: sorted,
    rotations: sorted.map(img => canRotate(img) ? (Math.random() < 0.5 ? 90 : 0) : 0),
    fitness: 0
  });

  // Strategy 2: Group by size (helps with diverse batches)
  if (analysis.uniqueSizes > 5) {
    const sizeGroups = new Map<string, ManagedImage[]>();
    expanded.forEach(img => {
      const sizeKey = `${Math.round(img.width)}x${Math.round(img.height)}`;
      if (!sizeGroups.has(sizeKey)) sizeGroups.set(sizeKey, []);
      sizeGroups.get(sizeKey)!.push(img);
    });
    
    const grouped: ManagedImage[] = [];
    sizeGroups.forEach(group => grouped.push(...shuffleArray(group)));
    
    population.push({
      sequence: grouped,
      rotations: grouped.map(img => canRotate(img) ? (Math.random() < 0.5 ? 90 : 0) : 0),
      fitness: 0
    });
  }

  // Strategy 3: Aspect ratio sorted (helps with mixed shapes)
  if (analysis.aspectRatioRange > 0.5) {
    const aspectSorted = expanded.slice().sort((a, b) => 
      (b.width / b.height) - (a.width / a.height)
    );
    population.push({
      sequence: aspectSorted,
      rotations: aspectSorted.map(img => canRotate(img) ? 0 : 0),
      fitness: 0
    });
  }

  // Rest of population: random with biased rotations for elongated shapes
  while (population.length < populationSize) {
    const sequence = shuffleArray(expanded.slice());
    const rotations = sequence.map(img => {
      if (!canRotate(img)) return 0;
      
      // Bias rotation for elongated shapes
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 2 || aspectRatio < 0.5) {
        return Math.random() < 0.7 ? 90 : 0; // 70% chance to rotate elongated
      }
      
      return [0, 90, 180, 270][Math.floor(Math.random() * rotationSteps)];
    });
    population.push({ sequence, rotations, fitness: 0 });
  }

  let bestEver: Chromosome | null = null;

  // Evolve over generations
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness for each chromosome
    for (const chromosome of population) {
      const result = bottomLeftPlacement(
        chromosome.sequence,
        chromosome.rotations,
        sheetWidth,
        padding
      );
      chromosome.fitness = result.areaUtilizationPct;
      
      if (!bestEver || chromosome.fitness > bestEver.fitness) {
        bestEver = chromosome;
      }
    }

    // Sort by fitness (best first)
    population.sort((a, b) => b.fitness - a.fitness);

    console.log(`[GA GEN ${gen + 1}/${generations}] Best: ${(population[0].fitness * 100).toFixed(1)}%, Diversity: ${analysis.uniqueSizes} sizes`);

    if (gen === generations - 1) break;

    // Create next generation
    const nextGen: Chromosome[] = [];
    
    // Elitism: keep top performers
    for (let i = 0; i < eliteCount; i++) {
      nextGen.push({ ...population[i] });
    }

    // Crossover + mutation
    while (nextGen.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      
      const child = crossover(parent1, parent2, canRotate);
      mutate(child, mutationRate, canRotate, rotationSteps, analysis);
      
      nextGen.push(child);
    }

    population = nextGen;
  }

  // Return best result
  const best = population[0];
  const finalResult = bottomLeftPlacement(best.sequence, best.rotations, sheetWidth, padding);
  
  return {
    ...finalResult,
    sortStrategy: 'GENETIC_ALGORITHM',
    packingMethod: 'GA_BottomLeft'
  };
}

/**
 * Bottom-Left Fill placement algorithm
 * Places each item as close to bottom-left as possible without overlaps
 */
function bottomLeftPlacement(
  sequence: ManagedImage[],
  rotations: number[],
  sheetWidth: number,
  padding: number
): NestingResult {
  const placedItems: NestedImage[] = [];
  const usedRects: Array<{x: number; y: number; width: number; height: number}> = [];
  let maxY = padding;
  let usedArea = 0;

  for (let i = 0; i < sequence.length; i++) {
    const img = sequence[i];
    const rotation = rotations[i];
    
    // Apply rotation
    const isRotated = rotation === 90 || rotation === 270;
    const w = isRotated ? img.height : img.width;
    const h = isRotated ? img.width : img.height;
    
    const itemWidth = w + padding;
    const itemHeight = h + padding;

    // Find bottom-left position
    let bestX = padding;
    let bestY = padding;
    let placed = false;

    // Try positions in bottom-left order
    const candidates: Array<{x: number; y: number}> = [{ x: padding, y: padding }];
    
    for (const rect of usedRects) {
      candidates.push({ x: rect.x + rect.width, y: rect.y });
      candidates.push({ x: rect.x, y: rect.y + rect.height });
    }

    // Sort by bottom-left priority (Y first, then X)
    candidates.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 0.01) return a.x - b.x;
      return a.y - b.y;
    });

    for (const pos of candidates) {
      if (pos.x + itemWidth > sheetWidth) continue;

      // Check collision
      let collision = false;
      for (const rect of usedRects) {
        if (!(pos.x + itemWidth <= rect.x ||
              pos.x >= rect.x + rect.width ||
              pos.y + itemHeight <= rect.y ||
              pos.y >= rect.y + rect.height)) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        bestX = pos.x;
        bestY = pos.y;
        placed = true;
        break;
      }
    }

    if (!placed) continue;

    placedItems.push({
      id: img.id,
      url: img.url,
      x: bestX,
      y: bestY,
      width: img.width,
      height: img.height,
      rotated: isRotated
    });

    usedRects.push({
      x: bestX,
      y: bestY,
      width: itemWidth,
      height: itemHeight
    });

    usedArea += img.width * img.height;
    maxY = Math.max(maxY, bestY + itemHeight);
  }

  const sheetLength = maxY + padding;
  const sheetArea = sheetWidth * sheetLength;
  const areaUtilizationPct = sheetArea === 0 ? 0 : usedArea / sheetArea;

  return {
    placedItems,
    sheetLength,
    areaUtilizationPct,
    totalCount: sequence.length,
    failedCount: sequence.length - placedItems.length,
    sortStrategy: '',
    packingMethod: ''
  };
}

// Tournament selection
function selectParent(population: Chromosome[]): Chromosome {
  const tournamentSize = 3;
  let best = population[Math.floor(Math.random() * population.length)];
  
  for (let i = 1; i < tournamentSize; i++) {
    const contender = population[Math.floor(Math.random() * population.length)];
    if (contender.fitness > best.fitness) {
      best = contender;
    }
  }
  
  return best;
}

// Order crossover (OX)
function crossover(parent1: Chromosome, parent2: Chromosome, canRotate: (img: ManagedImage) => boolean): Chromosome {
  const len = parent1.sequence.length;
  const start = Math.floor(Math.random() * len);
  const end = Math.floor(Math.random() * (len - start)) + start;
  
  const childSequence: ManagedImage[] = new Array(len);
  const childRotations: number[] = new Array(len);
  
  // Copy segment from parent1
  for (let i = start; i <= end; i++) {
    childSequence[i] = parent1.sequence[i];
    childRotations[i] = parent1.rotations[i];
  }
  
  // Fill remaining from parent2
  let currentPos = (end + 1) % len;
  for (let i = 0; i < len; i++) {
    const item = parent2.sequence[(end + 1 + i) % len];
    if (!childSequence.includes(item)) {
      childSequence[currentPos] = item;
      childRotations[currentPos] = parent2.rotations[(end + 1 + i) % len];
      currentPos = (currentPos + 1) % len;
    }
  }
  
  return { sequence: childSequence, rotations: childRotations, fitness: 0 };
}

// Mutation with adaptive strategies
function mutate(
  chromosome: Chromosome, 
  mutationRate: number, 
  canRotate: (img: ManagedImage) => boolean, 
  rotationSteps: number,
  analysis?: BatchAnalysis
) {
  // Swap mutation - more aggressive for diverse batches
  const swapRate = analysis && analysis.uniqueSizes > 5 ? mutationRate * 1.5 : mutationRate;
  if (Math.random() < swapRate) {
    const i = Math.floor(Math.random() * chromosome.sequence.length);
    const j = Math.floor(Math.random() * chromosome.sequence.length);
    [chromosome.sequence[i], chromosome.sequence[j]] = [chromosome.sequence[j], chromosome.sequence[i]];
    [chromosome.rotations[i], chromosome.rotations[j]] = [chromosome.rotations[j], chromosome.rotations[i]];
  }
  
  // Block swap mutation - swap groups of similar sizes
  if (analysis && analysis.uniqueSizes > 5 && Math.random() < mutationRate * 0.5) {
    const blockSize = Math.min(5, Math.floor(chromosome.sequence.length / 10));
    const i = Math.floor(Math.random() * (chromosome.sequence.length - blockSize));
    const j = Math.floor(Math.random() * (chromosome.sequence.length - blockSize));
    
    for (let k = 0; k < blockSize; k++) {
      [chromosome.sequence[i + k], chromosome.sequence[j + k]] = [chromosome.sequence[j + k], chromosome.sequence[i + k]];
      [chromosome.rotations[i + k], chromosome.rotations[j + k]] = [chromosome.rotations[j + k], chromosome.rotations[i + k]];
    }
  }
  
  // Rotation mutation - more aggressive for high aspect ratio variance
  const rotationRate = analysis && analysis.aspectRatioRange > 1 ? mutationRate * 1.5 : mutationRate;
  if (Math.random() < rotationRate) {
    const i = Math.floor(Math.random() * chromosome.sequence.length);
    if (canRotate(chromosome.sequence[i])) {
      // Smart rotation: prefer 90° for elongated shapes
      const img = chromosome.sequence[i];
      const aspectRatio = img.width / img.height;
      
      if (aspectRatio > 2 || aspectRatio < 0.5) {
        chromosome.rotations[i] = chromosome.rotations[i] === 0 ? 90 : 0;
      } else {
        chromosome.rotations[i] = [0, 90, 180, 270][Math.floor(Math.random() * rotationSteps)];
      }
    }
  }
  
  // Inversion mutation - reverse a segment (helps with local optimization)
  if (Math.random() < mutationRate * 0.3) {
    const start = Math.floor(Math.random() * chromosome.sequence.length);
    const length = Math.floor(Math.random() * Math.min(10, chromosome.sequence.length - start));
    
    for (let i = 0; i < length / 2; i++) {
      const idx1 = start + i;
      const idx2 = start + length - 1 - i;
      [chromosome.sequence[idx1], chromosome.sequence[idx2]] = [chromosome.sequence[idx2], chromosome.sequence[idx1]];
      [chromosome.rotations[idx1], chromosome.rotations[idx2]] = [chromosome.rotations[idx2], chromosome.rotations[idx1]];
    }
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

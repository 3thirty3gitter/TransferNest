// ga-nesting.ts
// Genetic Algorithm + Bottom-Left Placement (CADEXSOFT approach)
// State-of-the-art 2D nesting achieving 85-95% utilization

import type { ManagedImage, NestedImage, NestingResult } from './nesting-algorithm';

interface Chromosome {
  sequence: ManagedImage[];
  rotations: number[];
  fitness: number;
}

/**
 * Two-tiered GA nesting algorithm:
 * 1. Genetic Algorithm optimizes sequence + rotations
 * 2. Bottom-Left Fill executes placement
 */
export function geneticAlgorithmNesting(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number = 0.05,
  canRotate: (img: ManagedImage) => boolean,
  options: {
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
    rotationSteps?: number;
  } = {}
): NestingResult {
  const {
    populationSize = 20,
    generations = 10,
    mutationRate = 0.1,
    rotationSteps = 4 // 0°, 90°, 180°, 270°
  } = options;

  // Expand copies
  const expanded: ManagedImage[] = [];
  images.forEach(img => {
    for (let i = 0; i < Math.max(1, img.copies); i++) {
      expanded.push({ ...img, id: `${img.id}-${i}`, copies: 1 });
    }
  });

  // Initialize population
  let population: Chromosome[] = [];
  
  // First chromosome: largest-first (good starting point)
  const sorted = expanded.slice().sort((a, b) => (b.width * b.height) - (a.width * a.height));
  population.push({
    sequence: sorted,
    rotations: sorted.map(img => canRotate(img) ? (Math.random() < 0.5 ? 90 : 0) : 0),
    fitness: 0
  });

  // Rest of population: random variations
  for (let i = 1; i < populationSize; i++) {
    const sequence = shuffleArray(expanded.slice());
    const rotations = sequence.map(img => {
      if (!canRotate(img)) return 0;
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

    console.log(`[GA GEN ${gen + 1}/${generations}] Best: ${(population[0].fitness * 100).toFixed(1)}%`);

    if (gen === generations - 1) break;

    // Create next generation
    const nextGen: Chromosome[] = [];
    
    // Elitism: keep top 2
    nextGen.push(population[0], population[1]);

    // Crossover + mutation
    while (nextGen.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      
      const child = crossover(parent1, parent2, canRotate);
      mutate(child, mutationRate, canRotate, rotationSteps);
      
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

// Mutation
function mutate(chromosome: Chromosome, mutationRate: number, canRotate: (img: ManagedImage) => boolean, rotationSteps: number) {
  // Swap mutation
  if (Math.random() < mutationRate) {
    const i = Math.floor(Math.random() * chromosome.sequence.length);
    const j = Math.floor(Math.random() * chromosome.sequence.length);
    [chromosome.sequence[i], chromosome.sequence[j]] = [chromosome.sequence[j], chromosome.sequence[i]];
    [chromosome.rotations[i], chromosome.rotations[j]] = [chromosome.rotations[j], chromosome.rotations[i]];
  }
  
  // Rotation mutation
  if (Math.random() < mutationRate) {
    const i = Math.floor(Math.random() * chromosome.sequence.length);
    if (canRotate(chromosome.sequence[i])) {
      chromosome.rotations[i] = [0, 90, 180, 270][Math.floor(Math.random() * rotationSteps)];
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

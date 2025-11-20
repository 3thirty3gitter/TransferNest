// genetic-nesting.ts
// Genetic Algorithm + Bottom-Left placement for 90%+ utilization
// Based on CADEXSOFT two-tiered approach and Deepnest methodology

import type { ManagedImage, NestedImage, NestingResult } from './nesting-algorithm';

interface Individual {
  sequence: ManagedImage[];
  rotations: boolean[];
  fitness: number;
}

/**
 * Genetic Algorithm for nesting optimization
 * Evolves placement order and rotations to maximize utilization
 */
export function geneticNesting(
  images: ManagedImage[],
  sheetWidth: number,
  padding: number = 0.05,
  canRotate: (img: ManagedImage) => boolean,
  options: {
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
  } = {}
): NestingResult {
  const populationSize = options.populationSize || 20;
  const generations = options.generations || 10;
  const mutationRate = options.mutationRate || 0.3;

  // Expand copies
  const expanded: ManagedImage[] = [];
  images.forEach(img => {
    for (let i = 0; i < Math.max(1, img.copies); i++) {
      expanded.push({ ...img, id: `${img.id}-${i}`, copies: 1 });
    }
  });

  // Initialize population with diverse strategies
  const population: Individual[] = [];
  
  // Strategy 1: Area descending (Deepnest default)
  const areaDesc = expanded.slice().sort((a, b) => (b.width * b.height) - (a.width * a.height));
  population.push(createIndividual(areaDesc, canRotate));
  
  // Strategy 2: Height descending
  const heightDesc = expanded.slice().sort((a, b) => b.height - a.height);
  population.push(createIndividual(heightDesc, canRotate));
  
  // Strategy 3: Width descending
  const widthDesc = expanded.slice().sort((a, b) => b.width - a.width);
  population.push(createIndividual(widthDesc, canRotate));
  
  // Strategy 4: Perimeter descending
  const perimDesc = expanded.slice().sort((a, b) => 
    ((b.width + b.height) * 2) - ((a.width + a.height) * 2)
  );
  population.push(createIndividual(perimDesc, canRotate));

  // Fill rest with random variations
  while (population.length < populationSize) {
    const shuffled = shuffle(expanded.slice());
    population.push(createIndividual(shuffled, canRotate));
  }

  // Evolve population
  let bestEver: Individual = population[0];
  
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness for all individuals
    for (const individual of population) {
      if (individual.fitness === 0) {
        const result = bottomLeftPlacement(individual.sequence, individual.rotations, sheetWidth, padding);
        individual.fitness = result.areaUtilizationPct;
      }
    }

    // Sort by fitness (descending)
    population.sort((a, b) => b.fitness - a.fitness);
    
    if (population[0].fitness > bestEver.fitness) {
      bestEver = population[0];
      console.log(`[GA Gen ${gen}] New best: ${(bestEver.fitness * 100).toFixed(1)}%`);
    }

    // Elitism: Keep top 20%
    const eliteCount = Math.floor(populationSize * 0.2);
    const newPopulation = population.slice(0, eliteCount);

    // Crossover and mutation to create rest of population
    while (newPopulation.length < populationSize) {
      const parent1 = tournamentSelect(population, 3);
      const parent2 = tournamentSelect(population, 3);
      
      let child = crossover(parent1, parent2);
      
      if (Math.random() < mutationRate) {
        child = mutate(child);
      }
      
      newPopulation.push(child);
    }

    population.length = 0;
    population.push(...newPopulation);
  }

  // Final evaluation with best individual
  const finalResult = bottomLeftPlacement(bestEver.sequence, bestEver.rotations, sheetWidth, padding);
  
  return {
    ...finalResult,
    sortStrategy: 'GENETIC_ALGORITHM',
    packingMethod: 'GA_BottomLeft'
  };
}

function createIndividual(sequence: ManagedImage[], canRotate: (img: ManagedImage) => boolean): Individual {
  const rotations = sequence.map(img => canRotate(img) && Math.random() > 0.5);
  return { sequence, rotations, fitness: 0 };
}

function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function tournamentSelect(population: Individual[], tournamentSize: number): Individual {
  let best = population[Math.floor(Math.random() * population.length)];
  for (let i = 1; i < tournamentSize; i++) {
    const candidate = population[Math.floor(Math.random() * population.length)];
    if (candidate.fitness > best.fitness) {
      best = candidate;
    }
  }
  return best;
}

function crossover(parent1: Individual, parent2: Individual): Individual {
  const length = parent1.sequence.length;
  const crossoverPoint = Math.floor(Math.random() * length);
  
  // Order crossover (OX): preserve relative order
  const childSequence: ManagedImage[] = [];
  const childRotations: boolean[] = [];
  
  // Take first part from parent1
  const p1Part = parent1.sequence.slice(0, crossoverPoint);
  const p1Ids = new Set(p1Part.map(img => img.id));
  
  childSequence.push(...p1Part);
  childRotations.push(...parent1.rotations.slice(0, crossoverPoint));
  
  // Fill rest from parent2, maintaining order
  for (let i = 0; i < parent2.sequence.length; i++) {
    if (!p1Ids.has(parent2.sequence[i].id)) {
      childSequence.push(parent2.sequence[i]);
      childRotations.push(parent2.rotations[i]);
    }
  }
  
  return { sequence: childSequence, rotations: childRotations, fitness: 0 };
}

function mutate(individual: Individual): Individual {
  const mutationType = Math.random();
  
  if (mutationType < 0.5) {
    // Swap mutation: swap two random positions
    const sequence = individual.sequence.slice();
    const rotations = individual.rotations.slice();
    const i = Math.floor(Math.random() * sequence.length);
    const j = Math.floor(Math.random() * sequence.length);
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    [rotations[i], rotations[j]] = [rotations[j], rotations[i]];
    return { sequence, rotations, fitness: 0 };
  } else {
    // Rotation mutation: flip random rotation
    const rotations = individual.rotations.slice();
    const i = Math.floor(Math.random() * rotations.length);
    rotations[i] = !rotations[i];
    return { sequence: individual.sequence, rotations, fitness: 0 };
  }
}

/**
 * Bottom-Left placement algorithm
 * Places items as low and left as possible
 */
function bottomLeftPlacement(
  sequence: ManagedImage[],
  rotations: boolean[],
  sheetWidth: number,
  padding: number
): Omit<NestingResult, 'sortStrategy' | 'packingMethod'> {
  const placedItems: NestedImage[] = [];
  const usedRects: Array<{x: number; y: number; width: number; height: number}> = [];
  let maxY = padding;
  let usedArea = 0;

  for (let i = 0; i < sequence.length; i++) {
    const img = sequence[i];
    const rotated = rotations[i];
    
    const w = rotated ? img.height : img.width;
    const h = rotated ? img.width : img.height;
    const itemWidth = w + padding;
    const itemHeight = h + padding;

    // Generate candidate positions (bottom-left heuristic)
    const candidates: Array<{x: number; y: number; score: number}> = [];
    
    // Try starting position
    candidates.push({ x: padding, y: padding, score: padding * 1000 + padding });

    // Try positions adjacent to placed items
    for (const rect of usedRects) {
      // Right of rect
      candidates.push({
        x: rect.x + rect.width,
        y: rect.y,
        score: rect.y * 1000 + (rect.x + rect.width)
      });
      
      // Above rect
      candidates.push({
        x: rect.x,
        y: rect.y + rect.height,
        score: (rect.y + rect.height) * 1000 + rect.x
      });
      
      // Diagonal (top-right corner)
      candidates.push({
        x: rect.x + rect.width,
        y: rect.y + rect.height,
        score: (rect.y + rect.height) * 1000 + (rect.x + rect.width)
      });
    }

    // Sort candidates by score (lower Y first, then lower X)
    candidates.sort((a, b) => a.score - b.score);

    // Find first valid position
    let placed = false;
    for (const candidate of candidates) {
      if (candidate.x + itemWidth > sheetWidth) continue;

      // Check collision
      let collision = false;
      for (const rect of usedRects) {
        if (!(candidate.x + itemWidth <= rect.x ||
              candidate.x >= rect.x + rect.width ||
              candidate.y + itemHeight <= rect.y ||
              candidate.y >= rect.y + rect.height)) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        // Place item
        placedItems.push({
          id: img.id,
          url: img.url,
          x: candidate.x,
          y: candidate.y,
          width: img.width,
          height: img.height,
          originalWidth: img.width,
          originalHeight: img.height,
          rotated
        });

        usedRects.push({
          x: candidate.x,
          y: candidate.y,
          width: itemWidth,
          height: itemHeight
        });

        usedArea += img.width * img.height;
        maxY = Math.max(maxY, candidate.y + itemHeight);
        placed = true;
        break;
      }
    }

    if (!placed) {
      console.warn(`[GA] Failed to place item ${img.id}`);
    }
  }

  const sheetLength = maxY + padding;
  const sheetArea = sheetWidth * sheetLength;
  const areaUtilizationPct = sheetArea === 0 ? 0 : usedArea / sheetArea;

  return {
    placedItems,
    sheetLength,
    areaUtilizationPct,
    totalCount: sequence.length,
    failedCount: sequence.length - placedItems.length
  };
}

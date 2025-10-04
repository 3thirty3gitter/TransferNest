'use server';
/**
 * @fileOverview A specialist AI agent for optimizing 2D nesting of images on a sheet.
 *
 * - runNestingAgentFlow - The main flow that runs the packing algorithm.
 * - NestingAgentInput - The input schema for the agent.
 * - NestingAgentOutput - The output schema for the agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  NestingAgentInputSchema,
  NestingAgentOutputSchema,
} from '@/app/schema';
import {
  executeNesting,
  VIRTUAL_SHEET_HEIGHT,
  type SortStrategy,
} from '@/lib/nesting-algorithm';

export type NestingAgentInput = z.infer<typeof NestingAgentInputSchema>;
export type NestingAgentOutput = z.infer<typeof NestingAgentOutputSchema>;

export const runNestingAgentFlow = ai.defineFlow(
  {
    name: 'runNestingAgentFlow',
    inputSchema: NestingAgentInputSchema,
    outputSchema: NestingAgentOutputSchema,
  },
  async (input) => {
    // 1. Validate Input
    if (!input.images || input.images.length === 0) {
      throw new Error('No images were provided for nesting. Please add images and try again.');
    }
    const oversized = input.images.filter(
      (i) => (i.width > input.sheetWidth && i.height > input.sheetWidth)
    );
    if (oversized.length > 0) {
      throw new Error(
        'Some images are too large for the sheet even when rotated. Offending images: ' +
          oversized.map((i) => `${i.id || i.url} (${i.width}x${i.height})`).join(', ')
      );
    }
    
    // 2. Define Strategies for Competition
    const strategies: SortStrategy[] = ['AREA_DESC', 'HEIGHT_DESC', 'WIDTH_DESC', 'PERIMETER_DESC'];
    let bestResult: ReturnType<typeof executeNesting> | null = null;
    
    // 3. Run Competition
    for (const strategy of strategies) {
        const result = executeNesting(
            input.images,
            input.sheetWidth,
            VIRTUAL_SHEET_HEIGHT,
            strategy
        );
        
        // If this result is better than the current best, update it.
        // "Better" means higher utilization or, if equal, shorter length.
        if (!bestResult || 
            result.areaUtilizationPct > bestResult.areaUtilizationPct ||
            (result.areaUtilizationPct === bestResult.areaUtilizationPct && result.sheetLength < bestResult.sheetLength)) {
            bestResult = result;
        }
    }

    // 4. Handle No-Result Scenario
    if (!bestResult || bestResult.placedItems.length === 0) {
      throw new Error('Nesting failed to produce any layout. Check image dimensions.');
    }
    
    // 5. Construct Final Output with Diagnostics
    const output: NestingAgentOutput = {
      placedItems: bestResult.placedItems,
      sheetLength: bestResult.sheetLength,
      areaUtilizationPct: bestResult.areaUtilizationPct,
      strategy: bestResult.sortStrategy,
      totalCount: bestResult.totalCount,
      failedCount: bestResult.failedCount,
    };

    if (bestResult.failedCount > 0) {
      output.warning = `${bestResult.failedCount} out of ${bestResult.totalCount} image(s) could not be placed. Try reducing quantities or using a wider sheet.`;
    }

    return output;
  }
);
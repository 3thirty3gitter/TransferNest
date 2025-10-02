'use server';
/**
 * @fileOverview A specialist AI agent for optimizing 2D nesting of images on a sheet.
 *
 * - nestingAgentFlow - The main flow that runs a competition between packing algorithms.
 * - NestingAgentInput - The input schema for the agent.
 * - NestingAgentOutput - The output schema for the agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  NestingAgentInputSchema,
  NestingAgentOutputSchema,
} from '@/app/schema';
import {
  executeNesting,
  VIRTUAL_SHEET_HEIGHT,
} from '@/lib/nesting-algorithm';

export type NestingAgentInput = z.infer<typeof NestingAgentInputSchema>;
export type NestingAgentOutput = z.infer<typeof NestingAgentOutputSchema>;

// This is the primary function that the client will call.
export async function runNestingAgent(
  input: NestingAgentInput
): Promise<NestingAgentOutput> {
  return nestingAgentFlow(input);
}

const nestingAgentFlow = ai.defineFlow(
  {
    name: 'nestingAgentFlow',
    inputSchema: NestingAgentInputSchema,
    outputSchema: NestingAgentOutputSchema,
  },
  async (input) => {
    // The agent runs a competition between multiple packing strategies
    // and returns the most efficient result. This is how it "trains" itself
    // on each request to find the optimal layout.
    const packingStrategies: ('BestShortSideFit' | 'BestLongSideFit' | 'BestAreaFit')[] = [
      'BestShortSideFit',
      'BestLongSideFit',
      'BestAreaFit',
    ];

    let bestResult: NestingAgentOutput | null = null;

    packingStrategies.forEach((strategy) => {
      const result = executeNesting(
        input.images,
        input.sheetWidth,
        VIRTUAL_SHEET_HEIGHT,
        strategy
      );
      if (!bestResult || result.areaUtilizationPct > bestResult.areaUtilizationPct) {
        bestResult = {
          placedItems: result.placedItems,
          sheetLength: result.sheetLength,
          areaUtilizationPct: result.areaUtilizationPct,
          strategy: strategy,
        };
      }
    });

    if (!bestResult) {
      throw new Error('Nesting agent failed to produce a valid layout.');
    }

    return bestResult;
  }
);

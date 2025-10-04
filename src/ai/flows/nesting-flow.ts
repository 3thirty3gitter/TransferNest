
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
      (i) => i.width > input.sheetWidth
    );
    if (oversized.length > 0) {
      throw new Error(
        'Some images are too large for the sheet. Offending images: ' +
          oversized.map((i) => `${i.id || i.url} (${i.width}x${i.height})`).join(', ')
      );
    }
    
    // 2. Execute the Nesting Algorithm
    const result = executeNesting(
      input.images,
      input.sheetWidth,
      VIRTUAL_SHEET_HEIGHT
    );

    // 3. Handle No-Result Scenario
    if (result.placedItems.length === 0) {
      throw new Error('Nesting failed to produce any layout. Check image dimensions.');
    }
    
    // 4. Construct Output with Diagnostics
    const output: NestingAgentOutput = {
      placedItems: result.placedItems,
      sheetLength: result.sheetLength,
      areaUtilizationPct: result.areaUtilizationPct,
      strategy: result.sortStrategy || 'AREA_DESC', // Default strategy
      totalCount: result.totalCount,
      failedCount: result.failedCount,
    };

    if (result.failedCount > 0) {
      output.warning = `${result.failedCount} out of ${result.totalCount} image(s) could not be placed. Try reducing quantities or dimensions.`;
    }

    return output;
  }
);

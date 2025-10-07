
'use server';
/**
 * @fileOverview This file contains the server actions that act as a bridge
 * between client components and server-side logic.
 */

import type { CartFlowInput, CartFlowOutput, CartItem, NestingAgentInput, NestingAgentOutput } from '@/app/schema';
import {
  executeNesting,
  VIRTUAL_SHEET_HEIGHT,
  type SortStrategy,
  type PackingMethod,
  type NestingResult,
} from '@/lib/nesting-algorithm';


// --- Cart Actions ---
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

async function invokeFlow<Input, Output>(flowId: string, input: Input): Promise<Output> {
  const url = `${BASE_URL}/api/genkit/flows/${flowId}`;
  
  const body = {
    input: input
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error invoking flow ${flowId}: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Failed to invoke flow. Status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // The flow output is nested under the 'output' key
    return result.output || result;

  } catch (error) {
    console.error(`An exception occurred while invoking flow ${flowId}:`, error);
    throw new Error(`Failed to execute the action. Please try again.`);
  }
}

export async function saveToCartAction(
  input: CartFlowInput
): Promise<CartFlowOutput> {
  return await invokeFlow('saveToCartFlow', input);
}

export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
    if (!userId) return [];
    // The input to the flow is an object { userId: ... }
    return await invokeFlow('getCartItemsFlow', { userId });
}

export async function removeCartItemAction(
  docId: string
): Promise<{ success: boolean; error?: string }> {
  // The input to the flow is an object { docId: ... }
  return await invokeFlow('removeCartItemFlow', { docId });
}


// --- Nesting Action ---

export async function runNestingAgentAction(
  input: NestingAgentInput
): Promise<NestingAgentOutput> {
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
  
  // 2. Define Strategies and Methods for Exhaustive Competition
  const sortStrategies: SortStrategy[] = ['AREA_DESC', 'HEIGHT_DESC', 'WIDTH_DESC', 'PERIMETER_DESC'];
  const packingMethods: PackingMethod[] = ['BestShortSideFit', 'BestLongSideFit', 'BestAreaFit', 'BottomLeft'];

  let bestResult: NestingResult | null = null;
  
  // 3. Run Exhaustive Competition across all combinations
  for (const strategy of sortStrategies) {
    for (const method of packingMethods) {
      const result = executeNesting(
          input.images,
          input.sheetWidth,
          VIRTUAL_SHEET_HEIGHT,
          strategy,
          method
      );
      
      // "Better" means higher utilization or, if equal, shorter length.
      if (!bestResult || 
          result.areaUtilizationPct > bestResult.areaUtilizationPct ||
          (result.areaUtilizationPct === bestResult.areaUtilizationPct && result.sheetLength < bestResult.sheetLength)) {
          bestResult = result;
      }
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
    strategy: `${bestResult.sortStrategy} / ${bestResult.packingMethod}`,
    totalCount: bestResult.totalCount,
    failedCount: bestResult.failedCount,
  };

  if (bestResult.failedCount > 0) {
    output.warning = `${bestResult.failedCount} out of ${bestResult.totalCount} image(s) could not be placed. Try reducing quantities or using a wider sheet.`;
  }
  
  return output;
}

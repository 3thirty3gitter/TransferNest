
'use server';
/**
 * @fileOverview This file contains the server actions that act as a bridge
 * between client components and the server-side Genkit flows.
 * Client components should ONLY import actions from this file, never directly
 * from the flows.
 */

import { saveToCartFlow, getCartItemsFlow, removeCartItemFlow } from '@/ai/flows/cart-flow';
import { runNestingAgentFlow } from '@/ai/flows/nesting-flow';
import type { CartItem, NestingAgentInput, NestingAgentOutput } from '@/app/schema';

export async function saveToCartAction(
  item: Omit<CartItem, 'id' | 'createdAt'>
): Promise<{ success: boolean; docId?: string; error?: string }> {
  return await saveToCartFlow({ item });
}

export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
    // This check is to prevent the flow from running during build time or in contexts
    // where the Firebase Admin SDK might not be initialized, causing the 'INTERNAL' error.
    if (!userId) return [];
    return await getCartItemsFlow(userId);
}

export async function removeCartItemAction(
  docId: string
): Promise<{ success: boolean; error?: string }> {
  return await removeCartItemFlow(docId);
}

export async function runNestingAgentAction(
  input: NestingAgentInput
): Promise<NestingAgentOutput> {
  return await runNestingAgentFlow(input);
}

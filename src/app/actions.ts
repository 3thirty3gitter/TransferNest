'use server';
/**
 * @fileOverview This file contains the server actions that act as a bridge
 * between client components and the server-side Genkit flows.
 */

import type { CartItem, NestingAgentInput, NestingAgentOutput } from '@/app/schema';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

async function invokeFlow<Input, Output>(flowId: string, input: Input): Promise<Output> {
  const url = `${BASE_URL}/api/${flowId}`;
  
  // Genkit's appRoute expects the data as a direct property, not wrapped
  const body = {
    data: input
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
    
    // Extract the result from Genkit's response format
    return result.result || result;

  } catch (error) {
    console.error(`An exception occurred while invoking flow ${flowId}:`, error);
    throw new Error(`Failed to execute the action. Please try again.`);
  }
}

export async function saveToCartAction(
  item: Omit<CartItem, 'id' | 'createdAt'>
): Promise<{ success: boolean; docId?: string; error?: string }> {
  return await invokeFlow('saveToCartFlow', { item });
}

export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
    if (!userId) return [];
    return await invokeFlow('getCartItemsFlow', { userId });
}

export async function removeCartItemAction(
  docId: string
): Promise<{ success: boolean; error?: string }> {
  return await invokeFlow('removeCartItemFlow', { docId });
}

export async function runNestingAgentAction(
  input: NestingAgentInput
): Promise<NestingAgentOutput> {
  return await invokeFlow('runNestingAgentFlow', input);
}


'use server';
/**
 * @fileOverview This file contains the server actions that act as a bridge
 * between client components and the server-side Genkit flows.
 * Client components should ONLY import actions from this file.
 * These actions invoke the Genkit flows via an HTTP request, ensuring
 * that the firebase-admin SDK is completely isolated from the client bundle.
 */

import type { CartItem, NestingAgentInput, NestingAgentOutput } from '@/app/schema';

// This is the absolute URL of the deployed application.
// In a real production environment, this would come from an environment variable.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

async function invokeFlow<Input, Output>(flowId: string, input: Input): Promise<Output> {
  const url = `${BASE_URL}/api/genkit/flows/${flowId}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Handle both object and primitive inputs.
      // The Genkit API expects primitives directly, but objects wrapped in an 'input' key.
      body: typeof input === 'string' ? JSON.stringify(input) : JSON.stringify({ input }),
       // Important for server-to-server fetch in Next.js to avoid caching issues
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error invoking flow ${flowId}: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Failed to invoke flow. Status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // The flow output is nested under the 'output' key for object-based flows,
    // but might be at the top level for simpler ones. Default to the result itself.
    return result.output ?? result;

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
    return await invokeFlow('getCartItemsFlow', userId);
}

export async function removeCartItemAction(
  docId: string
): Promise<{ success: boolean; error?: string }> {
  return await invokeFlow('removeCartItemFlow', docId);
}

export async function runNestingAgentAction(
  input: NestingAgentInput
): Promise<NestingAgentOutput> {
  return await invokeFlow('runNestingAgentFlow', input);
}

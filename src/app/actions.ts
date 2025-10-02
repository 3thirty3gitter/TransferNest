
'use server';

import { getCartItems, removeCartItem } from '@/ai/flows/cart-flow';
import type { CartItem } from './schema';


/**
 * Retrieves all cart items for a given user by calling the Genkit flow.
 */
export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
  if (!userId) return [];
  // The Genkit flow returns data that is already serialized,
  // so we can safely cast it to the expected client-side type.
  return getCartItems(userId) as Promise<CartItem[]>;
}

/**
 * Removes an item from the cart by calling the Genkit flow.
 */
export async function removeCartItemAction(docId: string): Promise<{ success: boolean; error?: string }> {
  if (!docId) {
    return { success: false, error: 'Document ID is required.' };
  }
  return removeCartItem(docId);
}

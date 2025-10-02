
'use server';
/**
 * @fileOverview A Genkit flow for managing shopping cart items in Firestore.
 * This file contains server-side logic and should only export async functions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CartFlowInputSchema, CartFlowOutputSchema, CartItemSchema } from '@/app/schema';
import * as admin from 'firebase-admin';
import type { CartItem } from '@/app/schema';

// Initialize Firebase Admin SDK idempotently
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export type CartFlowInput = z.infer<typeof CartFlowInputSchema>;
export type CartFlowOutput = z.infer<typeof CartFlowOutputSchema>;

/**
 * Saves a new item to the user's cart.
 */
export async function saveToCartAction(
  item: Omit<CartItem, 'id' | 'createdAt'>
): Promise<{ success: boolean; docId?: string; error?: string; }> {
  if (!item) {
      return { success: false, error: 'Cart item is required.' };
  }
  return saveToCartFlow({ item });
}

/**
 * Retrieves all cart items for a given user.
 */
export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
  if (!userId) return [];
  // The Genkit flow returns data that is already serialized,
  // so we can safely cast it to the expected client-side type.
  return getCartItemsFlow(userId) as Promise<CartItem[]>;
}

/**
 * Removes a specific item from a user's cart.
 */
export async function removeCartItemAction(docId: string): Promise<{ success: boolean; error?: string }> {
  if (!docId) {
    return { success: false, error: 'Document ID is required.' };
  }
  return removeCartItemFlow(docId);
}


const saveToCartFlow = ai.defineFlow(
  {
    name: 'saveToCartFlow',
    inputSchema: CartFlowInputSchema,
    outputSchema: CartFlowOutputSchema,
  },
  async ({ item }) => {
    try {
      const cartCollectionRef = db.collection('cartItems');
      const docRef = await cartCollectionRef.add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, docId: docRef.id };
    } catch (error: any) {
      console.error('Error in saveToCartFlow:', error);
      return { success: false, error: 'Could not save item to cart.' };
    }
  }
);


const getCartItemsFlow = ai.defineFlow(
  {
    name: 'getCartItemsFlow',
    inputSchema: z.string(), // User ID
    outputSchema: z.array(z.any()), // Array of CartItem-like objects
  },
  async (userId) => {
    try {
      if (!userId) {
        console.warn('getCartItemsFlow called without a userId.');
        return [];
      }
      const cartCollectionRef = db.collection('cartItems');
      const q = cartCollectionRef.where('userId', '==', userId).orderBy('createdAt', 'desc');
      const querySnapshot = await q.get();

      return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              userId: data.userId,
              sheetWidth: data.sheetWidth,
              sheetLength: data.sheetLength,
              price: data.price,
              layout: data.layout,
              createdAt: data.createdAt.toDate().toISOString(),
          };
      });
    } catch (error) {
      console.error('Error in getCartItemsFlow:', error);
      return [];
    }
  }
);

const removeCartItemFlow = ai.defineFlow(
  {
    name: 'removeCartItemFlow',
    inputSchema: z.string(), // Document ID
    outputSchema: CartFlowOutputSchema,
  },
  async (docId) => {
     try {
        if (!docId) {
            return { success: false, error: 'Document ID is required.' };
        }
        const cartItemRef = db.collection('cartItems').doc(docId);
        await cartItemRef.delete();
        return { success: true };
    } catch (error: any) {
        console.error('Error in removeCartItemFlow:', error);
        return { success: false, error: 'Could not remove item from cart.' };
    }
  }
);

/**
 * @fileOverview A Genkit flow for managing shopping cart items in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CartFlowInputSchema, CartFlowOutputSchema } from '@/app/schema';
import { getFirestore } from '@/lib/firebase-admin';

const admin = require('firebase-admin');

export const saveToCartFlow = ai.defineFlow(
  {
    name: 'saveToCartFlow',
    inputSchema: CartFlowInputSchema,
    outputSchema: CartFlowOutputSchema,
  },
  async ({ item }) => {
    try {
      const db = getFirestore();
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

export const getCartItemsFlow = ai.defineFlow(
  {
    name: 'getCartItemsFlow',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.array(z.any()),
  },
  async ({ userId }) => {
    try {
      if (!userId) {
        console.warn('getCartItemsFlow called without a userId.');
        return [];
      }
      const db = getFirestore();
      const cartCollectionRef = db.collection('cartItems');
      const q = cartCollectionRef.where('userId', '==', userId).orderBy('createdAt', 'desc');
      const querySnapshot = await q.get();

      return querySnapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return {
              id: doc.id,
              userId: data.userId,
              sheetWidth: data.sheetWidth,
              sheetLength: data.sheetLength,
              price: data.price,
              layout: data.layout,
              createdAt: createdAt,
          };
      });
    } catch (error) {
      console.error('Error in getCartItemsFlow:', error);
      return [];
    }
  }
);

export const removeCartItemFlow = ai.defineFlow(
  {
    name: 'removeCartItemFlow',
    inputSchema: z.object({ docId: z.string() }),
    outputSchema: CartFlowOutputSchema,
  },
  async ({ docId }) => {
     try {
        if (!docId) {
            return { success: false, error: 'Document ID is required.' };
        }
        const db = getFirestore();
        const cartItemRef = db.collection('cartItems').doc(docId);
        await cartItemRef.delete();
        return { success: true };
    } catch (error: any) {
        console.error('Error in removeCartItemFlow:', error);
        return { success: false, error: 'Could not remove item from cart.' };
    }
  }
);

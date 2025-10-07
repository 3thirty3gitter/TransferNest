/**
 * @fileOverview A Genkit flow for managing shopping cart items in Firestore.
 */
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CartFlowInputSchema, CartFlowOutputSchema } from '@/app/schema';
import { getFirestore } from '@/lib/firebase-admin';
import { generateAndUploadPrintSheetFlow } from './print-sheet-flow';

const admin = require('firebase-admin');

export const saveToCartFlow = ai.defineFlow(
  {
    name: 'saveToCartFlow',
    inputSchema: CartFlowInputSchema,
    outputSchema: CartFlowOutputSchema,
  },
  async (cartInput) => {
    try {
      // Step 1: Generate the print sheet PNG and get its URL.
      const pngUrl = await generateAndUploadPrintSheetFlow(cartInput);

      // Step 2: Save the final cart item with the PNG URL to Firestore.
      const db = getFirestore();
      const cartCollectionRef = db.collection('cartItems');
      
      const docRef = await cartCollectionRef.add({
        userId: cartInput.userId,
        sheetWidth: cartInput.sheetWidth,
        sheetLength: cartInput.sheetLength,
        price: cartInput.price,
        pngUrl: pngUrl, // Use the generated URL
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, docId: docRef.id };
    } catch (error: any) {
      console.error('Error in saveToCartFlow:', error);
      return { success: false, error: 'Could not save item to cart.' };
    }
  }
);

// This schema matches the payload from getCartItemsAction: { userId: ... }
const GetCartItemsInputSchema = z.object({ userId: z.string() });

export const getCartItemsFlow = ai.defineFlow(
  {
    name: 'getCartItemsFlow',
    inputSchema: GetCartItemsInputSchema,
    outputSchema: z.array(z.any()), // Using z.any() as CartItemSchema is client-side
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
          // Ensure createdAt is always a string
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return {
              id: doc.id,
              userId: data.userId,
              sheetWidth: data.sheetWidth,
              sheetLength: data.sheetLength,
              price: data.price,
              pngUrl: data.pngUrl,
              createdAt: createdAt,
          };
      });
    } catch (error) {
      console.error('Error in getCartItemsFlow:', error);
      return [];
    }
  }
);

// This schema matches the payload from removeCartItemAction: { docId: ... }
const RemoveCartItemInputSchema = z.object({ docId: z.string() });

export const removeCartItemFlow = ai.defineFlow(
  {
    name: 'removeCartItemFlow',
    inputSchema: RemoveCartItemInputSchema,
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


'use server';

import { z } from 'zod';
import { type CartItem, CartItemSchema, NestedLayoutSchema } from '@/app/schema';
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/**
 * Adds a new item to the user's cart in Firestore using the Admin SDK.
 */
export async function saveToCart(
  cartItem: Omit<CartItem, 'id' | 'createdAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    // This schema defines what the client is expected to send.
    const clientDataSchema = CartItemSchema.omit({ id: true, createdAt: true });
    const validatedCartItem = clientDataSchema.parse(cartItem);

    const cartCollectionRef = db.collection('cartItems');
    await cartCollectionRef.add({
      ...validatedCartItem,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving to cart:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid cart item data.' };
    }
    return { success: false, error: 'Could not save item to cart.' };
  }
}

/**
 * Retrieves all cart items for a given user using the Admin SDK.
 */
export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
  try {
    if (!userId) {
      console.warn('getCartItemsAction called without a userId.');
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
            createdAt: data.createdAt.toDate().toISOString(), // Convert timestamp to string
        } as CartItem;
    });
  } catch (error) {
    console.error('Error in getCartItemsAction:', error);
    return [];
  }
}

/**
 * Removes an item from the cart using the Admin SDK.
 */
export async function removeCartItemAction(docId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!docId) {
      return { success: false, error: 'Document ID is required.' };
    }
    const cartItemRef = db.collection('cartItems').doc(docId);
    await cartItemRef.delete();
    return { success: true };
  } catch (error: any) {
    console.error('Error in removeCartItemAction:', error);
    return { success: false, error: 'Could not remove item from cart.' };
  }
}

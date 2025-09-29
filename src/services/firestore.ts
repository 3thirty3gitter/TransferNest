
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import type { CartItem } from '@/app/schema';

// Initialize Firebase Admin SDK if not already initialized
// This pattern ensures it's initialized only once.
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/**
 * Adds a new item to the user's cart in Firestore using the Admin SDK.
 * @param item - The cart item object, validated and without id/createdAt.
 */
export async function addCartItem(item: Omit<CartItem, 'id' | 'createdAt'>) {
  try {
    const cartCollectionRef = db.collection('cartItems');
    await cartCollectionRef.add({
      ...item,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Cart item added successfully via Admin SDK!');
  } catch (error) {
    console.error('Error adding document with Admin SDK: ', error);
    throw new Error('Could not add item to cart.');
  }
}

/**
 * Retrieves all cart items for a given user using the Admin SDK.
 * @param userId - The ID of the user whose cart items to fetch.
 * @returns An array of cart items.
 */
export async function getCartItems(userId: string): Promise<CartItem[]> {
    try {
        const cartCollectionRef = db.collection('cartItems');
        const q = cartCollectionRef.where('userId', '==', userId).orderBy('createdAt', 'desc');
        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as CartItem));
    } catch (error) {
        console.error('Error fetching cart items with Admin SDK: ', error);
        throw new Error('Could not fetch cart items.');
    }
}

/**
 * Removes an item from the cart using the Admin SDK.
 * @param docId - The document ID of the cart item to remove.
 */
export async function removeCartItem(docId: string): Promise<void> {
    try {
        const cartItemRef = db.collection('cartItems').doc(docId);
        await cartItemRef.delete();
        console.log('Cart item removed successfully via Admin SDK!');
    } catch (error) {
        console.error('Error removing document with Admin SDK: ', error);
        throw new Error('Could not remove item from cart.');
    }
}

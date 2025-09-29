
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { CartItem } from '@/app/schema';

/**
 * Adds a new item to the user's cart in Firestore.
 * @param item - The complete cart item object, validated against CartItemSchema.
 */
export async function addCartItem(item: CartItem) {
  try {
    const cartCollectionRef = collection(db, 'cartItems');
    await addDoc(cartCollectionRef, {
      ...item,
      createdAt: serverTimestamp(),
    });
    console.log('Cart item added successfully!');
  } catch (error) {
    console.error('Error adding document: ', error);
    throw new Error('Could not add item to cart.');
  }
}

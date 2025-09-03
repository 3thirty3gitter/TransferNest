
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { NestedLayout } from '@/app/schema';

// Define the structure of a cart item
interface CartItem {
  userId: string;
  sheetWidth: number;
  sheetLength: number;
  price: number;
  layout: NestedLayout;
  createdAt: any; // Using 'any' for serverTimestamp for simplicity
}

/**
 * Adds a new item to the user's cart in Firestore.
 * @param userId - The ID of the user.
 * @param item - The cart item details.
 */
export async function addCartItem(
  userId: string,
  item: {
    sheetWidth: number;
    sheetLength: number;
    price: number;
    layout: NestedLayout;
  }
) {
  try {
    const cartCollectionRef = collection(db, 'cartItems');
    await addDoc(cartCollectionRef, {
      userId,
      ...item,
      createdAt: serverTimestamp(),
    });
    console.log('Cart item added successfully!');
  } catch (error) {
    console.error('Error adding document: ', error);
    throw new Error('Could not add item to cart.');
  }
}

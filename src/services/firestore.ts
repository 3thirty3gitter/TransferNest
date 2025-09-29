
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import type { CartItem } from '@/app/schema';

/**
 * Adds a new item to the user's cart in Firestore.
 * @param item - The complete cart item object, validated against CartItemSchema.
 */
export async function addCartItem(item: Omit<CartItem, 'id'>) {
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

/**
 * Retrieves all cart items for a given user.
 * @param userId - The ID of the user whose cart items to fetch.
 * @returns An array of cart items.
 */
export async function getCartItems(userId: string): Promise<CartItem[]> {
    try {
        const cartCollectionRef = collection(db, 'cartItems');
        const q = query(cartCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as CartItem));
    } catch (error) {
        console.error('Error fetching cart items: ', error);
        throw new Error('Could not fetch cart items.');
    }
}

/**
 * Removes an item from the cart.
 * @param docId - The document ID of the cart item to remove.
 */
export async function removeCartItem(docId: string): Promise<void> {
    try {
        const cartItemRef = doc(db, 'cartItems', docId);
        await deleteDoc(cartItemRef);
        console.log('Cart item removed successfully!');
    } catch (error) {
        console.error('Error removing document: ', error);
        throw new Error('Could not remove item from cart.');
    }
}

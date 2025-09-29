
'use server';

import { z } from 'zod';
import { type CartItem, CartItemSchema } from '@/app/schema';
import { addCartItem, getCartItems, removeCartItem } from '@/services/firestore';

export async function saveToCart(
  cartItem: Omit<CartItem, 'id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the cart item against the schema before saving
    const validatedCartItem = CartItemSchema.omit({ id: true, createdAt: true }).parse(cartItem);

    if (!validatedCartItem.userId) {
      return { success: false, error: 'You must be logged in to add items to the cart.' };
    }
    
    await addCartItem(validatedCartItem);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving to cart:', error);
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid cart item data.' };
    }
    return { success: false, error: 'Could not save item to cart.' };
  }
}

export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
  try {
    if (!userId) {
      console.warn('getCartItemsAction called without a userId.');
      return [];
    }
    return await getCartItems(userId);
  } catch (error) {
    console.error('Error in getCartItemsAction:', error);
    return [];
  }
}

export async function removeCartItemAction(docId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!docId) {
      return { success: false, error: 'Document ID is required.' };
    }
    await removeCartItem(docId);
    return { success: true };
  } catch (error: any) {
    console.error('Error in removeCartItemAction:', error);
    return { success: false, error: 'Could not remove item from cart.' };
  }
}


'use server';

import { z } from 'zod';
import { type CartItem, CartItemSchema } from '@/app/schema';
import { addCartItem } from '@/services/firestore';

export async function saveToCart(
  cartItem: CartItem
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the cart item against the schema before saving
    const validatedCartItem = CartItemSchema.parse(cartItem);

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

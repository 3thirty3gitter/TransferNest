
'use server';

import { NestedLayoutSchema, type NestedLayout } from '@/app/schema';
import { addCartItem } from '@/services/firestore';
import { auth } from '@/lib/firebase';

export async function saveToCart(cartItem: {
  userId: string;
  sheetWidth: number;
  sheetLength: number;
  price: number;
  layout: NestedLayout;
}): Promise<{ success: boolean; error?: string }> {
  if (!cartItem.userId) {
    return { success: false, error: 'You must be logged in to add items to the cart.' };
  }

  try {
    await addCartItem(cartItem.userId, {
      sheetWidth: cartItem.sheetWidth,
      sheetLength: cartItem.sheetLength,
      price: cartItem.price,
      layout: cartItem.layout,
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving to cart:', error);
    return { success: false, error: 'Could not save item to cart.' };
  }
}

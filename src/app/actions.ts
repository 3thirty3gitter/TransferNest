
'use server';

import { NestedLayoutSchema, type NestedLayout } from '@/app/schema';
import { addCartItem } from '@/services/firestore';
import { auth } from '@/lib/firebase';

export async function saveToCart(cartItem: {
  sheetWidth: number;
  sheetLength: number;
  price: number;
  layout: NestedLayout;
}): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'You must be logged in to add items to the cart.' };
  }

  try {
    await addCartItem(user.uid, cartItem);
    return { success: true };
  } catch (error) {
    console.error('Error saving to cart:', error);
    return { success: false, error: 'Could not save item to cart.' };
  }
}

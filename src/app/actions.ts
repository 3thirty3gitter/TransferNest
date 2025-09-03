
'use server';

import { intelligentImageNesting, IntelligentImageNestingOutput } from '@/ai/flows/intelligent-image-nesting';
import { NestedLayoutSchema, type NestedLayout } from '@/app/schema';
import { addCartItem } from '@/services/firestore';
import { auth } from '@/lib/firebase';


export async function getNestedLayout(
  imageUrls: string[],
  sheetWidth: 13 | 17
): Promise<{ layout: NestedLayout; length: number; error?: string }> {
  if (imageUrls.length === 0) {
    return { layout: [], length: 0, error: "Please upload at least one image before arranging the sheet." };
  }

  try {
    const result: IntelligentImageNestingOutput = await intelligentImageNesting({
      imageUrls,
      sheetWidthInches: sheetWidth,
    });

    const parsedLayout = NestedLayoutSchema.safeParse(JSON.parse(result.nestedLayout));

    if (!parsedLayout.success) {
      console.error("Failed to parse nested layout from AI:", parsedLayout.error);
      return { layout: [], length: 0, error: "Failed to generate a valid layout. The AI returned an unexpected format." };
    }

    return {
      layout: parsedLayout.data,
      length: result.sheetLengthInches,
    };
  } catch (e) {
    console.error("Error in getNestedLayout action:", e);
    // This could be a JSON parsing error or a network error from the AI call
    return { layout: [], length: 0, error: "An unexpected error occurred while arranging images. Please try again." };
  }
}

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

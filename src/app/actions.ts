
'use server';

import { intelligentImageNesting, IntelligentImageNestingOutput } from '@/ai/flows/intelligent-image-nesting';
import { NestedLayoutSchema, type NestedLayout } from '@/app/schema';
import { addCartItem } from '@/services/firestore';
import { auth } from '@/lib/firebase';
import { ManagedImage } from '@/components/nesting-tool';


export async function getNestedLayout(
  images: Omit<ManagedImage, 'id' | 'aspectRatio' | 'dataAiHint'>[],
  sheetWidth: 13 | 17
): Promise<{ layout: NestedLayout; length: number; error?: string }> {
  if (images.length === 0) {
    return { layout: [], length: 0, error: "Please add at least one image before arranging the sheet." };
  }

  try {
    const result: IntelligentImageNestingOutput | null = await intelligentImageNesting({
      images,
      sheetWidthInches: sheetWidth,
    });

    // Immediately validate the entire structure from the AI
    if (!result || !result.nestedLayout || !result.sheetLengthInches) {
        console.error("AI did not return a valid or complete layout object.", result);
        return { layout: [], length: 0, error: "The AI failed to generate a layout. Please try again." };
    }

    // Use Zod to parse the layout safely
    const parsedLayout = NestedLayoutSchema.safeParse(result.nestedLayout);

    if (!parsedLayout.success) {
      console.error("Failed to parse nested layout from AI:", parsedLayout.error.toString());
      return { layout: [], length: 0, error: "Failed to generate a valid layout. The AI returned an unexpected format." };
    }

    // If parsing is successful, return the data
    return {
      layout: parsedLayout.data,
      length: result.sheetLengthInches,
    };
  } catch (e: any) {
    console.error("Error in getNestedLayout action:", e);
    // This will catch network errors or other exceptions from the AI call
    return { layout: [], length: 0, error: e.message || "An unexpected error occurred while arranging images. Please try again." };
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

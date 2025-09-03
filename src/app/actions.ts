
'use server';

import { intelligentImageNesting, IntelligentImageNestingOutput } from '@/ai/flows/intelligent-image-nesting';
import { NestedLayoutSchema, type NestedLayout } from '@/app/schema';

export async function getNestedLayout(
  imageUrls: string[],
  sheetWidth: 13 | 17
): Promise<{ layout: NestedLayout; length: number; error?: string }> {
  if (imageUrls.length === 0) {
    return { layout: [], length: 0, error: "Please upload at least one image." };
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

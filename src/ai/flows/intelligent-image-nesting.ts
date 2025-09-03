'use server';

/**
 * @fileOverview A flow that intelligently nests images onto a sheet of a specified width.
 *
 * - intelligentImageNesting - A function that handles the image nesting process.
 * - IntelligentImageNestingInput - The input type for the intelligentImageNesting function.
 * - IntelligentImageNestingOutput - The return type for the intelligentImageNesting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageDetailsSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
});

const IntelligentImageNestingInputSchema = z.object({
  images: z
    .array(ImageDetailsSchema)
    .describe("An array of image objects to nest onto the sheet, including their dimensions."),
  sheetWidthInches: z
    .number()
    .describe("The width of the sheet in inches (either 13 or 17).")
    .refine(width => width === 13 || width === 17, {
      message: "Sheet width must be either 13 or 17 inches.",
    }),
});

export type IntelligentImageNestingInput = z.infer<
  typeof IntelligentImageNestingInputSchema
>;

const IntelligentImageNestingOutputSchema = z.object({
  nestedLayout: z
    .string()
    .describe("A JSON string representing the nested image layout."),
  sheetLengthInches: z
    .number()
    .describe("The length of the sheet in inches after nesting."),
});

export type IntelligentImageNestingOutput = z.infer<
  typeof IntelligentImageNestingOutputSchema
>;

export async function intelligentImageNesting(
  input: IntelligentImageNestingInput
): Promise<IntelligentImageNestingOutput> {
  return intelligentImageNestingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentImageNestingPrompt',
  input: {schema: IntelligentImageNestingInputSchema},
  output: {schema: IntelligentImageNestingOutputSchema},
  prompt: `You are an expert in image nesting for DTF transfers. Your goal is to efficiently arrange a set of images onto a sheet of a specified width, minimizing wasted space.

  You will receive an array of image objects, each with a URL and its dimensions in inches, and the desired sheet width (either 13 or 17 inches). Your task is to determine the optimal layout for these images on the sheet and the resulting sheet length.

  Respond with a JSON object that includes the following fields:

  - nestedLayout: A JSON string representing the nested image layout. This layout should specify the position (x, y coordinates) and dimensions (width, height) of each image on the sheet. The units for position and dimensions should be in inches. The layout must not alter the original dimensions of the images.
  - sheetLengthInches: The total length of the sheet in inches required to accommodate all the nested images.

  Input Images (with dimensions): {{{json images}}}
  Sheet Width: {{{sheetWidthInches}}} inches`,
});

const intelligentImageNestingFlow = ai.defineFlow(
  {
    name: 'intelligentImageNestingFlow',
    inputSchema: IntelligentImageNestingInputSchema,
    outputSchema: IntelligentImageNestingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

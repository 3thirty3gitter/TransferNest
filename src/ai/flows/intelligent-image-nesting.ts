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
  url: z.string().describe("URL of the image."),
  width: z.number().describe("Width of the image in inches."),
  height: z.number().describe("Height of the image in inches."),
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

const NestedImagePositionSchema = z.object({
    url: z.string().describe("The URL of the placed image."),
    x: z.number().describe("The x-coordinate of the top-left corner of the image in inches."),
    y: z.number().describe("The y-coordinate of the top-left corner of the image in inches."),
    width: z.number().describe("The original width of the image in inches."),
    height: z.number().describe("The original height of the image in inches."),
});

const IntelligentImageNestingOutputSchema = z.object({
  nestedLayout: z
    .array(NestedImagePositionSchema)
    .describe("An array of objects representing the nested image layout."),
  sheetLengthInches: z
    .number()
    .describe("The total length of the sheet in inches required to accommodate all the nested images."),
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
  prompt: `You are an expert in image nesting for DTF transfers. Your goal is to efficiently arrange a given set of images onto a sheet of a specified width, minimizing wasted space.

You will receive an array of image objects, each with a URL and its dimensions in inches, and the desired sheet width (either 13 or 17 inches).

Your task is to determine the optimal layout for these images on the sheet. Images can be rotated 90 degrees if it improves packing efficiency. The original dimensions of the images must be preserved.

Respond with an object that includes the following fields:

- nestedLayout: An array of objects, where each object represents a placed image and includes its 'url', original 'width' and 'height', and its final 'x' and 'y' coordinates on the sheet. The top-left corner of the sheet is (0, 0).
- sheetLengthInches: The total length of the sheet in inches required to accommodate all the nested images. This should be the highest y-coordinate plus the height of the image at that coordinate.

Input Images (with dimensions):
{{{json images}}}

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

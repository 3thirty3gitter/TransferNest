// Vercel-compatible print sheet flow (no server-side canvas)

import { z } from "zod";
import { defineFlow } from "genkit";

export const printSheetFlow = defineFlow(
  {
    name: 'printSheetFlow',
    inputSchema: z.object({
      images: z.array(z.object({
        id: z.string(),
        url: z.string(),
        width: z.number(),
        height: z.number(),
        copies: z.number()
      })),
      sheetWidth: z.number()
    }),
    outputSchema: z.object({
      success: z.boolean(),
      sheetUrl: z.string().optional(),
      error: z.string().optional()
    })
  },
  async (input) => {
    try {
      // Return success - actual sheet generation happens client-side
      return {
        success: true,
        sheetUrl: '/api/generate-sheet', // Will be handled by API route
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);


import { z } from 'zod';

export const NestedImageSchema = z.object({
  id: z.string().optional(), // ID might not be returned, but URL should be
  url: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotated: z.boolean().optional(),
});

export const NestedLayoutSchema = z.array(NestedImageSchema);
export type NestedLayout = z.infer<typeof NestedLayoutSchema>;

export const CartItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sheetWidth: z.number(),
  sheetLength: z.number(),
  price: z.number(),
  pngUrl: z.string(),
  createdAt: z.string(), // ISO string date
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartFlowInputSchema = z.object({
  userId: z.string(),
  sheetWidth: z.number(),
  sheetLength: z.number(),
  price: z.number(),
  layout: NestedLayoutSchema,
});
export type CartFlowInput = z.infer<typeof CartFlowInputSchema>;

export const CartFlowOutputSchema = z.object({
  success: z.boolean(),
  docId: z.string().optional(),
  error: z.string().optional(),
});
export type CartFlowOutput = z.infer<typeof CartFlowOutputSchema>;

export const ImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  dataAiHint: z.string(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  copies: z.number(),
});

export const NestingAgentInputSchema = z.object({
  images: z.array(ImageSchema),
  sheetWidth: z.number(),
});
export type NestingAgentInput = z.infer<typeof NestingAgentInputSchema>;

export const NestingAgentOutputSchema = z.object({
  placedItems: NestedLayoutSchema,
  sheetLength: z.number(),
  areaUtilizationPct: z.number(),
  strategy: z.string().optional(),
  // Add optional fields for diagnostics to prevent schema errors on partial layouts
  warning: z.string().optional(),
  totalCount: z.number().optional(),
  failedCount: z.number().optional(),
});
export type NestingAgentOutput = z.infer<typeof NestingAgentOutputSchema>;

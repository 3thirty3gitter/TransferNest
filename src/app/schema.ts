
import { z } from 'zod';

const NestedImageSchema = z.object({
  id: z.string().optional(), // ID might not be returned, but URL should be
  url: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const NestedLayoutSchema = z.array(NestedImageSchema);

export type NestedLayout = z.infer<typeof NestedLayoutSchema>;

export const CartItemSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  sheetWidth: z.number(),
  sheetLength: z.number(),
  price: z.number(),
  layout: NestedLayoutSchema,
  createdAt: z.any().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

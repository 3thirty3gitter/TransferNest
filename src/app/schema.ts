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

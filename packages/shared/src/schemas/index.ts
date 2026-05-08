import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  size: z.string().optional(),
  sizeMl: z.number().int().positive().optional(),
  concentration: z.string().optional(),
  gender: z.enum(['HOMBRE', 'MUJER', 'UNISEX']).optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0),
  salePrice: z.number().min(0),
  minStock: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

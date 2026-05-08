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

export const createClientSchema = z.object({
  name: z.string().min(1),
  ci: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const initialPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1),
});

export const createSaleSchema = z.object({
  clientId: z.string().uuid(),
  productId: z.string().uuid(),
  total: z.number().positive(),
  date: z.string().datetime(),
  notes: z.string().optional(),
  initialPayment: initialPaymentSchema.optional(),
});

export const updateSaleSchema = createSaleSchema.partial().omit({ clientId: true, productId: true });

export const createPaymentSchema = z.object({
  saleId: z.string().uuid(),
  clientId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  date: z.string().datetime(),
  notes: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

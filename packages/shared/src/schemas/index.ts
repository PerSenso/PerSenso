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

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const restockLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  baseUnitCost: z.number().min(0),
});

export const fundingEntrySchema = z.object({
  investor: z.string().min(1),
  method: z.string().min(1),
  amount: z.number().positive(),
});

export const createOrderSchema = z.object({
  date: z.string().datetime(),
  supplierId: z.string().uuid().optional(),
  shippingCost: z.number().min(0).optional(),
  marketingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  restocks: z.array(restockLineSchema).min(1),
  fundingEntries: z.array(fundingEntrySchema).optional(),
});

export const updateOrderSchema = z.object({
  date: z.string().datetime().optional(),
  supplierId: z.string().uuid().optional(),
  shippingCost: z.number().min(0).optional(),
  marketingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const createMovementSchema = z.object({
  type: z.enum(['ingreso', 'retiro']),
  source: z.string().min(1),
  method: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime(),
  notes: z.string().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type CreateMovementInput = z.infer<typeof createMovementSchema>;

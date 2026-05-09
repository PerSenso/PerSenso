export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';
export type Gender = 'HOMBRE' | 'MUJER' | 'UNISEX';

export interface Client {
  id: string;
  name: string;
  ci?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  clientId: string;
  productId: string;
  restockSourceId?: string;
  total: number;
  unitCostAtSale?: number;
  profitAtSale?: number;
  marginPctAtSale?: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleAdmin extends Sale {
  unitCostAtSale: number;
  profitAtSale: number;
  marginPctAtSale?: number;
}

export interface Payment {
  id: string;
  saleId: string;
  clientId: string;
  amount: number;
  paymentMethod: string;
  isInitial: boolean;
  receiptUrl?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  size?: string;
  sizeMl?: number;
  concentration?: string;
  gender: Gender;
  description?: string;
  imageUrl?: string;
  salePrice: number;
  minStock: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAdmin extends Product {
  costPrice: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestockLine {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  baseUnitCost: number;
  createdAt: string;
}

export interface FundingEntry {
  id: string;
  orderId: string;
  investor: string;
  method: string;
  amount: number;
}

export interface Order {
  id: string;
  date: string;
  supplierId?: string;
  shippingCost: number;
  marketingCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  restocks?: RestockLine[];
  fundingEntries?: FundingEntry[];
}

export interface CashMovement {
  id: string;
  type: string;
  source: string;
  method: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface LedgerSummary {
  totalIn: number;
  totalOut: number;
  balance: number;
  paymentsByMethod: { method: string; total: number; count: number }[];
  movements: CashMovement[];
}

export interface SalesByMonth {
  month: string;
  sales_count: number;
  revenue: number;
  profit: number;
}

export interface TopProduct {
  name: string;
  sales_count: number;
  revenue: number;
  avg_margin: number;
}

export interface ReportsSummary {
  salesByMonth: SalesByMonth[];
  topProducts: TopProduct[];
  totalDebt: number;
  marginByProduct: { name: string; avg_margin_pct: number }[];
}

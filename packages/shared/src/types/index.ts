export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';
export type SaleStatus = 'ACTIVA' | 'ANULADA';
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

export interface ClientWithDebt extends Client {
  debt: number;
}

export interface SaleWithDebt {
  id: string;
  date: string;
  total: number;
  paid: number;
  pending: number;
  notes?: string;
  client: { id: string; name: string };
  product: { id: string; name: string };
  payments: Payment[];
}

export interface Sale {
  id: string;
  clientId: string;
  productId: string;
  restockSourceId?: string;
  status: SaleStatus;
  total: number;
  unitCostAtSale?: number;
  profitAtSale?: number;
  marginPctAtSale?: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  product?: Product;
  payments?: Payment[];
  restockSource?: RestockLine & { order?: Order };
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
  stock?: number;
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
  email?: string;
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
  product?: Product;
  order?: Order;
  sales?: Sale[];
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
  supplier?: Supplier;
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
  owner?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface FundingContribution {
  investor: string;
  totalContributed: number;
  ordersCount: number;
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

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardDebt {
  id: string;
  clientName: string;
  productName: string;
  date: string;
  total: number;
  paid: number;
  pending: number;
  payments: Payment[];
}

export interface DashboardSalesStatus {
  paid: { count: number; total: number };
  partial: { count: number; total: number };
  pending: { count: number; total: number };
}

export interface DashboardTopClient {
  clientId: string;
  name: string;
  totalPaid: number;
  salesCount: number;
}

// ── Inventario: multi-proveedor ──────────────────────────────────────────────

export interface SupplierStockEntry {
  supplierId: string | null;
  supplierName: string;
  quantity: number;
  baseUnitCost: number;
  orderId: string;
  date: string;
}

// ── Proveedores: KPIs ─────────────────────────────────────────────────────────

export interface OrderKpis {
  totalOrders: number;
  totalUnits: number;
  totalInvested: number;
}

// ── Trazabilidad ─────────────────────────────────────────────────────────────

export interface ClientWithSales extends Client {
  sales: Sale[];
}

export interface ProductWithRestocks extends ProductAdmin {
  restocks: (RestockLine & { sales?: Sale[] })[];
  sales?: Sale[];
}

export interface OrderWithRestockProducts extends Order {
  restocks: (RestockLine & {
    product?: Product;
    sales?: (Sale & { client?: Client; payments?: Payment[] })[];
  })[];
}

export interface RestockWithChain extends RestockLine {
  product?: Product;
  order?: Order;
  sales?: (Sale & { client?: Client; payments?: Payment[] })[];
}

export interface SupplierWithChain extends Supplier {
  orders: (Order & {
    fundingEntries?: FundingEntry[];
    restocks: (RestockLine & {
      product?: Product;
      sales?: (Sale & { client?: Client; payments?: Payment[] })[];
    })[];
  })[];
}

export type TraceResult =
  | { type: 'sale';     data: Sale }
  | { type: 'client';   data: ClientWithSales }
  | { type: 'product';  data: ProductWithRestocks }
  | { type: 'order';    data: OrderWithRestockProducts }
  | { type: 'restock';  data: RestockWithChain }
  | { type: 'supplier'; data: SupplierWithChain };

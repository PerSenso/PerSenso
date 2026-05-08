export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';
export type Gender = 'HOMBRE' | 'MUJER' | 'UNISEX';

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

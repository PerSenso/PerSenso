export interface StoreProduct {
  id: string;
  name: string;
  brand: string;
  salePrice: number;
  concentration: string;
  gender: string;
  sizeMl: number;
  imageUrl: string | null;
  notes: string | null;
  stock: number;
  published: boolean;
}

export interface StoreCartItem {
  product: StoreProduct;
  quantity: number;
}

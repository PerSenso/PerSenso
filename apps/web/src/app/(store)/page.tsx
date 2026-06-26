import HeroSection from "@/components/HeroSection";
import ProductCatalog from "@/components/ProductCatalog";
import type { StoreProduct } from "@/types/store";

export const revalidate = 60;

async function getProducts(): Promise<StoreProduct[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products?published=true`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((p: Record<string, unknown>) => ({
      ...p,
      salePrice: Number(p.salePrice ?? 0),
      stock: Number(p.stock ?? 0),
      sizeMl: Number(p.sizeMl ?? 100),
      description: (p.description as string) ?? null,
      accords: Array.isArray(p.accords) ? p.accords : [],
    }));
  } catch {
    return [];
  }
}

export default async function StorePage() {
  const products = await getProducts();

  return (
    <main>
      <HeroSection />
      <ProductCatalog products={products} />
    </main>
  );
}

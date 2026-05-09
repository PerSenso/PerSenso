import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { StoreProduct } from "@/types/store";

type Props = { params: Promise<{ id: string }> };

async function getProduct(id: string): Promise<StoreProduct | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);
    if (!res.ok) return null;
    const p = await res.json();
    return {
      ...p,
      salePrice: Number(p.salePrice ?? 0),
      stock: Number(p.stock ?? 0),
      sizeMl: Number(p.sizeMl ?? 100),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Producto no encontrado — Persenso" };

  return {
    title: `${product.name} — Persenso`,
    description: product.notes ?? `${product.brand} ${product.concentration} ${product.sizeMl}ml`,
    openGraph: {
      title: product.name,
      description: product.notes ?? "",
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--ps-bg)" }}>
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="font-display text-2xl mb-2" style={{ color: "var(--ps-text)" }}>Producto no encontrado</h1>
          <Link href="/" className="text-sm hover:opacity-80 transition-opacity" style={{ color: "var(--ps-gold)" }}>
            ← Volver al catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4" style={{ background: "var(--ps-bg)" }}>
      <div className="container mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 hover:opacity-80 transition-opacity" style={{ color: "var(--ps-text-muted)" }}>
          ← Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image */}
          <div
            className="aspect-[3/4] rounded-2xl overflow-hidden relative"
            style={{ background: "var(--ps-surface)" }}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-6xl font-semibold" style={{ color: "var(--ps-gold)" }}>P</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.3em] mb-2 font-medium" style={{ color: "var(--ps-gold)" }}>
              {product.brand}
            </p>
            <h1 className="font-display text-4xl font-semibold mb-4 leading-tight" style={{ color: "var(--ps-text)" }}>
              {product.name}
            </h1>

            <div className="flex gap-3 mb-6 flex-wrap">
              <span
                className="px-3 py-1 text-xs rounded-full"
                style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)", color: "var(--ps-text-muted)" }}
              >
                {product.sizeMl} ml
              </span>
              <span
                className="px-3 py-1 text-xs rounded-full"
                style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)", color: "var(--ps-text-muted)" }}
              >
                {product.concentration}
              </span>
              <span
                className="px-3 py-1 text-xs rounded-full"
                style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)", color: "var(--ps-text-muted)" }}
              >
                {product.gender}
              </span>
            </div>

            <p className="font-display text-4xl font-bold mb-6" style={{ color: "var(--ps-gold)" }}>
              ${product.salePrice.toFixed(2)}
            </p>

            {product.notes && (
              <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--ps-text-muted)" }}>
                {product.notes}
              </p>
            )}

            <p className="text-xs mb-8" style={{ color: product.stock > 0 ? "var(--ps-green)" : "var(--ps-red)" }}>
              {product.stock > 0 ? `${product.stock} unidades disponibles` : "Agotado"}
            </p>

            <a
              href={`https://wa.me/584146033113?text=${encodeURIComponent(`Hola, me interesa el perfume ${product.name} — $${product.salePrice.toFixed(2)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 py-4 px-8 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, var(--ps-gold-dark), var(--ps-gold))",
                color: "#0d0d0f",
              }}
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

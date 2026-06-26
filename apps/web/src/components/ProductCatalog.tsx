"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "./ProductCard";
import ProductFiltersBar from "./ProductFiltersBar";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { useProductFilters } from "@/hooks/use-product-filters";
import type { StoreProduct } from "@/types/store";

interface ProductCatalogProps {
  products: StoreProduct[];
}

const ProductCatalog = ({ products }: ProductCatalogProps) => {
  const filters = useProductFilters(products);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  return (
    <section
      id="catalogo"
      className="relative py-24 px-4 overflow-hidden"
      style={{ background: "var(--ps-catalog-bg)" }}
    >
      <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: "linear-gradient(90deg, transparent, var(--ps-gold), transparent)", opacity: 0.2 }} />

      <div className="container mx-auto relative z-10">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mb-6 h-[1px] w-20"
            style={{ background: "linear-gradient(90deg, transparent, var(--ps-gold), transparent)" }}
          />
          <p className="text-[11px] uppercase tracking-[0.4em] font-medium mb-3" style={{ color: "var(--ps-gold)" }}>
            ✦ Nuestra Colección ✦
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-3" style={{ color: "var(--ps-text)" }}>
            Catálogo de Perfumes
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--ps-text-muted)" }}>
            Encuentra tu fragancia perfecta entre nuestra selección curada de perfumes exclusivos
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ProductFiltersBar {...filters} />
        </motion.div>

        {filters.filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p style={{ color: "var(--ps-text-muted)" }} className="text-base">
              No se encontraron perfumes{filters.searchQuery ? ` para "${filters.searchQuery}"` : ""}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs mb-6 font-medium"
              style={{ color: "var(--ps-text-muted)" }}
            >
              {filters.filtered.length} {filters.filtered.length === 1 ? "perfume" : "perfumes"} disponibles
            </motion.p>

            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filters.filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetail={() => setSelectedProduct(product)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      <ProductDetailSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
};

export default ProductCatalog;

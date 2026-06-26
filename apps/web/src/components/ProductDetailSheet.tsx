"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/components/providers/CartProvider";
import { toast } from "sonner";
import type { StoreProduct } from "@/types/store";

const GENDER_LABEL: Record<string, string> = {
  HOMBRE: "Hombre",
  MUJER: "Mujer",
  UNISEX: "Unisex",
};

interface Props {
  product: StoreProduct | null;
  onClose: () => void;
}

export function ProductDetailSheet({ product, onClose }: Props) {
  const { addToCart, items } = useCart();

  useEffect(() => {
    if (!product) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [product]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = () => {
    if (!product) return;
    const currentQty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
    if (currentQty >= product.stock) {
      toast.error(`No hay más unidades disponibles de ${product.name}`);
      return;
    }
    addToCart(product);
    toast.success(`${product.name} añadido al carrito`);
    onClose();
  };

  const accords = product?.accords ?? [];
  const sortedAccords = [...accords].sort((a, b) => b.intensity - a.intensity);

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 cursor-pointer"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto z-50 flex flex-col md:rounded-2xl overflow-hidden"
            style={{
              background: "var(--ps-card-bg)",
              border: "1px solid var(--ps-card-border)",
              boxShadow: "0 -8px 60px rgba(0,0,0,0.6)",
              maxHeight: "92dvh",
              maxWidth: "min(720px, 100vw)",
              borderRadius: "1.25rem 1.25rem 0 0",
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.08)", color: "var(--ps-text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              {/* Image */}
              <div
                className="relative w-full"
                style={{
                  height: "clamp(200px, 40vw, 320px)",
                  background: "var(--ps-surface)",
                  flexShrink: 0,
                }}
              >
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="720px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16" style={{ color: "var(--ps-gold)", opacity: 0.3 }} />
                  </div>
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                  style={{ background: "linear-gradient(to top, var(--ps-card-bg), transparent)" }}
                />
              </div>

              {/* Body */}
              <div className="px-6 pb-6 pt-2 space-y-5">
                {/* Name + price */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-2xl font-semibold leading-tight" style={{ color: "var(--ps-text)" }}>
                      {product.name}
                    </h2>
                    <span className="text-xl font-bold font-display whitespace-nowrap mt-0.5" style={{ color: "var(--ps-gold)" }}>
                      ${product.salePrice.toFixed(2)}
                    </span>
                  </div>
                  {product.brand && (
                    <p className="text-xs uppercase tracking-[0.15em] mt-1 font-medium" style={{ color: "var(--ps-text-muted)" }}>
                      {product.brand}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {product.concentration && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)", color: "var(--ps-text-muted)" }}>
                      {product.concentration}
                    </span>
                  )}
                  {product.sizeMl && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)", color: "var(--ps-text-muted)" }}>
                      {product.sizeMl} ml
                    </span>
                  )}
                  {product.gender && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)", color: "var(--ps-text-muted)" }}>
                      {GENDER_LABEL[product.gender] ?? product.gender}
                    </span>
                  )}
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: product.stock > 3 ? "rgba(76,175,125,0.12)" : product.stock > 0 ? "rgba(201,168,76,0.12)" : "rgba(224,92,92,0.12)",
                      border: `1px solid ${product.stock > 3 ? "rgba(76,175,125,0.3)" : product.stock > 0 ? "rgba(201,168,76,0.3)" : "rgba(224,92,92,0.3)"}`,
                      color: product.stock > 3 ? "var(--ps-green)" : product.stock > 0 ? "var(--ps-gold)" : "var(--ps-red)",
                    }}
                  >
                    {product.stock > 0 ? `${product.stock} en stock` : "Agotado"}
                  </span>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--ps-text-muted)" }}>
                      Descripción
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--ps-text-muted)" }}>
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Accord bars */}
                {sortedAccords.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--ps-text-muted)" }}>
                      Acordes olfativos
                    </p>
                    <div className="space-y-2">
                      {sortedAccords.map((a) => (
                        <div key={a.name} className="flex items-center gap-3">
                          <div
                            className="relative h-8 rounded-lg overflow-hidden flex-1"
                            style={{ background: "var(--ps-surface)" }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${a.intensity}%` }}
                              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                              className="h-full rounded-lg flex items-center px-3"
                              style={{ background: a.color, minWidth: 64 }}
                            >
                              <span className="text-xs font-medium text-white truncate">{a.name}</span>
                            </motion.div>
                          </div>
                          <span className="text-xs tabular-nums w-8 text-right flex-shrink-0" style={{ color: "var(--ps-text-muted)" }}>
                            {a.intensity}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--ps-border)", background: "var(--ps-card-bg)" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                disabled={product.stock <= 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: product.stock > 0 ? "linear-gradient(135deg, var(--ps-gold-dark), var(--ps-gold))" : "var(--ps-surface)",
                  color: product.stock > 0 ? "#0d0d0f" : "var(--ps-text-muted)",
                  border: product.stock > 0 ? "none" : "1px solid var(--ps-border)",
                }}
              >
                <Plus className="w-4 h-4" />
                {product.stock > 0 ? "Añadir al carrito" : "Agotado"}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

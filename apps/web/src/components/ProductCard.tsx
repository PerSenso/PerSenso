"use client";
import { Plus, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/components/providers/CartProvider";
import { toast } from "sonner";
import { getStockColorClass, getStockLabel } from "@/lib/stock-utils";
import { useState } from "react";
import { PerfumeSplash } from "./PerfumeSplash";
import Image from "next/image";
import type { StoreProduct } from "@/types/store";

interface ProductCardProps {
  product: StoreProduct;
  onOpenDetail: () => void;
}

const ProductCard = ({ product, onOpenDetail }: ProductCardProps) => {
  const { addToCart, items } = useCart();
  const [splash, setSplash] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleAdd = (e: React.MouseEvent) => {
    const cartItem = items.find((item) => item.product.id === product.id);
    const currentQty = cartItem?.quantity || 0;

    if (currentQty >= product.stock) {
      toast.error(`No hay más unidades disponibles de ${product.name}`);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setSplash({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, id: Date.now() });
    addToCart(product);
    toast.success(`${product.name} añadido al carrito`);
  };

  const isCritical = product.stock <= 1;
  const isWarning = product.stock >= 2 && product.stock <= 3;
  const isOutOfStock = product.stock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ opacity: { duration: 0.4 }, y: { duration: 0.4, ease: "easeOut" } }}
      whileHover={{ y: -6 }}
      className="group relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: "var(--ps-card-bg)",
        border: `1px solid ${isCritical ? "var(--ps-red)" : isWarning ? "var(--ps-gold)" : "var(--ps-card-border)"}`,
        boxShadow: "var(--ps-card-shadow)",
        opacity: isOutOfStock ? 0.6 : 1,
      }}
    >
      {/* Image — click opens detail */}
      <div
        className="aspect-square flex items-center justify-center overflow-hidden relative cursor-pointer"
        style={{ background: "var(--ps-surface)" }}
        onClick={onOpenDetail}
      >
        {(isCritical || isWarning) && product.stock > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white backdrop-blur-sm ${
              isCritical ? "bg-red-500/90" : "bg-yellow-500/90"
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> {getStockLabel(product.stock)}
          </motion.div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <span className="text-white/90 text-sm font-semibold uppercase tracking-wider px-4 py-2 rounded-full border border-white/20">
              Agotado
            </span>
          </div>
        )}

        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="text-center p-6">
            <div
              className="w-16 h-24 mx-auto mb-3 rounded-lg flex items-center justify-center"
              style={{ border: "1px solid var(--ps-border)", background: "var(--ps-surface-hover)" }}
            >
              <span className="text-3xl font-display font-semibold" style={{ color: "var(--ps-gold)" }}>P</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--ps-text-muted)" }}>
              {product.gender}
            </p>
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: `linear-gradient(to top, var(--ps-card-bg), transparent)` }}
        />
      </div>

      {/* Content */}
      <div className="p-5 relative">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-display text-lg font-semibold tracking-wide leading-tight"
            style={{ color: "var(--ps-card-text)" }}
          >
            {product.name}
          </h3>
          <span
            className="text-lg font-bold whitespace-nowrap font-display"
            style={{ color: "var(--ps-gold)" }}
          >
            ${product.salePrice.toFixed(2)}
          </span>
        </div>

        {product.brand && (
          <p className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: "var(--ps-text-muted)" }}>
            {product.brand}
          </p>
        )}

        <div className="flex items-center gap-2 text-[11px] mb-3 flex-wrap" style={{ color: "var(--ps-text-muted)" }}>
          <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)" }}>
            {product.sizeMl} ml
          </span>
          <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)" }}>
            {product.concentration}
          </span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${getStockColorClass(product.stock)}`} style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)" }}>
            {getStockLabel(product.stock)}
          </span>
        </div>

        {product.notes && (
          <p className="text-xs mb-4 line-clamp-2 leading-relaxed" style={{ color: "var(--ps-text-muted)" }}>
            {product.notes}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {splash && (
        <PerfumeSplash
          key={splash.id}
          startX={splash.x}
          startY={splash.y}
          onComplete={() => {
            setSplash(null);
            window.dispatchEvent(new Event("cart-pulse"));
          }}
        />
      )}
    </motion.div>
  );
};

export default ProductCard;

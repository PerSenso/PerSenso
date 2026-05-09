"use client";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import Image from "next/image";
import { buildWhatsAppMessage, openWhatsApp } from "@/lib/whatsapp";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;
    const message = buildWhatsAppMessage(items, totalPrice);
    openWhatsApp(message);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="font-display text-2xl">Tu Carrito</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
              <button
                onClick={() => onOpenChange(false)}
                className="inline-block px-6 py-2.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all text-sm uppercase tracking-wider"
              >
                Explorar perfumes
              </button>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="flex items-center gap-4 bg-card border border-border rounded-lg p-4"
                  >
                    <div className="w-16 h-20 bg-secondary rounded flex items-center justify-center shrink-0 relative overflow-hidden">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded"
                          sizes="64px"
                        />
                      ) : (
                        <span className="text-primary font-display text-lg">P</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ${item.product.salePrice.toFixed(2)} c/u
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 border border-border rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => {
                            if (item.quantity >= item.product.stock) {
                              toast.error(`No hay más unidades disponibles de ${item.product.name}`);
                              return;
                            }
                            updateQuantity(item.product.id, item.quantity + 1);
                          }}
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 border border-border rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.quantity} de {item.product.stock} disp.
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-primary font-semibold">
                        ${(item.product.salePrice * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="p-6 border-t border-border">
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-foreground">Total</span>
                  <span className="text-2xl font-display font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-green-600 hover:bg-green-700 text-white transition-colors text-sm uppercase tracking-wider rounded-lg font-semibold"
                >
                  <MessageCircle className="w-5 h-5" />
                  Finalizar pedido por WhatsApp
                </button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;

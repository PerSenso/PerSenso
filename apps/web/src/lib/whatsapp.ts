import type { StoreCartItem } from "@/types/store";

export const WHATSAPP_NUMBER = "584146033113";

export function buildWhatsAppMessage(items: StoreCartItem[], totalPrice: number): string {
  const lines = items.map(
    (item) =>
      `• ${item.product.name} x${item.quantity} — $${(item.product.salePrice * item.quantity).toFixed(2)}`
  );
  return `¡Hola! Me gustaría realizar el siguiente pedido en *Persenso*:\n\n${lines.join("\n")}\n\n*Total: $${totalPrice.toFixed(2)}*\n\nQuedo atento/a para finalizar la compra. ¡Gracias!`;
}

export function openWhatsApp(message: string): void {
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}

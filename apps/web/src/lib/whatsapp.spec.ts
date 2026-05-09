import { describe, it, expect, vi } from 'vitest';
import { buildWhatsAppMessage, openWhatsApp, WHATSAPP_NUMBER } from './whatsapp';
import type { StoreCartItem } from '../types/store';

function makeItem(name: string, salePrice: number, quantity: number): StoreCartItem {
  return {
    product: {
      id: '1',
      name,
      brand: 'Test Brand',
      salePrice,
      concentration: 'EDP',
      gender: 'UNISEX',
      sizeMl: 50,
      imageUrl: null,
      notes: null,
      stock: 5,
      published: true,
    },
    quantity,
  };
}

describe('buildWhatsAppMessage', () => {
  it('con 1 item genera el texto correcto', () => {
    const items = [makeItem('Chanel No 5', 100, 1)];
    const msg = buildWhatsAppMessage(items, 100);
    expect(msg).toContain('Chanel No 5 x1');
    expect(msg).toContain('$100.00');
    expect(msg).toContain('*Total: $100.00*');
    expect(msg).toContain('Persenso');
  });

  it('con múltiples items incluye todos en el mensaje', () => {
    const items = [makeItem('Chanel No 5', 100, 2), makeItem('Dior Sauvage', 80, 1)];
    const msg = buildWhatsAppMessage(items, 280);
    expect(msg).toContain('Chanel No 5 x2');
    expect(msg).toContain('$200.00');
    expect(msg).toContain('Dior Sauvage x1');
    expect(msg).toContain('$80.00');
    expect(msg).toContain('*Total: $280.00*');
  });
});

describe('openWhatsApp', () => {
  it('genera la URL codificada correctamente', () => {
    const openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);

    openWhatsApp('Hola mundo');

    expect(openSpy).toHaveBeenCalledWith(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola mundo')}`,
      '_blank',
    );

    vi.unstubAllGlobals();
  });
});

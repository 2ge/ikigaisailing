/**
 * Client-side cart (localStorage). The store keeps only sku + qty + display name
 * + display price; the *charged* amount is always re-derived server-side in
 * functions/api/checkout.ts from its own catalog, so a tampered price can never
 * be paid. `kind` distinguishes a main package from an add-on.
 */
export type CartItem = { sku: string; kind: 'package' | 'addon'; name: string; price: number; qty: number; unit?: 'night' };

const KEY = 'ikigai_cart_v1';

function read(): CartItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
}

export const cart = {
  items: read,
  count(): number {
    return read().reduce((n, i) => n + i.qty, 0);
  },
  total(): number {
    return read().reduce((n, i) => n + i.price * i.qty, 0);
  },
  add(item: Omit<CartItem, 'qty'>, qty = 1) {
    const items = read();
    const ex = items.find((i) => i.sku === item.sku);
    // a fixed package is single-booking (qty 1); add-ons stack; per-unit packages
    // (e.g. per-night) take a quantity, adjusted via the cart stepper.
    const fixed = item.kind === 'package' && !item.unit;
    if (ex) {
      if (fixed) ex.qty = 1;
      else if (item.kind === 'addon') ex.qty += qty;
    } else {
      items.push({ ...item, qty: fixed ? 1 : Math.max(1, qty) });
    }
    write(items);
  },
  setQty(sku: string, qty: number) {
    const items = read().map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, qty) } : i));
    write(items);
  },
  remove(sku: string) {
    write(read().filter((i) => i.sku !== sku));
  },
  clear() {
    write([]);
  },
  has(sku: string): boolean {
    return read().some((i) => i.sku === sku);
  },
};

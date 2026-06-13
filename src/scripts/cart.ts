/**
 * Client-side cart (localStorage). The store keeps only sku + qty + display name
 * + display price; the *charged* amount is always re-derived server-side in
 * functions/api/checkout.ts from its own catalog, so a tampered price can never
 * be paid. `kind` distinguishes a main package from an add-on.
 */
export type CartItem = { sku: string; kind: 'package' | 'addon'; name: string; price: number; qty: number };

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
    // a package is single-booking (qty stays 1); add-ons can stack
    if (ex) ex.qty = item.kind === 'package' ? 1 : ex.qty + qty;
    else items.push({ ...item, qty: item.kind === 'package' ? 1 : qty });
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

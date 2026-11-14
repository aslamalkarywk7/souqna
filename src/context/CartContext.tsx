import {createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {api} from '@/lib/api';
import type {CartPayload, Product} from '@/types';
import {useAuth} from './AuthContext';

/**
 * Cart state with a dual backend:
 * - Guests: lines live in localStorage (including a product snapshot for rendering).
 * - Signed-in users: lines live on the server; the guest cart is merged on login.
 */

export interface CartLine {
  product: Product;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addItem: (product: Product, qty?: number) => Promise<void>;
  setQty: (productId: number, qty: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const GUEST_KEY = 'souqna_cart_v1';

function loadGuest(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]') as CartLine[];
  } catch {
    return [];
  }
}

function saveGuest(lines: CartLine[]): void {
  localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
}

export function CartProvider({children}: {children: ReactNode}) {
  const {user} = useAuth();
  const [lines, setLines] = useState<CartLine[]>(() => loadGuest());
  const merging = useRef(false);

  // On login: merge the guest cart into the server cart, then switch to server state.
  useEffect(() => {
    if (!user || merging.current) {
      if (!user) setLines([]);
      return;
    }
    merging.current = true;
    const guest = loadGuest();
    api<CartPayload>('/cart/merge', {
      method: 'POST',
      body: {items: guest.map(l => ({product_id: l.product.id, qty: l.qty}))},
    })
      .then(r => {
        saveGuest([]);
        setLines(r.items.map(i => ({product: i.product, qty: i.qty})));
      })
      .catch(() => {
        /* keep guest lines if the merge fails */
      })
      .finally(() => {
        merging.current = false;
      });
  }, [user]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.product.price, 0),
    async addItem(product, qty = 1) {
      if (user) {
        const r = await api<CartPayload>('/cart/items', {method: 'POST', body: {product_id: product.id, qty}});
        setLines(r.items.map(i => ({product: i.product, qty: i.qty})));
      } else {
        const next = [...lines];
        const idx = next.findIndex(l => l.product.id === product.id);
        if (idx >= 0) next[idx] = {...next[idx], qty: Math.min(next[idx].qty + qty, product.stock)};
        else next.push({product, qty});
        setLines(next);
        saveGuest(next);
      }
    },
    async setQty(productId, qty) {
      if (user) {
        // Resolve the server cart item id first, then patch it
        const r = await api<CartPayload>('/cart');
        const target = r.items.find(i => i.product.id === productId);
        if (!target) return;
        const updated = await api<CartPayload>(`/cart/items/${target.id}`, {method: 'PATCH', body: {qty}});
        setLines(updated.items.map(i => ({product: i.product, qty: i.qty})));
      } else {
        const next = qty <= 0
          ? lines.filter(l => l.product.id !== productId)
          : lines.map(l => (l.product.id === productId ? {...l, qty} : l));
        setLines(next);
        saveGuest(next);
      }
    },
    async removeItem(productId) {
      if (user) {
        const r = await api<CartPayload>('/cart');
        const target = r.items.find(i => i.product.id === productId);
        if (!target) return;
        const updated = await api<CartPayload>(`/cart/items/${target.id}`, {method: 'DELETE'});
        setLines(updated.items.map(i => ({product: i.product, qty: i.qty})));
      } else {
        const next = lines.filter(l => l.product.id !== productId);
        setLines(next);
        saveGuest(next);
      }
    },
    async clear() {
      if (user) {
        const updated = await api<CartPayload>('/cart', {method: 'DELETE'});
        setLines(updated.items.map(i => ({product: i.product, qty: i.qty})));
      } else {
        setLines([]);
        saveGuest([]);
      }
    },
  }), [lines, user]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

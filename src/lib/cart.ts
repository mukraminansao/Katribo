/**
 * Cart store — persisted in localStorage, synced across tabs,
 * read in components with useCart() (useSyncExternalStore).
 */
import { useSyncExternalStore } from 'react';
import { PRODUCT_BY_ID, unitPrice, type AddonId, type SizeId } from '../data/menu';

export interface CartItem { key: string; id: string; size: SizeId; addons: AddonId[]; qty: number }

const KEY = 'katribo.cart.v1';
const NOTE_KEY = 'katribo.note.v1';

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

function load(): CartItem[] {
  try {
    const raw = JSON.parse(safeGet(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => PRODUCT_BY_ID[i?.id]?.price != null && i.qty > 0) : [];
  } catch { return []; }
}

let items: CartItem[] = typeof window === 'undefined' ? [] : load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const commit = (next: CartItem[]) => { items = next; safeSet(KEY, JSON.stringify(items)); emit(); };

if (typeof window !== 'undefined') {
  addEventListener('storage', (e) => { if (e.key === KEY) { items = load(); emit(); } });
}

const keyOf = (id: string, size: SizeId, addons: AddonId[]) => [id, size, ...[...addons].sort()].join('|');

export const cart = {
  add(id: string, opts: { size?: SizeId; addons?: AddonId[]; qty?: number } = {}): boolean {
    const { size = 'regular', addons = [], qty = 1 } = opts;
    if (PRODUCT_BY_ID[id]?.soldOut || unitPrice(id, size, addons) == null) return false;
    const key = keyOf(id, size, addons);
    const found = items.find((i) => i.key === key);
    commit(found
      ? items.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
      : [...items, { key, id, size, addons: [...addons], qty }]);
    return true;
  },
  setQty(key: string, qty: number) {
    if (qty <= 0) return cart.remove(key);
    const item = items.find(i => i.key === key);
    if (item && PRODUCT_BY_ID[item.id]?.soldOut && qty > item.qty) return;
    commit(items.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i)));
  },
  remove(key: string) { commit(items.filter((i) => i.key !== key)); },
  clear() { commit([]); },
  getNote: () => safeGet(NOTE_KEY) ?? '',
  setNote: (v: string) => safeSet(NOTE_KEY, v),
};

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export function useCart() {
  const list = useSyncExternalStore(subscribe, () => items, () => items);
  const count = list.reduce((t, i) => t + i.qty, 0);
  const subtotal = list.reduce((t, i) => t + (unitPrice(i.id, i.size, i.addons) ?? 0) * i.qty, 0);
  return { items: list, count, subtotal };
}

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ADDONS, PRODUCT_BY_ID, SIZES, isFood, type AddonId, type SizeId } from '../data/menu';

export const peso = (n: number | null | undefined) =>
  n == null ? 'Price unavailable' : `₱${n.toLocaleString('en-PH')}`;

export const describe = (size: SizeId, addons: readonly AddonId[], id?: string) =>
  (id && PRODUCT_BY_ID[id] && isFood(PRODUCT_BY_ID[id]) ? [] : [SIZES.find((s) => s.id === size)?.label, ...addons.map((a) => ADDONS.find((x) => x.id === a)?.label)])
    .filter(Boolean).join(' · ');

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function useTitle(title: string) {
  useEffect(() => { document.title = title ? `${title} — KATRIBO` : 'KATRIBO — Good Coffee, Better People'; }, [title]);
}

/** Locks page scroll while an overlay is open (keeps scrollbar width stable). */
let scrollLocks = 0;
let scrollBeforeLock: { overflow: string; paddingRight: string } | null = null;
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    if (scrollLocks === 0) {
      scrollBeforeLock = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
      const gap = innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (gap) document.body.style.paddingRight = `${gap}px`;
    }
    scrollLocks++;
    return () => {
      scrollLocks--;
      if (scrollLocks === 0 && scrollBeforeLock) {
        document.body.style.overflow = scrollBeforeLock.overflow;
        document.body.style.paddingRight = scrollBeforeLock.paddingRight;
        scrollBeforeLock = null;
      }
    };
  }, [locked]);
}

export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => { const m = matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** True once the page has scrolled past `y` pixels. */
export function useScrolled(y = 24) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(scrollY > y);
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, [y]);
  return s;
}

/** Subtle scroll-linked parallax (disabled for reduced motion). */
export function useParallax<T extends HTMLElement>(speed = 0.12) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`; });
    };
    addEventListener('scroll', on, { passive: true });
    return () => { removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [speed]);
  return ref;
}

/* ── Toast store ── */
export interface ToastData { id: number; title: string; image?: string; action?: { label: string; to: string } }
let toast: ToastData | null = null;
const tl = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
export function showToast(t: Omit<ToastData, 'id'>) {
  toast = { ...t, id: Date.now() };
  tl.forEach((l) => l());
  clearTimeout(timer);
  timer = setTimeout(() => { toast = null; tl.forEach((l) => l()); }, 2800);
}
export const useToast = () => useSyncExternalStore((l) => { tl.add(l); return () => tl.delete(l); }, () => toast, () => null);

/* ── Cart drawer store (slides in from the right) ── */
export interface DrawerState { open: boolean; added?: string; at: number }
let drawer: DrawerState = { open: false, at: 0 };
const dl = new Set<() => void>();
/** Open the cart drawer; pass `added` (e.g. "Caramel Macchiato · Large") to show the "Added" banner. */
export function openCartDrawer(added?: string) { drawer = { open: true, added, at: Date.now() }; dl.forEach((l) => l()); }
export function closeCartDrawer() { if (!drawer.open) return; drawer = { ...drawer, open: false }; dl.forEach((l) => l()); }
export const useCartDrawer = () => useSyncExternalStore((l) => { dl.add(l); return () => dl.delete(l); }, () => drawer, () => drawer);

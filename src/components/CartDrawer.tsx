import { useEffect, useRef, useState } from 'react';
import { PRODUCT_BY_ID, unitPrice } from '../data/menu';
import { cart, useCart } from '../lib/cart';
import { Link, useLocation } from '../lib/router';
import { closeCartDrawer, cx, describe, peso, useCartDrawer, useScrollLock } from '../lib/ui';
import { Icon } from './Icon';
import { Img, Stepper } from './Primitives';

/** Side cart: slides in when a drink is added (or the header bag is tapped). */
export function CartDrawer() {
  const d = useCartDrawer();
  const { items, subtotal, count } = useCart();
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Mount → slide in; slide out → unmount.
  useEffect(() => {
    if (d.open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      const t = setTimeout(() => setShown(true), 50); // fallback if frames are paused
      return () => { cancelAnimationFrame(r); clearTimeout(t); };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 450);
    return () => clearTimeout(t);
  }, [d.open, d.at]);

  useEffect(() => { closeCartDrawer(); }, [pathname]);
  useEffect(() => { if (shown) closeBtn.current?.focus(); }, [shown]);
  useEffect(() => {
    if (!d.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCartDrawer(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [d.open]);
  useScrollLock(mounted);

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Your cart">
      <div onClick={closeCartDrawer} className={cx('absolute inset-0 bg-black/65 backdrop-blur-[3px] transition-opacity duration-500', shown ? 'opacity-100' : 'opacity-0')} />
      <aside className={cx('absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0a0a0a_100%)] shadow-[-30px_0_80px_-20px_rgba(0,0,0,.95)] transition-transform duration-500 ease-[var(--ease-out-quint)]',
        shown ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[.08] px-5">
          <p className="flex items-center gap-3 text-[20px] font-extrabold tracking-[-0.02em]">
            Your Cart {count > 0 && <span className="tabular rounded-full bg-crema px-2.5 py-0.5 text-[13px] font-extrabold text-[#1b1006]">{count}</span>}
          </p>
          <button ref={closeBtn} type="button" onClick={closeCartDrawer} aria-label="Close cart"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/[.06] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] transition-all duration-300 hover:rotate-90 hover:bg-white hover:text-ink">
            <Icon name="close" size={20} />
          </button>
        </div>

        {d.added && items.length > 0 && (
          <div key={d.at} className="mx-5 mt-4 flex animate-rise items-center gap-3 rounded-2xl border border-crema/30 bg-crema/[.08] px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-crema text-[#1b1006]"><Icon name="check" size={16} stroke={2.8} /></span>
            <p className="min-w-0 text-[14.5px]"><span className="font-bold">Added to your cart</span><span className="block truncate text-soft">{d.added}</span></p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="grid flex-1 place-content-center justify-items-center gap-3 px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-ink"><Icon name="bag" size={28} /></span>
            <p className="mt-2 text-[22px] font-extrabold">Your cart is empty</p>
            <p className="text-[15.5px] text-soft">Pick something good from the menu.</p>
            <Link to="/menu" className="btn btn-primary mt-3"><span>Browse Menu</span><Icon name="arrow" size={17} className="arrow" /></Link>
          </div>
        ) : (
          <ul className="grid flex-1 content-start gap-3 overflow-y-auto overscroll-contain px-5 py-4">
            {items.map((it) => {
              const p = PRODUCT_BY_ID[it.id];
              const unit = unitPrice(it.id, it.size, it.addons) ?? 0;
              const opts = describe(it.size, it.addons, it.id);
              return (
                <li key={it.key} className="panel flex gap-3.5 p-2.5 !rounded-[20px]">
                  <Link to={`/menu/${p.id}`} className="warm-glow block h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[14px] ring-1 ring-white/[.06]">
                    <Img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15.5px] font-bold">{p.name}</p>
                        {opts && <p className="truncate text-[13.5px] text-soft">{opts}</p>}
                        {p.soldOut ? <p className="text-[12px] font-semibold text-crema">Sold out — remove before checkout.</p> : null}
                      </div>
                      <button type="button" onClick={() => cart.remove(it.key)} aria-label={`Remove ${p.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-white hover:text-ink"><Icon name="trash" size={15} /></button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Stepper size="sm" value={it.qty} min={0} disabled={p.soldOut} label={`Quantity for ${p.name}`} onChange={(n) => cart.setQty(it.key, n)} />
                      <p className="tabular text-[17px] font-extrabold">{peso(unit * it.qty)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 && (
          <div className="shrink-0 border-t border-white/[.08] bg-black/30 px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[12px] font-semibold tracking-[.18em] text-mute uppercase">Subtotal</p>
                <p className="text-[13.5px] text-mute">Pickup in-store · Free</p>
              </div>
              <p className="tabular text-[28px] leading-none font-extrabold">{peso(subtotal)}</p>
            </div>
            <div className="mt-4 grid gap-2.5">
              <Link to="/checkout" className="btn btn-primary btn-lg w-full"><span>Checkout</span><Icon name="arrow" size={17} className="arrow" /></Link>
              <div className="grid grid-cols-2 gap-2.5">
                <Link to="/cart" className="btn btn-outline w-full px-4"><span>View Cart</span></Link>
                <button type="button" onClick={closeCartDrawer} className="btn btn-outline w-full px-4"><span>Keep Browsing</span></button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

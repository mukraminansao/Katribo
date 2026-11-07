import { Fragment, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { ButtonLink, Img, PageHeader, Reveal, SectionHead, Stepper } from '../components/Primitives';
import { ProductCard } from '../components/ProductCard';
import { PRODUCT_BY_ID, pick, unitPrice } from '../data/menu';
import { SITE } from '../data/site';
import { cart, useCart, type CartItem } from '../lib/cart';
import { Link } from '../lib/router';
import { cx, describe, peso, showToast, useTitle } from '../lib/ui';

/** Cart → Details → Confirmed progress indicator. */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Cart', 'Details', 'Confirmed'];
  return (
    <ol className="flex items-center gap-2.5 sm:gap-3.5" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const n = i + 1;
        const state = n < current ? 'is-done' : n === current ? 'is-current' : '';
        return (
          <Fragment key={s}>
            {i > 0 && <li aria-hidden="true" className={cx('co-line', n <= current && 'is-done')} />}
            <li className={cx('co-step', state)} aria-current={n === current ? 'step' : undefined}>
              <span className="co-dot">{n < current ? <Icon name="check" size={15} stroke={2.8} /> : n}</span>
              <span className={cx(n !== current && 'hidden sm:inline')}>{s}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

export function Totals({ subtotal, className }: { subtotal: number; className?: string }) {
  return (
    <dl className={cx('grid gap-3.5 text-[16px]', className)}>
      <div className="flex justify-between text-soft"><dt>Subtotal</dt><dd className="tabular font-semibold text-white">{peso(subtotal)}</dd></div>
      <div className="flex justify-between text-soft"><dt>Pickup <span className="text-mute">· In-store</span></dt><dd className="font-semibold text-white">Free</dd></div>
      <div className="mt-1 flex items-end justify-between border-t border-dashed border-white/15 pt-5">
        <dt className="text-[17px] font-bold">Total</dt>
        <dd className="tabular text-[32px] leading-none font-extrabold tracking-[-0.02em]">{peso(subtotal)}</dd>
      </div>
    </dl>
  );
}

/** Payment methods shown at checkout (UI only for now — no online payment is processed). */
export const PAYMENTS: { id: 'cash' | 'gcash' | 'card'; label: string; sub: string; hint: string; icon: IconName }[] = [
  { id: 'cash', label: 'Cash', sub: 'Pay at the counter', hint: 'Pay in cash at the counter when you pick up your order.', icon: 'cash' },
  { id: 'gcash', label: 'GCash', sub: 'Pay at pickup', hint: 'GCash selected for pickup. Confirm availability with the team at the counter; no online payment is collected.', icon: 'wallet' },
  { id: 'card', label: 'Card', sub: 'Pay at pickup', hint: 'Card selected for pickup. Confirm availability with the team at the counter; no online payment is collected.', icon: 'card' },
];
export type PaymentId = (typeof PAYMENTS)[number]['id'];

/** Small "We accept" row: Cash · GCash · Cards. */
export function WeAccept({ className }: { className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-2', className)}>
      <span className="mr-1 text-[12px] font-semibold tracking-[.18em] text-mute uppercase">We accept</span>
      {PAYMENTS.map((m) => (
        <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[.04] px-3 py-1.5 text-[13px] font-semibold text-soft">
          <Icon name={m.icon} size={15} />{m.id === 'card' ? 'Cards' : m.label}
        </span>
      ))}
    </div>
  );
}

/** Where to pick up: name, address, directions link. */
export function PickupInfo({ className }: { className?: string }) {
  return (
    <div className={cx('flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4', className)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink"><Icon name="pin" size={18} /></span>
      <div className="min-w-0 text-[14.5px]">
        <p className="font-semibold">Pick up at Katribo Slow Coffee Bar</p>
        <p className="text-mute">{SITE.address ?? 'Address to be confirmed'}</p>
        {SITE.address && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Katribo Slow Coffee Bar, ' + SITE.address)}`} target="_blank" rel="noopener"
            className="mt-1.5 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">Get directions <Icon name="arrow-up-right" size={13} /></a>
        )}
      </div>
    </div>
  );
}

function Line({ item, index }: { item: CartItem; index: number }) {
  const p = PRODUCT_BY_ID[item.id];
  const unit = unitPrice(item.id, item.size, item.addons) ?? 0;
  const [leaving, setLeaving] = useState(false);
  const remove = () => {
    setLeaving(true);
    setTimeout(() => { cart.remove(item.key); showToast({ title: `${p.name} removed` }); }, 280);
  };
  const opts = describe(item.size, item.addons, item.id);
  return (
    <li style={{ animationDelay: `${index * 60}ms` }}
      className={cx('panel relative flex animate-rise gap-4 p-3 transition-all duration-300 sm:gap-5 sm:p-4', leaving && 'translate-x-8 opacity-0')}>
      <Link to={`/menu/${p.id}`} className="warm-glow group block h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[18px] ring-1 ring-white/[.06] sm:h-[124px] sm:w-[124px]">
        <Img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5">
        <div className="min-w-0 pr-11">
          <h3 className="text-[17px] leading-snug font-bold sm:text-[19px]"><Link to={`/menu/${p.id}`} className="underline-offset-4 hover:underline">{p.name}</Link></h3>
          {opts && <p className="mt-0.5 text-[14.5px] text-soft">{opts}</p>}
          {p.soldOut ? <p className="mt-1 text-[13px] font-semibold text-crema">Sold out — remove this item before checkout.</p> : null}
          <p className="tabular mt-1 text-[14px] text-mute">{peso(unit)} each</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Stepper size="sm" value={item.qty} label={`Quantity for ${p.name}`} disabled={p.soldOut} onChange={(n) => (n < 1 ? remove() : cart.setQty(item.key, n))} min={0} />
          <p className="tabular text-[19px] font-extrabold sm:text-[21px]">{peso(unit * item.qty)}</p>
        </div>
      </div>
      <button type="button" onClick={remove} aria-label={`Remove ${p.name} from cart`}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/[.04] text-soft transition-all duration-300 hover:border-white hover:bg-white hover:text-ink sm:right-4 sm:top-4">
        <Icon name="trash" size={16} />
      </button>
    </li>
  );
}

export default function Cart() {
  useTitle('Your Cart');
  const { items, subtotal, count } = useCart();
  const [note, setNote] = useState(cart.getNote);
  const browse = pick(['spanish-latte', 'mocha', 'chocolate-milkshake', 'strawberry-milkshake']);

  return (
    <>
      <PageHeader eyebrow="Your order" title="Your Cart" sub={count ? `${count} item${count > 1 ? 's' : ''} in your order` : undefined}>
        {items.length > 0 && <div className="mt-6 animate-rise"><CheckoutSteps current={1} /></div>}
      </PageHeader>

      <section className={cx('shell pb-14 md:pb-20', items.length > 0 && 'max-lg:pb-36')}>
        {items.length === 0 ? (
          <div className="panel relative grid animate-rise justify-items-center gap-3 overflow-hidden px-6 py-16 text-center sm:py-20">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_30%,rgba(150,98,55,.18),transparent_70%)]" />
            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-white text-ink shadow-[0_0_0_10px_rgba(255,255,255,.06),0_0_40px_rgba(255,255,255,.18)]"><Icon name="bag" size={32} /></span>
            <h2 className="display relative mt-4 text-[34px] sm:text-[48px]">Your cart is <span className="text-outline">empty</span></h2>
            <p className="relative max-w-[380px] text-[16.5px] text-soft">Pick something good from the menu — your drinks will wait for you here.</p>
            <div className="relative mt-4 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/menu" size="lg" arrow>Browse Menu</ButtonLink>
              <ButtonLink to="/#fav-title" size="lg" variant="outline">Our Favorites</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-10">
            <div>
              <ul className="grid gap-3.5">{items.map((it, i) => <Line key={it.key} item={it} index={i} />)}</ul>
              <div className="panel mt-4 p-4 sm:p-5">
                <label htmlFor="note" className="mb-2.5 flex items-center gap-2.5 text-[15.5px] font-semibold">
                  <Icon name="cup" size={18} /> Notes for the barista <span className="font-normal text-mute">(optional)</span>
                </label>
                <textarea id="note" rows={2} maxLength={300} value={note} placeholder="e.g. less ice, extra hot…"
                  onChange={(e) => { setNote(e.target.value); cart.setNote(e.target.value); }}
                  className="field-input min-h-[64px] resize-y" />
              </div>
            </div>

            <aside className="panel p-6 lg:sticky lg:top-28 lg:p-7" aria-label="Order summary">
              <p className="text-[12px] font-semibold tracking-[.2em] text-mute uppercase">Order summary</p>
              <p className="mt-1 text-[17px] font-semibold">{count} item{count > 1 ? 's' : ''}</p>
              <Totals subtotal={subtotal} className="mt-5" />
              <PickupInfo className="mt-6" />
              <ButtonLink to="/checkout" size="lg" arrow className="mt-6 w-full">Proceed to Checkout</ButtonLink>
              <WeAccept className="mt-5 justify-center" />
              <div className="mt-5 flex justify-center border-t border-white/[.08] pt-5">
                <Link to="/menu" className="view-all"><span className="va-text">Continue browsing</span><span className="va-icon"><Icon name="arrow" size={16} /></span></Link>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* Phones/tablets: total + checkout always within reach */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-ink/90 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-20px_40px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold tracking-[.16em] text-mute uppercase">Total · {count} item{count > 1 ? 's' : ''}</p>
              <p className="tabular text-[24px] leading-tight font-extrabold">{peso(subtotal)}</p>
            </div>
            <ButtonLink to="/checkout" size="lg" arrow className="flex-1">Checkout</ButtonLink>
          </div>
        </div>
      )}

      <section className="shell pb-16 md:pb-24" aria-labelledby="browse-title">
        <SectionHead id="browse-title" title="Continue Browsing" link="/menu" linkLabel="View Menu" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-6">
          {browse.map((p, i) => <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>)}
        </div>
      </section>
    </>
  );
}

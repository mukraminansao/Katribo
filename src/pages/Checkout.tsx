import { useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { ButtonLink, Img } from '../components/Primitives';
import { PRODUCT_BY_ID, unitPrice } from '../data/menu';
import { SITE } from '../data/site';
import { cart, useCart } from '../lib/cart';
import { checkoutKey, clearCheckoutKey } from '../lib/checkout-request';
import { Link } from '../lib/router';
import { cx, describe, peso, useTitle } from '../lib/ui';
import { CheckoutSteps, PAYMENTS, PickupInfo, Totals, type PaymentId } from './Cart';

type Fields = { name: string; phone: string; email: string };
const RULES: Record<keyof Fields, (v: string) => string> = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your full name.'),
  phone: (v) => (/^(\+639|09)\d{9}$/.test(v.replace(/[\s\-()]/g, '')) ? '' : 'Enter a valid PH mobile number, e.g. 0917 123 4567.'),
  email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
};

function Step({ n, title, sub, children, className }: { n: number; title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx('panel p-5 sm:p-7', className)}>
      <div className="mb-5 flex items-center gap-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[15px] font-extrabold text-ink">{n}</span>
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em] sm:text-[21px]">{title}</h2>
          {sub && <p className="text-[14px] text-mute">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, icon, error, ...input }: { id: keyof Fields; label: string; hint?: string; icon: IconName; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-2">
      <label htmlFor={`co-${id}`} className="text-[15.5px] font-semibold">{label}{hint && <span className="ml-1.5 font-normal text-mute">{hint}</span>}</label>
      <div className="relative">
        <Icon name={icon} size={19} className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-mute" />
        <input id={`co-${id}`} name={id} className="field-input has-icon" aria-invalid={error ? true : undefined} aria-describedby={error ? `co-${id}-err` : undefined} {...input} />
      </div>
      {error && <p id={`co-${id}-err`} className="flex items-center gap-2 text-[14px]"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-ink">!</span>{error}</p>}
    </div>
  );
}

export default function Checkout() {
  useTitle('Checkout');
  const { items, subtotal, count } = useCart();
  const [f, setF] = useState<Fields>({ name: '', phone: '', email: '' });
  const [err, setErr] = useState<Partial<Fields>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<PaymentId>('cash');
  const method = PAYMENTS.find((m) => m.id === pay)!;
  const [done, setDone] = useState<{ ref: string; name: string; total: number; pay: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const note = cart.getNote().trim();
  const soldOutItems = items.filter(item => PRODUCT_BY_ID[item.id]?.soldOut);

  const set = (k: keyof Fields) => (e: ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    if (err[k]) setErr({ ...err, [k]: RULES[k](e.target.value) });
  };
  const blur = (k: keyof Fields) => () => { if (f[k]) setErr({ ...err, [k]: RULES[k](f[k]) }); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (soldOutItems.length) { setFormError('An item in your cart is sold out. Remove it from your cart before placing this order.'); return; }
    const next = Object.fromEntries((Object.keys(RULES) as (keyof Fields)[]).map((k) => [k, RULES[k](f[k])])) as Fields;
    setErr(next);
    const first = (Object.keys(next) as (keyof Fields)[]).find((k) => next[k]);
    if (first) { formRef.current?.querySelector<HTMLInputElement>(`#co-${first}`)?.focus(); return; }
    setBusy(true);
    try {
      const payload = { ...f, fulfilment: 'pickup', note, paymentMethod: pay, expectedTotal: subtotal,
        items: items.map(({ id, size, addons, qty }) => ({ id, size, addons, qty })) };
      const res = await fetch('/api/place-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, requestKey: checkoutKey(payload) }),
      });
      const data = await res.json().catch(() => ({ ok: false, message: 'Unexpected server response.' }));
      if (!res.ok || !data.ok) { setErr(data.fields ?? {}); throw new Error(data.message || 'Could not place the order.'); }
      cart.clear(); cart.setNote(''); clearCheckoutKey();
      setDone({ ref: data.ref, name: data.name, total: data.total, pay: method.label });
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch (x) {
      setFormError(x instanceof Error ? x.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  /* ── Confirmation ── */
  if (done) {
    return (
      <section className="shell grid min-h-[86svh] place-items-center pt-[100px] pb-16 md:pt-[128px]">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex justify-center"><CheckoutSteps current={3} /></div>
          <div className="panel relative animate-pop overflow-hidden text-center">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,.1),transparent_70%)]" />
            <div className="relative px-6 pt-12 pb-8 sm:px-12">
              <span className="relative mx-auto grid h-[84px] w-[84px] place-items-center">
                <span aria-hidden="true" className="absolute inset-0 animate-[ring-out_1.6s_var(--ease-out-quint)_infinite] rounded-full border-2 border-white/50" />
                <span className="relative grid h-[84px] w-[84px] place-items-center rounded-full bg-white text-ink shadow-[0_0_40px_rgba(255,255,255,.35)]"><Icon name="check" size={40} stroke={2.4} /></span>
              </span>
              <p className="eyebrow mt-7">Pickup order</p>
              <h1 className="display mt-3 text-[40px] sm:text-[56px]">Order <span className="text-outline">received</span></h1>
              <p className="mt-4 text-[18px] text-soft">Thanks, {done.name}! Here&apos;s your order reference.</p>
            </div>

            {/* Ticket stub */}
            <div className="relative mx-6 border-t-2 border-dashed border-white/15 sm:mx-12">
              <span aria-hidden="true" className="absolute -left-[38px] -top-[13px] h-6 w-6 rounded-full bg-ink sm:-left-[62px]" />
              <span aria-hidden="true" className="absolute -right-[38px] -top-[13px] h-6 w-6 rounded-full bg-ink sm:-right-[62px]" />
            </div>
            <dl className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-6 py-7 text-left sm:px-12">
              <div><dt className="text-[12px] font-semibold tracking-[.18em] text-mute uppercase">Reference</dt><dd className="tabular mt-1 whitespace-nowrap text-[19px] font-extrabold tracking-[.02em] sm:text-[22px]">{done.ref}</dd></div>
              <div className="text-right"><dt className="text-[12px] font-semibold tracking-[.18em] text-mute uppercase">Total</dt><dd className="tabular mt-1 text-[22px] font-extrabold">{peso(done.total)}</dd></div>
              <div className="col-span-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3">
                <span className="text-[12px] font-semibold tracking-[.18em] text-mute uppercase">Payment</span>
                <span className="inline-flex items-center gap-2 text-[16px] font-bold"><Icon name={PAYMENTS.find((m) => m.label === done.pay)?.icon ?? 'cash'} size={18} />{done.pay}</span>
              </div>
              <div className="col-span-2"><PickupInfo /></div>
            </dl>
            <p className="relative px-6 pb-7 text-[13.5px] text-mute sm:px-12">Your order is saved for the Katribo team. Please pay at pickup; no online payment has been taken.</p>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/" size="lg" arrow>Back to Home</ButtonLink>
            <ButtonLink to="/menu" size="lg" variant="outline">Order More</ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <header className="shell pt-[96px] pb-7 md:pt-[128px] md:pb-9">
        <Link to="/cart" className="back-pill"><span className="bp-icon"><Icon name="arrow-left" size={17} /></span>Back to Cart</Link>
        <p className="eyebrow mt-7 flex animate-rise items-center gap-3"><span aria-hidden="true" className="h-px w-8 bg-crema/80" />Almost there</p>
        <h1 className="display mt-3 animate-rise text-[44px] sm:text-[60px] lg:text-[72px]">Checkout</h1>
        {soldOutItems.length ? <p role="alert" className="mt-5 rounded-2xl border border-crema/40 p-4 text-[15px] text-crema">{soldOutItems.map(item => PRODUCT_BY_ID[item.id].name).join(', ')} is sold out. <Link to="/cart" className="font-bold underline">Return to your cart</Link> to remove unavailable items.</p> : null}
        {items.length > 0 && <div className="mt-6 animate-rise"><CheckoutSteps current={2} /></div>}
        <p className="mt-6 flex max-w-[640px] items-start gap-3 rounded-2xl border border-white/12 bg-white/[.03] px-4 py-3.5 text-[14.5px] leading-relaxed text-soft">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />Your order will be sent to the Katribo team. Payment is made at pickup.
        </p>
      </header>

      <section className="shell pb-14 md:pb-20">
        {items.length === 0 ? (
          <div className="panel grid justify-items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-ink"><Icon name="bag" size={28} /></span>
            <h2 className="mt-2 text-[26px] font-extrabold">Your cart is empty</h2>
            <p className="text-[16px] text-soft">Add a drink before checking out.</p>
            <ButtonLink to="/menu" size="lg" arrow className="mt-3">Browse Menu</ButtonLink>
          </div>
        ) : (
          <form ref={formRef} noValidate onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-8">
            <div className="grid gap-5">
              <Step n={1} title="How you'll get it" sub="Pickup only for now">
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery or pickup">
                  <button type="button" role="radio" aria-checked="true" className="opt-card is-on">
                    <span className="opt-mark rounded-full"><span className="h-2.5 w-2.5 rounded-full bg-ink" /></span>
                    <span className="min-w-0"><span className="block text-[17px] font-bold">Pickup</span><span className="block text-[14px] text-mute">In-store · Free</span></span>
                  </button>
                  <button type="button" role="radio" aria-checked="false" disabled className="opt-card cursor-not-allowed opacity-50">
                    <span className="opt-mark rounded-full" />
                    <span className="min-w-0 flex-1"><span className="block text-[17px] font-bold">Delivery</span><span className="block text-[14px] text-mute">Not available yet</span></span>
                    <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-bold tracking-[.12em] text-soft uppercase">Soon</span>
                  </button>
                </div>
                {SITE.address && <PickupInfo className="mt-4" />}
              </Step>
              <Step n={2} title="Your details" sub="So we know whose order it is">
                <div className="grid gap-5">
                  <Field id="name" label="Full name" icon="users" placeholder="Juan Dela Cruz" autoComplete="name" value={f.name} onChange={set('name')} onBlur={blur('name')} error={err.name} />
                  <Field id="phone" label="Mobile number" icon="phone" placeholder="0917 123 4567" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} onBlur={blur('phone')} error={err.phone} />
                  <Field id="email" label="Email" hint="(optional)" icon="mail" placeholder="you@example.com" type="email" autoComplete="email" value={f.email} onChange={set('email')} onBlur={blur('email')} error={err.email} />
                </div>
              </Step>
              <Step n={3} title="How you'll pay" sub="Choose one — you can change it anytime before ordering">
                <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
                  {PAYMENTS.map((m) => {
                    const on = pay === m.id;
                    return (
                      <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => setPay(m.id)}
                        className={cx('opt-card sm:min-h-[132px] sm:flex-col sm:items-start sm:gap-3 sm:p-4', on && 'is-on')}>
                        <span className="flex w-full items-center justify-between gap-3 max-sm:contents">
                          <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors duration-300', on ? 'bg-white text-ink' : 'bg-white/[.08] text-white')}>
                            <Icon name={m.icon} size={21} />
                          </span>
                          <span className="opt-mark rounded-full max-sm:order-last max-sm:ml-auto"><span className={cx('h-2.5 w-2.5 rounded-full', on ? 'bg-ink' : 'bg-transparent')} /></span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[17px] font-bold">{m.label}</span>
                          <span className="block text-[14px] leading-snug text-mute">{m.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-[14.5px] text-soft" aria-live="polite">
                  <Icon name={method.icon} size={17} className="mt-0.5 shrink-0" />{method.hint}
                </p>
              </Step>
            </div>

            <div className="grid gap-5 lg:sticky lg:top-28">
              <Step n={4} title="Order summary" sub={`${count} item${count > 1 ? 's' : ''}`}>
                <ul className="-mt-2 grid max-h-[370px] gap-4 overflow-y-auto pt-2 pr-2">
                  {items.map((it) => {
                    const p = PRODUCT_BY_ID[it.id];
                    const unit = unitPrice(it.id, it.size, it.addons) ?? 0;
                    const opts = describe(it.size, it.addons, it.id);
                    return (
                      <li key={it.key} className="flex items-center gap-4">
                        <span className="relative shrink-0">
                          <Img src={p.image} alt="" className="warm-glow h-[68px] w-[68px] rounded-2xl object-cover ring-1 ring-white/[.08]" />
                          <span className="tabular absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-[12px] font-extrabold text-ink shadow-[0_4px_10px_rgba(0,0,0,.6)]">{it.qty}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-[16.5px] font-bold">{p.name}</strong>
                          {opts && <span className="block truncate text-[14px] text-soft">{opts}</span>}
                        </div>
                        <b className="tabular text-[17px] font-extrabold">{peso(unit * it.qty)}</b>
                      </li>
                    );
                  })}
                </ul>
                {note && <p className="mt-5 flex gap-2.5 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-[14.5px] text-soft"><Icon name="cup" size={17} className="mt-0.5 shrink-0" /><span><b className="font-semibold text-white">Note:</b> {note}</span></p>}
              </Step>
              <div className="panel p-5 sm:p-7">
                <Totals subtotal={subtotal} />
                {formError && <p role="alert" className="mt-5 flex gap-2.5 rounded-2xl border border-white/25 px-4 py-3 text-[14.5px]"><Icon name="info" size={17} className="mt-0.5 shrink-0" />{formError}</p>}
                <button type="submit" disabled={busy || soldOutItems.length > 0} className="btn btn-primary btn-lg mt-6 w-full justify-between gap-3 pl-6 pr-2">
                  {busy
                    ? <span className="flex flex-1 items-center justify-center gap-2.5"><span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />Placing order…</span>
                    : <><span className="flex items-center gap-2.5"><Icon name="check" size={18} stroke={2.6} />Place Order</span><span className="price-chip">{peso(subtotal)}</span></>}
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-[14px] text-mute">
                  Paying with <span className="inline-flex items-center gap-1.5 font-semibold text-white"><Icon name={method.icon} size={16} />{method.label}</span>
                </p>
              </div>
            </div>
          </form>
        )}
      </section>
    </>
  );
}

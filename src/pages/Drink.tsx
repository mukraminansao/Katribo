import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Img, Reveal, SectionHead, Stepper } from '../components/Primitives';
import NotFound from './NotFound';
import { ProductCard } from '../components/ProductCard';
import { ADDONS, PRODUCTS, PRODUCT_BY_ID, SIZES, isFood, unitPrice, type AddonId, type SizeId } from '../data/menu';
import { cart } from '../lib/cart';
import { pageName, useCameFrom, useNavigate } from '../lib/router';
import { cx, openCartDrawer, peso, useTitle } from '../lib/ui';

/** Returns to the page the visitor came from (Home, Menu, Gallery…) at the same scroll position; Menu after a direct visit. */
function BackButton({ className, onPhoto }: { className?: string; onPhoto?: boolean }) {
  const from = useCameFrom();
  const navigate = useNavigate();
  const name = pageName(from);
  const label = from ? (name === 'Previous' ? 'Back' : `Back to ${name}`) : 'Back to Menu';
  return (
    <button type="button" onClick={() => (from ? history.back() : navigate('/menu'))} className={cx('back-pill', onPhoto && 'on-photo', className)}>
      <span className="bp-icon"><Icon name="arrow-left" size={17} /></span>
      {label}
    </button>
  );
}

function StepTitle({ n, title, note }: { n: number; title: string; note?: string }) {
  return (
    <legend className="mb-4 flex w-full items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[14px] font-extrabold text-ink">{n}</span>
      <span className="text-[19px] font-bold tracking-[-0.01em] md:text-[21px]">{title}</span>
      {note && <span className="text-[14px] font-medium text-mute md:text-[15px]">{note}</span>}
    </legend>
  );
}

export default function Drink({ params }: { params: Record<string, string> }) {
  const p = PRODUCT_BY_ID[params.id];
  useTitle(p ? p.name : 'Drink not found');
  const [size, setSize] = useState<SizeId>('regular');
  const [addons, setAddons] = useState<AddonId[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const related = useMemo(() => {
    if (!p) return [];
    const same = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category);
    const other = PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category && x.price != null && !isFood(x));
    return [...same, ...other].slice(0, 4);
  }, [p]);

  if (!p) {
    return <NotFound docTitle="Drink not found" title="This drink isn’t on the menu" message="It may have been renamed or removed. Here’s what’s brewing instead." />;
  }

  const orderable = p.price != null && !p.soldOut;
  const food = isFood(p);
  const unit = unitPrice(p.id, size, addons);
  const total = unit == null ? null : unit * qty;
  const toggle = (id: AddonId) => setAddons((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const summary = food ? '' : [SIZES.find((s) => s.id === size)?.label, ...addons.map((a) => ADDONS.find((x) => x.id === a)?.label)].filter(Boolean).join(' · ');
  const add = () => {
    if (!cart.add(p.id, { size, addons, qty })) return;
    openCartDrawer(`${qty} × ${p.name}${summary ? ' · ' + summary : ''}`);
    setAdded(true); setTimeout(() => setAdded(false), 1400);
    setQty(1);
  };

  const addButton = (extra?: string) => (
    <button type="submit" disabled={!orderable} className={cx('btn btn-primary btn-lg flex-1 justify-between gap-3 pl-6 pr-2', added && 'is-added', extra)}>
      {added
        ? <span className="flex flex-1 items-center justify-center gap-2"><Icon name="check" size={19} stroke={2.6} />Added to cart</span>
        : <>
            <span className="flex items-center gap-2.5"><Icon name="bag" size={19} stroke={2} />{p.soldOut ? <span>Sold out</span> : <span><span className="sm:hidden">Add</span><span className="hidden sm:inline">Add to Cart</span></span>}</span>
            <span className="price-chip">{orderable ? peso(total) : '—'}</span>
          </>}
    </button>
  );

  return (
    <>
      <section className="pt-[76px] lg:pt-[100px]">
        <form className="lg:shell lg:pt-8" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <div className="hidden lg:block"><BackButton /></div>

          <div className="grid lg:mt-7 lg:grid-cols-2 lg:gap-14 xl:gap-24">
            {/* Photo */}
            <div className="relative lg:sticky lg:top-[124px] lg:self-start">
              <div className="warm-glow relative aspect-square overflow-hidden lg:rounded-[28px] lg:ring-1 lg:ring-white/[.08] lg:shadow-[0_40px_80px_-40px_rgba(0,0,0,1)]">
                <Img src={p.image} alt={`${p.name} from KATRIBO`} width={1000} height={1000} loading="eager" fetchPriority="high"
                  className="h-full w-full animate-[hero-in_1.1s_var(--ease-out-quint)_both] object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent lg:hidden" />
              </div>
              <BackButton onPhoto className="absolute left-4 top-4 lg:hidden" />
            </div>

            {/* Details */}
            <div className="shell relative -mt-6 pb-40 lg:mt-0 lg:px-0 lg:pb-0 lg:pt-1">
              <p className="eyebrow flex animate-rise items-center gap-3"><span aria-hidden="true" className="h-px w-8 bg-crema/80" />{p.category}</p>
              <h1 className="mt-3 animate-rise text-[40px] font-black leading-[1.02] tracking-[-0.035em] [animation-delay:60ms] sm:text-[52px] xl:text-[64px]">{p.name}</h1>
              <p className={cx('tabular mt-4 animate-rise [animation-delay:120ms]', orderable ? 'text-[34px] font-extrabold lg:text-[40px]' : 'text-[19px] font-semibold text-mute')}>
                {p.price != null ? peso(unit) : 'Price unavailable'}
                {orderable && !food && <span className="ml-3 align-middle text-[15px] font-semibold text-mute">{SIZES.find((s) => s.id === size)?.label}</span>}
              </p>
              {p.description && <p className="mt-5 max-w-[560px] animate-rise text-[17.5px] leading-[1.7] text-soft [animation-delay:180ms] lg:text-[19px]">{p.description}</p>}

              {!orderable && (
                <p className="mt-6 flex max-w-[560px] gap-3 rounded-2xl border border-white/15 bg-white/[.03] p-4 text-[16px] leading-relaxed text-soft">
                  <Icon name="info" size={19} className="mt-0.5 shrink-0" />{p.soldOut ? 'This drink is currently sold out. Please choose another favorite from the menu.' : 'This item can’t be ordered online yet — pricing is still being confirmed by the café.'}
                </p>
              )}

              {!food && (
                <>
                  <fieldset disabled={!orderable} className="mt-10 max-w-[560px] animate-rise [animation-delay:220ms] disabled:opacity-40">
                    <StepTitle n={1} title="Choose your size" />
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Size">
                      {SIZES.map((s) => {
                        const on = size === s.id;
                        return (
                          <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => setSize(s.id)} className={cx('opt-card', on && 'is-on')}>
                            <span className="opt-mark rounded-full"><span className={cx('h-2.5 w-2.5 rounded-full', on ? 'bg-ink' : 'bg-transparent')} /></span>
                            <span className="min-w-0">
                              <span className="block text-[17.5px] font-bold">{s.label}</span>
                              <span className="block text-[14.5px] font-medium text-mute">{s.add > 0 ? `+₱${s.add}` : 'Standard'}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset disabled={!orderable} className="mt-9 max-w-[560px] animate-rise [animation-delay:260ms] disabled:opacity-40">
                    <StepTitle n={2} title="Make it yours" note="Optional" />
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {ADDONS.map((a) => {
                        const on = addons.includes(a.id);
                        return (
                          <li key={a.id}>
                            <label className={cx('opt-card', on && 'is-on')}>
                              <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(a.id)} />
                              <span className="opt-mark rounded-[7px] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
                                <Icon name="check" size={14} stroke={2.8} />
                              </span>
                              <span className="flex-1 text-[16.5px] font-semibold">{a.label}</span>
                              <span className="tabular text-[15.5px] font-semibold text-soft">+₱{a.price}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>
                </>
              )}

              {/* Computer: order card at the end of the choices */}
              <div className="mt-10 hidden max-w-[560px] rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#161616,#0e0e0e)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_30px_60px_-36px_rgba(0,0,0,1)] lg:block">
                <div className="flex items-end justify-between gap-4 border-b border-white/[.08] pb-4">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold tracking-[.2em] text-mute uppercase">Your order</p>
                    <p className="mt-1 truncate text-[16px] font-semibold">{qty} × {p.name}</p>
                    {summary && <p className="mt-0.5 truncate text-[14.5px] text-mute">{summary}</p>}
                  </div>
                  <p className="tabular shrink-0 text-[30px] font-extrabold leading-none">{orderable ? peso(total) : '—'}</p>
                </div>
                <div className="mt-4 flex gap-3">
                  <Stepper value={qty} onChange={setQty} disabled={!orderable} />
                  {addButton()}
                </div>
              </div>
            </div>
          </div>

          {/* Phones/tablets: sticky order bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-ink/90 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-20px_40px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl lg:hidden">
            <div className="mx-auto max-w-xl">
              {summary && orderable && <p className="mb-2 truncate px-1 text-[13.5px] text-mute">{qty} × {summary}</p>}
              <div className="flex gap-2.5">
                <Stepper value={qty} onChange={setQty} disabled={!orderable} />
                {addButton()}
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className="shell pt-6 pb-16 lg:pt-24 lg:pb-24" aria-labelledby="rel-title">
        <SectionHead id="rel-title" title="You might also like" link="/menu" linkLabel="Full Menu" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 md:grid-cols-4 lg:gap-x-6 lg:gap-y-6">
          {related.map((r, i) => <Reveal key={r.id} delay={i * 60}><ProductCard product={r} /></Reveal>)}
        </div>
      </section>
    </>
  );
}

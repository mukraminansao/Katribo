import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { PageHeader, Reveal } from '../components/Primitives';
import { VisitBanner } from '../components/VisitBanner';
import { ProductCard } from '../components/ProductCard';
import { FILTERS, PRODUCTS, inFilter, type Filter, type Product } from '../data/menu';
import { useSearchParams } from '../lib/router';
import { searchMenu } from '../lib/menu-search';
import { useTitle } from '../lib/ui';

/**
 * Compact category pills shared by Menu and Gallery. The selected pill is white;
 * smaller screens can scroll sideways, and arrow keys move between categories.
 */
export function FilterBar({ value, onChange, options, label, counts }:
  { value: string; onChange: (v: string) => void; options: readonly string[]; label: string; counts?: Record<string, number> }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    track.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [value]);

  return (
    <div className="filter-fade no-scrollbar -mx-[clamp(20px,6vw,120px)] overflow-x-auto px-[clamp(20px,6vw,120px)] py-1 xl:mx-0 xl:overflow-visible xl:px-0">
      <div ref={track} role="tablist" aria-label={label}
        className="filter-track relative flex w-max gap-2 xl:max-w-full xl:flex-wrap"
        onKeyDown={(e) => {
          if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
          e.preventDefault();
          const i = options.indexOf(value);
          const next = e.key === 'Home' ? options[0] : e.key === 'End' ? options[options.length - 1] : options[(i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length];
          onChange(next);
          requestAnimationFrame(() => track.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
        }}>
        {options.map((o) => (
          <button key={o} type="button" role="tab" aria-selected={o === value} tabIndex={o === value ? 0 : -1}
            className="pill" onClick={() => onChange(o)}>
            {o}
            {counts?.[o] != null && <span className="pill-count" aria-label={`${counts[o]} items`}>{counts[o]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Shared outlined "View All" pill content. */
export function ViewAllInner({ label = 'View All' }: { label?: string }) {
  return <><span className="va-text">{label}</span><span className="va-icon"><Icon name="arrow" size={16} /></span></>;
}

/** One-line descriptions under each category heading. */
const BLURBS: Record<string, string> = {
  Coffee: 'Espresso classics, hot or iced.',
  Milkshake: 'Thick, creamy, and made for warm days.',
  Latte: 'Smooth espresso and milk, every flavour.',
  Macchiato: 'Bold espresso layered over milk.',
  Specialty: 'Our signature creations.',
  Pastries: 'Something sweet on the side.',
};

/** True once the sentinel above a sticky bar has scrolled out of view (bar is "stuck"). */
function useStuck() {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: '-110px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, stuck] as const;
}

/** Groups shown when "All" is selected (reference: one row per category with "View All"). */
const GROUPS = FILTERS.filter((f): f is Exclude<Filter, 'All' | 'Non-Coffee'> => f !== 'All' && f !== 'Non-Coffee');

function Grid({ items, keyPrefix, eagerCount = 8, row }: { items: Product[]; keyPrefix: string; eagerCount?: number; row?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-4 lg:gap-x-6 lg:gap-y-10 ${row ? '' : 'sm:grid-cols-3'}`}>
      {items.map((p, i) => (
        <div key={keyPrefix + p.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <ProductCard product={p} eager={i < eagerCount} className="menu-card" />
        </div>
      ))}
    </div>
  );
}

export default function Menu() {
  useTitle('Menu');
  const [params, setParams] = useSearchParams();
  const requested = params.get('cat') as Filter | null;
  const active: Filter = requested && FILTERS.includes(requested) ? requested : 'All';
  const query = params.get('q')?.trim() || '';
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  const pick = (f: string) => {
    setParams({ cat: f === 'All' ? null : f });
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  const matches = searchMenu(PRODUCTS, query);
  const counts = Object.fromEntries(FILTERS.map((f) => [f, matches.filter((p) => inFilter(p, f)).length]));
  const items = matches.filter((p) => inFilter(p, active));
  const [sentinel, stuck] = useStuck();

  return (
    <>
      <PageHeader eyebrow="The KATRIBO Menu" title="Our Menu" accent="freshly made" sub="Handcrafted drinks made for good people." />
      {query && <form role="search" aria-label="Refine menu search" className="shell mb-5" onSubmit={(event) => { event.preventDefault(); setParams({ q: draft.trim() || null }); }}>
        <div className="flex max-w-2xl items-center gap-2 rounded-xl border border-white/15 bg-white/[.03] p-2">
          <Icon name="search" size={20} className="ml-2 shrink-0 text-mute" />
          <input type="search" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={100} aria-label="Search this menu" className="h-11 min-w-0 flex-1 bg-transparent px-2 outline-none" />
          <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 hover:bg-white/10" aria-label="Update search"><Icon name="arrow" size={19} /></button>
        </div>
      </form>}

      <div ref={sentinel} aria-hidden="true" className="h-px" />
      <div className={`sticky top-[76px] z-30 border-b py-3 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500 lg:top-[100px] lg:py-4 ${stuck ? 'border-white/[.08] bg-ink/92 shadow-[0_18px_40px_-24px_rgba(0,0,0,.95)]' : 'border-transparent bg-ink/80'}`}>
        <div className="shell">
          <FilterBar value={active} onChange={pick} options={FILTERS} label="Menu categories" counts={counts} />
        </div>
      </div>

      <div className="shell pt-6 pb-16 md:pt-10 md:pb-24">
        {active === 'All' && !query ? (
          <div className="grid gap-12 md:gap-16">
            {GROUPS.map((g, gi) => {
              const list = PRODUCTS.filter((p) => p.category === g);
              if (!list.length) return null;
              const shown = list.slice(0, 4);
              return (
                <section key={g} aria-labelledby={`cat-${g}`}>
                  <Reveal className="mb-5 flex items-center justify-between gap-4 border-b border-white/[.07] pb-4 md:mb-7 md:pb-5">
                    <div className="min-w-0">
                      <h2 id={`cat-${g}`} className="text-[24px] font-extrabold tracking-[-0.02em] md:text-[32px]">
                        {g} <span className="ml-1 align-middle text-[14px] font-semibold text-mute md:text-[15px]">{list.length}</span>
                      </h2>
                      {BLURBS[g] && <p className="mt-1 text-[14px] text-mute md:text-[15.5px]">{BLURBS[g]}</p>}
                    </div>
                    <button type="button" onClick={() => pick(g)} className="view-all shrink-0" aria-label={`View all ${g}`}>
                      <ViewAllInner />
                    </button>
                  </Reveal>
                  <Grid items={shown} keyPrefix={g} eagerCount={gi === 0 ? 4 : 0} row />
                </section>
              );
            })}
          </div>
        ) : (
          <>
            <div className="mb-6 md:mb-8">
              <h2 className="text-[24px] font-extrabold tracking-[-0.02em] md:text-[32px]">{query ? `Results for “${query}”` : active} <span className="ml-1 align-middle text-[14px] font-semibold text-mute md:text-[15px]">{items.length}</span></h2>
              {query ? <button type="button" onClick={() => setParams({ q: null })} className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4">Clear search</button> : BLURBS[active] && <p className="mt-1 text-[14px] text-mute md:text-[15.5px]">{BLURBS[active]}</p>}
            </div>
            <Grid items={items} keyPrefix={active} />
            {items.length === 0 && <p className="rounded-2xl border border-white/10 p-8 text-soft">No menu items match. Try a different search or category.</p>}
          </>
        )}
      </div>

      <VisitBanner />
    </>
  );
}

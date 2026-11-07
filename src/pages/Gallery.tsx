import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/Icon';
import { Img, PageHeader } from '../components/Primitives';
import { PRODUCT_BY_ID } from '../data/menu';
import { IMAGES } from '../data/site';
import { cx, useScrollLock, useTitle } from '../lib/ui';
import { VisitBanner } from '../components/VisitBanner';
import { FilterBar } from './Menu';

const FILTERS = ['All', 'Drinks', 'Food', 'Interior', 'Equipment', 'The View'] as const;
type Cat = (typeof FILTERS)[number];

// Gallery photos remain viewable even when their menu item is hidden or removed.
const d = (id: string) => PRODUCT_BY_ID[id]?.image ?? `/images/drinks/${id}.jpg`;
// [src, alt, caption, categories, object-position]
const PHOTOS: [string, string, string, Cat[], string][] = [
  [d('caramel-macchiato'), 'Iced caramel macchiato in a KATRIBO cup', 'Caramel Macchiato', ['Drinks'], '50% 35%'],
  [IMAGES.sign, 'KATRIBO “Welcome to our backyard” wall sign', 'Welcome to our backyard', ['Interior'], '50% 40%'],
  [IMAGES.interior, 'The espresso bar facing the windows and the bay', 'The bar, by the bay', ['Interior', 'The View', 'Equipment'], '50% 50%'],
  [IMAGES.bar, 'Dual-group espresso machine and grinder', 'Espresso machine & grinder', ['Equipment'], '50% 45%'],
  [d('matcha-latte'), 'Iced matcha latte', 'Matcha Latte', ['Drinks'], '50% 35%'],
  [IMAGES.bay, 'Outdoor tables and the bay seen through the front windows', 'Our backyard view', ['The View'], '50% 50%'],
  [IMAGES.staff, 'The KATRIBO team behind the bar', 'The KATRIBO team', ['Interior'], '50% 55%'],
  [d('strawberry-milkshake'), 'Strawberry milkshake with whipped cream', 'Strawberry Milkshake', ['Drinks'], '50% 35%'],
  [d('spanish-latte'), 'Iced Spanish latte', 'Spanish Latte', ['Drinks'], '50% 35%'],
  [d('iced-latte'), 'Iced latte on dark stone with coffee beans', 'Iced Latte', ['Drinks'], '50% 50%'],
  [d('ube-milkshake'), 'Ube milkshake', 'Ube Milkshake', ['Drinks'], '50% 35%'],
  [d('chocolate-milkshake'), 'Chocolate milkshake with chocolate drizzle', 'Chocolate Milkshake', ['Drinks'], '50% 35%'],
  [d('cheesecake'), 'Slice of cheesecake with berry sauce', 'Cheesecake', ['Food'], '50% 50%'],
  [d('mango-milkshake'), 'Mango milkshake with fresh mango cubes', 'Mango Milkshake', ['Drinks'], '50% 45%'],
  [d('chocolate-cake'), 'Slice of layered chocolate cake', 'Chocolate Cake', ['Food'], '50% 50%'],
  [d('americano'), 'Hot americano in a glass mug', 'Americano', ['Drinks'], '50% 50%'],
  ['/images/drinks/cookies-cream.jpg', 'Cookies and cream drink topped with crushed cookies', 'Cookies & Cream', ['Drinks'], '50% 45%'],
];

function Lightbox({ list, index, onClose, onIndex }: { list: typeof PHOTOS; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  useScrollLock(true);
  const go = useCallback((dir: number) => onIndex((index + dir + list.length) % list.length), [index, list.length, onIndex]);
  const startX = useRef<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  useEffect(() => {
    strip.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);
  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go, onClose]);
  const [src, alt, cap] = list[index];
  return (
    <div role="dialog" aria-modal="true" aria-label="Image viewer" onClick={onClose}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const dx = e.changedTouches[0].clientX - startX.current; startX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      className="fixed inset-0 z-[110] flex animate-fade flex-col bg-black/95 backdrop-blur-md">
      <div className="flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
        <span className="tabular text-sm text-mute">{index + 1} / {list.length}</span>
        <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close viewer" className="grid h-11 w-11 place-items-center rounded-full border border-line hover:bg-white hover:text-ink"><Icon name="close" /></button>
      </div>
      <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4" onClick={(e) => e.stopPropagation()}>
        <img key={src} src={src} alt={alt} className="max-h-[calc(100svh-240px)] max-w-full animate-pop rounded-2xl object-contain" />
        <figcaption className="text-[15px] font-semibold">{cap}</figcaption>
      </figure>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-w-0 items-center justify-center gap-3">
          <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line hover:bg-white hover:text-ink md:h-12 md:w-12"><Icon name="arrow-left" /></button>
          <ul ref={strip} className="no-scrollbar flex min-w-0 max-w-[760px] flex-1 gap-2 overflow-x-auto px-1 py-1 md:flex-none" aria-label="All photos">
            {list.map(([tsrc, , tcap, , tpos], i) => (
              <li key={tsrc} className="shrink-0">
                <button type="button" onClick={() => onIndex(i)} aria-label={`Show ${tcap}`} aria-current={i === index ? 'true' : undefined}
                  className={cx('block h-12 w-12 overflow-hidden rounded-lg ring-2 transition-all md:h-16 md:w-16', i === index ? 'opacity-100 ring-white' : 'opacity-45 ring-transparent hover:opacity-80')}>
                  <img src={tsrc} alt="" loading="lazy" style={{ objectPosition: tpos }} className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => go(1)} aria-label="Next image" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line hover:bg-white hover:text-ink md:h-12 md:w-12"><Icon name="arrow" /></button>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  useTitle('Gallery');
  const [cat, setCat] = useState<Cat>('All');
  const [open, setOpen] = useState<number | null>(null);
  const list = PHOTOS.filter((p) => cat === 'All' || p[3].includes(cat));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, PHOTOS.filter((p) => f === 'All' || p[3].includes(f)).length]));
  return (
    <>
      <PageHeader eyebrow="Moments at KATRIBO" title="Our Gallery" accent="by the bay" sub="Moments, coffee, and the view.">
        <div className="mt-7 md:mt-9"><FilterBar value={cat} onChange={(v) => setCat(v as Cat)} options={FILTERS} label="Gallery categories" counts={counts} /></div>
      </PageHeader>
      <section className="shell pb-16 md:pb-24">
        <ul className="grid grid-flow-dense grid-cols-2 gap-3 [grid-auto-rows:180px] sm:gap-4 sm:[grid-auto-rows:240px] md:grid-cols-3 lg:grid-cols-4 lg:[grid-auto-rows:clamp(240px,19vw,330px)] lg:gap-5">
          {list.map(([src, alt, cap, cats, pos], i) => (
            <li key={src + cat} className={cx('animate-rise', cat === 'All' && (i === 0 || i === 6) && 'col-span-2 row-span-2', cat === 'All' && i === 2 && 'lg:row-span-2')} style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <button type="button" onClick={() => setOpen(i)} aria-label={`Open image: ${cap}`}
                className="group relative block h-full w-full cursor-zoom-in overflow-hidden rounded-2xl bg-ink-2">
                <Img src={src} alt={alt} style={{ objectPosition: pos }} className="h-full w-full object-cover transition-transform duration-[1s] ease-[var(--ease-out-quint)] group-hover:scale-[1.05]" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10 text-left text-[13px] font-semibold md:p-4 md:text-sm">
                  <span>{cap}</span><span className="hidden text-xs font-medium text-mute opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:inline">{cats[0]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-5 flex items-start gap-2 text-[12.5px] text-mute"><Icon name="info" size={15} className="mt-px shrink-0" />Café photos are KATRIBO’s own.</p>
      </section>
      <VisitBanner primary={{ to: '/contact', label: 'Visit Us' }} secondary={{ to: '/menu', label: 'See the Menu' }} />
      {/* Portal: the page wrapper's fade-in animation would otherwise keep the viewer under the fixed header */}
      {open != null && createPortal(<Lightbox list={list} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />, document.body)}
    </>
  );
}

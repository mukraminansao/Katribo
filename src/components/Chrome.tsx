/** Site chrome: header, mobile menu, search, mobile tab bar, footer, toast. */
import { useEffect, useRef, useState } from 'react';
import { IMAGES, SITE } from '../data/site';
import { useCart } from '../lib/cart';
import { Link, NavLink, useLocation } from '../lib/router';
import { cx, openCartDrawer, useScrolled, useScrollLock, useToast } from '../lib/ui';
import { Icon, type IconName } from './Icon';
import { Cursive, Placeholder } from './Primitives';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

function CartBadge({ className }: { className?: string }) {
  const { count } = useCart();
  const [bump, setBump] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) { setBump(true); const t = setTimeout(() => setBump(false), 400); prev.current = count; return () => clearTimeout(t); }
    prev.current = count;
  }, [count]);
  if (!count) return null;
  return (
    <span className={cx('tabular absolute grid h-5 min-w-5 place-items-center rounded-full bg-crema px-1 text-[11.5px] font-extrabold text-[#1b1006] lg:h-[22px] lg:min-w-[22px] lg:text-[12px]', bump && 'animate-bump', className)}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * KATRIBO logo (transparent PNG→WebP made from the brand artwork; drawn for dark backgrounds).
 * "mark" = cup + wordmark (header, menu); "full" = adds the EST 2024 line (footer).
 */
export function Logo({ variant = 'mark', className, alt = '' }: { variant?: 'mark' | 'full'; className?: string; alt?: string }) {
  const full = variant === 'full';
  return (
    <img src={full ? '/images/brand/katribo-logo.webp' : '/images/brand/katribo-logo-mark.webp'}
      width={full ? 1100 : 760} height={full ? 407 : 268} alt={alt} decoding="async" draggable={false}
      className={cx('block h-auto max-w-none select-none', className)} />
  );
}

export function Header({ onMenu, onSearch, searchOpen = false }: { onMenu: () => void; onSearch: () => void; searchOpen?: boolean }) {
  const scrolled = useScrolled(16);
  const { pathname } = useLocation();
  const overHero = pathname === '/' || pathname === '/about';
  const { count } = useCart();
  return (
    <header className={cx('site-header fixed inset-x-0 top-0 z-50 bg-ink transition-[border-color,box-shadow] duration-500',
      scrolled || !overHero ? 'border-b border-white/[.07] shadow-[0_10px_30px_-12px_rgba(0,0,0,.8)]' : 'border-b border-transparent')}>
      <div className="header-layout relative mx-auto flex h-[76px] max-w-[2200px] items-center gap-3 px-[clamp(16px,2.6vw,52px)] lg:h-[100px] lg:gap-6">
        <Link to="/" className="-ml-1 flex shrink-0 items-center transition-opacity hover:opacity-90" aria-label="KATRIBO home"><Logo className="w-[132px] sm:w-[164px] lg:w-[clamp(150px,13vw,220px)]" /></Link>

        <nav aria-label="Primary" className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex w-full items-center justify-evenly gap-3">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => cx('nav-link', isActive && 'is-active')}>{n.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions ml-auto flex shrink-0 items-center gap-0 sm:gap-1">
          <button type="button" className="icon-btn header-tool" onClick={onSearch} data-menu-search-trigger aria-label="Search menu" title="Search menu (Ctrl+K or /)" aria-haspopup="dialog" aria-expanded={searchOpen} aria-controls="menu-search-dialog" aria-keyshortcuts="Control+K Meta+K /"><Icon name="search" size={30} stroke={2.2} /></button>
          <button type="button" onClick={() => openCartDrawer()} className="icon-btn header-tool relative" aria-label={count ? `Open cart, ${count} item${count > 1 ? 's' : ''}` : 'Open cart'}>
              <Icon name="bag" size={30} stroke={2} /><CartBadge className="right-0.5 top-0.5" />
          </button>
          <Link to="/menu" className="btn btn-primary ml-2 hidden h-[48px] px-6 text-[15px] font-bold lg:inline-flex xl:h-[54px] xl:px-8 xl:text-[16px]">Order Now</Link>
          <button type="button" className="icon-btn lg:hidden" onClick={onMenu} aria-label="Open menu"><Icon name="menu" size={28} stroke={2} /></button>
        </div>
      </div>
    </header>
  );
}

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useScrollLock(open);
  const { pathname } = useLocation();
  const { count } = useCart();
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const items = [...NAV, { to: '/cart', label: 'Cart' }];
  const socials: [keyof typeof SITE.social, IconName][] = [['facebook', 'facebook'], ['instagram', 'instagram'], ['tiktok', 'tiktok']];
  return (
    <div className="fixed inset-0 z-[90] isolate animate-fade overflow-y-auto overscroll-contain bg-ink lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      {/* Café photo behind everything, slowly settling in, deeply shaded */}
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img src={IMAGES.interior} alt="" className="h-full w-full animate-[slow-zoom_7s_var(--ease-out-quint)_both] object-cover [object-position:50%_50%] opacity-35 saturate-[.7]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,.88)_0%,rgba(8,8,8,.72)_40%,rgba(8,8,8,.96)_78%,#080808_100%)]" />
      </div>

      <div className="flex min-h-full flex-col">
        <div className="flex h-[76px] shrink-0 items-center justify-between px-[clamp(16px,2.6vw,52px)]">
          <Logo className="-ml-1 w-[150px] sm:w-[164px]" alt="KATRIBO" />
          <button type="button" onClick={onClose} aria-label="Close menu" autoFocus
            className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/[.06] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:bg-white hover:text-ink active:scale-90">
            <Icon name="close" size={22} />
          </button>
        </div>

        <nav className="shell mt-2 sm:mt-8" aria-label="Mobile">
          <p className="eyebrow mb-3 flex animate-fade items-center gap-3"><span aria-hidden="true" className="h-px w-8 bg-crema/80" />Navigate</p>
          <ul>
            {items.map((n, i) => {
              const isActive = n.to === '/' ? pathname === '/' : pathname === n.to || pathname.startsWith(n.to + '/');
              return (
              <li key={n.to} className="animate-[menu-in_.7s_var(--ease-out-quint)_both] border-b border-white/[.08]" style={{ animationDelay: `${80 + i * 55}ms` }}>
                <NavLink to={n.to} end={n.to === '/'}
                  className={cx('group flex items-center gap-4 py-3 transition-colors sm:py-4', isActive ? 'text-white' : 'text-white/45 hover:text-white')}>
                      <span className="tabular w-7 shrink-0 text-[12.5px] font-semibold tracking-[.08em] text-white/40">{String(i + 1).padStart(2, '0')}</span>
                      <span className="display flex-1 text-[38px] leading-none sm:text-[54px]">{n.label}</span>
                      {n.to === '/cart' && count > 0 && <span className="tabular rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-ink">{count}</span>}
                      {isActive
                        ? <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[.18em] text-white/70 uppercase"><span className="h-2 w-2 rounded-full bg-crema shadow-[0_0_12px_rgba(211,154,95,.95)]" />Here</span>
                        : <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:text-ink"><Icon name="arrow-up-right" size={17} /></span>}
                </NavLink>
              </li>
              );
            })}
          </ul>
        </nav>

        <div className="shell mt-auto grid gap-3.5 pt-7 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <div className="animate-rise rounded-2xl border border-white/10 bg-white/[.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.07)] backdrop-blur-md [animation-delay:420ms]">
            <div className="flex items-start gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink"><Icon name="pin" size={19} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-semibold tracking-[.2em] text-mute uppercase">Visit us</p>
                <p className="mt-1 text-[15px] font-semibold">Katribo Slow Coffee Bar</p>
                <p className="text-[13.5px] text-soft">{SITE.address ?? 'Address to be confirmed'}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {SITE.address ? (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Katribo Slow Coffee Bar, ' + SITE.address)}`} target="_blank" rel="noopener"
                      className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold underline-offset-4 hover:underline">Get directions <Icon name="arrow-up-right" size={13} /></a>
                  ) : <span />}
                  <ul className="flex gap-1.5">
                    {socials.map(([k, icon]) => (
                      <li key={k}>
                        {SITE.social[k]
                          ? <a href={SITE.social[k]!} target="_blank" rel="noopener" aria-label={`KATRIBO on ${k}`} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 transition-colors hover:bg-white hover:text-ink"><Icon name={icon} size={16} /></a>
                          : <span title={`${k} link — to be confirmed`} className="grid h-9 w-9 place-items-center rounded-full border border-dashed border-white/15 text-white/35"><Icon name={icon} size={16} /></span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Link to="/menu" className="btn btn-primary btn-lg w-full animate-rise [animation-delay:500ms]"><span>Order Now</span><Icon name="arrow" size={17} className="arrow" /></Link>
          <Cursive as="p" text="Good coffee, better people." className="animate-fade text-center text-[30px] text-soft [animation-delay:600ms]" />
        </div>
      </div>
    </div>
  );
}

export function TabBar({ onMore }: { onMore: () => void }) {
  const { pathname } = useLocation();
  const tabs: { to: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
    { to: '/', label: 'Home', icon: 'home', match: (p) => p === '/' },
    { to: '/menu', label: 'Menu', icon: 'book', match: (p) => p.startsWith('/menu') },
    { to: '/cart', label: 'Order', icon: 'bag', match: (p) => p === '/cart' || p === '/checkout' },
    { to: '/gallery', label: 'Gallery', icon: 'image', match: (p) => p === '/gallery' },
  ];
  const moreActive = pathname === '/about' || pathname === '/contact';
  const item = 'relative flex flex-1 flex-col items-center gap-1 pt-2 pb-1.5 text-[10.5px] font-semibold transition-colors';
  return (
    <nav aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.07] bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((t) => {
          const on = t.match(pathname);
          return (
            <Link key={t.to} to={t.to} aria-current={on ? 'page' : undefined} className={cx(item, on ? 'text-white' : 'text-white/45')}>
              <span className={cx('relative grid h-8 w-14 place-items-center rounded-full transition-all duration-500 ease-[var(--ease-out-quint)]', on ? 'bg-white/[.14] shadow-[inset_0_1px_0_rgba(255,255,255,.12)]' : 'scale-90')}>
                <Icon name={t.icon} size={22} />
                {t.to === '/cart' && <CartBadge className="right-1 -top-1.5" />}
              </span>
              {t.label}
            </Link>
          );
        })}
        <button type="button" onClick={onMore} className={cx(item, moreActive ? 'text-white' : 'text-white/45')}>
          <span className={cx('grid h-8 w-14 place-items-center rounded-full transition-all duration-500 ease-[var(--ease-out-quint)]', moreActive ? 'bg-white/[.14] shadow-[inset_0_1px_0_rgba(255,255,255,.12)]' : 'scale-90')}>
            <Icon name="more" size={22} />
          </span>More
        </button>
      </div>
    </nav>
  );
}

export function Footer() {
  const socials: [keyof typeof SITE.social, IconName][] = [['facebook', 'facebook'], ['instagram', 'instagram'], ['tiktok', 'tiktok']];
  return (
    <footer className="relative overflow-hidden border-t border-white/[.07] bg-ink">
      <div className="shell grid grid-cols-2 gap-10 pt-14 pb-10 md:grid-cols-[2fr_1fr_1.5fr_1fr] md:pt-20 md:pb-14">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" aria-label="KATRIBO home" className="-ml-2 inline-block"><Logo variant="full" className="w-[250px] md:w-[290px]" /></Link>
          <p className="mt-2 text-sm font-bold tracking-[.12em] uppercase">Welcome to our backyard.</p>
          <Cursive as="p" text="Good coffee, better people." className="mt-3 -rotate-2 text-[42px] text-soft" />
                  </div>
        <nav aria-label="Footer">
          <h3 className="eyebrow mb-3">Explore</h3>
          <ul className="grid gap-2.5 text-[15.5px] text-soft">
            {NAV.map((n) => <li key={n.to}><Link to={n.to} className="transition-colors hover:text-white">{n.label}</Link></li>)}
          </ul>
        </nav>
        <div className="col-span-2 md:col-span-1 md:order-none order-last">
          <h3 className="eyebrow mb-3">Visit</h3>
          <ul className="grid gap-3 text-[14.5px] text-soft">
            <li className="flex gap-2.5"><Icon name="pin" size={16} className="mt-0.5 shrink-0 text-mute" /><Placeholder value={SITE.address} label="Address — to be confirmed" /></li>
            <li className="flex gap-2.5"><Icon name="clock" size={16} className="mt-0.5 shrink-0 text-mute" /><Placeholder value={SITE.hours} label="Opening hours — to be confirmed" /></li>
            <li className="flex gap-2.5"><Icon name="mail" size={16} className="mt-0.5 shrink-0 text-mute" /><Placeholder value={SITE.email} label="Email — to be confirmed" /></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-3">Follow</h3>
          <ul className="flex gap-2">
            {socials.map(([key, icon]) => (
              <li key={key}>
                {SITE.social[key]
                  ? <a href={SITE.social[key]!} target="_blank" rel="noopener" aria-label={`KATRIBO on ${key}`} className="grid h-10 w-10 place-items-center rounded-full border border-line transition-colors hover:bg-white hover:text-ink"><Icon name={icon} size={18} /></a>
                  : <span title={`${key} link — to be confirmed`} className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-line text-white/35"><Icon name={icon} size={18} /></span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="shell flex flex-wrap justify-between gap-2 border-t border-white/[.07] py-5 text-[12.5px] text-mute">
        <p>© {new Date().getFullYear()} KATRIBO. All rights reserved.</p>
        <button type="button" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-1.5 font-semibold text-soft transition-colors hover:text-white">
          Back to top <Icon name="arrow" size={14} className="-rotate-90" />
        </button>
      </div>
    </footer>
  );
}

export function Toast() {
  const t = useToast();
  const { pathname } = useLocation();
  if (!t) return null;
  return (
    <div key={t.id} role="status" aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(20px+env(safe-area-inset-bottom))] z-[120] mx-auto flex max-w-sm animate-rise items-center gap-3 rounded-2xl bg-white p-2 pr-2.5 text-ink shadow-[0_24px_60px_-12px_rgba(0,0,0,.8)] sm:bottom-8">
      {t.image && <img src={t.image} alt="" className="h-11 w-11 rounded-xl object-cover [object-position:50%_35%]" />}
      <span className="flex-1 text-sm font-semibold">{t.title}</span>
      {t.action && pathname !== t.action.to && (
        <Link to={t.action.to} className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white">{t.action.label}</Link>
      )}
    </div>
  );
}

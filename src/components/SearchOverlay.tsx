import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { PRODUCTS } from '../data/menu';
import { searchMenu } from '../lib/menu-search';
import { useNavigate } from '../lib/router';
import { peso, useScrollLock } from '../lib/ui';
import { Icon } from './Icon';

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  useScrollLock(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const id = useId();
  const listId = `${id}-results`;
  const hasQuery = query.trim().length > 0;
  const matches = useMemo(() => searchMenu(PRODUCTS, query), [query]);
  const picks = useMemo(() => {
    const ids = ['iced-latte', 'caramel-macchiato', 'spanish-latte', 'matcha-latte', 'chocolate-milkshake'];
    const chosen = ids.map((key) => PRODUCTS.find((p) => p.id === key)).filter((p) => p != null);
    return [...chosen, ...PRODUCTS.filter((p) => !ids.includes(p.id))];
  }, []);
  const results = (hasQuery ? matches : picks).slice(0, hasQuery ? 8 : 5);
  const selected = results.length ? Math.min(active, results.length - 1) : -1;

  useEffect(() => {
    const modal = dialog.current!;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.showModal();
    input.current?.focus({ preventScroll: true });
    return () => {
      modal.close();
      if (previous?.isConnected && previous !== document.body) previous.focus({ preventScroll: true });
      else document.querySelector<HTMLButtonElement>('[data-menu-search-trigger]')?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (selected >= 0) document.getElementById(`${id}-option-${selected}`)?.scrollIntoView({ block: 'nearest' });
  }, [id, selected, query]);

  const go = (path: string) => { onClose(); navigate(path); };
  const clear = () => { setQuery(''); setActive(0); input.current?.focus(); };
  const countText = hasQuery ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}` : 'Start exploring';

  return (
    <dialog ref={dialog} id="menu-search-dialog" className="menu-search-dialog" aria-labelledby={`${id}-title`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const b = event.currentTarget.getBoundingClientRect();
        if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) onClose();
      }}>
      <header className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <h2 id={`${id}-title`} className="text-lg font-bold sm:text-xl">Search the menu</h2>
        <button type="button" className="icon-btn shrink-0" onClick={onClose} aria-label="Close search"><Icon name="close" size={22} /></button>
      </header>
      <div className="menu-search-field mx-4 mt-3 flex items-center gap-3 rounded-xl border border-white/15 bg-black/25 px-3 sm:mx-6">
        <Icon name="search" size={22} className="shrink-0 text-mute" />
        <input ref={input} type="search" role="combobox" aria-label="Search menu items" aria-autocomplete="list" aria-expanded="true"
          aria-controls={listId} aria-activedescendant={selected < 0 ? undefined : `${id}-option-${selected}`} aria-describedby={`${id}-status`}
          autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={100} value={query}
          onChange={(event) => { setQuery(event.target.value); setActive(0); }} placeholder="Search drinks, flavors, or categories…"
          className="menu-search-input h-14 min-w-0 flex-1 bg-transparent text-base outline-none sm:text-lg"
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              if (results.length) setActive((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (selected >= 0) go(`/menu/${results[selected].id}`);
            }
          }} />
        {query && <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-mute hover:bg-white/10 hover:text-white" onClick={clear} aria-label="Clear search"><Icon name="close" size={18} /></button>}
      </div>
      <p id={`${id}-status`} role="status" aria-live="polite" className="px-5 pt-4 pb-2 text-xs font-semibold tracking-wider text-mute uppercase sm:px-7">{countText}</p>
      <ul id={listId} role="listbox" aria-label="Menu search results" className="menu-search-results m-2 min-h-0 overflow-y-auto overscroll-contain sm:mx-4">
        {results.map((product, index) => (
          <li key={product.id} id={`${id}-option-${index}`} role="option" aria-selected={selected === index}>
            <a href={`/menu/${product.id}`} tabIndex={-1} onPointerMove={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); go(`/menu/${product.id}`); }}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${selected === index ? 'bg-white/[.08]' : 'hover:bg-white/[.04]'}`}>
              <img src={product.image} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0 flex-1"><strong className="block truncate text-[15px] font-semibold sm:text-base">{product.name}</strong><span className="text-xs text-mute sm:text-sm">{product.category}</span></span>
              <span className="tabular max-w-[80px] text-right text-sm text-soft">{product.price == null ? 'Price unavailable' : peso(product.price)}</span>
            </a>
          </li>
        ))}
      </ul>
      {results.length === 0 && <div className="px-6 py-7 text-center"><p className="text-lg font-semibold">{hasQuery ? 'No matches found' : 'The menu is empty right now'}</p><p className="mt-2 text-sm text-mute">{hasQuery ? 'Try a different drink name, flavor, or category.' : 'Please check back shortly.'}</p></div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-7">
        <p className="hidden text-xs text-mute sm:block">↑ ↓ Navigate · Enter Select · Esc Close</p>
        <button type="button" className="ml-auto inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline" onClick={() => go(hasQuery && matches.length ? `/menu?q=${encodeURIComponent(query.trim())}` : '/menu')}>
          {hasQuery && matches.length ? `View all ${matches.length} ${matches.length === 1 ? 'result' : 'results'}` : 'Browse the full menu'}<Icon name="arrow" size={16} />
        </button>
      </footer>
    </dialog>
  );
}

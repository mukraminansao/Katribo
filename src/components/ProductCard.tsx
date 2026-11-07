import { useState } from 'react';
import type { Product } from '../data/menu';
import { cart } from '../lib/cart';
import { Link } from '../lib/router';
import { cx, openCartDrawer } from '../lib/ui';
import { Icon } from './Icon';
import { Img } from './Primitives';

export function AddButton({ product, className }: { product: Product; className?: string }) {
  const [done, setDone] = useState(false);
  const available = product.price != null && !product.soldOut;
  return (
    <button type="button" disabled={!available}
      className={cx('circle-btn', done && 'is-done', className)}
      title={available ? undefined : product.soldOut ? 'Sold out' : 'Price unavailable'}
      aria-label={available ? `Add ${product.name} to cart` : `${product.name} — ${product.soldOut ? 'sold out' : 'price unavailable'}`}
      onClick={(e) => {
        e.preventDefault();
        if (!cart.add(product.id)) return;
        setDone(true);
        setTimeout(() => setDone(false), 1100);
        openCartDrawer(product.name);
      }}>
      <Icon name={done ? 'check' : 'plus'} size={17} stroke={2.4} />
    </button>
  );
}

/**
 * Drink card: a raised dark card holding the photo (with a glass category tag),
 * a large readable name and price, and the glossy ⊕ button. The whole card links to the drink.
 */
export function ProductCard({ product, eager, className, size = 'md' }:
  { product: Product; eager?: boolean; className?: string; size?: 'sm' | 'md' }) {
  const href = `/menu/${product.id}`;
  const sm = size === 'sm';
  return (
    <article className={cx('product-card group relative flex h-full flex-col rounded-[22px] p-2 sm:p-2.5', className)}>
      <div className="warm-glow relative aspect-square overflow-hidden rounded-[16px] ring-1 ring-white/[.06]">
        <Img src={product.image} alt={`${product.name} from KATRIBO`} width={1000} height={1000}
          loading={eager ? 'eager' : 'lazy'}
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out-quint)] group-hover:scale-[1.06]" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_-40px_60px_-30px_rgba(0,0,0,.65)]" />
        <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10.5px] font-bold tracking-[.14em] text-white/90 uppercase backdrop-blur-md sm:left-3 sm:top-3 sm:text-[11px]">
          {product.category}
        </span>
        {product.soldOut ? <span className="absolute right-3 bottom-3 rounded-full border border-crema/40 bg-black/85 px-3 py-2 text-[12px] font-bold text-crema backdrop-blur-md">Sold out</span> : null}
      </div>
      <div className={cx('grid flex-1 grid-cols-[minmax(0,1fr)_auto] content-end items-end gap-x-2.5 gap-y-2 px-1.5', sm ? 'pt-3 pb-1' : 'pt-3.5 pb-1.5 sm:px-2')}>
          <h3 className={cx('col-span-2 min-h-[2.4em] min-w-0 font-bold leading-[1.2] tracking-[-0.01em] text-white [overflow-wrap:anywhere]', sm ? 'text-[14.5px] sm:text-[15.5px]' : 'text-[15.5px] sm:text-[17px] lg:text-[18px]')}>
            <Link to={href} className="after:absolute after:inset-0 after:rounded-[22px] after:content-['']">{product.name}</Link>
          </h3>
          <p className={cx('tabular min-w-0 self-center leading-tight [overflow-wrap:anywhere]', product.price == null ? 'text-[12.5px] font-medium text-mute sm:text-[13.5px]' : 'text-[16px] font-extrabold text-white sm:text-[17.5px]')}>
            {product.price == null ? 'Price unavailable' : (<><span className="mr-0.5 text-[.8em] font-bold text-soft">₱</span>{product.price.toLocaleString('en-PH')}</>)}
          </p>
        <AddButton product={product} className="relative z-10" />
      </div>
    </article>
  );
}

import { useState } from 'react';
import { Icon } from '../components/Icon';
import { ButtonLink, Cursive, Img, Reveal, SectionHead } from '../components/Primitives';
import { BrandHighlights } from '../components/BrandHighlights';
import { ProductCard } from '../components/ProductCard';
import { PRODUCTS, PRODUCT_BY_ID, SIZES, pick, unitPrice, type SizeId } from '../data/menu';
import { IMAGES, SITE } from '../data/site';
import { cart } from '../lib/cart';
import { Link } from '../lib/router';
import { cx, openCartDrawer, peso, useParallax, useTitle } from '../lib/ui';

/** Round ▶ button + "Watch Story", sized to match the main button (reference). */
function StoryLink({ className }: { className?: string }) {
  return (
    <Link to="/about" className={cx('group inline-flex items-center gap-3.5 text-[16.5px] font-semibold', className)}>
      <span className="hero-story-circle grid h-[58px] w-[58px] place-items-center rounded-full border-[1.5px] border-white/85 transition-colors duration-300 group-hover:bg-white group-hover:text-ink">
        <Icon name="play" size={22} className="ml-0.5" />
      </span>
      Watch Story
    </Link>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title"
      className="home-first-screen relative isolate flex flex-col overflow-hidden pt-[76px] lg:pt-[100px]">
      {/* Whole hero = the photo: the soft, cup-free left part of the shot fills every edge (no flat black)… */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
        <img src={IMAGES.heroBg} alt="" width={520} height={1214} decoding="async"
          className="h-full w-full object-cover [object-position:50%_60%]" />
      </div>
      {/* …and the sharp photo sits centre-right, its left and right edges dissolving into the blur */}
      {/* Darken the top so the dark header melts into the photo (no visible edge) */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[300px] bg-[linear-gradient(180deg,var(--color-ink)_76px,rgba(8,8,8,.72)_130px,rgba(8,8,8,.3)_200px,transparent_100%)] lg:h-[400px] lg:bg-[linear-gradient(180deg,var(--color-ink)_100px,rgba(8,8,8,.55)_150px,rgba(8,8,8,.18)_230px,transparent_100%)]" />
      {/* Gentle shade behind the text only, and a short fade into the next section */}
      <div aria-hidden="true" className="hero-floor-shade absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,.3)_0%,rgba(0,0,0,.12)_38%,transparent_55%),linear-gradient(0deg,var(--color-ink)_0%,transparent_9%)]" />

      <div className="hero-scene relative isolate flex flex-col">
      <div aria-hidden="true" className="hero-photo-desktop absolute inset-y-0 right-[3%] -z-10 hidden aspect-[1295/1214] [mask-image:linear-gradient(90deg,transparent_0%,#000_38%,#000_80%,transparent_100%)] lg:block">
        <img src={IMAGES.hero} alt="" width={1295} height={1214} fetchPriority="high" decoding="async"
          className="h-full w-full object-cover" />
      </div>
      {/* Phones/tablets: cup to the right of the headline */}
      <div aria-hidden="true" className="pointer-events-none absolute right-[-14%] top-[28px] -z-10 aspect-square w-[74%] max-w-[520px] [mask-image:linear-gradient(90deg,transparent_0%,#000_38%),linear-gradient(0deg,transparent_0%,#000_28%,#000_94%,transparent_100%)] [-webkit-mask-composite:source-in] [mask-composite:intersect] sm:right-[-4%] sm:w-[56%] lg:hidden">
        <img src={IMAGES.heroSquare} alt="" width={975} height={975} fetchPriority="high"
          className="h-full w-full object-cover" />
      </div>

      <p className="hero-original-slogan script pointer-events-none absolute z-10 text-white">
        <span className="slogan-phrase"><span className="slogan-word">Good</span> <span className="slogan-word">Coffee</span></span>
        <span className="slogan-phrase"><span className="slogan-word">Better</span> <span className="slogan-word">People.</span></span>
      </p>

      <div className="hero-copy-shell shell relative z-10 flex flex-1 items-start pt-6 sm:pt-10 lg:items-center lg:pt-0">
        <div className="hero-copy-main max-w-[720px]">
          <p className="hero-eyebrow animate-rise whitespace-nowrap font-semibold text-soft uppercase">
            Coffee <span className="mx-1 text-white/40">/</span> Milkshake <span className="mx-1 text-white/40">/</span> <span className="text-mute">Good Vibes</span>
          </p>
          <h1 id="hero-title" className="display grunge mt-4 animate-rise text-[64px] text-[#ececec] [animation-delay:80ms] sm:text-[96px] lg:mt-5 lg:text-[clamp(96px,9.4vw,184px)]">
            Brew<br />Good<br /><span className="text-outline">Days</span>
          </h1>
          <p className="hero-brand mt-5 animate-rise text-[20px] font-extrabold [animation-delay:160ms] lg:mt-7 lg:text-[26px]">KATRIBO</p>
          <p className="hero-intro mt-2 max-w-[60%] animate-rise text-[14.5px] leading-[1.6] text-soft [animation-delay:220ms] sm:max-w-[420px] lg:text-[17.5px]">
            {SITE.intro}
          </p>
          {/* Phones: single Order Now (reference) — desktop: Explore Menu + Watch Story */}
          <div className="mt-6 animate-rise [animation-delay:300ms] lg:hidden">
            <ButtonLink to="/menu" arrow>Order Now</ButtonLink>
          </div>
          <div className="hero-actions mt-9 hidden animate-rise items-center gap-7 [animation-delay:300ms] lg:flex">
            <ButtonLink to="/menu" size="lg" arrow className="min-w-[200px]">Explore Menu</ButtonLink>
            <StoryLink />
          </div>
        </div>
      </div>

      </div>

      <div className="home-hero-highlights shell relative z-10 mt-10 lg:mt-0">
        <BrandHighlights />
      </div>
    </section>
  );
}

function Favorites() {
  const items = PRODUCTS.filter(p => p.featured).sort((a, b) => (a.featuredRank || 10001) - (b.featuredRank || 10001) || a.id.localeCompare(b.id));
  if (!items.length) return null;
  return (
    <section className="section-y" aria-labelledby="fav-title">
      <div className="shell">
        <SectionHead id="fav-title" title="Our Favorites" accent="most loved" sub="The drinks our regulars keep coming back for." link="/menu" />
        <div className="no-scrollbar -mx-[clamp(20px,6vw,120px)] flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[clamp(20px,6vw,120px)] px-[clamp(20px,6vw,120px)] pt-2 pb-4 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible lg:mx-0 lg:px-0 xl:gap-7">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70} className="w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto">
              <ProductCard product={p} eager={i < 4} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ['Good Coffee', 'Better People', 'Welcome to Our Backyard', 'By the Bay'];
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <span key={w} className="flex items-center">
          <span className={cx('display px-6 text-[36px] leading-none md:px-10 md:text-[60px]', i % 2 === 1 && 'text-outline')}>{w}</span>
          <Icon name="spark" size={28} className="text-white/45" />
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className="marquee overflow-hidden border-y border-white/[.08] py-5 md:py-7">
      <div className="marquee-track">{row('a')}{row('b')}</div>
    </div>
  );
}

function Signature() {
  const p = PRODUCT_BY_ID['caramel-macchiato'];
  const also = pick(['spanish-latte', 'brown-sugar-macchiato', 'white-chocolate-mocha']);
  const [size, setSize] = useState<SizeId>('regular');
  if (!p) return null;
  const price = unitPrice(p.id, size, []);
  return (
    <section className="section-y" aria-labelledby="sig-title">
      <div className="shell grid items-center gap-8 lg:grid-cols-2 lg:gap-16 xl:gap-24">
        <Reveal className="relative">
          <Link to={`/menu/${p.id}`} className="warm-glow group relative block aspect-square overflow-hidden rounded-3xl ring-1 ring-white/[.07]">
            <Img src={p.image} alt={`${p.name} from KATRIBO`} width={1000} height={1000}
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-quint)] group-hover:scale-[1.04]" />
          </Link>
          <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-[12px] font-bold tracking-[.16em] text-ink uppercase sm:left-6 sm:top-6">Signature</span>
        </Reveal>
        <Reveal delay={100}>
          <p className="eyebrow">Signature drink</p>
          <h2 id="sig-title" className="display mt-4 text-[44px] sm:text-[64px] xl:text-[80px]">{p.name === 'Caramel Macchiato' ? <>Caramel<br />Macchiato</> : p.name}</h2>
          <p className="tabular mt-4 text-[30px] font-bold lg:text-[34px]">{peso(price)}</p>
          <p className="mt-4 max-w-[500px] text-[16px] leading-relaxed text-mute lg:text-[17px]">{p.description}</p>
          <div className="mt-7 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Size">
            {SIZES.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={size === s.id} onClick={() => setSize(s.id)}
                className={cx('chip min-w-[110px] justify-center', size === s.id && 'is-active')}>
                {s.label}{s.add > 0 && <span className="font-medium opacity-70">+₱{s.add}</span>}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn btn-primary btn-lg" disabled={price == null || p.soldOut}
              onClick={() => { if (cart.add(p.id, { size })) openCartDrawer(`${p.name} · ${size === 'large' ? 'Large' : 'Regular'}`); }}>
              <span>{p.soldOut ? 'Sold out' : 'Add to Cart'}</span><span className="tabular border-l border-ink/20 pl-3">{peso(price)}</span>
            </button>
            <ButtonLink to={`/menu/${p.id}`} variant="outline" size="lg">View Details</ButtonLink>
          </div>
          <div className="mt-10 border-t border-white/[.08] pt-7">
            <p className="eyebrow flex items-center gap-3"><span aria-hidden="true" className="h-px w-8 bg-crema/80" />Also try</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {also.map((a) => (
                <li key={a.id}>
                  <Link to={`/menu/${a.id}`} className="also-card group flex h-full items-center gap-3.5 rounded-2xl p-2.5 pr-3.5 sm:flex-col sm:items-stretch sm:gap-3 sm:p-2.5">
                    <span className="warm-glow block h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl ring-1 ring-white/[.06] sm:aspect-[4/3] sm:h-auto sm:w-full">
                      <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover [object-position:50%_40%] transition-transform duration-[900ms] ease-[var(--ease-out-quint)] group-hover:scale-110" />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-3 sm:px-1 sm:pb-1">
                      <span className="min-w-0 flex-1">
                        <strong className="block text-[15px] leading-snug font-semibold sm:text-[14px] lg:text-[15px]">{a.name}</strong>
                        <span className="tabular mt-0.5 block text-[14px] font-semibold text-soft">{peso(a.price)}</span>
                      </span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[.03] transition-all duration-500 group-hover:border-white group-hover:bg-white group-hover:text-ink">
                        <Icon name="arrow" size={15} className="transition-transform duration-500 group-hover:-rotate-45" />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SpaceBanner() {
  const img = useParallax<HTMLImageElement>(-0.04);
  return (
    <section className="pb-16 md:pb-24" aria-labelledby="space-title">
      <div className="shell">
        <Reveal className="grain relative flex min-h-[440px] items-end overflow-hidden rounded-3xl md:min-h-[560px] md:items-center">
          <img ref={img} src={IMAGES.interior} alt="Inside KATRIBO: the espresso bar and tables, with large windows looking out over the bay" loading="lazy"
            className="absolute inset-0 h-[115%] w-full object-cover [object-position:50%_58%]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,8,8,.95)_0%,rgba(8,8,8,.55)_60%,rgba(8,8,8,.2)_100%)] md:bg-[linear-gradient(90deg,rgba(8,8,8,.94)_0%,rgba(8,8,8,.7)_38%,rgba(8,8,8,.05)_72%)]" />
          <div className="relative z-[2] p-7 sm:p-12 lg:p-20">
            <Cursive as="p" text="our backyard" className="-rotate-3 text-[52px] text-soft md:text-[68px]" />
            <h2 id="space-title" className="display mt-2 text-[40px] sm:text-[56px] lg:text-[72px]">
              A Space for<br />Good Coffee<br /><span className="text-outline">&amp; Good People</span>
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <ButtonLink to="/gallery" arrow>Explore Gallery</ButtonLink>
              <ButtonLink to="/contact" variant="outline">Visit Us</ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  useTitle('');
  return (
    <>
      <Hero />
      <Favorites />
      <Marquee />
      <Signature />
      <SpaceBanner />
    </>
  );
}

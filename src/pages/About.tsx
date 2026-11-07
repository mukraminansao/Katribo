import { BrandHighlights } from '../components/BrandHighlights';
import { ButtonLink, Img, Reveal } from '../components/Primitives';
import { IMAGES } from '../data/site';
import { useParallax, useTitle } from '../lib/ui';

const PILLARS: [string, string, string, string, string][] = [
  ['01', 'Quality Coffee', 'Carefully selected beans, prepared at the bar by baristas who care about every cup.', IMAGES.bar, '50% 50%'],
  ['02', 'Friendly Atmosphere', 'Good conversations and good people — a place where everyone is welcome.', IMAGES.sign, '50% 40%'],
  ['03', 'The Backyard Experience', 'A cozy space by the bay to slow down and enjoy the simple moments.', IMAGES.interior, '50% 48%'],
];

export default function About() {
  useTitle('About');
  const bg = useParallax<HTMLImageElement>(0.08);
  return (
    <>
      <section className="shell pt-[100px] pb-10 md:pt-[132px] md:pb-16" aria-labelledby="about-title">
        <div className="about-intro grid overflow-hidden rounded-3xl border border-white/10 bg-ink-2 lg:grid-cols-2">
          <div className="relative z-10 flex flex-col items-start justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-16">
            <p className="eyebrow flex items-center gap-3"><span aria-hidden="true" className="h-px w-8 bg-crema/80" />Our story</p>
            <h1 id="about-title" className="display mt-4 text-[40px] sm:text-[56px] lg:text-[64px]">About<br /><span className="text-outline">KATRIBO</span></h1>
            <p className="mt-6 max-w-[480px] text-[16px] leading-relaxed text-soft lg:text-[17px]">
              KATRIBO is more than just a coffee shop. It&apos;s a backyard for good coffee, good conversations, and good people.
            </p>
            <p className="mt-3 max-w-[480px] text-[15px] leading-relaxed text-mute lg:text-[16px]">Inspired by the view, the community, and the simple moments that make life better.</p>
            <div className="mt-7 flex flex-wrap gap-3"><ButtonLink to="/menu" arrow>Explore Menu</ButtonLink><ButtonLink to="/contact" variant="outline">Visit Us</ButtonLink></div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[500px]">
            <img ref={bg} src={IMAGES.sign} alt="Inside Katribo, with the welcome to our backyard sign above the coffee bar" fetchPriority="high" className="absolute inset-0 h-[110%] w-full object-cover [object-position:50%_45%]" />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,8,8,.7),transparent_45%)] lg:bg-[linear-gradient(90deg,#111_0%,transparent_28%),linear-gradient(0deg,rgba(8,8,8,.7),transparent_45%)]" />
            <p className="script absolute bottom-6 right-6 -rotate-3 text-[38px] text-white sm:text-[48px]">Welcome to our backyard.</p>
          </div>
          <div className="border-t border-white/10 px-6 sm:px-10 lg:col-span-2 lg:px-12"><BrandHighlights /></div>
        </div>
      </section>

      {/* The view */}
      <section className="shell pb-16 md:pb-24">
        <Reveal className="relative overflow-hidden rounded-2xl">
          <Img src={IMAGES.bay} alt="View of the bay and outdoor tables through KATRIBO's front windows" width={1536} height={460}
            className="aspect-[16/10] w-full object-cover sm:aspect-[1536/400]" />
          <p className="absolute bottom-4 left-4 rounded-full bg-ink/80 px-4 py-2 text-[13px] font-medium backdrop-blur">The view from inside — our backyard by the bay.</p>
        </Reveal>
      </section>

      {/* Meet the team */}
      <section className="shell pb-16 md:pb-24" aria-labelledby="team">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-line bg-ink-2 md:grid-cols-2 md:gap-0">
          <Reveal className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[420px]">
            <Img src={IMAGES.staff} alt="The KATRIBO team behind the bar" className="absolute inset-0 h-full w-full object-cover [object-position:50%_55%]" />
          </Reveal>
          <Reveal delay={80} className="px-6 pb-8 md:px-12 md:py-14 lg:px-16">
            <p className="eyebrow">Meet the team</p>
            <h2 id="team" className="display mt-3 text-[34px] md:text-[48px]">The People <span className="text-outline">Behind the Bar</span></h2>
            <p className="mt-5 max-w-[460px] text-[15.5px] leading-relaxed text-mute md:text-[17px]">
              Every cup at KATRIBO is made by our own baristas. Better people make better coffee — come by, say hi, and tell us how you like your drink.
            </p>
            <div className="mt-7"><ButtonLink to="/menu" arrow>Order a Drink</ButtonLink></div>
          </Reveal>
        </div>
      </section>

      {/* Philosophy */}
      <section className="shell pb-16 md:pb-24" aria-labelledby="philo">
        <Reveal className="mb-8 md:mb-10">
          <p className="eyebrow">What we care about</p>
          <h2 id="philo" className="display mt-3 text-[34px] md:text-[56px]">Good Coffee, <span className="text-outline">Better People</span></h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {PILLARS.map(([n, title, text, src, pos], i) => (
            <Reveal key={n} delay={i * 80} className="group overflow-hidden rounded-2xl border border-line bg-card transition-colors duration-500 hover:bg-raised">
              <div className="aspect-[16/10] overflow-hidden">
                <Img src={src} alt="" style={{ objectPosition: pos }} className="h-full w-full object-cover transition-transform duration-[1.1s] ease-[var(--ease-out-quint)] group-hover:scale-[1.05]" />
              </div>
              <div className="p-6 md:p-7">
                <span className="text-[13px] font-semibold tracking-[.12em] text-mute">{n}</span>
                <h3 className="mt-2 text-[21px] font-extrabold tracking-[-0.015em] md:text-[24px]">{title}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-mute">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-20 text-center md:pb-28">
        <Reveal>
          <p className="display text-[40px] sm:text-[68px] lg:text-[100px]">“Welcome to<br /><span className="text-outline">Our Backyard.”</span></p>
          <p className="mt-5 text-[13px] tracking-[.24em] text-mute uppercase">— KATRIBO</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/menu" size="lg" arrow>See the Menu</ButtonLink>
            <ButtonLink to="/contact" size="lg" variant="outline">Visit Us</ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}

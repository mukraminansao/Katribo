import { useState, type FormEvent } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { Img, Reveal, SectionHead } from '../components/Primitives';
import { IMAGES, SITE } from '../data/site';
import { useTitle } from '../lib/ui';

type F = { name: string; email: string; message: string };
const RULES: Record<keyof F, (v: string) => string> = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  message: (v) => (v.trim().length >= 10 ? '' : 'Message should be at least 10 characters.'),
};

export default function Contact() {
  useTitle('Contact');
  const [f, setF] = useState<F>({ name: '', email: '', message: '' });
  const [err, setErr] = useState<Partial<F>>({});
  const [status, setStatus] = useState('');
  const socials: [keyof typeof SITE.social, IconName][] = [['facebook', 'facebook'], ['instagram', 'instagram'], ['tiktok', 'tiktok']];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = { name: RULES.name(f.name), email: RULES.email(f.email), message: RULES.message(f.message) };
    setErr(next);
    const first = (Object.keys(next) as (keyof F)[]).find((k) => next[k]);
    if (first) { document.getElementById(`c-${first}`)?.focus(); setStatus(''); return; }
    if (SITE.email) {
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Message from ' + f.name)}&body=${encodeURIComponent(`${f.message}\n\n— ${f.name} (${f.email})`)}`;
      setStatus('Your email app should open with your message ready to send.');
    } else {
      setStatus(`Thanks, ${f.name.trim().split(' ')[0]}! Online messages aren’t connected yet, so this one wasn’t sent. Please drop by the café or reach us on our social pages.`);
    }
  };

  const input = (k: keyof F, label: string, placeholder: string, props: Record<string, unknown> = {}) => (
    <div className="grid gap-2">
      <label htmlFor={`c-${k}`} className="text-[13.5px] font-semibold text-soft">{label}<span className="sr-only"> (required)</span></label>
      {k === 'message'
        ? <textarea id={`c-${k}`} rows={5} placeholder={placeholder} value={f[k]} onChange={(e) => { setF({ ...f, [k]: e.target.value }); if (err[k]) setErr({ ...err, [k]: RULES[k](e.target.value) }); }}
            aria-invalid={err[k] ? true : undefined} aria-describedby={err[k] ? `c-${k}-err` : undefined} className="field-input min-h-[160px] resize-y" />
        : <input id={`c-${k}`} placeholder={placeholder} value={f[k]} onChange={(e) => { setF({ ...f, [k]: e.target.value }); if (err[k]) setErr({ ...err, [k]: RULES[k](e.target.value) }); }}
            aria-invalid={err[k] ? true : undefined} aria-describedby={err[k] ? `c-${k}-err` : undefined} className="field-input" {...props} />}
      {err[k] && <p id={`c-${k}-err`} className="flex items-center gap-2 text-[13px]"><span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-black text-ink">!</span>{err[k]}</p>}
    </div>
  );

  return (
    <>
      <section className="shell pt-[106px] pb-14 md:pt-[140px] md:pb-20" aria-labelledby="contact-title">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5 md:mb-10">
          <div>
            <p className="eyebrow mb-3 flex items-center gap-3"><span aria-hidden="true" className="h-px w-8 bg-crema/80" />A little hello goes a long way</p>
            <h1 id="contact-title" className="display text-[42px] sm:text-[62px] lg:text-[76px]">Contact <span className="text-outline">Us</span></h1>
            <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-soft md:text-[18px]">A question, a conversation, or your next coffee stop.<br className="hidden sm:block" /> We&apos;d love to hear from you.</p>
          </div>
          <p className="script hidden -rotate-3 pb-2 text-[42px] text-soft lg:block">See you by the bay.</p>
        </header>

        <div className="contact-experience">
          <div className="contact-visit">
            <Img src={IMAGES.interior} alt="The Katribo espresso bar with tables and the bay visible through its windows" loading="eager" className="absolute inset-0 h-full w-full object-cover [object-position:55%_50%]" />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.96)_0%,rgba(0,0,0,.74)_32%,rgba(0,0,0,.08)_72%),linear-gradient(180deg,rgba(0,0,0,.25),transparent_30%)]" />
            <p className="contact-location-tag"><Icon name="pin" size={17} />Our backyard, by the bay</p>
            <div className="contact-visit-copy">
              <p className="eyebrow text-white/70">Katribo Slow Coffee Bar</p>
              <h2 className="mt-3 text-[30px] font-extrabold leading-[1.12] tracking-[-.025em] sm:text-[40px]">Come for the coffee.<br />Stay for the view.</h2>
              <div className="mt-5 flex items-start gap-3 text-[15px] leading-relaxed text-white/80">
                <Icon name="pin" size={21} className="mt-0.5 shrink-0" />
                <p>{SITE.address || 'Street address to be confirmed'}</p>
              </div>
              {SITE.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Katribo Slow Coffee Bar, ' + SITE.address)}`} target="_blank" rel="noopener" className="btn btn-outline mt-6 gap-3"><span>Get Directions</span><Icon name="arrow-up-right" size={18} /></a>}
              {(SITE.email || SITE.phone || SITE.hours) && <div className="mt-6 grid gap-3 border-t border-white/20 pt-5 text-[14px] text-white/85">
                {SITE.email && <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 break-all hover:text-white"><Icon name="mail" className="shrink-0" />{SITE.email}</a>}
                {SITE.phone && <p className="flex items-center gap-3"><Icon name="phone" />{SITE.phone}</p>}
                {SITE.hours && <p className="flex items-center gap-3"><Icon name="clock" />{SITE.hours}</p>}
              </div>}
              {socials.some(([key]) => SITE.social[key]) && <ul aria-label="Follow Katribo" className="mt-5 flex gap-3">
                {socials.filter(([key]) => SITE.social[key]).map(([key, icon]) => <li key={key}><a href={SITE.social[key]!} target="_blank" rel="noopener" aria-label={`KATRIBO on ${key}`} className="grid h-11 w-11 place-items-center rounded-full border border-white/30 transition-colors hover:bg-white hover:text-ink"><Icon name={icon} size={19} /></a></li>)}
              </ul>}
            </div>
          </div>

          <form noValidate onSubmit={submit} className="contact-form contact-message grid content-start gap-5">
            <div className="mb-1">
              <div className="flex items-start gap-4">
                <span className="contact-envelope shrink-0"><Icon name="mail" size={26} /></span>
                <div className="min-w-0"><p className="eyebrow text-mute">Let&apos;s talk</p><h2 className="mt-2 text-[24px] font-extrabold tracking-[-.025em] sm:text-[28px]">Send a message</h2></div>
              </div>
              <p className="mt-4 max-w-[360px] text-[15px] leading-relaxed text-mute">Coffee questions, kind words, or something on your mind.</p>
            </div>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              {input('name', 'Your name', 'Name', { autoComplete: 'name' })}
              {input('email', 'Email address', 'you@example.com', { type: 'email', autoComplete: 'email' })}
            </div>
            {input('message', 'Your message', 'Tell us what’s on your mind…')}
            {!SITE.email && <p className="contact-message-note"><Icon name="info" size={18} className="mt-0.5 shrink-0" /><span>Online messaging is coming soon. For now, we&apos;d love to welcome you at the café.</span></p>}
            <button type="submit" disabled={!SITE.email} className="btn btn-primary btn-lg w-full"><span>{SITE.email ? 'Prepare Email' : 'Messaging coming soon'}</span><Icon name="arrow" size={18} className="arrow" /></button>
            {status && <p role="status" className="rounded-xl border border-white/15 bg-card px-4 py-3 text-[14px] leading-relaxed text-soft">{status}</p>}
          </form>
        </div>
      </section>

      <section className="shell pb-16 md:pb-24" aria-labelledby="loc">
        <SectionHead id="loc" title="Location" sub="Find our backyard by the bay." />
        <Reveal className="relative overflow-hidden rounded-2xl border border-line">
          {SITE.mapEmbed ? (
            <iframe src={SITE.mapEmbed} title="Map showing KATRIBO's location" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full grayscale invert-[.92] sm:aspect-[21/6]" />
          ) : (
            <div className="relative aspect-[4/3] sm:aspect-[21/6]">
              <Img src={IMAGES.interior} alt="" className="absolute inset-0 h-full w-full object-cover brightness-[.28] grayscale-[.4]" />
              <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 p-6 text-center">
                <span className="mb-2 grid h-12 w-12 place-items-center rounded-full border border-[#444] bg-ink"><Icon name="pin" size={22} /></span>
                <p className="font-bold">Map coming soon</p>
                <p className="text-sm text-mute">Our backyard by the bay — the map will be here soon.</p>
              </div>
            </div>
          )}
        </Reveal>
      </section>
    </>
  );
}

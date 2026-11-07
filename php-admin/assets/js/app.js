/* =========================================================
   KATRIBO — front-end behaviour
   Cart state is kept in localStorage so it survives navigation
   and refreshes. Catalogue data comes from window.KATRIBO
   (rendered by includes/header.php from includes/products.php).
   ========================================================= */
(() => {
    'use strict';
    document.documentElement.classList.add('js');

    const DATA = window.KATRIBO || { products: [], sizes: [], addons: [] };
    const byId = Object.fromEntries(DATA.products.map(p => [p.id, p]));
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const peso = n => (n == null ? 'Price unavailable' : '₱' + Number(n).toLocaleString('en-PH'));
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* ---------------- Storage (safe) ---------------- */
    const store = {
        get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
    };

    /* ---------------- Cart ---------------- */
    const CART_KEY = 'katribo.cart.v1';
    const Cart = {
        items: store.get(CART_KEY, []),
        listeners: new Set(),

        key(id, size, addons) { return [id, size, ...[...addons].sort()].join('|'); },

        unitPrice(item) {
            const p = byId[item.id];
            if (!p || p.price == null) return null;
            const size = DATA.sizes.find(s => s.id === item.size);
            const add = item.addons.reduce((t, a) => t + (DATA.addons.find(x => x.id === a)?.price || 0), 0);
            return p.price + (size?.add || 0) + add;
        },

        add(id, { size = 'regular', addons = [], qty = 1 } = {}) {
            const p = byId[id];
            if (!p || p.price == null || p.soldOut) return false;
            const key = this.key(id, size, addons);
            const found = this.items.find(i => i.key === key);
            if (found) found.qty = Math.min(99, found.qty + qty);
            else this.items.push({ key, id, size, addons: [...addons], qty });
            this.save();
            return true;
        },
        setQty(key, qty) {
            const it = this.items.find(i => i.key === key);
            if (!it) return;
            if (qty <= 0) return this.remove(key);
            it.qty = Math.min(99, qty);
            this.save();
        },
        remove(key) { this.items = this.items.filter(i => i.key !== key); this.save(); },
        clear() { this.items = []; this.save(); },
        count() { return this.items.reduce((t, i) => t + i.qty, 0); },
        subtotal() { return this.items.reduce((t, i) => t + (this.unitPrice(i) || 0) * i.qty, 0); },

        save() { store.set(CART_KEY, this.items); this.listeners.forEach(fn => fn(this)); },
        onChange(fn) { this.listeners.add(fn); },
    };
    // drop items whose product no longer exists / lost its price
    if (DATA.catalogueOnline !== false) Cart.items = Cart.items.filter(i => byId[i.id] && byId[i.id].price != null);

    // keep tabs in sync
    window.addEventListener('storage', e => {
        if (e.key === CART_KEY) { Cart.items = store.get(CART_KEY, []); Cart.listeners.forEach(fn => fn(Cart)); }
    });

    const renderCount = (bump = false) => {
        const n = Cart.count();
        $$('[data-cart-count]').forEach(el => {
            el.textContent = n > 99 ? '99+' : n;
            el.hidden = n === 0;
            if (bump && n) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
        });
    };
    Cart.onChange(() => renderCount(true));
    renderCount();

    /* ---------------- Toast ---------------- */
    let toastTimer;
    const toast = (msg, withCartLink = true) => {
        const t = $('#toast');
        if (!t) return;
        t.innerHTML = `<span>${esc(msg)}</span>${withCartLink ? '<a href="cart.php">View Cart</a>' : ''}`;
        t.hidden = false;
        requestAnimationFrame(() => t.classList.add('is-show'));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { t.classList.remove('is-show'); setTimeout(() => (t.hidden = true), 300); }, 2600);
    };

    /* ---------------- Header ---------------- */
    const header = $('#siteHeader');
    const onScroll = () => header && header.classList.toggle('is-solid', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------------- Overlay helpers (drawer + search) ---------------- */
    let lastFocus = null;
    const lockScroll = on => { document.body.style.overflow = on ? 'hidden' : ''; };

    const drawer = $('#drawer');
    const openDrawer = () => {
        if (!drawer) return;
        lastFocus = document.activeElement;
        drawer.hidden = false;
        requestAnimationFrame(() => drawer.classList.add('is-open'));
        $$('[data-open-drawer]').forEach(b => b.setAttribute('aria-expanded', 'true'));
        lockScroll(true);
        setTimeout(() => $('.drawer-panel a, .drawer-panel button', drawer)?.focus(), 50);
    };
    const closeDrawer = () => {
        if (!drawer || drawer.hidden) return;
        drawer.classList.remove('is-open');
        $$('[data-open-drawer]').forEach(b => b.setAttribute('aria-expanded', 'false'));
        lockScroll(false);
        setTimeout(() => { drawer.hidden = true; lastFocus?.focus(); }, 300);
    };
    $$('[data-open-drawer]').forEach(b => b.addEventListener('click', openDrawer));
    $$('[data-close-drawer]').forEach(b => b.addEventListener('click', closeDrawer));

    const search = $('#search'), sInput = $('#searchInput'), sResults = $('#searchResults');
    const renderSearch = () => {
        const q = sInput.value.trim().toLowerCase();
        const list = DATA.products.filter(p => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
        sResults.innerHTML = list.length
            ? list.map(p => `<li><a href="drink.php?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image)}" alt="" loading="lazy"><span><strong>${esc(p.name)}</strong><em>${esc(p.category)} · ${esc(peso(p.price))}</em></span></a></li>`).join('')
            : `<li class="search-empty">No drinks match “${esc(sInput.value)}”.</li>`;
    };
    const openSearch = () => {
        if (!search) return;
        lastFocus = document.activeElement;
        search.hidden = false; lockScroll(true);
        renderSearch(); sInput.focus();
    };
    const closeSearch = () => {
        if (!search || search.hidden) return;
        search.hidden = true; lockScroll(false); lastFocus?.focus();
    };
    $$('[data-open-search]').forEach(b => b.addEventListener('click', openSearch));
    $$('[data-close-search]').forEach(b => b.addEventListener('click', closeSearch));
    sInput?.addEventListener('input', renderSearch);
    search?.addEventListener('click', e => { if (e.target === search) closeSearch(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeSearch(); closeDrawer(); }
        if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });

    /* ---------------- Add to cart (cards) ---------------- */
    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-add]');
        if (!btn) return;
        e.preventDefault();
        const id = btn.dataset.add;
        if (Cart.add(id)) {
            toast(`${byId[id].name} added to cart`);
            btn.classList.add('is-added');
            setTimeout(() => btn.classList.remove('is-added'), 900);
        }
    });

    /* ---------------- Quick add (home featured) ---------------- */
    $$('[data-quick-add]').forEach(form => {
        const id = form.dataset.quickAdd;
        const priceEl = $('[data-quick-price]', form);
        const update = () => {
            const size = form.elements.size.value;
            priceEl.textContent = peso(Cart.unitPrice({ id, size, addons: [] }));
        };
        form.addEventListener('change', update);
        form.addEventListener('submit', e => {
            e.preventDefault();
            const size = form.elements.size.value;
            if (Cart.add(id, { size })) toast(`${byId[id].name} (${size === 'large' ? 'Large' : 'Regular'}) added to cart`);
        });
    });

    /* ---------------- Reveal on scroll ---------------- */
    const reveals = $$('.reveal');
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const io = new IntersectionObserver(entries => entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        reveals.forEach(el => io.observe(el));
    } else reveals.forEach(el => el.classList.add('is-in'));

    // expose for page modules
    window.KatriboApp = { Cart, DATA, byId, peso, esc, toast, $, $$ };
})();

/* =========================================================
   Page modules
   ========================================================= */
(() => {
    'use strict';
    const { Cart, DATA, byId, peso, esc, toast, $, $$ } = window.KatriboApp;
    const sizeLabel = id => DATA.sizes.find(s => s.id === id)?.label || id;
    const addonLabel = id => DATA.addons.find(a => a.id === id)?.label || id;
    const describe = item => [sizeLabel(item.size), ...item.addons.map(addonLabel)].join(' · ');

    /* icons used in JS-rendered markup */
    function svg(p) { return `<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`; }
    const PLUS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>');
    const MINUS = svg('<path d="M5 12h14"/>');
    const TRASH = svg('<path d="M4.5 7h15"/><path d="M9.5 7V5h5v2"/><path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"/>');

    /* ---------- Generic pill filter (menu + gallery) ---------- */
    const wirePills = (bar, onPick) => {
        const pills = $$('.filter-pill', bar);
        const pick = (cat, focus = false) => {
            pills.forEach(p => {
                const on = p.dataset.cat === cat;
                p.classList.toggle('is-active', on);
                p.setAttribute('aria-selected', on);
                if (on) { p.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); if (focus) p.focus(); }
            });
            onPick(cat);
        };
        bar.addEventListener('click', e => { const b = e.target.closest('.filter-pill'); if (b) pick(b.dataset.cat); });
        bar.addEventListener('keydown', e => {
            if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
            const i = pills.indexOf(document.activeElement);
            if (i < 0) return;
            const n = pills[(i + (e.key === 'ArrowRight' ? 1 : -1) + pills.length) % pills.length];
            pick(n.dataset.cat, true);
        });
        return pick;
    };

    /* ---------- MENU ---------- */
    const menu = $('[data-menu]');
    const menuBar = $('[data-filter]');
    if (menu && menuBar) {
        const apply = cat => {
            menu.dataset.active = cat;
            $$('.menu-group', menu).forEach(g => g.classList.toggle('is-current', g.dataset.group === cat));
            // replay entrance animation
            $$('.menu-item', menu).forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
            const url = new URL(location.href);
            cat === 'All' ? url.searchParams.delete('cat') : url.searchParams.set('cat', cat);
            history.replaceState(null, '', url);
        };
        const pick = wirePills(menuBar, apply);
        apply(menu.dataset.active || 'All');
        $$('.pill-link[data-cat]', menu).forEach(b => b.addEventListener('click', () => {
            pick(b.dataset.cat);
            menuBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }));
    }

    /* ---------- DRINK DETAILS ---------- */
    const detail = $('[data-detail]');
    if (detail) {
        const id = detail.dataset.detail;
        let qty = 1;
        const qtyEl = $('[data-qty]', detail), totalEl = $('[data-total]', detail), unitEl = $('[data-unit-price]', detail);
        const state = () => ({
            size: detail.elements.size?.value || 'regular',
            addons: $$('input[name="addons"]:checked', detail).map(i => i.value),
        });
        const update = () => {
            const unit = Cart.unitPrice({ id, ...state() });
            qtyEl.textContent = qty;
            if (unit != null) { totalEl.textContent = peso(unit * qty); unitEl.textContent = peso(unit); }
            $('[data-step="-1"]', detail).disabled = qty <= 1 || unit == null;
        };
        detail.addEventListener('change', update);
        $$('[data-step]', detail).forEach(b => b.addEventListener('click', () => { qty = Math.max(1, Math.min(99, qty + +b.dataset.step)); update(); }));
        detail.addEventListener('submit', e => {
            e.preventDefault();
            const s = state();
            if (Cart.add(id, { ...s, qty })) {
                toast(`${qty} × ${byId[id].name} added to cart`);
                qty = 1; update();
            }
        });
        update();
    }

    /* ---------- CART PAGE ---------- */
    const NOTE_KEY = 'katribo.note.v1';
    const getNote = () => { try { return localStorage.getItem(NOTE_KEY) || ''; } catch { return ''; } };
    const setNote = v => { try { localStorage.setItem(NOTE_KEY, v); } catch { /* ignore */ } };

    const cartPage = $('[data-cart-page]');
    if (cartPage) {
        const list = $('[data-cart-list]'), empty = $('[data-cart-empty]'), summary = $('[data-cart-summary]');
        const noteWrap = $('[data-cart-note-wrap]'), note = $('[data-cart-note]');
        note.value = getNote();
        note.addEventListener('input', () => setNote(note.value));

        const render = () => {
            const items = Cart.items;
            if (DATA.catalogueOnline === false) {
                empty.hidden = false; summary.hidden = noteWrap.hidden = true; list.innerHTML = '';
                empty.innerHTML = '<h2>Your cart is kept</h2><p class="muted">The live menu is temporarily unavailable. Reload once the connection returns to review your order.</p><a class="btn btn--primary" href="cart.php">Reload cart</a>';
                return;
            }
            empty.hidden = items.length > 0;
            summary.hidden = noteWrap.hidden = items.length === 0;
            list.innerHTML = items.map(it => {
                const p = byId[it.id], unit = Cart.unitPrice(it);
                return `<li class="cart-item" data-key="${esc(it.key)}">
                    <a class="cart-thumb" href="drink.php?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}"></a>
                    <div class="cart-info">
                        <h3><a href="drink.php?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
                        <p class="cart-meta">${esc(describe(it))}</p>
                        <p class="cart-unit">${peso(unit)}</p>
                    </div>
                    <div class="stepper stepper--sm" role="group" aria-label="Quantity for ${esc(p.name)}">
                        <button type="button" class="stepper-btn" data-dec aria-label="Decrease quantity">${MINUS}</button>
                        <output class="stepper-val">${it.qty}</output>
                        <button type="button" class="stepper-btn" data-inc aria-label="Increase quantity"${it.qty >= 99 ? ' disabled' : ''}>${PLUS}</button>
                    </div>
                    <button type="button" class="remove-btn" data-remove aria-label="Remove ${esc(p.name)} from cart">${TRASH}</button>
                </li>`;
            }).join('');
            $('[data-subtotal]', summary).textContent = peso(Cart.subtotal());
            $('[data-total]', summary).textContent = peso(Cart.subtotal());
        };
        list.addEventListener('click', e => {
            const li = e.target.closest('.cart-item'); if (!li) return;
            const key = li.dataset.key, it = Cart.items.find(i => i.key === key); if (!it) return;
            if (e.target.closest('[data-inc]')) Cart.setQty(key, it.qty + 1);
            else if (e.target.closest('[data-dec]')) {
                if (it.qty === 1) { li.classList.add('is-leaving'); setTimeout(() => Cart.remove(key), 220); }
                else Cart.setQty(key, it.qty - 1);
            } else if (e.target.closest('[data-remove]')) {
                li.classList.add('is-leaving');
                setTimeout(() => { Cart.remove(key); toast(`${byId[it.id].name} removed`, false); }, 220);
            }
        });
        Cart.onChange(render);
        render();
    }

    /* ---------- Form validation helpers ---------- */
    const setErr = (input, msg) => {
        const err = document.getElementById(input.getAttribute('aria-describedby'));
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (err) { err.textContent = msg || ''; err.hidden = !msg; }
        return !msg;
    };
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const PHONE_RE = /^(\+639|09)\d{9}$/;
    const rules = {
        name:    v => v.trim().length >= 2 ? '' : 'Please enter your full name.',
        phone:   v => PHONE_RE.test(v.replace(/[\s\-()]/g, '')) ? '' : 'Enter a valid PH mobile number, e.g. 0917 123 4567.',
        email:   (v, req) => !v.trim() ? (req ? 'Please enter your email.' : '') : EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address.',
        message: v => v.trim().length >= 10 ? '' : 'Message should be at least 10 characters.',
    };
    const validate = (form, required = {}) => {
        let ok = true, first = null;
        $$('input[name], textarea[name]', form).forEach(el => {
            const rule = rules[el.name]; if (!rule) return;
            const good = setErr(el, rule(el.value, required[el.name]));
            if (!good && !first) first = el;
            ok = ok && good;
        });
        first?.focus();
        return ok;
    };
    const liveValidate = (form, required = {}) => $$('input[name], textarea[name]', form).forEach(el => {
        el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') setErr(el, rules[el.name]?.(el.value, required[el.name]) || ''); });
        el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') setErr(el, rules[el.name]?.(el.value, required[el.name]) || ''); });
    });

    /* ---------- CHECKOUT ---------- */
    const co = $('[data-checkout]');
    if (co) {
        const listEl = $('[data-co-list]', co), noteEl = $('[data-co-note]', co), errEl = $('[data-co-error]', co);
        const confirmEl = $('[data-confirm]'), emptyEl = $('[data-co-empty]');
        const submitBtn = $('[data-place-order]', co);
        let placed = false;
        let pendingRequest = null;
        const requestKey = async payload => {
            const text = JSON.stringify(payload);
            const bytes = crypto.subtle ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)) : null;
            const signature = bytes ? [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('') : text;
            // Plain HTTP on a LAN may lack Web Crypto hashing; retain retries in memory there.
            if (bytes && pendingRequest === null) { try { pendingRequest = JSON.parse(sessionStorage.getItem('katribo.checkout.request.v1') || 'null'); } catch { /* use the in-memory request */ } }
            if (pendingRequest?.signature !== signature) {
                pendingRequest = { signature, key: [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join('') };
                if (bytes) { try { sessionStorage.setItem('katribo.checkout.request.v1', JSON.stringify(pendingRequest)); } catch { /* retry protection still works within this page */ } }
            }
            return pendingRequest.key;
        };

        const render = () => {
            if (placed) return;
            if (DATA.catalogueOnline === false) {
                co.hidden = true; emptyEl.hidden = false;
                emptyEl.innerHTML = '<h2>Your cart is kept</h2><p class="muted">Checkout is temporarily unavailable. Reload once the connection returns; no order has been confirmed.</p><a class="btn btn--primary" href="checkout.php">Reload checkout</a>';
                return;
            }
            const items = Cart.items;
            co.hidden = items.length === 0;
            emptyEl.hidden = items.length > 0;
            listEl.innerHTML = items.map(it => {
                const p = byId[it.id], unit = Cart.unitPrice(it);
                return `<li class="mini-item"><img src="${esc(p.image)}" alt=""><div><strong>${esc(p.name)}</strong><span>${esc(describe(it))}</span><b>${peso(unit)}</b></div><span class="mini-calc"><span>${peso(unit)}</span><span>×${it.qty}</span><b>${peso(unit * it.qty)}</b></span></li>`;
            }).join('');
            const n = getNote().trim();
            noteEl.hidden = !n; noteEl.textContent = n ? `Note: ${n}` : '';
            $('[data-subtotal]', co).textContent = peso(Cart.subtotal());
            $('[data-total]', co).textContent = peso(Cart.subtotal());
        };
        Cart.onChange(render);
        render();
        liveValidate(co);

        co.addEventListener('submit', async e => {
            e.preventDefault();
            if (placed || submitBtn.disabled) return;
            errEl.hidden = true;
            if (!validate(co)) return;
            submitBtn.disabled = true;
            submitBtn.firstElementChild.textContent = 'Placing order…';
            try {
                const payload = {
                    name: co.elements.name.value, phone: co.elements.phone.value, email: co.elements.email.value,
                    fulfilment: co.elements.fulfilment.value, note: getNote(),
                    items: Cart.items.map(({ id, size, addons, qty }) => ({ id, size, addons, qty })),
                };
                payload.requestKey = await requestKey(payload);
                const res = await fetch('api/place-order.php', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => ({ ok: false, message: 'Unexpected server response.' }));
                if (!res.ok || !data.ok) {
                    Object.entries(data.fields || {}).forEach(([k, msg]) => co.elements[k] && setErr(co.elements[k], msg));
                    throw new Error(data.message || 'Could not place the order.');
                }
                placed = true;
                pendingRequest = null;
                try { sessionStorage.removeItem('katribo.checkout.request.v1'); } catch { /* optional browser storage */ }
                Cart.clear(); setNote('');
                co.hidden = true;
                $('[data-confirm-name]', confirmEl).textContent = data.name;
                $('[data-confirm-ref]', confirmEl).textContent = data.ref;
                $('[data-confirm-total]', confirmEl).textContent = peso(data.total);
                confirmEl.hidden = false; confirmEl.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                errEl.textContent = err.message || 'Something went wrong. Please try again.';
                errEl.hidden = false;
            } finally {
                submitBtn.disabled = false;
                submitBtn.firstElementChild.textContent = 'Place Order';
            }
        });
    }

    /* ---------- GALLERY ---------- */
    const gallery = $('[data-gallery]');
    if (gallery) {
        const items = $$('.masonry-item', gallery);
        wirePills($('[data-gallery-filter]'), cat => {
            items.forEach(li => {
                const show = cat === 'All' || li.dataset.cats.split('|').includes(cat);
                li.classList.toggle('is-hidden', !show);
                li.classList.remove('is-entering');
                if (show) { void li.offsetWidth; li.classList.add('is-entering'); }
            });
        });

        const lb = $('[data-lb]'), img = $('[data-lb-img]', lb), cap = $('[data-lb-cap]', lb), count = $('[data-lb-count]', lb);
        let idx = 0, opener = null;
        const visible = () => items.filter(li => !li.classList.contains('is-hidden'));
        const show = i => {
            const vis = visible(); idx = (i + vis.length) % vis.length;
            const btn = $('.masonry-btn', vis[idx]), src = $('img', btn);
            img.src = src.currentSrc || src.src; img.alt = src.alt;
            img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
            cap.textContent = $('.masonry-cap span', btn).textContent;
            count.textContent = `${idx + 1} / ${vis.length}`;
        };
        const open = li => { opener = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; show(visible().indexOf(li)); $('[data-lb-close]', lb).focus(); };
        const close = () => { lb.hidden = true; document.body.style.overflow = ''; opener?.focus(); };
        gallery.addEventListener('click', e => { const b = e.target.closest('.masonry-btn'); if (b) open(b.closest('.masonry-item')); });
        $('[data-lb-close]', lb).addEventListener('click', close);
        $('[data-lb-prev]', lb).addEventListener('click', () => show(idx - 1));
        $('[data-lb-next]', lb).addEventListener('click', () => show(idx + 1));
        lb.addEventListener('click', e => { if (e.target === lb) close(); });
        document.addEventListener('keydown', e => {
            if (lb.hidden) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') show(idx - 1);
            else if (e.key === 'ArrowRight') show(idx + 1);
            else if (e.key === 'Tab') { // keep focus inside the viewer
                const f = $$('button', lb), first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
        let x0 = null;
        lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', e => {
            if (x0 == null) return;
            const dx = e.changedTouches[0].clientX - x0; x0 = null;
            if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
        });
    }

    /* ---------- CONTACT ---------- */
    const contact = $('[data-contact]');
    if (contact) {
        const req = { email: true };
        const status = $('[data-contact-status]', contact);
        liveValidate(contact, req);
        contact.addEventListener('submit', e => {
            e.preventDefault();
            status.hidden = true;
            if (!validate(contact, req)) return;
            const to = contact.dataset.email;
            if (to) {
                const f = contact.elements;
                const body = `${f.message.value}\n\n— ${f.name.value} (${f.email.value})`;
                location.href = `mailto:${to}?subject=${encodeURIComponent('Message from ' + f.name.value)}&body=${encodeURIComponent(body)}`;
                status.textContent = 'Your email app should open with your message ready to send.';
            } else {
                status.textContent = 'Thanks! Your message looks good — but this form isn’t connected to the café’s inbox yet, so it wasn’t sent. (Demo)';
            }
            status.hidden = false;
        });
    }

})();

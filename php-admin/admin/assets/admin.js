/* Authenticated MySQL workspace. Public checkout and menu share the same database. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => n == null ? 'Unpriced' : '₱' + Number(n).toLocaleString('en-PH');
  const paths = {
    home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>',
    orders: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 7h8M8 11h8M8 15h4"/>',
    cup: '<path d="M5 8h13v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8ZM18 10h1a3 3 0 0 1 0 6h-1M8 3v2M13 2v3M4 23h16"/>',
    shake: '<path d="M6 8h12l-2 13H8L6 8ZM5 5h14M13 5l2-4M10 11l1 7"/>',
    cake: '<path d="M3 13h18v8H3ZM3 16h18M5 13V8h14v5M12 8V5"/><path d="M12 5c-3-1-1-4 0-4 1 0 3 3 0 4Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    tag: '<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1"/>',
    announce: '<path d="m3 9 17-5v16L3 15V9ZM8 17l2 5H6l-2-6M20 9l3-1M20 15l3 1"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m4 18 5-5 4 3 4-7 4 8"/>',
    users: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3H2ZM16 4a3 3 0 0 1 0 6M19 14c2 1 3 3 3 6"/>',
    chart: '<path d="M3 3v18h19M7 17v-5M12 17V8M17 17V4"/>',
    content: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M8 8v13M12 12h5M12 16h5"/>',
    settings: '<path d="m9 3-1 3-3 1-2 4 2 3v4l4 3 3-1 3 1 4-3v-4l2-3-2-4-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
    bag: '<path d="M5 7h14l2 15H3L5 7ZM8 9V5a4 4 0 0 1 8 0v4"/>',
    coins: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 10c0 4 16 4 16 0M4 15c0 4 16 4 16 0"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m16 16 5 5"/>',
    bell: '<path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4l-2 4ZM10 21h4M12 2v2"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    external: '<path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    close: '<path d="m5 5 14 14M19 5 5 19"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
  };
  const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.cup}</svg>`;
  const seedProducts = JSON.parse($('#admin-catalogue').textContent);
  const role = $('meta[name="admin-role"]')?.content || 'owner';
  const canManageMenu = ['owner', 'manager'].includes(role), canManageTeam = role === 'owner';
  let today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  today.setHours(0, 0, 0, 0);
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const niceDate = iso => new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
  const statusBadge = status => `<span class="status status-${status.toLowerCase()}">${esc(status)}</span>`;
  const orderTotal = o => o.lines.reduce((sum, l) => sum + l.qty * l.unit, 0);
  const orderQty = o => o.lines.reduce((sum, l) => sum + l.qty, 0);
  let products = [], orders = [], categoryNames = [], team = [];
  let pendingRender = false;
  let databaseReady = false, refreshPromise = null, dataError = '', lastSync = null;
  const csrf = $('meta[name="admin-csrf"]').content;
  async function api(data = null, photo = null) {
    let body;
    if (photo) { body = new FormData(); body.append('payload', JSON.stringify(data)); body.append('photo', photo); }
    else if (data) body = JSON.stringify(data);
    const response = await fetch('api.php', { method: data ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin', headers: data ? { ...(!photo ? { 'Content-Type': 'application/json' } : {}), 'X-CSRF-Token': csrf } : { Accept: 'application/json' }, ...(data ? { body } : {}) });
    const result = await response.json().catch(() => ({ ok: false, message: 'The server returned an unexpected response.' }));
    if (response.status === 401) { location.replace('login.php?expired=1'); throw new Error('Your session ended.'); }
    if (!response.ok || !result.ok) { const error = new Error(result.message || 'Could not save the change.'); error.status = response.status; throw error; }
    return result;
  }
  function syncStatus() {
    $('[data-connection-badge]').innerHTML = `<i></i> ${dataError ? 'Updates paused' : databaseReady ? 'MySQL connected' : 'Connecting…'}`;
    $('.sync-error').hidden = !dataError;
    $('.sync-error').textContent = dataError ? `${dataError}${databaseReady ? ' Showing the last loaded data.' : ''}` : '';
  }
  async function refreshData(renderPage = true) {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const result = await api();
        products = result.products; orders = result.orders; categoryNames = result.categories; team = result.team || [];
        document.dispatchEvent(new CustomEvent('katribo:orders-synced', { detail: { orders } }));
        today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })); today.setHours(0, 0, 0, 0);
        databaseReady = true; dataError = ''; lastSync = new Date();
        if (renderPage && !dialog.open) { pendingRender = false; render(true); } else if (renderPage) pendingRender = true;
        return true;
      } catch (error) { dataError = error.message; if (!databaseReady) render(); return false; }
      finally { syncStatus(); }
    })();
    try { return await refreshPromise; } finally { refreshPromise = null; }
  }
  async function saveChange(data, photo = null) {
    if (refreshPromise) await refreshPromise;
    const result = await api(data, photo);
    // A committed write remains successful even if its follow-up read loses connection.
    if (result.order) orders = orders.map(o => o.id === result.order.id ? result.order : o);
    if (result.product) {
      const product = { ...result.product, image: '../' + result.product.image };
      products = products.some(p => p.id === product.id) ? products.map(p => p.id === product.id ? product : p) : [...products, product];
    }
    if (result.products) products = result.products.map(p => ({ ...p, image: '../' + p.image }));
    if (result.team) team = result.team;
    if (data.action === 'product-delete') products = products.filter(p => p.id !== data.id);
    await refreshData(false);
    return result;
  }
  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message; $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
  }
  const nav = (route, name, label, extra = '') => `<a class="nav-item" href="#${route}" data-route="${route}">${icon(name)}<span>${label}</span>${extra}</a>`;
  const planned = (name, label) => `<button type="button" class="nav-item" data-planned="${esc(label)}">${icon(name)}<span>${label}</span><span class="soon">Next</span></button>`;
  $('#sidebar').innerHTML = `<a href="#dashboard" class="brand" aria-label="Katribo Admin dashboard"><img src="assets/katribo-logo.webp" alt="Katribo" width="1108" height="400"><small>ADMIN</small></a><nav class="side-nav">${nav('dashboard', 'home', 'Dashboard')}${nav('orders', 'orders', 'Orders', '<span class="nav-count" data-order-count></span>')}<button type="button" class="nav-item" data-menu-toggle aria-expanded="true" aria-controls="menu-subnav">${icon('cup')}<span>Menu Management</span><span class="chevron">⌃</span></button><div class="nav-sub" id="menu-subnav">${nav('menu', 'cup', 'Drinks')}${nav('menu?category=Milkshake', 'shake', 'Milkshakes')}${nav('menu?category=Pastries', 'cake', 'Cakes & Pastries')}${nav('categories', 'grid', 'Categories')}</div>${planned('tag', 'Promotions')}${planned('announce', 'Announcements')}${planned('image', 'Media Library')}${nav('customers', 'users', 'Customers')}${nav('analytics', 'chart', 'Analytics')}${planned('content', 'Website Content')}${planned('settings', 'Settings')}</nav><div class="sidebar-bottom"><p class="sidebar-slogan">Good<br>Coffee<br>Better<br>People.</p><a class="view-store" href="../index.php" target="_blank" rel="noopener">${icon('external', 13)} View coffee shop</a></div>`;
  if (canManageMenu) $('#menu-subnav').insertAdjacentHTML('beforeend', nav('featured', 'tag', 'Featured drinks'));
  if (canManageTeam) $('.side-nav').insertAdjacentHTML('beforeend', nav('team', 'users', 'Team & access'));
  if (role === 'staff') $$('[data-route="dashboard"],[data-route="customers"],[data-route="analytics"]', $('#sidebar')).forEach(link => link.remove());
  $('[data-search-icon]').innerHTML = icon('search', 16);
  $('[data-toggle-sidebar]').innerHTML = icon('menu');
  $('[data-notifications]').innerHTML = icon('bell', 23);
  function closeSidebar() { $('#sidebar').classList.remove('is-open'); $('.sidebar-backdrop').hidden = true; $('[data-toggle-sidebar]').setAttribute('aria-expanded', 'false'); }
  $('[data-toggle-sidebar]').addEventListener('click', () => { $('#sidebar').classList.add('is-open'); $('.sidebar-backdrop').hidden = false; $('[data-toggle-sidebar]').setAttribute('aria-expanded', 'true'); });
  $('.sidebar-backdrop').addEventListener('click', closeSidebar);
  $('[data-menu-toggle]').addEventListener('click', e => {
    const open = e.currentTarget.getAttribute('aria-expanded') !== 'true';
    e.currentTarget.setAttribute('aria-expanded', String(open)); $('#menu-subnav').hidden = !open; $('.chevron', e.currentTarget).textContent = open ? '⌃' : '⌄';
  });
  const dialog = $('#admin-dialog');
  let returnFocus = null;
  let modalCleanup = null;
  function modal(title, body, className = '') {
    modalCleanup?.(); modalCleanup = null;
    returnFocus = document.activeElement;
    dialog.className = className;
    dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${esc(title)}</h2><button type="button" class="icon-button" data-close-dialog aria-label="Close dialog">${icon('close')}</button></div><div class="dialog-body">${body}</div>`;
    if (!dialog.open) dialog.showModal();
    $('[data-close-dialog]', dialog).addEventListener('click', () => dialog.close());
  }
  dialog.addEventListener('close', () => { modalCleanup?.(); modalCleanup = null; const orderId = returnFocus?.dataset.order, productId = returnFocus?.dataset.editProduct; if (pendingRender) { pendingRender = false; render(true); } if (returnFocus?.isConnected) returnFocus.focus(); else if (orderId) $(`[data-order="${orderId}"]`, $('#main'))?.focus(); else if (productId) $(`[data-edit-product="${productId}"]`, $('#main'))?.focus(); });
  dialog.addEventListener('cancel', e => { if (dialog.getAttribute('aria-busy') === 'true') e.preventDefault(); });
  dialog.addEventListener('click', e => { if (e.target === dialog && dialog.getAttribute('aria-busy') !== 'true') { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  function aboutPreview() {
    modal('Your admin workspace', '<p>Orders and menu items are saved in MySQL. Dashboard statistics use saved orders; an empty database shows zero activity.</p><ul class="modal-list"><li>Visitors order for pickup without creating an account.</li><li>Menu edits update the customer website when visitors refresh, and checkout always validates current prices.</li><li>Sales show the value of completed orders. Online payments are not processed.</li><li>Order names, prices and add-ons are preserved when the menu changes.</li></ul><p>Orders refresh every 15 seconds while you are viewing the workspace. Promotions and announcements are planned next.</p>');
  }
  $('[data-about-preview]').addEventListener('click', aboutPreview);
  $('[data-refresh-data]').addEventListener('click', async () => { $('.profile').open = false; if (await refreshData()) toast('Orders and menu refreshed.'); });
  $$('[data-planned]').forEach(b => b.addEventListener('click', () => plannedModal(b.dataset.planned)));
  function plannedModal(name) { modal(name, `<p>${esc(name)} is a planned module. Your orders and menu are already connected to MySQL.</p><p>This module can be built in the next phase.</p><a class="button primary" href="#dashboard" data-dismiss-link>Back to dashboard ${icon('arrow', 15)}</a>`); $('[data-dismiss-link]', dialog).onclick = () => dialog.close(); }
  function rangeDates(range) {
    const start = new Date(today), end = new Date(today); end.setDate(end.getDate() + 1);
    if (range === 'week') start.setDate(start.getDate() - 6);
    else if (range === 'last') { start.setDate(1); end.setTime(start.getTime()); start.setMonth(start.getMonth() - 1); }
    else start.setDate(1);
    return { start, end };
  }
  const orderDate = iso => new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  function inPeriod(o, start, end) { const d = orderDate(o.date); return d >= start && d < end; }
  function currentOrders() { const { start, end } = rangeDates('month'); return orders.filter(o => inPeriod(o, start, end)); }
  const recentOrders = () => [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  function stat(iconName, label, value, trend) { return `<article class="stat-card"><div class="stat-icon">${icon(iconName, 29)}</div><div><span class="stat-label">${label}</span><strong class="stat-value">${esc(value)}</strong><span class="stat-trend">${trend}</span></div></article>`; }
  function stats() {
    const now = currentOrders();
    const { start, end } = rangeDates('last');
    const before = orders.filter(o => inPeriod(o, start, end));
    const sales = list => list.filter(o => o.status === 'Completed').reduce((s, o) => s + orderTotal(o), 0);
    const customers = list => new Set(list.filter(o => o.status !== 'Cancelled').map(o => o.customerKey)).size;
    const trend = (n, previous) => { const pct = previous ? Math.round((n - previous) / previous * 100) : null; return pct == null ? '<em class="accent">New</em> this month' : `<em class="${pct >= 0 ? 'positive' : 'negative'}">${pct >= 0 ? '↑ +' : '↓ '}${pct}%</em> vs. last month`; };
    return `<div class="stats-grid">${stat('bag', 'Total Orders', now.length, trend(now.length, before.length))}${stat('coins', 'Total Sales', money(sales(now)), trend(sales(now), sales(before)))}${stat('users', 'Total Customers', customers(now), trend(customers(now), customers(before)))}${stat('cup', 'Menu Items', products.length, `<em class="accent">${products.filter(p => p.available !== false && !p.soldOut && p.price != null).length} priced</em> & in stock`)}</div>`;
  }
  function chartPanel() { return `<section class="panel"><div class="panel-header"><h2>Sales Overview</h2><select id="sales-range" aria-label="Sales date range"><option value="month">This Month</option><option value="week">Last 7 Days</option><option value="last">Last Month</option></select></div><div class="chart-wrap"><svg class="sales-chart" viewBox="0 0 640 220" role="img" aria-label="Daily completed-order sales in Philippine pesos"></svg><div class="chart-tooltip" hidden></div></div><div class="chart-key"><span><i></i> Completed orders</span><span id="chart-total"></span><span>Saved orders</span></div></section>`; }
  let chartDays = [];
  function drawChart(range = 'month') {
    const { start, end } = rangeDates(range);
    const days = []; const d = new Date(start);
    while (d < end) { days.push({ date: new Date(d), amount: 0, count: 0 }); d.setDate(d.getDate() + 1); }
    const byDay = new Map(days.map(day => [dateKey(day.date), day]));
    orders.filter(o => o.status === 'Completed' && inPeriod(o, start, end)).forEach(o => { const day = byDay.get(dateKey(orderDate(o.date))); if (day) { day.amount += orderTotal(o); day.count++; } });
    const max = Math.max(1000, Math.ceil(Math.max(...days.map(d => d.amount)) / 1000) * 1000);
    chartDays = days.map((day, i) => ({ ...day, x: 52 + i * 575 / Math.max(1, days.length - 1), y: 184 - day.amount / max * 164 }));
    const path = chartDays.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const ticks = [...new Set([0, Math.round((days.length - 1) * .2), Math.round((days.length - 1) * .4), Math.round((days.length - 1) * .6), Math.round((days.length - 1) * .8), days.length - 1])];
    $('.sales-chart').innerHTML = `<defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e9bf94" stop-opacity=".34"/><stop offset="100%" stop-color="#e9bf94" stop-opacity=".01"/></linearGradient></defs>${[0, 1, 2, 3, 4].map(i => `<line x1="52" x2="627" y1="${20 + i * 41}" y2="${20 + i * 41}" class="chart-grid"/><text x="40" y="${24 + i * 41}" text-anchor="end" class="chart-label">${money(Math.round(max * (4 - i) / 4))}</text>`).join('')}${ticks.map(i => `<line x1="${chartDays[i].x}" x2="${chartDays[i].x}" y1="20" y2="184" class="chart-grid"/><text x="${chartDays[i].x}" y="208" text-anchor="${i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}" class="chart-label">${days[i].date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</text>`).join('')}<path d="${path} L627,184 L52,184 Z" fill="url(#sales-fill)"/><path d="${path}" fill="none" stroke="#e9bf94" stroke-width="2.2" stroke-linejoin="round"/><line id="chart-cursor" y1="20" y2="184" stroke="#e9bf94" stroke-opacity=".25" hidden/><circle id="chart-point" r="4" fill="#edc49b" stroke="#ffdfba" hidden/><rect x="52" y="10" width="575" height="180" fill="transparent" tabindex="0" role="slider" aria-label="Explore daily sales with the left and right arrow keys" aria-valuemin="1" aria-valuemax="${days.length}" aria-valuenow="1" id="chart-hit"/>`;
    $('#chart-total').textContent = `${money(days.reduce((s, d) => s + d.amount, 0))} this period`;
    const hit = $('#chart-hit'); let index = 0;
    const show = i => {
      index = Math.max(0, Math.min(chartDays.length - 1, i)); const p = chartDays[index];
      const wrap = $('.chart-wrap'), svg = $('.sales-chart'), rect = svg.getBoundingClientRect();
      const scale = Math.min(rect.width / 640, rect.height / 220);
      const offsetX = (rect.width - 640 * scale) / 2;
      const tooltip = $('.chart-tooltip');
      tooltip.innerHTML = `${p.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}<strong>${money(p.amount)}</strong><span>${p.count} completed orders</span>`;
      tooltip.hidden = false; tooltip.style.left = `${Math.max(65, Math.min(wrap.clientWidth - 65, offsetX + p.x * scale))}px`; tooltip.style.top = `${Math.max(82, (rect.height - 220 * scale) / 2 + p.y * scale - 10)}px`;
      $('#chart-point').setAttribute('cx', p.x); $('#chart-point').setAttribute('cy', p.y); $('#chart-point').removeAttribute('hidden');
      $('#chart-cursor').setAttribute('x1', p.x); $('#chart-cursor').setAttribute('x2', p.x); $('#chart-cursor').removeAttribute('hidden');
      hit.setAttribute('aria-valuenow', index + 1); hit.setAttribute('aria-valuetext', `${dateKey(p.date)}: ${money(p.amount)}, ${p.count} orders`);
    };
    hit.addEventListener('pointermove', e => { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform($('.sales-chart').getScreenCTM().inverse()); show(Math.round((p.x - 52) / 575 * (days.length - 1))); });
    hit.addEventListener('pointerleave', () => { if (document.activeElement !== hit) { $('.chart-tooltip').hidden = true; $('#chart-cursor').setAttribute('hidden', ''); $('#chart-point').setAttribute('hidden', ''); } });
    hit.addEventListener('focus', () => show(index));
    hit.addEventListener('blur', () => { $('.chart-tooltip').hidden = true; $('#chart-cursor').setAttribute('hidden', ''); $('#chart-point').setAttribute('hidden', ''); });
    hit.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); show(e.key === 'Home' ? 0 : e.key === 'End' ? days.length - 1 : index + (e.key === 'ArrowRight' ? 1 : -1)); } });
  }
  function topItems() {
    const counts = new Map();
    currentOrders().filter(o => o.status === 'Completed').forEach(o => o.lines.forEach(l => { const prev = counts.get(l.id) || { id: l.id, name: l.name, image: l.image, qty: 0, revenue: 0 }; prev.qty += l.qty; prev.revenue += l.unit * l.qty; counts.set(l.id, prev); }));
    return [...counts.values()].sort((a, b) => b.qty - a.qty);
  }
  function safeImage(url) {
    const legacy = /^\.\.\/assets\/img\/drinks\/([a-z0-9-]+\.jpg)(?:\?v=\d+)?$/.exec(url);
    if (legacy) return 'menu-photo.php?file=' + encodeURIComponent(legacy[1]);
    return /^(?:\.\.\/assets\/img\/uploads\/menu-[a-f0-9]{32}\.jpg(?:\?v=\d+)?|(?:\.\.\/admin\/)?assets\/hero-katribo\.jpg(?:\?v=\d+)?)$/.test(url) ? url : 'assets/hero-katribo.jpg';
  }
  function topPanel() {
    const top = topItems().slice(0, 5); const max = top[0]?.qty || 1;
    return `<section class="panel"><div class="panel-header"><h2>Top Selling Items</h2><a href="#analytics">View All</a></div><ol class="top-list">${top.map((item, i) => { const p = products.find(p => p.id === item.id) || seedProducts.find(p => p.id === item.id); return `<li><span class="rank">${i + 1}</span><img src="${esc(safeImage(p?.image || (item.image ? '../' + item.image : '') || ''))}" alt=""><div class="top-name">${esc(item.name)}<small>${item.qty} sold this month</small></div><div class="progress" aria-hidden="true"><span style="width:${Math.round(item.qty / max * 100)}%"></span></div><span class="top-price">${money(p?.price)}</span></li>`; }).join('') || '<li class="empty">No completed orders yet.</li>'}</ol></section>`;
  }
  function orderRows(list) { return list.map(o => `<tr><td><button class="order-link" data-order="${o.id}">#${o.id}</button></td><td>${esc(o.customer)}</td><td>${orderQty(o)} item${orderQty(o) === 1 ? '' : 's'}</td><td>${money(orderTotal(o))}</td><td>${statusBadge(o.status)}</td><td class="order-date">${niceDate(o.date)}</td><td><button class="order-more" data-order="${o.id}" aria-label="View order ${o.id}">⋮</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty"><strong>No orders found</strong>Try another search or status filter.</td></tr>'; }
  function orderTable(list, full = false) { return `<div class="table-wrap"><table class="${full ? 'orders-full' : ''}"><thead><tr><th scope="col">#</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col"><span class="sr-only" aria-label="Actions"></span></th></tr></thead><tbody id="orders-body">${orderRows(list)}</tbody></table></div>`; }
  const previewNote = () => `<p class="preview-note">${icon('info', 13)}<span>Saved in MySQL · Updated ${lastSync ? lastSync.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : 'just now'}. <a href="#" data-about-inline>About this workspace</a></span></p>`;
  function dashboard() {
    $('#main').innerHTML = `<section class="hero hero-lineup" aria-labelledby="welcome-title"><div class="hero-image" aria-hidden="true"></div><div class="hero-copy"><p class="hero-eyebrow">WELCOME BACK,</p><h1 id="welcome-title"><span>Katribo</span> <em>Admin.</em></h1><p class="hero-description">Your menu, orders, and daily flow.<br><span>All in one thoughtfully managed space.</span></p><nav class="hero-shortcuts" aria-label="Workspace shortcuts"><a href="#orders">View orders <span aria-hidden="true">↗</span></a><a href="#menu">Manage menu <span aria-hidden="true">↗</span></a></nav></div><p class="hero-slogan" aria-label="Every flavor. A little joy.">Every flavor.<br>A little joy.</p></section>${stats()}<div class="overview-grid">${chartPanel()}${topPanel()}</div><div class="bottom-grid"><section class="panel"><div class="panel-header"><h2>Recent Orders</h2><a href="#orders">View All</a></div>${orderTable(recentOrders().slice(0, 5))}</section><section class="panel"><div class="panel-header"><h2>Quick Actions</h2></div><div class="quick-grid"><button class="quick-card" data-add-product><img src="assets/hero-katribo.jpg" alt=""><span>ADD<br>NEW DRINK</span><i class="quick-arrow">↗</i></button><button class="quick-card" data-planned="Promotions"><img src="${esc(safeImage('../assets/img/drinks/iced-latte.jpg'))}" alt=""><span>CREATE<br>PROMOTION</span><i class="quick-arrow">↗</i></button><a href="#menu" class="quick-card"><img src="${esc(safeImage('../assets/img/drinks/chocolate-cake.jpg'))}" alt=""><span>MANAGE<br>MENU ITEMS</span><i class="quick-arrow">↗</i></a><button class="quick-card" data-planned="Announcements"><div class="announcement-art">${icon('announce', 78)}</div><span>POST<br>ANNOUNCEMENT</span><i class="quick-arrow">↗</i></button></div></section></div>${previewNote()}`;
    drawChart(); $('#sales-range').addEventListener('change', e => drawChart(e.target.value));
  }
  function heading(eyebrow, title, description, action = '') { return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div>${action}</div>`; }
  const nextOrderStatus = status => ({ Pending: 'Processing', Processing: 'Completed' })[status];
  const orderAction = status => status === 'Processing' ? 'Start preparing' : 'Complete pickup';
  const orderPhone = phone => String(phone || '').replace(/[^+\d]/g, '');
  function orderTickets(list) {
    return list.map(o => {
      const next = nextOrderStatus(o.status);
      const preview = o.lines.slice(0, 2).map(l => `<li><span>${l.qty} ×</span> ${esc(l.name)}${l.size ? `<small>${esc(l.size)}</small>` : ''}</li>`).join('');
      return `<li class="order-ticket order-ticket-${o.status.toLowerCase()}">
        <div class="order-ticket-heading"><div>${statusBadge(o.status)}<button type="button" class="order-reference" data-order="${o.id}">${esc(o.ref || '#' + o.id)}</button></div><time datetime="${esc(o.date)}">${niceDate(o.date)}</time></div>
        <div class="order-ticket-content"><div class="order-customer"><span class="order-avatar" aria-hidden="true">${esc(Array.from(o.customer || '?')[0].toUpperCase())}</span><div><h3>${esc(o.customer)}</h3><a href="tel:${esc(orderPhone(o.phone))}" class="order-phone">${esc(o.phone)}</a></div></div>
          <div class="order-item-preview"><ul>${preview}</ul>${o.lines.length > 2 ? `<span class="order-more-items">+${o.lines.length - 2} more ${o.lines.length - 2 === 1 ? 'item' : 'items'}</span>` : ''}</div>
          <div class="order-ticket-total"><strong>${money(orderTotal(o))}</strong><small>${orderQty(o)} ${orderQty(o) === 1 ? 'item' : 'items'} · Pay at pickup</small></div>
        </div><div class="order-ticket-footer"><span class="order-pickup">${icon('bag', 15)} In-store pickup${o.note ? `<span class="order-note-marker">${icon('info', 13)} Pickup note</span>` : ''}</span><div class="order-ticket-actions"><button type="button" class="button" data-order="${o.id}" aria-label="View details for order ${o.id}">View details</button>${next ? `<button type="button" class="button primary" data-order-next="${o.id}" aria-label="${orderAction(next)} for order ${o.id}">${orderAction(next)} ${icon('arrow', 15)}</button>` : ''}</div></div>
      </li>`;
    }).join('');
  }
  function ordersPage(params) {
    const filters = ['All', 'Active', ...statuses];
    let status = filters.includes(params.get('status')) ? params.get('status') : 'All';
    const counts = Object.fromEntries(statuses.map(s => [s, orders.filter(o => o.status === s).length]));
    const summary = [
      ['Pending', 'Awaiting preparation', 'New orders to get started', 'orders'],
      ['Processing', 'In preparation', 'Currently being made', 'cup'],
      ['Completed', 'Completed orders', 'Picked up and on their way', 'bag'],
      ['Cancelled', 'Cancelled orders', 'Closed without pickup', 'close']
    ];
    $('#main').innerHTML = `<div class="orders-workspace">
      <div class="page-heading orders-heading"><div><p class="eyebrow">THE DAILY BREW</p><h1 id="orders-title" tabindex="-1">Orders<span>A little care, from prep to pickup.</span></h1><p>Keep every cup moving and every pickup running smoothly.</p></div><button class="button orders-export" data-export-orders>${icon('external', 15)} Export CSV</button></div>
      <div class="order-summary" role="group" aria-label="Order overview">${summary.map(([s, label, help, symbol]) => `<button type="button" class="order-summary-card order-summary-${s.toLowerCase()}" data-status-filter="${s}" aria-pressed="${status === s}"><span class="order-summary-icon">${icon(symbol, 21)}</span><span class="order-summary-label">${label}</span><strong>${counts[s]}</strong><small>${help}</small></button>`).join('')}</div>
      <section class="orders-queue" aria-label="Pickup order queue"><div class="order-queue-header"><div><span class="order-queue-dot" aria-hidden="true"></span><h2>Your order queue</h2></div><span>In-store pickup · Payment at pickup</span></div>
        <div class="order-filters"><div class="order-search-wrap">${icon('search', 18)}<input type="search" id="order-search" aria-label="Search orders" placeholder="Search name, order reference, or phone…" value="${esc(params.get('q') || '')}"></div><label class="order-sort">Sort by<select id="order-sort"><option value="attention">Needs attention</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
        <div class="order-filter-row"><div class="order-status-tabs" role="group" aria-label="Filter order status">${filters.map(s => `<button type="button" class="tab" data-status-filter="${s}" aria-pressed="${s === status}">${s}<span>${s === 'All' ? orders.length : s === 'Active' ? counts.Pending + counts.Processing : counts[s]}</span></button>`).join('')}</div><p id="order-results" role="status" aria-live="polite" aria-atomic="true"></p></div>
        <ul class="order-list" id="orders-list" aria-label="Orders"></ul><div class="order-empty" id="order-empty" hidden></div>
      </section>${previewNote()}</div>`;
    $('#order-sort').value = ['newest', 'oldest'].includes(params.get('sort')) ? params.get('sort') : 'attention';
    let visible = [];
    const filter = (persist = false) => {
      const rawQuery = $('#order-search').value.trim(), q = rawQuery.toLowerCase().replace(/^#/, ''), sort = $('#order-sort').value;
      visible = orders.filter(o => {
        if (status !== 'All' && !(status === 'Active' ? !!nextOrderStatus(o.status) : o.status === status)) return false;
        const localPhone = String(o.phone || '').replace(/^\+63/, '0');
        const textMatch = `${o.id} ${o.ref} ${o.customer} ${o.phone} ${localPhone}`.toLowerCase().includes(q);
        const phoneQuery = q.replace(/[\s()-]/g, '');
        return textMatch || (/^[+\d\s()-]+$/.test(q) && [o.phone, localPhone].some(phone => String(phone).includes(phoneQuery)));
      });
      const priority = { Pending: 0, Processing: 1, Completed: 2, Cancelled: 3 };
      visible.sort((a, b) => {
        const dateDiff = new Date(a.date) - new Date(b.date) || a.id - b.id;
        if (sort === 'oldest') return dateDiff;
        if (sort === 'newest') return -dateDiff;
        return priority[a.status] - priority[b.status] || (nextOrderStatus(a.status) ? dateDiff : -dateDiff);
      });
      $('#orders-list').innerHTML = orderTickets(visible);
      $('#order-results').textContent = `${visible.length} ${visible.length === 1 ? 'order' : 'orders'}${status === 'All' ? '' : ' · ' + status.toLowerCase()}`;
      $('[data-export-orders]').disabled = !visible.length;
      $$('[data-status-filter]', $('#main')).forEach(b => { const active = b.dataset.statusFilter === status; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
      const empty = $('#order-empty'); empty.hidden = visible.length > 0;
      if (!visible.length) empty.innerHTML = `${icon('cup', 34)}<h3>${orders.length ? 'No matching orders.' : 'Ready for the first cup.'}</h3><p>${orders.length ? 'Try a different search or status to find what you need.' : 'New pickup orders will appear here when customers check out.'}</p>${orders.length ? '<button type="button" class="button" data-clear-order-filters>Clear filters</button>' : ''}`;
      if (persist) {
        const query = new URLSearchParams();
        if (rawQuery) query.set('q', rawQuery);
        if (status !== 'All') query.set('status', status);
        if (sort !== 'attention') query.set('sort', sort);
        history.replaceState(null, '', '#orders' + (query.size ? '?' + query.toString() : ''));
      }
    };
    $('#order-search').addEventListener('input', () => filter(true));
    $('#order-sort').addEventListener('change', () => filter(true));
    $$('[data-status-filter]', $('#main')).forEach(b => b.addEventListener('click', () => { status = b.dataset.statusFilter; filter(true); }));
    $('#order-empty').addEventListener('click', e => { if (e.target.closest('[data-clear-order-filters]')) { status = 'All'; $('#order-search').value = ''; $('#order-sort').value = 'attention'; filter(true); $('#order-search').focus(); } });
    $('[data-export-orders]').onclick = () => exportCsv('katribo-orders.csv', ['Order', 'Reference', 'Customer', 'Phone', 'Items', 'Total PHP', 'Status', 'Ordered at (Asia/Manila)'], visible.map(o => [o.id, o.ref, o.customer, o.phone, orderQty(o), orderTotal(o), o.status, niceDate(o.date)]));
    filter();
    if (params.get('id')) { const o = orders.find(o => o.id === Number(params.get('id'))); if (o) showOrder(o.id); }
  }
  function showOrder(id, suggestedStatus = null) {
    const o = orders.find(o => o.id === Number(id)); if (!o) return;
    const next = nextOrderStatus(o.status);
    const payment = ({ cash: 'Cash', gcash: 'GCash', card: 'Card' })[o.paymentMethod];
    const selected = suggestedStatus === 'Cancelled' ? 'Cancelled' : next;
    const stage = { Pending: 0, Processing: 1, Completed: 2 }[o.status];
    modal(`Order #${o.id}`, `<div class="order-detail-intro"><div>${statusBadge(o.status)}<strong>${esc(o.ref || '#' + o.id)}</strong></div><time datetime="${esc(o.date)}">Placed ${niceDate(o.date)}</time><a class="button order-print-link" href="print-order.php?id=${o.id}" target="_blank" rel="noopener">Print prep slip ↗</a></div>
      <p class="order-save-error" role="alert" tabindex="-1" hidden></p>
      ${o.status === 'Cancelled' ? '<p class="order-closed-note">This order was cancelled. It is closed and cannot be reopened.</p>' : `<ol class="order-progress" aria-label="Order progress">${['Order received', 'In preparation', 'Picked up'].map((label, i) => `<li class="${i < stage ? 'done' : i === stage ? 'current' : ''}"${i === stage ? ' aria-current="step"' : ''}><span aria-hidden="true">${i < stage ? '✓' : i + 1}</span>${label}</li>`).join('')}</ol>`}
      <div class="order-detail-meta"><section><h3>Customer</h3><strong>${esc(o.customer)}</strong><a href="tel:${esc(orderPhone(o.phone))}">${esc(o.phone)}</a>${o.email ? `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>` : ''}</section><section><h3>Pickup & payment</h3><strong>In-store pickup</strong><span>Payment at pickup</span>${payment ? `<span>Preference: ${payment}</span>` : ''}</section></div>
      ${o.note ? `<section class="order-pickup-note"><h3>${icon('info', 15)} Customer note</h3><p>${esc(o.note)}</p></section>` : ''}
      <section class="order-receipt"><h3>What’s brewing <span>${orderQty(o)} ${orderQty(o) === 1 ? 'item' : 'items'}</span></h3><ul>${o.lines.map(l => `<li><span class="order-line-qty">${l.qty}×</span><div><strong>${esc(l.name)}</strong><small>${esc(l.size || 'Standard')}${l.addons?.length ? ' · ' + esc(l.addons.join(', ')) : ''}</small></div><strong>${money(l.qty * l.unit)}</strong></li>`).join('')}</ul><div class="order-receipt-total"><span>Order total</span><strong>${money(orderTotal(o))}</strong></div></section>
      ${next ? `<form id="order-status-form"><fieldset class="order-status-picker"><legend>Next step</legend><div class="order-status-options"><label><input type="radio" name="status" value="${next}"${selected === next ? ' checked' : ''}><span><strong>${orderAction(next)}</strong><small>${next === 'Processing' ? 'Move this order into preparation.' : 'Confirm the customer has collected this order.'}</small></span></label><label class="order-cancel-option"><input type="radio" name="status" value="Cancelled"${selected === 'Cancelled' ? ' checked' : ''}><span><strong>Cancel order</strong><small>Close this order without pickup.</small></span></label></div></fieldset>
        <label class="order-cancel-confirm" hidden><input type="checkbox" name="confirm-cancel">I understand this will cancel the order and it cannot be reopened.</label>
        <div class="order-modal-actions"><button class="button" type="button" data-cancel>Close</button><button class="button primary" type="submit">${orderAction(next)} ${icon('arrow', 16)}</button></div></form>` : `<p class="order-closed-note">${o.status === 'Completed' ? 'Pickup completed. This order is closed.' : 'No further status changes are available.'}</p><div class="order-modal-actions"><button class="button" type="button" data-cancel>Close details</button></div>`}`, 'order-detail-dialog');
    $('[data-cancel]', dialog).onclick = () => dialog.close();
    const form = $('#order-status-form'); if (!form) return;
    const confirmation = $('.order-cancel-confirm', form), confirmInput = $('input[name="confirm-cancel"]', form), button = $('button[type="submit"]', form);
    const updateAction = () => {
      const cancelling = new FormData(form).get('status') === 'Cancelled';
      confirmation.hidden = !cancelling; confirmInput.required = cancelling;
      if (!cancelling) confirmInput.checked = false;
      button.classList.toggle('danger', cancelling); button.classList.toggle('primary', !cancelling);
      button.innerHTML = cancelling ? 'Confirm cancellation' : `${orderAction(next)} ${icon('arrow', 16)}`;
    };
    $$('input[name="status"]', form).forEach(input => input.addEventListener('change', updateAction)); updateAction();
    form.onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const status = new FormData(form).get('status'), controls = $$('button, input', dialog), errorBox = $('.order-save-error', dialog);
      errorBox.hidden = true; controls.forEach(control => { control.disabled = true; }); dialog.setAttribute('aria-busy', 'true'); button.textContent = 'Saving…';
      try {
        await saveChange({ action: 'order-status', id: o.id, version: o.version, status });
        dialog.removeAttribute('aria-busy'); dialog.close(); render(true); toast(`Order #${o.id} ${status === 'Processing' ? 'is now in preparation' : status === 'Completed' ? 'pickup completed' : 'cancelled'}.`);
        ($(`[data-order="${o.id}"]`, $('#main')) || $('#order-search'))?.focus();
      } catch (error) {
        dialog.removeAttribute('aria-busy');
        let latestLoaded = false;
        if (error.status === 409 && await refreshData(false)) { const originalTrigger = returnFocus; showOrder(id); returnFocus = originalTrigger; latestLoaded = true; }
        const alert = $('.order-save-error', dialog);
        if (alert) { alert.textContent = error.status === 409 ? latestLoaded ? 'This order changed elsewhere. Review the latest details before trying again.' : 'This order changed elsewhere, but the latest details could not be loaded. Close this dialog and refresh before trying again.' : error.message; alert.hidden = false; alert.focus(); }
      } finally {
        dialog.removeAttribute('aria-busy'); controls.forEach(control => { if (control.isConnected) control.disabled = false; });
        if (form.isConnected) updateAction();
      }
    };
  }
  function categories() { return categoryNames; }
  function menuPage(params) {
    const counts = { available: products.filter(p => p.available !== false && !p.soldOut && p.price != null).length, soldout: products.filter(p => p.available !== false && p.soldOut).length, unpriced: products.filter(p => p.price == null).length, hidden: products.filter(p => p.available === false).length };
    $('#main').innerHTML = `<div class="menu-workspace"><div class="page-heading menu-heading"><div><p class="eyebrow">CRAFT YOUR MENU</p><h1>Menu Management</h1><p>Your signature favorites, thoughtfully presented.</p></div><button class="button primary" data-add-product>${icon('plus', 16)} Add menu item</button></div>
      <div class="menu-overview" role="group" aria-label="Menu overview">${[['available', 'Ready to order', 'Priced and in stock', 'cup'], ['soldout', 'Sold out', 'Visible, ordering paused', 'bag'], ['unpriced', 'Needs a price', 'Set a price to enable ordering', 'tag'], ['hidden', 'Hidden from the menu', 'Saved here for another day', 'image']].map(([value, label, help, symbol]) => `<button type="button" class="menu-overview-card" data-menu-filter="${value}" aria-pressed="false"><span>${icon(symbol, 22)}</span><div><small>${label}</small><strong>${counts[value]}</strong></div><p>${help}</p></button>`).join('')}</div>
      <section class="menu-catalogue" aria-label="Menu items"><div class="menu-catalogue-heading"><h2>Made for your menu</h2><span>Photo, price, and visibility — all in one place.</span></div><div class="menu-controls"><div class="menu-search-wrap">${icon('search', 18)}<input type="search" id="menu-search" aria-label="Search menu items" placeholder="Find a favorite…" value="${esc(params.get('q') || '')}"></div><select id="menu-category" aria-label="Filter category"><option value="">All categories</option>${categories().map(c => `<option${c === params.get('category') ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select><select id="menu-availability" aria-label="Filter availability"><option value="">All items</option><option value="available">Ready to order</option><option value="unpriced">Needs a price</option><option value="hidden">Hidden</option></select></div><div class="menu-results-row"><p id="menu-results" role="status" aria-live="polite" aria-atomic="true"></p><span>Visible items without a price cannot be ordered.</span></div><div class="menu-grid" id="menu-grid"></div></section>${previewNote()}</div>`;
    $('#menu-availability').insertAdjacentHTML('beforeend', '<option value="soldout">Sold out</option><option value="featured">Featured on Home</option>');
    $('#menu-availability').value = ['available', 'unpriced', 'hidden', 'soldout', 'featured'].includes(params.get('availability')) ? params.get('availability') : '';
    const filter = (persist = false) => {
      const q = $('#menu-search').value.trim().toLowerCase(), c = $('#menu-category').value, a = $('#menu-availability').value;
      const list = products.filter(p => p.name.toLowerCase().includes(q) && (!c || p.category === c) && (!a || ({ available: p.available !== false && !p.soldOut && p.price != null, hidden: p.available === false, unpriced: p.price == null, soldout: p.available !== false && p.soldOut, featured: p.featured })[a]));
      $('#menu-results').textContent = `${list.length} ${list.length === 1 ? 'item' : 'items'}${c ? ' · ' + c : ''}`;
      $$('[data-menu-filter]').forEach(b => { const active = b.dataset.menuFilter === a; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
      $('#menu-grid').innerHTML = list.map(p => `<article class="menu-card" data-product-card="${esc(p.id)}"><div class="menu-card-img"><img src="${esc(safeImage(p.image))}" alt="${esc(p.name)}" loading="lazy"><span class="status ${p.available === false ? 'status-cancelled' : p.price == null ? 'status-pending' : 'status-completed'}">${p.available === false ? 'Hidden' : p.price == null ? 'Needs a price' : 'Ready to order'}</span><button type="button" class="menu-photo-edit" data-edit-product="${esc(p.id)}" aria-label="Change photo for ${esc(p.name)}">${icon('image', 14)} Photo</button></div><div class="menu-card-body"><small>${esc(p.category)}</small><h2>${esc(p.name)}</h2><div class="menu-card-foot"><button type="button" class="menu-price-button${p.price == null ? ' needs-price' : ''}" data-product-price="${esc(p.id)}" aria-label="Edit price for ${esc(p.name)}">${p.price == null ? 'Set a price' : money(p.price)} ${icon('tag', 13)}</button><button type="button" class="button" data-edit-product="${esc(p.id)}" aria-label="Edit ${esc(p.name)}">Edit details</button></div><div class="menu-visibility"><span>Visible on menu</span><button type="button" role="switch" aria-checked="${p.available !== false}" aria-label="Public visibility for ${esc(p.name)}" class="menu-switch" data-product-visibility="${esc(p.id)}"><span aria-hidden="true"></span></button></div></div></article>`).join('') || `<div class="menu-empty">${icon('cup', 32)}<h3>No favorites found.</h3><p>Try another search or clear your filters.</p><button type="button" class="button" data-clear-menu-filters>Clear filters</button></div>`;
      list.forEach(p => {
        const card = $(`[data-product-card="${p.id}"]`);
        if (p.available !== false && p.soldOut) { const badge = $('.status', card); badge.textContent = 'Sold out'; badge.className = 'status status-soldout'; }
        $('.menu-card-body', card).insertAdjacentHTML('beforeend', `<div class="menu-visibility"><span>Sold out</span><button type="button" role="switch" class="menu-switch stock-switch" data-product-stock="${p.id}" aria-label="Sold out for ${esc(p.name)}" aria-checked="${!!p.soldOut}"><span aria-hidden="true"></span></button></div><button type="button" class="menu-feature-toggle${p.featured ? ' is-featured' : ''}" data-product-feature="${p.id}" aria-pressed="${!!p.featured}">${p.featured ? '★ Featured on Home' : '☆ Feature on Home'}</button>`);
      });
      if (!canManageMenu) $$('[data-edit-product],[data-product-price],[data-product-visibility],[data-product-stock],[data-product-feature]', $('#menu-grid')).forEach(button => { button.disabled = true; button.title = 'Menu editing is available to owners and managers.'; });
      if (persist) {
        const query = new URLSearchParams(); if (q) query.set('q', $('#menu-search').value.trim()); if (c) query.set('category', c); if (a) query.set('availability', a);
        history.replaceState(null, '', '#menu' + (query.size ? '?' + query.toString() : ''));
      }
    };
    $('#menu-search').addEventListener('input', () => filter(true)); $('#menu-category').addEventListener('change', () => filter(true)); $('#menu-availability').addEventListener('change', () => filter(true));
    $$('[data-menu-filter]').forEach(b => b.onclick = () => { $('#menu-availability').value = b.dataset.menuFilter === $('#menu-availability').value ? '' : b.dataset.menuFilter; filter(true); });
    $('#menu-grid').addEventListener('click', e => { if (e.target.closest('[data-clear-menu-filters]')) { $('#menu-search').value = ''; $('#menu-category').value = ''; $('#menu-availability').value = ''; filter(true); $('#menu-search').focus(); } });
    filter();
    if (!canManageMenu) { $('[data-add-product]').disabled = true; $('.menu-catalogue').insertAdjacentHTML('afterbegin', '<p class="role-notice">Your staff account can view the menu. Owners and managers can edit items, prices, and stock.</p>'); }
    if (params.get('edit')) editProduct(params.get('edit'));
  }
  const productPayload = p => ({ action: 'product-save', id: p.id, version: p.version, name: p.name, category: p.category, price: p.price, image: p.image, available: p.available !== false, description: p.description || '', nonCoffee: !!p.nonCoffee, soldOut: !!p.soldOut, featured: !!p.featured, featuredRank: p.featuredRank || 0 });
  async function toggleMenuFlag(button, flag) {
    if (!canManageMenu || button.disabled) return;
    const id = button.dataset.productStock || button.dataset.productFeature, p = products.find(item => item.id === id); if (!p) return;
    button.disabled = true;
    try { await saveChange({ ...productPayload(p), [flag]: !p[flag] }); render(true); toast(flag === 'soldOut' ? `${p.name} ${p.soldOut ? 'is back in stock' : 'is now marked sold out'}.` : `${p.name} ${p.featured ? 'removed from' : 'added to'} homepage favorites.`); }
    catch (error) { toast(error.message); if (error.status === 409 && await refreshData(false)) render(true); }
    finally { if (button.isConnected) button.disabled = false; }
  }
  async function toggleProductVisibility(button) {
    const p = products.find(p => p.id === button.dataset.productVisibility); if (!p || button.disabled) return;
    button.disabled = true; button.setAttribute('aria-busy', 'true');
    try { await saveChange({ ...productPayload(p), available: p.available === false }); render(true); toast(`${p.name} ${p.available === false ? 'is now visible on the menu' : 'hidden from the public menu'}.`); ($(`[data-product-visibility="${p.id}"]`) || $('#menu-search'))?.focus(); }
    catch (error) { if (error.status === 409 && await refreshData(false)) render(true); toast(error.message); }
    finally { if (button.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); } }
  }
  function editProductPrice(id) {
    if (!canManageMenu) return;
    const p = products.find(p => p.id === id); if (!p) return;
    modal('A price for your favorite.', `<p class="price-item-name">${esc(p.name)}</p><form id="price-form"><label class="field">Price in Philippine pesos<div class="menu-money-field"><span aria-hidden="true">₱</span><input name="price" aria-label="Price in Philippine pesos" type="number" min="0" max="100000" step="1" value="${p.price ?? ''}" placeholder="Leave blank if unconfirmed"></div></label><p class="menu-form-help">Use a whole-peso amount. Leave blank to keep the item unpriced and unavailable for ordering.</p>${p.available === false ? '<p class="menu-form-notice">This item is hidden. Changing its price keeps it hidden.</p>' : ''}<p class="form-error" id="price-error" role="alert" tabindex="-1" hidden></p><div class="dialog-actions"><button class="button" type="button" data-cancel>Cancel</button><button class="button primary" type="submit">Save price</button></div></form>`, 'menu-price-dialog');
    $('[data-cancel]', dialog).onclick = () => dialog.close();
    const form = $('#price-form'), input = $('input[name=price]', form); input.focus(); input.select();
    form.onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const price = input.value === '' ? null : Number(input.value), errorBox = $('#price-error');
      if (price !== null && (!Number.isInteger(price) || price < 0 || price > 100000)) { errorBox.textContent = 'Use a whole-peso price from 0 to 100,000, or leave it blank.'; errorBox.hidden = false; return; }
      const controls = $$('button,input', dialog); controls.forEach(el => el.disabled = true); dialog.setAttribute('aria-busy', 'true'); errorBox.hidden = true;
      try { await saveChange({ ...productPayload(p), price }); dialog.removeAttribute('aria-busy'); dialog.close(); render(true); toast(`${p.name} price saved.`); ($(`[data-product-price="${p.id}"]`) || $('#menu-search'))?.focus(); }
      catch (error) { if (error.status === 409) await refreshData(false); errorBox.textContent = error.message + (error.status === 409 ? ' Close and reopen this item to load its latest details.' : ''); errorBox.hidden = false; errorBox.focus(); }
      finally { dialog.removeAttribute('aria-busy'); controls.forEach(el => { if (el.isConnected) el.disabled = false; }); }
    };
  }
  function editProduct(id = null) {
    if (!canManageMenu) return;
    const p = id ? products.find(p => p.id === id) : null;
    if (id && !p) return;
    const photos = new Map([['assets/hero-katribo.jpg', 'Katribo signature coffee'], ...[...seedProducts, ...products].map(item => [item.image, item.name])]);
    modal(p ? 'Edit your favorite.' : 'Make room for a new favorite.', `<p class="menu-editor-intro">A good photo, the right details, and a little care.</p><form id="product-form"><div class="menu-editor-grid"><section class="menu-photo-panel" aria-label="Menu photo"><div class="menu-photo-preview"><img id="product-photo-preview" src="${esc(safeImage(p?.image || ''))}" alt="Menu photo preview"><span id="product-preview-price">${p?.price != null ? money(p.price) : 'Price not set'}</span></div><h3 id="product-preview-name">${esc(p?.name || 'Your next favorite')}</h3><label class="menu-photo-upload">${icon('image', 17)} Upload a photo<input class="sr-only" type="file" id="product-photo" name="photo" accept="image/jpeg,image/png,image/webp"></label><p class="menu-photo-hint">JPG, PNG or WebP · Up to 6 MB<br>800px or larger looks best.</p><p id="product-photo-status" role="status" aria-live="polite"></p><label class="field">Or use an existing photo<select name="image">${[...photos].map(([image, name]) => `<option value="${esc(image)}"${image === p?.image ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select></label></section>
      <section class="menu-item-fields" aria-label="Item details"><label class="field">Item name<input name="name" required maxlength="80" value="${esc(p?.name || '')}" placeholder="e.g. Signature Iced Latte"></label><div class="field-row"><label class="field">Category<select name="category">${categories().map(c => `<option${c === p?.category ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label><label class="field">Price (₱)<input name="price" type="number" min="0" max="100000" step="1" value="${p?.price ?? ''}" placeholder="Unconfirmed"></label></div><p class="menu-form-help">Whole pesos only. Leave the price blank until confirmed.</p><label class="field">Description<textarea name="description" maxlength="500" rows="4" placeholder="Tell customers what makes this a favorite…">${esc(p?.description || '')}</textarea></label><label class="menu-editor-toggle"><span><strong>Visible on the public menu</strong><small>Customers can order once a price is set.</small></span><input type="checkbox" role="switch" name="available"${p?.available !== false ? ' checked' : ''}></label><label class="menu-editor-toggle"><span><strong>Include in Non-Coffee</strong><small>Help customers find their kind of drink.</small></span><input type="checkbox" name="nonCoffee"${p?.nonCoffee ? ' checked' : ''}></label></section></div><p class="form-error" id="product-error" role="alert" tabindex="-1" hidden></p><div class="menu-editor-footer"><p>Saving updates the public menu and checkout prices.</p><div class="dialog-actions">${p ? '<button class="button danger" type="button" data-delete-product>Remove item</button>' : ''}<button class="button" type="button" data-cancel>Cancel</button><button class="button primary" type="submit">Save menu item</button></div></div></form>`, 'menu-editor-dialog');
    $('[data-cancel]', dialog).onclick = () => dialog.close();
    $('.menu-item-fields', dialog).insertAdjacentHTML('beforeend', `<label class="menu-editor-toggle"><span><strong>Sold out</strong><small>Keep visible while pausing new orders.</small></span><input type="checkbox" role="switch" name="soldOut"${p?.soldOut ? ' checked' : ''}></label><label class="menu-editor-toggle"><span><strong>Featured on Home</strong><small>Include in the customer homepage favorites.</small></span><input type="checkbox" name="featured"${p?.featured ? ' checked' : ''}></label>`);
    let photo = null, previewUrl = null;
    const form = $('#product-form'), photoInput = $('#product-photo'), preview = $('#product-photo-preview'), errorBox = $('#product-error');
    const releasePreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null; }; modalCleanup = releasePreview;
    photoInput.addEventListener('change', () => {
      releasePreview(); photo = null; errorBox.hidden = true;
      const file = photoInput.files[0];
      if (!file) { preview.src = safeImage($('select[name=image]', form).value); $('#product-photo-status').textContent = ''; return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 6 * 1024 * 1024) { errorBox.textContent = 'Choose a JPG, PNG or WebP photo up to 6 MB.'; errorBox.hidden = false; photoInput.value = ''; preview.src = safeImage($('select[name=image]', form).value); $('#product-photo-status').textContent = ''; errorBox.focus(); return; }
      photo = file; previewUrl = URL.createObjectURL(file); preview.src = previewUrl; $('#product-photo-status').textContent = `${file.name} · Preview only until you save.`;
    });
    $('select[name=image]', form).addEventListener('change', e => { releasePreview(); photo = null; photoInput.value = ''; preview.src = safeImage(e.target.value); $('#product-photo-status').textContent = ''; });
    $('input[name=name]', form).addEventListener('input', e => $('#product-preview-name').textContent = e.target.value.trim() || 'Your next favorite');
    $('input[name=price]', form).addEventListener('input', e => $('#product-preview-price').textContent = e.target.value === '' ? 'Price not set' : money(Number(e.target.value)));
    $('#product-form').onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const data = new FormData(form); const name = data.get('name').trim(); const price = data.get('price') === '' ? null : Number(data.get('price'));
      if (!name || (price !== null && (!Number.isInteger(price) || price < 0 || price > 100000))) { $('#product-error').textContent = 'Enter an item name and a whole-peso price from 0 to 100,000, or leave the price blank.'; $('#product-error').hidden = false; return; }
      const item = { action: 'product-save', id: p?.id || null, version: p?.version || null, name, category: data.get('category'), price, image: data.get('image'), available: data.has('available'), description: data.get('description').trim(), nonCoffee: data.has('nonCoffee'), soldOut: data.has('soldOut'), featured: data.has('featured'), featuredRank: p?.featuredRank || 0 };
      const controls = $$('button,input,select,textarea', dialog), button = $('button[type=submit]', form); controls.forEach(el => el.disabled = true); dialog.setAttribute('aria-busy', 'true'); button.textContent = photo ? 'Saving photo & item…' : 'Saving…'; errorBox.hidden = true;
      try { const result = await saveChange(item, photo); dialog.removeAttribute('aria-busy'); dialog.close(); render(true); toast(`${name} saved to the menu.`); ($(`[data-edit-product="${result.product.id}"]`) || $('#menu-search'))?.focus(); }
      catch (error) { if (error.status === 409) await refreshData(false); errorBox.textContent = error.message + (error.status === 409 ? ' Close and reopen this item to load its latest details.' : ''); errorBox.hidden = false; errorBox.focus(); }
      finally { dialog.removeAttribute('aria-busy'); controls.forEach(el => { if (el.isConnected) el.disabled = false; }); if (button.isConnected) button.textContent = 'Save menu item'; }
    };
    if (p) $('[data-delete-product]', dialog).onclick = () => {
      modal('Remove menu item?', `<p>Remove <strong>${esc(p.name)}</strong> from the public menu? Past orders retain this item's name and price.</p><div class="dialog-actions"><button class="button" data-cancel>Keep item</button><button class="button danger" data-confirm-delete>Remove item</button></div>`);
      $('[data-cancel]', dialog).onclick = () => dialog.close();
      $('[data-confirm-delete]', dialog).onclick = async e => { e.currentTarget.disabled = true; try { await saveChange({ action: 'product-delete', id: p.id, version: p.version }); dialog.close(); render(true); toast('Item removed from the public menu.'); $('#menu-search')?.focus(); } catch (error) { toast(error.message); if ($('[data-confirm-delete]', dialog)) $('[data-confirm-delete]', dialog).disabled = false; } };
    };
  }
  const featuredProducts = () => products.filter(p => p.featured).sort((a, b) => (a.featuredRank || 10001) - (b.featuredRank || 10001) || a.id.localeCompare(b.id));
  function featuredPage() {
    const list = featuredProducts();
    $('#main').innerHTML = `<div class="feature-workspace">${heading('A FEW HOUSE FAVORITES', 'Featured drinks', 'Choose and arrange the customer homepage favorites.', '<a class="button primary" href="#menu">Choose drinks from menu →</a>')}<p class="feature-help">Use “Feature on Home” on any menu card to add it here. Move drinks up or down to set their order. Hidden items stay off the customer site.</p><ol class="featured-list">${list.map((p, i) => `<li class="featured-row"><span class="featured-position">${i + 1}</span><img src="${esc(safeImage(p.image))}" alt="${esc(p.name)}"><div class="featured-name"><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${p.available === false ? 'Hidden — not shown on Home' : p.soldOut ? 'Sold out — visible, ordering paused' : p.price == null ? 'Price unconfirmed' : money(p.price)}</small></div><div class="featured-actions"><button type="button" class="button" data-feature-move="${p.id}" data-direction="-1" aria-label="Move ${esc(p.name)} up"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" class="button" data-feature-move="${p.id}" data-direction="1" aria-label="Move ${esc(p.name)} down"${i === list.length - 1 ? ' disabled' : ''}>↓</button><button type="button" class="button" data-product-feature="${p.id}" aria-label="Remove ${esc(p.name)} from homepage favorites">Remove</button></div></li>`).join('') || '<li class="menu-empty"><h3>A fresh selection awaits.</h3><p>Feature drinks from the menu to build your homepage favorites.</p><a class="button" href="#menu">Choose drinks →</a></li>'}</ol>${previewNote()}</div>`;
  }
  async function moveFeatured(button) {
    if (!canManageMenu || button.disabled) return;
    const list = featuredProducts(), index = list.findIndex(p => p.id === button.dataset.featureMove), target = index + Number(button.dataset.direction);
    if (index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    const controls = $$('.featured-actions button'); controls.forEach(el => el.disabled = true);
    try { await saveChange({ action: 'featured-reorder', items: list.map(p => ({ id: p.id, version: p.version })) }); render(true); toast('Homepage favorites reordered.'); }
    catch (error) { toast(error.message); if (await refreshData(false)) render(true); }
    finally { controls.forEach(el => { if (el.isConnected) el.disabled = false; }); }
  }
  function teamPage() {
    $('#main').innerHTML = `<div class="team-workspace">${heading('GOOD PEOPLE, WORKING TOGETHER', 'Team & access', 'Give each person the access they need.', '<button type="button" class="button primary" data-add-team>+ Add team member</button>')}<div class="team-role-guide"><section><h2>Owner</h2><p>Full workspace and team management.</p></section><section><h2>Manager</h2><p>Menu, stock, homepage favorites, and orders.</p></section><section><h2>Staff</h2><p>View the menu, process orders, and print prep slips.</p></section></div><div class="team-list">${team.map(user => `<article class="team-card"><div class="team-avatar" aria-hidden="true">${esc(Array.from(user.name)[0].toUpperCase())}</div><div class="team-person"><h2>${esc(user.name)}</h2><p>${esc(user.email)}</p><small>${user.last_login_at ? 'Last sign-in ' + niceDate(user.last_login_at * 1000) : 'Not signed in yet'}</small></div><div class="team-access"><span class="team-role">${esc(user.role)}</span><span class="team-state${user.active ? '' : ' is-paused'}">${user.active ? 'Active' : 'Access paused'}</span></div>${user.role === 'owner' ? '<span class="team-owner-label">Owner account</span>' : `<button type="button" class="button" data-edit-team="${user.id}" aria-label="Edit access for ${esc(user.name)}">Edit access</button>`}</article>`).join('')}</div><p class="team-help">Pausing access, changing a role, or resetting a password signs that member out of existing sessions. The owner account stays protected.</p>${previewNote()}</div>`;
  }
  function editTeam(id = null) {
    if (!canManageTeam) return;
    const user = id ? team.find(person => person.id === id) : null; if (id && (!user || user.role === 'owner')) return;
    modal(user ? 'Edit team access.' : 'Welcome someone to the team.', `<p class="team-form-intro">Managers can edit the menu and process orders. Staff can process orders and print prep slips.</p><form id="team-form"><label class="field">Full name<input name="name" autocomplete="off" required minlength="2" maxlength="80" value="${esc(user?.name || '')}"></label><label class="field">Email address<input type="email" name="email" autocomplete="off" required maxlength="254" value="${esc(user?.email || '')}"></label><label class="field">Role<select name="role"><option value="staff"${user?.role !== 'manager' ? ' selected' : ''}>Staff — orders and prep slips</option><option value="manager"${user?.role === 'manager' ? ' selected' : ''}>Manager — menu and orders</option></select></label><label class="field">${user ? 'New passphrase (optional)' : 'Sign-in passphrase'}<input type="password" name="password" autocomplete="new-password"${user ? '' : ' required'} minlength="12" maxlength="72"></label><p class="team-password-help">At least 12 characters, at most 72 bytes.${user ? ' Leave blank to keep the current passphrase.' : ' Share it directly with the member; no email invitation is sent.'}</p><label class="checkbox-field"><input type="checkbox" name="active"${user?.active !== false ? ' checked' : ''}> Allow this member to sign in</label>${user ? '<p class="team-form-notice">Saving changes signs this member out of existing sessions.</p>' : ''}<p id="team-error" class="form-error" role="alert" tabindex="-1" hidden></p><div class="dialog-actions"><button type="button" class="button" data-cancel>Cancel</button><button type="submit" class="button primary">${user ? 'Save access' : 'Create team account'}</button></div></form>`, 'team-editor-dialog');
    $('[data-cancel]', dialog).onclick = () => dialog.close();
    const form = $('#team-form');
    form.onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const data = new FormData(form), controls = $$('button,input,select', dialog), errorBox = $('#team-error');
      const input = { action: 'team-save', id: user?.id || null, version: user?.version || null, name: data.get('name').trim(), email: data.get('email').trim(), password: data.get('password'), role: data.get('role'), active: data.has('active') };
      controls.forEach(el => el.disabled = true); dialog.setAttribute('aria-busy', 'true'); errorBox.hidden = true;
      try { await saveChange(input); dialog.removeAttribute('aria-busy'); dialog.close(); render(true); toast(user ? 'Team access updated.' : 'Team account created.'); }
      catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; errorBox.focus(); if (error.status === 409) await refreshData(false); }
      finally { dialog.removeAttribute('aria-busy'); controls.forEach(el => { if (el.isConnected) el.disabled = false; }); }
    };
  }
  function categoriesPage() {
    $('#main').innerHTML = `${heading('A PLACE FOR EVERY FAVORITE', 'Categories', 'Browse the categories in your public menu.')}<div class="menu-grid">${categories().map(c => { const list = products.filter(p => p.category === c); return `<a class="panel" href="#menu?category=${encodeURIComponent(c)}" style="padding:24px">${icon(c === 'Milkshake' ? 'shake' : c === 'Pastries' ? 'cake' : 'cup', 28)}<h2 style="margin:16px 0 6px">${esc(c)}</h2><p style="color:var(--muted)">${list.length} items <span style="float:right;color:var(--cream)">↗</span></p></a>`; }).join('')}</div>${previewNote()}`;
  }
  function customersPage(params) {
    const customers = new Map();
    orders.filter(o => o.status !== 'Cancelled').forEach(o => { const p = customers.get(o.customerKey) || { name: o.customer, phone: o.phone, count: 0, spend: 0, last: o.date }; p.count++; if (o.status === 'Completed') p.spend += orderTotal(o); if (o.date > p.last) { p.last = o.date; p.name = o.customer; } customers.set(o.customerKey, p); });
    $('#main').innerHTML = `${heading('THE PEOPLE BEHIND THE COFFEE', 'Customers', 'A quick view of your pickup customers.')}<div class="page-note">Guests are grouped by mobile number. Spending includes completed orders only.</div><section class="panel"><div class="toolbar"><input type="search" id="customer-search" aria-label="Search customers" placeholder="Search customer name…" value="${esc(params.get('q') || '')}"><span class="result-count" id="customer-results" aria-live="polite"></span></div><div class="table-wrap"><table class="orders-full"><thead><tr><th scope="col">Customer</th><th scope="col">Orders</th><th scope="col">Total spent</th><th scope="col">Last order</th><th scope="col">Actions</th></tr></thead><tbody id="customer-body"></tbody></table></div></section>${previewNote()}`;
    const filter = () => { const q = $('#customer-search').value.toLowerCase().trim(); const list = [...customers.values()].filter(c => `${c.name} ${c.phone}`.toLowerCase().includes(q)).sort((a, b) => b.spend - a.spend); $('#customer-results').textContent = `${list.length} customers`; $('#customer-body').innerHTML = list.map(c => `<tr><td>${esc(c.name)}<small class="customer-contact">${esc(c.phone)}</small></td><td>${c.count}</td><td>${money(c.spend)}</td><td class="order-date">${niceDate(c.last)}</td><td><a class="text-link" href="#orders?q=${encodeURIComponent(c.phone)}">View orders ↗</a></td></tr>`).join('') || '<tr><td class="empty" colspan="5">No customers found.</td></tr>'; };
    $('#customer-search').addEventListener('input', filter); filter();
  }
  function analyticsPage() {
    const top = topItems();
    $('#main').innerHTML = `${heading('EVERY CUP COUNTS', 'Analytics', 'A closer look at saved sales and bestsellers.')}<div class="page-note">Sales show completed-order value; payment collection is not tracked. Month-to-date comparisons use the full previous month.</div>${stats()}${chartPanel()}<section class="panel" style="margin-top:16px"><div class="panel-header"><h2>Best sellers this month</h2><button class="button" data-export-sales>Export CSV</button></div><div class="table-wrap"><table class="orders-full"><thead><tr><th scope="col">Menu item</th><th scope="col">Units sold</th><th scope="col">Sales</th></tr></thead><tbody>${top.map(t => `<tr><td>${esc(t.name)}</td><td>${t.qty}</td><td>${money(t.revenue)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">No completed sales this month.</td></tr>'}</tbody></table></div></section>${previewNote()}`;
    drawChart(); $('#sales-range').onchange = e => drawChart(e.target.value);
    $('[data-export-sales]').onclick = () => exportCsv('katribo-sales.csv', ['Menu item', 'Units sold', 'Sales PHP'], top.map(t => [t.name, t.qty, t.revenue]));
  }
  function exportCsv(filename, headers, rows) {
    const cell = value => { let s = String(value); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  let previousRoute = '';
  function render(preserveFilters = false) {
    const [rawRoute, query = ''] = location.hash.slice(1).split('?'); const route = rawRoute || (role === 'staff' ? 'orders' : 'dashboard'); const params = new URLSearchParams(query);
    if ((route === 'team' && !canManageTeam) || (['featured', 'dashboard', 'customers', 'analytics'].includes(route) && role === 'staff')) { location.hash = role === 'staff' ? 'orders' : 'menu'; return; }
    const page = { dashboard, orders: ordersPage, menu: menuPage, featured: featuredPage, team: teamPage, categories: categoriesPage, customers: customersPage, analytics: analyticsPage }[route];
    if (!page) { location.hash = 'dashboard'; return; }
    if (!databaseReady) {
      $('#main').innerHTML = `<section class="database-state"><p class="eyebrow">KATRIBO ADMIN</p><h1>${dataError ? 'Orders are temporarily unavailable' : 'Connecting your workspace…'}</h1><p>${dataError ? esc(dataError) : 'Loading saved orders and menu items from MySQL.'}</p>${dataError ? '<button class="button primary" data-retry-data>Try again</button>' : ''}</section>`;
      $('[data-retry-data]')?.addEventListener('click', () => refreshData());
      return;
    }
    const samePage = preserveFilters && route === previousRoute;
    const chartRange = samePage ? $('#sales-range')?.value : null;
    const availability = samePage ? $('#menu-availability')?.value : null;
    if (samePage) {
      const input = route === 'orders' ? $('#order-search') : route === 'menu' ? $('#menu-search') : $('#customer-search');
      if (input) params.set('q', input.value);
      if (route === 'menu' && $('#menu-category')) params.set('category', $('#menu-category').value);
      if (route === 'orders' && $('[data-status-filter].active')) params.set('status', $('[data-status-filter].active').dataset.statusFilter);
    }
    $$('[data-route]').forEach(a => { const active = a.dataset.route === route + (params.has('category') ? `?category=${encodeURIComponent(params.get('category'))}` : ''); a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('[data-order-count]').textContent = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    $('[data-notifications]').classList.toggle('is-clear', !orders.some(o => o.status === 'Pending' || o.status === 'Processing'));
    const names = { dashboard: 'Dashboard', orders: 'Orders', menu: 'Menu Management', featured: 'Featured drinks', team: 'Team & access', categories: 'Categories', customers: 'Customers', analytics: 'Analytics' };
    document.title = `${names[route]} · KATRIBO Admin`;
    page(params); closeSidebar();
    if (chartRange && $('#sales-range')) { $('#sales-range').value = chartRange; drawChart(chartRange); }
    if (availability && $('#menu-availability')) { $('#menu-availability').value = availability; $('#menu-availability').dispatchEvent(new Event('change')); }
    // Consume links that open a dialog, so saving does not reopen that dialog.
    if (params.has('id') || params.has('edit')) {
      params.delete('id'); params.delete('edit');
      history.replaceState(null, '', `#${route}${params.size ? '?' + params.toString() : ''}`);
    }
    if (route !== previousRoute) { scrollTo(0, 0); previousRoute = route; }
    $$('[data-about-inline]').forEach(a => a.onclick = e => { e.preventDefault(); aboutPreview(); });
    $$('[data-planned]', $('#main')).forEach(b => b.onclick = () => plannedModal(b.dataset.planned));
  }
  $('#main').addEventListener('click', e => { const order = e.target.closest('[data-order]'); if (order) showOrder(order.dataset.order); const next = e.target.closest('[data-order-next]'); if (next) showOrder(next.dataset.orderNext, nextOrderStatus(orders.find(o => o.id === Number(next.dataset.orderNext))?.status)); const edit = e.target.closest('[data-edit-product]'); if (edit) { editProduct(edit.dataset.editProduct); if (edit.classList.contains('menu-photo-edit')) $('#product-photo')?.focus(); } const price = e.target.closest('[data-product-price]'); if (price) editProductPrice(price.dataset.productPrice); const visibility = e.target.closest('[data-product-visibility]'); if (visibility) toggleProductVisibility(visibility); if (e.target.closest('[data-add-product]')) editProduct(); });
  $('#main').addEventListener('click', e => { const stock = e.target.closest('[data-product-stock]'); if (stock) toggleMenuFlag(stock, 'soldOut'); const feature = e.target.closest('[data-product-feature]'); if (feature) toggleMenuFlag(feature, 'featured'); const move = e.target.closest('[data-feature-move]'); if (move) moveFeatured(move); if (e.target.closest('[data-add-team]')) editTeam(); const member = e.target.closest('[data-edit-team]'); if (member) editTeam(member.dataset.editTeam); });
  $('[data-notifications]').onclick = () => {
    const list = recentOrders().filter(o => ['Pending', 'Processing'].includes(o.status));
    modal('Orders needing attention', `<p>${list.length} orders are waiting for your team.</p><div class="notification-list">${list.map(o => `<a href="#orders?id=${o.id}" data-notification-order="${o.id}">${icon('orders', 22)}<span>Order #${o.id} · ${esc(o.customer)}<small>${o.status} · ${money(orderTotal(o))}</small></span></a>`).join('') || '<p>All caught up. No orders need attention.</p>'}</div>`);
    $$('[data-notification-order]', dialog).forEach(a => a.onclick = () => { dialog.close(); if (location.hash === a.getAttribute('href')) setTimeout(() => showOrder(Number(a.dataset.notificationOrder)), 0); });
  };
  const search = $('#global-search'), results = $('#search-results');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase(); if (!q) { results.hidden = true; return; }
    const matchingProducts = products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 4);
    const matchingOrders = recentOrders().filter(o => `${o.id} ${o.ref} ${o.customer} ${o.phone}`.toLowerCase().includes(q.replace(/^#/, ''))).slice(0, 4);
    results.innerHTML = matchingProducts.map(p => `<a href="#menu?edit=${encodeURIComponent(p.id)}"><span>${esc(p.name)}</span><small>Menu · ${money(p.price)}</small></a>`).join('') + matchingOrders.map(o => `<a href="#orders?id=${o.id}"><span>${esc(o.ref)} · ${esc(o.customer)}</span><small>${o.status}</small></a>`).join('') || '<p>No results. Try a drink name, customer or order number.</p>';
    results.hidden = false;
  });
  $('.global-search').onsubmit = e => { e.preventDefault(); results.hidden = true; const route = `orders?q=${encodeURIComponent(search.value.trim())}`; if (location.hash.slice(1) === route) render(); else location.hash = route; search.blur(); };
  results.addEventListener('click', e => { if (e.target.closest('a')) { results.hidden = true; search.value = ''; if (location.hash === e.target.closest('a').getAttribute('href')) render(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.global-search')) results.hidden = true; if (!e.target.closest('.profile')) $('.profile').open = false; });
  document.addEventListener('keydown', e => { const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); if (e.key === '/' && !typing && !dialog.open) { e.preventDefault(); search.focus(); } if (e.key === 'Escape') { results.hidden = true; closeSidebar(); $('.profile').open = false; } if (e.key === 'ArrowDown' && e.target === search && !results.hidden) { e.preventDefault(); $('a', results)?.focus(); } });
  window.addEventListener('hashchange', () => { if (dialog.open) dialog.close(); render(); });
  render();
  refreshData();
  setInterval(() => {
    const editing = dialog.open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName); if (editing) pendingRender = true; refreshData(!editing);
  }, 15000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { const editing = dialog.open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName); if (editing) pendingRender = true; refreshData(!editing); } });
})();

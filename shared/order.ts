/**
 * Order validation shared by the Netlify Function (production) and the Vite dev server.
 * Every price is recalculated here from the menu — prices sent by the browser are ignored.
 *
 * DEMO ONLY: nothing is stored, charged or sent to the café.
 * To go live, save `lines` to a database / send a notification inside handleOrder.
 */
import { ADDONS, PRODUCTS, PRODUCT_BY_ID, SIZES, type AddonId, type SizeId } from '../src/data/menu';

/** The original eight homepage favourites (the admin's featured list starts from these). */
const DEMO_FEATURED = ['caramel-macchiato', 'iced-latte', 'spanish-latte', 'chocolate-milkshake',
  'matcha-latte', 'strawberry-milkshake', 'ube-milkshake', 'cookies-cream'];

/**
 * Built-in sample menu in the same shape as the PHP admin's /api/catalogue.
 * Used by the public demo (e.g. Render), which has no PHP/MySQL admin behind it.
 */
export function demoCatalogue() {
  return {
    ok: true,
    demo: true,
    products: PRODUCTS.map((p) => ({ ...p, featured: DEMO_FEATURED.includes(p.id), featuredRank: DEMO_FEATURED.indexOf(p.id) + 1 })),
    sizes: SIZES,
    addons: ADDONS,
  };
}

type Result = { status: number; data: Record<string, unknown> };

const fail = (status: number, message: string, fields: Record<string, string> = {}): Result =>
  ({ status, data: { ok: false, message, fields } });

export function handleOrder(method: string, rawBody: string): Result {
  if (method !== 'POST') return fail(405, 'Method not allowed.');

  let input: any;
  try { input = JSON.parse(rawBody || ''); } catch { return fail(400, 'Invalid request.'); }
  if (!input || typeof input !== 'object') return fail(400, 'Invalid request.');

  const name = String(input.name ?? '').trim();
  const phone = String(input.phone ?? '').replace(/[\s\-()]/g, '');
  const email = String(input.email ?? '').trim();
  const fulfilment = String(input.fulfilment ?? 'pickup');

  const fields: Record<string, string> = {};
  if (name.length < 2 || name.length > 80) fields.name = 'Please enter your full name.';
  if (!/^(\+639|09)\d{9}$/.test(phone)) fields.phone = 'Enter a valid PH mobile number, e.g. 0917 123 4567.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fields.email = 'Enter a valid email address.';
  if (fulfilment !== 'pickup') fields.fulfilment = 'Only pickup is available right now.';
  if (Object.keys(fields).length) return fail(422, 'Please check the highlighted fields.', fields);

  const items = Array.isArray(input.items) ? input.items : [];
  if (!items.length) return fail(422, 'Your cart is empty.');
  if (items.length > 50) return fail(422, 'Too many items in one order.');

  let total = 0;
  const lines = [];
  for (const it of items) {
    const p = PRODUCT_BY_ID[String(it?.id ?? '')];
    if (!p || p.price == null) return fail(422, 'One of the drinks in your cart is no longer available.');
    const size = SIZES.find((s) => s.id === (it.size as SizeId));
    if (!size) return fail(422, 'Invalid size selected.');
    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return fail(422, 'Invalid quantity.');
    let unit = p.price + size.add;
    const chosen: string[] = [];
    for (const aid of Array.isArray(it.addons) ? it.addons : []) {
      const a = ADDONS.find((x) => x.id === (aid as AddonId));
      if (!a) return fail(422, 'Invalid add-on selected.');
      unit += a.price;
      chosen.push(a.label);
    }
    total += unit * qty;
    lines.push({ name: p.name, size: size.label, addons: chosen, qty, unit });
  }

  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');

  return { status: 200, data: { ok: true, demo: true, ref: `KTB-${stamp}-${rand}`, name, total, lines } };
}

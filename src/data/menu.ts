/**
 * KATRIBO — menu (DESIGN SAMPLE, NOT A VERIFIED MENU)
 *
 * - Prices exist only where the UI reference shows one. `null` = "Price unavailable"
 *   (shown on the site, and the drink cannot be added to the cart).
 * - Size and add-on prices are the sample values from the UI reference.
 * - Only Caramel Macchiato has a description (copied from the reference).
 *   Don't add ingredients or allergens until the café confirms them.
 *
 * Edit this file to update the menu everywhere (cards, details, cart, checkout, server check).
 */

export type Category = 'Coffee' | 'Milkshake' | 'Latte' | 'Macchiato' | 'Specialty' | 'Pastries';
export type Filter = 'All' | Category | 'Non-Coffee';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number | null;
  image: string;
  soldOut?: boolean;
  featured?: boolean;
  featuredRank?: number;
  nonCoffee: boolean;
  description?: string;
}

/** Filter order follows the UI reference (Specialty and Pastries added). */
export const FILTERS: Filter[] = ['All', 'Coffee', 'Milkshake', 'Latte', 'Macchiato', 'Specialty', 'Non-Coffee', 'Pastries'];

const DEFAULT_SIZES = [
  { id: 'regular', label: 'Regular', add: 0 },
  { id: 'large', label: 'Large', add: 20 },
] as const;

const DEFAULT_ADDONS = [
  { id: 'extra-espresso', label: 'Extra Espresso', price: 20 },
  { id: 'caramel-syrup', label: 'Caramel Syrup', price: 20 },
  { id: 'whipped-cream', label: 'Whipped Cream', price: 20 },
  { id: 'oat-milk', label: 'Oat Milk', price: 30 },
] as const;

export type SizeId = (typeof DEFAULT_SIZES)[number]['id'];
export type AddonId = (typeof DEFAULT_ADDONS)[number]['id'];
export let SIZES: readonly { id: SizeId; label: string; add: number }[] = DEFAULT_SIZES;
export let ADDONS: readonly { id: AddonId; label: string; price: number }[] = DEFAULT_ADDONS;

const img = (file: string) => `/images/drinks/${file}.jpg`;

// [id, name, category, price, image file, nonCoffee, description?]
const RAW: [string, string, Category, number | null, string, boolean, string?][] = [
  ['americano', 'Americano', 'Coffee', 120, 'americano', false],
  ['mocha', 'Mocha', 'Coffee', 150, 'mocha', false],

  ['chocolate-milkshake', 'Chocolate Milkshake', 'Milkshake', 160, 'chocolate-milkshake', true],
  ['vanilla-milkshake', 'Vanilla Milkshake', 'Milkshake', 160, 'vanilla-milkshake', true],
  ['cookies-cream', 'Cookies & Cream', 'Milkshake', 160, 'cookies-cream-milkshake', true],
  ['strawberry-milkshake', 'Strawberry Milkshake', 'Milkshake', 160, 'strawberry-milkshake', true],
  ['matcha-milkshake', 'Matcha Milkshake', 'Milkshake', null, 'matcha-milkshake', true],
  ['mango-milkshake', 'Mango Milkshake', 'Milkshake', null, 'mango-milkshake', true],
  ['ube-milkshake', 'Ube Milkshake', 'Milkshake', null, 'ube-milkshake', true],
  ['caramel-milkshake', 'Caramel Milkshake', 'Milkshake', null, 'caramel-milkshake', true],

  ['iced-latte', 'Iced Latte', 'Latte', 150, 'iced-latte', false],
  ['spanish-latte', 'Spanish Latte', 'Latte', 160, 'spanish-latte', false],
  ['matcha-latte', 'Matcha Latte', 'Latte', 150, 'matcha-latte', true],
  ['caramel-latte', 'Caramel Latte', 'Latte', 160, 'caramel-latte', false],
  ['vanilla-latte', 'Vanilla Latte', 'Latte', null, 'vanilla-latte', false],

  ['caramel-macchiato', 'Caramel Macchiato', 'Macchiato', 160, 'caramel-macchiato', false,
    'A perfect balance of rich espresso, steamed milk, and sweet caramel, topped with a smooth finish.'],
  ['brown-sugar-macchiato', 'Brown Sugar Macchiato', 'Macchiato', 160, 'brown-sugar-latte', false],
  ['white-chocolate-mocha', 'White Chocolate Mocha', 'Macchiato', 160, 'white-chocolate-mocha', false],
  ['dark-mocha-macchiato', 'Dark Mocha Macchiato', 'Macchiato', 160, 'dark-mocha', false],

  ['biscoff-latte', 'Biscoff Latte', 'Specialty', null, 'biscoff-latte', false],
  ['coffee-jelly', 'Coffee Jelly', 'Specialty', null, 'coffee-jelly-milkshake', false],

  // Pastries — no sizes or add-ons; prices to be confirmed by the café
  ['cheesecake', 'Cheesecake', 'Pastries', null, 'cheesecake', false],
  ['chocolate-cake', 'Chocolate Cake', 'Pastries', null, 'chocolate-cake', false],
];

export let PRODUCTS: Product[] = RAW.map(([id, name, category, price, file, nonCoffee, description]) => ({
  id, name, category, price, image: img(file), nonCoffee, description,
}));

export let PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// These legacy photos are enlarged mockup crops, rather than full-size product photos.
// Match the image URL so a future replacement photo for the same drink is shown normally.
const RETIRED_PHOTOS = new Set(['cold-brew', 'espresso', 'hazelnut-latte', 'hot-latte', 'hojicha-latte']
  .map((name) => `/media/assets/img/drinks/${name}.jpg`));

/** Called before importing App/cart: the live admin menu replaces every sample entry. */
export function installCatalogue(data: { products: Product[]; sizes: typeof SIZES; addons: typeof ADDONS }) {
  if (!Array.isArray(data.products) || !Array.isArray(data.sizes) || !Array.isArray(data.addons)) throw new Error('Invalid menu response.');
  const categories: Category[] = ['Coffee', 'Milkshake', 'Latte', 'Macchiato', 'Specialty', 'Pastries'];
  const products = data.products.map((p) => {
    if (!p || typeof p.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(p.id) || typeof p.name !== 'string'
      || !categories.includes(p.category) || typeof p.image !== 'string' || !/^\/(images|media)\//.test(p.image)
      || (p.price !== null && (!Number.isInteger(p.price) || p.price < 0))
      || (p.soldOut !== undefined && typeof p.soldOut !== 'boolean')
      || (p.featured !== undefined && typeof p.featured !== 'boolean')
      || (p.featuredRank !== undefined && (!Number.isInteger(p.featuredRank) || p.featuredRank < 0))) throw new Error('Invalid menu item.');
    return { ...p, image: RETIRED_PHOTOS.has(p.image.split('?')[0]) ? '/images/drinks/photo-unavailable.svg' : p.image,
      description: p.description || undefined };
  });
  if (new Set(products.map((p) => p.id)).size !== products.length) throw new Error('Duplicate menu item.');
  if (data.sizes.length !== DEFAULT_SIZES.length || data.addons.length !== DEFAULT_ADDONS.length
    || data.sizes.some((s) => !DEFAULT_SIZES.some((d) => d.id === s.id) || !Number.isInteger(s.add) || s.add < 0)
    || data.addons.some((a) => !DEFAULT_ADDONS.some((d) => d.id === a.id) || !Number.isInteger(a.price) || a.price < 0)) throw new Error('Invalid menu options.');
  PRODUCTS = products;
  PRODUCT_BY_ID = Object.fromEntries(products.map((p) => [p.id, p]));
  SIZES = data.sizes;
  ADDONS = data.addons;
}

export const pick = (ids: string[]) => ids.map((id) => PRODUCT_BY_ID[id]).filter(Boolean) as Product[];

/** Pastries are sold as-is: no size or add-on choices. */
export const isFood = (p: Pick<Product, 'category'>) => p.category === 'Pastries';

export const inFilter = (p: Product, f: Filter) =>
  f === 'All' || (f === 'Non-Coffee' ? p.nonCoffee : p.category === f);

/** Unit price for a configuration, or null if the drink has no confirmed price. */
export function unitPrice(id: string, size: SizeId, addons: readonly AddonId[]): number | null {
  const p = PRODUCT_BY_ID[id];
  if (!p || p.price == null) return null;
  const s = SIZES.find((x) => x.id === size)?.add ?? 0;
  const a = addons.reduce((t, aid) => t + (ADDONS.find((x) => x.id === aid)?.price ?? 0), 0);
  return p.price + s + a;
}

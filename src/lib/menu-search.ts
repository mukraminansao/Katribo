import type { Product } from '../data/menu';

export const normalizeSearch = (value: string) => value.normalize('NFKD')
  .replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/&/g, ' and ')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

/** Match every query word, prefer names, and retain catalogue order for equal scores. */
export function searchMenu(products: readonly Product[], query: string): Product[] {
  const text = normalizeSearch(query);
  if (!text) return [...products];
  const words = text.split(' ');
  return products.map((product, index) => {
    const name = normalizeSearch(product.name);
    const haystack = normalizeSearch(`${product.name} ${product.category} ${product.description || ''}`);
    const matches = words.every((word) => haystack.includes(word));
    const score = name === text ? 0 : name.startsWith(text) ? 1 : words.every((word) => name.includes(word)) ? 2 : 3;
    return { product, index, matches, score };
  }).filter((row) => row.matches).sort((a, b) => a.score - b.score || a.index - b.index).map((row) => row.product);
}

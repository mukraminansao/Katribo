/** Keep the same idempotency key after a lost response, including a page reload. */
const STORAGE_KEY = 'katribo.checkout-request.v1';
let current: { fingerprint: string; key: string } | null = null;
export function checkoutKey(payload: unknown): string {
  const fingerprint = JSON.stringify(payload);
  if (!current) {
    try { current = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* storage unavailable */ }
  }
  if (!current || current.fingerprint !== fingerprint || !/^[a-f0-9]{48}$/.test(current.key)) {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    current = { fingerprint, key: Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('') };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* in-memory retries still work */ }
  }
  return current.key;
}
export function clearCheckoutKey() {
  current = null;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
}

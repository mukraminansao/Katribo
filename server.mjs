/**
 * Production server for hosts that run Node (e.g. Render).
 * Serves the built site from dist/ and connects catalogue/pickup orders to the
 * existing PHP/MySQL admin through php-backend.mjs.
 * Zero dependencies.  Build: npm run build:server   Start: npm start
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleCommerce } from './php-backend.mjs';

// Demo mode: the public demo (Render sets RENDER) has no PHP/MySQL admin, so it serves the built-in
// sample menu and validates orders without saving them. Locally, tools/start-local.ps1 sets
// KATRIBO_BACKEND_URL, so the site keeps using the real admin. KATRIBO_DEMO=1 forces demo mode.
const demoMode = process.env.KATRIBO_DEMO === '1' || (Boolean(process.env.RENDER) && !process.env.KATRIBO_BACKEND_URL);
const demo = demoMode ? await import(new URL('./dist-server/order.js', import.meta.url).href) : null;

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

async function handleDemo(req, res, url) {
  if (url.pathname === '/api/catalogue') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, { ok: false, message: 'Method not allowed.' }); return true; }
    json(res, 200, demo.demoCatalogue());
    return true;
  }
  if (url.pathname === '/api/place-order') {
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 65536) { json(res, 413, { ok: false, message: 'Order too large.' }); return true; } }
    const { status, data } = demo.handleOrder(req.method ?? 'GET', body);
    json(res, status, data);
    return true;
  }
  return false;
}

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = resolve(root, 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

function fileFor(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch { return null; }
  const full = normalize(join(dist, p));
  if (!full.startsWith(dist)) return null; // block ../ path tricks
  try { return statSync(full).isFile() ? full : null; } catch { return null; }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (demoMode ? await handleDemo(req, res, url) : await handleCommerce(req, res)) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/')) { res.writeHead(404, SECURITY).end(); return; }

  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, SECURITY).end(); return; }

  // Real file, else the single-page app shell (client-side routes like /menu).
  const file = fileFor(url.pathname) ?? join(dist, 'index.html');
  const immutable = url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/');
  res.writeHead(200, {
    ...SECURITY,
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : (file.endsWith('.html') ? 'no-cache' : 'public, max-age=86400'),
  });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT) || 10000, () => console.log('KATRIBO running on port ' + (process.env.PORT || 10000) + (demoMode ? ' (demo menu, orders are not saved)' : '')));

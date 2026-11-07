/** Narrow bridge to the existing PHP commerce API. No admin sessions or secrets leave PHP. */
import { existsSync } from 'node:fs';

const backend = new URL(process.env.KATRIBO_BACKEND_URL || 'http://127.0.0.1/Katribo/');
if (!['http:', 'https:'].includes(backend.protocol) || !backend.pathname.endsWith('/')) {
  throw new Error('KATRIBO_BACKEND_URL must be an HTTP URL ending in /.');
}
const MEDIA = /^(assets\/img\/drinks\/[a-z0-9-]+\.jpg|assets\/img\/uploads\/menu-[a-f0-9]{32}\.jpg|admin\/assets\/hero-katribo\.jpg)$/;

function reply(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

function publicImage(image) {
  const [path, query] = image.split('?');
  if (!MEDIA.test(path)) throw new Error('Invalid catalogue image.');
  let name = path.split('/').pop();
  if (name === 'cookies-cream.jpg') name = 'cookies-cream-milkshake.jpg';
  if (path.startsWith('assets/img/drinks/') && existsSync(new URL(`./public/images/drinks/${name}`, import.meta.url))) {
    return `/images/drinks/${name}`;
  }
  return `/media/${path}${query ? '?' + query : ''}`;
}

export async function handleCommerce(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!['/api/catalogue', '/api/place-order'].includes(url.pathname) && !url.pathname.startsWith('/media/')) return false;
  const isOrder = url.pathname === '/api/place-order';
  const isMedia = url.pathname.startsWith('/media/');
  const method = isOrder ? 'POST' : 'GET';
  if (req.method !== method && !(isMedia && req.method === 'HEAD')) {
    reply(res, 405, { ok: false, message: 'Method not allowed.' });
    return true;
  }
  // Reject browser requests from other origins before forwarding anything to PHP.
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) {
    reply(res, 403, { ok: false, message: 'Please order from the Katribo website.' });
    return true;
  }
  let path = isOrder ? 'api/place-order.php' : 'api/catalogue.php';
  if (isMedia) {
    path = url.pathname.slice('/media/'.length);
    if (!MEDIA.test(path)) { reply(res, 404, { ok: false, message: 'Image not found.' }); return true; }
  }
  try {
    let body;
    if (isOrder) {
      if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        reply(res, 415, { ok: false, message: 'Send the order as JSON.' }); return true;
      }
      const chunks = []; let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 65536) { reply(res, 413, { ok: false, message: 'Order too large.' }); return true; }
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }
    const upstream = await fetch(new URL(path, backend), {
      method: req.method, body, redirect: 'error', signal: AbortSignal.timeout(6000),
      headers: { Accept: isMedia ? 'image/jpeg' : 'application/json', ...(isOrder ? { 'Content-Type': 'application/json', Origin: backend.origin } : {}) },
    });
    if (isMedia) {
      if (!upstream.ok || !upstream.headers.get('content-type')?.startsWith('image/')) throw new Error('Photo unavailable.');
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=86400' });
      res.end(req.method === 'HEAD' ? undefined : Buffer.from(await upstream.arrayBuffer()));
    } else {
      const data = await upstream.json();
      if (!isOrder && upstream.ok) {
        if (!data.ok || !Array.isArray(data.products)) throw new Error('Invalid catalogue response.');
        data.products = data.products.map((p) => ({ ...p, image: publicImage(p.image) }));
      }
      reply(res, upstream.status, data);
    }
  } catch {
    reply(res, 503, { ok: false, message: isOrder
      ? 'We could not confirm your order. Your cart is kept; retry with the same details.'
      : 'The menu is temporarily unavailable. Please check that Apache and MySQL are running in XAMPP.' });
  }
  return true;
}

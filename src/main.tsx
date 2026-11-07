import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installCatalogue } from './data/menu';
import './styles/index.css';

const root = createRoot(document.getElementById('root')!);
async function start() {
  try {
    const response = await fetch('/api/catalogue', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error('Menu unavailable.');
    installCatalogue(data);
    // Import cart-dependent components only after the live catalogue is installed.
    const { App } = await import('./App');
    root.render(<StrictMode><App /></StrictMode>);
  } catch {
    root.render(<main className="shell grid min-h-screen content-center justify-items-start gap-5 py-16">
      <h1 className="display text-4xl">We’ll be right back</h1>
      <p className="text-soft">The menu is temporarily unavailable. Your cart is saved. Please try again shortly.</p>
      <button className="btn btn-primary" onClick={() => location.reload()}>Try again</button>
    </main>);
  }
}
void start();

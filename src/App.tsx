import { lazy, Suspense, useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { CartDrawer } from './components/CartDrawer';
import { SearchOverlay } from './components/SearchOverlay';
import { closeCartDrawer } from './lib/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer, Header, MobileMenu, Toast } from './components/Chrome';
import { matchPath, RouterProvider, useLocation } from './lib/router';
import Home from './pages/Home';

// Home ships in the main bundle (first paint); other pages load on demand.
const Menu = lazy(() => import('./pages/Menu'));
const Drink = lazy(() => import('./pages/Drink'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

const ROUTES: [string, ComponentType<{ params: Record<string, string> }>][] = [
  ['/', Home], ['/menu', Menu], ['/menu/:id', Drink], ['/cart', Cart], ['/checkout', Checkout],
  ['/about', About], ['/gallery', Gallery], ['/contact', Contact],
];

// Warm up the other pages once the browser is idle, so navigation feels instant.
if (typeof window !== 'undefined') {
  const idle: (cb: () => void) => void = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
  idle(() => {
    import('./pages/Menu'); import('./pages/Drink'); import('./pages/Cart');
    import('./pages/About'); import('./pages/Gallery'); import('./pages/Contact');
  });
}

function Routes() {
  const { pathname, key } = useLocation();
  for (const [pattern, Page] of ROUTES) {
    const params = matchPath(pattern, pathname);
    if (params) return <div key={pattern === '/menu/:id' ? pathname : pattern + key} className="page-enter"><Page params={params} /></div>;
  }
  return <NotFound />;
}

/** A fresh error boundary per page, so navigating away clears a crash screen. */
function ErrorBoundaryForRoute({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

function Shell() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);

  const closeSearch = useCallback(() => setSearch(false), []);
  const openSearch = useCallback(() => { setMenu(false); closeCartDrawer(); setSearch(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.isComposing) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      const typing = !!target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]');
      if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') setMenu(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [openSearch]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-ink">Skip to content</a>
      <Header onMenu={() => setMenu(true)} onSearch={openSearch} searchOpen={search} />
      <main id="main" className="min-h-[100svh]">
        <ErrorBoundaryForRoute>
          <Suspense fallback={<div className="min-h-[100svh]" />}>
            <Routes />
          </Suspense>
        </ErrorBoundaryForRoute>
      </main>
      <Footer />
      <MobileMenu open={menu} onClose={closeMenu} />
      {search && <SearchOverlay onClose={closeSearch} />}
      <CartDrawer />
      <Toast />
    </>
  );
}

export function App() {
  return (
    <RouterProvider>
      <Shell />
    </RouterProvider>
  );
}

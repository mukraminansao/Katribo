/* Server-side authorization protects all admin entry points. This also expires open tabs. */
(() => {
  const csrf = document.querySelector('meta[name="admin-csrf"]')?.content;
  let checking = false;
  let lastActivitySent = Date.now();
  async function checkSession(touch = false) {
    if (checking) return;
    checking = true;
    try {
      const response = await fetch('session.php', {
        method: touch ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
        ...(touch ? { body: new URLSearchParams({ csrf }) } : {}),
      });
      if (response.status === 401 || response.status === 403) {
        document.documentElement.classList.add('auth-checking');
        location.replace('login.php?expired=1');
        return;
      }
      if (response.ok) document.documentElement.classList.remove('auth-checking');
    } catch {
      // Failed requests never extend a session; the server continues enforcing expiry.
    } finally { checking = false; }
  }
  function activity() {
    if (Date.now() - lastActivitySent < 60000 || document.visibilityState !== 'visible') return;
    lastActivitySent = Date.now();
    checkSession(true);
  }
  document.addEventListener('pointerdown', activity, { passive: true });
  document.addEventListener('keydown', activity);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkSession();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) document.documentElement.classList.add('auth-checking');
    checkSession();
  });
  window.addEventListener('focus', () => checkSession());
  setInterval(() => checkSession(), 60000);
})();

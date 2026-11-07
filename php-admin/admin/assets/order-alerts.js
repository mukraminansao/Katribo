/* Visual alerts always work; audio is opt-in and unlocked by a user's click. */
(() => {
  'use strict';
  const button = document.querySelector('[data-order-sound]'), banner = document.querySelector('#new-order-alert');
  if (!button || !banner) return;
  const account = document.querySelector('meta[name="admin-id"]').content;
  const soundKey = 'katribo.order-sound.v1.' + account, seenKey = 'katribo.order-seen.v1.' + account;
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, String(value)); } catch { /* In-memory behavior still works. */ } };
  let wanted = read(soundKey) === 'on', unlocked = false, audio = null, seen = null, alertIds = [];
  const update = () => { button.textContent = wanted && !unlocked ? 'Enable sound' : wanted ? 'Sound on' : 'Sound off'; button.setAttribute('aria-pressed', String(wanted && unlocked)); button.title = wanted && !unlocked ? 'Click to enable the saved sound preference in this browser session.' : wanted ? 'Mute new-order sounds' : 'Enable new-order sounds'; };
  const chime = () => {
    if (!audio || !unlocked || audio.state !== 'running') return;
    const now = audio.currentTime;
    [660, 880].forEach((pitch, index) => {
      const tone = audio.createOscillator(), volume = audio.createGain(), start = now + index * .18;
      tone.type = 'sine'; tone.frequency.value = pitch;
      volume.gain.setValueAtTime(0, start); volume.gain.linearRampToValueAtTime(.065, start + .025); volume.gain.exponentialRampToValueAtTime(.001, start + .22);
      tone.connect(volume); volume.connect(audio.destination); tone.start(start); tone.stop(start + .24);
    });
  };
  button.addEventListener('click', async () => {
    if (wanted && unlocked) { wanted = false; write(soundKey, 'off'); update(); return; }
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio unavailable');
      if (!audio) audio = new Audio();
      await audio.resume(); unlocked = audio.state === 'running'; wanted = unlocked; write(soundKey, wanted ? 'on' : 'off'); update(); chime();
    } catch { wanted = false; unlocked = false; update(); button.textContent = 'Sound unavailable'; button.title = 'Visual new-order alerts are still active.'; }
  });
  document.querySelector('[data-dismiss-order-alert]').addEventListener('click', () => { alertIds = []; banner.hidden = true; document.querySelector('[data-notifications]')?.classList.remove('has-new-orders'); });
  document.addEventListener('katribo:orders-synced', event => {
    const orders = event.detail.orders, maximum = orders.reduce((max, order) => Math.max(max, order.id), 0);
    if (seen === null || maximum < seen) { seen = maximum; write(seenKey, seen); return; }
    const previous = Math.max(seen, Number(read(seenKey)) || 0);
    const fresh = orders.filter(order => order.id > previous && order.status === 'Pending');
    seen = Math.max(previous, maximum); write(seenKey, seen);
    alertIds = [...new Set([...alertIds, ...fresh.map(order => order.id)])];
    const pending = orders.filter(order => order.status === 'Pending' && alertIds.includes(order.id));
    alertIds = pending.map(order => order.id);
    if (!pending.length) { banner.hidden = true; document.querySelector('[data-notifications]')?.classList.remove('has-new-orders'); return; }
    document.querySelector('[data-new-order-title]').textContent = pending.length === 1 ? 'A new pickup order just arrived.' : `${pending.length} new pickup orders just arrived.`;
    document.querySelector('[data-new-order-copy]').textContent = pending.length === 1 ? `Order #${pending[0].id} is waiting for preparation.` : 'Your team has new orders waiting for preparation.';
    banner.hidden = false; document.querySelector('[data-notifications]')?.classList.add('has-new-orders');
    if (fresh.length && wanted && unlocked) chime();
  });
  update();
})();

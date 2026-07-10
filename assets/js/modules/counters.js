/* .stat-num counters. The HTML already contains the final value; JS only
   animates *from* zero, so no-JS and reduced-motion users see the number. */

import { prefs } from './prefs.js';

function animate(el) {
  const to = parseInt(el.dataset.stat || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(to * eased)) + (t === 1 ? suffix : '');
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function init() {
  if (!prefs.motionOK) return;
  const nums = document.querySelectorAll('.stat-num[data-stat]');
  if (!nums.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      [...e.target.querySelectorAll('.stat-num[data-stat]')].forEach((n, i) => {
        setTimeout(() => animate(n), i * 100);
      });
      io.unobserve(e.target);
    }
  }, { threshold: 0.3 });

  document.querySelectorAll('.stat-row').forEach((row) => io.observe(row));
}

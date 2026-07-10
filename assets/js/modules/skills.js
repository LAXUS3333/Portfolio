/* .sk-fill / .sk-pct. Widths live in the markup (--sk custom property +
   data-skill); CSS shows them at full width without JS. With motion, the
   fill transitions 0 → var(--sk) and the percentage counts up. */

import { prefs } from './prefs.js';

function countUp(el, to) {
  const duration = 1100;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(to * eased)}%`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function init() {
  if (!prefs.motionOK) return;
  const cards = document.querySelectorAll('.skill-card');
  if (!cards.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.querySelectorAll('.sk-fill').forEach((bar) => {
        requestAnimationFrame(() => bar.classList.add('in'));
      });
      e.target.querySelectorAll('.sk-pct[data-skill]').forEach((pct) => {
        countUp(pct, parseInt(pct.dataset.skill || '0', 10));
      });
      io.unobserve(e.target);
    }
  }, { threshold: 0.2 });

  cards.forEach((c) => io.observe(c));
}

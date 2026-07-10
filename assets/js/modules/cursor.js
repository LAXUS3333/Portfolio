/* Pointer-follow glow + [data-magnetic] attraction — fine pointers only. */

import { prefs } from './prefs.js';

export function init() {
  if (!prefs.motionOK || !prefs.finePointer) return;

  const glow = document.querySelector('.cursor-glow');
  if (glow) {
    let raf = 0;
    let x = 0;
    let y = 0;
    addEventListener('pointermove', (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          glow.style.transform = `translate(${x}px, ${y}px)`;
          raf = 0;
        });
      }
    }, { passive: true });
  }

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.translate = `${dx * 0.15}px ${dy * 0.15}px`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.translate = '';
    });
  });
}

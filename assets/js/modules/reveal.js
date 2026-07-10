/* [data-reveal] and [data-split].

   Reveal strategy, in order of preference:
   1. No motion allowed → do nothing; everything is visible by default.
   2. Browser supports animation-timeline: view() → pure CSS handles it.
   3. Otherwise → IntersectionObserver + the CSS transition classes.
      Deliberately GSAP-free so a dead CDN can never leave content hidden.

   initSplit() is the one GSAP consumer (SplitText line masks); site.js calls
   it separately once — and only if — the motion stack loads. */

import { prefs } from './prefs.js';

export function initReveals() {
  if (!prefs.motionOK) return;

  const pending = new Set(document.querySelectorAll('[data-reveal]'));

  const show = (el) => {
    const delay = parseInt(el.dataset.revealDelay || '0', 10);
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    if (el.dataset.reveal === 'stagger') {
      [...el.children].forEach((child, i) => {
        child.style.transitionDelay = `${Math.min(i, 8) * 60}ms`;
      });
    }
    el.classList.add('in');
    io.unobserve(el);
    pending.delete(el);
  };

  /* Positive bottom margin pre-triggers before entry — content-visibility
     defers layout of far sections, so without a head start a fast scroll
     can pass a section before its entries dispatch. */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) show(e.target);
    }
  }, { threshold: 0.05, rootMargin: '0px 0px 15% 0px' });

  pending.forEach((el) => io.observe(el));

  /* Catch-up sweep: anything scrolled past while still un-laid-out gets
     revealed on the next scroll pause. Guarantees eventual completeness. */
  let sweepTimer = 0;
  addEventListener('scroll', () => {
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(() => {
      const limit = innerHeight * 1.15;
      for (const el of [...pending]) {
        /* Anything at or above the current view was scrolled past — show it */
        if (el.getBoundingClientRect().top < limit) show(el);
      }
    }, 160);
  }, { passive: true });
}

export function initSplit(motion) {
  if (!prefs.motionOK || !motion?.gsap || !motion?.SplitText) return;

  document.fonts.ready.then(() => {
    document.querySelectorAll('[data-split]').forEach((el) => {
      const label = el.textContent.trim();
      try {
        const split = new motion.SplitText(el, {
          type: el.dataset.split === 'chars' ? 'lines,chars' : 'lines',
          linesClass: 'split-line',
        });
        el.setAttribute('aria-label', label);
        [...el.querySelectorAll('div, span')].forEach((c) => c.setAttribute('aria-hidden', 'true'));
        const units = el.dataset.split === 'chars' ? split.chars : split.lines;
        motion.gsap.from(units, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
        });
      } catch {
        /* Split failed — heading simply stays as-is */
      }
    });
  });
}

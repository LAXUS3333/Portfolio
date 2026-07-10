/* ESM entry. Every module self-activates only when its markup exists and
   prefs allow it; a failure in one feature must never take down another,
   and a dead CDN must never hide content (reveals are GSAP-free). */

import { syncClass, onMotionChange } from './modules/prefs.js';
import * as nav from './modules/nav.js';
import * as counters from './modules/counters.js';
import * as skills from './modules/skills.js';
import * as projects from './modules/projects.js';
import * as contact from './modules/contact.js';
import * as cursor from './modules/cursor.js';
import * as reveal from './modules/reveal.js';
import * as scroll from './modules/scroll.js';
import * as floorplan from './modules/floorplan.js';

const safe = (fn, ...args) => {
  try { return fn(...args); } catch (err) { console.error('[site]', err); return undefined; }
};

syncClass();
onMotionChange(() => { /* html.motion-ok is kept in sync by prefs */ });

/* Deferred module scripts execute before first paint — so the whole boot
   waits for the frame after it (double rAF). Nothing here is needed to
   render the page; everything is enhancement. */
const boot = () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  safe(nav.init);
  safe(counters.init);
  safe(skills.init);
  safe(projects.init);
  safe(contact.init);
  safe(cursor.init);

  /* Reveals must not wait on the network. */
  try {
    reveal.initReveals();
  } catch (err) {
    console.error('[site]', err);
    /* Fail open: without motion-ok nothing is ever hidden */
    document.documentElement.classList.remove('motion-ok');
  }

  /* Motion stack (GSAP + Lenis) and floorplan follow in idle time — the
     CDN must never sit in the LCP critical path. */
  const startEnhancements = () => {
    scroll.init().then((motion) => {
      safe(reveal.initSplit, motion);
    });
    safe(floorplan.init);
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(startEnhancements, { timeout: 2000 });
  } else {
    setTimeout(startEnhancements, 300);
  }
};

requestAnimationFrame(() => requestAnimationFrame(boot));

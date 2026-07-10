/* Lenis + GSAP, loaded dynamically from the CDN import map.
   Returns { gsap, ScrollTrigger, SplitText, lenis } or null — callers must
   treat null as "no motion stack" and rely on native scrolling. */

import { prefs } from './prefs.js';

export async function init() {
  if (!prefs.motionOK) return null;

  try {
    const [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
      import('lenis'),
    ]);

    gsap.registerPlugin(ScrollTrigger, SplitText);

    /* Lenis doesn't read scroll-margin-top, so mirror the CSS anchor offset */
    const lenis = new Lenis({ anchors: { offset: -96 }, autoRaf: false, autoToggle: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    return { gsap, ScrollTrigger, SplitText, lenis };
  } catch {
    /* CDN unreachable — native scroll-behavior:smooth takes over */
    return null;
  }
}

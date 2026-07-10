/* Scroll-spy, header state, mobile drawer, back-to-top, deep links. */

import { prefs } from './prefs.js';

export function init() {
  const links = [...document.querySelectorAll('.nav-links a, .nav-drawer a, .floorplan-nav a')];
  const sections = [...document.querySelectorAll('main section[id]')];
  const header = document.querySelector('.site-header');
  if (!links.length || !sections.length || !header) return;

  /* --- Scroll-spy: the section occupying the viewport centre gets aria-current --- */
  let currentId = '';
  const setCurrent = (id) => {
    if (id === currentId) return;
    currentId = id;
    for (const a of links) {
      const on = a.getAttribute('href') === `#${id}`;
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
    /* Keep the hash shareable without ever scrolling */
    history.replaceState(null, '', id === 'hero' ? location.pathname : `#${id}`);
  };

  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) setCurrent(e.target.id);
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  sections.forEach((s) => spy.observe(s));

  /* --- Header gains background once scrolled past the hero --- */
  const hero = document.getElementById('hero');
  if (hero) {
    /* Token, not offsetHeight — measuring would force a full layout pre-paint */
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64;
    new IntersectionObserver(([e]) => {
      document.documentElement.toggleAttribute('data-scrolled', !e.isIntersecting);
    }, { rootMargin: `-${headerH}px 0px 0px 0px`, threshold: 0 }).observe(hero);
  }

  /* --- Mobile drawer (native popover) --- */
  const drawer = document.getElementById('nav-drawer');
  const toggle = document.querySelector('.nav-toggle');
  if (drawer && toggle) {
    drawer.addEventListener('toggle', (e) => {
      if (e.newState === 'open') {
        drawer.querySelector('a')?.focus();
      } else {
        toggle.focus();
      }
    });
    /* Close on link activation */
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a')) drawer.hidePopover();
    });
    /* Focus trap while open (popover handles Escape natively) */
    drawer.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = drawer.querySelectorAll('a, button');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    });
  }

  /* --- Back to top --- */
  const toTop = document.querySelector('.to-top');
  if (toTop) {
    toTop.hidden = false;
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        toTop.toggleAttribute('data-show', scrollY > innerHeight * 2);
        ticking = false;
      });
    }, { passive: true });
    toTop.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: prefs.motionOK ? 'smooth' : 'instant' });
    });
  }

  /* --- Deep links: land correctly after fonts settle --- */
  if (location.hash) {
    const target = document.querySelector(CSS.escape ? `#${CSS.escape(location.hash.slice(1))}` : location.hash);
    if (target) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
      });
    }
  }
}

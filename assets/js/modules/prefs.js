/* Capability flags — single source of truth for every module.
   The inline <head> script mirrors motionOK onto <html class="motion-ok">
   for CSS; this module is the authority for JS. */

const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
const pointerMq = matchMedia('(pointer: fine)');

export const prefs = {
  get reducedMotion() { return reduceMq.matches; },
  get saveData() { return !!(navigator.connection && navigator.connection.saveData); },
  get finePointer() { return pointerMq.matches; },
  get motionOK() { return !this.reducedMotion && !this.saveData; },
};

export function onMotionChange(fn) {
  reduceMq.addEventListener('change', () => {
    syncClass();
    fn(prefs);
  });
}

export function syncClass() {
  document.documentElement.classList.toggle('motion-ok', prefs.motionOK);
}

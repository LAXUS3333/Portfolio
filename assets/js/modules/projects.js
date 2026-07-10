/* Project filtering + case-study dialog.
   Filtering sets [hidden] (screen readers need cards gone, not display-hacked)
   and announces the result count in the aria-live region. */

import { prefs } from './prefs.js';

export function init() {
  const grid = document.querySelector('.proj-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.proj-card')];

  /* --- Filters --- */
  const bar = document.querySelector('.filters');
  const status = document.querySelector('.filter-status');
  const empty = document.querySelector('.proj-empty');

  if (bar) {
    bar.hidden = false;
    const buttons = [...bar.querySelectorAll('.filter-btn')];

    const apply = (filter) => {
      let shown = 0;
      for (const card of cards) {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.hidden = !match;
        if (match) shown++;
      }
      if (empty) empty.hidden = shown !== 0;
      if (status) status.textContent = `${shown} of ${cards.length} projects shown`;
    };

    /* Stable view-transition identity per card */
    cards.forEach((c) => { c.style.viewTransitionName = `proj-${c.dataset.slug}`; });

    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const run = () => apply(btn.dataset.filter);
      if (prefs.motionOK && document.startViewTransition) document.startViewTransition(run);
      else run();
    });
  }

  /* --- Case-study dialog --- */
  const dialog = document.getElementById('proj-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    const title = dialog.querySelector('#proj-dialog-title');
    const body = dialog.querySelector('.dialog-body');
    let opener = null;

    document.querySelectorAll('.proj-open').forEach((btn) => { btn.hidden = false; });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.proj-open');
      if (!btn) return;
      const slug = btn.dataset.open;
      const tpl = document.querySelector(`template[data-proj="${slug}"]`);
      const card = btn.closest('.proj-card');
      if (!tpl || !card) return;
      opener = btn;
      title.textContent = card.querySelector('.proj-title')?.textContent ?? '';
      body.replaceChildren(tpl.content.cloneNode(true));
      dialog.showModal();
    });

    dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
    /* Click on the backdrop closes */
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      body.replaceChildren();
      opener?.focus();
      opener = null;
    });
  }
}

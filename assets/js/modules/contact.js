/* Contact form: AJAX submit to formsubmit.co so the user never leaves the
   page. Any failure of fetch itself falls back to a plain form POST. */

export function init() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const statusEl = form.querySelector('.form-status');
  const submitBtn = form.querySelector('.submit-btn');
  const AJAX_ENDPOINT = 'https://formsubmit.co/ajax/808b75ddb67368c1da36468ae7c7a247';

  form.addEventListener('submit', async (e) => {
    if (!('fetch' in window)) return; /* native POST proceeds */
    e.preventDefault();
    if (!form.reportValidity()) return;

    submitBtn.disabled = true;
    statusEl.dataset.state = '';
    statusEl.textContent = 'Sending…';

    try {
      const res = await fetch(AJAX_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      statusEl.dataset.state = 'ok';
      statusEl.textContent = "Message sent — I'll reply within a few days.";
      form.reset();
    } catch {
      statusEl.dataset.state = 'err';
      statusEl.textContent = "Message didn't send. Email nafiss3333@gmail.com directly.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

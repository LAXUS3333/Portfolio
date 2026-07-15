/* Contact form: AJAX submit to Web3Forms so the user never leaves the
   page. Any failure of fetch itself falls back to a plain form POST. */

export function init() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const statusEl = form.querySelector('.form-status');
  const submitBtn = form.querySelector('.submit-btn');
  const AJAX_ENDPOINT = 'https://api.web3forms.com/submit';

  form.addEventListener('submit', async (e) => {
    if (!('fetch' in window)) return; /* native POST proceeds */
    e.preventDefault();
    if (!form.reportValidity()) return;

    submitBtn.disabled = true;
    statusEl.dataset.state = '';
    statusEl.textContent = 'Sending…';

    try {
      const data = new FormData(form);
      data.delete('redirect'); /* redirect is for the no-JS fallback only */
      const res = await fetch(AJAX_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
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

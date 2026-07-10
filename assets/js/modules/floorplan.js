/* Hero chip floorplan — Canvas 2D, deliberately not WebGL (see CLAUDE.md).

   Labelled blocks mirror the page's sections; orthogonal routing traces
   connect them and current pulses travel the traces on an ambient loop whose
   clock rate follows scroll position. Hovering raises a block; activating it
   scrolls to its section. The canvas is decorative: the real navigation is
   the .floorplan-nav list, visually hidden only after the first paint.
   Reduced motion / data-saver → one static frame, interaction intact. */

import { prefs } from './prefs.js';

const BLOCKS = [
  { code: 'EXP', name: 'experience',   href: '#experience',    tok: '--layer-vlsi',     x: .06, y: .05, w: .52, h: .18 },
  { code: 'EDU', name: 'education',    href: '#education',     tok: '--via',            x: .62, y: .05, w: .32, h: .18 },
  { code: 'PRJ', name: 'projects',     href: '#projects',      tok: '--layer-ml',       x: .06, y: .28, w: .42, h: .40 },
  { code: 'SKL', name: 'skills',       href: '#skills',        tok: '--layer-web',      x: .52, y: .28, w: .42, h: .22 },
  { code: 'ACH', name: 'achievements', href: '#achievements',  tok: '--layer-embedded', x: .52, y: .54, w: .42, h: .14 },
  { code: 'CRT', name: 'certificates', href: '#certifications', tok: '--layer-cv',      x: .06, y: .72, w: .42, h: .22 },
  { code: 'I/O', name: 'contact',      href: '#contact',       tok: '--via',            x: .52, y: .72, w: .42, h: .22 },
];

const TRACES = [
  [[.20, .23], [.20, .28]],
  [[.75, .23], [.75, .255], [.35, .255], [.35, .28]],
  [[.58, .14], [.62, .14]],
  [[.48, .38], [.52, .38]],
  [[.70, .50], [.70, .54]],
  [[.62, .68], [.62, .72]],
  [[.25, .68], [.25, .72]],
  [[.48, .80], [.52, .80]],
];

export function init() {
  const board = document.querySelector('[data-floorplan]');
  const canvas = board?.querySelector('.floorplan-canvas');
  const ctx = canvas?.getContext('2d');
  if (!board || !canvas || !ctx) return;

  const css = getComputedStyle(document.documentElement);
  const tok = (n) => css.getPropertyValue(n).trim();
  const C = {
    sunken: tok('--bg-sunken'),
    raised: tok('--bg-raised'),
    rule: tok('--rule'),
    dim: tok('--text-dim'),
    via: tok('--via'),
  };

  let W = 0;
  let H = 0;
  let dpr = 1;
  let hovered = null;
  let rafId = 0;
  let running = false;
  let inView = true;

  const pulses = TRACES.map((_, i) => ({ t: (i * 0.37) % 1, speed: 0.15 + (i % 3) * 0.06 }));

  const px = ([nx, ny]) => [nx * W, ny * H];

  function resize() {
    const rect = board.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tracePath(pts) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = px(p);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
  }

  function traceLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = px(pts[i - 1]);
      const [bx, by] = px(pts[i]);
      len += Math.hypot(bx - ax, by - ay);
    }
    return len;
  }

  function pointAt(pts, t) {
    const total = traceLength(pts);
    let target = t * total;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = px(pts[i - 1]);
      const [bx, by] = px(pts[i]);
      const seg = Math.hypot(bx - ax, by - ay);
      if (target <= seg) {
        const k = seg === 0 ? 0 : target / seg;
        return [ax + (bx - ax) * k, ay + (by - ay) * k];
      }
      target -= seg;
    }
    return px(pts[pts.length - 1]);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Traces */
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.rule;
    for (const pts of TRACES) {
      tracePath(pts);
      ctx.stroke();
    }

    /* Pulses */
    if (prefs.motionOK) {
      for (let i = 0; i < TRACES.length; i++) {
        const [x, y] = pointAt(TRACES[i], pulses[i].t);
        ctx.fillStyle = C.via;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* Blocks */
    const fontS = `500 ${Math.max(10, W * 0.028)}px "JetBrains Mono", monospace`;
    for (const b of BLOCKS) {
      const color = tok(b.tok) || C.via;
      const x = b.x * W;
      const y = b.y * H;
      const w = b.w * W;
      const h = b.h * H;
      const isHover = hovered === b;

      if (isHover) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(x + 3, y + 4, w, h);
        ctx.globalAlpha = 1;
      }
      const ox = isHover ? -2 : 0;
      const oy = isHover ? -2 : 0;

      ctx.fillStyle = C.raised;
      ctx.fillRect(x + ox, y + oy, w, h);
      ctx.globalAlpha = isHover ? 0.16 : 0.06;
      ctx.fillStyle = color;
      ctx.fillRect(x + ox, y + oy, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = isHover ? 1.5 : 1;
      ctx.strokeRect(x + ox + 0.5, y + oy + 0.5, w - 1, h - 1);

      /* Pins along the top edge */
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1;
      const pins = Math.max(3, Math.round(w / 26));
      for (let p = 1; p <= pins; p++) {
        const pxx = x + ox + (w / (pins + 1)) * p;
        ctx.beginPath();
        ctx.moveTo(pxx, y + oy);
        ctx.lineTo(pxx, y + oy - 4);
        ctx.stroke();
      }

      /* Labels */
      ctx.font = fontS;
      ctx.textBaseline = 'top';
      ctx.fillStyle = color;
      ctx.fillText(b.code, x + ox + 9, y + oy + 8);
      if (isHover) {
        ctx.fillStyle = C.dim;
        ctx.fillText(b.name, x + ox + 9, y + oy + 8 + Math.max(12, W * 0.034));
      }
    }
  }

  let last = 0;
  function frame(now) {
    rafId = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    /* Scroll position drives the clock rate */
    const docH = document.documentElement.scrollHeight - innerHeight;
    const progress = docH > 0 ? scrollY / docH : 0;
    const clock = 0.6 + progress * 2;

    for (const p of pulses) {
      p.t = (p.t + p.speed * clock * dt) % 1;
    }
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !prefs.motionOK || document.hidden || !inView) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* --- Interaction --- */
  const hit = (e) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    return BLOCKS.find((b) => nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.y + b.h) || null;
  };
  canvas.addEventListener('pointermove', (e) => {
    const b = hit(e);
    if (b !== hovered) {
      hovered = b;
      canvas.style.cursor = b ? 'pointer' : '';
      if (!running) draw();
    }
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
    canvas.style.cursor = '';
    if (!running) draw();
  });
  canvas.addEventListener('click', (e) => {
    const b = hit(e);
    if (!b) return;
    /* Route through the fallback anchor so Lenis's anchor handling (or the
       native smooth-scroll fallback) owns the scroll — no competing engines */
    board.querySelector(`.floorplan-nav a[href="${b.href}"]`)?.click();
  });

  /* --- Lifecycle --- */
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    inView ? start() : stop();
  }).observe(canvas);
  new ResizeObserver(() => {
    resize();
    draw();
  }).observe(board);

  resize();
  draw();
  board.setAttribute('data-painted', '');
  document.fonts.ready.then(draw); /* crisper labels once the mono face lands */
  start();
}

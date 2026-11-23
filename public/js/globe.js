/* Tanishtiruv sahifasi uchun yer shari (Canvas 2D, kutubxonasiz).
   Quruqlik — nuqtalar, Toshkentdan universitetlarga yo'llar — yoy chiziqlar, universitet nomlari — shaffof yorliqlar.
   Sudrab aylantiriladi, o'zi sekin aylanadi; harakatni kamaytirish yoqilgan bo'lsa — qimirlamaydi. */
import { LAND, PLACES, HOME } from './globe_data.js';

const PI = Math.PI, D = PI / 180;
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
let bits = null;
function landAt(lat, lon) {
  if (!bits) { const s = atob(LAND); bits = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) bits[i] = s.charCodeAt(i); }
  const r = Math.min(179, Math.max(0, Math.floor(90 - lat))), c = (((Math.floor(lon + 180)) % 360) + 360) % 360, i = r * 360 + c;
  return (bits[i >> 3] >> (7 - (i & 7))) & 1;
}
const vec = (lat, lon) => { const p = lat * D, l = lon * D, c = Math.cos(p); return [c * Math.sin(l), Math.sin(p), c * Math.cos(l)]; };

/* ---- nuqtalar (teng taqsimlangan halqalar) ---- */
function buildDots(step) {
  const xs = [], ys = [], zs = [];
  for (let lat = -86, k = 0; lat <= 86; lat += step, k++) {
    const n = Math.max(1, Math.round(360 * Math.cos(lat * D) / step));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (i + (k % 2 ? 0.5 : 0)) * 360 / n;
      if (!landAt(lat, lon)) continue;
      const v = vec(lat, lon); xs.push(v[0]); ys.push(v[1]); zs.push(v[2]);
    }
  }
  return { xs: Float32Array.from(xs), ys: Float32Array.from(ys), zs: Float32Array.from(zs), n: xs.length };
}
/* ---- katta aylana yoyi (Toshkent → universitet), balandlik bilan ---- */
function buildArc(a, b, N) {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(dot), so = Math.sin(om) || 1;
  const h = 0.05 + 0.27 * (om / PI), pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, f = Math.sin((1 - t) * om) / so, g = Math.sin(t * om) / so, up = 1 + h * Math.sin(PI * t);
    pts.push([(a[0] * f + b[0] * g) * up, (a[1] * f + b[1] * g) * up, (a[2] * f + b[2] * g) * up]);
  }
  return pts;
}
const hex = s => { s = String(s).trim().replace('#', ''); if (s.length === 3) s = s.replace(/./g, '$&$&'); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function createGlobe(canvas, opts = {}) {
  const ctx = canvas.getContext('2d'), still = !!opts.still, root = document.documentElement;
  const dots = buildDots(opts.step || 2.4), home = vec(HOME.lat, HOME.lon);
  const places = PLACES.map(p => ({ n: p[0], w: p[3], v: vec(p[1], p[2]), arc: null, ph: Math.random(), a: 0 }));
  places.forEach(p => (p.arc = buildArc(home, p.v, 30)));
  let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1, lon0 = HOME.lon * D, tilt = 0.42, vel = 0, drag = null, lastDrag = 0, boost = 0, running = false, vis = true, raf = 0, last = 0, time = 0, col = null, labelFont = '', avoid = [];

  function palette(mode) {
    const cs = getComputedStyle(root), dark = (mode || root.getAttribute('data-theme')) === 'dark';
    const brand = hex(cs.getPropertyValue('--brand') || '#d9611a'), b6 = hex(cs.getPropertyValue('--brand-600') || '#b04a0e');
    col = dark
      ? { dark, dot: [142, 163, 200], line: [104, 124, 164], arc: mix(brand, [255, 255, 255], 0.22), sphereA: [22, 32, 54], sphereB: [10, 15, 27], glow: [96, 126, 190], pillBg: [19, 26, 41], pillTx: [232, 236, 244], pillBd: [74, 90, 128], home: brand, back: [92, 110, 150] }
      : { dark, dot: b6, line: b6, arc: b6, sphereA: [255, 250, 243], sphereB: mix(brand, [255, 244, 228], 0.8), glow: brand, pillBg: [255, 255, 255], pillTx: [42, 26, 16], pillBd: brand, home: brand, back: b6 };
  }
  function resize() {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(10, r.width); H = Math.max(10, r.height); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.4; labelFont = `600 ${W < 560 ? 11 : 12.5}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
    draw();
  }
  /* aylantirish: uzunlik lon0 oldinga, so'ng egilish */
  const cl = () => Math.cos(lon0), sl = () => Math.sin(lon0), ct = () => Math.cos(tilt), st = () => Math.sin(tilt);
  function proj(x, y, z, c1, s1, c2, s2) {
    const x1 = x * c1 - z * s1, z1 = x * s1 + z * c1, y2 = y * c2 - z1 * s2, z2 = y * s2 + z1 * c2;
    return [cx + R * x1, cy - R * y2, z2, x1, y2];
  }
  function pill(x, y, text, z) {
    ctx.font = labelFont; const tw = ctx.measureText(text).width, h = W < 560 ? 22 : 25, pw = tw + 22, right = x < cx + R * 0.15;
    const px = right ? x + 15 : x - 15 - pw, py = y - h - 9;
    return { x: px, y: py, w: pw, h, tw, right, text, ax: x, ay: y, z };
  }
  function drawPill(b, alpha, home) {
    const r = b.h / 2; ctx.globalAlpha = alpha;
    ctx.strokeStyle = rgba(col.pillBd, 0.55); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.right ? b.x : b.x + b.w, b.y + b.h); ctx.stroke();
    ctx.shadowColor = 'rgba(40,20,5,.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    ctx.fillStyle = home ? rgba(col.home, 1) : rgba(col.pillBg, col.dark ? 0.86 : 0.94);
    ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = home ? 'rgba(255,255,255,.5)' : rgba(col.pillBd, col.dark ? 0.5 : 0.38); ctx.stroke();
    if (!home) { ctx.fillStyle = rgba(col.home, 1); ctx.beginPath(); ctx.arc(b.x + 11, b.y + r, 2.6, 0, PI * 2); ctx.fill(); }
    ctx.fillStyle = home ? '#fff' : rgba(col.pillTx, 1); ctx.textBaseline = 'middle'; ctx.fillText(b.text, b.x + (home ? 11 : 19), b.y + r + 0.5);
    ctx.globalAlpha = 1;
  }
  function draw() {
    if (!col) palette();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const c1 = cl(), s1 = sl(), c2 = ct(), s2 = st();
    /* atmosfera */
    let g = ctx.createRadialGradient(cx, cy, R * 0.94, cx, cy, R * 1.32);
    g.addColorStop(0, rgba(col.glow, col.dark ? 0.14 : 0.26)); g.addColorStop(0.35, rgba(col.glow, col.dark ? 0.04 : 0.08)); g.addColorStop(1, rgba(col.glow, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.32, 0, PI * 2); ctx.fill();
    /* shar */
    g = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.1, cx, cy, R * 1.02);
    g.addColorStop(0, rgba(col.sphereA, 1)); g.addColorStop(1, rgba(col.sphereB, 1));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(col.line, col.dark ? 0.55 : 0.4); ctx.lineWidth = 1.2; ctx.stroke();
    /* kenglik/uzunlik to'ri */
    ctx.lineWidth = 0.7;
    for (let k = 0; k < 2; k++) {
      for (let a = k ? -60 : -180; a < (k ? 61 : 180); a += 30) {
        if (k && a === 0) { /* ekvator ham chiziladi */ }
        ctx.beginPath(); let on = false;
        for (let i = 0; i <= 72; i++) {
          const u = (i / 72) * 360 - (k ? 180 : 90), v = k ? vec(a, u) : vec(u, a), p = proj(v[0], v[1], v[2], c1, s1, c2, s2);
          if (p[2] > 0) { if (!on) { ctx.moveTo(p[0], p[1]); on = true; } else ctx.lineTo(p[0], p[1]); } else on = false;
        }
        ctx.strokeStyle = rgba(col.line, col.dark ? 0.16 : 0.15); ctx.stroke();
      }
    }
    /* quruqlik nuqtalari: orqa tomon xira, old tomon chuqurlik bo'yicha 4 qatlam */
    const n = dots.n, xs = dots.xs, ys = dots.ys, zs = dots.zs, B = [[], [], [], []], back = [];
    for (let i = 0; i < n; i++) {
      const x = xs[i], y = ys[i], z = zs[i], x1 = x * c1 - z * s1, z1 = x * s1 + z * c1, y2 = y * c2 - z1 * s2, z2 = y * s2 + z1 * c2;
      if (z2 > 0) B[Math.min(3, (z2 * 4) | 0)].push(cx + R * x1, cy - R * y2); else if ((i & 1) === 0) back.push(cx + R * x1, cy - R * y2);
    }
    const dr = R / 235;
    ctx.fillStyle = rgba(col.back, col.dark ? 0.1 : 0.1); ctx.beginPath();
    for (let i = 0; i < back.length; i += 2) { ctx.moveTo(back[i] + dr * 0.8, back[i + 1]); ctx.arc(back[i], back[i + 1], dr * 0.8, 0, PI * 2); } ctx.fill();
    for (let b = 0; b < 4; b++) {
      const arr = B[b]; ctx.fillStyle = rgba(col.dot, [0.3, 0.52, 0.76, 1][b]); const rr = dr * [0.95, 1.15, 1.3, 1.4][b]; ctx.beginPath();
      for (let i = 0; i < arr.length; i += 2) { ctx.moveTo(arr[i] + rr, arr[i + 1]); ctx.arc(arr[i], arr[i + 1], rr, 0, PI * 2); } ctx.fill();
    }
    /* yo'llar (Toshkent → universitet) */
    ctx.lineCap = 'round';
    for (const p of places) {
      ctx.beginPath(); let on = false;
      for (const q of p.arc) {
        const s = proj(q[0], q[1], q[2], c1, s1, c2, s2), seen = s[2] > 0 || s[3] * s[3] + s[4] * s[4] > 1.0;
        if (seen) { if (!on) { ctx.moveTo(s[0], s[1]); on = true; } else ctx.lineTo(s[0], s[1]); } else on = false;
      }
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(col.arc, col.dark ? 0.26 : 0.3); ctx.setLineDash([]); ctx.stroke();
      if (!still) { ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(col.arc, col.dark ? 0.75 : 0.7); ctx.setLineDash([1.5, 9]); ctx.lineDashOffset = -time * 16 - p.ph * 40; ctx.stroke(); ctx.setLineDash([]); }
      /* uchib boruvchi nuqta */
      const u = still ? 0.5 : (time * 0.16 + p.ph) % 1, idx = u * (p.arc.length - 1), i0 = idx | 0, i1 = Math.min(p.arc.length - 1, i0 + 1), f = idx - i0, a = p.arc[i0], b = p.arc[i1];
      const s = proj(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, c1, s1, c2, s2);
      if (s[2] > 0.02 || s[3] * s[3] + s[4] * s[4] > 1.02) {
        const gg = ctx.createRadialGradient(s[0], s[1], 0, s[0], s[1], 7); gg.addColorStop(0, rgba(col.dark ? [255, 235, 210] : col.home, 1)); gg.addColorStop(1, rgba(col.glow, 0));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(s[0], s[1], 7, 0, PI * 2); ctx.fill();
      }
    }
    ctx.lineDashOffset = 0;
    /* universitetlar: nuqta + yorliq (bir-birini bosmaydigan eng muhimlari) */
    const cand = [];
    for (const p of places) {
      const s = proj(p.v[0], p.v[1], p.v[2], c1, s1, c2, s2); p.s = s;
      if (s[2] > 0.1) { ctx.fillStyle = rgba(col.home, Math.min(1, s[2] * 1.4)); ctx.beginPath(); ctx.arc(s[0], s[1], 2.6 + s[2] * 1.2, 0, PI * 2); ctx.fill(); ctx.strokeStyle = col.dark ? 'rgba(20,10,5,.85)' : 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.2; ctx.stroke(); }
      if (s[2] > 0.26) cand.push(p);
    }
    cand.sort((a, b) => (b.s[2] + b.w * 0.2) - (a.s[2] + a.w * 0.2));
    const boxes = [], hs = proj(home[0], home[1], home[2], c1, s1, c2, s2), maxL = W < 560 ? 6 : 9;
    let hb = null;
    const hit = (b, o, m) => b.x < o.x + o.w + m && b.x + b.w + m > o.x && b.y < o.y + o.h + m && b.y + b.h + m > o.y;
    if (hs[2] > 0.26) { hb = pill(hs[0], hs[1], opts.homeName || HOME.n, hs[2]); boxes.push(hb); }
    const chosen = new Set();
    for (const p of cand) {
      if (chosen.size >= maxL) break;
      const b = pill(p.s[0], p.s[1], p.n, p.s[2]);
      if (b.x < 4 || b.x + b.w > W - 4) continue;
      if (boxes.some(o => hit(b, o, 6)) || avoid.some(o => hit(b, o, 10))) continue;
      boxes.push(b); chosen.add(p); p.box = b;
    }
    for (const p of places) { const want = chosen.has(p) ? 1 : 0; p.a += (want - p.a) * (still ? 1 : 0.14); }
    for (const p of places) if (p.a > 0.03 && p.s[2] > 0.18 && p.box) drawPill(p.box, p.a * Math.min(1, (p.s[2] - 0.18) * 4), false);
    /* uy nuqtasi: puls */
    if (hs[2] > 0.05) {
      const ph = still ? 0.5 : (time * 0.55) % 1;
      for (let k = 0; k < 2; k++) { const q = (ph + k * 0.5) % 1; ctx.strokeStyle = rgba(col.home, (1 - q) * 0.6); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hs[0], hs[1], 6 + q * 26, 0, PI * 2); ctx.stroke(); }
      ctx.fillStyle = rgba(col.home, 1); ctx.beginPath(); ctx.arc(hs[0], hs[1], 5.5, 0, PI * 2); ctx.fill(); ctx.strokeStyle = col.dark ? 'rgba(20,10,5,.9)' : '#fff'; ctx.lineWidth = 2; ctx.stroke();
      if (hb) drawPill(hb, Math.min(1, (hs[2] - 0.2) * 4), true);
    }
  }
  function tick(now) {
    raf = 0; if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
    if (!drag) {
      lon0 += vel * dt; vel *= Math.pow(0.04, dt);
      if (now - lastDrag > 1600) { lon0 += (0.075 + boost) * dt; }
    }
    draw(); raf = requestAnimationFrame(tick);
  }
  function loop() { if (running && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function play(v) { running = !!v && !still; if (running) loop(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  /* sudrab aylantirish */
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false }; vel = 0; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} canvas.classList.add('is-drag'); });
  canvas.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    lon0 -= dx / R; tilt = Math.max(-0.15, Math.min(0.95, tilt + dy / R * 0.6)); vel = -dx / R * 60; lastDrag = performance.now(); if (still) draw();
  });
  const end = e => { if (drag && e.pointerId === drag.id) { drag = null; lastDrag = performance.now(); canvas.classList.remove('is-drag'); } };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; if (ro) ro.observe(canvas); else addEventListener('resize', resize);
  document.addEventListener('unidoue:theme', e => { palette(e.detail); draw(); });
  document.addEventListener('visibilitychange', () => play(vis && !document.hidden));
  if (typeof IntersectionObserver === 'function') new IntersectionObserver(es => { vis = es[0].isIntersecting; play(vis && !document.hidden); }, { threshold: 0 }).observe(canvas);
  palette(); resize(); play(true);
  return { boost: v => { boost = v; }, avoid: a => { avoid = a || []; }, redraw: draw, palette: () => { palette(); draw(); } };
}

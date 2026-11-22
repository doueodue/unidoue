/* Harakat qatlami: yengil effektlar (tashqi kutubxonasiz). Asosiy animatsiyalar app.css da (CSS), bu yerda faqat CSS qila olmaydiganlari:
   sahifa yuklanish chizigʻi, raqamlarni sanash, tugma to‘lqini, kartochka yoritgichi, katakcha “pop”i va xato matni silkinishi.
   “Harakatni kamaytirish” yoqilgan boʻlsa (prefers-reduced-motion) hech narsa qilmaydi. */
let RM = { matches: false };
try { RM = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) {}
export const reduced = () => !!RM.matches;

/* ---------- sahifa oʻtishidagi yuklanish chizigʻi ---------- */
let bar = null, barT = 0;
function ensureBar() {
  if (!bar) { bar = document.createElement('div'); bar.id = 'fx-bar'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar); }
  return bar;
}
export function start() {
  if (reduced() || !document.body) return;
  const b = ensureBar(); clearTimeout(barT); b.className = ''; void b.offsetWidth; b.className = 'on';
}
export function done() {
  if (!bar) return;
  clearTimeout(barT); bar.className = 'end'; barT = setTimeout(() => { bar.className = ''; }, 700);
}

/* ---------- raqamlarni 0 dan sanab chiqarish ---------- */
const SEL = '.stat b, .grad-n b, .score', NUM = /^(\s*)(\d{1,6})([^\d/]{0,12})$/, seen = new WeakSet();
function countUp(el, budget) {
  if (seen.has(el)) return budget; seen.add(el);
  let node = null; for (const c of el.childNodes) { if (c.nodeType === 3 && c.nodeValue.trim()) { node = c; break; } }
  const m = node && NUM.exec(node.nodeValue); if (!m) return budget;
  const to = +m[2]; if (to < 2) return budget;
  if (el.classList.contains('score')) { if (budget <= 0) return budget; budget--; }
  const pre = m[1], suf = m[3], dur = 750 + Math.min(to, 100) * 4;
  node.nodeValue = pre + '0' + suf;
  const t0 = performance.now();
  const step = now => {
    if (!node.isConnected) return;
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    node.nodeValue = pre + Math.round(to * e) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return budget;
}
export function scan(root) {
  if (reduced() || !root || root.nodeType !== 1) return;
  if (root.closest && root.closest('.chat, .pre')) return; // AI javoblari oqimida skanerlamaymiz
  let budget = 6;
  const list = root.matches && root.matches(SEL) ? [root] : [];
  root.querySelectorAll(SEL).forEach(x => list.push(x));
  list.forEach(x => { budget = countUp(x, budget); });
}
let mo = null;
/** Sahifa maydoniga keyin qoʻshilgan elementlarni ham (masalan, bosh paneldagi mos universitetlar) kuzatib boradi. */
export function watch(view) {
  if (mo) mo.disconnect();
  if (!view || typeof MutationObserver === 'undefined') return;
  mo = new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType === 1) scan(n); }); });
  mo.observe(view, { childList: true, subtree: true });
}

/* ---------- kartochka yoritgichi: sichqoncha izidan yumshoq nur ---------- */
let sp = 0, spE = null;
document.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || reduced()) return;
  const c = e.target.closest && e.target.closest('.card.hover'); if (!c) return;
  spE = { c, x: e.clientX, y: e.clientY };
  if (!sp) sp = requestAnimationFrame(() => {
    sp = 0; if (!spE) return; const r = spE.c.getBoundingClientRect();
    spE.c.style.setProperty('--mx', (spE.x - r.left) + 'px'); spE.c.style.setProperty('--my', (spE.y - r.top) + 'px');
  });
}, { passive: true });

/* ---------- tugma bosilganda toʻlqin ---------- */
document.addEventListener('pointerdown', e => {
  if (reduced() || e.button) return;
  const b = e.target.closest && e.target.closest('.btn'); if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = document.createElement('span');
  s.className = 'fx-rip'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 650);
}, { passive: true });

/* ---------- belgilash katakchasi “pop” ---------- */
document.addEventListener('change', e => {
  const c = e.target; if (!c || c.type !== 'checkbox' || reduced()) return;
  c.classList.remove('fx-pop'); void c.offsetWidth; c.classList.add('fx-pop'); setTimeout(() => c.classList.remove('fx-pop'), 400);
});

/* ---------- xato xabari paydo boʻlganda yengil silkinish ---------- */
if (typeof MutationObserver !== 'undefined') {
  new MutationObserver(ms => {
    if (reduced()) return;
    for (const m of ms) {
      const el = m.target;
      if (m.addedNodes.length && el.nodeType === 1 && el.classList.contains('msg') && el.classList.contains('err') && el.textContent.trim()) {
        el.classList.remove('fx-shake'); void el.offsetWidth; el.classList.add('fx-shake');
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

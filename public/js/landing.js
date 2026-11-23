/* UniDoue tanishtiruv sahifasi: yer shari, parallaks, bosqichma-bosqich hikoya, SAT demo, til/tema, kirish/ro'yxatdan o'tish.
   CSP: faqat o'z manbamizdan yuklanadi (inline skriptlarsiz). */
import { themeSwitch } from './theme-ui.js';
import { langSelect, bindLang, t, lang } from './i18n.js';
import { createGlobe } from './globe.js';
import { ensureSprite, crownHTML, liveGlass } from './tiers.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const root = document.documentElement;
const reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

/* o'rnatilgan ilova (PWA / Play Market TWA) ochilganda tanishtiruv sahifasi o'rniga to'g'ridan-to'g'ri ilova */
const standalone = (() => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || document.referrer.startsWith('android-app://'); } catch (e) { return false; } })();
if (standalone) location.replace('/app' + location.hash);

root.classList.add('lp-js'); root.lang = lang();
if (lang() !== 'uz') {
  document.title = t('UniDoue — xorijda o‘qishga yo‘l, aniq reja bilan');
  const md = $('meta[name=description]'); if (md) md.content = t('Xorijda o‘qish uchun 200 dan ortiq universitet, moslik hisobi, ariza kuzatuvi va AI mentor Doue. O‘zbek, rus va ingliz tillarida.');
}

/* ---------- sarlavha: tema, til, menyu ---------- */
$('#lp-tt').innerHTML = themeSwitch();
$('#lp-lg').innerHTML = langSelect('lang'); bindLang('lang', () => location.reload());
$('#lp-lg-m').innerHTML = langSelect('lang-m'); bindLang('lang-m', () => location.reload());
const hdr = $('#lp-h'), burger = $('#lp-bg-btn');
const setMenu = o => { hdr.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', String(o)); };
burger.addEventListener('click', () => setMenu(!hdr.classList.contains('is-open')));
$('#lp-nav').addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => { if (hdr.classList.contains('is-open') && !e.target.closest('#lp-h')) setMenu(false); });
$('#lp-y').textContent = new Date().getFullYear();

/* ---------- hisobga kirgan bo'lsa: tugmalar "Panelga o'tish" ga aylanadi ---------- */
fetch('/api/me', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).then(j => {
  if (!j || !j.user) return;
  document.body.classList.add('is-auth');
  $$('[data-auth=in]').forEach(a => a.remove());
  $$('[data-auth=up]').forEach(a => {
    const inPlan = a.closest('.lp-pl');
    a.href = inPlan ? '/app#/pricing' : '/app';
    if (inPlan) return;
    const sp = $$('span', a); const txt = t('Panelga o‘tish');
    if (sp.length) sp.forEach(s => (s.textContent = txt)); else a.textContent = txt;
  });
}).catch(() => {});

/* ---------- tarif kartalari: shisha, toj va kursor yaltirashi ---------- */
ensureSprite();
$$('[data-crown]').forEach(c => { c.outerHTML = crownHTML(); });
liveGlass($('.lp-plans'));

/* ---------- narxlar serverdan (o'zgarsa sahifa ham yangilanadi) ---------- */
fetch('/api/plans').then(r => (r.ok ? r.json() : null)).then(j => {
  if (!j || !Array.isArray(j.plans)) return;
  j.plans.forEach(p => { const el = $(`[data-pr="${p.id}"]`); if (el && typeof p.price === 'number') el.textContent = p.price ? '$' + p.price.toFixed(2) : '$0'; });
}).catch(() => {});

/* ---------- yer shari ---------- */
const cv = $('#lp-cv'), wrap = $('#lp-globe');
let globe = null;
try { globe = createGlobe(cv, { homeName: t('Toshkent'), still: reduced, step: innerWidth < 700 ? 2.9 : 2.4 }); } catch (e) { wrap.hidden = true; }

/* ---------- parallaks: skroll + sichqoncha ---------- */
function setAvoid() {
  if (!globe) return; const c = cv.getBoundingClientRect();
  globe.avoid(floats.filter(f => f.offsetParent).map(f => { const r = f.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }; }));
}
const floats = $$('[data-par]'), heroEl = $('#top'), steps = $$('.lp-step'), stepsEl = $('#lp-steps');
let sy = 0, mx = 0, my = 0, queued = false;
function apply() {
  queued = false;
  hdr.classList.toggle('is-s', sy > 8);
  if (reduced) return;
  root.style.setProperty('--sy', sy);
  const h = heroEl.offsetHeight;
  if (sy < h + 200) {
    wrap.style.setProperty('--gy', (sy * 0.2 + my).toFixed(1) + 'px'); wrap.style.setProperty('--gx', mx.toFixed(1) + 'px');
    floats.forEach(f => { f.style.transform = `translate3d(${(mx * -0.6).toFixed(1)}px,${(sy * parseFloat(f.dataset.par) + my * -0.6).toFixed(1)}px,0)`; });
    if (globe) { globe.boost(Math.min(sy, 700) * 0.0009); setAvoid(); }
  }
  if (stepsEl && innerWidth > 900) {
    const r = stepsEl.getBoundingClientRect(), c = innerHeight * 0.5, p = Math.max(0, Math.min(r.height - 60, c - r.top - 30));
    stepsEl.style.setProperty('--prog', p.toFixed(0) + 'px');
  }
}
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(apply); } };
addEventListener('scroll', () => { sy = scrollY; queue(); }, { passive: true });
if (!reduced) heroEl.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; mx = (e.clientX / innerWidth - 0.5) * -34; my = (e.clientY / innerHeight - 0.5) * -22; queue(); }, { passive: true });
sy = scrollY; apply();

/* ---------- ko'rinishga kirganda ochilish ---------- */
const rv = $$('[data-rv]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  rv.forEach(el => io.observe(el));
} else rv.forEach(el => el.classList.add('in'));

/* ---------- raqamlar sanaladi ---------- */
const stats = $('#stats');
if (stats && 'IntersectionObserver' in window && !reduced) {
  const so = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return; so.disconnect();
    $$('b[data-n]', stats).forEach(b => {
      const n = +b.dataset.n, t0 = performance.now(), d = 1300;
      const f = now => { const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(n * e); if (k < 1) requestAnimationFrame(f); };
      b.textContent = '0'; requestAnimationFrame(f);
    });
  }, { threshold: 0.4 });
  so.observe(stats);
}

/* ---------- 5 bosqichli hikoya ---------- */
const stage = $('#lp-stage'), winT = $('#lp-win-t');
function setStep(i) {
  stage.dataset.step = i; const h = $('h3', steps[i]); if (h) winT.textContent = h.textContent;
  steps.forEach((s, j) => { s.classList.toggle('is-on', j === i); s.classList.toggle('is-done', j < i); });
}
setStep(0);
if ('IntersectionObserver' in window) {
  const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.i); }), { rootMargin: '-46% 0px -46% 0px' });
  steps.forEach(s => so.observe(s));
}
/* telefonda: har bir bosqichning ostiga o'z oynasi nusxalanadi */
$$('.lp-pane').forEach(p => {
  const i = +p.dataset.p, host = steps[i]; if (!host) return;
  const box = document.createElement('div'); box.className = 'lp-pane-m'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<div class="lp-win"><div class="lp-win-b"><i></i><i></i><i></i><span></span></div><div class="lp-win-c"></div></div>';
  $('.lp-win-b span', box).textContent = $('h3', host).textContent; $('.lp-win-c', box).appendChild(p.cloneNode(true)); host.appendChild(box);
});

/* ---------- imkoniyat kartalarida yorug'lik sichqoncha ortidan ---------- */
$$('.lp-fc').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));

/* ---------- SAT demo ---------- */
const UNI = [['Arizona State University', 1120, 1360], ['Purdue University', 1220, 1480], ['Georgia Institute of Technology', 1370, 1530], ['Rice University', 1510, 1560], ['Stanford University', 1500, 1570]];
const LO = 900, SPAN = 700, pos = v => Math.max(0, Math.min(100, (v - LO) / SPAN * 100));
const dl = $('#d-list');
dl.innerHTML = UNI.map(u => `<div class="dm"><span class="mk-ring"><i></i></span><div><b>${u[0]}</b><small>SAT ${u[1]}–${u[2]}</small><div class="mk-meter"><b class="band" style="left:${pos(u[1]).toFixed(1)}%;width:${(pos(u[2]) - pos(u[1])).toFixed(1)}%"></b><i class="pin"></i></div></div><span class="mk-tier"></span></div>`).join('');
const rows = $$('.dm', dl), inp = $('#d-sat'), out = $('#d-o');
function demo() {
  const v = +inp.value; out.textContent = v; inp.style.setProperty('--fill', ((v - 1000) / 600 * 100).toFixed(1) + '%');
  UNI.forEach((u, k) => {
    const [, lo, hi] = u, tier = v >= hi ? 'safety' : v >= lo ? 'target' : 'reach';
    const sc = Math.round(v >= hi ? 80 + Math.min(18, (v - hi) * 0.18) : v >= lo ? 55 + 25 * (v - lo) / (hi - lo) : Math.max(5, 54 - (lo - v) * 0.2));
    const r = rows[k]; r.className = 'dm tk-' + tier;
    const ring = $('.mk-ring', r); ring.style.setProperty('--p', sc); $('i', ring).textContent = sc;
    $('.pin', r).style.left = pos(v).toFixed(1) + '%';
    const tp = $('.mk-tier', r); tp.textContent = tier === 'safety' ? 'Safety' : tier === 'target' ? 'Target' : 'Reach'; tp.className = 'mk-tier tk-' + tier;
  });
}
inp.addEventListener('input', demo); demo();

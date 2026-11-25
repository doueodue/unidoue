/* Portfolio dizayn studiyasi: Canva uslubidagi to‘liq ekranli muharrir.
 * Tepa panel (orqaga, nom, bekor qilish/qaytarish, saqlash, eksport), chapda asboblar tasmasi, yonida tanlangan asbob paneli,
 * o‘rtada jonli katta ko‘rinish va uning ustida suzuvchi asboblar (A4/veb, qurilma, solishtirish, tasodifiy), pastda masshtab.
 * Muharrir (rang, shrift, fon, effekt, o‘z dizayn, AI) faqat Pro'da; Free va Plus shablon va rang tanlaydi, qolgan asboblarda Pro taklifi chiqadi.
 * Hujjat modeli (st.pf) va tugmalar (data-dz, data-my-*, data-do) portfolio.js dagi umumiy ishlovchilar bilan ishlaydi:
 * studiya shu sahifa ildizi ichiga joylanadi. Bu modul faqat qobiq, ko‘rinish (masshtab/qurilma), tarix va tezkor tugmalarni boshqaradi. */
import { $, $$, esc, toast } from './core.js';
import { t as tr } from './i18n.js';
import { TOOLS, toolIds, toolHTML, shuffleDz, TPL_N } from './pfstudio.js';
import { defaultDz, PALETTES, GF, MY_FONTS, allow } from './pfdesign.js';

/* qurilma: [kenglik, balandlik, tepada qo‘shimcha (brauzer paneli), ramka] — CSS pikselda */
export const DEV = { desktop: [1280, 800, 34, 0], tablet: [820, 1100, 0, 14], phone: [390, 844, 0, 12] };
export const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];
const HMAX = 100;
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
const I = {
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>',
  minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>', eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  shuffle: '<path d="M3 7h3.5c2.2 0 3.6 1.2 5 3.2l1 1.6c1.4 2 2.8 3.2 5 3.2H21M3 17h3.5c2.2 0 3.6-1.2 5-3.2M13.5 8.2C14.9 6.7 16 6 17.5 6H21"/><path d="M18.5 3.5L21 6l-2.5 2.5M18.5 12.5L21 15l-2.5 2.5"/>',
  reset: '<path d="M4 12a8 8 0 108-8H8"/><path d="M11 1.5L7.5 4.2 11 7"/>', save: '<path d="M6 3.5h12v17l-6-4-6 4z"/>', down: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  desktop: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 20h6M12 16.5V20"/>', tablet: '<rect x="5" y="3" width="14" height="18" rx="2.4"/><path d="M11 18h2"/>', phone: '<rect x="7.5" y="2.5" width="9" height="19" rx="2.4"/><path d="M11 18.5h2"/>',
  guide: '<path d="M4 8h16M4 16h16"/><path d="M8 3v3M16 3v3M8 18v3M16 18v3" opacity=".6"/>', chev: '<path d="M7 10l5 5 5-5"/>',
  crown: '<path d="M3.5 8.5l4.2 3.6L12 5l4.3 7.1 4.2-3.6-1.7 9.5H5.2z"/><path d="M5.5 21h13"/>', spark: '<path d="M12 3l1.9 5.4L19.3 10.3 13.9 12.2 12 17.6 10.1 12.2 4.7 10.3l5.4-1.9z"/>'
};
const snap = st => JSON.stringify({ tpl: st.pf.tpl, accent: st.pf.accent, dz: st.pf.dz });
const typingEl = el => !!el && (el.isContentEditable || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(color|range|checkbox|radio|button)$/.test(el.type)) || el.tagName === 'SELECT');
/** Fokusni panel qayta chizilgandan keyin tiklash uchun element belgisi (data-atribut yoki id). */
const FOCUS_ATTRS = ['data-dz', 'data-my-set', 'data-my-preset', 'data-hex', 'data-myc', 'data-cc', 'data-myr', 'data-fq', 'data-do', 'id'];
const focusKey = el => { for (const a of FOCUS_ATTRS) { const v = el.getAttribute && el.getAttribute(a); if (v) return [a, v]; } return null; };

function shell(lite) {
  const b = (a, label, ic, x = '') => `<button type="button" class="pfs-b" data-pfs="${a}" aria-label="${esc(tr(label))}" title="${esc(tr(label))}"${x}>${svg(ic)}</button>`;
  const dev = [['desktop', 'Kompyuter', I.desktop], ['tablet', 'Planshet', I.tablet], ['phone', 'Telefon', I.phone]].map(([k, l, ic]) => `<button type="button" data-pfs-dev="${k}" aria-label="${esc(tr(l))}" title="${esc(tr(l))}" aria-selected="false">${svg(ic)}</button>`).join('');
  const tools = TOOLS.map(([id, nm, , ic]) => `<button type="button" class="pfs-tl${lite && id !== 'templates' ? ' lk' : ''}" role="tab" data-pfs-tool="${id}" aria-selected="false" aria-controls="pfs-panel" id="pfs-t-${id}"><span class="pfs-tli">${svg(ic)}${lite && id !== 'templates' ? `<i class="pfs-tlp" aria-hidden="true">${svg(I.crown)}</i>` : ''}</span><span class="pfs-tln">${esc(tr(nm))}</span></button>`).join('');
  return `<header class="pfs-top">
    <button type="button" class="pfs-back" data-pfs="close" aria-label="${esc(tr('Studiyadan chiqish'))}">${svg(I.back)}<span>${esc(tr('Orqaga'))}</span></button>
    <div class="pfs-brand"><span class="pfs-logo" aria-hidden="true">${svg(I.spark)}</span><div class="pfs-ttl"><b id="pfs-ttl"></b><span id="pfs-sav" class="pfs-sav" role="status" aria-live="polite"></span></div></div>
    <div class="pfs-sp"></div>
    <div class="pfs-grp pfs-hist">${b('undo', 'Bekor qilish (Ctrl+Z)', I.undo, ' disabled')}${b('redo', 'Qaytarish (Ctrl+Shift+Z)', I.redo, ' disabled')}</div>
    ${lite ? '' : `<button type="button" class="btn sm pfs-save" data-do="my-save">${svg(I.save)}<span>${esc(tr('Saqlash'))}</span></button>`}
    <div class="pfs-exp"><button type="button" class="btn primary sm" data-pfs="exp" aria-haspopup="true" aria-expanded="false">${svg(I.down)}<span>${esc(tr('Eksport'))}</span></button>
      <div class="pfs-menu" hidden><button type="button" data-do="pdf"><b>PDF</b><small>${esc(tr('Chop etish oynasi'))}</small></button><button type="button" data-do="word"><b>Word</b><small>${esc(tr('Tahrirlash uchun'))}</small></button><button type="button" data-do="web"><b>${esc(tr('Veb sahifa'))}</b><small>${esc(tr('Bitta HTML fayl'))}</small></button></div></div>
  </header>
  <div class="pfs-body"><nav class="pfs-rail" role="tablist" aria-orientation="vertical" aria-label="${esc(tr('Asboblar'))}">${tools}</nav>
    <aside class="pfs-panel" id="pfs-panel" role="tabpanel" tabindex="-1"></aside>
    <main class="pfs-stage" aria-label="${esc(tr('Jonli ko‘rinish'))}">
      <div class="pfs-tb" role="toolbar" aria-label="${esc(tr('Ko‘rinish sozlamalari'))}">
        <div class="pfs-seg" role="group" aria-label="${esc(tr('Ko‘rinish turi'))}"><button type="button" data-pfs-view="a4" aria-selected="true">A4 (PDF)</button><button type="button" data-pfs-view="web" aria-selected="false">${esc(tr('Veb-sayt'))}</button></div>
        <div class="pfs-seg pfs-dv2" id="pfs-dev" role="group" aria-label="${esc(tr('Qurilma'))}">${dev}</div>
        <span class="pfs-sep" aria-hidden="true"></span>
        <div class="pfs-grp">${b('cmp', 'Oldingi ko‘rinish bilan solishtirish', I.eye, ' aria-pressed="false"')}${b('shuffle', 'Tasodifiy kombinatsiya', I.shuffle)}${b('reset', 'Standart dizaynga qaytarish', I.reset)}</div>
      </div>
      <div class="pfs-host" id="pfs-host"></div>
      <div class="pfs-cmpb" aria-hidden="true">${esc(tr('Oldingi ko‘rinish'))}</div>
      <div class="pfs-bar"><div class="pfs-chip" id="pfs-chip"></div>
        <div class="pfs-zoom" role="group" aria-label="${esc(tr('Masshtab'))}">${b('zout', 'Kichraytirish (-)', I.minus)}<button type="button" class="pfs-zv" data-pfs="fit" id="pfs-zv" title="${esc(tr('Ekranga moslash (0)'))}">100%</button>${b('zin', 'Kattalashtirish (+)', I.plus)}</div></div>
    </main></div>`;
}

/** Studiyani ochadi. ctx: { st, plan(), previewNow(), pvHTML(), onClose(), slug(), wire(root) }. wire — sahifaning umumiy ishlovchilarini studiyaga ham ulaydi. Natija: boshqaruv obyekti. */
export function openStudio(ctx) {
  const { st } = ctx;
  if (st.studio) return st.studio;
  const lite = !allow(ctx.plan()).studio;
  const root = document.createElement('div');
  root.className = 'pfs' + (lite ? ' lite' : ''); root.id = 'pfs'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', tr('Dizayn studiyasi'));
  root.innerHTML = shell(lite);
  document.body.appendChild(root); // sahifa ildizi ichida emas: ilovaning yon paneli va tepa paneli ustida to‘liq ekran qatlami bo‘lishi uchun
  if (ctx.wire) ctx.wire(root);
  document.documentElement.classList.add('pfs-open');
  const restoreInert = inertOthers(root);
  const mq = matchMedia('(max-width:900px)');
  if (!toolIds.includes(st.tool)) st.tool = 'templates';
  st.zoom = null; st.device = st.device || (mq.matches ? 'phone' : 'desktop'); st.cmp = false; st.guides = st.guides !== false; st.fq = ''; st.wy = 0; st.sheetShut = false;
  st.base = snap(st);
  const H = { past: [], future: [], cur: snap(st), key: '', t: 0 };
  let savT = 0, fontsOn = 0, pushed = false;
  try { history.pushState({ ...(history.state || {}), pfs: 1 }, '', location.href); pushed = true; } catch (e) {}

  /* ---------- tarix (bekor qilish / qaytarish) ---------- */
  function track(key) {
    const s = snap(st); if (s === H.cur) return;
    const now = Date.now();
    if (key && key === H.key && now - H.t < 900) { H.cur = s; H.t = now; }
    else { H.past.push(H.cur); if (H.past.length > HMAX) H.past.shift(); H.cur = s; H.future = []; H.key = key || ''; H.t = now; }
    st.cmp = false;
    const sv = $('#pfs-sav', root); if (sv) { sv.textContent = tr('Saqlanmoqda…'); sv.dataset.s = 'w'; clearTimeout(savT); savT = setTimeout(() => { const e = $('#pfs-sav', root); if (e) { e.textContent = tr('Saqlandi'); e.dataset.s = 'ok'; } }, 950); }
    bar();
  }
  function restore(s) { const o = JSON.parse(s); st.pf.tpl = o.tpl; st.pf.accent = o.accent; st.pf.dz = o.dz; H.cur = s; H.key = ''; st.cmp = false; renderPanel(); ctx.previewNow(); bar(); }
  const undo = () => { if (!H.past.length) return; H.future.push(H.cur); restore(H.past.pop()); };
  const redo = () => { if (!H.future.length) return; H.past.push(H.cur); restore(H.future.pop()); };

  /* ---------- ko‘rinish (A4 / veb) ---------- */
  const label = k => { const z = $('#pfs-zv', root); if (z) z.textContent = Math.round(k * 100) + '%'; st.k = k; };
  const chip = html => { const c = $('#pfs-chip', root); if (c) c.innerHTML = html; };
  function a4Stage(host, html) {
    host.innerHTML = '<div class="pfs-cv"><div class="pfs-sheet"><iframe sandbox="allow-same-origin" title="Portfolio" tabindex="-1"></iframe></div></div>';
    const sheet = host.firstChild.firstChild, f = sheet.firstChild; let Hh = 1123, k = 1;
    const guideBtn = () => `<button type="button" class="pfs-gd" data-pfs="guides" aria-pressed="${st.guides}" title="${esc(tr('Sahifa chegaralari'))}">${svg(I.guide)}<span>${esc(tr('Chegaralar'))}</span></button>`;
    const fit = () => {
      const pad = host.clientWidth < 700 ? 12 : 40, aw = Math.max(160, host.clientWidth - pad * 2), ah = Math.max(160, host.clientHeight - pad * 2);
      host.style.setProperty('--pad', pad + 'px');
      k = st.zoom || Math.min(aw / 794, ah / 1123, 1.5);
      sheet.style.width = Math.round(794 * k) + 'px'; sheet.style.height = Math.round(Hh * k) + 'px'; f.style.height = Hh + 'px'; f.style.transform = `scale(${k})`;
      const n = Math.max(1, Math.ceil((Hh - 30) / 1123)); chip(`<span>≈ ${n} ${esc(tr(n === 1 ? 'sahifa' : 'sahifalar'))}</span>${guideBtn()}`); label(k);
    };
    const measure = () => { try { f.style.height = '10px'; Hh = Math.max(1123, f.contentDocument.documentElement.scrollHeight); } catch (e) {} fit(); };
    f.addEventListener('load', () => { measure(); try { f.contentDocument.fonts.ready.then(measure); } catch (e) {} });
    f.srcdoc = html;
    const ro2 = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null; if (ro2) ro2.observe(host);
    return {
      stop() { if (ro2) ro2.disconnect(); }, measure, refit: fit,
      update(h) { try { const d = f.contentDocument, n = new DOMParser().parseFromString(h, 'text/html'); d.body.className = n.body.className; d.body.innerHTML = n.body.innerHTML; const a = d.querySelector('style'), b = n.querySelector('style'); if (a && b) a.textContent = b.textContent; d.documentElement.lang = n.documentElement.lang; d.documentElement.className = n.documentElement.className; const la = d.querySelector('link[rel=stylesheet]'), lb = n.querySelector('link[rel=stylesheet]'); if (la && lb && la.getAttribute('href') !== lb.getAttribute('href')) la.setAttribute('href', lb.getAttribute('href')); setTimeout(measure, 40); } catch (e) { f.srcdoc = h; } }
    };
  }
  function webStage(host, html) {
    const [W, Hd, top, pad] = DEV[st.device] || DEV.desktop, tw = W + pad * 2, th = Hd + top + pad * 2;
    host.innerHTML = `<div class="pfs-cv"><div class="pfs-dw"><div class="pfs-dv d-${esc(st.device)}" style="width:${tw}px;height:${th}px"><div class="pfs-ab"><i></i><i></i><i></i><span>${esc(ctx.slug())}.html</span></div><div class="pfs-scr" style="width:${W}px;height:${Hd}px"><iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" title="${esc(tr('Veb-sayt ko‘rinishi'))}"></iframe></div></div></div></div>`;
    const dw = host.firstChild.firstChild, dv = dw.firstChild, f = $('iframe', dv);
    const fit = () => {
      const pad2 = host.clientWidth < 700 ? 10 : 36, aw = Math.max(160, host.clientWidth - pad2 * 2), ah = Math.max(160, host.clientHeight - pad2 * 2);
      host.style.setProperty('--pad', pad2 + 'px');
      const k = st.zoom || Math.min(aw / tw, ah / th, 1.25);
      dw.style.width = Math.round(tw * k) + 'px'; dw.style.height = Math.round(th * k) + 'px'; dv.style.transform = `scale(${k})`;
      chip(`<span>${W} × ${Hd} px</span>`); label(k);
    };
    const onMsg = e => { if (e.source === f.contentWindow && e.data && e.data.pf === 'scroll') st.wy = +e.data.y || 0; };
    addEventListener('message', onMsg);
    f.addEventListener('load', () => { if (st.wy > 0) { const send = () => { try { f.contentWindow.postMessage({ pf: 'scrollTo', y: st.wy }, '*'); } catch (e) {} }; send(); setTimeout(send, 400); } });
    f.srcdoc = html; fit();
    const ro2 = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null; if (ro2) ro2.observe(host);
    return { stop() { removeEventListener('message', onMsg); if (ro2) ro2.disconnect(); }, measure: fit, refit: fit, update(x) { f.srcdoc = x; } };
  }
  function mountStage() {
    const host = $('#pfs-host', root); if (!host) return;
    if (st.paper && st.paper.stop) st.paper.stop();
    st.paper = st.view === 'web' ? webStage(host, ctx.pvHTML()) : a4Stage(host, ctx.pvHTML());
    host.scrollTop = 0; bar();
  }

  /* ---------- panel ---------- */
  function applyFq() {
    const p = $('#pfs-panel', root), q = (st.fq || '').trim().toLowerCase(), inp = $('[data-fq]', p); if (!inp) return;
    if (inp.value !== st.fq) inp.value = st.fq || '';
    let n = 0; $$('.pfs-fc', p).forEach(c => { const hide = !!q && !c.dataset.n.includes(q); c.hidden = hide; if (!hide) n++; });
    $$('.pfs-fl', p).forEach(l => { const sec = l.closest('.pf-dzs'); if (sec) sec.hidden = !$$('.pfs-fc:not([hidden])', l).length; });
    const none = $('.pfs-none', p); if (none) none.hidden = n > 0;
  }
  function ensureFonts() {
    if (fontsOn) return; fontsOn = 1;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.pfs = '';
    l.href = `https://fonts.googleapis.com/css2?${MY_FONTS.map(k => 'family=' + GF[k]).join('&')}&display=swap&text=Aa`;
    document.head.appendChild(l);
  }
  function renderPanel(reset) {
    const p = $('#pfs-panel', root); if (!p) return;
    const y = reset ? 0 : p.scrollTop, fk = !reset && p.contains(document.activeElement) ? focusKey(document.activeElement) : null;
    p.innerHTML = toolHTML(st, ctx.plan(), st.tool); p.scrollTop = y;
    p.setAttribute('aria-labelledby', 'pfs-t-' + st.tool);
    if (fk) { const n = fk[0] === 'id' ? p.querySelector('#' + CSS.escape(fk[1])) : p.querySelector(`[${fk[0]}="${CSS.escape(fk[1])}"]`); if (n) n.focus({ preventScroll: true }); }
    if (st.tool === 'fonts' && !lite) { ensureFonts(); applyFq(); }
    bar();
  }
  function setTool(id, focus) {
    if (!toolIds.includes(id)) return;
    const same = st.tool === id;
    if (mq.matches && same) { st.sheetShut = !st.sheetShut; }
    else { st.sheetShut = false; st.tool = id; renderPanel(true); }
    bar(); if (focus) $(`[data-pfs-tool="${id}"]`, root).focus();
    if (mq.matches) setTimeout(() => st.paper && st.paper.refit && st.paper.refit(), 260);
  }

  function bar() {
    const T = $('#pfs-ttl', root); if (!T) return;
    const my = st.pf.dz.my && !lite; T.textContent = my ? (st.pf.dz.my.name || tr('O‘z dizayn')) : tr(TPL_N[st.pf.tpl] || 'Dizayn');
    $('[data-pfs=undo]', root).disabled = !H.past.length; $('[data-pfs=redo]', root).disabled = !H.future.length;
    $$('[data-pfs-view]', root).forEach(b => b.setAttribute('aria-selected', String(b.dataset.pfsView === st.view)));
    $$('[data-pfs-dev]', root).forEach(b => b.setAttribute('aria-selected', String(b.dataset.pfsDev === st.device)));
    $$('[data-pfs-tool]', root).forEach(b => { const on = b.dataset.pfsTool === st.tool; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    const c = $('[data-pfs=cmp]', root); c.setAttribute('aria-pressed', String(!!st.cmp));
    root.classList.toggle('cmp', !!st.cmp); root.classList.toggle('shut', !!st.sheetShut); root.dataset.view = st.view;
  }

  /* ---------- amallar ---------- */
  const zoomBy = dir => { const cur = st.k || 1; const nx = dir > 0 ? ZOOMS.find(z => z > cur + 0.005) : [...ZOOMS].reverse().find(z => z < cur - 0.005); if (nx) { st.zoom = nx; st.paper.refit(); } };
  function setView(v) { if (st.view === v) return; st.view = v; st.zoom = null; mountStage(); }
  function setDevice(d) { if (!DEV[d] || st.device === d) return; st.device = d; st.zoom = null; if (st.view === 'web') mountStage(); else bar(); }
  const menu = open => { const m = $('.pfs-menu', root), b = $('[data-pfs=exp]', root); m.hidden = !open; b.setAttribute('aria-expanded', String(open)); };
  function toggleCmp() { const on = !st.cmp; track(); st.cmp = on; ctx.previewNow(); bar(); } // track() kutilmagan o‘zgarishni yozib, cmp ni o‘chirib qo‘yishi mumkin: shuning uchun oldin chaqiramiz
  function doReset() { st.pf.tpl = 'ledger'; st.pf.accent = PALETTES[0][0]; st.pf.dz = defaultDz(); renderPanel(); ctx.previewNow(); toast(tr('Standart dizayn qo‘llandi. Ctrl+Z bilan qaytarasiz.')); }
  function doShuffle() { shuffleDz(st, ctx.plan()); renderPanel(); ctx.previewNow(); }
  /** how: 'pop' — brauzer "orqaga" tugmasi, 'hash' — boshqa sahifaga o‘tildi (tarix yozuviga tegilmaydi). */
  function close(how) {
    if (st.studio !== api) return; st.studio = null;
    removeEventListener('keydown', kd, true); removeEventListener('hashchange', onHash); removeEventListener('popstate', onPop); if (mq.removeEventListener) mq.removeEventListener('change', onMq);
    if (st.paper && st.paper.stop) st.paper.stop();
    clearTimeout(savT); st.cmp = false; restoreInert(); root.remove(); document.documentElement.classList.remove('pfs-open');
    if (pushed && how !== 'pop' && how !== 'hash' && history.state && history.state.pfs) { try { history.back(); } catch (e) {} }
    if (how !== 'hash') ctx.onClose(); // boshqa sahifaga o‘tilganda ko‘rinishni tiklash shart emas
  }
  const onHash = () => close('hash'), onPop = () => close('pop');

  root.addEventListener('click', e => {
    const t = e.target;
    const a = t.closest('[data-pfs]'); if (a && !a.disabled) {
      const k = a.dataset.pfs;
      if (k === 'close') close(); else if (k === 'undo') undo(); else if (k === 'redo') redo();
      else if (k === 'zin') zoomBy(1); else if (k === 'zout') zoomBy(-1); else if (k === 'fit') { st.zoom = null; st.paper.refit(); }
      else if (k === 'cmp') toggleCmp(); else if (k === 'shuffle') doShuffle(); else if (k === 'reset') doReset();
      else if (k === 'exp') { menu($('.pfs-menu', root).hidden); return; }
      else if (k === 'guides') { st.guides = !st.guides; ctx.previewNow(); const g = $('[data-pfs=guides]', root); if (g) g.setAttribute('aria-pressed', String(st.guides)); }
    }
    const tl = t.closest('[data-pfs-tool]'); if (tl) setTool(tl.dataset.pfsTool);
    const v = t.closest('[data-pfs-view]'); if (v) setView(v.dataset.pfsView);
    const d = t.closest('[data-pfs-dev]'); if (d) setDevice(d.dataset.pfsDev);
    if (!t.closest('.pfs-exp') || t.closest('.pfs-menu [data-do]')) menu(false);
  });
  root.addEventListener('input', e => {
    const f = e.target.closest('[data-fq]'); if (f) { st.fq = f.value; applyFq(); return; }
    const c = e.target.closest('input[type=color]'); if (c) { const lab = c.closest('.pfs-cs'); if (lab) lab.style.setProperty('--c', c.value); const row = c.closest('.pfs-cr'), hx = row && $('.pfs-hex', row); if (hx && document.activeElement !== hx) { hx.value = c.value; hx.removeAttribute('aria-invalid'); } }
    const r = e.target.closest('input[type=range]'); const key = (c || r) ? (e.target.dataset.myc || e.target.dataset.cc || e.target.dataset.myr || 'x') : (e.target.closest('[data-hex]') ? 'hex:' + e.target.dataset.hex : '');
    if (key) setTimeout(() => track(key), 0); // portfolio.js ishlovchisi holatni o‘zgartirgach (shu hodisada, sinxron) yoziladi
  });
  root.addEventListener('focusout', e => { const hx = e.target.closest && e.target.closest('[data-hex]'); if (hx) { const [kind, key] = hx.dataset.hex.split(':'), c = $(`[data-${kind}="${key}"]`, root); if (c) hx.value = c.value; hx.removeAttribute('aria-invalid'); } });
  const rail = $('.pfs-rail', root);
  rail.addEventListener('keydown', e => {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!dir) return;
    e.preventDefault(); const i = toolIds.indexOf(st.tool), nx = toolIds[(i + dir + toolIds.length) % toolIds.length]; st.sheetShut = false; st.tool = nx; renderPanel(true); $(`[data-pfs-tool="${nx}"]`, root).focus();
  });
  $('.pfs-stage', root).addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });

  function kd(e) {
    if (!root.isConnected || e.defaultPrevented) return; // esc.js oynani (modal) yopayotgan bo‘lsa, studiya yopilmasin
    if (document.querySelector('.modal-bg:not(.out)')) return; // oyna (modal) ochiq: u o‘zi boshqaradi
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (e.key === 'Escape') { const m = $('.pfs-menu', root); if (!m.hidden) { menu(false); e.preventDefault(); e.stopPropagation(); return; } if (typingEl(e.target)) { e.target.blur(); e.preventDefault(); e.stopPropagation(); return; } e.preventDefault(); e.stopPropagation(); close(); return; }
    if (mod && !e.altKey && (k === 'z' || k === 'y')) { if (typingEl(e.target)) return; e.preventDefault(); (k === 'y' || e.shiftKey) ? redo() : undo(); return; }
    if (!mod && !e.altKey && !typingEl(e.target)) {
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1); } else if (e.key === '-') { e.preventDefault(); zoomBy(-1); } else if (e.key === '0') { e.preventDefault(); st.zoom = null; st.paper.refit(); }
    }
  }
  addEventListener('keydown', kd, true);
  addEventListener('hashchange', onHash);
  addEventListener('popstate', onPop);
  const onMq = () => { st.zoom = null; st.sheetShut = false; bar(); if (st.paper && st.paper.refit) st.paper.refit(); };
  if (mq.addEventListener) mq.addEventListener('change', onMq);

  const api = { root, lite, track, undo, redo, close, renderPanel, mount: mountStage, canUndo: () => H.past.length > 0, canRedo: () => H.future.length > 0 };
  st.studio = api;
  renderPanel(true); mountStage();
  const first = $(`[data-pfs-tool="${st.tool}"]`, root); if (first) first.focus({ preventScroll: true });
  return api;
}

/** Studiya ochiq paytda fonning qolgan qismi (menyu, sahifa) klaviatura va ekran o‘quvchiga yopiladi. Qaytarish funksiyasini beradi. */
function inertOthers(root) {
  const done = [];
  for (let n = root; n && n !== document.documentElement; n = n.parentElement) {
    const p = n.parentElement; if (!p) break;
    for (const c of p.children) if (c !== n && !c.hasAttribute('inert') && c.tagName !== 'SCRIPT' && !c.matches('.toasts,[aria-live],[role=status],[role=alert]')) { c.setAttribute('inert', ''); done.push(c); }
  }
  return () => done.forEach(c => c.removeAttribute('inert'));
}

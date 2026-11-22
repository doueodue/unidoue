/* Standart brauzer elementlarini oʻz dizaynimizga almashtiradi (ilova va admin uchun umumiy):
 *   <select>            → ochiladigan roʻyxat (klaviatura, qidirish, balandlikka qarab yuqoriga/pastga ochiladi)
 *   <input type=date>   → oʻz kalendarimiz (kun / oy / yil, min–max, “Bugun”, “Tozalash”)
 *   <input type=number> → ixcham “+ / −” tugmalari
 *   <input list=…>      → oʻz takliflar roʻyxati (datalist oʻrniga)
 *   [title]             → oʻz izohimiz (brauzerning oq “tooltip”i oʻrniga)
 * Asl element DOMda qoladi (yashirin) va .value / change / input / focus oldingidek ishlaydi — mavjud kod oʻzgarmaydi. */

const $ = (s, r = document) => r.querySelector(s);
const L10N = {
  uz: { today: 'Bugun', clear: 'Tozalash', ph: 'kk.oo.yyyy', prev: 'Oldingi', next: 'Keyingi', pick: 'Sana tanlash', yr: 'Yilni tanlash', mo: 'Oyni tanlash', none: 'Hech narsa topilmadi' },
  ru: { today: 'Сегодня', clear: 'Очистить', ph: 'дд.мм.гггг', prev: 'Назад', next: 'Вперёд', pick: 'Выбрать дату', yr: 'Выбрать год', mo: 'Выбрать месяц', none: 'Ничего не найдено' },
  en: { today: 'Today', clear: 'Clear', ph: 'dd.mm.yyyy', prev: 'Previous', next: 'Next', pick: 'Pick a date', yr: 'Pick a year', mo: 'Pick a month', none: 'Nothing found' }
};
const lg = () => { const l = (document.documentElement.lang || 'uz').slice(0, 2); return L10N[l] ? l : 'uz'; };
const tx = k => L10N[lg()][k];
const SVG = {
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  l: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6"/></svg>', r: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5"/></svg>', dn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>',
  tick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fire = (el, ...types) => types.forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
let uid = 0;

/* ---------- umumiy ochiladigan oyna (popover) ---------- */
let cur = null; // { el, anchor, close }
function closePop() { if (cur) { const c = cur; cur = null; c.close && c.close(); c.el.classList.add('out'); setTimeout(() => c.el.remove(), 120); c.anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside, true); document.removeEventListener('scroll', onScroll, true); removeEventListener('resize', closePop); } }
const outside = e => { if (cur && !cur.el.contains(e.target) && !cur.anchor.contains(e.target)) closePop(); };
const onScroll = e => { if (cur && !cur.el.contains(e.target)) place(); };
function place() {
  if (!cur) return;
  const { el, anchor } = cur, r = anchor.getBoundingClientRect(), vh = innerHeight, vw = innerWidth;
  if (r.bottom < 0 || r.top > vh) return closePop();
  el.style.minWidth = Math.max(r.width, cur.minW || 0) + 'px';
  el.style.maxWidth = Math.min(vw - 16, cur.maxW || 520) + 'px';
  const h = el.offsetHeight, w = el.offsetWidth, below = vh - r.bottom - 10, above = r.top - 10;
  const up = h > below && above > below;
  el.style.maxHeight = Math.max(140, Math.min(cur.maxH || 300, (up ? above : below))) + 'px';
  const h2 = el.offsetHeight;
  el.style.top = Math.round(up ? Math.max(8, r.top - h2 - 6) : r.bottom + 6) + 'px';
  el.style.left = Math.round(Math.max(8, Math.min(r.left, vw - w - 8))) + 'px';
  el.classList.toggle('up', up);
}
function openPop(anchor, el, opt = {}) {
  closePop();
  el.classList.add('pop'); document.body.appendChild(el);
  cur = { el, anchor, ...opt }; anchor.setAttribute('aria-expanded', 'true'); place();
  document.addEventListener('mousedown', outside, true); document.addEventListener('scroll', onScroll, true); addEventListener('resize', closePop);
  return cur;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur) { const a = cur.anchor; closePop(); a.focus && a.focus(); e.stopPropagation(); } }, true);

/* ---------- <select> ---------- */
const SELV = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value'), SELI = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
function upgradeSelect(sel) {
  if (sel.dataset.cs || sel.multiple || sel.size > 1 || sel.hasAttribute('data-native')) return;
  sel.dataset.cs = '1';
  const wrap = document.createElement('span'), btn = document.createElement('button'), id = 'cs' + ++uid;
  wrap.className = 'cs'; if (sel.style.cssText) wrap.style.cssText = sel.style.cssText;
  btn.type = 'button'; btn.className = 'cs-b'; btn.setAttribute('role', 'combobox'); btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id);
  btn.innerHTML = `<span class="cs-v"></span>${SVG.chev}`;
  sel.parentNode.insertBefore(wrap, sel); wrap.append(btn, sel);
  sel.classList.add('cs-n'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
  const lab = sel.id ? document.querySelector(`label[for="${CSS.escape(sel.id)}"]`) : null;
  if (lab) { if (!lab.id) lab.id = id + 'l'; btn.setAttribute('aria-labelledby', lab.id); } else if (sel.getAttribute('aria-label')) btn.setAttribute('aria-label', sel.getAttribute('aria-label'));
  const label = () => { const o = sel.options[sel.selectedIndex]; return o ? o.textContent.trim() : ''; };
  const refresh = () => {
    const v = $('.cs-v', btn), t = label(); v.textContent = t || ' '; v.classList.toggle('ph', !t || !!(sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].hasAttribute('data-ph')));
    btn.disabled = sel.disabled; wrap.classList.toggle('dis', sel.disabled);
  };
  Object.defineProperty(sel, 'value', { configurable: true, get() { return SELV.get.call(this); }, set(v) { SELV.set.call(this, v); refresh(); } });
  Object.defineProperty(sel, 'selectedIndex', { configurable: true, get() { return SELI.get.call(this); }, set(v) { SELI.set.call(this, v); refresh(); } });
  new MutationObserver(refresh).observe(sel, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
  sel.addEventListener('focus', () => btn.focus());
  sel.addEventListener('change', refresh);
  const choose = i => { if (i < 0 || sel.options[i].disabled) return; const ch = SELI.get.call(sel) !== i; SELI.set.call(sel, i); refresh(); if (ch) fire(sel, 'input', 'change'); };
  let act = -1, list = null, typed = '', tt = 0;
  const items = () => Array.from(list.querySelectorAll('[role=option]'));
  const mark = (i, scroll = true) => { act = i; items().forEach((li, k) => li.classList.toggle('act', k === i)); const li = items()[i]; if (li) { btn.setAttribute('aria-activedescendant', li.id); if (scroll) li.scrollIntoView({ block: 'nearest' }); } };
  const step = (from, dir) => { const n = sel.options.length; for (let k = 1; k <= n; k++) { const i = (from + dir * k + n * 2) % n; if (!sel.options[i].disabled) return i; } return from; };
  function open() {
    if (cur && cur.anchor === btn) return closePop();
    list = document.createElement('ul'); list.id = id; list.className = 'cs-l'; list.setAttribute('role', 'listbox');
    let html = '', grp = null;
    Array.from(sel.options).forEach((o, i) => {
      if (o.parentElement.tagName === 'OPTGROUP' && o.parentElement !== grp) { grp = o.parentElement; html += `<li class="cs-g" role="presentation">${esc(grp.label)}</li>`; }
      html += `<li role="option" id="${id}o${i}" data-i="${i}" aria-selected="${i === sel.selectedIndex}"${o.disabled ? ' aria-disabled="true"' : ''}>${esc(o.textContent.trim()) || '&nbsp;'}${SVG.tick}</li>`;
    });
    list.innerHTML = html;
    list.addEventListener('mousedown', e => e.preventDefault());
    list.addEventListener('click', e => { const li = e.target.closest('[role=option]'); if (!li) return; choose(+li.dataset.i); closePop(); btn.focus(); });
    list.addEventListener('mousemove', e => { const li = e.target.closest('[role=option]'); if (li && !li.hasAttribute('aria-disabled')) { const i = items().indexOf(li); if (i !== act) mark(i, false); } });
    openPop(btn, list, { maxH: 300, close: () => { btn.removeAttribute('aria-activedescendant'); } });
    mark(Math.max(0, sel.selectedIndex));
  }
  btn.addEventListener('click', open);
  btn.addEventListener('keydown', e => {
    const isOpen = cur && cur.anchor === btn, k = e.key;
    if (k === 'Tab') { if (isOpen) closePop(); return; }
    if (['ArrowDown', 'ArrowUp'].includes(k)) {
      e.preventDefault(); const dir = k === 'ArrowDown' ? 1 : -1;
      if (isOpen) { if (e.altKey && dir < 0) return closePop(); const opts = items().map(li => +li.dataset.i); const idx = opts.indexOf(step(opts[act] ?? 0, dir) ); mark(idx < 0 ? act : idx); }
      else if (e.altKey) open(); else choose(step(sel.selectedIndex, dir));
    } else if (['Enter', ' '].includes(k)) {
      e.preventDefault(); if (isOpen) { const li = items()[act]; if (li) choose(+li.dataset.i); closePop(); } else open();
    } else if (k === 'Home' || k === 'End') {
      if (isOpen) { e.preventDefault(); mark(k === 'Home' ? 0 : items().length - 1); }
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { // yozib qidirish
      typed += k.toLowerCase(); clearTimeout(tt); tt = setTimeout(() => (typed = ''), 700);
      const from = isOpen ? (+items()[act].dataset.i) : sel.selectedIndex, n = sel.options.length;
      for (let j = 1; j <= n; j++) { const i = (from + j + (typed.length > 1 ? n - 1 : 0)) % n; if (!sel.options[i].disabled && sel.options[i].textContent.trim().toLowerCase().startsWith(typed)) { if (isOpen) mark(items().findIndex(li => +li.dataset.i === i)); else choose(i); break; } }
    }
  });
  refresh();
}

/* ---------- <input type=date> ---------- */
const pad = n => String(n).padStart(2, '0'), iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = v => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(v || ''); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; };
const todayISO = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// Oʻzbekcha nomlar brauzerda toʻliq emas (qisqa oylar “M01” boʻlib chiqadi), shuning uchun oʻzimiz beramiz
const UZ = { m: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'], ms: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'], w: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] };
const monthName = (m, style = 'long') => lg() === 'uz' ? (style === 'long' ? cap(UZ.m[m]) : UZ.ms[m]) : cap(new Intl.DateTimeFormat(lg(), { month: style, timeZone: 'UTC' }).format(Date.UTC(2021, m, 1)));
const weekday = i => lg() === 'uz' ? UZ.w[i] : cap(new Intl.DateTimeFormat(lg(), { weekday: 'short', timeZone: 'UTC' }).format(Date.UTC(2021, 0, 4 + i)).replace('.', '')); // 2021-01-04 — dushanba
const DATEV = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
function upgradeDate(inp) {
  if (inp.dataset.cs || inp.hasAttribute('data-native')) return;
  inp.dataset.cs = '1';
  const wrap = document.createElement('span'), btn = document.createElement('button'), id = 'cd' + ++uid;
  wrap.className = 'cs cd'; btn.type = 'button'; btn.className = 'cs-b'; btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `<span class="cs-v"></span>${SVG.cal}`;
  inp.parentNode.insertBefore(wrap, inp); wrap.append(btn, inp);
  inp.classList.add('cs-n'); inp.tabIndex = -1; inp.setAttribute('aria-hidden', 'true');
  const lab = inp.id ? document.querySelector(`label[for="${CSS.escape(inp.id)}"]`) : null;
  if (lab) { if (!lab.id) lab.id = id + 'l'; btn.setAttribute('aria-labelledby', lab.id); } else btn.setAttribute('aria-label', inp.getAttribute('aria-label') || tx('pick'));
  const fmt = v => { const p = parse(v); return p ? `${pad(p.d)}.${pad(p.m + 1)}.${p.y}` : ''; };
  const refresh = () => { const v = $('.cs-v', btn), t = fmt(DATEV.get.call(inp)); v.textContent = t || tx('ph'); v.classList.toggle('ph', !t); btn.disabled = inp.disabled; wrap.classList.toggle('dis', inp.disabled); };
  Object.defineProperty(inp, 'value', { configurable: true, get() { return DATEV.get.call(this); }, set(v) { DATEV.set.call(this, v); refresh(); } });
  new MutationObserver(refresh).observe(inp, { attributes: true, attributeFilter: ['disabled', 'value'] });
  inp.addEventListener('focus', () => btn.focus());
  const set = v => { const ch = DATEV.get.call(inp) !== v; DATEV.set.call(inp, v); refresh(); if (ch) fire(inp, 'input', 'change'); };
  btn.addEventListener('click', () => (cur && cur.anchor === btn ? closePop() : openCal()));
  btn.addEventListener('keydown', e => { if (['ArrowDown', 'Enter', ' '].includes(e.key) && !(cur && cur.anchor === btn)) { e.preventDefault(); openCal(); } else if (e.key === 'Delete' || e.key === 'Backspace') { if (!inp.required) set(''); } });
  function openCal() {
    const min = parse(inp.min), max = parse(inp.max), key = p => p.y * 10000 + p.m * 100 + p.d, sel0 = parse(DATEV.get.call(inp)), td = parse(todayISO());
    const lo = min ? key(min) : -Infinity, hi = max ? key(max) : Infinity, okd = (y, m, d) => { const k = y * 10000 + m * 100 + d; return k >= lo && k <= hi; };
    let base = sel0 || td; if (!sel0) { if (hi < key(td)) base = max; else if (lo > key(td)) base = min; }
    let vy = base.y, vm = base.m, mode = 'd', focusD = sel0 ? sel0.d : (base.y === td.y && base.m === td.m ? td.d : 1), yPage = 0;
    const box = document.createElement('div'); box.className = 'cal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', tx('pick'));
    const draw = () => {
      let body = '', title = '', navL = '', navR = '';
      if (mode === 'd') {
        title = `${monthName(vm)} ${vy}`; navL = tx('prev'); navR = tx('next');
        const wd = Array.from({ length: 7 }, (_, i) => weekday(i));
        const first = (new Date(Date.UTC(vy, vm, 1)).getUTCDay() + 6) % 7, dim = new Date(Date.UTC(vy, vm + 1, 0)).getUTCDate(), prevDim = new Date(Date.UTC(vy, vm, 0)).getUTCDate();
        body = `<div class="cal-w">${wd.map(w => `<span>${esc(w)}</span>`).join('')}</div><div class="cal-g" role="grid">`;
        for (let i = 0; i < 42; i++) {
          let y = vy, m = vm, d = i - first + 1, out = false;
          if (d < 1) { m--; if (m < 0) { m = 11; y--; } d += prevDim; out = true; } else if (d > dim) { d -= dim; m++; if (m > 11) { m = 0; y++; } out = true; }
          const on = okd(y, m, d), isSel = sel0 && sel0.y === y && sel0.m === m && sel0.d === d, isT = td.y === y && td.m === m && td.d === d;
          body += `<button type="button" class="cal-d${out ? ' o' : ''}${isSel ? ' sel' : ''}${isT ? ' t' : ''}" data-v="${iso(y, m, d)}" tabindex="${!out && d === focusD ? 0 : -1}"${on ? '' : ' disabled'}${isSel ? ' aria-pressed="true"' : ''}>${d}</button>`;
        }
        body += '</div>';
      } else if (mode === 'm') {
        title = String(vy); navL = tx('prev'); navR = tx('next');
        body = `<div class="cal-m">${Array.from({ length: 12 }, (_, m) => { const any = [...Array(31)].some((_, d) => d < new Date(Date.UTC(vy, m + 1, 0)).getUTCDate() && okd(vy, m, d + 1)); return `<button type="button" class="cal-c${sel0 && sel0.y === vy && sel0.m === m ? ' sel' : ''}${td.y === vy && td.m === m ? ' t' : ''}" data-m="${m}"${any ? '' : ' disabled'}>${esc(monthName(m, 'short').replace('.', ''))}</button>`; }).join('')}</div>`;
      } else {
        const y0 = vy - (vy % 12) + yPage * 12; title = `${y0} – ${y0 + 11}`; navL = tx('prev'); navR = tx('next');
        body = `<div class="cal-m">${Array.from({ length: 12 }, (_, i) => { const y = y0 + i, any = y * 10000 + 1231 >= lo && y * 10000 + 100 <= hi; return `<button type="button" class="cal-c${sel0 && sel0.y === y ? ' sel' : ''}${td.y === y ? ' t' : ''}" data-y="${y}"${any ? '' : ' disabled'}>${y}</button>`; }).join('')}</div>`;
      }
      box.innerHTML = `<div class="cal-h"><button type="button" class="cal-n" data-n="-1" aria-label="${esc(navL)}">${SVG.l}</button><button type="button" class="cal-t" data-t aria-label="${esc(mode === 'd' ? tx('mo') : tx('yr'))}">${esc(title)}${mode === 'y' ? '' : SVG.chev}</button><button type="button" class="cal-n" data-n="1" aria-label="${esc(navR)}">${SVG.r}</button></div>${body}<div class="cal-f"><button type="button" class="cal-a" data-clr${inp.required ? ' hidden' : ''}>${esc(tx('clear'))}</button><button type="button" class="cal-a" data-today${okd(td.y, td.m, td.d) ? '' : ' disabled'}>${esc(tx('today'))}</button></div>`;
    };
    const focusDay = () => { const b = box.querySelector('.cal-d[tabindex="0"]') || box.querySelector('.cal-d:not([disabled]):not(.o)'); if (b) b.focus({ preventScroll: true }); };
    box.addEventListener('mousedown', e => { if (!e.target.closest('input')) e.preventDefault(); });
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.v) { set(b.dataset.v); closePop(); btn.focus(); return; }
      if (b.hasAttribute('data-clr')) { set(''); closePop(); btn.focus(); return; }
      if (b.hasAttribute('data-today')) { set(todayISO()); closePop(); btn.focus(); return; }
      if (b.dataset.n) { const n = +b.dataset.n; if (mode === 'd') { vm += n; if (vm < 0) { vm = 11; vy--; } if (vm > 11) { vm = 0; vy++; } } else if (mode === 'm') vy += n; else yPage += n; draw(); place(); return; }
      if (b.hasAttribute('data-t')) { if (mode === 'd') mode = 'm'; else if (mode === 'm') { mode = 'y'; yPage = 0; } else mode = 'd'; draw(); place(); const f = box.querySelector('.cal-c.sel,.cal-c.t,.cal-c:not([disabled])'); if (f && mode !== 'd') f.focus({ preventScroll: true }); return; }
      if (b.dataset.m) { vm = +b.dataset.m; mode = 'd'; focusD = 1; draw(); place(); focusDay(); return; }
      if (b.dataset.y) { vy = +b.dataset.y; mode = 'm'; yPage = 0; draw(); place(); }
    });
    box.addEventListener('keydown', e => {
      const b = e.target.closest('.cal-d'); if (!b || mode !== 'd') return;
      const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (mv || e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault(); const p = parse(b.dataset.v), dt = new Date(Date.UTC(p.y, p.m, p.d));
        if (mv) dt.setUTCDate(dt.getUTCDate() + mv); else dt.setUTCMonth(dt.getUTCMonth() + (e.key === 'PageUp' ? -1 : 1));
        vy = dt.getUTCFullYear(); vm = dt.getUTCMonth(); focusD = dt.getUTCDate(); draw(); place(); focusDay();
      }
    });
    draw(); openPop(btn, box, { maxH: 460, minW: 288, maxW: 330 });
    place(); focusDay();
  }
  refresh();
}

/* ---------- <input type=number>: ixcham + / − ---------- */
function upgradeNumber(inp) {
  if (inp.dataset.cs || inp.hasAttribute('data-native')) return;
  inp.dataset.cs = '1';
  const wrap = document.createElement('span'); wrap.className = 'cn'; if (inp.style.cssText) { wrap.style.cssText = inp.style.cssText; inp.style.cssText = ''; }
  inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
  wrap.insertAdjacentHTML('beforeend', `<span class="cn-s"><button type="button" tabindex="-1" aria-label="+" data-s="1">${SVG.up}</button><button type="button" tabindex="-1" aria-label="−" data-s="-1">${SVG.dn}</button></span>`);
  wrap.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  wrap.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || inp.disabled || inp.readOnly) return;
    const before = inp.value; try { b.dataset.s === '1' ? inp.stepUp() : inp.stepDown(); } catch (er) {}
    if (inp.value !== before) fire(inp, 'input', 'change');
  });
}

/* ---------- <input type=range>: toʻldirilgan qism ---------- */
function upgradeRange(inp) {
  if (inp.dataset.cs) return; inp.dataset.cs = '1';
  const paint = () => { const mn = +inp.min || 0, mx = inp.max === '' ? 100 : +inp.max, v = +inp.value; inp.style.setProperty('--rp', (mx > mn ? Math.max(0, Math.min(100, ((v - mn) / (mx - mn)) * 100)) : 0) + '%'); };
  inp.addEventListener('input', paint); inp.addEventListener('change', paint); paint();
}

/* ---------- <input list=…>: oʻz takliflar roʻyxati ---------- */
function upgradeCombo(inp) {
  if (inp.dataset.cb) return;
  const dl = document.getElementById(inp.getAttribute('list')); if (!dl) return;
  inp.dataset.cb = '1'; inp.dataset.list = inp.getAttribute('list'); inp.removeAttribute('list'); inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-autocomplete', 'list'); inp.setAttribute('aria-expanded', 'false');
  const opts = () => { const d = document.getElementById(inp.dataset.list); return d ? Array.from(d.options).map(o => ({ v: o.value || o.textContent.trim(), l: o.label && o.label !== o.value ? o.label : '' })) : []; };
  let act = -1, list = null;
  const show = () => {
    const q = inp.value.trim().toLowerCase(), all = opts().filter(o => !q || o.v.toLowerCase().includes(q) || o.l.toLowerCase().includes(q)).filter(o => o.v !== inp.value).slice(0, 8);
    if (!all.length) return closePop();
    list = document.createElement('ul'); list.className = 'cs-l'; list.setAttribute('role', 'listbox');
    list.innerHTML = all.map((o, i) => `<li role="option" data-v="${esc(o.v)}" id="cb${uid}o${i}">${esc(o.v)}${o.l ? `<small>${esc(o.l)}</small>` : ''}</li>`).join(''); act = -1;
    list.addEventListener('mousedown', e => e.preventDefault());
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pick(li.dataset.v); });
    openPop(inp, list, { maxH: 260 });
  };
  const pick = v => { inp.value = v; fire(inp, 'input', 'change'); closePop(); };
  const mark = i => { const its = Array.from(list.children); act = i; its.forEach((li, k) => li.classList.toggle('act', k === i)); if (its[i]) its[i].scrollIntoView({ block: 'nearest' }); };
  inp.addEventListener('focus', show); inp.addEventListener('click', () => { if (!(cur && cur.anchor === inp)) show(); }); inp.addEventListener('input', show);
  inp.addEventListener('keydown', e => {
    const open = cur && cur.anchor === inp; if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); mark(Math.min(list.children.length - 1, act + 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(0, act - 1)); }
    else if (e.key === 'Enter' && act >= 0) { e.preventDefault(); pick(list.children[act].dataset.v); } else if (e.key === 'Tab') closePop();
  });
}

/* ---------- [title]: oʻz izohimiz ---------- */
let tip = null, tipT = 0, tipFor = null, trTip = s => s;
/** Izohlarni tarjima qilish uchun (ilova i18n’ni ulaydi; admin oʻzbekcha) */
export const setTipTranslator = fn => { trTip = fn; };
function hideTip() { clearTimeout(tipT); tipFor = null; if (tip) { tip.remove(); tip = null; } }
function showTip(el) {
  const text = el.getAttribute('data-tip'); if (!text) return;
  hideTip(); tipFor = el;
  tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); tip.textContent = trTip(text); document.body.appendChild(tip);
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, up = r.bottom + h + 14 > innerHeight;
  tip.style.left = Math.round(Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8))) + 'px';
  tip.style.top = Math.round(up ? r.top - h - 8 : r.bottom + 8) + 'px';
}
function takeTitle(el) {
  const t = el.getAttribute('title'); if (t == null) return;
  el.removeAttribute('title');
  if (!t.trim()) return;
  el.setAttribute('data-tip', t);
  if (!el.getAttribute('aria-label') && !el.textContent.trim() && !el.getAttribute('aria-labelledby')) el.setAttribute('aria-label', t); // belgisiz tugmaning nomi yoʻqolmasin
}
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('[title],[data-tip]'); if (!el || el === tipFor) return;
  if (el.hasAttribute('title')) takeTitle(el);
  if (!el.getAttribute('data-tip')) return;
  clearTimeout(tipT); tipT = setTimeout(() => showTip(el), 420);
}, true);
document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('[title],[data-tip]'); if (el) { if (el.hasAttribute('title')) takeTitle(el); if (el.matches(':focus-visible') && el.getAttribute('data-tip')) showTip(el); } }, true);
for (const ev of ['mouseout', 'mousedown', 'keydown', 'scroll', 'focusout']) document.addEventListener(ev, e => { if (ev === 'mouseout' && e.relatedTarget && tipFor && tipFor.contains(e.relatedTarget)) return; hideTip(); }, true);

/* ---------- ulash ---------- */
export function enhance(root = document) {
  const q = (sel, fn) => { if (root.matches && root.matches(sel)) fn(root); root.querySelectorAll && root.querySelectorAll(sel).forEach(fn); };
  q('select', upgradeSelect); q('input[type=date]', upgradeDate); q('input[type=number]', upgradeNumber); q('input[list]', upgradeCombo); q('input[type=range]', upgradeRange);
  q('[title]', takeTitle);
}
let started = false;
export function initControls() {
  if (started) return; started = true;
  const go = () => {
    enhance(document.body);
    new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n.classList.contains('pop') && !n.classList.contains('tip')) enhance(n); }); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
}
initControls();

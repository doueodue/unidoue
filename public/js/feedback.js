/* Fikr-mulohaza: sarlavhadagi tugma → ixcham oyna (Xato / Taklif / Savol). Server: POST /api/feedback, administratorda “Fikrlar” sahifasi. */
import { $, $$, S, api, esc, svg } from './core.js';
import { t, lang } from './i18n.js';

const TYPES = [
  { id: 'bug', ic: 'bug', l: 'Xato', ph: 'Nima bo‘ldi? Qaysi sahifada, nimani bosdingiz va nima kutgan edingiz?' },
  { id: 'idea', ic: 'bulb', l: 'Taklif', ph: 'Qanday imkoniyat yoki o‘zgarish sizga foydali bo‘lardi?' },
  { id: 'ask', ic: 'help', l: 'Savol', ph: 'Savolingizni yozing.' }
];
const MAX = 1500, MIN = 10, MAXIMG = 2;
let open = false, panel = null, bg = null, draft = { type: 'bug', text: '', imgs: [] }, prevFocus = null, busy = 0;

export function fbHTML() {
  const l = t('Fikr yoki xato haqida xabar berish');
  return `<button class="bell fbb" id="fb-b" type="button" aria-label="${l}" title="${l}" aria-haspopup="dialog" aria-expanded="false">${svg('chat')}</button>`;
}

function place() {
  const b = $('#fb-b'); if (!b || !panel) return;
  if (innerWidth <= 560) { panel.style.left = panel.style.top = panel.style.width = ''; return; } // telefonda — pastdan chiqadigan varaq (CSS)
  const r = b.getBoundingClientRect(), w = Math.min(390, innerWidth - 16);
  panel.style.width = w + 'px';
  panel.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
  panel.style.top = Math.round(r.bottom + 10) + 'px';
}

export function close() {
  if (!open) return; open = false;
  const b = $('#fb-b'); if (b) b.setAttribute('aria-expanded', 'false');
  const p = panel, g = bg; panel = bg = null;
  if (p) { p.classList.add('out'); setTimeout(() => p.remove(), 170); }
  if (g) { g.classList.add('out'); setTimeout(() => g.remove(), 170); }
  document.removeEventListener('keydown', onKey, true); removeEventListener('resize', place); removeEventListener('hashchange', close);
  try { (prevFocus || b) && (prevFocus || b).focus && (prevFocus || b).focus({ preventScroll: true }); } catch (e) {}
}
const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };

function form() {
  const u = S.user || {}, ty = TYPES.find(x => x.id === draft.type) || TYPES[0];
  return `<div class="fbp-h"><span class="fbp-ic" aria-hidden="true">${svg('chat')}</span><div><h3>${t('Fikringiz muhim')}</h3><p>${t('Xato, taklif yoki savol — bir necha soniyada yozing.')}</p></div><button class="fbp-x" type="button" data-x aria-label="${t('Yopish')}">${svg('x')}</button></div>
  <form class="fbp-f" novalidate>
    <div class="fbp-t" role="radiogroup" aria-label="${t('Xabar turi')}">${TYPES.map(x => `<label class="fbp-o${x.id === ty.id ? ' on' : ''}" data-t="${x.id}"><input type="radio" name="fbt" value="${x.id}"${x.id === ty.id ? ' checked' : ''}><span class="fbp-oi">${svg(x.ic)}</span><b>${t(x.l)}</b></label>`).join('')}</div>
    <div class="fbp-ta"><textarea id="fb-t" maxlength="${MAX}" rows="5" placeholder="${esc(t(ty.ph))}" aria-label="${t('Xabar matni')}"></textarea><span class="fbp-c" id="fb-c" aria-hidden="true">0 / ${MAX}</span></div>
    <div class="fbp-im"><button class="fbp-add" type="button" id="fb-add">${svg('image')}<span>${t('Rasm qo‘shish')}</span></button><div class="fbp-th" id="fb-th" aria-live="polite"></div><small class="fbp-hint" id="fb-h"></small><input type="file" id="fb-file" accept="image/jpeg,image/png,image/webp" multiple hidden></div>
    <div class="msg" id="fb-m" role="alert"></div>
    <div class="fbp-b"><small>${t('Sahifa va qurilma ma’lumoti avtomatik qo‘shiladi.')}${u.email ? ` ${t('Javob uchun email:')} <b>${esc(u.email)}</b>` : ''}</small><button class="btn primary" type="submit" id="fb-s">${svg('send')}<span>${t('Yuborish')}</span></button></div>
  </form>`;
}

function success() {
  panel.innerHTML = `<div class="fbp-ok"><span class="fbp-ring"></span><svg class="fbp-ck" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15 27l8 8 14-16"/></svg>
    <h3>${t('Rahmat!')}</h3><p>${t('Xabaringiz yetib bordi. Har birini o‘qib chiqamiz.')}</p>
    <div class="fbp-ob"><button class="btn primary" type="button" data-x>${t('Yopish')}</button><button class="link-btn" type="button" data-again>${t('Yana yozish')}</button></div></div>`;
  $('[data-x]', panel).onclick = close; $('[data-again]', panel).onclick = () => { render(); };
  $('[data-x]', panel).focus({ preventScroll: true });
}

function render() {
  panel.innerHTML = form() + `<div class="fbp-dz" aria-hidden="true">${svg('image')}<b>${t('Rasmni shu yerga tashlang')}</b></div>`;
  const ta = $('#fb-t', panel), cnt = $('#fb-c', panel), msg = $('#fb-m', panel), btn = $('#fb-s', panel);
  ta.value = draft.text; const upd = () => { draft.text = ta.value; cnt.textContent = ta.value.length + ' / ' + MAX; cnt.classList.toggle('hot', ta.value.length > MAX - 100); if (msg.textContent) { msg.className = 'msg'; msg.textContent = ''; } };
  upd(); ta.oninput = upd;
  $$('.fbp-o', panel).forEach(o => (o.querySelector('input').onchange = () => {
    draft.type = o.dataset.t; $$('.fbp-o', panel).forEach(x => x.classList.toggle('on', x === o));
    const ty = TYPES.find(x => x.id === draft.type); ta.placeholder = t(ty.ph); ta.focus({ preventScroll: true });
  }));
  $('[data-x]', panel).onclick = close;
  const send = async ev => {
    if (ev) ev.preventDefault();
    const text = ta.value.trim();
    msg.className = 'msg err';
    if (text.length < MIN) { msg.textContent = t('Kamida 10 ta belgi yozing.'); ta.focus(); return; }
    if (busy) { msg.textContent = t('Rasm tayyorlanmoqda, bir soniya kuting.'); return; }
    btn.disabled = true; $('span', btn).textContent = t('Yuborilmoqda…'); msg.textContent = ''; msg.className = 'msg';
    try {
      await api('/api/feedback', 'POST', { type: draft.type, text, imgs: draft.imgs, page: location.hash || '/', vp: innerWidth + 'x' + innerHeight, theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', lang: lang() });
      draft = { type: draft.type, text: '', imgs: [] }; if (panel) { success(); place(); }
    } catch (e) { if (!panel) return; msg.className = 'msg err'; msg.textContent = e.message; btn.disabled = false; $('span', btn).textContent = t('Yuborish'); }
  };
  const th = $('#fb-th', panel), hint = $('#fb-h', panel), add = $('#fb-add', panel), file = $('#fb-file', panel), say = (m, ok) => { msg.className = 'msg' + (m ? ' err' : ''); msg.textContent = m || ''; };
  const paintImgs = () => {
    th.innerHTML = draft.imgs.map((u, i) => `<span class="fbp-i"><img src="${u}" alt="${esc(t('Ilova qilingan rasm'))} ${i + 1}"><button type="button" data-rm="${i}" aria-label="${esc(t('Rasmni olib tashlash'))}">${svg('x')}</button></span>`).join('') + (busy ? '<span class="fbp-i ld" aria-hidden="true"><i></i></span>' : '');
    add.disabled = draft.imgs.length + busy >= MAXIMG; add.classList.toggle('has', draft.imgs.length > 0);
    hint.textContent = draft.imgs.length + busy ? `${draft.imgs.length + busy} / ${MAXIMG}` : t(matchMedia('(pointer:coarse)').matches ? '2 tagacha' : 'yoki rasmni shu yerga tashlang, Ctrl+V bosing');
    $$('[data-rm]', th).forEach(b => (b.onclick = () => { draft.imgs.splice(+b.dataset.rm, 1); say(''); paintImgs(); add.focus(); }));
  };
  const addFiles = async files => {
    files = [...files].filter(f => /^image\//.test(f.type));
    if (!files.length) { say(t('Faqat rasm (JPEG, PNG yoki WebP) yuklash mumkin.')); return; }
    say(''); const room = MAXIMG - draft.imgs.length - busy;
    if (room <= 0) { say(t('Eng ko‘pi bilan 2 ta rasm.')); return; }
    if (files.length > room) say(t('Eng ko‘pi bilan 2 ta rasm.'));
    const { compressShot } = await import('./pfstore.js');
    for (const f of files.slice(0, room)) {
      busy++; paintImgs();
      try { const u = await compressShot(f); if (panel) draft.imgs.push(u); } catch (e) { if (panel) say(t(e.message || 'Rasmni o‘qib bo‘lmadi.')); }
      busy--; if (panel) paintImgs();
    }
  };
  add.onclick = () => file.click(); file.onchange = () => { const fs = [...file.files]; file.value = ''; addFiles(fs); };
  panel.onpaste = e => { const fs = [...((e.clipboardData && e.clipboardData.files) || [])].filter(f => /^image\//.test(f.type)); if (fs.length) { e.preventDefault(); addFiles(fs); } };
  let dc = 0; const hasF = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  panel.ondragenter = e => { if (!hasF(e)) return; e.preventDefault(); dc++; panel.classList.add('drag'); };
  panel.ondragover = e => { if (hasF(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } };
  panel.ondragleave = () => { if (--dc <= 0) { dc = 0; panel.classList.remove('drag'); } };
  panel.ondrop = e => { if (!hasF(e)) return; e.preventDefault(); dc = 0; panel.classList.remove('drag'); addFiles(e.dataTransfer.files); };
  paintImgs();
  $('.fbp-f', panel).onsubmit = send;
  ta.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send(); };
  ta.focus({ preventScroll: true });
}

/** Oynani ochadi (sarlavhadagi tugma yoki yon paneldagi havola). */
export function openFeedback() {
  if (open) { const ta = panel && $('#fb-t', panel); if (ta) ta.focus(); return; }
  const b = $('#fb-b'); if (!b || !S.user) return;
  open = true; prevFocus = document.activeElement; b.setAttribute('aria-expanded', 'true');
  bg = document.createElement('div'); bg.className = 'fbp-bg'; bg.addEventListener('pointerdown', close); document.body.appendChild(bg);
  panel = document.createElement('div'); panel.className = 'fbp'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', t('Fikringiz muhim')); panel.tabIndex = -1;
  document.body.appendChild(panel); render(); place();
  document.addEventListener('keydown', onKey, true); addEventListener('resize', place); addEventListener('hashchange', close);
}

export function bindFeedback() {
  const b = $('#fb-b'); if (!b) return;
  close(); b.onclick = () => (open ? close() : openFeedback());
  const s = $('#fb-s-link'); if (s) s.onclick = () => { document.body.classList.remove('nav-open'); setTimeout(openFeedback, 60); };
}

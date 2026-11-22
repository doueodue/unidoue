/* Bildirishnomalar paneli: sarlavhadagi qoʻngʻiroqcha + ixcham roʻyxat. Server: /api/notes, /api/notes/read, /api/notes/mail */
import { $, S, api, esc, svg, toast, refreshCredits } from './core.js';
import { t, lang } from './i18n.js';

let open = false, panel = null;
const RTF = {}, UZM = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
/** “5 daqiqa oldin” — joriy tilda; brauzerda oʻzbekcha vaqt nomlari yoʻq, shuning uchun uz ni oʻzimiz yozamiz */
function ago(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000)), L = lang(), d = new Date(ts);
  if (L === 'uz') return s < 60 ? 'hozir' : s < 3600 ? `${Math.floor(s / 60)} daqiqa oldin` : s < 86400 ? `${Math.floor(s / 3600)} soat oldin` : s <= 7 * 86400 ? `${Math.floor(s / 86400)} kun oldin` : `${d.getDate()}-${UZM[d.getMonth()]}`;
  if (s > 7 * 86400) return new Intl.DateTimeFormat(L, { day: 'numeric', month: 'short' }).format(ts);
  const f = RTF[L] || (RTF[L] = new Intl.RelativeTimeFormat(L, { numeric: 'auto', style: 'short' }));
  if (s < 60) return f.format(0, 'second');
  if (s < 3600) return f.format(-Math.floor(s / 60), 'minute');
  if (s < 86400) return f.format(-Math.floor(s / 3600), 'hour');
  return f.format(-Math.floor(s / 86400), 'day');
}

export function bellHTML() {
  const l = t('Bildirishnomalar');
  return `<button class="bell" id="nb" type="button" aria-label="${l}" title="${l}" aria-haspopup="dialog" aria-expanded="false">${svg('bell')}<i class="bell-n" id="nb-n" hidden></i></button>`;
}
export function paintBell() {
  const b = $('#nb-n'); if (!b) return;
  const n = (S.account && S.account.notes) || 0;
  b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n);
  const btn = $('#nb'); if (btn) btn.classList.toggle('has', !!n);
}

function itemHTML(n) {
  const link = n.url && n.url !== '/app';
  const inner = `<span class="nt-d" aria-hidden="true"></span><span class="nt-b"><b>${esc(n.title)}</b><span>${esc(n.body)}</span><small>${esc(ago(n.t))}</small></span>`;
  return link ? `<li><a class="nt${n.new ? ' new' : ''}" href="${esc(n.url)}" data-nu>${inner}</a></li>` : `<li><div class="nt${n.new ? ' new' : ''}">${inner}</div></li>`;
}
function render(d) {
  const a = S.account || {}, dev = a.push && a.push.devices;
  panel.innerHTML = `<div class="np-h"><h3>${t('Bildirishnomalar')}</h3>${d.unread ? `<span class="np-c">${d.unread} ${t('yangi')}</span>` : ''}</div>
  ${d.notes.length ? `<ul class="np-l">${d.notes.map(itemHTML).join('')}</ul>` : `<div class="np-e">${svg('inbox')}<b>${t('Hozircha xabar yo‘q.')}</b><span>${t('Yangiliklar, tarif va muddat eslatmalari shu yerda ko‘rinadi.')}</span></div>`}
  <div class="np-f"><label class="sw"><input type="checkbox" id="np-m"${d.mailNews ? ' checked' : ''}><span>${t('Yangiliklarni emailga ham yuborish')}</span></label>${dev ? '' : `<a class="np-a" href="#/profile">${t('Telefonda bildirishnoma yoqish')}</a>`}</div>`;
  $('#np-m', panel).onchange = async e => { const on = e.target.checked; try { const r = await api('/api/notes/mail', 'POST', { on }); S.account = r.account; } catch (er) { e.target.checked = !on; toast(er.message, 'err'); } };
  bindLinks();
}
function bindLinks() {
  panel.querySelectorAll('a[data-nu]').forEach(a => a.addEventListener('click', e => {
    const u = new URL(a.getAttribute('href'), location.origin);
    if (u.pathname === '/app' || u.pathname === '/app/') { e.preventDefault(); close(); if (u.hash) location.hash = u.hash; }
  }));
}
function place() {
  const b = $('#nb'); if (!b || !panel) return;
  const r = b.getBoundingClientRect(), w = Math.min(360, innerWidth - 16);
  panel.style.width = w + 'px';
  panel.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
  panel.style.top = Math.round(r.bottom + 10) + 'px';
}
export function close() {
  if (!open) return; open = false;
  const b = $('#nb'); if (b) b.setAttribute('aria-expanded', 'false');
  if (panel) { const p = panel; panel = null; p.classList.add('out'); setTimeout(() => p.remove(), 160); }
  document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', onKey, true); removeEventListener('resize', place); removeEventListener('hashchange', close);
}
const outside = e => { if (panel && !panel.contains(e.target) && !e.target.closest('#nb')) close(); };
const onKey = e => { if (e.key === 'Escape') { close(); const b = $('#nb'); if (b) b.focus(); } };
async function show() {
  open = true; const b = $('#nb'); b.setAttribute('aria-expanded', 'true');
  panel = document.createElement('div'); panel.className = 'np'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', t('Bildirishnomalar')); panel.tabIndex = -1;
  panel.innerHTML = `<div class="np-h"><h3>${t('Bildirishnomalar')}</h3></div><div class="np-e"><span class="sk" style="width:60%;height:12px"></span></div>`;
  document.body.appendChild(panel); place(); panel.focus({ preventScroll: true });
  document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', onKey, true); addEventListener('resize', place); addEventListener('hashchange', close);
  try {
    const d = await api('/api/notes'); if (!panel) return;
    render(d); place();
    if (d.unread) { S.account = { ...(S.account || {}), notes: 0 }; paintBell(); api('/api/notes/read', 'POST', {}).then(r => { if (r.account) { S.account = r.account; paintBell(); } }).catch(() => {}); }
  } catch (e) { if (panel) panel.innerHTML = `<div class="np-e"><b>${esc(e.message)}</b></div>`; }
}
let poll = 0;
export function bindBell() {
  const b = $('#nb'); if (!b) return;
  close(); if (!poll) poll = setInterval(() => { if (!document.hidden) refreshCredits(); }, 180000); // yangi xabar soni har 3 daqiqada yangilanadi
  b.onclick = () => (open ? close() : show());
  paintBell();
}
document.addEventListener('unidoue:notes', paintBell);
document.addEventListener('unidoue:account', paintBell);

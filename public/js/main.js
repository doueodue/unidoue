import { $, $$, S, api, adopt, wipeLocal, esc, svg, skeleton, errorBox, toast, push, refreshCredits, refreshAccount, hasFeature, NEED_PLAN, STAR } from './core.js';
import { t, trText, langSelect, bindLang } from './i18n.js';
import { themeSwitch } from './theme-ui.js';
import * as fx from './fx.js';
import * as pn from './push.js';
import { bellHTML, bindBell } from './notes.js';
import { seePlan } from './celebrate.js';
import { fbHTML, bindFeedback } from './feedback.js';
import { navIcon } from './navicons.js';
import { setTipTranslator } from './ui.js';
import { paintAvatar } from './avatar.js';
import { tierPill, liveGlass } from './tiers.js';
setTipTranslator(s => trText(s) || s); // izohlar (title) joriy tilga tarjima qilinadi

const ROUTES = [
  { id: 'dashboard', t: 'Bosh panel', i: 'home', sec: 'Asosiy', v: () => import('./views1.js').then(m => m.dashboard) },
  { id: 'finder', t: 'Universitet qidiruvi', i: 'search', v: () => import('./views2.js').then(m => m.finder) },
  { id: 'scholarships', t: 'Stipendiyalar', i: 'gift', v: () => import('./views2.js').then(m => m.scholarships) },
  { id: 'predictor', t: 'Mosligingizni tekshiring', i: 'chart', v: () => import('./views2.js').then(m => m.predictor) },
  { id: 'compare', t: 'Solishtirish', i: 'cmp', v: () => import('./views2.js').then(m => m.compare) },
  { id: 'tracker', t: 'Arizalarim', i: 'list', sec: 'Ish joyi', v: () => import('./views1.js').then(m => m.tracker) },
  { id: 'roadmap', t: 'Yo‘l xaritasi', i: 'list', v: () => import('./views1.js').then(m => m.roadmap) },
  { id: 'guide', t: 'Hujjatlar yo‘riqnomasi', i: 'list', v: () => import('./views5.js').then(m => m.guide) },
  { id: 'essay', t: 'Esse yordamchisi', i: 'pen', v: () => import('./views3.js').then(m => m.essay) },
  { id: 'mentor', t: 'AI mentor', i: 'bot', v: () => import('./views3.js').then(m => m.mentor) },
  { id: 'coach', t: 'Esse murabbiyi', i: 'pen', hide: 1, nav: 'mentor', need: 'coach', v: () => import('./coach.js').then(m => m.coach) },
  { id: 'portfolio', t: 'Portfolio', i: 'folder', tag: 'NEW', v: () => import('./portfolio.js').then(m => m.portfolio) },
  { id: 'pricing', t: 'Tariflar', i: 'card', sec: 'Hisob', v: () => import('./views1.js').then(m => m.pricing) },
  { id: 'profile', t: 'Profil', i: 'user', hide: 1, v: () => import('./views1.js').then(m => m.profile) }
];
const root = $('#root');
let token = 0;

/* ---------- Google orqali kirish ---------- */
const GE = {
  off: 'Google orqali kirish hozircha ulanmagan.', rate: 'Juda ko‘p urinish. Birozdan keyin qayta urinib ko‘ring.', denied: 'Google orqali kirish bekor qilindi.',
  state: 'Kirish seansi eskirgan. Qaytadan urinib ko‘ring.', token: 'Google bilan kirib bo‘lmadi. Qaytadan urinib ko‘ring.', net: 'Google serveriga ulanib bo‘lmadi. Birozdan keyin urinib ko‘ring.',
  unverified: 'Google hisobingizdagi email tasdiqlanmagan. Boshqa hisob bilan urinib ko‘ring.'
};
const G_LOGO = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
function googleBlock(reg) {
  const a = S.auth || {};
  const note = reg && a.email === false ? `<p class="msg err" style="margin:0 0 10px" role="note">${t('Hozircha email orqali hisob ochib bo‘lmaydi: tasdiqlash xati yuborish ulanmagan.')}${a.google ? ' ' + t('Google orqali kiring.') : ''}</p>` : '';
  if (!a.google) return note;
  return `${note}<div class="auth-or"><span>${t('yoki')}</span></div><a class="btn gbtn" id="gb" href="/api/auth/google/start">${G_LOGO}<span>${t(reg ? 'Google bilan ro‘yxatdan o‘tish' : 'Google bilan kirish')}</span></a>`;
}

/* ---------- autentifikatsiya ekrani ---------- */
function authScreen(mode = 'login') {
  const reg = mode === 'register', fg = mode === 'forgot';
  root.innerHTML = `<div class="auth"><aside class="auth-art"><div class="brand" style="padding:0"><i>${STAR}</i><span>UniDoue</span></div>
  <div><h2>${t('Xorijda o‘qishga yo‘l, <em>aniq reja</em> bilan.')}</h2><p>${t('Universitetlarni profilingizga solishtiring, muddatlarni kuzating va qabul rejangizni bir joyda yuriting.')}</p></div>
  <ul class="auth-route"><li>${t('Safety, Target va Reach bo‘yicha universitetlar')}</li><li>${t('Har bir universitet uchun tushuntirish')}</li><li>${t('Arizalar va muddatlar kuzatuvi')}</li></ul></aside>
  <main class="auth-form"><div class="auth-tools">${themeSwitch()}${langSelect('lang')}</div><form class="auth-box" id="af" novalidate>
  <div class="auth-brand"><i>${STAR}</i><span>UniDoue</span></div>
  <h1>${t(fg ? 'Parolni tiklash' : reg ? 'Hisob ochish' : 'Xush kelibsiz')}</h1>
  <p class="sub">${t(fg ? 'Emailingizni kiriting, tiklash havolasini yuboramiz.' : reg ? 'Bir daqiqada hisob oching, bepul boshlaysiz.' : 'Hisobingizga kiring.')}</p>
  ${reg ? `<div class="field"><label class="f" for="an">${t('Ismingiz')}</label><input id="an" type="text" maxlength="40" autocomplete="name"></div>` : ''}
  <div class="field"><label class="f" for="ae">Email</label><input id="ae" type="email" maxlength="254" autocomplete="email" inputmode="email" placeholder="ism@gmail.com"></div>
  ${fg ? '' : `<div class="field"><label class="f" for="ap">${t('Parol')}</label><input id="ap" type="password" maxlength="128" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${t('kamida 8 ta belgi')}"><label class="hint" style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="ash"> ${t('Parolni ko‘rsatish')}</label></div>`}
  <div class="msg" id="am" role="alert"></div>
  <button class="btn primary" id="as" type="submit" style="width:100%;margin-top:6px">${t(fg ? 'Havola yuborish' : reg ? 'Hisob ochish' : 'Kirish')}</button>
  ${fg ? '' : googleBlock(reg)}
  <p class="hint" style="margin-top:16px;text-align:center">${fg ? `<button type="button" class="link-btn" data-m="login">${t('← Kirishga qaytish')}</button>`
    : reg ? `${t('Hisobingiz bormi?')} <button type="button" class="link-btn" data-m="login">${t('Kirish')}</button>`
    : `<button type="button" class="link-btn" data-m="forgot">${t('Parolni unutdingizmi?')}</button><br>${t('Yangimisiz?')} <button type="button" class="link-btn" data-m="register">${t('Hisob ochish')}</button>`}</p>
  ${reg ? '<p class="hint" style="margin-top:10px;text-align:center">Hisob ochish bilan <a href="/privacy" target="_blank" rel="noopener">maxfiylik siyosati</a>ga rozilik bildirasiz.</p>' : ''}
  </form></main></div>`;
  $$('[data-m]').forEach(b => (b.onclick = () => authScreen(b.dataset.m)));
  bindLang('lang', () => authScreen(mode));
  const ge = new URLSearchParams(location.search).get('ge');
  if (ge) { history.replaceState(null, '', location.pathname + location.hash); const gm = $('#am'); if (gm) { gm.className = 'msg err'; gm.textContent = GE[ge] || GE.token; } }
  const ash = $('#ash'); if (ash) ash.onchange = () => ($('#ap').type = ash.checked ? 'text' : 'password');
  $('#af').onsubmit = async ev => {
    ev.preventDefault();
    const m = $('#am'), btn = $('#as'), em = $('#ae').value.trim().toLowerCase(), pw = $('#ap') ? $('#ap').value : '', nm = $('#an') ? $('#an').value.trim() : '';
    m.className = 'msg err';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { m.textContent = 'Emailni to‘g‘ri kiriting (masalan: ism@gmail.com).'; return; }
    if (reg && nm.length < 2) { m.textContent = 'Ismingizni kiriting (kamida 2 harf).'; return; }
    if (!fg && pw.length < 8) { m.textContent = 'Parol kamida 8 ta belgidan iborat bo‘lsin.'; return; }
    btn.disabled = true; const t0 = btn.textContent; btn.textContent = t('Kuting…'); m.textContent = '';
    try {
      if (fg) { await api('/api/password/forgot', 'POST', { email: em }); m.className = 'msg ok'; m.textContent = 'Agar bu email ro‘yxatda bo‘lsa, tiklash havolasi yuborildi. Pochtangizni va Spam papkasini tekshiring (xat 1–2 daqiqada keladi).'; }
      else { const me = await api(reg ? '/api/register' : '/api/login', 'POST', reg ? { email: em, password: pw, name: nm } : { email: em, password: pw }); if (me.user.verified === false) { verifyScreen(me); return; } adopt(me); start(); return; }
    } catch (e) { m.textContent = e.message; }
    btn.disabled = false; btn.textContent = t0;
  };
}

/* ---------- email tasdiqlash ekrani ---------- */
function verifyScreen(me) {
  S.user = me.user;
  root.innerHTML = `<main class="auth-form" style="min-height:100dvh"><form class="auth-box" id="vf" novalidate>
  <div class="auth-brand"><i>${STAR}</i><span>UniDoue</span></div>
  <h1>${t('Emailingizni tasdiqlang')}</h1><p class="sub">${t('6 xonali kodni')} <b>${esc(me.user.email)}</b> ${t('manziliga yubordik. Pochtangizni (Spam papkasini ham) tekshiring.')}</p>
  <div class="field"><label class="f" for="vc">${t('Tasdiqlash kodi')}</label><input id="vc" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></div>
  <div class="msg" id="vm" role="alert"></div>
  <button class="btn primary" id="vb" type="submit" style="width:100%;margin-top:6px">${t('Tasdiqlash')}</button>
  <p class="hint" style="margin-top:16px;text-align:center"><button type="button" class="link-btn" id="vr">${t('Kodni qayta yuborish')}</button> · <button type="button" class="link-btn" id="vo">${t('Chiqish')}</button></p>
  </form></main>`;
  const m = $('#vm');
  $('#vf').onsubmit = async ev => {
    ev.preventDefault(); m.className = 'msg err'; m.textContent = '';
    const code = $('#vc').value.replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) { m.textContent = 'Kod 6 ta raqamdan iborat.'; return; }
    const btn = $('#vb'); btn.disabled = true;
    try { const r = await api('/api/verify', 'POST', { code }); adopt(r); start(); return; } catch (e) { m.textContent = e.message; }
    btn.disabled = false;
  };
  $('#vr').onclick = async () => {
    m.className = 'msg err'; m.textContent = '';
    try { await api('/api/verify/resend', 'POST', {}); m.className = 'msg ok'; m.textContent = 'Yangi kod yuborildi.'; } catch (e) { m.textContent = e.message; }
  };
  $('#vo').onclick = async () => { try { await api('/api/logout', 'POST', {}); } catch (e) {} location.reload(); };
  $('#vc').focus();
}
document.addEventListener('unidoue:unverified', () => { if (S.user) verifyScreen({ user: S.user }); });

/* ---------- ilova qobig‘i ---------- */
function shell() {
  let sec = '';
  const nav = ROUTES.filter(r => !r.hide).map(r => { const h = r.sec && r.sec !== sec ? `<div class="nav-sec">${t(sec = r.sec)}</div>` : ''; return `${h}<a href="#/${r.id}" data-r="${r.id}">${navIcon(r.id, () => svg(r.i))}<span>${t(r.t)}</span>${r.need ? `<span class="tag${hasFeature(r.need) ? '' : ' lk'}" data-need="${r.need}">${hasFeature(r.need) ? r.tag || '' : NEED_PLAN[r.need]}</span>` : r.tag ? `<span class="tag">${r.tag}</span>` : ''}</a>`; }).join('');
  root.innerHTML = `<div class="shell"><aside class="side" id="side"><a class="brand" href="#/dashboard"><i>${STAR}</i><span>UniDoue</span></a><nav class="nav" aria-label="${t('Asosiy menyu')}">${nav}</nav>
  <div class="nav-links">
  <a class="nav-tg" href="https://t.me/unidoue" target="_blank" rel="noopener noreferrer" title="${t('Telegram kanal')}" aria-label="${t('Telegram kanal')}">${svg('tg')}<span>Telegram</span></a>
  <a class="nav-tg" href="https://t.me/unidoue_yordam" target="_blank" rel="noopener noreferrer" title="${t('Yordam')}">${svg('help')}<span>${t('Yordam')}</span></a>
  <button class="nav-tg" id="fb-s-link" type="button" title="${t('Fikr bildirish')}" aria-label="${t('Fikr bildirish')}">${svg('chat')}<span>${t('Fikr')}</span></button>
  </div>
  <div class="side-foot tg" id="sf" data-tier="free" data-live><a class="sf-row" id="sf-me" href="#/profile" title="${t('Profil')}" aria-label="${t('Profil')}"><span class="sf-av" id="sf-av" aria-hidden="true"></span><div class="sf-who"><b id="sf-u"></b><small id="sf-p"></small></div><span id="sf-t"></span></a><button class="btn sm" id="lo" type="button">${t('Chiqish')}</button></div></aside>
  <div class="scrim" id="scrim"></div>
  <div class="main"><header class="top"><button class="burger" id="bg" aria-label="Menyu" type="button">${svg('menu')}</button><h1 id="ttl"></h1><span class="top-tools">${themeSwitch()}${langSelect('lang')}</span>${bellHTML()}${fbHTML()}<span id="pb"></span></header>
  <main class="content" id="view" tabindex="-1"></main></div></div>`;
  bindLang('lang', () => { shell(); route(); });
  $('#bg').onclick = () => document.body.classList.toggle('nav-open');
  $('#scrim').onclick = () => document.body.classList.remove('nav-open');
  $('#lo').onclick = async () => { try { if (localStorage.getItem('qabul:sync')) await push(); await pn.forget(); await api('/api/logout', 'POST', {}); } catch (e) {} wipeLocal(); location.hash = ''; location.reload(); };
  liveGlass($('#sf')); updatePlanUI(); bindBell(); bindFeedback();
}
export function updatePlanUI() {
  if (!$('#sf-u') || !S.user) return;
  const a = S.account || {}; $('#sf-u').textContent = S.user.name || S.user.email; $('#sf-p').textContent = S.user.email; paintAvatar($('#sf-av'));
  ROUTES.filter(r => r.need).forEach(r => { const tg = $(`.nav .tag[data-need="${r.need}"]`); if (!tg) return; const ok = hasFeature(r.need); tg.textContent = ok ? r.tag || '' : NEED_PLAN[r.need]; tg.classList.toggle('lk', !ok); tg.hidden = ok && !r.tag; });
  const pl = ['plus', 'pro'].includes(a.plan) ? a.plan : 'free'; // tarif belgisi: Free muz, Plus kumush, Pro oltin
  $('#pb').innerHTML = tierPill(pl); $('#sf-t').innerHTML = tierPill(pl); $('#sf').dataset.tier = pl;
}
document.addEventListener('unidoue:avatar', () => updatePlanUI());
document.addEventListener('unidoue:account', updatePlanUI);

async function route() {
  if (!S.user) return;
  if (/^#\/?intl(\?|$)/.test(location.hash)) { location.replace('#/finder'); return; } // eski «Boshqa davlatlar» havolasi
  const id = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'dashboard', r = ROUTES.find(x => x.id === id) || ROUTES[0], my = ++token;
  $$('.nav a').forEach(a => (a.getAttribute('data-r') === (r.nav || r.id) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const me = $('#sf-me'); if (me) { if (r.id === 'profile') me.setAttribute('aria-current', 'page'); else me.removeAttribute('aria-current'); }
  $('#ttl').textContent = t(r.t); document.title = t(r.t) + ' · UniDoue'; document.body.classList.remove('nav-open');
  refreshCredits(); // har sahifaga oʻtganda kreditlarni serverdan yangilaymiz (boshqa qurilma/oyna, oy almashishi)
  const el = $('#view'); el.innerHTML = skeleton(3); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  fx.start();
  try {
    if (r.need) { await refreshAccount().catch(() => {}); document.dispatchEvent(new CustomEvent('unidoue:account')); } // tarif oʻzgargan boʻlsa (toʻlov, muddat tugashi) qulf holati aniq boʻlsin
    const fn = r.need && !hasFeature(r.need) ? (await import('./gate.js')).gate(r.need) : await r.v(); if (my !== token) return; el.innerHTML = ''; fx.watch(el); await fn(el);
  } catch (e) { if (my !== token) return; el.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', el); if (b) b.onclick = route; }
  if (my === token) { window.scrollTo(0, 0); fx.done(); }
}

function start() { shell(); addEventListener('hashchange', route); route(); if (S.user && S.account) seePlan(S.user.id, S.account.plan, S.account.planUntil); }
document.addEventListener('unidoue:account', () => { if (S.user && S.account) seePlan(S.user.id, S.account.plan, S.account.planUntil); });
document.addEventListener('unidoue:signedout', () => { toast('Sessiya tugadi. Qayta kiring.', 'err'); authScreen('login'); });

(async function boot() {
  try {
    const me = await api('/api/me');
    if (me.user && me.user.verified === false) verifyScreen(me); else if (me.user) { adopt(me); start(); } else { S.auth = me.auth || {}; authScreen(new URLSearchParams(location.search).get('m') === 'register' ? 'register' : 'login'); }
  } catch (e) {
    root.innerHTML = `<div style="min-height:100dvh;display:grid;place-items:center;padding:20px">${errorBox(e.message, true)}</div>`;
    const b = $('[data-retry]'); if (b) b.onclick = () => location.reload();
  }
})();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

import { $, $$, S, api, adopt, wipeLocal, esc, svg, skeleton, errorBox, toast, push } from './core.js';

const ROUTES = [
  { id: 'dashboard', t: 'Bosh panel', i: 'home', sec: 'Asosiy', v: () => import('./views1.js').then(m => m.dashboard) },
  { id: 'finder', t: 'Universitet qidiruvi', i: 'search', v: () => import('./views2.js').then(m => m.finder) },
  { id: 'intl', t: 'Boshqa davlatlar', i: 'search', v: () => import('./views4.js').then(m => m.intl) },
  { id: 'scholarships', t: 'Stipendiyalar', i: 'gift', tag: 'Plus', v: () => import('./views2.js').then(m => m.scholarships) },
  { id: 'predictor', t: 'Qabul bashorati', i: 'chart', v: () => import('./views2.js').then(m => m.predictor) },
  { id: 'compare', t: 'Solishtirish', i: 'cmp', v: () => import('./views2.js').then(m => m.compare) },
  { id: 'tracker', t: 'Arizalarim', i: 'list', sec: 'Ish joyi', v: () => import('./views1.js').then(m => m.tracker) },
  { id: 'roadmap', t: 'Yo‘l xaritasi', i: 'list', v: () => import('./views1.js').then(m => m.roadmap) },
  { id: 'essay', t: 'Esse yordamchisi', i: 'pen', v: () => import('./views3.js').then(m => m.essay) },
  { id: 'mentor', t: 'AI mentor', i: 'bot', v: () => import('./views3.js').then(m => m.mentor) },
  { id: 'pricing', t: 'Tariflar', i: 'card', sec: 'Hisob', v: () => import('./views1.js').then(m => m.pricing) },
  { id: 'profile', t: 'Profil', i: 'user', v: () => import('./views1.js').then(m => m.profile) }
];
const root = $('#root');
let token = 0;

/* ---------- autentifikatsiya ekrani ---------- */
function authScreen(mode = 'login') {
  const reg = mode === 'register', fg = mode === 'forgot';
  root.innerHTML = `<div class="auth"><aside class="auth-art"><div class="brand" style="padding:0"><i>U</i>UniDoue</div>
  <div><h2>Xorijda o‘qishga yo‘l, <em>aniq reja</em> bilan.</h2><p>Universitetlarni profilingizga solishtiring, muddatlarni kuzating va qabul rejangizni bir joyda yuriting.</p></div>
  <ul><li>Safety, Target va Reach bo‘yicha universitetlar</li><li>Har bir universitet uchun tushuntirish</li><li>Arizalar va muddatlar kuzatuvi</li></ul></aside>
  <main class="auth-form"><form class="auth-box" id="af" novalidate>
  <h1>${fg ? 'Parolni tiklash' : reg ? 'Hisob ochish' : 'Xush kelibsiz'}</h1>
  <p class="sub">${fg ? 'Emailingizni kiriting, tiklash havolasini yuboramiz.' : reg ? 'Bir daqiqada hisob oching, bepul boshlaysiz.' : 'Hisobingizga kiring.'}</p>
  ${reg ? '<div class="field"><label class="f" for="an">Ismingiz</label><input id="an" type="text" maxlength="40" autocomplete="name"></div>' : ''}
  <div class="field"><label class="f" for="ae">Email</label><input id="ae" type="email" maxlength="254" autocomplete="email" inputmode="email" placeholder="ism@gmail.com"></div>
  ${fg ? '' : `<div class="field"><label class="f" for="ap">Parol</label><input id="ap" type="password" maxlength="128" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="kamida 8 ta belgi"><label class="hint" style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="ash"> Parolni ko‘rsatish</label></div>`}
  <div class="msg" id="am" role="alert"></div>
  <button class="btn primary" id="as" type="submit" style="width:100%;margin-top:6px">${fg ? 'Havola yuborish' : reg ? 'Hisob ochish' : 'Kirish'}</button>
  <p class="hint" style="margin-top:16px;text-align:center">${fg ? '<button type="button" class="link-btn" data-m="login">← Kirishga qaytish</button>'
    : reg ? 'Hisobingiz bormi? <button type="button" class="link-btn" data-m="login">Kirish</button>'
    : '<button type="button" class="link-btn" data-m="forgot">Parolni unutdingizmi?</button><br>Yangimisiz? <button type="button" class="link-btn" data-m="register">Hisob ochish</button>'}</p>
  ${reg ? '<p class="hint" style="margin-top:10px;text-align:center">Hisob ochish bilan <a href="/privacy" target="_blank" rel="noopener">maxfiylik siyosati</a>ga rozilik bildirasiz.</p>' : ''}
  </form></main></div>`;
  $$('[data-m]').forEach(b => (b.onclick = () => authScreen(b.dataset.m)));
  const ash = $('#ash'); if (ash) ash.onchange = () => ($('#ap').type = ash.checked ? 'text' : 'password');
  $('#af').onsubmit = async ev => {
    ev.preventDefault();
    const m = $('#am'), btn = $('#as'), em = $('#ae').value.trim().toLowerCase(), pw = $('#ap') ? $('#ap').value : '', nm = $('#an') ? $('#an').value.trim() : '';
    m.className = 'msg err';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { m.textContent = 'Emailni to‘g‘ri kiriting (masalan: ism@gmail.com).'; return; }
    if (reg && nm.length < 2) { m.textContent = 'Ismingizni kiriting (kamida 2 harf).'; return; }
    if (!fg && pw.length < 8) { m.textContent = 'Parol kamida 8 ta belgidan iborat bo‘lsin.'; return; }
    btn.disabled = true; const t0 = btn.textContent; btn.textContent = 'Kuting…'; m.textContent = '';
    try {
      if (fg) { await api('/api/password/forgot', 'POST', { email: em }); m.className = 'msg ok'; m.textContent = 'Agar bu email ro‘yxatda bo‘lsa, tiklash havolasi yuborildi. Pochtangizni tekshiring.'; }
      else { const me = await api(reg ? '/api/register' : '/api/login', 'POST', reg ? { email: em, password: pw, name: nm } : { email: em, password: pw }); adopt(me); start(); return; }
    } catch (e) { m.textContent = e.message; }
    btn.disabled = false; btn.textContent = t0;
  };
}

/* ---------- ilova qobig‘i ---------- */
function shell() {
  let sec = '';
  const nav = ROUTES.map(r => { const h = r.sec && r.sec !== sec ? `<div class="nav-sec">${(sec = r.sec)}</div>` : ''; return `${h}<a href="#/${r.id}" data-r="${r.id}">${svg(r.i)}<span>${r.t}</span>${r.tag ? `<span class="tag">${r.tag}</span>` : ''}</a>`; }).join('');
  root.innerHTML = `<div class="shell"><aside class="side" id="side"><a class="brand" href="#/dashboard"><i>U</i>UniDoue</a><nav class="nav" aria-label="Asosiy menyu">${nav}</nav>
  <div class="side-foot"><b id="sf-u"></b><small id="sf-p"></small><button class="btn sm" id="lo" type="button">Chiqish</button></div></aside>
  <div class="scrim" id="scrim"></div>
  <div class="main"><header class="top"><button class="burger" id="bg" aria-label="Menyu" type="button">${svg('menu')}</button><h1 id="ttl"></h1><span class="badge" id="pb"></span></header>
  <main class="content" id="view" tabindex="-1"></main></div></div>`;
  $('#bg').onclick = () => document.body.classList.toggle('nav-open');
  $('#scrim').onclick = () => document.body.classList.remove('nav-open');
  $('#lo').onclick = async () => { try { if (localStorage.getItem('qabul:sync')) await push(); await api('/api/logout', 'POST', {}); } catch (e) {} wipeLocal(); location.hash = ''; location.reload(); };
  updatePlanUI();
}
export function updatePlanUI() {
  if (!$('#sf-u') || !S.user) return;
  const a = S.account || {}; $('#sf-u').textContent = S.user.name || S.user.email; $('#sf-p').textContent = S.user.email;
  const pb = $('#pb'); pb.textContent = ({ free: 'Free', plus: 'Plus', pro: 'Pro' })[a.plan] || 'Free'; pb.className = 'badge' + (a.plan === 'pro' ? ' ok' : '');
}
document.addEventListener('unidoue:account', updatePlanUI);

async function route() {
  if (!S.user) return;
  const id = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'dashboard', r = ROUTES.find(x => x.id === id) || ROUTES[0], my = ++token;
  $$('.nav a').forEach(a => (a.getAttribute('data-r') === r.id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  $('#ttl').textContent = r.t; document.title = r.t + ' · UniDoue'; document.body.classList.remove('nav-open');
  const el = $('#view'); el.innerHTML = skeleton(3); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  try { const fn = await r.v(); if (my !== token) return; el.innerHTML = ''; await fn(el); }
  catch (e) { if (my !== token) return; el.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', el); if (b) b.onclick = route; }
  if (my === token) { window.scrollTo(0, 0); }
}

function start() { shell(); addEventListener('hashchange', route); route(); }
document.addEventListener('unidoue:signedout', () => { toast('Sessiya tugadi. Qayta kiring.', 'err'); authScreen('login'); });

(async function boot() {
  try {
    const me = await api('/api/me');
    if (me.user) { adopt(me); start(); } else authScreen('login');
  } catch (e) {
    root.innerHTML = `<div style="min-height:100dvh;display:grid;place-items:center;padding:20px">${errorBox(e.message, true)}</div>`;
    const b = $('[data-retry]'); if (b) b.onclick = () => location.reload();
  }
})();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

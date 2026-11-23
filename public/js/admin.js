/* Admin panel. Qat'iy CSP: inline skript yo‘q, barcha hodisalar shu yerda ulanadi. */
import * as fx from '/js/fx.js';
import * as wp from '/js/webpush.js';
import '/js/ui.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
let TOKEN = '';
try { TOKEN = sessionStorage.getItem('unidoue:adm') || ''; } catch (e) {}
const EP_KEY = 'unidoue:adm-ep'; // shu brauzer admin qurilmasi sifatida yozilgan obuna manzili
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'], p2 = n => String(n).padStart(2, '0');
const when = v => { const d = new Date(v); return isNaN(d) ? '' : `${d.getDate()}-${MON[d.getMonth()]}, ${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
const dm = d => d ? d.slice(8) + '.' + d.slice(5, 7) : '—';
const dlong = d => d ? `${+d.slice(8)}-${MON[+d.slice(5, 7) - 1]}` : '';
const fmt = n => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const rel = ts => { const s = (Date.now() - new Date(ts).getTime()) / 1000; if (!(s >= 0)) return ''; if (s < 60) return 'hozirgina'; if (s < 3600) return Math.floor(s / 60) + ' daqiqa oldin'; if (s < 86400) return Math.floor(s / 3600) + ' soat oldin'; if (s < 86400 * 30) return Math.floor(s / 86400) + ' kun oldin'; return when(ts); };
const planName = p => ({ free: 'Free', plus: 'Plus', pro: 'Pro' }[p] || p);
const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatar = s => { const h = hue(s), c = String(s || '?').trim(); return `<span class="av" style="--a:hsl(${h} 68% 54%);--b:hsl(${(h + 42) % 360} 70% 44%)" aria-hidden="true">${esc((c[0] || '?').toUpperCase())}</span>`; };
const svg = (d, cls) => `<svg viewBox="0 0 24 24"${cls ? ` class="${cls}"` : ''} aria-hidden="true">${d}</svg>`;
const IC = {
  act: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', userp: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.2a6.5 6.5 0 0 1 3 5.8"/>',
  crown: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
  inbox: '<path d="M3.5 13.5 6 5.5h12l2.5 8M3.5 13.5V18a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 18v-4.5M3.5 13.5H8a1 1 0 0 1 1 1 3 3 0 0 0 6 0 1 1 0 0 1 1-1h4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9.5 9.5h5v5h-5zM9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.7 0-2.8.8-2.8 2s1 1.7 2.8 2 2.8.8 2.8 2-1.1 2-2.8 2c-1.3 0-2.3-.4-2.8-1.2M12 6v2M12 16v2"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 20a2 2 0 0 1-3.4 0"/>', phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  warn: '<path d="M12 9v4M12 17h.01M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/>',
  ticket: '<path d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4zM14 7.5V9M14 11.2v1.6M14 15v1.5"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A1.5 1.5 0 0 1 6.5 5H15"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', send: '<path d="m21 3-9.5 18-2.2-7.8L2 11 21 3ZM21 3 9.3 13.2"/>',
};

/* ---------- tarmoq ---------- */
async function call(method, url, body) {
  const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + TOKEN, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Xato (' + r.status + ')'); e.status = r.status; throw e; }
  return j;
}

/* ---------- toast va tasdiqlash oynasi ---------- */
function toast(msg, kind) {
  const box = $('#toasts'), t = document.createElement('div');
  t.className = 'toast' + (kind === 'err' ? ' err' : ''); t.textContent = msg; box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 4500);
}
function ask({ title, text, ok = 'Tasdiqlash', danger = false }) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal${danger ? ' dg' : ''}" role="dialog" aria-modal="true" aria-labelledby="mq-t"><h3 id="mq-t">${esc(title)}</h3><p>${esc(text)}</p><div class="acts"><button class="btn" type="button" data-x>Bekor</button><button class="btn ${danger ? 'danger' : 'primary'}" type="button" data-ok>${esc(ok)}</button></div></div>`;
    const prev = document.activeElement;
    const done = v => { document.removeEventListener('keydown', key); bg.classList.add('out'); setTimeout(() => bg.remove(), 220); if (prev && prev.focus) try { prev.focus(); } catch (e) {} res(v); };
    const key = e => { if (e.key === 'Escape') done(false); };
    bg.addEventListener('click', e => { if (e.target === bg) done(false); });
    $('[data-x]', bg).onclick = () => done(false); $('[data-ok]', bg).onclick = () => done(true);
    document.addEventListener('keydown', key); document.body.appendChild(bg); $('[data-ok]', bg).focus();
  });
}

/* ---------- holat ---------- */
let USERS = [], REQS = [], ORDERS = null, PROMOS = null, STATS = null, UF = 'all', ULIM = 100, loadedAt = 0;
const eff = u => (u.plan && u.plan !== 'free' && (!u.planUntil || u.planUntil > Date.now()) ? u.plan : 'free');

/* ---------- yo‘naltirish ---------- */
const VIEWS = { overview: 'Umumiy ko‘rinish', requests: 'So‘rovlar', users: 'Foydalanuvchilar', payments: 'To‘lovlar', push: 'Xabarlar', promos: 'Promo kodlar' };
function route() {
  const v = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
  $$('.view').forEach(s => { s.hidden = s.id !== 'v-' + v; });
  $$('#nav a').forEach(a => { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#ttl').textContent = VIEWS[v]; document.title = VIEWS[v] + ' · Admin — UniDoue';
  document.body.classList.remove('nav-open'); window.scrollTo(0, 0);
  const sec = $('#v-' + v); if (sec) fx.scan(sec);
  if (v === 'push') adminDevice();
}
addEventListener('hashchange', () => { if (!$('#shell').hidden) route(); });

/* ---------- Umumiy ---------- */
const kpi = (ic, n, label, tone, on) => `<div class="kpi ${tone || ''}${on ? ' on' : ''}"><i>${svg(IC[ic])}</i><div class="stat"><b>${n}</b><span>${label}</span></div></div>`;
function renderOverview(st) {
  const warn = [];
  if (st.pending) warn.push(`<div class="notice">${svg(IC.warn)}<div><b>${st.pending} ta tarif so‘rovi kutmoqda.</b> <a href="#requests">Ko‘rish →</a></div></div>`);
  if (st.proExpiring) warn.push(`<div class="notice">${svg(IC.clock)}<div><b>${st.proExpiring} ta pullik tarif 7 kun ichida tugaydi.</b> <a href="#users">Foydalanuvchilar →</a></div></div>`);
  const cfg = [!st.mail && 'Xat yuborish ulanmagan (tasdiqlash va parol tiklash ishlamaydi)', !st.ai && 'AI ulanmagan', st.mail && !st.verifyOn && 'Email tasdiqlash o‘chiq', !st.payCard && 'PAY_CARD sozlanmagan (karta raqami ko‘rinmaydi)'].filter(Boolean);
  if (cfg.length) warn.push(`<div class="notice info">${svg(IC.info)}<div><b>Sozlash kerak:</b><br>${cfg.map(esc).join('<br>')}</div></div>`);
  if (st.mail && st.mailLast && !st.mailLast.ok) warn.push(`<div class="notice">${svg(IC.warn)}<div><b>Oxirgi xat yuborilmadi (${esc({ reset: 'parol tiklash', verify: 'tasdiqlash kodi', test: 'sinov', mail: 'xabar' }[st.mailLast.kind] || 'xat')}).</b><br>${esc(st.mailLast.err)}${st.mailLast.hint ? `<br><b>Nima qilish kerak:</b> ${esc(st.mailLast.hint)}` : ''}</div></div>`);
  if (st.mailSandbox) warn.push(`<div class="notice">${svg(IC.warn)}<div><b>MAIL_FROM sinov manzilida (resend.dev).</b> Bu holatda Resend xatni faqat o‘z hisobingiz emailiga yuboradi, boshqa foydalanuvchilarga parol tiklash xati bormaydi. Domeningizni Resend’da tasdiqlang yoki Brevo’dan foydalaning.</div></div>`);
  if (st.mail) warn.push(`<div class="notice info">${svg(IC.mail)}<div><b>Email yuborish:</b> ${st.mailOk || 0} ta yuborilgan, ${st.mailFail || 0} ta xato (server ishga tushganidan beri).<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><input id="mt-to" type="email" placeholder="Sinov xati manzili" maxlength="254" style="flex:1;min-width:200px"><button class="btn sm" id="mt-go" type="button">Sinov xatini yuborish</button></div><small id="mt-r" style="display:block;margin-top:6px"></small></div></div>`);
  $('#alerts').innerHTML = warn.length ? `<div class="al">${warn.join('')}</div>` : '';
  const mg = $('#mt-go');
  if (mg) mg.onclick = async () => {
    const to = $('#mt-to').value.trim(), out = $('#mt-r'); if (!to) { out.textContent = 'Manzilni kiriting.'; return; }
    mg.disabled = true; out.textContent = 'Yuborilmoqda…';
    try { const j = await call('POST', '/api/admin/mail-test', { to }); out.textContent = j.ok ? `Yuborildi (${j.provider}, ${j.from}). Pochta va Spam papkasini tekshiring.` : `Xato: ${j.error}${j.hint ? ' — ' + j.hint : ''}`; }
    catch (e) { out.textContent = e.message; } finally { mg.disabled = false; }
  };
  const ps = st.push || { users: 0, devices: 0, admin: 0 };
  $('#kpis').innerHTML = [
    kpi('act', st.activeToday, 'bugun kirganlar'), kpi('userp', st.signupsToday, 'bugun yangi hisob'), kpi('users', st.active7, 'oxirgi 7 kunda faol'), kpi('users', st.total, 'jami foydalanuvchi', 'mut'),
    kpi('crown', st.pro, 'Pro faol', 'vio'), kpi('star', st.plus || 0, 'Plus faol'), kpi('inbox', st.pending, 'tarif so‘rovi kutmoqda', 'warn', st.pending), kpi('clock', st.proExpiring, 'tarif 7 kunda tugaydi', 'warn', st.proExpiring),
    kpi('mail', st.unverified, 'email tasdiqlanmagan', 'mut'), kpi('cpu', st.aiMonth, 'bu oy AI kredit'), kpi('cpu', Math.round((st.aiTokensMonth || 0) / 1000) + 'k', 'bu oy AI token', 'mut'), kpi('bell', ps.devices, 'push qurilmalar', 'ok'),
  ].join('');
  const free = Math.max(0, st.total - st.pro - (st.plus || 0)), tot = Math.max(1, st.total);
  $('#plans').innerHTML = `<div class="pl">${[['Free', free, 'var(--muted)'], ['Plus', st.plus || 0, 'var(--brand)'], ['Pro', st.pro, 'var(--vio)']].map(([n, v, c]) => `<div class="pl-r"><div><span>${n}</span><b>${v} <span class="mut">· ${Math.round(v / tot * 100)}%</span></b></div><div class="pl-bar"><span style="--c:${c};width:${v / tot * 100}%"></span></div></div>`).join('')}</div>`;
  const kvp = `<dl class="kv"><div><dt>Push yoqqan foydalanuvchi</dt><dd>${ps.users}</dd></div><div><dt>Foydalanuvchi qurilmalari</dt><dd>${ps.devices}</dd></div><div><dt>Admin qurilmalari</dt><dd>${ps.admin}</dd></div></dl>`;
  $('#pstat').innerHTML = kvp; $('#pstat2').innerHTML = kvp;
  $('#since').textContent = st.since ? 'Faollik hisobi ' + st.since + ' dan boshlab yuritiladi.' : 'Faollik hisobi endi boshlandi: bugundan keyin kirganlar sanaladi.';
  renderChart(st.rows);
  $('#tg-rq').hidden = !st.pending; $('#tg-rq').textContent = st.pending;
}

/* 14 kunlik grafik: ustunlar — yangi hisoblar, chiziq — faol foydalanuvchilar (bitta o‘q, bir xil birlik) */
function renderChart(rows) {
  const W = 680, H = 250, L = 34, R = 8, T = 12, B = 28, pw = W - L - R, ph = H - T - B, n = rows.length;
  const mx = Math.max(1, ...rows.map(r => Math.max(r.active, r.signups))), step = mx <= 4 ? 1 : Math.ceil(mx / 4), top = mx <= 4 ? Math.max(2, mx) : step * 4;
  const y = v => T + ph - v / top * ph, band = pw / n, cx = i => L + band * (i + .5), bw = Math.min(20, band * .5);
  const bar = (x, w, y0, y1) => { const h = y0 - y1; if (h <= 0) return ''; const r = Math.min(4, h, w / 2); return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`; };
  let g = '';
  for (let v = 0; v <= top; v += step) g += `<line class="${v ? 'ch-grid' : 'ch-base'}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ch-t" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const pts = rows.map((r, i) => `${cx(i).toFixed(1)},${y(r.active).toFixed(1)}`);
  const bars = rows.map((r, i) => `<path class="ch-bar" data-i="${i}" d="${bar(cx(i) - bw / 2, bw, y(0), y(r.signups))}"/>`).join('');
  const xl = rows.map((r, i) => (i % 2 === (n - 1) % 2 ? `<text class="ch-t" x="${cx(i)}" y="${H - 8}" text-anchor="middle">${dm(r.d)}</text>` : '')).join('');
  const last = rows[n - 1];
  $('#chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Oxirgi 14 kundagi faol foydalanuvchilar va yangi hisoblar">${g}${xl}${bars}
    <polygon class="ch-area" points="${L + band / 2},${y(0)} ${pts.join(' ')} ${cx(n - 1)},${y(0)}"/><polyline class="ch-line" points="${pts.join(' ')}"/>
    ${rows.map((r, i) => `<circle class="ch-dot h" data-i="${i}" cx="${cx(i)}" cy="${y(r.active)}" r="4.5"/>`).join('')}
    <circle class="ch-dot" cx="${cx(n - 1)}" cy="${y(last.active)}" r="4.5"/>
    <line class="ch-cur" x1="0" x2="0" y1="${T}" y2="${y(0)}"/><rect x="${L}" y="${T}" width="${pw}" height="${ph + 10}" fill="transparent" id="ch-hit"/></svg><div class="ch-tip" id="ch-tip" role="status"></div>`;
  $('#lgd').innerHTML = `<span><i class="ln" style="--c:var(--s1)"></i>Faol <b>${last.active}</b></span><span><i style="--c:var(--s2)"></i>Yangi hisob <b>${last.signups}</b></span>`;
  $('#chart-t').innerHTML = `<table class="tbl"><thead><tr><th>Sana</th><th class="num">Faol</th><th class="num">Yangi hisob</th></tr></thead><tbody>${rows.slice().reverse().map(r => `<tr><td>${esc(dlong(r.d))}</td><td class="num">${r.active}</td><td class="num">${r.signups}</td></tr>`).join('')}</tbody></table>`;
  const box = $('#chart'), tip = $('#ch-tip'), cur = $('.ch-cur', box), hit = $('#ch-hit', box);
  const show = ev => {
    const r = $('svg', box).getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * W;
    const i = Math.max(0, Math.min(n - 1, Math.floor((x - L) / band))), d = rows[i];
    box.classList.add('hv'); $$('.ch-bar', box).forEach(b => b.classList.toggle('on', +b.dataset.i === i)); $$('.ch-dot.h', box).forEach(b => b.classList.toggle('on', +b.dataset.i === i));
    cur.setAttribute('x1', cx(i)); cur.setAttribute('x2', cx(i));
    tip.innerHTML = `<b>${esc(dlong(d.d))}</b><div><span><i style="--c:var(--s1)"></i>Faol</span><strong>${d.active}</strong></div><div><span><i style="--c:var(--s2)"></i>Yangi hisob</span><strong>${d.signups}</strong></div>`;
    const px = cx(i) / W * r.width, tw = tip.offsetWidth || 150; tip.style.transform = `translate(${px + tw + 16 > r.width ? px - tw - 12 : px + 12}px,${Math.max(0, y(Math.max(d.active, d.signups)) / H * r.height - 20)}px)`; tip.classList.add('on');
  };
  const hide = () => { box.classList.remove('hv'); tip.classList.remove('on'); $$('.ch-bar.on,.ch-dot.on', box).forEach(b => b.classList.remove('on')); };
  hit.addEventListener('pointermove', show); hit.addEventListener('pointerdown', show); hit.addEventListener('pointerleave', hide);
}

/* ---------- So‘rovlar ---------- */
const emptyBox = (ic, t, s) => `<div class="empty">${svg(IC[ic])}<b>${t}</b><span>${s || ''}</span></div>`;
function renderRequests() {
  const reqs = REQS.slice().reverse(); $('#rc').textContent = reqs.length;
  const byEmail = new Map(USERS.map(u => [u.email, u]));
  $('#rl').innerHTML = reqs.length ? reqs.map(r => { const u = r.email && byEmail.get(r.email); return `<article class="card req">
    <div class="req-h">${avatar(r.name)}<div><b>${esc(r.name)}</b><small>${esc(rel(r.ts))} · ${esc(when(r.ts))}</small></div>${u ? `<span class="pb ${eff(u)}">${planName(eff(u))}</span>` : ''}</div>
    <div class="req-meta"><span class="badge">${esc(r.service)}</span><span>${esc(r.contact)}</span>${r.email ? `<span>· hisob: ${esc(r.email)}</span>` : ''}</div>
    ${r.message ? `<div class="req-m">${esc(r.message)}</div>` : ''}
    ${r.email ? `<div class="req-a">${['plus', 'pro', 'free'].map(p => `<button class="btn sm${p === 'free' ? '' : ' primary'}" type="button" data-e="${esc(r.email)}" data-p="${p}">${p === 'free' ? 'Free ga qaytarish' : planName(p) + ' · 30 kun'}</button>`).join('')}</div>` : '<div class="hint">Hisob emaili ko‘rsatilmagan — tarifni qo‘lda bering.</div>'}</article>`; }).join('') : emptyBox('inbox', 'Hali so‘rov yo‘q', 'Yangi so‘rovlar shu yerda paydo bo‘ladi.');
  $$('#rl [data-e]').forEach(b => (b.onclick = async () => {
    const free = b.dataset.p === 'free';
    if (await ask({ title: free ? 'Tarifni qaytarasizmi?' : `${planName(b.dataset.p)} berilsinmi?`, text: `${b.dataset.e} ${free ? 'Free tarifga o‘tadi.' : `uchun ${planName(b.dataset.p)} tarifi 30 kunga yoqiladi.`}`, ok: free ? 'Qaytarish' : 'Berish', danger: free })) give(b.dataset.e, b.dataset.p, 30);
  }));
}
async function give(email, plan, days, out) {
  if (out) { out.className = 'msg'; out.textContent = 'Kuting…'; }
  try {
    const j = await call('POST', '/api/admin/plan', { email, plan, days });
    const m = `${j.email} → ${planName(j.plan)}` + (j.planUntil ? ` (${when(j.planUntil)} gacha)` : '');
    if (out) { out.className = 'msg ok'; out.textContent = 'Tayyor: ' + m; } toast('Tayyor: ' + m); load(true);
  } catch (e) { if (out) { out.className = 'msg err'; out.textContent = e.message; } toast(e.message, 'err'); }
}

/* ---------- Foydalanuvchilar ---------- */
const FILTERS = [['all', 'Hammasi', () => true], ['paid', 'Pullik', u => eff(u) !== 'free'], ['free', 'Free', u => eff(u) === 'free'], ['plus', 'Plus', u => eff(u) === 'plus'], ['pro', 'Pro', u => eff(u) === 'pro'], ['req', 'So‘rovli', u => !!u.requested], ['push', 'Push yoqqan', u => u.push > 0]];
function renderUsers() {
  const q = ($('#uq').value || '').trim().toLowerCase(), now = Date.now(), f = FILTERS.find(x => x[0] === UF) || FILTERS[0];
  $('#uf').innerHTML = FILTERS.map(([k, l, fn]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === UF}">${l}<small>${USERS.filter(fn).length}</small></button>`).join('');
  $$('#uf [data-f]').forEach(b => (b.onclick = () => { UF = b.dataset.f; ULIM = 100; renderUsers(); }));
  const list = USERS.filter(f[2]).filter(u => !q || (u.email + ' ' + u.name).toLowerCase().includes(q));
  $('#uc').textContent = list.length === USERS.length ? USERS.length : list.length + ' / ' + USERS.length;
  const shown = list.slice(0, ULIM);
  $('#ul').innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Foydalanuvchi</th><th>Tarif</th><th>Muddati</th><th>Oxirgi kirish</th><th class="num">AI</th><th>Push</th><th>Kod</th><th></th></tr></thead><tbody>${shown.map(u => {
    const e = eff(u), exp = u.plan !== 'free' && u.planUntil;
    return `<tr><td class="u-td" data-l="Foydalanuvchi"><div class="u-c">${avatar(u.name || u.email)}<div><b>${esc(u.name)}</b><small>${esc(u.email)}</small>${u.verified ? '' : ' <span class="badge mute">tasdiqlanmagan</span>'}</div></div></td>
    <td data-l="Tarif"><span class="pb ${e}">${planName(e)}</span>${u.requested ? ` <span class="badge warn">so‘rov</span>` : ''}</td>
    <td data-l="Muddati">${exp ? esc(when(u.planUntil)) + (u.planUntil < now ? ' <span class="badge bad">tugagan</span>' : u.planUntil - now < 7 * 864e5 ? ' <span class="badge warn">tugayapti</span>' : '') : '<span class="mut">—</span>'}</td>
    <td data-l="Oxirgi kirish">${u.seen ? esc(dm(u.seen)) : '<span class="mut">—</span>'}</td><td class="num" data-l="AI">${u.ai || 0}</td>
    <td data-l="Push">${u.push ? `<span class="pn">${svg(IC.bell)}${u.push}</span>` : '<span class="mut">—</span>'}</td><td data-l="Kod">${esc(u.ref || '') || '<span class="mut">—</span>'}</td>
    <td class="a-td"><div class="row-a"><button class="btn sm" type="button" data-g="${esc(u.email)}">Tarif</button>${u.push ? `<button class="btn sm" type="button" data-n="${esc(u.email)}">Xabar</button>` : ''}${e !== 'free' ? `<button class="btn sm danger" type="button" data-rv="${esc(u.email)}">Bekor qilish</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table></div>${list.length > ULIM ? `<div class="more"><button class="btn" type="button" id="um">Yana ko‘rsatish (${list.length - ULIM})</button></div>` : ''}` : emptyBox('users', 'Foydalanuvchi topilmadi', 'Qidiruv yoki filtrni o‘zgartirib ko‘ring.');
  const um = $('#um'); if (um) um.onclick = () => { ULIM += 100; renderUsers(); };
  $$('#ul [data-rv]').forEach(b => (b.onclick = async () => { if (await ask({ title: 'Tarifni bekor qilasizmi?', text: `${b.dataset.rv} Free tarifga o‘tadi.`, ok: 'Bekor qilish', danger: true })) give(b.dataset.rv, 'free', 1, $('#pm')); }));
  $$('#ul [data-g]').forEach(b => (b.onclick = () => { $('#pe').value = b.dataset.g; $('#grant').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#pp').focus(); }));
  $$('#ul [data-n]').forEach(b => (b.onclick = () => { location.hash = '#push'; $('#na').value = 'email'; $('#nq').value = b.dataset.n; audienceUi(); $('#nt').focus(); }));
  $('#tg-us').hidden = true;
}

/* ---------- To‘lovlar ---------- */
const PROV = { payme: 'Payme', click: 'Click' };
function renderPayments() {
  if (!ORDERS) { $('#pl').innerHTML = emptyBox('card', 'To‘lovlar yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#pk').innerHTML = ''; $('#oc').textContent = ''; return; }
  const list = ORDERS.orders || [], paid = list.filter(o => o.state === 'paid'), sum = paid.reduce((a, o) => a + (o.uzs || 0), 0), wait = list.filter(o => o.state === 'new').length, day = list.filter(o => o.state === 'paid' && Date.now() - o.paidAt < 864e5).length;
  $('#oc').textContent = list.length;
  $('#pw-note').innerHTML = ORDERS.enabled ? '' : `<div class="al"><div class="notice info">${svg(IC.info)}<div><b>Karta orqali to‘lov hali ulanmagan.</b> Payme yoki Click kalitlarini Render sozlamalariga qo‘shing.</div></div></div>`;
  $('#pk').innerHTML = kpi('check', paid.length, 'to‘langan buyurtma', 'ok') + kpi('coin', fmt(sum), 'jami tushum (so‘m)') + kpi('clock', wait, 'to‘lov kutilmoqda', 'warn', wait) + kpi('card', day, 'oxirgi 24 soatda to‘langan', 'mut');
  $('#pl').innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Sana</th><th>Foydalanuvchi</th><th>Tarif</th><th>Usul</th><th class="num">Summa</th><th>Holat</th></tr></thead><tbody>${list.map(o => `<tr><td data-l="Sana">${esc(when(o.paidAt || o.created))}</td><td data-l="Foydalanuvchi">${esc(o.email || '—')}</td><td data-l="Tarif"><span class="pb ${esc(o.plan)}">${esc(planName(o.plan))}</span></td><td data-l="Usul">${esc(PROV[o.prov] || o.prov)}</td><td class="num" data-l="Summa">${fmt(o.uzs)} so‘m</td><td data-l="Holat">${o.state === 'paid' ? '<span class="badge ok">To‘langan</span>' : o.state === 'new' ? '<span class="badge mute">Kutilmoqda</span>' : `<span class="badge bad">${esc(o.state)}</span>`}</td></tr>`).join('')}</tbody></table></div>` : emptyBox('card', 'Hali to‘lov yo‘q', 'Karta orqali to‘lovlar shu yerda ko‘rinadi.');
  fx.scan($('#v-payments'));
}

/* ---------- Promo kodlar ---------- */
const PM_ST = { active: ['ok', 'Faol'], paused: ['mute', 'To‘xtatilgan'], full: ['warn', 'Joylar tugagan'], expired: ['bad', 'Muddati o‘tgan'] };
const PM_DAYS = [7, 14, 30, 90, 180, 365];
const pmAlpha = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const pmRand = () => { const b = crypto.getRandomValues(new Uint8Array(8)); let t = ''; for (const x of b) t += pmAlpha[x % pmAlpha.length]; return 'UD-' + t.slice(0, 4) + '-' + t.slice(4); };
const dayStr = n => n % 30 === 0 && n >= 60 ? `${n} kun (${n / 30} oy)` : `${n} kun`;
async function copyText(v) {
  try { await navigator.clipboard.writeText(v); toast('Nusxalandi: ' + v); }
  catch (e) { const t = document.createElement('textarea'); t.value = v; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); toast('Nusxalandi: ' + v); } catch (x) { toast('Nusxalab bo‘lmadi', 'err'); } t.remove(); }
}
function askNum({ title, text, value, min, max, ok = 'Saqlash' }) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mn-t"><h3 id="mn-t">${esc(title)}</h3><p>${esc(text)}</p><input type="number" id="mn-i" min="${min}" max="${max}" value="${value}" style="margin-top:10px"><div class="acts"><button class="btn" type="button" data-x>Bekor</button><button class="btn primary" type="button" data-ok>${esc(ok)}</button></div></div>`;
    const prev = document.activeElement, inp = $('#mn-i', bg);
    const done = v => { document.removeEventListener('keydown', key); bg.classList.add('out'); setTimeout(() => bg.remove(), 220); if (prev && prev.focus) try { prev.focus(); } catch (e) {} res(v); };
    const key = e => { if (e.key === 'Escape') done(null); else if (e.key === 'Enter') done(parseInt(inp.value, 10) || null); };
    bg.addEventListener('click', e => { if (e.target === bg) done(null); });
    $('[data-x]', bg).onclick = () => done(null); $('[data-ok]', bg).onclick = () => done(parseInt(inp.value, 10) || null);
    document.addEventListener('keydown', key); document.body.appendChild(bg); inp.focus(); inp.select();
  });
}
function renderPromos() {
  const box = $('#ml');
  if (!PROMOS) { box.innerHTML = emptyBox('ticket', 'Promo kodlar yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#mc').textContent = ''; return; }
  const list = PROMOS.promos || [], now = Date.now();
  $('#mc').textContent = list.length;
  $('#md-p').innerHTML = PM_DAYS.map(n => `<button type="button" class="chip" data-d="${n}" aria-pressed="${$('#md').value == n}">${dayStr(n)}</button>`).join('');
  $$('#md-p [data-d]').forEach(b => (b.onclick = () => { $('#md').value = b.dataset.d; $$('#md-p [data-d]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
  if (!list.length) { box.innerHTML = emptyBox('ticket', 'Hali promo kod yo‘q', 'Yuqoridagi shakldan birinchi kodni yarating.'); return; }
  const ymd = ts => { const x = when(ts).split(',').slice(0, 2).join(',').replace(/ \d\d:\d\d$/, ''); return x; };
  box.innerHTML = `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Kod</th><th>Tarif</th><th>Foydalanildi</th><th>Holat</th><th></th></tr></thead><tbody>${list.map(p => {
    const [tone, lab] = PM_ST[p.status] || PM_ST.active, pct = Math.min(100, Math.round(p.used / p.max * 100));
    const who = p.recent.length ? `<details class="pm-who"><summary>Kimlar ishlatgan (${p.used})</summary><ul>${p.recent.map(r => `<li><span>${esc(r.email || 'o‘chirilgan hisob')}</span><small>${esc(when(r.t))}</small></li>`).join('')}${p.used > p.recent.length ? `<li class="mut">…va yana ${p.used - p.recent.length} ta</li>` : ''}</ul></details>` : '';
    return `<tr><td data-l="Kod"><div class="pm-cd"><code class="pm-code">${esc(p.code)}</code><button type="button" class="ic-btn sm" data-cp="${esc(p.code)}" aria-label="Nusxalash" title="Nusxalash">${svg(IC.copy)}</button></div>${p.note ? `<small class="pm-note">${esc(p.note)}</small>` : ''}<small class="pm-note">Yaratilgan: ${esc(ymd(p.created))}</small>${who}</td>
    <td data-l="Tarif"><span class="pb ${p.plan}">${planName(p.plan)}</span><small class="pm-note">${esc(dayStr(p.days))}</small></td>
    <td data-l="Foydalanildi"><div class="pm-use"><b>${p.used}</b><span> / ${p.max}</span></div><div class="pm-bar" aria-hidden="true"><i style="width:${pct}%"></i></div></td>
    <td data-l="Holat"><span class="badge ${tone}">${lab}</span><small class="pm-note">${p.until ? 'Kod ' + esc(ymd(p.until)) + ' gacha' : 'Muddati cheklanmagan'}</small></td>
    <td class="a-td"><div class="row-a"><button class="btn sm" type="button" data-lim="${esc(p.code)}">Limit</button><button class="btn sm" type="button" data-tg="${esc(p.code)}" data-on="${p.active ? 0 : 1}">${p.active ? 'To‘xtatish' : 'Yoqish'}</button><button class="btn sm danger" type="button" data-del="${esc(p.code)}">O‘chirish</button></div></td></tr>`; }).join('')}</tbody></table></div>
    <p class="hint" style="margin-top:10px">Kodni o‘chirish yoki to‘xtatish allaqachon yoqilgan tariflarga tegmaydi — faqat yangi foydalanishni to‘xtatadi.</p>`;
  $$('#ml [data-cp]').forEach(b => (b.onclick = () => copyText(b.dataset.cp)));
  $$('#ml [data-tg]').forEach(b => (b.onclick = async () => { try { await call('POST', '/api/admin/promo/set', { code: b.dataset.tg, active: b.dataset.on === '1' }); toast(b.dataset.on === '1' ? 'Kod yoqildi' : 'Kod to‘xtatildi'); loadPromos(); } catch (e) { toast(e.message, 'err'); } }));
  $$('#ml [data-lim]').forEach(b => (b.onclick = async () => {
    const p = list.find(x => x.code === b.dataset.lim); if (!p) return;
    const n = await askNum({ title: 'Foydalanuvchilar soni', text: `${p.code}: hozir ${p.used} kishi foydalangan. Yangi limitni kiriting (${Math.max(1, p.used)} dan ${PROMOS.limits.uses} gacha).`, value: p.max, min: Math.max(1, p.used), max: PROMOS.limits.uses });
    if (!n) return;
    try { await call('POST', '/api/admin/promo/set', { code: p.code, max: n }); toast(`Limit yangilandi: ${n} kishi`); loadPromos(); } catch (e) { toast(e.message, 'err'); }
  }));
  $$('#ml [data-del]').forEach(b => (b.onclick = async () => {
    const p = list.find(x => x.code === b.dataset.del); if (!p) return;
    if (!await ask({ title: 'Promo kodni o‘chirasizmi?', text: `${p.code} o‘chiriladi (${p.used} kishi foydalangan). Allaqachon yoqilgan tariflar o‘zgarmaydi, lekin kod endi ishlamaydi.`, ok: 'O‘chirish', danger: true })) return;
    try { await call('POST', '/api/admin/promo/delete', { code: p.code }); toast('Kod o‘chirildi'); loadPromos(); } catch (e) { toast(e.message, 'err'); }
  }));
}
async function loadPromos() { try { PROMOS = await call('GET', '/api/admin/promos'); } catch (e) { if (e.status === 401) { load(); return; } toast(e.message, 'err'); } renderPromos(); }
async function createPromo() {
  const m = $('#mm'), btn = $('#mb'); m.className = 'msg'; m.textContent = ''; $('#mr').innerHTML = '';
  const body = { code: $('#mk').value.trim(), plan: $('#mp').value, days: parseInt($('#md').value, 10), max: parseInt($('#mx').value, 10), until: $('#mu').value || '', note: $('#mn').value.trim() };
  if (!(body.days >= 1)) { m.className = 'msg err'; m.textContent = 'Muddatni kunlarda kiriting (kamida 1).'; return; }
  if (!(body.max >= 1)) { m.className = 'msg err'; m.textContent = 'Necha kishiga berilishini kiriting (kamida 1).'; return; }
  btn.disabled = true; m.textContent = 'Yaratilmoqda…';
  try {
    const r = await call('POST', '/api/admin/promo', body), p = r.promo;
    m.textContent = '';
    $('#mr').innerHTML = `<div class="pm-done"><div><small>Yangi promo kod</small><code class="pm-big">${esc(p.code)}</code><span>${planName(p.plan)} · ${esc(dayStr(p.days))} · ${p.max} kishi${p.until ? ' · ' + esc(when(p.until).split(',').slice(0, 2).join(',').replace(/ \d\d:\d\d$/, '')) + ' gacha' : ''}</span></div><button class="btn primary" type="button" id="mr-c">${svg(IC.copy)}Nusxalash</button></div>`;
    $('#mr-c').onclick = () => copyText(p.code);
    $('#mk').value = ''; $('#mn').value = ''; toast('Promo kod yaratildi: ' + p.code); loadPromos();
  } catch (e) { m.className = 'msg err'; m.textContent = e.message; }
  btn.disabled = false;
}

/* ---------- Xabar yuborish: sayt ichida / push / email ---------- */
const AUD = [['all', 'Hammaga'], ['free', 'Faqat Free'], ['plus', 'Faqat Plus'], ['pro', 'Faqat Pro'], ['email', 'Bitta foydalanuvchi'], ['admin', 'Admin qurilmalari (sinov)']];
const AUD_N = { all: 'barcha foydalanuvchilarga', free: 'Free foydalanuvchilarga', plus: 'Plus foydalanuvchilarga', pro: 'Pro foydalanuvchilarga', email: 'tanlangan foydalanuvchiga', admin: 'admin qurilmalariga' };
const AUD_S = { all: 'Hamma', free: 'Free', plus: 'Plus', pro: 'Pro', admin: 'Admin' };
let NH = { notes: [], mail: false, mailMax: 300 }, wasAdm = false;
const chans = () => ({ app: $('#c-app').checked, push: $('#c-push').checked, mail: $('#c-mail').checked });
function audUsers() {
  const a = $('#na').value;
  if (a === 'all') return USERS;
  if (['free', 'plus', 'pro'].includes(a)) return USERS.filter(u => eff(u) === a);
  if (a === 'email') { const u = USERS.find(x => x.email === $('#nq').value.trim().toLowerCase()); return u ? [u] : null; }
  return [];
}
function audienceUi() {
  const a = $('#na').value, adm = a === 'admin';
  $('#nq-w').hidden = a !== 'email';
  if (adm) { $('#c-app').checked = false; $('#c-mail').checked = false; $('#c-push').checked = true; }
  else if (wasAdm) { $('#c-app').checked = true; $('#c-push').checked = true; }
  wasAdm = adm;
  $('#c-app').disabled = adm; $('#c-mail').disabled = adm || !NH.mail; $('#c-push').disabled = false;
  if (!NH.mail) $('#c-mail').checked = false;
  estimate();
}
const mailable = u => u.verified && !u.noMail;
function estimate() {
  const a = $('#na').value, us = audUsers(), say = (id, t) => { $(id).textContent = t; };
  const pn = a === 'admin' ? (STATS ? STATS.push.admin : 0) : us ? us.filter(u => u.push > 0).length : null;
  say('#c-app-h', a === 'admin' ? 'Admin qurilmalariga yuborilmaydi' : us ? `${us.length} ta foydalanuvchi` : 'Qo‘ng‘iroqcha ichida');
  say('#c-push-h', pn == null ? 'Telefon va brauzer' : a === 'admin' ? `${pn} ta admin qurilmasi` : `${pn} ta foydalanuvchida yoqilgan`);
  const mn = us && a !== 'admin' ? us.filter(mailable).length : null;
  say('#c-mail-h', a === 'admin' ? 'Admin qurilmalariga yuborilmaydi' : !NH.mail ? 'Sozlanmagan (RESEND yoki BREVO kaliti kerak)' : mn == null ? 'Pochta orqali' : mn > NH.mailMax && $('#c-mail').checked ? `${mn} ta — bir yuborishda ko‘pi bilan ${NH.mailMax} ta` : `${mn} ta manzilga`);
  return { app: a === 'admin' ? 0 : us ? us.length : null, push: pn, mail: mn };
}
function preview() {
  $('#nt-n').textContent = $('#nt').value.length + '/60'; $('#nb-n').textContent = $('#nb').value.length + '/300';
  $('#pv-t').textContent = $('#nt').value.trim() || 'Sarlavha'; $('#pv-b').textContent = $('#nb').value.trim().slice(0, 240) || 'Xabar matni shu yerda ko‘rinadi.';
}
const chipN = (ok, tg) => `${ok}/${tg}`;
function renderNotes() {
  const l = NH.notes || []; $('#nh-c').textContent = l.length;
  $('#nh-l').innerHTML = l.length ? `<ul class="nh">${l.map(n => {
    const st = n.st || {}, who = n.aud === 'email' ? (n.who || 'o‘chirilgan hisob') : AUD_S[n.aud] || n.aud;
    const chips = [n.app ? `<span class="badge">${svg(IC.inbox, 'mini')}Sayt ichida · ${st.app || 0}</span>` : '', n.push && st.push ? `<span class="badge">${svg(IC.bell, 'mini')}Push · ${chipN(st.push.ok, st.push.targets)}</span>` : '', n.mail && st.mail ? `<span class="badge${st.mail.failed ? ' warn' : ''}">${svg(IC.mail, 'mini')}Email · ${chipN(st.mail.ok, st.mail.targets)}</span>` : ''].join('');
    return `<li><div class="nh-t"><b>${esc(n.title)}</b><span>${esc(n.body)}</span></div><div class="nh-m"><span class="mut">${esc(when(n.t))} · ${esc(who)}</span><span class="nh-c">${chips}</span>${n.app ? `<button class="btn sm danger" type="button" data-nd="${esc(n.id)}" title="Foydalanuvchilar panelidan olib tashlash">O‘chirish</button>` : ''}</div></li>`;
  }).join('')}</ul>` : '<p class="mut" style="margin-top:12px">Hali xabar yuborilmagan.</p>';
  $$('#nh-l [data-nd]').forEach(b => (b.onclick = async () => {
    if (!await ask({ title: 'Xabar o‘chirilsinmi?', text: 'U foydalanuvchilar bildirishnomalar panelidan yo‘qoladi. Allaqachon yuborilgan push va email qaytmaydi.', ok: 'O‘chirish', danger: true })) return;
    try { await call('POST', '/api/admin/note/delete', { id: b.dataset.nd }); toast('Xabar o‘chirildi.'); loadNotes(); } catch (e) { toast(e.message, 'err'); }
  }));
}
async function loadNotes() { try { NH = await call('GET', '/api/admin/notes'); } catch (e) { if (e.status === 401) { load(); return; } toast(e.message, 'err'); } renderNotes(); audienceUi(); }
async function sendNote() {
  const m = $('#nm'), title = $('#nt').value.trim(), body = $('#nb').value.trim(), url = $('#nu').value.trim() || '/app', audience = $('#na').value, email = $('#nq').value.trim().toLowerCase(), ch = chans();
  m.className = 'msg err'; m.textContent = ''; $('#nr').innerHTML = '';
  if (title.length < 2 || body.length < 2) { m.textContent = 'Sarlavha va matnni kiriting.'; return; }
  if (!/^\/(?!\/)[\w\-./#?=&%]*$/.test(url)) { m.textContent = 'Havola sayt ichidagi yo‘l bo‘lsin, masalan /app#/pricing.'; return; }
  if (!ch.app && !ch.push && !ch.mail) { m.textContent = 'Kamida bitta yuborish usulini tanlang.'; return; }
  if (audience === 'email') { if (!email) { m.textContent = 'Foydalanuvchi emailini kiriting.'; return; } if (!USERS.find(x => x.email === email)) { m.textContent = 'Bunday email bilan foydalanuvchi topilmadi.'; return; } }
  const n = estimate(), parts = [];
  if (ch.app && n.app) parts.push(`sayt ichida ${n.app} ta`);
  if (ch.push && n.push) parts.push(`push ${n.push} ta`);
  if (ch.mail && n.mail) parts.push(`email ${n.mail} ta`);
  if (ch.mail && n.mail > NH.mailMax) { m.textContent = `Bir yuborishda ko‘pi bilan ${NH.mailMax} ta email yuborish mumkin. Auditoriyani toraytiring.`; return; }
  if (!parts.length) { m.textContent = ch.push && !ch.app && !ch.mail ? (audience === 'admin' ? 'Admin qurilmasi yoqilmagan. O‘ngdagi “Admin qurilmasi” kartasidan yoqing.' : 'Bu guruhda bildirishnoma yoqqan qurilma topilmadi.') : 'Tanlangan usullar bo‘yicha qabul qiluvchi topilmadi.'; return; }
  if (!await ask({ title: 'Xabar yuborilsinmi?', text: `“${title}” — ${audience === 'email' ? email : AUD_N[audience]} (${parts.join(', ')}). Yuborilgan xabarni qaytarib bo‘lmaydi.`, ok: 'Yuborish' })) return;
  const btn = $('#ns'); btn.disabled = true; m.className = 'msg'; m.textContent = ch.mail ? 'Yuborilmoqda… (email biroz vaqt olishi mumkin)' : 'Yuborilmoqda…';
  try {
    const r = await call('POST', '/api/admin/notify', { title, body, url, audience, channels: ch, ...(audience === 'email' ? { email } : {}) }), st = r.st || {}, ln = [];
    m.textContent = '';
    if (st.app != null) ln.push(`<span>Sayt ichida: <strong>${st.app}</strong> ta foydalanuvchi</span>`);
    if (st.push) ln.push(`<span>Push: <strong>${st.push.ok}</strong> / ${st.push.targets} foydalanuvchi (${st.push.devices} qurilma)</span>${st.push.gone ? `<span>Eskirgan (o‘chirildi): <strong>${st.push.gone}</strong></span>` : ''}${st.push.failed ? `<span>Push xatosi: <strong>${st.push.failed}</strong></span>` : ''}`);
    if (st.mail) ln.push(`<span>Email: <strong>${st.mail.ok}</strong> / ${st.mail.targets} yuborildi</span>${st.mail.failed ? `<span>Email xatosi: <strong>${st.mail.failed}</strong></span>` : ''}${st.mail.skipped ? `<span>O‘tkazib yuborildi (tasdiqlanmagan yoki xat olishni o‘chirgan): <strong>${st.mail.skipped}</strong></span>` : ''}`);
    $('#nr').innerHTML = `<div class="res${r.ok ? '' : ' bad'}"><b>${r.ok ? 'Yuborildi ✓' : 'Hech kimga yetkazilmadi'}</b><div class="res-n">${ln.join('')}</div></div>`;
    toast(r.ok ? 'Xabar yuborildi' : 'Xabar yetkazilmadi', r.ok ? '' : 'err');
    load(true); loadNotes();
  } catch (e) { m.className = 'msg err'; m.textContent = e.message; }
  btn.disabled = false;
}

/* admin qurilmasi: shu brauzerga yangi so‘rov va to‘lov haqida bildirishnoma */
const getEp = () => { try { return localStorage.getItem(EP_KEY) || ''; } catch (e) { return ''; } };
const setEp = v => { try { if (v) localStorage.setItem(EP_KEY, v); else localStorage.removeItem(EP_KEY); } catch (e) {} };
let swReady = null;
const ensureSw = () => swReady || (swReady = wp.supported() ? navigator.serviceWorker.register('/sw.js').catch(() => null) : Promise.resolve(null));
async function devStatus() {
  const st = await wp.status(); if (st !== 'on') return st;
  const sub = await wp.current(); return sub && sub.endpoint === getEp() ? 'on' : 'off';
}
const HINT = { denied: 'Bildirishnomalar brauzer sozlamalarida bloklangan. Bu sayt uchun ruxsat bering va sahifani yangilang.', install: 'iPhone va iPad’da avval saytni Bosh ekranga qo‘shing (Ulashish → “Bosh ekranga qo‘shish”), so‘ng ilovani oching.', unsupported: 'Bu brauzer bildirishnomalarni qo‘llab-quvvatlamaydi.' };
async function adminDevice() {
  const box = $('#ad-dev'); if (!box) return;
  await ensureSw(); const st = await devStatus();
  const say = (t, c) => { const m = $('#ad-m'); if (m) { m.className = 'msg ' + (c || ''); m.textContent = t; } };
  if (st === 'on') box.innerHTML = `<div class="dev"><span class="badge ok" style="width:max-content">${svg(IC.check, 'mini')}Bu qurilmada yoqilgan</span><div class="dev-b"><button class="btn sm" type="button" id="ad-t">Sinov yuborish</button><button class="btn sm danger" type="button" id="ad-x">O‘chirish</button></div><div class="msg" id="ad-m" role="status"></div></div>`;
  else if (st === 'off') box.innerHTML = `<div class="dev"><button class="btn primary sm" type="button" id="ad-on" style="width:max-content">Shu qurilmada yoqish</button><p class="hint">Bitta brauzer faqat bitta rolda bildirishnoma oladi: admin sifatida yoqsangiz, shu brauzerda ilovadagi shaxsiy bildirishnoma o‘chadi.</p><div class="msg" id="ad-m" role="status"></div></div>`;
  else box.innerHTML = `<div class="dev"><p>${esc(HINT[st] || HINT.unsupported)}</p></div>`;
  const on = $('#ad-on'), t = $('#ad-t'), x = $('#ad-x');
  if (on) on.onclick = async () => {
    on.disabled = true; say('Kuting…');
    try { const { key } = await (await fetch('/api/push/key')).json(); const sub = await wp.subscribe(key); await call('POST', '/api/admin/push/subscribe', sub); setEp(sub.endpoint); toast('Admin bildirishnomasi yoqildi ✓'); load(true); adminDevice(); }
    catch (e) { on.disabled = false; say(e.code === 'denied' ? 'Bildirishnoma ruxsati berilmadi.' : e.message, 'err'); }
  };
  if (x) x.onclick = async () => { x.disabled = true; try { const ep = await wp.unsubscribe(); if (ep) await call('POST', '/api/admin/push/unsubscribe', { endpoint: ep }); setEp(''); toast('Admin bildirishnomasi o‘chirildi.'); load(true); } catch (e) { toast(e.message, 'err'); } adminDevice(); };
  if (t) t.onclick = async () => { t.disabled = true; try { const r = await call('POST', '/api/admin/push/send', { title: 'UniDoue admin', body: 'Admin bildirishnomalari ishlayapti ✓', url: '/admin#overview', audience: 'admin' }); say(r.ok ? 'Sinov xabari yuborildi — bir necha soniyada keladi.' : 'Yetkazib bo‘lmadi. O‘chirib, qayta yoqing.', r.ok ? 'ok' : 'err'); } catch (e) { say(e.message, 'err'); } t.disabled = false; };
}

/* ---------- yuklash ---------- */
function showLogin(msg) {
  $('#shell').hidden = true; $('#lg').hidden = false; document.title = 'Admin — UniDoue';
  const m = $('#lm'); m.className = 'msg err'; m.textContent = msg || ''; $('#lb').disabled = false; if (!msg) m.className = 'msg';
}
let busy = false;
async function load(silent) {
  if (busy) return; busy = true;
  const rf = $('#rf'); rf.classList.add('spin'); if (!silent) $('#st').textContent = 'Yuklanmoqda…';
  try {
    const [rq, us, st, od, pr, nh] = await Promise.all([call('GET', '/api/admin/requests'), call('GET', '/api/admin/users'), call('GET', '/api/admin/stats'),
      call('GET', '/api/admin/orders').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/promos').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/notes').catch(e => { if (e.status === 401) throw e; return null; })]);
    REQS = rq.requests || []; USERS = us.users || []; STATS = st; ORDERS = od; PROMOS = pr; if (nh) NH = nh; loadedAt = Date.now();
    const first = $('#shell').hidden; $('#lg').hidden = true; $('#shell').hidden = false;
    renderOverview(st); renderRequests(); renderUsers(); renderPayments(); renderPromos(); renderNotes(); audienceUi();
    $('#st').textContent = 'Yangilandi: ' + when(Date.now()).split(', ')[1].split(' ').pop();
    if (first) route(); else fx.scan($('#kpis'));
  } catch (e) {
    if (e.status === 401) { try { sessionStorage.removeItem('unidoue:adm'); } catch (x) {} TOKEN = ''; showLogin('Token noto‘g‘ri.'); }
    else if ($('#shell').hidden) showLogin(e.message);
    else { $('#st').textContent = 'Yangilab bo‘lmadi'; if (!silent) toast(e.message, 'err'); }
  }
  rf.classList.remove('spin'); busy = false;
}

/* ---------- hodisalar ---------- */
$('#lf').onsubmit = ev => { ev.preventDefault(); const v = $('#tk').value.trim(); if (!v) return; TOKEN = v; try { sessionStorage.setItem('unidoue:adm', TOKEN); } catch (e) {} $('#tk').value = ''; $('#lb').disabled = true; load(); };
$('#tk-eye').onclick = () => { const i = $('#tk'), s = i.type === 'password'; i.type = s ? 'text' : 'password'; $('#tk-eye').setAttribute('aria-pressed', s); };
$('#rf').onclick = () => load();
$('#lo').onclick = () => { try { sessionStorage.removeItem('unidoue:adm'); } catch (e) {} TOKEN = ''; USERS = []; showLogin(''); $('#tk').focus(); };
$('#bg').onclick = () => document.body.classList.toggle('nav-open');
$('#scrim').onclick = () => document.body.classList.remove('nav-open');
$('#uq').oninput = () => { ULIM = 100; renderUsers(); };
$('#pg').onclick = () => { const e = $('#pe').value.trim().toLowerCase(); if (!e) { $('#pm').className = 'msg err'; $('#pm').textContent = 'Emailni kiriting.'; return; } give(e, $('#pp').value, parseInt($('#pd').value, 10) || 30, $('#pm')); };
$('#mb').onclick = createPromo; $('#mk-r').onclick = () => { $('#mk').value = pmRand(); $('#mk').focus(); };
$('#md').oninput = () => $$('#md-p [data-d]').forEach(x => x.setAttribute('aria-pressed', x.dataset.d === $('#md').value));
$('#mk').onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); createPromo(); } };
$('#na').innerHTML = AUD.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
$('#na').onchange = audienceUi; $('#nq').oninput = estimate; $('#nt').oninput = preview; $('#nb').oninput = preview; $('#ns').onclick = sendNote; $$('#nch input').forEach(i => (i.onchange = estimate));
preview();
setInterval(() => { if (TOKEN && !document.hidden && !$('#shell').hidden && Date.now() - loadedAt > 55000) load(true); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && TOKEN && !$('#shell').hidden && Date.now() - loadedAt > 30000) load(true); });
if (TOKEN) load(); else $('#tk').focus();

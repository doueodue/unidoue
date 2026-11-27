/* Admin panel. Qat'iy CSP: inline skript yo‘q, barcha hodisalar shu yerda ulanadi. */
import * as fx from '/js/fx.js';
import * as wp from '/js/webpush.js';
import '/js/ui.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
let ME = ''; // kirgan admin emaili (seans cookie'si HttpOnly: JS tokenni koʻrmaydi)
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
try { sessionStorage.removeItem('unidoue:adm'); localStorage.removeItem('unidoue:adm-email'); } catch (e) {} // eski token rejimidan qolgan qiymatlarni tozalash
const EP_KEY = 'unidoue:adm-ep'; // shu brauzer admin qurilmasi sifatida yozilgan obuna manzili
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'], p2 = n => String(n).padStart(2, '0');
const when = v => { const d = new Date(v); return isNaN(d) ? '' : `${d.getDate()}-${MON[d.getMonth()]}, ${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
/* «Ko‘rildi» belgisi (nishonlar): shu brauzerda bo‘limni oxirgi ochgan vaqt. Faqat undan keyingi yangi hodisalar nishonda sanaladi. */
const seenAt = k => { try { return +localStorage.getItem('unidoue:adm-seen:' + k) || 0; } catch (e) { return 0; } };
const markSeen = k => { try { localStorage.setItem('unidoue:adm-seen:' + k, String(Date.now())); } catch (e) {} };
const whenS = v => { const d = new Date(v); return isNaN(d) ? '' : `${d.getDate()}-${MON[d.getMonth()]}, ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
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
  const r = await fetch(url, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Xato (' + r.status + ')'); e.status = r.status; e.reauth = j.reauth === true; throw e; }
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

/* Foydalanuvchiga javob xati yozish oynasi. Natija: server javobi ({ ok, replies, status }) yoki null (bekor). */
function replyDlg({ kind, id, name, to, subject, quote, done }) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    const hi = 'Salom' + (name ? ', ' + String(name).split(' ')[0] : '') + '!', sign = '\n\n\n\nHurmat bilan,\nUniDoue jamoasi', ini = hi + '\n\n' + sign.trimStart();
    bg.innerHTML = `<div class="modal rp" role="dialog" aria-modal="true" aria-labelledby="rp-t"><h3 id="rp-t">${svg(IC.mail)}Javob yozish</h3>
      <div class="rp-to"><span>Kimga</span><b>${esc(to)}</b></div>
      <label class="rp-l" for="rp-s">Mavzu</label><input id="rp-s" type="text" maxlength="150" value="${esc(subject)}" autocomplete="off">
      <label class="rp-l" for="rp-b">Javob matni</label><textarea id="rp-b" rows="8" maxlength="5000" placeholder="Javobingizni yozing…"></textarea>
      ${quote ? `<details class="rp-q"><summary>Foydalanuvchining xabari (xatga iqtibos qilinadi)</summary><div>${esc(quote)}</div></details>` : ''}
      ${kind === 'feedback' && !done ? '<label class="rp-ck"><input type="checkbox" id="rp-d" checked><span>Yuborgach «Bajarildi» deb belgilash</span></label>' : ''}
      <div class="msg" id="rp-m" role="alert"></div>
      <div class="acts"><button class="btn" type="button" data-x>Bekor</button><button class="btn primary" type="button" data-ok>Yuborish</button></div></div>`;
    const prev = document.activeElement, ta = $('#rp-b', bg), sj = $('#rp-s', bg), msg = $('#rp-m', bg), okb = $('[data-ok]', bg), xb = $('[data-x]', bg);
    ta.value = ini; let busy = false; ta.addEventListener('input', () => { if (msg.textContent) { msg.className = 'msg'; msg.textContent = ''; } });
    const out = v => { document.removeEventListener('keydown', key, true); bg.classList.add('out'); setTimeout(() => bg.remove(), 220); if (prev && prev.focus) try { prev.focus(); } catch (e) {} res(v); };
    const close = async () => { if (busy) return; if (ta.value.trim() !== ini.trim() && ta.value.trim().length > 12 && !await ask({ title: 'Javob yuborilmadi', text: 'Yozganingiz yo‘qoladi. Yopasizmi?', ok: 'Yopish', danger: true })) return ta.focus(); out(null); };
    const send = async () => {
      if (busy) return; const body = ta.value.trim();
      if (body.length < 2) { msg.className = 'msg err'; msg.textContent = 'Javob matnini yozing.'; return ta.focus(); }
      busy = true; okb.disabled = true; okb.textContent = 'Yuborilmoqda…'; xb.disabled = true; msg.className = 'msg'; msg.textContent = '';
      try { const d = $('#rp-d', bg); const r = await call('POST', '/api/admin/reply', { kind, id, subject: sj.value, body, done: !!(d && d.checked) }); out(r); }
      catch (e) { busy = false; okb.disabled = false; okb.textContent = 'Qayta yuborish'; xb.disabled = false; msg.className = 'msg err'; msg.textContent = e.message; }
    };
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } };
    bg.addEventListener('pointerdown', e => { if (e.target === bg) close(); });
    xb.onclick = close; okb.onclick = send; document.addEventListener('keydown', key, true); document.body.appendChild(bg); ta.focus(); ta.setSelectionRange(hi.length + 2, hi.length + 2);
  });
}
const replied = r => (r.replies && r.replies.length ? `<span class="badge ok" title="${esc(r.replies.map(x => when(x.ts)).join(', '))}">Javob yuborilgan${r.replies.length > 1 ? ' ×' + r.replies.length : ''}</span>` : '');

/* ---------- holat ---------- */
let BLK = null, ATT = null, ATF = 'att', ATP = 'week', SEC = null, SCF = 'all', USERS = [], REQS = [], ORDERS = null, PROMOS = null, STATS = null, UF = 'all', ULIM = 100, loadedAt = 0;
const eff = u => (u.plan && u.plan !== 'free' && (!u.planUntil || u.planUntil > Date.now()) ? u.plan : 'free');

/* ---------- yo‘naltirish ---------- */
const VIEWS = { overview: 'Umumiy ko‘rinish', requests: 'So‘rovlar', users: 'Foydalanuvchilar', payments: 'To‘lovlar', push: 'Xabarlar', promos: 'Promo kodlar', unis: 'Universitetlar', feedback: 'Fikrlar', access: 'Kirishlar', security: 'Himoya holati', attempts: 'Urinishlar', blocks: 'Bloklash', log: 'Yuborilgan xatlar' };
function route() {
  const v = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
  $$('.view').forEach(s => { s.hidden = s.id !== 'v-' + v; });
  $$('#nav a').forEach(a => { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#ttl').textContent = VIEWS[v]; document.title = VIEWS[v] + ' · Admin — UniDoue';
  document.body.classList.remove('nav-open'); window.scrollTo(0, 0);
  const sec = $('#v-' + v); if (sec) fx.scan(sec);
  if (v === 'push') adminDevice();
  if (v === 'attempts') { markSeen('att'); if (ATT) renderAttempts(); }
  if (v === 'blocks') renderBlocks();
  if (v === 'security') { markSeen('sec'); if (SEC) renderSecurity(); }
}
addEventListener('hashchange', () => { if (!$('#shell').hidden) route(); });

/* ---------- Umumiy ---------- */
const kpi = (ic, n, label, tone, on) => `<div class="kpi ${tone || ''}${on ? ' on' : ''}"><i>${svg(IC[ic])}</i><div class="stat"><b>${n}</b><span>${label}</span></div></div>`;
function renderOverview(st) {
  const warn = [];
  if (st.pending) warn.push(`<div class="notice">${svg(IC.warn)}<div><b>${st.pending} ta tarif so‘rovi kutmoqda.</b> <a href="#requests">Ko‘rish →</a></div></div>`);
  if (st.fbNew) warn.push(`<div class="notice info">${svg(IC.inbox)}<div><b>${st.fbNew} ta yangi fikr yoki xato xabari bor.</b> <a href="#feedback">Ko‘rish →</a></div></div>`);
  if (st.proExpiring) warn.push(`<div class="notice">${svg(IC.clock)}<div><b>${st.proExpiring} ta pullik tarif 7 kun ichida tugaydi.</b> <a href="#users">Foydalanuvchilar →</a></div></div>`);
  const cfg = [!st.mail && 'Xat yuborish ulanmagan (tasdiqlash va parol tiklash ishlamaydi)', !st.ai && 'AI ulanmagan', st.mail && !st.verifyOn && 'Email tasdiqlash o‘chiq', !st.payCard && 'PAY_CARD sozlanmagan (karta raqami ko‘rinmaydi)'].filter(Boolean);
  if (cfg.length) warn.push(`<div class="notice info">${svg(IC.info)}<div><b>Sozlash kerak:</b><br>${cfg.map(esc).join('<br>')}</div></div>`);
  if (st.mail && st.mailLast && !st.mailLast.ok) warn.push(`<div class="notice">${svg(IC.warn)}<div><b>Oxirgi xat yuborilmadi (${esc({ reset: 'parol tiklash', verify: 'tasdiqlash kodi', test: 'sinov', mail: 'xabar', reply: 'javob' }[st.mailLast.kind] || 'xat')}).</b><br>${esc(st.mailLast.err)}${st.mailLast.hint ? `<br><b>Nima qilish kerak:</b> ${esc(st.mailLast.hint)}` : ''}</div></div>`);
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
/* ---------- Fikrlar ---------- */
let FBK = null, FBF = 'new', FBT = '';
const FB_T = { bug: ['Xato', 'bad'], idea: ['Taklif', 'warn'], ask: ['Savol', 'target'] };
function deviceOf(ua) {
  ua = String(ua || '');
  const br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return [br, os].filter(Boolean).join(' · ');
}
const FBURL = new Map();
async function fbBlob(id, n) {
  const k = id + ':' + n; if (FBURL.has(k)) return FBURL.get(k);
  const r = await fetch(`/api/admin/feedback/img?id=${encodeURIComponent(id)}&n=${n}`, { credentials: 'same-origin' });
  if (!r.ok) throw new Error('Rasm yuklanmadi');
  const bl = await r.blob(); /* CSP blob: rasmlarga ruxsat bermaydi — data: URL ishlatamiz */
  const u = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error('Rasm o‘qilmadi')); fr.readAsDataURL(bl); });
  FBURL.set(k, u); return u;
}
async function fbThumb(b) {
  try { const u = await fbBlob(b.dataset.fi, b.dataset.n); b.innerHTML = `<img src="${u}" alt="">`; b.onclick = () => fbLightbox(u); }
  catch (e) { b.classList.add('bad'); b.innerHTML = '<span>Rasm yo‘q</span>'; b.disabled = true; }
}
function fbLightbox(u) {
  const bg = document.createElement('div'); bg.className = 'fb-lb'; bg.setAttribute('role', 'dialog'); bg.setAttribute('aria-modal', 'true'); bg.setAttribute('aria-label', 'Rasm');
  bg.innerHTML = `<img src="${u}" alt=""><div class="fb-lb-a"><a class="btn sm" href="${u}" download="fikr-rasm.jpg">Yuklab olish</a><button class="btn sm" type="button" data-c>Yopish</button></div>`;
  const off = () => { bg.remove(); document.removeEventListener('keydown', key, true); };
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); off(); } };
  bg.addEventListener('pointerdown', e => { if (e.target === bg) off(); }); $('[data-c]', bg).onclick = off; document.addEventListener('keydown', key, true);
  document.body.appendChild(bg); $('[data-c]', bg).focus();
}
function renderFeedback() {
  const all = (FBK && FBK.items) || [], nNew = all.filter(f => f.status !== 'done').length;
  $('#fc').textContent = FBK ? (FBK.total > all.length ? all.length + ' / ' + FBK.total : all.length) : '';
  const nn = $('#fb-nn'); if (nn) { nn.hidden = !nNew; nn.textContent = nNew > 99 ? '99+' : nNew; }
  const chip = (k, v, label, n) => `<button type="button" class="chip" data-${k}="${v}" aria-pressed="${(k === 's' ? FBF : FBT) === v}">${label}${n != null ? ` <b>${n}</b>` : ''}</button>`;
  $('#ff').innerHTML = chip('s', 'new', 'Yangi', nNew) + chip('s', 'done', 'Bajarilgan', all.length - nNew) + chip('s', '', 'Hammasi', all.length) + '<span class="fb-sep" aria-hidden="true"></span>' + Object.entries(FB_T).map(([k, [l]]) => chip('t', k, l, all.filter(f => f.type === k).length)).join('');
  $$('#ff [data-s]').forEach(b => (b.onclick = () => { FBF = b.dataset.s; renderFeedback(); }));
  $$('#ff [data-t]').forEach(b => (b.onclick = () => { FBT = FBT === b.dataset.t ? '' : b.dataset.t; renderFeedback(); }));
  if (!FBK) { $('#fl').innerHTML = emptyBox('inbox', 'Fikrlar yuklanmadi', 'Keyinroq yangilab ko‘ring.'); return; }
  const byEmail = new Map(USERS.map(u => [u.email, u]));
  const list = all.filter(f => (!FBF || (FBF === 'done') === (f.status === 'done')) && (!FBT || f.type === FBT));
  $('#fl').innerHTML = list.length ? list.map(f => { const [tl, tone] = FB_T[f.type] || ['Xabar', 'mute'], u = byEmail.get(f.email), done = f.status === 'done', dev = [deviceOf(f.ua), f.vp, f.theme === 'dark' ? 'qorong‘i' : f.theme === 'light' ? 'yorug‘' : '', f.lang && f.lang.toUpperCase()].filter(Boolean).join(' · ');
    const mail = `mailto:${encodeURIComponent(f.email)}?subject=${encodeURIComponent('UniDoue: ' + tl.toLowerCase() + ' haqida')}&body=${encodeURIComponent('Salom, ' + (f.name || '') + '!\n\n\n— Sizning xabaringiz:\n' + f.text.split('\n').map(x => '> ' + x).join('\n'))}`;
    return `<article class="card req fbc${done ? ' done' : ''}" data-ty="${esc(f.type)}">
    <div class="req-h">${avatar(f.name)}<div><b>${esc(f.name)}</b><small>${esc(rel(f.ts))} · ${esc(when(f.ts))}</small></div><span class="badge ${tone}">${esc(tl)}</span>${u ? `<span class="pb ${eff(u)}">${planName(eff(u))}</span>` : ''}${done ? '<span class="badge ok">bajarilgan</span>' : ''}${replied(f)}</div>
    <div class="req-meta"><span>${esc(f.email)}</span>${f.page ? `<span>· sahifa: <code>${esc(f.page)}</code></span>` : ''}</div>
    <div class="req-m">${esc(f.text)}</div>
    ${f.ni ? `<div class="fbc-i">${Array.from({ length: f.ni }, (_, n) => `<button type="button" class="fbc-t" data-fi="${esc(f.id)}" data-n="${n}" aria-label="Rasmni kattalashtirish ${n + 1}"><span class="fbc-ld"></span></button>`).join('')}</div>` : ''}
    ${dev ? `<div class="fbc-d">${esc(dev)}</div>` : ''}
    <div class="req-a"><button class="btn sm${done ? '' : ' primary'}" type="button" data-fs="${esc(f.id)}" data-st="${done ? 'new' : 'done'}">${done ? 'Qayta ochish' : 'Bajarildi'}</button>${STATS && STATS.mail ? `<button class="btn sm" type="button" data-fr="${esc(f.id)}">${svg(IC.mail)}Javob yozish</button>` : `<a class="btn sm" href="${mail}" title="Xat yuborish serverda ulanmagan: pochta ilovangizda ochiladi">Email orqali javob</a>`}<button class="btn sm danger" type="button" data-fd="${esc(f.id)}">O‘chirish</button></div></article>`; }).join('')
    : emptyBox('inbox', all.length ? 'Bu filtrda xabar yo‘q' : 'Hali fikr yo‘q', all.length ? 'Filtrni o‘zgartirib ko‘ring.' : 'Foydalanuvchilar sarlavhadagi tugma orqali yuborgan xabarlar shu yerda paydo bo‘ladi.');
  $$('#fl [data-fi]').forEach(b => fbThumb(b));
  $$('#fl [data-fs]').forEach(b => (b.onclick = async () => { b.disabled = true; try { await call('POST', '/api/admin/feedback/set', { id: b.dataset.fs, status: b.dataset.st }); const f = all.find(x => x.id === b.dataset.fs); if (f) f.status = b.dataset.st; if (STATS) STATS.fbNew = all.filter(x => x.status !== 'done').length; renderFeedback(); renderOverview(STATS); } catch (e) { toast(e.message, 'err'); b.disabled = false; } }));
  $$('#fl [data-fr]').forEach(b => (b.onclick = async () => {
    const f = all.find(x => x.id === b.dataset.fr); if (!f) return; const tl = (FB_T[f.type] || ['Xabar'])[0];
    const r = await replyDlg({ kind: 'feedback', id: f.id, name: f.name, to: f.email, subject: 'UniDoue: ' + tl.toLowerCase() + ' haqida', quote: f.text, done: f.status === 'done' });
    if (!r) return; f.replies = r.replies; if (r.status) f.status = r.status; if (STATS) STATS.fbNew = all.filter(x => x.status !== 'done').length; toast('Javob yuborildi'); renderFeedback(); renderOverview(STATS);
  }));
  $$('#fl [data-fd]').forEach(b => (b.onclick = async () => { if (!await ask({ title: 'Xabarni o‘chirasizmi?', text: 'Qaytarib bo‘lmaydi.', ok: 'O‘chirish', danger: true })) return; try { await call('POST', '/api/admin/feedback/delete', { id: b.dataset.fd }); FBK.items = all.filter(x => x.id !== b.dataset.fd); FBK.total--; if (STATS) STATS.fbNew = FBK.items.filter(x => x.status !== 'done').length; renderFeedback(); renderOverview(STATS); toast('O‘chirildi'); } catch (e) { toast(e.message, 'err'); } }));
}
const emptyBox = (ic, t, s) => `<div class="empty">${svg(IC[ic])}<b>${t}</b><span>${s || ''}</span></div>`;
function renderRequests() {
  const reqs = REQS.slice().reverse(); $('#rc').textContent = reqs.length;
  const byEmail = new Map(USERS.map(u => [u.email, u]));
  $('#rl').innerHTML = reqs.length ? reqs.map(r => { const u = r.email && byEmail.get(r.email); return `<article class="card req">
    <div class="req-h">${avatar(r.name)}<div><b>${esc(r.name)}</b><small>${esc(rel(r.ts))} · ${esc(when(r.ts))}</small></div>${u ? `<span class="pb ${eff(u)}">${planName(eff(u))}</span>` : ''}</div>
    <div class="req-meta"><span class="badge">${esc(r.service)}</span><span>${esc(r.contact)}</span>${r.email ? `<span>· hisob: ${esc(r.email)}</span>` : ''}${replied(r)}</div>
    ${r.message ? `<div class="req-m">${esc(r.message)}</div>` : ''}
    ${r.email ? `<div class="req-a">${['plus', 'pro', 'free'].map(p => `<button class="btn sm${p === 'free' ? '' : ' primary'}" type="button" data-e="${esc(r.email)}" data-p="${p}">${p === 'free' ? 'Free ga qaytarish' : planName(p) + ' · 30 kun'}</button>`).join('')}${r.email && r.id && STATS && STATS.mail ? `<button class="btn sm" type="button" data-rr="${esc(r.id)}">${svg(IC.mail)}Javob yozish</button>` : ''}</div>` : '<div class="hint">Hisob emaili ko‘rsatilmagan — tarifni qo‘lda bering.</div>'}</article>`; }).join('') : emptyBox('inbox', 'Hali so‘rov yo‘q', 'Yangi so‘rovlar shu yerda paydo bo‘ladi.');
  $$('#rl [data-rr]').forEach(b => (b.onclick = async () => {
    const r = REQS.find(x => x.id === b.dataset.rr); if (!r) return;
    const x = await replyDlg({ kind: 'request', id: r.id, name: r.name, to: r.email, subject: 'UniDoue: ' + r.service.toLowerCase() + ' haqida', quote: r.message });
    if (!x) return; r.replies = x.replies; toast('Javob yuborildi'); renderRequests();
  }));
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
const FILTERS = [['all', 'Hammasi', () => true], ['paid', 'Pullik', u => eff(u) !== 'free'], ['free', 'Free', u => eff(u) === 'free'], ['plus', 'Plus', u => eff(u) === 'plus'], ['pro', 'Pro', u => eff(u) === 'pro'], ['req', 'So‘rovli', u => !!u.requested], ['push', 'Push yoqqan', u => u.push > 0], ['blk', 'Bloklangan', u => !!u.blocked || u.ipBlocked], ['noip', 'IP yo‘q', u => !u.ip]];
/** Foydalanuvchi IP si: oxirgisi (asosiy), birinchisi (boshqacha bo‘lsa), shu IP dagi hisoblar soni va blok holati. */
const ipCell = (u, ipN) => u.ip
  ? `<div class="ipc"><b${u.ip.includes(':') ? ' class="v6"' : ''} title="Oxirgi kirgan IP${u.ipAt ? ': ' + esc(when(u.ipAt)) : ''}">${esc(u.ip)}</b>${u.ip0 && u.ip0 !== u.ip ? `<small title="Birinchi (ro‘yxatdan o‘tgandagi) IP">birinchi: ${esc(u.ip0)}</small>` : ''}${ipN[u.ip] > 1 ? `<span class="badge warn" title="Shu IP dan kirgan hisoblar soni">${ipN[u.ip]} hisob</span>` : ''}${u.ipBlocked ? '<span class="badge bad">bloklangan</span>' : ''}</div>`
  : '<span class="mut" title="Bu foydalanuvchi yangilanishdan keyin hali kirmagan — IP keyingi tashrifida yoziladi">—</span>';
function renderUsers() {
  const q = ($('#uq').value || '').trim().toLowerCase(), now = Date.now(), f = FILTERS.find(x => x[0] === UF) || FILTERS[0];
  $('#uf').innerHTML = FILTERS.map(([k, l, fn]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === UF}">${l}<small>${USERS.filter(fn).length}</small></button>`).join('');
  $$('#uf [data-f]').forEach(b => (b.onclick = () => { UF = b.dataset.f; ULIM = 100; renderUsers(); }));
  const list = USERS.filter(f[2]).filter(u => !q || (u.email + ' ' + u.name + ' ' + (u.ip || '')).toLowerCase().includes(q));
  $('#uc').textContent = list.length === USERS.length ? USERS.length : list.length + ' / ' + USERS.length;
  const shown = list.slice(0, ULIM), ipN = {}; USERS.forEach(x => { if (x.ip) ipN[x.ip] = (ipN[x.ip] || 0) + 1; });
  $('#ul').innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Foydalanuvchi</th><th>IP manzil</th><th>Tarif</th><th>Muddati</th><th>Oxirgi kirish</th><th class="num">AI</th><th>Push</th><th>Kod</th><th></th></tr></thead><tbody>${shown.map(u => {
    const e = eff(u), exp = u.plan !== 'free' && u.planUntil;
    return `<tr><td class="u-td" data-l="Foydalanuvchi"><div class="u-c">${avatar(u.name || u.email)}<div><b>${esc(u.name)}</b><small>${esc(u.email)}</small>${vbadge(u.vs, u.google)}${u.blocked ? ` <span class="badge bad" title="${esc(u.blocked.reason || '')}${u.blocked.until ? ' · ' + esc(untilLeft(u.blocked.until)) : ' · doimiy'}">Bloklangan</span>` : ''}</div></div></td>
    <td data-l="IP manzil">${ipCell(u, ipN)}</td>
    <td data-l="Tarif"><span class="pb ${e}">${planName(e)}</span>${u.requested ? ` <span class="badge warn">so‘rov</span>` : ''}</td>
    <td data-l="Muddati">${exp ? esc(when(u.planUntil)) + (u.planUntil < now ? ' <span class="badge bad">tugagan</span>' : u.planUntil - now < 7 * 864e5 ? ' <span class="badge warn">tugayapti</span>' : '') : '<span class="mut">—</span>'}</td>
    <td data-l="Oxirgi kirish">${u.seen ? esc(dm(u.seen)) : '<span class="mut">—</span>'}</td><td class="num" data-l="AI">${u.ai || 0}</td>
    <td data-l="Push">${u.push ? `<span class="pn">${svg(IC.bell)}${u.push}</span>` : '<span class="mut">—</span>'}</td><td data-l="Kod">${esc(u.ref || '') || '<span class="mut">—</span>'}</td>
    <td class="a-td"><div class="row-a"><button class="btn sm" type="button" data-g="${esc(u.email)}">Tarif</button>${u.push ? `<button class="btn sm" type="button" data-n="${esc(u.email)}">Xabar</button>` : ''}${u.vs !== 'yes' && !u.google ? `<button class="btn sm" type="button" data-vr="${esc(u.email)}">Qayta tasdiqlatish</button>` : ''}${e !== 'free' ? `<button class="btn sm danger" type="button" data-rv="${esc(u.email)}">Bekor qilish</button>` : ''}${u.blocked ? `<button class="btn sm" type="button" data-ubu="${esc(u.email)}">Blokdan chiqarish</button>` : `<button class="btn sm danger" type="button" data-bu="${esc(u.email)}">Bloklash</button>`}</div></td></tr>`; }).join('')}</tbody></table></div>${list.length > ULIM ? `<div class="more"><button class="btn" type="button" id="um">Yana ko‘rsatish (${list.length - ULIM})</button></div>` : ''}` : emptyBox('users', 'Foydalanuvchi topilmadi', 'Qidiruv yoki filtrni o‘zgartirib ko‘ring.');
  const um = $('#um'); if (um) um.onclick = () => { ULIM += 100; renderUsers(); };
  $$('#ul [data-vr]').forEach(b => (b.onclick = async () => {
    if (!await ask({ title: 'Emailni qayta tasdiqlatasizmi?', text: `${b.dataset.vr} manziliga 6 xonali kod yuboriladi. Foydalanuvchi kodni kiritmaguncha saytga kira olmaydi.`, ok: 'Kod yuborish' })) return;
    b.disabled = true; try { await call('POST', '/api/admin/user/reverify', { email: b.dataset.vr }); toast('Kod yuborildi'); load(); } catch (e) { toast(e.message, 'err'); b.disabled = false; }
  }));
  $$('#ul [data-rv]').forEach(b => (b.onclick = async () => { if (await ask({ title: 'Tarifni bekor qilasizmi?', text: `${b.dataset.rv} Free tarifga o‘tadi.`, ok: 'Bekor qilish', danger: true })) give(b.dataset.rv, 'free', 1, $('#pm')); }));
  $$('#ul [data-g]').forEach(b => (b.onclick = () => { $('#pe').value = b.dataset.g; $('#grant').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#pp').focus(); }));
  $$('#ul [data-n]').forEach(b => (b.onclick = () => { location.hash = '#push'; $('#na').value = 'email'; $('#nq').value = b.dataset.n; audienceUi(); $('#nt').focus(); }));
  $$('#ul [data-bu]').forEach(b => (b.onclick = () => blockUser(b.dataset.bu)));
  $$('#ul [data-ubu]').forEach(b => (b.onclick = () => unblockUser(b.dataset.ubu)));
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
const vbadge = (vs, g) => g ? ' <span class="badge ok">Google ✓</span>' : vs === 'yes' ? '' : vs === 'no' ? ' <span class="badge warn">kod kutilmoqda</span>' : ' <span class="badge mute">tasdiqlanmagan (eski)</span>';
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
    const who = p.recent.length ? `<details class="pm-who"><summary>Kimlar ishlatgan (${p.used})</summary><ul>${p.recent.map(r => `<li><span class="pm-e" title="${esc(r.email || '')}">${esc(r.email || 'o‘chirilgan hisob')}</span><small>${esc(when(r.t))}</small>${r.vs === 'yes' ? '<em class="pm-v ok">tasdiqlangan</em>' : r.vs === 'no' ? '<em class="pm-v warn">kod kutilmoqda</em>' : r.vs === 'old' ? '<em class="pm-v warn">tasdiqlanmagan (eski)</em>' : ''}</li>`).join('')}${p.used > p.recent.length ? `<li class="mut">…va yana ${p.used - p.recent.length} ta</li>` : ''}</ul></details>` : '';
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


/* ---------- Universitetlar: qo‘lda qo‘shish / tahrirlash ---------- */
let UNIS = null, UEDIT = '', UFILT = 'all', ULM = 40;
const UNF = [['all', 'Hammasi'], ['mine', 'Men qo‘shgan'], ['base', 'Asosiy ro‘yxat']];
const txt = o => (o && (o.uz || o.en || o.ru)) || '';
const U_IDS = ['n', 'c', 't', 'w', 'l', 'e', 'i', 'in', 'iu', 'd', 'di', 'du', 'p', 'pc', 'pn', 'pu', 'r', 'ru'];
function uniForm(u) {
  const v = u || {}, set = (k, x) => { $('#un-' + k).value = x == null ? '' : x; };
  set('n', v.n); set('c', v.country); set('t', v.city); set('w', v.url); set('l', v.lang); set('e', v.eng === true ? 'yes' : v.eng === false ? 'no' : '');
  set('i', v.ielts); set('in', txt(v.ieltsNote)); set('iu', v.ielts != null ? v.ieltsUrl : v.ieltsNoteUrl);
  set('sat', v.sat); set('satu', v.satUrl);
  set('d', v.rd); set('di', txt(v.rdIntake)); set('du', v.rdUrl);
  const tu = v.tuition || {}; set('p', tu.amount); set('pc', tu.cur); set('pn', txt(tu.note)); set('pu', tu.url);
  set('r', txt(v.req)); set('ru', v.reqUrl);
}
function uniBody() {
  const g = k => $('#un-' + k).value.trim(), ie = g('i');
  return { id: UEDIT || undefined, n: g('n'), country: g('c'), city: g('t'), url: g('w'), lang: g('l'), eng: g('e'),
    ielts: ie, ieltsUrl: g('iu'), ieltsNote: ie ? '' : g('in'), ieltsNoteUrl: g('iu'),
    sat: g('sat'), satUrl: g('satu'),
    rd: g('d'), rdIntake: g('di'), rdUrl: g('du'), tuition: g('p'), cur: g('pc'), tuitionNote: g('pn'), tuitionUrl: g('pu'), req: g('r'), reqUrl: g('ru') };
}
function uniEdit(id) {
  const u = (UNIS && UNIS.unis || []).find(x => x.id === id); if (!u) return;
  UEDIT = id; uniForm(u); $('#un-h').textContent = 'Tahrirlash: ' + u.n; $('#un-x').hidden = false; $('#un-s').textContent = u.src === 'base' ? 'Saqlash (asosiy yozuvni almashtiradi)' : 'Saqlash';
  $('#un-m').className = 'msg'; $('#un-m').textContent = ''; $('#un-new').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#un-n').focus();
}
function uniReset() { UEDIT = ''; uniForm(null); $('#un-h').textContent = 'Yangi universitet'; $('#un-x').hidden = true; $('#un-s').textContent = 'Saqlash'; }
function renderUnis() {
  const box = $('#un-l-box');
  if (!UNIS) { box.innerHTML = emptyBox('inbox', 'Universitetlar yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#nc').textContent = ''; return; }
  const all = UNIS.unis || [], q = $('#un-q').value.trim().toLowerCase();
  $('#nc').textContent = all.length;
  $('#un-cl').innerHTML = [...new Set(all.map(u => u.country))].sort().map(c => `<option value="${esc(c)}">`).join('');
  $('#un-f').innerHTML = UNF.map(([k, l]) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${UFILT === k}">${l}${k === 'mine' ? ' (' + all.filter(u => u.src !== 'base').length + ')' : ''}</button>`).join('');
  $$('#un-f [data-k]').forEach(b => (b.onclick = () => { UFILT = b.dataset.k; ULM = 40; renderUnis(); }));
  let list = all.filter(u => (UFILT === 'all' || (UFILT === 'mine' ? u.src !== 'base' : u.src === 'base')) && (!q || (u.n + ' ' + u.country + ' ' + (u.city || '')).toLowerCase().includes(q)));
  if (!list.length) { box.innerHTML = emptyBox('inbox', q ? 'Hech narsa topilmadi' : 'Bu yerda hali universitet yo‘q', q ? 'Boshqa so‘z bilan qidirib ko‘ring.' : 'Yuqoridagi shakldan birinchisini qo‘shing.'); return; }
  const tot = list.length; list = list.slice(0, ULM);
  const bits = u => [u.ielts != null ? `<b>IELTS</b> ${u.ielts}` : u.ieltsNote ? '<b>IELTS</b> izoh' : '', u.sat != null ? `<b>SAT</b> ${u.sat}` : '', u.rd ? `<b>Muddat</b> ${esc(dm(u.rd))}.${esc(u.rd.slice(0, 4))}` : '', u.tuition ? `<b>Narx</b> ${fmt(u.tuition.amount)} ${esc(u.tuition.cur)}` : '', u.req ? '<b>Talab</b> bor' : ''].filter(Boolean);
  const SRC = { base: ['mute', 'Asosiy'], custom: ['ok', 'Qo‘shilgan'], override: ['warn', 'Almashtirilgan'] };
  box.innerHTML = `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Universitet</th><th>Ma’lumot</th><th>Manba</th><th></th></tr></thead><tbody>${list.map(u => {
    const [tone, lab] = SRC[u.src] || SRC.base;
    return `<tr><td data-l="Universitet"><b>${esc(u.n)}</b><div class="un-t"><span>${esc(u.country)}${u.city ? ', ' + esc(u.city) : ''}</span></div></td>
    <td data-l="Ma’lumot"><div class="un-t">${bits(u).map(x => `<span>${x}</span>`).join('') || '<span>—</span>'}</div></td>
    <td data-l="Manba"><span class="badge ${tone}">${lab}</span></td>
    <td class="a-td"><div class="row-a"><button class="btn sm" type="button" data-ed="${esc(u.id)}">Tahrirlash</button>${u.src === 'base' ? '' : `<button class="btn sm danger" type="button" data-rm="${esc(u.id)}">${u.src === 'override' ? 'Asliga qaytarish' : 'O‘chirish'}</button>`}</div></td></tr>`;
  }).join('')}</tbody></table></div>${tot > list.length ? `<div class="grant-f"><button class="btn" type="button" id="un-more">Yana ko‘rsatish (${tot - list.length})</button></div>` : ''}
    <p class="hint" style="margin-top:10px">Asosiy ro‘yxatdagi universitetni tahrirlasangiz, sizning versiyangiz uning o‘rniga chiqadi; “Asliga qaytarish” asl ma’lumotni tiklaydi.</p>`;
  $$('#un-l-box [data-ed]').forEach(b => (b.onclick = () => uniEdit(b.dataset.ed)));
  $$('#un-l-box [data-rm]').forEach(b => (b.onclick = async () => {
    const u = all.find(x => x.id === b.dataset.rm); if (!u) return;
    if (!await ask({ title: u.src === 'override' ? 'Asl ma’lumotga qaytarilsinmi?' : 'Universitet o‘chirilsinmi?', text: u.src === 'override' ? `${u.n}: sizning o‘zgarishlaringiz olib tashlanadi, asosiy ma’lumot qaytadi.` : `${u.n} saytdan olib tashlanadi. Foydalanuvchilarning arizalaridagi nomi o‘zgarmaydi.`, ok: u.src === 'override' ? 'Qaytarish' : 'O‘chirish', danger: true })) return;
    try { await call('POST', '/api/admin/uni/delete', { id: u.id }); toast(u.src === 'override' ? 'Asl ma’lumot tiklandi' : 'Universitet o‘chirildi'); if (UEDIT === u.id) uniReset(); loadUnis(); } catch (e) { toast(e.message, 'err'); }
  }));
  const more = $('#un-more'); if (more) more.onclick = () => { ULM += 60; renderUnis(); };
}
async function loadUnis() { try { UNIS = await call('GET', '/api/admin/unis'); } catch (e) { if (e.status === 401) { load(); return; } toast(e.message, 'err'); } renderUnis(); }
async function saveUni() {
  const m = $('#un-m'), btn = $('#un-s'); m.className = 'msg'; m.textContent = 'Saqlanmoqda…'; btn.disabled = true;
  try {
    const r = await call('POST', '/api/admin/uni', uniBody());
    m.className = 'msg ok'; m.textContent = ''; toast(r.created ? 'Universitet qo‘shildi: ' + r.uni.n : 'Yangilandi: ' + r.uni.n);
    uniReset(); await loadUnis();
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
  const bv = $('#nb').value, bw = (bv.trim().match(/\S+/g) || []).length, bm = NH.bodyMax || 60000;
  $('#nt-n').textContent = $('#nt').value.length + '/60'; $('#nb-n').textContent = bw + ' so‘z · ' + bv.length + '/' + bm; $('#nb').maxLength = bm;
  $('#pv-t').textContent = $('#nt').value.trim() || 'Sarlavha'; $('#pv-b').textContent = $('#nb').value.trim().slice(0, 240) || 'Xabar matni shu yerda ko‘rinadi.';
}
const chipN = (ok, tg) => `${ok}/${tg}`;
function renderNotes() {
  const l = NH.notes || []; $('#nh-c').textContent = l.length;
  $('#nh-l').innerHTML = l.length ? `<ul class="nh">${l.map(n => {
    const st = n.st || {}, who = n.aud === 'email' ? (n.who || 'o‘chirilgan hisob') : AUD_S[n.aud] || n.aud;
    const chips = [n.app ? `<span class="badge">${svg(IC.inbox, 'mini')}Sayt ichida · ${st.app || 0}</span>` : '', n.push && st.push ? `<span class="badge">${svg(IC.bell, 'mini')}Push · ${chipN(st.push.ok, st.push.targets)}</span>` : '', n.mail && st.mail ? `<span class="badge${st.mail.failed ? ' warn' : ''}">${svg(IC.mail, 'mini')}Email · ${chipN(st.mail.ok, st.mail.targets)}</span>` : ''].join('');
    return `<li><div class="nh-t"><b>${esc(n.title)}</b><span>${esc(n.body.length > 260 ? n.body.slice(0, 260) + '…' : n.body)}</span></div><div class="nh-m"><span class="mut">${esc(when(n.t))} · ${esc(who)}</span><span class="nh-c">${chips}</span>${n.app ? `<button class="btn sm danger" type="button" data-nd="${esc(n.id)}" title="Foydalanuvchilar panelidan olib tashlash">O‘chirish</button>` : ''}</div></li>`;
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
    const r = await withReauth(() => call('POST', '/api/admin/notify', { title, body, url, audience, channels: ch, ...(audience === 'email' ? { email } : {}) })), st = r.st || {}, ln = [];
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

/* ---------- Kirishlar: kim qachon kirgan ---------- */
let AUDIT = null, ACF = 'today';
const dayStart = back => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() - back * 864e5; };
const AC_FILTERS = [['today', 'Bugun', e => e.t >= dayStart(0)], ['yday', 'Kecha', e => e.t >= dayStart(1) && e.t < dayStart(0)], ['week', 'So‘nggi 7 kun', e => e.t >= dayStart(6)], ['all', 'Hammasi', () => true]];
const EV = { in: ['ok', 'Kod bilan kirdi'], use: ['ok', 'Seans bilan faol'], tok: ['mute', 'Token (rejalashtiruvchi)'], ask: ['mute', 'Kod so‘raldi'], bad: ['bad', 'Noto‘g‘ri kod'], deny: ['bad', 'Seanssiz urinish'] };
const whoCell = (who, cur) => (who ? (who[0] === '(' ? `<span class="badge mute">${esc(who.slice(1, -1))}</span>` : '<b>' + esc(who) + '</b>') : '<span class="badge mute">noma’lum</span>') + (cur ? ' <span class="badge ok">Siz</span>' : '');
const accessRow = e => { const [tone, label] = EV[e.ev] || (e.ok ? EV.in : EV.deny); return `<tr>
    <td data-l="Vaqt">${esc(when(e.t))}${e.seen && e.seen - e.t > 120000 ? `<br><small>oxirgi faollik: ${esc(rel(e.seen))}</small>` : ''}</td>
    <td data-l="Email">${whoCell(e.who, e.cur)}</td>
    <td data-l="IP">${esc(e.ip)}</td><td data-l="Qurilma" title="${esc(e.ua)}">${esc(deviceOf(e.ua) || e.ua || '—')}</td>
    <td data-l="Natija"><span class="badge ${tone}">${label}${e.n > 1 ? ' ×' + e.n : ''}</span></td></tr>`; };
async function revoke(id, self) {
  const all = id === 'all';
  if (!await ask({ title: all ? 'Hamma qurilmalardan chiqarilsinmi?' : self ? 'Shu qurilmadan chiqasizmi?' : 'Seans yopilsinmi?', text: all ? 'Barcha seanslar yopiladi, jumladan shu qurilma. Qayta kirish uchun emailga yangi kod kerak bo‘ladi.' : self ? 'Qayta kirish uchun emailga yangi kod kerak bo‘ladi.' : 'Bu qurilma panelga qayta kirishi uchun emailga yangi kod kerak bo‘ladi.', ok: all ? 'Hammasini yopish' : self ? 'Chiqish' : 'Yopish', danger: true })) return;
  try {
    const r = await call('POST', '/api/admin/session/revoke', all ? { all: true } : { id });
    if (r.self) { ME = ''; USERS = []; AUDIT = null; SEC = null; ATT = null; BLK = null; showLogin('', 1); return; }
    toast('Seans yopildi.'); load(true);
  } catch (e) { toast(e.message, 'err'); }
}
function renderAccess() {
  if (!AUDIT) { const e = emptyBox('info', 'Kirishlar yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#ac-p').innerHTML = e; $('#ac-h').innerHTML = e; $('#ac-k').innerHTML = ''; $('#ac-c').textContent = ''; $('#ac-pc').textContent = ''; $('#ac-hc').textContent = ''; $('#se-l').innerHTML = ''; $('#se-c').textContent = '0'; return; }
  const all = AUDIT.access || [], q = ($('#ac-q').value || '').trim().toLowerCase(), f = AC_FILTERS.find(x => x[0] === ACF) || AC_FILTERS[0];
  $('#ac-f').innerHTML = AC_FILTERS.map(([k, l, fn]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === ACF}">${l}<small>${all.filter(fn).length}</small></button>`).join('');
  $$('#ac-f [data-f]').forEach(b => (b.onclick = () => { ACF = b.dataset.f; renderAccess(); }));
  const list = all.filter(e => f[2](e) && (!q || (e.who + ' ' + e.ip + ' ' + deviceOf(e.ua)).toLowerCase().includes(q)));
  const okL = list.filter(e => e.ok), bad = list.filter(e => !e.ok);
  // odamlar bo'yicha jamlama: email bo'lsa — email, bo'lmasa — IP
  const ppl = new Map();
  for (const e of okL) {
    const k = e.who || 'ip:' + e.ip, p = ppl.get(k) || { who: e.who, n: 0, first: e.t, last: e.t, seen: 0, dev: new Set(), ips: new Set(), cur: false };
    p.n++; p.first = Math.min(p.first, e.t); p.last = Math.max(p.last, e.t); p.seen = Math.max(p.seen, e.seen || e.t); p.cur = p.cur || !!e.cur;
    p.dev.add(deviceOf(e.ua) || 'noma’lum'); p.ips.add(e.ip); ppl.set(k, p);
  }
  const people = [...ppl.values()].sort((a, b) => b.last - a.last), badN = bad.reduce((n, e) => n + (e.n || 1), 0);
  const ses = AUDIT.sessions || []; $('#se-c').textContent = ses.length;
  $('#se-l').innerHTML = ses.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Email</th><th>Kirgan</th><th>Oxirgi faollik</th><th>Qurilma</th><th>IP</th><th></th></tr></thead><tbody>${ses.map(x => `<tr>
    <td data-l="Email">${whoCell(x.email, x.cur)}</td><td data-l="Kirgan">${esc(when(x.t))}</td><td data-l="Faollik">${esc(rel(x.seen))}</td>
    <td data-l="Qurilma" title="${esc(x.ua)}">${esc(deviceOf(x.ua) || '—')}</td><td data-l="IP">${esc(x.ip)}</td>
    <td class="a-td"><div class="row-a"><button class="btn sm danger" type="button" data-sv="${esc(x.id)}" data-cur="${x.cur ? 1 : 0}">${x.cur ? 'Chiqish' : 'Yopish'}</button></div></td></tr>`).join('')}</tbody></table></div>` : emptyBox('users', 'Faol seans yo‘q', 'Kod bilan kirganlar shu yerda ko‘rinadi.');
  $$('#se-l [data-sv]').forEach(b => (b.onclick = () => revoke(b.dataset.sv, b.dataset.cur === '1')));
  $('#ac-c').textContent = f[1];
  $('#ac-k').innerHTML = kpi('users', people.length, 'kirgan odam', 'ok') + kpi('act', okL.length, 'kirish (sessiya)') + kpi('warn', badN, 'rad etilgan urinish', badN ? 'warn' : 'mut', badN) + kpi('clock', okL.length ? rel(okL[0].t) : '—', 'oxirgi kirish', 'mut');
  $('#ac-pc').textContent = people.length; $('#ac-hc').textContent = list.length;
  const none = all.length ? ['Bu davrda kirish yo‘q', 'Davrni yoki qidiruvni o‘zgartirib ko‘ring.'] : ['Hali kirish yozilmagan', 'Funksiya yoqilgandan keyingi kirishlar shu yerda ko‘rinadi.'];
  $('#ac-p').innerHTML = people.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Kim</th><th class="num">Kirishlar</th><th>Birinchi kirish</th><th>Oxirgi kirish</th><th>Qurilma</th><th>IP</th></tr></thead><tbody>${people.map(p => `<tr>
    <td data-l="Kim">${whoCell(p.who, p.cur)}</td>
    <td class="num" data-l="Kirishlar">${p.n}</td><td data-l="Birinchi kirish">${esc(when(p.first))}</td>
    <td data-l="Oxirgi kirish">${esc(when(p.last))}<br><small>faollik: ${esc(rel(p.seen))}</small></td>
    <td data-l="Qurilma">${esc([...p.dev].join(', '))}</td><td data-l="IP">${esc([...p.ips].join(', '))}</td></tr>`).join('')}</tbody></table></div>` : emptyBox('users', none[0], none[1]);
  $('#ac-h').innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Vaqt</th><th>Email</th><th>IP</th><th>Qurilma</th><th>Natija</th></tr></thead><tbody>${list.map(accessRow).join('')}</tbody></table></div>` : emptyBox('clock', none[0], none[1]);
  fx.scan($('#v-access'));
}

/* ---------- Yuborilgan xatlar: kimga, kim yubordi ---------- */
const MAIL_KIND = { verify: 'Tasdiqlash kodi', reset: 'Parolni tiklash', reply: 'Javob xati', test: 'Sinov xati', news: 'Xabar (yangilik)', mail: 'Xat' };
const byName = b => b === 'system' ? '<span class="badge mute">Tizim (avtomatik)</span>' : b === 'admin' ? '<span class="badge mute">Admin (email yozilmagan)</span>' : `<b>${esc(b)}</b>`;
function renderLog() {
  if (!AUDIT) { $('#lg-m').innerHTML = emptyBox('info', 'Jurnal yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#lg-mc').textContent = ''; return; }
  const ml = AUDIT.mail || [];
  $('#lg-mc').textContent = ml.length;
  $('#lg-ms').innerHTML = 'Har bir xat: kimga ketdi, kim yubordi va qaysi manzildan' + (AUDIT.from ? ` (hozir: <b>${esc(AUDIT.from)}</b>${AUDIT.provider ? ', ' + esc(AUDIT.provider) : ''})` : '') + '. Xat matni saqlanmaydi.';
  $('#lg-m').innerHTML = ml.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Vaqt</th><th>Kimga</th><th>Mavzu</th><th>Turi</th><th>Kim yubordi</th><th>Kimdan</th><th>Holat</th></tr></thead><tbody>${ml.map(m => `<tr>
    <td data-l="Vaqt">${esc(when(m.t))}</td><td data-l="Kimga">${esc(m.to)}</td><td data-l="Mavzu">${esc(m.subject)}</td>
    <td data-l="Turi">${esc(MAIL_KIND[m.kind] || m.kind || 'Xat')}</td><td data-l="Kim yubordi">${byName(m.by || 'system')}</td><td data-l="Kimdan">${esc(m.from || '—')}</td>
    <td data-l="Holat">${m.ok ? '<span class="badge ok">Yuborildi</span>' : `<span class="badge bad" title="${esc(m.err || '')}">Xato</span>`}</td></tr>`).join('')}</tbody></table></div>` : emptyBox('mail', 'Hali xat yuborilmagan', 'Tasdiqlash kodi, parolni tiklash, javob va xabar xatlari shu yerda ko‘rinadi.');
  fx.scan($('#v-log'));
}


/* ---------- Qayta tasdiqlash (step-up): xavfli amal oldidan emailga kelgan yangi kod ---------- */
/** Natija: true — tasdiqlandi, false — bekor qilindi */
function reauthDlg() {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ra" role="dialog" aria-modal="true" aria-labelledby="ra-t"><h3 id="ra-t">${svg(IC.warn)}Amalni tasdiqlang</h3>
      <p id="ra-s">Bu amal xavfli (ommaviy xat yoki xavfsizlik sozlamasi). Emailingizga yangi 6 xonali kod yuboramiz.</p>
      <input id="ra-c" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="6 xonali kod" hidden>
      <div class="msg" id="ra-m" role="alert"></div>
      <div class="acts"><button class="btn" type="button" data-x>Bekor</button><button class="btn primary" type="button" data-ok>Kod yuborish</button></div></div>`;
    const prev = document.activeElement, inp = $('#ra-c', bg), msg = $('#ra-m', bg), okb = $('[data-ok]', bg), xb = $('[data-x]', bg); let step = 1, busy = false;
    const out = v => { document.removeEventListener('keydown', key, true); bg.classList.add('out'); setTimeout(() => bg.remove(), 220); if (prev && prev.focus) try { prev.focus(); } catch (e) {} res(v); };
    const err = t => { msg.className = 'msg err'; msg.textContent = t; };
    const start = async () => {
      busy = true; okb.disabled = true; msg.className = 'msg'; msg.textContent = '';
      try { await call('POST', '/api/admin/reauth/start', {}); step = 2; inp.hidden = false; $('#ra-s', bg).textContent = 'Kod emailingizga yuborildi (10 daqiqa amal qiladi, bir marta ishlaydi). Uni kiriting.'; okb.textContent = 'Tasdiqlash'; inp.focus(); }
      catch (e) { err(e.message); }
      busy = false; okb.disabled = false;
    };
    const verify = async () => {
      const code = inp.value.replace(/\D/g, ''); if (code.length !== 6) return err('6 xonali kodni kiriting.');
      busy = true; okb.disabled = true; msg.className = 'msg'; msg.textContent = '';
      try { await call('POST', '/api/admin/reauth/verify', { code }); out(true); return; }
      catch (e) { err(e.message); inp.value = ''; inp.focus(); }
      busy = false; okb.disabled = false;
    };
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!busy) out(false); } };
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 6); if (inp.value.length === 6 && !busy) verify(); };
    okb.onclick = () => { if (!busy) (step === 1 ? start() : verify()); }; xb.onclick = () => { if (!busy) out(false); };
    bg.addEventListener('pointerdown', e => { if (e.target === bg && !busy) out(false); });
    document.addEventListener('keydown', key, true); document.body.appendChild(bg); okb.focus();
  });
}
/** fn() 403 {reauth:true} bilan rad etilsa — kod bilan tasdiqlatib, bir marta qayta urinadi */
async function withReauth(fn) {
  try { return await fn(); }
  catch (e) { if (e.status === 403 && e.reauth) { if (await reauthDlg()) return fn(); const c = new Error('Amal tasdiqlanmadi — bekor qilindi.'); c.status = 0; throw c; } throw e; }
}

/* ---------- Himoya holati ---------- */
const SEC_EV = {
  'admin.login': ['Admin kirdi', 'ok'], 'admin.login.ask': ['Kirish kodi soʻraldi', ''], 'admin.login.ask.denied': ['Ruxsatsiz email bilan kod soʻraldi', 'warn'], 'admin.login.bad': ['Notoʻgʻri kod', 'warn'],
  'admin.restrict': ['Admin kirishi cheklandi (15 daqiqa)', 'bad'], 'admin.logout': ['Admin chiqdi', ''], 'admin.session.revoke': ['Seans yopildi', 'warn'], 'admin.reauth.ask': ['Qayta tasdiqlash kodi soʻraldi', ''],
  'admin.reauth.ok': ['Amal kod bilan tasdiqlandi', 'ok'], 'admin.reauth.bad': ['Qayta tasdiqlashda notoʻgʻri kod', 'warn'], 'admin.mail.switch': ['Email yuborish holati oʻzgartirildi', 'warn'], 'admin.ip.blocked': ['IP bloklandi', 'warn'], 'admin.ip.unblocked': ['IP blokdan chiqarildi', ''], 'admin.notify': ['Xabar yuborildi', ''],
  'admin.user.blocked': ['Foydalanuvchi bloklandi', 'warn'], 'admin.user.unblocked': ['Foydalanuvchi blokdan chiqarildi', ''], 'auth.blocked': ['Bloklangan hisob kirishga yoki ro‘yxatdan o‘tishga urindi', 'warn'], 'mail.blocked': ['Xat bloklandi (kvota/oʻchirgich/manzil)', 'warn'], 'auth.lockout': ['Foydalanuvchi hisobi vaqtincha bloklandi', 'warn'], boot: ['Server ishga tushdi', ''],
};
const secLabel = ev => (SEC_EV[ev] && SEC_EV[ev][0]) || (ev.startsWith('alert.') ? 'Ogohlantirish' : ev.startsWith('admin.') ? 'Admin amali: ' + ev.slice(6) : ev);
const secTone = ev => (SEC_EV[ev] && SEC_EV[ev][1]) || (ev.startsWith('alert.') ? 'bad' : '');
const SC_FILTERS = [['all', 'Hammasi', () => true], ['alert', 'Ogohlantirishlar', e => e.ev.startsWith('alert.') || e.ev === 'admin.restrict'], ['login', 'Kirishlar', e => e.ev.startsWith('admin.login') || e.ev === 'admin.logout' || e.ev === 'admin.session.revoke'], ['mail', 'Email', e => e.ev.includes('mail') || e.ev === 'admin.notify']];
const bar = (used, max) => { const pc = Math.min(100, Math.round((used || 0) / Math.max(1, max) * 100)); return `<div class="qb" role="img" aria-label="${used} / ${max}"><i style="width:${pc}%" class="${pc >= 90 ? 'hi' : pc >= 60 ? 'md' : ''}"></i></div>`; };
function renderSecurity() {
  const sc = SEC; if (!sc) { $('#sc-k').innerHTML = ''; $('#sc-mq').innerHTML = emptyBox('info', 'Himoya holati yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#sc-e').innerHTML = ''; $('#sc-c').textContent = ''; $('#sc-ec').textContent = ''; $('#sc-sw').hidden = true; return; }
  const m = sc.mail || {}, ch = sc.chain || {}, ev = sc.events || [], alerts = ev.filter(e => e.ev.startsWith('alert.') && Date.now() - new Date(e.t).getTime() < 864e5).length;
  if (location.hash === '#security' && !$('#shell').hidden) markSeen('sec'); // bo‘lim ochiq — ko‘rilgan hisoblanadi
  const alertsNew = ev.filter(e => e.ev.startsWith('alert.') && Date.now() - new Date(e.t).getTime() < 864e5 && new Date(e.t).getTime() > seenAt('sec')).length;
  $('#sc-c').textContent = ch.ok ? 'Jurnal butun' : 'Jurnal buzilgan';
  $('#sc-k').innerHTML = kpi('check', ch.ok ? 'Butun' : 'BUZILGAN', 'Jurnal zanjiri (' + (ch.count || 0) + ' yozuv)', ch.ok ? 'ok' : 'warn', !ch.ok)
    + kpi('mail', m.off ? 'To‘xtatilgan' : 'Yoqiq', 'Foydalanuvchilarga email' + (m.envOff ? ' (serverda o‘chirilgan)' : ''), m.off ? 'warn' : 'ok', m.off)
    + kpi('warn', alerts, 'ogohlantirish (24 soat)', alerts ? 'warn' : 'mut', alerts)
    + kpi('users', sc.lockdown ? 'YOQILGAN' : 'Oddiy', 'Favqulodda rejim (ADMIN_LOCKDOWN)', sc.lockdown ? 'warn' : 'mut', sc.lockdown);
  $('#sc-mb').className = 'badge ' + (m.off ? 'bad' : 'ok'); $('#sc-mb').textContent = m.off ? 'To‘xtatilgan' : 'Yoqiq';
  $('#sc-mq').innerHTML = `<div class="qg"><div><span>Shu soatda</span><b>${fmt(m.hour && m.hour.used)} / ${fmt(m.hour && m.hour.max)}</b>${bar(m.hour && m.hour.used, m.hour && m.hour.max)}</div>
    <div><span>Shu sutkada</span><b>${fmt(m.day && m.day.used)} / ${fmt(m.day && m.day.max)}</b>${bar(m.day && m.day.used, m.day && m.day.max)}</div>
    <div><span>24 soatda yuborilgan</span><b>${fmt(m.sent24)}</b></div><div><span>24 soatda bloklangan</span><b>${fmt(m.blocked24)}</b></div>
    <div><span>Bitta manzilga</span><b>${fmt(m.rcpt && m.rcpt.hour)} / soat, ${fmt(m.rcpt && m.rcpt.day)} / sutka</b></div><div><span>Bir yuborishda</span><b>${fmt(m.bulkMax)} tagacha</b></div></div>`;
  const sw = $('#sc-sw'); sw.hidden = !!m.envOff; sw.className = 'btn sm ' + (m.off ? 'primary' : 'danger'); sw.textContent = m.off ? 'Xat yuborishni yoqish (kod kerak)' : 'Xat yuborishni to‘xtatish';
  const f = SC_FILTERS.find(x => x[0] === SCF) || SC_FILTERS[0];
  $('#sc-f').innerHTML = SC_FILTERS.map(([k, l, fn]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === SCF}">${l}<small>${ev.filter(fn).length}</small></button>`).join('');
  $$('#sc-f [data-f]').forEach(b => (b.onclick = () => { SCF = b.dataset.f; renderSecurity(); }));
  const list = ev.filter(f[2]); $('#sc-ec').textContent = list.length;
  const det = e => Object.entries(e).filter(([k]) => !['t', 'ev', 'seq', 'who', 'ip', 'ua', 'title'].includes(k)).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ');
  $('#sc-e').innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Vaqt</th><th>Voqea</th><th>Kim</th><th>IP</th><th>Tafsilot</th></tr></thead><tbody>${list.map(e => `<tr>
    <td data-l="Vaqt">${esc(when(e.t))}</td><td data-l="Voqea"><span class="badge ${secTone(e.ev) || 'mute'}">${esc(secLabel(e.ev))}</span></td>
    <td data-l="Kim">${esc(e.who || '—')}</td><td data-l="IP">${esc(e.ip || '—')}</td><td data-l="Tafsilot" title="${esc(e.ua || '')}">${e.title ? '<b>' + esc(e.title) + '</b> ' : ''}${det(e)}</td></tr>`).join('')}</tbody></table></div>` : emptyBox('check', 'Voqea yo‘q', 'Bu turdagi voqea hali yozilmagan.');
  const nn = $('#sec-nn'); nn.hidden = !(alertsNew || !ch.ok); nn.textContent = ch.ok ? alertsNew : '!';
  fx.scan($('#v-security'));
}
async function toggleMail() {
  const off = !(SEC && SEC.mail && SEC.mail.off), msg = $('#sc-sm');
  if (off && !await ask({ title: 'Xat yuborish to‘xtatilsinmi?', text: 'Foydalanuvchilarga (tasdiqlash kodi, parol tiklash, javoblar, xabarlar) xat ketmaydi. Sizning admin kirish kodlaringiz baribir keladi.', ok: 'To‘xtatish', danger: true })) return;
  const b = $('#sc-sw'); b.disabled = true; msg.className = 'msg'; msg.textContent = '';
  try { await withReauth(() => call('POST', '/api/admin/mail/switch', { off })); toast(off ? 'Xat yuborish to‘xtatildi.' : 'Xat yuborish yoqildi.'); await load(true); }
  catch (e) { if (e.status === 401) return load(); msg.className = 'msg err'; msg.textContent = e.message; }
  b.disabled = false;
}


/* ---------- Urinishlar: kim admin paneliga kirishga urindi ---------- */
const attSev = a => (a.c.ask | 0) + (a.c.bad | 0) + (a.c.deny | 0) + (a.c.lock | 0) + (a.c.blk | 0);
const AT_FILTERS = [['att', 'Urinishlar', a => attSev(a) > 0], ['ask', 'Ruxsatsiz email', a => a.c.ask > 0], ['bad', 'Noto‘g‘ri kod', a => a.c.bad > 0], ['deny', 'Seanssiz API', a => a.c.deny > 0], ['page', 'Faqat sahifani ochgan', a => attSev(a) === 0 && a.c.page > 0], ['all', 'Hammasi', () => true]];
const AT_PERIODS = [['day', '24 soat', 864e5], ['week', '7 kun', 7 * 864e5], ['all', 'Hammasi', Infinity]];
const AT_KIND = [['ask', 'Ruxsatsiz email bilan kod so‘radi', 'warn'], ['bad', 'Noto‘g‘ri kod', 'bad'], ['deny', 'Seanssiz admin API', 'warn'], ['lock', 'Favqulodda rejim vaqtida', 'warn'], ['blk', 'Bloklangan IP dan so‘rov', 'bad'], ['page', 'Sahifani ochdi', 'mute']];
function renderAttempts() {
  if (!ATT) { $('#at-k').innerHTML = ''; $('#at-t').innerHTML = emptyBox('info', 'Urinishlar yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#at-c').textContent = ''; $('#at-n').textContent = ''; $('#at-f').innerHTML = ''; $('#at-p').innerHTML = ''; $('#at-nn').hidden = true; return; }
  const now = Date.now(), all = ATT.attempts || [], per = AT_PERIODS.find(x => x[0] === ATP) || AT_PERIODS[1], inP = all.filter(a => now - a.last < per[2]), f = AT_FILTERS.find(x => x[0] === ATF) || AT_FILTERS[0];
  const q = ($('#at-q').value || '').trim().toLowerCase();
  $('#at-p').innerHTML = AT_PERIODS.map(([k, l, ms]) => `<button type="button" class="chip" data-p="${k}" aria-pressed="${k === ATP}">${l}</button>`).join('');
  $$('#at-p [data-p]').forEach(b => (b.onclick = () => { ATP = b.dataset.p; renderAttempts(); }));
  $('#at-f').innerHTML = AT_FILTERS.map(([k, l, fn]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === ATF}">${l}<small>${inP.filter(fn).length}</small></button>`).join('');
  $$('#at-f [data-f]').forEach(b => (b.onclick = () => { ATF = b.dataset.f; renderAttempts(); }));
  const d24 = all.filter(a => now - a.last < 864e5 && attSev(a) > 0 && !a.me), sum = k => d24.reduce((n, a) => n + a.c[k], 0), tot = d24.reduce((n, a) => n + attSev(a), 0), blocked = all.filter(a => a.now && !a.me).length;
  $('#at-k').innerHTML = kpi('warn', fmt(tot), 'urinish (24 soat)', tot ? 'warn' : 'mut', tot) + kpi('users', d24.length, 'turli IP (24 soat)', d24.length ? 'warn' : 'mut', d24.length)
    + kpi('act', fmt(sum('bad')), 'noto‘g‘ri kod (24 soat)', sum('bad') ? 'warn' : 'mut', sum('bad')) + kpi('clock', blocked, 'hozir cheklangan IP', blocked ? 'warn' : 'mut', blocked);
  if (location.hash === '#attempts' && !$('#shell').hidden) markSeen('att'); // bo‘lim ochiq — ko‘rilgan hisoblanadi
  const newIps = d24.filter(a => a.last > seenAt('att')).length, nn = $('#at-nn'); nn.hidden = !newIps; nn.textContent = newIps;
  $('#at-c').textContent = ATT.lockdown ? 'Favqulodda rejim yoqilgan' : (all.length ? all.length + ' ta IP yozilgan' : '');
  const list = inP.filter(a => f[2](a) && (!q || (a.ip + ' ' + a.em.map(x => x.e).join(' ')).toLowerCase().includes(q)));
  $('#at-n').textContent = list.length;
  const none = all.length ? ['Bu tanlovda urinish yo‘q', 'Davrni yoki turini o‘zgartirib ko‘ring.'] : ['Hali urinish yozilmagan', 'Admin paneliga kirishga urinish bo‘lsa, shu yerda ko‘rinadi.'];
  $('#at-t').innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>IP</th><th>Oxirgi urinish</th><th>Nima qildi</th><th>Yozgan emaili</th><th>Murojaat qilgan yo‘llar</th><th>Qurilma</th></tr></thead><tbody>${list.map(a => `<tr${attSev(a) >= 20 ? ' class="hot"' : ''}>
    <td data-l="IP"><b>${esc(a.ip)}</b>${a.me ? ' <span class="badge mute">Siz</span>' : ''}<div class="at-act">${a.blocked ? `<span class="badge bad" title="${a.blocked.until ? 'Gacha: ' + esc(when(a.blocked.until)) : 'Doimiy'}">Bloklangan${a.blocked.scope === 'site' ? ' (butun sayt)' : ''}${a.blocked.until ? ': ' + esc(untilLeft(a.blocked.until)) : ''}</span><button class="btn sm" type="button" data-ub="${esc(a.ip)}">Blokdan chiqarish</button>` : a.me ? '' : `<button class="btn sm danger" type="button" data-bk="${esc(a.ip)}">Bloklash</button>`}</div></td>
    <td data-l="Oxirgi urinish" title="Birinchi urinish: ${esc(when(a.first))}">${esc(whenS(a.last))}<br><small>${esc(rel(a.last))}</small></td>
    <td data-l="Nima qildi"><div class="at-b">${a.now ? '<span class="badge bad">Hozir cheklangan</span>' : ''}${AT_KIND.filter(([k]) => a.c[k]).map(([k, l, t]) => `<span class="badge ${t}">${esc(l)} × ${a.c[k]}</span>`).join('') || '—'}</div></td>
    <td data-l="Yozgan emaili"><div class="at-em">${a.em.length ? a.em.map(x => `<span>${esc(x.e)} × ${x.n}${x.known ? ' <span class="badge ok" title="Bu email ruxsat etilgan, lekin kod noto‘g‘ri kiritilgan">ruxsat etilgan</span>' : ''}</span>`).join('') : '—'}</div></td>
    <td data-l="Yo‘llar"><div class="at-px">${a.px.length ? a.px.map(x => `<span><code>${esc(x.p)}</code> × ${x.n}</span>`).join('') : '—'}</div></td>
    <td data-l="Qurilma" title="${esc((a.ua[0] || {}).u || '')}">${esc(deviceOf((a.ua[0] || {}).u) || '—')}${a.ua.length > 1 ? ` <small>+${a.ua.length - 1}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>` : emptyBox('check', none[0], none[1]);
  const bl = ATT.blocks || [];
  $('#at-bl').hidden = !bl.length; $('#at-bn').textContent = bl.length;
  $('#at-bt').innerHTML = bl.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>IP</th><th>Bloklangan</th><th>Muddati</th><th></th></tr></thead><tbody>${bl.map(x => `<tr><td data-l="IP"><b>${esc(x.ip)}</b> <span class="badge ${x.scope === 'site' ? 'bad' : 'warn'}">${x.scope === 'site' ? 'butun sayt' : 'faqat admin'}</span>${x.reason ? `<br><small>${esc(x.reason)}</small>` : ''}</td><td data-l="Bloklangan">${esc(whenS(x.t))}<br><small>${esc(x.by || '')}</small></td><td data-l="Muddati">${x.until ? esc(when(x.until)) + '<br><small>' + esc(untilLeft(x.until)) + '</small>' : 'Doimiy'}</td><td class="a-td"><div class="row-a"><button class="btn sm" type="button" data-ub="${esc(x.ip)}">Blokdan chiqarish</button></div></td></tr>`).join('')}</tbody></table></div>` : '';
  $$('#v-attempts [data-bk]').forEach(b => (b.onclick = () => blockIp(b.dataset.bk)));
  $$('#v-attempts [data-ub]').forEach(b => (b.onclick = () => unblockIp(b.dataset.ub)));
  fx.scan($('#v-attempts'));
}
const untilLeft = t => { const m = Math.max(0, Math.round((t - Date.now()) / 60000)); return m >= 2880 ? Math.round(m / 1440) + ' kun qoldi' : m >= 120 ? Math.round(m / 60) + ' soat qoldi' : m + ' daqiqa qoldi'; };
const DUR = [[60, '1 soat'], [1440, '24 soat'], [10080, '7 kun'], [43200, '30 kun'], [0, 'Doimiy (o‘zingiz olmaguncha)']];
const durOpts = def => DUR.map(([v, l]) => `<option value="${v}"${v === def ? ' selected' : ''}>${l}</option>`).join('');
/** Bloklash oynasi. o: {title, text (HTML, esc qilingan), scope: IP qamrovi tanlansinmi, reason: sabab maydoni, ip: foydalanuvchi IP si (belgi qutisi), def: standart muddat}.
 *  Natija: {minutes (0 — doimiy), scope, reason, withIp} yoki null (bekor). */
function blockDlg(o) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal dg" role="dialog" aria-modal="true" aria-labelledby="bk-t"><h3 id="bk-t">${svg(IC.warn)}${o.title}</h3>
      <p>${o.text}</p>
      ${o.scope ? `<label class="rp-l" for="bk-s">Qamrov</label><select id="bk-s"><option value="site" selected>Butun sayt (saytga umuman kira olmaydi)</option><option value="admin">Faqat admin paneli (sayt ishlayveradi)</option></select>` : ''}
      <label class="rp-l" for="bk-d">Muddat</label><select id="bk-d">${durOpts(o.def === undefined ? 1440 : o.def)}</select>
      ${o.reason ? `<label class="rp-l" for="bk-rs">Sabab (ixtiyoriy)</label><input id="bk-rs" class="rp-i" type="text" maxlength="120" autocomplete="off" placeholder="Masalan: spam">` : ''}
      ${o.ip ? `<label class="ck"><input id="bk-ip" type="checkbox"><span>Uning IP si (<b>${esc(o.ip)}</b>) ni ham butun sayt bo‘yicha bloklash <small class="mut">— bir IP dan boshqa odamlar ham kirishi mumkin</small></span></label>` : ''}
      <div class="acts"><button class="btn" type="button" data-x>Bekor</button><button class="btn danger" type="button" data-ok>${o.ok || 'Bloklash'}</button></div></div>`;
    const prev = document.activeElement, key = e => { if (e.key === 'Escape') done(null); };
    const done = v => { document.removeEventListener('keydown', key); bg.classList.add('out'); setTimeout(() => bg.remove(), 220); if (prev && prev.focus) try { prev.focus(); } catch (e) {} res(v); };
    bg.addEventListener('click', e => { if (e.target === bg) done(null); });
    $('[data-x]', bg).onclick = () => done(null);
    $('[data-ok]', bg).onclick = () => done({ minutes: Number($('#bk-d', bg).value), scope: o.scope ? $('#bk-s', bg).value : 'admin', reason: o.reason ? $('#bk-rs', bg).value.trim() : '', withIp: !!(o.ip && $('#bk-ip', bg).checked) });
    document.addEventListener('keydown', key); document.body.appendChild(bg); $('[data-ok]', bg).focus();
  });
}
async function blockIp(ip) {
  const r = await blockDlg({ title: 'IP bloklansinmi?', scope: true, reason: true, text: `<b>${esc(ip)}</b> — <b>Butun sayt</b> tanlansa, bu manzildan saytga umuman kirib bo‘lmaydi (ro‘yxatdan o‘tish, kirish, sahifalar). <b>Faqat admin paneli</b> tanlansa, /admin va admin API yopiladi, sayt ishlayveradi. Sizning IP ingiz va faol admin seansi IP si bloklanmaydi.` }); if (!r) return;
  try { await call('POST', '/api/admin/ip/block', { ip, minutes: r.minutes, scope: r.scope, reason: r.reason }); toast('IP bloklandi: ' + ip); await load(true); } catch (e) { if (e.status === 401) return load(); toast(e.message, 'err'); }
}
async function unblockIp(ip) {
  if (!await ask({ title: 'Blokdan chiqarilsinmi?', text: ip + ' yana saytga va admin sahifasiga kira oladi.', ok: 'Blokdan chiqarish' })) return;
  try { await call('POST', '/api/admin/ip/unblock', { ip }); toast('Blokdan chiqarildi: ' + ip); await load(true); } catch (e) { if (e.status === 401) return load(); toast(e.message, 'err'); }
}
async function blockUser(email) {
  const u = USERS.find(x => x.email === email) || {};
  const r = await blockDlg({ title: 'Foydalanuvchi bloklansinmi?', reason: true, def: 0, ip: u.ip || '', text: `<b>${esc(email)}</b> saytga kira olmaydi, qayta ro‘yxatdan o‘ta olmaydi, parolni tiklay olmaydi, unga xat va push yuborilmaydi. Ma’lumotlari o‘chmaydi — blokdan chiqarsangiz hammasi qaytadi.` }); if (!r) return;
  try {
    const j = await call('POST', '/api/admin/user/block', { email, minutes: r.minutes, reason: r.reason, withIp: r.withIp });
    toast('Bloklandi: ' + email + (j.ips && j.ips.length ? ' + IP' : '') + (r.withIp && j.ipSkipped ? ' (IP bloklanmadi: bu sizning/admin IP si yoki chegara)' : '')); await load(true);
  } catch (e) { if (e.status === 401) return load(); toast(e.message, 'err'); }
}
async function unblockUser(key) {
  const u = USERS.find(x => x.email === key), ipOn = !!(u && u.ipBlocked);
  if (!await ask({ title: 'Blokdan chiqarilsinmi?', text: key + ' yana saytga kira oladi.' + (ipOn ? ' Uning bloklangan IP si (' + u.ip + ') ham ochiladi.' : ''), ok: 'Blokdan chiqarish' })) return;
  try { await call('POST', '/api/admin/user/unblock', { email: key, withIp: ipOn }); toast('Blokdan chiqarildi: ' + key); await load(true); } catch (e) { if (e.status === 401) return load(); toast(e.message, 'err'); }
}
/* ---------- Bloklash bo‘limi ---------- */
const bkWhen = x => `${esc(whenS(x.t))}<br><small>${esc(x.by || '')}</small>`, bkUntil = x => x.until ? esc(when(x.until)) + '<br><small>' + esc(untilLeft(x.until)) + '</small>' : 'Doimiy';
function renderBlocks() {
  const b = BLK;
  if (!$('#bk-du').options.length) $('#bk-du').innerHTML = durOpts(0);
  if (!b) { $('#bk-c').textContent = ''; $('#bk-et').innerHTML = emptyBox('info', 'Bloklar yuklanmadi', 'Keyinroq yangilab ko‘ring.'); $('#bk-it').innerHTML = ''; return; }
  $('#bk-c').textContent = b.emails.length + b.ips.length ? `${b.emails.length} email · ${b.ips.length} IP` : 'Bloklar yo‘q';
  $('#bk-en').textContent = b.emails.length; $('#bk-in').textContent = b.ips.length;
  $('#bk-et').innerHTML = b.emails.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>Email / domen</th><th class="num">Hisoblar</th><th>Sabab</th><th>Bloklangan</th><th>Muddati</th><th></th></tr></thead><tbody>${b.emails.map(x => `<tr>
    <td data-l="Email"><b>${esc(x.e)}</b> ${x.kind === 'domain' ? '<span class="badge warn">domen</span>' : ''}</td><td class="num" data-l="Hisoblar">${x.users}</td>
    <td data-l="Sabab"><div class="bk-why">${esc(x.reason) || '<span class="mut">—</span>'}</div></td><td data-l="Bloklangan">${bkWhen(x)}</td><td data-l="Muddati">${bkUntil(x)}</td>
    <td class="a-td"><div class="row-a"><button class="btn sm" type="button" data-ue="${esc(x.key)}">Blokdan chiqarish</button></div></td></tr>`).join('')}</tbody></table></div>` : emptyBox('check', 'Bloklangan email yo‘q', 'Foydalanuvchilar bo‘limidan yoki yuqoridagi shakldan bloklashingiz mumkin.');
  $('#bk-it').innerHTML = b.ips.length ? `<div class="tbl-wrap"><table class="tbl rs"><thead><tr><th>IP</th><th>Qamrov</th><th>Sabab</th><th class="num">Urinish</th><th>Bloklangan</th><th>Muddati</th><th></th></tr></thead><tbody>${b.ips.map(x => `<tr>
    <td data-l="IP"><b>${esc(x.ip)}</b></td><td data-l="Qamrov"><span class="badge ${x.scope === 'site' ? 'bad' : 'warn'}">${x.scope === 'site' ? 'Butun sayt' : 'Faqat admin'}</span></td>
    <td data-l="Sabab"><div class="bk-why">${esc(x.reason) || '<span class="mut">—</span>'}</div></td><td class="num" data-l="Urinish" title="${x.last ? 'Oxirgisi: ' + esc(when(x.last)) : ''}">${x.hits || 0}</td>
    <td data-l="Bloklangan">${bkWhen(x)}</td><td data-l="Muddati">${bkUntil(x)}</td>
    <td class="a-td"><div class="row-a"><button class="btn sm" type="button" data-ub="${esc(x.ip)}">Blokdan chiqarish</button></div></td></tr>`).join('')}</tbody></table></div>` : emptyBox('check', 'Bloklangan IP yo‘q', 'IP ni Urinishlar bo‘limidan yoki yuqoridagi shakldan bloklashingiz mumkin.');
  $$('#v-blocks [data-ue]').forEach(el => (el.onclick = () => unblockUser(el.dataset.ue)));
  $$('#v-blocks [data-ub]').forEach(el => (el.onclick = () => unblockIp(el.dataset.ub)));
  fx.scan($('#v-blocks'));
}
const BK_T = { email: ['Email', 'ism@gmail.com'], domain: ['Domen', 'spam-domen.com'], ip: ['IP manzil', '203.0.113.7'] };
$('#bk-ty').onchange = () => { const t = $('#bk-ty').value; $('#bk-sw').hidden = t !== 'ip'; $('#bk-vl').textContent = BK_T[t][0]; $('#bk-v').placeholder = BK_T[t][1]; $('#bk-v').focus(); };
$('#bk-go').onclick = async () => {
  const t = $('#bk-ty').value, v = $('#bk-v').value.trim(), m = $('#bk-m'), minutes = Number($('#bk-du').value), reason = $('#bk-r').value.trim(), site = t === 'ip' && $('#bk-sc').value === 'site';
  const bad = txt => { m.className = 'msg err'; m.textContent = txt; $('#bk-v').focus(); };
  m.className = 'msg'; m.textContent = '';
  if (!v) return bad('Qiymatni kiriting.');
  let url = '/api/admin/user/block', body = { minutes, reason };
  if (t === 'ip') { if (!/^[0-9a-f:.]{2,45}$/i.test(v) || !/[.:]/.test(v)) return bad('IP manzilni to‘g‘ri kiriting (masalan: 203.0.113.7).'); url = '/api/admin/ip/block'; body = { ip: v, minutes, reason, scope: $('#bk-sc').value }; }
  else if (t === 'domain') { const d = v.replace(/^@+/, ''); if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(d)) return bad('Domenni to‘g‘ri kiriting (masalan: spam-domen.com).'); body.email = '@' + d; }
  else { if (!MAIL_RE.test(v)) return bad('Emailni to‘g‘ri kiriting (masalan: ism@gmail.com).'); body.email = v; }
  if ((t === 'domain' || site) && !await ask({ title: t === 'domain' ? 'Butun domen bloklansinmi?' : 'IP butun sayt bo‘yicha bloklansinmi?', text: t === 'domain' ? `${body.email} manzillaridagi barcha hisoblar saytga kira olmaydi va shu domen bilan ro‘yxatdan o‘tib bo‘lmaydi.` : `${v} dan saytga umuman kirib bo‘lmaydi. Bir IP dan bir necha kishi chiqishi mumkin.`, ok: 'Bloklash', danger: true })) return;
  $('#bk-go').disabled = true;
  try { await call('POST', url, body); $('#bk-v').value = ''; $('#bk-r').value = ''; m.className = 'msg ok'; m.textContent = 'Bloklandi: ' + v; toast('Bloklandi: ' + v); await load(true); }
  catch (e) { if (e.status === 401) { $('#bk-go').disabled = false; return load(); } bad(e.message); }
  $('#bk-go').disabled = false;
};
$('#bk-v').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#bk-go').click(); } };

/* ---------- yuklash ---------- */
let LEM = '', resendTimer = 0;
/** Kirish oynasi: 1 — email, 2 — emailga kelgan kod */
function showLogin(msg, step = 1) {
  $('#shell').hidden = true; $('#lg').hidden = false; document.title = 'Admin — UniDoue';
  $('#lf').hidden = step !== 1; $('#lf2').hidden = step !== 2;
  const m = $(step === 1 ? '#lm' : '#lm2'); m.className = msg ? 'msg err' : 'msg'; m.textContent = msg || '';
  $('#lb').disabled = false; $('#lb2').disabled = false;
}
function resendCooldown(sec = 30) {
  clearInterval(resendTimer); const b = $('#lr'); let n = sec; b.disabled = true;
  const tick = () => { if (n <= 0) { clearInterval(resendTimer); b.disabled = false; b.textContent = 'Kodni qayta yuborish'; return; } b.textContent = `Qayta yuborish (${n--} s)`; };
  tick(); resendTimer = setInterval(tick, 1000);
}
async function askCode(email, again) {
  const step = again ? 2 : 1, m = $(again ? '#lm2' : '#lm'), btn = $(again ? '#lr' : '#lb');
  m.className = 'msg'; m.textContent = ''; btn.disabled = true;
  try {
    await call('POST', '/api/admin/login/start', { email });
    LEM = email; showLogin('', 2); $('#lf2-s').textContent = 'Agar bu email admin sifatida ruxsat etilgan bo‘lsa, unga 6 xonali kod yuborildi. Kod 10 daqiqa amal qiladi va bir marta ishlaydi.';
    $('#ac').value = ''; $('#ac').focus(); resendCooldown(30);
  } catch (e) { showLogin(e.message, step); if (again) $('#lr').disabled = false; }
}
let busy = false;
async function load(silent) {
  if (busy) return; busy = true;
  const rf = $('#rf'); rf.classList.add('spin'); if (!silent) $('#st').textContent = 'Yuklanmoqda…';
  try {
    const [rq, us, st, od, pr, nh, un, fk, au, sc, at, bk] = await Promise.all([call('GET', '/api/admin/requests'), call('GET', '/api/admin/users'), call('GET', '/api/admin/stats'),
      call('GET', '/api/admin/orders').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/promos').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/notes').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/unis').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/feedback').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/audit').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/security').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/attempts').catch(e => { if (e.status === 401) throw e; return null; }),
      call('GET', '/api/admin/blocks').catch(e => { if (e.status === 401) throw e; return null; })]);
    REQS = rq.requests || []; USERS = us.users || []; STATS = st; ORDERS = od; PROMOS = pr; UNIS = un; FBK = fk; AUDIT = au; SEC = sc; ATT = at; BLK = bk; if (nh) NH = nh; loadedAt = Date.now();
    const first = $('#shell').hidden; $('#lg').hidden = true; $('#shell').hidden = false;
    renderOverview(st); renderRequests(); renderUsers(); renderPayments(); renderPromos(); renderUnis(); renderFeedback(); renderNotes(); renderAccess(); renderSecurity(); renderAttempts(); renderBlocks(); renderLog(); audienceUi(); $('#me').textContent = ME || 'Admin';
    $('#st').textContent = 'Yangilandi: ' + when(Date.now()).split(', ')[1].split(' ').pop();
    if (first) route(); else fx.scan($('#kpis'));
  } catch (e) {
    if (e.status === 401) { ME = ''; showLogin('Seans tugagan yoki yopilgan. Qayta kiring.'); }
    else if ($('#shell').hidden) showLogin(e.message);
    else { $('#st').textContent = 'Yangilab bo‘lmadi'; if (!silent) toast(e.message, 'err'); }
  }
  rf.classList.remove('spin'); busy = false;
}

/* ---------- hodisalar ---------- */
$('#lf').onsubmit = ev => {
  ev.preventDefault();
  const em = $('#ae').value.trim().toLowerCase();
  if (!MAIL_RE.test(em)) { const m = $('#lm'); m.className = 'msg err'; m.textContent = 'Emailni to‘g‘ri kiriting (masalan, ism@gmail.com).'; return $('#ae').focus(); }
  askCode(em, false);
};
$('#lf2').onsubmit = async ev => {
  ev.preventDefault();
  const code = $('#ac').value.replace(/\D/g, ''), m = $('#lm2');
  if (code.length !== 6) { m.className = 'msg err'; m.textContent = '6 xonali kodni kiriting.'; return $('#ac').focus(); }
  m.className = 'msg'; m.textContent = ''; $('#lb2').disabled = true;
  try { const j = await call('POST', '/api/admin/login/verify', { email: LEM, code }); ME = j.email || LEM; clearInterval(resendTimer); $('#ac').value = ''; load(); }
  catch (e) { showLogin(e.message, 2); $('#ac').value = ''; $('#ac').focus(); }
};
$('#ac').oninput = () => { const v = $('#ac').value.replace(/\D/g, '').slice(0, 6); $('#ac').value = v; if (v.length === 6) $('#lf2').requestSubmit(); };
$('#lr').onclick = () => askCode(LEM, true);
$('#lx').onclick = () => { clearInterval(resendTimer); showLogin('', 1); $('#ae').focus(); };
$('#rf').onclick = () => load();
$('#lo').onclick = async () => { try { await call('POST', '/api/admin/logout'); } catch (e) {} ME = ''; USERS = []; AUDIT = null; SEC = null; ATT = null; BLK = null; showLogin('', 1); $('#ae').focus(); };
$('#bg').onclick = () => document.body.classList.toggle('nav-open');
$('#scrim').onclick = () => document.body.classList.remove('nav-open');
$('#uq').oninput = () => { ULIM = 100; renderUsers(); };
$('#ac-q').oninput = renderAccess; $('#se-all').onclick = () => revoke('all', true); $('#sc-sw').onclick = toggleMail; $('#at-q').oninput = renderAttempts;
$('#pg').onclick = () => { const e = $('#pe').value.trim().toLowerCase(); if (!e) { $('#pm').className = 'msg err'; $('#pm').textContent = 'Emailni kiriting.'; return; } give(e, $('#pp').value, parseInt($('#pd').value, 10) || 30, $('#pm')); };
$('#un-s').onclick = saveUni; $('#un-x').onclick = uniReset; $('#un-q').oninput = () => { ULM = 40; renderUnis(); };
$('#mb').onclick = createPromo; $('#mk-r').onclick = () => { $('#mk').value = pmRand(); $('#mk').focus(); };
$('#md').oninput = () => $$('#md-p [data-d]').forEach(x => x.setAttribute('aria-pressed', x.dataset.d === $('#md').value));
$('#mk').onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); createPromo(); } };
$('#na').innerHTML = AUD.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
$('#na').onchange = audienceUi; $('#nq').oninput = estimate; $('#nt').oninput = preview; $('#nb').oninput = preview; $('#ns').onclick = sendNote; $$('#nch input').forEach(i => (i.onchange = estimate));
preview();
setInterval(() => { if (ME && !document.hidden && !$('#shell').hidden && Date.now() - loadedAt > 55000) load(true); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && ME && !$('#shell').hidden && Date.now() - loadedAt > 30000) load(true); });
(async () => { // panel ochilganda: seans bormi? Bor boʻlsa — kod soʻralmaydi (chiqmaguncha)
  try { const r = await fetch('/api/admin/session', { credentials: 'same-origin' }); if (r.ok) { const j = await r.json(); ME = j.email || ''; if (ME) return load(); } } catch (e) {}
  showLogin('', 1); $('#ae').focus();
})();

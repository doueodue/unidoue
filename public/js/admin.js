const $ = s => document.querySelector(s);
let TOKEN = '';
try { TOKEN = sessionStorage.getItem('unidoue:adm') || ''; } catch (e) {}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'], p2 = n => String(n).padStart(2, '0');
const when = v => { const d = new Date(v); return isNaN(d) ? '' : `${d.getDate()}-${MON[d.getMonth()]}, ${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };

async function call(method, url, body) {
  const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + TOKEN, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Xato (' + r.status + ')'); e.status = r.status; throw e; }
  return j;
}
async function give(email, plan, days, out) {
  out.className = 'msg'; out.textContent = 'Kuting…';
  try { const j = await call('POST', '/api/admin/plan', { email, plan, days }); out.className = 'msg ok'; out.textContent = `Tayyor: ${j.email} → ${j.plan}` + (j.planUntil ? ` (${when(j.planUntil)} gacha)` : ''); load(); }
  catch (e) { out.className = 'msg err'; out.textContent = e.message; }
}
let USERS = [];
const dm = d => d ? d.slice(8) + '.' + d.slice(5, 7) : '—';
function renderStats(st) {
  const box = (n, l, tone) => `<div class="card" style="padding:14px;min-width:130px;flex:1"><div style="font-size:26px;font-weight:700${tone ? ';color:' + tone : ''}">${n}</div><div class="hint">${l}</div></div>`;
  const max = Math.max(1, ...st.rows.map(r => Math.max(r.active, r.signups)));
  const bars = st.rows.map(r => `<div style="flex:1;text-align:center;min-width:0"><div style="height:80px;display:flex;align-items:flex-end;justify-content:center;gap:2px"><div title="Faol: ${r.active}" style="width:40%;background:#a8501a;height:${Math.max(r.active ? 4 : 0, r.active / max * 80)}px"></div><div title="Yangi: ${r.signups}" style="width:40%;background:#e0b070;height:${Math.max(r.signups ? 4 : 0, r.signups / max * 80)}px"></div></div><div class="hint" style="font-size:10px">${dm(r.d)}</div></div>`).join('');
  const warn = [!st.mail && 'Xat yuborish ulanmagan (tasdiqlash va parol tiklash ishlamaydi)', !st.ai && 'AI ulanmagan', st.mail && !st.verifyOn && 'Email tasdiqlash o‘chiq', !st.payCard && 'PAY_CARD sozlanmagan (karta raqami ko‘rinmaydi)'].filter(Boolean);
  $('#stats').innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">${box(st.activeToday, 'bugun kirganlar')}${box(st.signupsToday, 'bugun yangi hisob')}${box(st.active7, 'oxirgi 7 kunda faol')}${box(st.total, 'jami foydalanuvchi')}${box(st.pro, 'Pro faol')}${box(st.plus || 0, 'Plus faol')}${box(st.pending, 'Pro so‘rovi kutmoqda', st.pending ? '#a8501a' : '')}${box(st.proExpiring, 'pullik tarif 7 kunda tugaydi', st.proExpiring ? '#a8501a' : '')}${box(st.unverified, 'email tasdiqlanmagan')}${box(st.aiMonth, 'bu oy AI kredit')}${box(Math.round((st.aiTokensMonth || 0) / 1000) + 'k', 'bu oy AI token')}</div>
  <div class="card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px"><b>Oxirgi 14 kun</b><span class="hint"><span style="color:#a8501a">■</span> faol · <span style="color:#e0b070">■</span> yangi hisob</span></div><div style="display:flex;gap:3px;margin-top:8px">${bars}</div>
  <p class="hint" style="margin:8px 0 0">${st.since ? 'Faollik hisobi ' + esc(st.since) + ' dan boshlab yuritiladi, undan oldingi kirishlar saqlanmagan.' : 'Faollik hisobi endi boshlandi: bugundan keyin kirgan foydalanuvchilar sanaladi.'}</p></div>
  ${warn.length ? `<div class="notice info" style="margin-bottom:12px"><div><b>Sozlash kerak:</b><br>${warn.map(esc).join('<br>')}</div></div>` : ''}`;
}
function renderUsers() {
  const q = ($('#uq').value || '').trim().toLowerCase(), now = Date.now();
  const list = USERS.filter(u => !q || (u.email + ' ' + u.name).toLowerCase().includes(q));
  $('#uc').textContent = list.length === USERS.length ? USERS.length : list.length + ' / ' + USERS.length;
  $('#ul').innerHTML = list.length ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Ism</th><th>Email</th><th>Tarif</th><th>Muddati</th><th>Oxirgi kirish</th><th>AI</th><th>Kod</th><th></th></tr></thead><tbody>${list.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}${u.verified ? '' : ' <span class="badge mute">tasdiqlanmagan</span>'}</td><td>${esc(u.plan || 'free')}</td><td>${u.planUntil ? esc(when(u.planUntil)) + (u.plan !== 'free' && u.planUntil < now ? ' (tugagan)' : u.planUntil - now < 7 * 864e5 && u.plan !== 'free' ? ' ⚠' : '') : '—'}</td><td>${u.seen ? esc(dm(u.seen)) : '—'}</td><td>${u.ai || 0}</td><td>${esc(u.ref || '')}${u.requested ? ' <span class="badge">so‘rov</span>' : ''}</td><td>${u.plan !== 'free' ? `<button class="btn sm" data-rv="${esc(u.email)}">Tarifni bekor qilish</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">Foydalanuvchi topilmadi.</p>';
  document.querySelectorAll('#ul [data-rv]').forEach(b => (b.onclick = () => { if (confirm(`${b.dataset.rv} uchun tarif bekor qilinsinmi? U Free tarifga o‘tadi.`)) give(b.dataset.rv, 'free', 1, $('#pm')); }));
}
async function load() {
  $('#st').textContent = 'Yuklanmoqda…';
  try {
    const [rq, us, st] = await Promise.all([call('GET', '/api/admin/requests'), call('GET', '/api/admin/users'), call('GET', '/api/admin/stats')]);
    USERS = us.users; renderStats(st); renderUsers();
    $('#lf').hidden = true; $('#panel').hidden = false;
    const reqs = rq.requests.slice().reverse();
    $('#rc').textContent = reqs.length;
    $('#rl').innerHTML = reqs.length ? reqs.map(r => `<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(r.name)}</b><span class="hint">${esc(when(r.ts))}</span></div>
      <div class="hint">${esc(r.service)} · ${esc(r.contact)}${r.email ? ' · hisob: ' + esc(r.email) : ''}</div>
      ${r.message ? `<p style="white-space:pre-wrap;margin:8px 0">${esc(r.message)}</p>` : ''}
      ${r.email ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${['plus', 'pro', 'free'].map(p => `<button class="btn sm" data-e="${esc(r.email)}" data-p="${p}">${p === 'free' ? 'Free' : p === 'plus' ? 'Plus 30 kun' : 'Pro 30 kun'}</button>`).join('')}</div>` : ''}</div>`).join('') : '<p class="hint">Hali so‘rov yo‘q.</p>';
    $('#st').textContent = 'Yangilandi: ' + when(Date.now());
    document.querySelectorAll('#rl [data-e]').forEach(b => (b.onclick = () => { if (confirm(`${b.dataset.e} ga ${b.dataset.p} berilsinmi?`)) give(b.dataset.e, b.dataset.p, 30, $('#pm')); }));
  } catch (e) {
    if (e.status === 401) { try { sessionStorage.removeItem('unidoue:adm'); } catch (x) {} TOKEN = ''; $('#panel').hidden = true; $('#lf').hidden = false; $('#lm').className = 'msg err'; $('#lm').textContent = 'Token noto‘g‘ri.'; }
    else { $('#st').textContent = ''; $('#lf').hidden = false; $('#lm').className = 'msg err'; $('#lm').textContent = e.message; }
  }
}
$('#lf').onsubmit = ev => { ev.preventDefault(); TOKEN = $('#tk').value.trim(); if (!TOKEN) return; try { sessionStorage.setItem('unidoue:adm', TOKEN); } catch (e) {} $('#tk').value = ''; load(); };
$('#rf').onclick = load;
$('#uq').oninput = renderUsers;
$('#lo').onclick = () => { try { sessionStorage.removeItem('unidoue:adm'); } catch (e) {} TOKEN = ''; $('#panel').hidden = true; $('#lf').hidden = false; };
$('#pg').onclick = () => { const e = $('#pe').value.trim().toLowerCase(); if (!e) { $('#pm').className = 'msg err'; $('#pm').textContent = 'Emailni kiriting.'; return; } give(e, $('#pp').value, parseInt($('#pd').value, 10) || 30, $('#pm')); };
if (TOKEN) load();

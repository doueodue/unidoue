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
async function load() {
  $('#st').textContent = 'Yuklanmoqda…';
  try {
    const [rq, us] = await Promise.all([call('GET', '/api/admin/requests'), call('GET', '/api/admin/users')]);
    $('#lf').hidden = true; $('#panel').hidden = false;
    const reqs = rq.requests.slice().reverse();
    $('#rc').textContent = reqs.length; $('#uc').textContent = us.users.length;
    $('#rl').innerHTML = reqs.length ? reqs.map(r => `<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(r.name)}</b><span class="hint">${esc(when(r.ts))}</span></div>
      <div class="hint">${esc(r.service)} · ${esc(r.contact)}${r.email ? ' · hisob: ' + esc(r.email) : ''}</div>
      ${r.message ? `<p style="white-space:pre-wrap;margin:8px 0">${esc(r.message)}</p>` : ''}
      ${r.email ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${['pro', 'free'].map(p => `<button class="btn sm" data-e="${esc(r.email)}" data-p="${p}">${p === 'free' ? 'Free' : p === 'plus' ? 'Plus 30 kun' : 'Pro 30 kun'}</button>`).join('')}</div>` : ''}</div>`).join('') : '<p class="hint">Hali so‘rov yo‘q.</p>';
    $('#ul').innerHTML = us.users.length ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Ism</th><th>Email</th><th>Tarif</th><th>Muddati</th></tr></thead><tbody>${us.users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.plan)}</td><td>${u.planUntil ? esc(when(u.planUntil)) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">Foydalanuvchi yo‘q.</p>';
    $('#st').textContent = 'Yangilandi: ' + when(Date.now());
    document.querySelectorAll('#rl [data-e]').forEach(b => (b.onclick = () => { if (confirm(`${b.dataset.e} ga ${b.dataset.p} berilsinmi?`)) give(b.dataset.e, b.dataset.p, 30, $('#pm')); }));
  } catch (e) {
    if (e.status === 401) { try { sessionStorage.removeItem('unidoue:adm'); } catch (x) {} TOKEN = ''; $('#panel').hidden = true; $('#lf').hidden = false; $('#lm').className = 'msg err'; $('#lm').textContent = 'Token noto‘g‘ri.'; }
    else { $('#st').textContent = ''; $('#lf').hidden = false; $('#lm').className = 'msg err'; $('#lm').textContent = e.message; }
  }
}
$('#lf').onsubmit = ev => { ev.preventDefault(); TOKEN = $('#tk').value.trim(); if (!TOKEN) return; try { sessionStorage.setItem('unidoue:adm', TOKEN); } catch (e) {} $('#tk').value = ''; load(); };
$('#rf').onclick = load;
$('#lo').onclick = () => { try { sessionStorage.removeItem('unidoue:adm'); } catch (e) {} TOKEN = ''; $('#panel').hidden = true; $('#lf').hidden = false; };
$('#pg').onclick = () => { const e = $('#pe').value.trim().toLowerCase(); if (!e) { $('#pm').className = 'msg err'; $('#pm').textContent = 'Emailni kiriting.'; return; } give(e, $('#pp').value, parseInt($('#pd').value, 10) || 30, $('#pm')); };
if (TOKEN) load();

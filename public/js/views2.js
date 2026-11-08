import { $, $$, S, api, ls, esc, toast, svg, fmtDate, daysLeft, catalog, upsell, errorBox } from './core.js';
import { getProfile, DOCS } from './views1.js';

const TIER = { safety: 'Safety', target: 'Target', reach: 'Reach' };
const profBody = () => { const { Q } = getProfile(); return { gpa: Q.gpa, sc: Q.sc, sat: Q.sat, ielts: Q.ielts, ex: Q.ex, ach: Q.ach }; };
const hasInput = () => { const { Q } = getProfile(); return !!(Q.gpa || Q.sat || Q.ielts); };
const needProfile = () => `<div class="card empty"><b>Avval natijalaringizni kiriting</b>GPA, SAT yoki IELTS ni profilda to‘ldiring.<br><a class="btn primary" style="margin-top:14px" href="#/profile">Profilga o‘tish</a></div>`;
const vb = (ok, t = 'tekshirilgan') => `<span class="badge ${ok ? 'ok' : 'mute'}" title="${ok ? 'Rasmiy manbadan' : 'Namuna qiymat, rasmiy sayt bilan tekshiring'}">${ok ? t : 'taxminiy'}</span>`;

/* ================= UNIVERSITET QIDIRUVI ================= */
export async function finder(el) {
  if (!hasInput()) return browse(el);
  const cat = await catalog(), verifiedN = cat.filter(c => c.satV).length; let q = '', tier = '', vOnly = false, timer = 0, seq = 0;
  el.innerHTML = `<div class="page-h"><div><h2>Universitet <em>qidiruvi</em></h2><p>Profilingizga mos universitetlar Safety, Target va Reach bo‘yicha guruhlanadi.</p></div></div>
  <div class="notice info" style="margin-bottom:16px">${svg('info')}<div>Hozir bazada <b>${cat.length}</b> ta AQSh universiteti bor, shundan <b>${verifiedN}</b> tasining ko‘rsatkichlari rasmiy manbadan tekshirilgan. Qolganlari “taxminiy” deb belgilangan. Mamlakat, o‘qish narxi va reyting bo‘yicha filtrlar rasmiy ma’lumot yig‘ilgach qo‘shiladi.</div></div>
  <div class="card" style="margin-bottom:16px"><div class="row" style="align-items:end"><div><label class="f" for="f-q">Qidirish</label><input id="f-q" type="text" placeholder="Universitet nomi" maxlength="60"></div><label style="display:flex;gap:8px;align-items:center;padding-bottom:10px;cursor:pointer"><input type="checkbox" id="f-v"> Faqat tekshirilgan ma’lumot</label></div>
  <div class="tabs" id="f-t" role="tablist" style="margin:14px 0 0">${[['', 'Hammasi'], ['safety', 'Safety'], ['target', 'Target'], ['reach', 'Reach']].map(([v, t]) => `<button role="tab" data-t="${v}" aria-selected="${v === ''}">${t}<span class="c"></span></button>`).join('')}</div></div>
  <div id="f-r"></div>`;
  const out = $('#f-r', el);
  const load = async () => {
    const my = ++seq; out.innerHTML = '<div class="grid g2">' + '<div class="card"><div class="sk" style="height:90px"></div></div>'.repeat(4) + '</div>';
    try {
      const r = await api('/api/finder', 'POST', { profile: profBody(), q, tier, verifiedOnly: vOnly }); if (my !== seq) return;
      $$('#f-t button', el).forEach(b => { const k = b.dataset.t; b.querySelector('.c').textContent = k ? ' ' + r.counts[k] : ''; });
      if (!r.items.length) { out.innerHTML = '<div class="card empty"><b>Hech narsa topilmadi</b>Filtrni o‘zgartirib ko‘ring.</div>'; return; }
      out.innerHTML = `<div class="grid g2">${r.items.map(u => `<article class="card hover"><div style="display:flex;gap:14px;align-items:flex-start"><div class="score">${u.score}</div><div style="flex:1;min-width:0"><h3 style="margin:0">${esc(u.n)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="badge ${u.tier}">${TIER[u.tier]}</span>${vb(u.verified, 'SAT tekshirilgan')}${u.deadline ? `<span class="badge mute">${fmtDate(u.deadline)}${u.deadlineVerified ? '' : ' (taxminiy)'}</span>` : ''}</div></div></div>
        ${u.why ? `<p style="margin:14px 0 6px;font-weight:600">${esc(u.level)}</p><ul style="margin:0;padding-left:18px;color:var(--ink-2);font-size:13.5px;display:grid;gap:4px">${u.why.map(w => `<li>${esc(w.t)}</li>`).join('')}</ul><p class="hint">${esc(u.basis)}${u.confident ? '' : ' · bu daraja taxminiy'}</p>`
          : `<div class="lock" style="margin-top:12px;border-radius:12px"><div class="lock-in"><p>Nima uchun mos ekani: SAT, GPA va IELTS bo‘yicha tushuntirish shu yerda ko‘rinadi.</p><p>Universitet ko‘rsatkichlari bilan solishtirish batafsil yoziladi.</p></div><div class="lock-cta"><button class="btn primary sm" data-up>Tushuntirishni ochish (Plus)</button></div></div>`}
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn sm" data-add="${esc(u.id)}">Arizaga qo‘shish</button><button class="btn sm" data-cmp="${esc(u.id)}">Solishtirish</button><a class="btn sm" href="#/predictor?u=${encodeURIComponent(u.id)}">Bashorat</a></div></article>`).join('')}</div>
        ${r.shown < r.total ? `<div class="card" style="margin-top:18px;text-align:center"><b>${r.shown} / ${r.total} natija ko‘rsatilmoqda.</b><p class="sub" style="margin:6px 0 12px">Free tarifda eng mos ${r.limit} ta universitet ko‘rinadi.</p><a class="btn primary" href="#/pricing">Hammasini ko‘rish</a></div>` : ''}`;
      $$('[data-up]', out).forEach(b => (b.onclick = () => upsell('finder_adv', 'Har bir universitet nima uchun mos ekanini ko‘rish Plus tarifida.')));
      $$('[data-add]', out).forEach(b => (b.onclick = () => addApp(cat.find(c => c.id === b.dataset.add))));
      $$('[data-cmp]', out).forEach(b => (b.onclick = () => addCmp(b.dataset.cmp)));
    } catch (e) { if (my === seq) { out.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', out); if (b) b.onclick = load; } }
  };
  $('#f-q', el).oninput = e => { clearTimeout(timer); timer = setTimeout(() => { q = e.target.value.trim(); load(); }, 350); };
  $('#f-v', el).onchange = e => { vOnly = e.target.checked; load(); };
  $$('#f-t button', el).forEach(b => (b.onclick = () => { tier = b.dataset.t; $$('#f-t button', el).forEach(x => x.setAttribute('aria-selected', x === b)); load(); }));
  load();
}
function addApp(c) {
  const apps = ls.get('qabul:apps', []), lim = S.account.limits.apps;
  if (apps.some(a => a.n === c.n)) return toast(c.n + ' allaqachon arizalar ro‘yxatida.');
  if (apps.length >= lim) return upsell('tracker', `Free tarifda ${lim} tagacha ariza saqlanadi.`);
  apps.push({ n: c.n, d: c.rd, s: 0, docs: DOCS.map(() => false) }); ls.set('qabul:apps', apps); toast(c.n + ' arizalarga qo‘shildi.');
}
function addCmp(id) {
  const ids = ls.get('qabul:cmp', []), lim = S.account.limits.compare;
  if (ids.includes(id)) return toast('Allaqachon solishtirish ro‘yxatida.');
  if (ids.length >= lim) return upsell('compare', `${S.account.plan.toUpperCase()} tarifida bir vaqtda ${lim} ta universitet solishtiriladi.`);
  ids.push(id); ls.set('qabul:cmp', ids); toast('Solishtirishga qo‘shildi (' + ids.length + '/' + lim + ').');
}

/* ================= STIPENDIYALAR ================= */
export async function scholarships(el) {
  el.innerHTML = `<div class="page-h"><div><h2><em>Stipendiya</em> qidiruvi</h2><p>Tasdiqlangan stipendiyalar: talablar, muddat va moliyalashtirish turi.</p></div></div>`;
  if (!S.account.features.includes('scholarships')) {
    el.innerHTML += `<div class="card lock"><div class="lock-in"><h3>Stipendiyalar ro‘yxati</h3><p>Talablar, muddatlar, summa va ariza havolalari shu yerda.</p><p>Filtrlar: mamlakat, moliyalashtirish turi.</p></div><div class="lock-cta"><b>Stipendiya qidiruvi Plus tarifida</b><a class="btn primary" href="#/pricing">Tariflarni ko‘rish</a></div></div>`; return;
  }
  el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px"><div class="row"><div><label class="f" for="s-q">Qidirish</label><input id="s-q" type="text" maxlength="80" placeholder="Nomi yoki tashkilot"></div><div><label class="f" for="s-c">Mamlakat</label><select id="s-c"><option value="">Hammasi</option><option>AQSh</option><option>Buyuk Britaniya</option><option>Germaniya</option><option>Janubiy Koreya</option><option>Turkiya</option><option>Xalqaro</option></select></div><div><label class="f" for="s-f">Moliyalashtirish</label><select id="s-f"><option value="">Hammasi</option><option value="full">To‘liq</option><option value="partial">Qisman</option></select></div></div></div><div id="s-r"></div>`);
  const out = $('#s-r', el); let t = 0;
  const load = async () => {
    out.innerHTML = '<div class="card"><div class="sk" style="height:80px"></div></div>';
    try {
      const p = new URLSearchParams({ q: $('#s-q', el).value.trim(), country: $('#s-c', el).value, funding: $('#s-f', el).value }), r = await api('/api/scholarships?' + p);
      if (!r.total) { out.innerHTML = `<div class="card empty"><b>Stipendiyalar bazasi hozircha to‘ldirilmoqda</b>Faqat rasmiy manbadan tekshirilgan stipendiyalar qo‘shiladi, shuning uchun ro‘yxat hozircha bo‘sh.</div>`; return; }
      if (!r.items.length) { out.innerHTML = '<div class="card empty"><b>Hech narsa topilmadi</b>Filtrni o‘zgartiring.</div>'; return; }
      out.innerHTML = `<div class="grid g2">${r.items.map(x => `<article class="card"><h3>${esc(x.name)}</h3><p class="sub">${esc(x.provider || '')}</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><span class="badge ${x.funding === 'full' ? 'ok' : ''}">${x.funding === 'full' ? 'To‘liq' : 'Qisman'}</span>${(x.countries || []).map(c => `<span class="badge mute">${esc(c)}</span>`).join('')}${x.deadline ? `<span class="badge ${daysLeft(x.deadline) <= 30 ? 'warn' : 'mute'}">Muddat: ${fmtDate(x.deadline)}</span>` : ''}</div>${x.amount ? `<p><b>Summa:</b> ${esc(x.amount)}</p>` : ''}${x.eligibility ? `<p><b>Kimlar uchun:</b> ${esc(x.eligibility)}</p>` : ''}${x.requirements ? `<p><b>Talablar:</b> ${esc(x.requirements)}</p>` : ''}${/^https:\/\//.test(x.url || '') ? `<a class="btn sm" style="margin-top:12px" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Rasmiy sahifa</a>` : ''}${x.verifiedAt ? `<p class="hint">Tekshirilgan: ${esc(x.verifiedAt)}</p>` : ''}</article>`).join('')}</div>`;
    } catch (e) { out.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', out); if (b) b.onclick = load; }
  };
  $('#s-q', el).oninput = () => { clearTimeout(t); t = setTimeout(load, 350); }; $('#s-c', el).onchange = load; $('#s-f', el).onchange = load; load();
}

/* ================= QABUL BASHORATI ================= */
export async function predictor(el) {
  el.innerHTML = `<div class="page-h"><div><h2>Qabul <em>bashorati</em></h2><p>Profilingiz tanlangan universitet ko‘rsatkichlariga qanchalik mos ekanini baholaydi.</p></div></div>`;
  if (!hasInput()) { el.insertAdjacentHTML('beforeend', needProfile()); return; }
  const cat = await catalog(), pre = decodeURIComponent((location.hash.split('?u=')[1] || '')), start = cat.some(c => c.id === pre) ? pre : cat[0].id;
  el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px"><div class="row" style="align-items:end"><div><label class="f" for="pr-u">Universitet</label><select id="pr-u">${cat.map(c => `<option value="${esc(c.id)}" ${c.id === start ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></div><button class="btn primary" id="pr-go">Baholash</button></div></div><div id="pr-r"></div>`);
  const out = $('#pr-r', el);
  const run = async () => {
    out.innerHTML = '<div class="card"><div class="sk" style="height:120px"></div></div>';
    try {
      const r = await api('/api/predict', 'POST', { id: $('#pr-u', el).value, profile: profBody() });
      out.innerHTML = `<div class="grid g-dash"><section class="card s5" style="text-align:center"><div class="stat" style="align-items:center"><b style="font-size:56px">${r.score}<small style="font-size:20px;color:var(--muted)">/100</small></b><span>${esc(r.n)}</span></div><div class="bar" style="margin:14px 0"><i style="width:${r.score}%"></i></div><p><b>${esc(r.full ? r.level : r.verdict)}</b></p>${r.full ? `<p style="margin-top:8px"><span class="badge ${r.tier.tier}">${TIER[r.tier.tier]}</span></p><p class="hint">${esc(r.tier.basis)}</p>` : ''}</section>
      <section class="card s7">${r.full ? `<h3>Ball qanday hisoblandi</h3><p class="sub">Har bir mezon uchun hissa.</p>${r.parts.map(x => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><b>${esc(x.k)}</b><span>${x.v}/100 · ulushi ${x.w}%</span></div><div class="bar" style="margin:6px 0"><i style="width:${x.v}%"></i></div><small style="color:var(--muted)">${esc(x.t)}</small></div>`).join('')}
        <h3 style="margin-top:14px">Nimani yaxshilash kerak</h3>${r.advice.length ? `<ul style="padding-left:18px;color:var(--ink-2)">${r.advice.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : '<p class="sub">Qo‘shimcha tavsiya yo‘q.</p>'}
        <div style="display:flex;gap:6px;flex-wrap:wrap">${vb(r.verified.sat, 'SAT oralig‘i tekshirilgan')}${vb(r.verified.acceptance, 'qabul darajasi tekshirilgan')}${vb(r.verified.deadline, 'muddat tekshirilgan')}</div>`
        : `<div class="lock"><div class="lock-in"><h3>Ball qanday hisoblandi</h3><p>SAT, GPA, IELTS va faoliyat bo‘yicha batafsil tahlil.</p><p>Nimani yaxshilash kerakligi haqida tavsiyalar.</p><p>Safety / Target / Reach darajasi.</p></div><div class="lock-cta"><b>To‘liq tahlil Plus tarifida</b><a class="btn primary" href="#/pricing">Tariflarni ko‘rish</a></div></div>`}</section></div>
      <div class="notice" style="margin-top:16px">${svg('info')}<div>${esc(r.disclaimer)}</div></div>`;
    } catch (e) { out.innerHTML = errorBox(e.message); }
  };
  $('#pr-go', el).onclick = run; run();
}

/* ================= SOLISHTIRISH ================= */
export async function compare(el) {
  const cat = await catalog(), lim = S.account.limits.compare; let ids = ls.get('qabul:cmp', []).slice(0, lim);
  const draw = async () => {
    el.innerHTML = `<div class="page-h"><div><h2>Universitetlarni <em>solishtirish</em></h2><p>Bir vaqtda ${lim} tagacha universitet (${S.account.plan.toUpperCase()} tarifi).</p></div></div>
    <div class="card" style="margin-bottom:16px"><div class="row" style="align-items:end"><div><label class="f" for="c-u">Universitet qo‘shish</label><select id="c-u">${cat.filter(c => !ids.includes(c.id)).map(c => `<option value="${esc(c.id)}">${esc(c.n)}</option>`).join('')}</select></div><button class="btn primary" id="c-add">Qo‘shish</button></div></div><div id="c-r"></div>`;
    $('#c-add', el).onclick = () => { const v = $('#c-u', el).value; if (ids.length >= lim) return upsell('compare', `${S.account.plan.toUpperCase()} tarifida ${lim} ta universitet solishtiriladi.`); ids.push(v); ls.set('qabul:cmp', ids); draw(); };
    const out = $('#c-r', el);
    if (!ids.length) { out.innerHTML = '<div class="card empty"><b>Solishtirish uchun universitet tanlang</b>Kamida ikkitasini qo‘shing.</div>'; return; }
    try {
      const r = await api('/api/compare', 'POST', { ids }), it = r.items, row = (t, f) => `<tr><th>${t}</th>${it.map(c => `<td>${f(c)}</td>`).join('')}</tr>`;
      out.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${it.map(c => `<th style="text-transform:none;font-size:14px;color:var(--ink)">${esc(c.n)}<br><button class="link-btn" data-rm="${esc(c.id)}" style="font-size:12px;font-weight:500;color:var(--bad)">Olib tashlash</button></th>`).join('')}</tr></thead><tbody>
      ${row('Joylashuv', c => esc(c.country))}${row('SAT (o‘rta 50%)', c => `${c.sat[0]}–${c.sat[1]} ${vb(c.satV)}`)}${row('Qabul darajasi', c => (c.acc != null ? (c.acc * 100).toFixed(1) + '% ' + vb(c.accV) : '<span style="color:var(--muted)">tekshirilmagan</span>'))}${row('IELTS', c => (c.ielts != null ? c.ielts + (c.ieltsKind === 'recommended' ? ' (tavsiya)' : '') + ' ' + vb(c.ieltsV) : c.ieltsKind === 'none_stated' ? 'minimal ball ko‘rsatilmagan ' + vb(true) : '—'))}${row('Muddat (Regular)', c => fmtDate(c.rd) + ' ' + vb(c.rdV))}${row('Erta muddatlar', c => (c.early && c.early.length ? c.early.map(e => esc(e.plan) + ': ' + fmtDate(e.date)).join('<br>') : '—'))}</tbody></table></div>
      <div class="notice info" style="margin-top:16px">${svg('info')}<div>O‘qish narxi, reyting va stipendiyalar ustunlari rasmiy ma’lumot yig‘ilgach qo‘shiladi. “Taxminiy” ko‘rsatkichlarni universitetning rasmiy saytida tekshiring.</div></div>`;
      $$('[data-rm]', out).forEach(b => (b.onclick = () => { ids = ids.filter(x => x !== b.dataset.rm); ls.set('qabul:cmp', ids); draw(); }));
    } catch (e) { out.innerHTML = errorBox(e.message); }
  };
  draw();
}

/** Natija kiritilmagan bo'lsa: oddiy ro'yxat (moslik balisiz). */
async function browse(el) {
  const cat = await catalog();
  el.innerHTML = `<div class="page-h"><div><h2>Universitet <em>qidiruvi</em></h2><p>Barcha universitetlar ro‘yxati. Moslik bali va Safety / Target / Reach darajasini ko‘rish uchun natijalaringizni kiriting.</p></div><a class="btn primary" href="#/profile">Natijalarni kiritish</a></div>
  <div class="card" style="margin-bottom:16px"><label class="f" for="b-q">Qidirish</label><input id="b-q" type="text" maxlength="60" placeholder="Universitet nomi"></div><div id="b-r"></div>`;
  const out = $('#b-r', el), draw = q => {
    const rows = cat.filter(c => c.n.toLowerCase().includes(q.toLowerCase()));
    out.innerHTML = rows.length ? `<div class="grid g2">${rows.map(c => `<article class="card hover"><h3>${esc(c.n)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${vb(c.satV, 'SAT tekshirilgan')}<span class="badge mute">SAT ${c.sat[0]}–${c.sat[1]}</span><span class="badge mute">Muddat: ${fmtDate(c.rd)}${c.rdV ? '' : ' (taxminiy)'}</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-add="${esc(c.id)}">Arizaga qo‘shish</button><button class="btn sm" data-cmp="${esc(c.id)}">Solishtirish</button></div></article>`).join('')}</div>` : '<div class="card empty"><b>Hech narsa topilmadi</b></div>';
    $$('[data-add]', out).forEach(b => (b.onclick = () => addApp(cat.find(c => c.id === b.dataset.add))));
    $$('[data-cmp]', out).forEach(b => (b.onclick = () => addCmp(b.dataset.cmp)));
  };
  let t = 0; $('#b-q', el).oninput = e => { clearTimeout(t); t = setTimeout(() => draw(e.target.value.trim()), 200); }; draw('');
}

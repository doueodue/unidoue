import { $, $$, S, api, ls, esc, toast, svg, fmtDate, daysLeft, catalog, upsell, errorBox, modal, reportError } from './core.js';
import { getProfile, DOCS } from './views1.js';
import { t } from './i18n.js';
import { intlPanel, intlCount } from './views4.js';
const ctry = c => (c ? `<div class="ctry">${esc(t(c))}</div>` : '');

const TIER = { safety: 'Safety', target: 'Target', reach: 'Reach' };
const profBody = () => { const { Q } = getProfile(); return { gpa: Q.gpa, sc: Q.sc, sat: Q.sat, ielts: Q.ielts, ex: Q.ex, ach: Q.ach }; };
const hasInput = () => { const { Q } = getProfile(); return !!(Q.gpa || Q.sat || Q.ielts); };
const needProfile = () => `<div class="card empty"><b>Avval natijalaringizni kiriting</b>GPA, SAT yoki IELTS ni profilda to‘ldiring.<br><a class="btn primary" style="margin-top:14px" href="#/profile">Profilga o‘tish</a></div>`;
const vb = (ok, t = 'tekshirilgan') => `<span class="badge ${ok ? 'ok' : 'mute'}" title="${ok ? 'Rasmiy manbadan' : 'Namuna qiymat, rasmiy sayt bilan tekshiring'}">${ok ? t : 'taxminiy'}</span>`;

/* ===== Universitet haqida (hammaga bepul; faqat katalogdagi tasdiqlangan ma'lumot) ===== */
const safeUrl = u => (/^https:\/\//.test(u || '') ? u : '');
const lnk = (u, txt) => (safeUrl(u) ? ` <a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${txt}</a>` : '');
export async function aboutUni(id) {
  const c = (await catalog()).find(x => x.id === id); if (!c) return;
  const src = c.src || {}, row = (k, v) => `<div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-bottom:1px solid var(--line)"><span style="color:var(--muted)">${k}</span><span style="text-align:right">${v}</span></div>`;
  const rows = [];
  rows.push(row('Davlat', esc(t(c.country || ''))));
  if (c.city) rows.push(row('Shahar', esc(c.city + (c.state ? ', ' + c.state : ''))));
  if (c.address) rows.push(row('Manzil', esc(c.address)));
  if (c.site) rows.push(row('Rasmiy sayt', `<a href="${esc(safeUrl(c.site))}" target="_blank" rel="noopener noreferrer">${esc(c.site.replace(/^https:\/\//, ''))}</a>`));
  rows.push(row('SAT oralig‘i', c.sat ? `${c.sat[0]}–${c.sat[1]} ${vb(c.satV)}${lnk(src.sat, 'manba')}` : 'ma’lumot yo‘q'));
  if (c.acc != null) rows.push(row('Qabul darajasi', `${c.acc}% ${vb(c.accV)}${lnk(src.accept, 'manba')}`));
  if (c.gpa) rows.push(row('O‘rtacha GPA', `${c.gpa} ${vb(c.gpaV)}`));
  rows.push(row('IELTS', c.ielts ? `${c.ielts} ${vb(c.ieltsV)}${lnk(src.ielts, 'manba')}` : (c.ieltsKind === 'none_stated' ? 'minimum e’lon qilinmagan' + lnk(src.ielts, 'rasmiy sahifa') : 'ma’lumot yo‘q')));
  if (c.rd) rows.push(row('Ariza muddati', `${fmtDate(c.rd)} ${vb(c.rdV)}${lnk(src.deadline, 'manba')}`));
  (c.early || []).forEach(e => rows.push(row('Erta muddat (' + esc(e.plan) + ')', fmtDate(e.date))));
  const majors = Array.isArray(c.majors) && c.majors.length ? `<h4 style="margin:14px 0 6px">Yo‘nalishlar</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${c.majors.map(m => `<span class="badge mute">${esc(m)}</span>`).join('')}</div>${lnk(c.majorsUrl, 'to‘liq ro‘yxat (rasmiy sayt)')}` : '';
  const body = `<div style="max-height:62vh;overflow:auto">${rows.join('')}${majors}<p class="hint" style="margin-top:12px">“taxminiy” belgisi qiymat hali rasmiy manba bilan tasdiqlanmaganini bildiradi. Ariza topshirishdan oldin muddat va talablarni universitetning rasmiy sahifasida tekshiring.</p></div>`;
  const v = await modal({ title: c.n, body, actions: [{ label: 'Yopish', value: 0 }, { label: 'Xato topdingizmi?', value: 2 }, { label: 'Arizaga qo‘shish', value: 1, cls: 'primary' }] });
  if (v === 1) addApp(c);
  if (v === 2) reportError(c.n);
}

/* ================= UNIVERSITET QIDIRUVI ================= */
/** SAT o‘lchagich: universitetning o‘rta 50% oralig‘i (rangli yo‘lak) va foydalanuvchining SAT balli (nuqta). */
const SAT_LO = 900, SAT_HI = 1600, PAGE = 12;
const satPos = v => Math.max(0, Math.min(100, ((v - SAT_LO) / (SAT_HI - SAT_LO)) * 100));
function satMeter(c, mine) {
  if (!c || !Array.isArray(c.sat) || c.sat.length < 2) return '';
  const a = satPos(c.sat[0]), b = satPos(c.sat[1]), me = +mine >= 400 && +mine <= 1600 ? satPos(+mine) : null;
  return `<div class="satm" role="img" aria-label="${t('SAT oralig‘i')}: ${c.sat[0]}–${c.sat[1]}${me != null ? ', ' + t('Siz') + ' ' + mine : ''}"><div class="satm-t"><i class="satm-b" style="left:${a.toFixed(1)}%;width:${Math.max(2, b - a).toFixed(1)}%"></i>${me != null ? `<i class="satm-me" style="left:${me.toFixed(1)}%"><em>${t('Siz')} ${esc(mine)}</em></i>` : ''}</div>
    <div class="satm-h"><span>${t('SAT oralig‘i')}</span><b>${c.sat[0]}–${c.sat[1]}</b></div></div>`;
}
async function usFinder(el) {
  const cat = await catalog(), verifiedN = cat.filter(c => c.satV).length, mySat = getProfile().Q.sat; let q = '', tier = '', vOnly = false, timer = 0, seq = 0, items = [], shown = PAGE;
  el.innerHTML = `<div class="card ftool"><label class="fsearch">${svg('search')}<input id="f-q" type="text" placeholder="Universitet nomi" aria-label="Qidirish" maxlength="60"></label><label class="sw"><input type="checkbox" id="f-v"> Faqat tekshirilgan ma’lumot</label>
  <div class="tabs" id="f-t" role="tablist">${[['', 'Hammasi'], ['safety', 'Safety'], ['target', 'Target'], ['reach', 'Reach']].map(([v, t]) => `<button role="tab" data-t="${v}" aria-selected="${v === ''}">${t}<span class="c"></span></button>`).join('')}</div></div>
  <div id="f-r"></div>
  <p class="fnote">Hozir bazada <b>${cat.length}</b> ta AQSh universiteti bor, shundan <b>${verifiedN}</b> tasining ko‘rsatkichlari rasmiy manbadan tekshirilgan. Qolganlari “taxminiy” deb belgilangan. Boshqa davlatlar universitetlari tepadagi «Boshqa davlatlar» tabida.</p>`;
  const out = $('#f-r', el), card = (u, c) => `<article class="card hover uc tk-${u.tier}"><div class="uc-top"><div class="score" style="--p:${u.score}">${u.score}</div><div class="uc-id">${ctry(u.country)}<h3>${esc(u.n)}</h3></div><span class="badge ${u.tier}">${TIER[u.tier]}</span></div>
      <div class="uc-meta">${vb(u.verified, 'SAT tekshirilgan')}${u.deadline ? `<span class="badge mute">${fmtDate(u.deadline)}${u.deadlineVerified ? '' : ' (taxminiy)'}</span>` : ''}</div>${satMeter(c, mySat)}
      ${u.why ? `<p class="uc-lvl">${esc(u.level)}</p><ul class="uc-why">${u.why.map(w => `<li>${esc(w.t)}</li>`).join('')}</ul><p class="hint">${esc(u.basis)}${u.confident ? '' : ' · bu daraja taxminiy'}</p>`
        : `<div class="lock" style="border-radius:12px"><div class="lock-in"><p>Nima uchun mos ekani: SAT, GPA va IELTS bo‘yicha tushuntirish shu yerda ko‘rinadi.</p><p>Universitet ko‘rsatkichlari bilan solishtirish batafsil yoziladi.</p></div><div class="lock-cta"><button class="btn primary sm" data-up>Tushuntirishni ochish (Plus)</button></div></div>`}
      <div class="uc-act"><button class="btn sm" data-about="${esc(u.id)}">Haqida</button><button class="btn sm" data-add="${esc(u.id)}">Arizaga qo‘shish</button><button class="btn sm" data-cmp="${esc(u.id)}">Solishtirish</button><a class="btn sm" href="#/predictor?u=${encodeURIComponent(u.id)}">Moslik</a></div></article>`;
  const paint = r => {
    out.innerHTML = `<div class="grid g2">${items.slice(0, shown).map(u => card(u, cat.find(c => c.id === u.id))).join('')}</div>
      ${shown < items.length ? `<div class="fmore"><button class="btn" data-more type="button">Yana ko‘rsatish <span class="c">+${Math.min(PAGE, items.length - shown)}</span></button></div>` : ''}
      ${r.shown < r.total ? `<div class="card" style="margin-top:18px;text-align:center"><b>${r.shown} / ${r.total} natija ko‘rsatilmoqda.</b><p class="sub" style="margin:6px 0 12px">Eng mos ${r.limit} ta universitet ko‘rinadi.</p><a class="btn primary" href="#/pricing">Hammasini ko‘rish</a></div>` : ''}`;
  };
  let last = null;
  out.onclick = e => {
    const g = n => e.target.closest(n); let b;
    if ((b = g('[data-more]'))) { shown += PAGE; paint(last); return; }
    if (g('[data-up]')) return upsell('finder_adv', 'Har bir universitet nima uchun mos ekanini ko‘rish Pro tarifida.');
    if ((b = g('[data-about]'))) return aboutUni(b.dataset.about);
    if ((b = g('[data-add]'))) return addApp(cat.find(c => c.id === b.dataset.add));
    if ((b = g('[data-cmp]'))) return addCmp(b.dataset.cmp);
  };
  const load = async () => {
    const my = ++seq; out.innerHTML = '<div class="grid g2">' + '<div class="card"><div class="sk" style="height:90px"></div></div>'.repeat(4) + '</div>';
    try {
      const r = await api('/api/finder', 'POST', { profile: profBody(), q, tier, verifiedOnly: vOnly }); if (my !== seq) return;
      $$('#f-t button', el).forEach(b => { const k = b.dataset.t; b.querySelector('.c').textContent = k ? ' ' + r.counts[k] : ''; });
      if (!r.items.length) { out.innerHTML = '<div class="card empty"><b>Hech narsa topilmadi</b>Filtrni o‘zgartirib ko‘ring.</div>'; return; }
      items = r.items; shown = PAGE; last = r; paint(r);
    } catch (e) { if (my === seq) { out.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', out); if (b) b.onclick = load; } }
  };
  $('#f-q', el).oninput = e => { clearTimeout(timer); timer = setTimeout(() => { q = e.target.value.trim(); load(); }, 350); };
  $('#f-v', el).onchange = e => { vOnly = e.target.checked; load(); };
  $$('#f-t button', el).forEach(b => (b.onclick = () => { tier = b.dataset.t; $$('#f-t button', el).forEach(x => x.setAttribute('aria-selected', x === b)); load(); }));
  load();
}
export async function finder(el) {
  let sc = /[?&]c=intl\b/.test(location.hash) ? 'intl' : 'us';
  el.innerHTML = `<div class="page-h"><div><h2>Universitet qidiruvi</h2><p>AQShda profilingizga mos universitetlar Safety, Target va Reach bo‘yicha guruhlanadi; boshqa davlatlar uchun talab, muddat va o‘qish narxi ko‘rsatiladi.</p></div></div>
  <div class="tabs" id="f-sc" role="tablist" style="margin-bottom:16px"><button role="tab" data-sc="us" aria-selected="${sc === 'us'}">AQSh<span class="c"></span></button><button role="tab" data-sc="intl" aria-selected="${sc === 'intl'}">Boshqa davlatlar<span class="c"></span></button></div><div id="f-body"></div>`;
  const body = $('#f-body', el), tabs = $$('#f-sc button', el), run = () => { tabs.forEach(b => b.setAttribute('aria-selected', b.dataset.sc === sc)); body.innerHTML = ''; return sc === 'intl' ? intlPanel(body, { onAdd: addApp }) : hasInput() ? usFinder(body) : browse(body); };
  tabs.forEach(b => (b.onclick = () => { if (b.dataset.sc === sc) return; sc = b.dataset.sc; history.replaceState(null, '', sc === 'intl' ? '#/finder?c=intl' : '#/finder'); run(); }));
  catalog().then(c => { const n = $('#f-sc [data-sc="us"] .c', el); if (n) n.textContent = ' ' + c.length; }).catch(() => {});
  intlCount().then(n => { const x = $('#f-sc [data-sc="intl"] .c', el); if (x && n != null) x.textContent = ' ' + n; });
  await run();
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
  el.innerHTML = `<div class="page-h"><div><h2>Stipendiya qidiruvi</h2><p>Tasdiqlangan stipendiyalar: talablar, muddat va moliyalashtirish turi.</p></div></div>`;
  if (!S.account.features.includes('scholarships')) {
    el.innerHTML += `<div class="card lock"><div class="lock-in"><h3>Stipendiyalar ro‘yxati</h3><p>Talablar, muddatlar, summa va ariza havolalari shu yerda.</p><p>Filtrlar: mamlakat, moliyalashtirish turi.</p></div><div class="lock-cta"><b>Stipendiya qidiruvi Pro tarifida</b><a class="btn primary" href="#/pricing">Tariflarni ko‘rish</a></div></div>`; return;
  }
  el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px"><div class="row"><div><label class="f" for="s-q">Qidirish</label><input id="s-q" type="text" maxlength="80" placeholder="Nomi yoki tashkilot"></div><div><label class="f" for="s-c">Mamlakat</label><select id="s-c"><option value="">Hammasi</option><option>AQSh</option><option>Buyuk Britaniya</option><option>Germaniya</option><option>Janubiy Koreya</option><option>Turkiya</option><option>Xalqaro</option></select></div><div><label class="f" for="s-f">Moliyalashtirish</label><select id="s-f"><option value="">Hammasi</option><option value="full">To‘liq</option><option value="partial">Qisman</option></select></div></div></div><div id="s-r"></div>`);
  const out = $('#s-r', el); let t = 0;
  const load = async () => {
    out.innerHTML = '<div class="card"><div class="sk" style="height:80px"></div></div>';
    try {
      const p = new URLSearchParams({ q: $('#s-q', el).value.trim(), country: $('#s-c', el).value, funding: $('#s-f', el).value }), r = await api('/api/scholarships?' + p);
      if (!r.total) { out.innerHTML = `<div class="card empty"><b>Stipendiyalar bazasi hozircha to‘ldirilmoqda</b>Faqat rasmiy manbadan tekshirilgan stipendiyalar qo‘shiladi, shuning uchun ro‘yxat hozircha bo‘sh.</div>`; return; }
      if (!r.items.length) { out.innerHTML = '<div class="card empty"><b>Hech narsa topilmadi</b>Filtrni o‘zgartiring.</div>'; return; }
      out.innerHTML = `<div class="grid g2">${r.items.map(x => `<article class="card"><h3>${esc(x.name)}</h3><p class="sub">${esc(x.provider || '')}</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${x.funding ? `<span class="badge ${x.funding === 'full' ? 'ok' : ''}">${x.funding === 'full' ? 'To‘liq' : 'Qisman'}</span>` : ''}${(x.countries || []).map(c => `<span class="badge mute">${esc(c)}</span>`).join('')}${x.deadline ? `<span class="badge ${daysLeft(x.deadline) <= 30 ? 'warn' : 'mute'}">Muddat: ${fmtDate(x.deadline)}</span>` : ''}</div>${x.amount ? `<p><b>Summa:</b> ${esc(x.amount)}</p>` : ''}${x.eligibility ? `<p><b>Kimlar uchun:</b> ${esc(x.eligibility)}</p>` : ''}${x.requirements ? `<p><b>Talablar:</b> ${esc(x.requirements)}</p>` : ''}${/^https:\/\//.test(x.url || '') ? `<a class="btn sm" style="margin-top:12px" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Rasmiy sahifa</a>` : ''}${x.verifiedAt ? `<p class="hint">Tekshirilgan: ${esc(x.verifiedAt)}</p>` : ''}<p style="margin:8px 0 0"><button class="link-btn" type="button" data-rep="${esc(x.name)}">Xato topdingizmi?</button></p></article>`).join('')}</div>`;
      out.onclick = e => { const b = e.target.closest('[data-rep]'); if (b) reportError(b.dataset.rep); };
    } catch (e) { out.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', out); if (b) b.onclick = load; }
  };
  $('#s-q', el).oninput = () => { clearTimeout(t); t = setTimeout(load, 350); }; $('#s-c', el).onchange = load; $('#s-f', el).onchange = load; load();
}

/* ================= MOSLIK TAHLILI ================= */
export async function predictor(el) {
  el.innerHTML = `<div class="page-h"><div><h2>Mosligingizni tekshiring</h2><p>Bu sizning raqamlaringizni universitet o‘rta ko‘rsatkichlari bilan solishtiradi. Qabul ehtimoli emas.</p></div></div>`;
  if (!hasInput()) { el.insertAdjacentHTML('beforeend', needProfile()); return; }
  const cat = await catalog(), pre = decodeURIComponent((location.hash.split('?u=')[1] || '')), start = cat.some(c => c.id === pre) ? pre : cat[0].id;
  el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px"><div class="row" style="align-items:end"><div><label class="f" for="pr-u">Universitet</label><select id="pr-u">${cat.map(c => `<option value="${esc(c.id)}" ${c.id === start ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></div><button class="btn primary" id="pr-go">Baholash</button></div></div><div id="pr-r"></div>`);
  const out = $('#pr-r', el);
  const run = async () => {
    out.innerHTML = '<div class="card"><div class="sk" style="height:120px"></div></div>';
    try {
      const r = await api('/api/predict', 'POST', { id: $('#pr-u', el).value, profile: profBody() });
      out.innerHTML = `<div class="grid g-dash"><section class="card s5" style="text-align:center"><div class="score big ${r.full ? 'tk-' + r.tier.tier : ''}" style="--p:${r.score}">${r.score}</div><p class="dial-l">Moslik balli · ${esc(r.n)}</p><p><b>${esc(r.full ? r.level : r.verdict)}</b></p>${r.full ? `<p style="margin-top:8px"><span class="badge ${r.tier.tier}">${TIER[r.tier.tier]}</span></p><p class="hint">${esc(r.tier.basis)}</p>` : ''}</section>
      <section class="card s7">${r.full ? `<h3>Moslik balli qanday hisoblandi</h3><p class="sub">Har bir mezon uchun hissa.</p>${r.parts.map(x => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><b>${esc(x.k)}</b><span>${x.v}/100 · ulushi ${x.w}%</span></div><div class="bar" style="margin:6px 0"><i style="width:${x.v}%"></i></div><small style="color:var(--muted)">${esc(x.t)}</small></div>`).join('')}
        <h3 style="margin-top:14px">Nimani yaxshilash kerak</h3>${r.advice.length ? `<ul style="padding-left:18px;color:var(--ink-2)">${r.advice.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : '<p class="sub">Qo‘shimcha tavsiya yo‘q.</p>'}
        <div style="display:flex;gap:6px;flex-wrap:wrap">${vb(r.verified.sat, 'SAT oralig‘i tekshirilgan')}${vb(r.verified.acceptance, 'qabul darajasi tekshirilgan')}${vb(r.verified.deadline, 'muddat tekshirilgan')}</div>`
        : `<div class="lock"><div class="lock-in"><h3>Ball qanday hisoblandi</h3><p>SAT, GPA, IELTS va faoliyat bo‘yicha batafsil tahlil.</p><p>Nimani yaxshilash kerakligi haqida tavsiyalar.</p><p>Safety / Target / Reach darajasi.</p></div><div class="lock-cta"><b>To‘liq tahlil Pro tarifida</b><a class="btn primary" href="#/pricing">Tariflarni ko‘rish</a></div></div>`}</section></div>
      <div class="notice" style="margin-top:16px">${svg('info')}<div>${esc(r.disclaimer)}</div></div>`;
    } catch (e) { out.innerHTML = errorBox(e.message); }
  };
  $('#pr-go', el).onclick = run; run();
}

/* ================= SOLISHTIRISH ================= */
export async function compare(el) {
  const cat = await catalog(), lim = S.account.limits.compare; let ids = ls.get('qabul:cmp', []).slice(0, lim);
  const draw = async () => {
    el.innerHTML = `<div class="page-h"><div><h2>Universitetlarni solishtirish</h2><p>Bir vaqtda ${lim} tagacha universitet (${S.account.plan.toUpperCase()} tarifi).</p></div></div>
    <div class="card" style="margin-bottom:16px"><div class="row" style="align-items:end"><div><label class="f" for="c-u">Universitet qo‘shish</label><select id="c-u">${cat.filter(c => !ids.includes(c.id)).map(c => `<option value="${esc(c.id)}">${esc(c.n)}</option>`).join('')}</select></div><button class="btn primary" id="c-add">Qo‘shish</button></div></div><div id="c-r"></div>`;
    $('#c-add', el).onclick = () => { const v = $('#c-u', el).value; if (ids.length >= lim) return upsell('compare', `${S.account.plan.toUpperCase()} tarifida ${lim} ta universitet solishtiriladi.`); ids.push(v); ls.set('qabul:cmp', ids); draw(); };
    const out = $('#c-r', el);
    if (!ids.length) { out.innerHTML = '<div class="card empty"><b>Solishtirish uchun universitet tanlang</b>Kamida ikkitasini qo‘shing.</div>'; return; }
    try {
      const r = await api('/api/compare', 'POST', { ids }), it = r.items, row = (t, f) => `<tr><th>${t}</th>${it.map(c => `<td>${f(c)}</td>`).join('')}</tr>`;
      out.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${it.map(c => `<th style="text-transform:none;font-size:14px;color:var(--ink)">${esc(c.n)}<br><button class="link-btn" data-rm="${esc(c.id)}" style="font-size:12px;font-weight:500;color:var(--bad)">Olib tashlash</button></th>`).join('')}</tr></thead><tbody>
      ${row('Joylashuv', c => esc(c.country))}${row('SAT (o‘rta 50%)', c => `${c.sat[0]}–${c.sat[1]} ${vb(c.satV)}${lnk((c.src || {}).sat, 'manba')}`)}${row('Qabul darajasi', c => (c.acc != null ? (c.acc * 100).toFixed(1) + '% ' + vb(c.accV) + lnk((c.src || {}).accept, 'manba') : '<span style="color:var(--muted)">tekshirilmagan</span>'))}${row('IELTS', c => (c.ielts != null ? c.ielts + (c.ieltsKind === 'recommended' ? ' (tavsiya)' : '') + ' ' + vb(c.ieltsV) + lnk((c.src || {}).ielts, 'manba') : c.ieltsKind === 'none_stated' ? 'minimal ball ko‘rsatilmagan ' + vb(true) + lnk((c.src || {}).ielts, 'rasmiy sahifa') : '—'))}${row('Muddat (Regular)', c => fmtDate(c.rd) + ' ' + vb(c.rdV) + lnk((c.src || {}).deadline, 'manba'))}${row('Erta muddatlar', c => (c.early && c.early.length ? c.early.map(e => esc(e.plan) + ': ' + fmtDate(e.date)).join('<br>') : '—'))}${row('Rasmiy sayt', c => (safeUrl(c.site) ? `<a href="${esc(c.site)}" target="_blank" rel="noopener noreferrer">${esc((c.site.match(/^https:\/\/(?:www\.)?([^\/?#]+)/) || [])[1] || c.site)}</a>` : '—') + `<br><button class="link-btn" type="button" data-rep="${esc(c.n)}">Xato topdingizmi?</button>`)}</tbody></table></div>
      <div class="notice info" style="margin-top:16px">${svg('info')}<div>O‘qish narxi, reyting va stipendiyalar ustunlari rasmiy ma’lumot yig‘ilgach qo‘shiladi. “Taxminiy” ko‘rsatkichlarni universitetning rasmiy saytida tekshiring.</div></div>`;
      $$('[data-rep]', out).forEach(b => (b.onclick = () => reportError(b.dataset.rep)));
      $$('[data-rm]', out).forEach(b => (b.onclick = () => { ids = ids.filter(x => x !== b.dataset.rm); ls.set('qabul:cmp', ids); draw(); }));
    } catch (e) { out.innerHTML = errorBox(e.message); }
  };
  draw();
}

/** Natija kiritilmagan bo'lsa: oddiy ro'yxat (moslik balisiz). */
async function browse(el) {
  const cat = await catalog();
  el.innerHTML = `<div class="notice info" style="margin-bottom:16px">${svg('info')}<div>Moslik bali va Safety / Target / Reach darajasini ko‘rish uchun natijalaringizni kiriting. <a href="#/profile"><b>Natijalarni kiritish</b></a></div></div>
  <div class="card" style="margin-bottom:16px"><label class="f" for="b-q">Qidirish</label><input id="b-q" type="text" maxlength="60" placeholder="Universitet nomi"></div><div id="b-r"></div>`;
  const out = $('#b-r', el), draw = q => {
    const rows = cat.filter(c => c.n.toLowerCase().includes(q.toLowerCase()));
    out.innerHTML = rows.length ? `<div class="grid g2">${rows.map(c => `<article class="card hover">${ctry(c.country)}<h3>${esc(c.n)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${vb(c.satV, 'SAT tekshirilgan')}<span class="badge mute">SAT ${c.sat[0]}–${c.sat[1]}</span><span class="badge mute">Muddat: ${fmtDate(c.rd)}${c.rdV ? '' : ' (taxminiy)'}</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-about="${esc(c.id)}">Haqida</button><button class="btn sm" data-add="${esc(c.id)}">Arizaga qo‘shish</button><button class="btn sm" data-cmp="${esc(c.id)}">Solishtirish</button></div></article>`).join('')}</div>` : '<div class="card empty"><b>Hech narsa topilmadi</b></div>';
    $$('[data-about]', out).forEach(b => (b.onclick = () => aboutUni(b.dataset.about)));
    $$('[data-add]', out).forEach(b => (b.onclick = () => addApp(cat.find(c => c.id === b.dataset.add))));
    $$('[data-cmp]', out).forEach(b => (b.onclick = () => addCmp(b.dataset.cmp)));
  };
  let t = 0; $('#b-q', el).oninput = e => { clearTimeout(t); t = setTimeout(() => draw(e.target.value.trim()), 200); }; draw('');
}

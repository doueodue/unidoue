import { $, $$, S, api, ls, esc, toast, svg, fmtDate, daysLeft, catalog, allUnis, uniOptions, upsell, errorBox, modal, reportError } from './core.js';
import { getProfile, DOCS } from './views1.js';
import { t, pick, dateL } from './i18n.js';
import { intlTools } from './views4.js';
import { rankChip, cardTop, whyBlock, TIER } from './ucard.js';
const ctry = c => (c ? `<div class="ctry">${esc(t(c))}</div>` : '');

const profBody = () => { const { Q } = getProfile(); return { gpa: Q.gpa, sc: Q.sc, sat: Q.sat, ielts: Q.ielts, ex: Q.ex, ach: Q.ach }; };
const hasInput = () => { const { Q } = getProfile(); return !!(Q.gpa || Q.sat || Q.ielts); };
const needProfile = () => `<div class="card empty"><b>Avval natijalaringizni kiriting</b>GPA, SAT yoki IELTS ni profilda to‘ldiring.<br><a class="btn primary" style="margin-top:14px" href="#/profile">Profilga o‘tish</a></div>`;
const vb = (ok, t = 'tekshirilgan') => `<span class="badge ${ok ? 'ok' : 'mute'}" title="${ok ? 'Rasmiy manbadan' : 'Namuna qiymat, rasmiy sayt bilan tekshiring'}">${ok ? t : 'taxminiy'}</span>`;

/* ===== Universitet haqida (hammaga bepul; faqat katalogdagi tasdiqlangan ma'lumot) ===== */
const safeUrl = u => (/^https:\/\//.test(u || '') ? u : '');
const lnk = (u, txt) => (safeUrl(u) ? ` <a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${txt}</a>` : '');
export async function aboutUni(id) {
  const c = (await allUnis()).find(x => x.id === id); if (!c) return;
  const src = c.src || {}, row = (k, v) => `<div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-bottom:1px solid var(--line)"><span style="color:var(--muted)">${k}</span><span style="text-align:right">${v}</span></div>`;
  const rows = [], intl = c.kind === 'intl', link = u => (safeUrl(u) ? lnk(u, 'manba') : ''), none = '<span style="color:var(--muted)">rasmiy saytda tekshiring</span>';
  rows.push(row('Davlat', esc(t(c.country || ''))));
  rows.push(row('Dunyo reytingi', rankChip(c)));
  if (c.city) rows.push(row('Shahar', esc(c.city + (c.state ? ', ' + c.state : ''))));
  if (c.address) rows.push(row('Manzil', esc(c.address)));
  const site = c.site || c.url; if (site) rows.push(row('Rasmiy sayt', `<a href="${esc(safeUrl(site))}" target="_blank" rel="noopener noreferrer">${esc(site.replace(/^https:\/\//, ''))}</a>`));
  if (intl) {
    rows.push(row('O‘qish tili', c.lang ? esc(c.lang) : none));
    rows.push(row('IELTS', c.ielts != null ? `${c.ielts}${link(c.ieltsUrl)}` : c.ieltsNote ? `${esc(pick(c.ieltsNote))}${link(c.ieltsNoteUrl)}` : none));
    if (c.sat != null) rows.push(row('SAT (min)', `${c.sat}${link(c.satUrl)}`));
    rows.push(row('Ariza muddati', c.rd ? `${esc(dateL(c.rd, fmtDate))}${link(c.rdUrl)}${c.rdIntake ? `<br><small style="color:var(--muted)">${esc(pick(c.rdIntake))}</small>` : ''}` : none));
    rows.push(row('O‘qish narxi', c.tuition ? `${c.tuition.amount.toLocaleString('en-US')} ${esc(c.tuition.cur)} / ${t('yil')}${link(c.tuition.url)}${c.tuition.note ? `<br><small style="color:var(--muted)">${esc(pick(c.tuition.note))}</small>` : ''}` : none));
    if (c.req) rows.push(row('Talab', `${esc(pick(c.req))}${link(c.reqUrl)}`));
  } else {
    rows.push(row('SAT oralig‘i', c.sat ? `${c.sat[0]}–${c.sat[1]} ${vb(c.satV)}${lnk(src.sat, 'manba')}` : 'ma’lumot yo‘q'));
    if (c.acc != null) rows.push(row('Qabul darajasi', `${(c.acc * 100).toFixed(1)}% ${vb(c.accV)}${lnk(src.accept, 'manba')}`));
    if (c.gpa) rows.push(row('O‘rtacha GPA', `${c.gpa} ${vb(c.gpaV)}`));
    rows.push(row('IELTS', c.ielts ? `${c.ielts} ${vb(c.ieltsV)}${lnk(src.ielts, 'manba')}` : (c.ieltsKind === 'none_stated' ? 'minimum e’lon qilinmagan' + lnk(src.ielts, 'rasmiy sahifa') : 'ma’lumot yo‘q')));
    if (c.rd) rows.push(row('Ariza muddati', `${fmtDate(c.rd)} ${vb(c.rdV)}${lnk(src.deadline, 'manba')}`));
    (c.early || []).forEach(e => rows.push(row('Erta muddat (' + esc(e.plan) + ')', fmtDate(e.date))));
  }
  const majors = Array.isArray(c.majors) && c.majors.length ? `<h4 style="margin:14px 0 6px">Yo‘nalishlar</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${c.majors.map(m => `<span class="badge mute">${esc(m)}</span>`).join('')}</div>${lnk(c.majorsUrl, 'to‘liq ro‘yxat (rasmiy sayt)')}` : '';
  const body = `<div style="max-height:62vh;overflow:auto">${rows.join('')}${majors}<p class="hint" style="margin-top:12px">${intl ? 'Ariza topshirishdan oldin muddat, talab va narxni universitetning rasmiy sahifasida tekshiring.' : '“taxminiy” belgisi qiymat hali rasmiy manba bilan tasdiqlanmaganini bildiradi. Ariza topshirishdan oldin muddat va talablarni universitetning rasmiy sahifasida tekshiring.'}</p></div>`;
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
/** Bitta umumiy ro‘yxat: AQSh universitetlari (moslik bali bilan) va boshqa davlatlar universitetlari birga. */
export async function finder(el) {
  const [cat, intl] = await Promise.all([catalog(), intlTools().catch(() => null)]);
  const smart = hasInput(), mySat = getProfile().Q.sat, intlList = intl ? intl.list : [], verifiedN = cat.filter(c => c.satV).length, total = cat.length + intlList.length;
  const countries = [...new Set(intlList.map(c => c.country))].sort((a, b) => t(a).localeCompare(t(b)));
  let q = '', tier = '', ctr = '', vOnly = false, f = {}, timer = 0, seq = 0, rows = [], shown = PAGE, last = null;
  el.innerHTML = `<div class="page-h"><div><h2>Universitet qidiruvi</h2><p>Hamma davlatlar universitetlari bir joyda. Har bir universitet profilingizga mos Safety, Target va Reach bo‘yicha baholanadi; kartada dunyo reytingi, talab, muddat va o‘qish narxi ham ko‘rsatiladi.</p></div></div>
  <div class="card ftool"><label class="fsearch">${svg('search')}<input id="f-q" type="text" placeholder="Universitet, shahar yoki davlat" aria-label="Qidirish" maxlength="60"></label>
  <select id="f-c" aria-label="Davlat"><option value="">${t('Hamma davlatlar')} (${total})</option><option value="us">${t('AQSh')} (${cat.length})</option>${countries.map(c => `<option value="${esc(c)}">${esc(t(c))} (${intlList.filter(u => u.country === c).length})</option>`).join('')}</select>
  <div class="ftool-r">${smart ? `<div class="tabs" id="f-t" role="tablist">${[['', 'Hammasi'], ['safety', 'Safety'], ['target', 'Target'], ['reach', 'Reach']].map(([v, tt]) => `<button role="tab" data-t="${v}" aria-selected="${v === ''}">${tt}<span class="c"></span></button>`).join('')}</div>` : ''}
  <div class="sws"><label class="sw"><input type="checkbox" id="f-v"> Faqat tekshirilgan ma’lumot</label>${intl ? `<label class="sw"><input type="checkbox" id="f-en"> Faqat ingliz tilida</label><label class="sw"><input type="checkbox" id="f-ok"> Faqat muddati ochiq</label>${intl.hasIe ? '<label class="sw"><input type="checkbox" id="f-ie"> Faqat IELTS yetarli</label>' : ''}` : ''}</div></div></div>
  ${smart ? '' : '<div class="notice info" style="margin-bottom:16px">' + svg('info') + '<div>Moslik bali va Safety / Target / Reach darajasini ko‘rish uchun natijalaringizni kiriting. <a href="#/profile"><b>Natijalarni kiritish</b></a></div></div>'}
  <div id="f-r"></div>
  <p class="fnote">Hozir bazada <b>${total}</b> ta universitet bor, shundan <b>${cat.length}</b> tasi AQShda, <b>${intlList.length}</b> tasi boshqa davlatlarda. AQShdagi <b>${verifiedN}</b> tasining ko‘rsatkichlari rasmiy manbadan tekshirilgan. Qolganlari “taxminiy” deb belgilangan.</p>
  <p class="fnote">Boshqa davlatlarda SAT, GPA va qabul foizi ochiq e’lon qilinmaydi: ularning Safety / Target / Reach darajasi QS reytingi asosidagi taxminiy ko‘rsatkichlarga tayanadi va “taxminiy” deb belgilanadi. Rasmiy talablar (IELTS, o‘qish tili, muddat) alohida tekshiriladi.</p>
  <p class="fnote">Dunyo reytingi: QS World University Rankings 2027. “—” belgisi universitet umumiy jadvalda topilmaganini bildiradi.</p>`;
  const out = $('#f-r', el), usCard = (u, c) => `<article class="card hover uc tk-${u.tier}">${cardTop(c || u, u)}
      <div class="uc-meta">${vb(u.verified, 'SAT tekshirilgan')}${u.deadline ? `<span class="badge mute">${fmtDate(u.deadline)}${u.deadlineVerified ? '' : ' (taxminiy)'}</span>` : ''}</div>${satMeter(c, mySat)}
      ${whyBlock(u)}
      <div class="uc-act"><button class="btn sm" data-about="${esc(u.id)}">Haqida</button><button class="btn sm" data-add="${esc(u.id)}">Arizaga qo‘shish</button><button class="btn sm" data-cmp="${esc(u.id)}">Solishtirish</button><a class="btn sm" href="#/predictor?u=${encodeURIComponent(u.id)}">Moslik</a></div></article>`,
    plainCard = c => `<article class="card hover">${cardTop(c, null, true)}<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${vb(c.satV, 'SAT tekshirilgan')}${c.sat ? `<span class="badge mute">SAT ${c.sat[0]}–${c.sat[1]}</span>` : ''}${c.rd ? `<span class="badge mute">Muddat: ${fmtDate(c.rd)}${c.rdV ? '' : ' (taxminiy)'}</span>` : ''}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-about="${esc(c.id)}">Haqida</button><button class="btn sm" data-add="${esc(c.id)}">Arizaga qo‘shish</button><button class="btn sm" data-cmp="${esc(c.id)}">Solishtirish</button></div></article>`;
  const paint = () => {
    const part = rows.slice(0, shown);
    out.innerHTML = rows.length ? `<div class="grid g2">${part.map(r => (r.k === 'intl' ? intl.card(r.u, r.r) : r.k === 'plain' ? plainCard(r.u) : usCard(r.r, r.u))).join('')}</div>
      ${shown < rows.length ? `<div class="fmore"><button class="btn" data-more type="button">Yana ko‘rsatish <span class="c">+${Math.min(PAGE, rows.length - shown)}</span></button></div>` : ''}
      ${last && last.shown < last.total ? `<div class="card" style="margin-top:18px;text-align:center"><b>${last.shown} / ${last.total} natija ko‘rsatilmoqda.</b><p class="sub" style="margin:6px 0 12px">Eng mos ${last.limit} ta universitet ko‘rinadi.</p><a class="btn primary" href="#/pricing">Hammasini ko‘rish</a></div>` : ''}`
      : '<div class="card empty"><b>Hech narsa topilmadi</b>Qidiruv so‘zi, davlat yoki filtrni o‘zgartirib ko‘ring.</div>';
  };
  out.onclick = e => {
    const g = n => e.target.closest(n); let b;
    if (g('[data-more]')) { shown += PAGE; paint(); return; }
    if (g('[data-up]')) return upsell('finder_adv', 'Har bir universitet nima uchun mos ekanini ko‘rish Pro tarifida.');
    if ((b = g('[data-rep]'))) return reportError(b.dataset.rep);
    if ((b = g('[data-about]'))) return aboutUni(b.dataset.about);
    if ((b = g('[data-add]'))) return addApp(cat.find(c => c.id === b.dataset.add) || intlList.find(c => c.id === b.dataset.add));
    if ((b = g('[data-cmp]'))) return addCmp(b.dataset.cmp);
  };
  /** Profil kiritilmagan (ballsiz) rejim: ikkala ro‘yxat ham brauzerda filtrlanadi. */
  const k0 = () => q.toLowerCase(), cMatch = u => { const k = k0(); return !k || [u.n, u.city, u.country, t(u.country)].join(' ').toLowerCase().includes(k); };
  const usOk = c => (!f.op || (c.rd && daysLeft(c.rd) >= 0)) && (!f.ie || (c.ielts != null && parseFloat(getProfile().Q.ielts) >= c.ielts));
  const plainRows = () => {
    const us = ctr && ctr !== 'us' ? [] : cat.filter(c => cMatch(c) && (!vOnly || c.satV) && usOk(c)).map(u => ({ k: 'plain', u }));
    const it = !intl || ctr === 'us' ? [] : intlList.filter(u => (!ctr || u.country === ctr) && cMatch(u) && intl.pass(u, f)).map(u => ({ k: 'intl', u }));
    return us.concat(it);
  };
  const load = async () => {
    const my = ++seq;
    if (!smart) { last = null; rows = plainRows(); shown = PAGE; paint(); return; }
    out.innerHTML = '<div class="grid g2">' + '<div class="card"><div class="sk" style="height:90px"></div></div>'.repeat(4) + '</div>';
    try {
      const k = q.toLowerCase(), qc = k ? countries.filter(c => t(c).toLowerCase().includes(k)) : [];
      /* Hamma universitet (AQSh va boshqa davlatlar) serverda bir xil model bilan baholanadi va filtrlanadi */
      const r = await api('/api/finder', 'POST', { profile: profBody(), q, qc, tier, verifiedOnly: vOnly, country: ctr, op: !!f.op, ie: !!f.ie, en: !!f.en }); if (my !== seq) return;
      $$('#f-t button', el).forEach(b => { const kk = b.dataset.t; b.querySelector('.c').textContent = kk ? ' ' + r.counts[kk] : ''; });
      last = r;
      rows = r.items.map(it => (it.kind === 'intl' ? { k: 'intl', u: intlList.find(c => c.id === it.id), r: it } : { k: 'us', u: cat.find(c => c.id === it.id), r: it })).filter(x => x.u);
      shown = PAGE; paint();
    } catch (e) { if (my === seq) { out.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', out); if (b) b.onclick = load; } }
  };
  $('#f-q', el).oninput = e => { clearTimeout(timer); timer = setTimeout(() => { q = e.target.value.trim(); load(); }, 350); };
  $('#f-c', el).onchange = e => { ctr = e.target.value; load(); };
  $('#f-v', el).onchange = e => { vOnly = e.target.checked; load(); };
  [['f-en', 'en'], ['f-ok', 'op'], ['f-ie', 'ie']].forEach(([id, k]) => { const x = $('#' + id, el); if (x) x.onchange = () => { f = { ...f, [k]: x.checked }; load(); }; });
  $$('#f-t button', el).forEach(b => (b.onclick = () => { tier = b.dataset.t; $$('#f-t button', el).forEach(x => x.setAttribute('aria-selected', x === b)); load(); }));
  load();
}
/** Arizalar ro‘yxatiga qo‘shadi. Muddat topilmasa yoki o‘tgan bo‘lsa, foydalanuvchidan yangi sanani so‘raydi. */
async function addApp(c) {
  const apps = ls.get('qabul:apps', []), lim = S.account.limits.apps;
  if (apps.some(a => a.n === c.n)) return toast(c.n + ' allaqachon arizalar ro‘yxatida.');
  if (apps.length >= lim) return upsell('tracker', `Free tarifda ${lim} tagacha ariza saqlanadi.`);
  let d = c.rd;
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d) || daysLeft(d) < 0) {
    const v = await modal({ title: c.n, body: `<p>${d ? 'Katalogdagi muddat o‘tib ketgan.' : 'Muddat rasmiy sahifada topilmadi.'} Rasmiy saytdan keyingi muddatni tekshirib kiriting.</p><div class="field" style="margin-top:12px"><label class="f" for="ad-d">Muddat</label><input id="ad-d" type="date"></div>`, actions: [{ label: 'Bekor', value: 0 }, { label: 'Qo‘shish', value: 1, cls: 'primary' }], collect: bg => $('#ad-d', bg).value });
    if (v !== 1) return;
    d = String(modal.data || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return toast('Muddatni kiriting.', 'err');
  }
  apps.push({ n: c.n, d, s: 0, docs: DOCS.map(() => false) }); ls.set('qabul:apps', apps); toast(c.n + ' arizalarga qo‘shildi.');
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
  const cat = await allUnis(), pre = decodeURIComponent((location.hash.split('?u=')[1] || '')), start = cat.some(c => c.id === pre) ? pre : cat[0].id;
  el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px"><div class="row" style="align-items:end"><div><label class="f" for="pr-u">Universitet</label><select id="pr-u">${uniOptions(cat, () => true, start)}</select></div><button class="btn primary" id="pr-go">Baholash</button></div></div><div id="pr-r"></div>`);
  const out = $('#pr-r', el);
  const run = async () => {
    out.innerHTML = '<div class="card"><div class="sk" style="height:120px"></div></div>';
    try {
      const r = await api('/api/predict', 'POST', { id: $('#pr-u', el).value, profile: profBody() }), me = cat.find(c => c.id === r.id) || { qs: r.qs };
      const TN = { good: 'ok', warn: 'warn', bad: 'bad', info: 'mute' };
      /* Boshqa davlatlar: ball va Safety / Target / Reach AQShnikidek, ustiga rasmiy talablar tekshiruvi */
      const reqBox = r.req ? `<section class="card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3 style="margin:0">Rasmiy talablar bo‘yicha tekshiruv</h3><span class="badge ${{ yes: 'ok', part: 'warn', no: 'bad', unknown: 'mute' }[r.req.status]}">${esc(t(r.req.label))}</span></div><p class="sub">IELTS, o‘qish tili, muddat va narx rasmiy ma’lumotlar bilan solishtirildi.</p>${r.req.parts.map(x => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(t(x.k))}</b><span class="badge ${TN[x.tone]}">${{ good: 'mos', warn: 'diqqat', bad: 'mos emas', info: 'ma’lumot' }[x.tone]}</span></div><small style="color:var(--muted)">${esc(t(x.t))}</small></div>`).join('')}
        ${r.full ? (r.req.advice.length ? `<h3 style="margin-top:14px">Talablar bo‘yicha nima qilish kerak</h3><ul style="padding-left:18px;color:var(--ink-2)">${r.req.advice.map(a => `<li>${esc(t(a))}</li>`).join('')}</ul>` : '') : ''}</section>` : '';
      out.innerHTML = `<div class="grid g-dash"><section class="card s5" style="text-align:center"><div class="rk-row" style="justify-content:center;margin-bottom:6px">${rankChip(me)}</div><div class="score big ${r.full ? 'tk-' + r.tier.tier : ''}" style="--p:${r.score}">${r.score}</div><p class="dial-l">Moslik balli · ${esc(r.n)}</p><p><b>${esc(r.full ? r.level : r.verdict)}</b></p>${r.full ? `<p style="margin-top:8px"><span class="badge ${r.tier.tier}">${TIER[r.tier.tier]}</span>${r.est ? ' <span class="badge mute">taxminiy</span>' : ''}</p><p class="hint">${esc(r.tier.basis)}${r.tier.confident ? '' : ' · bu daraja taxminiy'}</p>` : (r.est ? '<p><span class="badge mute">taxminiy</span></p>' : '')}</section>
      <section class="card s7">${r.full ? `<h3>Moslik balli qanday hisoblandi</h3><p class="sub">Har bir mezon uchun hissa.</p>${r.parts.map(x => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><b>${esc(x.k)}</b><span>${x.v}/100 · ulushi ${x.w}%</span></div><div class="bar" style="margin:6px 0"><i style="width:${x.v}%"></i></div><small style="color:var(--muted)">${esc(x.t)}</small></div>`).join('')}
        <h3 style="margin-top:14px">Nimani yaxshilash kerak</h3>${r.advice.length ? `<ul style="padding-left:18px;color:var(--ink-2)">${r.advice.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : '<p class="sub">Qo‘shimcha tavsiya yo‘q.</p>'}
        ${r.kind === 'intl' ? '' : `<div style="display:flex;gap:6px;flex-wrap:wrap">${vb(r.verified.sat, 'SAT oralig‘i tekshirilgan')}${vb(r.verified.acceptance, 'qabul darajasi tekshirilgan')}${vb(r.verified.deadline, 'muddat tekshirilgan')}</div>`}`
        : `<div class="lock"><div class="lock-in"><h3>Ball qanday hisoblandi</h3><p>SAT, GPA, IELTS va faoliyat bo‘yicha batafsil tahlil.</p><p>Nimani yaxshilash kerakligi haqida tavsiyalar.</p><p>Safety / Target / Reach darajasi.</p></div><div class="lock-cta"><b>To‘liq tahlil Pro tarifida</b><a class="btn primary" href="#/pricing">Tariflarni ko‘rish</a></div></div>`}</section></div>${reqBox}
      <div class="notice" style="margin-top:16px">${svg('info')}<div>${esc(t(r.disclaimer))}</div></div>`;
    } catch (e) { out.innerHTML = errorBox(e.message); }
  };
  $('#pr-go', el).onclick = run; run();
}

/* ================= SOLISHTIRISH ================= */
export async function compare(el) {
  const cat = await allUnis(), lim = S.account.limits.compare; let ids = ls.get('qabul:cmp', []).filter(id => cat.some(c => c.id === id)).slice(0, lim);
  const draw = async () => {
    el.innerHTML = `<div class="page-h"><div><h2>Universitetlarni solishtirish</h2><p>Bir vaqtda ${lim} tagacha universitet (${S.account.plan.toUpperCase()} tarifi).</p></div></div>
    <div class="card" style="margin-bottom:16px"><div class="row" style="align-items:end"><div><label class="f" for="c-u">Universitet qo‘shish</label><select id="c-u">${uniOptions(cat, c => !ids.includes(c.id))}</select></div><button class="btn primary" id="c-add">Qo‘shish</button></div></div><div id="c-r"></div>`;
    $('#c-add', el).onclick = () => { const v = $('#c-u', el).value; if (!v) return; if (ids.length >= lim) return upsell('compare', `${S.account.plan.toUpperCase()} tarifida ${lim} ta universitet solishtiriladi.`); ids.push(v); ls.set('qabul:cmp', ids); draw(); };
    const out = $('#c-r', el);
    if (!ids.length) { out.innerHTML = '<div class="card empty"><b>Solishtirish uchun universitet tanlang</b>Kamida ikkitasini qo‘shing.</div>'; return; }
    try {
      const r = await api('/api/compare', 'POST', { ids }), it = r.items, row = (t, f) => `<tr><th>${t}</th>${it.map(c => `<td>${f(c)}</td>`).join('')}</tr>`;
      const dash = '<span style="color:var(--muted)">—</span>', na = '<span style="color:var(--muted)">rasmiy saytda tekshiring</span>', isI = c => c.kind === 'intl', link = (u, l = 'manba') => (safeUrl(u) ? lnk(u, l) : '');
      const { Q } = getProfile(), P = window.Scoring && hasInput() ? window.Scoring.normProfile({ gpa: Q.gpa, sc: Q.sc, sat: Q.sat, ielts: Q.ielts, ex: Q.ex, ach: Q.ach }) : null, today = new Date().toISOString().slice(0, 10);
      const fitCell = c => { if (!P) return dash; const f = window.Scoring.fit(c, P, today); return `<b>${f.score}</b>/100 <span class="badge ${f.tier}">${TIER[f.tier]}</span>${f.est ? ' <span class="badge mute">taxminiy</span>' : ''}${f.req ? `<br><small style="color:var(--muted)">${esc(t(f.req.label))}</small>` : ''}`; };
      out.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${it.map(c => `<th style="text-transform:none;font-size:14px;color:var(--ink)">${esc(c.n)}<br><button class="link-btn" data-rm="${esc(c.id)}" style="font-size:12px;font-weight:500;color:var(--bad)">Olib tashlash</button></th>`).join('')}</tr></thead><tbody>
      ${row('Joylashuv', c => esc(t(c.country || '')) + (c.city ? ', ' + esc(c.city) : ''))}${row('Dunyo reytingi', c => rankChip(c))}${P ? row('Profilingizga moslik', fitCell) : ''}${row('SAT (o‘rta 50%)', c => (isI(c) ? dash : c.sat ? `${c.sat[0]}–${c.sat[1]} ${vb(c.satV)}${lnk((c.src || {}).sat, 'manba')}` : dash))}${row('Qabul darajasi', c => (isI(c) ? dash : c.acc != null ? (c.acc * 100).toFixed(1) + '% ' + vb(c.accV) + lnk((c.src || {}).accept, 'manba') : '<span style="color:var(--muted)">tekshirilmagan</span>'))}${row('IELTS', c => (isI(c) ? (c.ielts != null ? c.ielts + link(c.ieltsUrl) : na) : c.ielts != null ? c.ielts + (c.ieltsKind === 'recommended' ? ' (tavsiya)' : '') + ' ' + vb(c.ieltsV) + lnk((c.src || {}).ielts, 'manba') : c.ieltsKind === 'none_stated' ? 'minimal ball ko‘rsatilmagan ' + vb(true) + lnk((c.src || {}).ielts, 'rasmiy sahifa') : '—'))}
      ${row('O‘qish tili', c => (isI(c) ? (c.lang ? esc(c.lang) : na) : 'English'))}${row('Muddat (Regular)', c => (isI(c) ? (c.rd ? esc(dateL(c.rd, fmtDate)) + link(c.rdUrl) + (c.rdIntake ? `<br><small style="color:var(--muted)">${esc(pick(c.rdIntake))}</small>` : '') : na) : c.rd ? fmtDate(c.rd) + ' ' + vb(c.rdV) + lnk((c.src || {}).deadline, 'manba') : dash))}${row('Erta muddatlar', c => (c.early && c.early.length ? c.early.map(e => esc(e.plan) + ': ' + fmtDate(e.date)).join('<br>') : '—'))}
      ${row('O‘qish narxi', c => (isI(c) ? (c.tuition ? `${c.tuition.amount.toLocaleString('en-US')} ${esc(c.tuition.cur)} / ${t('yil')}${link(c.tuition.url)}${c.tuition.note ? `<br><small style="color:var(--muted)">${esc(pick(c.tuition.note))}</small>` : ''}` : na) : dash))}${row('Qabul talabi', c => (isI(c) && c.req ? esc(pick(c.req)) + link(c.reqUrl) : dash))}${row('Rasmiy sayt', c => { const w = c.site || c.url; return (safeUrl(w) ? `<a href="${esc(w)}" target="_blank" rel="noopener noreferrer">${esc((w.match(/^https:\/\/(?:www\.)?([^\/?#]+)/) || [])[1] || w)}</a>` : '—') + `<br><button class="link-btn" type="button" data-rep="${esc(c.n)}">Xato topdingizmi?</button>`; })}</tbody></table></div>
      <div class="notice info" style="margin-top:16px">${svg('info')}<div>Boshqa davlatlar universitetlarida SAT va qabul darajasi ochiq e’lon qilinmaydi, shuning uchun ular uchun bu ustunlar bo‘sh, moslik bali esa QS reytingi asosida taxminiy hisoblanadi. Dunyo reytingi: QS World University Rankings 2027. Ko‘rsatkichlarni universitetning rasmiy saytida tekshiring.</div></div>`;
      $$('[data-rep]', out).forEach(b => (b.onclick = () => reportError(b.dataset.rep)));
      $$('[data-rm]', out).forEach(b => (b.onclick = () => { ids = ids.filter(x => x !== b.dataset.rm); ls.set('qabul:cmp', ids); draw(); }));
    } catch (e) { out.innerHTML = errorBox(e.message); }
  };
  draw();
}

/** Natija kiritilmagan bo'lsa: oddiy ro'yxat (moslik balisiz). */

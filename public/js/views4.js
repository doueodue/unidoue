/* Boshqa davlatlar universitetlari — «Universitet qidiruvi» sahifasidagi «Boshqa davlatlar» tabi shu paneldan foydalanadi (views2.js). */
import { $, $$, esc, svg, fmtDate, daysLeft, errorBox, reportError, intlCatalog } from './core.js';
import { getProfile } from './views1.js';
import { t, pick, dateL } from './i18n.js';

const PAGE = 12;
const load = intlCatalog;
/** Tab belgisi uchun soni; yuklab bo‘lmasa null (tab baribir ishlaydi, xatoni panel ko‘rsatadi). */
export const intlCount = () => load().then(l => l.length, () => null);
const link = (u, label) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '');
const na = () => `<span style="color:var(--muted)">${t('rasmiy saytda tekshiring')}</span>`;
const src = u => link(u, `<small>${t('manba')}</small>`);
const open = u => u.rd && daysLeft(u.rd) >= 0; // muddati o‘tgan sanani arizalar ro‘yxatiga qo‘shmaymiz

/** host ichiga qidiruv, davlat filtri va natijalarni chizadi. onAdd({ n, rd }) — arizalar ro‘yxatiga qo‘shish. */
export async function intlPanel(host, { onAdd, onCmp, onAbout } = {}) {
  let list;
  try { list = await load(); } catch (e) { host.innerHTML = errorBox(e.message, true); const b = $('[data-retry]', host); if (b) b.onclick = () => intlPanel(host, { onAdd, onCmp, onAbout }); return; }
  const { Q } = getProfile(), my = parseFloat(Q && Q.ielts) || null, prof = window.Scoring ? window.Scoring.normProfile({ gpa: Q.gpa, sc: Q.sc, sat: Q.sat, ielts: Q.ielts }) : null, hasP = !!(prof && window.Scoring.hasInput(prof)), today = new Date().toISOString().slice(0, 10), FIT = { yes: 'ok', part: 'warn', no: 'bad', unknown: 'mute' };
  const countries = [...new Set(list.map(c => c.country))].sort((a, b) => t(a).localeCompare(t(b)));
  let shown = PAGE, rows = [];
  host.innerHTML = `<div class="notice info" style="margin-bottom:16px">${svg('info')}<div>${t('Har bir ma’lumot universitetning rasmiy sahifasidan olingan va havolasi bor. Topilmagan yoki eskirgan ma’lumot ko‘rsatilmaydi — u “rasmiy saytda tekshiring” deb belgilanadi.')}</div></div>
  <div class="card" style="margin-bottom:16px"><div class="row"><div><label class="f" for="i-q">${t('Qidirish')}</label><input id="i-q" type="text" maxlength="60" placeholder="${t('Universitet, shahar yoki davlat')}"></div>
  <div><label class="f" for="i-c">${t('Davlat')}</label><select id="i-c"><option value="">${t('Hammasi')} (${list.length})</option>${countries.map(c => `<option value="${esc(c)}">${esc(t(c))} (${list.filter(u => u.country === c).length})</option>`).join('')}</select></div></div>
  <div class="row" style="margin-top:12px;align-items:center"><label class="sw"><input type="checkbox" id="i-en"> ${t('Faqat ingliz tilida')}</label><label class="sw"><input type="checkbox" id="i-ok"> ${t('Faqat muddati ochiq')}</label>${hasP && Q.ielts ? `<label class="sw"><input type="checkbox" id="i-ie"> ${t('Faqat IELTS yetarli')}</label>` : ''}</div></div><div id="i-r"></div>
  <div class="notice info" style="margin-top:16px">${svg('info')}<div>${t('Bu universitetlar uchun qabul ehtimoli (Safety/Target/Reach) hisoblanmaydi: ularning qabul statistikasi AQSh universitetlaridagidek ochiq emas. Buning o‘rniga profilingiz rasmiy talablarga (IELTS, o‘qish tili, muddat) qanchalik mosligi ko‘rsatiladi.')}</div></div>`;
  const fit = u => { if (!hasP) return ''; const f = window.Scoring.intlFit(u, prof, today); return `<span class="badge ${FIT[f.status]}">${t(f.label)}</span>`; };
  const out = $('#i-r', host), card = u => {
    const ie = u.ielts == null ? na() : `${u.ielts} ${src(u.ieltsUrl)}${my ? (my >= u.ielts ? ` <span class="badge ok">${t('sizning IELTS yetarli')}</span>` : ` <span class="badge warn">${t('sizga')} ${(u.ielts - my).toFixed(1)} ${t('ball yetishmaydi')}</span>`) : ''}`;
    const rd = u.rd ? `${dateL(u.rd, fmtDate)} ${src(u.rdUrl)}<br><small style="color:var(--muted)">${esc(pick(u.rdIntake))}</small>` : na();
    const tu = u.tuition ? `${u.tuition.amount.toLocaleString('en-US')} ${esc(u.tuition.cur)} / ${t('yil')} ${src(u.tuition.url)}` + (u.tuition.note ? `<br><small style="color:var(--muted)">${esc(pick(u.tuition.note))}</small>` : '') : na();
    return `<article class="card hover uc"><h3>${esc(u.n)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><span class="badge mute">${esc(t(u.country))}${u.city ? ', ' + esc(u.city) : ''}</span>${fit(u)}${u.eng === true ? `<span class="badge ok">${t('inglizcha bakalavr bor')}</span>` : u.eng === false ? `<span class="badge warn">${t('asosan inglizcha emas')}</span>` : ''}</div>
      <table class="tbl" style="font-size:14px"><tbody><tr><th>${t('IELTS (min)')}</th><td>${ie}</td></tr><tr><th>${t('Ariza muddati')}</th><td>${rd}</td></tr><tr><th>${t('O‘qish narxi')}</th><td>${tu}</td></tr></tbody></table>
      ${u.req ? `<p style="margin:10px 0 0;font-size:14px"><b>${t('Talab')}:</b> ${esc(pick(u.req))} ${src(u.reqUrl)}</p>` : ''}
      <div class="uc-act" style="margin-top:12px"><button class="btn sm" type="button" data-about="${esc(u.id)}">${t('Haqida')}</button>${onAdd ? `<button class="btn sm" type="button" data-add="${esc(u.id)}">${t('Arizaga qo‘shish')}</button>` : ''}${onCmp ? `<button class="btn sm" type="button" data-cmp="${esc(u.id)}">${t('Solishtirish')}</button>` : ''}<a class="btn sm" href="#/predictor?u=${encodeURIComponent(u.id)}">${t('Moslik')}</a>${u.url ? `<a class="btn sm" href="${esc(u.url)}" target="_blank" rel="noopener noreferrer">${t('Rasmiy sayt →')}</a>` : ''}<button class="link-btn" type="button" data-rep="${esc(u.n)}">${t('Xato topdingizmi?')}</button></div></article>`;
  };
  const draw = () => {
    out.innerHTML = rows.length
      ? `<div class="grid g2">${rows.slice(0, shown).map(card).join('')}</div>${shown < rows.length ? `<div class="fmore"><button class="btn" data-more type="button">${t('Yana ko‘rsatish')} <span class="c">+${Math.min(PAGE, rows.length - shown)}</span></button></div>` : ''}`
      : `<div class="card empty"><b>${t('Hech narsa topilmadi')}</b>${t('Boshqa so‘z yoki davlatni sinab ko‘ring.')}</div>`;
  };
  const filter = () => {
    const q = $('#i-q', host).value.trim().toLowerCase(), c = $('#i-c', host).value;
    const en = $('#i-en', host).checked, op = $('#i-ok', host).checked, ie = $('#i-ie', host) && $('#i-ie', host).checked;
    rows = list.filter(u => (!c || u.country === c) && (!q || [u.n, u.city, u.country, t(u.country)].join(' ').toLowerCase().includes(q)) && (!en || window.Scoring.langKind(u.lang) === 'yes') && (!op || open(u)) && (!ie || (my && u.ielts != null && my >= u.ielts)));
    shown = PAGE; draw();
  };
  out.onclick = e => {
    const g = s => e.target.closest(s); let b;
    if (g('[data-more]')) { shown += PAGE; draw(); return; }
    if ((b = g('[data-rep]'))) return reportError(b.dataset.rep);
    if ((b = g('[data-add]'))) { const u = list.find(x => x.id === b.dataset.add); if (u) onAdd(u); }
    if ((b = g('[data-cmp]'))) return onCmp(b.dataset.cmp);
    if ((b = g('[data-about]'))) return onAbout(b.dataset.about);
  };
  let tm = 0; $('#i-q', host).oninput = () => { clearTimeout(tm); tm = setTimeout(filter, 200); }; $('#i-c', host).onchange = filter; $$('#i-en, #i-ok, #i-ie', host).forEach(x => (x.onchange = filter)); filter();
}

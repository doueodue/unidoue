import { $, esc, svg, fmtDate, errorBox } from './core.js';
import { getProfile } from './views1.js';
import { t, pick, dateL } from './i18n.js';

let INTL;
async function load() {
  if (INTL) return INTL;
  const r = await fetch('/data/intl.json');
  if (!r.ok) throw new Error(t('Xalqaro universitetlar ro‘yxatini yuklab bo‘lmadi.'));
  return (INTL = await r.json());
}
const link = (u, label) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '');
const na = () => `<span style="color:var(--muted)">${t('rasmiy saytda tekshiring')}</span>`;
const src = u => link(u, `<small>${t('manba')}</small>`);

export async function intl(el) {
  let list;
  try { list = await load(); } catch (e) { el.innerHTML = errorBox(e.message, true); return; }
  const { Q } = getProfile(), my = parseFloat(Q && Q.ielts) || null;
  const countries = [...new Set(list.map(c => c.country))].sort((a, b) => t(a).localeCompare(t(b)));
  el.innerHTML = `<div class="page-h"><div><h2>${t('Boshqa davlatlar <em>universitetlari</em>')}</h2><p>${t('Har bir ma’lumot universitetning rasmiy sahifasidan olingan va havolasi bor. Topilmagan yoki eskirgan ma’lumot ko‘rsatilmaydi — u “rasmiy saytda tekshiring” deb belgilanadi.')}</p></div></div>
  <div class="card" style="margin-bottom:16px"><div class="row"><div><label class="f" for="i-q">${t('Qidirish')}</label><input id="i-q" type="text" maxlength="60" placeholder="${t('Universitet yoki shahar')}"></div>
  <div><label class="f" for="i-c">${t('Davlat')}</label><select id="i-c"><option value="">${t('Hammasi')} (${list.length})</option>${countries.map(c => `<option value="${esc(c)}">${esc(t(c))}</option>`).join('')}</select></div></div></div><div id="i-r"></div>
  <div class="notice info" style="margin-top:16px">${svg('info')}<div>${t('Bu universitetlar uchun qabul ehtimoli (Safety/Target/Reach) hisoblanmaydi: ularning qabul statistikasi AQSh universitetlaridagidek ochiq emas. Faqat talablar va muddatlar ko‘rsatiladi.')}</div></div>`;
  const out = $('#i-r', el), draw = () => {
    const q = $('#i-q', el).value.trim().toLowerCase(), c = $('#i-c', el).value;
    const rows = list.filter(u => (!c || u.country === c) && (!q || (u.n + ' ' + (u.city || '')).toLowerCase().includes(q)));
    out.innerHTML = rows.length ? `<div class="grid g2">${rows.map(u => {
      const ie = u.ielts == null ? na() : `${u.ielts} ${src(u.ieltsUrl)}${my ? (my >= u.ielts ? ` <span class="badge ok">${t('sizning IELTS yetarli')}</span>` : ` <span class="badge warn">${t('sizga')} ${(u.ielts - my).toFixed(1)} ${t('ball yetishmaydi')}</span>`) : ''}`;
      const rd = u.rd ? `${dateL(u.rd, fmtDate)} ${src(u.rdUrl)}<br><small style="color:var(--muted)">${esc(pick(u.rdIntake))}</small>` : na();
      const tu = u.tuition ? `${u.tuition.amount.toLocaleString('en-US')} ${esc(u.tuition.cur)} / ${t('yil')} ${src(u.tuition.url)}` + (u.tuition.note ? `<br><small style="color:var(--muted)">${esc(pick(u.tuition.note))}</small>` : '') : na();
      return `<article class="card hover"><h3>${esc(u.n)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><span class="badge mute">${esc(t(u.country))}${u.city ? ', ' + esc(u.city) : ''}</span>${u.eng === true ? `<span class="badge ok">${t('inglizcha bakalavr bor')}</span>` : u.eng === false ? `<span class="badge warn">${t('asosan inglizcha emas')}</span>` : ''}</div>
      <table class="tbl" style="font-size:14px"><tbody><tr><th>${t('IELTS (min)')}</th><td>${ie}</td></tr><tr><th>${t('Ariza muddati')}</th><td>${rd}</td></tr><tr><th>${t('O‘qish narxi')}</th><td>${tu}</td></tr></tbody></table>
      ${u.req ? `<p style="margin:10px 0 0;font-size:14px"><b>${t('Talab')}:</b> ${esc(pick(u.req))} ${src(u.reqUrl)}</p>` : ''}
      ${u.url ? `<p style="margin:10px 0 0">${link(u.url, t('Rasmiy sayt →'))}</p>` : ''}</article>`; }).join('')}</div>` : `<div class="card empty"><b>${t('Hech narsa topilmadi')}</b>${t('Boshqa so‘z yoki davlatni sinab ko‘ring.')}</div>`;
  };
  let tm = 0; $('#i-q', el).oninput = () => { clearTimeout(tm); tm = setTimeout(draw, 200); }; $('#i-c', el).onchange = draw; draw();
}

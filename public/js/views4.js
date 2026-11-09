import { $, $$, S, esc, svg, fmtDate, errorBox, ls } from './core.js';
import { getProfile } from './views1.js';

let INTL;
async function load() {
  if (INTL) return INTL;
  const r = await fetch('/data/intl.json');
  if (!r.ok) throw new Error('Xalqaro universitetlar ro‘yxatini yuklab bo‘lmadi.');
  return (INTL = await r.json());
}
const link = (u, t) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}</a>` : '');
const na = '<span style="color:var(--muted)">rasmiy saytda tekshiring</span>';

export async function intl(el) {
  let list;
  try { list = await load(); } catch (e) { el.innerHTML = errorBox(e.message, true); return; }
  const { Q } = getProfile(), my = parseFloat(Q && Q.ielts) || null;
  const countries = [...new Set(list.map(c => c.country))].sort((a, b) => a.localeCompare(b, 'uz'));
  el.innerHTML = `<div class="page-h"><div><h2>Boshqa davlatlar <em>universitetlari</em></h2><p>Har bir ma’lumot universitetning rasmiy sahifasidan olingan va havolasi bor. Topilmagan yoki eskirgan ma’lumot ko‘rsatilmaydi — u “rasmiy saytda tekshiring” deb belgilanadi.</p></div></div>
  <div class="card" style="margin-bottom:16px"><div class="row"><div><label class="f" for="i-q">Qidirish</label><input id="i-q" type="text" maxlength="60" placeholder="Universitet yoki shahar"></div>
  <div><label class="f" for="i-c">Davlat</label><select id="i-c"><option value="">Hammasi (${list.length})</option>${countries.map(c => `<option>${esc(c)}</option>`).join('')}</select></div></div></div><div id="i-r"></div>
  <div class="notice info" style="margin-top:16px">${svg('info')}<div>Bu universitetlar uchun qabul ehtimoli (Safety/Target/Reach) hisoblanmaydi: ularning qabul statistikasi AQSh universitetlaridagidek ochiq emas. Faqat talablar va muddatlar ko‘rsatiladi.</div></div>`;
  const out = $('#i-r', el), draw = () => {
    const q = $('#i-q', el).value.trim().toLowerCase(), c = $('#i-c', el).value;
    const rows = list.filter(u => (!c || u.country === c) && (!q || (u.n + ' ' + (u.city || '')).toLowerCase().includes(q)));
    out.innerHTML = rows.length ? `<div class="grid g2">${rows.map(u => {
      const ie = u.ielts == null ? na : `${u.ielts} ${link(u.ieltsUrl, '<small>manba</small>')}${my ? (my >= u.ielts ? ' <span class="badge ok">sizning IELTS yetarli</span>' : ` <span class="badge warn">sizga ${(u.ielts - my).toFixed(1)} ball yetishmaydi</span>`) : ''}`;
      const rd = u.rd ? `${fmtDate(u.rd)} ${link(u.rdUrl, '<small>manba</small>')}<br><small style="color:var(--muted)">${esc(u.rdIntake || '')}</small>` : na;
      const tu = u.tuition ? `${u.tuition.amount.toLocaleString('en-US')} ${esc(u.tuition.cur)} / yil ${link(u.tuition.url, '<small>manba</small>')}` + (u.tuition.note ? `<br><small style="color:var(--muted)">${esc(u.tuition.note)}</small>` : '') : na;
      return `<article class="card hover"><h3>${esc(u.n)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><span class="badge mute">${esc(u.country)}${u.city ? ', ' + esc(u.city) : ''}</span>${u.eng === true ? '<span class="badge ok">inglizcha bakalavr bor</span>' : u.eng === false ? '<span class="badge warn">asosan inglizcha emas</span>' : ''}</div>
      <table class="tbl" style="font-size:14px"><tbody><tr><th>IELTS (min)</th><td>${ie}</td></tr><tr><th>Ariza muddati</th><td>${rd}</td></tr><tr><th>O‘qish narxi</th><td>${tu}</td></tr></tbody></table>
      ${u.req ? `<p style="margin:10px 0 0;font-size:14px"><b>Talab:</b> ${esc(u.req)} ${link(u.reqUrl, '<small>manba</small>')}</p>` : ''}
      ${u.url ? `<p style="margin:10px 0 0">${link(u.url, 'Rasmiy sayt →')}</p>` : ''}</article>`; }).join('')}</div>` : '<div class="card empty"><b>Hech narsa topilmadi</b>Boshqa so‘z yoki davlatni sinab ko‘ring.</div>';
  };
  let t = 0; $('#i-q', el).oninput = () => { clearTimeout(t); t = setTimeout(draw, 200); }; $('#i-c', el).onchange = draw; draw();
}

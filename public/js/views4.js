/* Boshqa davlatlar universitetlari: karta va filtr. «Universitet qidiruvi» (views2.js) AQSh universitetlari bilan birga bitta ro‘yxatda chizadi. */
import { esc, fmtDate, daysLeft, intlCatalog } from './core.js';
import { getProfile } from './views1.js';
import { t, pick, dateL } from './i18n.js';

const load = intlCatalog;
const link = (u, label) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${label}</a>` : '');
const na = () => `<span style="color:var(--muted)">${t('rasmiy saytda tekshiring')}</span>`;
const src = u => link(u, `<small>${t('manba')}</small>`);
const open = u => u.rd && daysLeft(u.rd) >= 0; // muddati o‘tgan sanani arizalar ro‘yxatiga qo‘shmaymiz

/** Boshqa davlatlar kartasi va filtri (umumiy Universitet qidiruvi ishlatadi). Xato bo‘lsa istisno tashlaydi. */
export async function intlTools() {
  const list = await load();
  const { Q } = getProfile(), my = parseFloat(Q && Q.ielts) || null, prof = window.Scoring ? window.Scoring.normProfile({ gpa: Q.gpa, sc: Q.sc, sat: Q.sat, ielts: Q.ielts }) : null, hasP = !!(prof && window.Scoring.hasInput(prof)), today = new Date().toISOString().slice(0, 10), FIT = { yes: 'ok', part: 'warn', no: 'bad', unknown: 'mute' };
  const fit = u => { if (!hasP) return ''; const f = window.Scoring.intlFit(u, prof, today); return `<span class="badge ${FIT[f.status]}">${t(f.label)}</span>`; };
  /** Moslik darajasi bloki: mezonlar bo‘yicha qator + "nima kerak". Profil bo‘lmasa ham talablar ro‘yxati ko‘rinadi. */
  const TN = { good: 'ok', warn: 'warn', bad: 'bad', info: 'mute' }, TL = { good: 'mos', warn: 'diqqat', bad: 'mos emas', info: 'ma’lumot' };
  const fitBox = u => {
    const f = window.Scoring.intlFit(u, prof || window.Scoring.normProfile({}), today), chk = f.parts.filter(x => x.tone !== 'info'), good = f.cnt.good;
    const head = hasP ? `<span class="badge ${FIT[f.status]}">${t(f.label)}</span>` : `<span class="badge mute">${t('Profil kiritilmagan')}</span>`;
    const meter = hasP && chk.length ? `<div class="fitb-m" role="img" aria-label="${good}/${chk.length}">${chk.map(x => `<i class="${TN[x.tone]}"></i>`).join('')}</div><small class="fitb-c">${t('Mezonlar')}: <b>${good}</b>/<b>${chk.length}</b> ${t('mos')}</small>` : '';
    const rows = f.parts.filter(x => x.k !== 'Narx').map(x => `<li><span class="badge ${TN[x.tone]}">${t(TL[x.tone])}</span><span><b>${t(x.k)}</b> — ${esc(t(x.t))}</span></li>`).join('');
    const need = hasP ? f.advice : f.advice.filter(a => !/natijangizni profilga/.test(a));
    return `<div class="fitb"><div class="fitb-h"><b>${t('Moslik darajasi')}</b>${head}</div>${meter}<ul class="fitb-l">${rows}</ul>${need.length ? `<div class="fitb-n"><b>${t('Moslik uchun nima kerak')}</b><ul>${need.map(a => `<li>${esc(t(a))}</li>`).join('')}</ul></div>` : ''}${hasP ? '' : `<p class="fitb-p">${t('Moslik darajasini ko‘rish uchun IELTS, GPA yoki SAT natijangizni kiriting.')} <a href="#/predictor">${t('Profilni to‘ldirish')}</a></p>`}</div>`;
  };
  const card = u => {
    const ie = u.ielts == null ? (u.ieltsNote ? `<small>${esc(pick(u.ieltsNote))}</small> ${src(u.ieltsNoteUrl)}` : na()) : `${u.ielts} ${src(u.ieltsUrl)}${my ? (my >= u.ielts ? ` <span class="badge ok">${t('sizning IELTS yetarli')}</span>` : ` <span class="badge warn">${t('sizga')} ${(u.ielts - my).toFixed(1)} ${t('ball yetishmaydi')}</span>`) : ''}`;
    const rd = u.rd ? `${dateL(u.rd, fmtDate)} ${src(u.rdUrl)}<br><small style="color:var(--muted)">${esc(pick(u.rdIntake))}</small>` : na();
    const tu = u.tuition ? `${u.tuition.amount.toLocaleString('en-US')} ${esc(u.tuition.cur)} / ${t('yil')} ${src(u.tuition.url)}` + (u.tuition.note ? `<br><small style="color:var(--muted)">${esc(pick(u.tuition.note))}</small>` : '') : na();
    return `<article class="card hover uc"><h3>${esc(u.n)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><span class="badge mute">${esc(t(u.country))}${u.city ? ', ' + esc(u.city) : ''}</span>${fit(u)}${u.eng === true ? `<span class="badge ok">${t('inglizcha bakalavr bor')}</span>` : u.eng === false ? `<span class="badge warn">${t('asosan inglizcha emas')}</span>` : ''}</div>
      <table class="tbl" style="font-size:14px"><tbody><tr><th>${t('IELTS (min)')}</th><td>${ie}</td></tr>${u.sat != null ? `<tr><th>${t('SAT (min)')}</th><td>${u.sat} ${src(u.satUrl)}${prof && prof.sat != null ? (prof.sat >= u.sat ? ` <span class="badge ok">${t('sizning SAT yetarli')}</span>` : ` <span class="badge warn">${t('sizga')} ${u.sat - prof.sat} ${t('ball yetishmaydi')}</span>`) : ''}</td></tr>` : ''}<tr><th>${t('Ariza muddati')}</th><td>${rd}</td></tr><tr><th>${t('O‘qish narxi')}</th><td>${tu}</td></tr></tbody></table>
      ${fitBox(u)}
      ${u.req ? `<p style="margin:10px 0 0;font-size:14px"><b>${t('Talab')}:</b> ${esc(pick(u.req))} ${src(u.reqUrl)}</p>` : ''}
      <div class="uc-act" style="margin-top:12px"><button class="btn sm" type="button" data-about="${esc(u.id)}">${t('Haqida')}</button><button class="btn sm" type="button" data-add="${esc(u.id)}">${t('Arizaga qo‘shish')}</button><button class="btn sm" type="button" data-cmp="${esc(u.id)}">${t('Solishtirish')}</button><a class="btn sm" href="#/predictor?u=${encodeURIComponent(u.id)}">${t('Moslik')}</a>${u.url ? `<a class="btn sm" href="${esc(u.url)}" target="_blank" rel="noopener noreferrer">${t('Rasmiy sayt →')}</a>` : ''}<button class="link-btn" type="button" data-rep="${esc(u.n)}">${t('Xato topdingizmi?')}</button></div></article>`;
  };
  /** Filtr: davlat (bo‘sh = hammasi), ingliz tilida, muddati ochiq, IELTS yetarli. */
  const pass = (u, o = {}) => (!o.en || window.Scoring.langKind(u.lang) === 'yes') && (!o.op || open(u)) && (!o.ie || (my && u.ielts != null && my >= u.ielts));
  return { list, card, pass, hasIe: !!(hasP && Q.ielts) };
}

/* Universitet kartalarining umumiy bo‘laklari: QS dunyo reytingi belgisi, ball halqasi, "nima uchun mos" bloki.
   Finder (views2.js) va boshqa davlatlar kartasi (views4.js) bir xil ko‘rinish uchun shu yerdan foydalanadi. */
import { esc } from './core.js';
import { t } from './i18n.js';

export const TIER = { safety: 'Safety', target: 'Target', reach: 'Reach' };
const GLOBE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/></svg>';

/** QS World University Rankings 2027 bo‘yicha dunyo o‘rni. "=2" (teng o‘rin), "45", "751-760" (oraliq) yoki yo‘q (reytingda topilmadi). */
export function rankChip(c) {
  const q = c && c.qs != null ? String(c.qs) : '', ed = 'QS 2027';
  if (!q) return `<span class="rk rk-no" title="${esc(t('QS 2027 umumiy jadvalida topilmadi'))}">${GLOBE}<b>—</b><i>${ed}</i></span>`;
  const n = parseInt(q.replace('=', ''), 10), cls = n <= 10 ? 'top' : n <= 100 ? 'hi' : n <= 500 ? 'mid' : 'lo';
  const tip = [t('QS World University Rankings 2027 bo‘yicha dunyo reytingi') + ': ' + q.replace('=', '').replace('-', '–'), q[0] === '=' ? t('teng o‘rin') : q.includes('-') ? t('o‘rin oralig‘i') : '', c.qsAs ? t('Reyting shu tashkilot uchun berilgan') + ': ' + c.qsAs : ''].filter(Boolean).join(' · ');
  return `<span class="rk rk-${cls}" title="${esc(tip)}">${GLOBE}<b>#${esc(q.replace('=', '').replace('-', '–'))}</b><i>${ed}</i></span>`;
}

/** Karta tepasi: avval QS o‘rni, so‘ng (agar hisoblangan bo‘lsa) ball halqasi, nom va Safety/Target/Reach belgisi. */
export function cardTop(c, r, ctry) {
  const rk = `<div class="rk-row">${rankChip(c)}</div>`;
  if (!r) return `${rk}${ctry ? `<div class="ctry">${esc(t(c.country))}</div>` : ''}<h3>${esc(c.n)}</h3>`;
  return `${rk}<div class="uc-top"><div class="score" style="--p:${r.score}">${r.score}</div><div class="uc-id"><div class="ctry">${esc(t(c.country))}</div><h3>${esc(c.n)}</h3></div><span class="badge ${r.tier}">${TIER[r.tier]}</span></div>`;
}

/** "Nima uchun mos": Pro tarifda mezonlar, boshqalarda qulf. Taxminiy hisob (est) alohida eslatiladi. */
export function whyBlock(r) {
  if (!r.why) return `<div class="lock" style="border-radius:12px"><div class="lock-in"><p>Nima uchun mos ekani: SAT, GPA va IELTS bo‘yicha tushuntirish shu yerda ko‘rinadi.</p><p>Universitet ko‘rsatkichlari bilan solishtirish batafsil yoziladi.</p></div><div class="lock-cta"><button class="btn primary sm" data-up>Tushuntirishni ochish (Plus)</button></div></div>`;
  return `<p class="uc-lvl">${esc(r.level)}</p><ul class="uc-why">${r.why.map(w => `<li>${esc(w.t)}</li>`).join('')}</ul><p class="hint">${esc(r.basis)}${r.confident ? '' : ' · bu daraja taxminiy'}</p>${r.est ? `<p class="hint">${esc(t('SAT va GPA ko‘rsatkichlari bu universitet uchun rasmiy ochiq emas: ular QS reytingi asosida taxminiy baholandi.'))}</p>` : ''}`;
}

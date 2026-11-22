/* Portfolio AI amallari: sayqallash (matn), rasmdan o'qish va baholash. AI faqat foydalanuvchi bergan ma'lumotdan foydalanadi;
 * har bir taklif qo'llashdan oldin ko'rsatiladi va tahrirlanadi. */
import { $, $$, S, esc, toast, modal, aiFlag } from './core.js';
import { t as tr, lang } from './i18n.js';
import { md } from './markdown.js';
import { streamAI, askAI } from './views3.js';
import { normalize, actText, MAX, uid } from './pfmodel.js';
import { designFromAI } from './pfdesign.js';

const off = () => { if (S.account.config.ai) return false; toast('AI hozircha ulanmagan.', 'err'); return true; };
const busy = async (btn, f) => { if (btn) btn.disabled = true; try { return await f(); } finally { if (btn) btn.disabled = false; } };
const slim = st => ({ ...normalize(st.pf), photo: '' });
const fail = e => { if (e && (e.code === 'AI_LIMIT' || e.code === 'PLAN_REQUIRED')) return; toast(e && e.code === 'AI_NO_VISION' ? e.message : (e && e.message) || 'Xatolik yuz berdi.', 'err'); };
export const parseJson = s => {
  const t = String(s || '').replace(/```(?:json)?/gi, ''), i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i < 0 || j <= i) throw new Error('AI javobini o‘qib bo‘lmadi. Qayta urinib ko‘ring.');
  try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { throw new Error('AI javobini o‘qib bo‘lmadi. Qayta urinib ko‘ring.'); }
};
const wideModal = () => { const bg = $$('.modal-bg').pop(); $('.modal', bg).classList.add('pf-wide'); return bg; };
const LV = [['', 'Daraja'], ['school', 'Maktab'], ['regional', 'Viloyat'], ['national', 'Respublika'], ['international', 'Xalqaro']];

/** Faoliyat/loyiha yozuvlarini (va sarlavha/tavsifni) AI bilan yaxshilash. Natija modalda ko'rsatiladi. */
export async function polish(st, { kinds = [], need = [] }, refresh, btn) {
  if (off()) return;
  const items = []; kinds.forEach(k => st.pf[k].forEach(a => { if (String(a.what || '').trim().length >= 8) items.push({ id: a.id, kind: k === 'projects' ? 'project' : 'activity', title: a.title, org: a.org, role: a.role, what: a.what, scale: a.scale, result: a.result }); }));
  if (!items.length && !need.length) { toast('Avval “Nima qildingiz?” maydoniga kamida bir gap yozing.', 'err'); return; }
  let j; try { await busy(btn, async () => { toast('AI yozmoqda…'); const r = await askAI({ tool: 'portfolio', mode: 'polish', docLang: st.pf.lang, items, need, pf: slim(st) }); j = parseJson(r.reply); }); } catch (e) { fail(e); return; }
  const by = Object.fromEntries(kinds.flatMap(k => st.pf[k].map(a => [a.id, a])));
  const props = (Array.isArray(j.items) ? j.items : []).filter(x => x && by[x.id] && typeof x.text === 'string' && x.text.trim()).map(x => ({ id: x.id, a: by[x.id], text: x.text.trim().slice(0, 500) }));
  const hs = need.includes('headline') && typeof j.headline === 'string' ? j.headline.trim().slice(0, 140) : '', sm = need.includes('summary') && typeof j.summary === 'string' ? j.summary.trim().slice(0, 700) : '';
  if (!props.length && !hs && !sm) { toast('AI taklif bera olmadi. Ma’lumotni batafsilroq yozing.', 'err'); return; }
  const row = (key, label, before, after, rows) => `<div class="pf-prop"><label class="pf-chk"><input type="checkbox" data-c="${key}" checked><b>${esc(label)}</b></label>${before ? `<p class="pf-was"><span>Avval</span>${esc(before)}</p>` : ''}<textarea data-v="${key}" rows="${rows}" maxlength="700" aria-label="${esc(label)}">${esc(after)}</textarea></div>`;
  const body = `<p class="hint" style="margin-top:0">AI faqat siz yozgan ma’lumotdan foydalandi. Qo‘llashdan oldin matnni tahrirlang va faktlar to‘g‘riligini tekshiring.</p><div class="pf-props">${hs ? row('@headline', tr('Qisqa sarlavha'), st.pf.headline, hs, 2) : ''}${sm ? row('@summary', tr('Qisqa tavsif'), st.pf.summary, sm, 4) : ''}${props.map(p => row(p.id, p.a.title || tr('Faoliyat'), actText(p.a), p.text, 3)).join('')}</div>`;
  const pr = modal({ title: 'AI taklifi', body, actions: [{ label: 'Bekor qilish', value: 0 }, { label: 'Tanlanganlarni qo‘llash', value: 1, cls: 'primary' }], collect: bg => Object.fromEntries($$('.pf-prop', bg).filter(r => $('[data-c]', r).checked).map(r => [$('[data-c]', r).dataset.c, $('[data-v]', r).value.trim()]).filter(x => x[1])) });
  wideModal(); if (await pr !== 1) return;
  const pick = modal.data || {}; let n = 0;
  if (pick['@headline']) { st.pf.headline = pick['@headline'].slice(0, 140); n++; } if (pick['@summary']) { st.pf.summary = pick['@summary'].slice(0, 700); n++; }
  props.forEach(p => { if (pick[p.id]) { p.a.text = pick[p.id].slice(0, 500); n++; } });
  if (n) { toast(`${tr('Yozuvlar yangilandi:')} ${n}`); refresh(true); }
}

/** Sertifikat/diplom rasmlaridan ma'lumot o'qish (vision). Natija tahrirlanib, qo'shishdan oldin tasdiqlanadi. */
export async function extract(st, refresh, btn) {
  if (off()) return;
  if (!S.account.config.vision) { toast('Rasmdan o‘qish bu serverda yoqilmagan. Ma’lumotni qo‘lda kiriting.', 'err'); return; }
  const ids = st.pf.att.filter(a => st.pick.has(a.id) && st.imgs[a.id]).slice(0, 3).map(a => a.id);
  if (!ids.length) { toast('Avval o‘qitiladigan rasmni belgilang.', 'err'); return; }
  let j; try { await busy(btn, async () => { toast('AI rasmlarni o‘qiyapti…'); const r = await askAI({ tool: 'portfolio', mode: 'extract', docLang: 'en', images: ids.map(i => st.imgs[i].url) }); j = parseJson(r.reply); }); } catch (e) { fail(e); return; }
  ids.forEach(i => { st.read.add(i); st.pick.delete(i); });
  const items = (Array.isArray(j.items) ? j.items : []).filter(x => x && typeof x === 'object' && (x.title || x.score)).slice(0, 6);
  if (!items.length) { toast('Rasmlardan o‘qiladigan ma’lumot topilmadi. Aniqroq rasm yuklang yoki qo‘lda kiriting.', 'err'); refresh(); return; }
  const s = (v, n) => String(v == null ? '' : v).slice(0, n), kind = k => (k === 'test' || k === 'activity' ? k : 'award');
  const row = (x, i) => `<div class="pf-prop" data-i="${i}"><label class="pf-chk"><input type="checkbox" data-c checked><b>${esc(s(x.title, 60) || tr('Hujjat'))}</b></label>
    <div class="pf-cols pf-c2"><div class="field"><label class="f">Turi</label><select data-t>${[['award', 'Yutuq'], ['test', 'Imtihon natijasi'], ['activity', 'Faoliyat']].map(([k, l]) => `<option value="${k}"${kind(x.kind) === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div><div class="field"><label class="f">Nomi</label><input data-f="title" maxlength="120" value="${esc(s(x.title, 120))}"></div></div>
    <div class="pf-cols pf-c3"><div class="field"><label class="f">Bergan tashkilot</label><input data-f="issuer" maxlength="80" value="${esc(s(x.issuer, 80))}"></div><div class="field"><label class="f">Yil</label><input data-f="year" maxlength="8" value="${esc(s(x.year, 8))}"></div><div class="field"><label class="f">Natija / ball</label><input data-f="score" maxlength="24" value="${esc(s(x.score, 24))}"></div></div>
    <div class="field"><label class="f">Daraja</label><select data-f="level">${LV.map(([k, l]) => `<option value="${k}"${k === x.level ? ' selected' : ''}>${l}</option>`).join('')}</select></div></div>`;
  const pr = modal({ title: 'Rasmdan o‘qilgan ma’lumot', body: `<p class="hint" style="margin-top:0">AI xato o‘qishi mumkin. Har bir qatorni rasmga qarab tekshiring, kerak bo‘lsa tuzating.</p><div class="pf-props">${items.map(row).join('')}</div>`, actions: [{ label: 'Bekor qilish', value: 0 }, { label: 'Tanlanganlarni qo‘shish', value: 1, cls: 'primary' }], collect: bg => $$('.pf-prop', bg).filter(r => $('[data-c]', r).checked).map(r => ({ k: $('[data-t]', r).value, ...Object.fromEntries($$('[data-f]', r).map(i => [i.dataset.f, i.value.trim()])) })) });
  wideModal(); if (await pr !== 1) return;
  const add = modal.data || [], one = ids.length === 1 && add.length === 1; let n = 0;
  for (const x of add) {
    if (x.k === 'test' && st.pf.tests.length < MAX.tests && (x.title || x.score)) { st.pf.tests.push({ id: uid(), name: x.title || 'Test', score: x.score, date: x.year }); n++; }
    else if (x.k === 'activity' && st.pf.acts.length < MAX.acts && x.title) { st.pf.acts.push({ id: uid(), title: x.title, org: x.issuer, role: '', from: x.year, to: '', hours: '', what: '', scale: '', result: x.score, text: '', url: '' }); n++; }
    else if (x.k === 'award' && st.pf.awards.length < MAX.awards && x.title) { st.pf.awards.push({ id: uid(), title: x.title, issuer: x.issuer, year: x.year, level: x.level, note: x.score, img: one ? ids[0] : '' }); n++; if (one) { const a = st.pf.att.find(z => z.id === ids[0]); if (a && !a.cap) a.cap = x.title.slice(0, 100); } }
  }
  if (n) { ['edu', 'acts', 'awards'].forEach(k => st.open.add(k === 'edu' ? 'edu' : k)); toast(`${tr('Yozuvlar qo‘shildi:')} ${n}`); refresh(true); } else toast('Hech narsa qo‘shilmadi. Nomini kiriting.', 'err');
}

/** AI baho: portfolioni o'qib, kuchli tomonlari va bo'shliqlarini aytadi (oqimli). */
export async function review(st, getHost, btn) {
  if (off()) return; const p = slim(st), host = getHost();
  if (!host) return; if (!p.name && !p.acts.length && !p.awards.length && !p.projects.length) { toast('Avval portfolioga ma’lumot kiriting.', 'err'); return; }
  host.innerHTML = '<div class="sk" style="height:140px"></div>';
  await busy(btn, async () => {
    try {
      const r = await streamAI({ tool: 'portfolio', mode: 'review', pf: p, docLang: p.lang }, txt => { const h = getHost(); if (h) h.innerHTML = `<div class="pre">${md(txt)}</div>`; });
      st.rvText = r.reply; const h = getHost(); if (h) { h.innerHTML = `<div class="pre">${md(r.reply)}</div><p class="hint">${tr('AI xato qilishi mumkin. Baho qabul natijasini bashorat qilmaydi.')}</p>`; aiFlag($('.pre', h), 'portfolio', r.reply); }
    } catch (e) { const h = getHost(); if (h) h.innerHTML = e.code === 'AI_NOT_CONFIGURED' ? '' : `<p class="msg err">${esc(e.message)}</p>`; }
  });
}

/** AI dizayner (Pro): shablon, rang, shrift, fon va effektlarni tanlaydi. Javob oq ro'yxat bo'yicha tozalanadi (designFromAI); taklif darhol qo'llanadi, "qaytarish" bilan bekor qilinadi. */
export async function design(st, wish, apply, btn) {
  if (off()) return;
  let j; try { await busy(btn, async () => { toast('AI dizayn tanlamoqda…'); const r = await askAI({ tool: 'portfolio', mode: 'design', docLang: st.pf.lang, uiLang: lang(), wish, pf: slim(st) }); j = parseJson(r.reply); }); } catch (e) { fail(e); return; }
  apply(designFromAI(j, 'pro'));
}

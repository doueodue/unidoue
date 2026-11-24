'use strict';
/* Admin qoʻlda qoʻshadigan universitetlar (boshqa davlatlar). Sof mantiq: server.js chaqiradi, testlar bevosita sinaydi.
 * db.unis[id] = intl.json bilan bir xil shakldagi yozuv. Yangi id → ro‘yxatga qoʻshiladi; mavjud id → shu universitetni almashtiradi.
 * Qoida (sayt bo‘ylab bir xil): har bir son/sana/talab rasmiy https manba havolasi bilan; manbasi yoʻq qiymat yozilmaydi. */
const MAX = 600;
const slug = n => String(n || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const txt = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const long = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, max);
const url = v => { const s = txt(v, 500); if (!s) return ''; try { const u = new URL(s); return u.protocol === 'https:' && u.hostname.includes('.') ? u.href : null; } catch (e) { return null; } };
const CUR = /^[A-Z]{3}$/;
const num = v => (v === '' || v == null ? null : Number(String(v).replace(/[\s,]/g, '')));
const mk = t => (t ? { uz: t } : null);

/** Shakl maʻlumotini tozalaydi. { error } yoki { uni } qaytaradi. usIds — AQSh katalogidagi id lar (to‘qnashmasin). */
function clean(b, usIds) {
  b = b && typeof b === 'object' ? b : {};
  const n = txt(b.n, 120), country = txt(b.country, 60);
  if (n.length < 2) return { error: 'Universitet nomini kiriting.' };
  if (!country) return { error: 'Davlatni kiriting.' };
  const id = txt(b.id, 140) || slug(n);
  if (!/^[a-z0-9][a-z0-9-]{1,139}$/.test(id)) return { error: 'Nomda lotin harflari boʻlsin (id yaratib boʻlmadi).' };
  if (usIds && usIds.has(id)) return { error: 'Bu id AQSh universitetlari roʻyxatida allaqachon bor.' };
  const site = url(b.url); if (site === null) return { error: 'Rasmiy sayt manzili https:// bilan boshlansin.' };
  const o = { id, n, country, city: txt(b.city, 80) || null, url: site || null, lang: txt(b.lang, 80) || null, eng: b.eng === true || b.eng === 'yes' ? true : b.eng === false || b.eng === 'no' ? false : null,
    ielts: null, ieltsUrl: null, ieltsNote: null, sat: null, satUrl: null, ieltsNoteUrl: null, rd: null, rdIntake: null, rdUrl: null, tuition: null, req: null, reqUrl: null };
  const ie = num(b.ielts);
  if (ie != null) {
    if (!(ie >= 4 && ie <= 9)) return { error: 'IELTS 4 dan 9 gacha boʻlsin.' };
    const u = url(b.ieltsUrl); if (!u) return { error: 'IELTS uchun rasmiy manba havolasi (https://) kerak.' };
    o.ielts = Math.round(ie * 2) / 2; o.ieltsUrl = u;
  } else if (txt(b.ieltsNote, 600)) {
    const u = url(b.ieltsNoteUrl); if (!u) return { error: 'IELTS izohi uchun rasmiy manba havolasi (https://) kerak.' };
    o.ieltsNote = mk(txt(b.ieltsNote, 600)); o.ieltsNoteUrl = u;
  }
  const st = num(b.sat);
  if (st != null) {
    if (!(st >= 400 && st <= 1600)) return { error: 'SAT 400 dan 1600 gacha boʻlsin.' };
    const u = url(b.satUrl); if (!u) return { error: 'SAT uchun rasmiy manba havolasi (https://) kerak.' };
    o.sat = Math.round(st / 10) * 10; o.satUrl = u;
  }
  const rd = txt(b.rd, 10);
  if (rd) {
    if (!/^20\d\d-\d\d-\d\d$/.test(rd) || isNaN(new Date(rd + 'T00:00:00Z'))) return { error: 'Ariza muddati sanasi notoʻgʻri (YYYY-MM-DD).' };
    const u = url(b.rdUrl); if (!u) return { error: 'Ariza muddati uchun rasmiy manba havolasi (https://) kerak.' };
    o.rd = rd; o.rdUrl = u; o.rdIntake = mk(txt(b.rdIntake, 200));
  }
  const ta = num(b.tuition);
  if (ta != null) {
    const cur = txt(b.cur, 10).toUpperCase();
    if (!(ta >= 0 && ta <= 1e9) || !Number.isFinite(ta)) return { error: 'Oʻqish narxi notoʻgʻri.' };
    if (!CUR.test(cur)) return { error: 'Valyuta 3 harfli kod boʻlsin (masalan USD, EUR, GBP).' };
    const u = url(b.tuitionUrl); if (!u) return { error: 'Oʻqish narxi uchun rasmiy manba havolasi (https://) kerak.' };
    o.tuition = { amount: Math.round(ta), cur, note: mk(txt(b.tuitionNote, 300)), url: u };
  }
  const rq = long(b.req, 1200);
  if (rq) { const u = url(b.reqUrl); if (!u) return { error: 'Talab matni uchun rasmiy manba havolasi (https://) kerak.' }; o.req = mk(rq); o.reqUrl = u; }
  if (o.ielts == null && !o.ieltsNote && o.sat == null && !o.rd && !o.tuition && !o.req) return { error: 'Kamida bitta maʻlumot (IELTS, SAT, muddat, narx yoki talab) manbasi bilan kiritilsin.' };
  return { uni: o };
}

/** Asosiy roʻyxat + admin yozuvlari: bir xil id almashtiriladi, yangilari qoʻshiladi. Har yozuvga src: base | custom | override.
 *  Almashtirilganda QS o‘rni (qs, qsAs) asosiy ro‘yxatdan saqlanadi: admin shaklida bu maydon yo‘q. */
function merge(base, extra) {
  extra = extra || {}; const seen = new Set(), out = [];
  for (const u of base) { const e = extra[u.id]; seen.add(u.id); out.push(e ? { ...e, ...(u.qs ? { qs: u.qs } : {}), ...(u.qsAs ? { qsAs: u.qsAs } : {}), src: 'override' } : { ...u, src: 'base' }); }
  for (const id of Object.keys(extra)) if (!seen.has(id)) out.push({ ...extra[id], src: 'custom' });
  return out.sort((a, b) => String(a.country).localeCompare(String(b.country), 'uz') || String(a.n).localeCompare(String(b.n)));
}
const strip = list => list.map(({ src, ...u }) => u);

module.exports = { clean, merge, strip, slug, MAX };

'use strict';
/* Promo kodlar: admin yaratadi (tarif, muddat, necha kishi), foydalanuvchi kiritadi — Plus/Pro belgilangan muddatga bepul yoqiladi.
 * Sof mantiq (HTTP va bazaga bogʻliq emas): server.js shuni chaqiradi, testlar bevosita sinaydi.
 * db.promos[KOD] = { code, plan, days, max, used, active, until, note, created, redeemed: [{ u, e, h, t }] } */
const crypto = require('crypto');

const DAY = 864e5;
const LIMITS = { codes: 300, uses: 5000, days: 3660 };
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 0/O, 1/I/L aralashmasin
const PLAN_IDS = ['plus', 'pro'];

const hashEmail = e => crypto.createHash('sha256').update('promo:' + String(e || '').toLowerCase()).digest('hex').slice(0, 24);
/** Kod katta harfga, boʻsh joy va tire turlari bir xil koʻrinishga keltiriladi (foydalanuvchi qanday yozmasin). */
const normCode = s => String(s == null ? '' : s).normalize('NFKC').toUpperCase().replace(/[‐‑‒–—−]/g, '-').replace(/\s+/g, '').slice(0, 40);
const validCode = c => /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(c);

function genCode(exists) {
  for (let k = 0; k < 20; k++) {
    const b = crypto.randomBytes(8); let s = '';
    for (let i = 0; i < 8; i++) s += ALPHA[b[i] % ALPHA.length];
    const c = 'UD-' + s.slice(0, 4) + '-' + s.slice(4);
    if (!exists(c)) return c;
  }
  return '';
}

const int = (v, d) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : d; };
/** "2026-12-31" → shu kun oxirigacha (Toshkent vaqti, UTC+5). Notoʻgʻri sana — null. */
function dayEnd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T23:59:59+05:00`);
  return Number.isFinite(t) ? t : null;
}

/** Admin yaratadi. Qaytadi: { promo } yoki { error, status }. */
function create(db, b, now = Date.now(), clean = s => String(s == null ? '' : s).trim()) {
  b = b || {};
  if (!PLAN_IDS.includes(b.plan)) return { error: 'Tarifni tanlang: Plus yoki Pro.', status: 400 };
  const days = int(b.days, 30), max = int(b.max, 1);
  if (days < 1 || days > LIMITS.days) return { error: `Muddat 1 dan ${LIMITS.days} kungacha boʻlishi kerak.`, status: 400 };
  if (max < 1 || max > LIMITS.uses) return { error: `Foydalanuvchilar soni 1 dan ${LIMITS.uses} gacha boʻlishi kerak.`, status: 400 };
  let until = null;
  if (b.until) {
    until = dayEnd(b.until);
    if (!until) return { error: 'Amal qilish sanasi notoʻgʻri (YYYY-MM-DD).', status: 400 };
    if (until < now) return { error: 'Amal qilish sanasi oʻtib ketgan.', status: 400 };
  }
  if (Object.keys(db.promos).length >= LIMITS.codes) return { error: `Promo kodlar soni ${LIMITS.codes} tadan oshmasin. Keraksizlarini oʻchiring.`, status: 400 };
  let code = normCode(b.code);
  if (code) {
    if (!validCode(code)) return { error: 'Kod 3–32 belgi: faqat lotin harflari, raqamlar, “-” va “_”.', status: 400 };
  } else {
    code = genCode(c => !!db.promos[c]);
    if (!code) return { error: 'Kod yaratib boʻlmadi, qayta urinib koʻring.', status: 500 };
  }
  if (db.promos[code]) return { error: 'Bunday kod allaqachon bor.', status: 409 };
  const promo = { code, plan: b.plan, days, max, used: 0, active: true, until, note: clean(b.note, 80), created: now, redeemed: [] };
  db.promos[code] = promo;
  return { promo };
}

const statusOf = (p, now) => !p.active ? 'paused' : (p.until && p.until < now) ? 'expired' : p.used >= p.max ? 'full' : 'active';
/** Admin roʻyxati uchun: kimlar foydalangani (oxirgi 6 ta) bilan. */
const view = (p, now = Date.now()) => ({
  code: p.code, plan: p.plan, days: p.days, max: p.max, used: p.used, active: !!p.active, until: p.until || null, note: p.note || '', created: p.created,
  status: statusOf(p, now), recent: p.redeemed.slice(-6).reverse().map(r => ({ email: r.e || '', t: r.t }))
});

/** Foydalanuvchi kiritadi. ctx = { effPlan(u) → { id }, order } . Qaytadi: { ok, plan, days, until } yoki { error, status, code }.
 * Hech narsa oʻzgarmaydi, agar kod yaroqsiz boʻlsa; joy faqat tarif haqiqatan berilganda band qilinadi. */
function redeem(db, u, rawCode, now, ctx) {
  const code = normCode(rawCode), p = validCode(code) ? db.promos[code] : null;
  if (!p) return { error: 'Bunday promo kod topilmadi. Yozilishini tekshiring.', status: 404, code: 'PROMO_NOT_FOUND' };
  if (!p.active) return { error: 'Bu promo kod hozir faol emas.', status: 410, code: 'PROMO_PAUSED' };
  if (p.until && p.until < now) return { error: 'Bu promo kodning amal qilish muddati tugagan.', status: 410, code: 'PROMO_EXPIRED' };
  const h = hashEmail(u.email);
  if (p.redeemed.some(r => r.u === u.id || r.h === h)) return { error: 'Siz bu promo koddan allaqachon foydalangansiz.', status: 409, code: 'PROMO_USED' };
  if (p.used >= p.max) return { error: 'Bu promo kod boʻyicha joylar tugagan.', status: 410, code: 'PROMO_FULL' };
  const cur = ctx.effPlan(u).id, order = ctx.order;
  if (order[cur] > order[p.plan]) return { error: 'Sizda bundan yuqoriroq tarif faol, shuning uchun bu kod kerak emas.', status: 409, code: 'PROMO_LOWER' };
  if (cur === p.plan && !u.planUntil) return { error: 'Bu tarif sizda muddatsiz yoqilgan.', status: 409, code: 'PROMO_UNLIMITED' };
  const ms = p.days * DAY;
  if (cur === p.plan) u.planUntil += ms;        // shu tarif davom etmoqda: muddat ustiga qoʻshiladi
  else { u.plan = p.plan; u.planUntil = now + ms; } // yuqoriroq tarifga oʻtish: bugundan boshlanadi
  if (u.planReq && order[u.planReqPlan || 'pro'] <= order[p.plan]) { delete u.planReq; delete u.planReqPlan; }
  p.used++; p.redeemed.push({ u: u.id, e: u.email, h, t: now });
  return { ok: true, plan: p.plan, days: p.days, until: u.planUntil, code: p.code };
}

/** Hisob oʻchirilganda email promo yozuvidan olib tashlanadi (hash qoladi: qayta roʻyxatdan oʻtib yana foydalanib boʻlmasin). */
function forget(db, uid) { for (const p of Object.values(db.promos)) for (const r of p.redeemed) if (r.u === uid) { r.e = ''; r.u = ''; } }

module.exports = { create, redeem, view, statusOf, forget, normCode, validCode, genCode, dayEnd, hashEmail, PLAN_IDS, LIMITS };

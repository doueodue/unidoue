'use strict';
/* Bildirishnomalar (sayt ichida + push + email): sof mantiq. server.js ulaydi, tests/run.js tekshiradi.
 *
 * db.notes — xabarlar roʻyxati: { id, t, title, body, url, aud, to?, app, push, mail, sys?, st? }
 *   aud: all | free | plus | pro | email | admin.  to — faqat bitta foydalanuvchiga (hisob id lari).
 *   sys — tizim xabari (tarif yoqildi, promo qabul qilindi): admin tarixida koʻrinmaydi.
 *   st  — yuborish natijasi: { app, push:{targets,ok,gone,failed}, mail:{targets,ok,failed,skipped} }
 * Foydalanuvchida "oʻqilgan" holati bitta vaqt belgisi: u.noteSeen (undan keyingi xabarlar — yangi).
 * Hisob ochilgunga qadar yuborilgan xabarlar yangi foydalanuvchiga koʻrinmaydi (t >= u.created).
 */
const crypto = require('node:crypto');

const LIMITS = { title: 60, body: 2000, keepAdmin: 150, keepSys: 300, show: 30, mailBulk: 500 };
const AUDS = ['all', 'free', 'plus', 'pro', 'email', 'admin'];
const URL_RE = /^\/(?!\/)[\w\-./#?=&%]*$/;
/** Xat matni: abzatslar (boʻsh qator) saqlanadi, ortiqcha boʻshliq va boshqaruv belgilari olib tashlanadi */
const para = (s, n) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
const txt = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

/** Admin shaklini tekshiradi: { error } yoki { title, body, url, aud, email, ch:{app,push,mail} } */
function check(b) {
  b = b && typeof b === 'object' ? b : {};
  const title = txt(b.title, LIMITS.title), body = para(b.body, LIMITS.body), aud = String(b.audience || 'all');
  if (title.length < 2 || body.length < 2) return { error: 'Sarlavha va matnni kiriting.' };
  const url = b.url == null || b.url === '' ? '/app' : String(b.url);
  if (!URL_RE.test(url) || url.length > 200) return { error: 'Havola faqat sayt ichidagi yoʻl boʻlsin (masalan /app#/pricing).' };
  if (!AUDS.includes(aud)) return { error: 'Auditoriya notoʻgʻri.' };
  const c = b.channels && typeof b.channels === 'object' ? b.channels : {}, ch = { app: c.app === true, push: c.push === true, mail: c.mail === true };
  if (aud === 'admin') {
    if (ch.app || ch.mail) return { error: 'Admin qurilmalariga faqat push yuboriladi.' };
    ch.push = true;
  }
  if (!ch.app && !ch.push && !ch.mail) return { error: 'Kamida bitta yuborish usulini tanlang.' };
  return { title, body, url, aud, email: txt(b.email, 254).toLowerCase(), ch };
}

const seenOf = u => Math.max(+u.noteSeen || 0, +(u.created || u.ts) || 0);
const visible = (n, u, planId) => !!n.app && n.t >= (+(u.created || u.ts) || 0) && (n.to ? n.to.includes(u.id) : n.aud === 'all' || n.aud === planId);
const mine = (db, u, planId) => db.notes.filter(n => visible(n, u, planId));
const unread = (db, u, planId) => { const s = seenOf(u); return mine(db, u, planId).filter(n => n.t > s).length; };
/** Foydalanuvchi paneli uchun: eng yangilari birinchi */
function list(db, u, planId) {
  const s = seenOf(u);
  return mine(db, u, planId).slice(-LIMITS.show).reverse().map(n => ({ id: n.id, t: n.t, title: n.title, body: n.body, url: n.url, new: n.t > s }));
}

/** Yangi xabar qoʻshadi va eski xabarlarni qirqadi (admin xabarlari va tizim xabarlari alohida hisoblanadi) */
function add(db, n, now) {
  const last = db.notes.length ? db.notes[db.notes.length - 1].t : 0, t = Math.max(now || Date.now(), last + 1); // t qatʼiy oʻsadi: “oʻqilgan” chegarasi aniq
  const rec = { id: crypto.randomBytes(6).toString('hex'), t, ...n };
  db.notes.push(rec);
  for (const [sys, keep] of [[false, LIMITS.keepAdmin], [true, LIMITS.keepSys]]) {
    let over = db.notes.filter(x => !!x.sys === sys).length - keep;
    if (over > 0) db.notes = db.notes.filter(x => !(!!x.sys === sys && over-- > 0));
  }
  return rec;
}
const remove = (db, id) => { const k = db.notes.length; db.notes = db.notes.filter(n => n.id !== id); return db.notes.length !== k; };

/** Email obunasini bekor qilish havolasi imzosi (HMAC, server sirli kaliti bilan) */
const sig = (secret, uid) => crypto.createHmac('sha256', String(secret)).update('unsub:' + uid).digest('hex').slice(0, 32);
function sigOk(secret, uid, s) {
  const a = Buffer.from(sig(secret, String(uid))), b = Buffer.from(String(s || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Brend uslubidagi ixcham xat (jadval + inline uslub: pochta mijozlari uchun) */
function mailHtml({ title, body, link, unsub }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ec;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#1d1a16">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e1d8;border-radius:14px">
<tr><td style="padding:18px 24px;border-bottom:1px solid #eee5da;font:700 17px Georgia,serif;color:#c2521b">✦ UniDoue</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 10px;font:600 21px/1.3 Georgia,serif;color:#1d1a16">${esc(title)}</h1>
${String(body).split(/\n{2,}/).map(x => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3b352e">${esc(x).replace(/\n/g, '<br>')}</p>`).join('')}<div style="height:6px"></div>
<a href="${esc(link)}" style="display:inline-block;background:#c2521b;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">UniDoueʼda ochish</a></td></tr>
<tr><td style="padding:14px 24px;background:#faf7f2;border-radius:0 0 14px 14px;font-size:12px;line-height:1.5;color:#8a8175">Bu xatni UniDoue hisobingiz boʻlgani uchun oldingiz. <a href="${esc(unsub)}" style="color:#8a8175">Bunday xatlarni olishni toʻxtatish</a></td></tr>
</table></td></tr></table></body></html>`;
}

/** Administrator javobi: oddiy shaxsiy xat ko'rinishida (tugmasiz, bekor qilish havolasiz). quote — foydalanuvchining oldingi xabari. */
function replyHtml({ body, quote, replyable }) {
  const para = String(body).split(/\n{2,}/).map(x => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2b2620">${esc(x).replace(/\n/g, '<br>')}</p>`).join('');
  const q = quote ? `<div style="margin-top:20px;padding:10px 14px;border-left:3px solid #e0d6c8;color:#8a8175;font-size:13px;line-height:1.55">${esc(String(quote).slice(0, 600)).replace(/\n/g, '<br>')}</div>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f1ec;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#1d1a16">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e1d8;border-radius:14px">
<tr><td style="padding:18px 24px;border-bottom:1px solid #eee5da;font:700 17px Georgia,serif;color:#c2521b">✦ UniDoue</td></tr>
<tr><td style="padding:24px">${para}${q}</td></tr>
<tr><td style="padding:14px 24px;background:#faf7f2;border-radius:0 0 14px 14px;font-size:12px;line-height:1.5;color:#8a8175">${replyable ? 'Javob yozmoqchi bo‘lsangiz, shu xatga javob qaytaring.' : 'Bu xat UniDoue jamoasidan, sizning xabaringizga javob sifatida yuborildi.'}</td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = { LIMITS, AUDS, check, seenOf, visible, unread, list, add, remove, sig, sigOk, mailHtml, replyHtml, URL_RE };

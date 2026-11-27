'use strict';
/* «Siz bloklandingiz» sahifasi — butun-sayt IP bloki uchun (JavaScriptsiz, faqat CSS animatsiya; CSP skriptga ruxsat bermaydi, bloklangan manzilga /blocked.css ham berilmaydi,
 * shuning uchun uslub sahifaning oʻziga joylanadi). Dizayn public/blocked.css bilan bir xil — ilova ichidagi ekran (public/js/blocked.js) shu CSS dan foydalanadi. */
const fs = require('fs'), path = require('path');
let CSS = ''; try { CSS = fs.readFileSync(path.join(__dirname, 'public', 'blocked.css'), 'utf8'); } catch (e) { CSS = ''; }

const TX = {
  uz: { t: 'Kirish cheklangan', h: 'Siz bloklandingiz', p: 'Bu manzildan UniDoue ga kirish cheklangan. Xato deb hisoblasangiz, UniDoue jamoasiga yozing — koʻrib chiqamiz.', st: 'Holat', stv: 'Bloklangan', du: 'Muddat', open: 'Cheklanmagan', til: 'gacha', help: 'Yordamga yozish', again: 'Qayta tekshirish' },
  ru: { t: 'Доступ ограничен', h: 'Вы заблокированы', p: 'Доступ к UniDoue с этого адреса ограничен. Если вы считаете, что это ошибка, напишите команде UniDoue — мы разберёмся.', st: 'Статус', stv: 'Заблокировано', du: 'Срок', open: 'Не ограничен', til: 'до', help: 'Написать в поддержку', again: 'Проверить снова' },
  en: { t: 'Access restricted', h: 'You have been blocked', p: 'Access to UniDoue from this address is restricted. If you think this is a mistake, contact the UniDoue team and we will take a look.', st: 'Status', stv: 'Blocked', du: 'Duration', open: 'Not limited', til: 'until', help: 'Contact support', again: 'Check again' }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Accept-Language dan uz | ru | en (standart: uz) */
function pickLang(h) {
  for (const p of String(h || '').toLowerCase().split(',')) { const c = p.trim().slice(0, 2); if (c === 'uz' || c === 'ru' || c === 'en') return c; }
  return 'uz';
}
const when = (ms, lg) => { try { return new Intl.DateTimeFormat(lg === 'en' ? 'en-GB' : 'ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms)).replace(',', ''); } catch (e) { return ''; } };

/** Emblema (qalqon + qulf) — ilova ichidagi ekran bilan bir xil belgilash (class nomlari public/blocked.css da) */
const EMBLEM = '<div class="bk-em" aria-hidden="true"><span class="bk-ring"></span><span class="bk-ring r2"></span><span class="bk-ring r3"></span>' +
  '<svg viewBox="0 0 120 120" width="132" height="132"><defs><linearGradient id="bkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5d6c"/><stop offset="1" stop-color="#ff9a4d"/></linearGradient></defs>' +
  '<path class="bk-sh" pathLength="100" d="M60 8 100 22v30c0 26-17 46-40 58C37 98 20 78 20 52V22z" fill="rgba(255,93,108,.13)" stroke="url(#bkg)" stroke-width="4" stroke-linejoin="round"/>' +
  '<g class="bk-lk"><path class="bk-sk" d="M47 55V47a13 13 0 0 1 26 0v8" fill="none" stroke="url(#bkg)" stroke-width="6" stroke-linecap="round"/>' +
  '<rect x="40" y="55" width="40" height="30" rx="7" fill="url(#bkg)"/><circle cx="60" cy="68" r="4" fill="#fff" opacity=".92"/><path d="M60 70v8" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".92"/></g></svg></div>';

function page(acceptLang, until) {
  const lg = pickLang(acceptLang), l = TX[lg];
  const chips = `<div class="bk-ch"><span><b>${esc(l.st)}</b>${esc(l.stv)}</span><span><b>${esc(l.du)}</b>${until ? (lg === 'uz' ? esc(when(until, lg)) + ' ' + esc(l.til) : esc(l.til) + ' ' + esc(when(until, lg))) : esc(l.open)}</span></div>`;
  return '<!doctype html><html lang="' + pickLang(acceptLang) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark"><title>' + esc(l.t) + '</title><style>html,body{margin:0}' + CSS + '</style></head><body>' +
    '<main class="bk-ov bk-page" role="alert"><i class="bk-blob a"></i><i class="bk-blob b"></i><div class="bk-card">' + EMBLEM +
    '<h1 style="--i:1">' + esc(l.h) + '</h1><p style="--i:2">' + esc(l.p) + '</p><div style="--i:3">' + chips + '</div>' +
    '<div class="bk-bt" style="--i:4"><a class="bk-b pri" href="https://t.me/unidoue_yordam" rel="noopener noreferrer">' + esc(l.help) + '</a><a class="bk-b" href="">' + esc(l.again) + '</a></div><div class="bk-lg" style="--i:5">UniDoue</div></div></main></body></html>';
}
module.exports = { page, pickLang, EMBLEM };

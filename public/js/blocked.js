import { t, lang } from './i18n.js';
/* «Siz bloklandingiz» ekrani: foydalanuvchi bloklangan boʻlsa (kirishda, roʻyxatdan oʻtishda, Google orqali, ochiq seans bloklanganda) butun ilova ustidan chiqadi.
   Dizayn va animatsiya: /blocked.css. Sabab koʻrsatilmaydi (administratorning ichki izohi); faqat holat va (vaqtinchalik boʻlsa) muddat. */
const HELP = 'https://t.me/unidoue_yordam';
const EMBLEM = '<div class="bk-em" aria-hidden="true"><span class="bk-ring"></span><span class="bk-ring r2"></span><span class="bk-ring r3"></span>' +
  '<svg viewBox="0 0 120 120" width="132" height="132" focusable="false"><defs><linearGradient id="bkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5d6c"/><stop offset="1" stop-color="#ff9a4d"/></linearGradient></defs>' +
  '<path class="bk-sh" pathLength="100" d="M60 8 100 22v30c0 26-17 46-40 58C37 98 20 78 20 52V22z" fill="rgba(255,93,108,.13)" stroke="url(#bkg)" stroke-width="4" stroke-linejoin="round"/>' +
  '<g class="bk-lk"><path class="bk-sk" d="M47 55V47a13 13 0 0 1 26 0v8" fill="none" stroke="url(#bkg)" stroke-width="6" stroke-linecap="round"/>' +
  '<rect x="40" y="55" width="40" height="30" rx="7" fill="url(#bkg)"/><circle cx="60" cy="68" r="4" fill="#fff" opacity=".92"/><path d="M60 70v8" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".92"/></g></svg></div>';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LOC = { uz: 'ru-RU', ru: 'ru-RU', en: 'en-GB' }; // 30.11.2026 19:03
const stamp = ms => { try { return new Intl.DateTimeFormat(LOC[lang()] || 'en-GB', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms)).replace(',', ''); } catch (e) { return ''; } };
/** Qolgan vaqt: «2 kun 4 soat», «3 soat 5 daq.», «12 daq.» */
export function left(ms) {
  const m = Math.max(1, Math.ceil(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mi = m % 60;
  if (d) return `${d} ${t('kun')}${h ? ` ${h} ${t('soat')}` : ''}`;
  if (h) return `${h} ${t('soat')}${mi ? ` ${mi} ${t('daq.')}` : ''}`;
  return `${mi} ${t('daq.')}`;
}
let timer = 0, shown = false;
/** info: { until?: ms } — until yoʻq/0 boʻlsa blok muddatsiz (yoki muddat nomaʼlum). Qayta chaqirilsa ekran yangilanadi. */
export function showBlocked(info = {}) {
  const until = Number(info && info.until) || 0, perm = !until;
  let ov = document.getElementById('bk-ov'); if (ov) ov.remove(); clearInterval(timer);
  ov = document.createElement('div'); ov.id = 'bk-ov'; ov.className = 'bk-ov'; ov.setAttribute('role', 'alertdialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'bk-h'); ov.setAttribute('aria-describedby', 'bk-p');
  ov.innerHTML = `<i class="bk-blob a"></i><i class="bk-blob b"></i><div class="bk-card">${EMBLEM}
    <h1 id="bk-h" style="--i:1">${esc(t('Siz bloklandingiz'))}</h1>
    <p id="bk-p" style="--i:2">${esc(t('Administrator hisobingizga kirishni cheklagan. Xato deb hisoblasangiz, UniDoue jamoasiga yozing — ko‘rib chiqamiz.'))}</p>
    <div style="--i:3"><div class="bk-ch"><span><b>${esc(t('Holat'))}</b>${esc(t('Bloklangan'))}</span>
      <span><b>${esc(t('Blok muddati'))}</b><i id="bk-u" style="font-style:normal">${perm ? esc(t('Cheklanmagan')) : lang() === 'uz' ? esc(stamp(until)) + ' ' + esc(t('gacha')) : esc(t('gacha')) + ' ' + esc(stamp(until))}</i></span>
      ${perm ? '' : `<span><b>${esc(t('Qoldi'))}</b><i id="bk-l" style="font-style:normal">${esc(left(until - Date.now()))}</i></span>`}</div></div>
    <div class="bk-bt" style="--i:4"><a class="bk-b pri" href="${HELP}" target="_blank" rel="noopener noreferrer">${esc(t('Yordamga yozish'))}</a><button type="button" class="bk-b" id="bk-r">${esc(t('Qayta tekshirish'))}</button></div>
    <div class="bk-lg" style="--i:5">UniDoue</div></div>`;
  document.body.appendChild(ov); document.documentElement.classList.add('bk-lock');
  const app = document.getElementById('root'); if (app) { app.inert = true; app.setAttribute('aria-hidden', 'true'); } // orqadagi ilova klaviatura/ekran oʻqigichga yetmaydi
  document.getElementById('bk-r').onclick = () => location.reload();
  const first = ov.querySelector('.bk-b'); if (first) first.focus({ preventScroll: true });
  ov.addEventListener('keydown', e => { // fokus ekran ichida qoladi
    if (e.key !== 'Tab') return; const f = [...ov.querySelectorAll('a[href],button')]; if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
  if (!perm) {
    const tick = () => {
      const ms = until - Date.now();
      if (ms <= 0) { // blok muddati tugadi: sahifa qayta yuklanadi (soat farqi tufayli takror yuklanib ketmasligi uchun 2 daqiqada bir martadan koʻp emas)
        clearInterval(timer); let ok = true;
        try { const p = Number(sessionStorage.getItem('bk-rl')) || 0; if (Date.now() - p < 120000) ok = false; else sessionStorage.setItem('bk-rl', String(Date.now())); } catch (e) {}
        if (ok) location.reload(); else { const l = document.getElementById('bk-l'); if (l) l.textContent = '—'; }
        return;
      }
      const l = document.getElementById('bk-l'); if (l) l.textContent = left(ms);
    };
    timer = setInterval(tick, 20000); // ~20 soniyada yangilanadi; muddat tugasa avtomatik qayta yuklanadi
  }
  shown = true;
}
export const isBlockedShown = () => shown && !!document.getElementById('bk-ov');

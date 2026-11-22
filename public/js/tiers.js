/* Tarif belgilari: Free — muz, Plus — kumush, Pro — oltin (toj bilan). Uslublar: /tiers.css.
   Hech qanday importsiz: core.js, main.js, views1.js, gate.js va portfolio studiyasi shu faylni ishlatadi. */

export const TIER_NAME = { free: 'Free', plus: 'Plus', pro: 'Pro' };
export const TIER_TAG = { free: 'Boshlash uchun', plus: 'Jiddiy tayyorgarlik uchun', pro: 'Hammasi ochiq' };
export const tierOf = n => (n >= 2 ? 'pro' : n === 1 ? 'plus' : 'free'); // 0/1/2 → free/plus/pro

/* currentColor bilan chizilgan belgilar (medalyon va tabletkalar ichida) + oltin toj (rangli) */
const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="tg-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".32" stop-color="#f8cb4a"/><stop offset=".64" stop-color="#d79a10"/><stop offset="1" stop-color="#ffe382"/></linearGradient>
<linearGradient id="tg-gold2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe990"/><stop offset=".5" stop-color="#e2a61c"/><stop offset="1" stop-color="#a96d05"/></linearGradient>
<radialGradient id="tg-ruby" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffd0d9"/><stop offset=".45" stop-color="#ff3d68"/><stop offset="1" stop-color="#a30c33"/></radialGradient>
<radialGradient id="tg-sap" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d5f4ff"/><stop offset=".5" stop-color="#3cb6ff"/><stop offset="1" stop-color="#0b5ea8"/></radialGradient>
</defs>
<symbol id="ti-free" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2.6l7.6 4.4v9.9L12 21.4l-7.6-4.5V7L12 2.6zm0 4.2L8 9.1v5.8l4 2.3 4-2.3V9.1l-4-2.3z"/></symbol>
<symbol id="ti-plus" viewBox="0 0 24 24"><path d="M12 1.8l2.7 7.5 7.5 2.7-7.5 2.7L12 22.2l-2.7-7.5L1.8 12l7.5-2.7L12 1.8z"/></symbol>
<symbol id="ti-pro" viewBox="0 0 24 24"><path d="M3 8.4l4.4 3.9L12 4.4l4.6 7.9L21 8.4l-1.6 9.7H4.6L3 8.4z"/><rect x="4.6" y="19.3" width="14.8" height="2.1" rx="1"/></symbol>
<symbol id="tc-crown" viewBox="0 0 64 50">
<path d="M5 15l12 11L32 7l15 19 12-11-5 29H10L5 15z" fill="url(#tg-gold)" stroke="#8a5a00" stroke-width="1.7" stroke-linejoin="round"/>
<path d="M9.5 43.5h45v4.5h-45z" fill="url(#tg-gold2)" stroke="#8a5a00" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M11 21l5.5 6.5M24 18l2.6 8" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round" fill="none"/>
<circle cx="5" cy="14" r="3.1" fill="url(#tg-gold)" stroke="#8a5a00" stroke-width="1.4"/><circle cx="32" cy="5.8" r="3.5" fill="url(#tg-gold)" stroke="#8a5a00" stroke-width="1.4"/><circle cx="59" cy="14" r="3.1" fill="url(#tg-gold)" stroke="#8a5a00" stroke-width="1.4"/>
<path d="M32 24.5l5 7-5 7-5-7z" fill="url(#tg-ruby)" stroke="#7a0a2a" stroke-width="1.1" stroke-linejoin="round"/>
<path d="M18 33.5l2.6 3.4-2.6 3.4-2.6-3.4zM46 33.5l2.6 3.4-2.6 3.4-2.6-3.4z" fill="url(#tg-sap)" stroke="#0b4a85" stroke-width=".9" stroke-linejoin="round"/>
<path d="M30.2 28l1.6-2" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
</symbol>
<symbol id="tc-spark" viewBox="0 0 24 24"><path d="M12 1l2.4 8.6L23 12l-8.6 2.4L12 23l-2.4-8.6L1 12l8.6-2.4L12 1z"/></symbol>
</svg>`;

export function ensureSprite() {
  if (document.getElementById('ti-pro')) return;
  const d = document.createElement('div'); d.innerHTML = SPRITE;
  const s = d.firstElementChild; if (s) document.body.prepend(s);
}
if (typeof document !== 'undefined') { if (document.body) ensureSprite(); else document.addEventListener('DOMContentLoaded', ensureSprite, { once: true }); }

const key = p => (TIER_NAME[p] ? p : 'free');
/** Kichik belgi (currentColor). */
export const tierIcon = p => `<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><use href="#ti-${key(p)}"/></svg>`;
/** Yaltiroq tarif tabletkasi: "👑 Pro". */
export const tierPill = (p, label) => `<span class="tp" data-tier="${key(p)}">${tierIcon(p)}<span>${label || TIER_NAME[key(p)]}</span></span>`;
/** Dumaloq metall medalyon. */
export const tierMedal = p => `<span class="tm" data-tier="${key(p)}">${tierIcon(p)}</span>`;
/** Pro kartasi ustidagi suzuvchi oltin toj va yulduzchalar. */
export const crownHTML = () => `<span class="tc" aria-hidden="true"><svg viewBox="0 0 64 50"><use href="#tc-crown"/></svg><svg class="sp s1" viewBox="0 0 24 24"><use href="#tc-spark"/></svg><svg class="sp s2" viewBox="0 0 24 24"><use href="#tc-spark"/></svg><svg class="sp s3" viewBox="0 0 24 24"><use href="#tc-spark"/></svg></span>`;

/** Shisha yuzasida kursorni kuzatuvchi yaltirash (qimirlashni kamaytirish yoqilgan boʻlsa — oʻchiq). */
export function liveGlass(root) {
  if (!root || root._lg || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  root._lg = 1;
  root.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.tg[data-live]'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, { passive: true });
}

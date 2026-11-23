/* Tarif tabrigi: Plus (kumush) yoki Pro (oltin) yoqilganda — promo kod, toʻlov yoki administrator tomonidan — bir marta chiqadigan oyna.
   Konfetti kichik <canvas> da (kutubxonasiz); "Harakatni kamaytirish" yoqilgan boʻlsa — faqat tinch kartochka. */
import { t } from './i18n.js';
import { ensureSprite } from './tiers.js';

const RANK = { free: 0, plus: 1, pro: 2 };
const KEY = 'ud:plan:'; // "qabul:" bilan boshlanmaydi — serverga sinxronlanmaydi, har qurilma oʻzi eslab qoladi
const norm = p => (p === 'plus' || p === 'pro' ? p : 'free');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PERKS = {
  plus: ['Oyiga 175 ta AI kredit', 'Esse murabbiyi ochildi', 'Kengaytirilgan AI mentor'],
  pro: ['Oyiga 300 ta AI kredit', 'Qabul strategiyasi va hisobotlar', 'Portfolio AI dizayneri', 'Ustuvor yordam']
};
const PAL = {
  plus: ['#ffffff', '#e4e9f3', '#c3cbdd', '#9aa6bf', '#7f8ba6', '#b8d4ff'],
  pro: ['#fff6c2', '#ffe27e', '#f8cb4a', '#e2a61c', '#c78a0b', '#ff8fa3']
};
const motionOff = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

/** Foydalanuvchi shu qurilmada oxirgi koʻrgan tarifni eslab qoladi. Yuqoriroq tarif paydo boʻlsa — tabrik. Birinchi kirishda (eslab qolingan tarif yoʻq) tabrik chiqmaydi. */
export function seePlan(uid, plan, until) {
  if (!uid) return;
  const cur = norm(plan), prev = get(KEY + uid);
  if (prev === null) { put(KEY + uid, cur); return; }
  if (RANK[cur] > RANK[norm(prev)]) celebrate(cur, { until, uid }); else put(KEY + uid, cur);
}

let open = null;
/** Tabrik oynasini koʻrsatadi. opts: { until: ms, uid } */
export function celebrate(plan, opts = {}) {
  plan = norm(plan); if (plan === 'free' || open || typeof document === 'undefined') return;
  if (opts.uid) put(KEY + opts.uid, plan);
  ensureSprite();
  const still = motionOff(), prevFocus = document.activeElement, pro = plan === 'pro';
  const until = opts.until ? new Date(opts.until) : null;
  const dateStr = until && !isNaN(until) ? `${until.getDate()}.${String(until.getMonth() + 1).padStart(2, '0')}.${until.getFullYear()}` : '';
  const el = document.createElement('div');
  el.className = 'cel' + (still ? ' still' : ''); el.dataset.tier = plan;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'cel-h');
  el.innerHTML = `<canvas class="cel-cv" aria-hidden="true"></canvas>
  <div class="cel-card" data-tier="${plan}">
    <div class="cel-stage" aria-hidden="true"><i class="cel-ring r1"></i><i class="cel-ring r2"></i>
      <span class="cel-medal"><svg class="cel-star" viewBox="0 0 24 24"><use href="#ti-plus"/></svg><b class="cel-shine"></b></span>
      ${pro ? '<svg class="cel-crown" viewBox="0 0 64 50"><use href="#tc-crown"/></svg>' : ''}
      <svg class="cel-sp a" viewBox="0 0 24 24"><use href="#tc-spark"/></svg><svg class="cel-sp b" viewBox="0 0 24 24"><use href="#tc-spark"/></svg><svg class="cel-sp c" viewBox="0 0 24 24"><use href="#tc-spark"/></svg></div>
    <h2 id="cel-h">${esc(t('Tabriklaymiz!'))}</h2>
    <p class="cel-pl">${esc(t(pro ? 'Pro tarifi yoqildi' : 'Plus tarifi yoqildi'))}</p>
    <ul class="cel-pk">${PERKS[plan].map(x => `<li>${esc(t(x))}</li>`).join('')}</ul>
    ${dateStr ? `<p class="cel-un">${esc(t('Amal qilish muddati:'))} <b>${esc(dateStr)}</b></p>` : ''}
    <button class="btn primary cel-go" type="button">${esc(t('Boshlash'))}</button>
  </div>`;
  document.body.appendChild(el);
  open = el;
  let raf = 0, timer = 0, closed = false;
  const close = () => {
    if (closed) return; closed = true; cancelAnimationFrame(raf); clearTimeout(timer);
    document.removeEventListener('keydown', key, true);
    el.classList.add('out'); setTimeout(() => { el.remove(); open = null; try { prevFocus && prevFocus.focus && prevFocus.focus(); } catch (e) {} }, still ? 0 : 280);
  };
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'Tab') { e.preventDefault(); el.querySelector('.cel-go').focus(); } };
  document.addEventListener('keydown', key, true);
  el.addEventListener('pointerdown', e => { if (e.target === el || e.target.classList.contains('cel-cv')) close(); });
  const go = el.querySelector('.cel-go'); go.onclick = close; requestAnimationFrame(() => go.focus({ preventScroll: true }));
  if (still) return;
  timer = setTimeout(close, 14000);
  raf = confetti(el.querySelector('.cel-cv'), PAL[plan], pro, () => closed);
  return close;
}

/** Konfetti: markazdan portlash + yuqoridan yengil yogʻilish. ~3.8 soniya. */
function confetti(cv, pal, pro, stop) {
  const ctx = cv.getContext('2d'); if (!ctx) return 0;
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  const fit = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit();
  const mk = (x, y, burst) => {
    const a = burst ? Math.random() * Math.PI * 2 : Math.PI / 2 + (Math.random() - .5) * .6, v = burst ? 5 + Math.random() * 9 : 1 + Math.random() * 2.2;
    return { x, y, vx: Math.cos(a) * v * (burst ? 1 : .35), vy: Math.sin(a) * v * (burst ? 1 : 1) - (burst ? 5 : 0), w: 6 + Math.random() * 7, h: 3 + Math.random() * 5, r: Math.random() * 6.28, vr: (Math.random() - .5) * .35, c: pal[(Math.random() * pal.length) | 0], k: (Math.random() * 3) | 0, life: 1, born: 0 };
  };
  const ps = [], cx = W / 2, cy = H * .42, t0 = performance.now();
  for (let i = 0; i < (pro ? 150 : 120); i++) ps.push(mk(cx, cy, true));
  let last = t0, dropped = 0;
  const star = (x, y, r) => { ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .42 : r, a = i * Math.PI / 4; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  const step = now => {
    if (stop()) return;
    const dt = Math.min(2.2, (now - last) / 16.67); last = now;
    const el = now - t0;
    if (el < 2600 && dropped < 70 && Math.random() < .5) { ps.push(mk(Math.random() * W, -12, false)); dropped++; }
    ctx.clearRect(0, 0, W, H);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.vx *= Math.pow(.985, dt); p.vy = p.vy * Math.pow(.992, dt) + .24 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      if (el > 2600) p.life -= .012 * dt;
      if (p.y > H + 30 || p.life <= 0) { ps.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      if (p.k === 0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (.55 + .45 * Math.abs(Math.sin(p.r * 2))));
      else if (p.k === 1) { ctx.beginPath(); ctx.arc(0, 0, p.h * .8, 0, 6.28); ctx.fill(); }
      else star(0, 0, p.w * .6);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (ps.length || el < 2600) requestAnimationFrame(step);
  };
  addEventListener('resize', fit, { passive: true });
  return requestAnimationFrame(step);
}

import { tierMedal, crownHTML } from './tiers.js';
import { t } from './i18n.js';
/* Umumiy yordamchilar: DOM, API, sinxronlash, toast, modal. Tashqi kutubxonasiz. */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const S = { user: null, account: null, rev: 0, cat: null, config: {} };
export { inPlay } from './play.js'; // Google Play (TWA) ichidami — play.js birinchi yuklanishdayoq ishga tushadi

/* ---------- API ---------- */
export async function api(path, method = 'GET', body) {
  let r;
  try {
    r = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  } catch (e) { throw Object.assign(new Error('Serverga ulanib bo‘lmadi. Internetni tekshiring.'), { status: 0 }); }
  let j = {};
  try { j = await r.json(); } catch (e) {}
  if (!r.ok) {
    const err = Object.assign(new Error(j.error || (r.status === 404 ? 'Topilmadi.' : 'Xatolik yuz berdi.')), { status: r.status, code: j.code, data: j });
    if (r.status === 403 && j.code === 'EMAIL_UNVERIFIED') document.dispatchEvent(new CustomEvent('unidoue:unverified'));
    if (r.status === 401 && S.user) { S.user = null; document.dispatchEvent(new CustomEvent('unidoue:signedout')); }
    throw err;
  }
  return j;
}

/* ---------- mahalliy saqlash + serverga sinxronlash (qabul:* kalitlari eski sayt bilan bir xil) ---------- */
const META = 'qabul:sync', isK = k => typeof k === 'string' && k.startsWith('qabul:') && k !== META && k !== 'qabul:lang';
const meta = () => { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch (e) { return {}; } };
const setMeta = o => { try { localStorage.setItem(META, JSON.stringify(o)); } catch (e) {} };
const localKeys = () => { const a = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isK(k)) a.push(k); } } catch (e) {} return a; };
const dump = () => { const o = {}; localKeys().forEach(k => (o[k] = localStorage.getItem(k))); return o; };
const dirtyKeys = new Set();
let timer = 0, busy = false;

export const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('Brauzer xotirasi to‘la yoki yopiq.', 'err'); return; }
    if (S.user) { dirtyKeys.add(k); setMeta({ ...meta(), uid: S.user.id, dirty: 1 }); clearTimeout(timer); timer = setTimeout(push, 700); }
  }
};

export async function push() {
  if (!S.user) return;
  if (busy) { timer = setTimeout(push, 500); return; }
  busy = true;
  try {
    const r = await api('/api/data', 'PUT', { data: dump(), baseRev: S.rev });
    S.rev = r.rev; dirtyKeys.clear(); setMeta({ uid: S.user.id, rev: r.rev });
  } catch (e) {
    if (e.status === 409) { // boshqa qurilmada o'zgargan: server ma'lumoti + bizning o'zgargan kalitlarimiz
      const mine = {}; dirtyKeys.forEach(k => (mine[k] = localStorage.getItem(k)));
      applyRemote(e.data.data || {}); Object.entries(mine).forEach(([k, v]) => v != null && localStorage.setItem(k, v));
      S.rev = e.data.rev; busy = false; toast('Boshqa qurilmadagi o‘zgarishlar qo‘shildi.'); return push();
    }
    if (e.status === 402) toast(e.message, 'err');
    else if (e.status !== 401) toast('Saqlab bo‘lmadi: ' + e.message, 'err');
  }
  busy = false;
}
function applyRemote(d) { localKeys().forEach(k => localStorage.removeItem(k)); Object.entries(d).forEach(([k, v]) => isK(k) && typeof v === 'string' && localStorage.setItem(k, v)); }
export function wipeLocal() { localKeys().forEach(k => localStorage.removeItem(k)); try { localStorage.removeItem(META); } catch (e) {} try { indexedDB.deleteDatabase('unidoue-pf'); } catch (e) {} } // portfolio rasmlari ham qurilmadan o'chadi

/** Kirgandan keyin mahalliy va server ma'lumotini moslashtiradi. true qaytsa, sahifani qayta chizish kerak. */
export function adopt(me) {
  S.user = me.user; S.account = me.account; S.rev = me.rev || 0;
  const m = meta(), has = localKeys().length > 0;
  if (m.uid === me.user.id) {
    if (m.dirty) { push(); return false; }
    if ((me.rev || 0) > (m.rev || 0)) { applyRemote(me.data || {}); setMeta({ uid: me.user.id, rev: me.rev }); return true; }
    return false;
  }
  if (!m.uid && has && !me.hasData) { setMeta({ uid: me.user.id, rev: me.rev || 0, dirty: 1 }); push(); return false; }
  applyRemote(me.data || {}); setMeta({ uid: me.user.id, rev: me.rev || 0 }); return true;
}
addEventListener('pagehide', () => { if (S.user && meta().dirty) fetch('/api/data', { method: 'PUT', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: dump(), baseRev: S.rev }) }).catch(() => {}); });

export async function refreshAccount() { const me = await api('/api/me'); if (me.user) { S.account = me.account; S.user = me.user; paintCredits(); } return S.account; }

/* ---------- AI kreditlar: YAGONA manba ----------
   Hisobni faqat server yuritadi (account.credits). Brauzer undan oʻqiydi va hamma joyda (bosh panel, mentor, esse, tariflar)
   bir xil koʻrsatadi. Koʻrsatiladigan joylar data-cr atributi bilan belgilanadi va qiymat oʻzgarganda avtomatik yangilanadi. */
export function credits() {
  const a = S.account || {}, c = a.credits || {}, limit = c.limit ?? (a.limits && a.limits.ai) ?? 0, used = c.used ?? (a.usage && a.usage.ai) ?? 0;
  return { used, limit, left: Math.max(0, limit - used), pct: limit ? Math.min(100, Math.round((100 * used) / limit)) : 0 };
}
export function paintCredits() {
  const c = credits();
  $$('[data-cr]').forEach(el => {
    const k = el.dataset.cr;
    if (k === 'badge') el.textContent = `${c.left} / ${c.limit} kredit qoldi`;
    else if (k === 'frac') el.textContent = `${c.left} / ${c.limit}`;
    else if (k === 'bar') { el.style.width = c.pct + '%'; if (el.parentElement) el.parentElement.classList.toggle('warn', c.pct > 85); }
  });
}
/** Serverdan kelgan kredit holatini qoʻllaydi (AI javobi, /api/credits). */
export function applyCredits(c) {
  if (!c || !S.account || !Number.isFinite(c.limit)) return;
  S.account.credits = { ...(S.account.credits || {}), ...c };
  S.account.usage = { ...(S.account.usage || {}), ai: c.used, period: c.period || (S.account.usage || {}).period };
  S.account.limits = { ...(S.account.limits || {}), ai: c.limit };
  paintCredits(); document.dispatchEvent(new CustomEvent('unidoue:account'));
}
let crBusy = 0;
export async function refreshCredits() {
  if (!S.user || crBusy) return; crBusy = 1;
  try { const r = await api('/api/credits'); applyCredits(r.credits); if (r.plan && S.account && r.plan !== S.account.plan) { await refreshAccount().catch(() => {}); document.dispatchEvent(new CustomEvent('unidoue:account')); } // tarif boshqa joyda oʻzgardi (administrator, toʻlov, muddat tugashi)
      if (Number.isFinite(r.notes) && S.account && S.account.notes !== r.notes) { S.account.notes = r.notes; document.dispatchEvent(new CustomEvent('unidoue:notes')); } } catch (e) {} crBusy = 0;
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshCredits(); });

/* ---------- UI yordamchilari ---------- */
export function toast(text, kind = '') {
  const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = text;
  $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 4200); setTimeout(() => el.remove(), 4500);
}
export function modal({ title, body, actions = [], collect, tier }) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = tier // tarif taklifi: shisha oyna (Plus — kumush, Pro — oltin va toj)
      ? `<div class="modal tg" data-tier="${tier}" role="dialog" aria-modal="true" aria-label="${esc(title)}">${tier === 'pro' ? crownHTML() : ''}<div class="modal-h">${tierMedal(tier)}<h3>${esc(title)}</h3></div><div>${body}</div><div class="acts"></div></div>`
      : `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h3>${esc(title)}</h3><div>${body}</div><div class="acts"></div></div>`;
    let closed = false;
    const acts = $('.acts', bg), done = v => { if (closed) return; closed = true; modal.data = collect ? collect(bg) : null; bg.classList.add('out'); setTimeout(() => bg.remove(), 200); res(v); };
    actions.forEach(a => { const b = document.createElement('button'); b.className = 'btn ' + (a.cls || ''); b.textContent = a.label; b.onclick = () => done(a.value); acts.appendChild(b); });
    bg.onclick = e => { if (e.target === bg) done(null); };
    document.body.appendChild(bg); const f = $('button:last-child', acts); f && f.focus();
  });
}
/** Universitet ma’lumotidagi xatoni adminga yuborish */
export async function reportError(uni) {
  const v = await modal({ title: 'Xato topdingizmi?', body: `<p class="hint" style="margin-top:0">${esc(uni)}: nima noto‘g‘ri? Iloji bo‘lsa, to‘g‘ri qiymat va rasmiy sahifa havolasini yozing.</p><textarea id="rep-t" maxlength="500" rows="4" placeholder="Masalan: ariza muddati 1-fevral, 15-yanvar emas"></textarea>`, actions: [{ label: 'Bekor qilish', value: 0 }, { label: 'Yuborish', value: 1, cls: 'primary' }], collect: bg => bg.querySelector('#rep-t').value });
  if (v !== 1) return;
  const text = String(modal.data || '').trim();
  if (text.length < 5) { toast('Nima noto‘g‘riligini yozing.'); return; }
  try { await api('/api/report', 'POST', { uni, text }); toast('Rahmat! Xabaringiz adminga yuborildi.'); } catch (e) { toast(e.message); }
}
/** AI javobi haqida xabar berish — Google Play "AI-Generated Content" siyosati: AI kontentdan ilova ichida shikoyat qilish mumkin boʻlsin */
export async function reportAI(tool, answer) {
  const v = await modal({ title: 'AI javobi haqida xabar', body: `<p class="hint" style="margin-top:0">Javob noto‘g‘ri, zararli yoki nomaqbul bo‘lsa, bizga xabar bering. Javob matni ham adminga yuboriladi.</p><textarea id="rep-t" maxlength="300" rows="3" placeholder="Nima noto‘g‘ri? (ixtiyoriy)"></textarea>`, actions: [{ label: 'Bekor qilish', value: 0 }, { label: 'Yuborish', value: 1, cls: 'primary' }], collect: bg => bg.querySelector('#rep-t').value });
  if (v !== 1) return;
  try { await api('/api/report', 'POST', { kind: 'ai', tool, answer: String(answer || ''), note: String(modal.data || '').trim() }); toast('Rahmat! Xabaringiz adminga yuborildi.'); } catch (e) { toast(e.message, 'err'); }
}
/** AI javobi ostiga "Xabar berish" tugmasini qoʻyadi (oldingisi boʻlsa almashtiradi). text — javobning toʻliq matni. */
export function aiFlag(host, tool, text, cls = '') {
  if (!host || !String(text || '').trim()) return;
  const old = host.nextElementSibling; if (old && old.classList.contains('ai-flag')) old.remove();
  const d = document.createElement('div'); d.className = 'ai-flag ' + cls;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'link-btn'; b.textContent = 'AI javobi haqida xabar berish';
  b.onclick = () => reportAI(tool, text); d.appendChild(b); host.after(d);
}
export const skeleton = (n = 3) => `<div class="grid">${Array.from({ length: n }, () => '<div class="card"><div class="sk" style="width:40%;height:18px"></div><div class="sk" style="margin-top:14px;height:12px"></div><div class="sk" style="margin-top:8px;width:75%;height:12px"></div></div>').join('')}</div>`;
export const errorBox = (msg, retry) => `<div class="card err-box"><b>Yuklab bo‘lmadi</b>${esc(msg)}${retry ? `<div style="margin-top:14px"><button class="btn" data-retry>Qayta urinish</button></div>` : ''}</div>`;

export const ico = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10', send: 'M12 19V5M5 12l7-7 7 7', plus: 'M12 5v14M5 12h14', copy: 'M9 9h11v11H9zM5 15H4V4h11v1', tick: 'M5 12.5l4.5 4.5L19 7.5', compass: 'M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5z', doc: 'M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6', target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8zM12 12h.01', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3', gift: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H8a2.5 2.5 0 010-5c2 0 4 2 4 5zM12 7h4a2.5 2.5 0 000-5c-2 0-4 2-4 5z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2', pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z', cmp: 'M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 2v20',
  list: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01', bot: 'M12 8V4M8 4h8M5 8h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2zM9 14h.01M15 14h.01', card: 'M2 6h20v12H2zM2 10h20', user: 'M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z',
  menu: 'M4 6h16M4 12h16M4 18h16', arrow: 'M5 12h14M13 6l6 6-6 6', flag: 'M5 21V4M5 4h11l-2 4 2 4H5', folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 11h18', info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 20a2 2 0 01-3.4 0', camera: 'M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zM12 17a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2z', inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5a4 4 0 008 0h5',
  ticket: 'M3 8a1 1 0 011-1h16a1 1 0 011 1v2a2 2 0 000 4v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a2 2 0 000-4zM14 7.5v1.5M14 11.2v1.6M14 15v1.5'
};
export const svg = n => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ico[n]}"/></svg>`;

/** Doue — UniDoue AI mentori. Avatar: yoʻl yulduzi. cls: xs | sm | xl, live — tashqi halqa animatsiyasi (javob yozilayotganda). Rang --brand dan (fasl bilan almashadi). */
export const MENTOR = 'Doue';
/** Doue yulduzi (to‘rt qirrali): logotip, avatar va bezaklar uchun. */
export const STAR = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5c1.1 6.5 4.1 10.4 11 13.5-6.9 1.5-9.9 5.3-11 13.5-1.1-8.2-4.1-12-11-13.5 6.9-3.1 9.9-7 11-13.5z"/></svg>';
export const mentorAvatar = (cls = '') => `<span class="dv ${cls}" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 2.5c1.1 6.5 4.1 10.4 11 13.5-6.9 1.5-9.9 5.3-11 13.5-1.1-8.2-4.1-12-11-13.5 6.9-3.1 9.9-7 11-13.5z"/><circle class="sp" cx="25.8" cy="6.2" r="2"/></svg><i></i></span>`;

const MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
export const fmtDate = d => { const x = new Date(d + 'T12:00:00'); return x.getDate() + '-' + MON[x.getMonth()] + ', ' + x.getFullYear(); };
export const daysLeft = d => Math.ceil((new Date(d + 'T23:59:59') - Date.now()) / 864e5);

/** Katalog (universitetlar) — bir marta yuklanadi. */
export async function catalog() {
  if (S.cat) return S.cat;
  const r = await fetch('/data/universities.json'); if (!r.ok) throw new Error('Universitetlar ro‘yxatini yuklab bo‘lmadi.');
  S.cat = await r.json(); return S.cat;
}

/** Boshqa davlatlar universitetlari (intl.json) — bir marta yuklanadi. */
export async function intlCatalog() {
  if (S.intl) return S.intl;
  const r = await fetch('/data/intl.json'); if (!r.ok) throw new Error('Xalqaro universitetlar ro‘yxatini yuklab bo‘lmadi.');
  S.intl = (await r.json()).map(u => ({ ...u, kind: 'intl', rdV: !!(u.rd && u.rdUrl) })); return S.intl;
}
/** Hamma davlat: avval AQSh, keyin boshqalar. Boshqa davlatlar yuklanmasa AQSh ro‘yxati baribir ishlaydi. */
export async function allUnis() {
  const us = (await catalog()).map(u => (u.kind ? u : { ...u, kind: 'us' }));
  let intl = []; try { intl = await intlCatalog(); } catch (e) { /* AQSh ro‘yxati bilan davom etamiz */ }
  return [...us, ...intl];
}
/** <select> uchun: AQSh va boshqa davlatlar alohida guruhda. */
export const uniOptions = (list, pick = () => true, sel = '') => {
  const grp = (k, label) => { const a = list.filter(c => c.kind === k && pick(c)); return a.length ? `<optgroup label="${esc(label)}">${a.map(c => `<option value="${esc(c.id)}" ${c.id === sel ? 'selected' : ''}>${esc(c.n)}${k === 'intl' && c.country ? ' — ' + esc(t(c.country)) : ''}</option>`).join('')}</optgroup>` : ''; };
  return grp('us', t('AQSh')) + grp('intl', t('Boshqa davlatlar'));
};

/** Qaysi imkoniyat qaysi tarifdan boshlanadi (mijoz tomoni; haqiqiy tekshiruv serverda). */
export const NEED_PLAN = { coach: 'Plus' };
const UPSELL_TEXT = { coach: 'Esse murabbiyi Plus va Pro tarifida mavjud.', pf_studio: 'AI dizayner va to‘liq dizayn studiyasi (hamma shablon, fon, effekt va o‘z ranglaringiz) Pro tarifida mavjud.' };
export const hasFeature = f => !!(S.account && S.account.features && S.account.features.includes(f));

/** Plan yetishmasa chiroyli taklif oynasi. */
export async function upsell(feature, text, tier) {
  const names = { scholarships: 'Stipendiya qidiruvi', predictor: 'To‘liq moslik tahlili', strategy: 'Shaxsiy qabul strategiyasi', reports: 'Universitet hisobotlari', essay_adv: 'Chuqur esse tahlili', tracker: 'Cheksiz arizalar', compare: 'Ko‘proq universitetni solishtirish', finder_adv: 'Kengaytirilgan qidiruv', coach: 'Esse murabbiyi', pf_studio: 'AI dizayner', pf_design: 'Portfolio dizayni' };
  const plan = S.account && S.account.plan, top = plan === 'pro', tr = tier || (plan === 'plus' || top ? 'pro' : ({ coach: 'plus', tracker: 'plus', compare: 'plus' })[feature] || 'pro'); // qaysi tarif ochadi: Plus (kumush) yoki Pro (oltin); Plus/Pro egasi uchun doim Pro (oltin)
  const v = await modal({ title: names[feature] || 'Yuqoriroq tarif kerak', tier: tr, body: `<p>${esc(text || UPSELL_TEXT[feature] || 'Bu imkoniyat Pro tarifida mavjud.')}</p>`, actions: top ? [{ label: 'Yopish', value: 0, cls: 'tier-pro' }] : [{ label: 'Keyinroq', value: 0 }, { label: 'Tariflarni ko‘rish', value: 1, cls: 'tier-' + tr }] });
  if (v === 1) location.hash = '#/pricing';
}

/* Portfolio dizayn studiyasi (interfeys): shablon, rang, shrift, fon, effekt, rejim va shakl tanlovi.
 * Tarif cheklovi pfdesign.js dagi allow()/effective() orqali; yopiq variant bosilsa, taklif oynasi chiqadi (tanlov saqlanmaydi). */
import { esc } from './core.js';
import { t as tr } from './i18n.js';
import { TPLS, TPL, PALETTES, FF, FONTS, BGS, FXS, MODES, SHAPES, DENS, SBS, SBCS, TIERS, allow, effective, fontPair, MY_FONTS, FONT_LABEL } from './pfdesign.js';
import { MY_BASES, MY_H2, MY_CARD, MY_PRESETS, HARMONY, defaultMy, myTokens, myAdjusted, harmony } from './pfmy.js';
import { bgLayers } from './pfcss.js';
import { tierIcon, tierOf } from './tiers.js';

export const TPL_N = { ledger: 'Klassik', rail: 'Yon panel', atlas: 'Atlas', folio: 'Muqova', poster: 'Poster', noir: 'Noir', nova: 'Nova', timeline: 'Yo‘l' };
const FONT_N = { auto: 'Avtomatik', serif: 'Serif', sans: 'Sans', grotesk: 'Grotesk', display: 'Display', editorial: 'Editorial', mono: 'Mono' };
const BG_N = { none: 'Yo‘q', paper: 'Qog‘oz', grid: 'To‘r', dots: 'Nuqtalar', mesh: 'Gradient', aurora: 'Aurora', waves: 'To‘lqin', noise: 'Donador', stars: 'Yulduzlar', topo: 'Topografiya', blueprint: 'Chizma' };
const FX_N = { reveal: 'Silliq paydo bo‘lish', count: 'Raqam sanash', progress: 'O‘qish chizig‘i', marquee: 'Ko‘nikma tasmasi', spot: 'Kartada yoritish', tilt: '3D qiyalik', parallax: 'Parallaks', type: 'Yozilib chiqish', glow: 'Kursor nuri' };
const MODE_N = { tpl: 'Shablon bo‘yicha', light: 'Kunduzgi', dark: 'Tungi', system: 'Qurilmaga qarab' };
const SHAPE_N = { soft: 'Yumshoq', sharp: 'Qirrali', round: 'Dumaloq' };
const DENS_N = { cozy: 'Qulay', compact: 'Zich' };
const SB_N = { normal: 'Odatiy', thin: 'Ingichka', bold: 'Qalin', hidden: 'Yashirin' };
const SBC_N = { accent: 'Asosiy rang', gradient: 'Gradient', ink: 'Matn rangi', soft: 'Sokin' };
const TIER_N = ['', 'Plus', 'Pro'];
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3"/></svg>';

export const THUMB = {
  ledger: '<rect x="6" y="7" width="19" height="4" rx="1" class="a"/><rect x="6" y="13" width="26" height="2" rx="1" class="g"/><rect x="31" y="6" width="7" height="9" rx="1" class="g"/><rect x="6" y="17.5" width="32" height="1.4" class="a"/><rect x="6" y="23" width="9" height="2" class="a"/><rect x="18" y="23" width="20" height="2" class="g"/><rect x="18" y="27" width="16" height="2" class="g"/><rect x="6" y="34" width="9" height="2" class="a"/><rect x="18" y="34" width="20" height="2" class="g"/><rect x="18" y="38" width="14" height="2" class="g"/><rect x="6" y="45" width="9" height="2" class="a"/><rect x="18" y="45" width="20" height="2" class="g"/>',
  rail: '<rect x="0" y="0" width="15" height="60" class="a"/><circle cx="7.5" cy="10" r="4" fill="#fff" opacity=".85"/><rect x="3" y="20" width="9" height="1.6" fill="#fff" opacity=".7"/><rect x="3" y="25" width="9" height="1.6" fill="#fff" opacity=".7"/><rect x="3" y="30" width="7" height="1.6" fill="#fff" opacity=".7"/><rect x="19" y="7" width="20" height="4" rx="1" class="d"/><rect x="19" y="15" width="3" height="8" class="a"/><rect x="24" y="16" width="14" height="2" class="g"/><rect x="24" y="20" width="10" height="2" class="g"/><rect x="19" y="28" width="3" height="8" class="a"/><rect x="24" y="29" width="14" height="2" class="g"/><rect x="24" y="33" width="11" height="2" class="g"/><rect x="19" y="41" width="3" height="8" class="a"/><rect x="24" y="42" width="14" height="2" class="g"/>',
  atlas: '<path d="M3 8V3h5M41 52v5h-5" stroke="var(--a)" stroke-width="1" fill="none"/><rect x="6" y="7" width="23" height="4" class="d"/><rect x="6" y="13" width="15" height="1.8" class="a"/><path d="M6 19h32" stroke="var(--a)" stroke-width=".9" stroke-dasharray="1.6 1.6" fill="none"/><rect x="6" y="24" width="7" height="1.8" class="a"/><rect x="6" y="28" width="32" height="1.6" class="g"/><rect x="6" y="31.5" width="26" height="1.6" class="g"/><rect x="6" y="38" width="7" height="1.8" class="a"/><rect x="6" y="42" width="32" height="1.6" class="g"/><rect x="6" y="45.5" width="20" height="1.6" class="g"/><rect x="31" y="6" width="7" height="8" fill="none" stroke="var(--a)" stroke-width=".8"/>',
  folio: '<rect x="0" y="0" width="44" height="22" class="t"/><rect x="5" y="6" width="18" height="5" rx="1" class="d"/><rect x="5" y="14" width="14" height="2" rx="1" class="a"/><rect x="29" y="5" width="9" height="12" class="a"/><rect x="5" y="25" width="34" height="1.4" class="a"/><rect x="5" y="30" width="16" height="2" class="g"/><rect x="5" y="34" width="14" height="2" class="g"/><rect x="5" y="40" width="16" height="2" class="g"/><rect x="25" y="30" width="14" height="2" class="g"/><rect x="25" y="35" width="9" height="3" rx="1.5" class="t"/><rect x="25" y="40" width="12" height="3" rx="1.5" class="t"/>',
  poster: '<rect width="44" height="27" class="a"/><circle cx="37" cy="5" r="12" class="s" opacity=".65"/><rect x="5" y="8" width="25" height="7" class="w"/><rect x="5" y="17" width="14" height="2.2" class="w"/><rect x="6" y="24" width="32" height="9" fill="#fff" stroke="#14161d" stroke-width="1.4"/><rect x="5" y="38" width="13" height="3" class="d"/><rect x="5" y="44" width="34" height="2" class="g"/><rect x="5" y="48" width="26" height="2" class="g"/>',
  noir: '<rect width="44" height="60" class="b"/><rect width="14" height="60" fill="#151b33"/><circle cx="7" cy="10" r="4" class="a"/><rect x="2.5" y="20" width="9" height="1.6" fill="#fff" opacity=".4"/><rect x="2.5" y="25" width="9" height="1.6" fill="#fff" opacity=".4"/><rect x="18" y="7" width="20" height="4" class="w"/><rect x="18" y="14" width="15" height="2" class="s"/><rect x="18" y="22" width="22" height="10" rx="2" fill="#151b33" stroke="#2b3354" stroke-width=".6"/><rect x="21" y="25" width="10" height="1.8" class="a"/><rect x="18" y="35" width="22" height="10" rx="2" fill="#151b33" stroke="#2b3354" stroke-width=".6"/><rect x="21" y="38" width="12" height="1.8" class="a"/>',
  nova: '<rect width="44" height="60" class="b"/><circle cx="11" cy="9" r="15" class="a" opacity=".55"/><circle cx="37" cy="15" r="13" class="s" opacity=".5"/><rect x="6" y="21" width="27" height="5" class="w"/><rect x="6" y="29" width="18" height="2" class="s"/><rect x="6" y="36" width="15" height="15" rx="3.5" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".25" stroke-width=".5"/><rect x="24" y="36" width="15" height="15" rx="3.5" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".25" stroke-width=".5"/>',
  timeline: '<circle cx="9" cy="10" r="5" class="g"/><rect x="18" y="6" width="20" height="4" class="d"/><rect x="18" y="12" width="14" height="1.8" class="a"/><rect x="21.3" y="21" width="1.5" height="35" class="a" opacity=".5"/><rect x="4" y="23" width="14" height="9" rx="2" class="g" opacity=".55"/><circle cx="22" cy="26" r="2.3" class="w" stroke="var(--a)" stroke-width="1.2"/><rect x="26" y="35" width="14" height="9" rx="2" class="g" opacity=".55"/><circle cx="22" cy="38" r="2.3" class="w" stroke="var(--a)" stroke-width="1.2"/><rect x="4" y="46" width="14" height="9" rx="2" class="g" opacity=".55"/><circle cx="22" cy="50" r="2.3" class="w" stroke="var(--a)" stroke-width="1.2"/>'
};

const tag = n => (n ? `<i class="pf-lk" data-tier="${tierOf(n)}" aria-hidden="true">${tierIcon(tierOf(n))}${TIER_N[n]}</i>` : ''); // Plus — kumush, Pro — oltin
const chip = (key, label, on, need, extra = '') => `<button type="button" class="pf-ch${need ? ' lk' : ''}" role="radio" aria-checked="${on}" data-dz="${key}"${need ? ` data-need="${need}"` : ''}>${extra}<span>${esc(tr(label))}</span>${tag(need)}</button>`;
const sec = (title, hint, body) => `<section class="pf-dzs"><h4 class="pf-h">${esc(tr(title))}</h4>${hint ? `<p class="hint">${esc(tr(hint))}</p>` : ''}${body}</section>`;

/* ---------------- "Mening dizaynim": o‘z shabloningizni yaratish (muharrir, Pro) ---------------- */
const BASE_N = { ledger: 'Klassik', rail: 'Yon panel', folio: 'Muqova' };
const H2_N = { line: 'Chiziq bilan', bar: 'Yon polosa', pill: 'Tugmasimon', under: 'Tagiga chizilgan', plain: 'Oddiy' };
const CARD_N = { outline: 'Ramkali', flat: 'Tekis', shadow: 'Soyali', glass: 'Shisha' };
const COL_N = [['bg', 'Fon'], ['card', 'Karta'], ['ink', 'Matn'], ['mut', 'Ikkinchi matn'], ['line', 'Chiziq'], ['@a', 'Asosiy rang'], ['@a2', 'Qo‘shimcha rang']];
/** Saqlangan dizayn uchun kichik ko‘rinish (fon, matn chiziqlari, rang polosasi). */
function mini(d) {
  const my = d.dz && d.dz.my, bg = my ? my.bg : '#ffffff', ink = my ? my.ink : '#1b2234', card = my ? my.card : '#f3f4f7', a = d.accent, a2 = (d.dz && d.dz.acc2) || a;
  return `<svg viewBox="0 0 60 42" aria-hidden="true"><rect width="60" height="42" rx="6" fill="${bg}"/><rect x="6" y="7" width="26" height="4" rx="1.5" fill="${ink}"/><rect x="6" y="14" width="18" height="2.4" rx="1.2" fill="${a}"/><rect x="6" y="21" width="48" height="15" rx="3" fill="${card}"/><rect x="10" y="25" width="20" height="2.2" rx="1.1" fill="${ink}" opacity=".75"/><rect x="10" y="30" width="30" height="2" rx="1" fill="${ink}" opacity=".4"/><circle cx="48" cy="10" r="5" fill="${a2}"/></svg>`;
}
function savedHTML(st) {
  const ds = st.pf.designs || [];
  if (!ds.length) return '';
  return `<div class="pf-mys"><h4 class="pf-h">${esc(tr('Mening dizaynlarim'))}</h4><div class="pf-myl">${ds.map(d => `<div class="pf-myi"><button type="button" class="pf-myu" data-do="my-use:${esc(d.id)}" title="${esc(tr('Qo‘llash'))}">${mini(d)}<span>${esc(d.name)}${d.ai ? ' <i class="pf-aib">AI</i>' : ''}</span></button><button type="button" class="pf-myx" data-do="my-del:${esc(d.id)}" aria-label="${esc(tr('O‘chirish'))}: ${esc(d.name)}">×</button></div>`).join('')}</div></div>`;
}

/* ---------------- Dizayn studiyasi: asboblar paneli (har bir asbob — alohida panel) ---------------- */
const IC = {
  templates: '<rect x="3" y="3" width="7.5" height="9" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.6"/><rect x="3" y="15" width="7.5" height="6" rx="1.6"/>',
  colors: '<path d="M12 3C7 3 3 6.8 3 11.4 3 15.2 6 17 8.6 17H10a2 2 0 011.4 3.4 1.6 1.6 0 001.2 2.6C18.5 23 21 18 21 12.4 21 7 17 3 12 3z"/><circle cx="7.6" cy="10.6" r="1.1"/><circle cx="11.2" cy="7.3" r="1.1"/><circle cx="15.9" cy="8.5" r="1.1"/>',
  fonts: '<path d="M3.5 19L9 5l5.5 14M5.6 14h6.8"/><path d="M15.5 19l2.5-6.5L20.5 19M16.4 17h3.2"/>',
  style: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.1"/><circle cx="9" cy="17" r="2.1"/>',
  background: '<rect x="3" y="3" width="18" height="18" rx="3.2"/><path d="M3 15.5l5-5 4.2 4.2 3-3L21 17"/><circle cx="16.3" cy="8.4" r="1.4"/>',
  effects: '<path d="M11 3l1.9 5.4L18.3 10.3 12.9 12.2 11 17.6 9.1 12.2 3.7 10.3l5.4-1.9z"/><path d="M19 15.5v4M17 17.5h4M5.5 3.5v2.4M4.3 4.7h2.4"/>',
  ai: '<path d="M4.5 19.5L14 10"/><path d="M13.2 4.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9zM18.6 12.4l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z"/>'
};
/** [id, nomi, qisqa izoh, ikonka] — o‘ng paneldagi sarlavha va tepadagi tab uchun. */
export const TOOLS = [
  ['templates', 'Shablonlar', 'Tayyor maketni tanlang yoki o‘zingiznikini yarating.', IC.templates],
  ['colors', 'Ranglar', 'Asosiy va qo‘shimcha ranglar, fon va matn ranglari.', IC.colors],
  ['fonts', 'Shriftlar', 'Sarlavha va matn uchun shriftlar.', IC.fonts],
  ['style', 'Uslub', 'Shakl, zichlik, sarlavha va kartalar ko‘rinishi.', IC.style],
  ['background', 'Fon', 'Fon PDF da ham, veb-sahifada ham ko‘rinadi.', IC.background],
  ['effects', 'Effektlar', 'Veb-sayt animatsiyalari va aylantirish chizig‘i.', IC.effects],
  ['ai', 'AI dizayner', 'AI siz uchun shaxsiy shablon yaratadi.', IC.ai]
];
export const toolIds = TOOLS.map(t => t[0]);
const HARM_N = { analog: 'O‘xshash', comp: 'Qarama-qarshi', triad: 'Uchlik', split: 'Bo‘lingan', mono: 'Bir rangli' };
const ctxOf = (st, plan) => { const A = allow(plan), E = effective(st.pf, plan), r = A.rank; return { A, E, r, a: E.accent, a2: E.dz.acc2, L: n => (n > r ? n : 0), sv: `--a:${E.accent};--a2:${E.dz.acc2}`, my: st.pf.dz.my || null }; };
const head = id => { const T = TOOLS.find(x => x[0] === id); return `<header class="pfs-ph"><h3>${esc(tr(T[1]))}</h3><p>${esc(tr(T[2]))}</p></header>`; };
const crow = (kind, key, label, val) => `<div class="pfs-cr"><label class="pfs-cs" style="--c:${val}"><input type="color" value="${val}" data-${kind}="${key}" aria-label="${esc(tr(label))}"></label><span class="pfs-cn">${esc(tr(label))}</span><input class="pfs-hex" type="text" value="${val}" maxlength="7" spellcheck="false" autocomplete="off" data-hex="${kind}:${key}" aria-label="${esc(tr(label))} HEX"></div>`;
const harmHTML = (a, ok) => { const h = harmony(a); return `<div class="pfs-harm">${HARMONY.map(k => (h[k] ? `<button type="button" class="pfs-hm${ok ? '' : ' lk'}" data-dz="harm:${k}"${ok ? '' : ' data-need="2"'} aria-label="${esc(tr(HARM_N[k]))}"><i style="background:linear-gradient(135deg,${a} 50%,${h[k]} 50%)"></i><span>${esc(tr(HARM_N[k]))}</span></button>` : '')).join('')}</div>`; };
const swapBtn = ok => `<button type="button" class="btn sm pfs-swap${ok ? '' : ' lk'}" data-dz="swap:1"${ok ? '' : ' data-need="2"'}>⇄ ${esc(tr('Ranglarni almashtirish'))}</button>`;
const opt = (on, key, label, need, extra = '') => chip(key, label, on, need, extra);
const sw = (key, label, on, need) => `<button type="button" class="pfs-row${need ? ' lk' : ''}" role="switch" aria-checked="${on}" data-dz="${key}"${need ? ` data-need="${need}"` : ''}><span>${esc(tr(label))}</span>${tag(need)}<i class="pfs-tg" aria-hidden="true"></i></button>`;

function tTemplates(st, plan) {
  const { A, E, r, sv, my } = ctxOf(st, plan);
  const tpls = TPLS.map(k => `<button type="button" class="pf-tp${TPL[k].t > r ? ' lk' : ''}" role="radio" aria-checked="${E.tpl === k && !my}" data-dz="tpl:${k}"${TPL[k].t > r ? ` data-need="${TPL[k].t}"` : ''} style="${sv}"><svg viewBox="0 0 44 60" aria-hidden="true">${THUMB[k]}</svg><span>${esc(tr(TPL_N[k]))}</span>${tag(TPL[k].t > r ? TPL[k].t : 0)}</button>`).join('');
  const bases = MY_BASES.map(k => `<button type="button" class="pf-tp" role="radio" aria-checked="${my && my.base === k}" data-my-set="base:${k}" style="${sv}"><svg viewBox="0 0 44 60" aria-hidden="true">${THUMB[k]}</svg><span>${esc(tr(BASE_N[k]))}</span></button>`).join('');
  const top = my
    ? sec('Tuzilma', 'Sahifa qanday joylashadi. Ranglar va shriftlar o‘zingiznikida qoladi.', `<div class="pf-tpls pfs-t3" role="radiogroup">${bases}</div><button type="button" class="btn sm pfs-off" data-do="my-off">${esc(tr('Tayyor shablonlarga qaytish'))}</button>`)
    : `<button type="button" class="pfs-cta" data-do="my-new"><span class="pfs-cta-i"><svg viewBox="0 0 24 24" aria-hidden="true">${IC.ai}</svg></span><span class="pfs-cta-t"><b>${esc(tr('O‘z dizaynimni yaratish'))}</b><small>${esc(tr('Ranglar, shriftlar va uslubni o‘zingiz tanlang.'))}</small></span></button>${sec('Tayyor shablonlar', '', `<div class="pf-tpls pfs-tpls" role="radiogroup" aria-label="${esc(tr('Shablonlar'))}">${tpls}</div>`)}`;
  const save = `<div class="pfs-sv"><div class="field"><label class="f" for="pf-myname">${esc(tr('Dizayn nomi'))}</label><input id="pf-myname" type="text" maxlength="40" value="${esc((my && my.name) || '')}" placeholder="${esc(tr('Masalan: Mening uslubim'))}" autocomplete="off"></div><button type="button" class="btn primary" data-do="my-save">${esc(tr('Dizaynni saqlash'))}</button></div>`;
  return head('templates') + top + save + savedHTML(st);
}

function tColors(st, plan) {
  const { A, E, r, a, a2, sv, my } = ctxOf(st, plan);
  if (!my) {
    const pals = PALETTES.map((p, i) => `<button type="button" class="pfs-pt${p[3] > r ? ' lk' : ''}" role="radio" aria-checked="${a === p[0] && a2 === p[1]}" data-dz="pal:${i}"${p[3] > r ? ` data-need="${p[3]}"` : ''} aria-label="${esc(tr(p[2]))}"><i style="background:linear-gradient(135deg,${p[0]} 55%,${p[1]} 55%)">${p[3] > r ? LOCK : ''}</i><span>${esc(tr(p[2]))}</span></button>`).join('');
    const own = `${crow('cc', 'accent', 'Asosiy rang', a)}${crow('cc', 'acc2', 'Qo‘shimcha rang', a2)}${swapBtn(true)}`;
    return head('colors') + sec('Tayyor ranglar', '', `<div class="pfs-pal" role="radiogroup" aria-label="${esc(tr('Rang'))}">${pals}</div>`) + sec('Rang uyg‘unligi', 'Asosiy rangingizga mos ikkinchi rang.', harmHTML(a, true)) + sec('O‘z ranglaringiz', '', own);
  }
  const tk = myTokens(my, a, a2), adj = myAdjusted(my, a);
  const val = k => (k === '@a' ? a : k === '@a2' ? a2 : my[k]);
  const pres = MY_PRESETS.map((p, i) => `<button type="button" class="pf-myp" data-my-preset="${i}" style="background:${p[1]};color:${p[3]};border-color:${p[5]}" title="${esc(tr(p[0]))}"><b style="background:${p[3]}"></b><i style="background:${p[2]};border-color:${p[5]}"></i><span>${esc(tr(p[0]))}</span></button>`).join('');
  const rows = COL_N.map(([k, l]) => crow('myc', k, l, val(k))).join('');
  const note = adj.length ? `<p class="pf-myn">${esc(tr('Matn o‘qilishi uchun ba’zi ranglar hujjatda biroz to‘qroq yoki ochroq qilib ishlatiladi.'))}</p>` : '';
  const prev = `<div class="pf-myv" style="background:${tk.bg};color:${tk.ink};border-color:${tk.line}"><b style="font-weight:${my.hw};${my.hcase === 'upper' ? 'text-transform:uppercase;' : ''}">${esc(st.pf.name || 'Aziza Karimova')}</b><em style="color:${tk.at}">${esc(tr('Sarlavha va urg‘u rangi'))}</em><div style="background:${tk.card};border-color:${tk.line};border-radius:${Math.min(my.r, 22)}px"><span style="color:${tk.ink}">${esc(tr('Faoliyat kartasi'))}</span><small style="color:${tk.mut}">${esc(tr('Ikkinchi darajali matn'))}</small><i style="background:linear-gradient(135deg,${tk.a},${tk.a2})">${esc(tr('Tugma'))}</i></div></div>`;
  return head('colors') + sec('Tayyor ranglar', 'Boshlash uchun bittasini tanlang, keyin o‘zgartiring.', `<div class="pf-mypl">${pres}</div>`) + sec('Ranglar', '', `<div class="pfs-crs">${rows}</div>${swapBtn(true)}${note}${prev}`) + sec('Rang uyg‘unligi', 'Asosiy rangingizga mos ikkinchi rang.', harmHTML(a, true));
}

function tFonts(st, plan) {
  const { E, r, L, my } = ctxOf(st, plan);
  const q = `<div class="pfs-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input type="search" id="pfs-fq" data-fq placeholder="${esc(tr('Shrift qidirish'))}" aria-label="${esc(tr('Shrift qidirish'))}" autocomplete="off" spellcheck="false"></div>`;
  const card = (key, fam, name, sub, on, attr, need) => `<button type="button" class="pfs-fc${need ? ' lk' : ''}" role="radio" aria-checked="${on}" ${attr}${need ? ` data-need="${need}"` : ''} data-n="${esc((name + ' ' + sub).toLowerCase())}"><b style="font-family:${esc(FF[fam])}" aria-hidden="true">Aa</b><span class="pfs-fn"><em>${esc(name)}</em><small>${esc(sub)}</small></span>${tag(need)}</button>`;
  if (!my) {
    const cards = Object.keys(FONTS).map(k => { const pr = fontPair(E.tpl, k), nm = k === 'auto' ? tr('Avtomatik') : tr(FONT_N[k]); return card(k, pr.h, nm, `${FONT_LABEL[pr.h]} + ${FONT_LABEL[pr.b]}`, E.dz.font === k, `data-dz="font:${k}"`, L(FONTS[k].t)); }).join('');
    return head('fonts') + q + `<div class="pfs-fl" role="radiogroup" aria-label="${esc(tr('Shrift'))}">${cards}</div><p class="pfs-none" hidden>${esc(tr('Hech narsa topilmadi'))}</p>`;
  }
  const list = key => MY_FONTS.map(k => card(k, k, FONT_LABEL[k] || k, '', my[key] === k, `data-my-set="${key}:${k}"`, 0)).join('');
  return head('fonts') + q + sec('Sarlavha shrifti', '', `<div class="pfs-fl" role="radiogroup">${list('hf')}</div>`) + sec('Matn shrifti', '', `<div class="pfs-fl" role="radiogroup">${list('bf')}</div>`) + `<p class="pfs-none" hidden>${esc(tr('Hech narsa topilmadi'))}</p>`;
}

function tStyle(st, plan) {
  const { E, L, my } = ctxOf(st, plan);
  const denss = Object.keys(DENS).map(k => opt(E.dz.dens === k, 'dens:' + k, DENS_N[k], L(DENS[k]))).join('');
  const dens = sec('Zichlik', '', `<div class="pf-chs" role="radiogroup">${denss}</div>`);
  if (!my) {
    const shapes = Object.keys(SHAPES).map(k => opt(E.dz.shape === k, 'shape:' + k, SHAPE_N[k], L(SHAPES[k]), `<em class="pfs-shp s-${k}" aria-hidden="true"></em>`)).join('');
    const modes = Object.keys(MODES).map(k => opt(E.dz.mode === k, 'mode:' + k, MODE_N[k], L(MODES[k]))).join('');
    return head('style') + sec('Shakl', 'Burchaklar va doiralar ko‘rinishi.', `<div class="pf-chs" role="radiogroup">${shapes}</div>`) + sec('Rejim', 'Tungi va kunduzgi rejim veb-sahifada ishlaydi.', `<div class="pf-chs" role="radiogroup">${modes}</div>`) + dens;
  }
  const set = (key, list, names, extra) => list.map(v => `<button type="button" class="pf-ch" role="radio" aria-checked="${my[key] === v}" data-my-set="${key}:${v}">${extra ? extra(v) : ''}<span>${esc(tr(names[v]))}</span></button>`).join('');
  return head('style')
    + sec('Sarlavhalar', '', `<label class="pf-myr"><span>${esc(tr('Qalinligi'))}</span><input type="range" min="400" max="800" step="100" value="${my.hw}" data-myr="hw" aria-label="${esc(tr('Qalinligi'))}"><b>${my.hw}</b></label><div class="pf-chs" role="radiogroup" style="margin-top:12px">${set('hcase', ['none', 'upper'], { none: 'Oddiy harflar', upper: 'KATTA HARFLAR' })}</div>`)
    + sec('Bo‘lim sarlavhasi uslubi', '', `<div class="pf-chs" role="radiogroup">${set('h2', MY_H2, H2_N, v => `<em class="pfs-h2 h-${v}" aria-hidden="true"></em>`)}</div>`)
    + sec('Kartalar', '', `<div class="pf-chs" role="radiogroup">${set('card2', MY_CARD, CARD_N, v => `<em class="pfs-cd c-${v}" aria-hidden="true"></em>`)}</div><label class="pf-myr" style="margin-top:14px"><span>${esc(tr('Burchaklar'))}</span><input type="range" min="0" max="32" step="1" value="${my.r}" data-myr="r" aria-label="${esc(tr('Burchaklar'))}"><b>${my.r}px</b></label>`)
    + dens;
}

function tBackground(st, plan) {
  const { E, L, a, sv } = ctxOf(st, plan);
  const bgs = Object.keys(BGS).map(k => { const ly = bgLayers(k, a, false), bg = ly.l.length ? `background:${[...ly.l, ly.base || '#fff'].join(',')};` : 'background:#fff;'; return `<button type="button" class="pfs-bt${L(BGS[k]) ? ' lk' : ''}" role="radio" aria-checked="${E.dz.bg === k}" data-dz="bg:${k}"${L(BGS[k]) ? ` data-need="${BGS[k]}"` : ''}><em class="pf-bgs" style="${esc(sv + ';' + bg)}"></em><span>${esc(tr(BG_N[k]))}</span>${tag(L(BGS[k]))}</button>`; }).join('');
  return head('background') + `<div class="pfs-bgl" role="radiogroup" aria-label="${esc(tr('Fon'))}">${bgs}</div><p class="hint">${esc(tr('Veb-sahifada fon harakatlanadi.'))}</p>`;
}

function tEffects(st, plan) {
  const { E, L, sv } = ctxOf(st, plan);
  const fxs = Object.keys(FXS).map(k => sw('fx:' + k, FX_N[k], E.dz.fx.includes(k), L(FXS[k]))).join('');
  const sbs = Object.keys(SBS).map(k => chip('sb:' + k, SB_N[k], E.dz.sb === k, 0, `<em class="pf-sbi sb-${k}" aria-hidden="true"></em>`)).join('');
  const sbcs = Object.keys(SBCS).map(k => chip('sbc:' + k, SBC_N[k], E.dz.sbc === k, 0, `<em class="pf-sbc sbc-${k}" style="${sv}" aria-hidden="true"></em>`)).join('');
  return head('effects') + sec('Veb-sayt effektlari', 'Effektlar faqat veb-sahifada ishlaydi.', `<div class="pfs-rows">${fxs}</div>`)
    + sec('Aylantirish chizig‘i', 'Veb-saytning o‘ng tomonidagi scroll chizig‘i. Faqat veb-sahifada ko‘rinadi.', `<div class="pf-chs" role="radiogroup" aria-label="${esc(tr('O‘lchami'))}">${sbs}</div><div class="pf-chs" role="radiogroup" aria-label="${esc(tr('Rangi'))}" style="margin-top:10px">${sbcs}</div>`);
}

function tAi(st, plan) {
  const A = allow(plan);
  return head('ai') + `<section class="pfs-ai"><p class="sub">${esc(tr('AI ma’lumotingiz va xohishingizga qarab siz uchun shaxsiy shablon yaratadi: ranglar, shriftlar, sarlavha va karta uslubi. Shablon “Mening dizaynlarim”ga saqlanadi, uni xohlagancha tahrirlaysiz.'))}</p>
    <div class="field"><label class="f" for="pf-wish">${esc(tr('Qanday ko‘rinish xohlaysiz? (ixtiyoriy)'))}</label><input id="pf-wish" type="text" maxlength="200" value="${esc(st.wish || '')}" placeholder="${esc(tr('Masalan: jiddiy, zamonaviy, qora fon'))}" autocomplete="off"></div>
    <div class="pf-bar"><button type="button" class="btn ${A.ai ? 'primary' : ''}" data-do="ai-design">${esc(tr('AI shablon yaratsin (2 kredit)'))}</button>${A.ai ? '' : tag(2)}</div><div id="pf-ai-res">${st.aiWhy ? aiRes(st.aiWhy) : ''}</div></section>`;
}

const PANELS = { templates: tTemplates, colors: tColors, fonts: tFonts, style: tStyle, background: tBackground, effects: tEffects, ai: tAi };

/* ---------------- Free va Plus: faqat shablon tanlash (muharrir Pro'da) ---------------- */
const PRO_ITEMS = ['Ranglar va rang uyg‘unligi', 'Shriftlar va matn uslubi', 'Fon va naqshlar', 'Veb-sayt effektlari', 'O‘z dizaynim', 'AI dizayner'];
const crown = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.5l4.2 3.6L12 5l4.3 7.1 4.2-3.6-1.7 9.5H5.2z"/><path d="M5.5 21h13"/></svg>';
/** Pro muharriri haqida chiroyli taklif kartasi (Shablonlar panelining pastida). */
const proCard = () => `<aside class="pfs-pro" data-tier="pro"><span class="pfs-pro-i">${crown}</span><div><b>${esc(tr('Dizayn muharriri'))}</b><p>${esc(tr('Pro tarifida ranglar, shriftlar, fon, effektlar, o‘z dizayningiz va AI dizayner ochiladi.'))}</p><a class="btn sm tier-pro" href="#/pricing">${esc(tr('Pro tarifni ko‘rish'))}</a></div></aside>`;
function tTemplatesLite(st, plan) {
  const { r, E, sv, a, a2 } = ctxOf(st, plan);
  const tpls = TPLS.map(k => `<button type="button" class="pf-tp${TPL[k].t > r ? ' lk' : ''}" role="radio" aria-checked="${E.tpl === k}" data-dz="tpl:${k}"${TPL[k].t > r ? ` data-need="${TPL[k].t}"` : ''} style="${sv}"><svg viewBox="0 0 44 60" aria-hidden="true">${THUMB[k]}</svg><span>${esc(tr(TPL_N[k]))}</span>${tag(TPL[k].t > r ? TPL[k].t : 0)}</button>`).join('');
  const pals = PALETTES.map((p, i) => [p, i]).filter(([p]) => p[3] <= 1).map(([p, i]) => `<button type="button" class="pfs-pt${p[3] > r ? ' lk' : ''}" role="radio" aria-checked="${a === p[0] && a2 === p[1]}" data-dz="pal:${i}"${p[3] > r ? ` data-need="${p[3]}"` : ''} aria-label="${esc(tr(p[2]))}"><i style="background:linear-gradient(135deg,${p[0]} 55%,${p[1]} 55%)">${p[3] > r ? LOCK : ''}</i><span>${esc(tr(p[2]))}</span></button>`).join('');
  return head('templates') + sec('Tayyor shablonlar', '', `<div class="pf-tpls pfs-tpls" role="radiogroup" aria-label="${esc(tr('Shablonlar'))}">${tpls}</div>`) + sec('Asosiy rang', '', `<div class="pfs-pal" role="radiogroup" aria-label="${esc(tr('Rang'))}">${pals}</div>`) + proCard();
}
/** Muharrir asbobi yopiq: haqiqiy panelning xira, bosib bo‘lmaydigan ko‘rinishi va Pro taklifi. */
function gateHTML(st, tool) {
  const body = PANELS[tool](st, 'pro').replace(/^<header class="pfs-ph">[\s\S]*?<\/header>/, '');
  return head(tool) + `<div class="pfs-gate"><div class="pfs-gate-pv" inert aria-hidden="true">${body}</div><div class="pfs-gate-c" data-tier="pro"><span class="pfs-pro-i">${crown}</span><h4>${esc(tr('Muharrir Pro tarifida ochiladi'))}</h4><ul>${PRO_ITEMS.map(x => `<li>${esc(tr(x))}</li>`).join('')}</ul><a class="btn primary tier-pro" href="#/pricing">${esc(tr('Pro tarifga o‘tish'))}</a><button type="button" class="btn sm" data-pfs-tool="templates">${esc(tr('Shablonlarga qaytish'))}</button></div></div>`;
}
/** Studiya o‘ng paneli (tanlangan asbob) HTML'i. tool — TOOLS dagi id. Free/Plus: faqat shablonlar, qolgan asboblar Pro taklifi bilan. */
export function toolHTML(st, plan, tool) {
  if (!allow(plan).studio) return tool === 'templates' ? tTemplatesLite(st, plan) : gateHTML(st, PANELS[tool] ? tool : 'colors');
  return (PANELS[tool] || PANELS.templates)(st, plan);
}

/** "Tasodifiy" tugmasi: tarifga ruxsat etilgan variantlardan yangi uyg‘un kombinatsiya. rnd — [0,1) tasodifiy son (testlar uchun). */
const HEAD_F = ['grotesk', 'display', 'editorial', 'dmserif', 'unbounded', 'syne', 'bricolage', 'outfit', 'montserrat', 'cormorant', 'lora', 'inter', 'manrope'];
const BODY_F = ['inter', 'sans', 'manrope', 'plexsans', 'lora', 'serif', 'merriweather', 'montserrat', 'outfit'];
export function shuffleDz(st, plan, rnd = Math.random) {
  const A = allow(plan), pk = a => a[Math.floor(rnd() * a.length) % a.length], dz = st.pf.dz, pal = pk(A.palettes), keys = (set, kind) => Object.keys(set).filter(k => A.ok(kind, k));
  if (!A.studio) { st.pf.tpl = pk(A.tpls); st.pf.accent = pal[0]; dz.acc2 = pal[1]; return { ok: 1 }; } // Free/Plus: faqat shablon va rang
  if (dz.my) {
    const my = dz.my, p = pk(MY_PRESETS);
    [my.bg, my.card, my.ink, my.mut, my.line] = [p[1], p[2], p[3], p[4], p[5]];
    my.base = pk(MY_BASES); st.pf.tpl = my.base; my.h2 = pk(MY_H2); my.card2 = pk(MY_CARD); my.r = pk([4, 8, 12, 16, 20, 26]); my.hw = pk([600, 700, 800]); my.hcase = rnd() < 0.25 ? 'upper' : 'none';
    my.hf = pk(HEAD_F); my.bf = pk(BODY_F);
  } else {
    st.pf.tpl = pk(A.tpls); dz.font = pk(keys(FONTS, 'font')); dz.shape = pk(keys(SHAPES, 'shape'));
  }
  st.pf.accent = pal[0]; dz.acc2 = pal[1]; dz.bg = pk(keys(BGS, 'bg'));
  return { ok: 1 };
}

/** "O‘z dizayn" tugmalari: { ok } qaytaradi. */
export function myApply(st, key) {
  const my = st.pf.dz.my; if (!my) return {};
  const [k, v] = key.split(':');
  const OK = { base: MY_BASES, hcase: ['none', 'upper'], h2: MY_H2, card2: MY_CARD, hf: MY_FONTS, bf: MY_FONTS };
  if (!OK[k] || !OK[k].includes(v)) return {};
  my[k] = v; if (k === 'base') st.pf.tpl = v; return { ok: 1 };
}
export function myPreset(st, i) { const p = MY_PRESETS[+i], my = st.pf.dz.my; if (!p || !my) return; [my.bg, my.card, my.ink, my.mut, my.line] = [p[1], p[2], p[3], p[4], p[5]]; }
export function myNew(st) { const my = defaultMy(st.pf.accent); my.base = MY_BASES.includes((TPL[st.pf.tpl] || {}).fam) ? TPL[st.pf.tpl].fam : 'ledger'; st.pf.dz.my = my; st.pf.tpl = my.base; }

export const aiRes = why => `<div class="pf-ai-r"><b>${esc(tr('AI yaratgan shablon'))}${why.name ? ': ' + esc(why.name) : ''}</b>${why.text ? `<p>${esc(why.text)}</p>` : ''}<button type="button" class="btn sm" data-do="ai-undo">${esc(tr('Oldingisiga qaytarish'))}</button></div>`;

/** Studiya tugmasi bosildi. Natija: { ok } yoki { lock: 1|2 } (tarif yetmaydi). */
export function dzApply(st, key, plan) {
  const A = allow(plan), [kind, id] = key.split(':'), dz = st.pf.dz;
  if (kind === 'custom') return { lock: 2 };
  if (!A.studio && kind !== 'tpl' && kind !== 'pal') return { lock: 2 }; // shrift, fon, effekt, uyg‘unlik va h.k. — muharrir (Pro)
  if (kind === 'harm' || kind === 'swap') {
    if (!dz.my && !A.custom) return { lock: 2 };
    if (kind === 'swap') { const t = st.pf.accent; st.pf.accent = dz.acc2; dz.acc2 = t; return { ok: 1 }; }
    const hm = harmony(st.pf.accent), h = Object.hasOwn(hm, id) ? hm[id] : null; if (!h) return {}; dz.acc2 = h; return { ok: 1 };
  }
  if (kind === 'tpl') { if (!Object.hasOwn(TPL, id)) return {}; if (!A.ok('tpl', id)) return { lock: TPL[id].t }; st.pf.tpl = id; return { ok: 1 }; }
  if (kind === 'pal') { const p = PALETTES[+id]; if (!p) return {}; if (p[3] > A.rank) return { lock: p[3] }; st.pf.accent = p[0]; dz.acc2 = p[1]; return { ok: 1 }; }
  if (kind === 'fx') {
    if (!Object.hasOwn(FXS, id)) return {};
    if (dz.fx.includes(id)) { dz.fx = dz.fx.filter(x => x !== id); return { ok: 1 }; }
    if (!A.ok('fx', id)) return { lock: FXS[id] };
    dz.fx = [...dz.fx, id]; return { ok: 1 };
  }
  if (['font', 'bg', 'mode', 'shape', 'dens', 'sb', 'sbc'].includes(kind)) { const need = Object.hasOwn(TIERS[kind], id) ? TIERS[kind][id] : null; if (need == null) return {}; if (need > A.rank) return { lock: need }; dz[kind] = id; return { ok: 1 }; }
  return {};
}

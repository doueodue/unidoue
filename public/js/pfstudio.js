/* Portfolio dizayn studiyasi (interfeys): shablon, rang, shrift, fon, effekt, rejim va shakl tanlovi.
 * Tarif cheklovi pfdesign.js dagi allow()/effective() orqali; yopiq variant bosilsa, taklif oynasi chiqadi (tanlov saqlanmaydi). */
import { esc } from './core.js';
import { t as tr } from './i18n.js';
import { TPLS, TPL, PALETTES, FONTS, BGS, FXS, MODES, SHAPES, DENS, TIERS, allow, effective, lockedCount } from './pfdesign.js';
import { bgLayers } from './pfcss.js';
import { tierIcon, tierMedal, tierOf } from './tiers.js';

export const TPL_N = { ledger: 'Klassik', rail: 'Yon panel', atlas: 'Atlas', folio: 'Muqova', poster: 'Poster', noir: 'Noir', nova: 'Nova', timeline: 'Yo‘l' };
const FONT_N = { auto: 'Avtomatik', serif: 'Serif', sans: 'Sans', grotesk: 'Grotesk', display: 'Display', editorial: 'Editorial', mono: 'Mono' };
const BG_N = { none: 'Yo‘q', paper: 'Qog‘oz', grid: 'To‘r', dots: 'Nuqtalar', mesh: 'Gradient', aurora: 'Aurora', waves: 'To‘lqin', noise: 'Donador', stars: 'Yulduzlar', topo: 'Topografiya', blueprint: 'Chizma' };
const FX_N = { reveal: 'Silliq paydo bo‘lish', count: 'Raqam sanash', progress: 'O‘qish chizig‘i', marquee: 'Ko‘nikma tasmasi', spot: 'Kartada yoritish', tilt: '3D qiyalik', parallax: 'Parallaks', type: 'Yozilib chiqish', glow: 'Kursor nuri' };
const MODE_N = { tpl: 'Shablon bo‘yicha', light: 'Kunduzgi', dark: 'Tungi', system: 'Qurilmaga qarab' };
const SHAPE_N = { soft: 'Yumshoq', sharp: 'Qirrali', round: 'Dumaloq' };
const DENS_N = { cozy: 'Qulay', compact: 'Zich' };
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

/** Dizayn tabi HTML. plan — joriy tarif; st.pf — model. */
export function studioHTML(st, plan) {
  const A = allow(plan), E = effective(st.pf, plan), r = A.rank, a = E.accent, a2 = E.dz.acc2, L = n => (n > r ? n : 0);
  const sv = `--a:${a};--a2:${a2}`;
  const tpls = TPLS.map(k => `<button type="button" class="pf-tp${TPL[k].t > r ? ' lk' : ''}" role="radio" aria-checked="${E.tpl === k}" data-dz="tpl:${k}"${TPL[k].t > r ? ` data-need="${TPL[k].t}"` : ''} style="${sv}"><svg viewBox="0 0 44 60" aria-hidden="true">${THUMB[k]}</svg><span>${esc(tr(TPL_N[k]))}</span>${tag(L(TPL[k].t))}</button>`).join('');
  const pals = PALETTES.map((p, i) => `<button type="button" class="pf-sw${p[3] > r ? ' lk' : ''}" role="radio" aria-checked="${a === p[0] && a2 === p[1]}" data-dz="pal:${i}"${p[3] > r ? ` data-need="${p[3]}"` : ''} style="background:linear-gradient(135deg,${p[0]} 55%,${p[1]} 55%)" aria-label="${esc(tr(p[2]))}" title="${esc(tr(p[2]))}">${p[3] > r ? LOCK : ''}</button>`).join('');
  const custom = A.custom
    ? `<div class="pf-cc"><label>${esc(tr('Asosiy rang'))}<input type="color" value="${a}" data-cc="accent" aria-label="${esc(tr('Asosiy rang'))}"></label><label>${esc(tr('Qo‘shimcha rang'))}<input type="color" value="${a2}" data-cc="acc2" aria-label="${esc(tr('Qo‘shimcha rang'))}"></label></div>`
    : `<button type="button" class="pf-cc lk" data-dz="custom:1" data-need="2"><span>${esc(tr('O‘z ranglaringizni tanlash'))}</span>${tag(2)}</button>`;
  const fonts = Object.keys(FONTS).map(k => chip('font:' + k, FONT_N[k], E.dz.font === k, L(FONTS[k].t))).join('');
  const bgs = Object.keys(BGS).map(k => { const ly = bgLayers(k, a, false), bg = ly.l.length ? `background:${[...ly.l, ly.base || '#fff'].join(',')};` : 'background:#fff;'; return chip('bg:' + k, BG_N[k], E.dz.bg === k, L(BGS[k]), `<em class="pf-bgs" style="${sv};${bg}"></em>`); }).join('');
  const fxs = Object.keys(FXS).map(k => `<button type="button" class="pf-ch${FXS[k] > r ? ' lk' : ''}" role="checkbox" aria-checked="${E.dz.fx.includes(k)}" data-dz="fx:${k}"${FXS[k] > r ? ` data-need="${FXS[k]}"` : ''}><span>${esc(tr(FX_N[k]))}</span>${tag(L(FXS[k]))}</button>`).join('');
  const modes = Object.keys(MODES).map(k => chip('mode:' + k, MODE_N[k], E.dz.mode === k, L(MODES[k]))).join('');
  const shapes = Object.keys(SHAPES).map(k => chip('shape:' + k, SHAPE_N[k], E.dz.shape === k, L(SHAPES[k]))).join('');
  const denss = Object.keys(DENS).map(k => chip('dens:' + k, DENS_N[k], E.dz.dens === k, L(DENS[k]))).join('');
  const n = lockedCount(plan);
  const ai = `<section class="pf-ai card"><div class="pf-ai-h"><h3>${esc(tr('AI dizayner'))}</h3>${A.ai ? '' : tag(2)}</div><p class="sub">${esc(tr('Yo‘nalishingiz va xohishingizga qarab AI shablon, rang, shrift, fon va effektlarni o‘zi tanlaydi. Natijani ko‘rib, o‘zingiz tahrirlaysiz.'))}</p>
    <div class="field"><label class="f" for="pf-wish">${esc(tr('Qanday ko‘rinish xohlaysiz? (ixtiyoriy)'))}</label><input id="pf-wish" type="text" maxlength="200" value="${esc(st.wish || '')}" placeholder="${esc(tr('Masalan: jiddiy, zamonaviy, qora fon'))}" autocomplete="off"></div>
    <div class="pf-bar"><button type="button" class="btn ${A.ai ? 'primary' : ''}" data-do="ai-design">${esc(tr('AI dizayn tanlasin (2 kredit)'))}</button></div><div id="pf-ai-res">${st.aiWhy ? aiRes(st.aiWhy) : ''}</div></section>`;
  const nx = plan === 'free' ? 'plus' : 'pro';
  return `${n ? `<div class="pf-up tg" data-tier="${nx}" data-live>${tierMedal(nx)}<div><b>${esc(tr('Tarifingizda yopiq variantlar:'))} ${n}</b><p>${esc(tr('Plus va Pro tarifida ko‘proq shablon, rang, fon va effekt ochiladi. Pro tarifida hammasi va o‘z ranglaringiz.'))}</p></div><a class="btn sm tier-${nx}" href="#/pricing">${esc(tr('Tariflarni ko‘rish'))}</a></div>` : `<div class="pf-up tg" data-tier="pro" data-live data-sweep>${tierMedal('pro')}<div><b>${esc(tr('Pro: hamma dizayn ochiq'))}</b><p>${esc(tr('Barcha shablon, fon, effekt va shriftlar, o‘z ranglaringiz va AI dizayner sizniki.'))}</p></div></div>`}
  ${ai}<div class="card pf-dz">${sec('Shablon', '', `<div class="pf-tpls">${tpls}</div>`)}${sec('Rang', '', `<div class="pf-pal" role="radiogroup" aria-label="${esc(tr('Rang'))}">${pals}</div>${custom}`)}${sec('Shrift', '', `<div class="pf-chs" role="radiogroup">${fonts}</div>`)}
  ${sec('Fon', 'Fon PDF da ham, veb-sahifada ham ko‘rinadi. Veb-sahifada harakatlanadi.', `<div class="pf-chs pf-bgl" role="radiogroup">${bgs}</div>`)}${sec('Veb-sayt effektlari', 'Effektlar faqat veb-sahifada ishlaydi.', `<div class="pf-chs">${fxs}</div>`)}
  ${sec('Rejim', 'Tungi va kunduzgi rejim veb-sahifada ishlaydi.', `<div class="pf-chs" role="radiogroup">${modes}</div>`)}${sec('Shakl', '', `<div class="pf-chs" role="radiogroup">${shapes}</div>`)}${sec('Zichlik', '', `<div class="pf-chs" role="radiogroup">${denss}</div>`)}</div>`;
}
export const aiRes = why => `<div class="pf-ai-r"><b>${esc(tr('AI tanlovi'))}</b>${why.text ? `<p>${esc(why.text)}</p>` : ''}<button type="button" class="btn sm" data-do="ai-undo">${esc(tr('Oldingisiga qaytarish'))}</button></div>`;

/** Studiya tugmasi bosildi. Natija: { ok } yoki { lock: 1|2 } (tarif yetmaydi). */
export function dzApply(st, key, plan) {
  const A = allow(plan), [kind, id] = key.split(':'), dz = st.pf.dz;
  if (kind === 'custom') return { lock: 2 };
  if (kind === 'tpl') { if (!TPL[id]) return {}; if (!A.ok('tpl', id)) return { lock: TPL[id].t }; st.pf.tpl = id; return { ok: 1 }; }
  if (kind === 'pal') { const p = PALETTES[+id]; if (!p) return {}; if (p[3] > A.rank) return { lock: p[3] }; st.pf.accent = p[0]; dz.acc2 = p[1]; return { ok: 1 }; }
  if (kind === 'fx') {
    if (!Object.hasOwn(FXS, id)) return {};
    if (dz.fx.includes(id)) { dz.fx = dz.fx.filter(x => x !== id); return { ok: 1 }; }
    if (!A.ok('fx', id)) return { lock: FXS[id] };
    dz.fx = [...dz.fx, id]; return { ok: 1 };
  }
  if (['font', 'bg', 'mode', 'shape', 'dens'].includes(kind)) { const need = TIERS[kind][id]; if (need == null) return {}; if (need > A.rank) return { lock: need }; dz[kind] = id; return { ok: 1 }; }
  return {};
}

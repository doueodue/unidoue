/* Portfolio dizayn tizimi: shablonlar, ranglar, shriftlar, fonlar, effektlar va tarif bo'yicha cheklovlar.
 * DOM'ga bog'liq emas: brauzerda ham, Node testlarida ham ishlaydi.
 * Tarif cheklovi HAR DOIM effective() orqali qo'llanadi: saqlangan tanlov yuqori tarifdan qolgan bo'lsa ham,
 * hujjat (ko'rinish, PDF, Word, veb) joriy tarifga ruxsat etilgan eng yaqin variantda chiqadi. */

import { cleanMy, MY_BASES } from './pfmy.js';

export const RANK = { free: 0, plus: 1, pro: 2 };
export const rankOf = plan => RANK[plan] ?? 0;

/* t — shablon ochiladigan eng past tarif (0 Free, 1 Plus, 2 Pro); fam — A4 maket oilasi; hf/bf — standart shrift (sarlavha/matn); dark — tabiatan qorongʻi */
export const TPL = {
  ledger: { t: 0, fam: 'ledger', hf: 'serif', bf: 'serif', fb: 'ledger' },
  rail: { t: 0, fam: 'rail', hf: 'sans', bf: 'sans', fb: 'rail' },
  atlas: { t: 1, fam: 'ledger', hf: 'mono', bf: 'sans', fb: 'ledger' },
  folio: { t: 1, fam: 'folio', hf: 'display', bf: 'sans', fb: 'rail' },
  poster: { t: 1, fam: 'folio', hf: 'grotesk', bf: 'sans', fb: 'rail' },
  noir: { t: 2, fam: 'rail', hf: 'grotesk', bf: 'sans', dark: 1, fb: 'rail' },
  nova: { t: 2, fam: 'folio', hf: 'grotesk', bf: 'sans', dark: 1, fb: 'folio' },
  timeline: { t: 2, fam: 'ledger', hf: 'editorial', bf: 'sans', fb: 'ledger' }
};
export const TPLS = Object.keys(TPL);

/* [asosiy rang, ikkinchi rang, nomi, tarif] */
export const PALETTES = [
  ['#2745e8', '#7c5cff', 'Kobalt', 0], ['#0b7a5f', '#38c6a0', 'Zumrad', 0], ['#b5304a', '#ff7a59', 'Anor', 0], ['#2f3a4a', '#6b7a90', 'Grafit', 0],
  ['#c4561b', '#f2a33a', 'Kuz', 1], ['#6a3fd1', '#c06cff', 'Binafsha', 1], ['#0a6ea8', '#36d1dc', 'Okean', 1], ['#d6336c', '#ff9ec0', 'Atirgul', 1], ['#129490', '#7ee0c3', 'Yalpiz', 1], ['#a87a12', '#f5d061', 'Oltin', 1],
  ['#00a6e0', '#7a5cff', 'Neon', 2], ['#e0361c', '#ffb02e', 'Lava', 2], ['#9b2fd0', '#ff4fa3', 'Orkide', 2], ['#1d2b64', '#f8cdda', 'Tun', 2], ['#4f7a2a', '#d4e157', 'Mox', 2], ['#8a5a3c', '#e6c79c', 'Qum', 2]
];
export const ACCENTS = PALETTES.map(p => [p[0], p[2]]); // eski nom: rang, nomi

/* Shriftlar: id -> [sarlavha, matn, tarif] */
export const FF = {
  serif: '"Source Serif 4",Georgia,"Times New Roman",serif',
  sans: '"DM Sans",system-ui,"Segoe UI",Arial,sans-serif',
  display: 'Fraunces,"Source Serif 4",Georgia,serif',
  grotesk: '"Space Grotesk","DM Sans",system-ui,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace',
  editorial: '"Playfair Display","Source Serif 4",Georgia,serif',
  /* "Mening dizaynim" uchun qo‘shimcha shriftlar (hamma tarifda) */
  inter: 'Inter,system-ui,"Segoe UI",Arial,sans-serif', manrope: 'Manrope,system-ui,sans-serif', outfit: 'Outfit,system-ui,sans-serif', montserrat: 'Montserrat,system-ui,sans-serif',
  unbounded: 'Unbounded,"Space Grotesk",system-ui,sans-serif', syne: 'Syne,"Space Grotesk",system-ui,sans-serif', bricolage: '"Bricolage Grotesque",system-ui,sans-serif', plexsans: '"IBM Plex Sans",system-ui,sans-serif',
  lora: 'Lora,Georgia,serif', merriweather: 'Merriweather,Georgia,serif', cormorant: '"Cormorant Garamond",Georgia,serif', dmserif: '"DM Serif Display",Georgia,serif', plexmono: '"IBM Plex Mono",ui-monospace,Menlo,monospace'
};
export const MY_FONTS = Object.keys(FF);
export const FONT_LABEL = { serif: 'Source Serif', sans: 'DM Sans', display: 'Fraunces', grotesk: 'Space Grotesk', mono: 'JetBrains Mono', editorial: 'Playfair Display', inter: 'Inter', manrope: 'Manrope', outfit: 'Outfit', montserrat: 'Montserrat', unbounded: 'Unbounded', syne: 'Syne', bricolage: 'Bricolage Grotesque', plexsans: 'IBM Plex Sans', lora: 'Lora', merriweather: 'Merriweather', cormorant: 'Cormorant Garamond', dmserif: 'DM Serif Display', plexmono: 'IBM Plex Mono' };
export const FONTS = { auto: { t: 0 }, serif: { t: 1, h: 'serif', b: 'serif' }, sans: { t: 1, h: 'sans', b: 'sans' }, grotesk: { t: 2, h: 'grotesk', b: 'sans' }, display: { t: 2, h: 'display', b: 'sans' }, editorial: { t: 2, h: 'editorial', b: 'serif' }, mono: { t: 2, h: 'mono', b: 'sans' } };
export const GF = {
  serif: 'Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400', sans: 'DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700',
  display: 'Fraunces:opsz,wght@9..144,500;9..144,600', grotesk: 'Space+Grotesk:wght@500;600;700', mono: 'JetBrains+Mono:wght@400;600', editorial: 'Playfair+Display:ital,wght@0,600;0,700;1,500',
  inter: 'Inter:wght@400;500;600;700;800', manrope: 'Manrope:wght@400;500;600;700;800', outfit: 'Outfit:wght@400;500;600;700;800', montserrat: 'Montserrat:wght@400;500;600;700;800',
  unbounded: 'Unbounded:wght@400;500;600;700;800', syne: 'Syne:wght@400;500;600;700;800', bricolage: 'Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800', plexsans: 'IBM+Plex+Sans:wght@400;500;600;700',
  lora: 'Lora:ital,wght@0,400;0,600;0,700;1,400', merriweather: 'Merriweather:wght@400;700;900', cormorant: 'Cormorant+Garamond:wght@500;600;700', dmserif: 'DM+Serif+Display', plexmono: 'IBM+Plex+Mono:wght@400;600;700'
};

export const BGS = { none: 0, paper: 1, grid: 1, dots: 1, mesh: 1, aurora: 2, waves: 2, noise: 2, stars: 2, topo: 2, blueprint: 2 };
export const FXS = { reveal: 0, count: 1, progress: 1, marquee: 1, spot: 2, tilt: 2, parallax: 2, type: 2, glow: 2 };
export const MODES = { tpl: 0, light: 0, dark: 1, system: 1 };
export const SHAPES = { soft: 0, sharp: 1, round: 2 };
export const DENS = { cozy: 0, compact: 2 };
/* Veb-sayt aylantirish chizig‘i (scrollbar): o‘lchami va rangi, hamma tarifda */
export const SBS = { normal: 0, thin: 0, bold: 0, hidden: 0 };
export const SBCS = { accent: 0, gradient: 0, ink: 0, soft: 0 };
export const TIERS = { tpl: Object.fromEntries(TPLS.map(k => [k, TPL[k].t])), font: Object.fromEntries(Object.entries(FONTS).map(([k, v]) => [k, v.t])), bg: BGS, fx: FXS, mode: MODES, shape: SHAPES, dens: DENS, sb: SBS, sbc: SBCS };

export const defaultDz = () => ({ acc2: '#7c5cff', font: 'auto', bg: 'none', fx: ['reveal'], mode: 'tpl', dens: 'cozy', shape: 'soft', sb: 'normal', sbc: 'accent' });

const hex = (c, d) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : d);
/** Saqlangan/AI dan kelgan dizaynni oq roʻyxat boʻyicha tozalaydi (tarifga qaramaydi). */
export function cleanDz(d) {
  d = d && typeof d === 'object' ? d : {};
  const o = defaultDz(), pick = (v, set, f) => (typeof v === 'string' && Object.hasOwn(set, v) ? v : f);
  o.acc2 = hex(d.acc2, o.acc2); o.font = pick(d.font, FONTS, 'auto'); o.bg = pick(d.bg, BGS, 'none'); o.mode = pick(d.mode, MODES, 'tpl'); o.dens = pick(d.dens, DENS, 'cozy'); o.shape = pick(d.shape, SHAPES, 'soft'); o.sb = pick(d.sb, SBS, 'normal'); o.sbc = pick(d.sbc, SBCS, 'accent');
  o.fx = Array.isArray(d.fx) ? [...new Set(d.fx.filter(x => typeof x === 'string' && Object.hasOwn(FXS, x)))].slice(0, 9) : o.fx;
  const my = cleanMy(d.my, MY_FONTS); if (my) o.my = my; // foydalanuvchining o‘z dizayni (bo‘lmasa kalit yo‘q)
  return o;
}

const dist = (a, b) => { const n = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = n(a), y = n(b); return x.reduce((s, v, i) => s + (v - y[i]) ** 2, 0); };

/** Tarif ruxsat beradigan imkoniyatlar. custom — ixtiyoriy rang tanlash (Pro). */
export function allow(plan) {
  const r = rankOf(plan);
  const ok = (kind, id) => (TIERS[kind] && Object.hasOwn(TIERS[kind], id) ? TIERS[kind][id] <= r : false);
  return { rank: r, ok, custom: r >= 2, ai: r >= 2, palettes: PALETTES.filter(p => p[3] <= r), tpls: TPLS.filter(k => TPL[k].t <= r) };
}

/** Joriy tarifga moslashtirilgan dizayn. pf — normalize qilingan model. Natija: { tpl, accent, dz } (pf nusxasi o'zgarmaydi). */
export function effective(pf, plan) {
  const A = allow(plan), dz = cleanDz(pf && pf.dz);
  if (dz.my) { // o‘z dizayni: hamma tarifda; asos tuzilma, ranglar va shriftlar foydalanuvchiniki. Fon, effekt va zichlik tarif bo‘yicha.
    const out = { ...dz, mode: 'light', font: 'auto', shape: 'soft' };
    if (!A.ok('bg', out.bg)) out.bg = 'none'; if (!A.ok('dens', out.dens)) out.dens = 'cozy'; out.fx = out.fx.filter(x => A.ok('fx', x));
    return { tpl: MY_BASES.includes(dz.my.base) ? dz.my.base : 'ledger', accent: hex(pf && pf.accent, PALETTES[0][0]), dz: out, my: dz.my };
  }
  let tpl = TPL[pf && pf.tpl] ? pf.tpl : 'ledger';
  while (!A.ok('tpl', tpl)) tpl = TPL[tpl].fb;
  let accent = hex(pf && pf.accent, PALETTES[0][0]), acc2 = dz.acc2;
  if (!A.custom) { const pal = A.palettes, hit = pal.find(p => p[0] === accent) || pal.reduce((b, p) => (dist(p[0], accent) < dist(b[0], accent) ? p : b), pal[0]); accent = hit[0]; acc2 = hit[1]; }
  const out = { ...dz, acc2 };
  if (!A.ok('font', out.font)) out.font = 'auto';
  if (!A.ok('bg', out.bg)) out.bg = 'none';
  if (!A.ok('mode', out.mode)) out.mode = 'tpl';
  if (!A.ok('shape', out.shape)) out.shape = 'soft';
  if (!A.ok('dens', out.dens)) out.dens = 'cozy';
  out.fx = out.fx.filter(x => A.ok('fx', x));
  return { tpl, accent, dz: out };
}

/** Shablon + shrift tanlovidan haqiqiy shrift to'plami: { h, b } (FF kalitlari). */
export function fontPair(tpl, font, my) { if (my) return { h: my.hf, b: my.bf }; const t = TPL[tpl] || TPL.ledger, f = FONTS[font]; return f && f.h ? { h: f.h, b: f.b } : { h: t.hf, b: t.bf }; }

/** AI javobi (JSON) -> xavfsiz dizayn taklifi. Faqat oq roʻyxatdagi qiymatlar; tarif keyin effective() da qoʻllanadi. */
export function designFromAI(j, plan = 'pro') {
  j = j && typeof j === 'object' ? j : {};
  if (j.ink || j.base || (typeof j.bg === 'string' && j.bg[0] === '#')) { // AI yaratgan shaxsiy shablon (to‘liq ranglar, shriftlar, uslub)
    const my = cleanMy({ on: true, base: j.base || j.layout || j.template, bg: j.bg || j.background_color, card: j.card || j.surface, ink: j.ink || j.text, mut: j.muted || j.mut, line: j.line || j.border,
      hf: j.headingFont || j.hf, bf: j.bodyFont || j.bf, r: j.radius, hw: j.headingWeight || j.hw, hcase: j.headingCase || j.hcase, h2: j.sectionStyle || j.h2, card2: j.cardStyle || j.card2, name: j.name }, MY_FONTS);
    const dz = cleanDz({ acc2: j.accent2 || j.acc2, bg: j.pattern || j.bgPattern, fx: j.fx || j.effects, dens: j.density || j.dens, my });
    const e = effective({ tpl: my.base, accent: hex(j.accent, PALETTES[0][0]), dz }, plan);
    return { tpl: e.tpl, accent: e.accent, dz: { ...dz, fx: e.dz.fx, bg: e.dz.bg, dens: e.dz.dens }, why: String(j.why || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim().slice(0, 240), name: my.name };
  }
  const dz = cleanDz({ acc2: j.accent2 || j.acc2, font: j.font, bg: j.bg || j.background, fx: j.fx || j.effects, mode: j.mode, dens: j.density || j.dens, shape: j.shape });
  const tpl = typeof j.template === 'string' && TPL[j.template] ? j.template : typeof j.tpl === 'string' && TPL[j.tpl] ? j.tpl : 'ledger';
  const accent = hex(j.accent, PALETTES[0][0]);
  const why = String(j.why || j.reason || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim().slice(0, 240);
  const e = effective({ tpl, accent, dz }, plan);
  return { tpl: e.tpl, accent: e.accent, dz: e.dz, why };
}

/** Tarifda nimalar yopiqligini hisoblash (UI yozuvlari uchun). */
export function lockedCount(plan) {
  const r = rankOf(plan); let n = 0;
  for (const k of TPLS) if (TPL[k].t > r) n++;
  for (const p of PALETTES) if (p[3] > r) n++;
  for (const g of ['font', 'bg', 'fx', 'mode', 'shape', 'dens']) for (const v of Object.values(TIERS[g])) if (v > r) n++;
  return n;
}

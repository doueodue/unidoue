/* Portfolio: foydalanuvchining o‘z dizayni ("Mening dizaynim") va AI yaratadigan shaxsiy shablon.
 * Dizayn = asos tuzilma (ledger | rail | folio) + o‘z ranglari, shriftlari, sarlavha va karta uslubi, burchak radiusi.
 * Hamma qiymat oq ro‘yxat bo‘yicha tekshiriladi; ranglar o‘qilishi uchun kontrast talabiga avtomatik moslanadi
 * (matn ≥ 7:1 yoki kamida 4.5:1, ikkinchi matn ≥ 4.5:1, oq yozuvli tugma ≥ 4.5:1). DOM'ga bog‘liq emas. */

export const MY_BASES = ['ledger', 'rail', 'folio'];
export const MY_H2 = ['line', 'bar', 'pill', 'under', 'plain'];
export const MY_CARD = ['outline', 'flat', 'shadow', 'glass'];
export const MY_CASE = ['none', 'upper'];

const HEX = /^#[0-9a-f]{6}$/i;
export const hexOk = c => typeof c === 'string' && HEX.test(c);
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mixHex = (a, b, t) => { const x = rgb(a), y = rgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
export function lum(h) { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const isDark = h => lum(h) < 0.2;

/** fg rangini bg ustida kamida `min` kontrastga yetguncha qora yoki oqqa yaqinlashtiradi (rang tusi saqlanadi). */
export function fixContrast(fg, bg, min) {
  if (contrast(fg, bg) >= min) return fg;
  const to = contrast('#000000', bg) >= contrast('#ffffff', bg) ? '#000000' : '#ffffff';
  for (let t = 0.08; t <= 1.0001; t += 0.08) { const c = mixHex(fg, to, Math.min(1, t)); if (contrast(c, bg) >= min) return c; }
  return to;
}
/** Bir nechta fon ustida birdaniga talabga yetkazish. */
const fixOn = (fg, bgs, min) => { let c = fg; for (let k = 0; k < 4; k++) for (const b of bgs) c = fixContrast(c, b, min); return c; };

/** "#abc", "ABC", "#AABBCC" -> "#aabbcc"; noto‘g‘ri bo‘lsa ''. */
export function normHex(v) { let s = String(v == null ? '' : v).trim().toLowerCase().replace(/^#/, ''); if (/^[0-9a-f]{3}$/.test(s)) s = s.replace(/./g, c => c + c); return /^[0-9a-f]{6}$/.test(s) ? '#' + s : ''; }
const toHsl = h => { const [r, g, b] = rgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let hh = 0, ss = 0; if (d) { ss = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh = (hh * 60 + 360) % 360; } return [hh, ss, l]; };
const fromHsl = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return toHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]); };
export const HARMONY = ['analog', 'comp', 'triad', 'split', 'mono'];
/** Asosiy rangga mos [asosiy, ikkinchi] juftliklar (rang g‘ildiragi bo‘yicha). Natija: { analog, comp, triad, split, mono } -> ikkinchi rang. */
export function harmony(hex) {
  if (!hexOk(hex)) return {};
  const [h, s, l] = toHsl(hex), cl = v => Math.max(0.08, Math.min(0.92, v)), rot = d => fromHsl((h + d + 360) % 360, Math.max(0.35, s), cl(l));
  return { analog: rot(35), comp: rot(180), triad: rot(120), split: rot(150), mono: fromHsl(h, s, cl(l > 0.55 ? l - 0.24 : l + 0.26)) };
}

/** Tayyor boshlang‘ich ranglar: [nomi, fon, karta, matn, ikkinchi matn, chiziq] */
export const MY_PRESETS = [
  ['Oq qog‘oz', '#ffffff', '#f6f7f9', '#14161c', '#5b6270', '#e3e6eb'],
  ['Qaymoq', '#fbf6ee', '#ffffff', '#2a1d12', '#6e5a48', '#ecdfcf'],
  ['Yalpiz', '#eef7f3', '#ffffff', '#0f2a22', '#4d6a60', '#d3e7de'],
  ['Osmon', '#eef4fb', '#ffffff', '#0f1c2e', '#506176', '#d6e2f0'],
  ['Grafit', '#15171c', '#1e2128', '#eef0f4', '#a4abb8', '#2d313a'],
  ['Tun', '#0b1020', '#131a2e', '#e9edff', '#9aa5c8', '#232c47'],
  ['Shokolad', '#1c130e', '#271b14', '#f6ece4', '#c2ab9b', '#3a2a20']
];

export function defaultMy(accent) {
  const p = MY_PRESETS[0];
  return { on: true, base: 'ledger', bg: p[1], card: p[2], ink: p[3], mut: p[4], line: p[5], hf: 'grotesk', bf: 'inter', r: 14, hw: 700, hcase: 'none', h2: 'line', card2: 'outline', name: '', acc: hexOk(accent) ? accent.toLowerCase() : '#2745e8' };
}

/** Saqlangan/AI dan kelgan "o‘z dizayn"ni tozalaydi. fonts — ruxsat etilgan shrift kalitlari. Noto‘g‘ri bo‘lsa null. */
export function cleanMy(m, fonts) {
  if (!m || typeof m !== 'object' || !m.on) return null;
  const d = defaultMy(), col = (v, f) => (hexOk(v) ? v.toLowerCase() : f), one = (v, set, f) => (set.includes(v) ? v : f);
  const fk = v => (typeof v === 'string' && fonts.includes(v) ? v : null);
  const num = (v, a, b, f) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : f; };
  return {
    on: true, base: one(m.base, MY_BASES, d.base), bg: col(m.bg, d.bg), card: col(m.card, d.card), ink: col(m.ink, d.ink), mut: col(m.mut, d.mut), line: col(m.line, d.line),
    hf: fk(m.hf) || d.hf, bf: fk(m.bf) || d.bf, r: num(m.r, 0, 32, d.r), hw: Math.round(num(m.hw, 400, 800, d.hw) / 100) * 100,
    hcase: one(m.hcase, MY_CASE, 'none'), h2: one(m.h2, MY_H2, 'line'), card2: one(m.card2, MY_CARD, 'outline'),
    name: String(m.name || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim().slice(0, 40)
  };
}

/** O‘qiladigan yakuniy ranglar. acc — asosiy rang (tugma va belgilarda oq yozuv ostida turadi). */
export function myTokens(my, acc, acc2) {
  const bg = my.bg, card = my.card;
  const ink = fixOn(my.ink, [bg, card], 7), mut = fixOn(my.mut, [bg, card], 4.6);
  let line = my.line; if (contrast(line, bg) < 1.18) line = fixContrast(line, bg, 1.3);
  const a = fixContrast(hexOk(acc) ? acc : '#2745e8', '#ffffff', 4.6); // oq yozuv a ustida o‘qilsin
  const a2 = fixContrast(hexOk(acc2) ? acc2 : a, '#ffffff', 3); // gradientning ikkinchi uchida ham oq yozuv ko‘rinsin
  const at = fixOn(a, [bg, card], 4.6); // matndagi urg‘u (sanalar, sarlavha ostidagi yozuv)
  return { bg, card, ink, mut, line, a, a2, at, dark: isDark(bg) };
}
/** A4 (PDF) "rail" shablonidagi yon ustun rangi: qorong‘i dizaynda karta rangi (fondan ajralib turadigan), yorug‘da asosiy rangning to‘qroq tusi.
 *  Ustundagi yozuv oq, shuning uchun rang oq ustida kamida 7:1 (qorong‘i) / 4.5:1 (yorug‘) kontrastga ega bo‘ladi. */
export function mySide(t) {
  if (!t.dark) return mixHex(t.a, '#0a0d14', 0.2);
  let s = contrast(t.card, t.bg) >= 1.08 ? t.card : mixHex(t.bg, t.ink, 0.09);
  for (let k = 0; k < 14 && contrast('#ffffff', s) < 7; k++) s = mixHex(s, '#000000', 0.15);
  return s;
}
/** Foydalanuvchiga ko‘rsatish uchun: qaysi ranglar o‘qilishi uchun o‘zgartirildi. */
export function myAdjusted(my, acc) {
  const t = myTokens(my, acc, acc), out = [];
  if (t.ink !== my.ink) out.push('ink'); if (t.mut !== my.mut) out.push('mut'); if (t.a !== (acc || '').toLowerCase()) out.push('acc');
  return out;
}

/* ---------------- veb-sayt uchun qo‘shimcha CSS ---------------- */
export function myWebCSS(my, t) {
  const up = my.hcase === 'upper', ls1 = up ? '-.01em' : '-.045em', ls2 = up ? '.01em' : '-.035em';
  const vars = `--bg:${t.bg};--card:${t.card};--ink:${t.ink};--mut:${t.mut};--line:${t.line};--a:${t.a};--a2:${t.a2};--at:${t.at};--r:${my.r}px;--hw:${my.hw}`;
  const h2 = {
    line: '',
    bar: 'body.my h2::after{display:none}body.my h2::before{content:"";flex:none;width:8px;align-self:stretch;min-height:.9em;border-radius:4px;background:linear-gradient(var(--a),var(--a2))}',
    pill: 'body.my h2{display:inline-flex;font-size:clamp(17px,2vw,22px);letter-spacing:.01em;padding:.5em 1.15em;border-radius:99px;background:var(--a);color:#fff}body.my h2::after{display:none}body.my .cta h2{background:none;color:var(--ink);padding:0;font-size:clamp(34px,6.4vw,76px)}',
    under: 'body.my h2{display:inline-block;padding-bottom:.16em;border-bottom:4px solid var(--a)}body.my h2::after{display:none}body.my .cta h2{border-bottom:0}',
    plain: 'body.my h2::after{display:none}'
  }[my.h2];
  const card = {
    outline: '',
    flat: 'body.my .e,body.my .strip,body.my .tg span,body.my .mq span,body.my .gal figure{border-color:transparent}',
    shadow: 'body.my .e,body.my .strip,body.my .tg span,body.my .mq span,body.my .gal figure{border-color:transparent;box-shadow:0 16px 38px -22px rgba(0,0,0,.38),0 2px 6px -2px rgba(0,0,0,.08)}',
    glass: `body.my .e,body.my .strip,body.my .tg span,body.my .mq span,body.my .gal figure{background:color-mix(in srgb,var(--card) 62%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);border-color:color-mix(in srgb,var(--ink) ${t.dark ? 16 : 10}%,transparent)}`
  }[my.card2];
  return `:root,html.dk{${vars}}html{color-scheme:${t.dark ? 'dark' : 'light'}}
body.my h1,body.my h2,body.my .e .t,body.my .strip b,body.my .pw .mono{font-weight:var(--hw)}body.my h1{letter-spacing:${ls1}}body.my h2{letter-spacing:${ls2}}${up ? 'body.my h1,body.my h2{text-transform:uppercase}' : ''}
${h2}${card}`;
}

/* ---------------- A4 (PDF) uchun qo‘shimcha CSS ---------------- */
export function myPrintCSS(my, fam, t) {
  const up = my.hcase === 'upper';
  const h2base = fam === 'ledger' ? 'h2' : fam === 'rail' ? 'main h2' : 'h2';
  const H2 = {
    line: `${h2base}{display:flex;align-items:center;gap:9pt;border:0;padding:0;background:none;color:var(--at)}${h2base}::after{content:"";display:block;flex:1;border-top:.75pt solid var(--line)}`,
    bar: `${h2base}{display:block;border:0;border-left:2.8pt solid var(--a);padding:0 0 0 7pt;background:none;color:var(--ink)}${h2base}::after{display:none}`,
    pill: `${h2base}{display:inline-block;width:auto;border:0;padding:2pt 10pt;border-radius:99pt;background:var(--a);color:#fff;font-size:10pt}${h2base}::after{display:none}`,
    under: `${h2base}{display:inline-block;border:0;border-bottom:1.6pt solid var(--a);padding:0 0 1.5pt;background:none;color:var(--ink)}${h2base}::after{display:none}`,
    plain: `${h2base}{display:block;border:0;padding:0;background:none;color:var(--ink)}${h2base}::after{display:none}`
  }[my.h2];
  const r = Math.min(my.r, 18) * 0.75; // px -> pt, yumshoqroq
  return `:root{--ink:${t.ink};--mut:${t.mut};--line:${t.line};--at:${t.at};--card:${t.card}}
body.my{color:var(--ink)}body.my h1{color:var(--ink);font-weight:${my.hw}${up ? ';text-transform:uppercase;letter-spacing:0' : ''}}body.my h2{font-weight:${my.hw}${up ? ';text-transform:uppercase;letter-spacing:.04em' : ''}}
body.my .o,body.my .m,body.my .d,body.my .ct,body.my .gal figcaption,body.my .tg i,body.my.t-ledger .hl{color:var(--mut)}body.my .sum,body.my .sm,body.my .b p,body.my .b li,body.my .t,body.my main p,body.my .tg span,body.my .tg b{color:var(--ink)}
body.my .hd{border-bottom-color:var(--a)}body.my .gal figure img{border-color:var(--line);border-radius:${r}pt}body.my .ph{border-radius:${fam === 'rail' ? '50%' : r + 'pt'}}
body.my .strip{border-bottom-color:var(--line)}body.my .strip .fig+.fig{border-left-color:var(--line)}body.my .strip span{color:var(--mut)}body.my .tg span{background:var(--card);border-radius:${Math.max(r, 2)}pt}
body.my.t-folio .hero{background:color-mix(in srgb,var(--a) 9%,${t.bg})}body.my.t-folio h2{color:var(--ink)}body.my.t-rail main .hl{color:var(--at)}
body.my ${H2}`;
}

/* Portfolio hujjatlari uchun CSS: fon qatlamlari, A4 (PDF) maketlari va skinlari, hamda veb-sayt uslublari.
 * Rang va shriftlar CSS o'zgaruvchilari orqali keladi: --a (asosiy), --a2 (ikkinchi), --hf (sarlavha shrifti), --bf (matn shrifti). */

const ink = dk => (dk ? '255,255,255' : '15,23,42');
const mix = (v, n) => `color-mix(in srgb,var(${v}) ${n}%,transparent)`;
const uri = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const NOISE = (dk, o = 1) => uri(`<svg xmlns='http://www.w3.org/2000/svg' width='170' height='170'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${dk ? 1 : 0} 0 0 0 0 ${dk ? 1 : 0} 0 0 0 0 ${dk ? 1 : 0} 0 0 0 ${0.5 * o} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
const STARS = (() => { let o = ''; for (let i = 0; i < 46; i++) o += `<circle cx='${(rnd() * 400) | 0}' cy='${(rnd() * 400) | 0}' r='${(0.5 + rnd() * 1.3).toFixed(2)}' fill-opacity='${(0.35 + rnd() * 0.6).toFixed(2)}'/>`; return o; })();
const starsUri = fill => uri(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><g fill='${fill}'>${STARS}</g></svg>`);
const wavesUri = (c, o, y) => uri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 160' preserveAspectRatio='none'><path d='M0 ${y}C150 ${y - 40} 300 ${y + 40} 450 ${y}S750 ${y - 40} 900 ${y}S1100 ${y + 30} 1200 ${y - 6}V160H0Z' fill='${c}' fill-opacity='${o}'/></svg>`);
const topoUri = (c, o) => { let e = ''; for (let i = 1; i <= 9; i++) e += `<ellipse cx='210' cy='210' rx='${i * 21 + 6}' ry='${i * 17 + 4}' transform='rotate(${i * 9} 210 210)'/>`; return uri(`<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1.1'>${e}</g></svg>`); };

/** Fon qatlamlari (CSS background shorthand qatlamlari, ustidan pastga) va qo'shimcha asos rangi. a — asosiy rang (#rrggbb). dk — qorong'i yuza. */
export function bgLayers(bg, a, dk) {
  const I = ink(dk);
  switch (bg) {
    case 'paper': return { l: [`${NOISE(dk, dk ? 0.5 : 0.9)} 0 0/170px 170px`, `radial-gradient(120% 80% at 50% 0%,${mix('--a', 5)},transparent 70%)`] };
    case 'grid': return { l: [`linear-gradient(rgba(${I},.07) 1px,transparent 1px) 0 0/30px 30px`, `linear-gradient(90deg,rgba(${I},.07) 1px,transparent 1px) 0 0/30px 30px`] };
    case 'dots': return { l: [`radial-gradient(rgba(${I},.2) 1.1px,transparent 1.4px) 0 0/20px 20px`] };
    case 'mesh': return { l: [`radial-gradient(55% 45% at 10% 6%,${mix('--a', 24)},transparent 72%)`, `radial-gradient(48% 42% at 92% 12%,${mix('--a2', 26)},transparent 72%)`, `radial-gradient(60% 50% at 68% 96%,${mix('--a', 18)},transparent 72%)`] };
    case 'aurora': return { l: [`radial-gradient(70% 38% at 20% 0%,${mix('--a', 46)},transparent 72%)`, `radial-gradient(55% 40% at 88% 10%,${mix('--a2', 44)},transparent 72%)`, `radial-gradient(60% 36% at 50% 100%,${mix('--a2', 30)},transparent 72%)`, `radial-gradient(42% 30% at 8% 70%,${mix('--a', 28)},transparent 72%)`] };
    case 'waves': return { l: [`${wavesUri(a, 0.16, 60)} 0 100%/100% 180px no-repeat`, `${wavesUri(a, 0.1, 90)} 0 100%/100% 150px no-repeat`] };
    case 'noise': return { l: [`${NOISE(dk, dk ? 0.9 : 1.1)} 0 0/170px 170px`, `radial-gradient(90% 60% at 80% 0%,${mix('--a2', 22)},transparent 70%)`, `radial-gradient(70% 55% at 0% 100%,${mix('--a', 22)},transparent 70%)`] };
    case 'stars': return { l: [`${starsUri(dk ? '#fff' : a)} 0 0/400px 400px`, `radial-gradient(60% 40% at 80% 0%,${mix('--a2', dk ? 22 : 10)},transparent 70%)`] };
    case 'topo': return { l: [`${topoUri(dk ? '#ffffff' : a, dk ? 0.16 : 0.28)} 0 0/420px 420px`] };
    case 'blueprint': return dk
      ? { l: ['linear-gradient(rgba(120,200,255,.2) 1px,transparent 1px) 0 0/120px 120px', 'linear-gradient(90deg,rgba(120,200,255,.2) 1px,transparent 1px) 0 0/120px 120px', 'linear-gradient(rgba(120,200,255,.09) 1px,transparent 1px) 0 0/24px 24px', 'linear-gradient(90deg,rgba(120,200,255,.09) 1px,transparent 1px) 0 0/24px 24px'], base: '#0a2540' }
      : { l: ['linear-gradient(rgba(30,100,180,.2) 1px,transparent 1px) 0 0/120px 120px', 'linear-gradient(90deg,rgba(30,100,180,.2) 1px,transparent 1px) 0 0/120px 120px', 'linear-gradient(rgba(30,100,180,.1) 1px,transparent 1px) 0 0/24px 24px', 'linear-gradient(90deg,rgba(30,100,180,.1) 1px,transparent 1px) 0 0/24px 24px'], base: '#eaf3fc' };
    default: return { l: [] };
  }
}

/* ---------------------------------------------------------------- A4 (PDF) ---------------------------------------------------------------- */
export const PRINT_BASE = `*{box-sizing:border-box;margin:0;padding:0}html{-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-text-size-adjust:100%}
body{background:transparent;color:#15181e;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;--sp:1}body.dense{--sp:.72}img{display:block;max-width:100%}a{color:inherit;text-decoration:none}ul{list-style:none}
.m span+span::before{content:"";display:inline-block;width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.55;margin:0 .55em;vertical-align:middle}
.ct{display:flex;flex-wrap:wrap;gap:1pt 13pt}.ct span{white-space:nowrap}
.e{break-inside:avoid}h2{break-after:avoid}figure{break-inside:avoid}
body.r-sharp .ph{border-radius:0!important}body.r-round .ph{border-radius:16pt!important}`;

const LEDGER = `@page{size:A4;margin:16mm 17mm}
body{font:10pt/1.5 var(--bf)}.sheet{width:210mm;padding:16mm 17mm}
.hd{display:flex;justify-content:space-between;align-items:flex-end;gap:14pt;padding-bottom:11pt;border-bottom:2.2pt solid var(--a)}
h1{font:700 27pt/1.05 var(--hf);letter-spacing:-.015em}.hl{font-size:11.5pt;margin-top:5pt;color:#3d4452}.ct{margin-top:7pt;font-size:9pt;color:#5b6472}
.ph{width:27mm;height:34mm;object-fit:cover;flex:none;border-radius:1.5pt}
section{margin-top:calc(13pt*var(--sp))}h2{display:flex;align-items:center;gap:9pt;font:700 10.5pt var(--hf);color:var(--a);margin-bottom:6pt}h2::after{content:"";flex:1;border-top:.75pt solid #d9dee6}
.e{display:grid;grid-template-columns:25mm 1fr;column-gap:11pt;margin-bottom:calc(7pt*var(--sp))}.d{text-align:right;font-size:9pt;color:#5b6472;font-variant-numeric:tabular-nums;padding-top:1pt}.t{font-weight:650;font-size:10.3pt}.o,.m{color:#5b6472;font-size:9.3pt}.b p,.b li{margin-top:1.5pt}
.b li{position:relative;padding-left:10pt}.b li::before{content:"–";position:absolute;left:0;color:var(--a)}
.sum{font-size:10.3pt;color:#262b34}.tg{display:flex;flex-wrap:wrap;gap:3pt 16pt}.tg b{font-weight:700}.tg i{font-style:normal;color:#5b6472}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:9pt}.gal figure img{width:100%;height:36mm;object-fit:cover;border-radius:1.5pt;border:.5pt solid #d9dee6}.gal figcaption{font-size:8.3pt;color:#5b6472;margin-top:2.5pt;line-height:1.3}`;

const RAIL = `@page{size:A4;margin:0}
body{font:9.6pt/1.5 var(--bf)}.sheet{width:210mm}.pg{display:grid;grid-template-columns:68mm 1fr}
.rail,main{-webkit-box-decoration-break:clone;box-decoration-break:clone}.rail{color:#fff;padding:14mm 8mm}.rail .ph{width:36mm;height:36mm;border-radius:50%;object-fit:cover;margin:0 0 9mm;border:1.2pt solid rgba(255,255,255,.55)}
.rail h3{font-size:9.5pt;font-weight:700;margin:8mm 0 2.5mm;padding-bottom:1.6mm;border-bottom:.6pt solid rgba(255,255,255,.35);color:#fff}.rail h3:first-of-type{margin-top:0}
.rail p,.rail li{font-size:8.9pt;color:rgba(255,255,255,.9);word-break:break-word;margin-bottom:1.6mm}.rail .fig{margin-bottom:3.2mm}.rail .fig b{display:block;font:700 19pt/1 var(--hf);letter-spacing:-.01em}.rail .fig span{font-size:8.5pt;color:rgba(255,255,255,.78)}
main{padding:14mm 14mm 14mm 11mm}h1{font:700 25pt/1.05 var(--hf);letter-spacing:-.02em;color:#101421}.hl{font-size:11pt;margin-top:4pt;color:var(--a);font-weight:500}
section{margin-top:calc(12pt*var(--sp))}h2{font:700 11pt/1.15 var(--hf);margin-bottom:5.5pt;padding-left:7pt;border-left:2.6pt solid var(--a)}
.e{margin-bottom:calc(7.5pt*var(--sp))}.t{font-weight:700;font-size:10pt}.d{font-size:8.6pt;color:#667085;float:right;margin-left:8pt;font-variant-numeric:tabular-nums}.o,.m{color:#667085;font-size:8.9pt}
.b p,.b li{margin-top:1.5pt;color:#262b34}.b li{position:relative;padding-left:9pt}.b li::before{content:"";position:absolute;left:0;top:.58em;width:3.5pt;height:3.5pt;border-radius:50%;background:var(--a)}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:8pt}.gal figure img{width:100%;height:30mm;object-fit:cover;border-radius:3pt}.gal figcaption{font-size:8pt;color:#667085;margin-top:2pt;line-height:1.3}`;

const FOLIO = `@page{size:A4;margin:12mm 0}@page:first{margin:0 0 12mm}
body{font:9.6pt/1.5 var(--bf)}.sheet{width:210mm;min-height:297mm}
.hero{display:flex;justify-content:space-between;gap:12mm;padding:16mm 16mm 11mm;background:color-mix(in srgb,var(--a) 9%,#fff)}
h1{font:600 34pt/1 var(--hf);letter-spacing:-.025em;color:#12151d}.hl{margin-top:7pt;font-size:12pt;font-weight:500;color:var(--a)}.ct{margin-top:9pt;font-size:8.9pt;color:#4a5262}.sm{margin-top:10pt;font-size:9.8pt;color:#262b34;max-width:112mm}
.ph{width:36mm;height:45mm;object-fit:cover;flex:none;box-shadow:3.2mm 3.2mm 0 var(--a)}
.strip{display:flex;border-top:1.4pt solid var(--a);border-bottom:.6pt solid #d9dee6;margin:0 16mm}.strip .fig{flex:1;padding:8pt 10pt 8pt 0}.strip .fig+.fig{padding-left:12pt;border-left:.6pt solid #d9dee6}.strip b{display:block;font:600 19pt/1 var(--hf);color:var(--a)}.strip span{font-size:8.3pt;color:#667085}
.cols{display:grid;grid-template-columns:1.45fr 1fr;gap:0 11mm;padding:6mm 16mm 0}section{margin-bottom:calc(11pt*var(--sp))}h2{font:600 12.5pt/1.2 var(--hf);margin-bottom:5.5pt;color:#12151d}
.e{margin-bottom:calc(8pt*var(--sp))}.t{font-weight:700;font-size:10pt}.d{font-size:8.5pt;color:#667085;margin-top:.5pt}.o,.m{color:#667085;font-size:8.8pt}.b p,.b li{margin-top:1.5pt;color:#262b34}.b li{position:relative;padding-left:9pt}.b li::before{content:"";position:absolute;left:0;top:.6em;width:4pt;height:1.4pt;background:var(--a)}
.tg{display:flex;flex-wrap:wrap;gap:4pt}.tg span{font-size:8.8pt;padding:2pt 7pt;border-radius:99pt;background:color-mix(in srgb,var(--a) 10%,#fff);color:#2b3140}
.wide{padding:2mm 16mm 12mm}.gal{display:grid;grid-template-columns:repeat(4,1fr);gap:8pt}.gal figure img{width:100%;height:28mm;object-fit:cover}.gal figcaption{font-size:8pt;color:#667085;margin-top:2pt;line-height:1.3}`;

/* skinlar: bir xil HTML maketi, boshqacha xarakter */
const SKIN = {
  atlas: `body.t-atlas{font:9.4pt/1.5 var(--bf)}.t-atlas .hd{position:relative;border-bottom:0;padding-bottom:14pt}.t-atlas .hd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:6pt;background:repeating-linear-gradient(90deg,var(--a) 0 1pt,transparent 1pt 6pt);opacity:.6}
.t-atlas h1{font:700 27pt/1.02 var(--bf);letter-spacing:-.035em}.t-atlas .hl{font:500 9.6pt var(--hf);color:var(--a);margin-top:6pt}.t-atlas .ct{font:400 8.4pt var(--hf)}
.t-atlas h2{font:600 9pt var(--hf);color:var(--a);letter-spacing:.03em}.t-atlas h2::before{content:"//";opacity:.7}.t-atlas h2::after{border-top:.6pt dashed color-mix(in srgb,var(--a) 45%,#cfd6e0)}
.t-atlas .d{font:500 8.2pt var(--hf)}.t-atlas .t{font-weight:700}.t-atlas .e{padding-left:0}.t-atlas .tg span{font:400 8.4pt var(--hf);border:.6pt solid color-mix(in srgb,var(--a) 50%,#d5dae4);padding:1pt 5pt;background:color-mix(in srgb,var(--a) 5%,#fff)}.t-atlas .tg{gap:4pt}
.t-atlas .gal figure img{border:.6pt solid var(--a);border-radius:0}`,
  timeline: `.t-timeline{--tl:color-mix(in srgb,var(--a) 38%,#e3e7ee)}.t-timeline h1{font:700 29pt/1.04 var(--hf)}.t-timeline .hd{border-bottom:0;padding-bottom:6pt}.t-timeline .ph{border-radius:50%;width:30mm;height:30mm;border:2pt solid var(--a);padding:1.2pt;background:#fff}
.t-timeline h2{display:inline-flex;width:max-content;font:700 9.5pt var(--bf);color:#fff;background:var(--a);padding:2.2pt 10pt;border-radius:99pt;margin-bottom:7pt}.t-timeline h2::after{display:none}
.t-timeline .e{display:block;margin:0;position:relative}.t-timeline .d{text-align:left;font-weight:600;color:var(--a);padding:0 0 1pt 12pt;font-size:8.6pt}
.t-timeline .b{position:relative;padding:0 0 9pt 12pt;border-left:1.3pt solid var(--tl)}.t-timeline .b::before{content:"";position:absolute;left:-5.3pt;top:-12pt;width:8pt;height:8pt;border-radius:50%;background:#fff;border:2pt solid var(--a)}.t-timeline .e:last-child .b{border-image:linear-gradient(var(--tl),transparent) 1}
.t-timeline .b li::before{color:var(--a)}.t-timeline .sum{font-size:10pt}.t-timeline .tg span{background:color-mix(in srgb,var(--a) 9%,#fff);border-radius:99pt;padding:1.6pt 8pt}.t-timeline .tg{gap:4pt}`,
  poster: `.t-poster .hero{position:relative;overflow:hidden;background:var(--a);color:#fff;padding:14mm 16mm 18mm}.t-poster .hero::before{content:"";position:absolute;right:-22mm;top:-26mm;width:92mm;height:92mm;border-radius:50%;background:var(--a2);opacity:.6}.t-poster .hero>*{position:relative}
.t-poster h1{font:700 41pt/.93 var(--hf);letter-spacing:-.04em;color:#fff}.t-poster .hl{color:#fff;font:600 12.5pt var(--hf);margin-top:8pt}.t-poster .ct,.t-poster .sm{color:rgba(255,255,255,.92)}
.t-poster .ph{width:40mm;height:40mm;border-radius:50%;box-shadow:none;border:2.4pt solid #fff}
.t-poster .strip{position:relative;margin:-8mm 16mm 4mm;background:#fff;border:1.8pt solid #14161d;border-radius:3pt;box-shadow:2pt 2pt 0 #14161d}.t-poster .strip .fig{padding:8pt 10pt}.t-poster .strip .fig+.fig{border-left:1.4pt solid #14161d}.t-poster .strip b{font:700 22pt/1 var(--hf);color:#14161d}
.t-poster h2{display:inline-block;font:700 10.5pt var(--hf);background:#14161d;color:#fff;padding:1.5pt 8pt;margin-bottom:7pt}.t-poster .tg span{background:#fff;border:1.2pt solid #14161d;border-radius:2pt}.t-poster .b li::before{background:var(--a);height:2pt}`,
  nova: `.t-nova .hero{position:relative;color:#fff;padding:15mm 16mm 18mm;background:radial-gradient(60% 90% at 92% 0%,color-mix(in srgb,var(--a2) 72%,transparent),transparent 70%),radial-gradient(70% 100% at 0% 100%,color-mix(in srgb,var(--a) 82%,transparent),transparent 70%),#080c1a}
.t-nova h1{color:#fff;font:700 36pt/.98 var(--hf);letter-spacing:-.035em}.t-nova .hl{color:color-mix(in srgb,var(--a2) 55%,#fff);font-weight:600}.t-nova .ct,.t-nova .sm{color:rgba(255,255,255,.88)}
.t-nova .ph{border-radius:50%;width:40mm;height:40mm;box-shadow:0 0 0 2.6pt rgba(255,255,255,.4),0 0 0 7pt rgba(255,255,255,.12)}
.t-nova .strip{display:flex;gap:7pt;border:0;margin:-8mm 16mm 2mm;position:relative}.t-nova .strip .fig{background:#fff;border-radius:9pt;padding:8pt 11pt!important;border:0!important;box-shadow:0 3pt 14pt rgba(10,15,40,.2)}.t-nova .strip b{background:linear-gradient(90deg,var(--a),var(--a2));-webkit-background-clip:text;background-clip:text;color:transparent}
.t-nova h2{font:700 12.5pt var(--hf);background:linear-gradient(90deg,var(--a),var(--a2));-webkit-background-clip:text;background-clip:text;color:transparent;display:inline-block}.t-nova .tg span{background:linear-gradient(90deg,color-mix(in srgb,var(--a) 12%,#fff),color-mix(in srgb,var(--a2) 14%,#fff))}.t-nova .b li::before{background:linear-gradient(90deg,var(--a),var(--a2))}`,
  noir: `.t-noir{color:#e6eaf4}.t-noir main h1{color:#fff;font:700 26pt/1.04 var(--hf)}.t-noir main .hl{color:color-mix(in srgb,var(--a2) 70%,#fff)}
.t-noir h2{border-left:0;padding-left:0;font:700 11pt var(--hf);color:#fff;display:flex;align-items:center;gap:7pt}.t-noir h2::before{content:"";width:14pt;height:2.4pt;border-radius:2pt;background:linear-gradient(90deg,var(--a),var(--a2))}
.t-noir .t{color:#fff}.t-noir .d{color:#8f9ab2}.t-noir .o,.t-noir .m{color:#98a3ba}.t-noir .b p,.t-noir .b li,.t-noir main p{color:#cdd4e3}.t-noir .b li::before{background:var(--a2)}
.t-noir .rail{color:#fff}.t-noir .rail .ph{border:1.6pt solid var(--a2)}.t-noir .rail h3{border-bottom:.6pt solid rgba(255,255,255,.16)}.t-noir .rail .fig b{background:linear-gradient(90deg,#fff,color-mix(in srgb,var(--a2) 60%,#fff));-webkit-background-clip:text;background-clip:text;color:transparent}
.t-noir .gal figure img{border:.6pt solid rgba(255,255,255,.2)}.t-noir .gal figcaption{color:#98a3ba}`
};
const FAM = { ledger: LEDGER, rail: RAIL, folio: FOLIO };

/** Sahifa foni (html): shablonning o'z foni + tanlangan fon naqshi. */
export function pageBg(tpl, fam, bg, a) {
  const dk = tpl === 'noir', L = bgLayers(bg, a, dk), top = [];
  if (fam === 'rail') top.push(dk ? 'linear-gradient(90deg,#0d1322 0 68mm,transparent 68mm 100%)' : 'linear-gradient(90deg,color-mix(in srgb,var(--a) 80%,#0a0d14) 0 68mm,transparent 68mm 100%)');
  if (tpl === 'noir') top.push('radial-gradient(70mm 70mm at 0 0,color-mix(in srgb,var(--a) 50%,transparent),transparent)', 'radial-gradient(90mm 80mm at 100% 100%,color-mix(in srgb,var(--a2) 28%,transparent),transparent)');
  return `html{background:${[...top, ...L.l, L.base || (dk ? '#080b13' : '#fff')].join(',')}}`;
}

export const printCSS = (tpl, fam) => PRINT_BASE + FAM[fam] + (SKIN[tpl] || '');

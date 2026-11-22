/* Portfolio hujjatlari (HTML): 3 ta A4 shablon (PDF uchun chop etiladi) va 1 ta adaptiv veb-sahifa. Mustaqil fayl sifatida ham yuklab olinadi.
 * Barcha foydalanuvchi matni esc() dan o'tadi; havolalar faqat http(s), rasmlar faqat data:image/jpeg. */
import { normalize, actText, range, splitBullets } from './pfmodel.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const DL = {
  en: { summary: 'Profile', edu: 'Education', tests: 'Test scores', acts: 'Activities', awards: 'Awards and honors', projects: 'Projects', skills: 'Skills', langs: 'Languages', targets: 'Target universities', gallery: 'Documents', present: 'present', native: 'native', hours: 'h/week', gpa: 'GPA', contact: 'Contact', levels: { school: 'School', regional: 'Regional', national: 'National', international: 'International' }, web: 'Built with UniDoue' },
  uz: { summary: 'Profil', edu: 'Ta’lim', tests: 'Test natijalari', acts: 'Faoliyat', awards: 'Yutuqlar', projects: 'Loyihalar', skills: 'Ko‘nikmalar', langs: 'Tillar', targets: 'Maqsadli universitetlar', gallery: 'Hujjatlar', present: 'hozir', native: 'ona tili', hours: 'soat/hafta', gpa: 'GPA', contact: 'Aloqa', levels: { school: 'Maktab', regional: 'Viloyat', national: 'Respublika', international: 'Xalqaro' }, web: 'UniDoue bilan tuzilgan' },
  ru: { summary: 'О себе', edu: 'Образование', tests: 'Результаты тестов', acts: 'Активности', awards: 'Достижения', projects: 'Проекты', skills: 'Навыки', langs: 'Языки', targets: 'Целевые университеты', gallery: 'Документы', present: 'сейчас', native: 'родной', hours: 'ч/нед.', gpa: 'GPA', contact: 'Контакты', levels: { school: 'Школа', regional: 'Регион', national: 'Страна', international: 'Международный' }, web: 'Создано в UniDoue' }
};
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
const FONTS = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap';

/* ---------------- CSS ---------------- */
const BASE = `*{box-sizing:border-box;margin:0;padding:0}html{-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-text-size-adjust:100%}
body{background:#fff;color:#15181e;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}img{display:block;max-width:100%}a{color:inherit;text-decoration:none}ul{list-style:none}
.m span+span::before{content:"";display:inline-block;width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.55;margin:0 .55em;vertical-align:middle}
.ct{display:flex;flex-wrap:wrap;gap:1pt 13pt}.ct span{white-space:nowrap}
.e{break-inside:avoid}h2{break-after:avoid}figure{break-inside:avoid}`;

const LEDGER = `@page{size:A4;margin:16mm 17mm}
body{font:10pt/1.5 "Source Serif 4",Georgia,"Times New Roman",serif}.sheet{width:210mm;padding:16mm 17mm}
.hd{display:flex;justify-content:space-between;align-items:flex-end;gap:14pt;padding-bottom:11pt;border-bottom:2.2pt solid var(--a)}
h1{font-size:27pt;line-height:1.05;font-weight:700;letter-spacing:-.015em}.hl{font-size:11.5pt;margin-top:5pt;color:#3d4452}.ct{margin-top:7pt;font-size:9pt;color:#5b6472}
.ph{width:27mm;height:34mm;object-fit:cover;flex:none;border-radius:1.5pt}
section{margin-top:13pt}h2{display:flex;align-items:center;gap:9pt;font-size:10.5pt;font-weight:700;color:var(--a);margin-bottom:6pt}h2::after{content:"";flex:1;border-top:.75pt solid #d9dee6}
.e{display:grid;grid-template-columns:25mm 1fr;column-gap:11pt;margin-bottom:7pt}.d{text-align:right;font-size:9pt;color:#5b6472;font-variant-numeric:tabular-nums;padding-top:1pt}.t{font-weight:650;font-size:10.3pt}.o,.m{color:#5b6472;font-size:9.3pt}.b p,.b li{margin-top:1.5pt}
.b li{position:relative;padding-left:10pt}.b li::before{content:"–";position:absolute;left:0;color:var(--a)}
.sum{font-size:10.3pt;color:#262b34}.tg{display:flex;flex-wrap:wrap;gap:3pt 16pt}.tg b{font-weight:700}.tg i{font-style:normal;color:#5b6472}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:9pt}.gal figure img{width:100%;height:36mm;object-fit:cover;border-radius:1.5pt;border:.5pt solid #d9dee6}.gal figcaption{font-size:8.3pt;color:#5b6472;margin-top:2.5pt;line-height:1.3}`;

const RAIL = `@page{size:A4;margin:0}html{background:linear-gradient(90deg,color-mix(in srgb,var(--a) 80%,#0a0d14) 0 68mm,#fff 68mm 100%)}
body{font:9.6pt/1.5 "DM Sans",system-ui,"Segoe UI",Arial,sans-serif;background:transparent}.sheet{width:210mm}.pg{display:grid;grid-template-columns:68mm 1fr}
.rail,main{-webkit-box-decoration-break:clone;box-decoration-break:clone}.rail{color:#fff;padding:14mm 8mm}.rail .ph{width:36mm;height:36mm;border-radius:50%;object-fit:cover;margin:0 0 9mm;border:1.2pt solid rgba(255,255,255,.55)}
.rail h3{font-size:9.5pt;font-weight:700;margin:8mm 0 2.5mm;padding-bottom:1.6mm;border-bottom:.6pt solid rgba(255,255,255,.35);color:#fff}.rail h3:first-of-type{margin-top:0}
.rail p,.rail li{font-size:8.9pt;color:rgba(255,255,255,.9);word-break:break-word;margin-bottom:1.6mm}.rail .fig{margin-bottom:3.2mm}.rail .fig b{display:block;font-size:19pt;line-height:1;font-weight:700;letter-spacing:-.01em}.rail .fig span{font-size:8.5pt;color:rgba(255,255,255,.78)}
main{padding:14mm 14mm 14mm 11mm}h1{font-size:25pt;line-height:1.05;font-weight:700;letter-spacing:-.02em;color:#101421}.hl{font-size:11pt;margin-top:4pt;color:var(--a);font-weight:500}
section{margin-top:12pt}h2{font-size:11pt;font-weight:700;margin-bottom:5.5pt;padding-left:7pt;border-left:2.6pt solid var(--a);line-height:1.15}
.e{margin-bottom:7.5pt}.t{font-weight:700;font-size:10pt}.d{font-size:8.6pt;color:#667085;float:right;margin-left:8pt;font-variant-numeric:tabular-nums}.o,.m{color:#667085;font-size:8.9pt}
.b p,.b li{margin-top:1.5pt;color:#262b34}.b li{position:relative;padding-left:9pt}.b li::before{content:"";position:absolute;left:0;top:.58em;width:3.5pt;height:3.5pt;border-radius:50%;background:var(--a)}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:8pt}.gal figure img{width:100%;height:30mm;object-fit:cover;border-radius:3pt}.gal figcaption{font-size:8pt;color:#667085;margin-top:2pt;line-height:1.3}`;

const FOLIO = `@page{size:A4;margin:12mm 0}@page:first{margin:0 0 12mm}
body{font:9.6pt/1.5 "DM Sans",system-ui,"Segoe UI",Arial,sans-serif}.sheet{width:210mm;min-height:297mm}
.hero{display:flex;justify-content:space-between;gap:12mm;padding:16mm 16mm 11mm;background:color-mix(in srgb,var(--a) 9%,#fff)}
h1{font:600 34pt/1 Fraunces,"Source Serif 4",Georgia,serif;letter-spacing:-.025em;color:#12151d}.hl{margin-top:7pt;font-size:12pt;font-weight:500;color:var(--a)}.ct{margin-top:9pt;font-size:8.9pt;color:#4a5262}.sm{margin-top:10pt;font-size:9.8pt;color:#262b34;max-width:112mm}
.ph{width:36mm;height:45mm;object-fit:cover;flex:none;box-shadow:3.2mm 3.2mm 0 var(--a)}
.strip{display:flex;border-top:1.4pt solid var(--a);border-bottom:.6pt solid #d9dee6;margin:0 16mm}.strip .fig{flex:1;padding:8pt 10pt 8pt 0}.strip .fig+.fig{padding-left:12pt;border-left:.6pt solid #d9dee6}.strip b{display:block;font:600 19pt/1 Fraunces,Georgia,serif;color:var(--a)}.strip span{font-size:8.3pt;color:#667085}
.cols{display:grid;grid-template-columns:1.45fr 1fr;gap:0 11mm;padding:6mm 16mm 0}section{margin-bottom:11pt}h2{font:600 12.5pt/1.2 Fraunces,Georgia,serif;margin-bottom:5.5pt;color:#12151d}
.e{margin-bottom:8pt}.t{font-weight:700;font-size:10pt}.d{font-size:8.5pt;color:#667085;margin-top:.5pt}.o,.m{color:#667085;font-size:8.8pt}.b p,.b li{margin-top:1.5pt;color:#262b34}.b li{position:relative;padding-left:9pt}.b li::before{content:"";position:absolute;left:0;top:.6em;width:4pt;height:1.4pt;background:var(--a)}
.tg{display:flex;flex-wrap:wrap;gap:4pt}.tg span{font-size:8.8pt;padding:2pt 7pt;border-radius:99pt;background:color-mix(in srgb,var(--a) 10%,#fff);color:#2b3140}
.wide{padding:2mm 16mm 12mm}.gal{display:grid;grid-template-columns:repeat(4,1fr);gap:8pt}.gal figure img{width:100%;height:28mm;object-fit:cover}.gal figcaption{font-size:8pt;color:#667085;margin-top:2pt;line-height:1.3}`;

const WEB = `:root{--ink:#15181e;--mut:#5b6472;--line:#e3e7ee;--bg:#f6f7fa;--card:#fff}@media(prefers-color-scheme:dark){:root{--ink:#eef0f5;--mut:#a3acbd;--line:#2a3140;--bg:#0f131b;--card:#171c27}}
body{font:16px/1.65 "DM Sans",system-ui,"Segoe UI",Arial,sans-serif;background:var(--bg);color:var(--ink)}.w{max-width:980px;margin:0 auto;padding:0 20px 64px}
.hero{display:grid;grid-template-columns:1fr auto;gap:36px;align-items:center;padding:64px 0 36px}h1{font:600 clamp(36px,7vw,64px)/1 Fraunces,Georgia,serif;letter-spacing:-.03em}.hl{margin-top:14px;font-size:clamp(17px,2.4vw,21px);color:var(--a);font-weight:500}.ct{margin-top:16px;display:flex;flex-wrap:wrap;gap:6px 18px;color:var(--mut);font-size:14.5px}.ct a{border-bottom:1px solid var(--line)}.ct a:hover{color:var(--a);border-color:var(--a)}
.sm{margin-top:18px;max-width:60ch;font-size:17px}.ph{width:min(240px,34vw);aspect-ratio:4/5;object-fit:cover;border-radius:22px;box-shadow:12px 12px 0 var(--a)}
.strip{display:flex;flex-wrap:wrap;gap:0;border-block:1px solid var(--line);margin-bottom:34px}.strip .fig{flex:1 1 150px;padding:18px 20px 18px 0}.strip .fig+.fig{padding-left:20px;border-left:1px solid var(--line)}.strip b{display:block;font:600 34px/1 Fraunces,Georgia,serif;color:var(--a)}.strip span{color:var(--mut);font-size:13.5px}
section{margin-top:44px}h2{font:600 26px/1.2 Fraunces,Georgia,serif;margin-bottom:16px;letter-spacing:-.01em}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:14px}
.e{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px 22px}.t{font-weight:700;font-size:17px}.d{color:var(--a);font-size:13.5px;font-weight:600;margin-top:2px}.o,.m{color:var(--mut);font-size:14.5px}.b p,.b li{margin-top:6px}.b li{position:relative;padding-left:16px}.b li::before{content:"";position:absolute;left:0;top:.72em;width:7px;height:2px;background:var(--a)}
.tg{display:flex;flex-wrap:wrap;gap:8px}.tg span{padding:5px 14px;border-radius:99px;background:var(--card);border:1px solid var(--line);font-size:14.5px}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}.gal figure{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}.gal figure img{width:100%;height:170px;object-fit:cover}.gal figcaption{padding:10px 14px;font-size:13.5px;color:var(--mut)}
.lb{position:fixed;inset:0;display:none;background:rgba(8,10,16,.86);place-items:center;padding:20px;z-index:9}.lb:target{display:grid}.lb img{max-width:100%;max-height:88vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)}.lb a{position:absolute;inset:0;cursor:zoom-out}
footer{margin-top:60px;color:var(--mut);font-size:13px}footer a{color:inherit;border-bottom:1px solid var(--line)}
@media(max-width:640px){.hero{grid-template-columns:1fr;padding-top:36px}.ph{order:-1;width:150px;box-shadow:8px 8px 0 var(--a)}.strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr))}.strip .fig{padding:14px 10px 14px 0;flex:none}.strip .fig+.fig{padding-left:14px}.strip b{font-size:26px}}
@media print{body{background:#fff;color:#15181e}.e,.tg span{border-color:#d9dee6;background:#fff}}`;

/* ---------------- bo'laklar ---------------- */
const imgOf = (imgs, id) => (imgs && imgs[id] && imgs[id].url) || '';
const bullets = a => { const t = actText(a); if (!t) return ''; const p = splitBullets(t); return p.length > 1 ? `<ul>${p.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(t)}</p>`; };
const meta = (...xs) => { const a = xs.filter(Boolean); return a.length ? `<div class="m">${a.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''; };
const contact = (p, d, label) => {
  const out = [];
  if (p.city) out.push(`<span>${esc(p.city)}</span>`);
  if (p.email) out.push(`<span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></span>`);
  if (p.phone) out.push(`<span>${esc(p.phone)}</span>`);
  p.links.forEach(l => out.push(`<span><a href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">${esc(l.l || host(l.u))}</a></span>`));
  return out.length ? `<p class="ct" aria-label="${esc(label)}">${out.join('')}</p>` : '';
};
function actBlock(a, d) {
  const when = range(a, d.present), hrs = a.hours ? `${a.hours} ${d.hours}` : '';
  const title = a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a>` : esc(a.title);
  return `<div class="e"><div class="d">${esc([when, hrs].filter(Boolean).join(' · '))}</div><div class="b">${a.title ? `<div class="t">${title}</div>` : ''}${meta(a.org, a.role)}${bullets(a)}</div></div>`;
}
const eduBlock = (e, d) => `<div class="e"><div class="d">${esc(range(e, d.present))}</div><div class="b"><div class="t">${esc(e.school || e.program)}</div>${meta(e.school ? e.program : '', e.gpa ? `${d.gpa} ${e.gpa}` : '')}${e.note ? `<p>${esc(e.note)}</p>` : ''}</div></div>`;
const awardBlock = (a, d) => `<div class="e"><div class="d">${esc(a.year)}</div><div class="b"><div class="t">${esc(a.title)}</div>${meta(a.issuer, a.level ? d.levels[a.level] : '')}${a.note ? `<p>${esc(a.note)}</p>` : ''}</div></div>`;
const sec = (title, inner, cls = '') => (inner ? `<section${cls ? ` class="${cls}"` : ''}><h2>${esc(title)}</h2>${inner}</section>` : '');
const gallery = (p, imgs, d, web) => {
  const f = p.att.filter(a => imgOf(imgs, a.id));
  return f.length ? `<div class="gal">${f.map((a, i) => `<figure>${web ? `<a href="#lb${i}">` : ''}<img src="${imgOf(imgs, a.id)}" alt="${esc(a.cap || d.gallery)}">${web ? '</a>' : ''}${a.cap ? `<figcaption>${esc(a.cap)}</figcaption>` : ''}</figure>`).join('')}</div>${web ? f.map((a, i) => `<div class="lb" id="lb${i}"><a href="#top" aria-label="Close"></a><img src="${imgOf(imgs, a.id)}" alt="${esc(a.cap || '')}"></div>`).join('') : ''}` : '';
};
const photo = p => (p.photo ? `<img class="ph" src="${p.photo}" alt="${esc(p.name)}">` : '');
const tagList = a => (a.length ? `<div class="tg">${a.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : '');
const figs = p => p.tests.filter(t => t.score).slice(0, 4).map(t => `<div class="fig"><b>${esc(t.score)}</b><span>${esc(t.name)}</span></div>`).join('');
const gpaFig = (p, d) => { const e = p.edu.find(x => x.gpa); return e ? `<div class="fig"><b>${esc(e.gpa)}</b><span>${esc(d.gpa)}</span></div>` : ''; };
export const langText = (l, d) => (l.lv ? `${l.n} (${/^native$/i.test(l.lv) ? d.native : l.lv})` : l.n);
const langLine = (p, d) => p.langs.map(l => langText(l, d));

function bodyLedger(p, imgs, d) {
  return `<div class="sheet"><header class="hd"><div><h1>${esc(p.name)}</h1>${p.headline ? `<p class="hl">${esc(p.headline)}</p>` : ''}${contact(p, d, d.contact)}</div>${photo(p)}</header>
${sec(d.summary, p.summary ? `<p class="sum">${esc(p.summary)}</p>` : '')}${sec(d.edu, p.edu.map(e => eduBlock(e, d)).join(''))}
${sec(d.tests, p.tests.length ? `<div class="tg">${p.tests.map(t => `<span><b>${esc(t.name)}</b> <i>${esc(t.score)}${t.date ? ' (' + esc(t.date) + ')' : ''}</i></span>`).join('')}</div>` : '')}
${sec(d.acts, p.acts.map(a => actBlock(a, d)).join(''))}${sec(d.awards, p.awards.map(a => awardBlock(a, d)).join(''))}${sec(d.projects, p.projects.map(a => actBlock(a, d)).join(''))}
${sec(d.skills, p.skills.length ? `<p class="sum">${esc(p.skills.join(', '))}</p>` : '')}${sec(d.langs, p.langs.length ? `<p class="sum">${esc(langLine(p, d).join(', '))}</p>` : '')}${sec(d.targets, p.targets.length ? `<p class="sum">${esc(p.targets.join(', '))}</p>` : '')}${sec(d.gallery, gallery(p, imgs, d))}</div>`;
}
function bodyRail(p, imgs, d) {
  const rail = `${photo(p)}${(p.city || p.email || p.phone || p.links.length) ? `<h3>${esc(d.contact)}</h3>${p.city ? `<p>${esc(p.city)}</p>` : ''}${p.email ? `<p><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>` : ''}${p.phone ? `<p>${esc(p.phone)}</p>` : ''}${p.links.map(l => `<p><a href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">${esc(l.l || host(l.u))}</a></p>`).join('')}` : ''}
${(figs(p) || gpaFig(p, d)) ? `<h3>${esc(d.tests)}</h3>${gpaFig(p, d)}${figs(p)}` : ''}${p.skills.length ? `<h3>${esc(d.skills)}</h3><ul>${p.skills.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${p.langs.length ? `<h3>${esc(d.langs)}</h3><ul>${langLine(p, d).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${p.targets.length ? `<h3>${esc(d.targets)}</h3><ul>${p.targets.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
  return `<div class="sheet"><div class="pg"><aside class="rail">${rail}</aside><main><h1>${esc(p.name)}</h1>${p.headline ? `<p class="hl">${esc(p.headline)}</p>` : ''}
${sec(d.summary, p.summary ? `<p>${esc(p.summary)}</p>` : '')}${sec(d.edu, p.edu.map(e => eduBlock(e, d)).join(''))}${sec(d.acts, p.acts.map(a => actBlock(a, d)).join(''))}${sec(d.awards, p.awards.map(a => awardBlock(a, d)).join(''))}${sec(d.projects, p.projects.map(a => actBlock(a, d)).join(''))}${sec(d.gallery, gallery(p, imgs, d))}</main></div></div>`;
}
function bodyFolio(p, imgs, d) {
  const strip = gpaFig(p, d) + figs(p);
  return `<div class="sheet"><header class="hero"><div><h1>${esc(p.name)}</h1>${p.headline ? `<p class="hl">${esc(p.headline)}</p>` : ''}${contact(p, d, d.contact)}${p.summary ? `<p class="sm">${esc(p.summary)}</p>` : ''}</div>${photo(p)}</header>
${strip ? `<div class="strip">${strip}</div>` : ''}<div class="cols"><div>${sec(d.acts, p.acts.map(a => actBlock(a, d)).join(''))}${sec(d.projects, p.projects.map(a => actBlock(a, d)).join(''))}</div>
<div>${sec(d.edu, p.edu.map(e => eduBlock(e, d)).join(''))}${sec(d.awards, p.awards.map(a => awardBlock(a, d)).join(''))}${sec(d.skills, tagList(p.skills))}${sec(d.langs, tagList(langLine(p, d)))}${sec(d.targets, tagList(p.targets))}</div></div>
${p.att.length ? `<div class="wide">${sec(d.gallery, gallery(p, imgs, d))}</div>` : ''}</div>`;
}
function bodyWeb(p, imgs, d) {
  const strip = gpaFig(p, d) + figs(p);
  return `<div class="w" id="top"><header class="hero"><div><h1>${esc(p.name)}</h1>${p.headline ? `<p class="hl">${esc(p.headline)}</p>` : ''}${p.summary ? `<p class="sm">${esc(p.summary)}</p>` : ''}${contact(p, d, d.contact)}</div>${photo(p)}</header>
${strip ? `<div class="strip">${strip}</div>` : ''}${sec(d.acts, p.acts.length ? `<div class="cards">${p.acts.map(a => actBlock(a, d)).join('')}</div>` : '')}${sec(d.awards, p.awards.length ? `<div class="cards">${p.awards.map(a => awardBlock(a, d)).join('')}</div>` : '')}
${sec(d.projects, p.projects.length ? `<div class="cards">${p.projects.map(a => actBlock(a, d)).join('')}</div>` : '')}${sec(d.edu, p.edu.length ? `<div class="cards">${p.edu.map(e => eduBlock(e, d)).join('')}</div>` : '')}
${sec(d.skills, tagList(p.skills))}${sec(d.langs, tagList(langLine(p, d)))}${sec(d.targets, tagList(p.targets))}${sec(d.gallery, gallery(p, imgs, d, true))}<footer><a href="https://unidoue.uz" target="_blank" rel="noopener noreferrer">${esc(d.web)}</a></footer></div>`;
}

/** To'liq HTML hujjat. mode: 'print' (A4 shablon) yoki 'web'. imgs: { [attId]: { url } } */
export function docHTML(pf, imgs = {}, opts = {}) {
  const p = normalize(pf), d = DL[p.lang] || DL.en, web = opts.mode === 'web', tpl = web ? 'web' : p.tpl;
  const css = BASE + ({ ledger: LEDGER, rail: RAIL, folio: FOLIO, web: WEB }[tpl] || LEDGER);
  const body = { ledger: bodyLedger, rail: bodyRail, folio: bodyFolio, web: bodyWeb }[tpl](p, imgs, d);
  const printFix = web ? '' : `@media print{.sheet{width:auto;${tpl === 'folio' ? 'min-height:0' : 'padding:0'}}}`;
  const G = { ledger: ['265mm', '16mm'], rail: ['297mm', '0mm'], folio: ['273mm', '12mm'] }[tpl] || ['297mm', '0mm'];
  const screen = web || !opts.guides ? '' : `body{position:relative}body::after{content:"";position:absolute;inset:${G[1]} 0 0 0;pointer-events:none;background:linear-gradient(to bottom,transparent calc(100% - 1px),rgba(110,120,150,.55) 0) 0 0/100% ${G[0]} repeat-y}`;
  return `<!DOCTYPE html><html lang="${esc(p.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(p.name || 'Portfolio')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="${FONTS}"><style>:root{--a:${esc(p.accent)}}${css}${printFix}${screen}</style></head><body>${body}</body></html>`;
}

export const fileBase = pf => { const p = normalize(pf); return ((p.name || 'portfolio').toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'portfolio') + '-portfolio'; };

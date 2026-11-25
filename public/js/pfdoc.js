/* Portfolio hujjatlari (HTML): 3 ta A4 shablon (PDF uchun chop etiladi) va 1 ta adaptiv veb-sahifa. Mustaqil fayl sifatida ham yuklab olinadi.
 * Barcha foydalanuvchi matni esc() dan o'tadi; havolalar faqat http(s), rasmlar faqat data:image/jpeg. */
import { normalize, actText, range, splitBullets } from './pfmodel.js';
import { effective, fontPair, FF, GF, TPL } from './pfdesign.js';
import { printCSS, pageBg } from './pfcss.js';
import { webCSS } from './pfwebcss.js';
import { myTokens, myPrintCSS } from './pfmy.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const DL = {
  en: { summary: 'Profile', edu: 'Education', tests: 'Test scores', acts: 'Activities', awards: 'Awards and honors', projects: 'Projects', skills: 'Skills', langs: 'Languages', targets: 'Target universities', gallery: 'Documents', present: 'present', native: 'native', hours: 'h/week', gpa: 'GPA', contact: 'Contact', levels: { school: 'School', regional: 'Regional', national: 'National', international: 'International' }, web: 'Built with UniDoue', mail: 'Contact me', cta: 'Let’s work together', theme: 'Switch theme', menu: 'Sections', close: 'Close', prev: 'Previous', next: 'Next' },
  uz: { summary: 'Profil', edu: 'Ta’lim', tests: 'Test natijalari', acts: 'Faoliyat', awards: 'Yutuqlar', projects: 'Loyihalar', skills: 'Ko‘nikmalar', langs: 'Tillar', targets: 'Maqsadli universitetlar', gallery: 'Hujjatlar', present: 'hozir', native: 'ona tili', hours: 'soat/hafta', gpa: 'GPA', contact: 'Aloqa', levels: { school: 'Maktab', regional: 'Viloyat', national: 'Respublika', international: 'Xalqaro' }, web: 'UniDoue bilan tuzilgan', mail: 'Bog‘lanish', cta: 'Hamkorlik qilamiz', theme: 'Mavzuni almashtirish', menu: 'Bo‘limlar', close: 'Yopish', prev: 'Oldingi', next: 'Keyingi' },
  ru: { summary: 'О себе', edu: 'Образование', tests: 'Результаты тестов', acts: 'Активности', awards: 'Достижения', projects: 'Проекты', skills: 'Навыки', langs: 'Языки', targets: 'Целевые университеты', gallery: 'Документы', present: 'сейчас', native: 'родной', hours: 'ч/нед.', gpa: 'GPA', contact: 'Контакты', levels: { school: 'Школа', regional: 'Регион', national: 'Страна', international: 'Международный' }, web: 'Создано в UniDoue', mail: 'Связаться', cta: 'Давайте работать вместе', theme: 'Сменить тему', menu: 'Разделы', close: 'Закрыть', prev: 'Назад', next: 'Далее' }
};
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
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
function actBlock(a, d, at = '') {
  const when = range(a, d.present), hrs = a.hours ? `${a.hours} ${d.hours}` : '';
  const title = a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a>` : esc(a.title);
  return `<div class="e"${at}><div class="d">${esc([when, hrs].filter(Boolean).join(' · '))}</div><div class="b">${a.title ? `<div class="t">${title}</div>` : ''}${meta(a.org, a.role)}${bullets(a)}</div></div>`;
}
const eduBlock = (e, d, at = '') => `<div class="e"${at}><div class="d">${esc(range(e, d.present))}</div><div class="b"><div class="t">${esc(e.school || e.program)}</div>${meta(e.school ? e.program : '', e.gpa ? `${d.gpa} ${e.gpa}` : '')}${e.note ? `<p>${esc(e.note)}</p>` : ''}</div></div>`;
const awardBlock = (a, d, at = '') => `<div class="e"${at}><div class="d">${esc(a.year)}</div><div class="b"><div class="t">${esc(a.title)}</div>${meta(a.issuer, a.level ? d.levels[a.level] : '')}${a.note ? `<p>${esc(a.note)}</p>` : ''}</div></div>`;
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

/* ---------------- veb-sayt (animatsiyali, mustaqil) ---------------- */
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg>';
const SUN = '<svg class="su" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg class="mo" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>';
const initials = n => (String(n).trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('') || '·').toUpperCase();
const rv = i => ` data-r style="--i:${i % 5}"`;
const SECS = [['acts', 'acts'], ['projects', 'projects'], ['awards', 'awards'], ['edu', 'edu'], ['skills', 'skills'], ['targets', 'targets'], ['gallery', 'gallery']];

function webGallery(p, imgs, d) {
  const f = p.att.filter(a => imgOf(imgs, a.id));
  if (!f.length) return '';
  const n = f.length;
  return `<div class="gal">${f.map((a, i) => `<figure${rv(i)}><a href="#lb${i}" aria-label="${esc(a.cap || d.gallery)}"><img src="${imgOf(imgs, a.id)}" alt="${esc(a.cap || d.gallery)}" loading="lazy"></a>${a.cap ? `<figcaption>${esc(a.cap)}</figcaption>` : ''}</figure>`).join('')}</div>`
    + f.map((a, i) => `<div class="lb" id="lb${i}" role="dialog" aria-label="${esc(a.cap || d.gallery)}"><a class="x" href="#gallery" aria-label="${esc(d.close)}"></a><img src="${imgOf(imgs, a.id)}" alt="${esc(a.cap || '')}">${n > 1 ? `<a class="pv" href="#lb${(i + n - 1) % n}" aria-label="${esc(d.prev)}">‹</a><a class="nx" href="#lb${(i + 1) % n}" aria-label="${esc(d.next)}">›</a>` : ''}</div>`).join('');
}

function bodyWeb(p, imgs, d, e, o) {
  const fx = new Set(e.dz.fx), tl = e.tpl === 'timeline', strip = [];
  const eg = p.edu.find(x => x.gpa);
  if (eg) strip.push([eg.gpa, d.gpa]);
  p.tests.filter(t => t.score).slice(0, 4).forEach(t => strip.push([t.score, t.name]));
  const stripHTML = strip.length ? `<div class="strip"${rv(0)}>${strip.map(([b, l]) => `<div class="fig"><b${fx.has('count') ? ' data-c' : ''}>${esc(b)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : '';
  const words = p.name.split(/\s+/).filter(Boolean);
  const h1 = `<h1 data-h aria-label="${esc(p.name)}">${(words.length ? words : ['Portfolio']).map((w, i) => `<span class="w1" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ')}</h1>`;
  const chips = [];
  if (strip[0]) chips.push(`<div class="chip c1"><b>${esc(strip[0][0])}</b>${esc(strip[0][1])}</div>`);
  const cnt = p.awards.length ? [p.awards.length, d.awards] : p.acts.length ? [p.acts.length, d.acts] : null;
  if (cnt) chips.push(`<div class="chip c2"><b>${cnt[0]}</b>${esc(cnt[1])}</div>`);
  const first = p.links[0];
  const acts = `<div class="acts">${p.email ? `<a class="b1 p" href="mailto:${esc(p.email)}">${esc(d.mail)}</a>` : ''}${first ? `<a class="b1" href="${esc(first.u)}" target="_blank" rel="noopener noreferrer">${esc(first.l || host(first.u))}</a>` : ''}${p.city ? `<span class="inf">${esc(p.city)}</span>` : ''}</div>`;
  const cards = (arr, fn, cls = '') => (arr.length ? `<div class="cards${cls}">${arr.map((x, i) => fn(x, d, rv(i))).join('')}</div>` : '');
  const awardWeb = (a, dd, at) => `<div class="e aw"${at}><span class="md">${STAR}</span><div class="b"><span class="d">${esc(a.year)}</span><div class="t">${esc(a.title)}</div>${meta(a.issuer, a.level ? dd.levels[a.level] : '')}${a.note ? `<p>${esc(a.note)}</p>` : ''}</div></div>`;
  const tags = a => (a.length ? `<div class="tg">${a.map((x, i) => `<span${rv(i)}>${esc(x)}</span>`).join('')}</div>` : '');
  const marquee = a => {
    const rep = Math.max(1, Math.ceil(12 / a.length)), half = Array(rep).fill(a).flat(), r2 = [...a.slice(Math.ceil(a.length / 2)), ...a.slice(0, Math.ceil(a.length / 2))];
    const row = xs => { const h = Array(rep).fill(xs).flat().map(x => `<span>${esc(x)}</span>`).join(''); return `<div class="mq-r">${h}${h}</div>`; };
    return half.length ? `<div class="mq" role="list" aria-label="${esc(d.skills)}">${row(a)}${a.length > 3 ? row(r2) : ''}</div>` : '';
  };
  const S = {
    acts: cards(p.acts, actBlock, tl ? ' tl' : ''), projects: cards(p.projects, actBlock, tl ? ' tl' : ''), awards: cards(p.awards, awardWeb), edu: cards(p.edu, eduBlock, tl ? ' tl' : ''),
    skills: p.skills.length ? (fx.has('marquee') && p.skills.length >= 3 ? marquee(p.skills) : tags(p.skills)) : '', targets: tags(p.targets), gallery: webGallery(p, imgs, d)
  };
  const sections = SECS.map(([k, t]) => (S[k] ? `<section id="${k}"><h2${rv(0)}>${esc(d[t === 'acts' ? 'acts' : t])}</h2>${S[k]}${k === 'skills' && p.langs.length ? `<div style="margin-top:18px">${tags(langLine(p, d))}</div>` : ''}</section>` : '')).join('');
  const present = SECS.filter(([k]) => S[k]).slice(0, 5);
  const links = present.map(([k, t]) => `<a href="#${k}">${esc(d[t])}</a>`).join('');
  const dkMode = e.dz.mode === 'dark' || e.dz.mode === 'system';
  const nav = `<nav class="nv${dkMode ? ' ht' : ''}" aria-label="${esc(d.menu)}"><a class="br" href="#top"><i>${esc(initials(p.name))}</i><span>${esc(words[0] || 'Portfolio')}</span></a><div class="nl">${links}</div>${dkMode ? `<button class="th" type="button" aria-label="${esc(d.theme)}">${SUN}${MOON}</button>` : ''}</nav>`;
  const pw = `<div class="pw"><div class="in"><div class="ring"></div>${p.photo ? `<img class="ph" src="${p.photo}" alt="${esc(p.name)}">` : `<div class="mono" aria-hidden="true">${esc(initials(p.name))}</div>`}${chips.join('')}</div></div>`;
  const cta = p.email || first ? `<section class="cta" id="contact"${rv(0)}><h2>${esc(d.cta)}</h2>${acts.replace(/<span class="inf">.*?<\/span>/, '')}</section>` : '';
  const bg = `<div class="bgx" aria-hidden="true"><i></i><i></i><i></i><i></i></div>${fx.has('progress') ? '<div class="pgb" aria-hidden="true"></div>' : ''}${fx.has('glow') ? '<div class="cg" aria-hidden="true"></div>' : ''}`;
  return `${bg}${nav}<div class="w"><header class="hero" id="top"><div class="hx">${h1}${p.headline ? `<p class="hl${fx.has('type') ? ' ty' : ''}">${esc(p.headline)}</p>` : ''}${p.summary ? `<p class="sm">${esc(p.summary)}</p>` : ''}${acts}<nav class="sl" aria-label="${esc(d.menu)}">${links}</nav></div>${pw}<span class="cue" aria-hidden="true"></span></header>
<main>${stripHTML}${sections}${cta}<footer><a href="https://unidoue.uz" target="_blank" rel="noopener noreferrer">${esc(d.web)}</a></footer></main></div>`;
}

const fontsHref = (tpl, font, my) => {
  const fp = fontPair(tpl, font, my), fam = [...new Set([GF[fp.h], GF[fp.b]].filter(Boolean))];
  return `https://fonts.googleapis.com/css2?${fam.map(f => 'family=' + f).join('&')}&display=swap`;
};
const GUIDE = { ledger: ['265mm', '16mm'], rail: ['297mm', '0mm'], folio: ['273mm', '12mm'] };

/** To'liq HTML hujjat.
 * opts.mode: 'print' (A4, PDF) yoki 'web'. opts.plan: tarif (cheklov effective() orqali qo'llanadi; berilmasa 'free').
 * opts.guides: A4 sahifa chegarasi chiziqlari (faqat ekranda). Veb: opts.js (ichiga joylanadigan skript matni) yoki opts.jsSrc (src; ko'rinish uchun), opts.still (animatsiyasiz).
 * imgs: { [attId]: { url } } */
export function docHTML(pf, imgs = {}, opts = {}) {
  const p = normalize(pf), d = DL[p.lang] || DL.en, web = opts.mode === 'web';
  const e = effective(p, opts.plan || 'free'), t = TPL[e.tpl], my = e.my || null, fp = fontPair(e.tpl, e.dz.font, my);
  const tk = my ? myTokens(my, e.accent, e.dz.acc2) : null; // o‘z dizayni: o‘qiladigan yakuniy ranglar
  const vars = `:root{--a:${tk ? tk.a : e.accent};--a2:${e.dz.acc2};--hf:${FF[fp.h]};--bf:${FF[fp.b]}}`;
  const bodyCls = [`t-${e.tpl}`, `b-${e.dz.bg}`, my ? 'my' : '', e.dz.shape !== 'soft' ? `r-${e.dz.shape}` : '', e.dz.dens === 'compact' ? 'dense' : '', web && opts.still ? 'nofx' : ''].filter(Boolean).join(' ');
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(p.name || 'Portfolio')}</title>${p.headline ? `<meta name="description" content="${esc(p.headline)}">` : ''}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="${fontsHref(e.tpl, e.dz.font, my)}">`;
  if (web) {
    const dk = e.dz.mode === 'dark' || (e.dz.mode === 'tpl' && t.dark);
    const hc = [dk ? 'dk' : '', e.dz.mode === 'system' ? 'sys' : '', ...e.dz.fx.map(x => 'fx-' + x)].filter(Boolean).join(' ');
    const js = opts.js ? `<script>${String(opts.js).replace(/<\/(script)/gi, '<\\/$1')}</script>` : opts.jsSrc ? `<script src="${esc(opts.jsSrc)}" defer></script>` : '';
    return `<!DOCTYPE html><html lang="${esc(p.lang)}" class="${hc}"><head>${head}<style>${vars}${webCSS(e)}</style></head><body class="${bodyCls}">${bodyWeb(p, imgs, d, e, opts)}${js}</body></html>`;
  }
  const fam = t.fam, css = printCSS(e.tpl, fam) + pageBg(e.tpl, fam, e.dz.bg, tk ? tk.a : e.accent, tk ? tk.bg : '') + (my ? myPrintCSS(my, fam, tk) : '');
  const body = { ledger: bodyLedger, rail: bodyRail, folio: bodyFolio }[fam](p, imgs, d);
  const printFix = `@media print{.sheet{width:auto;${fam === 'folio' ? 'min-height:0' : 'padding:0'}}}`;
  const G = GUIDE[fam];
  const screen = opts.guides ? `body{position:relative}body::after{content:"";position:absolute;inset:${G[1]} 0 0 0;pointer-events:none;background:linear-gradient(to bottom,transparent calc(100% - 1px),rgba(110,120,150,.55) 0) 0 0/100% ${G[0]} repeat-y}` : '';
  return `<!DOCTYPE html><html lang="${esc(p.lang)}"><head>${head}<style>${vars}${css}${printFix}${screen}</style></head><body class="${bodyCls}">${body}</body></html>`;
}

export const fileBase = pf => { const p = normalize(pf); return ((p.name || 'portfolio').toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'portfolio') + '-portfolio'; };

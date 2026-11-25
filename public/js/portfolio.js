/* Portfolio quruvchi: intervyu, tahrirlash, avtomatik baho, jonli A4 ko'rinish va PDF / Word / veb eksport.
 * Ma'lumot: matn va profil rasmi `qabul:portfolio` da (hisob bilan sinxronlanadi); hujjat rasmlari faqat shu qurilmada (IndexedDB). */
import { $, $$, S, ls, esc, toast, modal, credits, aiFlag, upsell, hasFeature } from './core.js';
import { md } from './markdown.js';
import { lang, t as tr } from './i18n.js';
import { normalize, emptyPf, seedFromProfile, evaluate, canExport, uid, MAX, DIM_L, TIPS } from './pfmodel.js';
import { studioHTML, dzApply, aiRes, myApply, myPreset, myNew } from './pfstudio.js';
import { effective, allow } from './pfdesign.js';
import { liveGlass } from './tiers.js';
import { docHTML, fileBase } from './pfdoc.js';
import { docxBytes } from './pfdocx.js';
import { store, compress, loadImage, cropPhoto } from './pfstore.js';
import { polish, extract, review, design } from './pfai.js';

const KEY = 'qabul:portfolio';
const BLANK = {
  acts: () => ({ id: uid(), title: '', org: '', role: '', from: '', to: '', hours: '', what: '', scale: '', result: '', text: '', url: '' }),
  awards: () => ({ id: uid(), title: '', issuer: '', year: '', level: '', note: '', img: '' }),
  edu: () => ({ id: uid(), school: '', program: '', from: '', to: '', gpa: '', note: '' }),
  tests: () => ({ id: uid(), name: '', score: '', date: '' }),
  links: () => ({ l: '', u: '' }), langs: () => ({ n: '', lv: '' })
}; BLANK.projects = BLANK.acts;
const LEVEL_OPTS = [['', 'Tanlang'], ['school', 'Maktab'], ['regional', 'Viloyat'], ['national', 'Respublika'], ['international', 'Xalqaro']];
const CEFR = [['', 'Daraja'], ['native', 'Ona tili'], ['C2', 'C2'], ['C1', 'C1'], ['B2', 'B2'], ['B1', 'B1'], ['A2', 'A2'], ['A1', 'A1']];
const TIP_SEC = { gpa: 'edu', school: 'edu', english: 'edu', test: 'edu', actsFew: 'acts', role: 'acts', when: 'acts', numbers: 'acts', wording: 'acts', awardsFew: 'awards', level: 'awards', project: 'projects', projectProof: 'projects', photos: 'docs', links: 'about', headline: 'about' };
const SECS = [['about', 'Siz haqingizda', 'Ism, rasm, aloqa va qisqa tavsif.'], ['edu', 'Ta’lim va testlar', 'Maktab, GPA va imtihon natijalari.'], ['acts', 'Faoliyat', 'Klub, volontyorlik, ish, sport. Har birini raqam bilan yozing.'], ['awards', 'Yutuqlar', 'Olimpiada, tanlov, sertifikat va kurslar.'], ['projects', 'Loyihalar', 'O‘zingiz boshlagan va natijasi bor ishlar.'], ['extra', 'Ko‘nikma, til va universitetlar', 'Hujjat oxirida qisqa ro‘yxat bo‘lib chiqadi.'], ['docs', 'Hujjat rasmlari', 'Sertifikat va diplom rasmlari portfolio oxiriga qo‘yiladi.']];
const ASK_TIPS = {
  headline: 'Kim ekaningiz va nimaga intilayotganingizni yozing. Masalan: “Kompyuter fanlariga qiziqqan 11-sinf o‘quvchisi, kichik bizneslar uchun Telegram botlar yaratadi”.',
  act: 'Klub, to‘garak, volontyorlik, ish yoki sport. Eng muhimini tanlang, qolganlarini keyin qo‘shasiz.'
};

const st = {};
const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const L = () => lang();
const ens = (kind, n = 1) => { while (st.pf[kind].length < n) st.pf[kind].push(BLANK[kind]()); };

/* ---------- maydonlar ---------- */
const fld = (label, path, o = {}) => {
  const v = (path === '@skills' ? st.pf.skills.join(', ') : path === '@targets' ? st.pf.targets.join(', ') : getP(st.pf, path)) ?? '', id = 'pf-' + path.replace(/\W/g, '-');
  const inp = o.area ? `<textarea id="${id}" data-p="${path}" rows="${o.area}" maxlength="${o.max || 400}" placeholder="${esc(o.ph || '')}">${esc(v)}</textarea>`
    : o.sel ? `<select id="${id}" data-p="${path}">${o.sel.map(([k, l]) => `<option value="${esc(k)}"${k === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`
    : `<input id="${id}" data-p="${path}" type="${o.type || 'text'}" maxlength="${o.max || 100}" value="${esc(v)}" placeholder="${esc(o.ph || '')}"${o.list ? ` list="${o.list}"` : ''}${o.mode ? ` inputmode="${o.mode}"` : ''} autocomplete="off">`;
  return `<div class="field">${`<label class="f" for="${id}">${label}</label>`}${inp}${o.hint ? `<div class="hint">${o.hint}</div>` : ''}</div>`;
};
const cols = (...x) => `<div class="pf-cols pf-c${x.length}">${x.join('')}</div>`;
const ops = (kind, i, n) => `<div class="pf-ops"><button type="button" class="pf-ico" data-do="mv:${kind}:${i}:-1" aria-label="Yuqoriga"${i ? '' : ' disabled'}>↑</button><button type="button" class="pf-ico" data-do="mv:${kind}:${i}:1" aria-label="Pastga"${i < n - 1 ? '' : ' disabled'}>↓</button><button type="button" class="pf-ico bad" data-do="del:${kind}:${i}" aria-label="O‘chirish">×</button></div>`;
const addBtn = (kind, label, max) => (st.pf[kind].length < max ? `<button type="button" class="btn sm" data-do="add:${kind}">+ ${label}</button>` : `<span class="hint">${tr('Eng ko‘pi bilan')} ${max}</span>`);

function actFields(kind, i) {
  const a = st.pf[kind][i], P = `${kind}.${i}`, pj = kind === 'projects';
  return cols(fld(pj ? 'Loyiha nomi' : 'Faoliyat nomi', P + '.title', { ph: pj ? 'ShopCRM' : 'Dasturlash klubi', max: 100 }), fld(pj ? 'Jamoa yoki tashkilot' : 'Tashkilot', P + '.org', { ph: pj ? 'Mustaqil loyiha' : 'Maktab №110', max: 80 }))
    + cols(fld(pj ? 'Rolingiz' : 'Rolingiz', P + '.role', { ph: pj ? 'Asoschi va dasturchi' : 'Asoschi, sardor, a’zo', max: 60 }), fld('Boshlangan yil', P + '.from', { ph: '2023', mode: 'numeric', max: 7 }), fld('Tugagan yil', P + '.to', { ph: 'hozirgacha bo‘sh', mode: 'numeric', max: 7 }), pj ? '' : fld('Soat / hafta', P + '.hours', { ph: '4', mode: 'numeric', max: 3 }))
    + fld('Nima qildingiz?', P + '.what', { area: 2, max: 400, ph: 'Fe’l bilan boshlang: tashkil qildim, yaratdim, o‘rgatdim…' })
    + fld('Qancha? (kishi, marta, vaqt)', P + '.scale', { area: 1, max: 200, ph: '30 o‘quvchi, haftada 2 marta, 6 oy' })
    + fld('Natija nima bo‘ldi?', P + '.result', { area: 2, max: 300, ph: 'Qatnashish 2 baravar oshdi; 12 kishi o‘zining ilovasini yaratdi' })
    + (a.text ? `<div class="pf-final">${fld('Hujjatdagi yakuniy matn', P + '.text', { area: 3, max: 500 })}<button type="button" class="link-btn" data-do="rt:${kind}:${i}">Asl javoblarimga qaytarish</button></div>` : '')
    + (kind === 'projects' ? fld('Havola (ixtiyoriy)', P + '.url', { ph: 'github.com/siz/loyiha', max: 200 }) : '');
}
const actCard = (kind, i) => { const a = st.pf[kind][i]; return `<article class="pf-item" data-k="${kind}" data-i="${i}"><header><b>${esc(a.title) || tr(kind === 'projects' ? 'Yangi loyiha' : 'Yangi faoliyat')}</b>${ops(kind, i, st.pf[kind].length)}</header>${actFields(kind, i)}</article>`; };

/* ---------- bo'limlar ---------- */
const photoBlock = row => { const p = st.pf.photo; return `<div class="pf-photo${row ? ' row' : ''}"><div class="pf-ph">${p ? `<img src="${p}" alt="">` : '<span>4:5</span>'}</div><div><label class="btn sm" for="pf-photo-in">${p ? 'Almashtirish' : 'Rasm tanlash'}</label><input id="pf-photo-in" type="file" accept="image/jpeg,image/png,image/webp" hidden data-file="photo">${p ? ' <button type="button" class="btn sm" data-do="photo-del">O‘chirish</button>' : ''}<p class="hint">Yuz aniq ko‘rinadigan, yorug‘ rasm tanlang. Rasm qurilmangizda qayta ishlanadi va AI ga yuborilmaydi.</p></div></div>`; };
function docsBlock() {
  const ai = S.account.config.ai, vis = S.account.config.vision, n = st.pf.att.length, picked = st.pf.att.filter(a => st.pick.has(a.id)).length;
  return `<div class="pf-docs">${st.pf.att.map((a, i) => { const im = st.imgs[a.id]; return `<figure class="pf-doc"><div class="pf-thumb">${im ? `<img src="${im.url}" alt="${esc(a.cap)}">` : '<span>Rasm bu qurilmada yo‘q</span>'}${vis && ai && im ? `<label class="pf-pick" title="AI o‘qisin"><input type="checkbox" data-pick="${a.id}"${st.pick.has(a.id) ? ' checked' : ''}><i></i></label>` : ''}<button type="button" class="pf-ico bad" data-do="att-del:${a.id}" aria-label="O‘chirish">×</button></div><input type="text" data-p="att.${i}.cap" maxlength="100" value="${esc(a.cap)}" placeholder="Izoh (ixtiyoriy)" aria-label="Rasm izohi"></figure>`; }).join('')}
  ${n < MAX.att ? `<label class="pf-add" for="pf-docs-in"><b>+</b><span>Rasm qo‘shish</span></label><input id="pf-docs-in" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-file="docs">` : ''}</div>
  <div class="pf-docbar">${ai && vis ? `<button type="button" class="btn dark sm" data-do="extract"${picked ? '' : ' disabled'}>AI rasmdan o‘qisin (2 kredit)</button><span class="hint">${picked ? `${tr('Tanlangan rasmlar:')} ${picked} / 3` : tr('O‘qitish uchun rasm belgisini yoqing (3 tagacha).')}</span>` : `<span class="hint">${ai ? 'Rasmdan o‘qish bu serverda yoqilmagan. Ma’lumotni qo‘lda kiriting.' : 'AI hozircha ulanmagan.'}</span>`}</div>
  <p class="hint pf-priv">Hujjat rasmlari faqat shu qurilmada saqlanadi. Matn va profil rasmi hisobingizda saqlanadi. “AI rasmdan o‘qisin” bosilgandagina tanlangan rasmlar AI xizmatiga yuboriladi.</p>`;
}
const SEC = {
  about: () => `<div class="pf-top">${photoBlock()}<div>${fld('Ism familiya', 'name', { ph: 'Abdullo Karimov', max: 80 })}${fld('Qisqa sarlavha', 'headline', { ph: 'Kompyuter fanlariga qiziqqan 11-sinf o‘quvchisi', max: 140 })}</div></div>
    ${cols(fld('Shahar', 'city', { ph: 'Toshkent, O‘zbekiston', max: 80 }), fld('Telefon', 'phone', { type: 'tel', ph: '+998 90 123 45 67', max: 30 }))}${fld('Email', 'email', { type: 'email', ph: 'ism@gmail.com', max: 120 })}
    <div class="pf-links">${st.pf.links.map((l, i) => `<div class="pf-row">${fld('Havola nomi', `links.${i}.l`, { ph: 'GitHub', max: 30 })}${fld('Manzil', `links.${i}.u`, { ph: 'github.com/siz', max: 200 })}<button type="button" class="pf-ico bad" data-do="del:links:${i}" aria-label="O‘chirish">×</button></div>`).join('')}${addBtn('links', 'Havola qo‘shish', MAX.links)}</div>
    ${fld('Qisqa tavsif (2–3 gap)', 'summary', { area: 3, max: 700, ph: 'Kim ekaningiz, nima qilganingiz va qayerga intilayotganingiz.' })}
    <div class="pf-bar"><button type="button" class="btn sm" data-do="polish-about">AI bilan yozish (2 kredit)</button><button type="button" class="btn sm" data-do="seed">Profildan to‘ldirish</button></div>`,
  edu: () => `${st.pf.edu.map((e, i) => `<article class="pf-item" data-k="edu" data-i="${i}"><header><b>${esc(e.school || e.program) || tr('Yangi ta’lim')}</b>${ops('edu', i, st.pf.edu.length)}</header>${cols(fld('Maktab / kollej', `edu.${i}.school`, { ph: 'Ixtisoslashtirilgan maktab №110', max: 100 }), fld('Sinf yoki yo‘nalish', `edu.${i}.program`, { ph: '11-sinf, matematika', max: 80 }))}${cols(fld('Boshlangan yil', `edu.${i}.from`, { ph: '2022', mode: 'numeric', max: 7 }), fld('Tugash yili', `edu.${i}.to`, { ph: '2026', mode: 'numeric', max: 7 }), fld('GPA / o‘rtacha baho', `edu.${i}.gpa`, { ph: '4.8/5.0', max: 20 }))}</article>`).join('')}<div class="pf-bar">${addBtn('edu', 'Ta’lim qo‘shish', MAX.edu)}</div>
    <h4 class="pf-h">Imtihon natijalari</h4><datalist id="pf-tn"><option>IELTS</option><option>TOEFL</option><option>Duolingo</option><option>SAT</option><option>ACT</option></datalist>
    ${st.pf.tests.map((x, i) => `<div class="pf-row pf-r3">${fld('Imtihon', `tests.${i}.name`, { list: 'pf-tn', ph: 'IELTS', max: 40 })}${fld('Natija', `tests.${i}.score`, { ph: '7.5', max: 24 })}${fld('Sana', `tests.${i}.date`, { ph: '2025', max: 12 })}<button type="button" class="pf-ico bad" data-do="del:tests:${i}" aria-label="O‘chirish">×</button></div>`).join('')}<div class="pf-bar">${addBtn('tests', 'Natija qo‘shish', MAX.tests)}</div>`,
  acts: () => `${st.pf.acts.map((_, i) => actCard('acts', i)).join('')}<div class="pf-bar">${addBtn('acts', 'Faoliyat qo‘shish', MAX.acts)}<button type="button" class="btn sm" data-do="polish-acts">AI bilan yozish (2 kredit)</button></div>`,
  awards: () => `${st.pf.awards.map((a, i) => `<article class="pf-item" data-k="awards" data-i="${i}"><header><b>${esc(a.title) || tr('Yangi yutuq')}</b>${ops('awards', i, st.pf.awards.length)}</header>${cols(fld('Nomi', `awards.${i}.title`, { ph: 'Viloyat informatika olimpiadasi, 2-o‘rin', max: 120 }), fld('Bergan tashkilot', `awards.${i}.issuer`, { ph: 'Xalq ta’limi vazirligi', max: 80 }))}${cols(fld('Yil', `awards.${i}.year`, { ph: '2025', mode: 'numeric', max: 8 }), fld('Daraja', `awards.${i}.level`, { sel: LEVEL_OPTS }), fld('Izoh (ixtiyoriy)', `awards.${i}.note`, { max: 200 }))}</article>`).join('')}<div class="pf-bar">${addBtn('awards', 'Yutuq qo‘shish', MAX.awards)}</div>`,
  projects: () => `${st.pf.projects.map((_, i) => actCard('projects', i)).join('')}<div class="pf-bar">${addBtn('projects', 'Loyiha qo‘shish', MAX.projects)}<button type="button" class="btn sm" data-do="polish-projects">AI bilan yozish (2 kredit)</button></div>`,
  extra: () => `${fld('Ko‘nikmalar (vergul bilan)', '@skills', { ph: 'Python, SQL, notiqlik', max: 400 })}<h4 class="pf-h">Tillar</h4>${st.pf.langs.map((x, i) => `<div class="pf-row pf-r2">${fld('Til', `langs.${i}.n`, { ph: 'Ingliz tili', max: 30 })}${fld('Daraja', `langs.${i}.lv`, { sel: CEFR })}<button type="button" class="pf-ico bad" data-do="del:langs:${i}" aria-label="O‘chirish">×</button></div>`).join('')}<div class="pf-bar">${addBtn('langs', 'Til qo‘shish', MAX.langs)}</div>
    <h4 class="pf-h">Maqsadli universitetlar</h4>${fld('Nomlari (vergul bilan)', '@targets', { ph: 'Georgia Tech, University of Toronto', max: 500 })}<div class="pf-bar"><button type="button" class="btn sm" data-do="apps">Arizalarimdan olish</button></div>`,
  docs: () => docsBlock()
};

/* ---------- baho ---------- */
const tipText = k => (TIPS[k] || {})[L()] || (TIPS[k] || {}).en || '';
const ring = sc => `<svg viewBox="0 0 72 72" class="pf-ring" aria-hidden="true"><circle cx="36" cy="36" r="30" class="bg"/><circle cx="36" cy="36" r="30" class="fg" style="--c:188.5;stroke-dasharray:188.5;stroke-dashoffset:${(188.5 * (1 - sc / 100)).toFixed(1)}"/></svg>`;
function scoreHTML(ev) {
  const bandCls = ev.score >= 80 ? 'ok' : ev.score >= 60 ? '' : 'warn';
  return `<section class="card pf-score"><div class="pf-sc-top"><div class="pf-ring-w">${ring(ev.score)}<b>${ev.score}</b></div><div><h3>Portfolio bahosi</h3><span class="badge ${bandCls}">${esc(ev.band[L()] || ev.band.en)}</span><p class="hint">Bu qabul bashorati emas. Baho to‘liqlik, aniqlik va dalil ko‘rsatkichlarini o‘lchaydi.</p></div></div>
  <ul class="pf-dims">${ev.dims.map(d => `<li><span>${esc((DIM_L[d.k] || {})[L()] || '')}</span><div class="bar${d.pts / d.max < 0.4 ? ' warn' : ''}"><i style="width:${Math.round(100 * d.pts / d.max)}%"></i></div><em>${Math.round(d.pts)}/${d.max}</em></li>`).join('')}</ul></section>
  <section class="card"><h3>Nimani yaxshilash kerak</h3>${ev.tips.length ? `<ul class="pf-tips">${ev.tips.map(t => `<li><div><b>+${Math.max(1, Math.round(t.gain))}</b><p>${esc(tipText(t.key))}</p></div><button type="button" class="btn sm" data-do="goto:${TIP_SEC[t.key] || 'about'}">Bajarish</button></li>`).join('')}</ul>` : '<p class="sub">Asosiy bo‘shliqlar yopilgan. Endi AI bahoni sinab ko‘ring.</p>'}</section>
  <section class="card"><h3>AI baho</h3><p class="sub">AI portfolioni o‘qib, kuchli tomonlari, bo‘shliqlari va yozuvni yaxshilash yo‘llarini aytadi. U faqat siz kiritgan ma’lumotdan foydalanadi.</p><button type="button" class="btn dark" data-do="review">AI baholasin (3 kredit)</button><div id="pf-rv" class="pf-rv">${st.rvText ? `<div class="pre">${md(st.rvText)}</div>` : ''}</div></section>`;
}

/* ---------- jonli A4 ko'rinish ---------- */
function makePaper(host, html) {
  host.innerHTML = '<div class="pf-sheet"><iframe sandbox="allow-same-origin" title="Portfolio" tabindex="-1"></iframe></div>';
  const sheet = host.firstChild, f = sheet.firstChild; let H = 1123;
  const fit = () => { const k = Math.min(1.4, (host.clientWidth || 794) / 794); sheet.style.setProperty('--k', k); sheet.style.height = Math.round(H * k) + 'px'; f.style.height = H + 'px'; host.dataset.pages = Math.max(1, Math.ceil((H - 30) / 1123)); host.dispatchEvent(new CustomEvent('pf:pages')); };
  const measure = () => { try { f.style.height = '10px'; H = Math.max(1123, f.contentDocument.documentElement.scrollHeight); } catch (e) {} fit(); };
  f.addEventListener('load', () => { measure(); try { f.contentDocument.fonts.ready.then(measure); } catch (e) {} });
  f.srcdoc = html; let ro; if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(fit); ro.observe(host); }
  return { stop() { if (ro) ro.disconnect(); }, measure, update(h) { try { const d = f.contentDocument, n = new DOMParser().parseFromString(h, 'text/html'); d.body.className = n.body.className; /* shablon (t-*), fon (b-*), shakl va zichlik klasslari body da — almashmasa hamma shablon bir xil chiqadi */ d.body.innerHTML = n.body.innerHTML; const a = d.querySelector('style'), b = n.querySelector('style'); if (a && b) a.textContent = b.textContent; d.documentElement.lang = n.documentElement.lang; d.documentElement.className = n.documentElement.className; const la = d.querySelector('link[rel=stylesheet]'), lb = n.querySelector('link[rel=stylesheet]'); if (la && lb && la.getAttribute('href') !== lb.getAttribute('href')) la.setAttribute('href', lb.getAttribute('href')); setTimeout(measure, 40); } catch (e) { f.srcdoc = h; } } };
}
/* Veb-sayt ko'rinishi: haqiqiy 1280 px kenglikdagi sahifa (skriptlar ishlaydi, kursor effektlari sinab ko'riladi). big — modalda to'liq o'lchamda. */
function makeWeb(host, h, big) {
  host.innerHTML = `<div class="pf-web${big ? ' big' : ''}"><iframe sandbox="allow-scripts" title="Veb-sayt ko‘rinishi"></iframe></div>`;
  const box = host.firstChild, f = box.firstChild; let ro;
  const fit = () => { if (big) return; const k = Math.min(1, (host.clientWidth || 372) / 1280); box.style.setProperty('--k', k); box.style.height = Math.round(860 * k) + 'px'; };
  f.srcdoc = h; fit(); if (!big && typeof ResizeObserver === 'function') { ro = new ResizeObserver(fit); ro.observe(host); }
  return { stop() { if (ro) ro.disconnect(); }, measure: fit, update(x) { f.srcdoc = x; } };
}
const plan = () => (S.account && S.account.plan) || 'free';
const html = guides => docHTML(st.pf, st.imgs, { guides, plan: plan() });
const webHTML = (o = {}) => docHTML(st.pf, st.imgs, { mode: 'web', plan: plan(), ...o });
const pvHTML = () => (st.view === 'web' ? webHTML({ jsSrc: '/js/pfweb.js' }) : html(true));

/* ---------- saqlash va yangilash ---------- */
let saveT = 0, prevT = 0, scT = 0, wired = false;
const save = () => { clearTimeout(saveT); saveT = setTimeout(flush, 700); };
function flush() { if (!saveT) return; clearTimeout(saveT); saveT = 0; const v = normalize(st.pf); const s = JSON.stringify(v); if (s !== st.last) { st.last = s; ls.set(KEY, v); } }
function changed(structural) { save(); clearTimeout(prevT); prevT = setTimeout(() => st.paper && st.paper.update(pvHTML()), st.view === 'web' ? 700 : 260); clearTimeout(scT); scT = setTimeout(paintScore, 200); if (structural) paintScore(); }
function paintScore() {
  if (!st.el || !$('#pf-sc', st.el)) return;
  const ev = evaluate(st.pf); st.ev = ev;
  const box = $('#pf-sc', st.el), fg = $('.fg', box), band = ev.band[L()] || ev.band.en;
  if (fg) { fg.style.strokeDashoffset = (188.5 * (1 - ev.score / 100)).toFixed(1); $('.pf-ring-w b', box).textContent = ev.score; $('.pf-mini div:last-child b', box).textContent = band; }
  else box.innerHTML = `<button type="button" class="pf-mini" data-tab="score" aria-label="Baho"><div class="pf-ring-w sm">${ring(ev.score)}<b>${ev.score}</b></div><div><b>${esc(band)}</b><span>${tr('Portfolio bahosi')}</span></div></button>`;
  if (!$('#pf-score', st.el).hidden) mountScore(ev);
  const nx = $('#pf-next', st.el); if (nx) nx.outerHTML = nextHTML();
  $$('[data-chip]', st.el).forEach(c => (c.textContent = chip(c.dataset.chip)));
}
function mountScore(ev) { const sb = $('#pf-score', st.el); sb.innerHTML = scoreHTML(ev || evaluate(st.pf)); const pre = $('#pf-rv .pre', sb); if (pre) aiFlag(pre, 'portfolio', st.rvText); }
const chip = s => { const p = normalize(st.pf), n = { about: [p.name, p.headline, p.summary, p.photo].filter(Boolean).length + '/4', edu: p.edu.length + p.tests.length, acts: p.acts.length, awards: p.awards.length, projects: p.projects.length, extra: p.skills.length + p.langs.length + p.targets.length, docs: p.att.length }[s]; return String(n); };

const previewNow = () => { clearTimeout(prevT); save(); if (st.paper) st.paper.update(pvHTML()); };
function mountPreview() {
  const host = $('#pf-paper', st.el); if (st.paper && st.paper.stop) st.paper.stop();
  st.paper = st.view === 'web' ? makeWeb(host, pvHTML()) : makePaper(host, pvHTML());
  host.classList.toggle('web', st.view === 'web'); $('#pf-pg', st.el).hidden = st.view === 'web';
  $$('[data-pv]', st.el).forEach(b => b.setAttribute('aria-selected', String(b.dataset.pv === st.view)));
}
const setView = v => { if (st.view === v) return; st.view = v; mountPreview(); };
function renderDesign() { const d = $('#pf-design', st.el); if (!d) return; const y = window.scrollY; d.innerHTML = studioHTML(st, plan()); if (Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: y }); }
const lockPrompt = tier => upsell('pf_design', tier === 1 ? 'Bu variant Plus va Pro tarifida ochiladi.' : 'Bu variant faqat Pro tarifida ochiladi. Pro tarifida hamma shablon, fon va effekt, o‘z ranglaringiz va AI dizayner bor.', tier === 1 ? 'plus' : 'pro');
function dzClick(btn) {
  const key = btn.dataset.dz, r = dzApply(st, key, plan());
  if (r.lock) { lockPrompt(r.lock); return; }
  if (!r.ok) return;
  const y = btn.closest('.pf-main') ? window.scrollY : 0; renderDesign(); const nb = $(`[data-dz="${key}"]`, st.el); if (nb) nb.focus({ preventScroll: true }); if (y) window.scrollTo({ top: y }); previewNow(); paintScore();
}
const snap = () => JSON.stringify({ tpl: st.pf.tpl, accent: st.pf.accent, dz: st.pf.dz });
async function aiDesign(btn) {
  if (!hasFeature('pf_studio')) { upsell('pf_studio'); return; }
  st.wish = (($('#pf-wish', st.el) || {}).value || '').trim().slice(0, 200); const prev = snap();
  await design(st, st.wish, d => {
    st.dzPrev = prev; st.pf.tpl = d.tpl; st.pf.accent = d.accent; st.pf.dz = d.dz; st.aiWhy = { text: d.why, name: d.name || '' };
    if (d.dz.my) saveDesign(d.name || tr('AI dizayn'), true); // AI yaratgan shaxsiy shablon "Mening dizaynlarim"ga tushadi
    renderDesign(); previewNow(); toast(d.dz.my ? 'AI siz uchun shaxsiy shablon yaratdi. Xohlasangiz, o‘zingiz o‘zgartiring.' : 'AI dizayni qo‘llandi. Xohlasangiz, o‘zingiz o‘zgartiring.');
  }, btn);
}
/** Joriy dizaynni "Mening dizaynlarim"ga saqlaydi (bir xil nom bo‘lsa yangilanadi, eng ko‘pi 12 ta). */
function saveDesign(name, ai) {
  const ds = st.pf.designs || (st.pf.designs = []), nm = String(name || '').trim().slice(0, 40) || `${tr('Dizayn')} ${ds.length + 1}`;
  const item = { id: uid(), name: nm, tpl: st.pf.tpl, accent: st.pf.accent, dz: JSON.parse(JSON.stringify(st.pf.dz)), ai: !!ai };
  if (item.dz.my) item.dz.my.name = nm;
  const i = ds.findIndex(d => d.name === nm); if (i >= 0) { item.id = ds[i].id; ds[i] = item; } else { if (ds.length >= 12) ds.shift(); ds.push(item); }
  if (st.pf.dz.my) st.pf.dz.my.name = nm; save(); return item;
}
let myT = 0;
const myLater = () => { clearTimeout(myT); myT = setTimeout(previewNow, 140); };
function aiUndo() { if (!st.dzPrev) return; const o = JSON.parse(st.dzPrev); st.pf.tpl = o.tpl; st.pf.accent = o.accent; st.pf.dz = o.dz; st.dzPrev = ''; st.aiWhy = null; renderDesign(); previewNow(); }

/* ---------- ko'rinishlar ---------- */
function nextHTML() {
  const ev = st.ev || evaluate(st.pf), t = ev.tips[0];
  if (st.mode !== 'edit') return '<div id="pf-next" hidden></div>';
  return `<div class="pf-next" id="pf-next">${t ? `<div><span class="pf-k">Keyingi qadam</span><p>${esc(tipText(t.key))}</p></div><button type="button" class="btn primary sm" data-do="goto:${TIP_SEC[t.key] || 'about'}">Bajarish</button>` : `<div><span class="pf-k">Tayyor</span><p>${tr('Portfolio to‘liq. PDF yoki Word qilib yuklab oling.')}</p></div><button type="button" class="btn primary sm" data-do="pdf">PDF</button>`}</div>`;
}
function renderBuild() {
  const b = $('#pf-build', st.el); if (!b) return;
  if (st.mode === 'ask') { b.innerHTML = askHTML(); return; }
  st.ev = evaluate(st.pf);
  b.innerHTML = `<div class="pf-intro card"><div><h3>Savollar bo‘yicha to‘ldirish</h3><p class="sub">Sayt sizdan kerakli ma’lumotni birin-ketin so‘raydi. Bo‘sh joylarni keyin tahrirlab to‘ldirasiz.</p></div><button type="button" class="btn primary sm" data-do="ask">Savollarni boshlash</button></div>${nextHTML()}
  ${SECS.map(([id, ti, sub]) => `<details class="pf-sec card" data-s="${id}"${st.open.has(id) ? ' open' : ''}><summary><span class="pf-st">${ti}</span><span class="pf-chip" data-chip="${id}">${chip(id)}</span></summary><div class="pf-body"><p class="sub">${sub}</p>${SEC[id]()}</div></details>`).join('')}`;
}
const ASK = [
  { q: 'Ismingiz va familiyangiz?', h: 'Hujjat tepasida shunday chiqadi.', b: () => fld('Ism familiya', 'name', { ph: 'Abdullo Karimov', max: 80 }) },
  { q: 'O‘zingizni bir qatorda qanday tanishtirasiz?', h: ASK_TIPS.headline, b: () => fld('Qisqa sarlavha', 'headline', { ph: 'Kompyuter fanlariga qiziqqan 11-sinf o‘quvchisi', max: 140 }) + fld('Shahar', 'city', { ph: 'Toshkent, O‘zbekiston', max: 80 }) },
  { q: 'Qayerda o‘qiysiz?', h: 'Maktab yoki kollej, sinf va o‘rtacha bahoingiz. GPA ni o‘zingiz bilgan shkalada yozing.', pre: () => ens('edu'), b: () => cols(fld('Maktab / kollej', 'edu.0.school', { ph: 'Maktab №110', max: 100 }), fld('Sinf yoki yo‘nalish', 'edu.0.program', { ph: '11-sinf', max: 80 })) + cols(fld('Boshlangan yil', 'edu.0.from', { ph: '2022', mode: 'numeric', max: 7 }), fld('Tugash yili', 'edu.0.to', { ph: '2026', mode: 'numeric', max: 7 }), fld('GPA / o‘rtacha baho', 'edu.0.gpa', { ph: '4.8/5.0', max: 20 })) },
  { q: 'Qaysi imtihonlarni topshirgansiz?', h: 'IELTS, SAT, TOEFL yoki Duolingo. Topshirmagan bo‘lsangiz, o‘tkazib yuboring.', pre: () => ens('tests', 2), b: () => `<datalist id="pf-tn"><option>IELTS</option><option>TOEFL</option><option>Duolingo</option><option>SAT</option><option>ACT</option></datalist>` + [0, 1].map(i => cols(fld('Imtihon', `tests.${i}.name`, { list: 'pf-tn', ph: i ? 'SAT' : 'IELTS', max: 40 }), fld('Natija', `tests.${i}.score`, { ph: i ? '1450' : '7.5', max: 24 }), fld('Sana', `tests.${i}.date`, { ph: '2025', max: 12 }))).join('') },
  { q: 'Darsdan tashqari eng muhim ishingiz nima?', h: ASK_TIPS.act, pre: () => ens('acts'), b: () => actFields('acts', 0) },
  { q: 'Eng katta yutug‘ingiz yoki sertifikatingiz?', h: 'Olimpiada, tanlov, kurs yoki sport natijasi. Darajasini belgilang.', pre: () => ens('awards'), b: () => cols(fld('Nomi', 'awards.0.title', { ph: 'Viloyat informatika olimpiadasi, 2-o‘rin', max: 120 }), fld('Bergan tashkilot', 'awards.0.issuer', { ph: 'Xalq ta’limi vazirligi', max: 80 })) + cols(fld('Yil', 'awards.0.year', { ph: '2025', mode: 'numeric', max: 8 }), fld('Daraja', 'awards.0.level', { sel: LEVEL_OPTS })) },
  { q: 'Rasmlaringizni qo‘shing', h: 'Profil rasmi va sertifikatlar. Rasm portfolioni ishonchli qiladi, AI esa sertifikatdan ma’lumotni o‘zi o‘qib beradi.', b: () => photoBlock(true) + '<h4 class="pf-h">Sertifikat va diplomlar</h4>' + docsBlock() }
];
function askHTML() {
  const n = ASK.length;
  if (st.step >= n) { const ev = evaluate(st.pf); st.ev = ev; return `<section class="card pf-done"><div class="pf-ring-w lg">${ring(ev.score)}<b>${ev.score}</b></div><h3>Birinchi variant tayyor</h3><p class="sub">${esc(ev.band[L()] || ev.band.en)}. O‘ng tomonda hujjatni ko‘ring, qolgan bo‘shliqlarni tahrirlashda to‘ldiring.</p><div class="pf-bar"><button type="button" class="btn primary" data-do="edit">Tahrirlashga o‘tish</button><button type="button" class="btn" data-do="polish-all">AI bilan sayqallash (2 kredit)</button><button type="button" class="btn" data-do="pdf">PDF yuklash</button></div></section>`; }
  const s = ASK[st.step]; if (s.pre) s.pre();
  return `<section class="card pf-ask"><div class="pf-prog" role="progressbar" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${st.step + 1}">${ASK.map((_, i) => `<i class="${i < st.step ? 'on' : i === st.step ? 'cur' : ''}"></i>`).join('')}</div><span class="pf-k">${st.step + 1} / ${n}</span><h3 class="pf-q">${s.q}</h3><p class="pf-qh">${s.h}</p><div class="pf-qb">${s.b()}</div>
  <div class="pf-bar"><button type="button" class="btn" data-do="back"${st.step ? '' : ' disabled'}>Orqaga</button><button type="button" class="btn" data-do="skip">O‘tkazib yuborish</button><button type="button" class="btn primary" data-do="next">${st.step === n - 1 ? 'Tugatish' : 'Keyingi'}</button><button type="button" class="link-btn" data-do="edit">Qo‘lda tahrirlash</button></div></section>`;
}
const langHTML = () => `<div class="pf-ctl"><div class="pf-lg"><span>Hujjat tili</span><div class="tabs" role="group">${['en', 'uz', 'ru'].map(l => `<button type="button" data-dl="${l}" aria-selected="${st.pf.lang === l}">${l.toUpperCase()}</button>`).join('')}</div></div></div>`;
const expHTML = () => `<div class="pf-exp"><button type="button" class="btn primary" data-do="pdf">PDF</button><button type="button" class="btn" data-do="word">Word</button><button type="button" class="btn" data-do="web">Veb sahifa</button><button type="button" class="btn sm" data-do="big" aria-label="Katta ko‘rinish">⤢</button></div><p class="hint pf-eh">PDF: ochilgan oynada “PDF sifatida saqlash” ni tanlang. Word tahrirlash uchun qulay, maketi PDF dan farq qiladi. Veb sahifa bitta HTML fayl bo‘ladi.</p>`;

/* ---------- amallar ---------- */
const gate = () => { if (canExport(st.pf)) return true; toast('Avval ism va kamida bitta bo‘lim (faoliyat, yutuq, ta’lim…) kiriting.', 'err'); return false; };
function download(blob, name) { const a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
async function printPdf() {
  if (!gate()) return; flush();
  const fr = document.createElement('iframe'); fr.className = 'pf-print'; fr.setAttribute('sandbox', 'allow-same-origin allow-modals'); fr.setAttribute('aria-hidden', 'true'); fr.srcdoc = html(false); document.body.appendChild(fr);
  await new Promise(r => { fr.onload = r; setTimeout(r, 6000); });
  try { await Promise.race([fr.contentDocument.fonts.ready, wait(2500)]); } catch (e) {} await wait(250);
  try { const w = fr.contentWindow; w.onafterprint = () => fr.remove(); setTimeout(() => fr.remove(), 180000); w.focus(); w.print(); } catch (e) { fr.remove(); toast('Chop etish ochilmadi. Veb sahifani yuklab, brauzerdan PDF qiling.', 'err'); }
}
function getWord() { if (!gate()) return; try { download(new Blob([docxBytes(st.pf, st.imgs, plan())], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), fileBase(st.pf) + '.docx'); } catch (e) { toast('Word faylini yaratib bo‘lmadi.', 'err'); } }
async function getWeb() {
  if (!gate()) return; let js = ''; try { const r = await fetch('/js/pfweb.js'); if (r.ok) js = await r.text(); } catch (e) {}
  download(new Blob([webHTML({ js })], { type: 'text/html;charset=utf-8' }), fileBase(st.pf) + '.html'); toast('Veb sahifa yuklandi. Uni istalgan hosting yoki brauzerda ochish mumkin.');
}
function bigView() {
  const web = st.view === 'web', p = modal({ title: web ? 'Veb-sayt ko‘rinishi' : 'Portfolio ko‘rinishi', body: `<div class="pf-desk"><div class="pf-big"></div></div>`, actions: [{ label: 'Yopish', value: 0, cls: 'primary' }] });
  const bg = $$('.modal-bg').pop(); bg.querySelector('.modal').classList.add(web ? 'pf-xl' : 'pf-wide'); const host = $('.pf-big', bg); if (web) makeWeb(host, pvHTML(), true); else makePaper(host, html(true)); return p;
}
function goto(sec) {
  st.mode = 'edit'; st.open.add(sec); if (['acts', 'projects', 'awards'].includes(sec)) ens(sec, 1);
  setTab('build'); renderBuild();
  const d = $(`[data-s="${sec}"]`, st.el); if (d) { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); const i = $$('input:not([type=file]):not([type=checkbox]),textarea,select', d).find(x => !x.value); if (i) setTimeout(() => i.focus({ preventScroll: true }), 350); }
}
function setTab(t) {
  st.tab = t; $('.pf', st.el).dataset.t = t; $$('[data-tab]', st.el).forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  const sb = $('#pf-score', st.el), bb = $('#pf-build', st.el), db = $('#pf-design', st.el); bb.hidden = t !== 'build' && t !== 'view'; sb.hidden = t !== 'score'; db.hidden = t !== 'design';
  if (t === 'score') mountScore(); if (t === 'design') renderDesign(); if (t === 'view' && st.paper) setTimeout(st.paper.measure, 30);
}
async function pickPhoto(file) {
  let im; try { im = await loadImage(file); } catch (e) { toast(e.message, 'err'); return; }
  const v = { z: 1, cx: .5, cy: .5 }, p = modal({ title: 'Profil rasmini joylashtiring', body: '<div class="pf-crop"><canvas width="240" height="300"></canvas></div><label class="pf-zoom">Yaqinlashtirish<input type="range" min="1" max="3" step="0.01" value="1"></label><p class="hint">Rasmni sudrab, yuzni o‘rtaga keltiring.</p>', actions: [{ label: 'Bekor qilish', value: 0 }, { label: 'Saqlash', value: 1, cls: 'primary' }] });
  const bg = $$('.modal-bg').pop(), cv = $('canvas', bg), g = cv.getContext('2d'), base = () => Math.max(240 / im.w, 300 / im.h) * v.z;
  const paint = () => { const s = base(), sw = 240 / s, sh = 300 / s; v.cx = Math.min(Math.max(v.cx, sw / 2 / im.w), 1 - sw / 2 / im.w); v.cy = Math.min(Math.max(v.cy, sh / 2 / im.h), 1 - sh / 2 / im.h); g.fillStyle = '#fff'; g.fillRect(0, 0, 240, 300); g.drawImage(im.src, v.cx * im.w - sw / 2, v.cy * im.h - sh / 2, sw, sh, 0, 0, 240, 300); }; paint();
  let drag = null; cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, cx: v.cx, cy: v.cy }; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drag) return; const k = cv.getBoundingClientRect().width / 240, s = base() * k; v.cx = drag.cx - (e.clientX - drag.x) / s / im.w; v.cy = drag.cy - (e.clientY - drag.y) / s / im.h; paint(); };
  cv.onpointerup = cv.onpointercancel = () => (drag = null); $('input[type=range]', bg).oninput = e => { v.z = +e.target.value; paint(); };
  if (await p === 1) { st.pf.photo = cropPhoto(im, v); im.close(); renderBuild(); changed(true); } else im.close();
}
async function addDocs(files) {
  const room = MAX.att - st.pf.att.length; if (room <= 0) { toast('Eng ko‘pi bilan 8 ta rasm.', 'err'); return; }
  for (const f of [...files].slice(0, room)) {
    try { const c = await compress(f), id = uid(); await store.set(id, c); st.imgs[id] = c; st.pf.att.push({ id, cap: '' }); if (st.pick.size < 3) st.pick.add(id); } catch (e) { toast(e.message, 'err'); }
  }
  refreshAll(true);
}
function removeDoc(id) { st.pf.att = st.pf.att.filter(a => a.id !== id); st.pf.awards.forEach(a => { if (a.img === id) a.img = ''; }); st.pick.delete(id); delete st.imgs[id]; store.del(id); refreshAll(true); }
const refreshAll = structural => { renderBuild(); changed(structural); };
const fromList = s => String(s || '').split(/[,;\n]/).map(x => x.trim()).filter(Boolean);

async function act(d, el) {
  const [k, a, b, c] = d.split(':');
  if (k === 'add') { ens(a, st.pf[a].length + 1); st.open.add(({ acts: 'acts', projects: 'projects', awards: 'awards', edu: 'edu', tests: 'edu', links: 'about', langs: 'extra' })[a]); refreshAll(); const it = $(`[data-k="${a}"][data-i="${st.pf[a].length - 1}"]`, st.el) || $$(`[data-p^="${a}.${st.pf[a].length - 1}."]`, st.el)[0]; const f = it && (it.matches('input,select,textarea') ? it : $('input,textarea', it)); if (f) f.focus(); }
  else if (k === 'del') { const i = +b, x = st.pf[a][i]; const has = x && Object.values(x).some(v => typeof v === 'string' && v.trim() && v !== x.id); if (has && await modal({ title: 'O‘chirasizmi?', body: '<p>Bu yozuv o‘chiriladi.</p>', actions: [{ label: 'Bekor', value: 0 }, { label: 'O‘chirish', value: 1, cls: 'danger' }] }) !== 1) return; st.pf[a].splice(i, 1); refreshAll(true); }
  else if (k === 'mv') { const i = +b, j = i + +c, arr = st.pf[a]; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; refreshAll(); }
  else if (k === 'rt') { st.pf[a][+b].text = ''; refreshAll(); }
  else if (k === 'goto') goto(a);
  else if (k === 'tab') setTab(a);
  else if (k === 'ask') { st.mode = 'ask'; st.step = 0; renderBuild(); window.scrollTo({ top: 0 }); }
  else if (k === 'edit') { st.mode = 'edit'; renderBuild(); paintScore(); }
  else if (k === 'next') { st.step++; renderBuild(); paintScore(); }
  else if (k === 'skip') { st.step++; renderBuild(); }
  else if (k === 'back') { st.step = Math.max(0, st.step - 1); renderBuild(); }
  else if (k === 'seed') { const was = JSON.stringify(normalize(st.pf)); st.pf = Object.assign(st.pf, seedFromProfile(st.pf, ls.get('qabul:profile', {}), ls.get('qabul:p', {}), ls.get('qabul:apps', []), st.pf.lang)); toast(JSON.stringify(normalize(st.pf)) === was ? 'Profilda qo‘shiladigan yangi ma’lumot yo‘q.' : 'Profil ma’lumotlari qo‘shildi.'); refreshAll(true); }
  else if (k === 'apps') { const n = ls.get('qabul:apps', []).map(x => x && x.n).filter(Boolean); if (!n.length) { toast('Arizalar ro‘yxati bo‘sh. Avval “Arizalarim” sahifasiga universitet qo‘shing.', 'err'); return; } st.pf.targets = [...new Set([...st.pf.targets, ...n])].slice(0, MAX.targets); refreshAll(true); }
  else if (k === 'photo-del') { st.pf.photo = ''; refreshAll(true); }
  else if (k === 'att-del') removeDoc(a);
  else if (k === 'pdf') printPdf();
  else if (k === 'word') getWord();
  else if (k === 'web') getWeb();
  else if (k === 'big') bigView();
  else if (k === 'polish-about') await polish(st, { kinds: [], need: ['headline', 'summary'] }, refreshAll, el);
  else if (k === 'polish-acts') await polish(st, { kinds: ['acts'] }, refreshAll, el);
  else if (k === 'polish-projects') await polish(st, { kinds: ['projects'] }, refreshAll, el);
  else if (k === 'polish-all') await polish(st, { kinds: ['acts', 'projects'], need: ['headline', 'summary'] }, () => { st.mode = 'edit'; refreshAll(true); }, el);
  else if (k === 'extract') await extract(st, refreshAll, el);
  else if (k === 'ai-design') await aiDesign(el);
  else if (k === 'ai-undo') aiUndo();
  else if (k === 'my-new') { myNew(st); renderDesign(); previewNow(); }
  else if (k === 'my-off') { delete st.pf.dz.my; if (!allow(plan()).ok('tpl', st.pf.tpl)) st.pf.tpl = 'ledger'; renderDesign(); previewNow(); }
  else if (k === 'my-save') { const nm = (($('#pf-myname', st.el) || {}).value || '').trim(); const it = saveDesign(nm, false); renderDesign(); toast(`${tr('Dizayn saqlandi:')} ${it.name}`); }
  else if (k === 'my-use') { const d = (st.pf.designs || []).find(x => x.id === a); if (!d) return; st.dzPrev = snap(); st.pf.tpl = d.tpl; st.pf.accent = d.accent; st.pf.dz = JSON.parse(JSON.stringify(d.dz)); renderDesign(); previewNow(); toast(`${tr('Qo‘llandi:')} ${d.name}`); }
  else if (k === 'my-del') { const d = (st.pf.designs || []).find(x => x.id === a); if (!d) return; if (await modal({ title: 'O‘chirasizmi?', body: `<p>${esc(d.name)} — ${esc(tr('saqlangan dizayn o‘chiriladi. Hujjatdagi joriy dizayn o‘zgarmaydi.'))}</p>`, actions: [{ label: 'Bekor', value: 0 }, { label: 'O‘chirish', value: 1, cls: 'danger' }] }) !== 1) return; st.pf.designs = st.pf.designs.filter(x => x.id !== a); if (!st.pf.designs.length) delete st.pf.designs; save(); renderDesign(); }
  else if (k === 'review') await review(st, () => $('#pf-rv', st.el), el);
}

/* ---------- kirish nuqtasi ---------- */
const emTitle = x => { const y = tr(x), i = y.lastIndexOf(' '); return i < 0 ? '<em>' + esc(y) + '</em>' : esc(y.slice(0, i)) + ' <em>' + esc(y.slice(i + 1)) + '</em>'; };
export async function portfolio(el) {
  if (!$('link[data-pf]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/portfolio.css?v=49'; l.dataset.pf = ''; document.head.appendChild(l); await new Promise(r => { l.onload = l.onerror = r; setTimeout(r, 2500); }); }
  Object.keys(st).forEach(k => delete st[k]);
  liveGlass(el);
  const saved = ls.get(KEY, null), fresh = !saved;
  Object.assign(st, { el, pf: normalize(saved), imgs: {}, tab: 'build', view: 'a4', wish: '', aiWhy: null, dzPrev: '', step: 0, open: new Set(['about']), pick: new Set(), read: new Set(), last: JSON.stringify(normalize(saved || emptyPf())) });
  if (fresh) st.pf = seedFromProfile(emptyPf(), ls.get('qabul:profile', {}), ls.get('qabul:p', {}), ls.get('qabul:apps', []), 'en');
  st.mode = canExport(st.pf) && !fresh ? 'edit' : 'ask';
  await Promise.all(st.pf.att.map(async a => { const v = await store.get(a.id); if (v && v.url) st.imgs[a.id] = v; }));
  el.innerHTML = `<div class="page-h"><div><h2>${emTitle('Portfolio quruvchi')}</h2><p>Yutuqlaringizni bir hujjatga jamlang: PDF, Word yoki veb-sahifa. Sayt kerakli ma’lumotni so‘raydi, rasmlaringizni o‘qiydi va portfolioni baholaydi.</p></div><span class="badge" data-cr="badge">${credits().left} / ${credits().limit} kredit qoldi</span></div>
  <div class="pf" data-t="build"><div class="tabs pf-tabs" role="tablist"><button type="button" role="tab" data-tab="build" aria-selected="true">Tuzish</button><button type="button" role="tab" data-tab="design" aria-selected="false">Dizayn</button><button type="button" role="tab" class="t-view" data-tab="view" aria-selected="false">Ko‘rinish</button><button type="button" role="tab" data-tab="score" aria-selected="false">Baho</button></div>
  <div class="pf-grid"><div class="pf-main"><div id="pf-build"></div><div id="pf-design" hidden></div><div id="pf-score" hidden></div></div>
  <aside class="pf-aside"><div id="pf-sc"></div>${expHTML()}<div class="pf-pvw"><div class="pf-vt" role="group" aria-label="Ko‘rinish turi"><button type="button" data-pv="a4" aria-selected="true">A4 (PDF)</button><button type="button" data-pv="web" aria-selected="false">Veb-sayt</button><button type="button" class="pf-dzb" data-tab="design">Dizaynni sozlash</button></div><div class="pf-desk"><div class="pf-paper" id="pf-paper"></div></div><div class="pf-pg" id="pf-pg"></div></div>${langHTML()}</aside></div></div>`;
  renderBuild(); paintScore();
  mountPreview(); $('#pf-paper', el).addEventListener('pf:pages', () => { const pp = $('#pf-paper', el), pg = $('#pf-pg', el); if (!pp || !pg) return; const n = +pp.dataset.pages; pg.textContent = `≈ ${n} ${tr(n === 1 ? 'sahifa' : 'sahifalar')}`; });
  const onInput = e => {
    const mc = e.target.closest('[data-myc]'); if (mc && st.pf.dz.my) { const k = mc.dataset.myc, v = mc.value.toLowerCase(); if (k === '@a') st.pf.accent = v; else if (k === '@a2') st.pf.dz.acc2 = v; else st.pf.dz.my[k] = v; myLater(); return; }
    const mr = e.target.closest('[data-myr]'); if (mr && st.pf.dz.my) { const v = +mr.value; st.pf.dz.my[mr.dataset.myr] = v; const b = mr.parentElement.querySelector('b'); if (b) b.textContent = mr.dataset.myr === 'r' ? v + 'px' : v; myLater(); return; }
    const cc = e.target.closest('[data-cc]'); if (cc) { if (!hasFeature('pf_studio')) return; if (cc.dataset.cc === 'accent') st.pf.accent = cc.value.toLowerCase(); else st.pf.dz.acc2 = cc.value.toLowerCase(); previewNow(); return; }
    const x = e.target.closest('[data-p]'); if (!x) return; const p = x.dataset.p;
    if (p === '@skills') st.pf.skills = fromList(x.value).slice(0, MAX.skills); else if (p === '@targets') st.pf.targets = fromList(x.value).slice(0, MAX.targets); else setP(st.pf, p, x.value);
    const it = x.closest('.pf-item'); if (it && /\.(title|school)$/.test(p)) { const b = $('header b', it); if (b) b.textContent = x.value.trim() || tr('Yangi yozuv'); }
    changed();
  };
  el.addEventListener('input', onInput); el.addEventListener('change', e => {
    const f = e.target.closest('[data-file]');
    if (f) { const fs = [...f.files]; f.value = ''; if (fs.length) (f.dataset.file === 'photo' ? pickPhoto(fs[0]) : addDocs(fs)); return; }
    const pk = e.target.closest('[data-pick]'); if (pk) { if (pk.checked && st.pick.size >= 3) { pk.checked = false; toast('Bir vaqtda 3 tagacha rasm o‘qitish mumkin.'); return; } pk.checked ? st.pick.add(pk.dataset.pick) : st.pick.delete(pk.dataset.pick); const bt = $('[data-do=extract]', el); if (bt) bt.disabled = !st.pick.size; return; }
    const mf = e.target.closest('[data-myf]'); if (mf && st.pf.dz.my) { st.pf.dz.my[mf.dataset.myf] = mf.value; previewNow(); return; }
    if (e.target.closest('[data-myc]') && st.pf.dz.my) { renderDesign(); previewNow(); return; }
    if (e.target.matches('select[data-p]')) onInput(e);
  });
  el.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { setTab(t.dataset.tab); return; }
    const ms = e.target.closest('[data-my-set]'); if (ms) { if (myApply(st, ms.dataset.mySet).ok) { renderDesign(); const nb = $(`[data-my-set="${ms.dataset.mySet}"]`, st.el); if (nb) nb.focus({ preventScroll: true }); previewNow(); } return; }
    const mp = e.target.closest('[data-my-preset]'); if (mp) { myPreset(st, mp.dataset.myPreset); renderDesign(); previewNow(); return; }
    const dzb = e.target.closest('[data-dz]'); if (dzb) { dzClick(dzb); return; }
    const pvb = e.target.closest('[data-pv]'); if (pvb) { setView(pvb.dataset.pv); return; }
    const dl = e.target.closest('[data-dl]'); if (dl) { st.pf.lang = dl.dataset.dl; $('.pf-ctl', el).outerHTML = langHTML(); changed(); previewNow(); return; }
    const d = e.target.closest('[data-do]'); if (d && !d.disabled) act(d.dataset.do, d).catch(er => toast(er.message || 'Xatolik yuz berdi.', 'err'));
  });
  $('#pf-build', el).addEventListener('toggle', e => { const s = e.target.dataset && e.target.dataset.s; if (s) e.target.open ? st.open.add(s) : st.open.delete(s); }, true);
  addEventListener('hashchange', flush, { once: true }); if (!wired) { wired = true; document.addEventListener('visibilitychange', () => document.hidden && st.pf && flush()); addEventListener('pagehide', () => st.pf && flush()); }
  changed(true);
}

// Portfolio yadrosi: model tozalash, baholash, HTML/DOCX hujjatlari. Ishga tushirish: node --no-warnings tests/pf.mjs
import assert from 'node:assert/strict';
import { inflateRawSync, crc32 as nodeCrc } from 'node:zlib';
import { normalize, emptyPf, evaluate, seedFromProfile, range, splitBullets, safeUrl, canExport, TIPS, DIMS, uid } from '../public/js/pfmodel.js';
import { docHTML, fileBase, esc } from '../public/js/pfdoc.js';
import { docxBytes } from '../public/js/pfdocx.js';
import { zip, crc32 } from '../public/js/zip.js';
import { effective, allow, cleanDz, defaultDz, designFromAI, lockedCount, TPLS, PALETTES, BGS, FXS, FONTS } from '../public/js/pfdesign.js';
import { webCSS } from '../public/js/pfwebcss.js';
import { printCSS, pageBg, bgLayers } from '../public/js/pfcss.js';
import { readFileSync } from 'node:fs';
import { tierPill, tierIcon, tierMedal, crownHTML, tierOf, TIER_NAME, TIER_TAG } from '../public/js/tiers.js';

let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL:', m); process.exitCode = 1; } };
const eq = (a, b, m) => { n++; try { assert.deepEqual(a, b); } catch (e) { console.error('FAIL:', m, '\n  got', JSON.stringify(a), '\n  want', JSON.stringify(b)); process.exitCode = 1; } };

/* ---- normalize ---- */
const evil = { name: '<script>alert(1)</script>', headline: 'x'.repeat(500), email: 'javascript:alert(1)', accent: 'red;}</style><script>', tpl: 'hack', lang: 'xx', photo: 'data:image/svg+xml;base64,AAAA',
  links: [{ l: 'gh', u: 'javascript:alert(1)' }, { l: 'ok', u: 'github.com/me' }, { l: 'data', u: 'data:text/html,<b>' }], acts: [{ title: 'A', url: 'http://x.io/"onmouseover="1', hours: 5 }], awards: [{ title: 'W', level: 'galaxy' }], att: [{ id: 'a1', cap: 'c' }, null, { cap: 'no id' }] };
const m = normalize(evil);
ok(m.headline.length === 140, 'headline clamped to 140');
eq(m.email, '', 'bad email dropped'); eq(m.tpl, 'ledger', 'unknown template → ledger'); eq(m.lang, 'en', 'unknown lang → en'); eq(m.accent, '#2745e8', 'bad accent → default'); eq(m.photo, '', 'non-jpeg photo dropped');
eq(m.links.map(x => x.u), ['https://github.com/me'], 'only http(s) links kept; bare domain gets https'); eq(m.acts[0].url, '', 'url with quote rejected'); eq(m.awards[0].level, '', 'unknown level dropped');
eq(m.att.length, 1, 'attachments without id dropped');
eq(normalize(null), emptyPf(), 'null → empty model'); eq(normalize('x').acts, [], 'garbage input safe');
eq(normalize(m), m, 'normalize is idempotent');
ok(normalize({ acts: Array.from({ length: 50 }, (_, i) => ({ title: 't' + i })) }).acts.length === 8, 'acts capped at 8');
ok(normalize({ photo: 'data:image/jpeg;base64,' + 'A'.repeat(130000) }).photo === '', 'oversize photo dropped');
ok(normalize({ photo: 'data:image/jpeg;base64,' + 'A'.repeat(5000) }).photo.startsWith('data:image/jpeg'), 'ok jpeg photo kept');
ok(uid().length >= 4 && uid() !== uid(), 'uid unique');
eq(safeUrl('example.com'), 'https://example.com', 'bare domain'); eq(safeUrl('ftp://a.b/c'), '', 'ftp rejected'); eq(safeUrl('https://a b.com'), '', 'space rejected');

/* ---- range / bullets ---- */
eq(range({ from: '2024', to: '2025' }), '2024–2025', 'range'); eq(range({ from: '2024' }, 'present'), '2024–present', 'ongoing'); eq(range({ to: '2023' }), '2023', 'to only'); eq(range({ from: '2023', to: '2023' }), '2023', 'same year'); eq(range({}), '', 'empty');
eq(splitBullets('a\n- b\n• c'), ['a', 'b', 'c'], 'bullets split');

/* ---- seed ---- */
const s = seedFromProfile(emptyPf(), { pn: 'Ali', pc: 'Tashkent', pm: 'Physics', pg: '11', py: 2027 }, { gpa: '4.8', sc: '5', sat: '1450', ielts: '7' }, [{ n: 'MIT' }, { n: 'ETH' }], 'en');
eq([s.name, s.city, s.headline], ['Ali', 'Tashkent', 'Aspiring Physics student'], 'seed basics'); eq(s.tests.map(t => t.name), ['SAT', 'IELTS'], 'seed tests'); eq(s.targets, ['MIT', 'ETH'], 'seed targets'); eq(s.edu[0].gpa, '4.8/5', 'seed gpa');
const s2 = seedFromProfile({ ...emptyPf(), name: 'Keep', tests: [{ name: 'sat', score: '1200' }] }, { pn: 'Other' }, { sat: '1500' }, [], 'en');
eq([s2.name, s2.tests.length], ['Keep', 1], 'seed does not overwrite');

/* ---- evaluate ---- */
const e0 = evaluate(emptyPf());
eq(e0.score, 0, 'empty scores 0'); ok(e0.tips.length > 0 && e0.tips.length <= 5, 'empty has ≤5 tips'); ok(e0.tips.every(t => TIPS[t.key] && TIPS[t.key].uz && TIPS[t.key].ru && TIPS[t.key].en), 'every tip has 3 languages');
ok(DIMS.reduce((a, d) => a + d[1], 0) === 100, 'dims sum to 100');
let cur = emptyPf(), last = 0; const steps = [
  p => { p.edu = [{ school: 'S1', gpa: '4.5' }]; }, p => { p.tests = [{ name: 'IELTS', score: '7' }, { name: 'SAT', score: '1400' }]; },
  p => { p.acts = [{ title: 'Club', role: 'Lead', from: '2023', what: 'Organized weekly sessions for 30 students', result: 'doubled attendance' }]; },
  p => { p.awards = [{ title: 'Olympiad', year: '2024', level: 'national' }, { title: 'Contest', year: '2023', level: 'regional' }]; },
  p => { p.projects = [{ title: 'Bot', url: 'https://github.com/x/y', what: 'Built a bot used by 400 students' }]; },
  p => { p.links = [{ l: 'GitHub', u: 'https://github.com/x' }, { l: 'YT', u: 'https://youtube.com/x' }]; p.att = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]; },
  p => { p.headline = 'Builder of tools'; p.summary = 'Student who builds things for classmates.'; }];
for (const f of steps) { f(cur); cur = normalize(cur); const sc = evaluate(cur).score; ok(sc >= last, 'score never drops when adding content: ' + sc + ' < ' + last); last = sc; }
ok(last > 50 && last <= 100, 'rich portfolio scores high: ' + last);
const thin = normalize({ ...cur, acts: [{ title: 'Club' }] }); ok(evaluate(thin).score < last, 'fewer/lighter activities score lower');
const spam = normalize({ ...cur, acts: Array.from({ length: 8 }, () => ({ title: 'x' })) }); ok(evaluate(spam).score <= 100, 'score ≤ 100');
ok(evaluate(cur).dims.every(d => d.pts <= d.max && d.pts >= 0), 'dimension points within bounds');
ok(!canExport(emptyPf()) && canExport({ name: 'A', acts: [{ title: 'x' }] }), 'canExport');

/* ---- HTML ---- */
const xss = normalize({ name: '<img src=x onerror=alert(1)>', headline: '"><script>1</script>', acts: [{ title: '</style><script>x</script>', what: '<b>bold</b>', url: 'https://ok.io/a?b=1&c=2' }], links: [{ l: '<i>', u: 'https://a.io' }], tests: [{ name: 'SAT', score: '1500' }] });
for (const tpl of ['ledger', 'rail', 'folio']) for (const lang of ['en', 'uz', 'ru']) {
  const h = docHTML({ ...xss, tpl, lang }); ok(!/<script/i.test(h.replace(/<script[^>]*src/g, '')) && !/<img src=x/.test(h), `no injected tags (${tpl}/${lang})`);
  ok(h.includes('&lt;script&gt;') || h.includes('&lt;img'), `escaped (${tpl}/${lang})`); ok(h.includes('noindex') && h.includes('@page'), `print doc has noindex + @page (${tpl})`); ok(h.includes(`lang="${lang}"`), 'html lang');
}
const web = docHTML(xss, {}, { mode: 'web' }); ok(web.includes('Built with UniDoue') && web.includes('noindex') && !web.includes('@page'), 'web mode');
ok(!/&amp;amp;/.test(web) && web.includes('b=1&amp;c=2'), 'url ampersand escaped once');
const withImg = docHTML(normalize({ name: 'A', acts: [{ title: 'x' }], att: [{ id: 'z', cap: 'Cert <1>' }] }), { z: { url: 'data:image/jpeg;base64,/9j/AAAA', w: 4, h: 3 } }, { mode: 'web' });
ok(withImg.includes('id="lb0"') && withImg.includes('Cert &lt;1&gt;'), 'gallery with lightbox and escaped caption');
ok(esc(`<>&"'`) === '&lt;&gt;&amp;&quot;&#39;', 'esc'); ok(/^[a-z0-9-]+-portfolio$/.test(fileBase({ name: 'Abdullo Karimov-Oʻgʻli' })) && fileBase({}) === 'portfolio-portfolio', 'fileBase');

/* ---- ZIP / DOCX ---- */
const parseZip = u8 => {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; ok(e >= 0, 'EOCD found');
  const cnt = dv.getUint16(e + 10, true); let off = dv.getUint32(e + 16, true); const out = {};
  for (let i = 0; i < cnt; i++) {
    ok(dv.getUint32(off, true) === 0x02014b50, 'central header sig'); const flag = dv.getUint16(off + 8, true), meth = dv.getUint16(off + 10, true), crc = dv.getUint32(off + 16, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
    const name = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nl)); ok(meth === 0 && (flag & 0x800) !== 0, 'stored + utf8 flag');
    ok(dv.getUint32(lo, true) === 0x04034b50, 'local header sig'); const lnl = dv.getUint16(lo + 26, true), lxl = dv.getUint16(lo + 28, true), data = u8.subarray(lo + 30 + lnl + lxl, lo + 30 + lnl + lxl + csz);
    ok(crc32(data) === crc, 'crc matches ' + name); out[name] = data; off += 46 + nl + xl + cl;
  } return out;
};
ok(crc32(new TextEncoder().encode('123456789')) === 0xCBF43926, 'crc32 check value');
const z = parseZip(zip([{ name: 'a/ž.txt', data: 'héllo' }, { name: 'b.bin', data: new Uint8Array([1, 2, 3]) }])); eq(Object.keys(z), ['a/ž.txt', 'b.bin'], 'zip names (utf8)'); eq(new TextDecoder().decode(z['a/ž.txt']), 'héllo', 'zip content');

const JPG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AB//Z';
const pfd = normalize({ lang: 'uz', name: 'Abdullo <&> Karimov', headline: 'H', photo: JPG, city: 'Toshkent', email: 'a@b.co', links: [{ l: 'GH', u: 'https://github.com/a' }], summary: 'Sum', edu: [{ school: 'Maktab 110', program: '11-sinf', from: '2022', to: '2026', gpa: '4.8' }], tests: [{ name: 'SAT', score: '1480', date: '2025' }],
  acts: [{ title: 'Klub', org: 'Maktab', role: 'Asoschi', from: '2024', hours: 6, what: 'Bot yaratdi.\n- 430 o‘quvchi' }], awards: [{ title: 'Olimpiada', year: '2025', level: 'regional', issuer: 'VM' }], projects: [{ title: 'ShopCRM', url: 'https://x.io/crm', what: 'CRM' }], skills: ['Python'], langs: [{ n: 'Uzbek', lv: 'native' }], targets: ['MIT'], att: [{ id: 'c1', cap: 'Sertifikat' }] });
const bytes = docxBytes(pfd, { c1: { url: JPG, w: 1, h: 1 } }); ok(bytes instanceof Uint8Array && bytes[0] === 0x50 && bytes[1] === 0x4b, 'docx is a zip');
const dz = parseZip(bytes), names = Object.keys(dz);
for (const need of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/_rels/document.xml.rels', 'word/styles.xml', 'docProps/core.xml']) ok(names.includes(need), 'docx has ' + need);
ok(names.filter(x => x.startsWith('word/media/')).length === 2, 'docx embeds photo + certificate');
const docx = new TextDecoder().decode(dz['word/document.xml']);
ok(docx.includes('Abdullo &lt;&amp;&gt; Karimov') && !docx.includes('<&>'), 'docx text escaped'); ok(docx.includes('2024–hozir'), 'ongoing activity range in docx'); ok(docx.includes('https://x.io/crm'), 'project url in docx'); ok(docx.includes('w:pStyle w:val="Heading2"'), 'docx uses Heading2');
ok((docx.match(/<w:tbl>/g) || []).length === 2 && docx.split('<w:tr>').length - 1 === 2, 'docx header + gallery tables');
for (const [k, v] of Object.entries(dz)) if (/\.(xml|rels)$/.test(k)) { const t = new TextDecoder().decode(v); const opens = (t.match(/<(?!\?|\/|!)[^>]*[^/]>/g) || []).length, closes = (t.match(/<\/[^>]+>/g) || []).length; ok(opens === closes, `balanced tags in ${k} (${opens}/${closes})`); }

/* ---- dizayn tizimi: tarif cheklovi ---- */
const PRO_DZ = { tpl: 'noir', accent: '#123456', dz: { ...defaultDz(), acc2: '#abcdef', font: 'mono', bg: 'aurora', fx: ['reveal', 'count', 'spot', 'tilt', 'glow'], mode: 'dark', shape: 'round', dens: 'compact' } };
const eFree = effective(PRO_DZ, 'free'), ePlus = effective(PRO_DZ, 'plus'), ePro = effective(PRO_DZ, 'pro');
eq([eFree.tpl, eFree.dz.font, eFree.dz.bg, eFree.dz.fx, eFree.dz.mode, eFree.dz.shape, eFree.dz.dens], ['rail', 'auto', 'none', ['reveal'], 'tpl', 'soft', 'cozy'], 'free: Pro tanlovlari eng yaqin ruxsat etilganga tushadi');
ok(PALETTES.slice(0, 4).some(p => p[0] === eFree.accent), 'free: rang 4 ta paletradan biriga yaqinlashtiriladi'); ok(eFree.dz.acc2 === PALETTES.find(p => p[0] === eFree.accent)[1], 'free: acc2 palitradan');
eq([ePlus.tpl, ePlus.dz.font, ePlus.dz.bg, ePlus.dz.fx, ePlus.dz.mode, ePlus.dz.shape, ePlus.dz.dens], ['rail', 'auto', 'none', ['reveal', 'count'], 'dark', 'soft', 'cozy'], 'plus: faqat Plus darajasigacha');
eq([ePro.tpl, ePro.accent, ePro.dz.acc2, ePro.dz.font, ePro.dz.bg, ePro.dz.mode, ePro.dz.shape, ePro.dz.dens, ePro.dz.fx.length], ['noir', '#123456', '#abcdef', 'mono', 'aurora', 'dark', 'round', 'compact', 5], 'pro: hammasi saqlanadi, ixtiyoriy ranglar ham');
ok(['ledger', 'rail'].every(k => allow('free').tpls.includes(k)) && allow('free').tpls.length === 2 && allow('plus').tpls.length === 5 && allow('pro').tpls.length === 8, 'shablonlar soni: 2 / 5 / 8');
ok(allow('free').palettes.length === 4 && allow('plus').palettes.length === 10 && allow('pro').palettes.length === 16, 'ranglar soni: 4 / 10 / 16'); ok(!allow('free').custom && !allow('plus').custom && allow('pro').custom, 'ixtiyoriy rang faqat Pro'); ok(!allow('plus').ai && allow('pro').ai, 'AI dizayner faqat Pro');
ok(lockedCount('free') > lockedCount('plus') && lockedCount('plus') > lockedCount('pro') && lockedCount('pro') === 0, 'yopiq variantlar soni tarif oshgan sari kamayadi');
eq(effective({ tpl: 'nova' }, undefined).tpl, 'rail', 'tarif berilmasa Free hisoblanadi'); eq(effective({ tpl: 'nova' }, 'bogus').tpl, 'rail', 'notanish tarif Free');
ok(Object.keys(BGS).length === 11 && Object.keys(FXS).length === 9 && Object.keys(FONTS).length === 7 && TPLS.length === 8, 'katalog hajmi');
for (const k of Object.keys(BGS)) ok(effective({ tpl: 'ledger', dz: { bg: k } }, 'free').dz.bg === (BGS[k] === 0 ? k : 'none'), `free fon cheklovi: ${k}`);
const dirty = cleanDz({ acc2: 'red', font: '__proto__', bg: 'constructor', fx: ['reveal', 'reveal', 'hack', '<b>', 7], mode: 'x', dens: null, shape: [] });
eq(dirty, defaultDz(), 'cleanDz: iflos qiymatlar standartga'); eq(cleanDz({ fx: ['reveal', 'reveal', 'count'] }).fx, ['reveal', 'count'], 'cleanDz: takrorlar olinadi'); eq(cleanDz(null), defaultDz(), 'cleanDz(null)');
const dd = designFromAI({ template: 'nova', accent: '#5b3df5', accent2: '#ff5fa2', font: 'grotesk', bg: 'aurora', fx: ['reveal', 'spot', 'nope'], mode: 'dark', shape: 'round', density: 'cozy', why: '<b>x</b>\n' + 'y'.repeat(400) }, 'pro');
eq([dd.tpl, dd.accent, dd.dz.acc2, dd.dz.bg, dd.dz.fx], ['nova', '#5b3df5', '#ff5fa2', 'aurora', ['reveal', 'spot']], 'AI taklifi oq roʻyxatdan oʻtadi'); ok(dd.why.length <= 240 && !/[<>]/.test(dd.why), 'AI sababi tozalangan');
eq(designFromAI({ template: '<script>', accent: 'javascript:1', font: 'comic' }, 'pro').tpl, 'ledger', 'AI notoʻgʻri shablon → ledger'); eq(designFromAI({ template: 'nova', accent: '#5b3df5' }, 'free').tpl, 'rail', 'AI taklifi Free tarifda ham cheklanadi'); eq(designFromAI(null).tpl, 'ledger', 'AI null → xavfsiz');
eq(normalize({ dz: { bg: 'aurora', fx: ['spot'] } }).dz.bg, 'aurora', 'normalize dz ni saqlaydi (cheklov renderda)'); eq(normalize({ dz: 'x' }).dz, defaultDz(), 'normalize buzuq dz');
eq(normalize(normalize({ dz: { mode: 'dark' } })), normalize({ dz: { mode: 'dark' } }), 'dz bilan normalize idempotent');

/* ---- dizayn tizimi: 8 shablon × 2 rejim render ---- */
const full = normalize({ name: 'Aziza K', headline: 'CS', city: 'Tashkent', email: 'a@b.uz', links: [{ l: 'GH', u: 'github.com/a' }], summary: 'Hello', skills: ['Py', 'C', 'JS', 'SQL'], langs: [{ n: 'EN', lv: 'C1' }], targets: ['MIT'], edu: [{ school: 'L1', gpa: '4.9' }], tests: [{ name: 'SAT', score: '1500' }], acts: [{ title: 'Club', what: 'Did X', result: '12 people' }], awards: [{ title: 'Gold', year: '2024', level: 'national' }], projects: [{ title: 'P', what: 'built' }], att: [{ id: 'z', cap: 'C' }] });
const imgs = { z: { url: 'data:image/jpeg;base64,/9j/AAAA' } };
for (const t of TPLS) for (const mode of ['print', 'web']) {
  const h = docHTML({ ...full, tpl: t, dz: { ...defaultDz(), bg: 'aurora', fx: Object.keys(FXS), mode: 'system' } }, imgs, { mode, plan: 'pro', js: 'window.x=1;</script><b>' });
  ok(!/undefined|NaN|\[object/.test(h), `${t}/${mode}: render nopok qiymatlarsiz`); ok(h.includes('Aziza K') && h.includes(`t-${t}`), `${t}/${mode}: sinf va kontent`);
  if (mode === 'web') { ok(h.includes('fx-spot') && h.includes('class="th"') && h.includes('<h1') && h.includes('id="gallery"'), `${t}: veb effektlar, rejim tugmasi, galereya`); ok(!h.includes('window.x=1;</script>'), `${t}: skript </script> dan himoyalangan`); ok(h.split('<script>').length === 2, `${t}: bitta skript`); }
  else ok(h.includes('@page') && h.includes('html{min-height:100%;background:'), `${t}: A4 + sahifa foni`);
}
const wFree = docHTML({ ...full, tpl: 'noir', dz: { ...defaultDz(), bg: 'aurora', fx: Object.keys(FXS), mode: 'dark' } }, imgs, { mode: 'web' });
const hc = h => (h.match(/<html[^>]*class="([^"]*)"/) || [])[1] || '', bc = h => (h.match(/<body class="([^"]*)"/) || [])[1] || '';
ok(bc(wFree).includes('t-rail') && hc(wFree) === 'fx-reveal' && !wFree.includes('class="th"') && bc(wFree).includes('b-none'), 'Free: veb-sayt cheklangan (rail, fon yoʻq, faqat reveal, rejim tugmasi yoʻq)');
ok(!docHTML(full, imgs, { mode: 'web', plan: 'plus', jsSrc: '/js/pfweb.js' }).includes('<script>') && docHTML(full, imgs, { mode: 'web', jsSrc: '/js/pfweb.js' }).includes('src="/js/pfweb.js"'), 'jsSrc → <script src> (CSP uchun)');
ok(!/<script/i.test(docHTML(full, imgs, { mode: 'print', plan: 'pro' })), 'A4 hujjatda skript yoʻq');
const wx = docHTML(normalize({ name: '</style><img src=x onerror=1>', headline: '"><svg onload=1>', summary: "'\"<b>", skills: ['<i>'], acts: [{ title: '<u>' }], dz: { fx: ['reveal', 'type', 'marquee', 'count'] } }), {}, { mode: 'web', plan: 'pro' });
ok(!/<img src=x|<svg onload|<u>/.test(wx) && wx.includes('&lt;/style&gt;') && wx.includes('&lt;i&gt;') && wx.includes('&lt;u&gt;'), 'veb: foydalanuvchi matni XSS ga qarshi');
ok(/@media\(prefers-reduced-motion:reduce\)/.test(webCSS(effective(full, 'pro'))) && /@media print/.test(webCSS(effective(full, 'pro'))), 'veb CSS: reduced-motion va print');
for (const t of TPLS) { ok(webCSS({ tpl: t, accent: '#2745e8', dz: { ...defaultDz(), bg: 'blueprint' } }).includes('--bg:'), `${t}: webCSS`); ok(printCSS(t, 'ledger').includes('@page'), `${t}: printCSS`); }
const js = readFileSync(new URL('../public/js/pfweb.js', import.meta.url), 'utf8');
ok(!/eval\(|new Function|document\.write|innerHTML|XMLHttpRequest|fetch\(/.test(js) && js.includes("'use strict'"), 'pfweb.js: xavfli chaqiruvlarsiz, strict');
try { new Function(js); ok(true, 'pfweb.js sintaksisi'); } catch (e) { ok(false, 'pfweb.js sintaksisi: ' + e.message); }
const dxFree = docxBytes({ ...full, accent: '#123456', tpl: 'noir' }, {}, 'free'), dxPro = docxBytes({ ...full, accent: '#123456', tpl: 'noir' }, {}, 'pro');
ok(new TextDecoder().decode(parseZip(dxPro)['word/document.xml']).includes('123456') && !new TextDecoder().decode(parseZip(dxFree)['word/document.xml']).includes('123456'), 'Word: rang tarifga qarab (Free paletaga yaqinlashadi, Pro oʻzi)');

/* ---- tarif shishasi (Free muz, Plus kumush, Pro oltin+toj) ---- */
ok(['free', 'plus', 'pro'].every(p => tierPill(p).includes(`data-tier="${p}"`) && tierPill(p).includes(`#ti-${p}`) && tierMedal(p).includes(`data-tier="${p}"`)), 'tiers: pill va medalyon har tarif uchun');
ok(tierPill('hack"><b>').includes('data-tier="free"') && !tierPill('x').includes('<b>') && tierIcon('zzz').includes('#ti-free'), 'tiers: nomaʼlum tarif → free (inyeksiya yoʻq)');
eq([tierOf(0), tierOf(1), tierOf(2), tierOf(5)], ['free', 'plus', 'pro', 'pro'], 'tiers: tierOf 0/1/2');
ok(crownHTML().includes('#tc-crown') && crownHTML().includes('aria-hidden="true"') && Object.keys(TIER_TAG).join() === Object.keys(TIER_NAME).join(), 'tiers: toj va taglavhalar');
const tj = readFileSync(new URL('../public/js/tiers.js', import.meta.url), 'utf8'), tcss = readFileSync(new URL('../public/tiers.css', import.meta.url), 'utf8');
ok(!/(?:stop-color|fill|stroke)="#(?:[0-9a-fA-F]{1,2}|[0-9a-fA-F]{4,5}|[0-9a-fA-F]{7,})"/.test(tj) && ['tg-gold', 'tg-gold2', 'tg-ruby', 'tg-sap', 'ti-free', 'ti-plus', 'ti-pro', 'tc-crown', 'tc-spark'].every(id => tj.includes(`id="${id}"`)), 'tiers.js: sprite idlari va rang kodlari toʻgʻri');
ok(!/eval\(|innerHTML\s*=\s*[a-z]+\.value|document\.write/.test(tj), 'tiers.js: xavfli chaqiruvlarsiz');
ok((tcss.match(/{/g) || []).length === (tcss.match(/}/g) || []).length, 'tiers.css: qavslar muvozanatda');
ok(['free', 'plus', 'pro'].every(t => tcss.includes(`[data-tier=${t}],.tier-${t}{`) && tcss.includes(`html[data-theme=dark] [data-tier=${t}],.side [data-tier=${t}]{`)) && /prefers-reduced-motion:reduce/.test(tcss) && /backdrop-filter/.test(tcss), 'tiers.css: 3 tarif ranglari, qorongʻi variant, reduced-motion, shisha');
/* ---- fon chokini (Noir) va uzun matn regressiyasi ---- */
for (const t of TPLS) for (const bg of Object.keys(BGS)) for (const fam of ['ledger', 'rail', 'folio']) {
  const pb = pageBg(t, fam, bg, '#2745e8');
  if (!(pb.startsWith('html{min-height:100%;background:') && (pb.match(/\(/g) || []).length === (pb.match(/\)/g) || []).length)) { ok(false, `pageBg ${t}/${fam}/${bg}: min-height va qavslar`); break; }
}
ok(true, 'pageBg: barcha shablon/fon/oila uchun html{min-height:100%} va qavslar muvozanati');
const nb = pageBg('noir', 'rail', 'dots', '#2745e8');
ok((nb.match(/transparent\) no-repeat/g) || []).length === 2 && /transparent 68mm 100%\) no-repeat/.test(nb) && /1\.4px\) 0 0\/20px 20px,#080b13\}$/.test(nb), 'Noir: yoritish dogʻlari va yon panel no-repeat, pikselli naqsh takrorlanadi (sahifa oxirida chok yoʻq)');
ok(/^radial-gradient\(\d+%/.test(bgLayers('aurora', '#2745e8', true).l[0]) && bgLayers('aurora', '#2745e8', true).l.filter(x => /^radial-gradient\(\d+%/.test(x)).every(x => x.endsWith('no-repeat')), 'aurora: barcha radial qatlamlar no-repeat');
ok(!bgLayers('dots', '#2745e8', true).l.some(x => /^radial-gradient\(\d+%/.test(x)), 'dots: pikselli naqsh takrorlanishda qoladi');
ok(/body\{[^}]*overflow-wrap:anywhere/.test(printCSS('noir', 'rail')) && !/\.ct span\{white-space:nowrap/.test(printCSS('ledger', 'ledger')), 'A4: uzun URL/email sahifadan chiqib ketmaydi (overflow-wrap, nowrap yoʻq)');
ok(/body\{[^}]*overflow-wrap:anywhere/.test(webCSS({ tpl: 'noir', accent: '#2745e8', dz: defaultDz() })), 'veb: body overflow-wrap:anywhere');
/* ---- AI mentor (Doue): jonli mentor olib tashlangan, yangi chat dizayni joyida ---- */
const v3 = readFileSync(new URL('../public/js/views3.js', import.meta.url), 'utf8'), acss = readFileSync(new URL('../public/app.css', import.meta.url), 'utf8'), cj = readFileSync(new URL('../public/js/core.js', import.meta.url), 'utf8');
ok(!/Jonli mentor|api\/request|id="rq-/.test(v3) && !/\.bub\b|\.chat\{/.test(acss), 'mentor: jonli mentor formasi va eski .bub/.chat olib tashlangan');
ok(/export const MENTOR = 'Doue'/.test(cj) && /export const mentorAvatar/.test(cj) && v3.includes('mentorAvatar(') && v3.includes("tool: 'mentor'") && v3.includes('mc-retry') && v3.includes('ev.shiftKey'), 'mentor: Doue avatari, qayta urinish va Shift+Enter');
ok(['.dv{', '.mc{', '.mc-log{', '.mc-in{', '.mc-sug', '.mc-tool{', '.mc-caret'].every(k => acss.includes(k)) && (acss.match(/{/g) || []).length === (acss.match(/}/g) || []).length, 'mentor: app.css Doue uslublari va qavslar muvozanati');
const em = new Set(), ico = cj.slice(cj.indexOf('export const ico'), cj.indexOf('};', cj.indexOf('export const ico'))), dup = []; for (const m of ico.matchAll(/(?:^|[\s,{])([a-z]+): '/g)) { if (em.has(m[1])) dup.push(m[1]); em.add(m[1]); }
ok(['send', 'plus', 'copy', 'tick', 'compass', 'doc', 'target', 'spark', 'arrow', 'flag'].every(k => em.has(k)) && !dup.length, 'core.js: ikonkalar takrorlanmaydi' + (dup.length ? ': ' + dup : ''));
/* ---- “Yo‘l daftari” dizayni (atlas.css, contour.svg, marshrut, SAT o‘lchagich) ---- */
const acs = readFileSync(new URL('../public/atlas.css', import.meta.url), 'utf8'), csvg = readFileSync(new URL('../public/contour.svg', import.meta.url), 'utf8'), v1 = readFileSync(new URL('../public/js/views1.js', import.meta.url), 'utf8'), v2 = readFileSync(new URL('../public/js/views2.js', import.meta.url), 'utf8'), mj = readFileSync(new URL('../public/js/main.js', import.meta.url), 'utf8'), html0 = readFileSync(new URL('../public/app.html', import.meta.url), 'utf8');
ok((acs.match(/{/g) || []).length === (acs.match(/}/g) || []).length && ['.route{', '.rt-done{', '.satm-t{', '.nav::before{', '.auth-route', '.page-h::after', '.score{', '.dh{', '.uc::after{'].every(k => acs.includes(k)), 'atlas.css: qavslar muvozanatda va asosiy komponentlar bor');
ok(/url\(\/contour\.svg\)/.test(acs) && /prefers-reduced-motion:no-preference/.test(acs) && !/@import|url\(https?:/.test(acs), 'atlas.css: xarita foni mahalliy fayldan, harakat “kamaytirish” rejimiga bo‘ysunadi, tashqi resurssiz');
ok(/^<svg[^>]+viewBox/.test(csvg) && csvg.length < 60000 && !/<script|on\w+=|href=/i.test(csvg), 'contour.svg: toza SVG (skriptsiz), 60 KB dan kichik');
ok(html0.indexOf('/app.css') < html0.indexOf('/atlas.css') && html0.indexOf('/atlas.css') < html0.indexOf('/tiers.css'), 'app.html: atlas.css app.css dan keyin, tiers.css dan oldin');
ok(/function journey\(/.test(v1) && /function nextStep\(/.test(v1) && v1.includes('rt-pt') && (v1.match(/const RTP = \[(\[\d+, \d+\],? ?){5}\]/) || []).length === 2 && v1.includes("nextStep(j.now"), 'bosh panel: 5 bekatli marshrut va “keyingi qadam” hisobi');
ok(/function satMeter\(/.test(v2) && v2.includes('satm-me') && /PAGE = 12/.test(v2) && v2.includes('data-more'), 'qidiruv: SAT o‘lchagich va bosqichma-bosqich ko‘rsatish');
ok(/export const STAR =/.test(cj) && mj.includes('${STAR}') && mj.includes('sf-av') && mj.includes('auth-route') && mj.includes('nav-links'), 'qobiq: yulduz logotipi, foydalanuvchi kartasi, kirish ekrani yangi markupda');
/* ---- Kun/tun almashtirgich (kontur, quyosh/oy, almashtirish animatsiyasi) ---- */
const appcss = readFileSync(new URL('../public/app.css', import.meta.url), 'utf8'), tui = readFileSync(new URL('../public/js/theme-ui.js', import.meta.url), 'utf8'), thj = readFileSync(new URL('../public/js/theme.js', import.meta.url), 'utf8'), adm = readFileSync(new URL('../public/admin.html', import.meta.url), 'utf8');
ok((appcss.match(/{/g) || []).length === (appcss.match(/}/g) || []).length && ['.ts-bg','.ts-ct','.ts-st','.ts-cl','@keyframes tsw-sq','@keyframes tsw-ring','@keyframes tsw-shoot','.tsw-go '].every(k => appcss.includes(k)), 'app.css: almashtirgich qatlamlari va animatsiya kalitlari bor, qavslar muvozanatda');
ok(/@media\(prefers-reduced-motion:no-preference\)\{[^]*@keyframes tsw-sq/.test(appcss) && !/url\(https?:/.test(appcss.slice(appcss.indexOf('.theme-sw{position'), appcss.indexOf('.tsw-go .theme-sw .ts-knob'))), 'almashtirgich animatsiyasi harakatni kamaytirish rejimiga bo‘ysunadi, tashqi resurssiz');
ok(tui.includes('ts-bg') && tui.includes('ts-ct') && tui.includes('ts-st') && tui.includes('ts-cl') && (adm.match(/class="ts-bg"/g) || []).length === 2, 'almashtirgich markupi (ilova va admin) bir xil qatlamlarga ega');
ok(thj.includes("'tsw-go'") && /remember\) \{ root\.classList\.add\('tsw-go'\)/.test(thj) && thj.includes('startViewTransition'), 'theme.js: bosilganda .tsw-go beriladi va aylana yoyilishi saqlangan');
/* ---- Tanishtiruv sahifasi (landing): yer shari, parallaks, kirish/ro‘yxat tugmalari ---- */
const { LAND, PLACES, HOME } = await import('../public/js/globe_data.js');
const lph = readFileSync(new URL('../public/landing.html', import.meta.url), 'utf8'), lpc = readFileSync(new URL('../public/landing.css', import.meta.url), 'utf8'), lpj = readFileSync(new URL('../public/js/landing.js', import.meta.url), 'utf8'), glj = readFileSync(new URL('../public/js/globe.js', import.meta.url), 'utf8');
const lbytes = Buffer.from(LAND, 'base64'); let land = 0; for (const b of lbytes) for (let k = 0; k < 8; k++) land += (b >> k) & 1;
ok(lbytes.length === 360 * 180 / 8 && land > 15000 && land < 30000, 'globe_data: 1° quruqlik bitmaskasi 360×180 (8100 bayt), quruqlik ulushi o‘rinli');
ok(PLACES.length >= 24 && PLACES.every(p => typeof p[0] === 'string' && Math.abs(p[1]) <= 90 && Math.abs(p[2]) <= 180 && [1, 2, 3].includes(p[3])) && new Set(PLACES.map(p => p[0])).size === PLACES.length && HOME.n === 'Toshkent' && Math.abs(HOME.lat - 41.3) < 0.1, 'globe_data: universitetlar noyob, koordinatalar to‘g‘ri, uy nuqtasi Toshkent');
const cu = JSON.parse(readFileSync(new URL('../public/data/universities.json', import.meta.url), 'utf8')), ci = JSON.parse(readFileSync(new URL('../public/data/intl.json', import.meta.url), 'utf8'));
const stN = k => +(lph.match(new RegExp(`<b data-n="(\\d+)">\\d+</b><span>${k}</span>`)) || [])[1];
ok(stN('universitet') === cu.length + ci.length && stN('davlat') === new Set([...cu, ...ci].map(x => x.country)).size, `landing: statistika ma’lumotlarga mos (${cu.length + ci.length} universitet, ${new Set([...cu, ...ci].map(x => x.country)).size} davlat)`);
ok(lph.includes('class="lp-h1"') && lph.includes('href="/app?m=register"') && lph.includes('href="/app" data-auth="in"') && lph.includes('id="lp-cv"') && ['features', 'how', 'demo', 'pricing', 'faq'].every(i => lph.includes(`id="${i}"`)) && !/<script(?![^>]*src=)[^>]*>/.test(lph), 'landing.html: kirish/ro‘yxat tugmalari, bo‘limlar bor, inline skript yo‘q (CSP)');
ok((lph.match(/<details/g) || []).length >= 6 && (lph.match(/class="lp-step[" ]/g) || []).length === 5 && (lph.match(/class="lp-pane"/g) || []).length === 5 && (lph.match(/class="lp-fc/g) || []).length === 6, 'landing.html: 6 savol, 5 qadam/oyna, 6 imkoniyat kartasi');
ok((lpc.match(/{/g) || []).length === (lpc.match(/}/g) || []).length && /prefers-reduced-motion:(no-preference|reduce)/.test(lpc) && !/@import|url\(https?:/.test(lpc) && lpc.includes('minmax(0,1fr)') && !/grid-template-columns:1fr[;}]/.test(lpc), 'landing.css: qavslar muvozanatda, harakat kamaytirish rejimi bor, grid minmax(0,1fr) (telefonda sahifa kengaymaydi)');
ok(/export function createGlobe/.test(glj) && glj.includes('prefers-reduced') === false && /still/.test(glj) && glj.includes('IntersectionObserver') && glj.includes('pointerdown') && /export const (LAND|PLACES)|import \{[^}]*LAND[^}]*\} from '\.\/globe_data\.js'/.test(glj), 'globe.js: createGlobe, sudrab aylantirish, ko‘rinmaganda to‘xtash, still rejimi');
ok(lpj.includes("import { createGlobe }") && lpj.includes("'/api/me'") && lpj.includes('display-mode: standalone') && lpj.includes("location.replace('/app'") && lpj.includes('prefers-reduced-motion'), 'landing.js: globus, kirgan foydalanuvchi aniqlanadi, o‘rnatilgan ilova (PWA) to‘g‘ridan-to‘g‘ri /app ga o‘tadi');
ok(mj.includes("get('m') === 'register'") && readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8').includes('"start_url": "/app"'), 'main.js: ?m=register ro‘yxat ekranini ochadi; manifest start_url /app');
/* ---- Promo kodlar: Tariflar qatori, admin bo‘limi; scrollbarlar va gorizontal siljish ---- */
const adh = readFileSync(new URL('../public/admin.html', import.meta.url), 'utf8'), adj = readFileSync(new URL('../public/js/admin.js', import.meta.url), 'utf8'), adc = readFileSync(new URL('../public/admin.css', import.meta.url), 'utf8'), swj = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
ok(v1.includes('function promoBox(') && v1.includes('function promoBind(') && v1.includes("'/api/promo/redeem'") && (v1.match(/\$\{promoBox\(\)\}/g) || []).length === 2 && (v1.match(/promoBind\(el\)/g) || []).length === 3 && v1.includes('id="promo-i"'), 'tariflar: promo kod qatori ikkala ko‘rinishda ham bor va ulangan');
ok(['.promo{', '.promo-ic{', '.promo-in{', '.promo.ok{'].every(k => acs.includes(k)) && (acs.match(/{/g) || []).length === (acs.match(/}/g) || []).length && html0.includes('/atlas.css?v=63'), 'atlas.css: promo qatori uslublari bor, qavslar muvozanatda, versiya yangilangan');
ok(adh.includes('data-v="promos"') && adh.includes('id="v-promos"') && ['mk', 'mp', 'md', 'mx', 'mu', 'mn', 'mb', 'ml'].every(i => adh.includes(`id="${i}"`)) && /promos: 'Promo kodlar'/.test(adj) && ['/api/admin/promos', '/api/admin/promo', '/api/admin/promo/set', '/api/admin/promo/delete'].every(u => adj.includes(`'${u}'`)) && (adc.match(/{/g) || []).length === (adc.match(/}/g) || []).length && adc.includes('.pm-form{'), 'admin: Promo kodlar bo‘limi (forma, ro‘yxat, to‘xtatish, limit, o‘chirish)');
ok(swj.includes("'unidoue-v81'") && !/<script(?![^>]*src=)[^>]*>/.test(adh), 'sw: v60; admin.html: inline skript yo‘q');
const cssFiles = ['app.css', 'atlas.css', 'coach.css', 'portfolio.css', 'tiers.css', 'landing.css', 'admin.css', 'controls.css'].map(f => [f, readFileSync(new URL('../public/' + f, import.meta.url), 'utf8')]);
const sbBad = cssFiles.filter(([f, c]) => /scrollbar-(width|color)/.test(f === 'app.css' ? c.replace(/@supports not selector\(::-webkit-scrollbar\)\{[^}]*\}[^}]*\}/, '') : c)).map(x => x[0]);
ok(sbBad.length === 0 && acss.includes('*::-webkit-scrollbar-thumb{') && acss.includes('@supports not selector(::-webkit-scrollbar)'), 'scrollbar: yagona uslub (app.css); boshqa joyda scrollbar-width/color yo‘q — Chrome ::-webkit-scrollbar uslubini o‘chirib qo‘yadi' + (sbBad.length ? ': ' + sbBad : ''));
const ccss = cssFiles.find(x => x[0] === 'coach.css')[1], pcss = cssFiles.find(x => x[0] === 'portfolio.css')[1], tcs2 = cssFiles.find(x => x[0] === 'tiers.css')[1];
ok(/\.cc-rail\{[^}]*grid-template-columns:minmax\(0,1fr\)[^}]*overflow-x:hidden/.test(ccss) && /\.cc-set>summary\{[^}]*display:block[^}]*text-overflow:ellipsis/.test(ccss) && /\.pf-aside\{[^}]*overflow-x:hidden/.test(pcss) && /\.tier-stage::before\{inset:0 -12px/.test(tcs2), 'gorizontal siljish: Esse murabbiyi/Portfolio yon paneli va tarif yorug‘ligi tuzatilgan');
/* ---- Bildirishnomalar (qo‘ng‘iroqcha, admin xabar yuborish, obunani bekor qilish) ---- */
const rdf = f => readFileSync(new URL('../public/' + f, import.meta.url), 'utf8');
const ntj = rdf('js/notes.js'), uij = rdf('js/ui.js'), ctl = cssFiles.find(x => x[0] === 'controls.css')[1], usj = rdf('js/unsub.js'), ush = rdf('unsub.html'), mj2 = rdf('js/main.js'), srv = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
ok(ntj.includes("'/api/notes'") && ntj.includes("'/api/notes/read'") && ntj.includes("'/api/notes/mail'") && ntj.includes('export function bellHTML') && ntj.includes('export function bindBell') && ntj.includes("aria-haspopup") && ntj.includes("'Escape'") && /api\('\/api\/notes'\)/.test(ntj), 'notes.js: panel API, qo‘ng‘iroqcha, Esc bilan yopiladi, ARIA');
ok(mj2.includes('${bellHTML()}') && mj2.includes('bindBell()') && mj2.includes("import { setTipTranslator } from './ui.js'") && acs.includes('.bell{') && acs.includes('.bell-n{') && acs.includes('.np{') && acs.includes('.nt.new') && acs.includes('prefers-reduced-motion:no-preference){.np{'), 'main.js: qo‘ng‘iroqcha sarlavhaga ulangan; atlas.css: panel uslublari, animatsiya reduced-motion ichida');
ok(['/api/notes', '/api/notes/read', '/api/notes/mail', '/api/mail/unsub', '/api/admin/notify', '/api/admin/notes', '/api/admin/note/delete'].every(u => srv.includes(`'${u}'`)) && srv.includes("'/unsub': 'unsub.html'") && srv.includes('MAIL_BULK_MAX') && srv.includes('NOTES.sigOk('), 'server.js: bildirishnoma va obuna endpointlari ulangan');
ok(adh.includes('id="nch"') && ['c-app', 'c-push', 'c-mail', 'nh-l'].every(i => adh.includes(`id="${i}"`)) && adj.includes("'/api/admin/notify'") && adj.includes("'/api/admin/notes'") && adj.includes("import '/js/ui.js'") && adh.includes('/controls.css') && !adj.includes('/api/admin/push/send\', { title, body'), 'admin: kanal tanlash (sayt ichida/push/email), tarix, ui.js ulangan');
ok(!/<script(?![^>]*src=)[^>]*>/.test(ush) && ush.includes('/js/unsub.js') && usj.includes("'/api/mail/unsub'") && usj.includes('on: !off') && !/innerHTML/.test(usj), 'unsub sahifasi: inline skript yo‘q, xavfsiz (innerHTML yo‘q), qayta yoqish bor');
ok(['.cs-b{', '.pop{', '.cs-l{', '.cal{', '.cal-d{', '.cn{', '.cn-s{', '.tip{', 'input[type=range]', 'input[type=color]', 'input[type=radio]'].every(k => ctl.includes(k)) && (ctl.match(/{/g) || []).length === (ctl.match(/}/g) || []).length && /prefers-reduced-motion:no-preference\)\{\.pop\{/.test(ctl) && !/scrollbar-(width|color)/.test(ctl), 'controls.css: select/kalendar/raqam/izoh/range/color/radio uslublari, qavslar muvozanatda, scrollbar-width yo‘q');
ok(['upgradeSelect', 'upgradeDate', 'upgradeNumber', 'upgradeCombo', 'upgradeRange', 'MutationObserver', 'aria-expanded', 'aria-activedescendant', "'Escape'", 'PageUp', 'setTipTranslator', "removeAttribute('list')"].every(k => uij.includes(k)) && uij.includes("'yanvar'") && uij.includes("new Event(t, { bubbles: true })"), 'ui.js: select/sana/raqam/combobox/range/izoh, klaviatura va ARIA, o‘zbekcha oy nomlari, asl element hodisalari');
ok(html0.includes('/controls.css') && swj.includes("'/controls.css'") && srv.includes("rel === 'controls.css'"), 'controls.css: app.html, SW keshi va server ro‘yxatiga qo‘shilgan');
/* ---- Profil rasmi (avatar) ---- */
const avj = rdf('js/avatar.js'), pfs = rdf('js/pfstore.js'), v1j = rdf('js/views1.js');
ok(avj.includes("'/api/avatar'") && avj.includes("'/api/avatar/delete'") && avj.includes('export async function pickAvatar') && avj.includes('export async function removeAvatar') && avj.includes('export function paintAvatar') && avj.includes("'unidoue:avatar'") && !/innerHTML/.test(avj) && pfs.includes('export function cropSquare'), 'avatar.js: yuklash/olib tashlash, kesish, innerHTML ishlatilmaydi');
ok(v1j.includes("from './avatar.js'") && v1j.includes('id="pp-file"') && v1j.includes('accept="image/jpeg,image/png,image/webp"') && v1j.includes('id="pp-rm"') && mj2.includes("paintAvatar($('#sf-av'))") && mj2.includes("'unidoue:avatar'"), 'profil sahifasi va yon panel avatar bilan ulangan');
ok(['.pp-avb{', '.av-crop{', '.av-ring{', '.sf-av img,.pp-av img{'].every(k => acs.includes(k)) && srv.includes("'/api/avatar'") && srv.includes("'/api/avatar/delete'") && srv.includes("require('./avatar')") && srv.includes('av: u.avatar'), 'avatar: uslublar va server endpointlari bor');
/* ---- Universitet qidiruvi: AQSh + boshqa davlatlar bitta bo‘limda ---- */
{
  const rd = f => readFileSync(new URL('../public/js/' + f, import.meta.url), 'utf8');
  const v2 = rd('views2.js'), v4 = rd('views4.js'), mn = rd('main.js');
  ok(/export async function intlTools\b/.test(v4) && !/intlPanel|intlCount/.test(v4 + v2), 'views4 exports intlTools; old intlPanel/intlCount removed');
  ok(!/export (async )?function intl\b/.test(v4), 'old intl route export removed');
  ok(/import \{[^}]*intlTools[^}]*\} from '\.\/views4\.js'/.test(v2), 'finder imports intlTools');
  ok(!/data-sc=|f-sc/.test(v2) && /id="f-c"/.test(v2) && /intl\.card\(r\.u, r\.r\)/.test(v2) && /addApp\(cat\.find\(c => c\.id === b\.dataset\.add\) \|\| intlList\.find/.test(v2), 'finder: AQSh/Boshqa davlatlar tabi yo‘q, hamma universitet bitta ro‘yxatda, davlat filtri va addApp ulangan');
  ok(!/id: 'intl'/.test(mn), 'intl is no longer a nav route');
  ok(/\^#\\\/\?intl/.test(mn) && /location\.replace\('#\/finder'\)/.test(mn), 'old #/intl link redirects to finder');
  ok(!/filtrlar rasmiy ma’lumot yig‘ilgach/.test(v2), 'outdated “filters will be added” note removed');
  ok(!/import[^\n]*views2/.test(v4), 'views4 does not import views2 (no cycle)');
}

/* ---- Boshqa davlatlar: hamma funksiyalar (moslik, solishtirish, arizalar) ---- */
{
  const rd = f => readFileSync(new URL('../public/js/' + f, import.meta.url), 'utf8');
  const v1 = rd('views1.js'), v2 = rd('views2.js'), v3 = rd('views3.js'), core = rd('core.js'), sc = readFileSync(new URL('../public/js/scoring.js', import.meta.url), 'utf8');
  ok(/export async function allUnis/.test(core) && /export async function intlCatalog/.test(core) && /export const uniOptions/.test(core), 'core: allUnis/intlCatalog/uniOptions');
  ok(/await allUnis\(\)/.test(v2) && v2.split('await allUnis()').length >= 4, 'views2: predictor/compare/about hamma davlat katalogidan');
  ok(/uniOptions\(cat\)/.test(v1) && /allUnis/.test(v1), 'tracker: hamma davlat ro‘yxati');
  ok(/allUnis/.test(v3) && !/catalog\(\)/.test(v3), 'mentor ro‘yxati: hamma davlat');
  ok(/c\.kind === 'intl'/.test(v1) && /c && c\.sat && sat < c\.sat\[0\]/.test(v1), 'roadmap: xorijiy universitet uchun SAT qadami xatosiz');
  ok(/intlFit/.test(sc) && /langKind/.test(sc), 'scoring: intlFit');
  ok(!/\$\{c\.acc\}%/.test(v2), 'aboutUni: qabul darajasi foizga o‘tkazilgan (0.044 → 4.4%)');
}

ok(/\/tiers\.css/.test(lph) && ['free', 'plus', 'pro'].every(t => lph.includes(`class="lp-pl tg`) && lph.includes(`data-tier="${t}"`)) && lph.includes('tier-stage') && /tier-plus/.test(lph) && /tier-pro/.test(lph) && /data-pr="pro"/.test(lph), 'landing: tarif kartalari ilovadagi shisha uslubida (tiers.css, medal, tier-stage)');
ok(/from '\.\/tiers\.js'/.test(lpj) && /crownHTML/.test(lpj) && /liveGlass/.test(lpj) && (lpc.match(/{/g) || []).length === (lpc.match(/}/g) || []).length, 'landing.js: toj va kursor yaltirashi, landing.css qavslari muvozanatda');
{ const co = readFileSync(new URL('../public/js/core.js', import.meta.url), 'utf8'); ok(/top = plan === 'pro'/.test(co) && /plan === 'plus' \|\| top \? 'pro'/.test(co) && /top \? \[\{ label: 'Yopish'/.test(co), 'upsell: Plus/Pro egasi uchun oyna doim Pro (oltin), Pro uchun faqat «Yopish»'); }
{ const idata = JSON.parse(readFileSync('public/data/intl.json', 'utf8')), eth = idata.find(u => u.n === 'ETH Zurich'), kaist = idata.find(u => u.n === 'KAIST');
  ok(!!eth && eth.ielts == null && !!eth.ieltsNote && !!eth.ieltsNote.uz && !!eth.ieltsNote.ru && /^https:/.test(eth.ieltsNoteUrl), 'intl: ETH Zurich IELTS izohi (nemis tili) bor, soxta IELTS yo‘q');
  ok(!!kaist && kaist.ielts === 6.5 && /^https:/.test(kaist.ieltsUrl) && kaist.rd === '2027-01-14', 'intl: KAIST IELTS 6.5 va muddat rasmiy URL bilan');
  ok(idata.every(u => !u.ieltsNote || u.ielts == null), 'intl: ieltsNote faqat IELTS yo‘q bo‘lganda');
  ok(/ieltsNote/.test(readFileSync('public/js/views4.js', 'utf8')) && /ieltsNote/.test(readFileSync('public/js/views2.js', 'utf8')), 'intl: views4/views2 ieltsNote ko‘rsatadi'); }
{ const ah = readFileSync('public/admin.html', 'utf8'), aj = readFileSync('public/js/admin.js', 'utf8');
  ok(/id="v-unis"/.test(ah) && /data-v="unis"/.test(ah) && /id="un-s"/.test(ah) && !/<script(?![^>]*src=)[^>]*>/.test(ah), 'admin: Universitetlar bo‘limi bor, inline skript yo‘q');
  ok(/\/api\/admin\/uni'/.test(aj) && /\/api\/admin\/uni\/delete/.test(aj) && /unis: 'Universitetlar'/.test(aj), 'admin.js: universitet qo‘shish/o‘chirish API ga ulangan'); }
{ const v4 = readFileSync('public/js/views4.js', 'utf8'), sj = readFileSync('public/js/scoring.js', 'utf8'), ac = readFileSync('public/atlas.css', 'utf8');
  ok(/fitBox\(u\)/.test(v4) && /Moslik uchun nima kerak/.test(v4) && /Moslik darajasi/.test(v4), 'intl karta: moslik darajasi va "nima kerak" bloki bor');
  ok(/cnt/.test(sj) && /\.fitb\{/.test(ac) && /\.fitb-m i/.test(ac), 'scoring cnt + atlas.css .fitb stillari');
  const S = (await import('node:module')).createRequire(import.meta.url)('../public/js/scoring.js');
  if (S && S.intlFit) { const f = S.intlFit({ ielts: 7, lang: 'English', rd: null, ieltsNote: null }, { ielts: 6, gpa: null, sat: null }, '2026-11-23'); ok(f.status === 'part' || f.status === 'no', 'intlFit: IELTS yetmasa mos emas/qisman'); ok(f.cnt && f.cnt.bad + f.cnt.warn >= 1 && f.advice.some(a => /IELTS/.test(a)), 'intlFit: cnt va "nima kerak" maslahati'); } }
{ const S2 = (await import('node:module')).createRequire(import.meta.url)('../public/js/scoring.js'), a = S2.intlFit({ sat: 1300, lang: 'English' }, { sat: 1200, ielts: null }, '2026-11-23'), b = S2.intlFit({ sat: 1300, lang: 'English' }, { sat: 1350, ielts: null }, '2026-11-23'), c = S2.intlFit({ sat: 1300, lang: 'English' }, { sat: 1000, ielts: null }, '2026-11-23');
  ok(a.parts.some(x => x.k === 'SAT' && x.tone === 'bad') && a.advice.some(x => /SAT ni 1300/.test(x)), 'intlFit: SAT 100 ball yetmasa mos emas + maslahat');
  ok(b.parts.some(x => x.k === 'SAT' && x.tone === 'good'), 'intlFit: SAT yetarli');
  ok(c.status === 'no' && S2.intlFit({ lang: 'English' }, { sat: 1000 }, '2026-11-23').parts.every(x => x.k !== 'SAT'), 'intlFit: SAT talabi yo‘q universitetda SAT mezoni chiqmaydi');
  ok(/id="un-sat"/.test(readFileSync('public/admin.html', 'utf8')) && /sat: g\('sat'\)/.test(readFileSync('public/js/admin.js', 'utf8')), 'admin: SAT maydoni formada'); }
{
  const cj = readFileSync(new URL('../public/js/celebrate.js', import.meta.url), 'utf8'), mj = readFileSync(new URL('../public/js/main.js', import.meta.url), 'utf8'), vj = readFileSync(new URL('../public/js/views1.js', import.meta.url), 'utf8');
  const tcz = readFileSync(new URL('../public/tiers.css', import.meta.url), 'utf8');
  ok(/export function celebrate/.test(cj) && /export function seePlan/.test(cj) && /prefers-reduced-motion/.test(cj) && /aria-modal/.test(cj) && /Escape/.test(cj) && !/eval\(|document\.write/.test(cj), 'celebrate.js: dialog, Esc, harakatni kamaytirish, xavfsiz');
  ok(/ud:plan:/.test(cj) && !/'qabul:/.test(cj), 'celebrate.js: tarif belgisi serverga sinxronlanmaydigan kalitda');
  ok(['.cel{', '.cel[data-tier=pro]', '@keyframes cel-pop', '@keyframes cel-crown', 'prefers-reduced-motion:reduce'].every(x => tcz.includes(x)) && (tcz.match(/{/g) || []).length === (tcz.match(/}/g) || []).length, 'tiers.css: tabrik uslublari (kumush/oltin), qavslar muvozanatda');
  ok(/seePlan\(S\.user\.id/.test(mj) && /celebrate\(r\.plan/.test(vj), 'main.js/views1.js: tabrik ulangan (tarif oʻzgarganda va promo kodda)');
  ok(/\/api\/auth\/google\/start/.test(mj) && /ge=|'ge'/.test(mj), 'main.js: Google bilan kirish tugmasi va xato xabarlari');
  ok(/tiers\.css\?v=49/.test(html0), 'app.html: tiers.css v49');
}
{
  const fj = readFileSync(new URL('../public/js/feedback.js', import.meta.url), 'utf8'), mj2 = readFileSync(new URL('../public/js/main.js', import.meta.url), 'utf8'), acs = readFileSync(new URL('../public/atlas.css', import.meta.url), 'utf8');
  ok(/export function openFeedback/.test(fj) && /aria-modal/.test(fj) && /Escape/.test(fj) && /\/api\/feedback/.test(fj) && !/eval\(|document\.write/.test(fj), 'feedback.js: dialog, Esc, /api/feedback, xavfsiz');
  ok(/fbHTML\(\)/.test(mj2) && /bindFeedback\(\)/.test(mj2) && /fb-s-link/.test(mj2), 'main.js: fikr tugmasi sarlavhada va yon panelda');
  ok(['.fbp{', '.fbp-o.on', '.fbp-ck', '@keyframes fb-dr', 'max-width:560px'].every(x => acs.includes(x)) && (acs.match(/{/g) || []).length === (acs.match(/}/g) || []).length, 'atlas.css: fikr oynasi uslublari, qavslar muvozanatda');
  ok(/compressShot/.test(fj) && /type="file"[^>]*accept="image\/jpeg,image\/png,image\/webp"/.test(fj) && /onpaste/.test(fj) && /ondrop/.test(fj) && /imgs: draft\.imgs/.test(fj) && ['.fbp-add', '.fbp-i', '.fbp-dz', '.fbp.drag'].every(x => acs.includes(x)), 'feedback.js: rasm yuklash (tanlash, tashlash, Ctrl+V), uslublar');
  ok(/fbLightbox/.test(adj) && /readAsDataURL/.test(adj) && !/createObjectURL/.test(adj) && /\.fb-lb\{/.test(readFileSync(new URL('../public/admin.css', import.meta.url), 'utf8')), 'admin: fikr rasmlari data: URL bilan (CSP blob: ga ruxsat bermaydi), lightbox');
  { const pj = readFileSync(new URL('../public/js/portfolio.js', import.meta.url), 'utf8'), wc = readFileSync(new URL('../public/js/pfwebcss.js', import.meta.url), 'utf8');
    ok(/d\.body\.className = n\.body\.className/.test(pj) && /link\[rel=stylesheet\]/.test(pj), 'portfolio: A4 ko‘rinish yangilanganda body klassi (t-*, b-*) va shrift havolasi almashadi (hamma shablon bir xil chiqmasin)');
    ok(/\.t-rail \.hero \.hx,\.t-rail \.hero \.pw\{translate:none\}/.test(wc), 'yon panel: parallaks rasm va ismni bir-biriga surmaydi'); }
  ok(/function replyDlg/.test(adj) && /\/api\/admin\/reply/.test(adj) && /data-fr=/.test(adj) && /data-rr=/.test(adj) && /\.modal\.rp\{/.test(readFileSync(new URL('../public/admin.css', import.meta.url), 'utf8')) && /\.req-h\{[^}]*flex-wrap:wrap/.test(readFileSync(new URL('../public/admin.css', import.meta.url), 'utf8')), 'admin: javob yozish oynasi (fikr va soʻrovlar), kartalar telefonda sigʻadi');
  ok(/id: 'profile',[^}]*hide: 1/.test(mj2) && /id="sf-me" href="#\/profile"/.test(mj2) && /sf-me/.test(mj2.slice(mj2.indexOf('async function route'))) && acs.includes('.side-foot a.sf-row'), 'yon panel: “Profil” bandi yoʻq, hisob kartasi profilga olib boradi');
  ok(/class="nav-tg"[^>]*>\$\{svg\('tg'\)\}/.test(mj2) && /id="fb-s-link"[^>]*>\$\{svg\('chat'\)\}/.test(mj2) && !/✈|💬|✎/.test(mj2.slice(mj2.indexOf('nav-links'), mj2.indexOf('side-foot'))) && /\.nav-links\{display:grid;grid-template-columns:repeat\(3/.test(acs), 'yon panel: Telegram, Yordam, Fikr — bir qatorda ixcham belgi-tugmalar (emoji yoʻq)');
  { const ni = readFileSync(new URL('../public/js/navicons.js', import.meta.url), 'utf8'); const ids = [...mj2.matchAll(/\{ id: '(\w+)'[^}]*?i: '(\w+)'(?![^}]*hide: 1)/g)].map(m => m[1]); const shown = ids.filter(id => new RegExp('\\b' + id + ': \\[').test(ni)); const paths = [...ni.matchAll(/^  \w+: \[('[^']+'), ('[^']+')\]/gm)].map(m => m[1]);
    ok(/navIcon\(r\.id, \(\) => svg\(r\.i\)\)/.test(mj2) && /from '\.\/navicons\.js'/.test(mj2) && ids.length >= 12 && shown.length === ids.length && new Set(paths).size === paths.length && paths.length >= 12 && /\.nav a svg \.ni-a\{fill:/.test(acs) && /\[aria-current=page\] svg \.ni-a/.test(acs), 'yon menyu: har bir bo‘limning oʻz ikki qatlamli belgisi bor, belgilar takrorlanmaydi (' + paths.length + ' ta)'); }
  ok(/id="v-feedback"/.test(adh) && /data-v="feedback"/.test(adh) && /renderFeedback/.test(adj) && /\/api\/admin\/feedback/.test(adj), 'admin: Fikrlar sahifasi');
}
// Dunyo reytingi (QS 2027) va hamma davlat uchun bir xil Safety / Target / Reach
{ const rq = (await import('node:module')).createRequire(import.meta.url), S3 = rq('../public/js/scoring.js'), UN = rq('../unis.js');
  const us = JSON.parse(readFileSync('public/data/universities.json', 'utf8')), it = JSON.parse(readFileSync('public/data/intl.json', 'utf8')), all = us.concat(it), by = n => all.find(u => u.n === n);
  ok(all.filter(u => u.qs).length >= 170 && all.every(u => u.qs == null || /^=?\d+(-\d+)?$/.test(u.qs)), 'reyting: QS o‘rni ko‘p universitetda, format to‘g‘ri');
  ok(by('MIT').qs === '1' && by('University of Oxford').qs === '4' && by('University of Michigan').qs === '51' && by('Korea University').qs === '=52' && by('Heidelberg University').qs === '86' && !by('Bocconi University').qs && !by('Amherst College').qs, 'reyting: tekshirilgan qiymatlar');
  ok(UN.merge(it, { 'eth-zurich': { id: 'eth-zurich', n: 'ETH Zurich', country: 'Shveytsariya', ielts: 7 } }).find(u => u.id === 'eth-zurich').qs === by('ETH Zurich').qs, 'reyting: admin almashtirsa ham QS o‘rni saqlanadi');
  const P = S3.normProfile({ gpa: 4.6, sc: 5, sat: 1480, ielts: 7, ex: 2 }), T = '2026-11-24', F = u => S3.fit({ ...u, kind: us.includes(u) ? 'us' : 'intl' }, P, T);
  ok(us.every(u => F(u).score === S3.score(u, P) && F(u).tier === S3.tier(u, S3.score(u, P)).tier && !F(u).est && !F(u).req), 'scoring: AQSh hisobi o‘zgarmadi');
  ok(it.every(u => { const f = F(u); return Number.isInteger(f.score) && ['safety', 'target', 'reach'].includes(f.tier) && f.est && f.req && f.parts.length >= 2 && !f.confident; }), 'scoring: har bir xorijiy universitet ball, daraja va talablar oladi');
  ok(F(by('University of Cambridge')).tier === 'reach' && F(by('University of Oxford')).tier === 'reach', 'scoring: QS top-30 hamma uchun Reach');
  ok(it.filter(u => !u.qs).every(u => F(u).tier !== 'safety'), 'scoring: reytingi yo‘q universitet Safety bo‘lmaydi');
  const e1 = S3.estimate({ qs: '40' }), e2 = S3.estimate({ qs: '801-850' }); ok(e1.sat[0] > e2.sat[0] && e1.gpa > e2.gpa && e1._est && S3.rankNum('=52') === 52 && S3.rankNum('1001-1200') === 1001, 'scoring: o‘rin yuqori → ko‘rsatkich yuqori');
  const v2 = readFileSync('public/js/views2.js', 'utf8'), v4 = readFileSync('public/js/views4.js', 'utf8'), uc = readFileSync('public/js/ucard.js', 'utf8'), ac2 = readFileSync('public/atlas.css', 'utf8');
  ok((v2.match(/rankChip\(/g) || []).length >= 3 && /cardTop\(c \|\| u, u\)/.test(v2) && /cardTop\(c, null, true\)/.test(v2) && /cardTop\(u, r\)/.test(v4) && /whyBlock\(r\)/.test(v4) && /export function rankChip/.test(uc), 'reyting: chip hamma kartada (AQSh, oddiy, xorijiy), Haqida, Solishtirish, Moslik');
  ok(/window\.Scoring\.fit\(c, P, today\)/.test(v2) && !/Boshqa davlatlar uchun qabul ehtimoli/.test(v2) && /country: ctr, op: !!f\.op/.test(v2), 'finder/solishtirish: hamma uchun bir xil hisob, filtrlar serverda');
  ok(['.rk{', '.rk-top{', '.rk-no{', '.rk-row{'].every(k => ac2.includes(k)), 'reyting: chip uslubi');
}
{ const es = readFileSync('public/js/esc.js', 'utf8'), mj3 = readFileSync('public/js/main.js', 'utf8');
  ok(/initEsc\(\)/.test(mj3) && /markRoute\(\);/.test(mj3) && /addEventListener\('keydown'[\s\S]*, true\)/.test(es) && /\.modal-bg:not\(\.out\)/.test(es) && /history\.back\(\)/.test(es) && /#\/dashboard/.test(es), 'esc: modal yopadi, panellarga tegmaydi, aks holda ilova ichida orqaga'); }
// Eski brauzerlar (color-mix yo‘q): compat.js hamma sahifada uslublardan keyin ulanadi va CSS ni CSSOM orqali tuzatadi
{ const cj = readFileSync(new URL('../public/js/compat.js', import.meta.url), 'utf8');
  for (const f of ['app', 'admin', 'landing', 'unsub', 'reset']) { const h = readFileSync(new URL(`../public/${f}.html`, import.meta.url), 'utf8'), i = h.indexOf('<script src="/js/compat.js"></script>'), last = h.lastIndexOf('rel="stylesheet"');
    ok(i > last && last > 0, `compat: ${f}.html uslublardan keyin compat.js ni ulaydi`); }
  ok(/CSS\.supports\('color', FN \+ 'in srgb, red 50%, blue\)'\)/.test(cj) && /r\.style\.cssText = fix\(/.test(cj) && /MutationObserver/.test(cj) && !/innerHTML|<style/.test(cj), 'compat: faqat color-mix yo‘q brauzerda, CSSOM orqali, keyin qo‘shilgan uslublar ham');
  const vm = await import('node:vm'), box = { window: {}, document: null }; // fix() ni sinash: brauzersiz, funksiya matnidan
  const src = cj.slice(cj.indexOf('function args'), cj.indexOf('function walk')) + '; this.fix = fix;';
  vm.runInNewContext('var FN = "color-mix(";' + src, box);
  ok(box.fix('a{background:color-mix(in srgb,var(--brand) 78%,#fff);color:color-mix(in srgb, var(--ink) 13%, transparent)}') === 'a{background:var(--brand);color:transparent}', 'compat: ulushi katta rang tanlanadi');
  ok(box.fix('x:radial-gradient(380px at 0 0,color-mix(in srgb,color-mix(in srgb,var(--a) 20%,#000) 40%,var(--b)),transparent 72%)') === 'x:radial-gradient(380px at 0 0,var(--b),transparent 72%)', 'compat: ichma-ich color-mix va gradient ichida');
}
console.log(`pf: ${n} checks, ${process.exitCode ? 'FAILED' : 'ok'}`);

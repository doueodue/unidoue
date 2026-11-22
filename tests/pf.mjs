// Portfolio yadrosi: model tozalash, baholash, HTML/DOCX hujjatlari. Ishga tushirish: node --no-warnings tests/pf.mjs
import assert from 'node:assert/strict';
import { inflateRawSync, crc32 as nodeCrc } from 'node:zlib';
import { normalize, emptyPf, evaluate, seedFromProfile, range, splitBullets, safeUrl, canExport, TIPS, DIMS, uid } from '../public/js/pfmodel.js';
import { docHTML, fileBase, esc } from '../public/js/pfdoc.js';
import { docxBytes } from '../public/js/pfdocx.js';
import { zip, crc32 } from '../public/js/zip.js';

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
console.log(`pf: ${n} checks, ${process.exitCode ? 'FAILED' : 'ok'}`);

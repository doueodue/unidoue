/* Portfolio → Word (.docx). Bogʻliqliksiz: OOXML matnlari + zip.js. Tahrirlash mumkin, sarlavhalar Heading uslubida (ATS va Word "Navigation" uchun). */
import { zip, dataUrlBytes } from './zip.js';
import { normalize, actText, range, splitBullets } from './pfmodel.js';
import { DL, langText } from './pfdoc.js';

const x = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const W = 9638; // matn kengligi (twip): A4 11906 − 2×1134
const LANGV = { en: 'en-US', uz: 'uz-Latn-UZ', ru: 'ru-RU' };

const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${o.c ? `<w:color w:val="${o.c}"/>` : ''}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ''}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
const tab = () => '<w:r><w:tab/></w:r>';
const para = (inner, o = {}) => `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.keep ? '<w:keepNext/>' : ''}${o.tabs ? `<w:tabs>${o.tabs}</w:tabs>` : ''}${o.pbdr ? `<w:pBdr>${o.pbdr}</w:pBdr>` : ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after || 0}"/>${o.ind ? `<w:ind ${o.ind}/>` : ''}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}</w:pPr>${inner}</w:p>`;

function image(rid, id, cx, cy, name) {
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${x(name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${x(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}
const cell = (w, inner) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr>${inner || para('')}</w:tc>`;
const table = (widths, rows) => `<w:tbl><w:tblPr><w:tblW w:w="${W}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map(r => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r}</w:tr>`).join('')}</w:tbl>`;

/** Portfolio → .docx baytlari (Uint8Array). imgs: { [attId]: { url, w, h } } */
export function docxBytes(pf, imgs = {}) {
  const p = normalize(pf), d = DL[p.lang] || DL.en, A = p.accent.replace('#', '').toUpperCase(), media = [], rels = [];
  let rid = 10, did = 1;
  const addImg = (url, cx, cy, name) => { const id = 'rId' + rid++; media.push({ name: `word/media/image${media.length + 1}.jpg`, data: dataUrlBytes(url) }); rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${media.length}.jpg"/>`); return image(id, did++, cx, cy, name); };
  const h2 = t => para(run(t), { style: 'Heading2', keep: true, before: 260, after: 80 });
  const line = (t, o = {}) => para(run(t, o), { after: 40 });
  const bul = t => para(`${run('•')}${tab()}${run(t)}`, { ind: 'w:left="340" w:hanging="226"', after: 30 });
  const body = [];

  // Sarlavha bloki
  const head = [para(run(p.name, { b: true, sz: 52, c: A }), { style: 'Heading1', after: 40 })];
  if (p.headline) head.push(para(run(p.headline, { sz: 24, c: '3D4452' }), { after: 60 }));
  const ct = [p.city, p.email, p.phone, ...p.links.map(l => (l.l ? l.l + ': ' : '') + l.u)].filter(Boolean);
  if (ct.length) head.push(para(run(ct.join('   |   '), { sz: 18, c: '5B6472' }), { after: 40 }));
  if (p.photo) body.push(table([W - 1800, 1800], [cell(W - 1800, head.join('')) + cell(1800, para(addImg(p.photo, 936000, 1170000, 'Photo'), { jc: 'right' }))]));
  else body.push(...head);
  body.push(para('', { pbdr: `<w:bottom w:val="single" w:sz="14" w:space="1" w:color="${A}"/>`, after: 40 }));

  if (p.summary) { body.push(h2(d.summary)); body.push(para(run(p.summary), { after: 40 })); }
  const entry = (a, kind) => {
    const when = range(a, d.present), title = a.title || '', metaT = [a.org, a.role, a.hours ? `${a.hours} ${d.hours}` : '', a.url || ''].filter(Boolean).join(' | ');
    const out = [];
    if (title || when) out.push(para(run(title, { b: true }) + (when ? tab() + run(when, { c: '5B6472', sz: 19 }) : ''), { tabs: `<w:tab w:val="right" w:pos="${W}"/>`, keep: true, before: 90, after: 10 }));
    if (metaT) out.push(para(run(metaT, { i: true, c: '5B6472', sz: 19 }), { after: 20, keep: true }));
    const parts = splitBullets(actText(a)); parts.forEach(t => out.push(bul(t)));
    return out.join('');
  };
  if (p.edu.length) { body.push(h2(d.edu)); p.edu.forEach(e => { body.push(para(run(e.school || e.program, { b: true }) + (range(e, d.present) ? tab() + run(range(e, d.present), { c: '5B6472', sz: 19 }) : ''), { tabs: `<w:tab w:val="right" w:pos="${W}"/>`, keep: true, before: 90, after: 10 })); const m = [e.school ? e.program : '', e.gpa ? `${d.gpa} ${e.gpa}` : ''].filter(Boolean).join(' | '); if (m) body.push(para(run(m, { i: true, c: '5B6472', sz: 19 }), { after: 20 })); if (e.note) body.push(line(e.note)); }); }
  if (p.tests.length) { body.push(h2(d.tests)); body.push(para(p.tests.map((t, i) => (i ? run('     ') : '') + run(t.name + ' ', { b: true }) + run(t.score + (t.date ? ` (${t.date})` : ''))).join(''), { after: 40 })); }
  if (p.acts.length) { body.push(h2(d.acts)); p.acts.forEach(a => body.push(entry(a))); }
  if (p.awards.length) { body.push(h2(d.awards)); p.awards.forEach(a => { body.push(para(run(a.title, { b: true }) + (a.year ? tab() + run(a.year, { c: '5B6472', sz: 19 }) : ''), { tabs: `<w:tab w:val="right" w:pos="${W}"/>`, keep: true, before: 90, after: 10 })); const m = [a.issuer, a.level ? d.levels[a.level] : ''].filter(Boolean).join(' | '); if (m) body.push(para(run(m, { i: true, c: '5B6472', sz: 19 }), { after: 20 })); if (a.note) body.push(line(a.note)); }); }
  if (p.projects.length) { body.push(h2(d.projects)); p.projects.forEach(a => body.push(entry(a))); }
  if (p.skills.length) { body.push(h2(d.skills)); body.push(line(p.skills.join(', '))); }
  if (p.langs.length) { body.push(h2(d.langs)); body.push(line(p.langs.map(l => langText(l, d)).join(', '))); }
  if (p.targets.length) { body.push(h2(d.targets)); body.push(line(p.targets.join(', '))); }
  const gal = p.att.filter(a => imgs[a.id] && imgs[a.id].url);
  if (gal.length) {
    body.push(h2(d.gallery));
    const cw = Math.floor(W / 3), rows = [];
    for (let i = 0; i < gal.length; i += 3) {
      rows.push(gal.slice(i, i + 3).concat([null, null, null]).slice(0, 3).map(a => {
        if (!a) return cell(cw, para(''));
        const m = imgs[a.id], w = 1800000, h = Math.round(w * ((m.h || 3) / (m.w || 4)));
        return cell(cw, para(addImg(m.url, w, Math.min(h, 2400000), a.cap || 'Document'), { after: 20 }) + (a.cap ? para(run(a.cap, { sz: 16, c: '5B6472' }), { after: 120 }) : para('', { after: 120 })));
      }).join(''));
    }
    body.push(table([cw, cw, W - 2 * cw], rows));
  }
  body.push(para(''));

  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const lang = LANGV[p.lang] || 'en-US';
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="${lang}" w:eastAsia="${lang}" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/><w:b/><w:color w:val="${A}"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="2" w:color="D9DEE6"/></w:pBdr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/><w:b/><w:color w:val="${A}"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style></w:styles>`;
  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${rels.join('')}</Relationships>`;
  const types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(p.name || 'Portfolio')}</dc:title><dc:creator>${x(p.name || 'UniDoue')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;
  return zip([{ name: '[Content_Types].xml', data: types }, { name: '_rels/.rels', data: rootRels }, { name: 'word/document.xml', data: doc }, { name: 'word/_rels/document.xml.rels', data: docRels }, { name: 'word/styles.xml', data: styles }, { name: 'docProps/core.xml', data: core }, ...media]);
}

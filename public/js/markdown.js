/* AI javoblari uchun xavfsiz Markdown → HTML.
   Avval butun matn escape qilinadi, keyin faqat o‘zimiz yasagan teglar (b, i, ul, li, table, a, code ...) qo‘shiladi.
   AI ba’zan Markdown o‘rniga oddiy HTML yozadi (<ul><li>, <br> ...): atributsiz xavfsiz teglar ishlaydi, qolganlari olib tashlanadi. */
const E = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const KEEP = { ul: 1, ol: 1, li: 1, br: 1, b: 1, strong: 1, i: 1, em: 1, u: 1 };
const RENAME = { strong: 'b', em: 'i' };

/** escape qilingan matndagi HTML teglari: ruxsat etilganlari qaytariladi, qolganlari olib tashlanadi */
function tags(s) {
  return s
    .replace(/&lt;\/?[a-z][a-z0-9]*\s(?:(?!&gt;).)*&gt;/gi, '') // atributli teglar (span style=… va h.k.)
    .replace(/&lt;(\/?)([a-z][a-z0-9]*)\s*\/?&gt;/gi, (m, c, n) => { n = n.toLowerCase(); return KEEP[n] ? (n === 'br' ? '<br>' : `<${c}${RENAME[n] || n}>`) : ''; });
}
/** ochilmagan/yopilmagan b, i, u, ul, ol, li teglarini tuzatadi (qolgan sahifaga “oqib” ketmasin) */
function balance(h) {
  const st = []; let o = '';
  for (const p of h.split(/(<\/?(?:b|i|u|ul|ol|li)>)/)) {
    const m = /^<(\/?)(b|i|u|ul|ol|li)>$/.exec(p);
    if (!m) { o += p; continue; }
    if (!m[1]) { st.push(m[2]); o += p; continue; }
    const k = st.lastIndexOf(m[2]); if (k < 0) continue;
    while (st.length > k + 1) o += `</${st.pop()}>`;
    st.pop(); o += p;
  }
  while (st.length) o += `</${st.pop()}>`;
  return o;
}
const a = (u, t) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`;

function inline(raw) {
  const hold = []; const keep = h => `\u0000${hold.push(h) - 1}\u0000`;
  let s = E(String(raw).replace(/\u0000/g, '')).replace(/`([^`\n]+)`/g, (m, c) => keep(`<code>${c}</code>`));
  s = tags(s);
  s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/(?:[^\s)<&]|&amp;)+)\)/g, (m, t, u) => keep(a(u, t)));
  s = s.replace(/(^|[\s(])(https?:\/\/(?:[^\s<&]|&amp;)+)/g, (m, pre, u) => { const tail = /[.,;:!?)\]]+$/.exec(u); if (tail) u = u.slice(0, -tail[0].length); return pre + keep(a(u, u)) + (tail ? tail[0] : ''); });
  s = s.replace(/\*\*([^\s*](?:[^\n]*?[^\s*])?)\*\*/g, '<b>$1</b>').replace(/__([^\s_](?:[^\n]*?[^\s_])?)__/g, '<b>$1</b>');
  s = s.replace(/(^|[^*\w])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?!\*)/g, '$1<i>$2</i>').replace(/(^|\W)_([^\s_](?:[^_\n]*?[^\s_])?)_(?!\w)/g, '$1<i>$2</i>');
  return balance(s).replace(/\u0000(\d+)\u0000/g, (m, n) => hold[+n] || '');
}

const LI = /^(\s*)([-*+•]|\d{1,3}[.)])\s+(.*)$/;
const isSep = l => /^[\s|:-]+$/.test(l) && l.includes('-') && l.includes('|');
const cells = l => {
  let t = l.trim(); if (t[0] === '|') t = t.slice(1); if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const out = []; let cur = '';
  for (let k = 0; k < t.length; k++) { const c = t[k]; if (c === '\\' && t[k + 1] === '|') { cur += '|'; k++; } else if (c === '|') { out.push(cur.trim()); cur = ''; } else cur += c; }
  out.push(cur.trim()); return out;
};

function list(lines, i) {
  const st = []; let o = '';
  while (i < lines.length) {
    let j = i; while (j < lines.length && !lines[j].trim()) j++;
    if (j > i && !(st.length && j < lines.length && LI.test(lines[j]))) break; // bo‘sh qatordan keyin ro‘yxat davom etmasa — tugadi
    i = j; const l = lines[i], m = LI.exec(l);
    if (!m) { if (st.length && /^\s+\S/.test(l)) { o += '<br>' + inline(l.trim()); i++; continue; } break; }
    const ind = m[1].replace(/\t/g, '    ').length, tag = /\d/.test(m[2]) ? 'ol' : 'ul';
    while (st.length && ind < st[st.length - 1].ind) o += `</li></${st.pop().tag}>`;
    const top = st[st.length - 1];
    if (!top || ind > top.ind) { o += `<${tag}><li>`; st.push({ ind, tag }); }
    else { o += '</li>'; if (top.tag !== tag) { o += `</${top.tag}><${tag}>`; top.tag = tag; } o += '<li>'; }
    o += inline(m[3]); i++;
  }
  while (st.length) o += `</li></${st.pop().tag}>`;
  return [o, i];
}

function table(lines, i) {
  const head = cells(lines[i]), n = head.length, al = cells(lines[i + 1]).map(c => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : ''));
  const td = (tg, c, k) => `<${tg}${al[k] ? ` style="text-align:${al[k]}"` : ''}>${inline(c)}</${tg}>`;
  let o = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((c, k) => td('th', c, k)).join('')}</tr></thead><tbody>`;
  for (i += 2; i < lines.length && lines[i].trim() && lines[i].includes('|'); i++) {
    let r = cells(lines[i]); if (r.length > n) r = r.slice(0, n - 1).concat(r.slice(n - 1).join(' | ')); while (r.length < n) r.push('');
    o += `<tr>${r.map((c, k) => td('td', c, k)).join('')}</tr>`;
  }
  return [o + '</tbody></table></div>', i];
}

/** Markdown matnni xavfsiz HTML ga aylantiradi. Qaytgan qiymat <div class="md">…</div> */
export function md(text) {
  let src = String(text == null ? '' : text).replace(/\u0000/g, '').replace(/\r\n?/g, '\n');
  // jadvaldan tashqaridagi HTML ro‘yxat/sarlavha/abzatslar → Markdown (jadval ichidagi <ul><li> inline() da hal qilinadi)
  src = src.split('\n').map(l => {
    if (/^\s*\|/.test(l) || !/<\/?(?:ul|ol|li|p|div|h[1-6])\b/i.test(l)) return l;
    return l.replace(/<h([1-6])[^>]*>(.*?)<\/h\1\s*>/gi, (m, n, t) => `\n${'#'.repeat(+n)} ${t}\n`).replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n').replace(/<li[^>]*>/gi, '\n- ').replace(/<\/li\s*>/gi, '').replace(/<\/?(?:p|div)[^>]*>/gi, '\n');
  }).join('\n');
  const lines = src.split('\n'); let out = '', i = 0, para = [], m;
  const flush = () => { if (para.length) { out += `<div class="mdp">${para.map(inline).join('<br>')}</div>`; para = []; } };
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { flush(); i++; continue; }
    if (/^\s*```/.test(l)) { flush(); const buf = []; for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) buf.push(lines[i]); i++; out += `<pre><code>${E(buf.join('\n'))}</code></pre>`; continue; }
    if ((m = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l))) { flush(); const h = Math.min(m[1].length + 2, 5); out += `<h${h}>${inline(m[2])}</h${h}>`; i++; continue; }
    if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(l)) { flush(); out += '<hr>'; i++; continue; }
    if (/^\s{0,3}>/.test(l)) { flush(); const q = []; for (; i < lines.length && /^\s{0,3}>/.test(lines[i]); i++) q.push(lines[i].replace(/^\s{0,3}>\s?/, '')); out += `<blockquote>${q.map(inline).join('<br>')}</blockquote>`; continue; }
    if (l.includes('|') && i + 1 < lines.length && isSep(lines[i + 1])) { flush(); [m, i] = table(lines, i); out += m; continue; }
    if (LI.test(l)) { flush(); [m, i] = list(lines, i); out += m; continue; }
    para.push(l.trim()); i++;
  }
  flush();
  return `<div class="md">${out}</div>`;
}

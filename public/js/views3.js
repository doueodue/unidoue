import { $, $$, S, api, ls, esc, toast, svg, catalog, upsell } from './core.js';

const costOf = { mentor: 1, essay: 2, essay_deep: 4, strategy: 6, report: 6 };
const aiOff = () => `<div class="notice">${svg('info')}<div><b>AI hozircha ulanmagan.</b> Sayt egasi serverda AI kalitini sozlashi kerak. Kalit faqat serverda saqlanadi va brauzerga chiqmaydi.</div></div>`;
const left = () => S.account.limits.ai - S.account.usage.ai;

/** Xavfsiz minimal formatlash: avval escape, keyin **qalin** va sarlavhalar. */
const md = t => esc(t).replace(/^#{1,4}\s*(.+)$/gm, '<b>$1</b>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

async function callAI(body) {
  try {
    const r = await api('/api/ai', 'POST', body);
    S.account.usage.ai = r.usage.ai; document.dispatchEvent(new CustomEvent('unidoue:account'));
    return r;
  } catch (e) {
    if (e.code === 'AI_LIMIT') upsell('essay_adv', e.message + ' Limitni oshirish uchun tarifni yaxshilang.');
    else if (e.code === 'PLAN_REQUIRED') upsell(e.data.feature);
    throw e;
  }
}

/* ================= ESSE YORDAMCHISI ================= */
const STOP = new Set('va bu bir u men biz siz ular uchun bilan lekin ammo ham yoki the and a to of in is that it for was with as on i my me'.split(' '));
function analyze(text) {
  const words = text.toLowerCase().match(/[\p{L}’'ʻ-]+/gu) || [], sents = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 1), paras = text.split(/\n\s*\n/).filter(p => p.trim());
  const lens = sents.map(s => (s.match(/[\p{L}’'ʻ-]+/gu) || []).length), avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const freq = {}; words.forEach(w => { if (w.length > 4 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const rep = Object.entries(freq).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const me = words.filter(w => ['i', 'my', 'me', 'men', 'meni', 'mening'].includes(w)).length;
  const first = sents[0] || '', long = sents.filter((s, i) => lens[i] > 35).length;
  const notes = [];
  if (words.length < 250) notes.push(['warn', `Esse qisqa (${words.length} so‘z). Common App uchun odatda 250–650 so‘z kerak.`]);
  else if (words.length > 650) notes.push(['warn', `Esse uzun (${words.length} so‘z). Common App chegarasi 650 so‘z.`]);
  else notes.push(['ok', `Hajmi mos (${words.length} so‘z).`]);
  if (paras.length < 3) notes.push(['warn', 'Abzatslar kam. Kirish, asosiy qism va xulosa ajratilsa, tuzilma aniq bo‘ladi.']);
  if (avg > 28) notes.push(['warn', `Gaplar uzun (o‘rtacha ${avg.toFixed(0)} so‘z). Qisqaroq gaplar o‘qishni osonlashtiradi.`]);
  if (long) notes.push(['warn', `${long} ta gap 35 so‘zdan uzun, ularni bo‘ling.`]);
  if (rep.length) notes.push(['warn', 'Ko‘p takrorlangan so‘zlar: ' + rep.map(([w, n]) => `${w} (${n})`).join(', ') + '.']);
  if (first.length < 25) notes.push(['warn', 'Birinchi gap juda qisqa. O‘quvchini ushlab turadigan aniq epizod bilan boshlang.']);
  if (words.length && me / words.length > 0.08) notes.push(['info', 'Esse “men” so‘ziga boy; harakat va tafsilotlar bilan to‘ldiring.']);
  if (!/\d/.test(text)) notes.push(['info', 'Aniq raqam yoki tafsilot yo‘q. Konkret misollar hikoyani kuchaytiradi.']);
  return { words: words.length, sents: sents.length, paras: paras.length, avg, notes };
}

export async function essay(el) {
  const draft = ls.get('qabul:essay', '');
  el.innerHTML = `<div class="page-h"><div><h2>Esse <em>yordamchisi</em></h2><p>Shaxsiy bayonotingizni tuzilma, aniqlik, grammatika va hikoya jihatidan tahlil qiling.</p></div></div>
  <div class="grid g-dash"><section class="card s7"><label class="f" for="e-t">Esse matni</label><textarea id="e-t" rows="16" maxlength="6000" placeholder="Esseni shu yerga joylang (kamida 200 belgi)">${esc(draft)}</textarea><div class="hint" id="e-c"></div>
    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn" id="e-b">Tezkor tahlil (bepul)</button><button class="btn primary" id="e-ai">AI tahlil (${costOf.essay} kredit)</button><button class="btn dark" id="e-deep">Chuqur tahlil (${costOf.essay_deep} kredit, Pro)</button></div><div class="msg" id="e-m"></div></section>
  <section class="card s5"><h3>Natija</h3><div id="e-o"><p class="sub">Tezkor tahlil brauzeringizda ishlaydi va hech qayerga yuborilmaydi. AI tahlil matnni serverga yuboradi.</p></div></section></div>`;
  const ta = $('#e-t', el), out = $('#e-o', el), m = $('#e-m', el), cnt = () => ($('#e-c', el).textContent = `${(ta.value.match(/[\p{L}’'ʻ-]+/gu) || []).length} so‘z · ${ta.value.length}/6000 belgi · kredit: ${left()} qoldi`); cnt();
  let t = 0; ta.oninput = () => { cnt(); clearTimeout(t); t = setTimeout(() => ls.set('qabul:essay', ta.value), 1200); };
  $('#e-b', el).onclick = () => {
    if (ta.value.trim().length < 200) { m.className = 'msg err'; m.textContent = 'Esse kamida 200 belgidan iborat bo‘lsin.'; return; } m.textContent = '';
    const a = analyze(ta.value);
    out.innerHTML = `<div class="row" style="margin-bottom:12px"><div class="stat"><b>${a.words}</b><span>so‘z</span></div><div class="stat"><b>${a.paras}</b><span>abzats</span></div><div class="stat"><b>${a.avg.toFixed(0)}</b><span>gapdagi o‘rtacha so‘z</span></div></div>${a.notes.map(([k, x]) => `<p style="margin:8px 0"><span class="badge ${k === 'ok' ? 'ok' : k === 'warn' ? 'warn' : ''}">${k === 'ok' ? 'yaxshi' : k === 'warn' ? 'e’tibor' : 'maslahat'}</span> ${esc(x)}</p>`).join('')}<p class="hint">Bu sodda statistik tahlil. Mazmun va hikoya sifatini AI tahlil baholaydi.</p>`;
  };
  const ai = async deep => {
    m.className = 'msg err'; m.textContent = '';
    if (ta.value.trim().length < 200) { m.textContent = 'Esse kamida 200 belgidan iborat bo‘lsin.'; return; }
    if (!S.account.config.ai) { out.innerHTML = aiOff(); return; }
    if (deep && !S.account.features.includes('essay_adv')) return upsell('essay_adv', 'Chuqur esse tahlili Pro tarifida.');
    const btns = $$('#e-ai,#e-deep,#e-b', el); btns.forEach(b => (b.disabled = true)); out.innerHTML = '<div class="sk" style="height:140px"></div>';
    try { const r = await callAI({ tool: 'essay', text: ta.value, deep }); out.innerHTML = `<div class="pre">${md(r.reply)}</div><p class="hint">AI xato qilishi mumkin; maslahatlarni o‘z ovozingizga moslang. Esse sizniki bo‘lib qolsin.</p>`; cnt(); }
    catch (e) { out.innerHTML = e.code === 'AI_NOT_CONFIGURED' ? aiOff() : `<p class="msg err">${esc(e.message)}</p>`; }
    btns.forEach(b => (b.disabled = false));
  };
  $('#e-ai', el).onclick = () => ai(false); $('#e-deep', el).onclick = () => ai(true);
}

/* ================= AI MENTOR ================= */
export async function mentor(el) {
  const cat = await catalog(), apps = ls.get('qabul:apps', []), acc = S.account; const hist = [];
  el.innerHTML = `<div class="page-h"><div><h2>AI <em>mentor</em></h2><p>Universitet tanlash, ariza va esse bo‘yicha savollar. Javoblar umumiy maslahat, rasmiy talablarni universitet saytida tekshiring.</p></div><span class="badge">${left()} kredit qoldi</span></div>
  ${acc.config.ai ? '' : aiOff()}
  <div class="grid g-dash" style="margin-top:16px"><section class="card s7"><div class="chat" id="m-c" aria-live="polite"><div class="bub a">Salom! Men UniDoue mentoriman. ${acc.consent.mentorMemory ? 'Profilingiz ma’lumotlaridan foydalanaman (profil sahifasida o‘chirishingiz mumkin).' : 'Profilingizni ko‘rishim uchun profil sahifasida ruxsat bering.'} Nimani bilmoqchisiz?</div></div>
    <form id="m-f" style="display:flex;gap:10px;margin-top:8px"><input id="m-i" type="text" maxlength="2000" placeholder="Savolingizni yozing…" autocomplete="off" style="flex:1"><button class="btn primary" id="m-s" type="submit">Yuborish</button></form></section>
  <section class="card s5"><h3>Pro vositalar</h3><p class="sub">Tanlangan universitetlar bo‘yicha.</p><div class="field"><label class="f" for="m-u">Universitetlar (Ctrl bilan bir nechta)</label><select id="m-u" multiple size="6">${cat.map(c => `<option value="${esc(c.n)}" ${apps.some(a => a.n === c.n) ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn dark sm" id="m-st">Qabul strategiyasi (${costOf.strategy})</button><button class="btn sm" id="m-rp">Universitet hisoboti (${costOf.report})</button></div><div class="msg" id="m-m"></div></section></div>
  <section class="card" id="m-o" style="margin-top:18px" hidden></section>
  <section class="card" style="margin-top:18px"><h3>Jonli mentor bilan bog‘lanish</h3><p class="sub">Esse tahlili yoki universitet tanlashda inson mentordan yordam so‘rang. So‘rov administratorga yetkaziladi.</p><div class="row"><div class="field"><label class="f" for="rq-n">Ismingiz</label><input id="rq-n" type="text" maxlength="60" value="${esc(S.user.name)}"></div><div class="field"><label class="f" for="rq-c">Telegram yoki telefon</label><input id="rq-c" type="text" maxlength="60" placeholder="@username yoki +998…"></div><div class="field"><label class="f" for="rq-s">Xizmat</label><select id="rq-s"><option>Esse tahlili</option><option>Universitet tanlash</option><option>Ariza bo‘yicha maslahat</option><option>Boshqa</option></select></div></div><div class="field"><label class="f" for="rq-t">Izoh</label><textarea id="rq-t" maxlength="1500" style="min-height:80px"></textarea></div><button class="btn" id="rq-b">So‘rov yuborish</button><div class="msg" id="rq-m"></div></section>`;
  const chat = $('#m-c', el), add = (cls, txt) => { const d = document.createElement('div'); d.className = 'bub ' + cls; d.textContent = txt; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d; };
  $('#m-f', el).onsubmit = async ev => {
    ev.preventDefault(); const inp = $('#m-i', el), q = inp.value.trim(); if (!q) return;
    if (!acc.config.ai) { toast('AI hozircha ulanmagan.', 'err'); return; }
    inp.value = ''; hist.push({ role: 'user', content: q }); add('u', q); const wait = add('a', '…'); $('#m-s', el).disabled = true;
    try { const r = await callAI({ tool: 'mentor', messages: hist }); hist.push({ role: 'assistant', content: r.reply }); wait.innerHTML = md(r.reply); $('.badge', el).textContent = left() + ' kredit qoldi'; }
    catch (e) { hist.pop(); wait.textContent = e.message; wait.style.color = 'var(--bad)'; }
    $('#m-s', el).disabled = false; inp.focus();
  };
  const tool = async (name, need) => {
    const m = $('#m-m', el), sel = [...$('#m-u', el).selectedOptions].map(o => o.value).slice(0, 8), o = $('#m-o', el); m.className = 'msg err'; m.textContent = '';
    if (!acc.config.ai) { m.textContent = 'AI hozircha ulanmagan.'; return; }
    if (!acc.features.includes(need)) return upsell(need, 'Bu vosita Pro tarifida.');
    if (!sel.length) { m.textContent = 'Kamida bitta universitet tanlang.'; return; }
    o.hidden = false; o.innerHTML = '<div class="sk" style="height:140px"></div>';
    try { const r = await callAI({ tool: name, universities: sel }); o.innerHTML = `<h3>${name === 'strategy' ? 'Qabul strategiyasi' : 'Universitet hisoboti'}</h3><div class="pre">${md(r.reply)}</div><p class="hint">Raqam va muddatlarni universitetning rasmiy saytida tekshiring.</p>`; $('.badge', el).textContent = left() + ' kredit qoldi'; }
    catch (e) { o.innerHTML = `<p class="msg err">${esc(e.message)}</p>`; }
  };
  $('#rq-b', el).onclick = async () => { const m = $('#rq-m', el), g = id => $('#' + id, el).value.trim(); m.className = 'msg err'; if (g('rq-n').length < 2 || g('rq-c').length < 5) { m.textContent = 'Ism va aloqa ma’lumotini kiriting.'; return; } try { await api('/api/request', 'POST', { name: g('rq-n'), contact: g('rq-c'), service: g('rq-s'), message: g('rq-t') }); m.className = 'msg ok'; m.textContent = 'So‘rov yuborildi. Siz bilan bog‘lanamiz.'; } catch (e) { m.textContent = e.message; } };
  $('#m-st', el).onclick = () => tool('strategy', 'strategy'); $('#m-rp', el).onclick = () => tool('report', 'reports');
}

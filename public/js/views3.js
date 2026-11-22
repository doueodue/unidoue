import { $, $$, S, api, ls, esc, toast, svg, catalog, upsell, credits, applyCredits, refreshCredits, aiFlag, hasFeature, MENTOR, mentorAvatar } from './core.js';
import { md } from './markdown.js';
import { t as tr, lang } from './i18n.js';

const costOf = { mentor: 1, essay: 2, essay_deep: 4, strategy: 6, report: 6 };
export const aiOff = () => `<div class="notice">${svg('info')}<div><b>AI hozircha ulanmagan.</b> Sayt egasi serverda AI kalitini sozlashi kerak. Kalit faqat serverda saqlanadi va brauzerga chiqmaydi.</div></div>`;

/** AI mentor sahifalari uchun umumiy tab: Suhbat | Esse murabbiyi */
export const mentorTabs = on => `<div class="tabs mtabs" role="tablist" aria-label="AI mentor bo‘limlari"><button type="button" role="tab" aria-selected="${on === 'chat'}" data-go="mentor">Suhbat</button><button type="button" role="tab" aria-selected="${on === 'coach'}" data-go="coach">Esse murabbiyi${hasFeature('coach') ? '' : ' <span class="lk">Plus</span>'}</button></div>`;
export const bindMentorTabs = el => $$('.mtabs [data-go]', el).forEach(b => (b.onclick = () => { location.hash = '#/' + b.dataset.go; }));


/** Oqimli chaqiruv: matn kelib turganda onText(toʻliq matn) chaqiriladi. */
export async function streamAI(body, onText) {
  let r;
  try { r = await fetch('/api/ai', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, stream: true, lang: lang() }) }); }
  catch (e) { throw Object.assign(new Error('Serverga ulanib bo‘lmadi. Internetni tekshiring.'), { status: 0 }); }
  if (!r.ok) {
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (j.credits) applyCredits(j.credits);
    const err = Object.assign(new Error(j.error || 'Xatolik yuz berdi.'), { status: r.status, code: j.code, data: j });
    if (err.code === 'AI_LIMIT') upsell('essay_adv', tr(err.message) + ' ' + tr('Limitni oshirish uchun tarifni yaxshilang.'));
    else if (err.code === 'PLAN_REQUIRED') upsell(err.data.feature);
    throw err;
  }
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', text = '', fin = null;
  for (;;) {
    const { done, value } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const blk = buf.slice(0, i); buf = buf.slice(i + 2);
      if (!blk.startsWith('data:')) continue;
      let o; try { o = JSON.parse(blk.slice(5)); } catch (e) { continue; }
      if (o.t) { text += o.t; onText(text); }
      if (o.error) { if (o.credits) applyCredits(o.credits); throw new Error(o.error); }
      if (o.done) fin = o;
    }
  }
  if (!fin) { if (!text) throw new Error('AI javobi uzilib qoldi.'); refreshCredits(); } // oqim uzilgan: serverdagi haqiqiy holatni olamiz
  else applyCredits(fin.credits || { used: fin.usage.ai, limit: fin.limit });
  return { reply: text };
}

/** Oqimsiz chaqiruv (JSON javob): portfolio sayqali va rasmdan o'qish uchun. Kredit holatini yangilaydi. */
export async function askAI(body) {
  try { const j = await api('/api/ai', 'POST', { ...body, stream: false, lang: lang() }); if (j.credits) applyCredits(j.credits); return j; }
  catch (e) {
    if (e.data && e.data.credits) applyCredits(e.data.credits);
    if (e.code === 'AI_LIMIT') upsell('essay_adv', tr(e.message) + ' ' + tr('Limitni oshirish uchun tarifni yaxshilang.'));
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
  <div class="notice info" style="margin-bottom:16px">${svg('info')}<div><b>Esseni hali yozmadingizmi?</b> <a href="#/coach">Esse murabbiyi</a> qadam-baqadam o‘rgatadi: hikoya, nega bu soha, nega bu universitet va maqsadlar.</div></div>
  <div class="grid g-dash"><section class="card s7"><label class="f" for="e-t">Esse matni</label><textarea id="e-t" rows="16" maxlength="6000" placeholder="Esseni shu yerga joylang (kamida 200 belgi)">${esc(draft)}</textarea><div class="hint" id="e-c"></div>
    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn" id="e-b">Tezkor tahlil (bepul)</button><button class="btn primary" id="e-ai">AI tahlil (${costOf.essay} kredit)</button><button class="btn dark" id="e-deep">Chuqur tahlil (${costOf.essay_deep} kredit, Pro)</button></div><div class="msg" id="e-m"></div></section>
  <section class="card s5"><h3>Natija</h3><div id="e-o"><p class="sub">Tezkor tahlil brauzeringizda ishlaydi va hech qayerga yuborilmaydi. AI tahlil matnni serverga yuboradi.</p></div></section></div>`;
  const ta = $('#e-t', el), out = $('#e-o', el), m = $('#e-m', el), cnt = () => { const c = credits(); $('#e-c', el).textContent = `${(ta.value.match(/[\p{L}’'ʻ-]+/gu) || []).length} so‘z · ${ta.value.length}/6000 belgi · kredit: ${c.left} / ${c.limit} qoldi`; }; cnt();
  const onAcc = () => { if ($('#e-c', el)) cnt(); else document.removeEventListener('unidoue:account', onAcc); }; document.addEventListener('unidoue:account', onAcc);
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
    const head = aiHead(deep ? 'Chuqur tahlil' : 'AI tahlil'); try { const r = await streamAI({ tool: 'essay', text: ta.value, deep }, txt => { out.innerHTML = `${head}<div class="pre">${md(txt)}</div>`; }); out.innerHTML = `${head}<div class="pre">${md(r.reply)}</div><p class="hint">AI xato qilishi mumkin; maslahatlarni o‘z ovozingizga moslang. Esse sizniki bo‘lib qolsin.</p>`;  aiFlag($('.pre', out), 'essay', r.reply); }
    catch (e) { out.innerHTML = e.code === 'AI_NOT_CONFIGURED' ? aiOff() : `<p class="msg err">${esc(e.message)}</p>`; }
    btns.forEach(b => (b.disabled = false));
  };
  $('#e-ai', el).onclick = () => ai(false); $('#e-deep', el).onclick = () => ai(true);
}

/* ================= AI MENTOR (Doue) ================= */
const SUG = [['compass', 'Profilimga mos universitetlar qaysilar?'], ['target', 'SAT va IELTS ga qanday tayyorlanay?'], ['pen', 'Motivatsion xatni qanday boshlayman?'], ['gift', 'Stipendiya olish uchun nima qilish kerak?']];
let THREAD = []; // suhbat sahifadan sahifaga oʻtganda (Esse murabbiyi ↔ Suhbat) saqlanadi; "Yangi suhbat" tozalaydi
/** AI natija kartasi sarlavhasi: Doue avatari + nomi + natija turi */
export const aiHead = label => `<div class="mc-oh">${mentorAvatar('sm')}<div><b>${MENTOR}</b><span>${esc(tr(label))}</span></div></div>`;

export async function mentor(el) {
  const cat = await catalog(), apps = ls.get('qabul:apps', []), acc = S.account, first = String(S.user.name || '').trim().split(/\s+/)[0] || '';
  const MAX_UNI = 8, mem = !!acc.consent.mentorMemory;
  const tool2 = [['strategy', 'strategy', 'target', 'Qabul strategiyasi', 'Safety, target, reach va oylik reja', costOf.strategy], ['report', 'reports', 'doc', 'Universitet hisoboti', 'Moslik, tayyorgarlik va xavflar', costOf.report]];
  const hello = () => `<div class="mc-hello">${mentorAvatar('xl live')}<h3>${tr('Salom,')} ${esc(first)}</h3><p>${tr('Men Doue — qabul yo‘lingizdagi AI mentoringizman. Universitet tanlash, test rejasi, esse va ariza muddatlari bo‘yicha yonma-yon boraman.')}</p>
    <div class="mc-sug">${SUG.map(([ic, q], i) => `<button type="button" data-q="${i}"><span class="mc-si">${svg(ic)}</span><span>${tr(q)}</span></button>`).join('')}</div>
    <p class="mc-mem ${mem ? 'on' : ''}">${mem ? `${svg('tick')}<span>${tr('Profilingiz ma’lumotlaridan foydalanaman (profil sahifasida o‘chirishingiz mumkin).')}</span>` : `<span>${tr('Profilingizni ko‘rishim uchun profil sahifasida ruxsat bering.')}</span> <a href="#/profile">${tr('Ruxsat berish')}</a>`}</p></div>`;
  el.innerHTML = `<div class="page-h"><div><h2>AI <em>mentor</em></h2><p>Universitet tanlash, ariza va esse bo‘yicha savollar. Javoblar umumiy maslahat, rasmiy talablarni universitet saytida tekshiring.</p></div><span class="badge" data-cr="badge">${credits().left} / ${credits().limit} kredit qoldi</span></div>
  ${mentorTabs('chat')}${acc.config.ai ? '' : aiOff()}
  <div class="grid g-dash" style="margin-top:16px">
    <section class="mc s8" aria-label="${MENTOR}">
      <header class="mc-h">${mentorAvatar('sm')}<div class="mc-id"><b>${MENTOR}</b><span class="mc-st"><i></i>${tr('Onlayn · qabul bo‘yicha AI mentor')}</span></div><button type="button" class="mc-ic" id="m-new" title="${tr('Yangi suhbat')}" aria-label="${tr('Yangi suhbat')}">${svg('plus')}</button></header>
      <div class="mc-log" id="m-c" role="log" aria-live="polite"></div>
      <form class="mc-in" id="m-f"><textarea id="m-i" rows="1" maxlength="2000" placeholder="${tr('Doue’dan so‘rang…')}" aria-label="${tr('Savolingizni yozing…')}" autocomplete="off"></textarea><button class="mc-send" id="m-s" type="submit" aria-label="${tr('Yuborish')}" disabled>${svg('send')}</button></form>
      <div class="mc-foot"><span>${tr('Enter — yuborish · Shift+Enter — yangi qator')}</span><span id="m-n">${tr('Har bir javob')}: ${costOf.mentor} ${tr('kredit')}</span></div>
    </section>
    <aside class="card mc-side s4"><h3>${tr('Chuqur vositalar')}</h3><p class="sub">${tr('Tanlangan universitetlar bo‘yicha batafsil hujjat.')}</p>
      <div class="mc-find"><input type="text" id="m-q" placeholder="${tr('Universitet qidirish…')}" aria-label="${tr('Universitet qidirish…')}" autocomplete="off"><span class="mc-cnt" id="m-k"></span></div>
      <div class="mc-unis" id="m-u" role="group" aria-label="${tr('Universitetlar')}">${cat.map(c => `<label class="mc-u" data-s="${esc((c.n + ' ' + (c.country || '')).toLowerCase())}"><input type="checkbox" value="${esc(c.n)}" ${apps.slice(0, MAX_UNI).some(a => a.n === c.n) ? 'checked' : ''}><span>${esc(c.n)}</span><small>${esc(c.country || '')}</small></label>`).join('')}<p class="mc-none" hidden>${tr('Hech narsa topilmadi')}</p></div>
      <div class="mc-tools">${tool2.map(([id, need, ic, ttl, dsc, cost]) => `<button type="button" class="mc-tool" id="m-${id}" data-need="${need}"><span class="mc-ti">${svg(ic)}</span><span class="mc-tx"><b>${tr(ttl)}${hasFeature(need) ? '' : ' <span class="lk">Pro</span>'}</b><small>${tr(dsc)}</small></span><em>${cost}</em></button>`).join('')}</div><div class="msg" id="m-m"></div></aside>
  </div>
  <section class="card mc-out" id="m-o" style="margin-top:18px" hidden></section>`;
  bindMentorTabs(el);

  const log = $('#m-c', el), inp = $('#m-i', el), send = $('#m-s', el), cnt = $('#m-n', el), cost = cnt.innerHTML;
  const near = () => log.scrollHeight - log.scrollTop - log.clientHeight < 90, down = () => { log.scrollTop = log.scrollHeight; };
  /** Doue javobi: avatar + Markdown karta + amallar (nusxalash, xabar berish) */
  const aMsg = () => { const m = document.createElement('div'); m.className = 'mc-m a'; m.innerHTML = `${mentorAvatar('xs')}<div class="mc-c"><div class="mc-b md"></div></div>`; log.appendChild(m); return m; };
  const finish = (m, text) => {
    const body = $('.mc-b', m); body.innerHTML = md(text); m.classList.remove('busy');
    const act = document.createElement('div'); act.className = 'mc-act'; const cp = document.createElement('button'); cp.type = 'button'; cp.innerHTML = `${svg('copy')}<span>${tr('Nusxalash')}</span>`;
    cp.onclick = async () => { try { await navigator.clipboard.writeText(text); cp.innerHTML = `${svg('tick')}<span>${tr('Nusxalandi')}</span>`; setTimeout(() => (cp.innerHTML = `${svg('copy')}<span>${tr('Nusxalash')}</span>`), 1600); } catch (e) { toast('Matnni qo‘lda nusxalang.', 'err'); } };
    act.appendChild(cp); $('.mc-c', m).appendChild(act); aiFlag(cp, 'mentor', text);
  };
  const uMsg = q => { const m = document.createElement('div'); m.className = 'mc-m u'; const b = document.createElement('div'); b.className = 'mc-b'; b.textContent = q; m.appendChild(b); log.appendChild(m); return m; };
  const render = () => {
    log.innerHTML = '';
    if (!THREAD.length) { log.innerHTML = hello(); $$('.mc-sug [data-q]', log).forEach(b => (b.onclick = () => ask(tr(SUG[+b.dataset.q][1])))); return; }
    THREAD.forEach(x => { if (x.role === 'user') uMsg(x.content); else finish(aMsg(), x.content); }); log.querySelectorAll('.mc-m').forEach(m => (m.style.animation = 'none')); down();
  };
  let busy = false;
  const sync = () => { send.disabled = busy || !inp.value.trim(); const n = inp.value.length; cnt.innerHTML = n > 1500 ? `<b class="${n > 1900 ? 'bad' : ''}">${n}/2000</b>` : cost; };
  const grow = () => { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 148) + 'px'; sync(); };
  async function ask(q) {
    q = String(q || '').trim(); if (!q || busy) return;
    if (!acc.config.ai) { toast('AI hozircha ulanmagan.', 'err'); return; }
    if (!THREAD.length) log.innerHTML = '';
    THREAD.push({ role: 'user', content: q }); uMsg(q); down();
    const m = aMsg(); m.classList.add('busy'); const av = $('.dv', m), body = $('.mc-b', m); av.classList.add('live'); body.innerHTML = `<span class="dots" role="status" aria-label="${tr('Doue yozmoqda…')}"><i></i><i></i><i></i></span>`; down();
    busy = true; inp.value = ''; grow();
    try {
      const r = await streamAI({ tool: 'mentor', messages: THREAD }, t => { const s = near(); body.innerHTML = md(t) + '<span class="mc-caret"></span>'; if (s) down(); });
      THREAD.push({ role: 'assistant', content: r.reply }); const s = near(); finish(m, r.reply); if (s) down();
    } catch (e) {
      THREAD.pop(); m.classList.remove('busy'); m.classList.add('err');
      body.innerHTML = `<p>${esc(e.message)}</p><button type="button" class="mc-retry">${svg('send')}<span>${tr('Qayta urinish')}</span></button>`;
      $('.mc-retry', body).onclick = () => { const u = m.previousElementSibling; m.remove(); if (u) u.remove(); ask(q); };
      down();
    }
    av.classList.remove('live'); busy = false; sync(); if (matchMedia('(pointer:fine)').matches) inp.focus();
  }
  $('#m-f', el).onsubmit = ev => { ev.preventDefault(); ask(inp.value); };
  inp.oninput = grow;
  inp.onkeydown = ev => { if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); ask(inp.value); } };
  $('#m-new', el).onclick = () => { if (busy || !THREAD.length) return; THREAD = []; render(); inp.value = ''; grow(); inp.focus(); };
  render(); sync();

  /* ---- Chuqur vositalar: universitetlarni tanlash (eng koʻpi bilan 8 ta) ---- */
  const boxes = $$('#m-u input', el), k = $('#m-k', el), picked = () => boxes.filter(b => b.checked).map(b => b.value);
  const count = () => { const n = picked().length; k.textContent = `${n} / ${MAX_UNI}`; k.classList.toggle('full', n >= MAX_UNI); boxes.forEach(b => (b.disabled = !b.checked && n >= MAX_UNI)); }; count();
  boxes.forEach(b => (b.onchange = count));
  $('#m-q', el).oninput = e => { const q = e.target.value.trim().toLowerCase(); let n = 0; $$('#m-u .mc-u', el).forEach(l => { const on = !q || l.dataset.s.includes(q); l.hidden = !on; if (on) n++; }); $('#m-u .mc-none', el).hidden = n > 0; };
  const tool = async (name, need) => {
    const m = $('#m-m', el), sel = picked().slice(0, MAX_UNI), o = $('#m-o', el); m.className = 'msg err'; m.textContent = '';
    if (!acc.config.ai) { m.textContent = 'AI hozircha ulanmagan.'; return; }
    if (!acc.features.includes(need)) return upsell(need, 'Bu vosita Pro tarifida.');
    if (!sel.length) { m.textContent = 'Kamida bitta universitet tanlang.'; return; }
    const head = aiHead(name === 'strategy' ? 'Qabul strategiyasi' : 'Universitet hisoboti'), btns = $$('.mc-tool', el); btns.forEach(b => (b.disabled = true));
    o.hidden = false; o.innerHTML = head + '<div class="sk" style="height:140px"></div>'; o.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try { const r = await streamAI({ tool: name, universities: sel }, txt => { o.innerHTML = `${head}<div class="pre">${md(txt)}</div>`; }); o.innerHTML = `${head}<div class="pre">${md(r.reply)}</div><p class="hint">Raqam va muddatlarni universitetning rasmiy saytida tekshiring.</p>`; aiFlag($('.pre', o), name, r.reply); }
    catch (e) { o.innerHTML = `${head}<p class="msg err">${esc(e.message)}</p>`; }
    btns.forEach(b => (b.disabled = false));
  };
  $('#m-strategy', el).onclick = () => tool('strategy', 'strategy'); $('#m-report', el).onclick = () => tool('report', 'reports');
}

/* Esse murabbiyi (#/coach): AI mentor ichidagi o‘rgatuvchi bo‘lim.
   Har bosqich: dars → namuna → talaba o‘zi yozadi → bepul tekshiruv (brauzerda) → AI fikri. Murabbiy esseni talaba o‘rniga yozmaydi. */
import { $, $$, S, ls, esc, credits, aiFlag } from './core.js';
import { md } from './markdown.js';
import { t, lang } from './i18n.js';
import { streamAI, aiOff, mentorTabs, bindMentorTabs } from './views3.js';
import { STEPS, KIND_STEPS, RANGE, BUDGET, NEEDS, content, analyze, checks, words, isDone } from './coachdata.js';

const KEY = 'qabul:coach', COST = { step: 1, plan: 2 }, CAP = { text: 2500, fb: 3200, plan: 4200 };
const CHK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ui = { tok: 0, busy: false };
let d = null;

const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const vis = () => KIND_STEPS[d.kind];
const sv = () => ls.set(KEY, d);
function load() {
  const r = ls.get(KEY, null) || {}, o = { v: 1, kind: r.kind === 'personal' ? 'personal' : 'motivation', major: String(r.major || '').slice(0, 60), uni: String(r.uni || '').slice(0, 80), cur: '', steps: {}, fb: {}, fbH: {}, plan: String(r.plan || '').slice(0, CAP.plan), planH: String(r.planH || '').slice(0, 12) };
  for (const k of STEPS) {
    o.steps[k] = String((r.steps || {})[k] || '').slice(0, CAP.text);
    const f = String((r.fb || {})[k] || '').slice(0, CAP.fb); if (f) { o.fb[k] = f; o.fbH[k] = String((r.fbH || {})[k] || '').slice(0, 12); }
  }
  const ok = [...KIND_STEPS[o.kind], 'plan']; o.cur = ok.includes(r.cur) ? r.cur : KIND_STEPS[o.kind][0];
  return o;
}
const planParts = () => vis().filter(k => NEEDS.includes(k) && (d.steps[k] || '').trim().length >= 30).map(k => ({ k, t: d.steps[k].trim() }));
const planHash = ps => hash(ps.map(p => p.k + p.t).join('|') + d.kind + d.uni + d.major);

async function css() {
  if ($('link[data-cc]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/coach.css?v=46'; l.dataset.cc = '';
  document.head.appendChild(l); await new Promise(r => { l.onload = l.onerror = r; setTimeout(r, 2500); });
}

/* ---------- chap ustun: sozlamalar va bosqichlar ---------- */
function railHTML() {
  const L = lang(), mob = matchMedia('(max-width:1000px)').matches, sum = [d.kind === 'personal' ? t('Shaxsiy esse') : t('Motivatsion xat'), d.uni || d.major].filter(Boolean).join(' · ');
  const kinds = [['motivation', 'Motivatsion xat', 'Dastur uchun'], ['personal', 'Shaxsiy esse', 'Common App']].map(([k, a, b]) => `<button type="button" role="radio" aria-checked="${d.kind === k}" data-kind="${k}"><b>${a}</b><small>${b}</small></button>`).join('');
  const items = vis().map((k, i) => { const c = content(k, L), w = words(d.steps[k]); return `<li><button type="button" class="cc-s${d.cur === k ? ' on' : ''}${isDone(k, d.steps[k]) ? ' done' : ''}" data-go="${k}"${d.cur === k ? ' aria-current="step"' : ''}><i><b>${i + 1}</b>${CHK}</i><span><em>${esc(c.name)}</em><small data-w="${k}">${w ? w + ' ' + t('so‘z') : t('Boshlanmagan')}</small></span></button></li>`; }).join('');
  const rdy = planParts().length >= 2;
  return `<details class="cc-set"${mob && sum ? '' : ' open'}><summary>${d.kind === 'personal' || d.uni || d.major ? esc(sum) : t('Hujjat turi va maqsad')}</summary>
    <div class="cc-kind" role="radiogroup" aria-label="Hujjat turi">${kinds}</div>
    <div class="field"><label class="f" for="cc-major">Yo‘nalish</label><input id="cc-major" type="text" maxlength="60" value="${esc(d.major)}" placeholder="Masalan: Computer Science" autocomplete="off"></div>
    ${d.kind === 'motivation' ? `<div class="field"><label class="f" for="cc-uni">Universitet</label><input id="cc-uni" type="text" maxlength="80" value="${esc(d.uni)}" placeholder="Masalan: University of Toronto" autocomplete="off"></div>` : ''}</details>
  <ol class="cc-steps" aria-label="${t('Bosqichlar')}">${items}<li><button type="button" class="cc-s cc-sp${d.cur === 'plan' ? ' on' : ''}${rdy ? ' done' : ''}" data-go="plan"${d.cur === 'plan' ? ' aria-current="step"' : ''}><i><b>${vis().length + 1}</b>${CHK}</i><span><em>${t('Reja')}</em><small data-w="plan">${rdy ? t('Tayyor') : t('2 bosqich kerak')}</small></span></button></li></ol>
  <p class="cc-tot"><span data-tot>${total()}</span> ${t('so‘z yozildi')}</p>`;
}
const total = () => vis().reduce((a, k) => a + words(d.steps[k]), 0);
function updRail() {
  $$('[data-w]').forEach(e => { const k = e.dataset.w; if (k === 'plan') { const r = planParts().length >= 2; e.textContent = r ? t('Tayyor') : t('2 bosqich kerak'); e.closest('.cc-s').classList.toggle('done', r); } else { const w = words(d.steps[k]); e.textContent = w ? w + ' ' + t('so‘z') : t('Boshlanmagan'); e.closest('.cc-s').classList.toggle('done', isDone(k, d.steps[k])); } });
  const T = $('[data-tot]'); if (T) T.textContent = total();
}

/* ---------- bosqich sahifasi ---------- */
const li = a => a.map(x => `<li>${esc(x)}</li>`).join('');
function stepHTML(k) {
  const c = content(k, lang()), tx = d.steps[k] || '', i = vis().indexOf(k), nx = vis()[i + 1] || 'plan', pv = vis()[i - 1];
  return `<article class="cc-step" data-k="${k}"><header><h3 class="cc-q" tabindex="-1">${esc(c.q)}</h3><p class="cc-sub">${esc(c.lesson)}</p></header>
  <details class="cc-learn"${tx.trim() ? '' : ' open'}><summary>Qoidalar va namuna</summary><div class="cc-lg">
    <div class="cc-rules"><h4>Qiling</h4><ul class="do">${li(c.do)}</ul><h4>Qilmang</h4><ul class="dont">${li(c.dont)}</ul></div>
    <div class="cc-ex"><figure class="cc-fig cc-weak"><figcaption>Zaif</figcaption>${esc(c.weak)}</figure><figure class="cc-fig cc-strong"><figcaption>Kuchliroq</figcaption>${esc(c.strong)}</figure>
      <ul class="cc-why">${li(c.why)}</ul><p class="cc-note">Namuna o‘ylab topilgan va faqat usulni ko‘rsatadi. O‘z tajribangizni o‘z so‘zlaringiz bilan yozing.</p></div></div></details>
  <section class="cc-write"><h4>Yozishdan oldin o‘zingizdan so‘rang</h4><ul class="cc-prompts">${li(c.prompts)}</ul>
    <div class="cc-paper"><div class="cc-pad"><div class="cc-mir" id="cc-mir" aria-hidden="true"></div><textarea id="cc-t" maxlength="${CAP.text}" placeholder="${esc(c.ph)}" aria-label="${esc(c.name)}">${esc(tx)}</textarea></div>
      <footer class="cc-pf"><span id="cc-wc"></span><span class="cc-leg"><i class="lc">Klishe</i><i class="lv">Noaniq so‘z</i><i class="ld">Aniq tafsilot</i></span></footer></div>
    <ul class="cc-ck" id="cc-ck"></ul><p class="cc-found" id="cc-found" hidden></p>
    <div class="cc-act"><button type="button" class="btn primary" id="cc-ai" data-do="ask">Murabbiy fikrini olish <span class="cc-cost">${COST.step} kredit</span></button><span class="hint" id="cc-hint">Matn tahlil uchun AI ga yuboriladi. Murabbiy esseni siz uchun yozmaydi.</span></div></section>
  <section class="cc-fb" id="cc-fb" aria-live="polite"></section>
  <nav class="cc-nav">${pv ? `<button type="button" class="btn" data-go="${pv}">Orqaga</button>` : '<span></span>'}<button type="button" class="btn${nx === 'plan' ? ' dark' : ''}" data-go="${nx}">${nx === 'plan' ? 'Rejaga o‘tish' : 'Keyingi bosqich'}</button></nav></article>`;
}
function mirror(text, marks) { let o = '', i = 0; for (const m of marks) { o += esc(text.slice(i, m.s)) + `<mark class="m-${m.t}">${esc(text.slice(m.s, m.e))}</mark>`; i = m.e; } return o + esc(text.slice(i)) + '​'; }
const CKL = { len: 'Hajmi mos', cliche: 'Klishesiz', det: 'Raqam yoki nom bor', first: 'Birinchi gap qisqa', uni: 'Universitet nomi tilga olingan', time: 'Bosqichlar yoki muddat ko‘rsatilgan' };
function upd() {
  const k = d.cur, tx = d.steps[k] || '', a = analyze(tx), cks = checks(k, tx, a, { uni: d.uni });
  $('#cc-mir').innerHTML = mirror(tx, a.marks);
  $('#cc-wc').textContent = a.words + ' ' + t('so‘z') + ' · ' + t('maqsad') + ' ' + RANGE[k][0] + '–' + RANGE[k][1];
  $('#cc-ck').innerHTML = cks.map(c => `<li class="${c.ok ? 'ok' : ''}"><i>${CHK}</i><span>${t(CKL[c.id])}</span>${c.val ? `<small>${esc(c.val)}</small>` : ''}</li>`).join('');
  const f = $('#cc-found'), ph = [...new Set(a.marks.filter(m => m.t === 'cliche').map(m => tx.slice(m.s, m.e).toLowerCase()))].slice(0, 4);
  f.hidden = !ph.length; if (ph.length) f.innerHTML = `<b>${t('Klishe')}:</b> ${ph.map(x => `«${esc(x)}»`).join(', ')}. ${t('Har birining o‘rniga bitta aniq lahza yoki raqam yozing.')}`;
  const b = $('#cc-ai'); if (b) b.disabled = ui.busy || tx.trim().length < 40;
  updRail(); stale();
}
function stale() { const k = d.cur, h = $('#cc-stale'); if (h && k !== 'plan') h.hidden = d.fbH[k] === hash((d.steps[k] || '').trim()); }
function fbHTML(text, tool, hd) {
  return `<div class="cc-fbh"><h4>${t(tool === 'plan' ? 'Esse rejasi' : 'Murabbiy fikri')}</h4><span class="cc-stale" id="cc-stale" hidden>${t('Matn o‘zgargan: fikrni yangilash uchun qayta so‘rang')}</span></div><div class="pre" id="cc-pre">${md(text)}</div><p class="hint">${t('AI xato qilishi mumkin; maslahatni o‘z fikringiz bilan solishtiring.')}</p>`;
}
function showFb(k) {
  const host = $('#cc-fb'); if (!host) return;
  const text = k === 'plan' ? d.plan : d.fb[k]; if (!text) { host.innerHTML = ''; return; }
  host.innerHTML = fbHTML(text, k); aiFlag($('#cc-pre'), 'coach', text); stale();
  if (k === 'plan') { const h = $('#cc-stale'); if (h) h.hidden = d.planH === planHash(planParts()); }
}

/* ---------- reja sahifasi ---------- */
const SEG = { story: 'var(--brand)', major: 'var(--ok)', uni: 'var(--warn)', goals: 'var(--navy-700)' };
function planHTML() {
  const ps = vis().filter(k => NEEDS.includes(k)), L = lang(), [lo, hi] = BUDGET[d.kind], tot = ps.reduce((a, k) => a + words(d.steps[k]), 0), scale = Math.max(hi, tot) * 1.04, rdy = planParts().length >= 2;
  const segs = ps.filter(k => words(d.steps[k])).map(k => `<i style="width:${(words(d.steps[k]) / scale * 100).toFixed(2)}%;background:${SEG[k]}"></i>`).join('');
  const lg = ps.map(k => `<li><i style="background:${SEG[k]}"></i><span>${esc(content(k, L).name)}</span><b>${words(d.steps[k])}</b></li>`).join('');
  return `<article class="cc-step cc-plan"><header><h3 class="cc-q" tabindex="-1">Esse rejasi</h3><p class="cc-sub">Yozgan bosqichlaringizdan abzatsma-abzats reja tuziladi: har abzatsning vazifasi, qaysi tafsilotingiz kerak va hajmi. Murabbiy tayyor matn yozmaydi.</p></header>
  <section class="cc-map"><div class="cc-bar" role="img" aria-label="${tot} ${t('so‘z')}">${segs}</div>
    <div class="cc-tgt"><u style="left:${(lo / scale * 100).toFixed(2)}%;width:${((hi - lo) / scale * 100).toFixed(2)}%"><span>${t('maqsad')} ${lo}–${hi}</span></u></div>
    <ul class="cc-lgd">${lg}</ul><p class="hint">${d.kind === 'personal' ? t('Common App shaxsiy essesi uchun odatiy chegara.') : t('Odatda bir sahifa. Dastur talab qilgan so‘z chegarasini rasmiy saytdan tekshiring.')}</p></section>
  ${rdy ? '' : '<div class="notice info"><div>Reja uchun kamida ikkita bosqichni to‘ldiring (har biri kamida 30 belgi).</div></div>'}
  <div class="cc-act"><button type="button" class="btn primary" id="cc-ai" data-do="plan"${rdy ? '' : ' disabled'}>Reja tuzish <span class="cc-cost">${COST.plan} kredit</span></button><span class="hint">Faqat sizning yozganlaringiz ishlatiladi. Murabbiy uydirma tafsilot qo‘shmaydi.</span></div>
  <section class="cc-fb" id="cc-fb" aria-live="polite"></section>
  <nav class="cc-nav"><button type="button" class="btn" data-go="${vis()[vis().length - 1]}">Orqaga</button><a class="btn" href="#/essay">Tayyor esseni tahlil qilish</a></nav></article>`;
}

function draw() {
  const main = $('#cc-main'), k = d.cur;
  main.innerHTML = k === 'plan' ? planHTML() : stepHTML(k);
  if (k !== 'plan') { upd(); showFb(k); } else showFb('plan');
  main.classList.remove('in'); void main.offsetWidth; main.classList.add('in');
}
function drawRail() { $('#cc-rail').innerHTML = railHTML(); }
function go(k) {
  if (![...vis(), 'plan'].includes(k)) return;
  ui.tok++; ui.busy = false; d.cur = k; sv(); drawRail(); draw();
  const q = $('.cc-q'); if (q) q.focus({ preventScroll: true });
  if (matchMedia('(max-width:1000px)').matches) { const m = $('#cc-main'); window.scrollTo({ top: m.getBoundingClientRect().top + scrollY - 76, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }); }
}

/* ---------- AI ---------- */
function note(m) { const h = $('#cc-hint'); if (h) { h.textContent = m; h.classList.add('bad'); setTimeout(() => h.classList.remove('bad'), 4000); } }
async function ask(plan) {
  if (ui.busy) return;
  const k = d.cur, my = ++ui.tok, host = $('#cc-fb'), btn = $('#cc-ai');
  let body;
  if (plan) { const ps = planParts(); if (ps.length < 2) return; body = { tool: 'coach', mode: 'plan', kind: d.kind, uni: d.uni, major: d.major, parts: ps }; }
  else { const tx = (d.steps[k] || '').trim(); if (tx.length < 40) return note(t('Avval javobingizni yozing (kamida 40 belgi).')); body = { tool: 'coach', mode: 'step', step: k, text: tx, kind: d.kind, uni: d.uni, major: d.major }; }
  if (!S.account.config.ai) { host.innerHTML = aiOff(); return; }
  ui.busy = true; btn.disabled = true; host.innerHTML = '<div class="sk" style="height:150px"></div>';
  const live = () => my === ui.tok && document.contains(host);
  try {
    const r = await streamAI(body, txt => { if (live()) host.innerHTML = `<div class="cc-fbh"><h4>${t(plan ? 'Esse rejasi' : 'Murabbiy fikri')}</h4></div><div class="pre">${md(txt)}</div>`; });
    const rep = String(r.reply || '').slice(0, plan ? CAP.plan : CAP.fb);
    if (plan) { d.plan = rep; d.planH = planHash(planParts()); } else { d.fb[k] = rep; d.fbH[k] = hash((d.steps[k] || '').trim()); }
    sv(); if (live()) showFb(plan ? 'plan' : k);
  } catch (e) { if (live()) host.innerHTML = e.code === 'AI_NOT_CONFIGURED' ? aiOff() : `<p class="msg err">${esc(e.message)}</p>`; }
  if (my === ui.tok) { ui.busy = false; const b = $('#cc-ai'); if (b) { b.disabled = false; if (!plan) upd(); else b.disabled = planParts().length < 2; } }
}

/* ---------- kirish nuqtasi ---------- */
const emTitle = s => { const x = t(s), i = x.lastIndexOf(' '); return i < 0 ? '<em>' + esc(x) + '</em>' : esc(x.slice(0, i)) + ' <em>' + esc(x.slice(i + 1)) + '</em>'; }; // sarlavhaning oxirgi soʻzi kursiv; tarjima bilan ham ishlaydi
export async function coach(el) {
  await css(); d = load(); ui.tok++; ui.busy = false;
  const c = credits();
  el.innerHTML = `<div class="page-h"><div><h2>${emTitle('Esse murabbiyi')}</h2><p>Zo‘r esse qanday yoziladi, shuni o‘rganing: qisqa dars, namuna, o‘zingiz yozasiz, murabbiy fikr bildiradi. U esseni siz uchun yozmaydi.</p></div><span class="badge" data-cr="badge">${c.left} / ${c.limit} kredit qoldi</span></div>
  ${mentorTabs('coach')}${S.account.config.ai ? '' : aiOff()}
  <div class="cc"><aside class="cc-rail" id="cc-rail"></aside><section class="cc-main" id="cc-main"></section></div>`;
  bindMentorTabs(el);
  const root = $('.cc', el); drawRail(); draw();
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-go],[data-kind],[data-do]'); if (!b || !root.contains(b)) return;
    if (b.dataset.go) go(b.dataset.go);
    else if (b.dataset.kind) { if (d.kind === b.dataset.kind) return; d.kind = b.dataset.kind; if (![...vis(), 'plan'].includes(d.cur)) d.cur = vis()[0]; sv(); ui.tok++; ui.busy = false; drawRail(); draw(); }
    else if (b.dataset.do === 'ask') ask(false); else if (b.dataset.do === 'plan') ask(true);
  });
  root.addEventListener('input', e => {
    const x = e.target;
    if (x.id === 'cc-t') { d.steps[d.cur] = x.value.slice(0, CAP.text); sv(); upd(); }
    else if (x.id === 'cc-major') { d.major = x.value.slice(0, 60); sv(); const s = $('.cc-set summary'); if (s) s.textContent = [d.kind === 'personal' ? t('Shaxsiy esse') : t('Motivatsion xat'), d.uni || d.major].filter(Boolean).join(' · '); }
    else if (x.id === 'cc-uni') { d.uni = x.value.slice(0, 80); sv(); if (d.cur === 'uni') upd(); const s = $('.cc-set summary'); if (s) s.textContent = [t('Motivatsion xat'), d.uni || d.major].filter(Boolean).join(' · '); }
  });
}

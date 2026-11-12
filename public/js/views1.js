import { $, $$, S, api, ls, esc, toast, modal, svg, fmtDate, daysLeft, catalog, refreshAccount, upsell, push, wipeLocal, errorBox } from './core.js';

export const ST = ['Rejalashtirilgan', 'Hujjat tayyorlanmoqda', 'Topshirildi', 'Natija kutilmoqda', 'Qabul qilindi', 'Rad etildi'];
export const DOCS = ['Attestat/transkript tarjimasi', 'SAT/IELTS natijalari yuborildi', 'Tavsiyanomalar', 'Esse', 'Moliyaviy hujjatlar'];
export const getProfile = () => ({ P: ls.get('qabul:profile', {}), Q: ls.get('qabul:p', {}) });
const TIER = { safety: 'Safety', target: 'Target', reach: 'Reach' };
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const accountChanged = () => document.dispatchEvent(new CustomEvent('unidoue:account'));

function completion() {
  const { P, Q } = getProfile();
  const items = [['Ism', P.pn], ['Shahar', P.pc], ['Sinf', P.pg], ['Maqsad yili', P.py], ['Bitiruv sanasi', P.pgd], ['Yo‘nalish', P.pm], ['GPA', Q.gpa], ['SAT', Q.sat], ['IELTS', Q.ielts]];
  const done = items.filter(i => i[1] != null && String(i[1]).trim() !== '').length;
  return { pct: pct(done, items.length), missing: items.filter(i => i[1] == null || String(i[1]).trim() === '').map(i => i[0]) };
}

/* ===== Graduategacha hisoblagich ===== */
const isoDay = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const shiftY = y => { const d = new Date(); d.setFullYear(d.getFullYear() + y); return isoDay(d); };
const gradMin = () => shiftY(-10), gradMax = () => shiftY(15);
const gradOk = v => /^\d{4}-\d\d-\d\d$/.test(v) && v >= gradMin() && v <= gradMax() && !isNaN(new Date(v + 'T12:00:00'));
function gradTip(n) {
  if (n > 540) return 'Hali vaqt bor: testlarga tayyorlaning va universitetlar ro‘yxatini shakllantiring.';
  if (n > 180) return 'SAT/IELTS topshirish va esse yozishni boshlash vaqti.';
  if (n > 60) return 'Arizalar va hujjatlarni yakunlash vaqti.';
  return 'So‘nggi sprint: muddatlar va topshirilmagan hujjatlarni tekshiring.';
}
function gradCard(P) {
  if (!P.pgd || !gradOk(P.pgd)) return `<section class="card s12 grad-card grad-empty"><div class="grad-l"><span class="grad-ic">🎓</span><div><h3>Graduategacha necha kun qoldi?</h3><p class="sub">Bitiruv sanangizni kiriting, hisoblagich shu yerda turadi.</p></div></div>
    <form class="grad-f" id="gd-f"><input id="gd-in" type="date" aria-label="Bitiruv sanasi" min="${gradMin()}" max="${gradMax()}"><button class="btn primary" type="submit">Saqlash</button></form></section>`;
  const n = daysLeft(P.pgd);
  if (n < 0) return `<section class="card s12 grad-card"><div class="grad-l"><span class="grad-ic">🎓</span><div><h3>Siz bitirgansiz!</h3><p class="sub">Bitiruv sanasi: ${fmtDate(P.pgd)}. Keyingi qadam — arizalar va muddatlar.</p></div></div><a class="btn sm" href="#/profile">Sanani o‘zgartirish</a></section>`;
  const wk = Math.floor(n / 7), mo = Math.floor(n / 30.44);
  return `<section class="card s12 grad-card"><div class="grad-l"><span class="grad-ic">🎓</span><div><h3>Graduategacha</h3><p class="sub">${fmtDate(P.pgd)}</p></div></div>
    <div class="grad-n"><b>${n}</b><span>${n === 1 ? 'kun' : 'kun'} qoldi</span></div>
    <div class="grad-r"><div class="grad-chips"><span>${wk} hafta</span><span>≈ ${mo} oy</span></div><p>${gradTip(n)}</p><a class="link-btn" href="#/profile">Sanani o‘zgartirish</a></div></section>`;
}

/* ================= BOSH PANEL ================= */
export async function dashboard(el) {
  const { P, Q } = getProfile(), apps = ls.get('qabul:apps', []), a = S.account, c = completion();
  const up = apps.filter(x => daysLeft(x.d) >= 0).sort((x, y) => x.d.localeCompare(y.d));
  const docsDone = apps.reduce((s, x) => s + x.docs.filter(Boolean).length, 0), docsAll = apps.length * DOCS.length;
  const name = (P.pn || S.user.name || '').split(' ')[0];
  el.innerHTML = `<div class="grid g-dash">
  <section class="card hero-card s12"><h2>Salom, <em>${esc(name)}</em></h2>
    <p>${c.pct < 100 ? `Profilingiz ${c.pct}% to‘liq. To‘liq profil universitet tavsiyalarini aniqroq qiladi.` : 'Profilingiz to‘liq. Universitetlar va muddatlarni kuzatishda davom eting.'}</p>
    <div class="acts"><a class="btn light" href="#/${c.pct < 100 ? 'profile' : 'finder'}">${c.pct < 100 ? 'Profilni to‘ldirish' : 'Universitetlarni ko‘rish'}</a><a class="btn ghost" href="#/mentor">AI mentordan so‘rash</a></div></section>
  ${gradCard(P)}
  <div class="card s4"><div class="stat"><b>${c.pct}%</b><span>Profil to‘liqligi</span></div><div class="bar" style="margin-top:12px"><i style="width:${c.pct}%"></i></div>${c.missing.length ? `<p class="hint">Yetishmaydi: ${esc(c.missing.slice(0, 4).join(', '))}</p>` : ''}</div>
  <div class="card s4"><div class="stat"><b>${apps.length}</b><span>Arizalar</span></div><div class="bar" style="margin-top:12px"><i style="width:${pct(docsDone, docsAll)}%"></i></div><p class="hint">Hujjatlar: ${docsDone}/${docsAll || 0}</p></div>
  <div class="card s4"><div class="stat"><b>${up[0] ? daysLeft(up[0].d) + ' kun' : '—'}</b><span>${up[0] ? esc(up[0].n) + ' muddatigacha' : 'Yaqin muddat yo‘q'}</span></div></div>

  <section class="card s7"><h3>Sizga mos universitetlar</h3><p class="sub">Profilingiz bo‘yicha taxminiy moslik. Bu qabul kafolati emas.</p><div id="d-match"><div class="sk" style="height:150px"></div></div></section>
  <section class="card s5"><h3>Obuna holati</h3>
    <div style="display:flex;align-items:center;gap:10px;margin:6px 0 12px"><span class="badge ${a.plan === 'pro' ? 'ok' : ''}" style="font-size:14px;padding:5px 14px">${a.plan.toUpperCase()}</span>${a.planUntil ? `<small style="color:var(--muted)">${fmtDate(new Date(a.planUntil).toISOString().slice(0, 10))} gacha</small>` : ''}</div>
    <div class="stat"><span>AI kredit (shu oy)</span></div><div class="bar ${a.usage.ai / a.limits.ai > .85 ? 'warn' : ''}" style="margin:8px 0 6px"><i style="width:${Math.min(100, pct(a.usage.ai, a.limits.ai))}%"></i></div><p class="hint">${a.usage.ai} / ${a.limits.ai} ishlatildi</p>
    <a class="btn ${a.plan === 'free' ? 'primary' : ''} sm" style="margin-top:14px" href="#/pricing">${a.plan === 'free' ? 'Tarifni yaxshilash' : 'Tarifni boshqarish'}</a></section>

  <section class="card s6"><h3>Yaqin muddatlar</h3><p class="sub">Arizalar kuzatuvchisidan.</p>${up.length ? `<div class="list">${up.slice(0, 5).map(x => { const d = daysLeft(x.d); return `<div class="li"><div class="grow"><b>${esc(x.n)}</b><small>${fmtDate(x.d)}</small></div><span class="badge ${d <= 14 ? 'bad' : d <= 45 ? 'warn' : 'mute'}">${d} kun</span></div>`; }).join('')}</div>` : '<div class="empty"><b>Muddat yo‘q</b>Arizalar bo‘limida universitet qo‘shing.<br><a class="btn sm" style="margin-top:12px" href="#/tracker">Ariza qo‘shish</a></div>'}</section>
  <section class="card s6"><h3>Ariza jarayoni</h3><p class="sub">Holatlar bo‘yicha.</p>${apps.length ? ST.map((s, i) => { const n = apps.filter(x => +x.s === i).length; return n ? `<div class="li"><div class="grow">${s}</div><b style="flex:none">${n}</b></div>` : ''; }).join('') : '<div class="empty"><b>Hali ariza yo‘q</b>Universitet tanlab, jarayonni kuzating.</div>'}</section>

  <section class="card s6" id="d-sch"><h3>Stipendiyalar</h3><div class="sk" style="height:80px;margin-top:10px"></div></section>
  <section class="card s6"><h3>AI mentor</h3><p class="sub">Universitet, ariza va esse bo‘yicha savollar.</p>
    ${a.config.ai ? `<p>Savolingizni yozing, mentor profilingizni (ruxsat bergan bo‘lsangiz) hisobga oladi.</p><a class="btn primary" style="margin-top:14px" href="#/mentor">Suhbatni boshlash</a>`
      : `<div class="notice">${svg('info')}<div>AI mentor hozircha ulanmagan: sayt egasi serverda AI kalitini sozlagach, shu yerda ishlaydi.</div></div>`}</section></div>`;

  const gf = $('#gd-f', el);
  if (gf) gf.onsubmit = ev => { ev.preventDefault(); const v = $('#gd-in', el).value; if (!gradOk(v)) { toast('Sanani to‘g‘ri tanlang.', 'err'); return; } ls.set('qabul:profile', { ...ls.get('qabul:profile', {}), pgd: v, updatedAt: new Date().toISOString() }); toast('Saqlandi ✓'); el.innerHTML = ''; dashboard(el); };

  // mos universitetlar (serverda hisoblanadi)
  const m = $('#d-match', el), prof = { gpa: Q.gpa, sc: Q.sc, sat: Q.sat, ielts: Q.ielts, ex: Q.ex, ach: Q.ach };
  if (!(Q.gpa || Q.sat || Q.ielts)) m.innerHTML = '<div class="empty"><b>Natijalaringizni kiriting</b>GPA, SAT yoki IELTS bo‘yicha tavsiya olasiz.<br><a class="btn primary sm" style="margin-top:12px" href="#/profile">Profilga o‘tish</a></div>';
  else api('/api/finder', 'POST', { profile: prof }).then(r => {
    m.innerHTML = `<div class="list">${r.items.slice(0, 5).map(u => `<div class="li"><div class="score">${u.score}</div><div class="grow"><b>${esc(u.n)}</b><small>${u.verified ? 'tekshirilgan ma’lumot' : 'taxminiy ma’lumot'}</small></div><span class="badge ${u.tier}">${TIER[u.tier]}</span></div>`).join('')}</div><a class="btn sm" style="margin-top:12px" href="#/finder">Hammasini ko‘rish</a>`;
  }).catch(e => (m.innerHTML = errorBox(e.message)));

  // stipendiyalar (faqat Plus+; serverda tekshiriladi)
  const sc = $('#d-sch', el);
  if (!a.features.includes('scholarships')) sc.innerHTML = `<h3>Stipendiyalar</h3><p class="sub">Stipendiya qidiruvi Plus tarifida.</p><a class="btn sm" href="#/pricing">Tariflarni ko‘rish</a>`;
  else api('/api/scholarships').then(r => { sc.innerHTML = `<h3>Stipendiyalar</h3>` + (r.items.length ? `<div class="list" style="margin-top:8px">${r.items.slice(0, 3).map(x => `<div class="li"><div class="grow"><b>${esc(x.name)}</b><small>${esc(x.provider || '')}</small></div></div>`).join('')}</div><a class="btn sm" style="margin-top:10px" href="#/scholarships">Hammasi</a>` : '<p class="sub">Tasdiqlangan stipendiyalar bazasi hozircha to‘ldirilmoqda.</p>'); }).catch(() => (sc.innerHTML = '<h3>Stipendiyalar</h3><p class="sub">Yuklab bo‘lmadi.</p>'));
}

/* ================= ARIZALAR ================= */
export async function tracker(el) {
  const cat = await catalog(); let apps = ls.get('qabul:apps', []); const lim = S.account.limits.apps;
  const draw = () => {
    el.innerHTML = `<div class="page-h"><div><h2>Arizalarim</h2><p>Muddatlar, hujjatlar va holatni bir joyda kuzating.</p></div><span class="badge ${apps.length >= lim ? 'warn' : ''}">${apps.length} / ${lim >= 1000 ? '∞' : lim} ariza</span></div>
    <div class="card" style="margin-bottom:18px"><div class="row" style="align-items:end"><div><label class="f" for="t-u">Universitet</label><select id="t-u">${cat.map(c => `<option value="${esc(c.id)}">${esc(c.n)}</option>`).join('')}</select></div><div><label class="f" for="t-d">Muddat</label><input id="t-d" type="date"></div><div><button class="btn primary" id="t-add" style="width:100%">Qo‘shish</button></div></div><div class="field" style="margin:12px 0 0"><label class="f" for="t-cn">Ro‘yxatda yo‘q universitet? Nomini o‘zingiz yozing (ixtiyoriy)</label><input id="t-cn" type="text" maxlength="80" placeholder="Masalan: University of Toronto"></div><div class="msg" id="t-m"></div></div>
    <div class="grid g2">${apps.length ? apps.map((x, i) => { const d = daysLeft(x.d), done = x.docs.filter(Boolean).length; return `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px"><h3>${esc(x.n)}</h3><span class="badge ${d < 0 ? 'mute' : d <= 14 ? 'bad' : d <= 45 ? 'warn' : ''}">${d < 0 ? 'muddat o‘tgan' : d + ' kun'}</span></div>
      <div class="row" style="margin:12px 0"><div><label class="f">Muddat</label><input type="date" data-i="${i}" data-date value="${esc(x.d)}"></div><div><label class="f">Holat</label><select data-i="${i}" data-st>${ST.map((s, j) => `<option value="${j}" ${+x.s === j ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <div class="bar" style="margin-bottom:10px"><i style="width:${pct(done, DOCS.length)}%"></i></div>${DOCS.map((dn, j) => `<label style="display:flex;gap:9px;padding:5px 0;cursor:pointer"><input type="checkbox" data-i="${i}" data-doc="${j}" ${x.docs[j] ? 'checked' : ''}> ${dn}</label>`).join('')}
      <button class="btn danger sm" style="margin-top:12px" data-i="${i}" data-del>O‘chirish</button></div>`; }).join('') : '<div class="card s12 empty" style="grid-column:1/-1"><b>Hali ariza qo‘shilmagan</b>Yuqoridan universitet tanlang.</div>'}</div>`;
    const sel = $('#t-u', el), dt = $('#t-d', el), fillD = () => { const c = cat.find(k => k.id === sel.value); dt.value = c ? c.rd : ''; }; sel.onchange = fillD; fillD();
    $('#t-add', el).onclick = () => {
      const cn = $('#t-cn', el).value.trim().replace(/[<>]/g, ''), c = cn ? { n: cn, rd: dt.value, rdV: false, custom: true } : cat.find(k => k.id === sel.value), m = $('#t-m', el); m.className = 'msg err';
      if (apps.length >= lim) { upsell('tracker', `${S.account.plan === 'free' ? 'Free' : 'Joriy'} tarifda ${lim} tagacha ariza saqlanadi.`); return; }
      if (apps.some(x => x.n === c.n)) { m.textContent = c.n + ' allaqachon ro‘yxatda.'; return; }
      if (!dt.value) { m.textContent = 'Muddatni kiriting.'; return; }
      apps.push({ n: c.n, d: dt.value, s: 0, docs: DOCS.map(() => false), ...(c.custom ? { custom: true } : {}) }); ls.set('qabul:apps', apps); draw();
      if (!c.rdV) toast('Muddat tekshirilmagan: rasmiy saytdan albatta tasdiqlang.');
    };
    $$('[data-date]', el).forEach(n => (n.onchange = () => { if (n.value) { apps[+n.dataset.i].d = n.value; ls.set('qabul:apps', apps); draw(); } }));
    $$('[data-st]', el).forEach(n => (n.onchange = () => { apps[+n.dataset.i].s = +n.value; ls.set('qabul:apps', apps); }));
    $$('[data-doc]', el).forEach(n => (n.onchange = () => { apps[+n.dataset.i].docs[+n.dataset.doc] = n.checked; ls.set('qabul:apps', apps); draw(); }));
    $$('[data-del]', el).forEach(n => (n.onclick = async () => { if ((await modal({ title: 'Arizani o‘chirasizmi?', body: `<p>${esc(apps[+n.dataset.i].n)} arizasi ro‘yxatdan olib tashlanadi.</p>`, actions: [{ label: 'Bekor', value: 0 }, { label: 'O‘chirish', value: 1, cls: 'danger' }] })) === 1) { apps.splice(+n.dataset.i, 1); ls.set('qabul:apps', apps); draw(); } }));
  };
  draw();
}

/* ================= TARIFLAR ================= */
const FEAT = {
  free: ['10 ta universitet natijasi', 'Safety / Target / Reach darajasi', 'Asosiy profil va moslik bali', '2 ta universitetni solishtirish', '3 tagacha ariza kuzatuvi', '15 AI kredit / oy'],
  plus: ['Barcha universitetlar + nima uchun mos ekanligi', 'Stipendiya qidiruvi', 'To‘liq qabul bashorati va maslahatlar', 'Cheksiz arizalar kuzatuvi', '3 ta universitetni solishtirish', '50 AI kredit / oy'],
  pro: ['Plusdagi hamma imkoniyatlar', 'Ilg‘or AI mentor (uzunroq suhbat va batafsil javob)', 'Shaxsiy qabul strategiyasi', 'Chuqur esse tahlili', 'Universitet hisobotlari', '4 ta universitetni solishtirish', '300 AI kredit / oy', 'Ustuvor yordam']
};
const ORDER = { free: 0, plus: 1, pro: 2 };
export async function pricing(el) {
  const { plans, config } = await api('/api/plans'); await refreshAccount(); const cur = S.account.plan;
  el.innerHTML = `<div class="page-h"><div><h2>Oddiy va <em>shaffof</em> tariflar</h2><p>Hisobingiz: <b>${cur.toUpperCase()}</b>. Bu oy AI kredit: <b>${S.account.usage.ai} / ${S.account.limits.ai}</b>.</p></div></div>
  ${config.payments ? '' : `<div class="notice info" style="margin-bottom:18px">${svg('info')}<div><b>To‘lov tizimi hali ulanmagan.</b> Plus yoki Pro uchun so‘rov yuboring: administrator tarifni qo‘lda yoqadi. To‘lov qabul qilinmaydi va tarif so‘rov yuborish bilan o‘zgarmaydi.</div></div>`}
  <div class="grid g3">${plans.map(p => `<section class="card plan ${p.id === 'plus' ? 'feat' : ''}">${p.id === 'plus' ? '<span class="badge pop">Mashhur</span>' : ''}<div><h3>${p.name}</h3></div><div class="price">$${p.price === 0 ? '0' : p.price}<small>${p.price ? ' / oy' : ''}</small></div>
    <ul>${FEAT[p.id].map(f => `<li>${f}</li>`).join('')}</ul><div style="margin-top:auto">${
      p.id === cur ? '<button class="btn" disabled style="width:100%">Joriy tarif</button>'
      : ORDER[p.id] < ORDER[cur] ? `<button class="btn" style="width:100%" data-down="${p.id}">${p.name} ga o‘tish</button>`
      : `<button class="btn ${p.id === 'plus' ? 'primary' : 'dark'}" style="width:100%" data-up="${p.id}">${p.name} uchun so‘rov yuborish</button>`}</div></section>`).join('')}</div>
  <div class="card" style="margin-top:18px"><h3>AI kredit qanday sarflanadi</h3><p class="sub">Limit har oy yangilanadi. Xatolik bo‘lsa, kredit yechilmaydi.</p><div class="row"><div class="stat"><b>1</b><span>mentor savoli</span></div><div class="stat"><b>2 / 4</b><span>esse tahlili (oddiy / chuqur)</span></div><div class="stat"><b>6</b><span>strategiya yoki hisobot</span></div></div></div>
  <p class="hint" style="margin-top:14px">Qabul natijasi hech bir tarifda kafolatlanmaydi. Narxlar AQSh dollarida.</p>`;
  $$('[data-up]', el).forEach(b => (b.onclick = async () => { b.disabled = true; try { await api('/api/plan/request', 'POST', { plan: b.dataset.up }); toast('So‘rov yuborildi. Administrator siz bilan bog‘lanadi.'); } catch (e) { toast(e.message, 'err'); } b.disabled = false; }));
  $$('[data-down]', el).forEach(b => (b.onclick = async () => {
    if ((await modal({ title: 'Tarifni pasaytirasizmi?', body: '<p>Yuqori tarif imkoniyatlari darhol o‘chadi. Ma’lumotlaringiz saqlanadi, lekin arizalar limiti oshgan bo‘lsa yangilari qo‘shilmaydi.</p>', actions: [{ label: 'Bekor', value: 0 }, { label: 'Pasaytirish', value: 1, cls: 'danger' }] })) !== 1) return;
    try { const r = await api('/api/plan/downgrade', 'POST', { plan: b.dataset.down }); S.account = r.account; accountChanged(); toast('Tarif o‘zgartirildi.'); pricing(el); } catch (e) { toast(e.message, 'err'); }
  }));
}

/* ================= PROFIL ================= */
export async function profile(el) {
  const { P, Q } = getProfile(), a = S.account, opt = (arr, v) => arr.map(([val, t]) => `<option value="${val}" ${String(v) === String(val) ? 'selected' : ''}>${t}</option>`).join('');
  el.innerHTML = `<div class="page-h"><div><h2>Mening <em>profilim</em></h2><p>Ma’lumotlaringiz hisobingizda saqlanadi va barcha qurilmalarda sinxron bo‘ladi.</p></div></div>
  <div class="grid g2"><form class="card" id="p-f" novalidate><h3>Shaxsiy ma’lumot</h3><p class="sub">Tavsiyalar shunga tayanadi.</p>
    <div class="field"><label class="f" for="pn">Ism</label><input id="pn" type="text" maxlength="40" value="${esc(P.pn || S.user.name)}"></div>
    <div class="row"><div class="field"><label class="f" for="pc">Shahar</label><input id="pc" type="text" maxlength="40" value="${esc(P.pc)}"></div><div class="field"><label class="f" for="pm">Qiziqqan yo‘nalish</label><input id="pm" type="text" maxlength="60" value="${esc(P.pm)}" placeholder="Informatika, biznes…"></div></div>
    <div class="row"><div class="field"><label class="f" for="pg">Sinf</label><select id="pg">${opt([['9-sinf', '9-sinf'], ['10-sinf', '10-sinf'], ['11-sinf', '11-sinf'], ['Bitirganman', 'Bitirganman']], P.pg || '11-sinf')}</select></div><div class="field"><label class="f" for="py">Maqsad yili</label><select id="py">${opt([[2027, 2027], [2028, 2028], [2029, 2029]], P.py || 2027)}</select></div></div>
    <div class="field"><label class="f" for="pgd">Bitiruv (graduate) sanasi</label><input id="pgd" type="date" value="${esc(P.pgd || '')}" min="${gradMin()}" max="${gradMax()}"><div class="hint">Bosh panelda “graduategacha necha kun qoldi” hisoblagichi chiqadi.</div></div>
    <h3 style="margin-top:8px">Akademik natijalar</h3><p class="sub">Kamida bittasini kiriting.</p>
    <div class="row"><div class="field"><label class="f" for="pgpa">GPA</label><div style="display:flex;gap:6px"><input id="pgpa" type="number" step="0.01" min="0" max="100" value="${esc(Q.gpa)}" style="min-width:0"><select id="psc" style="width:88px">${opt([[4, '/ 4'], [5, '/ 5'], [10, '/ 10'], [100, '/ 100']], Q.sc || 5)}</select></div></div><div class="field"><label class="f" for="psat">SAT</label><input id="psat" type="number" min="400" max="1600" value="${esc(Q.sat)}"></div><div class="field"><label class="f" for="pie">IELTS</label><input id="pie" type="number" step="0.5" min="0" max="9" value="${esc(Q.ielts)}"></div></div>
    <div class="row"><div class="field"><label class="f" for="pex">Olimpiada, loyiha, volontyorlik</label><select id="pex">${opt([[0, 'Hali yo‘q'], [1, 'Bir oz'], [2, 'Yaxshi'], [3, 'Juda kuchli']], Q.ex ?? 1)}</select></div><div class="field"><label class="f" for="pach">Akademik yutuqlar</label><select id="pach">${opt([['', 'Kiritilmagan'], [0, 'Yo‘q'], [1, 'Maktab olimpiadasi'], [2, 'Respublika / viloyat'], [3, 'Xalqaro']], Q.ach ?? '')}</select></div></div>
    <button class="btn primary" type="submit">Saqlash</button><div class="msg" id="p-m" role="status"></div></form>
  <div class="grid" style="align-content:start"><section class="card"><h3>AI mentor xotirasi</h3><p class="sub">Mentor profilingizni eslab qolishi uchun ruxsat bering. Istalgan vaqtda o‘chirishingiz mumkin.</p>
    <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="p-cons" ${a.consent.mentorMemory ? 'checked' : ''} style="margin-top:4px"><span>Mentor GPA, SAT, IELTS, sinf va yo‘nalishimdan foydalanishiga ruxsat beraman. Ism va email yuborilmaydi.</span></label><div class="msg" id="p-cm"></div></section>
  <section class="card"><h3>Zaxira nusxa</h3><p class="sub">Ma’lumotlaringizni matn sifatida saqlab qo‘ying.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="p-ex">Nusxa olish</button><button class="btn sm" id="p-im">Tiklash</button></div><textarea id="p-bt" rows="3" style="margin-top:10px;min-height:70px" placeholder="Zaxira matni shu yerga"></textarea><div class="msg" id="p-bm"></div></section>
  <section class="card"><h3>Hisob</h3><p class="sub">${esc(S.user.email)}</p><button class="btn danger sm" id="p-del">Hisobni butunlay o‘chirish</button></section></div></div>`;
  $('#p-f', el).onsubmit = ev => {
    ev.preventDefault(); const g = id => $('#' + id, el).value.trim(), m = $('#p-m', el); m.className = 'msg err';
    if (g('pn').length < 2) { m.textContent = 'Ismingizni kiriting.'; return; }
    if (g('pgd') && !gradOk(g('pgd'))) { m.textContent = 'Bitiruv sanasini tekshiring (oxirgi 10 yil va keyingi 15 yil oralig‘ida bo‘lsin).'; return; }
    const gpa = g('pgpa'), sc = +g('psc'), sat = g('psat'), ie = g('pie');
    if ((gpa && (!(+gpa > 0) || +gpa > sc)) || (sat && (+sat < 400 || +sat > 1600)) || (ie && (+ie < 0 || +ie > 9))) { m.textContent = 'Natijalarni tekshiring: GPA shkaladan oshmasin, SAT 400–1600, IELTS 0–9.'; return; }
    ls.set('qabul:profile', { ...P, pn: g('pn'), pc: g('pc'), pm: g('pm'), pg: g('pg'), py: g('py'), pgd: g('pgd'), created: true, updatedAt: new Date().toISOString() });
    ls.set('qabul:p', { gpa, sc: String(sc), sat, ielts: ie, ex: g('pex'), ach: g('pach') });
    m.className = 'msg ok'; m.textContent = 'Saqlandi ✓';
  };
  $('#p-cons', el).onchange = async e => { const m = $('#p-cm', el); try { const r = await api('/api/consent', 'POST', { mentorMemory: e.target.checked }); S.account = r.account; m.className = 'msg ok'; m.textContent = e.target.checked ? 'Ruxsat berildi.' : 'Ruxsat bekor qilindi.'; } catch (x) { e.target.checked = !e.target.checked; m.className = 'msg err'; m.textContent = x.message; } };
  const dumpTxt = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('qabul:') && k !== 'qabul:sync') o[k] = localStorage.getItem(k); } return JSON.stringify(o); };
  $('#p-ex', el).onclick = () => { const t = dumpTxt(); $('#p-bt', el).value = t; $('#p-bt', el).select(); try { navigator.clipboard.writeText(t); $('#p-bm', el).textContent = 'Nusxalandi.'; } catch (e) { $('#p-bm', el).textContent = 'Matnni qo‘lda nusxalang.'; } };
  $('#p-im', el).onclick = () => { const m = $('#p-bm', el); try { const o = JSON.parse($('#p-bt', el).value); let n = 0; for (const k in o) if (k.startsWith('qabul:') && k !== 'qabul:sync' && typeof o[k] === 'string') { ls.set(k, JSON.parse(o[k])); n++; } m.textContent = n ? 'Tiklandi: ' + n + ' ta yozuv.' : 'Zaxira topilmadi.'; } catch (e) { m.textContent = 'Matn noto‘g‘ri.'; } };
  $('#p-del', el).onclick = async () => {
    const v = await modal({ title: 'Hisobni o‘chirasizmi?', body: '<p>Profil, natijalar, arizalar va so‘rovlaringiz butunlay o‘chadi. Qaytarib bo‘lmaydi. Tasdiqlash uchun parolingizni kiriting.</p><div class="field" style="margin-top:12px"><input id="dpw" type="password" autocomplete="current-password" placeholder="Parol"></div>', actions: [{ label: 'Bekor', value: 0 }, { label: 'O‘chirish', value: 1, cls: 'danger' }], collect: bg => ($('#dpw', bg) || {}).value });
    if (v !== 1) return;
    const pw = modal.data;
    try { await api('/api/account', 'DELETE', { password: pw || '' }); wipeLocal(); location.hash = ''; location.reload(); } catch (e) { toast(e.message, 'err'); }
  };
}

/* ================= YO'L XARITASI ================= */
const stepsFor = (c, Q) => {
  const S = [], add = (o, t) => S.push({ o, t }), sat = Q.sat ? +Q.sat : null, ie = Q.ielts ? +Q.ielts : null;
  add(150, 'Universitet saytida talablar va hujjatlar ro‘yxatini o‘qib chiqing, ariza akkauntini oching');
  if (sat != null) add(120, c && sat < c.sat[0] ? 'SAT natijasini qayta topshirish rejasini tuzing' : 'SAT natijalarini universitet talabiga ko‘ra yuboring');
  if (ie != null && c && c.ielts != null && ie < c.ielts) add(110, 'IELTS natijasini universitetning rasmiy talabiga moslang');
  add(90, 'Ikki o‘qituvchidan tavsiya xati (recommendation) so‘rang');
  add(75, 'Asosiy esse (Personal Statement) birinchi variantini yozing');
  add(60, +Q.ex < 2 ? 'Yangi loyiha yoki olimpiadani boshlang va faolliklar ro‘yxatini tuzing' : 'Faolliklar ro‘yxatini (Activities) yutuqlar bilan tayyorlang');
  add(50, 'Grant va stipendiya imkoniyatlarini rasmiy saytdan o‘rganing');
  add(45, 'Moliyaviy yordam (financial aid) hujjatlarini tayyorlang');
  add(30, 'Esseni 2 kishiga tekshirtirib, oxirgi tahrir qiling');
  add(21, 'Attestat va transkriptni tarjima qildiring, tasdiqlatib oling');
  add(7, 'Barcha bo‘limlarni oxirgi marta tekshiring');
  add(0, 'Ariza topshirish muddati!');
  return S;
};
export async function roadmap(el) {
  const cat = await catalog(), apps = ls.get('qabul:apps', []), { Q } = getProfile();
  el.innerHTML = `<div class="page-h"><div><h2>Yo‘l <em>xaritasi</em></h2><p>Ariza muddatidan orqaga hisoblangan qadamlar. Belgilaringiz hisobingizda saqlanadi.</p></div></div>`;
  if (!apps.length) { el.insertAdjacentHTML('beforeend', '<div class="card empty"><b>Avval ariza qo‘shing</b>Yo‘l xaritasi arizalaringiz muddatiga qarab tuziladi.<br><a class="btn primary" style="margin-top:14px" href="#/tracker">Arizalarga o‘tish</a></div>'); return; }
  el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px"><label class="f" for="r-u">Universitet</label><select id="r-u">${apps.map((a, i) => `<option value="${i}">${esc(a.n)}</option>`).join('')}</select></div><div id="r-o"></div>`);
  const out = $('#r-o', el), draw = () => {
    const a = apps[+$('#r-u', el).value], c = cat.find(x => x.n === a.n), steps = stepsFor(c, Q), key = 'qabul:s:' + a.n, saved = ls.get(key, {}), dd = new Date(a.d + 'T12:00:00');
    const done = () => steps.filter((s, k) => saved[k]).length;
    out.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h3>${esc(a.n)}</h3><span class="badge">${fmtDate(a.d)}${c && !c.rdV ? ' · muddat taxminiy' : ''}</span></div><p class="sub" id="r-p"></p><div class="bar" style="margin-bottom:16px"><i id="r-b"></i></div>
    ${steps.map((s, k) => { const d = new Date(dd - s.o * 864e5), left = Math.ceil((d - Date.now()) / 864e5); return `<label class="li" style="cursor:pointer"><input type="checkbox" data-k="${k}" ${saved[k] ? 'checked' : ''}><span class="grow" ${saved[k] ? 'style="text-decoration:line-through;color:var(--muted)"' : ''}>${esc(s.t)}</span><span class="badge ${left < 0 && !saved[k] ? 'bad' : 'mute'}">${d.getDate()}-${['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'][d.getMonth()]}</span></label>`; }).join('')}
    <button class="btn sm" id="r-cp" style="margin-top:14px">Rejani nusxalash</button><span class="hint" id="r-cm"></span></div>`;
    const upd = () => { $('#r-p', out).textContent = `${done()} / ${steps.length} qadam bajarildi`; $('#r-b', out).style.width = pct(done(), steps.length) + '%'; }; upd();
    $$('[data-k]', out).forEach(i => (i.onchange = () => { saved[i.dataset.k] = i.checked; ls.set(key, saved); draw(); }));
    $('#r-cp', out).onclick = () => { const t = `${a.n} — yo‘l xaritasi\n` + steps.map((s, k) => `${saved[k] ? '[x]' : '[ ]'} ${fmtDate(new Date(dd - s.o * 864e5).toISOString().slice(0, 10))} — ${s.t}`).join('\n'); navigator.clipboard.writeText(t).then(() => ($('#r-cm', out).textContent = ' Nusxalandi'), () => ($('#r-cm', out).textContent = ' Nusxalab bo‘lmadi')); };
  };
  $('#r-u', el).onchange = draw; draw();
}

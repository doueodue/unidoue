import { $, $$, S, api, ls, esc, toast, modal, svg, fmtDate, daysLeft, catalog, refreshAccount, upsell, push, wipeLocal, errorBox, credits } from './core.js';
import { t, dateL } from './i18n.js';
import * as pn from './push.js';

export const ST = ['Rejalashtirilgan', 'Hujjat tayyorlanmoqda', 'Topshirildi', 'Natija kutilmoqda', 'Qabul qilindi', 'Rad etildi'];
export const DOCS = ['Attestat/transkript tarjimasi', 'SAT/IELTS natijalari yuborildi', 'Tavsiyanomalar', 'Esse', 'Moliyaviy hujjatlar'];
export const getProfile = () => ({ P: ls.get('qabul:profile', {}), Q: ls.get('qabul:p', {}) });
const TIER = { safety: 'Safety', target: 'Target', reach: 'Reach' };
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const accountChanged = () => document.dispatchEvent(new CustomEvent('unidoue:account'));

/** Profil to‘liqligi. Qoidalar profil formasi bilan bir xil: SAT va IELTS dan kamida bittasi yetarli (ikkalasi shart emas),
 *  ism hisob nomidan olinadi, maydon faqat to‘g‘ri qiymat bo‘lsa to‘lgan hisoblanadi. */
const has = v => v != null && String(v).trim() !== '';
function completion() {
  const { P, Q } = getProfile(), sc = +Q.sc || 5;
  const okNum = (v, lo, hi) => has(v) && Number.isFinite(+v) && +v >= lo && +v <= hi;
  const items = [
    ['Ism', has(P.pn) || has(S.user && S.user.name)], ['Shahar', has(P.pc)], ['Yo‘nalish', has(P.pm)],
    ['Sinf', has(P.pg)], ['Maqsad yili', has(P.py)], ['Bitiruv sanasi', has(P.pgd) && gradOk(P.pgd)],
    ['GPA', okNum(Q.gpa, 0.01, sc)], ['SAT yoki IELTS', okNum(Q.sat, 400, 1600) || okNum(Q.ielts, 1, 9)]
  ];
  const done = items.filter(i => i[1]).length;
  return { pct: pct(done, items.length), missing: items.filter(i => !i[1]).map(i => i[0]) };
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
  const { P, Q } = getProfile(), apps = ls.get('qabul:apps', []), a = S.account, c = completion(), cr = credits();
  const up = apps.filter(x => daysLeft(x.d) >= 0).sort((x, y) => x.d.localeCompare(y.d));
  const docsDone = apps.reduce((s, x) => s + x.docs.filter(Boolean).length, 0), docsAll = apps.length * DOCS.length;
  const name = (P.pn || S.user.name || '').split(' ')[0];
  el.innerHTML = `<div class="grid g-dash">
  <section class="card hero-card s12"><h2>Salom, <em>${esc(name)}</em></h2>
    <p>${c.pct < 100 ? `Profilingiz ${c.pct}% to‘liq. To‘liq profil universitet tavsiyalarini aniqroq qiladi.` : 'Profilingiz to‘liq. Universitetlar va muddatlarni kuzatishda davom eting.'}</p>
    <div class="acts"><a class="btn light" href="#/${c.pct < 100 ? 'profile' : 'finder'}">${c.pct < 100 ? 'Profilni to‘ldirish' : 'Universitetlarni ko‘rish'}</a><a class="btn ghost" href="#/mentor">AI mentordan so‘rash</a></div></section>
  ${gradCard(P)}
  <a class="card tg-card s12" href="https://t.me/unidoue" target="_blank" rel="noopener noreferrer"><span class="tg-ic">✈</span><span><b>Telegram kanalimizga qo‘shiling</b><small>Yangi universitetlar, muddatlar va foydali maslahatlar</small></span><span class="btn sm">Qo‘shilish</span></a>
  <div class="card s4"><div class="stat"><b>${c.pct}%</b><span>Profil to‘liqligi</span></div><div class="bar" style="margin-top:12px"><i style="width:${c.pct}%"></i></div>${c.missing.length ? `<p class="hint">Yetishmaydi: ${esc(c.missing.slice(0, 4).join(', '))}</p>` : ''}</div>
  <div class="card s4"><div class="stat"><b>${apps.length}</b><span>Arizalar</span></div><div class="bar" style="margin-top:12px"><i style="width:${pct(docsDone, docsAll)}%"></i></div><p class="hint">Hujjatlar: ${docsDone}/${docsAll || 0}</p></div>
  <div class="card s4"><div class="stat"><b>${up[0] ? daysLeft(up[0].d) + ' kun' : '—'}</b><span>${up[0] ? esc(up[0].n) + ' muddatigacha' : 'Yaqin muddat yo‘q'}</span></div></div>

  <section class="card s7"><h3>Sizga mos universitetlar</h3><p class="sub">Profilingiz bo‘yicha taxminiy moslik. Bu qabul kafolati emas.</p><div id="d-match"><div class="sk" style="height:150px"></div></div></section>
  <section class="card s5"><h3>Obuna holati</h3>
    <div style="display:flex;align-items:center;gap:10px;margin:6px 0 12px"><span class="badge ${a.plan !== 'free' ? 'ok' : ''}" style="font-size:14px;padding:5px 14px">${a.plan.toUpperCase()}</span>${a.planUntil ? `<small style="color:var(--muted)">${fmtDate(new Date(a.planUntil).toISOString().slice(0, 10))} gacha</small>` : ''}</div>
    <div class="stat"><span>AI kredit (shu oy)</span></div><div class="bar ${cr.pct > 85 ? 'warn' : ''}" style="margin:8px 0 6px"><i data-cr="bar" style="width:${cr.pct}%"></i></div><p class="hint" data-cr="badge">${cr.left} / ${cr.limit} kredit qoldi</p>
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

  // stipendiyalar (serverda tekshiriladi)
  const sc = $('#d-sch', el);
  if (!a.features.includes('scholarships')) sc.innerHTML = `<h3>Stipendiyalar</h3><p class="sub">Stipendiya qidiruvi hozir mavjud emas.</p><a class="btn sm" href="#/pricing">Tariflarni ko‘rish</a>`;
  else api('/api/scholarships').then(r => { sc.innerHTML = `<h3>Stipendiyalar</h3>` + (r.items.length ? `<div class="list" style="margin-top:8px">${r.items.slice(0, 3).map(x => `<div class="li"><div class="grow"><b>${esc(x.name)}</b><small>${esc(x.provider || '')}</small></div></div>`).join('')}</div><a class="btn sm" style="margin-top:10px" href="#/scholarships">Hammasi</a>` : '<p class="sub">Tasdiqlangan stipendiyalar bazasi hozircha to‘ldirilmoqda.</p>'); }).catch(() => (sc.innerHTML = '<h3>Stipendiyalar</h3><p class="sub">Yuklab bo‘lmadi.</p>'));
}


/* Muddatlarni kalendarga (.ics) yuklab olish */
function icsEsc(t) { return String(t).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n'); }
function downloadIcs(list, name) {
  const z = n => String(n).padStart(2, '0'), ymd = d => d.replace(/-/g, ''), now = new Date(), st = now.getUTCFullYear() + z(now.getUTCMonth() + 1) + z(now.getUTCDate()) + 'T' + z(now.getUTCHours()) + z(now.getUTCMinutes()) + z(now.getUTCSeconds()) + 'Z';
  const ev = list.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x.d)).map((x, i) => { const e = new Date(x.d + 'T12:00:00'); e.setDate(e.getDate() + 1); const end = e.getFullYear() + z(e.getMonth() + 1) + z(e.getDate());
    return ['BEGIN:VEVENT', 'UID:' + ymd(x.d) + '-' + i + '-' + encodeURIComponent(x.n).replace(/%/g, '') + '@unidoue.uz', 'DTSTAMP:' + st, 'DTSTART;VALUE=DATE:' + ymd(x.d), 'DTEND;VALUE=DATE:' + end, 'SUMMARY:' + icsEsc('UniDoue: ' + x.n + ' ' + t('ariza muddati')), 'DESCRIPTION:' + icsEsc(t('Muddatni universitetning rasmiy saytidan tasdiqlang. unidoue.uz')),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(x.n + ': ' + t('muddatga 14 kun qoldi')), 'TRIGGER:-P14D', 'END:VALARM', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(x.n + ': ' + t('muddatga 3 kun qoldi')), 'TRIGGER:-P3D', 'END:VALARM', 'END:VEVENT'].join('\r\n'); });
  if (!ev.length) { toast('Kalendarga qo‘shish uchun muddat kerak.'); return; }
  const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UniDoue//uz', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ================= ARIZALAR ================= */
export async function tracker(el) {
  const cat = await catalog(); let apps = ls.get('qabul:apps', []); const lim = S.account.limits.apps;
  const draw = () => {
    el.innerHTML = `<div class="page-h"><div><h2>Arizalarim</h2><p>Muddatlar, hujjatlar va holatni bir joyda kuzating.</p></div><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="badge ${apps.length >= lim ? 'warn' : ''}">${apps.length} / ${lim >= 1000 ? '∞' : lim} ariza</span>${apps.length ? '<button class="btn sm" id="t-ics" type="button">📅 Kalendarga qo‘shish</button>' : ''}</span></div>
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
    const ib = $('#t-ics', el); if (ib) ib.onclick = () => downloadIcs(apps, 'unidoue-muddatlar.ics');
    $$('[data-date]', el).forEach(n => (n.onchange = () => { if (n.value) { apps[+n.dataset.i].d = n.value; ls.set('qabul:apps', apps); draw(); } }));
    $$('[data-st]', el).forEach(n => (n.onchange = () => { apps[+n.dataset.i].s = +n.value; ls.set('qabul:apps', apps); }));
    $$('[data-doc]', el).forEach(n => (n.onchange = () => { apps[+n.dataset.i].docs[+n.dataset.doc] = n.checked; ls.set('qabul:apps', apps); draw(); }));
    $$('[data-del]', el).forEach(n => (n.onclick = async () => { if ((await modal({ title: 'Arizani o‘chirasizmi?', body: `<p>${esc(apps[+n.dataset.i].n)} arizasi ro‘yxatdan olib tashlanadi.</p>`, actions: [{ label: 'Bekor', value: 0 }, { label: 'O‘chirish', value: 1, cls: 'danger' }] })) === 1) { apps.splice(+n.dataset.i, 1); ls.set('qabul:apps', apps); draw(); } }));
  };
  draw();
}

/* ================= TARIFLAR ================= */
const FEAT = {
  plus: ['Bepul tarifdagi hamma imkoniyatlar', 'Ilg‘or AI mentor (uzunroq suhbat va batafsil javob)', '4 ta universitetni solishtirish', '175 AI kredit / oy'],
  free: ['Barcha universitetlar + nima uchun mos ekanligi', 'Universitet haqida ma’lumot (manbalar bilan)', 'Stipendiya qidiruvi', 'To‘liq moslik tahlili va maslahatlar', 'Cheksiz arizalar kuzatuvi', '3 ta universitetni solishtirish', '15 AI kredit / oy'],
  pro: ['Bepul tarifdagi hamma imkoniyatlar', 'Ilg‘or AI mentor (uzunroq suhbat va batafsil javob)', 'Shaxsiy qabul strategiyasi', 'Chuqur esse tahlili', 'Universitet hisobotlari', '4 ta universitetni solishtirish', '300 AI kredit / oy', 'Ustuvor yordam']
};
const ORDER = { free: 0, plus: 1, pro: 2 };
function payBox(a, cur, online) {
  const pay = a.pay || {};
  if (cur !== 'free' && online) return a.planUntil ? `<div class="notice info" style="margin-bottom:18px">${svg('info')}<div><b>${cur === 'pro' ? 'Pro' : 'Plus'} faol.</b> Amal qilish muddati: <b>${new Date(a.planUntil).toLocaleDateString('uz-UZ')}</b> gacha. Uzaytirish uchun pastdagi tugmalardan foydalaning.</div></div>` : '';
  if (cur !== 'free') return a.planUntil ? `<div class="notice info" style="margin-bottom:18px">${svg('info')}<div><b>${cur === 'pro' ? 'Pro' : 'Plus'} faol.</b> Amal qilish muddati: <b>${new Date(a.planUntil).toLocaleDateString('uz-UZ')}</b> gacha. Uzaytirish uchun to‘lovdan keyin yozing: <a href="https://t.me/unidoue_yordam" target="_blank" rel="noopener noreferrer">@unidoue_yordam</a>.</div></div>` : '';
  if (!pay.requested) return '';
  const info = pay.info ? `Karta: <b>${esc(pay.info.card)}</b>${pay.info.holder ? ' (' + esc(pay.info.holder) + ')' : ''}. ` : '';
  return `<div class="card" style="margin-bottom:18px"><h3>${pay.plan === 'plus' ? 'Plus' : 'Pro'} uchun to‘lov</h3><p class="sub">So‘rovingiz qabul qilindi. ${pay.plan === 'plus' ? 'Plus' : 'Pro'} to‘lov tekshirilgandan keyin qo‘lda yoqiladi, avtomatik emas.</p>
    <ol style="margin:0 0 10px 18px;padding:0"><li>Narx: <b>$${Number(pay.price || 4.99).toFixed(2)} / oy</b>. ${info}${pay.info ? '' : 'To‘lov rekvizitlarini olish uchun yozing: <a href="https://t.me/unidoue_yordam" target="_blank" rel="noopener noreferrer">@unidoue_yordam</a>.'}</li>
    <li>To‘lov izohiga yoki xabarga shu kodni yozing: <b>${esc(pay.ref)}</b></li>
    <li>Chekni (skrinshot) <a href="https://t.me/unidoue_yordam" target="_blank" rel="noopener noreferrer">@unidoue_yordam</a> ga yuboring va hisob emailingizni ayting: <b>${esc(S.user.email)}</b></li></ol>
    <p class="hint">Odatda tekshirish va yoqish bir necha soat ichida bo‘ladi.</p></div>`;
}
/** Payme/Click sahifasidan qaytgach: buyurtma holatini tekshiramiz (provayder serverimizga xabar bergunicha bir necha soniya ketishi mumkin). */
async function checkPaid(el, id) {
  const box = document.createElement('div'); box.className = 'notice info'; box.style.marginBottom = '18px'; box.setAttribute('role', 'status');
  const show = html => { box.innerHTML = svg('info') + '<div>' + html + '</div>'; };
  show('<b>To‘lov tekshirilmoqda…</b> Bir necha soniya kuting.');
  (el.querySelector('.page-h') || el.firstChild).after(box);
  for (let i = 0; i < 20; i++) {
    let r; try { r = await api('/api/pay/order?id=' + id); } catch (e) { box.remove(); return; }
    if (!el.isConnected) return;
    if (r.state === 'paid') {
      history.replaceState(null, '', '#/pricing'); await refreshAccount(); accountChanged(); toast('To‘lov qabul qilindi. Tarif yoqildi ✓'); return pricing(el);
    }
    if (r.state !== 'new') { history.replaceState(null, '', '#/pricing'); show('<b>Bu buyurtma yopilgan.</b> Yangi to‘lov uchun tarifni qayta tanlang.'); return; }
    await new Promise(r2 => setTimeout(r2, 2000));
  }
  show(`<b>To‘lov hali tasdiqlanmadi.</b> Agar pul yechilgan bo‘lsa, tarif bir necha daqiqada yoqiladi. Yoqilmasa <a href="https://t.me/unidoue_yordam" target="_blank" rel="noopener noreferrer">@unidoue_yordam</a> ga yozing va buyurtma kodini ayting: <b>${esc(id)}</b>. <button class="btn sm" id="pay-recheck" type="button" style="margin-left:6px">Qayta tekshirish</button>`);
  const rb = $('#pay-recheck', box); if (rb) rb.onclick = () => { box.remove(); checkPaid(el, id); };
}
export async function pricing(el) {
  const { plans, config } = await api('/api/plans'); await refreshAccount(); const cur = S.account.plan;
  const online = config.payments && config.online ? config.online : null;
  const payButtons = (p, renew) => `<div class="paybtns"><div class="hint">${renew ? 'Muddatni 30 kunga uzaytirish' : '30 kunlik tarif'}</div>
    ${online.payme ? `<button class="btn ${p.id === 'pro' ? 'primary' : 'dark'}" style="width:100%" data-pay="${p.id}" data-prov="payme">Payme orqali to‘lash</button>` : ''}${online.click ? `<button class="btn" style="width:100%" data-pay="${p.id}" data-prov="click">Click orqali to‘lash</button>` : ''}</div>`;
  el.innerHTML = `<div class="page-h"><div><h2>Oddiy va <em>shaffof</em> tariflar</h2><p>Hisobingiz: <b>${cur.toUpperCase()}</b>. Bu oy AI kredit: <b data-cr="frac">${credits().left} / ${credits().limit}</b> qoldi.</p></div></div>
  ${payBox(S.account, cur, !!online)}
  ${config.payments ? `<div class="notice info" style="margin-bottom:18px">${svg('info')}<div><b>Karta bilan to‘lash.</b> To‘lov Payme yoki Click sahifasida amalga oshadi, karta ma’lumotlari UniDoue’ga berilmaydi. Tarif to‘lovdan keyin darhol yoqiladi va 30 kun amal qiladi, avtomatik yechilmaydi. Yuqoriroq tarifga o‘tsangiz, yangi 30 kun to‘lovdan boshlab hisoblanadi.</div></div>` : `<div class="notice info" style="margin-bottom:18px">${svg('info')}<div><b>To‘lov qo‘lda qabul qilinadi.</b> So‘rov yuboring, to‘lov ko‘rsatmasini olasiz. Administrator to‘lovni tekshirib, tarifni qo‘lda yoqadi. Tarif so‘rov yuborish bilan o‘zgarmaydi.</div></div>`}
  <div class="grid g3">${plans.map(p => `<section class="card plan ${p.id === 'pro' ? 'feat' : ''}">${p.id === 'pro' ? '<span class="badge pop">Mashhur</span>' : ''}<div><h3>${p.name}</h3></div><div class="price">$${p.price === 0 ? '0' : p.price.toFixed(2)}<small>${p.price ? ' / oy' : ''}</small></div>${online && p.uzs ? `<div class="uzs"><b>${p.uzs.toLocaleString('en-US').replace(/,/g, ' ')}</b> <span>so‘m / oy</span></div>` : ''}
    <ul>${FEAT[p.id].map(f => `<li>${f}</li>`).join('')}</ul><div style="margin-top:auto">${
      p.id === cur ? (online && cur !== 'free' && S.account.planUntil ? payButtons(p, true) : '<button class="btn" disabled style="width:100%">Joriy tarif</button>')
      : ORDER[p.id] < ORDER[cur] ? `<button class="btn" style="width:100%" data-down="${p.id}">${p.name} ga o‘tish</button>`
      : online ? payButtons(p, false) : `<button class="btn ${p.id === 'pro' ? 'primary' : 'dark'}" style="width:100%" data-up="${p.id}">${p.name} uchun so‘rov yuborish</button>`}</div></section>`).join('')}</div>
  <div class="card" style="margin-top:18px"><h3>AI kredit qanday sarflanadi</h3><p class="sub">Limit har oy yangilanadi. Xatolik bo‘lsa, kredit yechilmaydi.</p><div class="row"><div class="stat"><b>1</b><span>mentor savoli</span></div><div class="stat"><b>2 / 4</b><span>esse tahlili (oddiy / chuqur)</span></div><div class="stat"><b>6</b><span>strategiya yoki hisobot</span></div></div></div>
  <p class="hint" style="margin-top:14px">Qabul natijasi hech bir tarifda kafolatlanmaydi. Narxlar AQSh dollarida.</p>`;
  $$('[data-pay]', el).forEach(b => (b.onclick = async () => {
    const all = $$('[data-pay]', el), old = b.textContent; all.forEach(x => (x.disabled = true)); b.textContent = 'Yo‘naltirilmoqda…';
    try {
      const r = await api('/api/pay/create', 'POST', { plan: b.dataset.pay, provider: b.dataset.prov });
      addEventListener('pageshow', ev => { if (ev.persisted && el.isConnected) pricing(el); }, { once: true }); // orqaga qaytilsa tugmalar qayta ochiladi
      location.href = r.url; return;
    } catch (e) { toast(e.message, 'err'); }
    all.forEach(x => (x.disabled = false)); b.textContent = old;
  }));
  const back = new URLSearchParams(location.hash.split('?')[1] || '').get('paid');
  if (online && /^[a-f0-9]{16}$/.test(back || '')) checkPaid(el, back);
  $$('[data-up]', el).forEach(b => (b.onclick = async () => { b.disabled = true; try { const r = await api('/api/plan/request', 'POST', { plan: b.dataset.up }); S.account = r.account; toast('So‘rov yuborildi. To‘lov ko‘rsatmasi sahifada.'); pricing(el); return; } catch (e) { toast(e.message, 'err'); } b.disabled = false; }));
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
  ${a.tg && a.tg.on ? `<section class="card"><h3>Telegram eslatmalar</h3><p class="sub">Ariza muddati yaqinlashganda (14, 7, 3 va 1 kun oldin) botimiz Telegramga yozadi.</p>${a.tg.linked ? '<p class="msg ok" style="display:block">Telegram ulangan ✓</p><button class="btn sm" id="tg-off">Uzish</button>' : '<button class="btn primary sm" id="tg-on">Telegramni ulash</button>'}<div class="msg" id="tg-m" role="status"></div></section>` : ''}
  ${pn.supported() || pn.needsInstall() ? `<section class="card"><h3>Bildirishnomalar</h3><p class="sub">Ariza muddati yaqinlashganda va tarifingiz yangilanganda shu qurilmaga bildirishnoma keladi.</p><div id="pn-b"><div class="sk" style="height:38px;width:60%"></div></div></section>` : ''}
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
  const tgOn = $('#tg-on', el), tgOff = $('#tg-off', el);
  if (tgOn) tgOn.onclick = async () => {
    const m = $('#tg-m', el); m.className = 'msg'; tgOn.disabled = true;
    try {
      const r = await api('/api/tg/link', 'POST', {}); window.open(r.link, '_blank', 'noopener'); m.textContent = 'Telegram ochildi: botda “Start” tugmasini bosing. Ulanish avtomatik aniqlanadi.';
      for (let i = 0; i < 40; i++) { await new Promise(r2 => setTimeout(r2, 3000)); if (!el.isConnected) return; const me = await api('/api/me'); if (me.account.tg && me.account.tg.linked) { S.account = me.account; return profile(el); } }
      m.textContent = 'Ulanish aniqlanmadi. Qayta urinib ko‘ring.'; tgOn.disabled = false;
    } catch (e) { m.className = 'msg err'; m.textContent = e.message; tgOn.disabled = false; }
  };
  if (tgOff) tgOff.onclick = async () => { try { const r = await api('/api/tg/unlink', 'POST', {}); S.account = r.account; profile(el); } catch (e) { toast(e.message, 'err'); } };
  if ($('#pn-b', el)) {
    const HINT = { denied: 'Bildirishnomalar brauzer sozlamalarida bloklangan. Bu sayt uchun ruxsat bering va sahifani yangilang.', install: 'iPhone va iPad’da bildirishnoma olish uchun avval saytni Bosh ekranga qo‘shing (Ulashish → “Bosh ekranga qo‘shish”), so‘ng ilovani oching.', unsupported: 'Bu brauzer bildirishnomalarni qo‘llab-quvvatlamaydi.' };
    const say = (txt, cls) => { const m = $('#pn-m', el); if (m) { m.className = 'msg ' + (cls || ''); m.textContent = txt; } };
    const paint = async () => {
      const st = await pn.status(), b = $('#pn-b', el); if (!b) return;
      if (st === 'on') b.innerHTML = '<p class="msg ok" style="display:block;margin:0 0 10px">Bu qurilmada yoqilgan ✓</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="pn-t">Sinov yuborish</button><button class="btn sm" id="pn-x">O‘chirish</button></div><div class="msg" id="pn-m" role="status"></div>';
      else if (st === 'off') b.innerHTML = '<button class="btn primary sm" id="pn-on">Bildirishnomani yoqish</button><div class="msg" id="pn-m" role="status"></div>';
      else b.innerHTML = `<p class="hint" style="margin:0">${HINT[st]}</p>`;
      const on = $('#pn-on', el), tt = $('#pn-t', el), xx = $('#pn-x', el);
      if (st === 'on') pn.heal();
      if (on) on.onclick = async () => {
        on.disabled = true;
        try { await pn.enable(); toast('Bildirishnoma yoqildi ✓'); paint(); }
        catch (e) { on.disabled = false; say(e.code === 'denied' ? 'Bildirishnoma ruxsati berilmadi.' : e.message, 'err'); if (Notification.permission === 'denied') paint(); }
      };
      if (tt) tt.onclick = async () => {
        tt.disabled = true; say('');
        try { const r = await pn.test(); if (r.ok) say('Sinov xabari yuborildi — bir necha soniyada keladi.', 'ok'); else say('Xabar yetkazib bo‘lmadi. Bildirishnomani o‘chirib, qayta yoqing.', 'err'); }
        catch (e) { say(e.message, 'err'); }
        tt.disabled = false;
      };
      if (xx) xx.onclick = async () => { xx.disabled = true; try { await pn.disable(); toast('Bildirishnoma o‘chirildi.'); } catch (e) { toast(e.message, 'err'); } paint(); };
    };
    paint();
  }
  $('#p-del', el).onclick = async () => {
    const v = await modal({ title: 'Hisobni o‘chirasizmi?', body: '<p>Profil, natijalar, arizalar va so‘rovlaringiz butunlay o‘chadi. Qaytarib bo‘lmaydi. Tasdiqlash uchun parolingizni kiriting.</p><div class="field" style="margin-top:12px"><input id="dpw" type="password" autocomplete="current-password" placeholder="Parol"></div>', actions: [{ label: 'Bekor', value: 0 }, { label: 'O‘chirish', value: 1, cls: 'danger' }], collect: bg => ($('#dpw', bg) || {}).value });
    if (v !== 1) return;
    const pw = modal.data;
    try { await api('/api/account', 'DELETE', { password: pw || '' }); wipeLocal(); location.hash = ''; location.reload(); } catch (e) { toast(e.message, 'err'); }
  };
}

/* ================= YO'L XARITASI ================= */
const stepsFor = (c, Q, horizon = 0) => {
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
  if (horizon > 200) {
    add(360, 'Qaysi davlat va yo‘nalishda o‘qishni xohlayotganingizni aniqlang, universitetlar ro‘yxatini tuzing');
    add(300, 'IELTS va SAT (kerak bo‘lsa) uchun tayyorgarlikni boshlang, imtihon sanasini belgilang');
    add(240, 'Olimpiada, loyiha, volontyorlik kabi faolliklarni boshlang yoki davom ettiring');
    add(180, 'IELTS/SAT ni birinchi marta topshiring (natijani yaxshilash uchun vaqt qolsin)');
  }
  return S;
};

/* Bitiruv sanasi (yoki maqsad yili) ga ko‘ra muddatni kerakli qabul davriga ko‘chiradi (kuzgi qabul: may–dekabr muddatlari oldingi yilga tushadi). */
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
function targetDeadline(d, P) {
  let entry = null;
  if (P.pgd && /^\d{4}-\d{2}-\d{2}$/.test(P.pgd)) { const g = new Date(P.pgd + 'T12:00:00'); entry = g.getFullYear() + (g.getMonth() > 7 ? 1 : 0); }
  else if (P.py && /^\d{4}$/.test(String(P.py))) entry = +P.py;
  if (!entry) return { d, moved: false };
  const m = +d.slice(5, 7), want = m >= 5 ? entry - 1 : entry;
  if (+d.slice(0, 4) >= want) return { d, moved: false, entry };
  return { d: want + d.slice(4), moved: true, entry };
}
export async function roadmap(el) {
  const cat = await catalog(), apps = ls.get('qabul:apps', []), { P, Q } = getProfile();
  el.innerHTML = `<div class="page-h"><div><h2>Yo‘l <em>xaritasi</em></h2><p>Ariza muddatidan orqaga hisoblangan qadamlar. Belgilaringiz hisobingizda saqlanadi.</p></div></div>`;
  if (!apps.length) { el.insertAdjacentHTML('beforeend', '<div class="card empty"><b>Avval ariza qo‘shing</b>Yo‘l xaritasi arizalaringiz muddatiga qarab tuziladi.<br><a class="btn primary" style="margin-top:14px" href="#/tracker">Arizalarga o‘tish</a></div>'); return; }
  el.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:16px"><label class="f" for="r-u">Universitet</label><select id="r-u">${apps.map((a, i) => `<option value="${i}">${esc(a.n)}</option>`).join('')}</select></div><div id="r-o"></div>`);
  const out = $('#r-o', el), draw = () => {
    const a0 = apps[+$('#r-u', el).value], c = cat.find(x => x.n === a0.n), tg = targetDeadline(a0.d, P), a = { ...a0, d: tg.d }, dd = new Date(a.d + 'T12:00:00'), steps = stepsFor(c, Q, (dd - Date.now()) / 864e5), key = 'qabul:s:' + a.n, saved = ls.get(key, {});
    const done = () => steps.filter((s, k) => saved[k]).length;
    out.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h3>${esc(a.n)}</h3><span class="badge">${fmtDate(a.d)}${(c && !c.rdV) || tg.moved ? ' · muddat taxminiy' : ''}</span></div>${tg.moved ? `<p class="hint" style="margin:6px 0 12px">Siz ${tg.entry}-yilda o‘qishni boshlaysiz, shuning uchun reja ${fmtDate(a.d)} sanasiga moslandi (katalogdagi ${fmtDate(a0.d)} o‘tgan davr sanasi). Yangi davr muddatini universitetning rasmiy sahifasida tekshiring.</p>` : ''}<p class="sub" id="r-p"></p><div class="bar" style="margin-bottom:16px"><i id="r-b"></i></div>
    ${steps.map((s, k) => ({ s, k })).sort((x, y) => y.s.o - x.s.o).map(({ s, k }) => { const d = new Date(dd - s.o * 864e5), left = Math.ceil((d - Date.now()) / 864e5); return `<label class="li" style="cursor:pointer"><input type="checkbox" data-k="${k}" ${saved[k] ? 'checked' : ''}><span class="grow" ${saved[k] ? 'style="text-decoration:line-through;color:var(--muted)"' : ''}>${esc(s.t)}</span><span class="badge ${left < 0 && !saved[k] ? 'bad' : 'mute'}">${d.getDate()}-${MON[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}</span></label>`; }).join('')}
    <button class="btn sm" id="r-cp" style="margin-top:14px">Rejani nusxalash</button><span class="hint" id="r-cm"></span></div>`;
    const upd = () => { $('#r-p', out).textContent = `${done()} / ${steps.length} qadam bajarildi`; $('#r-b', out).style.width = pct(done(), steps.length) + '%'; }; upd();
    $$('[data-k]', out).forEach(i => (i.onchange = () => { saved[i.dataset.k] = i.checked; ls.set(key, saved); draw(); }));
    $('#r-cp', out).onclick = () => { const txt = `${a.n} — ${t('yo‘l xaritasi')}\n` + steps.map((s, k) => ({ s, k })).sort((x, y) => y.s.o - x.s.o).map(({ s, k }) => `${saved[k] ? '[x]' : '[ ]'} ${dateL(new Date(dd - s.o * 864e5).toISOString().slice(0, 10), fmtDate)} — ${t(s.t)}`).join('\n'); navigator.clipboard.writeText(txt).then(() => ($('#r-cm', out).textContent = ' Nusxalandi'), () => ($('#r-cm', out).textContent = ' Nusxalab bo‘lmadi')); };
  };
  $('#r-u', el).onchange = draw; draw();
}

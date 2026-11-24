/* UniDoue moslik hisobi. Bitta fayl: brauzerda window.Scoring, serverda require(). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Scoring = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const cl = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
  const num = v => (v === '' || v == null || isNaN(+v) ? null : +v);

  /** Kiritilgan profilni tekshirib, 4 ballik GPA ga keltiradi. */
  function normProfile(p) {
    p = p || {};
    const sc = num(p.sc) || 5, raw = num(p.gpa), sat = num(p.sat), ielts = num(p.ielts);
    const lvl = v => (v === '' || v == null ? null : [0, 1, 2, 3].includes(+v) ? +v : null);
    return {
      gpa: raw != null && raw > 0 && raw <= sc ? (raw / sc) * 4 : null,
      sat: sat != null && sat >= 400 && sat <= 1600 ? sat : null,
      ielts: ielts != null && ielts >= 0 && ielts <= 9 ? ielts : null,
      ex: lvl(p.ex) == null ? 1 : lvl(p.ex),
      ach: lvl(p.ach)
    };
  }
  const hasInput = p => p.gpa != null || p.sat != null || p.ielts != null;

  /** QS World University Rankings o‘rni: "=2", "45", "751-760" kabi qiymatdan birinchi sonni oladi. */
  const rankNum = q => { const m = q == null ? null : String(q).match(/\d+/); return m ? +m[0] : null; };
  /** QS o‘rni → taxminiy SAT oralig‘i va GPA. Faqat SAT/GPA/qabul foizi ochiq bo‘lmagan (asosan boshqa davlat) universitetlar uchun.
      Qatorlar: [QS o‘rni, SAT quyi, SAT yuqori, GPA]; oraliq qiymatlar o‘rin logarifmi bo‘yicha silliq hisoblanadi. */
  const ANCH = [[1, 1520, 1570, 3.96], [30, 1480, 1560, 3.94], [60, 1440, 1540, 3.9], [100, 1390, 1520, 3.85], [200, 1320, 1470, 3.78], [400, 1240, 1420, 3.66], [700, 1170, 1360, 3.52], [1200, 1100, 1300, 3.4], [1400, 1080, 1280, 3.35]];
  const UNRANKED = 450, TOP_REACH = 30; // reytingda yo‘q universitet o‘rta daraja deb olinadi; QS 30 ichidagilari hamma uchun Reach
  function estimate(u) {
    const r0 = rankNum(u.qs), r = Math.max(1, Math.min(1400, r0 == null ? UNRANKED : r0));
    let i = 1; while (i < ANCH.length - 1 && r > ANCH[i][0]) i++;
    const A = ANCH[i - 1], B = ANCH[i], k = cl((Math.log(r) - Math.log(A[0])) / (Math.log(B[0]) - Math.log(A[0])), 0, 1), mix = j => A[j] + (B[j] - A[j]) * k;
    const realSat = Array.isArray(u.sat) && u.sat.length === 2, realGpa = u.gpa != null && !isNaN(+u.gpa);
    return { ...u, sat: realSat ? u.sat : [Math.round(mix(1) / 10) * 10, Math.round(mix(2) / 10) * 10], gpa: realGpa ? +u.gpa : Math.round(mix(3) * 100) / 100,
      satV: realSat ? u.satV : false, gpaV: realGpa ? u.gpaV : false, ieltsV: u.ieltsV != null ? u.ieltsV : u.ielts != null, _est: true, _rank: r0 };
  }
  /** Hisoblash uchun universitet ko‘rsatkichlari: ochiq SAT/GPA bo‘lsa o‘zi, bo‘lmasa QS o‘rnidan taxminiy (_est: true). */
  const forUni = u => (Array.isArray(u.sat) && u.sat.length === 2 && u.gpa != null && !isNaN(+u.gpa) ? u : estimate(u));

  /** Har bir mezon bo'yicha 0..100 ball va tushuntirish. */
  function parts(u0, p) {
    const u = forUni(u0), out = [], ver = (ok, y) => (ok ? ` (tekshirilgan${y ? ': ' + y : ''})` : ' (taxminiy, tekshirilmagan)');
    if (p.sat != null) {
      const [a, b] = u.sat;
      const t = p.sat >= b ? `SAT ${p.sat} universitet o‘rta 50% oralig‘i (${a}–${b}) ning yuqori chegarasidan yuqori`
        : p.sat >= a ? `SAT ${p.sat} oraliq (${a}–${b}) ichida`
        : `SAT ${p.sat} oraliq (${a}–${b}) ning quyi chegarasidan ${a - p.sat} ball past`;
      out.push({ k: 'SAT', w: 0.35, v: cl((100 * (p.sat - (a - 200))) / (b - a + 220)), t: t + ver(u.satV, u.satYear), tone: p.sat >= a ? 'good' : 'warn' });
    }
    if (p.gpa != null) {
      out.push({ k: 'GPA', w: 0.3, v: cl((100 * (p.gpa - (u.gpa - 0.8))) / 0.9),
        t: `GPA ${p.gpa.toFixed(2)}/4; universitet ko‘rsatkichi ~${u.gpa}` + ver(u.gpaV), tone: p.gpa >= u.gpa - 0.1 ? 'good' : 'warn' });
    }
    if (p.ielts != null && u.ielts != null) {
      const ok = p.ielts >= u.ielts;
      out.push({ k: 'IELTS', w: 0.15, v: ok ? Math.min(85, 60 + (p.ielts - u.ielts) * 25) : cl(60 - (u.ielts - p.ielts) * 60),
        t: `IELTS ${p.ielts}; ${u.ieltsKind === 'recommended' ? 'tavsiya etilgan' : 'talab'} ~${u.ielts}` + ver(u.ieltsV), tone: ok ? 'good' : 'warn' });
    } else if (p.ielts != null && u.ieltsKind === 'none_stated') {
      out.push({ k: 'IELTS', w: 0.05, v: 70, t: 'Universitet rasmiy minimal IELTS ballini ko‘rsatmagan (tekshirilgan)', tone: 'info' });
    }
    out.push({ k: 'Faoliyat', w: 0.1, v: [10, 35, 65, 85][p.ex], t: 'Olimpiada, loyiha, volontyorlik: o‘zingiz baholagan daraja', tone: p.ex >= 2 ? 'good' : 'info' });
    if (p.ach != null) out.push({ k: 'Yutuqlar', w: 0.1, v: [10, 40, 70, 92][p.ach], t: 'Akademik yutuqlar: o‘zingiz baholagan daraja', tone: p.ach >= 2 ? 'good' : 'info' });
    const total = out.reduce((a, x) => a + x.w, 0);
    return out.map(x => ({ ...x, w: x.w / total }));
  }
  const score = (u, p) => Math.round(parts(u, p).reduce((s, x) => s + x.v * x.w, 0));

  const level = v => (v >= 75 ? 'Kuchli moslik' : v >= 55 ? 'Raqobatbardosh' : v >= 35 ? 'Qiyin' : 'Juda qiyin');

  /** Safety / Target / Reach. Juda qattiq universitetlar hamma uchun Reach. Hamma davlatlar uchun bir xil qoida. */
  function tier(u0, v) {
    const u = forUni(u0), basis = [];
    let t;
    if (u.acc != null && u.accV && u.acc < 0.15) { t = 'reach'; basis.push(`qabul darajasi ${(u.acc * 100).toFixed(1)}% (tekshirilgan): hamma uchun Reach`); }
    else if (u._est && u._rank != null && u._rank <= TOP_REACH) { t = 'reach'; basis.push('QS reytingida dunyoning eng yaxshi 30 universiteti qatorida (taxminiy): hamma uchun Reach'); }
    else if (!u._est && u.acc == null && u.sat[0] >= 1480) { t = 'reach'; basis.push('SAT oralig‘i juda yuqori (taxminiy): Reach deb olindi'); }
    else if (v >= 75 && u._est && u._rank == null) { t = 'target'; basis.push('QS reytingi yo‘q (taxminiy): Safety o‘rniga Target deb olindi'); }
    else if (v >= 75) { t = 'safety'; basis.push('profilingiz ko‘rsatkichlardan yuqori'); }
    else if (v >= 55) { t = 'target'; basis.push('profilingiz ko‘rsatkichlarga yaqin'); }
    else { t = 'reach'; basis.push('profilingiz ko‘rsatkichlardan past'); }
    return { tier: t, basis: basis.join('; '), confident: !u._est && !!(u.satV && u.accV) };
  }

  const verdict = v => (v < 35 ? 'Profilni kuchaytirish kerak' : v < 55 ? 'Qo‘shimcha tayyorgarlik foydali' : v < 75 ? 'Profilning ayrim jihatlari mos' : 'Kiritilgan natijalar bo‘yicha yaxshi moslik');

  function advice(u0, p) {
    const u = forUni(u0), est = !!u._est, a = [];
    if (!est && p.sat != null && p.sat < u.sat[0]) a.push(`SAT ni kamida ${u.sat[0]} ga ko‘tarish moslikni sezilarli oshiradi.`);
    if (p.ielts != null && u.ielts != null && p.ielts < u.ielts) a.push(`IELTS ni ${u.ielts} ga yetkazing.`);
    if (p.gpa != null && p.gpa < u.gpa - 0.2) a.push('Oxirgi semestrlarda GPA ni ko‘tarishga e’tibor bering.');
    if (p.ex < 2) a.push('Olimpiada, loyiha yoki volontyorlik tajribasini kengaytiring.');
    if (!est && p.sat == null) a.push('SAT natijangizni kiriting, aks holda hisob kam ma’lumotga tayanadi.');
    return a;
  }

  /** Boshqa davlat universitetlari: SAT/GPA/qabul foizi ochiq emas, shuning uchun ehtimol hisoblanmaydi.
      Faqat rasmiy talablarga (IELTS, o‘qish tili, muddat) moslik tekshiriladi. today — 'YYYY-MM-DD'. */
  function langKind(lang) {
    if (!lang) return null;
    if (/only in master/i.test(lang)) return 'no'; // bakalavr ingliz tilida emas, faqat magistratura
    if (/ended/i.test(lang)) return 'part';
    if (/some (programs|courses|modules)/i.test(lang)) return 'part';
    return /english/i.test(lang) ? 'yes' : 'no';
  }
  function intlFit(u, p, today) {
    const parts = [], advice = [];
    const push = (k, t, tone) => parts.push({ k, t, tone });
    if (u.ielts != null) {
      if (p.ielts == null) { push('IELTS', `Universitet talabi: IELTS ${u.ielts}. Natijangizni kiriting.`, 'info'); advice.push('IELTS natijangizni profilga kiriting.'); }
      else if (p.ielts >= u.ielts) push('IELTS', `IELTS ${p.ielts} talab qilingan ${u.ielts} dan kam emas`, 'good');
      else {
        const gap = Math.round((u.ielts - p.ielts) * 10) / 10;
        push('IELTS', `IELTS ${p.ielts}; talab ${u.ielts} (${gap} ball yetishmaydi)`, gap <= 0.5 ? 'warn' : 'bad');
        advice.push(`IELTS ni ${u.ielts} ga yetkazing.`);
      }
    } else if (u.ieltsNote) push('IELTS', 'IELTS minimal bali belgilanmagan: kartadagi izohga qarang', 'info');
    else push('IELTS', 'Minimal IELTS rasmiy sahifada topilmadi: universitetdan so‘rang', 'info');
    if (u.sat != null) {
      if (p.sat == null) { push('SAT', `Universitet talabi: SAT ${u.sat}. Natijangizni kiriting.`, 'info'); advice.push('SAT natijangizni profilga kiriting.'); }
      else if (p.sat >= u.sat) push('SAT', `SAT ${p.sat} talab qilingan ${u.sat} dan kam emas`, 'good');
      else { const gap = u.sat - p.sat; push('SAT', `SAT ${p.sat}; talab ${u.sat} (${gap} ball yetishmaydi)`, gap <= 50 ? 'warn' : 'bad'); advice.push(`SAT ni ${u.sat} ga yetkazing.`); }
    }
    const lk = langKind(u.lang);
    if (lk === 'yes') push('Til', 'Ingliz tilida o‘qish imkoniyati bor', 'good');
    else if (lk === 'part') { push('Til', 'Faqat ba’zi dasturlar ingliz tilida: kerakli dastur tilini tekshiring', 'warn'); advice.push('Tanlagan yo‘nalishingiz ingliz tilida o‘qitilishini rasmiy saytda tekshiring.'); }
    else if (lk === 'no') { push('Til', 'Asosiy o‘qish tili ingliz tili emas: ' + u.lang, 'bad'); advice.push('O‘qish tilidan til sertifikati talab qilinishi mumkin: rasmiy saytda tekshiring.'); }
    else push('Til', 'O‘qish tili haqida ma’lumot yo‘q', 'info');
    if (u.rd) {
      const left = Math.ceil((new Date(u.rd + 'T23:59:59') - new Date(today + 'T12:00:00')) / 864e5);
      if (left >= 0) push('Muddat', `Ariza muddatiga ${left} kun qoldi`, left < 30 ? 'warn' : 'good');
      else { push('Muddat', 'Ko‘rsatilgan muddat o‘tgan: keyingi qabul sanasini rasmiy saytdan tekshiring', 'warn'); advice.push('Keyingi qabul davri muddatini rasmiy saytdan aniqlang.'); }
    } else push('Muddat', 'Muddat rasmiy sahifada topilmadi', 'info');
    if (u.tuition) push('Narx', `${u.tuition.amount.toLocaleString('en-US')} ${u.tuition.cur} / yil (chet ellik talaba)`, 'info');
    const bad = parts.some(x => x.tone === 'bad'), warn = parts.some(x => x.tone === 'warn'), good = parts.some(x => x.tone === 'good');
    const status = bad ? 'no' : warn ? 'part' : good ? 'yes' : 'unknown';
    const label = status === 'yes' && u.ielts == null ? 'Mos (IELTS talabi noma’lum)' : { yes: 'Talablarga mos', part: 'Qisman mos', no: 'Talablarga hozircha mos emas', unknown: 'Ma’lumot yetarli emas' }[status];
    if (!advice.length && status === 'yes') advice.push('Talablar mos: hujjatlar ro‘yxati va muddatni rasmiy sahifada tasdiqlang.');
    const cnt = { good: 0, warn: 0, bad: 0, info: 0 }; parts.forEach(x => { cnt[x.tone] = (cnt[x.tone] || 0) + 1; });
    return { status, label, parts, advice, cnt };
  }

  /** Hamma universitet uchun bir xil natija: ball, daraja, Safety/Target/Reach, mezonlar, tavsiya. Boshqa davlatlarda qo‘shimcha `req` (rasmiy talablar tekshiruvi) bor. */
  function fit(u, p, today) {
    const f = forUni(u), raw = score(f, p), tr = tier(f, raw), v = f._est && f._rank == null ? Math.min(raw, 74) : raw; // reytingi yo‘q: ball ham Safety chegarasidan (75) oshmaydi
    const o = { score: v, level: level(v), verdict: verdict(v), tier: tr.tier, basis: tr.basis, confident: tr.confident, est: !!f._est, parts: parts(f, p), advice: advice(f, p) };
    if (u.kind === 'intl' || f._est) o.req = intlFit(u, p, today);
    return o;
  }

  return { normProfile, hasInput, parts, score, level, tier, verdict, advice, intlFit, langKind, rankNum, estimate, forUni, fit };
});

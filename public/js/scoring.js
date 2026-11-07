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

  /** Har bir mezon bo'yicha 0..100 ball va tushuntirish. */
  function parts(u, p) {
    const out = [], ver = (ok, y) => (ok ? ` (tekshirilgan${y ? ': ' + y : ''})` : ' (taxminiy, tekshirilmagan)');
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

  /** Safety / Target / Reach. Juda qattiq universitetlar hamma uchun Reach. */
  function tier(u, v) {
    const basis = [];
    let t;
    if (u.acc != null && u.accV && u.acc < 0.15) { t = 'reach'; basis.push(`qabul darajasi ${(u.acc * 100).toFixed(1)}% (tekshirilgan): hamma uchun Reach`); }
    else if (u.acc == null && u.sat[0] >= 1480) { t = 'reach'; basis.push('SAT oralig‘i juda yuqori (taxminiy): Reach deb olindi'); }
    else if (v >= 75) { t = 'safety'; basis.push('profilingiz ko‘rsatkichlardan yuqori'); }
    else if (v >= 55) { t = 'target'; basis.push('profilingiz ko‘rsatkichlarga yaqin'); }
    else { t = 'reach'; basis.push('profilingiz ko‘rsatkichlardan past'); }
    return { tier: t, basis: basis.join('; '), confident: !!(u.satV && u.accV) };
  }

  const verdict = v => (v < 35 ? 'Profilni kuchaytirish kerak' : v < 55 ? 'Qo‘shimcha tayyorgarlik foydali' : v < 75 ? 'Profilning ayrim jihatlari mos' : 'Kiritilgan natijalar bo‘yicha yaxshi moslik');

  function advice(u, p) {
    const a = [];
    if (p.sat != null && p.sat < u.sat[0]) a.push(`SAT ni kamida ${u.sat[0]} ga ko‘tarish moslikni sezilarli oshiradi.`);
    if (p.ielts != null && u.ielts != null && p.ielts < u.ielts) a.push(`IELTS ni ${u.ielts} ga yetkazing.`);
    if (p.gpa != null && p.gpa < u.gpa - 0.2) a.push('Oxirgi semestrlarda GPA ni ko‘tarishga e’tibor bering.');
    if (p.ex < 2) a.push('Olimpiada, loyiha yoki volontyorlik tajribasini kengaytiring.');
    if (p.sat == null) a.push('SAT natijangizni kiriting, aks holda hisob kam ma’lumotga tayanadi.');
    return a;
  }

  return { normProfile, hasInput, parts, score, level, tier, verdict, advice };
});

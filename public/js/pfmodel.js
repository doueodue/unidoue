/* Portfolio: ma'lumot modeli, tozalash (normalize), profildan to'ldirish va avtomatik baholash.
 * DOM'ga bog'liq emas — brauzerda ham, Node testlarida ham ishlaydi. */

export const TPLS = ['ledger', 'rail', 'folio'];
export const ACCENTS = [['#2745e8', 'Kobalt'], ['#0b7a5f', 'Zumrad'], ['#b5304a', 'Anor'], ['#c4561b', 'Kuz'], ['#2f3a4a', 'Grafit'], ['#6a3fd1', 'Binafsha']];
export const LEVELS = ['school', 'regional', 'national', 'international'];
export const LANGS = ['en', 'uz', 'ru'];
export const MAX = { acts: 8, awards: 8, projects: 6, edu: 4, tests: 8, links: 4, skills: 20, langs: 8, att: 8, targets: 10 };
export const uid = () => Math.random().toString(36).slice(2, 9);

const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, n);
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);
export const safeUrl = u => { u = str(u, 200); if (u && !/^https?:\/\//i.test(u) && /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u)) u = 'https://' + u; return /^https?:\/\/[^\s<>"'`]{3,190}$/i.test(u) ? u : ''; };
export const safeEmail = e => { e = str(e, 120); return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(e) ? e : ''; };
const safeColor = c => (/^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : ACCENTS[0][0]);
const safePhoto = p => (typeof p === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]{20,}$/.test(p) && p.length < 120000 ? p : '');

export const emptyPf = () => ({ v: 1, lang: 'en', tpl: 'ledger', accent: ACCENTS[0][0], name: '', headline: '', city: '', email: '', phone: '', links: [], summary: '', photo: '', edu: [], tests: [], acts: [], awards: [], projects: [], skills: [], langs: [], targets: [], att: [] });

/** Har qanday kirishni (sinxrondan kelgan, eski, buzilgan) xavfsiz modelga aylantiradi. */
export function normalize(p) {
  p = p && typeof p === 'object' ? p : {};
  const o = emptyPf();
  o.lang = LANGS.includes(p.lang) ? p.lang : 'en'; o.tpl = TPLS.includes(p.tpl) ? p.tpl : 'ledger'; o.accent = safeColor(p.accent);
  o.name = str(p.name, 80); o.headline = str(p.headline, 140); o.city = str(p.city, 80); o.email = safeEmail(p.email); o.phone = str(p.phone, 30); o.summary = str(p.summary, 700); o.photo = safePhoto(p.photo);
  o.links = arr(p.links, MAX.links).map(x => x && ({ l: str(x.l, 30), u: safeUrl(x.u) })).filter(x => x && x.u);
  o.edu = arr(p.edu, MAX.edu).map(x => x && ({ id: str(x.id, 12) || uid(), school: str(x.school, 100), program: str(x.program, 80), from: str(x.from, 12), to: str(x.to, 12), gpa: str(x.gpa, 20), note: str(x.note, 200) })).filter(x => x && (x.school || x.program));
  o.tests = arr(p.tests, MAX.tests).map(x => x && ({ id: str(x.id, 12) || uid(), name: str(x.name, 40), score: str(x.score, 24), date: str(x.date, 12) })).filter(x => x && x.name);
  const item = x => x && ({ id: str(x.id, 12) || uid(), title: str(x.title, 100), org: str(x.org, 80), role: str(x.role, 60), from: str(x.from, 12), to: str(x.to, 12), hours: str(x.hours, 10), what: str(x.what, 400), scale: str(x.scale, 200), result: str(x.result, 300), text: String(x.text == null ? '' : x.text).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim().slice(0, 500), url: safeUrl(x.url) });
  o.acts = arr(p.acts, MAX.acts).map(item).filter(x => x && (x.title || x.what || x.text));
  o.projects = arr(p.projects, MAX.projects).map(item).filter(x => x && (x.title || x.what || x.text));
  o.awards = arr(p.awards, MAX.awards).map(x => x && ({ id: str(x.id, 12) || uid(), title: str(x.title, 120), issuer: str(x.issuer, 80), year: str(x.year, 8), level: LEVELS.includes(x.level) ? x.level : '', note: str(x.note, 200), img: str(x.img, 12) })).filter(x => x && x.title);
  o.skills = arr(p.skills, MAX.skills).map(x => str(x, 40)).filter(Boolean);
  o.langs = arr(p.langs, MAX.langs).map(x => x && ({ n: str(x.n, 30), lv: str(x.lv, 20) })).filter(x => x && x.n);
  o.targets = arr(p.targets, MAX.targets).map(x => str(x, 80)).filter(Boolean);
  o.att = arr(p.att, MAX.att).map(x => x && ({ id: str(x.id, 12), cap: str(x.cap, 100) })).filter(x => x && x.id);
  return o;
}

/** Faoliyat/loyiha matni: sayqallangan matn bo'lsa o'sha, bo'lmasa "nima qildim" + "natija" */
export const actText = a => (a.text && a.text.trim()) || [a.what, a.scale, a.result].map(x => String(x || '').trim().replace(/[.\s]+$/, '')).filter(Boolean).join('. ');
export const range = (a, present = 'present') => { const f = a.from, t = a.to; if (f && t) return f === t ? f : f + '–' + t; return f ? f + '–' + present : t || ''; };
export const splitBullets = t => String(t || '').split(/\n+|\s*[•·]\s+/).map(x => x.replace(/^\s*[-–—*]\s+/, '').trim()).filter(Boolean);

const T = { en: ['Aspiring %s student', 'Applicant'], uz: ['%s yo‘nalishida o‘qishni rejalashtirgan abituriyent', 'Abituriyent'], ru: ['Абитуриент направления «%s»', 'Абитуриент'] };
/** Profil (profil sahifasidagi) va arizalardan portfolio boshlang'ich ma'lumotini oladi. Mavjud to'ldirilgan maydonlarga tegmaydi. */
export function seedFromProfile(pf, P = {}, Q = {}, apps = [], lang = pf.lang) {
  const o = normalize(pf), tp = T[lang] || T.en;
  if (!o.name && P.pn) o.name = str(P.pn, 80);
  if (!o.city && P.pc) o.city = str(P.pc, 80);
  if (!o.headline) o.headline = str(P.pm ? tp[0].replace('%s', str(P.pm, 50)) : '', 140);
  if (!o.edu.length && (Q.gpa || P.pgd || P.pg)) o.edu.push({ id: uid(), school: '', program: str(P.pg, 30), from: '', to: P.pgd ? String(P.pgd).slice(0, 4) : (P.py ? String(P.py - 1) : ''), gpa: Q.gpa ? str(Q.gpa + (Q.sc ? '/' + Q.sc : ''), 20) : '', note: '' });
  const hasT = n => o.tests.some(t => t.name.toLowerCase() === n);
  if (Q.sat && !hasT('sat')) o.tests.push({ id: uid(), name: 'SAT', score: str(Q.sat, 24), date: '' });
  if (Q.ielts && !hasT('ielts')) o.tests.push({ id: uid(), name: 'IELTS', score: str(Q.ielts, 24), date: '' });
  if (!o.targets.length) o.targets = (Array.isArray(apps) ? apps : []).map(a => str(a && a.n, 80)).filter(Boolean).slice(0, MAX.targets);
  return o;
}

/* ---------- Baholash ---------- */
const has = s => String(s || '').trim().length > 0;
const digit = s => /\d/.test(String(s || ''));
const RANK = { school: 1, regional: 2, national: 3, international: 4 };
export const DIMS = [['acad', 20], ['acts', 25], ['awards', 20], ['init', 10], ['proof', 10], ['clear', 15]];
export const DIM_L = {
  acad: { uz: 'Akademik asos', ru: 'Академическая база', en: 'Academic base' }, acts: { uz: 'Faoliyat chuqurligi', ru: 'Глубина активностей', en: 'Depth of activities' },
  awards: { uz: 'Yutuqlar', ru: 'Достижения', en: 'Awards' }, init: { uz: 'Tashabbus va loyihalar', ru: 'Инициатива и проекты', en: 'Initiative and projects' },
  proof: { uz: 'Dalil va havolalar', ru: 'Подтверждения и ссылки', en: 'Evidence and links' }, clear: { uz: 'Aniq yozilish', ru: 'Чёткость формулировок', en: 'Clarity of wording' }
};
export const BANDS = [[80, { uz: 'A’lo', ru: 'Отлично', en: 'Outstanding' }], [60, { uz: 'Kuchli', ru: 'Сильное', en: 'Strong' }], [35, { uz: 'Rivojlanmoqda', ru: 'На пути', en: 'Developing' }], [0, { uz: 'Boshlang‘ich', ru: 'Начало', en: 'Just started' }]];
export const TIPS = {
  gpa: { uz: 'Ta’lim bo‘limiga GPA yoki o‘rtacha bahoingizni yozing.', ru: 'Укажите GPA или средний балл в разделе «Образование».', en: 'Add your GPA or average grade in the Education section.' },
  english: { uz: 'Ingliz tili sertifikati natijasini (IELTS, TOEFL yoki Duolingo) qo‘shing.', ru: 'Добавьте результат экзамена по английскому (IELTS, TOEFL или Duolingo).', en: 'Add an English test result (IELTS, TOEFL or Duolingo).' },
  test: { uz: 'SAT yoki boshqa standart imtihon natijasini qo‘shing.', ru: 'Добавьте результат SAT или другого стандартного экзамена.', en: 'Add an SAT or other standardized test score.' },
  school: { uz: 'Maktab yoki kollej nomini yozing.', ru: 'Укажите название школы или колледжа.', en: 'Add the name of your school or college.' },
  actsFew: { uz: 'Kamida 4 ta faoliyat qo‘shing: klub, volontyorlik, ish, sport yoki to‘garak.', ru: 'Добавьте минимум 4 активности: клуб, волонтёрство, работу, спорт или кружок.', en: 'Add at least 4 activities: a club, volunteering, a job, sport or a hobby group.' },
  role: { uz: 'Har faoliyatda rolingizni yozing (tashkilotchi, sardor, a’zo).', ru: 'В каждой активности укажите свою роль (организатор, капитан, участник).', en: 'State your role in each activity (organizer, captain, member).' },
  when: { uz: 'Faoliyatlarga boshlangan yilni qo‘shing: davomiylik ishonch beradi.', ru: 'Добавьте годы участия: длительность вызывает доверие.', en: 'Add the years for each activity: duration builds trust.' },
  numbers: { uz: 'Faoliyatlarga raqam qo‘shing: necha kishi, necha soat, qancha natija.', ru: 'Добавьте цифры: сколько людей, часов, какой результат.', en: 'Add numbers to your activities: how many people, hours, what result.' },
  awardsFew: { uz: 'Yutuq yoki sertifikat qo‘shing: olimpiada, tanlov, kurs yoki sport natijasi.', ru: 'Добавьте достижение или сертификат: олимпиаду, конкурс, курс или спортивный результат.', en: 'Add an award or certificate: an olympiad, contest, course or sports result.' },
  level: { uz: 'Yutuqning darajasini belgilang (maktab, viloyat, respublika, xalqaro).', ru: 'Отметьте уровень достижения (школа, регион, страна, международный).', en: 'Mark the level of each award (school, regional, national, international).' },
  project: { uz: 'Kamida bitta shaxsiy loyiha qo‘shing: o‘zingiz boshlagan va natijasi bor narsa.', ru: 'Добавьте хотя бы один личный проект: то, что вы начали сами и что дало результат.', en: 'Add at least one personal project: something you started and that produced a result.' },
  projectProof: { uz: 'Loyihaga havola yoki aniq natija (raqam) qo‘shing.', ru: 'Добавьте к проекту ссылку или конкретный результат (число).', en: 'Add a link or a concrete result (a number) to your project.' },
  photos: { uz: 'Sertifikat yoki yutuq rasmlarini yuklang: dalil portfolioni ishonchli qiladi.', ru: 'Загрузите фото сертификатов или наград: подтверждения повышают доверие.', en: 'Upload photos of certificates or awards: evidence makes the portfolio credible.' },
  links: { uz: 'Loyiha yoki profilingizga havola qo‘shing (GitHub, YouTube, shaxsiy sayt).', ru: 'Добавьте ссылку на проект или профиль (GitHub, YouTube, личный сайт).', en: 'Add a link to a project or profile (GitHub, YouTube, personal site).' },
  wording: { uz: 'Tavsiflarni 1–2 gapga qisqartiring: fe’l bilan boshlang, natijani raqam bilan yozing.', ru: 'Сократите описания до 1–2 предложений: начните с глагола, результат — цифрой.', en: 'Shorten descriptions to 1–2 sentences: start with a verb, state the result as a number.' },
  headline: { uz: 'Sarlavha va qisqa tavsif yozing: o‘quvchi sizni bir qarashda tushunsin.', ru: 'Напишите заголовок и краткое описание: читатель должен понять вас с первого взгляда.', en: 'Write a headline and a short summary so a reader understands you at a glance.' }
};

/** Portfolioni qoidalar bo'yicha baholaydi (0–100). Bu qabul bashorati EMAS: faqat to'liqlik, aniqlik va dalil ko'rsatkichi. */
export function evaluate(pf) {
  const p = normalize(pf), acts = p.acts.filter(a => has(a.title) || has(actText(a))), prs = p.projects.filter(a => has(a.title) || has(actText(a)));
  const tests = p.tests.filter(t => has(t.name) && has(t.score)), edu = p.edu;
  const english = tests.some(t => /ielts|toefl|duolingo|cefr|pte/i.test(t.name)), other = tests.some(t => !/ielts|toefl|duolingo|cefr|pte/i.test(t.name));
  const gpa = edu.some(e => has(e.gpa)), school = edu.some(e => has(e.school));
  const share = (list, f) => (list.length ? list.filter(f).length / list.length : 0);
  const d = {}, tips = [];
  const add = (key, gain) => tips.push({ key, gain });
  // Akademik (20)
  d.acad = (school ? 4 : 0) + (gpa ? 5 : 0) + (english ? 6 : 0) + (other ? 5 : 0);
  if (!gpa) add('gpa', 5); if (!english) add('english', 6); if (!other) add('test', 5); if (!school) add('school', 4);
  // Faoliyat (25)
  const roleS = share(acts, a => has(a.role)), whenS = share(acts, a => has(a.from)), numS = share(acts, a => digit(a.scale) || digit(a.result) || digit(actText(a)) || has(a.hours));
  d.acts = Math.min(acts.length, 5) * 2 + roleS * 5 + whenS * 4 + numS * 6;
  if (acts.length < 4) add('actsFew', (4 - acts.length) * 2 + 2);
  if (acts.length && roleS < 1) add('role', 5 * (1 - roleS)); if (acts.length && whenS < 1) add('when', 4 * (1 - whenS)); if (acts.length && numS < 1) add('numbers', 6 * (1 - numS));
  // Yutuqlar (20)
  const aw = p.awards, ranks = aw.map(a => RANK[a.level] || 0).sort((a, b) => b - a);
  d.awards = Math.min(aw.length, 3) * 3 + Math.min(((ranks[0] || 0) + (ranks[1] || 0)), 8) + (aw.some(a => has(a.year)) ? 3 : 0);
  if (aw.length < 2) add('awardsFew', 6); if (aw.length && aw.some(a => !a.level)) add('level', 3);
  // Tashabbus (10)
  d.init = Math.min(prs.length, 2) * 3 + (prs.length ? (prs.some(x => has(x.url) || digit(x.result) || digit(actText(x))) ? 4 : 0) : 0);
  if (!prs.length) add('project', 6); else if (d.init < 10) add('projectProof', 4);
  // Dalil (10)
  const nl = p.links.length, na = p.att.length;
  d.proof = Math.min(na, 3) * 2 + (nl >= 2 ? 4 : nl === 1 ? 2 : 0);
  if (!na) add('photos', 4); if (!nl) add('links', 3);
  // Aniqlik (15)
  const ent = [...acts, ...prs], q = e => { const t = actText(e), n = t.length; return (n >= 45 && n <= 260 ? 0.5 : n >= 20 && n <= 320 ? 0.25 : 0) + (digit(t) ? 0.3 : 0) + (has(e.title) && n > 0 ? 0.2 : 0); };
  const avg = ent.length ? ent.reduce((s, e) => s + q(e), 0) / ent.length : 0, hs = has(p.headline) && has(p.summary);
  d.clear = avg * 12 + (hs ? 3 : has(p.headline) || has(p.summary) ? 1.5 : 0);
  if (ent.length && avg < 0.75) add('wording', (0.75 - avg) * 12); if (!hs) add('headline', hs ? 0 : 3);
  const dims = DIMS.map(([k, max]) => ({ k, max, pts: Math.round(Math.min(max, d[k]) * 10) / 10 }));
  const score = Math.round(dims.reduce((s, x) => s + x.pts, 0));
  const band = (BANDS.find(b => score >= b[0]) || BANDS[3])[1];
  tips.sort((a, b) => b.gain - a.gain);
  return { score, band, dims, tips: tips.slice(0, 5), counts: { acts: acts.length, awards: aw.length, projects: prs.length, tests: tests.length, att: na, links: nl } };
}

/** Tayyor-yo'qligi: foydalanuvchiga "nima yetishmaydi" ro'yxati uchun (kamida nima bo'lsa hujjat chiqadi) */
export const canExport = pf => { const p = normalize(pf); return has(p.name) && (p.acts.length + p.awards.length + p.projects.length + p.edu.length + p.tests.length) > 0; };

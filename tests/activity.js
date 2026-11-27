// Faollik moduli (activity.js): tashrif (kirdi/chiqdi), online, hodisalar. Soat sunʼiy — kutish yoʻq. Ishga tushirish: node tests/activity.js
process.env.ACTIVITY_OFFLINE_MS = '150000'; process.env.ACTIVITY_GRACE_MS = '15000'; process.env.ACTIVITY_EVENTS_MAX = '100'; process.env.ACTIVITY_VISITS_MAX = '100';
const A = require('../activity');
let n = 0, bad = 0; const ok = (c, m, x) => { n++; if (!c) { bad++; console.error('FAIL:', m, x === undefined ? '' : JSON.stringify(x)); } };
const day = t => new Date(t + 5 * 36e5).toISOString().slice(0, 10);
let T = Date.UTC(2026, 10, 27, 8, 0, 0); const clock = () => T, saves = { n: 0 };
const mk = () => { const db = { visits: [], activity: [], sessions: {}, peak: null }; const act = A.create(db, () => saves.n++, day, clock); return { db, act }; };
const U1 = { id: 'u1', email: 'ali@example.test', name: 'Ali' }, U2 = { id: 'u2', email: 'vali@example.test', name: 'Vali' };
const tid = c => 'tab' + String(c).padStart(10, '0');
const login = (db, sh, u) => { db.sessions[sh] = { uid: u.id, created: T, exp: T + 864e5 }; };
const png = (act, o) => act.ping({ tid: tid(1), sh: 'S1', u: U1, ip: '203.0.113.5', ua: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36', pg: 'dashboard', vis: 1, idle: 0, ...o });

{ // 1) tashrif hayoti
  const { db, act } = mk(); login(db, 'S1', U1);
  ok(png(act) === true, 'ping qabul qilindi');
  ok(db.visits.length === 1 && db.visits[0].open === 1 && db.visits[0].uid === 'u1' && db.visits[0].d === 'Chrome · Windows' && db.visits[0].ip === '203.0.113.5', 'birinchi ping tashrif ochadi (qurilma, IP)', db.visits[0]);
  T += 40000; png(act, { pg: 'finder' }); T += 40000; png(act, { pg: 'finder' }); png(act, { pg: 'tracker' });
  ok(db.visits.length === 1 && db.visits[0].n === 4 && db.visits[0].pp.join() === 'dashboard,finder,tracker', 'ping lar bitta tashrifga yigʻiladi; sahifalar izi', db.visits[0]);
  let o = act.online(id => ({ 'u1': U1 }[id]));
  ok(o.users.length === 1 && o.users[0].em === 'ali@example.test' && o.users[0].pg === 'tracker' && o.users[0].st === 'act' && o.users[0].since === db.visits[0].t0 && o.counts.users === 1 && o.counts.total === 1, 'online roʻyxatida: kim, sahifa, holat', o);
  T += 100000; o = act.online(() => U1); ok(o.users.length === 1 && o.users[0].st === 'idle', '100 soniya harakat yoʻq → «idle» (oyna ochiq)', o.users[0].st);
  T += 60000; act.sweep(); o = act.online(() => U1); ok(o.users.length === 0 && o.counts.total === 0, '160 soniya ping yoʻq → oflayn', o);
  ok(db.visits[0].open === undefined && db.visits[0].r === 'idle' && db.visits[0].t1 === T - 160000, 'tashrif oxirgi ping vaqtida yopiladi (sabab: idle)', db.visits[0]);
  T += 1000; png(act); ok(db.visits.length === 2 && db.visits[1].open === 1, 'qaytib kirsa — yangi tashrif', db.visits.length);
}
{ // 2) holatlar: faol / harakatsiz / fonda
  const { db, act } = mk(); login(db, 'S1', U1);
  png(act, { vis: 1, idle: 5 }); ok(act.online(() => U1).users[0].st === 'act', 'faol');
  png(act, { vis: 1, idle: 300 }); ok(act.online(() => U1).users[0].st === 'idle' && act.online(() => U1).users[0].idle >= 300, 'harakatsiz');
  png(act, { vis: 0, idle: 0 }); ok(act.online(() => U1).users[0].st === 'bg', 'boshqa oynada (fonda)');
  png(act, { idle: -50 }); ok(act.online(() => U1).users[0].idle === 0, 'manfiy idle 0 ga keltiriladi');
  png(act, { idle: 'abc' }); ok(act.online(() => U1).users[0].idle === 0, 'notoʻgʻri idle xavfsiz');
  png(act, { idle: 1e12 }); ok(act.online(() => U1).users[0].idle <= 86400, 'katta idle chegaralanadi');
}
{ // 3) bir seans — bir nechta oyna; oyna yopilishi va kutish (grace)
  const { db, act } = mk(); login(db, 'S1', U1);
  png(act, { tid: tid(1) }); png(act, { tid: tid(2), pg: 'essay' });
  let o = act.online(() => U1); ok(o.users.length === 1 && o.users[0].tabs === 2 && o.counts.users === 1 && o.counts.sessions === 1, 'ikki oyna — bitta tashrif, tabs=2', o);
  T += 5000; act.bye(tid(1)); act.sweep(); ok(act.online(() => U1).users.length === 1 && db.visits[0].open === 1, 'bitta oyna yopildi — tashrif ochiq (ikkinchi oyna bor)');
  T += 20000; png(act, { tid: tid(2) }); act.sweep(); ok(db.visits[0].open === 1 && act.online(() => U1).users[0].tabs === 1, 'yopilgan oyna kutish vaqtidan keyin olib tashlanadi');
  T += 1000; act.bye(tid(2)); T += 5000; act.sweep(); ok(db.visits[0].open === 1, 'oxirgi oyna yopildi, lekin 15 soniya kutiladi (sahifa almashinuvi/qayta yuklash boʻlishi mumkin)');
  T += 4000; png(act, { tid: tid(2) }); T += 20000; png(act, { tid: tid(2) }); act.sweep(); ok(db.visits.length === 1 && db.visits[0].open === 1, 'qayta yuklash: shu oyna kutish vaqtida qaytsa — tashrif uzilmaydi');
  T += 1000; act.bye(tid(2)); T += 16000; act.sweep(); ok(db.visits[0].open === undefined && db.visits[0].r === 'bye' && db.visits[0].t1 === T - 16000, 'oyna yopildi → tashrif «bye» sababi bilan yopildi, chiqish vaqti yopilgan payt', db.visits[0]);
}
{ // 4) mehmonlar (hisobsiz): faqat xotirada, jurnalga yozilmaydi; ilova sahifasi → «auth»
  const { db, act } = mk();
  act.ping({ tid: tid(9), u: null, ip: '198.51.100.1', ua: 'Mozilla/5.0 (iPhone) Safari/604.1', pg: 'landing', vis: 1, idle: 0 });
  act.ping({ tid: tid(10), u: null, ip: '198.51.100.2', ua: '', pg: 'dashboard', vis: 1, idle: 0 });
  act.ping({ tid: tid(11), u: null, ip: '198.51.100.3', ua: '', pg: 'privacy', vis: 0, idle: 0 });
  const o = act.online(() => null);
  ok(o.users.length === 0 && o.guests.length === 3 && o.counts.guests === 3 && o.counts.total === 3 && db.visits.length === 0 && db.activity.length === 0, 'mehmonlar sanaladi, bazaga yozilmaydi', o.counts);
  const pg = Object.fromEntries(o.guests.map(g => [g.ip, g.pg]));
  ok(pg['198.51.100.1'] === 'landing' && pg['198.51.100.2'] === 'auth' && pg['198.51.100.3'] === 'privacy', 'mehmon ilova sahifasini koʻrmaydi: «auth»; ochiq sahifalar saqlanadi', pg);
  ok(o.guests.every(g => g.id.length === 6 && !('tid' in g)), 'mehmon identifikatori qisqartirilgan (toʻliq tid chiqmaydi)');
  T += 160000; act.sweep(); ok(act.online(() => null).guests.length === 0, 'mehmon 2.5 daqiqada oflayn');
}
{ // 5) tekshiruvlar va chegaralar
  const { db, act } = mk(); login(db, 'S1', U1);
  for (const bad of ['', 'x', 'a b c d e f g h i j', 'tab-0000000001', 'a'.repeat(40), null, undefined, 5, {}, ['tab0000000001', 'x']]) ok(act.ping({ tid: bad, u: U1, sh: 'S1', ip: '1.1.1.1', pg: 'x', vis: 1, idle: 0 }) === false || bad && bad.length === 2, 'notoʻgʻri tid rad etiladi: ' + JSON.stringify(bad));
  ok(db.visits.length === 0 && act.counts().total === 0, 'notoʻgʻri tid hech narsa yozmaydi');
  png(act, { pg: '<script>alert(1)</script>' }); ok(db.visits[0].pp.length === 0 || db.visits[0].pp.every(p => /^[a-z0-9:_\-\/]+$/i.test(p)), 'sahifa nomi tozalanadi', db.visits[0].pp);
  png(act, { pg: 'a'.repeat(100) }); ok(db.visits[0].pp.every(p => p.length <= 32), 'uzun sahifa nomi kesiladi/rad etiladi');
  png(act, { pg: '../../etc/passwd' }); ok(!db.visits[0].pp.some(p => p.includes('..')), 'yoʻl belgilari qabul qilinmaydi');
  const m2 = mk(); for (let i = 0; i < 40; i++) m2.act.ping({ tid: tid(100 + i), u: null, ip: '192.0.2.1', pg: 'landing', vis: 1, idle: 0 });
  ok(m2.act.counts().guests === 25, 'bitta IP dan eng koʻpi 25 oyna (mehmonlar soni oshirib yuborilmaydi)', m2.act.counts());
  m2.act.ping({ tid: tid(100), u: null, ip: '192.0.2.1', pg: 'landing', vis: 1, idle: 0 }); ok(m2.act.counts().guests === 25, 'mavjud oyna yangilanadi, yangi emas');
  const m3 = mk(); for (let i = 0; i < 5100; i++) m3.act.ping({ tid: tid(1000 + i), u: null, ip: '10.' + (i >> 8) + '.' + (i & 255) + '.1', pg: 'landing', vis: 1, idle: 0 });
  ok(m3.act.counts().guests === 5000, 'umumiy chegara 5000 oyna', m3.act.counts());
  // oyna IP si oʻzgarsa, IP hisobi ham koʻchadi
  const m4 = mk(); for (let i = 0; i < 25; i++) m4.act.ping({ tid: tid(200 + i), u: null, ip: '192.0.2.9', pg: 'landing', vis: 1, idle: 0 });
  m4.act.ping({ tid: tid(200), u: null, ip: '192.0.2.10', pg: 'landing', vis: 1, idle: 0 }); ok(m4.act.ping({ tid: tid(300), u: null, ip: '192.0.2.9', pg: 'landing', vis: 1, idle: 0 }) === true, 'oyna boshqa IP ga oʻtgach, eski IP da joy boʻshaydi');
}
{ // 6) seans tugashi, chiqish, bloklash, hisob oʻchirilishi
  const { db, act } = mk(); login(db, 'S1', U1); login(db, 'S2', U2);
  png(act); png(act, { tid: tid(2), sh: 'S2', u: U2 });
  act.closeSession('S1', 'logout'); ok(db.visits[0].open === undefined && db.visits[0].r === 'logout' && db.visits[1].open === 1, 'chiqish: faqat shu seansning tashrifi yopiladi (logout)', db.visits.map(v => [v.uid, v.r]));
  delete db.sessions.S2; act.sweep(); ok(db.visits[1].open === undefined && db.visits[1].r === 'revoked', 'seans oʻchirilsa (parol tiklash, muddat) — tashrif yopiladi (revoked)', db.visits[1]);
  png(act); act.closeUser('u1', 'block'); ok(db.visits[2].r === 'block' && act.online(id => ({ u1: U1, u2: U2 }[id])).users.filter(x => x.uid === 'u1').length === 0 && act.counts().users === 0, 'bloklash: foydalanuvchining barcha tashriflari yopiladi, online dan chiqadi');
  act.event('login', U1, '203.0.113.5', 'Mozilla/5.0 (Android) Chrome/1 Mobile', ''); act.event('logout', U2, '203.0.113.6', '');
  const keep = db.visits.length; act.forget('u1'); ok(db.visits.every(v => v.uid !== 'u1') && db.activity.every(e => e.uid !== 'u1') && db.activity.length === 1 && db.visits.length < keep, 'hisob oʻchirilsa shu foydalanuvchining tashriflari va hodisalari ham oʻchadi (boshqalariniki qoladi)', db.activity);
}
{ // 7) hodisalar: tuzilish, tozalash, chegara
  const { db, act } = mk();
  act.event('login', U1, '203.0.113.5', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15', 'x\u0000y\nz');
  const e = db.activity[0]; ok(e.k === 'login' && e.uid === 'u1' && e.em === 'ali@example.test' && e.nm === 'Ali' && e.ip === '203.0.113.5' && e.d === 'Safari · macOS' && e.x === 'x y z' && e.t === T, 'hodisa tuzilishi, qurilma, boshqaruv belgilari tozalanadi', e);
  act.event('blocked', null, '203.0.113.9', '', 'kirish'); ok(db.activity[1].uid === '' && db.activity[1].em === '', 'hisobsiz hodisa (bloklangan urinish)');
  for (let i = 0; i < 250; i++) act.event('login', U1, '1.1.1.1', ''); ok(db.activity.length === 100, 'hodisalar jurnali 100 ta bilan cheklangan (eng eskilari oʻchadi)', db.activity.length);
  const long = 'q'.repeat(500); act.event('login', U1, 'i'.repeat(200), '', long); const l = db.activity[db.activity.length - 1]; ok(l.x.length === 120 && l.ip.length === 64, 'uzun maydonlar kesiladi');
  const m = mk(); login(m.db, 'S1', U1); for (let i = 0; i < 150; i++) { m.act.ping({ tid: tid(i + 1), sh: 'S' + i, u: U1, ip: '1.1.1.' + (i % 200), pg: 'x', vis: 1, idle: 0 }); }
  ok(m.db.visits.length <= 100, 'tashriflar jurnali 100 ta bilan cheklangan', m.db.visits.length);
}
{ // 8) feed, userInfo, statistika, eng yuqori online, qayta ishga tushish
  const { db, act } = mk(); login(db, 'S1', U1); login(db, 'S2', U2);
  png(act); T += 30 * 60000; png(act, { tid: tid(2), sh: 'S2', u: U2 }); T += 60000; act.sweep();
  const f = act.feed(10); ok(f.visits.length === 2 && f.visits[0].uid === 'u2' && f.visits[1].uid === 'u1' && f.visits[1].open === false && f.visits[0].open === true && f.visits[1].r === 'idle', 'feed: yangisi birinchi, ochiq/yopiq va sabab', f.visits);
  ok(f.stat.visitsToday === 2 && f.stat.usersToday === 2 && f.stat.visitsTotal === 2 && f.stat.since === db.visits[0].t0, 'feed statistikasi: bugungi tashriflar, foydalanuvchilar, jami', f.stat);
  ok(act.feed(0).visits.length === 1 && act.feed(99999).visits.length === 2 && act.feed('x').visits.length === 1, 'feed(n) chegaralanadi');
  const ui = act.userInfo('u1'); ok(ui.visits.length === 1 && ui.total.visits === 1 && ui.total.pings === 1 && ui.total.ms === 0 && ui.sessions.length === 1 && ui.now.length === 0, 'userInfo: tashriflar, jami vaqt, seanslar, hozir oflayn', ui);
  ok(act.userInfo('nope').visits.length === 0 && act.userInfo('nope').total.visits === 0, 'nomaʼlum foydalanuvchi — boʻsh natija');
  ok(db.peak && db.peak.n >= 1 && db.peak.d === day(T), 'eng yuqori online yozildi', db.peak);
  const db2 = JSON.parse(JSON.stringify(db)); db2.visits[1].open = 1; const act2 = A.create(db2, () => {}, day, clock); ok(db2.visits.every(v => !v.open) && act2.online(() => null).users.length === 0, 'server qayta ishga tushganda ochiq qolgan tashriflar yopilgan hisoblanadi');
  png(act, { tid: tid(5), sh: 'S1' }); act.ping({ tid: tid(6), u: null, ip: '9.9.9.9', pg: 'landing', vis: 1, idle: 0 }); ok(JSON.stringify(act.online(() => U1)).indexOf('203.0.113.5') > 0 && act.counts().total >= 2, 'online: foydalanuvchi + mehmon');
}
{ // 9) seans boshqa foydalanuvchiga oʻtib qolsa (kutilmagan) — eski tashrif yopiladi
  const { db, act } = mk(); login(db, 'S1', U1); png(act); png(act, { u: U2 });
  ok(db.visits.length === 2 && db.visits[0].r === 'idle' && db.visits[1].uid === 'u2' && db.visits[1].open === 1, 'bir seans — bitta foydalanuvchi: almashsa eski tashrif yopiladi', db.visits.map(v => [v.uid, v.open, v.r]));
}
{ // 10) PII: maska va uaShort
  ok(A.MASK('ali@example.test') === 'a***@example.test' && A.MASK('x') === '' && A.MASK(null) === '', 'MASK: email maskalanadi');
  ok(A.uaShort('Mozilla/5.0 (Linux; Android 14) AppleWebKit Chrome/120 Mobile Safari/537.36 Edg/120') === 'Edge · Android' && A.uaShort('') === '' && A.uaShort('a'.repeat(5000)).length <= 40, 'uaShort');
}
console.log(`activity: ${n - bad} ta oʻtdi, ${bad} ta yiqildi`); process.exit(bad ? 1 : 0);

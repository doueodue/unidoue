/* Xavfsizlik regressiya testlari: har bir topilgan zaiflik uchun alohida tekshiruv.
 * Faqat mahalliy, ajratilgan serverga qarshi ishlaydi (tasodifiy port, vaqtinchalik DATA_DIR, soxta xat/AI xizmatlari). */
const { spawn } = require('node:child_process');
const http = require('node:http'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const ROOT = path.join(__dirname, '..');
let pass = 0, failN = 0;
const ok = (c, name, extra) => { if (c) pass++; else { failN++; console.log('  FAIL:', name, extra !== undefined ? JSON.stringify(extra).slice(0, 240) : ''); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const mock = h => new Promise(res => { const s = http.createServer((q, r) => { let b = ''; q.on('data', c => (b += c)); q.on('end', () => h(q, b, r)); }); s.listen(0, () => res(s)); });

/** Past darajadagi HTTP soʻrov: Host va boshqa sarlavhalarni toʻliq nazorat qilish uchun */
function raw(port, method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : body ? JSON.stringify(body) : ''; // satr berilsa — xom tana (buzilgan JSON testlari uchun)
    const req = http.request({ host: '127.0.0.1', port, method, path: url, headers: { ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}), ...headers } }, res => {
      const ch = []; res.on('data', c => ch.push(c)); res.on('end', () => { const t = Buffer.concat(ch).toString(); let j = null; try { j = JSON.parse(t); } catch (e) {} resolve({ s: res.statusCode, j, t, h: res.headers }); });
    });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}
/** Cookie saqlaydigan klient */
const client = port => { const jar = {}; const f = async (m, u, b, h = {}) => { const ck = Object.entries(jar).map(([k, v]) => k + '=' + v).join('; '); const r = await raw(port, m, u, b, { ...(ck ? { Cookie: ck } : {}), ...h }); for (const sc of [].concat(r.h['set-cookie'] || [])) { const [kv] = sc.split(';'), i = kv.indexOf('='), k = kv.slice(0, i), v = kv.slice(i + 1); if (/Max-Age=0/i.test(sc) || !v) delete jar[k]; else jar[k] = v; } return r; }; f.jar = jar; return f; };

async function boot(port, dir, mailPort, extra = {}) {
  const proc = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), DATA_DIR: dir, ANTHROPIC_API_KEY: '', REQUIRE_EMAIL_VERIFY: '0', ADMIN_TOKEN: 'sched-tok', ADMIN_ALLOW_TOKEN: '', ADMIN_EMAILS: 'owner@example.test', RESEND_API_KEY: 'k', RESEND_URL: `http://localhost:${mailPort}/emails`, APP_URL: '', COOKIE_SECURE: '', TRUST_PROXY: '', ...extra }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { const r = await raw(port, 'GET', '/healthz'); if (r.s === 200) break; } catch (e) {} await sleep(100); }
  return proc;
}
const stop = p => new Promise(r => { p.once('exit', r); p.kill(); setTimeout(r, 2000); });


let PORT_N = 4700 + Math.floor(Math.random() * 150);
/** Har bir suite oʻz serveri, oʻz vaqtinchalik papkasi va oʻz soxta xat xizmati bilan ishlaydi */
async function suite(name, env, fn) {
  console.log(name);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ud-sec-')), mails = [], P = PORT_N++;
  const ms = await mock((q, b, r) => { try { mails.push(JSON.parse(b)); } catch (e) {} r.setHeader('content-type', 'application/json'); r.end('{"id":"1"}'); });
  const MP = ms.address().port; let proc = await boot(P, dir, MP, env);
  const ctx = { P, dir, mails, MP, raw: (...a) => raw(P, ...a), client: () => client(P), restart: async e2 => { await stop(proc); proc = await boot(P, dir, MP, { ...env, ...(e2 || {}) }); }, waitMail: async (n = 1, ms2 = 3000) => { for (let i = 0; i < ms2 / 50 && mails.length < n; i++) await sleep(50); return mails.length >= n; } };
  try { await fn(ctx); } catch (e) { failN++; console.log('XATO:', e); }
  await stop(proc); ms.close(); try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch (e) {}
}
const adm = { Authorization: 'Bearer sched-tok' };

(async () => {
  /* ---- S2: prototip kalitlari (constructor/__proto__) tarif va xabar turini buzmasin ---- */
  await suite('Prototip kalitlari (tarif/limitni buzish)', {}, async ({ client: cl, raw: rq }) => {
    const u = cl(); let q = await u('POST', '/api/register', { email: 'proto@example.test', password: 'parol12345', name: 'Proto' }); ok(q.s === 201, 'proto: hisob ochildi', q.s);
    for (const k of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
      q = await u('POST', '/api/plan/downgrade', { plan: k }); ok(q.s === 400, `plan/downgrade: «${k}» rad etiladi`, q.s);
      q = await u('GET', '/api/me'); ok(q.s === 200 && q.j.user !== null && q.j.account && q.j.account.plan === 'free' && q.j.account.credits.left === 50, `«${k}» dan keyin tarif free va kredit limiti 50`, q.j && q.j.account && q.j.account.credits);
    }
    for (const k of ['constructor', '__proto__', 'toString']) { q = await u('POST', '/api/feedback', { type: k, text: 'Bu sinov uchun yetarlicha uzun matn.' }); ok(q.s === 400, `feedback: «${k}» turi rad etiladi`, q.s); }
    q = await u('POST', '/api/plan/request', { plan: 'constructor' }); ok(q.s === 400, 'plan/request: «constructor» rad etiladi', q.s);
    q = await u('POST', '/api/ai', { tool: 'constructor' }); ok(q.s === 400 || q.s === 503, 'ai: «constructor» vositasi rad etiladi', q.s);
    q = await u('PUT', '/api/data', { data: { 'qabul:__proto__': 'x', constructor: 'z' } }); ok(q.s === 200 && Object.keys(Object.prototype).length === 0 && ({}).x === undefined, 'data: __proto__/constructor kalitlari tuzilmani ifloslamaydi', q.s);
    q = await rq('POST', '/api/admin/plan', { email: 'proto@example.test', plan: 'constructor' }, adm); ok(q.s === 401, 'admin/plan: token bilan yopiq', q.s);
  });

  /* ---- S3: Host sarlavhasi orqali parol tiklash havolasini almashtirib boʻlmasin ---- */
  await suite('Host sarlavhasi (parol tiklash havolasi)', {}, async ({ raw: rq, client: cl, mails, waitMail }) => {
    const u = cl(); await u('POST', '/api/register', { email: 'host@example.test', password: 'parol12345', name: 'Host' });
    const q = await rq('POST', '/api/password/forgot', { email: 'host@example.test' }, { Host: 'evil.attacker.test' }); ok(q.s === 200, 'forgot: javob 200', q.s);
    await waitMail(1);
    const link = mails[0] && (/href="([^"]+)"/.exec(mails[0].html) || [])[1];
    ok(!!link && !/evil\.attacker\.test/.test(link), 'parol tiklash havolasi hujumchi Host ini oʻz ichiga olmaydi', link);
    ok(!!link && /^https?:\/\/(localhost|127\.0\.0\.1|unidoue\.uz)/.test(link), 'havola ishonchli manzildan boshlanadi', link);
  });

  /* ---- S1: soxta X-Forwarded-For bilan tezlik limitini aylanib oʻtib boʻlmasin ---- */
  await suite('Mijoz IP si (X-Forwarded-For soxtalashtirish)', { TRUST_PROXY: '1' }, async ({ raw: rq }) => {
    // Render proksisi sarlavhaga oʻz kuzatgan manzilni OXIRIGA qoʻshadi; hujumchi chap tomonni xohlaganicha yozadi
    let last; const codes = [];
    for (let i = 0; i < 12; i++) { last = await rq('POST', '/api/password/forgot', { email: `x${i}@example.test` }, { 'X-Forwarded-For': `9.9.9.${i}, 10.1.1.1` }); codes.push(last.s); }
    ok(codes.slice(0, 8).every(c => c === 200) && codes.slice(8).every(c => c === 429), 'forgot: chapga yozilgan soxta IP limitni aylanib oʻtmaydi (8 tadan keyin 429)', codes);
    // Cloudflare ishonchli sarlavhasi: haqiqiy mijoz IP si alohida hisoblanadi
    let q = await rq('POST', '/api/password/forgot', { email: 'cf@example.test' }, { 'True-Client-IP': '203.0.113.7', 'X-Forwarded-For': '9.9.9.1, 10.1.1.1' }); ok(q.s === 200, 'True-Client-IP boshqa mijoz sifatida hisoblanadi', q.s);
    // yaroqsiz qiymatlar eʼtiborga olinmaydi (xatoga olib kelmaydi)
    q = await rq('POST', '/api/password/forgot', { email: 'bad@example.test' }, { 'True-Client-IP': 'not-an-ip', 'X-Forwarded-For': '<script>, ,,' }); ok(q.s === 200 || q.s === 429, 'yaroqsiz IP sarlavhalari serverni buzmaydi', q.s);
    // admin jurnalida soxta IP koʻrinmaydi
  });
  await suite('Mijoz IP si (TRUST_PROXY oʻchiq: sarlavhalarga ishonilmaydi)', { TRUST_PROXY: '' }, async ({ raw: rq }) => {
    const codes = []; for (let i = 0; i < 10; i++) codes.push((await rq('POST', '/api/password/forgot', { email: `y${i}@example.test` }, { 'X-Forwarded-For': `8.8.8.${i}`, 'True-Client-IP': `7.7.7.${i}` })).s);
    ok(codes.slice(8).every(c => c === 429), 'TRUST_PROXY yoʻq: IP sarlavhalari butunlay eʼtiborga olinmaydi', codes);
  });

  /* ---- Email suiisteʼmoli: bomba hujumi, kvota, oʻchirgich, qabul qiluvchi tekshiruvi ---- */
  const OWNER = 'owner@example.test';
  const codeOf = (mails, re = /kirish kodi|tasdiqlash kodi/) => { const m = mails.filter(x => x.to && x.to[0] === OWNER && re.test(x.subject)).pop(); return m ? (/<b>(\d{6})<\/b>/.exec(m.html) || [])[1] : null; };
  const adminLogin = async (ctx, c) => { await sleep(450); const n = ctx.mails.length; await c('POST', '/api/admin/login/start', { email: OWNER }); await ctx.waitMail(n + 1); return c('POST', '/api/admin/login/verify', { email: OWNER, code: codeOf(ctx.mails, /kirish kodi/) }); };
  await suite('Email himoyasi: bomba hujumi va per-qabul qiluvchi kvota', { REQUIRE_EMAIL_VERIFY: '', MAIL_RCPT_HOURLY: '3', REG_RATE_MAX: '50' }, async ({ client: cl, mails, raw: rq }) => {
    const to = e => mails.filter(m => m.to && m.to[0] === e).length; const codes = [];
    for (let i = 0; i < 6; i++) { const q = await cl()('POST', '/api/register', { email: 'victim@example.test', password: 'parol12345', name: 'Hujumchi' + i }); codes.push(q.s); await sleep(120); }
    ok(to('victim@example.test') === 3, 'bitta begona manzilga soatiga 3 tadan ortiq tasdiqlash xati ketmaydi (xat bombasi)', to('victim@example.test'));
    ok(codes.slice(0, 3).every(c => c === 201) && codes.slice(3).every(c => c === 429), 'kvotadan keyin registratsiya 429 qaytaradi', codes);
    const q = await rq('POST', '/api/password/forgot', { email: 'victim@example.test' }); ok(q.s === 200, 'forgot javobi oʻzgarmaydi (hisob mavjudligi sezilmaydi)', q.s);
    for (const bad of ['a@b.test,c@d.test', 'x"y@b.test', 'a b@c.test', 'a<b>@c.test', 'a@b.test;c@d.test', 'a@b', 'a(b)@c.test']) { const r = await cl()('POST', '/api/register', { email: bad, password: 'parol12345', name: 'Qabul' }); ok(r.s === 400, `registratsiya: qabul qiluvchi ajratuvchilari bilan «${bad}» rad etiladi`, r.s); }
  });
  await suite('Email himoyasi: global kvota va ogohlantirish', { REQUIRE_EMAIL_VERIFY: '', MAIL_HOURLY_MAX: '4', REG_RATE_MAX: '50', MAIL_RCPT_HOURLY: '6' }, async ({ client: cl, mails, waitMail }) => {
    const codes = []; for (let i = 0; i < 7; i++) { codes.push((await cl()('POST', '/api/register', { email: `v${i}@example.test`, password: 'parol12345', name: 'Global' + i })).s); await sleep(100); }
    ok(codes.filter(c => c === 201).length === 4 && codes.slice(4).every(c => c === 429), 'umumiy soatlik kvotadan keyin xat ketmaydi', codes);
    ok(mails.filter(m => m.to[0].startsWith('v')).length === 4, 'provayderga aynan 4 ta xat yuborilgan', mails.length);
    await waitMail(5); const al = mails.find(m => m.to[0] === OWNER && /kvotasi/.test(m.subject)); ok(!!al, 'administratorga «Email kvotasi tugadi» ogohlantirishi yuborildi (kvotaga qaramay)', mails.map(m => m.subject));
  });
  await suite('Email himoyasi: oʻchirgich (MAIL_DISABLED=1)', { REQUIRE_EMAIL_VERIFY: '', MAIL_DISABLED: '1', ADM_COOLDOWN_MS: '300' }, async (ctx) => {
    const { client: cl, mails, raw: rq } = ctx;
    let q = await cl()('POST', '/api/register', { email: 'off@example.test', password: 'parol12345', name: 'Off' }); ok(q.s === 429 && /oʻchirilgan/.test((q.j || {}).error || ''), 'oʻchirgich yoqilganda foydalanuvchiga xat ketmaydi', q);
    q = await rq('POST', '/api/password/forgot', { email: 'off@example.test' }); await sleep(200); ok(q.s === 200 && !mails.some(m => m.to[0] === 'off@example.test'), 'forgot: xat ketmaydi', mails.length);
    const A = cl(); q = await adminLogin(ctx, A); ok(q.s === 200, 'oʻchirgichga qaramay admin kirish kodi keladi (administrator qulflanib qolmaydi)', q.s);
    q = await A('POST', '/api/admin/mail/switch', { off: false }); ok(q.s === 409, 'MAIL_DISABLED muhit oʻzgaruvchisini panelidan olib boʻlmaydi', q.s);
  });

  /* ---- Admin: step-up, oʻchirgich, jurnal zanjiri, lockdown, hisob boʻyicha cheklov ---- */
  await suite('Admin: qayta tasdiqlash, jurnal zanjiri, favqulodda choralar', { TRUST_PROXY: '1', ADM_COOLDOWN_MS: '300', ADM_REAUTH_MS: '1500', MAIL_BULK_MAX: '50' }, async (ctx) => {
    const { client: cl, mails, raw: rq, dir, waitMail } = ctx, A = cl(), U = [];
    let q = await adminLogin(ctx, A); ok(q.s === 200, 'admin kirdi', q.s);
    for (let i = 0; i < 3; i++) { const u = cl(); await u('POST', '/api/register', { email: `bulk${i}@example.test`, password: 'parol12345', name: 'Bulk' + i }); U.push(u); }
    ok(mails.some(m => m.to[0] === OWNER && /YANGI qurilma/.test(m.subject)) || await waitMail(2), 'yangi qurilmadan kirish haqida ogohlantirish', mails.map(m => m.subject));
    // step-up: kirishdan keyingi qisqa oynada ruxsat, keyin esa yangi kod shart
    await sleep(1700); mails.length = 0;
    const NOTE = { title: 'Yangilik', body: 'Salom hammaga, yangi imkoniyatlar qoʻshildi.', audience: 'all', channels: { app: true, mail: true } };
    q = await A('POST', '/api/admin/notify', NOTE); ok(q.s === 403 && q.j.reauth === true, 'ommaviy xat: yangi kodsiz rad etiladi (403, reauth)', q);
    ok(!mails.some(m => /bulk\d@/.test(m.to[0])), 'rad etilganda hech kimga xat ketmagan', mails.length);
    q = await A('POST', '/api/admin/reauth/verify', { code: '000000' }); ok(q.s === 401, 'qayta tasdiqlash: kod soʻralmagan boʻlsa rad etiladi', q.s);
    q = await A('POST', '/api/admin/reauth/start', {}); ok(q.s === 200, 'qayta tasdiqlash kodi soʻraldi', q.s); await waitMail(1);
    const rc = codeOf(mails, /amalni tasdiqlash kodi/), wrong = rc === '000000' ? '111111' : '000000';
    q = await A('POST', '/api/admin/reauth/verify', { code: wrong }); ok(q.s === 401, 'qayta tasdiqlash: notoʻgʻri kod rad etiladi', q.s);
    q = await A('POST', '/api/admin/notify', NOTE); ok(q.s === 403, 'notoʻgʻri kod bilan ommaviy xat ochilmaydi', q.s);
    q = await A('POST', '/api/admin/reauth/verify', { code: rc }); ok(q.s === 200 && q.j.ok, 'toʻgʻri kod bilan qayta tasdiqlandi', q);
    mails.length = 0; q = await A('POST', '/api/admin/notify', NOTE); ok(q.s === 200 && q.j.st.mail && q.j.st.mail.ok === 3, 'qayta tasdiqlangandan keyin ommaviy xat yuboriladi (3 ta)', q.j);
    await waitMail(4); ok(mails.some(m => m.to[0] === OWNER && /Ommaviy xat/.test(m.subject)), 'ommaviy xat haqida administratorga ogohlantirish yuborildi', mails.map(m => m.subject));
    q = await rq('POST', '/api/admin/reauth/verify', { code: rc }, { Cookie: `ud_adm=${A.jar.ud_adm}` }); ok(q.s === 401, 'qayta tasdiqlash kodi bir martalik', q.s);

    // xatni favqulodda oʻchirish: oʻchirish darhol, yoqish — qayta tasdiqlash bilan
    q = await A('POST', '/api/admin/mail/switch', { off: true }); ok(q.s === 200 && q.j.mail.off === true, 'xat yuborish oʻchirildi (darhol)', q.j);
    mails.length = 0; q = await cl()('POST', '/api/register', { email: 'after-off@example.test', password: 'parol12345', name: 'Off' }); ok(q.s === 201 || q.s === 429, 'registratsiya javobi', q.s); await sleep(250);
    ok(!mails.some(m => m.to[0] === 'after-off@example.test'), 'oʻchirgichdan keyin foydalanuvchiga xat ketmaydi', mails.map(m => m.to[0]));
    await sleep(1700); q = await A('POST', '/api/admin/mail/switch', { off: false }); ok(q.s === 403 && q.j.reauth, 'xatni qayta yoqish — yangi kod talab qiladi', q.s);
    q = await A('POST', '/api/admin/reauth/start', {}); await waitMail(1); q = await A('POST', '/api/admin/reauth/verify', { code: codeOf(mails, /amalni tasdiqlash kodi/) });
    q = await A('POST', '/api/admin/mail/switch', { off: false }); ok(q.s === 200 && q.j.mail.off === false, 'qayta tasdiqlangach xat yuborish yoqildi', q.j);

    // jurnal: voqealar, zanjir, tamper aniqlash, sirlar yoʻqligi
    q = await A('GET', '/api/admin/security'); ok(q.s === 200 && q.j.chain.ok === true && q.j.chain.count > 8, 'xavfsizlik jurnali zanjiri butun', q.j && q.j.chain);
    const evs = q.j.events.map(e => e.ev); for (const need of ['admin.login', 'admin.notify', 'admin.mail.switch', 'admin.reauth.ok', 'alert.bulk-mail']) ok(evs.includes(need), `jurnalda «${need}» voqeasi bor`, evs.slice(0, 12));
    ok(q.j.mail.sent24 >= 3 && q.j.mail.hour.max === 400, 'email holati: yuborilgan soni va kvota koʻrinadi', q.j.mail);
    const logFile = path.join(dir, 'security.log'), orig = fs.readFileSync(logFile, 'utf8'), lines = orig.split('\n').filter(Boolean);
    ok(!orig.includes(codeOf(mails.concat([]), /kirish kodi/) || 'x-none') && !orig.includes(A.jar.ud_adm) && !orig.includes('sched-tok') && !/parol12345/.test(orig), 'jurnalda kod, token yoki parol yoʻq');
    ok((fs.statSync(logFile).mode & 0o077) === 0, 'jurnal fayli faqat egasi uchun (0600)');
    const k = lines.findIndex(l => /"ev":"admin\.login"/.test(l)); ok(k > 0, 'jurnalda admin.login qatori topildi', k);
    const edit = lines.slice(); edit[k] = edit[k].replace('"admin.login"', '"admin.logon"'); fs.writeFileSync(logFile, edit.join('\n') + '\n');
    q = await A('GET', '/api/admin/security'); ok(q.j.chain.ok === false && q.j.chain.brokenAt === k + 1, 'qator oʻzgartirilsa zanjir buzilgani aniqlanadi', q.j.chain);
    const del = lines.slice(); del.splice(4, 1); fs.writeFileSync(logFile, del.join('\n') + '\n');
    q = await A('GET', '/api/admin/security'); ok(q.j.chain.ok === false, 'qator oʻchirilsa zanjir buzilgani aniqlanadi', q.j.chain);
    const swp = lines.slice(); [swp[2], swp[5]] = [swp[5], swp[2]]; fs.writeFileSync(logFile, swp.join('\n') + '\n');
    q = await A('GET', '/api/admin/security'); ok(q.j.chain.ok === false, 'qatorlar oʻrni almashtirilsa zanjir buzilgani aniqlanadi', q.j.chain);
    fs.writeFileSync(logFile, orig); q = await A('GET', '/api/admin/security'); ok(q.j.chain.ok === true, 'asl holat tiklangach zanjir yana butun', q.j.chain);

    // hisob boʻyicha cheklov: IP almashtirilsa ham admin kodini taxmin qilib boʻlmaydi
    const B = cl(); await sleep(450); const n0 = mails.length; await B('POST', '/api/admin/login/start', { email: OWNER }); await waitMail(n0 + 1);
    const good = codeOf(mails, /kirish kodi/), badc = good === '000000' ? '111111' : '000000'; let last;
    for (let i = 0; i < 11; i++) last = await B('POST', '/api/admin/login/verify', { email: OWNER, code: badc }, { 'True-Client-IP': `198.51.100.${i + 1}` });
    q = await B('POST', '/api/admin/login/verify', { email: OWNER, code: good }, { 'True-Client-IP': '198.51.100.200' }); ok(q.s === 429, 'boshqa IP dan toʻgʻri kod ham 15 daqiqaga bloklanadi (hisob boʻyicha cheklov, faqat IP emas)', q.s);
    q = await B('POST', '/api/admin/login/start', { email: OWNER }, { 'True-Client-IP': '198.51.100.201' }); ok(q.s === 429, 'cheklov davomida yangi kod ham soʻralmaydi', q.s);
    q = await A('GET', '/api/admin/stats'); ok(q.s === 200, 'mavjud admin seansi cheklovdan taʼsirlanmaydi', q.s);
    await waitMail(1); q = await A('GET', '/api/admin/security'); const ev2 = q.j.events.map(e => e.ev);
    ok(ev2.includes('alert.code-guess') && ev2.includes('alert.restrict') && ev2.includes('admin.restrict'), 'kodni taxmin qilish va cheklash jurnalga yozilgan, ogohlantirishlar chiqarilgan', ev2.slice(0, 15));
    ok(mails.some(m => m.to[0] === OWNER && /cheklandi/.test(m.subject)), 'cheklash haqida administratorga email ketdi', mails.slice(-4).map(m => m.subject));

    // favqulodda lockdown, seanslarni sanadan boshlab bekor qilish
    const tok = A.jar.ud_adm, c2 = cl(); c2.jar.ud_adm = tok;
    await ctx.restart({ ADMIN_LOCKDOWN: '1' }); q = await c2('GET', '/api/admin/stats'); ok(q.s === 401, 'LOCKDOWN: mavjud seans ishlamaydi', q.s);
    q = await c2('POST', '/api/admin/login/start', { email: OWNER }); ok(q.s === 503, 'LOCKDOWN: yangi kirish yopiq', q.s);
    q = await rq('POST', '/api/admin/remind', null, adm); ok(q.s === 200, 'LOCKDOWN: rejalashtiruvchi tokeni ishlashda davom etadi (faqat /remind)', q.s);
    q = await rq('GET', '/api/admin/stats', null, adm); ok(q.s === 401, 'LOCKDOWN: token boshqa endpointlarni ochmaydi', q.s);
    await ctx.restart({ ADMIN_LOCKDOWN: '' }); q = await c2('GET', '/api/admin/stats'); ok(q.s === 200, 'LOCKDOWN olib tashlangach seans yana ishlaydi (maʼlumot saqlangan)', q.s);
    await ctx.restart({ ADMIN_REVOKE_BEFORE: new Date(Date.now() + 3600e3).toISOString() }); q = await c2('GET', '/api/admin/stats'); ok(q.s === 401, 'ADMIN_REVOKE_BEFORE: shu sanadan oldingi hamma admin seanslari yaroqsiz', q.s);
    // foydalanuvchi sessiyalari ham
    const u0 = U[0]; q = await u0('GET', '/api/me'); ok(q.j && q.j.user && q.j.user.email === 'bulk0@example.test', 'ADMIN_REVOKE_BEFORE faqat admin seanslariga tegadi: foydalanuvchi seansi saqlanadi', q.j);
  });
  await suite('Foydalanuvchi sessiyalarini favqulodda bekor qilish', {}, async (ctx) => {
    const u = ctx.client(); await u('POST', '/api/register', { email: 'rev@example.test', password: 'parol12345', name: 'Rev' });
    let q = await u('GET', '/api/me'); ok(q.j.user && q.j.user.email === 'rev@example.test', 'sessiya ishlaydi');
    await ctx.restart({ SESSIONS_REVOKE_BEFORE: new Date(Date.now() + 3600e3).toISOString() }); q = await u('GET', '/api/me'); ok(q.j.user === null, 'SESSIONS_REVOKE_BEFORE: eski sessiyalar yaroqsiz', q.j);
    q = await ctx.client()('POST', '/api/login', { email: 'rev@example.test', password: 'parol12345' }); q = await ctx.raw('GET', '/healthz'); ok(q.s === 200, 'server ishlaydi');
  });

  /* ---- Standart-rad etish (deny-by-default): har bir /api/admin/* yoʻli seanssiz 401 qaytaradi; maʼlumot sizmaydi; sarlavhalar ---- */
  await suite('Admin yoʻllari: seanssiz hech narsa ochilmaydi; maʼlumot va sarlavhalar', { TRUST_PROXY: '1', ADM_COOLDOWN_MS: '300' }, async (ctx) => {
    const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8'), lines = src.split('\n');
    const routes = []; lines.forEach((l, i) => { const m = /pathname === '(\/api\/admin\/[^']+)' && \(?(?:method === '(\w+)'(?: \|\| method === '(\w+)')?)/.exec(l); if (m) routes.push({ p: m[1], m: [m[2], m[3]].filter(Boolean), i }); });
    ok(routes.length >= 35, 'manba kodidan admin yoʻllari topildi', routes.length);
    const OPEN = new Set(['/api/admin/login/start', '/api/admin/login/verify', '/api/admin/session', '/api/admin/logout']); // seanssiz ham javob beradi, lekin maʼlumot bermaydi
    // 1) statik: ochiq roʻyxatda boʻlmagan har bir yoʻl bloki admGate( yoki admAuth( ni chaqiradi (yangi yoʻl himoyasiz qoʻshilsa test yiqiladi)
    for (const r of routes) {
      if (OPEN.has(r.p)) continue;
      let j = r.i + 1; while (j < lines.length && !/^\s*if \(pathname/.test(lines[j])) j++;
      const block = lines.slice(r.i, j).join('\n'); ok(/admGate\(|admAuth\(/.test(block), `${r.p}: serverdagi tekshiruv (admGate/admAuth) chaqiriladi`);
    }
    // 2) dinamik: har bir yoʻl, har bir usul, seanssiz va tokensiz → 401 (ochiq yoʻllar maʼlumot qaytarmaydi). Har soʻrov boshqa IP dan (admin-probe cheklovi aralashmasin)
    let n = 0, bad = [];
    for (const r of routes) for (const m of (r.m.length ? r.m : ['GET'])) {
      const q = await ctx.raw(m, r.p, m === 'POST' ? {} : null, { 'True-Client-IP': `203.0.113.${(++n % 250) + 1}` });
      if (OPEN.has(r.p)) { if (q.s >= 500 || (q.j && (q.j.users || q.j.stats || q.j.log || q.j.events))) bad.push([m, r.p, q.s]); }
      else if (q.s !== 401) bad.push([m, r.p, q.s]);
    }
    ok(bad.length === 0, 'seanssiz hamma himoyalangan admin yoʻllari 401 qaytaradi', bad);
    for (const m of ['PUT', 'DELETE', 'PATCH']) { const q = await ctx.raw(m, '/api/admin/users', {}, { 'True-Client-IP': '203.0.113.250' }); ok(q.s !== 200, `${m} usuli admin yoʻlini ochmaydi`, q.s); }
    // 3) soxta/oʻzgartirilgan cookie, token sarlavhalari (token rejimi oʻchiq)
    for (const [name, h] of [['soxta cookie', { Cookie: 'ud_adm=' + 'A'.repeat(43) }], ['Bearer', { Authorization: 'Bearer sched-tok' }], ['x-admin-token', { 'x-admin-token': 'sched-tok' }], ['?token', null]]) {
      const q = await ctx.raw('GET', h ? '/api/admin/users' : '/api/admin/users?token=sched-tok', null, { 'True-Client-IP': '203.0.113.251', ...(h || {}) }); ok(q.s === 401, `admin ochilmaydi: ${name}`, q.s);
    }
    // 4) maʼlumot sizmaydi: foydalanuvchi va admin javoblarida parol hashi/kod/kalit yoʻq
    const u = ctx.client(); const reg = await u('POST', '/api/register', { email: 'leak@example.test', password: 'parol12345', name: 'Leak' }); ok(reg.s === 201, 'foydalanuvchi roʻyxatdan oʻtdi', reg.s);
    const me = await u('GET', '/api/me'), meTxt = JSON.stringify(me.j); ok(!/"(hash|salt|pw|password|vcode|vc|token|exp)"\s*:/.test(meTxt) && !meTxt.includes('parol12345'), '/api/me da parol hashi, kod yoki token yoʻq', meTxt.slice(0, 200));
    const A = ctx.client(); const lg = await adminLogin(ctx, A); ok(lg.s === 200, 'admin kirdi', lg.s);
    for (const pth of ['/api/admin/users', '/api/admin/audit', '/api/admin/stats', '/api/admin/security', '/api/admin/feedback', '/api/admin/notes', '/api/admin/orders', '/api/admin/requests']) {
      const q = await A('GET', pth), t = JSON.stringify(q.j);
      ok(q.s === 200 && !/"(hash|salt|pw|password|vcode|vc)"\s*:/.test(t) && !/sched-tok|\$2[aby]\$|scrypt\$|pbkdf2\$/.test(t) && !t.includes('parol12345'), `${pth}: maxfiy maydonlar (hash, kod, token) javobda yoʻq`, q.s);
    }
    // 5) sarlavhalar: CORS yoʻq (boshqa saytlar API ga brauzerdan murojaat qila olmaydi), CSP inline skriptsiz, clickjacking va MIME himoyasi
    const r1 = await ctx.raw('GET', '/api/me', null, { Origin: 'https://evil.example' }); ok(!r1.h['access-control-allow-origin'], 'CORS ruxsati berilmaydi (Origin: evil)', r1.h['access-control-allow-origin']);
    const r2 = await ctx.raw('OPTIONS', '/api/register', null, { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' }); ok(!r2.h['access-control-allow-origin'], 'preflight ham ruxsat bermaydi', r2.s);
    const ad = await ctx.raw('GET', '/admin'); const csp = ad.h['content-security-policy'] || '';
    ok(/default-src 'self'/.test(csp) && !/script-src[^;]*'unsafe-inline'/.test(csp) && /frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp), 'CSP: skriptlar uchun unsafe-inline yoʻq, frame-ancestors/object-src yopiq', csp);
    ok(ad.h['x-content-type-options'] === 'nosniff' && ad.h['x-frame-options'] === 'DENY' && !!ad.h['referrer-policy'] && !!ad.h['permissions-policy'], 'nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy bor');
    ok(!ad.h['x-powered-by'] && !/^(?:node|express)/i.test(ad.h['server'] || ''), 'server texnologiyasi sarlavhalarda oshkor etilmaydi', ad.h['server']);
    const nf = await ctx.raw('GET', '/api/nope-' + Date.now()); ok(!/\bat\s.+\(.+:\d+:\d+\)|node_modules|\/home\//.test(JSON.stringify(nf.j) + String(nf.t || '')), 'xato javoblarida stek yoki fayl yoʻli yoʻq', nf.s);
    const bj = await ctx.raw('POST', '/api/login', '{"email":', { 'Content-Type': 'application/json' }); ok(bj.s === 400 && !/SyntaxError|JSON\.parse|at\s/.test(JSON.stringify(bj.j) + String(bj.t || '')), 'buzilgan JSON: 400, ichki xato matni yoʻq', bj.j);
    for (const pth of ['/server.js', '/db.json', '/security.log', '/../server.js', '/%2e%2e/server.js', '/.git/config', '/public/../db.json', '/tests/run.js', '/package.json', '/.env']) { const q = await ctx.raw('GET', pth); ok(q.s !== 200 || !/require\(|ADMIN_TOKEN|"users"/.test(String(q.t || JSON.stringify(q.j || ''))), `fayl oshkor boʻlmaydi: ${pth}`, q.s); }
  });

  /* ---- «Urinishlar»: kim admin paneliga kirishga urindi (IP boʻyicha jamlangan jurnal) ---- */
  await suite('Urinishlar jurnali: kim admin paneliga urindi', { TRUST_PROXY: '1', ADM_COOLDOWN_MS: '300' }, async (ctx) => {
    const { raw: rq, client: cl } = ctx, H = ip => ({ 'True-Client-IP': ip }), XSS = '<img src=x onerror=window.__x=1>@evil.test';
    let q = await rq('GET', '/api/admin/attempts', null, H('203.0.113.1')); ok(q.s === 401, 'seanssiz /api/admin/attempts → 401', q.s);
    for (let i = 0; i < 3; i++) await rq('POST', '/api/admin/login/start', { email: 'hujumchi@evil.test' }, H('203.0.113.10'));
    await rq('POST', '/api/admin/login/start', { email: XSS }, H('203.0.113.10'));
    for (let i = 0; i < 2; i++) await rq('POST', '/api/admin/login/verify', { email: OWNER, code: '000000' }, H('203.0.113.11'));
    for (let i = 0; i < 3; i++) await rq('GET', '/api/admin/users?token=sched-tok', null, H('203.0.113.12'));
    await rq('GET', '/api/admin/audit', null, { ...H('203.0.113.12'), Authorization: 'Bearer sched-tok' });
    await rq('GET', '/admin', null, H('203.0.113.13'));
    for (let i = 0; i < 24; i++) await rq('GET', '/api/admin/stats', null, H('203.0.113.14'));
    const A = cl(); q = await adminLogin(ctx, A); ok(q.s === 200, 'admin kirdi', q.s);
    q = await A('GET', '/api/admin/attempts'); ok(q.s === 200 && Array.isArray(q.j.attempts), '/api/admin/attempts admin uchun ochiq', q.s);
    const by = ip => (q.j.attempts || []).find(a => a.ip === ip), a10 = by('203.0.113.10'), a11 = by('203.0.113.11'), a12 = by('203.0.113.12'), a13 = by('203.0.113.13'), a14 = by('203.0.113.14');
    ok(a10 && a10.c.ask === 4 && a10.em.some(x => x.e === 'hujumchi@evil.test' && x.n === 3 && x.known === false), 'ruxsatsiz email bilan kod soʻrash IP boʻyicha sanaladi va yozilgan email koʻrinadi', a10);
    ok(a10 && a10.em.some(x => x.e === XSS), 'HTML boʻlgan email matn sifatida saqlanadi (koʻrsatishda escape qilinadi)', a10 && a10.em);
    ok(a11 && a11.c.bad === 2 && a11.em.some(x => x.e === OWNER && x.known === true), 'ruxsat etilgan email uchun notoʻgʻri kod: known=true bilan yoziladi', a11);
    ok(a12 && a12.c.deny === 4 && a12.px.some(x => x.p === '/api/admin/users' && x.n === 3) && a12.px.some(x => x.p === '/api/admin/audit'), 'seanssiz admin API: qaysi yoʻllarga urilgani sanaladi', a12);
    ok(!JSON.stringify(q.j).includes('sched-tok') && !JSON.stringify(q.j).includes('token='), 'soʻrov parametrlari (token) jurnalga yozilmaydi');
    ok(a13 && a13.c.page === 1 && a13.c.ask + a13.c.bad + a13.c.deny === 0, '/admin sahifasini ochgan IP «faqat sahifa» sifatida yoziladi', a13);
    ok(a14 && a14.c.deny === 20 && a14.now === true, '20 ta seanssiz urinishdan keyin IP «hozir bloklangan» (urinish soni 20 da to‘xtaydi)', a14);
    const mine = by('127.0.0.1'); ok(!mine || (mine.c.ask + mine.c.bad + mine.c.deny === 0), 'adminning oʻz muvaffaqiyatli kirishi urinish sifatida yozilmaydi', mine);
    const lasts = q.j.attempts.map(a => a.last); ok(lasts.every((t, i) => !i || lasts[i - 1] >= t), 'roʻyxat oxirgi urinish boʻyicha tartiblangan');
    // mavjud boʻlmagan admin yoʻllarini skanerlash va notoʻgʻri usul — urinish; adminning oʻz seansi bilan xato yoʻl — urinish emas
    for (let i = 0; i < 2; i++) await rq('GET', '/api/admin/does-not-exist', null, H('203.0.113.15'));
    await rq('GET', '/api/admin/login/start', null, H('203.0.113.15')); await A('GET', '/api/admin/nope-with-session');
    q = await A('GET', '/api/admin/attempts'); const a15 = by('203.0.113.15') || (q.j.attempts || []).find(a => a.ip === '203.0.113.15');
    ok(a15 && a15.c.deny === 3 && a15.px.some(x => x.p === '/api/admin/does-not-exist' && x.n === 2), 'mavjud boʻlmagan admin yoʻllarini skanerlash urinish sifatida yoziladi', a15);
    ok(!(q.j.attempts || []).some(a => a.px.some(x => x.p === '/api/admin/nope-with-session')), 'admin oʻz seansi bilan xato yoʻlga borsa — urinish emas');
    // sigʻim chegarasi: 520 ta faqat-sahifa IP; jiddiy urinishlar saqlanib qoladi
    for (let i = 0; i < 520; i++) await rq('GET', '/admin', null, H(`198.18.${(i >> 8) + 1}.${(i & 255) + 1}`));
    q = await A('GET', '/api/admin/attempts'); ok(q.j.attempts.length <= q.j.max && q.j.max === 500, 'urinishlar roʻyxati 500 ta IP dan oshmaydi', q.j.attempts.length);
    ok(['203.0.113.10', '203.0.113.11', '203.0.113.12', '203.0.113.14'].every(ip => q.j.attempts.some(a => a.ip === ip)), 'toʻlib ketganda ham jiddiy urinishlar siqib chiqarilmaydi (avval faqat sahifa ochganlar)');
    // server qayta ishga tushganda saqlanadi; favqulodda rejim vaqtidagi urinish
    const tok = A.jar.ud_adm; await ctx.restart({ ADMIN_LOCKDOWN: '1' }); q = await rq('POST', '/api/admin/login/start', { email: OWNER }, H('203.0.113.20')); ok(q.s === 503, 'LOCKDOWN: kod soʻrash yopiq', q.s);
    await ctx.restart({ ADMIN_LOCKDOWN: '' }); const c2 = cl(); c2.jar.ud_adm = tok; q = await c2('GET', '/api/admin/attempts');
    ok(q.s === 200 && q.j.attempts.some(a => a.ip === '203.0.113.10' && a.c.ask === 4), 'server qayta ishga tushganda urinishlar saqlanib qoladi', q.s);
    ok(q.j.attempts.some(a => a.ip === '203.0.113.20' && a.c.lock === 1), 'favqulodda rejim vaqtidagi urinish «lock» sifatida yoziladi');
  });

  /* ---- Webhook imzolari: Telegram (secret token), Payme (Basic kalit), Click (MD5 imzo) ---- */
  await suite('Webhooklar: imzosiz/notoʻgʻri imzoli soʻrov rad etiladi', { TG_BOT_TOKEN: '123456:TEST-token-for-tests', TG_BOT_USERNAME: 'test_bot', USD_UZS_RATE: '12700', PAYME_MERCHANT_ID: 'merch', PAYME_KEY: 'payme-test-key', CLICK_SERVICE_ID: '1', CLICK_MERCHANT_ID: '2', CLICK_SECRET_KEY: 'click-test-secret' }, async (ctx) => {
    const upd = { update_id: 1, message: { message_id: 1, chat: { id: 5 }, from: { id: 5 }, text: '/start abc' } };
    let q = await ctx.raw('POST', '/api/tg/webhook', upd); ok(q.s === 401, 'Telegram webhook: sarlavhasiz → 401', q.s);
    q = await ctx.raw('POST', '/api/tg/webhook', upd, { 'x-telegram-bot-api-secret-token': 'x'.repeat(48) }); ok(q.s === 401, 'Telegram webhook: notoʻgʻri secret → 401', q.s);
    q = await ctx.raw('POST', '/api/tg/webhook', upd, { 'x-telegram-bot-api-secret-token': 'short' }); ok(q.s === 401, 'Telegram webhook: boshqa uzunlikdagi secret → 401 (xato tashlamaydi)', q.s);
    const rpc = { jsonrpc: '2.0', id: 1, method: 'CheckPerformTransaction', params: { amount: 100000, account: { order: '1' } } };
    q = await ctx.raw('POST', '/api/pay/payme', rpc); ok(q.j && !q.j.result && q.j.error && q.j.error.code === -32504, 'Payme: Authorization sarlavhasiz → -32504', q.t);
    q = await ctx.raw('POST', '/api/pay/payme', rpc, { Authorization: 'Basic ' + Buffer.from('Paycom:notoʻgʻri-kalit').toString('base64') }); ok(q.j && !q.j.result && q.j.error && q.j.error.code === -32504, 'Payme: notoʻgʻri kalit → -32504', q.t);
    q = await ctx.raw('POST', '/api/pay/payme', rpc, { Authorization: 'Basic ' + Buffer.from('Paycom:').toString('base64') }); ok(q.j && !q.j.result, 'Payme: boʻsh kalit rad etiladi', q.t);
    const form = { click_trans_id: '1', service_id: '1', merchant_trans_id: '1', amount: '1000', action: '0', error: '0', sign_time: '2026-01-01 00:00:00', sign_string: 'f'.repeat(32) };
    q = await ctx.raw('POST', '/api/pay/click', form); ok(q.j && q.j.error === -1, 'Click: notoʻgʻri MD5 imzo → error -1', q.t);
    q = await ctx.raw('POST', '/api/pay/click', { ...form, sign_string: '' }); ok(q.j && q.j.error === -1, 'Click: imzosiz → error -1', q.t);
    q = await ctx.raw('GET', '/api/pay/click'); ok(q.s === 405, 'Webhook faqat POST (GET → 405)', q.s);
  });

  /* ---- Sirlar kodga tushmaydi: ishchi daraxtdagi barcha matnli fayllar (tests ham) tanilgan kalit koʻrinishlariga tekshiriladi ---- */
  await suite('Sirlar: kodda kalit/token/parol yoʻq', {}, async () => {
    const SKIP = new Set(['node_modules', '.git']), files = [];
    (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.isFile() && fs.statSync(f).size < 3e6) files.push(f); } })(ROOT);
    const PAT = [['Resend kaliti', /\bre_[A-Za-z0-9]{20,}/], ['Brevo kaliti', /xkeysib-[A-Za-z0-9-]{20,}/], ['Xususiy kalit', /-----BEGIN [A-Z ]*PRIVATE KEY-----/], ['DB URL (parol bilan)', /postgres(?:ql)?:\/\/[^:@\/\s]+:[^@\s]{4,}@/], ['Google kaliti', /AIza[0-9A-Za-z_-]{30,}/], ['GitHub tokeni', /\bgh[pousr]_[A-Za-z0-9]{30,}/], ['Anthropic kaliti', /sk-ant-[A-Za-z0-9_-]{20,}/], ['AWS kaliti', /\bAKIA[0-9A-Z]{16}\b/], ['VAPID/umumiy maxfiy', /(?:VAPID_PRIVATE_KEY|ADMIN_TOKEN|JWT_SECRET)\s*[:=]\s*['"][^'"\s]{12,}['"]/]];
    const hits = []; for (const f of files) { let t; try { t = fs.readFileSync(f, 'utf8'); } catch (e) { continue; } if (t.includes('\u0000')) continue; for (const [n, re] of PAT) if (re.test(t)) hits.push(n + ' → ' + path.relative(ROOT, f)); }
    ok(files.length > 20 && hits.length === 0, `${files.length} ta fayl tekshirildi: maxfiy kalit koʻrinishlari topilmadi`, hits);
    const gi = fs.existsSync(path.join(ROOT, '.gitignore')) ? fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8') : ''; ok(/^\/data\/$/m.test(gi) && /^db\.json$/m.test(gi) && /^security\.log$/m.test(gi) && /^\.env$/m.test(gi), '.gitignore: data/, db.json, security.log va .env git ga tushmaydi', gi.split('\n').slice(0, 8));
    const rr = fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf8'); ok(!/ADMIN_ALLOW_TOKEN/.test(rr.replace(/#.*$/gm, '')), 'render.yaml da ADMIN_ALLOW_TOKEN (token bilan kirish) yoqilmagan');
    for (const k of ['ADMIN_TOKEN', 'ADMIN_EMAILS']) { const m = new RegExp('key: ' + k + '[\\s\\S]{0,80}?(sync: false|generateValue)').exec(rr); ok(!!m, `render.yaml: ${k} qiymati repoda emas (sync:false yoki generateValue)`); }
  });

  console.log(`security: ${pass} ta oʻtdi, ${failN} ta yiqildi`); process.exit(failN ? 1 : 0);
})();

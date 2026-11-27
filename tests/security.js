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

  await suite('IP bloklash va notanish IP haqida ogohlantirish', { TRUST_PROXY: '1', ADM_COOLDOWN_MS: '300' }, async (ctx) => {
    const { raw: rq, client: cl, mails, waitMail } = ctx, H = ip => ({ 'True-Client-IP': ip }), NEW = /notanish IP/;
    const newMails = () => mails.filter(m => m.to && m.to[0] === OWNER && NEW.test(m.subject));
    // 0) seanssiz — bloklash/blokdan chiqarish yopiq
    let q = await rq('POST', '/api/admin/ip/block', { ip: '203.0.113.50', minutes: 60 }, H('203.0.113.1')); ok(q.s === 401, 'seanssiz IP bloklash → 401', q.s);
    q = await rq('POST', '/api/admin/ip/unblock', { ip: '203.0.113.50' }, H('203.0.113.1')); ok(q.s === 401, 'seanssiz blokdan chiqarish → 401', q.s);
    q = await rq('POST', '/api/admin/ip/block', { ip: '203.0.113.50', minutes: 60 }, { ...H('203.0.113.1'), Authorization: 'Bearer sched-tok' }); ok(q.s === 401, 'ADMIN_TOKEN bilan IP bloklab boʻlmaydi', q.s);
    // 1) notanish IP ning BIRINCHI jiddiy urinishida administratorga email; takroriy urinishda emas
    ok(await waitMail(1) && newMails().length === 1 && newMails()[0].html.includes('203.0.113.1'), 'yuqoridagi birinchi seanssiz soʻrov (203.0.113.1) «notanish IP» ogohlantirishini yubordi', mails.map(m => m.subject));
    await rq('GET', '/admin', null, H('203.0.113.60')); await sleep(400);
    ok(newMails().length === 1, 'faqat /admin sahifasini ochish ogohlantirish yubormaydi', newMails().map(m => m.subject));
    await rq('POST', '/api/admin/login/start', { email: 'hujumchi@evil.test' }, H('203.0.113.60'));
    ok(await waitMail(2) && newMails().length === 2, 'birinchi jiddiy urinish → «notanish IP» ogohlantirishi yuborildi', mails.map(m => m.subject));
    const m60 = newMails().find(m => m.html.includes('203.0.113.60')); ok(m60 && !/<script/i.test(m60.html), 'ogohlantirishda IP koʻrsatilgan', m60 && m60.html);
    for (let i = 0; i < 2; i++) await rq('POST', '/api/admin/login/start', { email: 'hujumchi@evil.test' }, H('203.0.113.60'));
    await sleep(400); ok(newMails().length === 2, 'shu IP ning takroriy urinishlari yangi ogohlantirish yaratmaydi', newMails().length);
    // 2) boshqa IP lar: soatiga 3 ta ogohlantirish; limit boshqa muhim ogohlantirishlarning oʻrnini egallamaydi
    for (const x of [61, 62, 63, 64]) await rq('GET', '/api/admin/users', null, H('203.0.113.' + x));
    await sleep(600); ok(newMails().length === 3, 'notanish IP ogohlantirishlari soatiga 3 ta bilan cheklanadi (hujum boʻroni inboxni toʻldirmaydi)', newMails().length);
    for (let i = 0; i < 24; i++) await rq('GET', '/api/admin/stats', null, H('203.0.113.70')); // 20 ta seanssiz soʻrov → «admin-probe» ogohlantirishi (boshqa hisob)
    ok(await (async () => { for (let i = 0; i < 40 && !mails.some(m => /Admin API ga ruxsatsiz/.test(m.subject)); i++) await sleep(100); return mails.some(m => /Admin API ga ruxsatsiz/.test(m.subject)); })(), 'notanish-IP limiti tugagan boʻlsa ham muhim «ruxsatsiz urinishlar» ogohlantirishi keladi', mails.map(m => m.subject));
    // 3) admin kirdi; oʻz IP si bloklanmaydi
    const A = cl(); q = await adminLogin(ctx, A); ok(q.s === 200, 'admin kirdi', q.s);
    q = await A('GET', '/api/admin/attempts'); const me = q.j.attempts.find(a => a.me); const myIp = me ? me.ip : null;
    q = await A('POST', '/api/admin/ip/block', { ip: '127.0.0.1', minutes: 60 }); const q2 = await A('POST', '/api/admin/ip/block', { ip: '::ffff:127.0.0.1', minutes: 60 });
    ok(q.s === 409 && q2.s === 409, 'adminning oʻz IP si bloklanmaydi — IPv4 va IPv4-mapped yozuvi ham (409)', [q.s, q2.s]);
    q = await A('GET', '/api/admin/attempts'); ok(!q.j.blocks.length, 'oʻz IP ni bloklashga urinish blok yaratmadi', q.j.blocks);
    // 4) notoʻgʻri kirishlar → 400
    for (const bad of ['abc', '1.2.3.4/24', '<script>alert(1)</script>', '', '__proto__', '999.1.1.1', '1.2.3.4 ', 'constructor', 5, null, ['1.2.3.4'], { a: 1 }]) {
      q = await A('POST', '/api/admin/ip/block', { ip: bad, minutes: 60 }); ok(q.s === 400, `notoʻgʻri IP rad etiladi: ${JSON.stringify(bad)}`, q.s);
    }
    for (const bm of [-1, 0.01, 525601, 'abc', '60', NaN, null, undefined, Infinity, [], {}]) {
      q = await A('POST', '/api/admin/ip/block', { ip: '203.0.113.80', minutes: bm }); ok(q.s === 400, `notoʻgʻri muddat rad etiladi: ${String(bm)}`, q.s);
    }
    q = await A('POST', '/api/admin/ip/block', '{bad json'); ok(q.s === 400 || q.s === 422, 'buzilgan JSON → 4xx', q.s);
    q = await A('GET', '/api/admin/attempts'); ok(!q.j.blocks.length && !Object.keys(q.j).includes('__proto__'), 'notoʻgʻri soʻrovlar blok yaratmadi', q.j.blocks);
    // 5) bloklash: /admin va /api/admin/* ga 403 (hatto oʻgʻirlangan cookie bilan ham), sayt qolgan qismiga taʼsir qilmaydi
    const T = '203.0.113.90', TH = H(T), stolen = cl(); stolen.jar.ud_adm = A.jar.ud_adm;
    q = await rq('GET', '/api/admin/stats', null, TH); ok(q.s === 401, 'bloklashdan oldin: seanssiz → 401', q.s);
    q = await A('POST', '/api/admin/ip/block', { ip: T, minutes: 60 }); ok(q.s === 200 && q.j.ok && q.j.until > Date.now(), 'IP bloklandi', q.j);
    const Tm = '::ffff:' + T; q = await rq('GET', '/api/plans', null, H(Tm)); ok(q.s === 200, 'IPv4-mapped yozuv ham saytning ochiq qismiga kira oladi', q.s);
    q = await rq('GET', '/admin', null, TH); ok(q.s === 403 && !/<html/i.test(q.t), '/admin sahifasi bloklangan IP ga 403', q.s);
    q = await rq('POST', '/api/admin/login/start', { email: OWNER }, TH); ok(q.s === 403, 'bloklangan IP kod soʻray olmaydi (403)', q.s);
    q = await rq('GET', '/api/admin/stats', null, { ...TH, Cookie: 'ud_adm=' + A.jar.ud_adm }); ok(q.s === 403, 'bloklangan IP hatto haqiqiy admin cookie si bilan ham kira olmaydi (403)', q.s);
    q = await rq('GET', '/api/admin/stats', null, { ...TH, Authorization: 'Bearer sched-tok' }); ok(q.s === 403, 'bloklangan IP token bilan ham kira olmaydi (403)', q.s);
    q = await rq('GET', '/api/admin/nope', null, TH); ok(q.s === 403, 'bloklangan IP mavjud boʻlmagan admin yoʻlida ham 403', q.s);
    for (const u of ['/healthz', '/api/plans', '/']) { q = await rq('GET', u, null, TH); ok(q.s === 200, `bloklangan IP saytning qolgan qismini ishlata oladi: ${u}`, q.s); }
    q = await rq('GET', '/admin', null, H('203.0.113.91')); ok(q.s === 200, 'boshqa IP lar /admin ni ocha oladi', q.s);
    q = await A('GET', '/api/admin/stats'); ok(q.s === 200, 'admin oʻz seansi bilan ishlashda davom etadi', q.s);
    // 6) roʻyxat: blocked belgisi, blk hisobi, «Bloklangan IP lar»
    q = await A('GET', '/api/admin/attempts'); const t = q.j.attempts.find(a => a.ip === T);
    ok(t && t.blocked && t.blocked.until > Date.now() && t.c.blk >= 5, 'urinishlar roʻyxatida IP «bloklangan» va blk urinishlari sanalgan', t);
    ok(q.j.blocks.length === 1 && q.j.blocks[0].ip === T && q.j.blocks[0].by === OWNER, 'bloklanganlar roʻyxatida IP va kim bloklagani', q.j.blocks);
    q = await A('GET', '/api/admin/security'); ok(q.j.events.some(e => e.ev === 'admin.ip.blocked' && e.target === T), 'xavfsizlik jurnaliga «admin.ip.blocked» yozildi', q.j.events.map(e => e.ev));
    // 7) doimiy blok, qayta bloklash (muddatni yangilaydi), server qayta ishga tushganda saqlanadi
    q = await A('POST', '/api/admin/ip/block', { ip: T, minutes: 0 }); ok(q.s === 200 && q.j.until === 0, 'doimiy blok (minutes: 0)', q.j);
    const tok = A.jar.ud_adm; await ctx.restart({}); const A2 = cl(); A2.jar.ud_adm = tok;
    q = await rq('GET', '/admin', null, TH); ok(q.s === 403, 'blok server qayta ishga tushganda saqlanib qoladi', q.s);
    q = await A2('GET', '/api/admin/attempts'); ok(q.s === 200 && q.j.blocks.some(b => b.ip === T && b.until === 0), 'doimiy blok roʻyxatda (muddat: doimiy)', q.j.blocks);
    // 8) blokdan chiqarish
    q = await A2('POST', '/api/admin/ip/unblock', { ip: T }); ok(q.s === 200 && q.j.removed === true, 'blokdan chiqarildi', q.j);
    q = await rq('GET', '/admin', null, TH); ok(q.s === 200, 'blokdan chiqarilgach /admin yana ochiladi', q.s);
    q = await rq('GET', '/api/admin/stats', null, TH); ok(q.s === 401, 'blokdan chiqarilgach API yana 401 beradi (403 emas)', q.s);
    q = await A2('POST', '/api/admin/ip/unblock', { ip: T }); ok(q.s === 200 && q.j.removed === false, 'blokda boʻlmagan IP ni chiqarish zararsiz', q.j);
    q = await A2('POST', '/api/admin/ip/unblock', { ip: '__proto__' }); ok(q.s === 200 && q.j.removed === false, 'unblock: __proto__ hech narsani oʻchirmaydi', q.j);
    q = await A2('GET', '/api/admin/security'); ok(q.j.events.some(e => e.ev === 'admin.ip.unblocked'), 'xavfsizlik jurnaliga «admin.ip.unblocked» yozildi');
    ok(q.j.chain && q.j.chain.ok === true, 'jurnal zanjiri butun', q.j.chain);
    // 9) muddat tugashi (≈3 soniya)
    q = await A2('POST', '/api/admin/ip/block', { ip: '203.0.113.92', minutes: 0.05 }); ok(q.s === 200, 'qisqa muddatli blok (3 soniya)', q.s);
    q = await rq('GET', '/admin', null, H('203.0.113.92')); ok(q.s === 403, 'qisqa blok vaqtida 403', q.s);
    await sleep(3400); q = await rq('GET', '/admin', null, H('203.0.113.92')); ok(q.s === 200, 'muddat tugagach blok oʻzi olinadi', q.s);
    q = await A2('GET', '/api/admin/attempts'); ok(!q.j.blocks.some(b => b.ip === '203.0.113.92'), 'muddati tugagan blok roʻyxatda yoʻq', q.j.blocks);
    // 10) chegara (ADMIN_BLOCK_MAX): toʻlgach yangi blok rad etiladi, mavjudini yangilash mumkin
    await ctx.restart({ ADMIN_BLOCK_MAX: '3' }); const A3 = cl(); A3.jar.ud_adm = tok;
    for (const x of [1, 2, 3]) { q = await A3('POST', '/api/admin/ip/block', { ip: '198.51.100.' + x, minutes: 60 }); ok(q.s === 200, 'blok #' + x, q.s); }
    q = await A3('POST', '/api/admin/ip/block', { ip: '198.51.100.9', minutes: 60 }); ok(q.s === 409, 'chegaradan keyin yangi blok rad etiladi (409)', q.s);
    q = await A3('POST', '/api/admin/ip/block', { ip: '198.51.100.1', minutes: 120 }); ok(q.s === 200, 'mavjud blokni yangilash mumkin', q.s);
    q = await A3('GET', '/api/admin/attempts'); ok(q.j.blocks.length === 3, 'bloklanganlar soni chegaradan oshmaydi', q.j.blocks.length);
  });

  await suite('Notanish IP ogohlantirishi: tanish IP va oʻchirgich', { TRUST_PROXY: '1', ADM_COOLDOWN_MS: '300' }, async (ctx) => {
    const { raw: rq, client: cl, mails } = ctx, H = ip => ({ 'True-Client-IP': ip }), NEW = /notanish IP/, newMails = () => mails.filter(m => m.to && m.to[0] === OWNER && NEW.test(m.subject));
    const A = cl(); let q = await adminLogin(ctx, A); ok(q.s === 200, 'admin kirdi (bu IP endi «tanish»)', q.s);
    q = await A('POST', '/api/admin/logout'); ok(q.s === 200, 'chiqdi (faol seans yoʻq)', q.s);
    await rq('POST', '/api/admin/login/start', { email: 'xato@evil.test' }); await rq('GET', '/api/admin/users'); await sleep(700);
    ok(newMails().length === 0, 'oldin muvaffaqiyatli kirilgan IP dan (email xatosi) notanish-IP ogohlantirishi kelmaydi', newMails().map(m => m.subject));
    await rq('POST', '/api/admin/login/start', { email: 'xato@evil.test' }, H('203.0.113.5')); for (let i = 0; i < 40 && !newMails().length; i++) await sleep(100);
    ok(newMails().length === 1 && newMails()[0].html.includes('203.0.113.5'), 'begona IP dan birinchi urinish — ogohlantirish keladi', newMails().length);
    await ctx.restart({ ADMIN_ATT_ALERT: '0' }); const n0 = newMails().length;
    await rq('POST', '/api/admin/login/start', { email: 'xato@evil.test' }, H('203.0.113.6')); await sleep(900);
    ok(newMails().length === n0, 'ADMIN_ATT_ALERT=0: ogohlantirish yuborilmaydi', newMails().length);
    const B = cl(); q = await adminLogin(ctx, B); q = await B('GET', '/api/admin/attempts'); ok(q.s === 200 && q.j.attempts.some(a => a.ip === '203.0.113.6' && a.c.ask === 1), 'ogohlantirish oʻchiq boʻlsa ham urinish jurnalga yoziladi', q.s);
  });

  /* ---- Webhook imzolari: Telegram (secret token), Payme (Basic kalit), Click (MD5 imzo) ---- */
  await suite('Sayt miqyosida bloklash: email, domen va IP', { TRUST_PROXY: '1', ADM_COOLDOWN_MS: '300', ADM_REAUTH_MS: '1500', ADMIN_ATT_ALERT: '0', REG_RATE_MAX: '200', MAIL_BULK_MAX: '50', USER_BLOCK_MAX: '6' }, async (ctx) => {
    const { raw: rq, client: cl, mails, waitMail } = ctx, H = ip => ({ 'True-Client-IP': ip }), PW = 'parol12345';
    const reg = async (email, ip) => { const c = cl(); const q = await c('POST', '/api/register', { email, password: PW, name: 'Sinov' }, H(ip)); c.s = q.s; return c; };
    const login = (email, ip, pw = PW) => cl()('POST', '/api/login', { email, password: pw }, H(ip));
    // 0) seanssiz — hech narsa ochiq emas
    let q = await rq('POST', '/api/admin/user/block', { email: 'a@b.test', minutes: 0 }, H('198.51.100.1')); ok(q.s === 401, 'seanssiz email bloklash → 401', q.s);
    q = await rq('POST', '/api/admin/user/unblock', { email: 'a@b.test' }, H('198.51.100.1')); ok(q.s === 401, 'seanssiz blokdan chiqarish → 401', q.s);
    q = await rq('GET', '/api/admin/blocks', null, H('198.51.100.1')); ok(q.s === 401, 'seanssiz bloklar roʻyxati → 401', q.s);
    q = await rq('POST', '/api/admin/user/block', { email: 'a@b.test', minutes: 0 }, { ...H('198.51.100.1'), Authorization: 'Bearer sched-tok' }); ok(q.s === 401, 'ADMIN_TOKEN bilan foydalanuvchi bloklab boʻlmaydi', q.s);
    // 1) hisoblar
    const U1 = await reg('victim@example.test', '198.51.100.10'), U2 = await reg('other@example.test', '198.51.100.20'), G1 = await reg('jo.hn@gmail.com', '198.51.100.30'), D1 = await reg('old@spam-domain.test', '198.51.100.31');
    ok([U1, U2, G1, D1].every(c => c.s === 201), 'sinov hisoblari ochildi', [U1, U2, G1, D1].map(c => c.s));
    q = await U1('PUT', '/api/data', { data: { 'qabul:eslatma': 'saqlanadi' } }); ok(q.s === 200, 'U1 maʼlumot saqladi', q.s);
    q = await U2('GET', '/api/me', null, H('198.51.100.20')); ok(q.j.user && q.j.user.email === 'other@example.test' && !JSON.stringify(q.j).includes('198.51.100'), '/api/me IP manzilni foydalanuvchiga koʻrsatmaydi', q.j && Object.keys(q.j));
    const A = cl(); q = await adminLogin(ctx, A); ok(q.s === 200, 'admin kirdi', q.s);
    q = await A('GET', '/api/admin/users'); const row = e => q.j.users.find(x => x.email === e);
    ok(row('victim@example.test').ip === '198.51.100.10' && row('victim@example.test').ip0 === '198.51.100.10' && row('victim@example.test').blocked === null, 'admin roʻyxatida foydalanuvchining IP si va blok holati bor', row('victim@example.test'));
    // 2) tekshiruvlar
    for (const bad of ['abc', '', '@', '@x', 'a@b', 'a b@c.test', 'a@b.test,c@d.test', '<x>@a.test', 5, null, ['a@b.test'], {}, '@-bad.test', '__proto__']) { q = await A('POST', '/api/admin/user/block', { email: bad, minutes: 60 }); ok(q.s === 400, `notoʻgʻri email/domen rad etiladi: ${JSON.stringify(bad)}`, q.s); }
    for (const bm of [-1, 0.01, 525601, 'abc', '60', NaN, null, undefined, Infinity, [], {}]) { q = await A('POST', '/api/admin/user/block', { email: 'x@spam-domain.test', minutes: bm }); ok(q.s === 400, `notoʻgʻri muddat rad etiladi: ${String(bm)}`, q.s); }
    q = await A('POST', '/api/admin/user/block', { email: OWNER, minutes: 0 }); ok(q.s === 409, 'administrator emailini bloklab boʻlmaydi', q.s);
    q = await A('POST', '/api/admin/user/block', { email: OWNER.toUpperCase(), minutes: 0 }); ok(q.s === 409, 'administrator emailini katta harflar bilan ham bloklab boʻlmaydi', q.s);
    q = await A('POST', '/api/admin/user/block', { email: '@example.test', minutes: 0 }); ok(q.s === 409, 'administrator domenini bloklab boʻlmaydi', q.s);
    q = await A('POST', '/api/admin/ip/block', { ip: '127.0.0.1', minutes: 60, scope: 'site' }); ok(q.s === 409, 'oʻz IP ni sayt miqyosida ham bloklab boʻlmaydi', q.s);
    q = await A('POST', '/api/admin/ip/block', { ip: '198.51.100.99', minutes: 60, scope: 'hamma' }); ok(q.s === 400, 'notoʻgʻri qamrov (scope) rad etiladi', q.s);
    q = await A('GET', '/api/admin/blocks'); ok(q.s === 200 && !q.j.ips.length && !q.j.emails.length, 'notoʻgʻri soʻrovlar blok yaratmadi', q.j);
    // 3) U1 ni bloklash (email + IP)
    q = await A('POST', '/api/admin/user/block', { email: 'Victim@Example.test', minutes: 0, reason: 'Spam <b>yubordi</b>', withIp: true }); ok(q.s === 200 && q.j.ok && q.j.users === 1 && q.j.dropped >= 1 && q.j.ips[0] === '198.51.100.10', 'U1 bloklandi (email + IP); sessiyalari bekor qilindi', q.j);
    q = await U1('GET', '/api/me', null, H('198.51.100.77')); ok(q.s === 200 && q.j.user === null && !('data' in q.j), 'bloklangan foydalanuvchining seansi bekor: /api/me da hisob maʼlumotlari yoʻq', q.j);
    ok(q.j.blocked === true && q.j.block && q.j.block.until === 0 && !JSON.stringify(q.j).includes('yubordi'), '/api/me: «bloklangan» belgisi va muddat (0 = muddatsiz) bor, ichki sabab koʻrsatilmaydi', q.j);
    q = await U1('GET', '/api/credits', null, H('198.51.100.77')); ok(q.s === 401, 'bloklangan foydalanuvchi eski seansi bilan API dan foydalana olmaydi', q.s);
    q = await login('victim@example.test', '198.51.100.77'); ok(q.s === 403 && q.j.code === 'BLOCKED' && q.j.until === 0, 'toʻgʻri parol bilan kirish → 403 BLOCKED (+ muddat)', q);
    q = await login('victim@example.test', '198.51.100.77', 'notogri-parol'); ok(q.s === 401, 'notoʻgʻri parol → 401 (email bloklanganligi sizib chiqmaydi)', q.s);
    q = await cl()('POST', '/api/register', { email: 'victim@example.test', password: PW, name: 'Qayta' }, H('198.51.100.78')); ok(q.s === 403 && q.j.code === 'BLOCKED', 'bloklangan email bilan qayta roʻyxatdan oʻtib boʻlmaydi (code: BLOCKED)', q.j);
    q = await cl()('POST', '/api/register', { email: 'VICTIM@example.test', password: PW, name: 'Qayta' }, H('198.51.100.78')); ok(q.s === 403, 'katta harflar bilan ham', q.s);
    mails.length = 0; q = await rq('POST', '/api/password/forgot', { email: 'victim@example.test' }, H('198.51.100.78')); await sleep(300); ok(q.s === 200 && !mails.some(m => m.to[0] === 'victim@example.test'), 'parolni tiklash: bloklangan hisobga xat ketmaydi (javob oddiy 200)', mails.map(m => m.to));
    q = await rq('POST', '/api/password/forgot', { email: 'other@example.test' }, H('198.51.100.78')); await sleep(300); ok(q.s === 200 && mails.some(m => m.to[0] === 'other@example.test'), 'nazorat: bloklanmagan hisobga xat ketadi', mails.map(m => m.to));
    // 4) IP sayt miqyosida yopiq; boshqa IP lar ishlaydi
    q = await rq('GET', '/api/plans', null, H('198.51.100.10')); ok(q.s === 403 && /cheklangan/.test(q.j.error), 'bloklangan IP: API → 403 (JSON)', q);
    q = await rq('GET', '/', null, H('198.51.100.10')); ok(q.s === 403 && /Kirish cheklangan/.test(q.t) && /Siz bloklandingiz/.test(q.t) && !/<script/i.test(q.t), 'bloklangan IP: sahifa → 403 («Siz bloklandingiz», JavaScriptsiz)', q.s);
    q = await rq('GET', '/', null, { ...H('198.51.100.10'), 'Accept-Language': 'ru-RU,ru;q=0.9' }); ok(q.s === 403 && /Вы заблокированы/.test(q.t) && /@keyframes bkIn/.test(q.t), 'bloklangan IP sahifasi: rus tili + animatsiya CSS i sahifada', q.s);
    q = await rq('GET', '/', null, { ...H('198.51.100.10'), 'Accept-Language': 'en-US,en;q=0.9' }); ok(q.s === 403 && /You have been blocked/.test(q.t), 'bloklangan IP sahifasi: ingliz tili', q.s);
    q = await rq('GET', '/blocked.css', null, H('198.51.100.11')); ok(q.s === 200 && /text\/css/.test(q.h['content-type'] || '') && /\.bk-ov/.test(q.t), 'blocked.css boshqa IP larga beriladi', q.s);
    q = await rq('GET', '/app', null, H('::ffff:198.51.100.10')); ok(q.s === 403, 'IPv4-mapped yozuv bilan ham 403', q.s);
    q = await rq('POST', '/api/register', { email: 'yangi@example.test', password: PW, name: 'Yangi' }, H('198.51.100.10')); ok(q.s === 403, 'bloklangan IP dan roʻyxatdan oʻtib boʻlmaydi', q.s);
    q = await rq('GET', '/admin', null, H('198.51.100.10')); ok(q.s === 403, 'bloklangan IP /admin ni ham ocha olmaydi', q.s);
    q = await rq('GET', '/healthz', null, H('198.51.100.10')); ok(q.s === 200, '/healthz bloklangan IP ga ham ochiq (monitoring buzilmaydi)', q.s);
    q = await rq('GET', '/api/plans', null, H('198.51.100.11')); ok(q.s === 200, 'boshqa IP lar ishlaydi', q.s);
    q = await U2('GET', '/api/me', null, H('198.51.100.20')); ok(q.s === 200 && q.j.user && q.j.user.email === 'other@example.test', 'bloklanmagan foydalanuvchi ishlashda davom etadi', q.s);
    // 5) roʻyxatlar
    q = await A('GET', '/api/admin/users'); ok(row('victim@example.test').blocked && row('victim@example.test').ipBlocked === true && row('other@example.test').blocked === null && row('other@example.test').ipBlocked === false, 'foydalanuvchilar jadvalida blok holati (email va IP)', [row('victim@example.test').blocked, row('victim@example.test').ipBlocked]);
    q = await A('GET', '/api/admin/blocks'); const eb = q.j.emails[0], ib = q.j.ips[0];
    ok(q.j.emails.length === 1 && eb.key === 'victim@example.test' && eb.kind === 'email' && eb.users === 1 && eb.until === 0 && eb.by === OWNER && eb.reason.includes('yubordi'), 'bloklar roʻyxatida email, muddat, kim bloklagani, hisoblar soni', q.j.emails);
    ok(q.j.ips.length === 1 && ib.ip === '198.51.100.10' && ib.scope === 'site' && ib.hits >= 4, 'bloklar roʻyxatida IP (scope=site) va urinishlar soni', q.j.ips);
    q = await A('GET', '/api/admin/security'); ok(q.j.events.some(e => e.ev === 'admin.user.blocked') && q.j.events.some(e => e.ev === 'auth.blocked'), 'xavfsizlik jurnaliga yozildi (admin.user.blocked, auth.blocked)', q.j.events.map(e => e.ev));
    ok(!JSON.stringify(q.j.events).includes('victim@example.test'), 'jurnalda email ochiq yozilmagan (faqat xesh)', 1);
    // 6) ommaviy xat va push bloklangan foydalanuvchiga ketmaydi
    await sleep(1700); mails.length = 0;
    q = await A('POST', '/api/admin/reauth/start', {}); ok(q.s === 200, 'qayta tasdiqlash kodi soʻraldi', q.s); await waitMail(1);
    q = await A('POST', '/api/admin/reauth/verify', { code: codeOf(mails, /amalni tasdiqlash kodi/) }); ok(q.s === 200, 'qayta tasdiqlandi', q.s);
    mails.length = 0; q = await A('POST', '/api/admin/notify', { title: 'Yangilik', body: 'Salom hammaga, yangi imkoniyatlar qoʻshildi.', audience: 'all', channels: { app: true, mail: true } }); await sleep(600);
    ok(q.s === 200 && mails.some(m => m.to[0] === 'other@example.test') && !mails.some(m => m.to[0] === 'victim@example.test'), 'ommaviy xat: bloklangan foydalanuvchiga ketmadi, boshqalarga ketdi', mails.map(m => m.to));
    // 7) saqlanish: server qayta ishga tushganda blok turadi
    const tok = A.jar.ud_adm; await ctx.restart({}); const A2 = cl(); A2.jar.ud_adm = tok;
    q = await login('victim@example.test', '198.51.100.79'); ok(q.s === 403, 'qayta ishga tushgandan keyin ham blok turadi (email)', q.s);
    q = await rq('GET', '/api/plans', null, H('198.51.100.10')); ok(q.s === 403, 'qayta ishga tushgandan keyin ham blok turadi (IP)', q.s);
    // 8) blokdan chiqarish: email + IP; maʼlumot saqlanib qolgan
    q = await A2('POST', '/api/admin/user/unblock', { email: 'victim@example.test', withIp: true }); ok(q.s === 200 && q.j.removed === true && q.j.ipRemoved === 1, 'blokdan chiqarildi (email + IP)', q.j);
    const back = cl(); q = await back('POST', '/api/login', { email: 'victim@example.test', password: PW }, H('198.51.100.10')); ok(q.s === 200, 'blokdan chiqqach kira oladi', q.s);
    q = await back('GET', '/api/me', null, H('198.51.100.10')); ok(q.s === 200 && JSON.stringify(q.j.data).includes('saqlanadi'), 'hisob maʼlumotlari oʻchmagan', q.j);
    q = await A2('POST', '/api/admin/user/unblock', { email: 'victim@example.test' }); ok(q.s === 200 && q.j.removed === false, 'takroriy blokdan chiqarish zararsiz', q.j);
    // 9) Gmail: nuqta va +belgi bir xil pochta qutisi
    q = await A2('POST', '/api/admin/user/block', { email: 'john+reklama@googlemail.com', minutes: 0 }); ok(q.s === 200 && q.j.key === 'john@gmail.com' && q.j.users === 1, 'Gmail: john+..@googlemail.com → jo.hn@gmail.com hisobi bloklandi', q.j);
    q = await login('jo.hn@gmail.com', '198.51.100.80'); ok(q.s === 403, 'Gmail: nuqtali yozuv bloklangan', q.s);
    q = await cl()('POST', '/api/register', { email: 'j.o.h.n+2@gmail.com', password: PW, name: 'Alias' }, H('198.51.100.80')); ok(q.s === 403, 'Gmail: boshqa yozuv bilan roʻyxatdan oʻtib boʻlmaydi', q.s);
    q = await A2('POST', '/api/admin/user/unblock', { email: 'john@gmail.com' }); ok(q.j.removed === true, 'Gmail bloki olindi', q.j);
    // 10) domen bloki: mavjud hisoblar ham yopiladi
    q = await A2('POST', '/api/admin/user/block', { email: '@Spam-Domain.test', minutes: 0, withIp: true }); ok(q.s === 200 && q.j.key === '@spam-domain.test' && q.j.users === 1 && q.j.ips.length === 0, 'domen bloklandi (IP ga tegilmaydi)', q.j);
    q = await login('old@spam-domain.test', '198.51.100.81'); ok(q.s === 403, 'domendagi mavjud hisob kira olmaydi', q.s);
    q = await cl()('POST', '/api/register', { email: 'yangi@spam-domain.test', password: PW, name: 'Yangi' }, H('198.51.100.81')); ok(q.s === 403, 'domendagi yangi hisob ochib boʻlmaydi', q.s);
    q = await A2('GET', '/api/admin/blocks'); ok(q.j.emails.length === 1 && q.j.emails[0].kind === 'domain' && q.j.emails[0].users === 1, 'roʻyxatda domen bloki (1 hisob)', q.j.emails);
    q = await A2('POST', '/api/admin/user/unblock', { email: '@spam-domain.test' }); ok(q.j.removed === true, 'domen bloki olindi', q.j);
    q = await login('old@spam-domain.test', '198.51.100.81'); ok(q.s === 200, 'domen ochilgach hisob qaytadi', q.s);
    // 11) vaqtinchalik blok: muddat foydalanuvchiga beriladi; bloklash tufayli bekor boʻlgan seans blokdan chiqarilgach jonlanmaydi
    const T1 = await reg('temp@example.test', '198.51.100.40'); q = await T1('GET', '/api/me', null, H('198.51.100.40')); ok(q.j.user && q.j.user.email === 'temp@example.test' && !q.j.blocked, 'nazorat: bloklanmagan foydalanuvchida «blocked» belgisi yoʻq', q.j);
    q = await A2('POST', '/api/admin/user/block', { email: 'temp@example.test', minutes: 90, reason: 'ichki izoh' }); ok(q.s === 200 && q.j.users === 1, 'vaqtinchalik blok (90 daqiqa)', q.j);
    q = await T1('GET', '/api/me', null, H('198.51.100.40')); ok(q.j.user === null && q.j.blocked === true && Math.abs(q.j.block.until - (Date.now() + 90 * 60000)) < 90000 && !JSON.stringify(q.j).includes('ichki izoh'), '/api/me: tugash vaqti beriladi, sabab koʻrsatilmaydi', q.j);
    q = await T1('GET', '/api/credits', null, H('198.51.100.40')); ok(q.s === 401, 'bloklangan seans API dan foydalana olmaydi (401)', q.s);
    q = await login('temp@example.test', '198.51.100.41'); ok(q.s === 403 && q.j.code === 'BLOCKED' && Math.abs(q.j.until - (Date.now() + 90 * 60000)) < 90000, 'kirishda ham tugash vaqti beriladi', q.j);
    q = await cl()('POST', '/api/register', { email: 'temp@example.test', password: PW, name: 'Qayta' }, H('198.51.100.41')); ok(q.s === 403 && q.j.code === 'BLOCKED' && q.j.until > Date.now(), 'roʻyxatdan oʻtishda ham tugash vaqti beriladi', q.j);
    q = await A2('POST', '/api/admin/user/unblock', { email: 'temp@example.test' }); ok(q.s === 200 && q.j.removed === true, 'vaqtinchalik blok olindi', q.j);
    q = await T1('GET', '/api/me', null, H('198.51.100.40')); ok(q.j.user === null && !('blocked' in q.j), 'blokdan chiqarilgach eski (bekor qilingan) seans jonlanmaydi', q.j);
    q = await login('temp@example.test', '198.51.100.41'); ok(q.s === 200, 'blokdan chiqqach yangi kirish ishlaydi', q.s);
    // 11) vaqtinchalik blok oʻzi tugaydi
    q = await A2('POST', '/api/admin/user/block', { email: 'vaqtincha@example.test', minutes: 0.05 }); ok(q.s === 200 && q.j.until > Date.now(), 'vaqtinchalik blok (3 soniya)', q.j);
    q = await cl()('POST', '/api/register', { email: 'vaqtincha@example.test', password: PW, name: 'Vaqtincha' }, H('198.51.100.82')); ok(q.s === 403, 'muddat ichida roʻyxatdan oʻtib boʻlmaydi', q.s);
    await sleep(3400);
    q = await cl()('POST', '/api/register', { email: 'vaqtincha@example.test', password: PW, name: 'Vaqtincha' }, H('198.51.100.82')); ok(q.s === 201, 'muddat tugagach blok oʻzi oʻchadi', q.s);
    q = await A2('GET', '/api/admin/blocks'); ok(!q.j.emails.length, 'tugagan blok roʻyxatdan tushdi', q.j.emails);
    // 12) IP bloklash: scope=admin faqat adminni yopadi, scope=site butun saytni
    q = await A2('POST', '/api/admin/ip/block', { ip: '198.51.100.41', minutes: 60, scope: 'admin' }); ok(q.s === 200 && q.j.scope === 'admin', 'IP admin qamrovida bloklandi', q.j);
    q = await A2('POST', '/api/admin/ip/block', { ip: '198.51.100.42', minutes: 60, scope: 'site', reason: 'Bot' }); ok(q.s === 200 && q.j.scope === 'site', 'IP sayt qamrovida bloklandi', q.j);
    q = await A2('POST', '/api/admin/ip/block', { ip: '198.51.100.43', minutes: 60 }); ok(q.s === 200 && q.j.scope === 'admin', 'scope berilmasa — admin (oldingi xatti-harakat)', q.j);
    q = await rq('GET', '/api/plans', null, H('198.51.100.41')); ok(q.s === 200, 'admin-qamrovli blok saytni yopmaydi', q.s);
    q = await rq('GET', '/admin', null, H('198.51.100.41')); ok(q.s === 403, '…lekin /admin ni yopadi', q.s);
    q = await rq('GET', '/api/plans', null, H('198.51.100.42')); ok(q.s === 403, 'sayt-qamrovli blok butun saytni yopadi', q.s);
    q = await A2('GET', '/api/admin/blocks'); ok(q.j.ips.find(x => x.ip === '198.51.100.42').scope === 'site' && q.j.ips.find(x => x.ip === '198.51.100.42').reason === 'Bot' && q.j.ips.find(x => x.ip === '198.51.100.41').scope === 'admin', 'roʻyxatda scope va sabab', q.j.ips);
    q = await A2('GET', '/api/admin/attempts'); ok(q.j.blocks.every(b => b.scope === 'admin' || b.scope === 'site'), 'urinishlar sahifasidagi bloklarda ham scope bor', q.j.blocks);
    q = await A2('POST', '/api/admin/ip/block', { ip: '198.51.100.41', minutes: 60, scope: 'site' }); ok(q.s === 200, 'mavjud IP bloki qamrovi oʻzgartirildi', q.s);
    q = await rq('GET', '/api/plans', null, H('198.51.100.41')); ok(q.s === 403, 'qamrov kengaytirilgach sayt yopildi', q.s);
    for (const x of [41, 42, 43]) await A2('POST', '/api/admin/ip/unblock', { ip: '198.51.100.' + x });
    q = await rq('GET', '/api/plans', null, H('198.51.100.42')); ok(q.s === 200, 'blokdan chiqarilgach sayt ochiq', q.s);
    // 13) chegara
    await ctx.restart({ USER_BLOCK_MAX: '2' });
    for (const e of ['c1@x-a.test', 'c2@x-a.test']) { q = await A2('POST', '/api/admin/user/block', { email: e, minutes: 60 }); ok(q.s === 200, `chegara ichida: ${e}`, q.s); }
    q = await A2('POST', '/api/admin/user/block', { email: 'c3@x-a.test', minutes: 60 }); ok(q.s === 409, 'chegaradan oshganda 409', q.s);
    q = await A2('POST', '/api/admin/user/block', { email: 'c1@x-a.test', minutes: 120 }); ok(q.s === 200, 'mavjud blokni yangilash chegaraga tushmaydi', q.s);
  });

  /* ---- Faollik: kirdi/chiqdi (tashriflar), online, holatlar, hodisalar jurnali ---- */
  await suite('Faollik: kirish/chiqish jurnali, online va holatlar', { TRUST_PROXY: '1', ADM_COOLDOWN_MS: '300', ADMIN_ATT_ALERT: '0', REG_RATE_MAX: '200', ACTIVITY_OFFLINE_MS: '2500', ACTIVITY_GRACE_MS: '400' }, async ctx => {
    const { raw: rq, client: cl } = ctx, UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36', H = (ip, o = {}) => ({ 'True-Client-IP': ip, 'User-Agent': UA, ...o }), PW = 'parol12345';
    const ping = (c, ip, tid, p, v = 1, i = 0) => c('POST', '/api/ping', { tid, p, v, i }, H(ip));
    // 0) seanssiz admin yoʻllari yopiq; ping esa ochiq (mehmonlar ham sanaladi)
    for (const u of ['/api/admin/online', '/api/admin/activity', '/api/admin/user/activity?email=a@b.test']) { const q = await rq('GET', u, null, H('198.51.100.1')); ok(q.s === 401, `seanssiz ${u.split('?')[0]} → 401`, q.s); }
    const A = cl(); let q = await adminLogin(ctx, A); ok(q.s === 200, 'admin kirdi', q.s);
    const online = async () => (await A('GET', '/api/admin/online')).j, feed = async () => (await A('GET', '/api/admin/activity?n=500')).j;
    // 1) mehmon
    q = await rq('POST', '/api/ping', { tid: 'guesttab0001', p: 'landing', v: 1, i: 0 }, H('198.51.100.5')); ok(q.s === 200 && q.j.ok === true && !q.j.blocked, 'mehmon ping i qabul qilindi', q);
    q = await rq('POST', '/api/ping', { tid: 'x', p: 'landing', v: 1, i: 0 }, H('198.51.100.5')); ok(q.s === 200, 'notoʻgʻri tid xato bermaydi (jim rad etiladi)', q.s);
    q = await rq('POST', '/api/ping', { tid: 'guesttab0002', p: 'dashboard', v: 1, i: 0 }, H('198.51.100.7'));
    let o = await online(); ok(o.guests.length === 2 && o.counts.guests === 2 && o.counts.users === 0 && o.counts.total === 2, 'online: 2 mehmon (notoʻgʻri tid sanalmadi)', o.counts);
    const g = o.guests.find(x => x.ip === '198.51.100.5'), g2 = o.guests.find(x => x.ip === '198.51.100.7'); ok(g && g.pg === 'landing' && g.st === 'act' && g.d === 'Chrome · Windows' && g.id === 'guestt' && g2.pg === 'auth', 'mehmon: sahifa, holat, qurilma; ilova sahifasi → «auth»', o.guests);
    ok((await feed()).visits.length === 0 && (await feed()).events.length === 0, 'mehmonlar jurnalga yozilmaydi');
    // 2) foydalanuvchi: roʻyxatdan oʻtish, tashrif, sahifa va holat
    const R = cl(); q = await R('POST', '/api/register', { email: 'ali.faol@example.test', password: PW, name: 'Ali Faol' }, H('198.51.100.6')); ok(q.s === 201, 'foydalanuvchi roʻyxatdan oʻtdi', q.s);
    q = await ping(R, '198.51.100.6', 'usertab00001', 'finder', 1, 2); ok(q.s === 200 && q.j.ok, 'foydalanuvchi ping i', q);
    o = await online(); let u = o.users.find(x => x.em === 'ali.faol@example.test');
    ok(u && u.pg === 'finder' && u.st === 'act' && u.ip === '198.51.100.6' && u.d === 'Chrome · Windows' && u.plan === 'free' && u.sess === 1 && u.tabs === 1 && o.counts.users === 1 && o.counts.total === 3, 'online: foydalanuvchi, sahifa, holat, IP, qurilma, tarif, seanslar', u);
    let f = await feed(); ok(f.events.some(e => e.k === 'register' && e.em === 'ali.faol@example.test' && e.ip === '198.51.100.6' && e.d === 'Chrome · Windows') && f.visits.length === 1 && f.visits[0].open === true && f.visits[0].em === 'ali.faol@example.test', 'jurnal: «register» hodisasi va ochiq tashrif', f);
    await ping(R, '198.51.100.6', 'usertab00001', 'tracker', 0, 0); o = await online(); ok(o.users[0].st === 'bg' && o.users[0].pg === 'tracker', 'oyna fonda → «bg»', o.users[0]);
    await ping(R, '198.51.100.6', 'usertab00001', 'tracker', 1, 400); o = await online(); ok(o.users[0].st === 'idle' && o.users[0].idle >= 400, 'harakatsiz → «idle»', o.users[0]);
    await ping(R, '198.51.100.6', 'usertab00002', 'essay', 1, 1); o = await online(); ok(o.users.length === 1 && o.users[0].tabs === 2 && o.users[0].pg === 'essay' && o.users[0].st === 'act', 'ikkinchi oyna: bitta tashrif, faol oyna sahifasi', o.users[0]);
    f = await feed(); ok(f.visits.length === 1 && f.visits[0].pp.join() === 'finder,tracker,essay', 'tashrifda sahifalar izi', f.visits[0].pp);
    // 3) ikkinchi qurilma, xato parol, chiqish
    const PH = { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1' };
    const R2 = cl(); q = await R2('POST', '/api/login', { email: 'ali.faol@example.test', password: PW }, H('198.51.100.8', PH)); ok(q.s === 200, 'ikkinchi qurilmadan kirdi', q.s);
    await R2('POST', '/api/ping', { tid: 'phonetab0001', p: 'dashboard', v: 1, i: 0 }, H('198.51.100.8', PH));
    o = await online(); ok(o.users.length === 2 && o.users.every(x => x.sess === 2) && o.users.some(x => x.d === 'Safari · iOS') && o.counts.users === 1 && o.counts.sessions === 2, 'bir foydalanuvchi — ikki qurilma: ikki tashrif, bitta online foydalanuvchi', o.counts);
    for (let k = 0; k < 3; k++) await cl()('POST', '/api/login', { email: 'ali.faol@example.test', password: 'notogri-parol' }, H('198.51.100.30'));
    await cl()('POST', '/api/login', { email: 'yoq.hisob@example.test', password: 'notogri-parol' }, H('198.51.100.31'));
    f = await feed(); const fails = f.events.filter(e => e.k === 'login.fail'); ok(fails.length === 1 && fails[0].ip === '198.51.100.30' && fails[0].em === 'ali.faol@example.test', 'xato parol: faqat mavjud hisob uchun, takroriysi (10 daq.) yozilmaydi', fails);
    ok(f.events.some(e => e.k === 'login' && e.ip === '198.51.100.8' && e.d === 'Safari · iOS') && !JSON.stringify(f).includes('yoq.hisob'), '«login» hodisasi (IP, qurilma); mavjud boʻlmagan email jurnalga yozilmaydi');
    q = await R2('POST', '/api/logout', {}, H('198.51.100.8', PH)); ok(q.s === 200, 'chiqish', q.s);
    f = await feed(); const lv = f.visits.find(v => v.ip === '198.51.100.8'); ok(lv && lv.open === false && lv.r === 'logout' && f.events.some(e => e.k === 'logout' && e.ip === '198.51.100.8'), 'chiqish: tashrif darhol yopildi (logout) va hodisa yozildi', lv);
    o = await online(); ok(o.users.length === 1 && o.users[0].sess === 1, 'chiqqan qurilma online dan oʻchdi', o.users.length);
    // 4) bitta oyna yopildi — ikkinchisi turadi; oxirgisi yopilsa — kutishdan keyin «chiqdi»
    await rq('POST', '/api/ping', { tid: 'usertab00001', bye: 1 }, H('198.51.100.6')); await sleep(700);
    await ping(R, '198.51.100.6', 'usertab00002', 'essay', 1, 1); o = await online(); ok(o.users.length === 1 && o.users[0].tabs === 1, 'bitta oyna yopildi: tashrif davom etadi', o.users[0]);
    await rq('POST', '/api/ping', { tid: 'usertab00002', bye: 1 }, H('198.51.100.6')); await sleep(700);
    o = await online(); f = await feed(); const v0 = f.visits.find(v => v.ip === '198.51.100.6');
    ok(!o.users.length && v0 && v0.open === false && v0.r === 'bye' && v0.t1 > v0.t0, 'oxirgi oyna yopildi: tashrif «bye» bilan yopildi, chiqish vaqti yozildi', v0);
    // 5) mehmon muddati: ping kelmasa oflayn
    await sleep(2200); o = await online(); ok(o.guests.length === 0 && o.counts.total === 0, 'ping kelmasa mehmonlar ~2.5 soniyada oflayn', o.counts);
    // 6) bitta foydalanuvchi sahifasi
    q = await ping(R, '198.51.100.6', 'usertab00003', 'dashboard');
    q = await A('GET', '/api/admin/user/activity?email=ALI.FAOL@example.test'); ok(q.s === 200 && q.j.user.email === 'ali.faol@example.test' && q.j.user.plan === 'free' && q.j.visits.length >= 2 && q.j.events.some(e => e.k === 'register') && q.j.total.visits >= 2 && q.j.sessions.length === 1 && q.j.now.length === 1 && q.j.now[0].pg === 'dashboard', 'foydalanuvchi: tashriflar, hodisalar, jami, seanslar, hozirgi holat', q.j.total);
    ok(!/"hash"|vcode|password/i.test(JSON.stringify(q.j)), 'foydalanuvchi faolligi javobida parol/kod maydonlari yoʻq');
    q = await A('GET', '/api/admin/user/activity?email=yoq@example.test'); ok(q.s === 404, 'mavjud boʻlmagan foydalanuvchi → 404', q.s);
    q = await A('GET', '/api/admin/stats'); ok(q.j.online && q.j.online.users === 1 && q.j.online.total === 1, '/api/admin/stats da «online» soni bor', q.j.online);
    q = await A('GET', '/api/admin/users'); const ur = q.j.users.find(x => x.email === 'ali.faol@example.test'); ok(ur.on === true && ur.lastAt > 0, 'foydalanuvchilar roʻyxatida «online» va oxirgi faollik', ur);
    // 7) bloklash: tashrif yopiladi; ochiq sahifa ping orqali «bloklandi» xabarini oladi
    q = await A('POST', '/api/admin/user/block', { email: 'ali.faol@example.test', minutes: 0, reason: 'sinov' }); ok(q.s === 200, 'bloklandi', q.s);
    q = await ping(R, '198.51.100.6', 'usertab00003', 'dashboard'); ok(q.s === 200 && q.j.blocked === true && q.j.block && q.j.block.until === 0, 'bloklangan seans ping javobida «blocked» oladi (ekran chiqadi)', q.j);
    o = await online(); f = await feed(); ok(!o.users.length && f.events.some(e => e.k === 'admin.block' && e.em === 'ali.faol@example.test') && f.visits.filter(v => v.em === 'ali.faol@example.test').every(v => !v.open), 'bloklangan online dan chiqdi, tashrif yopildi, «admin.block» hodisasi yozildi', f.events.map(e => e.k));
    q = await cl()('POST', '/api/login', { email: 'ali.faol@example.test', password: PW }, H('198.51.100.9')); f = await feed(); ok(q.s === 403 && f.events.some(e => e.k === 'blocked' && e.ip === '198.51.100.9'), 'bloklangan kirish urinishi «blocked» hodisasi sifatida yozildi', f.events.map(e => e.k));
    q = await A('POST', '/api/admin/user/unblock', { email: 'ali.faol@example.test' }); f = await feed(); ok(q.s === 200 && f.events.some(e => e.k === 'admin.unblock'), 'blokdan chiqarish hodisasi yozildi');
    // 8) xavfsizlik: CSRF, tur, hajm, tezlik
    q = await rq('POST', '/api/ping', { tid: 'attacktab001', p: 'landing', v: 1, i: 0 }, H('198.51.100.40', { Origin: 'https://evil.example' })); ok(q.s === 403, 'ping: begona Origin → 403', q.s);
    q = await rq('POST', '/api/ping', 'tid=attacktab001', H('198.51.100.40', { 'Content-Type': 'text/plain' })); ok(q.s === 415 || q.s === 400, 'ping: JSON boʻlmasa rad etiladi', q.s);
    q = await rq('POST', '/api/ping', { tid: 'attacktab001', p: 'x'.repeat(5000) }, H('198.51.100.40')).catch(e => ({ s: 0 })); ok(q.s === 413 || q.s === 0, 'ping: katta soʻrov rad etiladi (413 yoki ulanish uziladi)', q.s);
    q = await rq('GET', '/api/ping', null, H('198.51.100.40')); ok(q.s === 404 || q.s === 405, 'ping faqat POST', q.s);
    const codes = []; for (let k = 0; k < 160; k++) { const r = await rq('POST', '/api/ping', { tid: 'flood' + String(k).padStart(8, '0'), p: 'landing', v: 1, i: 0 }, H('198.51.100.99')); codes.push(r.s); }
    ok(codes.slice(0, 150).every(c => c === 200) && codes.slice(150).every(c => c === 429), 'ping tezligi: bitta IP dan daqiqasiga 150 ta (keyin 429)', [codes.filter(c => c === 200).length, codes.filter(c => c === 429).length]);
    o = await online(); ok(o.guests.filter(x => x.ip === '198.51.100.99').length === 25, 'bitta IP dan eng koʻpi 25 ta mehmon oynasi', o.guests.length);
    q = await R('GET', '/api/me', null, H('198.51.100.6')); ok(!JSON.stringify(q.j).match(/visits|activity|198\.51\.100/), 'foydalanuvchi javoblarida faollik/IP maʼlumoti yoʻq', q.j && Object.keys(q.j));
    // 9) saqlanish: server qayta ishga tushganda jurnal turadi, ochiq tashriflar yopiq boʻladi
    const tok = A.jar.ud_adm, nEv = (await feed()).events.length, nVi = (await feed()).visits.length; await ctx.restart({ ACTIVITY_OFFLINE_MS: '2500', ACTIVITY_GRACE_MS: '400' }); const A2 = cl(); A2.jar.ud_adm = tok;
    f = (await A2('GET', '/api/admin/activity?n=500')).j; o = (await A2('GET', '/api/admin/online')).j;
    ok(f.events.length === nEv && f.visits.length === nVi && f.visits.every(v => !v.open) && o.users.length === 0 && o.guests.length === 0, 'qayta ishga tushgach: jurnal saqlangan, ochiq tashriflar yopilgan, online boʻsh', [f.events.length, nEv, f.visits.length, nVi]);
    // 10) hisobni oʻchirish: tashrif/hodisalar oʻchadi, faqat maskalangan «delete» qoladi
    const D = cl(); q = await D('POST', '/api/register', { email: 'ketadi.test@example.test', password: PW, name: 'Ketadi' }, H('198.51.100.60')); await D('POST', '/api/ping', { tid: 'deltab000001', p: 'profile', v: 1, i: 0 }, H('198.51.100.60'));
    f = (await A2('GET', '/api/admin/activity?n=500')).j; ok(f.visits.some(v => v.em === 'ketadi.test@example.test') && f.events.some(e => e.em === 'ketadi.test@example.test'), 'nazorat: oʻchirishdan oldin yozuvlar bor');
    q = await D('DELETE', '/api/account', { password: PW }, H('198.51.100.60')); ok(q.s === 200, 'hisob oʻchirildi', q.s);
    f = (await A2('GET', '/api/admin/activity?n=500')).j; const txt = JSON.stringify(f);
    ok(!txt.includes('ketadi.test@example.test') && !txt.includes('Ketadi') && f.events.some(e => e.k === 'delete' && e.em === 'k***@example.test' && e.uid === ''), 'hisob oʻchirilgach: email/ism jurnalda yoʻq, faqat maskalangan «delete» yozuvi', f.events.filter(e => e.k === 'delete'));
  });

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

/* Zaxira nusxa va tiklash testi: haqiqiy server bilan (izolyatsiyalangan vaqtinchalik papkalar, mahalliy port) */
'use strict';
const { spawn, spawnSync } = require('node:child_process'), http = require('node:http'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const ROOT = path.join(__dirname, '..'), TOOL = path.join(ROOT, 'tools', 'backup.js'), PORT = 5600 + Math.floor(Math.random() * 90);
let pass = 0, failN = 0; const ok = (c, m, x) => { if (c) pass++; else { failN++; console.log('  FAIL:', m, x === undefined ? '' : JSON.stringify(x)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'udbk-'));
function req(method, url, body, cookie) {
  return new Promise((res, rej) => { const d = body ? JSON.stringify(body) : ''; const r = http.request({ host: '127.0.0.1', port: PORT, method, path: url, headers: { ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } : {}), ...(cookie ? { Cookie: cookie } : {}) } }, s => { const ch = []; s.on('data', c => ch.push(c)); s.on('end', () => { let j = null; try { j = JSON.parse(Buffer.concat(ch).toString()); } catch (e) {} res({ s: s.statusCode, j, h: s.headers }); }); }); r.on('error', rej); if (d) r.write(d); r.end(); });
}
async function boot(dir) {
  const p = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), DATA_DIR: dir, ANTHROPIC_API_KEY: '', REQUIRE_EMAIL_VERIFY: '0', ADMIN_TOKEN: 'x', ADMIN_EMAILS: '', RESEND_API_KEY: '', BREVO_API_KEY: '', COOKIE_SECURE: '', APP_URL: '' }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await req('GET', '/healthz')).s === 200) return p; } catch (e) {} await sleep(150); }
  throw new Error('server ishga tushmadi');
}
const stop = p => new Promise(r => { p.once('exit', r); p.kill('SIGTERM'); setTimeout(() => p.kill('SIGKILL'), 4000); });
const run = (args, env = {}) => spawnSync('node', [TOOL, ...args], { env: { ...process.env, BACKUP_PASSPHRASE: '', ...env }, encoding: 'utf8' });
const dirOf = r => /Zaxira tayyor: (.+)/.exec(r.stdout || '')?.[1]?.trim();

(async () => {
  const A = tmp(), OUT = tmp(), C = tmp(), D = tmp();
  console.log('Zaxira nusxa va tiklash');
  let srv = await boot(A);
  let r = await req('POST', '/api/register', { email: 'backup@example.test', password: 'parol12345', name: 'Zaxira' }); ok(r.s === 201, 'foydalanuvchi yaratildi', r.s);
  await stop(srv); ok(fs.existsSync(path.join(A, 'db.json')), 'server yopilganda db.json diskka yozilgan');

  // 1) oddiy zaxira
  let b = run(['backup', '--data', A, '--out', OUT]); ok(b.status === 0, 'zaxira olindi', b.stderr); const P = dirOf(b);
  ok(P && fs.existsSync(path.join(P, 'MANIFEST.json')) && fs.existsSync(path.join(P, 'db.json')), 'MANIFEST.json va db.json zaxirada bor');
  ok(!/backup@example\.test|parol12345/.test(b.stdout + b.stderr), 'konsolga maʼlumot (email/parol) chiqmaydi');
  ok((fs.statSync(path.join(P, 'db.json')).mode & 0o077) === 0, 'zaxira fayllari faqat egasi uchun (0600)');
  ok(run(['verify', P]).status === 0, 'verify: butun zaxira oʻtadi');

  // 2) shifrlangan zaxira
  const PW = 'test-passphrase-12345'; b = run(['backup', '--data', A, '--out', OUT], { BACKUP_PASSPHRASE: PW }); ok(b.status === 0, 'shifrlangan zaxira olindi', b.stderr); const E = dirOf(b);
  ok(fs.existsSync(path.join(E, 'db.json.enc')) && !fs.existsSync(path.join(E, 'db.json')), 'faqat .enc fayl yozilgan (ochiq nusxa yoʻq)');
  ok(!fs.readFileSync(path.join(E, 'db.json.enc')).includes('backup@example.test'), 'shifrlangan faylda email ochiq koʻrinmaydi');
  ok(run(['verify', E]).status === 2, 'parolsiz verify rad etadi'); ok(run(['verify', E], { BACKUP_PASSPHRASE: 'notoʻgʻri-parol' }).status === 2, 'notoʻgʻri parol bilan verify rad etadi'); ok(run(['verify', E], { BACKUP_PASSPHRASE: PW }).status === 0, 'toʻgʻri parol bilan verify oʻtadi');

  // 3) buzish: bitta bayt, MANIFEST, yoʻl chiqib ketishi, jurnal zanjiri
  const T = path.join(OUT, 'tamper'); fs.cpSync(P, T, { recursive: true }); const f = path.join(T, 'db.json'), buf = fs.readFileSync(f); buf[buf.length - 3] ^= 1; fs.writeFileSync(f, buf);
  ok(run(['verify', T]).status === 2, 'bitta bayt oʻzgartirilsa verify rad etadi');
  const T2 = path.join(OUT, 'tamper2'); fs.cpSync(P, T2, { recursive: true }); const man = JSON.parse(fs.readFileSync(path.join(T2, 'MANIFEST.json'), 'utf8')); man.files[0].name = '../../etc/passwd'; fs.writeFileSync(path.join(T2, 'MANIFEST.json'), JSON.stringify(man));
  ok(run(['verify', T2]).status === 2, 'MANIFESTdagi "../" yoʻl rad etiladi');
  const T3 = path.join(OUT, 'tamper3'); fs.cpSync(P, T3, { recursive: true }); fs.writeFileSync(path.join(T3, 'db.json'), '{"users":[]}'); ok(run(['verify', T3]).status === 2, 'tuzilmasi notoʻgʻri db.json rad etiladi');
  const SL = path.join(A, 'security.log'); fs.writeFileSync(SL, JSON.stringify({ seq: 1, t: 'x', ev: 'a', prev: 'genesis', h: 'deadbeef' }) + '\n'); b = run(['backup', '--data', A, '--out', path.join(OUT, 'bad')]); ok(b.status === 1 && /zanjir/.test(b.stderr), 'buzilgan xavfsizlik jurnali zaxiraga "butun" deb tushmaydi', b.stderr.slice(0, 120)); fs.rmSync(SL);

  // 4) tiklash
  ok(run(['restore', P, '--data', A]).status === 1, 'restore: mavjud db.json ustiga --force siz yozmaydi');
  ok(run(['restore', P, '--data', D, '--dry-run']).status === 0 && !fs.existsSync(path.join(D, 'db.json')), '--dry-run hech narsa yozmaydi');
  ok(run(['restore', T, '--data', C]).status === 2 && !fs.existsSync(path.join(C, 'db.json')), 'buzilgan zaxira tiklanmaydi (maqsadga hech narsa yozilmaydi)');
  r = run(['restore', E, '--data', C], { BACKUP_PASSPHRASE: PW }); ok(r.status === 0, 'shifrlangan zaxira tiklandi', r.stderr);
  srv = await boot(C);
  const L = await req('POST', '/api/login', { email: 'backup@example.test', password: 'parol12345' }); ok(L.s === 200, 'tiklangan maʼlumotlar bilan foydalanuvchi kira oladi', L.s);
  const ck = (L.h['set-cookie'] || []).map(x => x.split(';')[0]).join('; '), me = await req('GET', '/api/me', null, ck); ok(me.j && me.j.user && me.j.user.email === 'backup@example.test', '/api/me tiklangan hisobni qaytaradi');
  await stop(srv);
  const F = tmp(); fs.writeFileSync(path.join(F, 'db.json'), '{"users":{}}'); r = run(['restore', P, '--data', F, '--force']); ok(r.status === 0 && fs.readdirSync(F).some(n => n.startsWith('db.json.pre-restore-')), '--force eski db.json ni .pre-restore- nomi bilan saqlaydi', fs.readdirSync(F));
  for (const d of [A, OUT, C, D, F]) fs.rmSync(d, { recursive: true, force: true });
  console.log(`backup: ${pass} ta oʻtdi, ${failN} ta yiqildi`); process.exit(failN ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

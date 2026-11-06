'use strict';
/**
 * UniDoue server — tashqi paketlarsiz (faqat Node 18+).
 *  - email + parol bilan ro'yxatdan o'tish / kirish (scrypt)
 *  - HttpOnly cookie sessiyalar (serverda faqat hash saqlanadi)
 *  - har bir foydalanuvchi ma'lumotini (profil, natijalar, arizalar) serverda saqlash
 *  - mentor so'rovlarini saqlash (+ ixtiyoriy Telegram bot orqali yuborish)
 *
 * Muhit o'zgaruvchilari:
 *  PORT, HOST, DATA_DIR            — port, interfeys, ma'lumotlar papkasi
 *  COOKIE_SECURE=1                 — cookie faqat HTTPS (productionda yoqing)
 *  TRUST_PROXY=1                   — Render/Railway/nginx ortida: haqiqiy IP uchun X-Forwarded-For
 *  TG_BOT_TOKEN, TG_CHAT_ID        — mentor so'rovlari Telegramga tushishi uchun
 *  ADMIN_TOKEN                     — GET /api/admin/requests uchun (Authorization: Bearer ...)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_DAYS = 30;
const MAX_BODY = 300 * 1024;
const MAX_DATA_JSON = 250 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'db.json');

/* ---------------- ma'lumotlar bazasi (JSON fayl, atomik yozuv) ---------------- */
let db = { users: {}, sessions: {}, requests: [] };
try {
  const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  db = { users: raw.users || {}, sessions: raw.sessions || {}, requests: raw.requests || [] };
} catch (e) {
  if (e.code !== 'ENOENT') {
    console.error('db.json oʻqib boʻlmadi — ustiga yozmaslik uchun toʻxtadim:', e.message);
    process.exit(1);
  }
}
const emailIdx = new Map();
for (const u of Object.values(db.users)) emailIdx.set(u.email, u.id);

let saveTimer = null;
function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
function save() {
  if (!saveTimer) saveTimer = setTimeout(() => { try { flush(); } catch (e) { console.error('saqlash xatosi', e); } }, 100);
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { try { flush(); } catch (e) {} process.exit(0); });

/* ---------------- yordamchilar ---------------- */
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const scrypt = (pw, salt) => new Promise((res, rej) =>
  crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));
async function hashPw(pw) {
  const salt = crypto.randomBytes(16);
  return salt.toString('hex') + ':' + (await scrypt(pw, salt)).toString('hex');
}
async function checkPw(pw, stored) {
  const [s, h] = String(stored).split(':');
  const k = await scrypt(pw, Buffer.from(s, 'hex'));
  const hb = Buffer.from(h, 'hex');
  return hb.length === k.length && crypto.timingSafeEqual(hb, k);
}
let DUMMY_HASH = null; // foydalanuvchi topilmaganda ham bir xil vaqt sarflash uchun
hashPw('dummy-password').then(h => { DUMMY_HASH = h; });

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);

const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n++;
  return b.n > max;
}
function peek(key) { const b = buckets.get(key); return b && b.reset > Date.now() ? b.n : 0; }
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  for (const [k, s] of Object.entries(db.sessions)) if (s.exp < now) delete db.sessions[k];
  save();
}, 10 * 60 * 1000).unref();

const clientIp = req => {
  if (process.env.TRUST_PROXY === '1') {
    const x = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (x) return x;
  }
  return req.socket.remoteAddress || 'ip';
};
const isHttps = req => process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https';

function parseCookies(req) {
  const o = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return o;
}
function sessionUser(req) {
  const t = parseCookies(req).sid;
  if (!t) return null;
  const s = db.sessions[sha256(t)];
  if (!s || s.exp < Date.now()) return null;
  return db.users[s.uid] || null;
}
function setSessionCookie(req, res, token, maxAge) {
  res.setHeader('Set-Cookie',
    `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}` + (isHttps(req) ? '; Secure' : ''));
}
function createSession(req, res, uid) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.sessions[sha256(token)] = { uid, created: Date.now(), exp: Date.now() + SESSION_DAYS * 864e5 };
  // bitta foydalanuvchida eng koʻpi bilan 10 ta sessiya
  const mine = Object.entries(db.sessions).filter(([, s]) => s.uid === uid).sort((a, b) => a[1].created - b[1].created);
  while (mine.length > 10) delete db.sessions[mine.shift()[0]];
  setSessionCookie(req, res, token, SESSION_DAYS * 86400);
  save();
}

function secHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
}
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
const fail = (res, code, error) => send(res, code, { error });

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('big'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(Object.assign(new Error('json'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

const publicUser = u => ({ id: u.id, email: u.email, name: u.name });
const meBody = u => ({ user: publicUser(u), rev: u.rev || 0, hasData: !!(u.data && Object.keys(u.data).length), data: u.data || {} });

/* ---------------- marshrutlar ---------------- */
async function api(req, res, pathname) {
  const method = req.method;
  if (method !== 'GET') {
    // CSRF: Origin boʻlsa, bizning host boʻlishi shart; JSON boʻlishi shart
    const origin = req.headers.origin;
    if (origin) {
      let ok = false;
      try { ok = new URL(origin).host === req.headers.host; } catch (e) {}
      if (!ok) return fail(res, 403, 'Notoʻgʻri manba.');
    }
    if (!String(req.headers['content-type'] || '').startsWith('application/json') && req.headers['content-length'] !== '0' && req.headers['content-length'] !== undefined)
      return fail(res, 415, 'JSON kerak.');
  }
  const ip = clientIp(req);

  if (pathname === '/api/me' && method === 'GET') {
    const u = sessionUser(req);
    return send(res, 200, u ? meBody(u) : { user: null });
  }

  if (pathname === '/api/register' && method === 'POST') {
    if (limited('reg:' + ip, 10, 60 * 60 * 1000)) return fail(res, 429, 'Juda koʻp urinish. Keyinroq qayta urinib koʻring.');
    const b = await readJson(req);
    const email = clean(b.email, 254).toLowerCase(), name = clean(b.name, 40), pw = typeof b.password === 'string' ? b.password : '';
    if (!EMAIL_RE.test(email)) return fail(res, 400, 'Emailni toʻgʻri kiriting.');
    if (name.length < 2) return fail(res, 400, 'Ismingizni kiriting (kamida 2 harf).');
    if (pw.length < 8 || pw.length > 128) return fail(res, 400, 'Parol 8 dan 128 gacha belgidan iborat boʻlsin.');
    if (emailIdx.has(email)) return fail(res, 409, 'Bu email bilan hisob allaqachon bor. “Kirish” ni bosing.');
    const hash = await hashPw(pw);
    if (emailIdx.has(email)) return fail(res, 409, 'Bu email bilan hisob allaqachon bor. “Kirish” ni bosing.');
    const u = { id: crypto.randomBytes(8).toString('hex'), email, name, hash, created: Date.now(), rev: 0, data: {} };
    db.users[u.id] = u; emailIdx.set(email, u.id);
    createSession(req, res, u.id);
    return send(res, 201, meBody(u));
  }

  if (pathname === '/api/login' && method === 'POST') {
    if (limited('login-ip:' + ip, 30, 15 * 60 * 1000)) return fail(res, 429, 'Juda koʻp urinish. 15 daqiqadan soʻng qayta urining.');
    const b = await readJson(req);
    const email = clean(b.email, 254).toLowerCase(), pw = typeof b.password === 'string' ? b.password.slice(0, 128) : '';
    if (peek('login-em:' + email) >= 8) return fail(res, 429, 'Juda koʻp xato urinish. 15 daqiqadan soʻng qayta urining.');
    const id = emailIdx.get(email), u = id && db.users[id];
    let ok = false;
    if (u) ok = await checkPw(pw, u.hash);
    else if (DUMMY_HASH) await checkPw(pw, DUMMY_HASH).catch(() => {});
    if (!ok) { limited('login-em:' + email, 8, 15 * 60 * 1000); return fail(res, 401, 'Email yoki parol notoʻgʻri.'); }
    buckets.delete('login-em:' + email);
    createSession(req, res, u.id);
    return send(res, 200, meBody(u));
  }

  if (pathname === '/api/logout' && method === 'POST') {
    const t = parseCookies(req).sid;
    if (t) { delete db.sessions[sha256(t)]; save(); }
    setSessionCookie(req, res, '', 0);
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/data' && method === 'PUT') {
    const u = sessionUser(req);
    if (!u) return fail(res, 401, 'Avval hisobga kiring.');
    const b = await readJson(req), d = b.data;
    if (!d || typeof d !== 'object' || Array.isArray(d)) return fail(res, 400, 'Notoʻgʻri maʼlumot.');
    const out = {};
    let n = 0;
    for (const [k, v] of Object.entries(d)) {
      if (!k.startsWith('qabul:') || k === 'qabul:sync' || k === 'qabul:lang' || typeof v !== 'string') continue;
      if (++n > 200) return fail(res, 413, 'Maʼlumot juda katta.');
      out[k] = v;
    }
    if (JSON.stringify(out).length > MAX_DATA_JSON) return fail(res, 413, 'Maʼlumot juda katta.');
    u.data = out; u.rev = (u.rev || 0) + 1; u.updated = Date.now();
    save();
    return send(res, 200, { ok: true, rev: u.rev });
  }

  if (pathname === '/api/account' && method === 'DELETE') {
    const u = sessionUser(req);
    if (!u) return fail(res, 401, 'Avval hisobga kiring.');
    if (limited('del:' + u.id, 5, 15 * 60 * 1000)) return fail(res, 429, 'Juda koʻp urinish.');
    const b = await readJson(req);
    if (!(await checkPw(typeof b.password === 'string' ? b.password.slice(0, 128) : '', u.hash))) return fail(res, 401, 'Parol notoʻgʻri.');
    for (const [k, s] of Object.entries(db.sessions)) if (s.uid === u.id) delete db.sessions[k];
    emailIdx.delete(u.email); delete db.users[u.id];
    setSessionCookie(req, res, '', 0);
    save();
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/request' && method === 'POST') {
    if (limited('rq:' + ip, 6, 60 * 60 * 1000)) return fail(res, 429, 'Juda koʻp soʻrov. Keyinroq urinib koʻring.');
    const b = await readJson(req), u = sessionUser(req);
    const name = clean(b.name, 60), contact = clean(b.contact, 60), service = clean(b.service, 60), message = String(b.message || '').slice(0, 2000);
    if (name.length < 2 || contact.length < 5) return fail(res, 400, 'Ism va aloqa maʼlumotini kiriting.');
    const r = { id: crypto.randomBytes(6).toString('hex'), ts: new Date().toISOString(), uid: u ? u.id : null, email: u ? u.email : null, name, contact, service, message };
    db.requests.push(r);
    if (db.requests.length > 5000) db.requests.shift();
    save();
    notifyTelegram(r);
    return send(res, 201, { ok: true });
  }

  if (pathname === '/api/admin/requests' && method === 'GET') {
    const tok = process.env.ADMIN_TOKEN;
    const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const a = Buffer.from(sha256(got)), b2 = Buffer.from(sha256(tok || ''));
    if (!tok || !crypto.timingSafeEqual(a, b2)) return fail(res, 401, 'Ruxsat yoʻq.');
    return send(res, 200, { requests: db.requests });
  }

  return fail(res, 404, 'Topilmadi.');
}

async function notifyTelegram(r) {
  const { TG_BOT_TOKEN: tok, TG_CHAT_ID: chat } = process.env;
  if (!tok || !chat) return;
  try {
    const text = `Yangi soʻrov (${r.service})\n${r.name} — ${r.contact}${r.email ? '\nHisob: ' + r.email : ''}\n\n${r.message}`.slice(0, 3900);
    await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text })
    });
  } catch (e) { console.error('Telegram xatosi:', e.message); }
}

/* ---------------- server ---------------- */
const server = http.createServer(async (req, res) => {
  secHeaders(res);
  try {
    const pathname = new URL(req.url, 'http://x').pathname;
    if (pathname.startsWith('/api/')) return await api(req, res, pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; return res.end(); }
    if (pathname === '/healthz') { res.setHeader('Content-Type', 'text/plain'); return res.end('ok'); }
    if (pathname === '/favicon.ico') { res.statusCode = 204; return res.end(); }
    if (pathname === '/' || pathname === '/index.html') {
      const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      return res.end(req.method === 'HEAD' ? undefined : html);
    }
    res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end('Topilmadi');
  } catch (e) {
    if (res.headersSent) return res.end();
    if (e.status) return fail(res, e.status, e.status === 413 ? 'Soʻrov juda katta.' : 'Notoʻgʻri soʻrov.');
    console.error(e);
    fail(res, 500, 'Server xatosi. Keyinroq urinib koʻring.');
  }
});
server.listen(PORT, HOST, () => console.log(`UniDoue http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  (data: ${DATA_DIR})`));

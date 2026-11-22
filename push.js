'use strict';
/**
 * Web Push — tashqi paketlarsiz (faqat node:crypto va fetch).
 *  - RFC 8030: push xabarni brauzerning push xizmatiga (FCM, Mozilla, Apple, Windows) yuborish
 *  - RFC 8292: VAPID — server oʻzini ES256 JWT bilan tanishtiradi
 *  - RFC 8291: xabar mazmuni aes128gcm bilan shifrlanadi (faqat foydalanuvchi qurilmasi oʻqiy oladi)
 *
 * Xavfsizlik: obuna manzilini (endpoint) foydalanuvchi beradi, server esa oʻsha manzilga soʻrov yuboradi.
 * Shuning uchun faqat maʼlum push xizmatlari domenlariga ruxsat beriladi (SSRF himoyasi), yoʻnaltirishlarga ergashilmaydi.
 */
const crypto = require('node:crypto');

const b64u = b => Buffer.from(b).toString('base64url');
const unb64u = s => Buffer.from(String(s), 'base64url');

const HOSTS = [
  /^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/,        // Chrome, Edge, Opera, Android
  /(^|\.)push\.services\.mozilla\.com$/,                         // Firefox
  /(^|\.)notify\.windows\.com$/,                                 // Windows (eski Edge)
  /(^|\.)push\.apple\.com$/                                      // Safari (macOS, iOS)
];
// Faqat sinov uchun: PUSH_EXTRA_HOSTS="localhost:4500" (vergul bilan). Productionda sozlanmaydi.
const extraHosts = () => String(process.env.PUSH_EXTRA_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);

function validEndpoint(ep) {
  if (typeof ep !== 'string' || ep.length > 700) return false;
  let u; try { u = new URL(ep); } catch (e) { return false; }
  if (u.username || u.password) return false;
  if (extraHosts().includes(u.host)) return u.protocol === 'http:' || u.protocol === 'https:';
  return u.protocol === 'https:' && u.port === '' && HOSTS.some(re => re.test(u.hostname));
}
/** Brauzer bergan kalitlarni tekshiradi: p256dh — 65 bayt (siqilmagan P-256 nuqta), auth — 16 bayt. */
function validKeys(k) {
  if (!k || typeof k.p256dh !== 'string' || typeof k.auth !== 'string') return false;
  const p = unb64u(k.p256dh), a = unb64u(k.auth);
  if (p.length !== 65 || p[0] !== 4 || a.length !== 16) return false;
  try { const e = crypto.createECDH('prime256v1'); e.generateKeys(); e.computeSecret(p); } catch (e) { return false; } // nuqta egri chiziqda yotishi shart
  return true;
}

/* ---------- VAPID kalitlari ---------- */
/** Yangi kalit juftligi: pub — 65 bayt (base64url), priv — 32 bayt (base64url). web-push kutubxonasi formati bilan bir xil. */
function generateKeys() {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const j = privateKey.export({ format: 'jwk' });
  return { pub: b64u(Buffer.concat([Buffer.from([4]), unb64u(j.x), unb64u(j.y)])), priv: j.d };
}
const keyCache = new Map();
function privateKeyObject(keys) {
  const id = keys.pub + keys.priv;
  if (!keyCache.has(id)) {
    const pub = unb64u(keys.pub);
    keyCache.set(id, crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)), d: keys.priv }, format: 'jwk' }));
  }
  return keyCache.get(id);
}
function validKeyPair(keys) {
  try { return !!keys && unb64u(keys.pub).length === 65 && unb64u(keys.priv).length === 32 && !!privateKeyObject(keys); } catch (e) { return false; }
}
/** Authorization sarlavhasi: "vapid t=<JWT>, k=<ochiq kalit>". JWT amal qilish muddati 12 soat (chegara — 24 soat). */
function vapidHeader(endpoint, keys, subject, nowMs = Date.now()) {
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(nowMs / 1000) + 12 * 3600, sub: subject }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: privateKeyObject(keys), dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${keys.pub}`;
}

/* ---------- RFC 8291: aes128gcm shifrlash ---------- */
const hkdf = (ikm, salt, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));
/**
 * payload (matn/Buffer) ni obunachi uchun shifrlaydi. Qaytaradi: tayyor soʻrov tanasi (sarlavha + shifrlangan yozuv).
 * opt.asPrivate / opt.salt — faqat RFC sinov vektori uchun (oddiy ishda tasodifiy yaratiladi).
 */
function encrypt(payload, uaPublicB64, authB64, opt = {}) {
  const ua = unb64u(uaPublicB64), auth = unb64u(authB64);
  if (ua.length !== 65 || ua[0] !== 4 || auth.length !== 16) throw new Error('Obuna kalitlari notoʻgʻri');
  const data = Buffer.concat([Buffer.from(payload), Buffer.from([2])]); // 0x02 — oxirgi yozuv belgisi
  if (data.length > 4096 - 16) throw new Error('Xabar juda katta');
  const ecdh = crypto.createECDH('prime256v1');
  if (opt.asPrivate) ecdh.setPrivateKey(unb64u(opt.asPrivate)); else ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), secret = ecdh.computeSecret(ua);
  const salt = opt.salt ? unb64u(opt.salt) : crypto.randomBytes(16);
  const ikm = hkdf(secret, auth, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32);
  const cek = hkdf(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(data), c.final(), c.getAuthTag()]);
  const head = Buffer.alloc(21 + 65); salt.copy(head, 0); head.writeUInt32BE(4096, 16); head[20] = 65; asPub.copy(head, 21);
  return Buffer.concat([head, body]);
}

/**
 * Bitta obunaga xabar yuboradi. sub = { ep, p, a } (endpoint, p256dh, auth). Qaytaradi: HTTP status (0 — tarmoq xatosi).
 * 201/200/202 — qabul qilindi; 404/410 — obuna oʻchirilgan (bazadan olib tashlang); 403 — boshqa VAPID kalit bilan yaratilgan.
 */
async function send(sub, message, keys, subject, opt = {}) {
  if (!validEndpoint(sub.ep)) return 410;
  const body = encrypt(JSON.stringify(message), sub.p, sub.a);
  try {
    const r = await fetch(sub.ep, {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(10000), body,
      headers: {
        Authorization: vapidHeader(sub.ep, keys, subject), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
        TTL: String(opt.ttl == null ? 86400 : opt.ttl), Urgency: opt.urgency || 'normal'
      }
    });
    try { await r.arrayBuffer(); } catch (e) {}
    return r.status;
  } catch (e) { return 0; }
}

module.exports = { validEndpoint, validKeys, generateKeys, validKeyPair, vapidHeader, encrypt, send, b64u, unb64u };

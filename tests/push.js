'use strict';
// Web Push kriptografiyasi: RFC 8291 sinov vektori, mustaqil deshifrlash, VAPID imzosi, manzil tekshiruvi. Ishga tushirish: node tests/push.js
const crypto = require('node:crypto');
const P = require('../push');
let pass = 0, bad = 0;
const ok = (c, name, extra) => { if (c) pass++; else { bad++; console.log('  FAIL', name, extra === undefined ? '' : extra); } };

/* 1) RFC 8291, 5-bo'lim va A ilova: aniq kalitlar va salt bilan chiqish baytma-bayt mos kelishi shart */
const V = {
  plain: 'When I grow up, I want to be a watermelon',
  uaPub: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  uaPriv: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  asPriv: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  body: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN'
};
const got = P.encrypt(V.plain, V.uaPub, V.auth, { asPrivate: V.asPriv, salt: V.salt }).toString('base64url');
ok(got === V.body, 'RFC 8291 vektori', got);

/* 2) Mustaqil qabul qiluvchi tomoni (brauzer qiladigan ish): deshifrlash va roundtrip */
const { decrypt } = require('./pushutil');
{
  const dev = crypto.createECDH('prime256v1'); dev.generateKeys();
  const pub = dev.getPublicKey().toString('base64url'), priv = dev.getPrivateKey().toString('base64url'), auth = crypto.randomBytes(16).toString('base64url');
  const msg = JSON.stringify({ title: 'Ariza muddati', body: 'MIT: ertaga (2027-01-05). Hujjatlarni tekshiring ✓', url: '/app#/tracker' });
  const r = decrypt(P.encrypt(msg, pub, auth), { priv, p: pub, a: auth });
  ok(r.text === msg && r.rs === 4096 && r.idlen === 65, 'roundtrip (kirill/oʻzbek belgilari bilan)', r.text);
  const two = P.encrypt(msg, pub, auth).toString('hex'), one = P.encrypt(msg, pub, auth).toString('hex');
  ok(two !== one, 'har safar yangi salt va kalit');
  let threw = false; try { P.encrypt('x'.repeat(5000), pub, auth); } catch (e) { threw = true; }
  ok(threw, 'katta xabar rad etiladi');
  ok(P.validKeys({ p256dh: pub, auth }), 'validKeys: toʻgʻri');
  ok(!P.validKeys({ p256dh: pub, auth: 'qisqa' }) && !P.validKeys({ p256dh: 'AAAA', auth }) && !P.validKeys(null) && !P.validKeys({ p256dh: Buffer.alloc(65, 4).toString('base64url'), auth }), 'validKeys: notoʻgʻri kalitlar rad etiladi');
}

/* 3) VAPID: imzoni ochiq kalit bilan tekshirish */
{
  const k = P.generateKeys();
  ok(P.validKeyPair(k) && Buffer.from(k.pub, 'base64url').length === 65 && Buffer.from(k.priv, 'base64url').length === 32, 'VAPID kalit juftligi oʻlchamlari');
  const ep = 'https://fcm.googleapis.com/fcm/send/abc', now = 1_800_000_000_000;
  const h = P.vapidHeader(ep, k, 'mailto:a@b.uz', now), m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(h);
  ok(!!m && m[4] === k.pub, 'Authorization sarlavha formati', h);
  if (m) {
    const claims = JSON.parse(Buffer.from(m[2], 'base64url')), head = JSON.parse(Buffer.from(m[1], 'base64url'));
    ok(head.alg === 'ES256' && head.typ === 'JWT', 'JWT sarlavhasi');
    ok(claims.aud === 'https://fcm.googleapis.com' && claims.sub === 'mailto:a@b.uz' && claims.exp === 1_800_000_000 + 12 * 3600, 'JWT daʼvolari (aud, sub, exp ≤ 24 soat)', JSON.stringify(claims));
    const x = Buffer.from(k.pub, 'base64url'), pubKey = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: x.subarray(1, 33).toString('base64url'), y: x.subarray(33).toString('base64url') }, format: 'jwk' });
    ok(crypto.verify('sha256', Buffer.from(m[1] + '.' + m[2]), { key: pubKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3], 'base64url')), 'ES256 imzosi ochiq kalit bilan tasdiqlanadi');
    ok(!crypto.verify('sha256', Buffer.from(m[1] + '.' + m[2] + 'x'), { key: pubKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3], 'base64url')), 'oʻzgargan JWT rad etiladi');
  }
  ok(!P.validKeyPair({ pub: 'AAAA', priv: 'BBBB' }) && !P.validKeyPair(null), 'notoʻgʻri VAPID kalit rad etiladi');
}

/* 4) Manzil tekshiruvi (SSRF himoyasi) */
for (const e of ['https://fcm.googleapis.com/fcm/send/xyz', 'https://updates.push.services.mozilla.com/wpush/v2/abc', 'https://web.push.apple.com/QL', 'https://wns2-par02p.notify.windows.com/w/?token=abc'])
  ok(P.validEndpoint(e), 'ruxsat: ' + e);
for (const e of ['http://fcm.googleapis.com/x', 'https://evil.com/x', 'https://fcm.googleapis.com.evil.com/x', 'https://evil.com/?https://fcm.googleapis.com', 'https://localhost/x', 'https://127.0.0.1/x', 'https://169.254.169.254/latest/meta-data',
  'https://user:pw@fcm.googleapis.com/x', 'https://fcm.googleapis.com:8443/x', 'https://notpush.apple.com.evil.io/x', 'javascript:alert(1)', 'ftp://fcm.googleapis.com/x', '', null, 42, 'https://fcm.googleapis.com/' + 'a'.repeat(800)])
  ok(!P.validEndpoint(e), 'rad etiladi: ' + String(e).slice(0, 60));
process.env.PUSH_EXTRA_HOSTS = 'localhost:4999';
ok(P.validEndpoint('http://localhost:4999/p') && !P.validEndpoint('http://localhost:5000/p'), 'PUSH_EXTRA_HOSTS faqat aniq koʻrsatilgan host:port uchun');

console.log(`push: ${pass} ta oʻtdi, ${bad} ta yiqildi`);
process.exit(bad ? 1 : 0);

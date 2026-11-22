'use strict';
// Sinov uchun brauzer (qabul qiluvchi) tomoni: qurilma kalitlari va RFC 8291 xabarni deshifrlash.
const crypto = require('node:crypto');
exports.device = () => {
  const e = crypto.createECDH('prime256v1'); e.generateKeys();
  return { priv: e.getPrivateKey().toString('base64url'), p: e.getPublicKey().toString('base64url'), a: crypto.randomBytes(16).toString('base64url') };
};
exports.decrypt = function decrypt(buf, d) {
  const salt = buf.subarray(0, 16), rs = buf.readUInt32BE(16), idlen = buf[20], asPub = buf.subarray(21, 21 + idlen), rec = buf.subarray(21 + idlen);
  const ecdh = crypto.createECDH('prime256v1'); ecdh.setPrivateKey(Buffer.from(d.priv, 'base64url'));
  const secret = ecdh.computeSecret(asPub), ua = Buffer.from(d.p, 'base64url'), auth = Buffer.from(d.a, 'base64url');
  const h = (ikm, s, info, n) => Buffer.from(crypto.hkdfSync('sha256', ikm, s, info, n));
  const ikm = h(secret, auth, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32);
  const x = crypto.createDecipheriv('aes-128-gcm', h(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16), h(ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  x.setAuthTag(rec.subarray(rec.length - 16));
  const plain = Buffer.concat([x.update(rec.subarray(0, rec.length - 16)), x.final()]);
  return { rs, idlen, text: plain.subarray(0, plain.lastIndexOf(2)).toString('utf8') };
};

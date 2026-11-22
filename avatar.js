'use strict';
/**
 * Profil rasmi (avatar) tekshiruvi. Mijoz 192×192 JPEG yuboradi (data: URL); server uni
 * qat'iy tekshirib, faqat toza JPEG baytlarini saqlaydi. Hech qanday rasm kutubxonasi kerak emas.
 */
const MAX_BYTES = 30 * 1024;          // saqlanadigan JPEG hajmi
const MIN_SIDE = 32, MAX_SIDE = 512;  // piksel
const URL_RE = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;

/** JPEG ichidan (SOF0/1/2) oʻlchamni oʻqiydi; topilmasa null. */
function jpegSize(b) {
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0xD8 || (m >= 0xD0 && m <= 0xD7) || m === 0x01 || m === 0x00) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    if (len < 2) return null;
    if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) {
      // Faqat baseline/progressive (C0, C1, C2) ni qabul qilamiz; qolgani (arifmetik, lossless) — rad.
      if (m > 0xC2) return null;
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), comps: b[i + 9] };
    }
    i += 2 + len;
  }
  return null;
}

/** { img } → { buf } yoki { error } */
function check(img) {
  if (typeof img !== 'string' || img.length > Math.ceil(MAX_BYTES * 4 / 3) + 64) return { error: 'Rasm juda katta. Kichikroq rasm tanlang.' };
  const m = URL_RE.exec(img);
  if (!m) return { error: 'Rasm JPEG formatida boʻlsin.' };
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length < 200 || buf.length > MAX_BYTES) return { error: 'Rasm juda katta. Kichikroq rasm tanlang.' };
  if (buf[buf.length - 2] !== 0xFF || buf[buf.length - 1] !== 0xD9) return { error: 'Rasm buzilgan. Boshqa rasm tanlang.' };
  const sz = jpegSize(buf);
  if (!sz || ![1, 3].includes(sz.comps)) return { error: 'Rasm buzilgan. Boshqa rasm tanlang.' };
  if (sz.w < MIN_SIDE || sz.h < MIN_SIDE || sz.w > MAX_SIDE || sz.h > MAX_SIDE) return { error: 'Rasm oʻlchami mos emas.' };
  return { buf, w: sz.w, h: sz.h };
}

module.exports = { MAX_BYTES, MIN_SIDE, MAX_SIDE, jpegSize, check };

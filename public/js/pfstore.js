/* Portfolio rasmlari: qurilmada saqlash (IndexedDB), siqish va profil rasmini qirqish.
 * Sertifikat rasmlari serverga sinxronlanmaydi (hajm chegarasi va maxfiylik); IndexedDB yopiq bo'lsa, seans davomida xotirada turadi. */
const DB = 'unidoue-pf', ST = 'img';
let dbp = null; const mem = new Map();
const open = () => dbp || (dbp = new Promise(res => {
  try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = r.onblocked = () => res(null); } catch (e) { res(null); }
}));
const tx = async (mode, f) => {
  const db = await open(); if (!db) return undefined;
  return new Promise(res => { try { const t = db.transaction(ST, mode), r = f(t.objectStore(ST)); t.oncomplete = () => res(r && r.result); t.onerror = t.onabort = () => res(undefined); } catch (e) { res(undefined); } });
};
export const store = {
  async get(id) { const v = await tx('readonly', s => s.get(id)); return v !== undefined && v !== null ? v : mem.get(id); },
  async set(id, v) { mem.set(id, v); await tx('readwrite', s => s.put(v, id)); },
  async del(id) { mem.delete(id); await tx('readwrite', s => s.delete(id)); },
  async persistent() { return !!(await open()); }
};

const fileDataUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Rasmni o‘qib bo‘lmadi.')); r.readAsDataURL(f); });
/** Faylni rasm sifatida ochadi (EXIF burilishi hisobga olinadi). CSP blob: rasmlarga ruxsat bermaydi, shuning uchun zaxira yo'l data: URL. */
export async function loadImage(file) {
  if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('JPEG, PNG yoki WebP rasm tanlang.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Rasm juda katta (12 MB dan kichik bo‘lsin).');
  if (typeof createImageBitmap === 'function') { try { const b = await createImageBitmap(file, { imageOrientation: 'from-image' }); return { src: b, w: b.width, h: b.height, close: () => b.close && b.close() }; } catch (e) { /* zaxira yo'l */ } }
  const url = await fileDataUrl(file);
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Rasmni o‘qib bo‘lmadi.')); i.src = url; });
  return { src: im, w: im.naturalWidth, h: im.naturalHeight, close() {} };
}
const draw = (src, w, h, sx, sy, sw, sh, q) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = 'high'; g.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  return c.toDataURL('image/jpeg', q);
};
/** Hujjat rasmi: uzun tomoni ≤ max px, JPEG; AI ga yuborish chegarasidan (≈500 KB) oshmasin. */
export async function compress(file, max = 1000) {
  const im = await loadImage(file), k = Math.min(1, max / Math.max(im.w, im.h)), w = Math.max(1, Math.round(im.w * k)), h = Math.max(1, Math.round(im.h * k));
  let q = 0.72, url = draw(im.src, w, h, 0, 0, im.w, im.h, q);
  while (url.length > 470000 && q > 0.4) { q -= 0.08; url = draw(im.src, w, h, 0, 0, im.w, im.h, q); }
  im.close(); if (!/^data:image\/jpeg;base64,/.test(url)) throw new Error('Brauzer rasmni qayta ishlay olmadi.');
  return { url, w, h };
}
/** Profil rasmi 4:5 (320×400). view: { z: yaqinlashtirish ≥1, cx, cy: markaz (0..1) } */
export function cropPhoto(im, view) {
  const base = Math.max(320 / im.w, 400 / im.h), s = base * Math.max(1, view.z || 1), sw = 320 / s, sh = 400 / s;
  const sx = Math.min(Math.max(0, (view.cx ?? .5) * im.w - sw / 2), im.w - sw), sy = Math.min(Math.max(0, (view.cy ?? .5) * im.h - sh / 2), im.h - sh);
  let q = 0.84, url = draw(im.src, 320, 400, sx, sy, sw, sh, q);
  while (url.length > 62000 && q > 0.3) { q -= 0.08; url = draw(im.src, 320, 400, sx, sy, sw, sh, q); }
  return url;
}
export const clearAll = () => { mem.clear(); try { indexedDB.deleteDatabase(DB); } catch (e) {} dbp = null; };

/* Profil rasmi: tanlash → doira ichida kesish → serverga yuklash. Rasm faqat egasiga ko'rinadi (/api/avatar, cookie orqali).
 * S.user.av — rasm versiyasi (0 = yo'q); URL ?v= bilan yangilanadi. */
import { $, $$, S, api, toast, modal } from './core.js';
import { loadImage, cropSquare } from './pfstore.js';

const SIZE = 240;
export const avUrl = () => (S.user && S.user.av ? '/api/avatar?v=' + S.user.av : '');
export const avLetter = name => ((name || S.user?.name || S.user?.email || '?').trim()[0] || '?').toUpperCase();

/** Tugun ichiga rasm yoki bosh harfni chizadi (aria-hidden bezak sifatida). */
export function paintAvatar(node, name) {
  if (!node) return;
  const u = avUrl();
  node.classList.toggle('has-img', !!u);
  if (u) { let im = node.querySelector('img'); if (!im) { node.textContent = ''; im = document.createElement('img'); im.alt = ''; im.decoding = 'async'; im.onerror = () => { node.classList.remove('has-img'); node.textContent = avLetter(name); }; node.appendChild(im); } if (im.getAttribute('src') !== u) im.src = u; }
  else node.textContent = avLetter(name);
}
const changed = () => document.dispatchEvent(new CustomEvent('unidoue:avatar'));

/** Faylni tanlatib, kesish oynasini ochadi; saqlansa true qaytaradi. */
export async function pickAvatar(file) {
  let im; try { im = await loadImage(file); } catch (e) { toast(e.message, 'err'); return false; }
  const v = { z: 1, cx: .5, cy: .5 };
  const p = modal({ title: 'Profil rasmini joylashtiring', body: `<div class="av-crop"><canvas width="${SIZE}" height="${SIZE}"></canvas><i class="av-ring" aria-hidden="true"></i></div><label class="pf-zoom">Yaqinlashtirish<input type="range" min="1" max="3" step="0.01" value="1"></label><p class="hint">Rasmni sudrab, yuzni doira o‘rtasiga keltiring.</p>`, actions: [{ label: 'Bekor qilish', value: 0 }, { label: 'Saqlash', value: 1, cls: 'primary' }] });
  const bg = $$('.modal-bg').pop(), cv = $('canvas', bg), g = cv.getContext('2d'), base = () => Math.max(SIZE / im.w, SIZE / im.h) * v.z;
  const paint = () => { const s = base(), sw = SIZE / s; v.cx = Math.min(Math.max(v.cx, sw / 2 / im.w), 1 - sw / 2 / im.w); v.cy = Math.min(Math.max(v.cy, sw / 2 / im.h), 1 - sw / 2 / im.h); g.fillStyle = '#fff'; g.fillRect(0, 0, SIZE, SIZE); g.drawImage(im.src, v.cx * im.w - sw / 2, v.cy * im.h - sw / 2, sw, sw, 0, 0, SIZE, SIZE); }; paint();
  let drag = null;
  cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, cx: v.cx, cy: v.cy }; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drag) return; const k = cv.getBoundingClientRect().width / SIZE, s = base() * k; v.cx = drag.cx - (e.clientX - drag.x) / s / im.w; v.cy = drag.cy - (e.clientY - drag.y) / s / im.h; paint(); };
  cv.onpointerup = cv.onpointercancel = () => (drag = null);
  $('input[type=range]', bg).oninput = e => { v.z = +e.target.value; paint(); };
  if (await p !== 1) { im.close(); return false; }
  let url; try { url = cropSquare(im, v); } finally { im.close(); }
  try { const r = await api('/api/avatar', 'POST', { img: url }); S.user.av = r.av; changed(); toast('Rasm yangilandi ✓'); return true; }
  catch (e) { toast(e.message, 'err'); return false; }
}
export async function removeAvatar() {
  try { await api('/api/avatar/delete', 'POST', {}); S.user.av = 0; changed(); toast('Rasm olib tashlandi.'); return true; }
  catch (e) { toast(e.message, 'err'); return false; }
}

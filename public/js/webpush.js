/* Web Push: brauzer tomoni (bogʻliqliksiz yordamchilar). Ilova (push.js) ham, admin sahifa (admin.js) ham foydalanadi. */
export const supported = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
/** iPhone/iPad: bildirishnoma faqat saytni “Bosh ekranga qoʻshib”, ilova sifatida ochganda ishlaydi. */
export const needsInstall = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator.standalone || (matchMedia && matchMedia('(display-mode: standalone)').matches));
export const keyBytes = b64u => { const s = atob(String(b64u).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(b64u).length / 4) * 4, '=')); return Uint8Array.from(s, c => c.charCodeAt(0)); };
const sameKey = (sub, b64u) => { try { const a = new Uint8Array(sub.options.applicationServerKey), b = keyBytes(b64u); return a.length === b.length && a.every((x, i) => x === b[i]); } catch (e) { return true; } };

/** Joriy holat: 'unsupported' | 'install' | 'denied' | 'on' | 'off' */
export async function status() {
  if (!supported()) return needsInstall() ? 'install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try { const reg = await navigator.serviceWorker.ready; return (await reg.pushManager.getSubscription()) ? 'on' : 'off'; } catch (e) { return 'off'; }
}
export async function current() {
  if (!supported()) return null;
  try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); } catch (e) { return null; }
}
/** Ruxsat soʻraydi va brauzerni obunaga yozadi. Qaytaradi: serverga yuboriladigan { endpoint, keys }. */
export async function subscribe(vapidKey) {
  if (!supported()) throw Object.assign(new Error('Bu brauzer bildirishnomalarni qo‘llab-quvvatlamaydi.'), { code: 'unsupported' });
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') throw Object.assign(new Error('Bildirishnoma ruxsati berilmadi.'), { code: 'denied' });
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub, vapidKey)) { await sub.unsubscribe(); sub = null; } // server kaliti oʻzgargan boʻlsa — qayta obuna
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey) });
  const j = sub.toJSON();
  if (!j.endpoint || !j.keys || !j.keys.p256dh || !j.keys.auth) throw new Error('Obuna maʼlumoti toʻliq emas.');
  return { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } };
}
/** Brauzerdagi obunani bekor qiladi. Qaytaradi: oʻchirilgan endpoint (yoki null). */
export async function unsubscribe() {
  const sub = await current(); if (!sub) return null;
  const ep = sub.endpoint; try { await sub.unsubscribe(); } catch (e) {}
  return ep;
}

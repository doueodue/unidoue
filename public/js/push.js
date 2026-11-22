/* Foydalanuvchi bildirishnomalari: obuna boshqaruvi (profil sahifasi va chiqishda ishlatiladi). Brauzer qismi — webpush.js */
import { api, S } from './core.js';
import * as W from './webpush.js';
export const { supported, needsInstall, status } = W;

export async function enable() {
  const key = S.account && S.account.push ? S.account.push.key : (await api('/api/push/key')).key;
  const sub = await W.subscribe(key);
  const r = await api('/api/push/subscribe', 'POST', sub);
  S.account = r.account; return r.account;
}
export async function disable() {
  const ep = await W.unsubscribe();
  const r = await api('/api/push/unsubscribe', 'POST', { endpoint: ep || '-' });
  S.account = r.account; return r.account;
}
export const test = () => api('/api/push/test', 'POST', {}).then(r => { S.account = r.account; return r; });
/** Brauzerda obuna bor, lekin serverda yoʻq boʻlsa (masalan, boshqa hisob olgan) — jimgina qayta bogʻlaydi. */
export async function heal() {
  const sub = await W.current(); if (!sub || Notification.permission !== 'granted') return;
  const j = sub.toJSON(); if (!j.keys) return;
  try { const r = await api('/api/push/subscribe', 'POST', { endpoint: j.endpoint, keys: j.keys }); S.account = r.account; } catch (e) {}
}
/** Hisobdan chiqishdan oldin: bu qurilma boshqa foydalanuvchi hisobiga xabar olib yurmasin. Tarmoq sekin boʻlsa 2.5 soniyadan keyin kutmaymiz. */
export function forget() {
  if (!W.supported()) return Promise.resolve();
  return Promise.race([W.current().then(sub => sub ? disable() : null).catch(() => {}), new Promise(r => setTimeout(r, 2500))]);
}

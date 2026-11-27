/* Faollik «ping»i: sahifa ochiq turganda ~40 soniyada bir marta serverga yuboriladi — qaysi sahifada, oyna ochiqmi, oxirgi harakatdan necha soniya o‘tdi.
   Administrator shu orqali «hozir kim online» va «kim qachon kirib-chiqdi» ni ko‘radi (maxfiylik siyosatida e’lon qilingan). Matn, forma, kursor, bosilgan tugmalar YUBORILMAYDI.
   Oyna identifikatori (tid) faqat shu oynaning sessionStorage ida turadi: tarmoq/IP bilan birga yozilmaydi, oyna yopilsa unutiladi. */
const rnd = () => { try { return [...crypto.getRandomValues(new Uint8Array(9))].map(b => b.toString(16).padStart(2, '0')).join(''); } catch (e) { return Math.random().toString(16).slice(2, 12) + Date.now().toString(16).slice(-8); } };
let tid = ''; try { tid = sessionStorage.getItem('ud:tid') || ''; } catch (e) {}
if (!/^[a-z0-9]{10,32}$/i.test(tid)) { tid = rnd(); try { sessionStorage.setItem('ud:tid', tid); } catch (e) {} }
let lastAct = Date.now(), timer = 0, wait = 0, off = false;
for (const ev of ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel']) addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true });
/** Sahifa belgisi: '/' → landing; '/app' → #/bo‘lim; boshqa sahifalar → fayl nomi. Faqat [a-z0-9_-/] */
export function pageId() {
  const p = location.pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return 'landing';
  if (p === '/app') return (location.hash.replace(/^#\/?/, '').split('?')[0] || 'dashboard').toLowerCase().replace(/[^a-z0-9_\-\/]/g, '').slice(0, 32) || 'dashboard';
  return p.slice(1).toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 32) || 'other';
}
function send(bye) {
  if (off) return;
  const body = JSON.stringify(bye ? { tid, bye: 1 } : { tid, p: pageId(), v: document.visibilityState === 'visible' ? 1 : 0, i: Math.min(3600, Math.round((Date.now() - lastAct) / 1000)) });
  try {
    fetch('/api/ping', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body })
      .then(r => { if (r.status === 404 || r.status === 403 && !bye) off = true; return bye ? null : r.json(); }) // server bu funksiyani bilmasa yoki sayt manzili bloklangan bo‘lsa — to‘xtaymiz
      .then(j => { if (j && j.blocked) document.dispatchEvent(new CustomEvent('unidoue:blocked', { detail: j.block || {} })); })
      .catch(() => {});
  } catch (e) {}
}
const soon = () => { clearTimeout(wait); wait = setTimeout(() => send(), 500); };
addEventListener('hashchange', soon);
document.addEventListener('visibilitychange', soon);
addEventListener('pageshow', soon);
addEventListener('pagehide', () => send(true));
timer = setInterval(() => send(), 40000);
setTimeout(() => send(), 900);

/* Esc tugmasi — "orqaga".
   Tartib: 1) ochiq oyna (modal) yopiladi; 2) boshqa ochiq panel/menyu/ro‘yxat bo‘lsa, o‘zining Esc'i ishlaydi;
   3) matn maydonida bo‘lsa — faqat fokus olinadi; 4) aks holda ilova ichidagi oldingi sahifaga qaytadi
   (ilovadan tashqariga chiqib ketmaydi: tarix boshida bo‘lsa Bosh panelga). */
const KEY = 'udi'; // history.state[KEY] — ilova ichidagi sahifa tartib raqami
let last = -1; // -1: hali birorta sahifa belgilanmagan (ilovaga kirilgan birinchi sahifa 0 oladi)

/** Har bir yangi sahifaga tartib raqami beradi (orqaga/oldinga yurilganda mavjud raqam saqlanadi). */
export function markRoute() {
  const s = history.state;
  if (s && typeof s[KEY] === 'number') { last = s[KEY]; return; }
  try { history.replaceState({ ...(s || {}), [KEY]: last + 1 }, '', location.href); last = history.state[KEY]; } catch (e) {}
}

const typing = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const visible = el => !!el && el.getClientRects().length > 0;

let on = false;
export function initEsc() {
  if (on) return; on = true;
  // capture: boshqa Esc ishlovchilari panelni yopishidan OLDIN holatni ko‘ramiz
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    const bg = [...document.querySelectorAll('.modal-bg:not(.out)')].pop();
    if (bg) { e.preventDefault(); e.stopPropagation(); bg.click(); return; } // modal o‘z "bekor" yo‘li bilan yopiladi
    if (document.body.classList.contains('nav-open')) { e.preventDefault(); document.body.classList.remove('nav-open'); return; }
    // ochiq panel, bildirishnomalar, fikr oynasi, tanlov ro‘yxati, kalendar, tabrik — ular o‘zi yopiladi
    if (document.querySelector('[aria-expanded="true"]') || [...document.querySelectorAll('[aria-modal="true"],.np,.fbp,.pop,.cal')].some(visible)) return;
    const a = document.activeElement;
    if (typing(a)) { a.blur(); return; }
    const st = history.state, i = st && typeof st[KEY] === 'number' ? st[KEY] : 0;
    if (i > 0) { e.preventDefault(); history.back(); }
    else if (!/^#\/?(dashboard)?$/.test(location.hash)) { e.preventDefault(); location.hash = '#/dashboard'; }
  }, true);
}

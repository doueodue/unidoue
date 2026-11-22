/* Google Play (TWA) ichida ochilganmi?
 * Play toʻlov siyosati: ilova ichida raqamli tovar (tarif) uchun Payme/Click kabi tashqi toʻlovga yoʻnaltirib boʻlmaydi,
 * shuning uchun Play ilovasida toʻlov va narx tugmalari koʻrsatilmaydi (veb-sayt va oddiy PWA oʻzgarmaydi).
 * Aniqlash: TWA birinchi ochilishida document.referrer "android-app://<paket>" boʻladi; qayta yuklashda yoʻqolmasligi uchun
 * sessionStorage'da saqlanadi. Zaxira: start_url ga ?src=twa qoʻshish (PWABuilder/Bubblewrap "Start URL"). */
const KEY = 'ud:play';
function detect() {
  try {
    if (sessionStorage.getItem(KEY) === '1') return true;
    const q = new URLSearchParams(location.search).get('src') === 'twa';
    if (q || String(document.referrer || '').startsWith('android-app://')) { sessionStorage.setItem(KEY, '1'); return true; }
  } catch (e) {}
  return false;
}
export const inPlay = detect();

/* Eski brauzerlar uchun moslik: color-mix().
   Chromium 111 dan eski brauzerlar (eski Android WebView, Mi Browser, eski Chrome) color-mix() ni tushunmaydi.
   CSS e’lonida var() bo‘lsa, brauzer uni yuklashda rad etmaydi, lekin hisoblash paytida butun e’lon bekor bo‘ladi:
   masalan, yon menyu foni shaffof bo‘lib, ostidagi sahifa ko‘rinib qoladi. Shunday brauzerlarda har bir CSS qoidasidagi
   color-mix(in srgb, A p%, B) ni ulushi katta rangga (A yoki B) almashtiramiz. Yangi brauzerlarda bu fayl hech narsa qilmaydi.
   Faqat CSSOM o‘zgaradi (qayta yuklash yo‘q, CSP ga ta’sir qilmaydi). */
(function () {
  'use strict';
  var FN = 'color-mix(';
  try { if (!window.CSS || !CSS.supports || CSS.supports('color', FN + 'in srgb, red 50%, blue)')) return; } catch (e) { return; }
  document.documentElement.classList.add('no-cmix');

  /** Qavslar ichidagi vergul bo‘yicha emas, faqat yuqori darajadagi vergul bo‘yicha bo‘ladi. */
  function args(s) {
    var out = [], d = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '(') d++; else if (ch === ')') d--;
      if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }
  function part(x) { var m = /\s(-?[\d.]+)%\s*$/.exec(x); return m ? [x.slice(0, m.index).trim(), +m[1]] : [x.trim(), null]; }
  /** color-mix(in <makon>, A [p%], B [q%]) → ulushi kattaroq rang. */
  function pick(inner) {
    var a = args(inner); if (a.length < 3) return a[a.length - 1] || 'transparent';
    var A = part(a[1]), B = part(a[2]), w = A[1] != null ? A[1] : B[1] != null ? 100 - B[1] : 50;
    return w >= 50 ? A[0] : B[0];
  }
  /** Matndagi hamma color-mix(...) ni (ichma-ich bo‘lsa ichkaridan boshlab) almashtiradi. */
  function fix(css) {
    for (var guard = 0; css.indexOf(FN) >= 0 && guard < 2000; guard++) {
      var i = css.lastIndexOf(FN), j = i + FN.length, d = 1;
      for (; j < css.length; j++) { if (css[j] === '(') d++; else if (css[j] === ')' && --d === 0) break; }
      if (j >= css.length) break;
      css = css.slice(0, i) + pick(css.slice(i + FN.length, j)) + css.slice(j + 1);
    }
    return css;
  }
  function walk(rules) {
    for (var k = 0; k < rules.length; k++) {
      var r = rules[k];
      try {
        if (r.style && r.style.cssText.indexOf(FN) >= 0) r.style.cssText = fix(r.style.cssText);
        if (r.cssRules) walk(r.cssRules); // @media, @supports, @keyframes ichidagilar ham
      } catch (e) { /* bitta qoida xatosi qolganlariga to‘sqinlik qilmasin */ }
    }
  }
  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  function patch(sheet) {
    if (!sheet || (seen && seen.has(sheet))) return;
    var rules; try { rules = sheet.cssRules; } catch (e) { return; } // boshqa domen (Google Fonts): tegmaymiz
    if (seen) seen.add(sheet);
    walk(rules);
  }
  function hook(el) {
    if (el.tagName === 'STYLE') return patch(el.sheet);
    if (el.tagName !== 'LINK' || !/stylesheet/i.test(el.rel)) return;
    var ok = false; try { ok = !!(el.sheet && el.sheet.cssRules); } catch (e) {}
    if (ok) patch(el.sheet); else el.addEventListener('load', function () { patch(el.sheet); });
  }
  function all() { var l = document.querySelectorAll('link[rel~="stylesheet"],style'); for (var i = 0; i < l.length; i++) hook(l[i]); }
  all();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all);
  // Keyin qo‘shiladigan uslublar (masalan, portfolio.css) ham tuzatiladi
  try {
    new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) hook(n); }); }); })
      .observe(document.head, { childList: true });
  } catch (e) {}
})();

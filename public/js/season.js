/* Fasl mavzusi: oyga qarab avtomatik (Toshkent vaqti). ?season=kuz|qish|bahor|yoz bilan sinab koʻrish mumkin. */
(function () {
  var NAMES = ['qish', 'bahor', 'yoz', 'kuz'], s = '';
  try {
    var q = new URLSearchParams(location.search).get('season');
    if (q && NAMES.indexOf(q) >= 0) s = q;
    else {
      var m = +new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tashkent', month: 'numeric' }).format(new Date());
      s = m === 12 || m <= 2 ? 'qish' : m <= 5 ? 'bahor' : m <= 8 ? 'yoz' : 'kuz';
    }
  } catch (e) { s = 'kuz'; }
  document.documentElement.setAttribute('data-season', s);
  var tc = { kuz: '#2b1408', qish: '#0a1236', bahor: '#06281d', yoz: '#06204a' }[s], mt = document.querySelector('meta[name=theme-color]');
  if (mt && tc) mt.setAttribute('content', tc);
})();
/* Kuzda barglar tushib turadi (yengil CSS animatsiya; "harakatni kamaytirish" yoqilgan boʻlsa koʻrsatilmaydi). */
(function () {
  if (document.documentElement.getAttribute('data-season') !== 'kuz') return;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  var COL = ['#e8741a', '#c8420f', '#e3a61e', '#a8360c', '#d98a1c'];
  function go() {
    var box = document.createElement('div'); box.className = 'leaves'; box.setAttribute('aria-hidden', 'true');
    var n = innerWidth < 700 ? 8 : 14;
    var NS = 'http://www.w3.org/2000/svg', MAPLE = 'M50 4L58 22 72 15 68 36 89 29 80 47 97 53 78 63 83 72 58 67 56 94H44L42 67 17 72 22 63 3 53 20 47 11 29 32 36 28 15 42 22Z',
        OAK = 'M50 6C74 22 82 52 50 90 18 52 26 22 50 6Z', V1 = 'M50 94V30M50 66L30 50M50 66L70 50M50 52L36 38M50 52L64 38', V2 = 'M50 92V16M50 70L32 54M50 70L68 54M50 48L34 34M50 48L66 34';
    for (var i = 0; i < n; i++) {
      var maple = i % 3 !== 2, sz = 22 + Math.random() * 20, col = COL[i % COL.length],
          l = document.createElementNS(NS, 'svg'), a = document.createElementNS(NS, 'path'), v = document.createElementNS(NS, 'path');
      l.setAttribute('viewBox', '0 0 100 100'); l.setAttribute('class', 'lf');
      a.setAttribute('d', maple ? MAPLE : OAK); a.setAttribute('fill', col);
      v.setAttribute('d', maple ? V1 : V2); v.setAttribute('stroke', 'rgba(90,30,5,.55)'); v.setAttribute('stroke-width', '3'); v.setAttribute('stroke-linecap', 'round'); v.setAttribute('fill', 'none');
      l.appendChild(a); l.appendChild(v);
      l.style.left = (Math.random() * 100) + '%'; l.style.width = sz + 'px'; l.style.height = sz + 'px';
      l.style.animationDuration = (12 + Math.random() * 12) + 's, ' + (3.5 + Math.random() * 3) + 's';
      l.style.animationDelay = (-Math.random() * 20) + 's, ' + (-Math.random() * 5) + 's';
      box.appendChild(l);
    }
    document.body.appendChild(box);
  }
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

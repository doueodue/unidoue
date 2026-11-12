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
  var COL = ['#f08a24', '#d9611a', '#e0a526', '#b84a12', '#c97a1e'];
  function go() {
    var box = document.createElement('div'); box.className = 'leaves'; box.setAttribute('aria-hidden', 'true');
    var n = innerWidth < 700 ? 8 : 14;
    for (var i = 0; i < n; i++) {
      var l = document.createElement('i'), sz = 12 + Math.random() * 14;
      l.style.left = (Math.random() * 100) + '%';
      l.style.width = sz + 'px'; l.style.height = sz * 0.8 + 'px';
      l.style.background = COL[i % COL.length];
      l.style.animationDuration = (11 + Math.random() * 12) + 's, ' + (3 + Math.random() * 3) + 's';
      l.style.animationDelay = (-Math.random() * 20) + 's, ' + (-Math.random() * 5) + 's';
      box.appendChild(l);
    }
    document.body.appendChild(box);
  }
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

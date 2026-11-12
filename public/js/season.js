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

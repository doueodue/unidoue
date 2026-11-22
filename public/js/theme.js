/* Kunduzgi / tungi rejim. Tanlov brauzerda saqlanadi (qabul:theme); tanlanmagan boʻlsa qurilma sozlamasiga (prefers-color-scheme) ergashadi.
   <head> ichida season.js dan keyin yuklanadi — sahifa chizilishidan oldin rejim qoʻyiladi, shuning uchun “chaqnash” boʻlmaydi. */
(function () {
  var KEY = 'qabul:theme', root = document.documentElement, mt = document.querySelector('meta[name=theme-color]'), light = mt ? mt.getAttribute('content') : '', mq = null, timer = 0;
  try { mq = matchMedia('(prefers-color-scheme: dark)'); } catch (e) {}
  function saved() { try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : ''; } catch (e) { return ''; } }
  function get() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function paint(m) {
    root.setAttribute('data-theme', m);
    if (mt) mt.setAttribute('content', m === 'dark' ? (root.getAttribute('data-season') === 'kuz' ? '#150b06' : '#070c22') : light);
    var b = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < b.length; i++) b[i].setAttribute('aria-checked', m === 'dark' ? 'true' : 'false');
  }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  /* Tugma bosilgan joydan “doira” boʻlib yangi rejim yoyiladi (View Transitions API); qoʻllab-quvvatlanmasa — oddiy rang oʻtishi. */
  function reveal(m, from) {
    var r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2,
        R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt');
    var tr = document.startViewTransition(function () { paint(m); });
    tr.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    var end = function () { root.classList.remove('vt'); };
    tr.finished.then(end, end);
  }
  function set(m, remember, from) {
    if (m !== 'dark' && m !== 'light') return;
    if (remember) { try { localStorage.setItem(KEY, m); } catch (e) {} }
    if (m === get()) return;
    var vt = from && document.startViewTransition && !reduced();
    if (vt) { try { reveal(m, from); } catch (e) { vt = false; root.classList.remove('vt'); } }
    if (!vt) {
      root.classList.add('theme-anim'); clearTimeout(timer); timer = setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
      paint(m);
    }
    document.dispatchEvent(new CustomEvent('unidoue:theme', { detail: m }));
  }
  paint(saved() || (mq && mq.matches ? 'dark' : 'light'));
  if (mq && mq.addEventListener) mq.addEventListener('change', function (e) { if (!saved()) set(e.matches ? 'dark' : 'light', false); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (b) set(get() === 'dark' ? 'light' : 'dark', true, b);
  });
  window.UniTheme = { get: get, set: function (m) { set(m, true); }, toggle: function () { set(get() === 'dark' ? 'light' : 'dark', true); } };
})();

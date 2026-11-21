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
  function set(m, remember) {
    if (m !== 'dark' && m !== 'light') return;
    if (remember) { try { localStorage.setItem(KEY, m); } catch (e) {} }
    if (m === get()) return;
    root.classList.add('theme-anim'); clearTimeout(timer); timer = setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    paint(m);
    document.dispatchEvent(new CustomEvent('unidoue:theme', { detail: m }));
  }
  paint(saved() || (mq && mq.matches ? 'dark' : 'light'));
  if (mq && mq.addEventListener) mq.addEventListener('change', function (e) { if (!saved()) set(e.matches ? 'dark' : 'light', false); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (b) set(get() === 'dark' ? 'light' : 'dark', true);
  });
  window.UniTheme = { get: get, set: function (m) { set(m, true); }, toggle: function () { set(get() === 'dark' ? 'light' : 'dark', true); } };
})();

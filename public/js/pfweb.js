/* Portfolio veb-sayti effektlari. Klassik skript (modul emas): ko'rinishda <script src>, yuklab olinadigan faylda ichiga joylanadi.
 * Sahifa skriptsiz ham to'liq ko'rinadi — bu yerda faqat jonlantirish: reveal, sanash, yozuv, kursor yoritishi, 3D, parallaks, rejim almashtirish.
 * <html> klasslari: fx-reveal fx-count fx-progress fx-marquee fx-spot fx-tilt fx-parallax fx-type fx-glow; dk / lt / sys — rang rejimi. */
(function () {
  'use strict';
  var d = document, h = d.documentElement, b = d.body;
  var $ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var fx = function (n) { return h.classList.contains('fx-' + n); };
  var still = b.classList.contains('nofx') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  h.classList.add('js');

  /* ---- rang rejimi ---- */
  var th = $('.th')[0];
  if (th) {
    th.addEventListener('click', function () {
      var os = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
      var dark = h.classList.contains('dk') || (h.classList.contains('sys') && !h.classList.contains('lt') && os);
      h.classList.remove('dk', 'lt');
      h.classList.add(dark ? 'lt' : 'dk');
    });
  }

  /* ---- ochilish (reveal) ---- */
  var shown = function (el) { el.classList.add('in'); };
  var revealAll = function () { $('[data-r],h1[data-h],.hero .pw').forEach(shown); };
  if (still || !('IntersectionObserver' in window)) revealAll();
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { shown(e.target); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $('[data-r]').forEach(function (el) { io.observe(el); });
    var go = function () { $('h1[data-h],.hero .pw').forEach(shown); };
    if (d.fonts && d.fonts.ready) { d.fonts.ready.then(function () { requestAnimationFrame(go); }); setTimeout(go, 900); } else setTimeout(go, 80);
  }
  window.addEventListener('beforeprint', revealAll);

  /* ---- joriy bo'lim belgisi (nav) ---- */
  var links = $('.nv .nl a, .sl a'), secs = $('main section[id]');
  if (secs.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    secs.forEach(function (s) { so.observe(s); });
  }

  /* ---- sahifa o'tish chizig'i + parallaks ---- */
  var bar = $('.pgb')[0], par = fx('parallax'), tick = false;
  var onScroll = function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      tick = false;
      var y = window.pageYOffset || h.scrollTop || 0;
      if (bar) { var m = (h.scrollHeight - h.clientHeight) || 1; bar.style.width = Math.min(100, y / m * 100) + '%'; }
      if (par && !still) b.style.setProperty('--py', Math.min(y, 1000));
    });
  };
  if (bar || (par && !still)) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  /* ---- raqamlarni sanash ---- */
  if (fx('count')) {
    var run = function (el) {
      var t = el.textContent, m = /^(\D*)(\d+(?:[.,]\d+)?)(.*)$/.exec(t);
      if (!m) return;
      var raw = m[2], dec = (raw.split(/[.,]/)[1] || '').length, sep = raw.indexOf(',') > -1 ? ',' : '.', to = parseFloat(raw.replace(',', '.')), t0 = null, dur = 1300;
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur), v = to * (1 - Math.pow(1 - k, 3));
        el.textContent = m[1] + v.toFixed(dec).replace('.', sep) + m[3];
        if (k < 1) requestAnimationFrame(step); else el.textContent = t;
      };
      el.textContent = m[1] + (0).toFixed(dec).replace('.', sep) + m[3];
      requestAnimationFrame(step);
    };
    var ct = $('[data-c]');
    if (still || !('IntersectionObserver' in window)) { /* qiymatlar o'z holicha qoladi */ }
    else {
      var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } }); }, { threshold: 0.6 });
      ct.forEach(function (el) { co.observe(el); });
    }
  }

  /* ---- yozib chiqish (headline) ---- */
  if (fx('type') && !still) {
    var hl = $('.hl.ty')[0];
    if (hl) {
      var full = hl.textContent, i = 0;
      hl.setAttribute('aria-label', full); hl.style.minHeight = hl.offsetHeight + 'px'; hl.textContent = '';
      var typeIt = function () {
        hl.textContent = full.slice(0, ++i);
        if (i < full.length) setTimeout(typeIt, 26 + Math.random() * 34);
      };
      setTimeout(typeIt, 850);
    }
  }

  /* ---- kursor: yoritish, 3D qiyalik ---- */
  if (fine && !still) {
    if (fx('spot')) {
      $('.e').forEach(function (el) {
        el.addEventListener('pointermove', function (ev) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (ev.clientX - r.left) + 'px'); el.style.setProperty('--my', (ev.clientY - r.top) + 'px'); });
      });
    }
    if (fx('glow')) {
      var cg = $('.cg')[0], px = 0, py = 0, f = false;
      if (cg) {
        window.addEventListener('pointermove', function (ev) {
          px = ev.clientX; py = ev.clientY;
          if (f) return; f = true;
          requestAnimationFrame(function () { f = false; cg.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)'; });
        }, { passive: true });
      }
    }
    if (fx('tilt')) {
      var pw = $('.pw')[0], inn = pw && $('.in', pw)[0];
      if (inn) {
        pw.addEventListener('pointermove', function (ev) {
          var r = pw.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
          inn.style.transform = 'perspective(900px) rotateY(' + (x * 16).toFixed(2) + 'deg) rotateX(' + (-y * 14).toFixed(2) + 'deg) scale3d(1.02,1.02,1.02)';
        });
        pw.addEventListener('pointerleave', function () { inn.style.transform = ''; });
      }
    }
  }

  /* ---- galereya: klaviatura ---- */
  d.addEventListener('keydown', function (ev) {
    var m = /^#lb(\d+)$/.exec(location.hash || '');
    if (!m) return;
    var n = $('.lb').length, i = +m[1];
    if (ev.key === 'ArrowRight') location.hash = '#lb' + ((i + 1) % n);
    else if (ev.key === 'ArrowLeft') location.hash = '#lb' + ((i + n - 1) % n);
    else if (ev.key === 'Escape') location.hash = '#gallery';
  });
})();

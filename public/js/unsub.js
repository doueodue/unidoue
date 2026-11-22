(function () {
  var q = new URLSearchParams(location.search), u = q.get('u') || '', s = q.get('s') || '';
  var t = document.getElementById('ut'), sub = document.getElementById('us'), m = document.getElementById('um'), b = document.getElementById('uo'), off = true;
  if (!u || !s) { m.className = 'msg err'; m.textContent = 'Havola noto‘g‘ri. Xatdagi havolani qaytadan oching.'; b.disabled = true; }
  b.onclick = function () {
    b.disabled = true; m.className = 'msg'; m.textContent = '';
    fetch('/api/mail/unsub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ u: u, s: s, on: !off }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (!r.ok) { m.className = 'msg err'; m.textContent = r.j.error || 'Xatolik yuz berdi.'; b.disabled = false; return; }
        off = !r.j.on;
        t.textContent = off ? 'Tayyor' : 'Xatlar qayta yoqildi';
        sub.textContent = off ? 'Endi UniDoue yangiliklarini emailga yubormaymiz. Parol tiklash va tasdiqlash xatlari baribir keladi.' : 'UniDoue yangiliklari yana emailingizga keladi.';
        b.textContent = off ? 'Qayta yoqish' : 'Xatlarni to‘xtatish'; b.className = off ? 'btn' : 'btn primary'; b.disabled = false;
      })
      .catch(function () { m.className = 'msg err'; m.textContent = 'Serverga ulanib bo‘lmadi.'; b.disabled = false; });
  };
})();

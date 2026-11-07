(function () {
  var token = new URLSearchParams(location.search).get('token') || '';
  var f = document.getElementById('rf'), m = document.getElementById('rm'), b = document.getElementById('rb');
  if (!token) { m.className = 'msg err'; m.textContent = 'Havola noto‘g‘ri. Parolni tiklashni qaytadan so‘rang.'; b.disabled = true; }
  f.onsubmit = function (e) {
    e.preventDefault();
    var pw = document.getElementById('np').value;
    m.className = 'msg err';
    if (pw.length < 8) { m.textContent = 'Parol kamida 8 ta belgidan iborat bo‘lsin.'; return; }
    b.disabled = true; m.textContent = '';
    fetch('/api/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token, password: pw }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) { m.className = 'msg ok'; m.textContent = 'Parol yangilandi. Kirishga yo‘naltirilmoqdasiz…'; setTimeout(function () { location.href = '/app'; }, 1500); }
        else { m.textContent = r.j.error || 'Xatolik yuz berdi.'; b.disabled = false; }
      })
      .catch(function () { m.textContent = 'Serverga ulanib bo‘lmadi.'; b.disabled = false; });
  };
})();

'use strict';
/* Faollik: kim saytga qachon kirdi va chiqdi (tashriflar), hozir kim online va qanday holatda, hamda hisob hodisalari jurnali.
 *
 *  Tashrif (visit) — bitta SEANS (qurilma) ning uzluksiz faolligi: birinchi «ping» dan to oxirgisigacha. Brauzer sahifa ochiq turganda
 *  har ~40 soniyada /api/ping yuboradi (qaysi sahifada, oynasi ochiqmi, oxirgi harakatdan necha soniya oʻtgani). Bitta seansning bir nechta
 *  oynasi (tab) bitta tashrifni tashkil qiladi. Oynalar yopilgach yoki ~2.5 daqiqa ping kelmasa tashrif yopiladi.
 *  Mehmonlar (hisobsiz) faqat xotirada sanaladi (jurnalga yozilmaydi). Hodisa (event) — kirish, chiqish, roʻyxatdan oʻtish, xato parol va h.k.
 *  Faqat administratorga koʻrinadi; parol, token, kodlar HECH QACHON yozilmaydi. Jurnal cheklangan (eng eskilari oʻchadi). */
const crypto = require('crypto');

const clampInt = (v, d, lo, hi) => Math.min(Math.max(parseInt(v, 10) || d, lo), hi);
const CFG = {
  VISITS_MAX: clampInt(process.env.ACTIVITY_VISITS_MAX, 3000, 100, 30000),
  EVENTS_MAX: clampInt(process.env.ACTIVITY_EVENTS_MAX, 3000, 100, 30000),
  OFFLINE_MS: clampInt(process.env.ACTIVITY_OFFLINE_MS, 150000, 1000, 3600000), // shuncha vaqt ping kelmasa — oflayn
  GRACE_MS: clampInt(process.env.ACTIVITY_GRACE_MS, 15000, 0, 120000), // oyna yopildi (pagehide): sahifa almashinuvi/qayta yuklash boʻlishi mumkin — shuncha kutiladi
  PRES_MAX: 5000, PER_IP: 25, PAGES: 12
};
const PAGE_RE = /^[a-z0-9][a-z0-9:_\-\/]{0,31}$/i, TID_RE = /^[a-z0-9]{10,32}$/i;
const MASK = e => { e = String(e || ''); const i = e.lastIndexOf('@'); return i < 1 ? '' : e[0] + '***' + e.slice(i); };

function uaShort(ua) {
  ua = String(ua || '');
  const br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return [br, os].filter(Boolean).join(' · ').slice(0, 40);
}

/** db — { visits:[], activity:[], sessions:{}, peak:{} }; save — debounced saqlash; today — () => 'YYYY-MM-DD' (Toshkent); clock — test uchun */
function create(db, save, today, clock) {
  const nowMs = clock || Date.now;
  const PRES = new Map(); // tid → { tid, sh, uid, ip, d, pg, vis, idle, t, since, gone }   (faqat xotira)
  const VIS = new Map();  // seans xeshi → ochiq tashrif (db.visits ichidagi obyekt)
  const ipc = new Map();  // ip → shu IP dagi oynalar soni (mehmon sonini cheklash)
  for (const v of db.visits) delete v.open; // server qayta ishga tushdi: ochiq qolgan tashriflar oxirgi maʼlum vaqtida yopilgan hisoblanadi

  const trim = () => { if (db.visits.length > CFG.VISITS_MAX) db.visits.splice(0, db.visits.length - CFG.VISITS_MAX); if (db.activity.length > CFG.EVENTS_MAX) db.activity.splice(0, db.activity.length - CFG.EVENTS_MAX); };
  const del = tid => { const e = PRES.get(tid); if (!e) return; PRES.delete(tid); const n = (ipc.get(e.ip) || 1) - 1; if (n > 0) ipc.set(e.ip, n); else ipc.delete(e.ip); };
  const live = (e, t) => !e.gone && t - e.t <= CFG.OFFLINE_MS;
  const stateOf = (e, t) => { if (!e.vis) return 'bg'; return e.idle + Math.max(0, t - e.t) / 1000 >= 60 ? 'idle' : 'act'; }; // act — faol, idle — oyna ochiq lekin harakatsiz, bg — boshqa oynada/fonda

  function closeVisit(sh, v, why, at) {
    VIS.delete(sh); delete v.open; v.r = why;
    if (at) v.t1 = Math.max(v.t0, at, v.t1 || 0);
    save();
  }

  /** Bitta ping. u — seans egasi (yoki null: mehmon), sh — seans xeshi. Qaytaradi: false (cheklov), true. */
  function ping(o) {
    const t = nowMs();
    if (!TID_RE.test(o.tid || '')) return false;
    const tid = String(o.tid).toLowerCase(), ip = String(o.ip || '').slice(0, 64);
    let e = PRES.get(tid);
    if (!e) {
      if (PRES.size >= CFG.PRES_MAX || (ipc.get(ip) || 0) >= CFG.PER_IP) return false;
      e = { tid, since: t, ip }; PRES.set(tid, e); ipc.set(ip, (ipc.get(ip) || 0) + 1);
    } else if (e.ip !== ip) { // oyna boshqa IP ga oʻtdi (mobil tarmoq/VPN): hisobni yangilaymiz
      const n = (ipc.get(e.ip) || 1) - 1; if (n > 0) ipc.set(e.ip, n); else ipc.delete(e.ip); ipc.set(ip, (ipc.get(ip) || 0) + 1); e.ip = ip;
    }
    const u = o.u || null, sh = u && o.sh ? o.sh : '';
    e.uid = u ? u.id : ''; e.sh = sh; e.d = uaShort(o.ua); e.vis = o.vis ? 1 : 0; e.idle = Math.min(Math.max(o.idle | 0, 0), 86400); e.t = t; delete e.gone;
    let pg = String(o.pg || '').slice(0, 32); if (!PAGE_RE.test(pg)) pg = '';
    if (!u && pg && pg !== 'landing' && !/^(privacy|reset|unsub|delete-account|pricing)$/.test(pg)) pg = 'auth'; // hisobsiz kishi ilova ichida emas — kirish oynasida
    e.pg = pg;
    if (sh) {
      let v = VIS.get(sh);
      if (v && v.uid !== u.id) { closeVisit(sh, v, 'idle', v.t1); v = null; } // seans boshqa foydalanuvchiga tegishli boʻlib qoldi (kutilmagan)
      if (!v) { v = { id: crypto.randomBytes(5).toString('hex'), uid: u.id, em: u.email, nm: u.name, ip, d: e.d, t0: t, t1: t, n: 0, pp: [], open: 1 }; db.visits.push(v); VIS.set(sh, v); trim(); save(); }
      v.t1 = t; v.n++; v.ip = ip; delete v.r; if (e.d) v.d = e.d;
      if (pg && v.pp[v.pp.length - 1] !== pg) { v.pp.push(pg); if (v.pp.length > CFG.PAGES) v.pp.shift(); }
    }
    return true;
  }

  /** Oyna yopildi (pagehide). Sahifa almashinuvi boʻlishi mumkin: oyna GRACE_MS ichida qayta ping bermasa — chiqdi. */
  function bye(tid) {
    const e = PRES.get(String(tid || '').toLowerCase()); if (!e) return;
    const t = nowMs(); e.gone = 1; e.t = t;
    const v = e.sh && VIS.get(e.sh); if (v) { v.t1 = Math.max(v.t1, t); v.r = 'bye'; } // yopilsa sababi «oyna yopildi» (boshqa oyna ping bersa, ping() bu belgini olib tashlaydi)
  }

  /** Muddati oʻtgan oynalarni olib tashlaydi, oyna qolmagan yoki seansi tugagan tashriflarni yopadi, eng yuqori onlaynni belgilaydi. */
  function sweep() {
    const t = nowMs();
    for (const [tid, e] of PRES) if (e.gone ? t - e.t > CFG.GRACE_MS : t - e.t > CFG.OFFLINE_MS) del(tid);
    const alive = new Set(); for (const e of PRES.values()) if (e.sh) alive.add(e.sh);
    for (const [sh, v] of [...VIS]) {
      if (!db.sessions[sh]) closeVisit(sh, v, 'revoked', v.t1);
      else if (!alive.has(sh)) closeVisit(sh, v, v.r === 'bye' ? 'bye' : 'idle', v.t1);
    }
    const n = counts(t).total, d = today(t);
    if (n > 0 && (!db.peak || db.peak.d !== d || n > db.peak.n)) { db.peak = { d, n, t }; save(); }
  }

  /** Seans tugadi (chiqish tugmasi): tashrif darhol yopiladi. */
  function closeSession(sh, why) { const v = VIS.get(sh); if (v) closeVisit(sh, v, why || 'logout', nowMs()); for (const [tid, e] of [...PRES]) if (e.sh === sh) del(tid); }
  /** Foydalanuvchining barcha tashriflari yopiladi (bloklash, hisobni oʻchirish). */
  function closeUser(uid, why) { const t = nowMs(); for (const [sh, v] of [...VIS]) if (v.uid === uid) closeVisit(sh, v, why || 'revoked', t); for (const [tid, e] of [...PRES]) if (e.uid === uid) del(tid); }
  /** Hisob oʻchirilganda shu foydalanuvchining tashrif va hodisalari jurnaldan olib tashlanadi. */
  function forget(uid) { closeUser(uid, 'delete'); db.visits = db.visits.filter(v => v.uid !== uid); db.activity = db.activity.filter(x => x.uid !== uid); }

  /** Hodisa yozuvi. u — foydalanuvchi (yoki null), x — qisqa izoh. */
  function event(kind, u, ip, ua, x) {
    const r = { t: nowMs(), k: String(kind).slice(0, 24), uid: u ? u.id : '', em: u ? u.email : '', nm: u ? u.name : '', ip: String(ip || '').slice(0, 64), d: uaShort(ua) };
    if (x) r.x = String(x).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 120);
    db.activity.push(r); trim(); save();
  }

  function counts(t = nowMs()) {
    const us = new Set(), sess = new Set(); let guests = 0;
    for (const e of PRES.values()) { if (!live(e, t)) continue; if (e.uid) { if (!VIS.has(e.sh)) continue; us.add(e.uid); sess.add(e.sh); } else guests++; }
    return { users: us.size, sessions: sess.size, guests, total: us.size + guests };
  }

  /** Hozir online: foydalanuvchilar (seans boʻyicha) va mehmonlar. */
  function online(userOf) {
    const t = nowMs(), by = new Map(), guests = [];
    for (const e of PRES.values()) {
      if (!live(e, t)) continue;
      if (!e.sh) { guests.push({ id: e.tid.slice(0, 6), ip: e.ip, d: e.d, pg: e.pg, st: stateOf(e, t), since: e.since, seen: e.t }); continue; }
      if (!VIS.has(e.sh)) continue; // tashrifi yopilgan seans (chiqish, bloklash) — online emas
      (by.get(e.sh) || by.set(e.sh, []).get(e.sh)).push(e);
    }
    const users = [];
    for (const [sh, es] of by) {
      const v = VIS.get(sh), rank = x => (x.vis ? 0 : 1e9) + x.idle * 1000 + (t - x.t);
      es.sort((a, b) => rank(a) - rank(b));
      const e = es[0], u = userOf(e.uid);
      users.push({ uid: e.uid, em: u ? u.email : '', nm: u ? u.name : '', ip: e.ip, d: e.d, pg: e.pg, st: stateOf(e, t), idle: Math.round(e.idle + Math.max(0, t - e.t) / 1000), tabs: es.length, since: v ? v.t0 : e.since, seen: Math.max(...es.map(x => x.t)), n: v ? v.n : 0, pp: v ? v.pp : [], vid: v ? v.id : '' });
    }
    users.sort((a, b) => b.seen - a.seen); guests.sort((a, b) => b.seen - a.seen);
    return { t, users, guests, counts: counts(t), peak: db.peak && db.peak.d === today(t) ? db.peak : null };
  }

  /** Hozir haqiqatan signal berayotgan tashriflar (oyna yopilgan, lekin «kutish» muddatidagi tashrif — ochiq emas). */
  const liveVisits = t => { const s = new Set(); for (const e of PRES.values()) if (e.sh && live(e, t)) { const v = VIS.get(e.sh); if (v) s.add(v); } return s; };
  const view = (v, lv) => ({ id: v.id, uid: v.uid, em: v.em, nm: v.nm, ip: v.ip, d: v.d, t0: v.t0, t1: v.t1, n: v.n, pp: v.pp, r: v.open ? '' : v.r || '', open: !!v.open && (!lv || lv.has(v)) });
  /** Soʻnggi tashriflar va hodisalar (yangisi birinchi). */
  function feed(n) {
    n = Math.min(Math.max(n | 0, 1), 1000); const t = nowMs(), d = today(t), lv = liveVisits(t);
    const vs = db.visits.slice(-n).reverse().map(v => view(v, lv)), ev = db.activity.slice(-n).reverse();
    const todays = db.visits.filter(v => today(v.t0) === d), closed = todays.filter(v => !v.open && v.t1 > v.t0);
    return { t, visits: vs, events: ev, stat: { visitsToday: todays.length, usersToday: new Set(todays.map(v => v.uid)).size, avgMs: closed.length ? Math.round(closed.reduce((s, v) => s + (v.t1 - v.t0), 0) / closed.length) : 0, visitsTotal: db.visits.length, eventsTotal: db.activity.length, since: db.visits.length ? db.visits[0].t0 : 0 } };
  }

  /** Bitta foydalanuvchi: tashriflar, hodisalar, jami vaqt, hozirgi holat. */
  function userInfo(uid) {
    const t = nowMs(), lv = liveVisits(t), vs = db.visits.filter(v => v.uid === uid), cur = [];
    for (const e of PRES.values()) if (e.uid === uid && live(e, t)) cur.push({ ip: e.ip, d: e.d, pg: e.pg, st: stateOf(e, t), since: e.since, seen: e.t });
    const sess = Object.values(db.sessions).filter(s => s.uid === uid).map(s => ({ created: s.created, exp: s.exp })).sort((a, b) => b.created - a.created);
    return {
      t, now: cur.sort((a, b) => b.seen - a.seen), sessions: sess, visits: vs.slice(-40).reverse().map(v => view(v, lv)), events: db.activity.filter(x => x.uid === uid).slice(-40).reverse(),
      total: { visits: vs.length, ms: vs.reduce((s, v) => s + Math.max(0, v.t1 - v.t0), 0), pings: vs.reduce((s, v) => s + (v.n || 0), 0), first: vs.length ? vs[0].t0 : 0 }
    };
  }

  return { ping, bye, sweep, closeSession, closeUser, forget, event, online, feed, userInfo, counts, uaShort, mask: MASK, CFG, _s: { PRES, VIS } };
}

module.exports = { create, uaShort, MASK, PAGE_RE, TID_RE };

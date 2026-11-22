'use strict';
/**
 * UniDoue toʻlovlari: Payme (Merchant API, JSON-RPC) va Click (SHOP-API). Tashqi paketlarsiz.
 *
 * Muhit oʻzgaruvchilari (Render → Environment):
 *  USD_UZS_RATE        — 1 AQSh dollari necha soʻm (masalan 12700). Soʻmdagi narx = dollardagi narx × kurs (1000 soʻmgacha yaxlitlanadi). Majburiy.
 *  PAYME_MERCHANT_ID   — Payme kassa ID
 *  PAYME_KEY           — Payme kassa kaliti (sinovda TEST kalit, haqiqiy toʻlovda asosiy kalit)
 *  PAYME_TEST=1        — Payme sinov muhiti (checkout: test.paycom.uz)
 *  CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET_KEY — Click SHOP-API maʼlumotlari
 *
 * Provayder serveriga koʻrsatiladigan manzillar:  <APP_URL>/api/pay/payme  va  <APP_URL>/api/pay/click
 * Kamida bitta provayder + USD_UZS_RATE boʻlsa, toʻlov yoqiladi; aks holda sayt eski qoʻlda toʻlov usuliga qaytadi.
 */
const crypto = require('node:crypto');

const PLAN_DAYS = 30;
const DAY = 864e5;
const ORDER_TTL = 24 * 36e5;       // yangi buyurtma 24 soat ichida toʻlanishi mumkin
const REUSE_TTL = 2 * 36e5;        // 2 soat ichida shu buyurtma qayta ishlatiladi
const PAYME_TIMEOUT = 12 * 36e5;   // Payme: 12 soatda yakunlanmagan tranzaksiya bekor qilinadi
const ORDER_ID_RE = /^[a-f0-9]{16}$/;
const trim = v => String(v == null ? '' : v).trim();
const md5 = s => crypto.createHash('md5').update(s).digest('hex');
const sha = s => crypto.createHash('sha256').update(s).digest();
const eq = (a, b) => crypto.timingSafeEqual(sha(String(a)), sha(String(b)));

module.exports = function createPayments(ctx) {
  const env = process.env;
  const RATE = +env.USD_UZS_RATE || 0;
  const payme = { id: trim(env.PAYME_MERCHANT_ID), key: trim(env.PAYME_KEY), test: env.PAYME_TEST === '1' };
  const click = { service: trim(env.CLICK_SERVICE_ID), merchant: trim(env.CLICK_MERCHANT_ID), secret: trim(env.CLICK_SECRET_KEY) };
  const hasPayme = !!(payme.id && payme.key), hasClick = !!(click.service && click.merchant && click.secret);
  const rateOk = RATE >= 1000 && RATE <= 1e5;
  const enabled = rateOk && (hasPayme || hasClick);
  if ((hasPayme || hasClick) && !rateOk) console.error('Toʻlov YOQILMADI: USD_UZS_RATE sozlanmagan yoki notoʻgʻri (1000–100000 oraligʻida boʻlsin, masalan 12700).');
  else if (enabled) console.log('Toʻlovlar yoqilgan:', [hasPayme && 'Payme' + (payme.test ? ' (sinov)' : ''), hasClick && 'Click'].filter(Boolean).join(', '), '| kurs:', RATE);

  const uzsFor = planId => { const p = ctx.PLANS[planId]; return p && p.price ? Math.round(p.price * RATE / 1000) * 1000 : 0; };
  const info = () => (enabled ? { payme: hasPayme, click: hasClick, days: PLAN_DAYS, uzs: { plus: uzsFor('plus'), pro: uzsFor('pro') } } : null);

  const orders = () => { const d = ctx.getDb(); return d.orders || (d.orders = {}); };
  const getOrder = id => (ORDER_ID_RE.test(String(id)) && Object.prototype.hasOwnProperty.call(orders(), id) ? orders()[id] : null);
  const userOf = o => ctx.getDb().users[o.uid] || null;

  /* ---------- tarifni yoqish / qaytarish ---------- */
  // Foydalanuvchida allaqachon yuqoriroq faol tarif boʻlsa, uni pasaytirmaymiz: oʻsha tarif 30 kunga uzaytiriladi. Qaytaradi: yoqilgan tarif
  function grant(u, plan) {
    const now = Date.now(), cur = ctx.effPlan(u).id, target = ctx.PLAN_ORDER[cur] > ctx.PLAN_ORDER[plan] ? cur : plan;
    delete u.planReq; delete u.planReqPlan;
    if (cur === target && !u.planUntil) return target; // muddatsiz tarif: tegmaymiz
    const same = cur === target && u.planUntil > now;
    u.plan = target; u.planUntil = (same ? u.planUntil : now) + PLAN_DAYS * DAY;
    return target;
  }
  function revoke(u, plan) {
    if (u.plan !== plan || !u.planUntil) return;
    u.planUntil -= PLAN_DAYS * DAY;
    if (u.planUntil <= Date.now()) { u.plan = 'free'; u.planUntil = null; }
  }
  // Toʻlovdan oldin (Payme Create / Click Prepare) rad etiladi: foydalanuvchida allaqachon yuqoriroq yoki muddatsiz shu tarif bor
  function superseded(o) {
    const u = userOf(o); if (!u) return true;
    const cur = ctx.effPlan(u).id;
    return ctx.PLAN_ORDER[o.plan] < ctx.PLAN_ORDER[cur] || (cur === o.plan && !u.planUntil);
  }
  function markPaid(o, prov, ref) {
    const u = userOf(o);
    o.state = 'paid'; o.paidAt = Date.now(); o.ref = ref || null;
    if (u) { o.granted = grant(u, o.plan); o.until = u.planUntil; } else console.error('Toʻlov qabul qilindi, lekin hisob topilmadi:', o.id);
    ctx.save();
    try { if (u && ctx.pushUser) ctx.pushUser(u, { title: 'Toʻlov qabul qilindi', body: `${ctx.PLANS[o.granted || o.plan].name} tarifi faollashdi. Rahmat!`, url: '/app#/pricing', tag: 'plan' }); } catch (e) {}
    try { ctx.notify({ service: 'TOʻLOV ' + prov, name: u ? u.name : '?', contact: u ? u.email : '?', email: u ? u.email : '', message: `${ctx.PLANS[o.plan].name}: ${o.uzs.toLocaleString('en-US')} soʻm ($${ctx.PLANS[o.plan].price}), buyurtma ${o.id}` }); } catch (e) {}
  }
  function refund(o) {
    const u = userOf(o);
    o.state = 'refunded'; o.refundAt = Date.now();
    if (u) revoke(u, o.granted || o.plan);
    ctx.save();
  }
  const payable = o => o.state === 'new' && Date.now() - o.created < ORDER_TTL;

  /* ---------- buyurtma yaratish (foydalanuvchi) ---------- */
  function checkoutUrl(o, base) {
    const back = base + '/app#/pricing?paid=' + o.id;
    if (o.prov === 'payme') {
      const q = `m=${payme.id};ac.order_id=${o.id};a=${o.tiyin};l=uz;c=${back};cr=860`;
      return (payme.test ? 'https://test.paycom.uz/' : 'https://checkout.paycom.uz/') + Buffer.from(q).toString('base64');
    }
    return 'https://my.click.uz/services/pay?' + new URLSearchParams({ service_id: click.service, merchant_id: click.merchant, amount: String(o.uzs), transaction_param: o.id, return_url: back }).toString();
  }

  async function create(req, res) {
    const u = ctx.sessionUser(req);
    if (!u) return ctx.fail(res, 401, 'Avval hisobga kiring.');
    if (!enabled) return ctx.fail(res, 503, 'Onlayn toʻlov hozircha ulanmagan.');
    if (ctx.limited('payc:' + u.id, 12, 36e5)) return ctx.fail(res, 429, 'Juda koʻp urinish. Keyinroq urinib koʻring.');
    const b = await ctx.readJson(req), plan = b.plan, prov = b.provider;
    if (plan !== 'plus' && plan !== 'pro') return ctx.fail(res, 400, 'Notoʻgʻri tarif.');
    if (!((prov === 'payme' && hasPayme) || (prov === 'click' && hasClick))) return ctx.fail(res, 400, 'Bu toʻlov usuli mavjud emas.');
    const cur = ctx.effPlan(u);
    if (ctx.PLAN_ORDER[plan] < ctx.PLAN_ORDER[cur.id]) return ctx.fail(res, 400, 'Siz allaqachon yuqoriroq tarifdasiz.');
    if (cur.id === plan && !u.planUntil) return ctx.fail(res, 400, 'Bu tarif sizda muddatsiz yoqilgan.');
    const now = Date.now(), all = orders(), uzs = uzsFor(plan);
    for (const [k, v] of Object.entries(all)) if (v.state === 'new' && !v.pm && !v.click && now - v.created > 7 * DAY) delete all[k]; // eski, ishlatilmagan buyurtmalarni tozalash
    let o = Object.values(all).find(v => v.uid === u.id && v.plan === plan && v.prov === prov && v.uzs === uzs && v.state === 'new' && !v.pm && !v.click && now - v.created < REUSE_TTL);
    if (!o) {
      o = { id: crypto.randomBytes(8).toString('hex'), uid: u.id, plan, prov, usd: ctx.PLANS[plan].price, uzs, tiyin: uzs * 100, rate: RATE, state: 'new', created: now };
      all[o.id] = o; ctx.save();
    }
    return ctx.send(res, 201, { ok: true, order: { id: o.id, plan, uzs }, url: checkoutUrl(o, ctx.appBase(req)) });
  }

  function status(req, res) {
    const u = ctx.sessionUser(req);
    if (!u) return ctx.fail(res, 401, 'Avval hisobga kiring.');
    const o = getOrder(new URL(req.url, 'http://x').searchParams.get('id'));
    if (!o || o.uid !== u.id) return ctx.fail(res, 404, 'Buyurtma topilmadi.');
    return ctx.send(res, 200, { id: o.id, plan: o.plan, state: o.state, uzs: o.uzs });
  }

  /* ---------- ixtiyoriy: administrator uchun roʻyxat ---------- */
  function adminList() {
    const us = ctx.getDb().users;
    return Object.values(orders()).sort((a, b) => b.created - a.created).slice(0, 200)
      .map(o => ({ id: o.id, email: us[o.uid] ? us[o.uid].email : null, plan: o.plan, prov: o.prov, uzs: o.uzs, state: o.state, created: o.created, paidAt: o.paidAt || null }));
  }

  function readRaw(req) {
    return new Promise((resolve, reject) => {
      let n = 0; const ch = [];
      req.on('data', c => { n += c.length; if (n > 20000) { reject(new Error('big')); req.destroy(); return; } ch.push(c); });
      req.on('end', () => resolve(Buffer.concat(ch).toString('utf8')));
      req.on('error', reject);
    });
  }
  const out = (res, obj) => { res.statusCode = 200; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };

  /* ================= PAYME (JSON-RPC 2.0) ================= */
  const M = (uz, ru, en) => ({ uz, ru, en });
  const ERR = {
    auth: [-32504, M('Ruxsat yoʻq', 'Недостаточно привилегий', 'Insufficient privilege')],
    parse: [-32700, M('JSON xato', 'Ошибка разбора JSON', 'Parse error')],
    request: [-32600, M('Notoʻgʻri soʻrov', 'Неверный запрос', 'Invalid request')],
    method: [-32601, M('Usul topilmadi', 'Метод не найден', 'Method not found')],
    amount: [-31001, M('Summa notoʻgʻri', 'Неверная сумма', 'Wrong amount')],
    notFound: [-31003, M('Tranzaksiya topilmadi', 'Транзакция не найдена', 'Transaction not found')],
    cannot: [-31008, M('Bu amalni bajarib boʻlmaydi', 'Невозможно выполнить операцию', 'Unable to perform operation')],
    order: [-31050, M('Buyurtma topilmadi', 'Заказ не найден', 'Order not found')],
    closed: [-31051, M('Buyurtma toʻlangan yoki bekor qilingan', 'Заказ оплачен или отменен', 'Order is paid or cancelled')],
    busy: [-31099, M('Buyurtma boshqa toʻlov bilan band', 'Заказ занят другой транзакцией', 'Order is busy with another transaction')]
  };
  const E = (k, data) => ({ rpc: true, code: ERR[k][0], message: ERR[k][1], data: data || null });

  const txOf = (o, id) => (o.pm || []).find(t => t.id === id) || null;
  function findTx(id) {
    for (const o of Object.values(orders())) { const t = o.prov === 'payme' && txOf(o, id); if (t) return { o, t }; }
    return null;
  }
  const lastTx = o => (o.pm && o.pm.length ? o.pm[o.pm.length - 1] : null);

  function checkPerform(p) {
    const o = p && p.account ? getOrder(p.account.order_id) : null;
    if (!o || o.prov !== 'payme' || !userOf(o)) throw E('order', 'order_id');
    if (!Number.isInteger(p.amount) || p.amount !== o.tiyin) throw E('amount');
    if (!payable(o) || superseded(o)) throw E('closed', 'order_id');
    return o;
  }
  const cancelTx = (t, reason) => { t.state = -1; t.reason = reason; t.cancel = Date.now(); };
  const view = (o, t) => ({ create_time: t.create, perform_time: t.perform, cancel_time: t.cancel, transaction: o.id, state: t.state, reason: t.reason });

  const PM = {
    CheckPerformTransaction(p) { checkPerform(p); return { allow: true }; },
    CreateTransaction(p) {
      const id = trim(p && p.id), now = Date.now();
      if (!id || !Number.isFinite(p.time)) throw E('request');
      const hit = findTx(id);
      if (hit) {
        const { o, t } = hit;
        if (t.state !== 1) throw E('cannot');
        if (now - t.create > PAYME_TIMEOUT) { cancelTx(t, 4); ctx.save(); throw E('cannot'); }
        return { create_time: t.create, transaction: o.id, state: 1 };
      }
      const o = checkPerform(p), last = lastTx(o);
      if (last && last.state === 1) {
        if (now - last.create <= PAYME_TIMEOUT) throw E('busy', 'order_id');
        cancelTx(last, 4);
      }
      const t = { id, time: p.time, create: now, perform: 0, cancel: 0, state: 1, reason: null };
      (o.pm || (o.pm = [])).push(t); ctx.save();
      return { create_time: t.create, transaction: o.id, state: 1 };
    },
    PerformTransaction(p) {
      const hit = findTx(trim(p && p.id));
      if (!hit) throw E('notFound');
      const { o, t } = hit;
      if (t.state === 1) {
        if (Date.now() - t.create > PAYME_TIMEOUT) { cancelTx(t, 4); ctx.save(); throw E('cannot'); }
        if (o.state !== 'new') throw E('cannot');
        t.state = 2; t.perform = Date.now();
        markPaid(o, 'Payme', t.id);
      } else if (t.state !== 2) throw E('cannot');
      return { transaction: o.id, perform_time: t.perform, state: t.state };
    },
    CancelTransaction(p) {
      const hit = findTx(trim(p && p.id));
      if (!hit) throw E('notFound');
      const { o, t } = hit, reason = Number.isInteger(p.reason) ? p.reason : null;
      if (t.state === 1) { cancelTx(t, reason); ctx.save(); }
      else if (t.state === 2) { t.state = -2; t.reason = reason; t.cancel = Date.now(); refund(o); }
      return { transaction: o.id, cancel_time: t.cancel, state: t.state };
    },
    CheckTransaction(p) {
      const hit = findTx(trim(p && p.id));
      if (!hit) throw E('notFound');
      return view(hit.o, hit.t);
    },
    GetStatement(p) {
      const from = +p.from, to = +p.to;
      if (!Number.isFinite(from) || !Number.isFinite(to)) throw E('request');
      const list = [];
      for (const o of Object.values(orders())) {
        if (o.prov !== 'payme') continue;
        for (const t of o.pm || []) if (t.time >= from && t.time <= to) list.push({ id: t.id, time: t.time, amount: o.tiyin, account: { order_id: o.id }, ...view(o, t) });
      }
      list.sort((a, b) => a.time - b.time);
      return { transactions: list };
    }
  };

  async function paymeHook(req, res) {
    let body = null, id = null;
    try { body = JSON.parse(await readRaw(req)); id = body && body.id !== undefined ? body.id : null; } catch (e) { body = undefined; }
    const fail = e => out(res, { jsonrpc: '2.0', id, error: { code: e.code, message: e.message, data: e.data } });
    const m = /^Basic (.+)$/i.exec(String(req.headers.authorization || ''));
    const cred = m ? Buffer.from(m[1], 'base64').toString('utf8') : '';
    if (!hasPayme || !m || !eq(cred, 'Paycom:' + payme.key)) return fail(E('auth'));
    if (body === undefined) return fail(E('parse'));
    if (!body || typeof body !== 'object' || typeof body.method !== 'string' || (body.params != null && typeof body.params !== 'object')) return fail(E('request'));
    if (!Object.prototype.hasOwnProperty.call(PM, body.method)) return fail(E('method'));
    try { return out(res, { jsonrpc: '2.0', id, result: PM[body.method](body.params || {}) }); }
    catch (e) {
      if (e && e.rpc) return fail(e);
      console.error('Payme xatosi:', e);
      return fail({ code: -32400, message: M('Ichki xato', 'Внутренняя ошибка', 'Internal error'), data: null });
    }
  }

  /* ================= CLICK (SHOP-API: prepare / complete) ================= */
  async function clickHook(req, res) {
    let p;
    try {
      const raw = await readRaw(req);
      p = /json/i.test(String(req.headers['content-type'] || '')) ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
    } catch (e) { p = null; }
    if (!p || typeof p !== 'object') return out(res, { error: -8, error_note: 'Error in request from click' });
    const s = k => (p[k] == null ? '' : String(p[k]));
    const base = { click_trans_id: s('click_trans_id'), merchant_trans_id: s('merchant_trans_id') };
    const bad = (code, note) => out(res, { ...base, error: code, error_note: note });
    if (!hasClick) return bad(-8, 'Error in request from click');
    const act = s('action'), complete = act === '1';
    if (act !== '0' && act !== '1') return bad(-3, 'Action not found');
    if (s('service_id') !== click.service) return bad(-8, 'Error in request from click');
    const sign = md5(s('click_trans_id') + s('service_id') + click.secret + s('merchant_trans_id') + (complete ? s('merchant_prepare_id') : '') + s('amount') + act + s('sign_time'));
    if (!/^[a-f0-9]{32}$/i.test(s('sign_string')) || !eq(sign, s('sign_string').toLowerCase())) return bad(-1, 'SIGN CHECK FAILED!');

    const o = getOrder(s('merchant_trans_id'));
    if (!o || o.prov !== 'click' || !userOf(o)) return bad(-5, 'User does not exist');
    if (!/^\d+(\.\d+)?$/.test(s('amount')) || Math.abs(parseFloat(s('amount')) - o.uzs) > 0.01) return bad(-2, 'Incorrect parameter amount');

    if (!complete) {
      if (o.state === 'paid') return bad(-4, 'Already paid');
      if (!payable(o) || superseded(o)) return bad(-9, 'Transaction cancelled');
      const prepareId = Date.now();
      o.click = { transId: s('click_trans_id'), prepareId, at: prepareId };
      ctx.save();
      return out(res, { ...base, merchant_prepare_id: prepareId, error: 0, error_note: 'Success' });
    }
    if (!o.click || s('merchant_prepare_id') !== String(o.click.prepareId) || s('click_trans_id') !== o.click.transId) return bad(-6, 'Transaction does not exist');
    if (o.state === 'paid') return bad(-4, 'Already paid');
    if (o.state !== 'new') return bad(-9, 'Transaction cancelled');
    if (Number(s('error')) < 0) { o.click = null; ctx.save(); return bad(-9, 'Transaction cancelled'); }
    markPaid(o, 'Click', s('click_trans_id'));
    return out(res, { ...base, merchant_confirm_id: o.click.prepareId, error: 0, error_note: 'Success' });
  }

  return {
    enabled, info, uzsFor, adminList,
    webhook: (req, res, pathname) => (pathname === '/api/pay/payme' ? paymeHook(req, res) : clickHook(req, res)),
    // true qaytarsa, soʻrov shu yerda qayta ishlangan
    route(req, res, pathname, method) {
      if (pathname === '/api/pay/create' && method === 'POST') return create(req, res).then(() => true);
      if (pathname === '/api/pay/order' && method === 'GET') { status(req, res); return Promise.resolve(true); }
      return Promise.resolve(false);
    }
  };
};

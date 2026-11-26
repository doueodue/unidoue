#!/usr/bin/env node
/* UniDoue zaxira nusxa vositasi (kutubxonasiz). Foydalanish:
 *   node tools/backup.js backup  [--data DIR] [--out DIR]          → DIR/unidoue-backup-<vaqt>/ (MANIFEST.json + fayllar)
 *   node tools/backup.js verify  <zaxira-papka>                    → fayllar butunligi, JSON tuzilmasi, xavfsizlik jurnali zanjiri
 *   node tools/backup.js restore <zaxira-papka> [--data DIR] [--force] [--dry-run]
 * BACKUP_PASSPHRASE oʻrnatilsa, fayllar AES-256-GCM (scrypt kaliti) bilan shifrlanadi (.enc) — zaxirada foydalanuvchi maʼlumotlari bor.
 * Parol, kalit va zaxira ichidagi maʼlumotlar HECH QACHON konsolga chiqarilmaydi: faqat sonlar va fayl nomlari. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const FILES = ['db.json', 'security.log'], MAGIC = Buffer.from('UDB1');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const arg = (a, k, d) => { const i = a.indexOf(k); return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : d; };
const pass = () => process.env.BACKUP_PASSPHRASE || '';
const key = (p, salt) => crypto.scryptSync(p, salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
function enc(buf, p) { const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key(p, salt), iv), ct = Buffer.concat([c.update(buf), c.final()]); return Buffer.concat([MAGIC, salt, iv, c.getAuthTag(), ct]); }
function dec(buf, p) { if (buf.length < 48 || !buf.subarray(0, 4).equals(MAGIC)) throw new Error('shifrlangan fayl formati notoʻgʻri'); const d = crypto.createDecipheriv('aes-256-gcm', key(p, buf.subarray(4, 20)), buf.subarray(20, 32)); d.setAuthTag(buf.subarray(32, 48)); return Buffer.concat([d.update(buf.subarray(48)), d.final()]); }
const die = m => { console.error('XATO: ' + m); process.exit(1); };

/** Xavfsizlik jurnali zanjiri (server.js secVerify bilan bir xil qoida) */
function chainOk(text) {
  let prev = null, seq = null, n = 0;
  for (const ln of text.split('\n').filter(Boolean)) {
    let o; try { o = JSON.parse(ln); } catch (e) { return { ok: false, at: n + 1 }; }
    const { h, ...rec } = o;
    if (typeof h !== 'string' || sha(JSON.stringify(rec)) !== h || (prev !== null && rec.prev !== prev) || (seq !== null && rec.seq !== seq + 1)) return { ok: false, at: n + 1 };
    prev = h; seq = rec.seq; n++;
  }
  return { ok: true, count: n };
}
const counts = db => ({ users: Object.keys(db.users || {}).length, sessions: Object.keys(db.sessions || {}).length, adminSessions: Object.keys(db.adminSessions || {}).length, orders: Object.keys(db.orders || {}).length, requests: (db.requests || []).length });

function backup(data, out) {
  const src = path.join(data, 'db.json'); if (!fs.existsSync(src)) die('db.json topilmadi: ' + data);
  const raw = fs.readFileSync(src); let db; try { db = JSON.parse(raw); } catch (e) { die('db.json buzilgan, zaxira olinmadi'); }
  const dir = path.join(out, 'unidoue-backup-' + new Date().toISOString().replace(/[:.]/g, '-')); fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const p = pass(), files = [];
  for (const f of FILES) {
    const fp = path.join(data, f); if (!fs.existsSync(fp)) continue;
    const buf = fs.readFileSync(fp), name = p ? f + '.enc' : f, body = p ? enc(buf, p) : buf;
    fs.writeFileSync(path.join(dir, name), body, { mode: 0o600 }); files.push({ name, source: f, bytes: body.length, sha256: sha(body), plainSha256: sha(buf), encrypted: !!p });
  }
  fs.writeFileSync(path.join(dir, 'MANIFEST.json'), JSON.stringify({ app: 'unidoue', created: new Date().toISOString(), node: process.version, counts: counts(db), files }, null, 2), { mode: 0o600 });
  const v = verify(dir, true); if (!v.ok) die('zaxira yozildi, lekin tekshiruvdan oʻtmadi: ' + v.err);
  console.log(`Zaxira tayyor: ${dir}\n  fayllar: ${files.map(f => f.name).join(', ')}${p ? ' (shifrlangan)' : ' (SHIFRLANMAGAN — BACKUP_PASSPHRASE tavsiya etiladi)'}\n  hisoblar: ${v.counts.users}, buyurtmalar: ${v.counts.orders}`);
  return dir;
}
/** Zaxirani oʻqiydi va tekshiradi. quiet — chop etmaydi. Natija: { ok, err?, counts, files: {name: Buffer(ochiq matn)} } */
function verify(dir, quiet) {
  const fail = err => { if (!quiet) console.error('Tekshiruv MUVAFFAQIYATSIZ: ' + err); return { ok: false, err }; };
  let man; try { man = JSON.parse(fs.readFileSync(path.join(dir, 'MANIFEST.json'), 'utf8')); } catch (e) { return fail('MANIFEST.json oʻqilmadi'); }
  if (man.app !== 'unidoue' || !Array.isArray(man.files) || !man.files.some(f => f.source === 'db.json')) return fail('MANIFEST notoʻgʻri');
  const out = {};
  for (const f of man.files) {
    if (!FILES.includes(f.source) || f.name !== path.basename(f.name)) return fail('notanish fayl: ' + String(f.name).slice(0, 40)); // yoʻl chiqib ketishiga yoʻl yoʻq
    let buf; try { buf = fs.readFileSync(path.join(dir, f.name)); } catch (e) { return fail(f.name + ' yoʻq'); }
    if (buf.length !== f.bytes || sha(buf) !== f.sha256) return fail(f.name + ': hash mos emas (fayl oʻzgargan yoki shikastlangan)');
    if (f.encrypted) { if (!pass()) return fail('BACKUP_PASSPHRASE kerak (zaxira shifrlangan)'); try { buf = dec(buf, pass()); } catch (e) { return fail(f.name + ': parol notoʻgʻri yoki fayl oʻzgargan'); } }
    if (sha(buf) !== f.plainSha256) return fail(f.name + ': ochiq matn hashi mos emas');
    out[f.source] = buf;
  }
  let db; try { db = JSON.parse(out['db.json']); } catch (e) { return fail('db.json JSON emas'); }
  if (!db || typeof db !== 'object' || typeof db.users !== 'object' || Array.isArray(db.users)) return fail('db.json tuzilmasi notoʻgʻri (users yoʻq)');
  const c = counts(db); if (man.counts && man.counts.users !== c.users) return fail('hisoblar soni MANIFEST bilan mos emas');
  if (out['security.log']) { const ch = chainOk(out['security.log'].toString('utf8')); if (!ch.ok) return fail(`xavfsizlik jurnali zanjiri ${ch.at}-qatorda buzilgan`); }
  if (!quiet) console.log(`Tekshiruv OK: ${Object.keys(out).join(', ')} · hisoblar: ${c.users} · yaratilgan: ${man.created}`);
  return { ok: true, counts: c, files: out };
}
function restore(dir, data, force, dry) {
  const v = verify(dir); if (!v.ok) process.exit(2);
  const target = path.join(data, 'db.json');
  if (fs.existsSync(target) && !force) die(`${target} allaqachon bor. Ustiga yozish uchun --force (eskisi db.json.pre-restore-<vaqt> sifatida saqlanadi).`);
  if (dry) return console.log('Quruq yurgizish (--dry-run): hech narsa yozilmadi.');
  fs.mkdirSync(data, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  for (const [name, buf] of Object.entries(v.files)) {
    const dst = path.join(data, name); if (fs.existsSync(dst)) fs.renameSync(dst, dst + '.pre-restore-' + ts);
    const tmp = dst + '.tmp'; fs.writeFileSync(tmp, buf, { mode: 0o600 }); fs.renameSync(tmp, dst);
  }
  console.log(`Tiklandi → ${data} (hisoblar: ${v.counts.users}). Serverni qayta ishga tushiring, soʻng /api/me va admin Himoya holati sahifasini tekshiring.`);
}
if (require.main === module) {
  const a = process.argv.slice(2), cmd = a[0], data = path.resolve(arg(a, '--data', process.env.DATA_DIR || path.join(__dirname, '..', 'data')));
  if (cmd === 'backup') backup(data, path.resolve(arg(a, '--out', path.join(data, 'backups'))));
  else if (cmd === 'verify' && a[1]) process.exit(verify(path.resolve(a[1])).ok ? 0 : 2);
  else if (cmd === 'restore' && a[1]) restore(path.resolve(a[1]), data, a.includes('--force'), a.includes('--dry-run'));
  else { console.log('Foydalanish: backup [--data DIR] [--out DIR] | verify <papka> | restore <papka> [--data DIR] [--force] [--dry-run]'); process.exit(1); }
}
module.exports = { backup, verify, restore, chainOk };

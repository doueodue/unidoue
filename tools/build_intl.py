"""catalog/verified_intl/*.json -> public/data/intl.json. Faqat URL bilan tasdiqlangan, yangi va mantiqiy qiymatlar oʻtadi."""
import json, glob, re, unicodedata
ROOT = '/home/claude/unidoue/'
UZ = {'Switzerland': 'Shveytsariya', 'Finland': 'Finlyandiya', 'Scotland': 'Shotlandiya', 'Wales': 'Uels', 'France': 'Fransiya', 'Italy': 'Italiya',
      'Australia': 'Avstraliya', 'New Zealand': 'Yangi Zelandiya', 'Germany': 'Germaniya', 'Japan': 'Yaponiya', 'South Korea': 'Janubiy Koreya', 'China': 'Xitoy'}
TODAY = '2026-11-09'
def slug(n): return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', n).encode('ascii', 'ignore').decode().lower()).strip('-')
TR = json.load(open(ROOT + 'catalog/intl_i18n.json', encoding='utf-8'))
def tr(fid, key, en):  # {en, uz, ru}; tarjima boʻlmasa faqat inglizcha
    if not en: return None
    t = TR.get(fid, {}).get(key)
    return dict(en=en, uz=t[0], ru=t[1]) if t else dict(en=en)
def url_ok(u): return isinstance(u, str) and u.startswith('https://')
def fresh(y): return isinstance(y, (int, float)) and y >= 2025
out, dropped, rej = [], [], []
for f in sorted(glob.glob(ROOT + 'catalog/verified_intl/*.json')):
    d = json.load(open(f, encoding='utf-8'))
    n = re.sub(r'\s*\(.*\)$', '', d['name']).strip(); fid = slug(re.sub(r'\s*\(.*\)$', '', d['name']).replace('École', 'Ecole'))
    ie = d.get('ielts') or {}; dl = d.get('deadline') or {}; tu = d.get('tuition') or {}; rq = d.get('requirement') or {}
    ieV = isinstance(ie.get('min_overall'), (int, float)) and 4 <= ie['min_overall'] <= 9 and url_ok(ie.get('url')) and fresh(ie.get('year'))
    if ie.get('min_overall') is not None and not ieV: rej.append((n, 'ielts', ie))
    rdV = bool(dl.get('date')) and re.fullmatch(r'20\d\d-\d\d-\d\d', dl['date']) is not None and TODAY <= dl['date'] <= '2028-06-30' and url_ok(dl.get('url'))
    if dl.get('date') and not rdV: rej.append((n, 'deadline', dl.get('date')))
    tuV = isinstance(tu.get('amount'), (int, float)) and 500 <= tu['amount'] <= 2000000 and bool(tu.get('currency')) and url_ok(tu.get('url')) and fresh(tu.get('year'))
    if tu.get('amount') is not None and not tuV: rej.append((n, 'tuition', tu))
    rqV = bool(rq.get('text')) and url_ok(rq.get('url')) and 'not verified' not in rq['text'].lower() and TR.get(fid, {}).get('req', 1) is not None
    o = dict(id=fid, n=n, country=UZ.get(d['country'], d['country']), city=d.get('city') or None, url=d.get('official_url') if url_ok(d.get('official_url')) else None,
             lang=d.get('language') or None, eng=d.get('bachelor_in_english'),
             ielts=ie['min_overall'] if ieV else None, ieltsUrl=ie.get('url') if ieV else None,
             rd=dl['date'] if rdV else None, rdIntake=tr(fid, 'intake', dl.get('intake')) if rdV else None, rdUrl=dl.get('url') if rdV else None,
             tuition=dict(amount=tu['amount'], cur=tu['currency'], note=tr(fid, 'note', tu.get('note')), url=tu['url']) if tuV else None,
             req=tr(fid, 'req', rq['text']) if rqV else None, reqUrl=rq.get('url') if rqV else None)
    (out if (ieV or rdV or tuV or rqV) else dropped).append(o)
out.sort(key=lambda o: (o['country'], o['n']))
json.dump(out, open(ROOT + 'public/data/intl.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'universitet |', sum(1 for o in out if o['ielts']), 'IELTS |', sum(1 for o in out if o['rd']), 'muddat |', sum(1 for o in out if o['tuition']), 'oʻqish narxi |', sum(1 for o in out if o['req']), 'talab;', len(dropped), 'ta olib tashlandi')
for r in rej: print('RAD:', r)

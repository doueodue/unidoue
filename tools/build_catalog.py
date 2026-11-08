"""public/data/universities.json ni qayta quradi: namuna qiymatlar + catalog/verified/*.json (agentlar rasmiy saytdan oʻqigan)."""
import re, json, glob, sys
ROOT = '/home/claude/unidoue/'
src = open(ROOT + 'tools/sample_base.json', encoding='utf-8').read()
base = json.loads(src)  # {nom: {s:[a,b], g, ie, d}}
SKIP_IELTS = {'Brown University'}  # sayt 8.0 minimal deydi: gʻalati, qayta tekshirilguncha olinmaydi
ver = {}
for f in sorted(glob.glob(ROOT + 'catalog/verified/out*.json')):
    for n, v in json.load(open(f, encoding='utf-8')).items():
        old = ver.get(n)
        if not old or len([k for k in v if v.get(k)]) >= len([k for k in old if old.get(k)]): ver[n] = v

def fresh(y):  # maʼlumot yili 2024 yoki yangiroq boʻlishi shart
    ys = [int(x) for x in re.findall(r'20\d\d', str(y or ''))]
    return bool(ys) and max(ys) >= 2024

def good_date(d): return bool(d) and re.fullmatch(r'20\d\d-\d\d-\d\d', d) and '2026-08-01' <= d <= '2027-09-30'
def slug(n): return re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')
out, rejected = [], []
for n, b in base.items():
    v = ver.get(n) or {}
    sat = v.get('sat') or {}; acc = v.get('accept') or {}; ie = dict(v.get('ielts') or {}); dl = v.get('deadline') or {}; gp = v.get('gpa') or {}
    satV = bool(sat.get('p25') and sat.get('p75') and 400 <= sat['p25'] < sat['p75'] <= 1600 and fresh(sat.get('year')))
    if sat.get('p25') and not satV: rejected.append((n, 'sat', sat))
    accV = isinstance(acc.get('value'), (int, float)) and 0 < acc['value'] <= 1 and fresh(acc.get('year'))
    if acc.get('value') is not None and not accV: rejected.append((n, 'accept', acc))
    if n in SKIP_IELTS: ie = {}
    if ie.get('value') is not None and not (4 <= ie['value'] <= 9): rejected.append((n, 'ielts', ie)); ie = {}
    ieV = ie.get('value') is not None
    rdV = bool(good_date(dl.get('rd')))
    if dl.get('rd') and not rdV: rejected.append((n, 'rd', dl.get('rd')))
    o = dict(id=slug(n), n=n, country='AQSh',
             sat=[sat['p25'], sat['p75']] if satV else list(b['s']), satV=satV, satYear=sat.get('year') if satV else None,
             acc=acc['value'] if accV else None, accV=accV,
             gpa=gp['value'] if isinstance(gp.get('value'), (int, float)) and 2 < gp['value'] <= 4.3 else b['g'], gpaV=isinstance(gp.get('value'), (int, float)) and 2 < gp['value'] <= 4.3,
             ielts=ie['value'] if ieV else (None if ie.get('kind') == 'none_stated' else b['ie']), ieltsV=ieV or ie.get('kind') == 'none_stated', ieltsKind=ie.get('kind'),
             rd=dl['rd'] if rdV else b['d'], rdV=rdV,
             early=[{'plan': e['plan'], 'date': e['date']} for e in (dl.get('early') or []) if good_date(e.get('date'))] if rdV else [],
             src={k: (v.get(k) or {}).get('url') for k in ('sat', 'accept', 'ielts', 'deadline')} if v else {})
    if ie.get('kind') == 'none_stated': o['ielts'] = None
    out.append(o)
json.dump(out, open(ROOT + 'public/data/universities.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'universitet |', sum(o['satV'] for o in out), 'SAT |', sum(o['accV'] for o in out), 'qabul darajasi |', sum(o['rdV'] for o in out), 'muddat |', sum(o['ieltsV'] for o in out), 'IELTS tekshirilgan')
for r in rejected: print('RAD ETILDI:', r)

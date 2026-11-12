#!/usr/bin/env python3
"""Fasl ikonkasi: python3 tools/make_icons.py [kuz|qish|bahor|yoz]  (standart: kuz)
public/icons/* ni qayta yozadi; store/icons/season-<fasl>.svg ni saqlaydi."""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
S = {
  'kuz':   dict(a='#f08a24', b='#a63a0c', cap='#fff', capd='#ffe2bf', gold='#ffd34d', accent='leaf', leaf='#ffd34d', leaf2='#e0531f'),
  'qish':  dict(a='#4a63ff', b='#1129e2', cap='#fff', capd='#cfd6ff', gold='#ffc83d', accent='flake', leaf='#ffffff', leaf2='#bfe9ff'),
  'bahor': dict(a='#2fc58a', b='#0b7a54', cap='#fff', capd='#d4f5e7', gold='#ffd34d', accent='flower', leaf='#ff9ec4', leaf2='#ffd34d'),
  'yoz':   dict(a='#19c3ff', b='#0a5fd6', cap='#fff', capd='#cfeeff', gold='#ffd34d', accent='sun', leaf='#ffd34d', leaf2='#ff9f1c'),
}
def accent(k, p):
    """Brend nuqtasi o'rnida fasl belgisi (U harfining tepasida)."""
    if k == 'leaf':  # chinor bargi
        return ('<g transform="translate(340 108) rotate(28)"><path d="M0-52C34-30 38 14 0 48-38 14-34-30 0-52z" fill="LEAF"/>'
                '<path d="M0 62V-26M0 8l-18-18M0 8l18-18M0-14l-12-12M0-14l12-12" stroke="LEAF2" stroke-width="6" stroke-linecap="round" fill="none"/></g>').replace('LEAF2', p['leaf2']).replace('LEAF', p['leaf'])
    if k == 'flake':
        arms = ''.join(f'<path d="M0-40V40" stroke="{p["leaf"]}" stroke-width="9" stroke-linecap="round" transform="rotate({r})"/>' for r in (0, 60, 120))
        return f'<g transform="translate(338 112)">{arms}</g>'
    if k == 'flower':
        pet = ''.join(f'<circle cx="0" cy="-22" r="16" fill="{p["leaf"]}" transform="rotate({r})"/>' for r in range(0, 360, 72))
        return f'<g transform="translate(338 112)">{pet}<circle r="12" fill="{p["leaf2"]}"/></g>'
    rays = ''.join(f'<path d="M0-44v-14" stroke="{p["leaf"]}" stroke-width="8" stroke-linecap="round" transform="rotate({r})"/>' for r in range(0, 360, 45))
    return f'<g transform="translate(338 112)">{rays}<circle r="28" fill="{p["leaf"]}"/></g>'
def svg(season, maskable=False):
    p = S[season]
    g = f'''<path d="M176 190v104a80 80 0 0 0 160 0V190" fill="none" stroke="#fff" stroke-width="48" stroke-linecap="round"/>{accent(p['accent'], p)}'''
    if maskable: g = f'<g transform="translate(256 256) scale(.8) translate(-256 -270)">{g}</g>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{p['a']}"/><stop offset="1" stop-color="{p['b']}"/></linearGradient></defs><rect width="512" height="512" fill="url(#bg)"/>{g}</svg>'''
def main():
    season = sys.argv[1] if len(sys.argv) > 1 else 'kuz'
    out = ROOT / 'public' / 'icons'; (ROOT / 'store' / 'icons').mkdir(exist_ok=True)
    (ROOT / 'store' / 'icons' / f'season-{season}.svg').write_text(svg(season))
    jobs = [('icon-192.png', 192, False), ('icon-512.png', 512, False), ('icon-maskable-512.png', 512, True), ('apple-touch-icon.png', 180, False)]
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page()
        for name, size, mk in jobs:
            pg.set_viewport_size({'width': size, 'height': size})
            pg.set_content(f'<style>*{{margin:0}}svg{{width:{size}px;height:{size}px;display:block}}</style>' + svg(season, mk))
            pg.screenshot(path=str(out / name))
        b.close()
    print('tayyor:', season)
main()

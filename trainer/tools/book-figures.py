#!/usr/bin/env python3
"""Cuts every figure out of the book's PDF as a PNG for the Learn pages.

The book's figures are drawn with TikZ, so there is no image file to reuse. This finds each caption line that starts
"Figure N.M:" in the PDF, takes the area between the body text above it and the caption, renders it with Poppler,
and trims the white margin. Run it again whenever the PDF changes:

    python3 trainer/tools/book-figures.py            (needs Poppler's pdftotext/pdftoppm and Pillow)

A few small drawings have no caption (a symbol shown in the middle of a paragraph). DRAWINGS names the text just
above and just below each one, and they are cut from between those lines the same way.

Writes docs/book/fig-N-M.png, docs/book/draw-N-K.png and docs/book/figures.json (figure number, or dN.K for a
drawing, -> width and height).
"""
import json, os, re, subprocess, sys, tempfile
from html.parser import HTMLParser
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF = os.path.join(ROOT, 'book', 'hardware-from-the-ground-up.pdf')
OUT = os.path.join(ROOT, 'docs', 'book')
DPI = 160
TEXT_LEFT, TEXT_RIGHT = 60, 552          # a little wider than the 1 inch margins of a letter page
BOX_ABOVE = {'13.1'}                     # figures right under a framed box: cut below the box's bottom edge
# Uncaptioned drawings, numbered in order within their chapter (book-convert.js counts them the same way):
# the end of the line above, the start of the line below, and the alt text the Learn page gives the image.
DRAWINGS = {
    'd1.1': ('drawn with this symbol:', 'When someone says', 'The ground symbol: a short vertical line ending in three horizontal bars that get shorter.'),
    'd4.1': ('conducts heavily.', 'Diodes matter to', 'A diode drawn from anode (p) on the left to cathode (n) on the right. Current flows easily from anode to cathode.'),
}

class Layout(HTMLParser):
    """Reads pdftotext -bbox-layout output into pages of lines: (yMin, yMax, xMin, xMax, words)."""
    def __init__(self):
        super().__init__(); self.pages = []; self.line = None; self.word = None
    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag == 'page': self.pages.append([])
        elif tag == 'line': self.line = {'y0': float(a['ymin']), 'y1': float(a['ymax']), 'x0': float(a['xmin']), 'x1': float(a['xmax']), 'w': []}
        elif tag == 'word': self.word = ''
    def handle_data(self, d):
        if self.word is not None: self.word += d
    def handle_endtag(self, tag):
        if tag == 'word' and self.line is not None: self.line['w'].append(self.word.strip()); self.word = None
        elif tag == 'line' and self.line is not None: self.pages[-1].append(self.line); self.line = None

def retrim(im, pad):
    diff = ImageChops.difference(im, Image.new('RGB', im.size, (255, 255, 255)))
    box = diff.point(lambda v: 255 if v > 12 else 0).getbbox()
    if not box: return im
    return im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))

def cut_below_rule(im, pad):
    W, H = im.size; px = im.load()
    rows = [y for y in range(H // 2) if sum(1 for x in range(W) if sum(px[x, y]) < 720) > 0.6 * W]
    return retrim(im.crop((0, rows[-1] + 1, W, H)), pad) if rows else im

def strip_rules(im, pad):
    """Drops the edge of a box caught at the top or bottom (a line within 40 px of it that runs nearly the full text
    width), then trims again. A graph's axes and a drawing's own outline are shorter, so they stay."""
    W, H = im.size; px = im.load()
    full = 0.9 * (TEXT_RIGHT - TEXT_LEFT) * DPI / 72
    row = lambda y: sum(1 for x in range(W) if sum(px[x, y]) < 720)
    top, bot = 0, H
    for y in range(min(H, 40)):
        if row(y) > full: top = y + 1
    for y in range(H - 1, max(-1, H - 41), -1):
        if row(y) > full: bot = min(bot, y)
    if (top, bot) != (0, H): im = retrim(im.crop((0, top, W, bot)), pad)
    return drop_stray_line(im, pad)

def drop_stray_line(im, pad):
    """Drops the last line of a paragraph caught above the drawing: one text-high band at the top that starts at the
    left edge, with a clear gap under it."""
    W, H = im.size; px = im.load()
    ink = [any(sum(px[x, y]) < 720 for x in range(W)) for y in range(H)]
    y = 0
    while y < H and not ink[y]: y += 1
    start = y
    while y < H and ink[y]: y += 1
    band = y - start
    gap = 0
    while y < H and not ink[y]: y += 1; gap += 1
    if not (0 < band <= 30 and gap >= 14 and H - y > 60): return im
    left = min((x for x in range(W) for yy in range(start, start + band) if sum(px[x, yy]) < 720), default=W)
    if left > pad + 30: return im
    return retrim(im.crop((0, start + band + 1, W, H)), pad)

def render(tmp, pno, top, bottom):
    """The text column of page pno between top and bottom (points), trimmed to its ink with a small margin."""
    s = DPI / 72
    base = os.path.join(tmp, 'f')
    subprocess.run(['pdftoppm', '-f', str(pno), '-l', str(pno), '-r', str(DPI), '-png', '-singlefile',
                    '-x', str(int(TEXT_LEFT * s)), '-y', str(int(top * s)), '-W', str(int((TEXT_RIGHT - TEXT_LEFT) * s)),
                    '-H', str(int((bottom - top) * s)), PDF, base], check=True)
    im = Image.open(base + '.png').convert('RGB')
    diff = ImageChops.difference(im, Image.new('RGB', im.size, (255, 255, 255)))
    box = diff.point(lambda v: 255 if v > 12 else 0).getbbox()
    if not box: return None
    return retrim(im, 10)

def save(im, name):
    im.convert('P', palette=Image.ADAPTIVE, colors=64).save(os.path.join(OUT, name), optimize=True)

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):                # figures renumber when one is added, so start clean
        if re.fullmatch(r'(fig|draw)-\d+-\d+\.png', f): os.remove(os.path.join(OUT, f))
    with tempfile.TemporaryDirectory() as tmp:
        bbox = os.path.join(tmp, 'b.html')
        subprocess.run(['pdftotext', '-bbox-layout', PDF, bbox], check=True)
        L = Layout(); L.feed(open(bbox, encoding='utf-8').read())
        meta = {}
        text = lambda ln: ' '.join(ln['w'])
        for key, (before, after, alt) in DRAWINGS.items():
            hit = [(pno, ln) for pno, lines in enumerate(L.pages, 1) for ln in lines if text(ln).endswith(before)]
            if len(hit) != 1: print('skip (the line above is not found once)', key, file=sys.stderr); continue
            pno, ln = hit[0]
            below = sorted((x for x in L.pages[pno - 1] if x['y0'] > ln['y1'] and text(x).startswith(after)), key=lambda x: x['y0'])
            if not below: print('skip (the line below is not on the same page)', key, file=sys.stderr); continue
            im = render(tmp, pno, ln['y1'] + 2, below[0]['y0'] - 1)
            if not im: print('skip (blank)', key, file=sys.stderr); continue
            save(im, 'draw-' + key[1:].replace('.', '-') + '.png')
            meta[key] = {'w': im.width, 'h': im.height, 'page': pno, 'alt': alt}
        for pno, lines in enumerate(L.pages, 1):
            for ln in lines:
                w = ln['w']
                if len(w) < 2 or w[0] != 'Figure' or not re.fullmatch(r'\d+\.\d+:', w[1]): continue
                num = w[1][:-1]
                cap_top = ln['y0']
                # The figure sits between the nearest body-text line above the caption and the caption.
                above = [x for x in lines if x['y1'] < cap_top - 1]
                # Body text: lines that start at the left margin (the last line of a paragraph does), long lines that
                # start near it (list items, boxed text), and bullets. Labels inside a centred drawing start further
                # right, even a long row of them such as the bits of a number.
                body = [x for x in above if x['x0'] < 83 or (x['x0'] < 120 and ((x['x1'] - x['x0']) > 300 or len(x['w']) > 11)) or x['w'][0] in ('•', '–')]
                top = max([x['y1'] for x in body] + [62]) + 2
                if cap_top - top < 20: print('skip (too small)', num, file=sys.stderr); continue
                im = render(tmp, pno, top, cap_top - 1)
                if not im: print('skip (blank)', num, file=sys.stderr); continue
                if num in BOX_ABOVE: im = cut_below_rule(im, 10)
                im = strip_rules(im, 10)
                save(im, 'fig-' + num.replace('.', '-') + '.png')
                meta[num] = {'w': im.width, 'h': im.height, 'page': pno}
        json.dump(meta, open(os.path.join(OUT, 'figures.json'), 'w'), indent=0, sort_keys=True)
        print(len(meta), 'figures and drawings written to', OUT)

if __name__ == '__main__':
    main()

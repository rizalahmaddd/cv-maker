# Builds public/fonts/noto-sans-jp-*.woff: static Regular/Bold instances of Noto Sans JP (SIL OFL 1.1)
# subset to Latin + everything Shift-JIS (cp932) can encode, i.e. kana and JIS level 1-2 kanji.
# Usage: python scripts/jp-font.py NotoSansJP-VariableFont_wght.ttf public/fonts  (needs: pip install fonttools)
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

src, outdir = sys.argv[1], sys.argv[2]
chars = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180)) | {0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x00D7}
for cp in range(0x3000, 0x10000):
    ch = chr(cp)
    try:
        ch.encode('cp932')
        chars.add(cp)
    except UnicodeEncodeError:
        pass
print('chars', len(chars))
for name, wght in (('regular', 400), ('bold', 700)):
    f = TTFont(src)
    f = instancer.instantiateVariableFont(f, {'wght': wght})
    opts = subset.Options()
    opts.flavor = 'woff'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.hinting = False
    opts.desubroutinize = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=chars)
    s.subset(f)
    out = f"{outdir}/noto-sans-jp-{name}.woff"
    subset.save_font(f, out, opts)
    print(out)

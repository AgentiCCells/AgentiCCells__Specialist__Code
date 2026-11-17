# Makes the link-preview card: src/assets/share/specialist-code-1200x630.jpg (1200x630 JPEG, under 300 KB).
# Run by hand when the card's words change: python3 -I scripts/make-share-card.py
# Written by specialist.code@AgentiCCells.dinis, 2026-11-17. Apache-2.0. Needs Pillow and the DejaVu fonts.
from PIL import Image, ImageDraw, ImageFont
import os
W, H = 1200, 630
BG, INK, MUTED, ACCENT, RULE = (251, 247, 240), (34, 34, 34), (90, 90, 90), (29, 79, 145), (184, 134, 11)
F = '/usr/share/fonts/truetype/dejavu/'
font = lambda name, size: ImageFont.truetype(F + name, size)
im = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(im)
d.rectangle([0, 0, 24, H], fill=ACCENT)
d.text((80, 70), 'AgentiCCells', font=font('DejaVuSans-Bold.ttf', 34), fill=ACCENT)
d.text((80, 150), 'Specialist: Code', font=font('DejaVuSerif-Bold.ttf', 92), fill=INK)
d.rectangle([80, 275, 380, 281], fill=RULE)
lines = ['The procedures, gates, release flow and tests', 'every repository should follow.']
for i, t in enumerate(lines):
    d.text((80, 310 + i * 52), t, font=font('DejaVuSans.ttf', 40), fill=INK)
tags = 'Day-one pack  ·  Guidance  ·  Mistakes  ·  Reviews'
d.text((80, 470), tags, font=font('DejaVuSans.ttf', 30), fill=MUTED)
d.text((80, 545), 'specialist-code.agenticcells.site', font=font('DejaVuSansMono.ttf', 30), fill=ACCENT)
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'share', 'specialist-code-1200x630.jpg')
im.save(out, 'JPEG', quality=88, optimize=True, progressive=False)
print(out, os.path.getsize(out), 'bytes')

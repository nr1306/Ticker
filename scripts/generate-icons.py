"""Generate placeholder app icons for Ticker."""
from PIL import Image, ImageDraw, ImageFont
import os

RESOURCES = os.path.join(os.path.dirname(__file__), '..', 'resources')
os.makedirs(RESOURCES, exist_ok=True)

BG = (24, 24, 27)       # zinc-900
FG = (255, 255, 255)    # white


def make_icon(size: int) -> Image.Image:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded square background
    radius = size // 5
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG + (255,))

    # White "T" letterform drawn with rectangles (no font needed)
    bar_h = max(2, size // 10)         # thickness of bars
    horiz_w = size * 6 // 10           # horizontal bar width
    vert_h = size * 5 // 10            # vertical bar height
    cx = size // 2

    top = size * 2 // 10
    horiz_x0 = cx - horiz_w // 2
    horiz_x1 = cx + horiz_w // 2

    draw.rectangle([horiz_x0, top, horiz_x1, top + bar_h], fill=FG + (255,))
    vert_x0 = cx - bar_h // 2
    vert_x1 = cx + bar_h // 2
    draw.rectangle([vert_x0, top + bar_h, vert_x1, top + bar_h + vert_h], fill=FG + (255,))

    return img


# 512x512 main icon (RGB, no alpha for PNG used by electron-builder)
icon_512 = make_icon(512)
icon_512.convert('RGB').save(os.path.join(RESOURCES, 'icon.png'))
print("Wrote resources/icon.png")

# 22x22 tray icon — white monochrome on transparent (macOS template style)
tray = Image.new('RGBA', (22, 22), (0, 0, 0, 0))
draw = ImageDraw.Draw(tray)
draw.rectangle([4, 4, 18, 7], fill=(255, 255, 255, 255))   # horiz bar
draw.rectangle([10, 7, 13, 18], fill=(255, 255, 255, 255))  # vert bar
tray.save(os.path.join(RESOURCES, 'tray-iconTemplate.png'))
print("Wrote resources/tray-iconTemplate.png")

# ICO (Windows) — Pillow scales from a large source when given a sizes list
ico_base = make_icon(256).convert('RGBA')
ico_base.save(
    os.path.join(RESOURCES, 'icon.ico'),
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("Wrote resources/icon.ico")

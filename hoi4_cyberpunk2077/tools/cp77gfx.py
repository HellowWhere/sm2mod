"""Процедурная генерация графики мода в неоновом стиле Cyberpunk 2077.

Все изображения рисуются Pillow-ом и сохраняются как несжатый 32-битный DDS
(A8R8G8B8, его HOI4 читает без проблем) или как 32-битный TGA для флагов.
"""
import math
import os
import random
import struct

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_DIRS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]
SYMBOL_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
]

PALETTE = {
    "yellow": (252, 238, 10),
    "cyan": (0, 240, 255),
    "magenta": (255, 0, 150),
    "red": (255, 40, 60),
    "green": (60, 255, 120),
    "orange": (255, 140, 0),
    "violet": (170, 80, 255),
    "white": (235, 240, 255),
    "blue": (40, 120, 255),
    "gold": (230, 180, 60),
}


def _font(size, paths=FONT_DIRS):
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _has_glyph(font, ch):
    """Глиф есть, если его маска не совпадает с маской .notdef (неназначенный символ)."""
    try:
        mask = font.getmask(ch)
    except Exception:
        return False
    if mask.getbbox() is None:
        return False
    notdef = font.getmask("\U000F0000")
    return not (mask.size == notdef.size and bytes(mask) == bytes(notdef))


def _font_for(ch, size):
    """Первый шрифт, в котором есть глиф ch (None, если нет нигде)."""
    for p in SYMBOL_FONTS:
        if os.path.exists(p):
            f = ImageFont.truetype(p, size)
            if _has_glyph(f, ch):
                return f
    return None


def write_dds(img, path):
    img = img.convert("RGBA")
    w, h = img.size
    os.makedirs(os.path.dirname(path), exist_ok=True)
    r, g, b, a = img.split()
    data = Image.merge("RGBA", (b, g, r, a)).tobytes()
    header = struct.pack(
        "<4sIIIIIII44sIIIIIIIIIIIII",
        b"DDS ", 124, 0x100F, h, w, w * 4, 0, 0, b"\0" * 44,
        32, 0x41, 0, 32, 0x00FF0000, 0x0000FF00, 0x000000FF, 0xFF000000,
        0x1000, 0, 0, 0, 0,
    )
    with open(path, "wb") as fh:
        fh.write(header)
        fh.write(data)


def write_tga(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.convert("RGBA").save(path, format="TGA", compression=None)


def _glow(layer, radius, strength=2):
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    blur = layer.filter(ImageFilter.GaussianBlur(radius))
    for _ in range(strength):
        out = Image.alpha_composite(out, blur)
    return Image.alpha_composite(out, layer)


def _draw_glyph(size, glyph, color, scale=0.6, offset=(0, 0)):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    fs = int(min(size) * scale)
    f = _font_for(glyph[0], fs) or _font(fs)
    bbox = d.textbbox((0, 0), glyph, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size[0] - tw) / 2 - bbox[0] + offset[0]
    y = (size[1] - th) / 2 - bbox[1] + offset[1]
    d.text((x, y), glyph, font=f, fill=color + (255,))
    return layer


def _hex_points(cx, cy, r, squash=1.0):
    return [
        (cx + r * math.cos(math.radians(60 * i + 30)), cy + r * squash * math.sin(math.radians(60 * i + 30)))
        for i in range(6)
    ]


# ---------------------------------------------------------------- focus icons
def focus_icon(glyph, color, path, accent=None):
    W, H = 96, 88
    accent = accent or color
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    pts = _hex_points(W / 2, H / 2, 40, 0.98)
    d.polygon(pts, fill=(14, 10, 24, 235))
    # диагональные «сканлайны»
    for i in range(-H, W, 6):
        d.line([(i, H), (i + H, 0)], fill=(255, 255, 255, 10), width=1)
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    clipped = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    clipped.paste(base, (0, 0), mask)
    img = Image.alpha_composite(img, clipped)
    border = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(border).line(pts + [pts[0]], fill=accent + (255,), width=3)
    img = Image.alpha_composite(img, _glow(border, 3))
    g = _draw_glyph((W, H), glyph, color, 0.5)
    img = Image.alpha_composite(img, _glow(g, 3, 3))
    write_dds(img, path)


# ----------------------------------------------------------------- idea icons
def idea_icon(glyph, color, path):
    W, H = 64, 64
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([3, 3, W - 4, H - 4], radius=8, fill=(12, 10, 22, 240))
    for y in range(4, H - 4, 3):
        d.line([(4, y), (W - 5, y)], fill=(255, 255, 255, 8))
    border = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(border).rounded_rectangle([3, 3, W - 4, H - 4], radius=8, outline=color + (255,), width=2)
    img = Image.alpha_composite(img, _glow(border, 2))
    img = Image.alpha_composite(img, _glow(_draw_glyph((W, H), glyph, color, 0.55), 2, 3))
    write_dds(img, path)


def small_icon(glyph, color, path, size=44):
    W = H = size
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([2, 2, W - 3, H - 3], fill=(12, 10, 22, 235), outline=color + (255,), width=2)
    img = Image.alpha_composite(img, _glow(_draw_glyph((W, H), glyph, color, 0.55), 2, 2))
    write_dds(img, path)


# ------------------------------------------------------------- event pictures
def _skyline(d, W, H, rnd, color):
    x = 0
    while x < W:
        bw = rnd.randint(10, 28)
        bh = rnd.randint(int(H * 0.25), int(H * 0.85))
        shade = rnd.randint(14, 30)
        d.rectangle([x, H - bh, x + bw, H], fill=(shade, shade - 4 if shade > 4 else 0, shade + 14, 255))
        for wy in range(H - bh + 4, H - 4, 6):
            for wx in range(x + 3, x + bw - 2, 5):
                if rnd.random() < 0.35:
                    c = color if rnd.random() < 0.5 else PALETTE["yellow"]
                    d.rectangle([wx, wy, wx + 1, wy + 2], fill=c + (rnd.randint(120, 255),))
        x += bw + rnd.randint(0, 3)


def event_picture(glyph, color, path, seed=0, caption=None):
    W, H = 210, 176
    rnd = random.Random(seed)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    top = (20, 6, 40)
    bot = tuple(int(c * 0.35) for c in color)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] * (1 - t) + bot[i] * t) for i in range(3)) + (255,))
    # луна/солнце-неон
    sun = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sun).ellipse([W * 0.55, 18, W * 0.55 + 50, 68], fill=color + (160,))
    img = Image.alpha_composite(img, _glow(sun, 8))
    sky = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    _skyline(ImageDraw.Draw(sky), W, H, rnd, color)
    img = Image.alpha_composite(img, sky)
    g = _draw_glyph((W, H), glyph, color, 0.42, (-40, -20))
    img = Image.alpha_composite(img, _glow(g, 4, 3))
    d = ImageDraw.Draw(img)
    for y in range(0, H, 3):
        d.line([(0, y), (W, y)], fill=(0, 0, 0, 40))
    d.rectangle([0, 0, W - 1, H - 1], outline=color + (255,), width=2)
    if caption:
        f = _font(11)
        d.text((8, H - 18), caption, font=f, fill=PALETTE["yellow"] + (255,))
    write_dds(img, path)


# ------------------------------------------------------------ leader portraits
def portrait(path, color, seed=0, initials="", cyber=True, kind="human"):
    W, H = 156, 210
    rnd = random.Random(seed)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        c = tuple(int(10 + color[i] * 0.25 * (1 - t)) for i in range(3))
        d.line([(0, y), (W, y)], fill=c + (255,))
    for i in range(0, W, 12):
        d.line([(i, 0), (i, H)], fill=color + (14,))
    sil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s = ImageDraw.Draw(sil)
    body = (18, 16, 28, 255)
    if kind == "machine":
        s.rounded_rectangle([38, 40, 118, 150], radius=10, fill=body, outline=color + (255,), width=3)
        s.rectangle([58, 150, 98, 168], fill=body)
        s.rectangle([30, 168, 126, H], fill=body, outline=color + (255,), width=2)
        s.rectangle([52, 80, 104, 96], fill=color + (255,))
    elif kind == "ai":
        for r in range(70, 10, -12):
            s.ellipse([W / 2 - r, 95 - r, W / 2 + r, 95 + r], outline=color + (200,), width=2)
        s.ellipse([W / 2 - 10, 85, W / 2 + 10, 105], fill=PALETTE["white"] + (255,))
    else:
        hx = W / 2 + rnd.randint(-4, 4)
        s.ellipse([hx - 30, 42, hx + 30, 118], fill=body)
        s.rectangle([hx - 12, 110, hx + 12, 140], fill=body)
        s.pieslice([hx - 70, 128, hx + 70, 290], 180, 360, fill=body)
        s.chord([hx - 70, 128, hx + 70, 290], 180, 360, outline=color + (255,), width=2)
        s.arc([hx - 31, 41, hx + 31, 119], 200, 340, fill=color + (255,), width=3)
        if cyber:
            ey = 78 + rnd.randint(-3, 3)
            s.ellipse([hx + 6, ey, hx + 18, ey + 6], fill=color + (255,))
            if rnd.random() < 0.6:
                s.ellipse([hx - 18, ey, hx - 6, ey + 6], fill=color + (255,))
            for _ in range(3):
                y0 = rnd.randint(55, 105)
                s.line([(hx - 28, y0), (hx - 14, y0)], fill=color + (180,), width=1)
    img = Image.alpha_composite(img, _glow(sil, 3))
    d = ImageDraw.Draw(img)
    if initials:
        f = _font(16)
        d.text((8, H - 24), initials, font=f, fill=PALETTE["yellow"] + (255,))
    for y in range(0, H, 3):
        d.line([(0, y), (W, y)], fill=(0, 0, 0, 35))
    d.rectangle([0, 0, W - 1, H - 1], outline=color + (255,), width=2)
    write_dds(img, path)


# ----------------------------------------------------------------------- flags
def flag(base_path, tag, design):
    """design: dict(bg=[colors], stripes='h'|'v'|'diag'|None, glyph, glyph_color)."""
    W, H = 82, 52
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    cols = design["bg"]
    mode = design.get("stripes", "h")
    n = len(cols)
    if mode == "v":
        for i, c in enumerate(cols):
            d.rectangle([i * W / n, 0, (i + 1) * W / n, H], fill=c + (255,))
    elif mode == "diag":
        d.rectangle([0, 0, W, H], fill=cols[0] + (255,))
        d.polygon([(0, H), (W, 0), (W, H)], fill=cols[1 % n] + (255,))
        if n > 2:
            d.line([(0, H), (W, 0)], fill=cols[2] + (255,), width=6)
    elif mode == "cross":
        d.rectangle([0, 0, W, H], fill=cols[0] + (255,))
        d.rectangle([0, H / 2 - 5, W, H / 2 + 5], fill=cols[1] + (255,))
        d.rectangle([W * 0.3 - 5, 0, W * 0.3 + 5, H], fill=cols[1] + (255,))
    else:
        for i, c in enumerate(cols):
            d.rectangle([0, i * H / n, W, (i + 1) * H / n], fill=c + (255,))
    if design.get("canton"):
        d.rectangle([0, 0, W * 0.42, H * 0.55], fill=design["canton"] + (255,))
    glyph = design.get("glyph")
    if glyph:
        off = design.get("glyph_offset", (0, 0))
        g = _draw_glyph((W, H), glyph, design.get("glyph_color", (255, 255, 255)), design.get("glyph_scale", 0.62), off)
        img = Image.alpha_composite(img, g)
    write_tga(img, os.path.join(base_path, f"{tag}.tga"))
    write_tga(img.resize((41, 26), Image.LANCZOS), os.path.join(base_path, "medium", f"{tag}.tga"))
    write_tga(img.resize((10, 7), Image.LANCZOS), os.path.join(base_path, "small", f"{tag}.tga"))

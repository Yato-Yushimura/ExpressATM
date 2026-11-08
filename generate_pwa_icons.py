"""
Pure Python PWA Icon & Asset Generator for ExpressBank ATM POV Simulator.
Generates SVG, ICO, and PNG icons (180x180, 192x192, 512x512, maskable 512x512, and screenshots)
using only the Python standard library (struct, zlib, math, os).
"""

import math
import os
import struct
import zlib


def create_png(width, height, pixel_fn):
    """Create a valid RGBA PNG byte string from a pixel generator function(x, y) -> (r, g, b, a)."""
    raw_rows = []
    for y in range(height):
        row = bytearray([0])  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = pixel_fn(x, y, width, height)
            row.extend((
                max(0, min(255, int(r))),
                max(0, min(255, int(g))),
                max(0, min(255, int(b))),
                max(0, min(255, int(a))),
            ))
        raw_rows.append(bytes(row))

    raw_data = b"".join(raw_rows)

    def make_chunk(chunk_type, data):
        chunk = struct.pack(">I", len(data)) + chunk_type + data
        crc = zlib.crc32(chunk_type + data) & 0xFFFFFFFF
        return chunk + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    compressed = zlib.compress(raw_data, 9)

    return (
        b"\x89PNG\r\n\x1a\n"
        + make_chunk(b"IHDR", ihdr)
        + make_chunk(b"IDAT", compressed)
        + make_chunk(b"IEND", b"")
    )


def create_ico_from_png(png_bytes, width, height):
    """Wrap a PNG image into a valid Windows .ico file."""
    w_byte = 0 if width >= 256 else width
    h_byte = 0 if height >= 256 else height
    header = struct.pack("<HHH", 0, 1, 1)
    entry = struct.pack(
        "<BBBBHHII",
        w_byte,
        h_byte,
        0,
        0,
        1,
        32,
        len(png_bytes),
        6 + 16,
    )
    return header + entry + png_bytes


def icon_pixel(x, y, w, h, maskable=False):
    """Render the ExpressBank ATM glowing card/kiosk emblem."""
    nx = x / float(w)
    ny = y / float(h)
    cx = nx - 0.5
    cy = ny - 0.5
    dist = math.sqrt(cx * cx + cy * cy)

    # Rounded square / full bleed mask
    if not maskable:
        margin = 0.04
        radius = 0.22
        qx = max(0.0, abs(cx) - (0.5 - margin - radius))
        qy = max(0.0, abs(cy) - (0.5 - margin - radius))
        if math.sqrt(qx * qx + qy * qy) > radius:
            return (0, 0, 0, 0)

    # Deep navy-blue banking gradient background
    bg_r = 6 + int(18 * (1.0 - ny))
    bg_g = 18 + int(45 * (1.0 - ny))
    bg_b = 48 + int(95 * (1.0 - ny))

    # Subtle radial cyan glow in center
    glow = max(0.0, 1.0 - dist * 2.2)
    r = bg_r + int(glow * 18)
    g = bg_g + int(glow * 75)
    b = bg_b + int(glow * 120)

    # Scale inner artwork for maskable safe-zone (80% center circle)
    scale = 1.22 if maskable else 1.0
    sx = cx * scale + 0.5
    sy = cy * scale + 0.5

    # Outer glowing cyan bezel ring
    ring_dist = math.sqrt((sx - 0.5) ** 2 + (sy - 0.5) ** 2)
    if 0.34 <= ring_dist <= 0.38:
        return (34, 211, 238, 255)

    # Stylized ATM Card / Screen shape in center
    if 0.22 <= sx <= 0.78 and 0.28 <= sy <= 0.72:
        # Card border
        if sx < 0.245 or sx > 0.755 or sy < 0.305 or sy > 0.695:
            return (56, 189, 248, 255)
        # Top magnetic/header bar
        if 0.34 <= sy <= 0.41:
            return (14, 165, 233, 255)
        # Golden EMV chip on left
        if 0.29 <= sx <= 0.42 and 0.47 <= sy <= 0.58:
            return (251, 191, 36, 255)
        # Green glowing card slot / status indicator on right
        slot_dist = math.sqrt((sx - 0.64) ** 2 + (sy - 0.53) ** 2)
        if slot_dist <= 0.065:
            return (16, 185, 129, 255)
        # Bottom card number stripe
        if 0.29 <= sx <= 0.71 and 0.62 <= sy <= 0.65:
            return (226, 232, 240, 255)
        return (15, 23, 42, 255)

    return (r, g, b, 255)


def screenshot_pixel(x, y, w, h):
    """Render a clean preview banner for PWA Rich Install dialog."""
    ny = y / float(h)
    nx = x / float(w)
    r = 4 + int(14 * (1.0 - ny))
    g = 12 + int(32 * (1.0 - ny))
    b = 30 + int(68 * (1.0 - ny))
    # Center ATM kiosk frame preview
    if 0.25 <= nx <= 0.75 and 0.15 <= ny <= 0.85:
        if nx < 0.26 or nx > 0.74 or ny < 0.16 or ny > 0.84:
            return (34, 211, 238, 255)
        if 0.32 <= nx <= 0.68 and 0.25 <= ny <= 0.55:
            return (14, 116, 144, 255)
        if 0.38 <= nx <= 0.62 and 0.64 <= ny <= 0.72:
            return (16, 185, 129, 255)
        return (15, 23, 42, 255)
    return (r, g, b, 255)


def main():
    os.makedirs("public", exist_ok=True)

    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="#22d3ee" stroke-width="14" stroke-opacity="0.85"/>
  <rect x="112" y="148" width="288" height="216" rx="28" fill="#0f172a" stroke="#38bdf8" stroke-width="12"/>
  <rect x="118" y="176" width="276" height="36" fill="#0284c7"/>
  <rect x="146" y="236" width="66" height="50" rx="10" fill="url(#chip)"/>
  <circle cx="332" cy="262" r="30" fill="#10b981"/>
  <rect x="146" y="314" width="220" height="16" rx="8" fill="#e2e8f0"/>
</svg>
"""
    with open("public/icon.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)

    # Generate required PNG icons
    png_64 = create_png(64, 64, lambda x, y, w, h: icon_pixel(x, y, w, h, False))
    with open("public/favicon.ico", "wb") as f:
        f.write(create_ico_from_png(png_64, 64, 64))

    png_180 = create_png(180, 180, lambda x, y, w, h: icon_pixel(x, y, w, h, False))
    with open("public/apple-touch-icon.png", "wb") as f:
        f.write(png_180)

    png_192 = create_png(192, 192, lambda x, y, w, h: icon_pixel(x, y, w, h, False))
    with open("public/pwa-192x192.png", "wb") as f:
        f.write(png_192)

    png_512 = create_png(512, 512, lambda x, y, w, h: icon_pixel(x, y, w, h, False))
    with open("public/pwa-512x512.png", "wb") as f:
        f.write(png_512)

    png_maskable = create_png(512, 512, lambda x, y, w, h: icon_pixel(x, y, w, h, True))
    with open("public/pwa-maskable-512x512.png", "wb") as f:
        f.write(png_maskable)

    # Screenshots for Chrome/Edge Richer PWA Install UI on desktop & mobile
    png_wide = create_png(640, 360, screenshot_pixel)
    with open("public/pwa-screenshot-wide.png", "wb") as f:
        f.write(png_wide)

    png_narrow = create_png(360, 640, screenshot_pixel)
    with open("public/pwa-screenshot-narrow.png", "wb") as f:
        f.write(png_narrow)

    print("Successfully generated all PWA icons and assets in public/")


if __name__ == "__main__":
    main()

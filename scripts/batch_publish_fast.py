# -*- coding: utf-8 -*-
"""
PIL 기반 간단 흰 배경 제거 + 투명 WebP/PNG 리소스화 (rembg 없이 빠르게)
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("[ERROR] pip install pillow")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public" / "zodiac"
ARTIFACTS_DIR = Path(r"C:\Users\leehosang\.gemini\antigravity-ide\brain\78e10305-f26b-4c4c-b7fa-b15a6e70a9fc")

BATCH = {
    "tiger_glasses_1788412100407.jpg": "zodiac_tiger_item_glasses",
    "tiger_headphones_1788412125324.jpg": "zodiac_tiger_item_headphones",
    "tiger_bowtie_1788412148503.jpg": "zodiac_tiger_item_bowtie",
    "tiger_scarf_1788412174709.jpg": "zodiac_tiger_item_scarf",
    "tiger_sunglasses_1788412199526.jpg": "zodiac_tiger_item_sunglasses",
    "rabbit_glasses_1788411140184.jpg": "zodiac_rabbit_item_glasses",
    "rabbit_headphones_1788411157260.jpg": "zodiac_rabbit_item_headphones",
    "rabbit_bowtie_1788411174470.jpg": "zodiac_rabbit_item_bowtie",
    "rabbit_scarf_1788411195551.jpg": "zodiac_rabbit_item_scarf",
    "rabbit_sunglasses_1788411208823.jpg": "zodiac_rabbit_item_sunglasses",
}

SIZE = 320
PADDING = 8


def remove_white_bg(img):
    """Simple white background removal using color thresholding."""
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for p in datas:
        r, g, b, a = p
        # Pure white -> fully transparent
        if r > 245 and g > 245 and b > 245:
            new_data.append((255, 255, 255, 0))
        # Near-white -> semi-transparent (anti-aliasing edge)
        elif r > 225 and g > 225 and b > 225:
            avg = (r + g + b) / 3
            alpha = int(255 * (245 - avg) / 20)
            new_data.append((r, g, b, max(0, min(255, alpha))))
        else:
            new_data.append(p)
    img.putdata(new_data)
    return img


def process(src_path, out_name):
    print(f"  {src_path.name} -> {out_name}")

    img = Image.open(src_path)
    img = remove_white_bg(img)

    # Crop to content bounding box
    bbox = img.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        left = max(0, left - PADDING)
        top = max(0, top - PADDING)
        right = min(img.width, right + PADDING)
        bottom = min(img.height, bottom + PADDING)
        img = img.crop((left, top, right, bottom))

    # Resize
    w, h = img.size
    scale = SIZE / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Save
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    webp_path = PUBLIC_DIR / f"{out_name}.webp"
    png_path = PUBLIC_DIR / f"{out_name}.png"

    img.save(webp_path, "WEBP", quality=95)
    img.save(png_path, "PNG")
    print(f"  [OK] {webp_path.name} + {png_path.name} ({new_w}x{new_h})")


def main():
    print("=" * 60)
    print(" PIL 기반 빠른 배경 제거 + 리소스 배포")
    print("=" * 60)

    ok, skip = 0, 0
    for src_name, out_name in BATCH.items():
        src = ARTIFACTS_DIR / src_name
        if not src.exists():
            print(f"  [SKIP] {src_name}")
            skip += 1
            continue
        process(src, out_name)
        ok += 1

    print(f"\n[DONE] 성공: {ok}장, 스킵: {skip}장")
    print(f"배포: {PUBLIC_DIR}")


if __name__ == "__main__":
    main()

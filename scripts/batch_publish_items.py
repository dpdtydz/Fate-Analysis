# -*- coding: utf-8 -*-
"""
AI 생성 이미지의 흰 배경 제거 + 투명 WebP/PNG 리소스화 (일괄 처리)
generate_image 도구로 생성한 .jpg 파일을 읽어서 public/zodiac/ 에 리소스로 배포한다.
"""

import sys
from pathlib import Path
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    sys.exit("[ERROR] pip install pillow")

try:
    import rembg
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False
    print("[WARN] rembg not installed, using simple white threshold fallback")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public" / "zodiac"

# Source images from generate_image tool output
ARTIFACTS_DIR = Path(r"C:\Users\leehosang\.gemini\antigravity-ide\brain\78e10305-f26b-4c4c-b7fa-b15a6e70a9fc")

# Mapping: source filename pattern -> output name
BATCH = {
    # Tiger 5 items
    "tiger_glasses_1788412100407.jpg": "zodiac_tiger_item_glasses",
    "tiger_headphones_1788412125324.jpg": "zodiac_tiger_item_headphones",
    "tiger_bowtie_1788412148503.jpg": "zodiac_tiger_item_bowtie",
    "tiger_scarf_1788412174709.jpg": "zodiac_tiger_item_scarf",
    "tiger_sunglasses_1788412199526.jpg": "zodiac_tiger_item_sunglasses",
    # Rabbit 5 items (previously generated)
    "rabbit_glasses_1788411140184.jpg": "zodiac_rabbit_item_glasses",
    "rabbit_headphones_1788411157260.jpg": "zodiac_rabbit_item_headphones",
    "rabbit_bowtie_1788411174470.jpg": "zodiac_rabbit_item_bowtie",
    "rabbit_scarf_1788411195551.jpg": "zodiac_rabbit_item_scarf",
    "rabbit_sunglasses_1788411208823.jpg": "zodiac_rabbit_item_sunglasses",
}

SIZE = 320
PADDING = 8


def remove_bg_and_publish(src_path: Path, out_name: str):
    print(f"  Processing: {src_path.name} -> {out_name}")

    if HAS_REMBG:
        with open(src_path, "rb") as f:
            raw_bytes = f.read()
        transparent_bytes = rembg.remove(raw_bytes)
        img = Image.open(BytesIO(transparent_bytes)).convert("RGBA")
    else:
        img = Image.open(src_path).convert("RGBA")
        datas = img.getdata()
        new_data = []
        for p in datas:
            if p[0] > 240 and p[1] > 240 and p[2] > 240:
                new_data.append((255, 255, 255, 0))
            elif p[0] > 220 and p[1] > 220 and p[2] > 220:
                avg = (p[0] + p[1] + p[2]) / 3
                alpha = int(255 * (240 - avg) / 20)
                new_data.append((p[0], p[1], p[2], max(0, min(255, alpha))))
            else:
                new_data.append(p)
        img.putdata(new_data)

    # Crop to bounding box
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
    print(" 12지신 아이템 리소스 일괄 배경 제거 및 배포")
    print("=" * 60)

    success = 0
    skip = 0

    for src_name, out_name in BATCH.items():
        src_path = ARTIFACTS_DIR / src_name
        if not src_path.exists():
            print(f"  [SKIP] Not found: {src_name}")
            skip += 1
            continue
        remove_bg_and_publish(src_path, out_name)
        success += 1

    print(f"\n[DONE] 성공: {success}장, 스킵: {skip}장")
    print(f"배포 위치: {PUBLIC_DIR}")


if __name__ == "__main__":
    main()

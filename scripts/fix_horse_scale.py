# -*- coding: utf-8 -*-
"""
말(午) 5종 투명 배경 추출 및 정확한 캐릭터 바운딩 박스 기반 스케일링
"""

from pathlib import Path
from PIL import Image

RAW_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\assets\zodiac\raw\archetypes")
PUBLIC_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\public\zodiac")
ITEMS = ["glasses", "sunglasses", "bowtie", "headphones", "scarf"]

TARGET_GROUND_Y = 293
CANVAS_SIZE = 320
TARGET_HEIGHT = 282  # 귀/갈기를 포함한 전체 높이 282px -> 몸통 너비 약 165~175px (토끼/호랑이와 완벽 체급 일치)

def remove_bg(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for p in datas:
        r, g, b, a = p
        if r > 235 and g > 235 and b > 235:
            new_data.append((255, 255, 255, 0))
        elif r > 215 and g > 215 and b > 215:
            avg = (r + g + b) / 3
            alpha = int(255 * (235 - avg) / 20)
            new_data.append((r, g, b, max(0, min(255, alpha))))
        else:
            new_data.append(p)
    img.putdata(new_data)
    return img

for item in ITEMS:
    raw_p = RAW_DIR / f"zodiac_horse_item_{item}.png"
    if not raw_p.exists():
        continue
    raw_img = Image.open(raw_p)
    clean = remove_bg(raw_img)
    bbox = clean.getbbox()
    if not bbox:
        continue
    cropped = clean.crop(bbox)
    cw, ch = cropped.size

    scale = TARGET_HEIGHT / ch
    new_w = int(cw * scale)
    new_h = TARGET_HEIGHT

    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    paste_x = (CANVAS_SIZE - new_w) // 2
    paste_y = TARGET_GROUND_Y - new_h

    canvas.paste(resized, (paste_x, paste_y), resized)

    png_out = PUBLIC_DIR / f"zodiac_horse_item_{item}.png"
    webp_out = PUBLIC_DIR / f"zodiac_horse_item_{item}.webp"
    canvas.save(png_out, "PNG")
    canvas.save(webp_out, "WEBP", quality=95, method=6)
    print(f"Horse {item}: scaled to W={new_w}, H={new_h}, BBox={canvas.getbbox()}")

print("Done horse scaling!")

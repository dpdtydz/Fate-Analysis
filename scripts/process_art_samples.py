# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main")
PUBLIC_DIR = PROJECT_ROOT / "public" / "zodiac"
ART_DIR = Path(r"C:\Users\leehosang\.gemini\antigravity-ide\brain\78e10305-f26b-4c4c-b7fa-b15a6e70a9fc\art_direction")

def remove_white(img_path, out_name):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    new_data = []
    for p in datas:
        r, g, b, a = p
        if r > 240 and g > 240 and b > 240:
            new_data.append((255, 255, 255, 0))
        elif r > 220 and g > 220 and b > 220:
            avg = (r + g + b) / 3
            alpha = int(255 * (240 - avg) / 20)
            new_data.append((r, g, b, max(0, min(255, alpha))))
        else:
            new_data.append(p)
    img.putdata(new_data)
    
    bbox = img.getbbox()
    if bbox:
        l, t, r, b = bbox
        img = img.crop((max(0, l-8), max(0, t-8), min(img.width, r+8), min(img.height, b+8)))
    
    w, h = img.size
    scale = 320 / max(w, h)
    img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    
    img.save(PUBLIC_DIR / f"{out_name}.webp", "WEBP", quality=95)
    img.save(PUBLIC_DIR / f"{out_name}.png", "PNG")
    print("Saved:", out_name)

remove_white(ART_DIR / "lifestyle_tiger.png", "test_lifestyle_tiger")
remove_white(ART_DIR / "editorial_rabbit.png", "test_editorial_rabbit")

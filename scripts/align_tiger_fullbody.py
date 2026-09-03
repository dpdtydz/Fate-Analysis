# -*- coding: utf-8 -*-
"""
Regenerate tiger headphones and sunglasses so ALL 5 items have the EXACT SAME full-body chubby potato silhouette.
"""
import winreg
from pathlib import Path
from PIL import Image

with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
    api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")

from google import genai
client = genai.Client(api_key=api_key.strip().strip('"').strip())

OUT_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\assets\zodiac\raw\archetypes")
PUBLIC_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\public\zodiac")

ITEMS = {
    "headphones": "wearing cozy modern wireless over-ear headphones comfortably over its ears, vibing happily",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its nose, looking hip and confident",
}

PROMPT_TEMPLATE = """A premium modern Korean lifestyle brand character design of a cute chubby blue tiger, in the exact style of Muzik Tiger and Dinotaeng.
- COMPOSITION: Full body view, standing or sitting facing directly forward, centered, symmetrical cute pose with tiny paws and little feet.
- SILHOUETTE: Chubby round potato-like body with tiny feet, small rounded tiger ears on top, cute little tail.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with handcrafted warmth.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white muzzle patch, NO white belly patch. Simple black tiger stripes on sides and forehead. Zero gradients, zero shine.
- FACE & EYES: Simple minimalist black dot eyes, cute little black triangle nose and small mouth.
- ACCESSORY: {accessory}.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end trendy Korean lifestyle brand sticker, witty, deadpan, and adorable."""

def process_image(raw_path, out_name):
    img = Image.open(raw_path).convert("RGBA")
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
    new_w, new_h = int(w * scale), int(h * scale)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    img.save(PUBLIC_DIR / f"{out_name}.webp", "WEBP", quality=95)
    img.save(PUBLIC_DIR / f"{out_name}.png", "PNG")
    print(f"Published: {out_name} ({new_w}x{new_h})")

for item_key, accessory in ITEMS.items():
    prompt = PROMPT_TEMPLATE.format(accessory=accessory)
    print(f"Generating full-body tiger {item_key}...")
    resp = client.models.generate_content(model="gemini-2.5-flash-image", contents=prompt)
    raw_path = OUT_DIR / f"zodiac_tiger_item_{item_key}.png"
    for part in resp.candidates[0].content.parts:
        if getattr(part, "inline_data", None) and part.inline_data.data:
            raw_path.write_bytes(part.inline_data.data)
            print(f"Raw saved: {raw_path.name}")
            break
    process_image(raw_path, f"zodiac_tiger_item_{item_key}")

print("All full-body tiger items aligned!")

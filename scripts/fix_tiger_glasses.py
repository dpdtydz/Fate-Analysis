# -*- coding: utf-8 -*-
"""
Generate tiger with glasses matching the EXACT frontal chubby solid-blue style of bowtie/scarf/sunglasses.
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

# Matching the EXACT style of zodiac_tiger_item_bowtie.png and zodiac_tiger_item_scarf.png:
# - Full frontal view
# - Solid flat dusty-blue body (NO white muzzle, NO white chest)
# - Chubby pear/egg-shaped body, standing on two tiny feet, little arms
# - Tiny black dot eyes and cute cat-like nose
# - Round minimalist smart reading glasses
PROMPT = """A premium modern Korean lifestyle brand character design of a cute chubby blue tiger, in the exact style of Muzik Tiger and Dinotaeng.
- COMPOSITION: Full frontal view, standing/sitting facing directly forward, centered, symmetrical cute pose with tiny little paws.
- SILHOUETTE: Chubby round potato-like body with tiny feet, small rounded tiger ears on top, cute little tail.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with handcrafted warmth.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white muzzle patch, NO white belly patch. Simple black tiger stripes on sides and forehead. Zero gradients, zero shine.
- FACE & EYES: Simple minimalist black dot eyes, cute little black triangle nose and small mouth.
- ACCESSORY: Wearing neat minimalist round black wireframe smart reading glasses perched on its nose, with its cute dot eyes looking through the round lenses.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end trendy Korean lifestyle brand sticker, witty, deadpan, and adorable."""

print("Generating new consistent tiger glasses...")
resp = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=PROMPT
)

raw_path = OUT_DIR / "zodiac_tiger_item_glasses.png"
for part in resp.candidates[0].content.parts:
    if getattr(part, "inline_data", None) and part.inline_data.data:
        raw_path.write_bytes(part.inline_data.data)
        print("Raw saved:", raw_path)
        break

# Process to transparent WebP and PNG
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

webp_path = PUBLIC_DIR / "zodiac_tiger_item_glasses.webp"
png_path = PUBLIC_DIR / "zodiac_tiger_item_glasses.png"

img.save(webp_path, "WEBP", quality=95)
img.save(png_path, "PNG")

print(f"Published consistent tiger glasses: {new_w}x{new_h}")

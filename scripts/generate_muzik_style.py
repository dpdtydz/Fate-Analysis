# -*- coding: utf-8 -*-
"""
Generate the full 5-item set for Tiger & Rabbit in pure Muzik Tiger / Dinotaeng style.
No old anime references!
"""
import winreg
from pathlib import Path

with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
    api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")

from google import genai
client = genai.Client(api_key=api_key.strip().strip('"').strip())

OUT_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\assets\zodiac\raw\archetypes")
OUT_DIR.mkdir(parents=True, exist_ok=True)

ITEMS = {
    "glasses": "wearing chic minimalist round black wireframe glasses perched on its nose",
    "headphones": "wearing cozy modern wireless over-ear headphones comfortably over its ears, vibing to music",
    "bowtie": "wearing a neat classic red bowtie tied around its chubby neck, looking dapper and polite",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck",
    "sunglasses": "wearing cool retro round tinted party sunglasses perched on its nose, looking hip and confident",
}

# 1. Tiger items (using lifestyle tiger as reference or pure prompt)
# 2. Rabbit items
PROMPT_TEMPLATE = """A premium modern Korean lifestyle brand character design of a cute chubby blue {animal}, in the celebrated style of Muzik Tiger and Dinotaeng.
- ART STYLE: Contemporary Korean graphic illustration, flat 2D screenprint / risograph aesthetic.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with a slight organic handcrafted warmth.
- EYES: Charming minimalist clean black dot eyes with tiny subtle pupils, relaxed deadpan yet adorable expression. ABSOLUTELY NO shiny glass anime reflections, NO gradient sparkles.
- COLORING: 100% FLAT MATTE pastel dusty-blue color fill. ABSOLUTELY NO 3D airbrush gradients, NO plastic shine, NO glossy highlights.
- ACCESSORY: {accessory}.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end lifestyle merchandise, trendy Seongsu-dong pop-up store goods, sophisticated and witty. Not cheap clip-art, not children's cartoon."""

# Kill existing task if needed and generate
print("Starting high-end batch generation...")

for animal in ["tiger", "rabbit"]:
    for item_key, accessory in ITEMS.items():
        out_file = OUT_DIR / f"zodiac_{animal}_item_{item_key}.png"
        # If tiger + glasses already exists from approved lifestyle_tiger, skip!
        if animal == "tiger" and item_key == "glasses" and out_file.exists():
            print(f"Skipping tiger glasses (already approved): {out_file.name}")
            continue
            
        prompt = PROMPT_TEMPLATE.format(animal=animal, accessory=accessory)
        print(f"-> Generating: {animal} + {item_key}...")
        try:
            resp = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=prompt
            )
            for part in resp.candidates[0].content.parts:
                if getattr(part, "inline_data", None) and part.inline_data.data:
                    out_file.write_bytes(part.inline_data.data)
                    print(f"  [OK] Saved: {out_file.name}")
                    break
        except Exception as e:
            print(f"  [FAIL] {animal} + {item_key}: {e}")

print("All done!")

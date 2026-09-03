# -*- coding: utf-8 -*-
"""
뱀(snake) 선글라스 및 목도리에서 한글 텍스트("즈 뱀", "지 뱀") 제거 및 재생성.
- 프롬프트에서 한글 문자 제거하여 AI 텍스트 생성 원천 방지
- ABSOLUTELY NO TEXT, NO LETTERS 명시
"""

import time
import winreg
from pathlib import Path
from PIL import Image

with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
    api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")

from google import genai
client = genai.Client(api_key=api_key.strip().strip('"').strip())

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "assets" / "zodiac" / "raw" / "archetypes"
PUBLIC_DIR = PROJECT_ROOT / "public" / "zodiac"

TARGET_ITEMS = {
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its cute snake face, looking hip and confident",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck where the body coils, looking warm and friendly",
}

PROMPT_TEMPLATE = """A contemporary minimalist Korean lifestyle character illustration of an adorable chubby baby blue serpent.
- ANATOMY & BODY: A smooth authentic legless snake! ABSOLUTELY NO LEGS, NO ARMS, NO PAWS, NO HANDS, NO FEET, NO LIMBS AT ALL!
- SILHOUETTE: The chubby baby snake has a smooth cylindrical body coiled neatly into a friendly round spiral coil on the ground, with its cute chubby head rising up cutely from the center, and its small round tail tip peeking out.
- LINEWORK: Bold, clean, charming charcoal ink contour lines directly on the outer edge.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white patches, NO gradients, NO 3D shading.
- FACE & EYES: Simple minimalist black dot eyes (·  ·), cute tiny smiling mouth.
- ACCESSORY: {accessory}.
- STRICT RULE: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO WATERMARK, NO KOREAN LETTERS AT ALL. Just the pure character.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows."""


def remove_bg_and_normalize(raw_path: Path) -> Image.Image:
    img = Image.open(raw_path).convert("RGBA")
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

    bbox = img.getbbox()
    if bbox:
        l, t, r, b = bbox
        img = img.crop((max(0, l - 4), max(0, t - 4), min(img.width, r + 4), min(img.height, b + 4)))

    w, h = img.size
    scale = 268 / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    scaled_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    offset_x = (320 - new_w) // 2
    offset_y = (320 - new_h) // 2
    canvas.paste(scaled_img, (offset_x, offset_y), scaled_img)
    return canvas


def main():
    for item_key, accessory in TARGET_ITEMS.items():
        out_name = f"zodiac_snake_item_{item_key}"
        raw_path = RAW_DIR / f"{out_name}.png"
        prompt = PROMPT_TEMPLATE.format(accessory=accessory)
        print(f"Regenerating clean snake + {item_key}...")

        success = False
        for attempt in range(1, 4):
            try:
                resp = client.models.generate_content(
                    model="gemini-2.5-flash-image",
                    contents=prompt
                )
                for part in resp.candidates[0].content.parts:
                    if getattr(part, "inline_data", None) and part.inline_data.data:
                        raw_path.write_bytes(part.inline_data.data)
                        success = True
                        break
                if success:
                    break
            except Exception as e:
                print(f"Retry {attempt}: {e}")
                time.sleep(2 * attempt)

        if success:
            canvas = remove_bg_and_normalize(raw_path)
            canvas.save(PUBLIC_DIR / f"{out_name}.webp", "WEBP", quality=95)
            canvas.save(PUBLIC_DIR / f"{out_name}.png", "PNG")
            print(f"Done: {out_name}")


if __name__ == "__main__":
    main()

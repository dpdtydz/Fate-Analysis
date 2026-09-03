# -*- coding: utf-8 -*-
"""
강아지(戌) 5종의 스티커 흰색 테두리(die-cut border) 완전 제거 및
쫑긋 세모 귀(upright triangular perky ears) 100% 동기화 스크립트.
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

ITEMS = {
    "glasses": "wearing neat minimalist round black wireframe smart reading glasses perched on its nose, looking clever",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its nose, looking hip and confident",
    "headphones": "wearing cozy modern cream wireless over-ear headphones comfortably over its ears, vibing happily",
}

PROMPT_TEMPLATE = """A contemporary minimalist Korean lifestyle character illustration of an extremely chubby round potato-like blue puppy with small upright triangular perky ears (like a cute Korean Jindo puppy), tiny curled tail, standing facing directly forward, centered, symmetrical cute pose.
- SILHOUETTE: Extremely chubby round potato body, tiny paws and feet, small upright triangular ears sticking straight up, cute little curled tail.
- LINEWORK: Bold, clean, charming charcoal ink contour lines directly on the outer edge. ABSOLUTELY NO white die-cut sticker borders, NO outer white contour margin, NO white glow.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white muzzle patches, NO gradients, NO 3D shading.
- FACE & EYES: Simple minimalist black dot eyes (·  ·), cute tiny black button nose and small mouth.
- ACCESSORY: {accessory}.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end contemporary Korean boutique mascot, original, witty, deadpan, and adorable. Completely unique, not copying any famous Japanese or American character."""


def remove_bg_and_crop(raw_path: Path) -> Image.Image:
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
    print("강아지 안경, 선글라스, 헤드폰 테두리 제거 및 귀 동기화 시작...")
    for item_key, accessory in ITEMS.items():
        out_name = f"zodiac_dog_item_{item_key}"
        raw_path = RAW_DIR / f"{out_name}.png"
        prompt = PROMPT_TEMPLATE.format(accessory=accessory)
        print(f"-> Regenerating: dog + {item_key}...")

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
                print(f"   [RETRY {attempt}/3] {e}")
                time.sleep(2 * attempt)

        if success:
            canvas = remove_bg_and_crop(raw_path)
            canvas.save(PUBLIC_DIR / f"{out_name}.webp", "WEBP", quality=95)
            canvas.save(PUBLIC_DIR / f"{out_name}.png", "PNG")
            print(f"   [OK 320x320] {out_name}")

    print("완료!")


if __name__ == "__main__":
    main()

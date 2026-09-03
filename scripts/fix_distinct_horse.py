# -*- coding: utf-8 -*-
"""
말(午) 5종 전면 재창작 스크립트:
- 돼지코(pig snout) 100% 완전 퇴출!
- 말 특유의 살짝 긴 주둥이(elongated horse muzzle) + 멋진 말 갈기(flowing horse mane) + 쫑긋한 말 귀(tall horse ears) + 풍성한 말 꼬리
- 돼지나 소와 0.1초 만에 완벽히 구별되는 독보적인 말 캐릭터 조형
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
    "glasses": "wearing neat minimalist round black wireframe smart reading glasses perched on its horse muzzle, looking clever",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its horse muzzle, looking hip and confident",
    "bowtie": "wearing a neat classic red bowtie tied around its chubby neck, looking dapper and polite",
    "headphones": "wearing cozy modern cream wireless over-ear headphones comfortably over its ears, vibing happily",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck, looking warm and friendly",
}

PROMPT_TEMPLATE = """A contemporary minimalist Korean lifestyle character illustration of an unmistakable cute blue HORSE (午 말).
- DISTINCTIVE HORSE ANATOMY: Unmistakable horse features! A slightly elongated elegant horse muzzle with a gentle smiling mouth (ABSOLUTELY NO flat pig snout, NO upturned pig nostrils, NOT A PIG, NOT A COW).
- HAIR & MANE: A stylish, charming flowing horse mane (hair) neatly falling between its tall pointed horse ears and running down the back of its neck.
- TAIL & FEET: A cute bushy horse tail peeking from behind, tiny standing horse hooves.
- POSTURE: Standing upright facing directly forward on two tiny feet, perfectly symmetrical, vertical posture, arms resting at sides.
- LINEWORK: Bold, clean, charming charcoal ink contour lines directly on the outer edge. ABSOLUTELY NO white die-cut sticker borders.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white patches, NO gradients, NO 3D shading.
- FACE & EYES: Simple minimalist black dot eyes (·  ·), cute horse muzzle.
- ACCESSORY: {accessory}.
- STRICT RULE: ABSOLUTELY NO TEXT, NO WORDS.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end contemporary Korean boutique mascot, witty, deadpan, clearly and unmistakably a noble cute HORSE."""


def remove_bg(raw_path: Path) -> Image.Image:
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
    return img


def main():
    print("=" * 60)
    print(" 말(午) 5종 돼지코 탈피 및 진짜 말 갈기/체형 재창작 시작")
    print("=" * 60)

    for item_key, accessory in ITEMS.items():
        out_name = f"zodiac_horse_item_{item_key}"
        raw_path = RAW_DIR / f"{out_name}.png"
        prompt = PROMPT_TEMPLATE.format(accessory=accessory)
        print(f"-> Generating clear distinctive horse + {item_key}...")

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
            clean = remove_bg(raw_path)
            clean.save(PUBLIC_DIR / f"{out_name}.png", "PNG")
            print(f"   [RAW OK] {out_name}")

    print("\n[COMPLETE] 말 5종 원시 생성 완료!")


if __name__ == "__main__":
    main()

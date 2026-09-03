# -*- coding: utf-8 -*-
"""
12지신 전 동물 '100% 정면 직립 스탠딩(Standing Frontal)' 단일 자세 규격화 파이프라인.
- 11마리 동물(쥐, 소, 호랑이, 토끼, 용, 말, 양, 원숭이, 닭, 돼지) 대상 전원 서 있는 자세(Standing) 강제
- 앉기(Sitting), 측면 각도, 날개 벌림 전면 금지
- 320x320 고정 캔버스 중앙 정렬로 완벽한 픽셀 단위 크기 일체화
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
RAW_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

# 11개 대상 동물 (개와 뱀은 이미 통일되어 완료됨)
STAND_ANIMALS = {
    "rat": "extremely chubby round blue mouse with big round ears, tiny standing feet",
    "ox": "extremely chubby round blue ox with tiny little blunt horns, round muzzle, tiny standing feet",
    "tiger": "extremely chubby round potato-like blue tiger with tiny round ears, subtle charcoal stripes, tiny standing feet",
    "rabbit": "extremely chubby egg-shaped blue bunny with tall upright ears, tiny standing feet",
    "dragon": "extremely chubby baby round blue eastern dragon with tiny round antlers, small belly ridges, tiny standing feet",
    "horse": "extremely chubby round blue pony with tiny little cute mane and small tail, tiny standing feet",
    "sheep": "extremely chubby fluffy round blue sheep with soft curls, tiny standing feet",
    "monkey": "extremely chubby round blue monkey with round ears, tiny standing feet",
    "rooster": "extremely chubby round blue rooster chick with tiny cute red comb, wings neatly tucked at sides, tiny standing feet",
    "pig": "extremely chubby round blue piglet with tiny snout, tiny standing feet",
}

ITEMS = {
    "glasses": "wearing neat minimalist round black wireframe smart reading glasses perched on its nose, looking clever",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its nose, looking hip and confident",
    "bowtie": "wearing a neat classic red bowtie tied around its chubby neck, looking dapper and polite",
    "headphones": "wearing cozy modern cream wireless over-ear headphones comfortably over its ears, vibing happily",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck, looking warm and friendly",
}

PROMPT_TEMPLATE = """A contemporary minimalist Korean lifestyle character illustration of an {animal_desc}.
- STRICT POSTURE & POSE: STANDING UPRIGHT FACING DIRECTLY FORWARD on two tiny feet. Perfectly symmetrical, vertical posture, standing straight up. Both tiny arms resting neatly at the sides of its chubby body. Head looking directly forward at the camera.
- CRITICAL: ABSOLUTELY NO SITTING DOWN, NO LEANING, NO TURNING 3/4, NO SPLAYED LEGS, NO WINGS SPREAD. Strict, neat, symmetrical front-facing standing posture.
- SILHOUETTE: Extremely chubby round potato-like body standing straight up on two tiny feet.
- LINEWORK: Bold, clean, charming charcoal ink contour lines directly on the outer edge. ABSOLUTELY NO white die-cut sticker borders, NO outer white glow.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white patches, NO gradients, NO 3D shading.
- FACE & EYES: Simple minimalist black dot eyes (·  ·), cute tiny nose and small mouth.
- ACCESSORY: {accessory}.
- STRICT RULE: ABSOLUTELY NO TEXT, NO WORDS, NO WATERMARK.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end contemporary Korean boutique mascot, witty, deadpan, and adorable."""


def remove_bg_and_normalize(raw_path: Path, canvas_size: int = 320, inner_size: int = 268) -> Image.Image:
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
    scale = inner_size / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    scaled_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2
    canvas.paste(scaled_img, (offset_x, offset_y), scaled_img)
    return canvas


def main():
    print("=" * 60)
    print(" 10마리 동물 100% 정면 스탠딩 단일 자세 일괄 재생성 파이프라인")
    print("=" * 60)

    total = len(STAND_ANIMALS) * len(ITEMS)
    done = 0

    for animal, desc in STAND_ANIMALS.items():
        print(f"\n[CANONICAL STANDING: {animal}]")
        for item_key, accessory in ITEMS.items():
            out_name = f"zodiac_{animal}_item_{item_key}"
            raw_path = RAW_DIR / f"{out_name}.png"
            prompt = PROMPT_TEMPLATE.format(animal_desc=desc, accessory=accessory)
            print(f"-> Generating: {animal} + {item_key}...")

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
                canvas = remove_bg_and_normalize(raw_path, canvas_size=320, inner_size=268)
                canvas.save(PUBLIC_DIR / f"{out_name}.webp", "WEBP", quality=95)
                canvas.save(PUBLIC_DIR / f"{out_name}.png", "PNG")
                done += 1
                print(f"   [OK 320x320 정면스탠딩] {out_name} ({done}/{total})")
            else:
                print(f"   [FAIL] {out_name}")

    print("\n[COMPLETE] 10마리 x 5종 정면 스탠딩 자세 일체화 완료!")


if __name__ == "__main__":
    main()

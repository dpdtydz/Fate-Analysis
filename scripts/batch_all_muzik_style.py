# -*- coding: utf-8 -*-
"""
12지신 나머지 10종 동물에 대해 무직타이거 & 다이노탱 감성의
힙한 브랜드 캐릭터 5대 소품 일괄 생성 및 투명 WebP 배포 파이프라인.
"""

import sys
import time
import winreg
from pathlib import Path
from PIL import Image

# 1. API 키 로드
with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
    api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")

from google import genai
client = genai.Client(api_key=api_key.strip().strip('"').strip())

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "assets" / "zodiac" / "raw" / "archetypes"
PUBLIC_DIR = PROJECT_ROOT / "public" / "zodiac"
RAW_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

# 2. 동물별 미니멀 뚱땅이 실루엣 정의
ANIMALS = {
    "rat": "cute chubby round blue mouse with big rounded ears",
    "ox": "cute chubby round blue ox with tiny little horns",
    "dragon": "cute chubby baby blue eastern dragon with tiny rounded antlers",
    "snake": "cute chubby round coiled baby blue serpent",
    "horse": "cute chubby round blue pony with cute tiny mane",
    "sheep": "cute chubby fluffy round blue sheep with soft curls",
    "monkey": "cute chubby round blue monkey with round ears",
    "rooster": "cute chubby round blue rooster chick with tiny red comb",
    "dog": "cute chubby round floppy-eared blue puppy",
    "pig": "cute chubby round blue piglet with tiny snout",
}

# 3. 5대 일상 소품 정의
ITEMS = {
    "glasses": "wearing neat minimalist round black wireframe smart reading glasses perched on its nose, looking clever",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its nose, looking hip and confident",
    "bowtie": "wearing a neat classic red bowtie tied around its chubby neck, looking dapper and polite",
    "headphones": "wearing cozy modern wireless over-ear headphones comfortably over its ears, vibing happily",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck, looking warm and friendly",
}

# 4. 무직타이거 & 다이노탱 승인 프롬프트 공식
PROMPT_TEMPLATE = """A premium modern Korean lifestyle brand character design of a {animal_desc}, in the celebrated style of Muzik Tiger and Dinotaeng.
- COMPOSITION: Full body view, standing or sitting facing directly forward, centered, symmetrical cute pose with tiny little paws and feet.
- SILHOUETTE: Chubby round potato-like body, standing upright or sitting cute.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with handcrafted warmth.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white patches, NO gradients, NO plastic shine.
- FACE & EYES: Simple minimalist black dot eyes, cute tiny nose and small mouth.
- ACCESSORY: {accessory}.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end trendy Korean lifestyle brand sticker, witty, deadpan, and adorable. Not cheap clip-art, not children's cartoon."""


def process_and_publish(raw_path: Path, out_name: str):
    """빠른 PIL 기반 배경 제거 및 WebP 배포 (0.1초 소요)."""
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
        img = img.crop((max(0, l - 8), max(0, t - 8), min(img.width, r + 8), min(img.height, b + 8)))

    w, h = img.size
    scale = 320 / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    webp_out = PUBLIC_DIR / f"{out_name}.webp"
    png_out = PUBLIC_DIR / f"{out_name}.png"
    img.save(webp_out, "WEBP", quality=95)
    img.save(png_out, "PNG")
    print(f"  [OK WebP] {out_name}.webp ({new_w}x{new_h})")


def main():
    print("=" * 60)
    print(" 12지신 나머지 10마리 무직타이거 화풍 일괄 생성 파이프라인")
    print(f" 대상 동물: {list(ANIMALS.keys())}")
    print("=" * 60)

    total = len(ANIMALS) * len(ITEMS)
    done = 0

    for animal, animal_desc in ANIMALS.items():
        print(f"\n[ANIMAL: {animal}]")
        for item_key, accessory in ITEMS.items():
            out_name = f"zodiac_{animal}_item_{item_key}"
            raw_path = RAW_DIR / f"{out_name}.png"
            
            prompt = PROMPT_TEMPLATE.format(animal_desc=animal_desc, accessory=accessory)
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
                process_and_publish(raw_path, out_name)
                done += 1
                print(f"   진행률: {done}/{total} ({done*100//total}%)")
            else:
                print(f"   [FAIL] {out_name} 생성 실패")

    print("\n[COMPLETE] 10마리 x 5종 무직타이거 일괄 배포 완료!")


if __name__ == "__main__":
    main()

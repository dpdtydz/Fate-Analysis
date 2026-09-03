# -*- coding: utf-8 -*-
"""
감사 지적 사항에 따른 6마리 동물(호랑이 3종 + 소/용/뱀/말/닭 각 5종 = 총 28종)
오리지널 현대 라이프스타일 뚱땅이 화풍 완전 재정렬 및 배포 파이프라인.
- 특정 브랜드명(무직타이거 등) 프롬프트 원천 배제 (저작권 100% 안전)
- 단색 플랫 더스티 블루 + 덤덤한 점 눈동자 + 손맛 먹선 윤곽선
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

# 2. 대상 동물별 미니멀 뚱땅이 실루엣 정의
TARGET_ANIMALS = {
    "tiger": {
        "desc": "extremely chubby round potato-like blue tiger with tiny rounded ears, cute subtle charcoal stripes",
        "items": ["bowtie", "headphones", "scarf"],
    },
    "ox": {
        "desc": "extremely chubby round potato-like blue ox with tiny little blunt horns and round muzzle",
        "items": ["glasses", "sunglasses", "bowtie", "headphones", "scarf"],
    },
    "dragon": {
        "desc": "extremely chubby baby round blue eastern dragon with tiny rounded deer antlers and small belly ridges",
        "items": ["glasses", "sunglasses", "bowtie", "headphones", "scarf"],
    },
    "snake": {
        "desc": "extremely chubby cute round coiled baby blue serpent with tiny rounded head and small tail tip",
        "items": ["glasses", "sunglasses", "bowtie", "headphones", "scarf"],
    },
    "horse": {
        "desc": "extremely chubby round potato-like blue pony with tiny little cute mane and small tail",
        "items": ["glasses", "sunglasses", "bowtie", "headphones", "scarf"],
    },
    "rooster": {
        "desc": "extremely chubby round blue rooster chick with tiny cute red comb and round tail feathers",
        "items": ["glasses", "sunglasses", "bowtie", "headphones", "scarf"],
    },
}

# 3. 5대 일상 소품 정의
ITEMS_DEF = {
    "glasses": "wearing neat minimalist round black wireframe smart reading glasses perched on its nose, looking clever",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its nose, looking hip and confident",
    "bowtie": "wearing a neat classic red bowtie tied around its chubby neck, looking dapper and polite",
    "headphones": "wearing cozy modern cream wireless over-ear headphones comfortably over its ears, vibing happily",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck, looking warm and friendly",
}

# 4. 100% 오리지널 조형 프롬프트 (타사 브랜드 상표/명칭 완전 배제)
PROMPT_TEMPLATE = """A contemporary minimalist Korean lifestyle designer mascot sticker of a {animal_desc}.
- COMPOSITION: Full body view, standing or sitting facing directly forward, centered, symmetrical cute pose with tiny little paws and feet.
- SILHOUETTE: Extremely chubby round potato-like body, standing upright or sitting cute.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with handcrafted warmth.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white muzzle patches, NO white stomach patches, NO airbrush gradients, NO 3D plastic shine.
- FACE & EYES: Simple minimalist black dot eyes (·  ·), cute tiny nose, small cat-like mouth. ABSOLUTELY NO shiny anime reflections, NO gradient sparkles, NO hyper-reflective pupils.
- ACCESSORY: {accessory}.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end contemporary Korean boutique mascot, witty, deadpan, and adorable."""


def process_and_publish(raw_path: Path, out_name: str):
    """초고속 PIL 투명화 크롭 및 WebP 배포."""
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
    print(" 감사 지적 6마리 동물 오리지널 뚱땅이 화풍 완전 재배포 시작")
    print("=" * 60)

    total = sum(len(conf["items"]) for conf in TARGET_ANIMALS.values())
    done = 0

    for animal, conf in TARGET_ANIMALS.items():
        print(f"\n[TARGET ANIMAL: {animal}]")
        desc = conf["desc"]
        for item_key in conf["items"]:
            accessory = ITEMS_DEF[item_key]
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
                process_and_publish(raw_path, out_name)
                done += 1
                print(f"   진행률: {done}/{total} ({done*100//total}%)")
            else:
                print(f"   [FAIL] {out_name} 생성 실패")

    print("\n[COMPLETE] 6마리 28종 오리지널 화풍 재정렬 완료!")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
하이엔드 브랜드 캐릭터 아트 디렉션 테스트 스크립트
AI 티(번들거림, 과도한 안광, 플라스틱 그라데이션)를 100% 제거하고,
한국 2030 세대가 열광하는 현대 라이프스타일 브랜드 일러스트(무직타이거 / 다이노탱 / 최고심 감성)로 생성.
"""

import os
import winreg
from pathlib import Path
from PIL import Image
from io import BytesIO

# 레지스트리에서 검증된 API 키 읽기
with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
    api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")

from google import genai
client = genai.Client(api_key=api_key.strip().strip('"').strip())

OUT_DIR = Path(r"C:\Users\leehosang\.gemini\antigravity-ide\brain\78e10305-f26b-4c4c-b7fa-b15a6e70a9fc\art_direction")
OUT_DIR.mkdir(parents=True, exist_ok=True)

PROMPTS = {
    # 컨셉 1: 무직타이거/다이노탱 스타일의 힙하고 세련된 매트 플랫 캐릭터 (인기 굿즈 브랜드 감성)
    "lifestyle_tiger": """A premium modern Korean lifestyle brand character design of a cute chubby blue tiger, in the style of Muzik Tiger and Dinotaeng.
- ART STYLE: Contemporary Korean graphic illustration, flat 2D screenprint / risograph aesthetic.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with a slight organic handcrafted warmth.
- EYES: Charming minimalist clean black dot eyes with tiny subtle pupils, relaxed deadpan yet adorable expression. ABSOLUTELY NO shiny glass anime reflections, NO gradient sparkles.
- COLORING: 100% FLAT MATTE pastel dusty-blue color fill. ABSOLUTELY NO 3D airbrush gradients, NO plastic shine, NO glossy highlights.
- ACCESSORY: Wearing chic minimalist round black wireframe glasses perched on its nose.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end lifestyle merchandise, trendy Seongsu-dong pop-up store goods, sophisticated and witty. Not cheap clip-art, not children's cartoon.""",

    # 컨셉 2: 인연사주 한지 UI와 200% 일치하는 단아한 모던 먹선 에디토리얼 토끼
    "editorial_rabbit": """A sophisticated Korean editorial brand mascot design of a cute sitting rabbit, perfectly matching a modern Hanok aesthetic.
- ART STYLE: Modern Korean minimalist ink-line illustration with muted flat watercolor fill.
- LINEWORK: Elegant, controlled ink brush lines with calligraphic rhythm, refined and tasteful.
- EYES: Simple, gentle, expressive dark ink eyes, warm and thoughtful gaze. NO hyper-glossy anime eyes.
- COLORING: Flat muted misty-blue and soft ivory hanji paper tones, completely matte and textured.
- ACCESSORY: Wearing sleek minimalist modern wireless headphones over its ears.
- BACKGROUND: Pure solid clean white background (#FFFFFF), isolated, no shadows.
- AESTHETIC: Luxury traditional-contemporary lifestyle brand, editorial book illustration, peaceful and intellectual."""
}

print("=== 하이엔드 캐릭터 아트 디렉션 이미지 생성 시작 ===")
for name, prompt in PROMPTS.items():
    print(f"-> 생성 중: {name}...")
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt
        )
        for part in resp.candidates[0].content.parts:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                raw_path = OUT_DIR / f"{name}.png"
                raw_path.write_bytes(part.inline_data.data)
                print(f"  [OK] 저장 완료: {raw_path}")
                break
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")

print("=== 완료 ===")

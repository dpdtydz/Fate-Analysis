# -*- coding: utf-8 -*-
"""
12지신 현대 라이프스타일 성향/아이템 일괄 생성 및 리소스화 스크립트
(gemini-2.5-flash-image + rembg + PIL)

용도:
  사주·MBTI·자미두수 초개인화를 위한 현대적 귀여운 소품 장착 캐릭터 일괄 생성.
  런타임 레이어링(합성) 없이, 완전한 단일 고해상도 투명 WebP/PNG 리소스로 사전 제작.

사용법:
  # 토끼의 5대 대표 소품(안경, 헤드폰, 보타이, 목도리, 선글라스) 일괄 생성 + 배경 제거 + 배포
  python scripts/generate_archetypes.py --animals rabbit --items glasses,headphones,bowtie,scarf,sunglasses

  # 특정 동물과 아이템 생성:
  python scripts/generate_archetypes.py --animals tiger,dragon --items glasses,headphones

  # 생성된 raw 이미지 배경 제거 및 public/zodiac/ 배포만 수행:
  python scripts/generate_archetypes.py --process-only
"""

import argparse
import os
import sys
import time
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REFS_DIR = PROJECT_ROOT / "assets" / "zodiac" / "refs"
PUBLIC_DIR = PROJECT_ROOT / "public" / "zodiac"
RAW_DIR = PROJECT_ROOT / "assets" / "zodiac" / "raw" / "archetypes"
PNG_DIR = PROJECT_ROOT / "assets" / "zodiac" / "png" / "archetypes"

MODEL = "gemini-2.5-flash-image"
MAX_RETRIES = 3

# 12지신 동물 기본 정의
ANIMALS = {
    "rat": "a cute little blue rat",
    "ox": "a cute little blue ox",
    "tiger": "a cute little blue tiger cub",
    "rabbit": "a cute little blue cartoon rabbit",
    "dragon": "a cute baby blue eastern dragon",
    "snake": "a cute friendly blue serpent",
    "horse": "a cute little blue pony",
    "sheep": "a cute fluffy blue sheep",
    "monkey": "a cute playful blue monkey",
    "rooster": "a cute blue rooster chick",
    "dog": "a cute blue puppy",
    "pig": "a cute round blue piglet",
}

# 현대적 일상/성향 아이템 정의 (MBTI & 자미두수 시그니처)
ITEMS = {
    "glasses": {
        "name_kr": "스마트 안경",
        "category": "mbti_nt_brain",
        "prompt": "wearing stylish cute round smart reading glasses perched neatly on its face/eyes, looking clever and thoughtful",
    },
    "headphones": {
        "name_kr": "무선 헤드폰",
        "category": "mbti_sp_craft",
        "prompt": "wearing cozy modern wireless over-ear headphones comfortably around its head/ears, looking relaxed and focused",
    },
    "bowtie": {
        "name_kr": "레드 보타이",
        "category": "mbti_sj_leader",
        "prompt": "wearing a neat stylish classic red bowtie tied around its neck, looking dapper, polite, and confident",
    },
    "scarf": {
        "name_kr": "니트 목도리",
        "category": "mbti_nf_healer",
        "prompt": "wearing a cozy warm red knitted winter scarf wrapped neatly around its neck, looking gentle, friendly and comforting",
    },
    "sunglasses": {
        "name_kr": "파티 선글라스",
        "category": "mbti_ep_spark",
        "prompt": "wearing cool retro round tinted party sunglasses perched on its nose, looking cheerful, trendy, and full of positive energy",
    },
    "watch": {
        "name_kr": "스마트워치",
        "category": "ziwei_ziwei",
        "prompt": "wearing a sleek modern minimalist smartwatch strapped onto its tiny front paw/wrist, glancing at the time proudly",
    },
    "tumbler": {
        "name_kr": "보온 텀블러",
        "category": "ziwei_tianliang",
        "prompt": "holding a small pastel insulated warm coffee tumbler cup in both front paws, content and cozy smile",
    },
    "cardholder": {
        "name_kr": "카드지갑",
        "category": "ziwei_wugu",
        "prompt": "wearing a neat minimalist leather cardholder lanyard necklace hanging from its neck, looking tidy and organized",
    },
    "backpack": {
        "name_kr": "캐주얼 백팩",
        "category": "ziwei_tianfu",
        "prompt": "wearing a cute tiny canvas backpack over its shoulders, standing proudly like ready for a fun journey",
    },
    "diary": {
        "name_kr": "감성 다이어리",
        "category": "ziwei_taiyin",
        "prompt": "holding a small leather pocket notebook diary and a tiny pen in its paws, thoughtful and sensitive expression",
    },
}

PROMPT_TEMPLATE = """A premium modern Korean lifestyle brand character design of a cute chubby {animal_desc}, in the celebrated style of Muzik Tiger and Dinotaeng.
- ART STYLE: Contemporary Korean graphic illustration, flat 2D screenprint / risograph aesthetic.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with a slight organic handcrafted warmth.
- EYES: Charming minimalist clean black dot eyes with tiny subtle pupils, relaxed deadpan yet adorable expression. ABSOLUTELY NO shiny glass anime reflections, NO gradient sparkles.
- COLORING: 100% FLAT MATTE pastel dusty-blue color fill. ABSOLUTELY NO 3D airbrush gradients, NO plastic shine, NO glossy highlights.
- ACCESSORY: {item_prompt}.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end lifestyle merchandise, trendy Seongsu-dong pop-up store goods, sophisticated and witty. Not cheap clip-art, not children's cartoon.
"""


def find_reference_image(animal: str) -> Path:
    """동물 레퍼런스 이미지 경로를 찾는다."""
    candidates = [
        REFS_DIR / f"zodiac_{animal}_base.png",
        PUBLIC_DIR / f"zodiac_{animal}_base.png",
        PUBLIC_DIR / f"zodiac_{animal}_metal.png",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def image_part(path: Path):
    from google.genai import types
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return types.Part.from_bytes(data=path.read_bytes(), mime_type=mime)


def generate_single_item(client, animal: str, item_key: str, ref_path: Path, out_raw: Path):
    """Gemini API를 호출하여 단일 아이템 착용 이미지를 생성한다."""
    if out_raw.exists():
        print(f"  [SKIP] Raw image already exists: {out_raw.name}")
        return True

    item_info = ITEMS[item_key]
    prompt = PROMPT_TEMPLATE.format(
        animal_desc=ANIMALS[animal],
        item_prompt=item_info["prompt"]
    )

    print(f"  -> Generating: {animal} + {item_key} ({item_info['name_kr']})...")
    
    contents = [
        image_part(ref_path),
        prompt,
    ]

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = client.models.generate_content(model=MODEL, contents=contents)
            for part in resp.candidates[0].content.parts:
                if getattr(part, "inline_data", None) and part.inline_data.data:
                    out_raw.parent.mkdir(parents=True, exist_ok=True)
                    out_raw.write_bytes(part.inline_data.data)
                    print(f"  [OK] Saved raw: {out_raw.name}")
                    return True
            print(f"  [WARN] 응답에 이미지가 없음 (시도 {attempt}/{MAX_RETRIES})")
        except Exception as e:
            print(f"  [RETRY {attempt}/{MAX_RETRIES}] API call failed: {e}")
            time.sleep(2 * attempt)

    return False


def remove_background_and_publish(raw_path: Path, png_out: Path, public_webp: Path, size=320, padding=8):
    """배경을 제거하고 투명 PNG 및 웹 최적화 WebP로 저장한다 (빠른 PIL 임계값 처리)."""
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

    # 투명 알파 채널 기준 바운딩 박스 크롭
    bbox = img.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        left = max(0, left - padding)
        top = max(0, top - padding)
        right = min(img.width, right + padding)
        bottom = min(img.height, bottom + padding)
        img = img.crop((left, top, right, bottom))

    # 리사이즈 (긴 변 기준)
    w, h = img.size
    scale = size / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # 저장
    png_out.parent.mkdir(parents=True, exist_ok=True)
    img.save(png_out, "PNG")

    public_webp.parent.mkdir(parents=True, exist_ok=True)
    img.save(public_webp, "WEBP", quality=95)
    
    public_png = public_webp.with_suffix(".png")
    img.save(public_png, "PNG")

    print(f"  [PUBLISHED] -> {public_webp.name} ({new_w}x{new_h})")


def main():
    parser = argparse.ArgumentParser(description="12지신 성향/소품 캐릭터 일괄 생성 및 리소스화")
    parser.add_argument("--animals", default="rabbit", help="대상 동물 (쉼표 구분, 예: rabbit,tiger)")
    parser.add_argument("--items", default="glasses,headphones,bowtie,scarf,sunglasses",
                        help="대상 아이템 (쉼표 구분, 기본 5종)")
    parser.add_argument("--process-only", action="store_true", help="생성 없이 배경 제거 및 배포만 수행")
    parser.add_argument("--size", type=int, default=320, help="출력 해상도(px)")
    args = parser.parse_args()

    target_animals = [a.strip() for a in args.animals.split(",") if a.strip()]
    target_items = [i.strip() for i in args.items.split(",") if i.strip()]

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    client = None
    if not args.process_only:
        # setx로 등록한 키는 현재 프로세스에 반영 안 되므로 레지스트리에서 직접 읽기
        api_key = ""
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
                api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")
        except Exception:
            api_key = os.environ.get("GEMINI_API_KEY", "")
        api_key = api_key.strip().strip('"').strip("'").strip()
        if not api_key:
            sys.exit("[ERROR] GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        print(f"[key] 길이 {len(api_key)}자, 끝4자 '...{api_key[-4:]}'")
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
        except ImportError:
            sys.exit("[ERROR] pip install google-genai 필요")

    print("========================================================")
    print(" 12지신 현대 라이프스타일 성향 리소스 파이프라인")
    print(f" 대상 동물: {target_animals}")
    print(f" 대상 아이템: {target_items}")
    print("========================================================")

    for animal in target_animals:
        ref_path = find_reference_image(animal)
        if not ref_path:
            print(f"[WARN] 레퍼런스 이미지를 찾을 수 없습니다: {animal}")
            continue

        print(f"\n[ANIMAL: {animal}] Reference: {ref_path.name}")

        for item_key in target_items:
            if item_key not in ITEMS:
                print(f"  [SKIP] 알 수 없는 아이템: {item_key}")
                continue

            raw_file = RAW_DIR / f"zodiac_{animal}_item_{item_key}.png"
            png_file = PNG_DIR / f"zodiac_{animal}_item_{item_key}.png"
            public_webp = PUBLIC_DIR / f"zodiac_{animal}_item_{item_key}.webp"

            if not args.process_only:
                success = generate_single_item(client, animal, item_key, ref_path, raw_file)
                if not success:
                    continue

            if raw_file.exists():
                remove_background_and_publish(raw_file, png_file, public_webp, size=args.size)

    print("\n[SUCCESS] 모든 리소스 제작 및 배포가 완료되었습니다.")


if __name__ == "__main__":
    main()

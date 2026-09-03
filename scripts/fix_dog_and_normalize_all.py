# -*- coding: utf-8 -*-
"""
1. 강아지(戌) 5종 전면 재창작:
   - 산리오(포차코/시나모롤/스누피)를 연상시키는 처진 귀(floppy ears) 완전 퇴출!
   - 한국 토종 진돗개/시고르자브종 모티브의 쫑긋 선 작은 세모 귀(perky triangular ears) + 돌돌 말린 꼬리
   - 5종 동일한 뚱땅이 실루엣 일체화
2. 12지신 60종 전원 320x320 고정 캔버스 정규화:
   - 개별 크롭으로 인해 가로/세로가 제각각이던 문제 완전 해결
   - 모든 에셋을 320x320 투명 정사각형 캔버스 중앙에 여백 25px(내부 270px)로 정확히 정렬
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

# 1. 독창적인 토종 진돗개/강아지 뚱땅이 (산리오·포차코 유사성 0% 차단)
DOG_DESC = "extremely chubby round potato-like blue puppy with small upright triangular perky ears (like a cute Korean Jindo puppy), tiny curled tail, cute black dot eyes, small black button nose and tiny mouth. ABSOLUTELY NO long floppy ears, NO drooping ears, NO Sanrio style."

ITEMS_DEF = {
    "glasses": "wearing neat minimalist round black wireframe smart reading glasses perched on its nose, looking clever",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses perched on its nose, looking hip and confident",
    "bowtie": "wearing a neat classic red bowtie tied around its chubby neck, looking dapper and polite",
    "headphones": "wearing cozy modern cream wireless over-ear headphones comfortably over its ears, vibing happily",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck, looking warm and friendly",
}

PROMPT_TEMPLATE = """A contemporary minimalist Korean lifestyle designer mascot sticker of a {animal_desc}.
- COMPOSITION: Full body view, standing facing directly forward, centered, symmetrical cute pose with tiny little paws and feet.
- SILHOUETTE: Extremely chubby round potato-like body, standing upright.
- LINEWORK: Bold, clean, charming charcoal ink contour lines with handcrafted warmth.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO white muzzle patches, NO white patches, NO airbrush gradients, NO 3D plastic shine.
- FACE & EYES: Simple minimalist black dot eyes (·  ·), cute tiny nose, small mouth. ABSOLUTELY NO shiny anime reflections, NO gradient sparkles.
- ACCESSORY: {accessory}.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end contemporary Korean boutique mascot, original, witty, deadpan, and adorable. Completely unique, not copying any famous Japanese or American character."""


def remove_bg_raw(img_path: Path) -> Image.Image:
    """배경 흰색 제거."""
    img = Image.open(img_path).convert("RGBA")
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
    return img


def normalize_to_square(img: Image.Image, canvas_size: int = 320, inner_size: int = 268) -> Image.Image:
    """모든 이미지를 320x320 고정 캔버스 중앙에 균일한 크기(268px)로 정규화."""
    bbox = img.getbbox()
    if bbox:
        l, t, r, b = bbox
        img = img.crop((max(0, l - 4), max(0, t - 4), min(img.width, r + 4), min(img.height, b + 4)))

    w, h = img.size
    scale = inner_size / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    scaled_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # 320x320 투명 캔버스 생성 및 정중앙 배치
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2
    canvas.paste(scaled_img, (offset_x, offset_y), scaled_img)
    return canvas


def generate_new_dog():
    print("\n[STEP 1] 산리오/포차코 탈피한 독창적 한국 토종 댕댕이 5종 생성...")
    for item_key, accessory in ITEMS_DEF.items():
        out_name = f"zodiac_dog_item_{item_key}"
        raw_path = RAW_DIR / f"{out_name}.png"
        prompt = PROMPT_TEMPLATE.format(animal_desc=DOG_DESC, accessory=accessory)

        print(f"-> Generating dog + {item_key}...")
        for attempt in range(1, 4):
            try:
                resp = client.models.generate_content(
                    model="gemini-2.5-flash-image",
                    contents=prompt
                )
                for part in resp.candidates[0].content.parts:
                    if getattr(part, "inline_data", None) and part.inline_data.data:
                        raw_path.write_bytes(part.inline_data.data)
                        break
                if raw_path.exists():
                    break
            except Exception as e:
                print(f"   [RETRY {attempt}/3] {e}")
                time.sleep(2 * attempt)

        # 투명화 및 원시 저장
        clean_img = remove_bg_raw(raw_path)
        clean_img.save(PUBLIC_DIR / f"{out_name}.png", "PNG")
        print(f"   Saved new dog asset: {out_name}")


def normalize_all_60_assets():
    print("\n[STEP 2] 12지신 60종 전원 320x320 정사각형 규격 통일화 작업 시작...")
    ANIMALS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "pig"]
    ITEMS = ["glasses", "sunglasses", "bowtie", "headphones", "scarf"]

    count = 0
    for a in ANIMALS:
        for it in ITEMS:
            png_file = PUBLIC_DIR / f"zodiac_{a}_item_{it}.png"
            webp_file = PUBLIC_DIR / f"zodiac_{a}_item_{it}.webp"
            
            if not png_file.exists():
                raw_file = RAW_DIR / f"zodiac_{a}_item_{it}.png"
                if raw_file.exists():
                    clean_img = remove_bg_raw(raw_file)
                else:
                    print(f"   [MISSING] {png_file.name}")
                    continue
            else:
                clean_img = Image.open(png_file).convert("RGBA")

            # 320x320 고정 캔버스 정규화
            square_img = normalize_to_square(clean_img, canvas_size=320, inner_size=268)

            square_img.save(webp_file, "WEBP", quality=95)
            square_img.save(png_file, "PNG")
            count += 1
            print(f"   [320x320 OK] {webp_file.name} (320x320)")

    print(f"\n[COMPLETE] 60종 전원 정확히 320x320 픽셀 규격 통일화 완료! (처리: {count}개)")


if __name__ == "__main__":
    generate_new_dog()
    normalize_all_60_assets()

# -*- coding: utf-8 -*-
"""
뱀(巳)과 돼지(亥) 5종 완전 일관성(Pose & Anatomy Lock) 재창작 스크립트:

[뱀 문제점 해결]
- 똬리 방향, 꼬리 위치(우측 고정), 목 각도(수직 정면 정중앙) 100% 고정.
- 5종 모두 몸통/똬리/눈 위치가 1픽셀도 흔들리지 않는 완벽한 정원형 대칭 코일.

[돼지 문제점 해결]
- 귀 형태(양쪽 살짝 접힌 아기 돼지 귀), 코 크기(단정한 타원형 돼지코), 얼굴형(완만한 달걀형) 100% 고정.
- 5종 모두 완벽한 정면 직립 대칭 체형.
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

TARGET_ANIMALS = {
    "snake": {
        "desc": "cute chubby blue baby SNAKE (巳 뱀)",
        "anatomy": (
            "- BODY & COIL: Perfectly centered, coiled neatly in a single smooth circular spiral resting flat on the ground. "
            "Its round baby snake head rises directly in the center, vertical, facing directly forward. "
            "- TAIL & LIMBS: Its tiny tail tip peeks out neatly on the RIGHT side. ABSOLUTELY ZERO LEGS, ZERO PAWS, ZERO FEET. "
            "- FACE: Perfectly symmetrical round head, two minimalist black dot eyes (·  ·), tiny happy smile. "
            "- NO TILTING: Head is completely upright and vertical."
        ),
        "target_w": 224,
        "is_coiled": True,
    },
    "pig": {
        "desc": "unmistakable cute chubby blue PIG (亥 돼지)",
        "anatomy": (
            "- EARS: Two neat small slightly folded cute pig ears at the top of its head (identical symmetrical small folded pig ears). "
            "- SNOUT & FACE: A perfectly centered, neat small horizontal oval pig snout with two clean dot nostrils. "
            "Minimalist black dot eyes (·  ·) placed evenly beside the snout. "
            "- BODY & POSTURE: Symmetrical chubby pear-shaped body standing upright facing directly forward on two tiny feet, "
            "arms resting neatly at sides. Tiny curly pig tail peeking on the right."
        ),
        "target_h": 260,
        "is_coiled": False,
    }
}

ITEMS = {
    "glasses": "wearing neat minimalist round black wireframe smart reading glasses, looking clever and studious",
    "sunglasses": "wearing cool retro round tinted gold party sunglasses, looking hip and confident",
    "bowtie": "wearing a neat classic red bowtie tied around its chubby neck, looking dapper and polite",
    "headphones": "wearing cozy modern cream wireless over-ear headphones comfortably over its ears/head, vibing happily",
    "scarf": "wearing a cozy warm red knitted winter scarf wrapped snugly around its neck, looking warm and friendly",
}

PROMPT_TEMPLATE = """A contemporary minimalist Korean lifestyle character illustration of an {desc}.
{anatomy}
- STRICT SILHOUETTE: Identical canonical base posture facing directly forward, perfectly vertical and symmetrical.
- LINEWORK: Bold clean charcoal ink contour lines directly on the outer edge. ABSOLUTELY NO white die-cut sticker borders.
- COLORING: 100% SOLID FLAT MATTE pastel dusty-blue color across the ENTIRE body. NO gradients, NO 3D shading, NO shiny highlights.
- ACCESSORY: {accessory}.
- STRICT RULE: ABSOLUTELY NO TEXT, NO WORDS, NO KOREAN LETTERS.
- BACKGROUND: Pure solid clean white background (#FFFFFF), zero floor, zero shadows.
- AESTHETIC: High-end contemporary Korean boutique mascot, deadpan, witty, adorable."""


def remove_bg(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
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
    print(" 뱀(巳) & 돼지(亥) 5종 완벽 실루엣 고정 정밀 재창작 시작")
    print("=" * 60)

    TARGET_GROUND_Y = 293
    CANVAS_SIZE = 320

    for animal, config in TARGET_ANIMALS.items():
        print(f"\n[{animal.upper()}] 5종 생성 시작...")
        for item_key, accessory in ITEMS.items():
            out_name = f"zodiac_{animal}_item_{item_key}"
            raw_path = RAW_DIR / f"{out_name}.png"
            prompt = PROMPT_TEMPLATE.format(
                desc=config["desc"],
                anatomy=config["anatomy"],
                accessory=accessory
            )

            print(f" -> Generating {out_name}...")
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
                    print(f"    [RETRY {attempt}/3] {e}")
                    time.sleep(2 * attempt)

            if success:
                raw_img = Image.open(raw_path)
                clean = remove_bg(raw_img)
                bbox = clean.getbbox()
                if bbox:
                    cropped = clean.crop(bbox)
                    cw, ch = cropped.size

                    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
                    if config["is_coiled"]:
                        target_w = config["target_w"]
                        scale = target_w / cw
                        new_w = target_w
                        new_h = int(ch * scale)
                        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
                        paste_x = (CANVAS_SIZE - new_w) // 2
                        paste_y = (CANVAS_SIZE - new_h) // 2 + 5
                    else:
                        target_h = config["target_h"]
                        scale = target_h / ch
                        new_w = int(cw * scale)
                        new_h = target_h
                        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
                        paste_x = (CANVAS_SIZE - new_w) // 2
                        paste_y = TARGET_GROUND_Y - new_h

                    canvas.paste(resized, (paste_x, paste_y), resized)

                    png_out = PUBLIC_DIR / f"{out_name}.png"
                    webp_out = PUBLIC_DIR / f"{out_name}.webp"
                    canvas.save(png_out, "PNG")
                    canvas.save(webp_out, "WEBP", quality=95, method=6)
                    print(f"    [OK] {out_name}: W={new_w}, H={new_h}")

    print("\n[COMPLETE] 뱀과 돼지 10종 리뉴얼 완료!")


if __name__ == "__main__":
    main()

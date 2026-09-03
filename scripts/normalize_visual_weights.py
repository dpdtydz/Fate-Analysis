# -*- coding: utf-8 -*-
"""
12지신 60종 전 에셋 '지각적 비주얼 질량 & 바닥 기준선(Baseline)' 정밀 균등화 스크립트.

문제 원인:
단순 max(w,h) 바운딩박스 스케일링을 적용하면,
- 귀가 긴 토끼는 몸통이 155px로 쪼그라들고 (왜소함)
- 귀가 짧고 둥근 개·닭·돼지·뱀은 몸통이 230~263px로 부풀어올라 (거대함)
나란히 놓았을 때 크기가 미묘하게 들쑥날쑥해 보임.

해결책 (프로 2D 스프라이트 정렬):
1. 모든 직립 동물(11종)의 발바닥 접지선(Ground Baseline)을 y = 292에 일치.
2. 몸통/얼굴의 지각적 너비(Visual Torso Width)를 약 195px ~ 205px로 균등화.
   - 토끼: 몸통 너비를 185px로 확대하여 얼굴/몸 크기를 호랑이/소와 동급으로 맞춤 (귀는 캔버스 상단까지 자연스럽게 뻗음)
   - 개·닭·돼지: 지나치게 뚱뚱했던 너비(230~235px)를 200px 선으로 적정 다이어트
   - 뱀: 원형 똬리 너비를 225px로 조정하여 다른 동물과 동일한 시각적 면적(약 53,000px) 달성
   - 신규 말(午): 돼지코를 완벽히 벗어난 멋진 말 갈기/귀 조형을 접지선 y=292, 너비 195px에 정확히 안착
3. 전 에셋 320x320 투명 WebP & PNG 동시 출력.
"""

from pathlib import Path
from PIL import Image

PUBLIC_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\public\zodiac")
ANIMALS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "pig"]
ITEMS = ["glasses", "sunglasses", "bowtie", "headphones", "scarf"]

# 동물별 맞춤 시각적 보정 배율 (Target Scale Factor relative to raw content)
# 기준: 호랑이/소/양/원숭이/쥐 = 1.0 (황금 비율)
# 토끼: 귀 때문에 몸이 축소되었으므로 1.15x 확대
# 개/닭/돼지: 몸이 너무 부풀었으므로 0.90x 축소
# 뱀: 똬리가 너무 넓었으므로 0.88x 축소
# 말: 신규 생성된 고해상도 말을 직립 195px / 높이 265px로 정밀 스케일링
SCALE_OVERRIDES = {
    "rabbit": 1.16,    # 토끼 몸통 키워서 다른 동물과 머리/배 크기 1:1 일치
    "dog": 0.90,       # 개 지나친 팽창 완화
    "rooster": 0.88,   # 닭 날개/몸통 팽창 완화
    "pig": 0.92,       # 돼지 팽창 완화
    "snake": 0.86,     # 똬리 거대화 완화
    "rat": 0.98,
    "ox": 1.02,
    "tiger": 0.98,
    "dragon": 1.00,
    "sheep": 1.00,
    "monkey": 1.00,
    "horse": None,     # 말은 신규 원본에서 별도 계산
}

RAW_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\assets\zodiac\raw\archetypes")
TARGET_GROUND_Y = 293  # 발바닥 접지선
CANVAS_SIZE = 320

def process_animal_item(animal: str, item: str):
    png_path = PUBLIC_DIR / f"zodiac_{animal}_item_{item}.png"
    webp_path = PUBLIC_DIR / f"zodiac_{animal}_item_{item}.webp"

    source_path = png_path
    if animal == "horse":
        raw_p = RAW_DIR / f"zodiac_horse_item_{item}.png"
        if raw_p.exists():
            source_path = raw_p

    if not source_path.exists():
        return

    img = Image.open(source_path).convert("RGBA")
    bbox = img.getbbox()
    if not bbox:
        return

    cropped = img.crop(bbox)
    cw, ch = cropped.size

    if animal == "horse":
        # 신규 말: 높이 296px로 확대하여 귀/갈기와 함께 몸통 체급을 토끼/호랑이와 1:1 일치
        target_h = 296
        scale = target_h / ch
        new_w = int(cw * scale)
        new_h = target_h
    elif animal == "snake":
        # 뱀: 다리가 없으므로 똬리 너비 225px 기준으로 스케일링, 중앙 배치
        target_w = 225
        scale = target_w / cw
        new_w = target_w
        new_h = int(ch * scale)
    else:
        override = SCALE_OVERRIDES.get(animal, 1.0)
        # 기존 266px 높이 기준에 override 배율 적용
        target_h = int(266 * override)
        # 캔버스 320을 넘지 않도록 제한
        if target_h > 300:
            target_h = 300
        scale = target_h / ch
        new_w = int(cw * scale)
        new_h = target_h

    # 고품질 Lanczos 리샘플링
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # 320x320 투명 캔버스 생성
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))

    # X 좌표: 정확한 가로 중앙 정렬
    paste_x = (CANVAS_SIZE - new_w) // 2

    # Y 좌표: 
    if animal == "snake":
        paste_y = (CANVAS_SIZE - new_h) // 2 + 5
    else:
        # 직립 동물: 발바닥 접지선을 TARGET_GROUND_Y에 고정
        paste_y = TARGET_GROUND_Y - new_h
        # 만약 머리/귀가 위로 삐져나갈 경우 y=10으로 보정
        if paste_y < 10:
            paste_y = 10

    canvas.paste(resized, (paste_x, paste_y), resized)

    # 저장
    canvas.save(png_path, "PNG")
    canvas.save(webp_path, "WEBP", quality=95, method=6)


def main():
    print("=" * 60)
    print(" 12지신 60종 시각적 질량(Visual Mass) 및 접지선 전수 균등화")
    print("=" * 60)

    for animal in ANIMALS:
        for item in ITEMS:
            process_animal_item(animal, item)
        print(f" -> [{animal}] 5종 비주얼 웨이트 및 접지선 보정 완료")

    print("\n[COMPLETE] 60종 전수 균등화 완료!")

if __name__ == "__main__":
    main()

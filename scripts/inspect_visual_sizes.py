# -*- coding: utf-8 -*-
"""
60종 에셋의 실제 콘텐츠 바운딩 박스(width, height) 및 비주얼 크기 전수 분석 스크립트.
"""

from pathlib import Path
from PIL import Image

PUBLIC_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\public\zodiac")
ANIMALS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "pig"]
ITEMS = ["glasses", "sunglasses", "bowtie", "headphones", "scarf"]

print(f"{'Animal':<10} {'Item':<12} {'Width':<8} {'Height':<8} {'Aspect(W/H)':<12} {'BBox (L, T, R, B)'}")
print("-" * 75)

animal_stats = {}

for animal in ANIMALS:
    widths = []
    heights = []
    for item in ITEMS:
        p = PUBLIC_DIR / f"zodiac_{animal}_item_{item}.png"
        if not p.exists():
            continue
        img = Image.open(p).convert("RGBA")
        bbox = img.getbbox()
        if bbox:
            w = bbox[2] - bbox[0]
            h = bbox[3] - bbox[1]
            widths.append(w)
            heights.append(h)
            if item == "bowtie":  # representative
                print(f"{animal:<10} {item:<12} {w:<8} {h:<8} {w/h:<12.2f} {bbox}")
    if widths and heights:
        avg_w = sum(widths) / len(widths)
        avg_h = sum(heights) / len(heights)
        animal_stats[animal] = (avg_w, avg_h)

print("\n[동물별 평균 바운딩 박스 크기]")
for a, (w, h) in animal_stats.items():
    print(f" - {a:<10}: W={w:5.1f}px, H={h:5.1f}px (면적 대략: {w*h:6.0f})")

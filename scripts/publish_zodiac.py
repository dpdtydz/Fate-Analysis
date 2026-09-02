# -*- coding: utf-8 -*-
"""
12지신 리소스를 웹에서 쓸 수 있게 public/zodiac/ 으로 배포한다.

assets/zodiac/png/ (투명 PNG, 1024px) 를 읽어
public/zodiac/ 에 웹 최적화본(여백 크롭 + 리사이즈 + 압축)으로 저장.

배포 대상:
  zodiac_*.png         캐릭터 / 역할(zodiac_*_role_*.png) - 320px
  space_*.png          공간 배경 - 480px (엠블럼 128px + 레티나 여유)

사용법:
  python scripts/publish_zodiac.py           # 기본 320px
  python scripts/publish_zodiac.py --size 512
"""

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PROJECT_ROOT / "assets" / "zodiac" / "png"
OUT_DIR = PROJECT_ROOT / "public" / "zodiac"

# 배포 대상 glob 패턴
SRC_PATTERNS = ("zodiac_*.png", "space_*.png")


def classify(name: str) -> str:
    """파일명으로 리소스 종류를 판별한다."""
    if name.startswith("space_"):
        return "space"
    if "_role_" in name:
        return "role"
    return "character"


def main():
    ap = argparse.ArgumentParser(description="12지신 리소스 웹 배포")
    ap.add_argument("--size", type=int, default=320, help="긴 변 기준 출력 크기(px)")
    ap.add_argument("--space-size", type=int, default=480,
                    help="space_ 이미지의 긴 변 기준 출력 크기(px)")
    ap.add_argument("--padding", type=int, default=8, help="크롭 후 남길 여백(px)")
    args = ap.parse_args()

    try:
        from PIL import Image
    except ImportError:
        sys.exit("[ERROR] pip install pillow 후 실행하세요.")

    files = sorted(SRC_DIR.glob("zodiac_*.png"))
    if not files:
        sys.exit(f"[ERROR] {SRC_DIR} 에 투명 PNG가 없습니다. "
                 "먼저 generate_zodiac.py --remove-bg 를 실행하세요.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for f in files:
        im = Image.open(f).convert("RGBA")
        # 알파 채널 기준으로 캐릭터 영역만 크롭
        bbox = im.split()[3].getbbox()
        if bbox:
            l, t, r, b = bbox
            p = args.padding
            im = im.crop((max(l - p, 0), max(t - p, 0),
                          min(r + p, im.width), min(b + p, im.height)))
        # 긴 변을 size 로 맞춰 축소
        scale = args.size / max(im.width, im.height)
        if scale < 1:
            im = im.resize((max(round(im.width * scale), 1),
                            max(round(im.height * scale), 1)), Image.LANCZOS)
        out = OUT_DIR / f.name
        im.save(out, "PNG", optimize=True)
        total += out.stat().st_size
        print(f"  [OK] {out.relative_to(PROJECT_ROOT)} {im.width}x{im.height} "
              f"{out.stat().st_size // 1024}KB")

    print(f"\n{len(files)}장 배포 완료 · 합계 {total / 1024 / 1024:.1f}MB → "
          f"{OUT_DIR.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()

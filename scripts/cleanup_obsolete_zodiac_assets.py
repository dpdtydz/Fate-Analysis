# -*- coding: utf-8 -*-
"""
불필요한 구형 폐기 에셋(구형 애니메이션 오행/역할/베이스) 일괄 정리 스크립트.
보존 대상:
1. zodiac_{animal}_item_{itemKey}.webp & .png (승인된 신규 60종)
2. space_{spaceKey}.webp & .png (모임 공간 심볼)
3. audit_matrix.html (전수조사 감사 매트릭스)
그 외 구형 AI 3D 애니풍 파일 전원 삭제.
"""

from pathlib import Path

PUBLIC_DIR = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main\public\zodiac")

deleted_count = 0
kept_count = 0

for p in list(PUBLIC_DIR.iterdir()):
    if p.is_dir():
        continue

    fname = p.name
    # 보존할 필수 에셋
    if "_item_" in fname:
        kept_count += 1
        continue
    if fname.startswith("space_"):
        kept_count += 1
        continue
    if fname == "audit_matrix.html":
        kept_count += 1
        continue

    # 그 외 구형 base, element, role, test 에셋 삭제
    try:
        p.unlink()
        deleted_count += 1
        print(f"Deleted: {fname}")
    except Exception as e:
        print(f"Error deleting {fname}: {e}")

print(f"\n[정리 완료] 삭제된 불필요 에셋: {deleted_count}개 | 보존된 정예 에셋: {kept_count}개")

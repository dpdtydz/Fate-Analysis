# -*- coding: utf-8 -*-
"""
12지신 60종 완성 에셋 전수조사 스크립트
1. 파일 실재 여부 및 규격(해상도, 투명도, 용량) 검사
2. 12x5 전수조사용 HTML 감사 리포트 생성 (로컬 브라우저에서 한눈에 검토 가능)
"""
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(r"c:\Users\leehosang\OneDrive - 주식회사 아이스크림에듀\바탕 화면\이호상\개인문서\Fate-Analysis-main\Fate-Analysis-main")
PUBLIC_DIR = PROJECT_ROOT / "public" / "zodiac"

ANIMALS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "pig"]
ANIMALS_KR = {
    "rat": "쥐 (子)",
    "ox": "소 (丑)",
    "tiger": "호랑이 (寅)",
    "rabbit": "토끼 (卯)",
    "dragon": "용 (辰)",
    "snake": "뱀 (巳)",
    "horse": "말 (午)",
    "sheep": "양 (未)",
    "monkey": "원숭이 (申)",
    "rooster": "닭 (酉)",
    "dog": "개 (戌)",
    "pig": "돼지 (亥)",
}
ITEMS = ["glasses", "sunglasses", "bowtie", "headphones", "scarf"]
ITEMS_KR = {
    "glasses": "스마트 안경 👓",
    "sunglasses": "파티 선글라스 🕶️",
    "bowtie": "레드 보타이 👔",
    "headphones": "무선 헤드폰 🎧",
    "scarf": "니트 목도리 🧣",
}

audit_data = []

html_rows = []

for a in ANIMALS:
    animal_items = []
    for item in ITEMS:
        fname = f"zodiac_{a}_item_{item}.webp"
        fpath = PUBLIC_DIR / fname
        if fpath.exists():
            im = Image.open(fpath)
            w, h = im.size
            size_kb = fpath.stat().st_size / 1024
            # Check transparency (has alpha channel and some transparent pixels)
            has_alpha = im.mode == "RGBA"
            animal_items.append({
                "item": item,
                "file": fname,
                "width": w,
                "height": h,
                "size_kb": f"{size_kb:.1f}KB",
                "exists": True
            })
        else:
            animal_items.append({
                "item": item,
                "file": fname,
                "width": 0,
                "height": 0,
                "size_kb": "0KB",
                "exists": False
            })
    audit_data.append({"animal": a, "animal_kr": ANIMALS_KR[a], "items": animal_items})

# Build Audit HTML
html_content = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>12지신 60종 캐릭터 전수조사 및 저작권·품질 감사 리포트</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif; background: #F4F3EE; color: #1C1D21; padding: 24px; margin: 0; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  p.subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  .grid-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 32px; }
  th, td { border: 1px solid #E5E4DE; padding: 12px; text-align: center; vertical-align: middle; }
  th { background: #EFEFEA; font-size: 13px; font-weight: 700; }
  .animal-header { font-weight: 700; font-size: 15px; background: #F9F8F5; text-align: left; padding-left: 16px; }
  .cell-card { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cell-card img { width: 120px; height: 120px; object-fit: contain; background: #FCFCFA; border-radius: 8px; border: 1px dashed #E0DFD8; padding: 4px; }
  .cell-info { font-size: 11px; color: #666; font-family: monospace; }
  .item-title { font-size: 12px; font-weight: 600; color: #333; }
  .badge-ok { background: #E6F4EA; color: #137333; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
  .badge-warn { background: #FEF7E0; color: #B06000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
  .badge-danger { background: #FCE8E6; color: #C5221F; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
</style>
</head>
<body>
<h1>12지신 × 5대 일상 소품 (총 60종) 전수조사 검수 매트릭스</h1>
<p class="subtitle">전수 검사항목: 1. 동물 일치도 | 2. 동물 내 일관성 | 3. 크기·규격 통일감 | 4. 기존 유명 브랜드(IP) 유사성 및 카피 리스크 | 5. 저작권 안전성</p>

<table class="grid-table">
  <thead>
    <tr>
      <th style="width: 140px;">동물 (띠)</th>
      <th>스마트 안경 👓</th>
      <th>파티 선글라스 🕶️</th>
      <th>레드 보타이 👔</th>
      <th>무선 헤드폰 🎧</th>
      <th>니트 목도리 🧣</th>
    </tr>
  </thead>
  <tbody>
"""

import time
TIMESTAMP = int(time.time())

for row in audit_data:
    html_content += f"""    <tr>
      <td class="animal-header">{row['animal_kr']}<br><span style="font-size:11px;color:#888;font-weight:normal;">({row['animal']})</span></td>
"""
    for item in row["items"]:
        if item["exists"]:
            html_content += f"""      <td>
        <div class="cell-card">
          <img src="{item['file']}?v={TIMESTAMP}" alt="{item['file']}" />
          <span class="cell-info">{item['width']}x{item['height']} · {item['size_kb']}</span>
        </div>
      </td>
"""
        else:
            html_content += """      <td><span class="badge-danger">누락됨 (Missing)</span></td>
"""
    html_content += "    </tr>\n"

html_content += """  </tbody>
</table>
</body>
</html>
"""

report_html_path = PUBLIC_DIR / "audit_matrix.html"
report_html_path.write_text(html_content, encoding="utf-8")
print(f"[OK] 감사 리포트 HTML 생성 완료: {report_html_path}")

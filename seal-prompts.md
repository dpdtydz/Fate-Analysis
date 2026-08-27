# 인주 도장 12지신 — 나노바나나 프롬프트 키트

> 사용법 요약
> 1. **범(호랑이)부터** 생성한다 (스타일 검증용 3종: 범 → 토끼 → 용).
> 2. 첫 결과가 마음에 들면 그 이미지를 **스타일 앵커**로 저장한다.
> 3. 두 번째 동물부터는 **앵커 이미지를 첨부**하고 "참조 생성 프롬프트"를 쓴다.
> 4. 아래 "불합격 기준"에 걸리면 그 자리에서 재생성한다.
> 5. 완성본은 **PNG, 1024×1024 이상**으로 저장해서 전달 — 한자 낙관(寅·卯·辰…)과 앱 통합은 Claude가 처리한다.

---

## 1. 마스터 스타일 블록 (모든 프롬프트 앞에 붙임)

```
A traditional East Asian carved seal stamp icon (Korean jeongak style).
A square cinnabar-red stamp (#B3382C) with softly rounded corners, centered
on a plain warm off-white paper background (#FCFCFA).
The design is carved in negative (baekmun style): bold off-white line art
appears cut out of the red stamp face. A single thin carved rectangular
border line runs just inside the stamp edge.
Flat graphic style with exactly two colors: cinnabar red and paper off-white.
No gradients, no shading, no 3D, no shadows, no outlines outside the stamp.
Absolutely no text, letters, numbers, or Chinese characters anywhere.
A few tiny irregular paper-colored nicks on the stamp edge, like a
hand-pressed ink stamp. Consistent bold stroke weight throughout.
Square 1:1 composition.
```

## 2. 샘플 3종 — 주제 블록 (마스터 블록 뒤에 이어 붙임)

### ① 범 寅
```
Carved subject: a front-facing tiger face in Korean folk-painting (minhwa)
spirit — round face, two small round ears, three bold stripe marks on the
forehead, slanted confident eyes, simple triangular nose, long whiskers
extending past the cheeks. Dignified but warm, guardian-like.
The face fills most of the stamp interior.
```

### ② 토끼 卯
```
Carved subject: a rabbit sitting in side view, facing right — plump round
body, round head, two long leaf-shaped ears standing up, small round tail,
one visible eye, short whiskers. Calm and gentle. The rabbit fills most
of the stamp interior.
```

### ③ 용 辰
```
Carved subject: a classical East Asian dragon (no wings) coiled in a
circle, in the style of Korean twelve-zodiac guardian art — long serpentine
body coiled once, deer-like branched antlers, flowing whiskers and mane,
open jaw showing teeth, four-clawed foot, scale marks along the body.
Powerful and auspicious, not cute. The coiled dragon fills most of the
stamp interior.
```

## 3. 참조 생성 프롬프트 (2번째 동물부터, 앵커 이미지 첨부하고 사용)

```
Use this reference image's exact style: same cinnabar red, same off-white,
same carved baekmun technique, same stroke weight, same inner border line,
same paper background, same stamp size and corner radius.
Change ONLY the carved subject to:
[여기에 위 주제 블록을 붙여넣기]
Keep everything else identical to the reference. No text anywhere.
```

## 4. 불합격 기준 (하나라도 보이면 재생성)

- 그라디언트·음영·입체감·광택이 있다
- 색이 3가지 이상이다 (인주 빨강 + 종이색 외)
- 글자·한자·숫자가 들어갔다
- 도장 밖에 장식·그림자·테두리가 생겼다
- 3D 마스코트/이모지/카와이 스타일로 나왔다
- 획 두께가 앵커와 눈에 띄게 다르다

재생성 시 한 줄 추가: `Flat 2-color carved stamp only. Remove all shading and text.`

## 5. 나머지 9종 — 주제 블록 (본 제작 때 사용)

| 지지 | 동물 | Carved subject 문장 |
|------|------|---------------------|
| 子 | 쥐 | a small rat in side view, facing right — rounded back, big round ears, pointed snout, long thin curved tail, tiny paws. Clever and quick. |
| 丑 | 소 | a front-facing ox head — broad face, two curved horns, wide calm eyes, big muzzle with two nostrils, small ears below the horns. Steady and patient. |
| 巳 | 뱀 | a snake coiled in a neat spiral, head rising from the center facing left, forked tongue, calm eye. Elegant, not menacing. |
| 午 | 말 | a horse head and neck in side view, facing left — long face, alert ear, flowing mane in bold strokes. Spirited and noble. |
| 未 | 양 | a front-facing goat head — gentle face, two horns curling backward, long ears, small beard under the chin. Mild and warm. |
| 申 | 원숭이 | a monkey sitting with knees up, side view — round head with wide face patch, long curved tail rising behind. Witty and playful. |
| 酉 | 닭 | a rooster in side view, facing left — bold comb on the head, wattle, sharp beak, one eye, layered tail feathers in bold strokes. Proud. |
| 戌 | 개 | a dog sitting upright, front view — floppy ears, friendly eyes, tongue slightly out, front paws together, curled tail visible at the side. Loyal. |
| 亥 | 돼지 | a front-facing pig head — round face, big flat snout with two nostrils, small folded ears, gentle small eyes. Generous and content. |

## 6. 받은 뒤 Claude가 할 일

1. 12장 스타일 일치 검수 (색·획·테두리)
2. 배경 정리 및 색상을 토큰(#B3382C / #FCFCFA)으로 정확히 보정
3. 각 도장 모서리에 지지 한자(子丑寅卯…) 낙관 합성
4. 웹용 에셋(WebP/PNG) 최적화 후 소울 카드·아바타에 통합

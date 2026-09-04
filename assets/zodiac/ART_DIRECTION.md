# 캐릭터 아트 디렉션 — 2축 분리 원칙

## 왜 이 문서가 있는가

오행 5종과 역할 5종이 **같은 소품 풀 5개**를 공유해서, 소품 하나가 두 의미를
동시에 가리키는 모호함이 생겼다.

> 선글라스 낀 캐릭터 = "화(火) 사주라서"인가 "spark 역할이라서"인가?

`calculateMemberRole()`은 이 겹침을 **역할 자체를 바꿔서** 회피하고 있었다.
(화 사주 + spark → captain으로 강제 전환) 이건 회피가 아니라 판정 결과 왜곡이다.

---

## 제약 조건 (먼저 읽을 것)

이 프로젝트의 캐릭터는 **무직타이거/디노탱 계열 플랫 미니멀**이다.
눈은 점 두 개, 입은 선 하나. 이 제약에서 나오는 결론:

- **표정 축은 쓸 수 없다.** 점눈/선입으로 5종 감정을 안정적으로 구분해
  그려낼 수 있는 이미지 모델이 없고, 데드팬 무표정 자체가 브랜드 정체성이라
  감정을 넣는 순간 스타일이 깨진다.
- **포즈 축도 폭이 좁다.** 몸이 단순 도형이라 변형 여지가 적다.
- **오행 색 채색도 안 한다.** 검증 결과 파랑 외 색은 톤이 유치해진다.

→ 남는 축은 **소품**과 **배경**뿐이다.

---

## 캐릭터 UI 전수 조사 (9개 파일 / 21개 지점)

### 역할(role) 아바타 — 단 2곳

| 파일 | 크기 | 방식 |
|---|---|---|
| `MeView.tsx:1423` | 112px | `<ZodiacAvatar role={...}>` — 본질과 토글 |
| `ViralCardModal.tsx:675` | 공유 카드 | **`roleImageSrc()` 직접 호출 → `<img>`** |

> **주의:** ViralCardModal은 `ZodiacAvatar` 컴포넌트를 거치지 않는다.
> 컴포넌트에만 배지를 넣으면 **여기가 누락된다.** 반드시 별도 처리할 것.

### 본질(오행) 아바타 — 19곳, 대부분 작다

| 크기 | 지점 |
|---|---|
| 18~28px (8곳) | `GroupNetwork:916`, `GroupView:1178·1372·1377·1588·1596`, `MeView:2264·2269` |
| 32~48px (6곳) | `DevQaHarness:86`, `RoomView:498·536`, `PairChemistryModal:249·321·342` |
| 72~112px (2곳) | `PdfReportModal:357`, `MySajuView:968` |
| 이미지 경로 직접 사용 | `MySajuView:665·1088·1177`, `ViralCardModal:571·1119·1180`, `GroupNetwork:161` |

### 이 조사가 해법을 결정한다

**1. 역할 아바타는 2곳뿐 → 배경 배지가 압도적으로 싸다.**
CSS 배지 추가는 2곳 처리로 끝난다. 반면 이미지 재생성(60~120장)은
겨우 2곳을 위해 치르는 비용이 된다.

**2. MeView는 토글이라 두 아바타가 동시에 안 보인다.**
```tsx
<div className="w-[112px] h-[112px] mx-auto mb-4 ...">
  {cardViewMode === "role" ? <ZodiacAvatar role={...} /> : <ZodiacAvatar element={...} />}
</div>
```
캐릭터에 **소품을 하나 더 얹는 방식은 효과가 없다.** 사용자는 한 번에 하나만
보므로 착용 부위를 나눠도 비교 대상이 화면에 없다. 필요한 건 "지금 어느
모드인가"가 즉각 읽히는 신호 — 전환 시 확 바뀌는 배경색이 이 역할을 한다.

**3. 별건 이슈 — 18~28px에서 소품 가독성.**
8곳이 28px 이하다. 이 크기에서는 보타이·안경 같은 소품이 거의 안 읽힌다
(24px 뱀+보타이 실측 확인). 겹침 문제와는 별개의 기존 이슈이며, 이 문서의
범위 밖이지만 기록해 둔다. 작은 지점은 소품 판독을 기대하지 말고 "누구인가"
(동물 실루엣) 식별용으로만 취급할 것.

---

## 대원칙 — 2축 분리

| | **사주 본질 (Soul)** | **모임 역할 (Role)** |
|---|---|---|
| **기표** | **소품** (얼굴·목 착용) | **원형 링(테두리) 색** |
| 몸 색 | 파랑 단색 | 파랑 단색 (동일) |
| 링 | **없음** | **역할색 링, 안쪽은 흰 바탕** |
| 캐릭터 이미지 | `item_{소품}` 60장 | `item_{소품}` 60장 **재사용** |
| 신규 생성 | 0장 | **0장** |

### 읽는 법 (사용자 관점)

- **링 없음 → 사주 본질.** 소품으로 오행을 읽는다.
- **컬러 링 → 모임 역할.** 링 색으로 역할을 읽는다.

소품은 오행 전용, 링 색은 역할 전용. **채널이 달라 겹칠 수 없다.**

### ⚠️ 배경 원(fill)로 하면 안 된다 — 실측으로 기각된 안

처음엔 캐릭터 **뒤에 색 원을 깔았다.** 실패했다. 배경을 뒤에 깔면 색이 몸통·소품과
같은 레이어에서 경쟁하기 때문이다. 캐릭터 몸통(`#8FA9BF`) 기준 실측 대비:

| 역할 | 배경색(구안) | 몸통 대비 | 빨강소품 대비 |
|---|---|---|---|
| healer | `#D4A017` | **1.03** | 1.84 |
| captain | `#4CAF50` | **1.14** | 1.58 |
| keeper | `#C9B896` | **1.25** | 2.25 |
| spark | `#E53935` | 1.73 | **1.04** |
| sage | `#3A6E9E` | 2.20 | 1.23 |

대비 1.0 = 같은 색. healer·captain·keeper는 몸통과 사실상 구분이 안 됐고,
spark 빨강은 **빨간 보타이·목도리(1.04)를 완전히 삼켰다** — 오행이 안 읽힌다.

5색 중 어느 것도 12동물 × 5소품 60조합 전부와 안전할 수 없다.
**링으로 바꾸면 캐릭터 바닥이 흰색으로 유지되어 물리적으로 겹치지 않는다.**

하단 컬러 바 안도 만들어 비교했으나, 색 면적이 작아 역할 신호가 약해 기각했다.

---

## 축 1 — 사주 본질 (오행 → 소품)

**변경 없음.** 현재 `item_` 60장을 그대로 쓴다.

| 오행 | 소품 | 의미 |
|---|---|---|
| 목(木) | bowtie | 추진력 & 리더 |
| 화(火) | sunglasses | 열정 & 비타민 |
| 토(土) | scarf | 포용 & 온기 |
| 금(金) | glasses | 통찰 & 지략 |
| 수(水) | headphones | 지혜 & 마이웨이 |

배경은 투명/흰색. 배지를 깔지 않는다.

### 소품 5종 고정 — 늘리지 않는다

소품을 10종으로 늘리는 안을 검토했으나 기각했다:
- 120장 신규 생성 필요
- 사용자가 소품 10개의 의미를 암기해야 함
- 미니멀 스타일에서 구분 가능한 소품 종류 자체가 한정적

---

## 축 2 — 모임 역할 (역할 → 링 색)

캐릭터 이미지는 **본질 아바타와 같은 것을 쓴다.** 캐릭터를 감싸는 원형 링
색으로만 역할을 표현하고, **링 안쪽은 흰 바탕**으로 남긴다.

링 색은 **흰 배경 대비 3:1 이상**을 기준으로 정했다 (24px에서도 읽혀야 함).

| 역할 | 링 색 | 흰배경 대비 | 대응 오행 |
|---|---|---|---|
| spark (스파크 메이커) | `#E53935` 빨강 | 4.23 | 화 |
| healer (멘탈 케어 힐러) | `#A67C0B` 황토 | 3.81 | 토 |
| keeper (실속 총무) | `#8A7A52` 금빛 | 4.21 | 금 |
| captain (카리스마 캡틴) | `#3B8E3F` 초록 | 4.10 | 목 |
| sage (히든 책사) | `#3A6E9E` 파랑 | 5.38 | 수 |

> keeper는 원래 `#C9B896`이었으나 흰 배경 대비 **1.95**로 24px에서 링이
> 흐려 보였다. healer `#D4A017`(2.38), captain `#4CAF50`(2.78)도 함께
> 어둡게 조정했다.

### 구현 — CSS만으로

이미지 재생성 없이 `ZodiacAvatar`에 링을 입힌다.

```tsx
const ROLE_RING_COLOR: Record<RoleKey, string> = {
  captain: "#3B8E3F", spark: "#E53935", healer: "#A67C0B",
  keeper: "#8A7A52", sage: "#3A6E9E",
};

// 링 두께는 크기에 비례, 최소 3px (24px에서 3px = 12.5%로 충분히 읽힘)
const ring = Math.max(3, Math.round(size * 0.075));
const inner = size - ring * 2;
```

- 배경은 반드시 `bg-white` + `box-border`. 흰 바탕이 링과 캐릭터 사이
  경계 역할을 해서 sage 파랑조차 몸통 파랑과 분리된다.
- 24px 썸네일에서도 링은 뭉개지지 않는다 (단색 테두리)
- 마음에 안 들면 즉시 되돌릴 수 있다 (이미지 자산 무변경)

---

## 이미 생성된 role_ 60장은 어떻게 하나

`assets/zodiac/raw|png/zodiac_{animal}_role_{role}.png` 60장이
생성·배경제거까지 완료되어 있으나 `public/`에는 배포되지 않았다.

이 에셋은 **그라데이션 치비 계열**로 `item_`의 플랫 리소그래프와 스타일
계보가 다르다. 앞서 정한 "용도 분리" 원칙에 따라:

- **112px 이하 UI에는 쓰지 않는다.** 현재 메인 카드가 112px 토글이므로
  이 화면에는 `item_` + 배경 배지 방식을 쓴다.
- 추후 **큰 전면 결과 화면·공유 카드(240px+)** 가 생기면 그때 role_ 60장을
  투입한다. 그 크기에서는 포즈·표정이 실제로 읽히므로 자산이 살아난다.
- 그때까지 배포 보류. 삭제하지 말 것.

---

## 코드 반영 사항

### `roleImageSrc()` — 소품 되돌리기 제거

현재는 `ROLE_TO_ITEM`으로 역할→소품을 되돌려 `item_` 파일을 고른다.
**이게 겹침의 직접 원인이다.** 역할 아바타도 본질과 같은 소품(=오행 소품)을
쓰도록 바꾸고, 역할은 배경 배지가 전담한다.

```ts
// AS-IS — 역할을 소품으로 되돌려 오행 소품과 충돌
const itemKey = (role && ROLE_TO_ITEM[role]) || "bowtie";

// TO-BE — 역할은 소품을 결정하지 않는다. 소품은 항상 오행에서 온다.
//         역할은 ZodiacAvatar의 배경 배지 색으로만 표현한다.
```

### `calculateMemberRole()` — 왜곡 fallback 제거

`ROLE_TO_ITEM[key] === soulItem` 겹침 검사와 `FALLBACK_DIFF` 전환(395~404행)을
삭제한다. 축이 분리되면 겹칠 수 없으므로 역할 판정을 왜곡할 이유가 없다.

> 현재는 진짜 spark인 사용자가 captain으로 표시되는 버그가 있다.
> 화(火) 사주 + ENFP → soulItem=sunglasses, spark도 sunglasses → captain으로 전환됨.

### `ROLE_TO_ITEM` 폐기

역할→소품 매핑은 더 이상 쓰지 않는다. `ROLE_BADGE_COLOR`로 대체한다.

---

## 이미지 재생성이 필요해질 경우의 프롬프트

`item_` 60장을 다시 뽑아야 할 때는 아래 `AXIS RULE` 블록을 기존
`generate_muzik_style.py` 의 `PROMPT_TEMPLATE`에 추가한다.
소품 외 신호가 새어나가지 않게 막는 용도다.

```
### AXIS RULE — THE ACCESSORY IS THE ONLY SIGNAL ###
- The accessory is the ONLY thing that carries meaning. It must be instantly
  readable at 24px: large, high-contrast, and placed where the eye lands
  first (face or neck).
- POSE MUST STAY NEUTRAL: a calm, symmetrical, front-facing standing pose.
  NO action, NO dynamic motion, NO leaping, NO pointing, NO reaching.
  The body language must carry ZERO personality signal.
- EXPRESSION MUST STAY IDENTICAL across all 60 images: the same relaxed
  deadpan face — simple dot eyes and one small line mouth. NO big laugh,
  NO caring smile, NO fierce glare, NO smirk. Do not attempt emotion.
- Hold NOTHING. No flag, no book, no cup, no tool, no pouch. The character
  wears its accessory and stands there. That is all.
- NO extra props and NO background elements. Do not add stars, flames,
  sparkles, leaves, coins, or any decorative element around the character.
- Exactly ONE accessory. Never combine two — no glasses plus scarf, no
  bowtie plus headphones. One image carries one accessory only.
```

---

## 배포 체크리스트

**역할 아바타가 쓰이는 2곳을 모두 처리해야 한다. 하나라도 빠지면 겹침이 남는다.**

- [x] `ZodiacAvatar`에 `ROLE_RING_COLOR` + 링 렌더링 추가
- [x] **`MeView.tsx:1423`** — 컴포넌트 경유. 위 링 렌더링으로 자동 반영됨
- [x] **`ViralCardModal.tsx:1353`** — `roleImageSrc()` 직접 호출 + `<img>`.
      컴포넌트를 안 거치므로 링을 따로 입혔다
- [x] `roleImageSrc()` — 역할이 소품을 결정하지 않도록 수정
      (`ROLE_TO_ITEM` 되돌리기 제거 → 소품은 항상 오행에서)
- [x] `calculateMemberRole()` — `FALLBACK_DIFF` 왜곡 로직 제거
- [x] `ROLE_TO_ITEM` 폐기 → `ROLE_RING_COLOR`로 대체
- [x] 링 5색 흰배경 대비 3:1 이상 확보 (keeper/healer/captain 어둡게 조정)
- [x] 이미지 재생성 **불필요** — 기존 `item_` 60장 그대로 사용

### 검증 결과 (2026-09-04)

브라우저 하네스로 실측 확인:

**1차 (배경 원 안) — 실패.** 사용자가 몸통·소품 겹침을 지적. 대비 측정으로
healer 1.03 / captain 1.14 / keeper 1.25(몸통), spark 1.04(빨강 소품) 확인.
위 "배경 원(fill)로 하면 안 된다" 절 참조.

**2차 (링 안) — 통과.**
- 전체 매트릭스 역할 5색 × 오행 소품 5종 = 25조합 모두 판독 가능
- 최악 케이스(spark 빨간 링 + 빨간 보타이/목도리) 소품이 명확히 살아남
- sage 파랑 링 × 12동물 — 흰 여백이 경계 역할, 몸통 파랑과 분리됨
- 소형 24/28/48px 15종 — 링 색·흰 바탕·이미지 로드 전부 정상(미로딩 0건)

타입체크: 수정 전후 에러 18건 동일, **신규 에러 0건**
(기존 에러는 `server.ts`/`SajuVisual.tsx`/`sajuSynthesis.ts` 등 미커밋 상태의 별건)

### html2canvas 주의

`ViralCardModal`은 `html2canvas-pro`로 캡처된다. 링은 단순 `border` +
`border-radius` + `background-color`만 쓴다. 그라데이션·filter·box-shadow를
추가하면 캡처 결과가 화면과 달라질 수 있으므로 피할 것.

### 검증 시 반드시 볼 것 (1차 실패의 교훈)

한 동물·한 소품만 보고 판단하면 안 된다. **역할 5 × 오행 소품 5 = 25조합
전체 매트릭스**를 깔고, 특히 아래 최악 케이스를 확인할 것:

- **빨간 소품**(bowtie·scarf)이 있으므로 spark/healer 링과의 대비
- **몸통이 파랑**이므로 sage 링과의 대비
- 24~28px 소형에서 링이 실제로 보이는지

눈으로만 보지 말고 대비를 **수치로 측정**할 것 (WCAG 상대휘도 공식).

### 범위 밖(별건) — 기록만

- [ ] 18~28px 8개 지점의 소품 가독성 개선 여부 검토
      (`GroupNetwork:916`, `GroupView` 5곳, `MeView:2264·2269`)

# -*- coding: utf-8 -*-
"""
12지신 x 오행 이미지 자동 생성 스크립트 (나노바나나 / gemini-2.5-flash-image)

사용법:
  1. pip install google-genai pillow            (배경 제거까지 하려면: pip install rembg onnxruntime)
  2. 환경변수 설정:  set GEMINI_API_KEY=발급받은키
  3. 확정본 레퍼런스 배치:
       assets/zodiac/refs/zodiac_{animal}_base.png  (치비 확정본 2~3장)
  4. 실행:
       python scripts/generate_zodiac.py --phase base            # 파란색 기준 12마리 (있는 건 스킵)
       python scripts/generate_zodiac.py --phase recolor         # 기준본 -> 오행 5종 테마 버전 (60장)
       python scripts/generate_zodiac.py --phase base --animals snake,tiger   # 특정 동물만 재생성
       python scripts/generate_zodiac.py --remove-bg             # 생성 없이 배경 제거만 일괄 수행

출력:
  assets/zodiac/raw/zodiac_{animal}_{element}.png   (흰 배경 원본)
  assets/zodiac/png/zodiac_{animal}_{element}.png   (--remove-bg 시 투명 PNG)
"""

import argparse
import os
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REFS_DIR = PROJECT_ROOT / "assets" / "zodiac" / "refs"
RAW_DIR = PROJECT_ROOT / "assets" / "zodiac" / "raw"
PNG_DIR = PROJECT_ROOT / "assets" / "zodiac" / "png"

MODEL = "gemini-2.5-flash-image"
MAX_RETRIES = 3
BASE_ELEMENT = "base"  # 캐릭터 시트(파란 민짜 기준본) 접미사

# 12지신 (자축인묘진사오미신유술해 순서)
ANIMALS = {
    "rat":     "a rat, standing upright",
    "ox":      "an ox, standing on four legs",
    "tiger":   "a tiger cub, sitting",
    "rabbit":  "a rabbit, sitting upright",
    "dragon":  "a BABY eastern dragon in the same chibi proportions as the reference animals "
               "(big head about half of total height, large cute eyes, short chubby body, "
               "small rounded antlers, tiny paws), coiled upright, holding a small glowing pearl "
               "— NOT a detailed adult dragon, keep it as simple and cute as the other animals",
    "snake":   "a snake (NOT a dragon: no horns, no legs, no whiskers, no fur — "
               "a simple cute coiled serpent with its head raised)",
    "horse":   "a horse, standing on four legs",
    "sheep":   "a cute fluffy sheep with a round woolly fleece and small curled horns, "
               "standing on four legs (NOT a goat: no beard, no long straight horns)",
    "monkey":  "a monkey, sitting",
    "rooster": "a rooster, standing (comb and wattle also in blue tones, not red)",
    "dog":     "a puppy, sitting",
    "pig":     "a pig, standing on four legs (all blue tones, no pink anywhere)",
}

# 오행별 팔레트
ELEMENTS = {
    "wood":  "fresh green tones (base #4CAF50, light #C8E6C9, outlines dark green #1B5E20)",
    "fire":  "warm red-orange tones (base #E53935, light #FFCDD2, outlines deep crimson #7F1D1D)",
    "earth": "ochre yellow-brown tones (base #D4A017, light #F5E6C4, outlines dark brown #5D4037)",
    "metal": "polished pale-gold and warm silver tones (base #C9B896, light #F2EADB, "
             "outlines dark bronze #6B5B45) — a warm precious-metal sheen with bright "
             "specular highlights. CRITICAL: absolutely NO blue and NO blue-gray anywhere; "
             "if it looks cool or bluish it is wrong — push it warm and golden",
    "water": "cool blue tones (base #5B9BD5, light #C9E2F5, outlines navy #1F4E79)",
}

# 동물 x 오행 테마 테이블 — 동물별 개성에 맞춘 60개 고유 동작
THEMES = {
    "rat": {
        "wood":  "hugging a small leafy sapling tree tightly with both front paws wrapped "
                 "around its trunk, cheek pressed against the tree, eyes closed happily, "
                 "a few green leaves fluttering down",
        "fire":  "leaning forward like a wizard casting a spell: both front paws stretched out, "
                 "a small cartoon flame bursting above the open paws, eyes focused on the flame",
        "earth": "mid-digging action: gripping a tiny shovel with both front paws, body leaning "
                 "into the dig, a small mound of soil and flying dirt bits beside it",
        "metal": "a tiny warrior in gleaming steel armor: a small polished helmet, "
                 "chest plate and shoulder guards, holding up a little silver shield "
                 "with both front paws, standing bravely on guard",
        "water": "playing in a swim ring worn around its waist, both front paws resting on the "
                 "ring, leaning playfully as if floating, goggles on forehead, water drops splashing",
    },
    "ox": {
        "wood":  "pulling a small wooden cart loaded with leafy green saplings, the cart "
                 "behind and below it, head held high and fully clear of the load, "
                 "walking steadily with a proud smile",
        "fire":  "snorting two cute little puffs of flame from its nostrils, stomping one "
                 "front hoof, looking mighty and proud",
        "earth": "happily plowing a tiny field: pulling a small wooden plow, fresh soil "
                 "turning over behind it",
        "metal": "a heavy armored war ox: thick steel plate armor strapped over its back "
                 "and chest, polished metal caps on its horns, standing planted on all "
                 "four hooves like an unmovable fortress, holding nothing",
        "water": "soaking half-submerged in a calm pond like a water buffalo, only eyes, "
                 "snout and horns above the waterline, blissfully zoned out, gentle ripples spreading",
    },
    "tiger": {
        "wood":  "sharpening its claws on a small tree trunk, standing on hind legs, "
                 "leaves shaking loose and fluttering down",
        "fire":  "leaping through a flaming circus hoop, body stretched mid-jump, "
                 "determined grin",
        "earth": "standing proudly on top of a small rocky mountain peak, chest out, "
                 "little pebbles rolling down",
        "metal": "a fierce armored warrior: steel shoulder guards and a chest plate, "
                 "one front paw raised mid-swipe with gleaming steel claw-blades strapped "
                 "over its claws, sharp metallic glints",
        "water": "happily paddling and swimming in water, head above the surface, "
                 "splashes around its front paws (tigers love swimming)",
    },
    "rabbit": {
        "wood":  "nibbling a huge fresh green leaf held in both front paws, "
                 "cheeks stuffed round, tiny sprouts around its feet",
        "fire":  "blasting upward in a powerful rocket launch: a LARGE roaring flame jet "
                 "erupting from under its feet and filling the lower half of the image, "
                 "body tilted diagonally in flight, long ears swept back by the speed, "
                 "flame sparks streaking, exhilarated open-mouthed grin",
        "earth": "digging a burrow enthusiastically: bottom and tail up in the air, "
                 "head half in the hole, dirt flying out behind",
        "metal": "a nimble little knight: a small steel helmet between its long ears, "
                 "light chain-mail vest, holding a slender silver sword upright "
                 "in both front paws, alert stance",
        "water": "sitting at the edge of a pond, scooping water with both front paws to "
                 "wash one long drooping ear, eyes squeezed shut, giggling",
    },
    "dragon": {
        "wood":  "flying in a small spiral around a young tree, its long body curling "
                 "around the trunk, flowers blooming where it passes",
        "fire":  "breathing a small cute flame puff upward with pride, "
                 "chest puffed out, tiny sparks around",
        "earth": "curled cozily around a miniature mountain like a guardian, "
                 "chin resting on the peak, content smile",
        "metal": "clad in overlapping steel armor plates along its body like a war "
                 "dragon, polished metal guards on its shoulders, holding a gleaming "
                 "silver orb in both front paws, proud stance",
        "water": "flying among small rain clouds, raindrops falling from the clouds, "
                 "its long body waving through them happily (the rain-bringing dragon)",
    },
    "snake": {
        "wood":  "draped along a leafy branch like a hanging vine, body curving with the "
                 "vine lines, tongue flicking curiously at a dangling leaf",
        "fire":  "raising its tail tip high with a small candle-like flame dancing on it, "
                 "gazing at the flame in wonder",
        "earth": "burrowing playfully: body half-buried in soil, head popping out of a "
                 "little dirt hole, soil bits on its head",
        "metal": "wearing a sleek steel helmet-crown on its head with polished metal "
                 "bands wrapped along its coils like armor rings, coiled upright and "
                 "guarding a silver blade planted in front of it",
        "water": "swimming like a tiny sea serpent: body making elegant waves through "
                 "water, small splashes and bubbles around",
    },
    "horse": {
        "wood":  "trotting cheerfully with two small baskets of green saplings strapped "
                 "over its back like saddlebags, the baskets sitting low on its flanks "
                 "well behind the neck, mane and head completely unobstructed",
        "fire":  "galloping at full speed with a cute trail of small flames behind its "
                 "hooves, mane flowing, joyful expression",
        "earth": "playfully kicking up dust on a dirt road with its hind legs, "
                 "little dust clouds and pebbles flying",
        "metal": "a warhorse in battle armor: a steel chanfron plate over its forehead "
                 "(eyes fully visible), metal barding along its flanks, gleaming silver "
                 "horseshoes on all four hooves, standing proudly on all four legs",
        "water": "splashing through a shallow stream, water spraying up around all four "
                 "legs, delighted expression",
    },
    "sheep": {
        "wood":  "wearing a flower crown, standing happily in fresh sprouting grass with "
                 "tiny flowers blooming all over its wool, head raised with a gentle "
                 "smile (nothing in its mouth)",
        "fire":  "standing calmly on all four hooves beside a bright crackling campfire, "
                 "head turned toward the flames with a cozy contented smile, "
                 "its fleece lit warm orange by the firelight, embers drifting up",
        "earth": "standing firmly on top of one large flat boulder with all four hooves "
                 "planted solidly ON the rock surface (clearly touching, no floating), "
                 "chest out and head raised proudly like a mountain ram surveying its land",
        "metal": "a woolly little warrior: a small steel helmet sitting between its curled "
                 "horns, a polished breastplate strapped over its fleece, "
                 "standing proudly at attention on all four hooves",
        "water": "swimming happily in clear blue water, paddling along with its head and "
                 "woolly back above the surface, a big cheerful smile, "
                 "water ripples and splashes around it (no clothing — horns and ears "
                 "fully visible, never a sad or crying face)",
    },
    "monkey": {
        "wood":  "hanging from a tree branch by one arm, picking a fruit with the other "
                 "front paw, tail curled, leaves rustling",
        "fire":  "juggling three small fireballs with both front paws, "
                 "tail balancing, focused grin",
        "earth": "carefully stacking small stones into a tiny tower, placing the top "
                 "pebble with delicate fingertips, tongue sticking out in deep concentration",
        "metal": "a martial artist in light steel arm guards and a headband with a "
                 "metal plate, spinning a long silver staff with both front paws, "
                 "mischievous confident grin",
        "water": "cannonballing into cool water: curled up mid-splash with a big "
                 "crown-shaped water splash bursting up around it, droplets flying "
                 "everywhere, eyes squeezed shut with a delighted open-mouthed laugh",
    },
    "rooster": {
        "wood":  "perched high on a leafy tree branch with both feet gripping it firmly, "
                 "wings folded neatly against its sides, chest out and head raised "
                 "proudly, fresh green leaves rustling around it (nothing in its beak)",
        "fire":  "transformed like a tiny phoenix: tail feathers and crest blazing with "
                 "cute cartoon flames, wings spread majestically, small embers floating around",
        "earth": "scratching and pecking at the soil looking for food, one foot "
                 "kicking back a little spray of dirt",
        "metal": "a proud sentry in polished steel: a small crested helmet over its "
                 "comb, metal wing guards, sharp silver spurs on its legs, "
                 "standing tall with its chest out on watch",
        "water": "flapping and splashing joyfully in a round stone birdbath, wings spread "
                 "wide, water drops flying everywhere, eyes closed in bliss",
    },
    "dog": {
        "wood":  "trotting back proudly with a leafy branch CLAMPED FIRMLY between its "
                 "closed jaws at the center of its muzzle, the branch resting across "
                 "its mouth like a fetched stick, tail wagging hard, leaves flying off",
        "fire":  "sprinting like an olympic torch bearer: the torch handle CLAMPED FIRMLY "
                 "between its closed jaws at the center of its muzzle, teeth gripping the "
                 "wooden shaft, the burning flame end raised high above its head, "
                 "tail wagging, proud joyful sprint",
        "earth": "burying a bone in a freshly dug hole, both front paws pushing soil, "
                 "dirt on its nose, tail up",
        "metal": "a loyal guard in steel armor: a small helmet with ear holes, a "
                 "polished chest plate, sitting upright alert beside a silver shield "
                 "planted at its side",
        "water": "shaking off water after a bath, fur puffed mid-shake, water drops "
                 "flying in a circle around it, happy face",
    },
    "pig": {
        "wood":  "sniffing out a truffle under a small tree, snout to the ground, "
                 "one front hoof pointing at the spot, leaves above",
        "fire":  "dressed up in a fierce fiery WILD BOAR costume: a hooded onesie with "
                 "plush tusks and a blazing flame-shaped mane crest along the hood, "
                 "the pig's own cute face peeking out of the hood unchanged, "
                 "charging forward playfully with small cartoon flames trailing behind",
        "earth": "lying blissfully in a shallow mud puddle, belly up, one hoof patting "
                 "the mud, mud splashes around",
        "metal": "a stout little soldier in round steel plate armor covering its back and "
                 "sides, a small pot-shaped helmet on its head, standing sturdily on all "
                 "four hooves with a determined face, a silver shield resting on the "
                 "ground beside it",
        "water": "standing under a tiny waterfall like a shower, eyes closed happily, "
                 "water splashing off its round belly",
    },
}

BASE_PROMPT = """Using the exact same art style AND color palette as the reference images
(cute chibi cartoon, soft gradient shading, clean bold outlines),
draw ONLY ONE animal: {animal_desc}.

STRICT COLOR RULE — blue monochrome only:
- The ENTIRE animal must be painted in shades of blue
  (base #5B9BD5, light #C9E2F5, outline navy #1F4E79)
- NO pink, NO gray, NO brown, NO orange, NO natural animal colors anywhere
- Ears, paws, tail, nose, inner ears: all blue tones, exactly like the reference images

- Solid pure white background (#FFFFFF), no shadow on the ground
- No text, no letters, no watermark
- Full body, centered, facing slightly left
- The animal fills most of the canvas, similar visual weight as the references
- Square composition with a small margin around the animal
"""

THEME_PROMPT = """Use the reference image ONLY for the character's identity:
same species, same chibi proportions, same art style, same face design.

### FIRST AND MOST IMPORTANT — RECOLOR THE ANIMAL ###
The reference animal is BLUE. You MUST repaint its BODY in {palette}.
This is a recolor task: the fur/skin/wool/feathers, ears, muzzle, legs, tail and
outlines all change to the new palette. Adding a prop or costume is NOT enough —
if any blue remains on the animal itself, the image is WRONG.

Now draw this character in a COMPLETELY NEW POSE, fully engaged in this action:
{theme}

- The pose must CHANGE from the reference — the whole body participates in the action
  (posture, limbs, and gaze all directed at the prop/effect)
- ANATOMY RULE: {anatomy}
  Draw EXACTLY four limbs in total — never five, never three. Do not add a spare arm
  to hold a prop: the prop must be held by one of the four limbs it already has.
- SAFETY RULE: no prop may cross, overlap or cut through the neck, throat or face.
  The head and neck must stay fully visible and clearly separated from every prop.
  The whole body must read as one connected, unharmed character.
- Draw ONLY what the theme describes. Never add extra props of your own — especially
  never put a leaf, twig or food in the character's mouth unless the theme says so.
- For birds: wings attach clearly at the shoulders and read as wings — either folded
  neatly against the body or fully spread. Never leave them half-open, detached,
  or tangled with the tail feathers.
- POSE RULE: keep the posture natural and comfortable for that animal's real body.
  A four-legged animal rests on its four legs; never bend its limbs into human sitting
  poses or fold them under the body at broken angles. Expressions stay happy or calm —
  never sad, crying, or in pain.
- HOLDING RULE: whatever the character holds must visibly TOUCH and be gripped by
  the body part holding it. If held in the mouth, the jaws must be closed around
  the object at the center of the muzzle, with clear contact — never let a prop
  float near the face or pass by without being bitten.
- CLOTHING RULE: if the character wears anything (costume, coat, hood, armor), it must
  fit around its real anatomy — ears and horns come THROUGH or OUTSIDE the garment,
  never clipping through the fabric. Paws holding an object must be in front of it,
  never poking through it. Armor and helmets must sit snugly ON the body following its
  curves, sized to this small chibi character — never oversized, floating, or detached.
  Keep the animal's own cute face fully visible and unchanged; the gear is worn BY the
  character, it never replaces or hides who it is.
- Re-check the recolor: every part of the animal body is in {palette}, no blue left,
  and no leftover natural animal colors either — inner ears, muzzle, face skin,
  comb and wattle must all take the new palette, never pink, red or peach.
- The elemental prop/effect must be BOLD and unmistakable at a glance — large enough
  to read as the point of the picture, not a tiny decoration tucked in a corner.
  It may use its own natural accent colors, but it must read as the RIGHT element:
  water is clear blue (never brown or muddy), fire is orange-red flame,
  soil is brown earth, plants are green, metal is gray steel.
- ONE animal only, full body, centered
- Solid pure white background (#FFFFFF), no shadow on the ground
- No text, no letters, no watermark
"""


# 동물별 해부학 규칙 — 테마 동작을 그 동물의 신체에 맞게 번역
ANATOMY_DEFAULT = ("the animal has exactly TWO front paws and TWO hind legs. "
                   "Count the limbs — never draw extra arms or paws. "
                   "Where the theme says 'front paws', use its two front paws.")
ANATOMY_HOOFED = ("this is a FOUR-LEGGED hoofed animal — an ANIMAL body, never a humanoid. "
                  "It has exactly FOUR LEGS ending in hooves, and absolutely NO arms, "
                  "NO shoulders, NO hands and NO fingers. All four legs stay attached "
                  "under its body in normal animal posture, and it cannot hold or carry "
                  "anything with its front legs — objects rest on the ground, hang from "
                  "its body, or are worn. Even in armor it is still a four-legged beast, "
                  "NOT a knight standing on two legs.")
ANATOMY = {
    "snake":   ("the snake has NO arms and NO legs — NEVER draw limbs on it. "
                "Where the theme says 'front paws', the snake instead wraps, holds, "
                "and interacts using its coiling tail and body."),
    "rooster": ("the rooster has TWO wings and TWO legs — no arms, no paws. "
                "Where the theme says 'front paws', use its two wings instead."),
    "dragon":  ("the baby dragon has exactly TWO small front paws, TWO hind legs and one tail. "
                "Count the limbs — never draw extra arms. Its long body may also curl "
                "around the prop to help."),
    "ox":      ANATOMY_HOOFED,
    "horse":   ANATOMY_HOOFED,
    "sheep":   ANATOMY_HOOFED,
    "pig":     ANATOMY_HOOFED,
}


def get_client():
    raw = os.environ.get("GEMINI_API_KEY", "")
    api_key = raw.strip().strip('"').strip("'").strip()
    if not api_key:
        sys.exit("[ERROR] 환경변수 GEMINI_API_KEY 가 없습니다. Google AI Studio에서 키를 발급해 설정하세요.")
    print(f"[key] 길이 {len(api_key)}자, 시작 '{api_key[:4]}...' (env 원본 길이 {len(raw)}자)")
    problems = []
    # AIza... = AI Studio 구형 키(39자), AQ.... = Google Cloud 신형(v2) 키
    if not (api_key.startswith("AIza") or api_key.startswith("AQ.")):
        problems.append(f"키가 'AIza' 또는 'AQ.'로 시작하지 않음 (현재 시작: '{api_key[:6]}')")
    if " " in api_key:
        problems.append("키 중간에 공백이 포함됨")
    if len(api_key) < 30:
        problems.append(f"키 길이가 너무 짧음 (현재 {len(api_key)}자)")
    if problems:
        sys.exit("[ERROR] API 키 형식 이상:\n  - " + "\n  - ".join(problems)
                 + "\n  Google AI Studio(aistudio.google.com/apikey)에서 키를 다시 복사해 setx로 재등록 후 새 터미널에서 실행하세요.")
    from google import genai
    return genai.Client(api_key=api_key)


def image_part(path: Path):
    from google.genai import types
    return types.Part.from_bytes(data=path.read_bytes(), mime_type="image/png")


def generate(client, contents, out_path: Path) -> bool:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = client.models.generate_content(model=MODEL, contents=contents)
            for part in resp.candidates[0].content.parts:
                if getattr(part, "inline_data", None) and part.inline_data.data:
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    out_path.write_bytes(part.inline_data.data)
                    print(f"  [OK] {out_path.relative_to(PROJECT_ROOT)}")
                    return True
            print(f"  [WARN] 응답에 이미지가 없음 (시도 {attempt}/{MAX_RETRIES})")
        except Exception as e:
            print(f"  [WARN] 생성 실패 (시도 {attempt}/{MAX_RETRIES}): {e}")
        time.sleep(2 * attempt)
    print(f"  [FAIL] {out_path.name} — 최대 재시도 초과")
    return False



# ── 팔레트 자동 검사 ───────────────────────────────────────────────
# 오행별 기대 색상(Hue 범위, degrees). 생성 직후 위반을 잡아낸다.
HUE_EXPECT = {
    "wood":  (70, 170),    # 초록
    "fire":  (-25, 25),    # 빨강/주황
    "earth": (25, 60),     # 황토
    "metal": (25, 60),     # 따뜻한 금빛 (파랑이면 위반)
    "water": (170, 260),   # 파랑
}


def check_palette(path: Path, element: str) -> tuple[bool, str]:
    """생성 이미지의 몸 색이 해당 오행 팔레트에 맞는지 검사."""
    try:
        import colorsys
        import numpy as np
        from PIL import Image
    except ImportError:
        return True, "검사 생략(numpy/pillow 없음)"
    im = Image.open(path).convert("RGB").resize((160, 160))
    a = np.asarray(im).astype(float) / 255
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    body = (mx < 0.97) | (sat > 0.12)
    if body.sum() < 100:
        return True, "빈 이미지"
    hues = []
    for y, x in zip(*np.where(body & (sat > 0.18))):
        r, g, b = a[y, x]
        hues.append(colorsys.rgb_to_hsv(r, g, b)[0] * 360)
    if not hues:
        # 채도 있는 픽셀이 없음 = 완전 무채색. 金도 금빛이어야 하므로 위반
        return False, "무채색 일색 — 색이 빠짐"
    hues = np.array(hues)
    blue = float(((hues >= 180) & (hues <= 260)).mean())
    if element == "water":
        return blue > 0.4, f"blue={blue:.0%}"
    if blue > 0.25:
        return False, f"파란색 잔존 blue={blue:.0%}"
    lo, hi = HUE_EXPECT[element]
    h2 = np.where(hues > 300, hues - 360, hues)
    hit = float(((h2 >= lo) & (h2 <= hi)).mean())
    lo, hi = HUE_EXPECT[element]
    h2 = np.where(hues > 300, hues - 360, hues)
    if element == "metal":
        # 금빛(따뜻한 색조)이어야 함. 무채색 회색 일색이면 옛 팔레트 → 위반
        warm = float(((h2 >= 20) & (h2 <= 65)).mean())
        if warm < 0.35:
            return False, f"금빛 부족(warm={warm:.0%}) — 회색 일색 의심"
        return True, f"warm={warm:.0%}, blue={blue:.0%}"
    return hit > 0.30, f"{element}색 {hit:.0%}, blue={blue:.0%}"

def find_base_image(animal: str) -> Path | None:
    """확정 레퍼런스(refs) 우선, 없으면 생성본(raw)에서 파란색 기준본을 찾는다."""
    for d in (REFS_DIR, RAW_DIR):
        p = d / f"zodiac_{animal}_{BASE_ELEMENT}.png"
        if p.exists():
            return p
    return None


def phase_base(client, animals: list[str], force: bool = False):
    ref_images = sorted(REFS_DIR.glob("*.png"))
    if not ref_images:
        sys.exit(f"[ERROR] 레퍼런스가 없습니다. 확정본을 {REFS_DIR} 에 넣어주세요.")
    print(f"[base] 스타일 레퍼런스 {len(ref_images)}장: {[p.name for p in ref_images]}")

    for animal in animals:
        out = RAW_DIR / f"zodiac_{animal}_{BASE_ELEMENT}.png"
        if not force and find_base_image(animal):
            print(f"[base] {animal}: 이미 있음 — 스킵 (재생성: --force 또는 raw에서 삭제)")
            continue
        print(f"[base] {animal} 생성 중...")
        contents = [image_part(p) for p in ref_images]
        contents.append(BASE_PROMPT.format(animal_desc=ANIMALS[animal]))
        generate(client, contents, out)


def phase_recolor(client, animals: list[str], elements: list[str]):
    for animal in animals:
        base = find_base_image(animal)
        if not base:
            print(f"[recolor] {animal}: 파란색 기준본이 없어 스킵 (--phase base 먼저 실행)")
            continue
        for element in elements:
            out = RAW_DIR / f"zodiac_{animal}_{element}.png"
            if out.exists():
                print(f"[recolor] {animal}/{element}: 이미 있음 — 스킵")
                continue
            print(f"[recolor] {animal}/{element} 생성 중...")
            contents = [image_part(base),
                        THEME_PROMPT.format(palette=ELEMENTS[element],
                                            theme=THEMES[animal][element],
                                            anatomy=ANATOMY.get(animal, ANATOMY_DEFAULT))]
            if generate(client, contents, out):
                ok, detail = check_palette(out, element)
                if not ok:
                    print(f"  [팔레트 위반] {out.name} — {detail} → 검수 필요")


def remove_backgrounds():
    try:
        from rembg import remove
        from PIL import Image
    except ImportError:
        sys.exit("[ERROR] pip install rembg onnxruntime pillow 후 다시 실행하세요.")
    files = sorted(RAW_DIR.glob("zodiac_*.png"))
    if not files:
        sys.exit(f"[ERROR] {RAW_DIR} 에 처리할 이미지가 없습니다.")
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    for f in files:
        out = PNG_DIR / f.name
        if out.exists():
            print(f"[rembg] {f.name}: 이미 있음 — 스킵")
            continue
        result = remove(Image.open(f))
        result.save(out)
        print(f"[rembg] [OK] {out.relative_to(PROJECT_ROOT)}")


def main():
    parser = argparse.ArgumentParser(description="12지신 x 오행 이미지 생성")
    parser.add_argument("--phase", choices=["base", "recolor", "all"], default=None,
                        help="base: 파란색 12마리 / recolor: 오행 리컬러 / all: 둘 다")
    parser.add_argument("--animals", default=",".join(ANIMALS),
                        help="쉼표 구분 동물 목록 (기본: 전체)")
    parser.add_argument("--elements", default=",".join(ELEMENTS),
                        help="쉼표 구분 오행 목록 (기본: wood,fire,earth,metal,water)")
    parser.add_argument("--remove-bg", action="store_true",
                        help="raw 이미지 일괄 배경 제거 -> png 폴더")
    parser.add_argument("--force", action="store_true",
                        help="base: 이미 있어도 재생성 (raw에 덮어씀, refs는 건드리지 않음)")
    args = parser.parse_args()

    animals = [a.strip() for a in args.animals.split(",") if a.strip()]
    for a in animals:
        if a not in ANIMALS:
            sys.exit(f"[ERROR] 알 수 없는 동물: {a} (가능: {', '.join(ANIMALS)})")
    elements = [e.strip() for e in args.elements.split(",") if e.strip()]
    for e in elements:
        if e not in ELEMENTS:
            sys.exit(f"[ERROR] 알 수 없는 오행: {e} (가능: {', '.join(ELEMENTS)})")

    if not args.phase and not args.remove_bg:
        parser.print_help()
        sys.exit(0)

    if args.phase:
        client = get_client()
        if args.phase in ("base", "all"):
            phase_base(client, animals, force=args.force)
        if args.phase in ("recolor", "all"):
            phase_recolor(client, animals, elements)

    if args.remove_bg:
        remove_backgrounds()

    print("\n완료.")


if __name__ == "__main__":
    main()

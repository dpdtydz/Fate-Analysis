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
       python scripts/generate_zodiac.py --phase space --spaces balanced      # 모임 공간 앵커 1장 먼저
       python scripts/generate_zodiac.py --phase space           # 나머지 공간 6장 (balanced 앵커 사용)
       python scripts/generate_zodiac.py --remove-bg             # 생성 없이 배경 제거만 일괄 수행

출력:
  assets/zodiac/raw/zodiac_{animal}_{element}.png   (흰 배경 원본)
  assets/zodiac/raw/space_{key}.png                 (모임 공간 7종)
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

# 역할별 팔레트 — 역할 분기가 이미 일간 오행이라 ELEMENTS를 그대로 쓴다
ROLE_PALETTES = {
    "spark": ELEMENTS["fire"],
    "healer": ELEMENTS["earth"],
    "keeper": ELEMENTS["metal"],
    "captain": ELEMENTS["wood"],
    "sage": ELEMENTS["water"],
}

# 역할별 공통 감정 — 128px 원형 엠블럼에서 표정만으로 역할이 갈려야 한다
ROLE_EMOTION = {
    "spark": "Big open-mouthed laugh, eyes in happy crescents, body springing UPWARD.",
    "healer": "Eyes half-closed with a soft gentle smile, body LOWERED into a caring posture.",
    "keeper": "Eyes wide and sharp, head slightly tilted, mouth in a firm tidy line; body STILL, gaze on the prop.",
    "captain": "Chin lifted, eyes blazing straight at the viewer, body pushing FORWARD.",
    "sage": "Sideways glance, one-sided knowing smirk, body low and quiet.",
}

# 동물 x 역할 테마 60종 (기획자 검수본)
ROLE_THEMES = {
    "rat": {
        "spark": "Bouncing up on its hind legs with both front paws flung wide open above its shoulders, "
                    "mouth open in a huge laugh, whiskers swept back by its own momentum. Tiny warm sparkles "
                    "pop in the air around its paws. Eyes squeezed into happy crescents, looking straight at "
                    "the viewer. ",
        "healer": "Sitting calmly and holding a small steaming teacup in both front paws, offering it "
                    "forward toward the viewer with a gentle warm smile. Eyes softly half-closed, head tilted "
                    "kindly. The cup is small — no bigger than its own head — and clearly gripped by both "
                    "paws. ",
        "keeper": "Sitting upright with a small open ledger book propped between both front paws, one paw "
                    "pointing at a line in it, brow furrowed in sharp concentration. Head tilted slightly, "
                    "eyes bright and alert. A tiny coin pouch sits closed on the ground beside its tail. ",
        "captain": "Standing tall on its hind legs, one front paw thrust forward pointing decisively ahead, "
                    "the other planted on its hip. Chin lifted, eyes blazing with resolve straight at the "
                    "viewer. A small plain pennant flag is planted in the ground beside it, reaching only "
                    "shoulder height. ",
        "sage": "Crouched low and quiet, holding a small half-unrolled scroll between both front paws, "
                    "eyes scanning it sideways with a knowing narrow gaze. One whisker twitched. A faint one- "
                    "sided smirk, as if it just found the answer nobody else saw. ",
    },
    "ox": {
        "spark": "Head thrown back mid-bellow-laugh, mouth wide open, two puffs of warm steam bursting "
                    "from its nostrils and curling upward. All four hooves planted but the front half lifted "
                    "in a joyful hop, tail flicked up. Eyes crescent-shaped, radiating good humor at the "
                    "viewer. ",
        "healer": "Lying down with its legs folded neatly beneath it in a calm resting posture, a small "
                    "folded blanket draped over its broad back. Head lowered to eye level, eyes half-closed "
                    "and serene, offering a patient listening expression toward the viewer. Nothing held — it "
                    "simply stays. ",
        "keeper": "Standing steadily on all four hooves with a small pair of balance scales resting on the "
                    "ground directly in front of its lowered head, both pans perfectly level. Eyes fixed "
                    "intently on the scales, ears forward, expression firm and dependable. It holds nothing — "
                    "it inspects. ",
        "captain": "Front half lowered and shoulders bunched in a powerful forward-charge stance, all four "
                    "hooves gripping the ground, head lowered with horns aimed ahead. Eyes locked forward "
                    "with unstoppable determination, one puff of steam at the nostrils. A small pennant is "
                    "tied to one horn. ",
        "sage": "Standing still on all four hooves, head turned to look back over its shoulder at the "
                    "viewer with a slow, deeply knowing half-lidded gaze. Ears swivelled attentively. A small "
                    "closed scroll rests on the ground beside its front hooves. Utterly unhurried. ",
    },
    "tiger": {
        "spark": "Rolled onto its back paws in a playful pounce-start, front paws patting the air like a "
                    "drum roll, mouth open in a delighted roar-laugh showing tiny fangs. Ears perked fully "
                    "forward, tail curled into a spring shape. Looking up and slightly at the viewer. ",
        "healer": "Sitting upright but relaxed, one front paw resting gently on the ground in front of it "
                    "as if reaching out to reassure someone. Ears turned softly outward, eyes half-closed and "
                    "warm, a small calm smile with fangs hidden. Tail curled protectively around its own "
                    "side. ",
        "keeper": "Sitting upright with a small closed ledger tucked under one front paw, the other front "
                    "paw raised in a crisp 'one moment' gesture. Chin slightly lifted, eyes narrowed in "
                    "shrewd focus toward the viewer, mouth set in a no-nonsense line. Tail curled tight and "
                    "orderly. ",
        "captain": "Standing squared-up on all fours, chest out, one front paw raised and slammed forward "
                    "mid-stride. Head high, mouth open in a commanding roar, ears flat with authority. Eyes "
                    "fierce and fixed on the viewer. Tail lashing straight back like a banner. ",
        "sage": "Crouched low in tall stillness, body half-turned away but head swivelled back to the "
                    "viewer, eyes narrowed into sharp calculating slits. One front paw resting on a small go- "
                    "stone placed on the ground. A faint one-sided knowing smile. ",
    },
    "rabbit": {
        "spark": "Caught mid-leap with both long ears streaming upward and hind legs kicked out behind, "
                    "front paws clapping together in front of its chest. Mouth open in a squeaky cheer, eyes "
                    "wide and sparkling. Small warm confetti-like motes trail its jump. ",
        "healer": "Sitting with both long ears drooped softly down around its face like a comforting hood, "
                    "front paws folded together over its chest. Eyes half-closed in a tender smile, head "
                    "tilted toward the viewer. A small folded blanket rests beside it on the ground. ",
        "keeper": "Sitting upright with a small abacus held flat between both front paws, one paw mid-flick "
                    "sliding a bead across. Long ears standing perfectly straight and alert. Eyes wide and "
                    "focused on the beads, mouth pursed in careful concentration. ",
        "captain": "Standing upright on hind legs with both long ears raised straight and rigid like "
                    "antennae, one front paw raised high in a clear 'follow me' signal. Chest out, eyes wide "
                    "and fearless toward the viewer. A small pennant flag is planted in the ground at its "
                    "side. ",
        "sage": "Sitting very still with one long ear pricked straight up and the other flopped down, "
                    "listening for something. Both front paws hold a small closed folding fan against its "
                    "chest. Eyes glancing sideways, alert and clever, with a subtle secretive smile. ",
    },
    "dragon": {
        "spark": "Coiled body springing upward like a party streamer, both small front paws thrown open, "
                    "mouth open in a bright laugh with a tiny harmless puff of warm light escaping. Tail "
                    "whipped into a cheerful loop behind it. Eyes big and delighted, aimed at the viewer. ",
        "healer": "Body coiled into a soft protective ring, like a nest with an open front, both small "
                    "front paws folded gently at its chest. Head resting low at the rim of the coil, eyes "
                    "half-closed, breathing a tiny puff of warm gentle light. A calm caretaking smile. ",
        "keeper": "Coiled upright with a small closed money pouch cradled in both front paws against its "
                    "chest, guarding it neatly. Tail curled into a tidy spiral beneath. Eyes sharp and "
                    "watchful, aimed at the viewer, with a small confident closed-mouth smile. ",
        "captain": "Reared upright with the body coiled beneath for height, both small front paws spread in "
                    "a commanding stance, head held high and turned to the viewer. Eyes glowing with "
                    "authority, a confident open-mouthed shout. Tail sweeping back in a bold arc. ",
        "sage": "Coiled compactly and low, chin resting on its own tail loop, both small front paws "
                    "holding a small half-open scroll. Eyes half-lidded and ancient-wise, glancing sideways "
                    "at the viewer. A tiny thoughtful puff of mist at the nostrils. ",
    },
    "snake": {
        "spark": "Body coiled into a rising spiral like a party ribbon, head lifted high at the top with "
                    "its mouth open in a cheerful grin, tongue flicking out playfully. The tail tip curls "
                    "upward in a flourish. Warm sparkles rise along the spiral. Bright happy eyes toward the "
                    "viewer. ",
        "healer": "Coiled into a wide flat spiral like a warm cushion, head resting low on top of its own "
                    "coils and turned toward the viewer, eyes half-closed in a serene smile. The outermost "
                    "coil opens slightly, as if making room for someone to sit. No tongue flick — perfectly "
                    "calm. ",
        "keeper": "Coiled into a neat stacked spiral like a filing tower, head raised at the top, the tail "
                    "tip curled around a small closed ledger and holding it up beside the body. Eyes narrow "
                    "and precise, focused on the ledger. Every coil is perfectly even — order made visible. ",
        "captain": "Body reared into a tall vertical S-curve, head at the very top looking down at the "
                    "viewer with unblinking authority. The tail tip is wrapped firmly around a small pennant "
                    "flag, holding it upright beside the raised body. Mouth open in a commanding hiss. ",
        "sage": "Coiled tightly and low with only the head raised slightly, looking sideways at the "
                    "viewer through narrow calculating eyes. The tail tip curls delicately around a single "
                    "small go-stone, holding it up for inspection. Tongue barely flicking. Silent and "
                    "patient. ",
    },
    "horse": {
        "spark": "Rearing lightly onto its hind legs in a joyful prance, front hooves lifted off the "
                    "ground and mane flying upward, mouth open in a whinnying laugh. Tail streaming behind. "
                    "Eyes crescent-happy, head turned toward the viewer. Holds nothing — the joy is all body. ",
        "healer": "Standing with all four hooves planted but head lowered all the way down to eye level, "
                    "neck curved into a soft arc, mane falling forward. Eyes half-closed, ears turned gently "
                    "sideways, offering a quiet nuzzle toward the viewer. A small blanket lies folded on the "
                    "ground beside its hooves. ",
        "keeper": "Standing squarely on all four hooves with a small pair of balance scales on the ground "
                    "in front, head lowered to check them at eye level. Ears pricked forward, eyes serious "
                    "and measuring, mane neatly falling. It cannot hold anything — it verifies with its gaze. ",
        "captain": "Rearing high on its hind legs with both front hooves striking forward, mane and tail "
                    "streaming back, head turned to the viewer with a bold open-mouthed neigh. Eyes blazing "
                    "with drive. A small pennant is tied to a short strap across its shoulders, streaming "
                    "behind. ",
        "sage": "Standing quietly with head turned in profile, one ear rotated back and one forward, eye "
                    "glancing sideways at the viewer with sharp intelligence. Mane falling over one eye. A "
                    "small closed scroll lies on the ground near its front hooves. Perfectly composed, "
                    "holding nothing. ",
    },
    "sheep": {
        "spark": "Bouncing straight up off all four hooves like a spring, woolly fleece bouncing and "
                    "puffing outward, mouth open in a bright bleating laugh. A few soft wool tufts float free "
                    "around it. Eyes squeezed shut with happiness, head tilted toward the viewer. ",
        "healer": "Standing on all four hooves with its exceptionally thick soft fleece puffed out, head "
                    "turned toward the viewer and lowered, eyes half-closed in a gentle smile. The fleece "
                    "reads as the softest, safest place to lean on. Nothing held — the wool itself is the "
                    "comfort. ",
        "keeper": "Standing on all four hooves with a small closed coin pouch hanging from a short strap "
                    "around its neck, resting flat against its fleece well below the chin. Head turned to the "
                    "viewer, eyes alert and businesslike, mouth in a firm little line. ",
        "captain": "Standing braced on all four hooves at the front of an implied line, head high, small "
                    "curled horns thrust forward, chest pushed out. Eyes hard and resolute toward the viewer, "
                    "mouth open in a rallying bleat. A small pennant is tied to one curled horn. ",
        "sage": "Standing calmly with head lowered in thought, eyes glancing up sideways at the viewer "
                    "from beneath its wool with unexpected shrewdness. One small curled horn catches the "
                    "light. A small closed fan rests on the ground by its hooves. Quiet, underestimated. ",
    },
    "monkey": {
        "spark": "Mid-cartwheel with one front paw on the ground and the other flung up, tail curled into "
                    "a jaunty question-mark, mouth stretched into a huge mischievous grin showing teeth. "
                    "Eyebrows raised high. Eyes locked on the viewer as if it just landed a perfect joke. ",
        "healer": "Sitting cross-legged and calm for once, both front paws resting open on its knees, palms "
                    "up in a welcoming gesture. Tail curled quietly around itself. Eyes half-closed, eyebrows "
                    "softened, wearing an unusually gentle and patient smile toward the viewer. ",
        "keeper": "Sitting with a small abacus held in both front paws, tail curled around a tiny coin "
                    "pouch to keep it secure. Eyes darting sharply to the beads, one eyebrow raised, wearing "
                    "a clever 'I already counted it' smirk toward the viewer. ",
        "captain": "Standing upright on hind legs on a small rock, one front paw raised high gripping a "
                    "small pennant flag and shaking it, the other paw cupped at its mouth mid-shout. Tail "
                    "straight up like an exclamation mark. Eyes wide, grinning with fearless bravado at the "
                    "viewer. ",
        "sage": "Sitting cross-legged with a small closed folding fan held in one front paw, tapping it "
                    "thoughtfully against the other paw. Head tilted, one eyebrow raised high, eyes glinting "
                    "sideways at the viewer with a sly all-knowing smirk. Tail curled into a thinking spiral. ",
    },
    "rooster": {
        "spark": "Wings fully spread wide and flapping, chest thrown out, beak wide open in a triumphant "
                    "crow, comb and wattle bouncing. Standing tall on both legs, one foot lifted mid-step. "
                    "Small warm sparkles burst from the tips of its spread wings. Facing the viewer proudly. ",
        "healer": "Standing calmly with both wings lowered and slightly opened forward, like a sheltering "
                    "cape spread to take someone in. Head tilted down and toward the viewer, beak closed, "
                    "eyes half-closed and kind. Comb and wattle relaxed. A quiet, protective stance. ",
        "keeper": "Standing tall and upright with a small open ledger balanced between both partly spread "
                    "wings, beak pointed down at the page in strict inspection. Comb upright, eyes narrowed "
                    "and exacting. Both legs planted squarely — the posture of an auditor. ",
        "captain": "Standing at full height with chest thrust out, both wings raised and spread in a "
                    "commanding rally, comb held high, beak open in a loud crowing order. One leg stepped "
                    "forward. Eyes sharp and imperious, aimed directly at the viewer. ",
        "sage": "Standing very still in profile with one eye turned to fix the viewer in a sharp sideways "
                    "stare, head held low and forward like a strategist reading a board. Both wings folded "
                    "tightly and neatly. A single small go-stone rests on the ground before its feet. ",
    },
    "dog": {
        "spark": "Front paws lifted off the ground in an excited play-bow-to-jump, tongue lolling out in a "
                    "huge open-mouthed grin, tail a blur of wagging. Ears flopped up by the bounce. Eyes "
                    "wide, shining, fixed adoringly on the viewer. ",
        "healer": "Lying down in a relaxed sphinx pose with its head resting on top of both front paws, "
                    "looking up at the viewer with big soft trusting eyes and a gentle closed-mouth smile. "
                    "Ears relaxed and drooping. Tail resting in a calm curve, tip barely wagging. ",
        "keeper": "Sitting attentively with a small closed coin pouch set on the ground between its front "
                    "paws, one paw placed firmly on top of it in clear guard position. Ears pricked, eyes "
                    "bright and dutiful, looking straight at the viewer. Tail curled neatly around its "
                    "haunches. ",
        "captain": "Standing squarely in an alert leader's stance, one front paw raised and pointing ahead, "
                    "chest forward, ears pricked fully upright. Mouth open in a rallying bark, eyes bright "
                    "and determined at the viewer. Tail raised high and straight like a banner. ",
        "sage": "Sitting alert but silent, head tilted at a curious angle, one ear up and one down, eyes "
                    "narrowed in focused thought at something off to the side. A small half-unrolled scroll "
                    "lies open on the ground between its front paws, one paw resting on its edge. ",
    },
    "pig": {
        "spark": "All four hooves doing a happy little jig, body wiggling, snout tilted up in a wide open- "
                    "mouthed squeal of laughter, curly tail vibrating. Ears flapped upward by the motion. "
                    "Eyes crescent-shaped with joy, aimed at the viewer. ",
        "healer": "Lying down on its side-front in a cozy settled posture, all four hooves tucked in, snout "
                    "resting low and turned toward the viewer with a contented gentle smile. Eyes half- "
                    "closed. A small folded blanket is draped over its back. ",
        "keeper": "Standing on all four hooves beside a small piggy-bank-shaped coin box resting on the "
                    "ground, snout lowered to nudge a single coin toward its slot. Eyes focused on the coin, "
                    "ears forward, expression thrifty and satisfied. Nothing is held in the hooves. ",
        "captain": "Standing on all four hooves in a firm braced stance, snout raised and pushed forward, "
                    "ears pricked stiffly up, shoulders squared. Eyes narrowed with stubborn unstoppable "
                    "resolve toward the viewer, mouth open in a rallying grunt. A small pennant is tied at "
                    "its shoulder. ",
        "sage": "Standing quietly with head turned back over its shoulder toward the viewer, small eyes "
                    "glinting with surprising cunning beneath relaxed ears. Snout slightly wrinkled in a "
                    "knowing half-smile. A small closed scroll rests on the ground beside its hooves. ",
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


ROLE_PROMPT = """Use the reference image ONLY for the character's identity:
same species, same chibi proportions, same art style, same face design.

### FIRST — RECOLOR THE ANIMAL ###
The reference animal is BLUE. You MUST repaint its BODY in {palette}.
Fur/skin/wool/feathers, ears, muzzle, legs, tail and outlines all take the new palette.
No blue may remain on the animal, and no leftover natural animal colors either
(inner ears, comb, wattle, face skin) — never pink, red or peach.

Now draw this character performing its role in the group:
{emotion}
{theme}

- COMPOSITION: the character is the hero. It sits in the CENTER and fills at least 65%
  of the frame height. Any prop stays SMALLER than the character's own torso and never
  bigger than its head; it sits beside or below the character, never above the head.
- The image will be cropped to a CIRCLE: keep the head and upper body well inside the
  middle of the canvas, nothing important near the corners.
- The expression must be readable from the face alone at small size — use one big clear
  emotion, not a subtle one.
- ANATOMY RULE: {anatomy}
  Draw EXACTLY four limbs in total — never five, never three. Do not add a spare arm to
  hold a prop: it must be held by one of the limbs it already has, or rest on the ground.
- SAFETY RULE: any flag, strap, pole or prop must stay entirely BESIDE or BELOW the head.
  It must never pass in front of, behind, or across the neck or face. A neck strap hangs
  low on the chest, well clear of the chin. The character must read as one connected,
  unharmed body.
- POSE RULE: keep the posture natural for that animal's real body. A four-legged animal
  rests on its four legs; never fold its limbs into human sitting poses at broken angles.
  Expressions stay happy, calm or confident — never sad, crying, or in pain.
- Draw ONLY what is described. Never add extra props of your own, and never put a leaf,
  twig or food in the character's mouth unless stated.
- ONE animal only, full body, solid pure white background (#FFFFFF), no shadow.
- No text, no letters, no watermark.
"""


# ── 모임 공간(space) 7종 ──────────────────────────────────────────
# 오행 구성(uniqueElements + dominant)으로 갈리는 우리 모임 심볼.
# 캐릭터가 아니라 "빈 공간"이므로 캐릭터 refs를 앵커로 쓰면 동물이 딸려 들어온다.
SPACE_PREFIX = """A cute chibi cartoon ILLUSTRATION OF A PLACE — an empty inviting interior/exterior scene
with NO characters, NO animals and NO people in it. Same art style as the reference
character sheets: soft gradient shading, clean bold outlines, warm friendly shapes,
simple rounded forms, no fine detail. Isometric three-quarter view, the scene sits as a
single compact island floating on a solid pure white background (#FFFFFF) with a small
margin. No text, no letters, no signage, no watermark. The whole scene must stay readable
when cropped to a CIRCLE: keep the main structure centered and compact, nothing important
in the corners.
"""

SPACES = {
    # 대통합 광장 — 오행 4종 이상. 다섯 갈래 길이 하나의 원형 광장으로 모인다.
    "balanced": "A round open plaza paved in warm stone, with five small paths radiating outward from it "
                "in five directions. Each path is tinted a different colour — green, red-orange, ochre, "
                "warm pale gold, blue — and each ends in a tiny archway. At the center of the plaza stands "
                "a low round table with five empty cushions around it. Bright, open, welcoming daylight.",
    # 온실 아틀리에 — 木 우세. 새 프로젝트가 계속 싹트는 곳.
    "wood": "A cozy glass greenhouse studio filled with potted plants and climbing green vines, wooden "
            "shelves of seedlings along the walls, a long wooden worktable in the middle with an open "
            "notebook and empty stools around it. Soft green light filtering through the glass roof. "
            "Everything in fresh green tones (#4CAF50) with warm wood accents.",
    # 한밤의 캠프파이어 라운지 — 火 우세. 떠들고 웃고 밤새는 모임.
    "fire": "A warm outdoor lounge at night gathered around a crackling campfire in a stone ring, with "
            "low cushioned seats and a hanging string of small warm lights arching overhead. A kettle "
            "rests on a grill beside the fire. Everything glows in warm red-orange firelight (#E53935) "
            "against deep cozy shadow. Empty seats, waiting.",
    # 골목 안 사랑방 툇마루 — 土 우세. 신발 벗고 눌러앉는 곳.
    "earth": "A traditional Korean wooden veranda (numaru) of a small hanok, with a low wooden table set "
             "with empty teacups and floor cushions, sliding paper doors open behind it, and a small "
             "earthenware jar garden at the side. Warm ochre and earthen tones (#D4A017), afternoon sun, "
             "deeply calm and settled.",
    # 정밀 공방 & 연구실 — 金 우세. 파고들고 만들어내는 모임. 파랑기 금지.
    "metal": "A tidy workshop-laboratory interior: a long metal workbench with neatly arranged precision "
             "tools hung in perfect rows on a pegboard wall, a brass desk lamp, a magnifying stand, small "
             "labelled drawers, and empty stools tucked under the bench. Everything in warm pale gold and "
             "warm silver tones (#C9B896) — a warm precious-metal sheen. CRITICAL: absolutely NO blue and "
             "NO blue-gray anywhere; keep it warm and golden.",
    # 심야 서재 & 바다 창 — 水 우세. 깊고 조용하고 속 얘기 하는 모임.
    "water": "A quiet late-night study room with tall bookshelves, a wide arched window looking out onto "
             "a calm moonlit sea, a reading desk with an open book and a single small lamp, and a deep "
             "empty armchair beside it. Cool blue tones (#5B9BD5) with soft lamplight. Still, private, "
             "contemplative.",
    # 순혈 성소 — 오행 1종. 뉴트럴 스톤으로 뽑고 오행 틴트는 코드(CSS)에서 입힌다.
    "pure": "A small circular shrine platform of pale stone, open to the sky, with a single tall smooth "
            "monolith pillar standing exactly at its center and a ring of five low identical stone markers "
            "around the rim. Utterly symmetrical, quiet and rare. Neutral pale stone tones so it can be "
            "tinted, soft even light.",
}

# balanced를 먼저 확정하고, 그것을 나머지 6종의 스타일 앵커로 삼는다.
SPACE_ANCHOR = "balanced"


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


def phase_role(client, animals: list[str], roles: list[str]):
    """내 띠 캐릭터가 모임 속 시그니처 역할을 연기하는 이미지 (12 x 4 = 48장)."""
    for animal in animals:
        base = find_base_image(animal)
        if not base:
            print(f"[role] {animal}: 기준본이 없어 스킵 (--phase base 먼저 실행)")
            continue
        for role in roles:
            out = RAW_DIR / f"zodiac_{animal}_role_{role}.png"
            if out.exists():
                print(f"[role] {animal}/{role}: 이미 있음 — 스킵")
                continue
            print(f"[role] {animal}/{role} 생성 중...")
            contents = [image_part(base),
                        ROLE_PROMPT.format(palette=ROLE_PALETTES[role],
                                           emotion=ROLE_EMOTION[role],
                                           theme=ROLE_THEMES[animal][role],
                                           anatomy=ANATOMY.get(animal, ANATOMY_DEFAULT))]
            generate(client, contents, out)


def phase_space(client, spaces: list[str]):
    """우리 모임 심볼 — 오행 구성으로 갈리는 빈 공간 7장.

    앵커 규칙: 캐릭터 refs를 앵커로 쓰면 동물이 딸려 들어온다.
    balanced 1장은 텍스트만으로 뽑고, 나머지 6종은 그 balanced를 스타일 앵커로 첨부한다.
    """
    anchor_path = RAW_DIR / f"space_{SPACE_ANCHOR}.png"

    # balanced를 항상 먼저 처리해야 나머지 6종의 앵커가 생긴다
    ordered = ([SPACE_ANCHOR] if SPACE_ANCHOR in spaces else []) + \
              [s for s in spaces if s != SPACE_ANCHOR]

    for key in ordered:
        out = RAW_DIR / f"space_{key}.png"
        if out.exists():
            print(f"[space] {key}: 이미 있음 — 스킵")
            if key == SPACE_ANCHOR:
                anchor_path = out
            continue

        contents = []
        if key != SPACE_ANCHOR:
            if not anchor_path.exists():
                print(f"[space] {key}: 스타일 앵커 space_{SPACE_ANCHOR}.png 가 없어 스킵 "
                      f"— 먼저 balanced를 생성하세요 "
                      f"(python scripts/generate_zodiac.py --phase space --spaces {SPACE_ANCHOR})")
                continue
            # 캐릭터 refs가 아니라 확정된 balanced 공간만 앵커로 쓴다
            contents.append(image_part(anchor_path))

        print(f"[space] {key} 생성 중...")
        contents.append(SPACE_PREFIX + "\n" + SPACES[key])
        if generate(client, contents, out) and key == SPACE_ANCHOR:
            anchor_path = out


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
    parser.add_argument("--roles", default=",".join(ROLE_PALETTES),
                        help="쉼표 구분 역할 목록 (기본: spark,healer,keeper,captain)")
    parser.add_argument("--spaces", default=",".join(SPACES),
                        help="쉼표 구분 모임 공간 목록 (기본: 전체 7종)")
    parser.add_argument("--phase", choices=["base", "recolor", "role", "space", "all"], default=None,
                        help="base: 기준본 12마리 / recolor: 오행 60장 / role: 역할 60장 / "
                             "space: 모임 공간 7장 / all: 전부(space 제외, 앵커 순서 의존)")
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
    roles = [r.strip() for r in args.roles.split(",") if r.strip()]
    for r in roles:
        if r not in ROLE_PALETTES:
            sys.exit(f"[ERROR] 알 수 없는 역할: {r} (가능: {', '.join(ROLE_PALETTES)})")
    spaces = [s.strip() for s in args.spaces.split(",") if s.strip()]
    for s in spaces:
        if s not in SPACES:
            sys.exit(f"[ERROR] 알 수 없는 공간: {s} (가능: {', '.join(SPACES)})")

    if not args.phase and not args.remove_bg:
        parser.print_help()
        sys.exit(0)

    if args.phase:
        client = get_client()
        if args.phase in ("base", "all"):
            phase_base(client, animals, force=args.force)
        if args.phase in ("recolor", "all"):
            phase_recolor(client, animals, elements)
        if args.phase in ("role", "all"):
            phase_role(client, animals, roles)
        # space는 balanced -> 나머지 6종 앵커 순서에 의존하므로 all에 넣지 않는다
        if args.phase == "space":
            phase_space(client, spaces)

    if args.remove_bg:
        remove_backgrounds()

    print("\n완료.")


if __name__ == "__main__":
    main()

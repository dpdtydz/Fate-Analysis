// Hybrid Archetype Engine: Combining Saju (60 Ilju) + Zi Wei Dou Shu (14 Main Stars) + MBTI (16 Types)

export type ZodiacAnimalKey =
  | "rat" | "ox" | "tiger" | "rabbit" | "dragon" | "snake"
  | "horse" | "sheep" | "monkey" | "rooster" | "dog" | "pig";

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

export interface ZiweiStarInfo {
  id: string;
  name: string;          // 한글 명칭 (예: 칠살성)
  hanja: string;         // 한자 (예: 七殺星)
  archetype: string;     // 페르소나 (예: 돌파의 수호 검객)
  roleKey: "metal" | "role_sage" | "role_captain" | "role_spark" | "role_healer"; // Native high-res asset role
  koreanSeal: string;    // 정갈한 인주 낙관 (예: 破竹之勢)
  statBonus: {
    resolution: number;  // 결단력
    execution: number;   // 추진력
    insight: number;     // 혜안력
    empathy: number;     // 공감력
    harmony: number;     // 조화력
  };
}

export const ZIWEI_STARS: Record<string, ZiweiStarInfo> = {
  qisha: {
    id: "qisha",
    name: "칠살성",
    hanja: "七殺星",
    archetype: "정의로운 수호 기사 (돌파·결단)",
    roleKey: "metal", // 검과 투구를 갖춘 기사 캐릭터
    koreanSeal: "斷金之結",
    statBonus: { resolution: 28, execution: 22, insight: 10, empathy: -6, harmony: -4 },
  },
  tianji: {
    id: "tianji",
    name: "천기성",
    hanja: "天機星",
    archetype: "별빛의 현자 책사 (지략·통찰)",
    roleKey: "role_sage", // 별빛과 깊은 지혜를 품은 현자 캐릭터
    koreanSeal: "慧眼通達",
    statBonus: { resolution: 8, execution: 12, insight: 30, empathy: 14, harmony: 16 },
  },
  ziwei: {
    id: "ziwei",
    name: "자미성",
    hanja: "紫微星",
    archetype: "깃발을 든 리더 (통솔·위엄)",
    roleKey: "role_captain", // 깃발을 들고 무리를 이끄는 캡틴 캐릭터
    koreanSeal: "統帥之令",
    statBonus: { resolution: 22, execution: 20, insight: 18, empathy: 12, harmony: 24 },
  },
  tanlang: {
    id: "tanlang",
    name: "탐랑성",
    hanja: "貪狼星",
    archetype: "마음을 여는 스파크 (매혹·재능)",
    roleKey: "role_spark", // 꽃가루를 날리며 활짝 웃는 분위기 메이커
    koreanSeal: "萬人和氣",
    statBonus: { resolution: 12, execution: 22, insight: 14, empathy: 28, harmony: 20 },
  },
};

export interface HybridArchetypeResult {
  serialNo: string;
  uniqueTitle: string;
  zodiacAnimal: ZodiacAnimalKey;
  element: ElementKey;
  star: ZiweiStarInfo;
  mbti: string;
  stats: {
    resolution: number;
    execution: number;
    insight: number;
    empathy: number;
    harmony: number;
  };
  description: string;
  characterLayers: {
    auraUrl: string;
    bodyUrl: string;
  };
}

const ELEMENT_KOREAN: Record<ElementKey, string> = {
  wood: "푸른 나무(木)",
  fire: "타오르는 불(火)",
  earth: "단단한 흙(土)",
  metal: "서늘한 쇠(金)",
  water: "깊은 물(水)",
};

const ANIMAL_KOREAN: Record<ZodiacAnimalKey, string> = {
  rat: "쥐", ox: "소", tiger: "호랑이", rabbit: "토끼", dragon: "용", snake: "뱀",
  horse: "말", sheep: "양", monkey: "원숭이", rooster: "닭", dog: "개", pig: "돼지",
};

export function calculateHybridArchetype(params: {
  animal: ZodiacAnimalKey;
  element: ElementKey;
  starId: string;
  mbti: string;
  monthSeason?: "spring" | "summer" | "autumn" | "winter";
}): HybridArchetypeResult {
  const { animal, element, starId, mbti, monthSeason = "autumn" } = params;
  const star = ZIWEI_STARS[starId] || ZIWEI_STARS.qisha;

  // 1. Base Stats by Element
  let base = { resolution: 50, execution: 50, insight: 50, empathy: 50, harmony: 50 };
  if (element === "metal") {
    base.resolution += 16; base.insight += 10; base.empathy -= 6;
  } else if (element === "fire") {
    base.execution += 18; base.resolution += 10; base.harmony -= 4;
  } else if (element === "wood") {
    base.empathy += 18; base.execution += 8; base.resolution -= 4;
  } else if (element === "water") {
    base.insight += 20; base.harmony += 12; base.execution -= 4;
  } else if (element === "earth") {
    base.harmony += 18; base.resolution += 8; base.insight += 6;
  }

  // 2. Month Season Seasoning (득령/실령 가중치)
  if (monthSeason === "autumn") {
    base.resolution += 5; base.insight += 4;
  } else if (monthSeason === "summer") {
    base.execution += 5;
  } else if (monthSeason === "spring") {
    base.empathy += 5;
  } else {
    base.insight += 5;
  }

  // 3. MBTI Modifiers
  const isE = mbti.startsWith("E");
  const isT = mbti.includes("T");
  const isJ = mbti.endsWith("J");
  const isN = mbti.includes("N");

  base.execution += isE ? 7 : -3;
  base.empathy += isE ? 5 : -2;
  base.resolution += isT ? 9 : -5;
  base.empathy += isT ? -6 : 10;
  base.insight += isN ? 9 : -1;
  base.harmony += isJ ? 7 : -3;

  // 4. Ziwei Star Modifiers
  const stats = {
    resolution: Math.min(99, Math.max(35, Math.round(base.resolution + star.statBonus.resolution))),
    execution: Math.min(99, Math.max(35, Math.round(base.execution + star.statBonus.execution))),
    insight: Math.min(99, Math.max(35, Math.round(base.insight + star.statBonus.insight))),
    empathy: Math.min(99, Math.max(35, Math.round(base.empathy + star.statBonus.empathy))),
    harmony: Math.min(99, Math.max(35, Math.round(base.harmony + star.statBonus.harmony))),
  };

  // 5. Native Role Asset Selection (100% Consistent Disney/Korean Cute Art Style)
  const bodyUrl =
    star.roleKey === "metal"
      ? `/zodiac/zodiac_${animal}_metal.webp`
      : `/zodiac/zodiac_${animal}_${star.roleKey}.webp`;

  const adjective =
    star.id === "qisha"
      ? (isT ? "냉철한 칼날의 수호 기사" : "정의로운 신념의 기사")
      : star.id === "tianji"
      ? (isN ? "별빛을 읽는 천재 현자" : "혜안을 품은 책사")
      : star.id === "ziwei"
      ? "깃발을 높이 든 캡틴 리더"
      : "마음을 환하게 밝히는 분위기 메이커";

  const uniqueTitle = `[${star.name} × ${mbti}] ${adjective} ${ANIMAL_KOREAN[animal]}`;
  const serialNo = `NO. ${element.toUpperCase()}-${animal.toUpperCase()}-${star.id.toUpperCase()}-${mbti}`;

  const description = `${ELEMENT_KOREAN[element]}의 기운과 ${star.name}(${star.hanja})의 별빛, 그리고 ${mbti}의 개성이 어우러졌습니다. ${star.archetype}의 기질을 타고나 ${
    isT ? "명료한 논리와 흔들림 없는 결단력" : "따스한 공감과 세심한 배려심"
  }으로 모임에서 빛나는 신뢰와 존재감을 드러냅니다.`;

  return {
    serialNo,
    uniqueTitle,
    zodiacAnimal: animal,
    element,
    star,
    mbti,
    stats,
    description,
    characterLayers: {
      auraUrl: `/zodiac/space_${element}.png`,
      bodyUrl,
    },
  };
}

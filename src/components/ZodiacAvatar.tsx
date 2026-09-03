import React, { useState } from "react";

/**
 * 12지신 × 오행 캐릭터 아바타
 *
 * 연지(띠) × 일간 오행 조합으로 60종 리소스 중 하나를 고른다.
 * 리소스: public/zodiac/zodiac_{animal}_{element}.png (투명 PNG)
 * design.md §1 — 이미지 위 텍스트 금지, 장식 테두리 금지.
 */

/** 지지(地支), 한글 지지, 한글 동물명, 영문 동물명 → 리소스 파일명 */
export const BRANCH_TO_ANIMAL: Record<string, string> = {
  // 한자 지지
  子: "rat", 丑: "ox", 寅: "tiger", 卯: "rabbit",
  辰: "dragon", 巳: "snake", 午: "horse", 未: "sheep",
  申: "monkey", 酉: "rooster", 戌: "dog", 亥: "pig",
  // 한글 지지
  자: "rat", 축: "ox", 인: "tiger", 묘: "rabbit",
  진: "dragon", 사: "snake", 오: "horse", 미: "sheep",
  신: "monkey", 유: "rooster", 술: "dog", 해: "pig",
  // 한글 동물명
  쥐: "rat", 소: "ox", 호랑이: "tiger", 토끼: "rabbit",
  용: "dragon", 뱀: "snake", 말: "horse", 양: "sheep",
  원숭이: "monkey", 닭: "rooster", 개: "dog", 돼지: "pig",
  // 영문 동물명
  rat: "rat", ox: "ox", tiger: "tiger", rabbit: "rabbit",
  dragon: "dragon", snake: "snake", horse: "horse", sheep: "sheep",
  monkey: "monkey", rooster: "rooster", dog: "dog", pig: "pig",
};

/** 지지/동물명 → 한글 띠 이름 (대체 텍스트용) */
export const BRANCH_TO_NAME: Record<string, string> = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼",
  辰: "용", 巳: "뱀", 午: "말", 未: "양",
  申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
  자: "쥐", 축: "소", 인: "호랑이", 묘: "토끼",
  진: "용", 사: "뱀", 오: "말", 미: "양",
  신: "원숭이", 유: "닭", 술: "개", 해: "돼지",
  쥐: "쥐", 소: "소", 호랑이: "호랑이", 토끼: "토끼",
  용: "용", 뱀: "뱀", 말: "말", 양: "양",
  원숭이: "원숭이", 닭: "닭", 개: "개", 돼지: "돼지",
  rat: "쥐", ox: "소", tiger: "호랑이", rabbit: "토끼",
  dragon: "용", snake: "뱀", horse: "말", sheep: "양",
  monkey: "원숭이", rooster: "닭", dog: "개", pig: "돼지",
};

/** 오행 → 리소스 파일명 (한자·한글·영문 모두 허용) */
export const ELEMENT_TO_KEY: Record<string, string> = {
  木: "wood", 목: "wood", wood: "wood",
  火: "fire", 화: "fire", fire: "fire",
  土: "earth", 토: "earth", earth: "earth",
  金: "metal", 금: "metal", metal: "metal",
  水: "water", 수: "water", water: "water",
};

export const ELEMENT_TO_NAME: Record<string, string> = {
  wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
  木: "목", 火: "화", 土: "토", 金: "금", 水: "수",
  목: "목", 화: "화", 토: "토", 금: "금", 수: "수",
};

export const ASSET_VERSION = "muzik_v10";

/** 현대 라이프스타일 5대 소품 키 */
export type ItemKey = "glasses" | "sunglasses" | "bowtie" | "headphones" | "scarf";

/** 오행(五行) → 대표 라이프스타일 소품 매핑 (1:1 결합) */
export const ELEMENT_TO_ITEM: Record<string, ItemKey> = {
  wood: "bowtie",      // 목(木): 클래식 보타이 (추진력 & 리더)
  fire: "sunglasses",  // 화(火): 파티 선글라스 (열정 & 비타민)
  earth: "scarf",      // 토(土): 니트 목도리 (포용 & 온기 메이커)
  metal: "glasses",    // 금(金): 스마트 안경 (통찰 & 지략가)
  water: "headphones", // 수(水): 무선 헤드폰 (지혜 & 마이웨이)
  목: "bowtie",
  화: "sunglasses",
  토: "scarf",
  금: "glasses",
  수: "headphones",
  木: "bowtie",
  火: "sunglasses",
  土: "scarf",
  金: "glasses",
  水: "headphones",
};

/** 모임 속 시그니처 역할 — ViralCardModal의 roleAnalysis.key와 같은 값 */
export type RoleKey = "spark" | "healer" | "keeper" | "captain" | "sage";

/** 역할(Role) → 대표 라이프스타일 소품 매핑 */
export const ROLE_TO_ITEM: Record<RoleKey, ItemKey> = {
  captain: "bowtie",     // 목 / 리더 캡틴
  spark: "sunglasses",   // 화 / 분위기 비타민
  healer: "scarf",       // 토 / 온기 메이커 (구 힐러)
  sage: "glasses",       // 금 / 히든 책사 지략가
  keeper: "headphones",  // 수 / 실속 밸런서 마이웨이
};

/** MBTI → 대표 라이프스타일 소품 매핑 */
export const MBTI_TO_ITEM: Record<string, ItemKey> = {
  INTJ: "glasses", INTP: "glasses", ISTJ: "glasses", ENTJ: "glasses",
  ENFP: "sunglasses", ESFP: "sunglasses", ENTP: "sunglasses", ESTP: "sunglasses",
  ESTJ: "bowtie", ESFJ: "bowtie", ENFJ: "bowtie",
  ISTP: "headphones", INFP: "headphones", ISFP: "headphones",
  ISFJ: "scarf", INFJ: "scarf",
};

/** 멤버 객체에서 띠(animal)와 오행(element), 소품(item)을 자동 추출하는 헬퍼 */
export function extractMemberZodiacProps(member?: any): {
  branch: string | null;
  element: string | null;
  item: ItemKey | null;
} {
  if (!member) return { branch: null, element: null, item: null };
  const rawBranch =
    member.saju?.pillars?.day?.ji ||
    member.saju?.pillars?.year?.ji ||
    member.character_animal ||
    "";
  const branch =
    typeof rawBranch === "string" && rawBranch.length > 1 && !BRANCH_TO_ANIMAL[rawBranch]
      ? rawBranch[0]
      : rawBranch || null;

  const rawElement =
    member.saju?.daymaster?.element ||
    member.character_color ||
    "목";
  const element = typeof rawElement === "string" ? rawElement : "목";

  // MBTI가 있으면 MBTI 기반 매핑, 없으면 오행 기반 소품 배정
  const mbti = member.mbti ? String(member.mbti).toUpperCase().trim() : "";
  const item = MBTI_TO_ITEM[mbti] || ELEMENT_TO_ITEM[element] || "bowtie";

  return { branch, element, item };
}

/** 띠 × 소품 직접 지정 시 최신 320x320 투명 WebP 경로 반환 */
export function zodiacItemSrc(
  branch?: string | null,
  item?: ItemKey | null
): string | null {
  const animal = branch ? BRANCH_TO_ANIMAL[branch] : null;
  if (!animal) return null;
  const itemKey = item || "bowtie";
  return `/zodiac/zodiac_${animal}_item_${itemKey}.webp?v=${ASSET_VERSION}`;
}

/** 띠·오행 조합으로 신규 60종 라이프스타일 WebP 에셋 자동 반환 (호환성 유지) */
export function zodiacImageSrc(
  branch?: string | null,
  element?: string | null
): string | null {
  const animal = branch ? BRANCH_TO_ANIMAL[branch] : null;
  if (!animal) return null;
  const elemKey = element ? ELEMENT_TO_KEY[element] || element : "wood";
  const itemKey = ELEMENT_TO_ITEM[elemKey] || "bowtie";
  return `/zodiac/zodiac_${animal}_item_${itemKey}.webp?v=${ASSET_VERSION}`;
}

/** 띠 × 역할 캐릭터 이미지 경로 (신규 WebP 매핑) */
export function roleImageSrc(
  branch?: string | null,
  role?: RoleKey | null
): string | null {
  const animal = branch ? BRANCH_TO_ANIMAL[branch] : null;
  if (!animal) return null;
  const itemKey = (role && ROLE_TO_ITEM[role]) || "bowtie";
  return `/zodiac/zodiac_${animal}_item_${itemKey}.webp?v=${ASSET_VERSION}`;
}

/** 멤버 객체로부터 곧바로 12지신 아바타 이미지 URL을 얻는다 */
export function getMemberZodiacSrc(member?: any): string | null {
  const { branch, item } = extractMemberZodiacProps(member);
  return zodiacItemSrc(branch, item);
}

export interface ZodiacAvatarProps {
  /** 편의용: Member 객체를 통째로 전달 가능 */
  member?: any;
  /** 연지(年支) 또는 일지(日支) — 한자("寅"), 한글 지지("인"), 한글 동물("호랑이") 모두 허용 */
  branch?: string | null;
  /** 일간 오행 — 한자("木") 또는 한글("목") 또는 영문("wood") */
  element?: string | null;
  /** 소품 키 직접 지정 — glasses, sunglasses, bowtie, headphones, scarf */
  item?: ItemKey | null;
  /** 역할 키 — 지정 시 띠 × 역할 캐릭터 이미지 렌더링 */
  role?: RoleKey | null;
  /** 렌더 크기(px). 기본 112 */
  size?: number;
  className?: string;
  /** 이미지 로드 실패 또는 데이터 부재 시 대체 표시할 이모지 */
  fallbackEmoji?: string | null;
}

export default function ZodiacAvatar({
  member,
  branch: branchProp,
  element: elementProp,
  item: itemProp,
  role,
  size = 112,
  className = "",
  fallbackEmoji,
}: ZodiacAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const extracted = member
    ? extractMemberZodiacProps(member)
    : { branch: null, element: null, item: null };
  const branch = branchProp ?? extracted.branch;
  const element = elementProp ?? extracted.element;
  const item = itemProp ?? extracted.item;

  // 우선순위: 직접 지정 item > role > element 자동 매핑
  let src: string | null = null;
  if (item) {
    src = zodiacItemSrc(branch, item);
  } else if (role) {
    src = roleImageSrc(branch, role);
  } else {
    src = zodiacImageSrc(branch, element);
  }

  if (!src || imgFailed) {
    if (fallbackEmoji) {
      return (
        <span
          className={`inline-flex items-center justify-center select-none ${className}`}
          style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.55)) }}
        >
          {fallbackEmoji}
        </span>
      );
    }
    return null;
  }

  const animalName = branch ? BRANCH_TO_NAME[branch] ?? "" : "";

  return (
    <img
      src={src}
      alt={`${animalName} 12지신 라이프스타일 캐릭터`}
      decoding="async"
      onError={() => setImgFailed(true)}
      className={`object-contain select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** 모임 공간 — ViralCardModal의 groupStats.spaceKey와 같은 값 */
export type SpaceKey = "balanced" | "pure" | "wood" | "fire" | "earth" | "metal" | "water";

export const SPACE_NAMES: Record<SpaceKey, string> = {
  balanced: "대통합 광장",
  pure: "순혈 성소",
  wood: "온실 아틀리에",
  fire: "캠프파이어 라운지",
  earth: "사랑방 툇마루",
  metal: "정밀 공방",
  water: "심야 서재",
};

/**
 * 모임 공간 배경/심볼 이미지 경로.
 * 오행 구성에 따라 배정되는 모임의 상징 공간.
 */
export function spaceImageSrc(spaceKey?: string | null): string | null {
  if (!spaceKey) return null;
  return `/zodiac/space_${spaceKey}.png`;
}

export interface MemberRoleInfo {
  key: RoleKey;
  role: string;
  hanja: string;
  tagline: string;
}

/**
 * 사주 일간 오행과 MBTI 조합으로 모임 속 시그니처 역할을 산출한다.
 */
export function calculateMemberRole(member?: { saju?: { daymaster?: { element?: string | null } | null } | null; mbti?: string | null } | null): MemberRoleInfo {
  const elem = member?.saju?.daymaster?.element || "목";
  const mbti = member?.mbti ? String(member.mbti).toUpperCase() : "";

  if (elem === "화" || (mbti.includes("E") && mbti.includes("P"))) {
    return { key: "spark", role: "스파크 메이커", hanja: "和氣 (화기)", tagline: "모임의 분위기를 띄우며 어색함을 단숨에 녹여요" };
  }
  if (elem === "토" || (mbti.includes("F") && mbti.includes("J"))) {
    return { key: "healer", role: "멘탈 케어 힐러", hanja: "德厚 (덕후)", tagline: "누구 하나 소외되지 않도록 묵묵히 챙겨주는 안식처" };
  }
  if (elem === "금" || (mbti.includes("T") && mbti.includes("J"))) {
    return { key: "keeper", role: "실속 총무 & 밸런서", hanja: "信實 (신실)", tagline: "일정과 정산을 똑 부러지게 챙기며 빈틈을 막아요" };
  }
  if (elem === "목" || (mbti.includes("E") && mbti.includes("J"))) {
    return { key: "captain", role: "카리스마 캡틴", hanja: "統率 (통솔)", tagline: "목표가 생기면 거침없이 전진하며 모두를 이끌어요" };
  }
  return { key: "sage", role: "히든 책사 & 브레인", hanja: "睿智 (예지)", tagline: "조용히 판을 읽고 결정적인 순간에 묘수를 던져요" };
}

/**
 * 멤버 목록의 오행 분포로부터 모임 공간 키(SpaceKey)를 판별한다.
 * 4종 이상 섞이면 대통합 광장(balanced), 1종뿐이면 순혈 성소(pure), 그 외엔 최다 오행 공간.
 */
export function calculateSpaceKey(members: Array<{ saju?: { daymaster?: { element?: string | null } | null } | null }>): SpaceKey {
  const counts: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
  members.forEach(m => {
    const elem = m?.saju?.daymaster?.element;
    if (elem && counts[elem] !== undefined) counts[elem]++;
  });
  const uniqueElements = Object.values(counts).filter(c => c > 0).length;
  const ELEM_TO_SPACE: Record<string, SpaceKey> = {
    목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water",
  };
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (uniqueElements >= 4) return "balanced";
  if (uniqueElements === 1) return "pure";
  return ELEM_TO_SPACE[dominant] ?? "balanced";
}



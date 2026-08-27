import React from "react";

/**
 * 12지신 × 오행 캐릭터 아바타
 *
 * 연지(띠) × 일간 오행 조합으로 60종 리소스 중 하나를 고른다.
 * 리소스: public/zodiac/zodiac_{animal}_{element}.png (투명 PNG)
 * design.md §1 — 이미지 위 텍스트 금지, 장식 테두리 금지.
 */

/** 지지(地支) → 리소스 파일명 */
const BRANCH_TO_ANIMAL: Record<string, string> = {
  子: "rat",
  丑: "ox",
  寅: "tiger",
  卯: "rabbit",
  辰: "dragon",
  巳: "snake",
  午: "horse",
  未: "sheep",
  申: "monkey",
  酉: "rooster",
  戌: "dog",
  亥: "pig",
};

/** 지지 → 한글 띠 이름 (대체 텍스트용) */
const BRANCH_TO_NAME: Record<string, string> = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼",
  辰: "용", 巳: "뱀", 午: "말", 未: "양",
  申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
};

/** 오행 → 리소스 파일명 (한자·한글 모두 허용) */
const ELEMENT_TO_KEY: Record<string, string> = {
  木: "wood", 목: "wood",
  火: "fire", 화: "fire",
  土: "earth", 토: "earth",
  金: "metal", 금: "metal",
  水: "water", 수: "water",
};

const ELEMENT_TO_NAME: Record<string, string> = {
  wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
};

export interface ZodiacAvatarProps {
  /** 연지(年支) 한자 — 예: "寅" */
  branch?: string | null;
  /** 일간 오행 — 한자("木") 또는 한글("목") */
  element?: string | null;
  /** 렌더 크기(px). 기본 112 */
  size?: number;
  className?: string;
}

/** 띠·오행 조합이 유효하면 이미지 경로를, 아니면 null을 돌려준다. */
export function zodiacImageSrc(
  branch?: string | null,
  element?: string | null
): string | null {
  const animal = branch ? BRANCH_TO_ANIMAL[branch] : null;
  const elem = element ? ELEMENT_TO_KEY[element] : null;
  if (!animal || !elem) return null;
  return `/zodiac/zodiac_${animal}_${elem}.png`;
}

export default function ZodiacAvatar({
  branch,
  element,
  size = 112,
  className = "",
}: ZodiacAvatarProps) {
  const src = zodiacImageSrc(branch, element);
  if (!src) return null;

  const animalName = branch ? BRANCH_TO_NAME[branch] ?? "" : "";
  const elemKey = element ? ELEMENT_TO_KEY[element] : "";
  const elemName = elemKey ? ELEMENT_TO_NAME[elemKey] ?? "" : "";

  return (
    <img
      src={src}
      alt={`${elemName}(${element}) 기운의 ${animalName} 캐릭터`}
      /* lazy 금지 — 크기를 지정해도 로드 전 레이아웃이 0이 되는 순간이 있어
         lazy 로더가 "화면 밖"으로 판단해 영원히 로드하지 않는 교착이 생긴다.
         카드의 핵심 시각 요소라 즉시 로드한다. */
      decoding="async"
      className={`object-contain select-none ${className}`}
      /* 박스는 size로 고정하고 그림은 object-contain으로 비율을 지킨다 */
      style={{ width: size, height: size }}
    />
  );
}

/** 모임 속 시그니처 역할 — ViralCardModal의 roleAnalysis.key와 같은 값 */
export type RoleKey = "spark" | "healer" | "keeper" | "captain" | "sage";

/**
 * 띠 × 역할 캐릭터 이미지 경로.
 * 내 띠 캐릭터가 그 역할을 연기하는 그림이라 오행은 쓰지 않는다
 * (역할 자체가 이미 일간 오행으로 갈리므로 색은 역할이 정한다).
 */
export function roleImageSrc(
  branch?: string | null,
  role?: RoleKey | null
): string | null {
  const animal = branch ? BRANCH_TO_ANIMAL[branch] : null;
  if (!animal || !role) return null;
  return `/zodiac/zodiac_${animal}_role_${role}.png`;
}

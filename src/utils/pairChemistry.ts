import { Member, PairAnalysis } from "../types";

export function getWesternZodiac(birthDateStr?: string): { name: string; emoji: string } {
  if (!birthDateStr) return { name: "알 수 없음", emoji: "⭐" };
  const parts = birthDateStr.split("-");
  if (parts.length < 3) return { name: "알 수 없음", emoji: "⭐" };
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return { name: "알 수 없음", emoji: "⭐" };

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: "양자리", emoji: "♈" };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: "황소자리", emoji: "♉" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return { name: "쌍둥이자리", emoji: "♊" };
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return { name: "게자리", emoji: "♋" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: "사자자리", emoji: "♌" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: "처녀자리", emoji: "♍" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: "천칭자리", emoji: "♎" };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: "전갈자리", emoji: "♏" };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: "사수자리", emoji: "♐" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "염소자리", emoji: "♑" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "물병자리", emoji: "♒" };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: "물고기자리", emoji: "♓" };

  return { name: "알 수 없음", emoji: "⭐" };
}

export function isDummyPair(pair?: Partial<PairAnalysis> | null): boolean {
  if (!pair) return true;
  if (!pair.description || pair.description.trim() === "대조합" || pair.description.trim().length < 5) return true;
  if (!pair.saju?.description || pair.saju.description.trim() === "대조합" || pair.saju.description.trim().length < 5) return true;
  if (!pair.ziwei?.description || pair.ziwei.description.trim() === "대조합" || pair.ziwei.description.trim().length < 5) return true;
  if (pair.label === "대조합") return true;
  return false;
}

export type ChemGrade = "UR" | "SSR" | "SR" | "SSS" | "SS" | "S" | "A" | "B" | "C" | "D" | "F";

export function getGradeFromScore(score: number): {
  grade: ChemGrade;
  title: string;
  color: string;
  badgeBg: string;
  desc: string;
} {
  if (score >= 95) {
    return {
      grade: "UR",
      title: "신화급 천생연분",
      color: "text-amber-500",
      badgeBg: "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm font-black",
      desc: "우주가 점찍은 100점 만점 전설의 인연! 눈빛만 봐도 통하는 영혼의 단짝입니다.",
    };
  }
  if (score >= 88) {
    return {
      grade: "SSR",
      title: "환상의 소울메이트",
      color: "text-rose-500",
      badgeBg: "bg-rose-500 text-white shadow-xs font-bold",
      desc: "만났다 하면 시간 순삭! 서로의 장점을 최고조로 끌어올리는 환상적인 궁합입니다.",
    };
  }
  if (score >= 80) {
    return {
      grade: "SR",
      title: "티키타카 꿀케미",
      color: "text-purple-600",
      badgeBg: "bg-purple-600 text-white font-bold",
      desc: "호흡이 척척 맞고 같이 있으면 텐션이 샘솟는 든든한 꿀조합입니다.",
    };
  }
  if (score >= 70) {
    return {
      grade: "SSS",
      title: "특급 시너지 콤비",
      color: "text-indigo-600",
      badgeBg: "bg-indigo-600 text-white font-bold",
      desc: "함께 무언가를 도모할 때 능률과 재미가 200% 폭발하는 최고의 파트너입니다.",
    };
  }
  if (score >= 60) {
    return {
      grade: "SS",
      title: "은근히 잘 통하는 호감",
      color: "text-blue-600",
      badgeBg: "bg-blue-600 text-white font-semibold",
      desc: "무리하지 않아도 마음이 편안하고, 대화의 리듬이 자연스럽게 이어지는 좋은 인연입니다.",
    };
  }
  if (score >= 50) {
    return {
      grade: "S",
      title: "잔잔하고 편안한 인연",
      color: "text-emerald-600",
      badgeBg: "bg-emerald-600 text-white font-semibold",
      desc: "서로 지나치게 간섭하지 않고 각자의 공간을 지켜주며 담백하고 길게 이어지는 궁합입니다.",
    };
  }
  if (score >= 40) {
    return {
      grade: "A",
      title: "현실적인 보통 사이",
      color: "text-teal-600",
      badgeBg: "bg-teal-600 text-white font-medium",
      desc: "코드가 맞을 땐 유쾌하지만 가끔 관점 차이도 있는, 현실에서 가장 흔하고 무난한 인연입니다.",
    };
  }
  if (score >= 30) {
    return {
      grade: "B",
      title: "밀당과 조율이 필요한 관계",
      color: "text-amber-600",
      badgeBg: "bg-amber-600 text-white font-medium",
      desc: "생각의 결이 달라 가끔 묘한 정적이 흐릅니다. 적당한 거리두기가 승리 공식입니다.",
    };
  }
  if (score >= 20) {
    return {
      grade: "C",
      title: "자존심 대결 금지! 삐걱 케미",
      color: "text-orange-600",
      badgeBg: "bg-orange-600 text-white font-medium",
      desc: "성향 차이가 뚜렷해 사소한 말에도 오해가 생기기 쉽습니다. 먼저 양보하는 사람이 보살!",
    };
  }
  if (score >= 10) {
    return {
      grade: "D",
      title: "스파크 주의! 애증의 관계",
      color: "text-rose-700",
      badgeBg: "bg-rose-700 text-white font-medium",
      desc: "기운이 정면으로 부딪히는 불꽃 상충 기류! 단둘이 오래 있으면 기빨리니 안전거리 필수입니다.",
    };
  }
  return {
    grade: "F",
    title: "파국 주의! 0점 수렴 악연",
    color: "text-slate-800 dark:text-slate-200",
    badgeBg: "bg-slate-900 text-white font-bold",
    desc: "물과 기름! 서로를 바꾸려 들면 파국으로 치닫습니다. 깍듯한 비즈니스 모드로 대처하세요.",
  };
}

// Deterministic Pseudo Random Helper
function getDeterministicHash(str1: string, str2: string, seed: number): number {
  const combined = [str1, str2].sort().join("::");
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs((hash + seed * 997) % 10000);
}

export function generateDynamicPairCompatibility(m1: Member, m2: Member): PairAnalysis {
  const m1Id = m1.id || "m1";
  const m2Id = m2.id || "m2";

  // 1. Daymaster & Elements
  const g1 = m1.saju?.daymaster?.gan || m1.saju?.pillars?.day?.gan || "무토";
  const g2 = m2.saju?.daymaster?.gan || m2.saju?.pillars?.day?.gan || "기토";
  const elem1 = m1.saju?.daymaster?.element || "토";
  const elem2 = m2.saju?.daymaster?.element || "토";

  // Branches (지지)
  const dBranch1 = m1.saju?.pillars?.day?.ji || "";
  const dBranch2 = m2.saju?.pillars?.day?.ji || "";
  const yBranch1 = m1.saju?.pillars?.year?.ji || "";
  const yBranch2 = m2.saju?.pillars?.year?.ji || "";

  // 2. Heavenly Stem Combinations (천간합: 갑기, 을경, 병신, 정임, 무계)
  const isStemHarmony =
    (g1.includes("갑") && g2.includes("기")) || (g1.includes("기") && g2.includes("갑")) ||
    (g1.includes("을") && g2.includes("경")) || (g1.includes("경") && g2.includes("을")) ||
    (g1.includes("병") && g2.includes("신")) || (g1.includes("신") && g2.includes("병")) ||
    (g1.includes("정") && g2.includes("임")) || (g1.includes("임") && g2.includes("정")) ||
    (g1.includes("무") && g2.includes("계")) || (g1.includes("계") && g2.includes("무"));

  // 3. Earthly Branch Six Combinations (지지 육합: 자축, 인해, 묘술, 진유, 사신, 오미)
  const checkSixHarmony = (b1: string, b2: string) => {
    if (!b1 || !b2) return false;
    const pair = [b1, b2].sort().join("");
    return pair === "자축" || pair === "인해" || pair === "묘술" || pair === "진유" || pair === "사신" || pair === "오미";
  };
  const isDaySixHarmony = checkSixHarmony(dBranch1, dBranch2);
  const isYearSixHarmony = checkSixHarmony(yBranch1, yBranch2);

  // 4. Earthly Branch Triple Combinations (지지 삼합: 신자진, 사유축, 인오술, 해묘미)
  const checkTripleHarmony = (b1: string, b2: string) => {
    if (!b1 || !b2) return false;
    const pair = [b1, b2].sort().join("");
    return (
      ["신자", "자진", "신진"].includes(pair) ||
      ["사유", "유축", "사축"].includes(pair) ||
      ["인오", "오술", "인술"].includes(pair) ||
      ["해묘", "묘미", "해미"].includes(pair)
    );
  };
  const isDayTripleHarmony = checkTripleHarmony(dBranch1, dBranch2);

  // 5. Earthly Branch Clash (지지 충: 자오, 축미, 인신, 묘유, 진술, 사해)
  const checkBranchClash = (b1: string, b2: string) => {
    if (!b1 || !b2) return false;
    const pair = [b1, b2].sort().join("");
    return pair === "자오" || pair === "축미" || pair === "인신" || pair === "묘유" || pair === "진술" || pair === "사해";
  };
  const isDayClash = checkBranchClash(dBranch1, dBranch2);
  const isYearClash = checkBranchClash(yBranch1, yBranch2);

  // 6. Earthly Branch Wonjin (원진살: 자미, 축오, 인유, 묘신, 진해, 사술)
  const checkWonjin = (b1: string, b2: string) => {
    if (!b1 || !b2) return false;
    const pair = [b1, b2].sort().join("");
    return pair === "자미" || pair === "축오" || pair === "인유" || pair === "묘신" || pair === "진해" || pair === "사술";
  };
  const isWonjin = checkWonjin(dBranch1, dBranch2) || checkWonjin(yBranch1, yBranch2);

  // 7. Five Elements Generation (오행 상생)
  const isGen1to2 =
    (elem1 === "목" && elem2 === "화") ||
    (elem1 === "화" && elem2 === "토") ||
    (elem1 === "토" && elem2 === "금") ||
    (elem1 === "금" && elem2 === "수") ||
    (elem1 === "수" && elem2 === "목");

  const isGen2to1 =
    (elem2 === "목" && elem1 === "화") ||
    (elem2 === "화" && elem1 === "토") ||
    (elem2 === "토" && elem1 === "금") ||
    (elem2 === "금" && elem1 === "수") ||
    (elem2 === "수" && elem1 === "목");

  // Five Elements Clash (오행 상극)
  const isSajuElementClash =
    (elem1 === "목" && elem2 === "토") ||
    (elem1 === "토" && elem2 === "수") ||
    (elem1 === "수" && elem2 === "화") ||
    (elem1 === "화" && elem2 === "금") ||
    (elem1 === "금" && elem2 === "목") ||
    (elem2 === "목" && elem1 === "토") ||
    (elem2 === "토" && elem1 === "수") ||
    (elem2 === "수" && elem1 === "화") ||
    (elem2 === "화" && elem1 === "금") ||
    (elem2 === "금" && elem1 === "목");

  // 8. Western Zodiac
  const z1 = getWesternZodiac(m1.birth_date);
  const z2 = getWesternZodiac(m2.birth_date);
  const getZodiacElement = (name: string) => {
    if (["양자리", "사자자리", "사수자리"].includes(name)) return "불";
    if (["황소자리", "처녀자리", "염소자리"].includes(name)) return "흙";
    if (["쌍둥이자리", "천칭자리", "물병자리"].includes(name)) return "공기";
    return "물";
  };
  const ze1 = getZodiacElement(z1.name);
  const ze2 = getZodiacElement(z2.name);
  const isZodiacCompatible = (ze1 === ze2) ||
    (ze1 === "불" && ze2 === "공기") || (ze1 === "공기" && ze2 === "불") ||
    (ze1 === "흙" && ze2 === "물") || (ze1 === "물" && ze2 === "흙");
  const isZodiacClash = (ze1 === "불" && ze2 === "물") || (ze1 === "물" && ze2 === "불") ||
    (ze1 === "흙" && ze2 === "공기") || (ze1 === "공기" && ze2 === "흙");

  // 9. MBTI
  const code1 = m1.mbti?.trim().toUpperCase() || "";
  const code2 = m2.mbti?.trim().toUpperCase() || "";
  const isMbti1Ok = code1.length === 4 && !code1.includes("미");
  const isMbti2Ok = code2.length === 4 && !code2.includes("미");
  let mbtiDelta = 0;
  if (isMbti1Ok && isMbti2Ok) {
    let same = 0;
    if (code1[0] === code2[0]) same++;
    if (code1[1] === code2[1]) same++;
    if (code1[2] === code2[2]) same++;
    if (code1[3] === code2[3]) same++;
    if (same === 4) mbtiDelta = 6;
    else if (same >= 2) mbtiDelta = 2;
    else mbtiDelta = -4;
  }

  // 🎯 DRAMATIC SCORE COMPUTATION
  // Base score: 50 (Centers average relationship in the 40-60 range!)
  let rawScore = 50;

  // Additions (Positive Chemistry)
  if (isStemHarmony) rawScore += 16;
  if (isDaySixHarmony) rawScore += 18;
  else if (isYearSixHarmony) rawScore += 10;
  if (isDayTripleHarmony) rawScore += 14;
  if (isGen1to2 || isGen2to1) rawScore += 10;
  else if (elem1 === elem2) rawScore += 4;
  if (isZodiacCompatible) rawScore += 6;
  rawScore += mbtiDelta;

  // Subtractions (Negative Clashes)
  if (isDayClash) rawScore -= 26; // Day clash directly drops score
  if (isYearClash) rawScore -= 14;
  if (isWonjin) rawScore -= 22;   // Wonjin creates emotional friction
  if (isSajuElementClash) rawScore -= 14;
  if (isZodiacClash) rawScore -= 6;

  // Deterministic micro jitter: -4 to +4 based on names/ids
  const jitter = (getDeterministicHash(m1Id, m2Id, 77) % 9) - 4;
  rawScore += jitter;

  // Clamping strictly according to guidelines:
  // - Worst clash: 18 ~ 38 (Under 40!)
  // - General/average: 42 ~ 64 (Typical 40-60!)
  // - Good/SR: 68 ~ 86
  // - Elite/SSR/UR: 90 ~ 98 (Strictly conservative, requires multiple harmonies!)
  let finalScore = Math.max(16, Math.min(98, rawScore));

  // If severe clash exists (Day Clash or Wonjin), force under 40
  if ((isDayClash || isWonjin) && finalScore > 39) {
    finalScore = 32 + (getDeterministicHash(m1Id, m2Id, 13) % 7);
  }

  // If no major harmony exists, strictly keep it below 90
  if (!isStemHarmony && !isDaySixHarmony && !isDayTripleHarmony && finalScore >= 90) {
    finalScore = 78 + (getDeterministicHash(m1Id, m2Id, 21) % 8);
  }

  // Asymmetric Sub Scores
  let sajuScore1to2 = finalScore;
  let sajuScore2to1 = finalScore;
  if (isGen1to2) {
    sajuScore1to2 = Math.min(98, finalScore + 5);
    sajuScore2to1 = Math.max(15, finalScore - 4);
  } else if (isGen2to1) {
    sajuScore1to2 = Math.max(15, finalScore - 4);
    sajuScore2to1 = Math.min(98, finalScore + 5);
  }

  let zodiacScore1to2 = isZodiacCompatible ? Math.min(98, finalScore + 8) : isZodiacClash ? Math.max(15, finalScore - 8) : finalScore;
  let zodiacScore2to1 = zodiacScore1to2;

  let mbtiScore1to2 = Math.max(20, Math.min(98, finalScore + mbtiDelta * 2));
  let mbtiScore2to1 = mbtiScore1to2;

  let ziweiScore1to2 = Math.max(25, Math.min(95, finalScore + ((getDeterministicHash(m1Id, m2Id, 33) % 11) - 5)));
  let ziweiScore2to1 = Math.max(25, Math.min(95, finalScore + ((getDeterministicHash(m1Id, m2Id, 44) % 11) - 5)));

  // 📝 WITTY, RELATABLE, DOPAMINE-PACKED LABELS & DESCRIPTIONS
  let finalLabel = "";
  let finalDesc = "";

  if (finalScore >= 90) {
    // UR / SSR (90점 이상)
    const labels = [
      "우주가 점찍은 찐친·소울메이트",
      "말 안 해도 눈빛으로 통하는 갓벽 조합",
      "만났다 하면 시간 순삭되는 찰떡 콤비",
      "전생에 나라를 구한 레전드 인연",
    ];
    finalLabel = labels[getDeterministicHash(m1Id, m2Id, 1) % labels.length];

    const descs = [
      `둘이 붙어만 있어도 웃음보 터지고 대화가 끊이지 않는 최상급 케미입니다! 서로 다른 성향마저 신기할 정도로 보완되어, 굳이 꾸며내지 않고 본래 모습 그대로 있어도 마음이 한없이 편안한 영혼의 단짝입니다.`,
      `사주의 기운이 착착 감기듯 맞물려 함께할 때 운과 에너지가 두 배로 불어나는 조합입니다. 서로에게 깊은 긍정적 자극을 주며, 무슨 일을 벌이든 척하면 척 손발이 맞는 환상의 파트너입니다.`,
      `생각의 주파수가 너무 잘 맞아 사소한 눈짓이나 단어 하나만으로도 의도를 꿰뚫어 봅니다. 힘든 날에도 얼굴만 보면 기분이 사르르 풀리는, 살면서 몇 번 만나기 힘든 소중한 인연입니다.`,
    ];
    finalDesc = descs[getDeterministicHash(m1Id, m2Id, 2) % descs.length];
  } else if (finalScore >= 75) {
    // SR (75 ~ 89점)
    const labels = [
      "티키타카 척척 맞는 꿀잼 듀오",
      "텐션 폭발하는 환상의 콤비플레이",
      "서로에게 든든한 최고의 페이스메이커",
      "웃음 코드가 똑 닮은 찰떡 케미",
    ];
    finalLabel = labels[getDeterministicHash(m1Id, m2Id, 3) % labels.length];

    const descs = [
      `한 사람이 드립을 던지면 다른 한 사람이 찰떡같이 받아치는 유쾌한 티키타카가 일품입니다! 같이 있으면 텐션이 훅 올라가고 긍정적인 에너지를 주고받는 든든한 꿀조합입니다.`,
      `서로의 장점을 기분 좋게 인정해주고 북돋아 줄 줄 아는 사이입니다. 대화를 나눌수록 유쾌한 영감이 샘솟으며, 함께 모임이나 프로젝트를 진행할 때 시너지가 배가됩니다.`,
      `호흡이 안정적이고 대화가 막힘없이 이어집니다. 가끔 사소한 이견이 생겨도 웃으며 쿨하게 조율해낼 수 있는 건강하고 성숙한 호감 조합입니다.`,
    ];
    finalDesc = descs[getDeterministicHash(m1Id, m2Id, 4) % descs.length];
  } else if (finalScore >= 60) {
    // S (60 ~ 74점)
    const labels = [
      "은근히 마음 편한 힐링 조합",
      "잔잔하고 부담 없는 안정적 인연",
      "서로의 영역을 지켜주는 든든한 친구",
      "오래 봐도 질리지 않는 담백한 사이",
    ];
    finalLabel = labels[getDeterministicHash(m1Id, m2Id, 5) % labels.length];

    const descs = [
      `불꽃처럼 격렬하진 않아도 묘하게 마음이 차분해지고 편안한 관계입니다. 서로 지나치게 간섭하지 않으면서도 필요할 때 곁에서 힘이 되어주는 담백하고 오래가는 궁합입니다.`,
      `서로의 고유한 개성을 있는 그대로 존중해주는 쿨하고 성숙한 사이입니다. 굳이 매일 연락하지 않아도 오랜만에 만났을 때 어제 본 것처럼 편안함을 유지합니다.`,
      `취향과 속도가 비슷해 함께 있을 때 피로감이 전혀 없습니다. 서로의 경계를 침범하지 않고 알맞은 보폭으로 길게 동행할 수 있는 안정적인 조합입니다.`,
    ];
    finalDesc = descs[getDeterministicHash(m1Id, m2Id, 6) % descs.length];
  } else if (finalScore >= 45) {
    // R (45 ~ 59점 - 일반적인 경우)
    const labels = [
      "코드가 맞을 땐 빵 터지는 현실 케미",
      "적당한 거리두기가 보약인 인연",
      "밀당과 조율이 필요한 보통 사이",
      "가끔씩 정적 흐르는 알쏭달쏭 조합",
    ];
    finalLabel = labels[getDeterministicHash(m1Id, m2Id, 7) % labels.length];

    const descs = [
      `공통 관심사가 있을 때는 세상 재밌게 떠들다가도, 관점이 부딪히면 묘한 어색함이 흐르기도 합니다. 서로의 방식을 강요하지 않고 쿨하게 인정해줄 때 가장 편안하게 유지되는 현실적인 인연입니다.`,
      `살아온 방식이나 생각의 결이 꽤 달라 가끔씩 물음표가 뜨는 관계입니다. 하지만 편견 없이 대화를 나누면 나와 전혀 다른 신선한 시야를 선물받을 수 있습니다.`,
      `너무 바짝 붙어있기보다는 적당한 거리를 두고 만날 때 가장 유쾌합니다. 서로의 다름을 '틀림'이 아니라 '개성'으로 받아들이는 센스가 필요합니다.`,
    ];
    finalDesc = descs[getDeterministicHash(m1Id, m2Id, 8) % descs.length];
  } else if (finalScore >= 35) {
    // N (35 ~ 44점)
    const labels = [
      "다른 행성에서 온 외계인 조합",
      "자존심 대결 금지! 양보가 필수인 사이",
      "서로 다른 언어로 말하는 두 사람",
      "말조심 필수! 아슬아슬 줄타기 케미",
    ];
    finalLabel = labels[getDeterministicHash(m1Id, m2Id, 9) % labels.length];

    const descs = [
      `세상을 바라보는 렌즈 자체가 완전히 상반되어 사소한 말투에도 오해가 생기기 쉽습니다. '쟤는 왜 저러지?' 대신 '저렇게 생각할 수도 있구나' 하고 한 템포 쉬어가는 여유가 절대적으로 필요합니다.`,
      `둘 다 자기만의 주관과 고집이 뚜렷해 한 번 의견이 갈리면 팽팽한 줄다리기가 이어집니다. 이기려 들기보다 먼저 웃으며 한 발 물러서는 사람이 진짜 위너입니다.`,
      `기질상 맞추려면 꽤 많은 에너지와 인내심이 요구됩니다. 공적인 거리감을 유지하거나 중간에서 분위기를 풀어줄 중재자가 있을 때 훨씬 편안합니다.`,
    ];
    finalDesc = descs[getDeterministicHash(m1Id, m2Id, 10) % descs.length];
  } else {
    // D (35점 미만 - 최악의 악연/상충)
    const labels = [
      "스치기만 해도 스파크! 일촉즉발 폭탄",
      "단둘이 있으면 기빨리는 애증의 관계",
      "파국 주의! 팽팽한 살기와 충돌 기류",
      "물과 기름! 절대 안 섞이는 상극 조합",
    ];
    finalLabel = labels[getDeterministicHash(m1Id, m2Id, 11) % labels.length];

    const descs = [
      `물과 기름처럼 기운이 정면으로 부딪히는 불꽃 튀는 상충 기류입니다! 둘이 단둘이 오래 있으면 사소한 불씨 하나로도 감정 소모가 극심해지니, 반드시 여럿이 함께 어울리거나 철저한 안전거리를 유지해야 합니다.`,
      `성향, 가치관, 표현법까지 모든 게 극과 극입니다. 서로를 바꾸려고 들면 파국으로 치닫기 십상이니, '우린 완전히 다른 사람이다'를 인정하고 쿨하게 선을 지키는 게 상책입니다.`,
      `자존심을 건드리는 순간 걷잡을 수 없이 삐걱거리는 살기(殺氣)가 서려 있습니다. 깊은 감정적 기대보다는 담백하고 깍듯한 예의를 갖추는 것이 서로의 평화를 지키는 지름길입니다.`,
    ];
    finalDesc = descs[getDeterministicHash(m1Id, m2Id, 12) % descs.length];
  }

  // 💬 REALISTIC SUB-ANALYSIS DESCRIPTIONS
  // Saju Description
  let sajuDesc = "";
  if (isStemHarmony || isDaySixHarmony) {
    sajuDesc = `${m1.nickname}님과 ${m2.nickname}님의 사주에 끈끈한 '합(合)'의 기운이 깃들어 있습니다. 첫인상부터 묘한 친밀감이 느껴지고, 함께 있을 때 심리적 안정감과 긍정적인 운의 상승을 체감할 수 있는 찰떡 사주 궁합입니다.`;
  } else if (isDayClash) {
    sajuDesc = `${m1.nickname}님과 ${m2.nickname}님의 일지(자리)가 정면으로 부딪히는 '상충(相沖)' 기류입니다. 성격과 생활 패턴이 정반대라 단둘이 오래 있으면 사소한 일로 자존심 싸움이 일어나기 쉬우니, 깍듯한 매너와 거리두기가 필수입니다.`;
  } else if (isWonjin) {
    sajuDesc = `${m1.nickname}님과 ${m2.nickname}님 사이에 묘하게 서운함이 싹트는 '원진(怨嗔)'의 기운이 감돕니다. 별일 아닌 일에도 오해가 생기기 쉬우니, 마음에 담아두지 말고 솔직하게 대화로 푸는 습관이 필요합니다.`;
  } else if (isGen1to2) {
    sajuDesc = `${m1.nickname}님의 기운이 ${m2.nickname}님을 부드럽게 생(生)해주는 흐름입니다. ${m1.nickname}님이 챙겨주고 이끌어줄 때 ${m2.nickname}님이 큰 힘을 얻으며 성과로 이어지는 생산적인 조력 관계입니다.`;
  } else if (isGen2to1) {
    sajuDesc = `${m2.nickname}님의 포근한 기운이 ${m1.nickname}님을 든든하게 받쳐주는 흐름입니다. ${m1.nickname}님이 지치거나 흔들릴 때 ${m2.nickname}님과의 대화에서 큰 위로와 용기를 얻는 훈훈한 관계입니다.`;
  } else if (elem1 === elem2) {
    sajuDesc = `두 분 모두 '${elem1}'의 동일한 오행 기운을 지녀 거울을 보듯 성향이 닮아 있습니다. 서로의 행동 패턴을 쉽게 예측할 수 있어 편안하지만, 고집을 부릴 땐 누구 하나 꺾지 않으므로 주의가 필요합니다.`;
  } else {
    sajuDesc = `사주 원소가 부딪히지 않고 평온하게 흐르는 무난한 오행 구성입니다. 큰 굴곡 없이 편안하게 서로를 알아가며 잔잔한 신뢰를 쌓아갈 수 있는 자연스러운 인연입니다.`;
  }

  // Zodiac Description
  let zodiacDesc = "";
  if (isZodiacCompatible) {
    zodiacDesc = `${z1.name}(${ze1})과 ${z2.name}(${ze2})의 별자리 원소가 조화롭게 화합합니다. 대화할 때 리듬감이 잘 맞고 서로의 감정 상태를 금방 눈치채는 유쾌한 별자리 케미입니다.`;
  } else if (isZodiacClash) {
    zodiacDesc = `${z1.name}(${ze1})과 ${z2.name}(${ze2})의 상반된 성좌 기질이 부딪혀 팽팽한 긴장감이 형성됩니다. 서로 다른 관점이 신선한 자극이 되기도 하지만 피로감을 줄 수도 있습니다.`;
  } else {
    zodiacDesc = `${z1.name}와 ${z2.name}의 독특한 개성이 공존합니다. 서로 강요하지 않고 서로의 라이프스타일을 존중해줄 때 유쾌하고 신선한 대화를 나눌 수 있습니다.`;
  }

  // Ziwei Description
  const ziweiStars = [
    { name: "자미성", desc: "중심을 잡는 리더십" },
    { name: "칠살성", desc: "거침없는 결단력과 추진력" },
    { name: "천부성", desc: "너그럽고 풍요로운 포용력" },
    { name: "태양성", desc: "시원시원하고 솔직한 열정" },
    { name: "무곡성", desc: "신용과 약속을 중시하는 뚝심" },
    { name: "천동성", desc: "해맑고 순수한 낙천성" },
  ];
  const sIdx1 = getDeterministicHash(m1Id, m2Id, 17) % ziweiStars.length;
  const sIdx2 = getDeterministicHash(m1Id, m2Id, 29) % ziweiStars.length;
  const ziweiDesc = `${m1.nickname}님의 ${ziweiStars[sIdx1].name}(${ziweiStars[sIdx1].desc})과 ${m2.nickname}님의 ${ziweiStars[sIdx2].name}(${ziweiStars[sIdx2].desc})이 만나, 각자의 재능을 침범하지 않고 밸런스를 맞추는 구조를 형성합니다.`;

  // MBTI Description
  let mbtiDesc = "";
  if (isMbti1Ok && isMbti2Ok) {
    let diffs = [];
    if (code1[0] !== code2[0]) diffs.push("외향(E)과 내향(I)의 밸런스");
    if (code1[1] !== code2[1]) diffs.push("현실감각(S)과 직관상상(N)의 교차");
    if (code1[2] !== code2[2]) diffs.push("논리적 팩트(T)와 따뜻한 공감(F)");
    if (code1[3] !== code2[3]) diffs.push("계획적인 준비(J)와 즉흥적 유연성(P)");

    if (diffs.length === 0) {
      mbtiDesc = `두 분 모두 ${code1}로 성향이 완벽히 일치합니다! 생각하는 회로와 의사결정 방식이 똑같아 '내 맘을 나보다 더 잘 아는 사람'처럼 소름 돋게 통합니다.`;
    } else {
      mbtiDesc = `${code1}와 ${code2} 성향의 만남으로, ${diffs.slice(0, 2).join(", ")}에서 오는 현실적인 케미가 돋보입니다. 서로의 부족한 부분을 보완해주는 실전형 조합입니다.`;
    }
  } else {
    mbtiDesc = `성향 지표(MBTI) 대신 정통 사주 명식과 별자리 데이터를 중심으로 현실적인 기질 궁합을 분석했습니다.`;
  }

  const gradeInfo = getGradeFromScore(finalScore);

  return {
    member_id_1: m1Id,
    member_id_2: m2Id,
    score: finalScore,
    totalScore: finalScore, // Backward compatibility alias
    grade: gradeInfo.grade,
    label: finalLabel,
    description: finalDesc,
    saju: {
      score_1_to_2: sajuScore1to2,
      score_2_to_1: sajuScore2to1,
      description: sajuDesc,
    },
    ziwei: {
      score_1_to_2: ziweiScore1to2,
      score_2_to_1: ziweiScore2to1,
      description: ziweiDesc,
    },
    mbti: {
      score_1_to_2: mbtiScore1to2,
      score_2_to_1: mbtiScore2to1,
      description: mbtiDesc,
    },
    zodiac: {
      score_1_to_2: zodiacScore1to2,
      score_2_to_1: zodiacScore2to1,
      description: zodiacDesc,
    },
  };
}

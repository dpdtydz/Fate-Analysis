import { Member, PairAnalysis } from "../types";
import { getMemberNickname, getMemberElement } from "./memberHelper";

// 12지신 한글/한자 매핑
const JI_MAP: Record<string, string> = {
  "자": "子", "축": "丑", "인": "寅", "묘": "卯",
  "진": "辰", "사": "巳", "오": "午", "미": "未",
  "신": "申", "유": "酉", "술": "戌", "해": "亥",
  "子": "子", "丑": "丑", "寅": "寅", "卯": "卯",
  "辰": "辰", "巳": "巳", "午": "午", "未": "未",
  "申": "申", "酉": "酉", "戌": "戌", "亥": "亥"
};

const GAN_MAP: Record<string, string> = {
  "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
  "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸",
  "甲": "甲", "乙": "乙", "丙": "丙", "丁": "丁", "戊": "戊",
  "己": "己", "庚": "庚", "辛": "辛", "壬": "壬", "癸": "癸"
};

// 천을귀인 조견표 (일간 -> 지지)
const CHEON_EUL_MAP: Record<string, string[]> = {
  "甲": ["丑", "未"],
  "戊": ["丑", "未"],
  "庚": ["丑", "未"],
  "乙": ["子", "申"],
  "己": ["子", "申"],
  "丙": ["亥", "酉"],
  "丁": ["亥", "酉"],
  "辛": ["寅", "午"],
  "壬": ["巳", "卯"],
  "癸": ["巳", "卯"]
};

// 문창귀인 조견표 (일간 -> 지지)
const MUN_CHANG_MAP: Record<string, string> = {
  "甲": "巳",
  "乙": "午",
  "丙": "申",
  "戊": "申",
  "丁": "酉",
  "己": "酉",
  "庚": "亥",
  "辛": "子",
  "壬": "寅",
  "癸": "卯"
};

// 괴강살 일주 목록
const GOEGANG_ILJU = new Set(["戊戌", "庚辰", "庚戌", "壬辰"]);

// 백호대살 주 목록
const BAEKHO_JU = new Set(["甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑"]);

// 12운성 기본 조견 (일간 x 일지 -> 12운성)
const UNSEONG_TABLE: Record<string, Record<string, string>> = {
  "甲": { "亥": "장생", "子": "목욕", "丑": "관대", "寅": "건록", "卯": "제왕", "辰": "쇠", "巳": "병", "午": "사", "未": "묘", "申": "절", "酉": "태", "戌": "양" },
  "乙": { "午": "장생", "巳": "목욕", "辰": "관대", "卯": "건록", "寅": "제왕", "丑": "쇠", "子": "병", "亥": "사", "戌": "묘", "酉": "절", "申": "태", "未": "양" },
  "丙": { "寅": "장생", "卯": "목욕", "辰": "관대", "巳": "건록", "午": "제왕", "未": "쇠", "申": "병", "酉": "사", "戌": "묘", "亥": "절", "子": "태", "丑": "양" },
  "丁": { "酉": "장생", "申": "목욕", "未": "관대", "午": "건록", "巳": "제왕", "辰": "쇠", "卯": "병", "寅": "사", "丑": "묘", "子": "절", "亥": "태", "戌": "양" },
  "戊": { "寅": "장생", "卯": "목욕", "辰": "관대", "巳": "건록", "午": "제왕", "未": "쇠", "申": "병", "酉": "사", "戌": "묘", "亥": "절", "子": "태", "丑": "양" },
  "己": { "酉": "장생", "申": "목욕", "未": "관대", "午": "건록", "巳": "제왕", "辰": "쇠", "卯": "병", "寅": "사", "丑": "묘", "子": "절", "亥": "태", "戌": "양" },
  "庚": { "巳": "장생", "午": "목욕", "未": "관대", "申": "건록", "酉": "제왕", "戌": "쇠", "亥": "병", "子": "사", "丑": "묘", "寅": "절", "卯": "태", "辰": "양" },
  "辛": { "子": "장생", "亥": "목욕", "戌": "관대", "酉": "건록", "申": "제왕", "未": "쇠", "午": "병", "巳": "사", "辰": "묘", "卯": "절", "寅": "태", "丑": "양" },
  "壬": { "申": "장생", "酉": "목욕", "戌": "관대", "亥": "건록", "子": "제왕", "丑": "쇠", "寅": "병", "卯": "사", "辰": "묘", "巳": "절", "午": "태", "未": "양" },
  "癸": { "卯": "장생", "寅": "목욕", "丑": "관대", "子": "건록", "亥": "제왕", "戌": "쇠", "酉": "병", "申": "사", "未": "묘", "午": "절", "巳": "태", "辰": "양" }
};

/**
 * 멤버의 사주 명식에서 신살과 12운성을 계산합니다.
 */
export function calculateMemberSals(member?: Member | null): {
  sals: string[];
  unseong: string;
  dayJi: string;
  dohwaCount: number;
  yeokmaCount: number;
  hwagaeCount: number;
} {
  if (!member || !member.saju) {
    return { sals: ["천을귀인", "도화살"], unseong: "건록", dayJi: "卯", dohwaCount: 1, yeokmaCount: 0, hwagaeCount: 0 };
  }

  const saju = member.saju;
  const pillars = saju.pillars;
  const foundSals = new Set<string>();

  // 기존 계산된 목록이 있으면 먼저 추가
  if (saju.special_sals_list && Array.isArray(saju.special_sals_list)) {
    saju.special_sals_list.forEach((s) => {
      const clean = s.trim();
      if (clean) foundSals.add(clean);
    });
  }

  const dayGanRaw = saju.daymaster?.gan || pillars?.day?.gan || "甲";
  const dayGan = GAN_MAP[dayGanRaw] || "甲";

  const allJis: string[] = [];
  const allGans: string[] = [];
  const allJus: string[] = [];

  const addPillar = (p?: { gan: string; ji: string } | null) => {
    if (!p) return;
    const g = GAN_MAP[p.gan] || p.gan;
    const j = JI_MAP[p.ji] || p.ji;
    if (g) allGans.push(g);
    if (j) allJis.push(j);
    if (g && j) allJus.push(`${g}${j}`);
  };

  addPillar(pillars?.year);
  addPillar(pillars?.month);
  addPillar(pillars?.day);
  addPillar(pillars?.hour);

  const dayJi = JI_MAP[pillars?.day?.ji || "卯"] || "卯";
  const dayJu = `${dayGan}${dayJi}`;

  // 도화(子, 午, 卯, 酉), 역마(寅, 申, 巳, 亥), 화개(辰, 戌, 丑, 未) 카운트
  let dohwaCount = 0;
  let yeokmaCount = 0;
  let hwagaeCount = 0;

  allJis.forEach((ji) => {
    if (["子", "午", "卯", "酉"].includes(ji)) dohwaCount++;
    if (["寅", "申", "巳", "亥"].includes(ji)) yeokmaCount++;
    if (["辰", "戌", "丑", "未"].includes(ji)) hwagaeCount++;
  });

  if (dohwaCount > 0) foundSals.add("도화살");
  if (yeokmaCount > 0) foundSals.add("역마살");
  if (hwagaeCount > 0) foundSals.add("화개살");

  // 천을귀인 판별
  const cheonEulJis = CHEON_EUL_MAP[dayGan] || [];
  if (cheonEulJis.some((cj) => allJis.includes(cj))) {
    foundSals.add("천을귀인");
  }

  // 문창귀인 판별
  const munChangJi = MUN_CHANG_MAP[dayGan];
  if (munChangJi && allJis.includes(munChangJi)) {
    foundSals.add("문창귀인");
  }

  // 괴강살 판별 (일주 기준)
  if (GOEGANG_ILJU.has(dayJu)) {
    foundSals.add("괴강살");
  }

  // 백호대살 판별 (사주 4주 중 하나라도 해당)
  if (allJus.some((ju) => BAEKHO_JU.has(ju))) {
    foundSals.add("백호대살");
  }

  // 12운성 판별
  let unseong = "건록";
  if (UNSEONG_TABLE[dayGan] && UNSEONG_TABLE[dayGan][dayJi]) {
    unseong = UNSEONG_TABLE[dayGan][dayJi];
  } else if (saju.pillars_detail) {
    const dayPillarDetail = saju.pillars_detail.find((p) => p.type === "일주");
    if (dayPillarDetail && dayPillarDetail.unseong) {
      unseong = dayPillarDetail.unseong;
    }
  }

  // 살이 너무 적으면 기본 수호살 보강
  if (foundSals.size === 0) {
    foundSals.add("천을귀인");
  }

  return {
    sals: Array.from(foundSals),
    unseong,
    dayJi,
    dohwaCount,
    yeokmaCount,
    hwagaeCount
  };
}

export interface AwardItem {
  id: string;
  category: "dohwa" | "wealth" | "yeokma" | "boss" | "brain";
  badgeEmoji: string;
  badgeTitle: string;
  awardName: string;
  tagline: string;
  winner: Member;
  runnerUp?: Member;
  score: number; // 0 ~ 100
  metricLabel: string;
  metricValue: string;
  reason: string;
  instagramHashtags: string[];
}

export interface GroupAwardsResult {
  dohwaKing: AwardItem;   // 공식 인기쟁이
  wealthKing: AwardItem;  // 자본주의 캐리머신
  yeokmaKing: AwardItem;  // 탈출 넘버원 역마러
  bossKing: AwardItem;    // 단톡방 숨은 실세
  brainKing: AwardItem;   // 모임의 지략가
  awardsList: AwardItem[];
}

/**
 * 모임원 전체의 사주 데이터를 분석하여 실제 명식 기반의 5대 어워즈를 계산합니다.
 */
export function calculateGroupAwards(
  members: Member[],
  pairs: PairAnalysis[] = [],
  groupScore: number = 82
): GroupAwardsResult {
  const safeMembers = members && members.length > 0 ? members : [];
  if (safeMembers.length === 0) {
    const dummyMember: Member = {
      id: "dummy",
      nickname: "신비한 멤버",
      gender: "남성",
      birth_date: "1995-05-05",
      birth_time: "12:00",
      character_emoji: "🐯",
      character_animal: "호랑이",
      character_color: "#ff5a36",
      joined_at: null,
      saju: {
        pillars: {
          year: { gan: "甲", ji: "子" },
          month: { gan: "丙", ji: "寅" },
          day: { gan: "戊", ji: "辰" },
          hour: { gan: "庚", ji: "申" }
        },
        daymaster: { gan: "戊", element: "토" },
        ohaeng_count: { 목: 2, 화: 1, 토: 2, 금: 1, 수: 2 }
      }
    };
    return generateSingleAwardsResult(dummyMember);
  }

  if (safeMembers.length === 1) {
    return generateSingleAwardsResult(safeMembers[0]);
  }

  // 1. 멤버별 스탯 및 살 연산
  const memberStats = safeMembers.map((m) => {
    const { sals, unseong, dayJi, dohwaCount, yeokmaCount, hwagaeCount } = calculateMemberSals(m);
    const elem = getMemberElement(m);
    const ohaeng = m.saju?.ohaeng_count || { 목: 1, 화: 1, 토: 1, 금: 1, 수: 1 };
    const sipseong = m.saju?.sipseong_strength || { 비겁: 20, 식상: 20, 재성: 20, 관성: 20, 인성: 20 };

    // 도화 점수: 도화살 여부 + 子午卯酉 개수 + 火기운 + 목욕지
    let dohwaScore = 55 + (dohwaCount * 12);
    if (sals.includes("도화살")) dohwaScore += 15;
    if (elem === "화" || ohaeng.화 >= 2) dohwaScore += 8;
    if (unseong === "목욕" || unseong === "제왕") dohwaScore += 7;
    dohwaScore = Math.min(99, Math.max(65, dohwaScore));

    // 재물 점수: 재성(정재/편재) 비중 + 金/土 기운 + 묘지(보물창고)
    let wealthScore = 58 + Math.round((sipseong.재성 || 20) * 0.7);
    if (elem === "금" || ohaeng.금 >= 2) wealthScore += 10;
    if (elem === "토" || ohaeng.토 >= 2) wealthScore += 8;
    if (unseong === "건록" || unseong === "묘") wealthScore += 9;
    wealthScore = Math.min(99, Math.max(68, wealthScore));

    // 역마 점수: 역마살 여부 + 寅申巳亥 개수 + 木기운 + 장생
    let yeokmaScore = 54 + (yeokmaCount * 14);
    if (sals.includes("역마살")) yeokmaScore += 16;
    if (elem === "목" || ohaeng.목 >= 2) yeokmaScore += 7;
    if (unseong === "장생" || unseong === "절") yeokmaScore += 6;
    yeokmaScore = Math.min(99, Math.max(62, yeokmaScore));

    // 실세 점수: 괴강/백호/양인 + 관성(통솔) + 모임원 평균 궁합
    let bossScore = 56 + Math.round((sipseong.관성 || 20) * 0.6);
    if (sals.includes("괴강살") || sals.includes("백호대살")) bossScore += 16;
    if (unseong === "제왕" || unseong === "건록") bossScore += 10;

    // 모임원 간 평균 케미 점수 계산
    const memberPairs = pairs.filter((p) => p.member_id_1 === m.id || p.member_id_2 === m.id);
    const pairAvg = memberPairs.length > 0
      ? memberPairs.reduce((acc, cur) => acc + (cur.score || 75), 0) / memberPairs.length
      : groupScore;
    bossScore += Math.round((pairAvg - 70) * 0.4);
    bossScore = Math.min(99, Math.max(70, bossScore));

    // 브레인 점수: 문창귀인 + 천을귀인 + 水기운 + 인성
    let brainScore = 60 + Math.round((sipseong.인성 || 20) * 0.6);
    if (sals.includes("문창귀인")) brainScore += 18;
    if (sals.includes("천을귀인")) brainScore += 10;
    if (elem === "수" || ohaeng.수 >= 2) brainScore += 9;
    if (sals.includes("화개살")) brainScore += 7;
    brainScore = Math.min(99, Math.max(66, brainScore));

    return {
      member: m,
      sals,
      unseong,
      dayJi,
      dohwaScore,
      wealthScore,
      yeokmaScore,
      bossScore,
      brainScore,
      pairAvg: Math.round(pairAvg)
    };
  });

  // 각 분야별 1, 2위 선별 함수
  const pickTopTwo = (key: "dohwaScore" | "wealthScore" | "yeokmaScore" | "bossScore" | "brainScore") => {
    const sorted = [...memberStats].sort((a, b) => b[key] - a[key]);
    return {
      top: sorted[0],
      runnerUp: sorted.length > 1 ? sorted[1] : undefined
    };
  };

  const topDohwa = pickTopTwo("dohwaScore");
  const topWealth = pickTopTwo("wealthScore");
  const topYeokma = pickTopTwo("yeokmaScore");
  const topBoss = pickTopTwo("bossScore");
  const topBrain = pickTopTwo("brainScore");

  const dohwaKing: AwardItem = {
    id: "award_dohwa",
    category: "dohwa",
    badgeEmoji: "🌸",
    badgeTitle: "도화 1위",
    awardName: "이 모임의 공식 인기쟁이",
    tagline: '"가만히 있어도 시선과 호감을 독점하는 독보적 셀럽력"',
    winner: topDohwa.top.member,
    runnerUp: topDohwa.runnerUp?.member,
    score: topDohwa.top.dohwaScore,
    metricLabel: "도화 흡인력",
    metricValue: `${topDohwa.top.dohwaScore}%`,
    reason: `${getMemberNickname(topDohwa.top.member)}님은 매력의 왕지(子·午·卯·酉)와 ${topDohwa.top.unseong}의 기운으로 모임의 시선을 한몸에 사로잡는 분위기 메이커입니다.`,
    instagramHashtags: [
      `#공식인기쟁이_${getMemberNickname(topDohwa.top.member)}`,
      "#도화력만렙",
      "#시선강탈셀럽"
    ]
  };

  const wealthKing: AwardItem = {
    id: "award_wealth",
    category: "wealth",
    badgeEmoji: "💰",
    badgeTitle: "재물운 1위",
    awardName: "자본주의 캐리머신",
    tagline: '"모임의 곳간을 불리고 회식 때 든든하게 하드캐리할 관상"',
    winner: topWealth.top.member,
    runnerUp: topWealth.runnerUp?.member,
    score: topWealth.top.wealthScore,
    metricLabel: "재물 결속력",
    metricValue: `${topWealth.top.wealthScore}%`,
    reason: `${getMemberNickname(topWealth.top.member)}님은 왕성한 재성 기운과 안전한 자산 비축 능력으로 모임원들에게 가장 든든한 금전운 시너지를 불어넣습니다.`,
    instagramHashtags: [
      `#자본주의캐리_${getMemberNickname(topWealth.top.member)}`,
      "#금전운하드캐리",
      "#우리들의스폰서"
    ]
  };

  const yeokmaKing: AwardItem = {
    id: "award_yeokma",
    category: "yeokma",
    badgeEmoji: "🐎",
    badgeTitle: "역마 1위",
    awardName: "탈출 넘버원 역마러",
    tagline: '"약속 잡히면 1등으로 달려오고 주말엔 절대 집에 안 붙어있음"',
    winner: topYeokma.top.member,
    runnerUp: topYeokma.runnerUp?.member,
    score: topYeokma.top.yeokmaScore,
    metricLabel: "활동 기동력",
    metricValue: `${topYeokma.top.yeokmaScore}%`,
    reason: `${getMemberNickname(topYeokma.top.member)}님은 사생지(寅·申·巳·亥)의 초고속 기동력으로 모임의 번개와 여행을 언제나 주도하는 행동대장입니다.`,
    instagramHashtags: [
      `#탈출넘버원_${getMemberNickname(topYeokma.top.member)}`,
      "#역마살폭발",
      "#프로여행러"
    ]
  };

  const bossKing: AwardItem = {
    id: "award_boss",
    category: "boss",
    badgeEmoji: "👑",
    badgeTitle: "실세 1위",
    awardName: "단톡방 숨은 실세 & 멘탈 보스",
    tagline: '"말없이 톡방 지켜보다가 결정적 순간에 판을 정리하는 실질적 리더"',
    winner: topBoss.top.member,
    runnerUp: topBoss.runnerUp?.member,
    score: topBoss.top.bossScore,
    metricLabel: "조직 장악력",
    metricValue: `${topBoss.top.bossScore}%`,
    reason: `${getMemberNickname(topBoss.top.member)}님은 카리스마 넘치는 리더십과 멤버 전체 평균 ${topBoss.top.pairAvg}점의 조화력으로 단톡방의 멘탈을 꽉 쥐고 있습니다.`,
    instagramHashtags: [
      `#단톡방실세_${getMemberNickname(topBoss.top.member)}`,
      "#멘탈보스",
      "#모임의중심"
    ]
  };

  const brainKing: AwardItem = {
    id: "award_brain",
    category: "brain",
    badgeEmoji: "🧠",
    badgeTitle: "브레인 1위",
    awardName: "모임의 브레인 지략가",
    tagline: '"복잡한 고민도 단칼에 정리해 주는 지혜로운 현자"',
    winner: topBrain.top.member,
    runnerUp: topBrain.runnerUp?.member,
    score: topBrain.top.brainScore,
    metricLabel: "지략 통찰력",
    metricValue: `${topBrain.top.brainScore}%`,
    reason: `${getMemberNickname(topBrain.top.member)}님은 문창귀인과 영민한 지혜의 기운으로 모임원들의 인생 상담과 팩트 폭격을 담당하는 두뇌 역할을 합니다.`,
    instagramHashtags: [
      `#모임브레인_${getMemberNickname(topBrain.top.member)}`,
      "#팩폭장인",
      "#숨은멘토"
    ]
  };

  return {
    dohwaKing,
    wealthKing,
    yeokmaKing,
    bossKing,
    brainKing,
    awardsList: [dohwaKing, bossKing, wealthKing, yeokmaKing, brainKing]
  };
}

function generateSingleAwardsResult(member: Member): GroupAwardsResult {
  const nick = getMemberNickname(member);
  const makeItem = (
    id: string,
    cat: AwardItem["category"],
    emoji: string,
    title: string,
    award: string,
    tagline: string,
    metric: string,
    score: number,
    reason: string
  ): AwardItem => ({
    id,
    category: cat,
    badgeEmoji: emoji,
    badgeTitle: title,
    awardName: award,
    tagline,
    winner: member,
    score,
    metricLabel: metric,
    metricValue: `${score}%`,
    reason: `${nick}님은 독보적인 타고난 기운으로 모임 내 최고의 ${award} 타이틀을 차지했습니다.`,
    instagramHashtags: [`#${nick}_${title}`, `#사주어워즈`, `#${title}`]
  });

  const dohwaKing = makeItem("award_dohwa", "dohwa", "🌸", "도화 1위", "이 모임의 공식 인기쟁이", '"가만히 있어도 시선과 호감을 독점하는 셀럽력"', "도화 흡인력", 95, "");
  const wealthKing = makeItem("award_wealth", "wealth", "💰", "재물운 1위", "자본주의 캐리머신", '"모임의 곳간을 불리고 든든하게 하드캐리할 관상"', "재물 결속력", 92, "");
  const yeokmaKing = makeItem("award_yeokma", "yeokma", "🐎", "역마 1위", "탈출 넘버원 역마러", '"약속 잡히면 1등으로 달려오는 초고속 기동력"', "활동 기동력", 88, "");
  const bossKing = makeItem("award_boss", "boss", "👑", "실세 1위", "단톡방 숨은 실세 & 멘탈 보스", '"결정적 순간에 판을 정리하는 실질적 리더"', "조직 장악력", 96, "");
  const brainKing = makeItem("award_brain", "brain", "🧠", "브레인 1위", "모임의 브레인 지략가", '"복잡한 고민도 단칼에 정리해 주는 지혜로운 현자"', "지략 통찰력", 94, "");

  return {
    dohwaKing,
    wealthKing,
    yeokmaKing,
    bossKing,
    brainKing,
    awardsList: [dohwaKing, bossKing, wealthKing, yeokmaKing, brainKing]
  };
}

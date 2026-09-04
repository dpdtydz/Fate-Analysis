import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import GroupNetwork from "./GroupNetwork";
import LoadingOverlay from "./LoadingOverlay";
import { db, getAnonymousUser, auth, checkPremiumStatus, checkProductUnlock, redeemCoupon, getUserMembershipInfo } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, deleteDoc } from "firebase/firestore";
import { Member, Room, CachedAnalysisResult } from "../types";
import { Share2, Heart, ArrowLeft, RefreshCw, Smile, Check, Lock, Ticket } from "lucide-react";
import html2canvas from "html2canvas-pro";
import PremiumPaywall from "./PremiumPaywall";
import GoogleAds from "./GoogleAds";
import { logAnalyticsEvent } from "../lib/analytics";
import ZodiacAvatar, { spaceImageSrc, SPACE_NAMES, calculateSpaceKey, calculateMemberRole } from "./ZodiacAvatar";
import { generateDynamicPairCompatibility, isDummyPair } from "../utils/pairChemistry";
import { backgroundAnalysisManager } from "../utils/backgroundAnalysisManager";

const isMbtiRegistered = (m?: any): boolean => {
  if (!m || !m.mbti) return false;
  const val = String(m.mbti).trim();
  const lower = val.toLowerCase();
  return (
    val !== "" &&
    val !== "null" &&
    lower !== "미입력" &&
    !lower.includes("미입력") &&
    lower !== "미등록" &&
    !lower.includes("미등록") &&
    /^[A-Za-z]{4}$/.test(val)
  );
};

const getDeterministicHashScore = (str1: string, str2: string, seed: number, min = 65, max = 95) => {
  const combined = [str1, str2].sort().join("");
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs((hash + seed) % (max - min + 1)) + min;
};

function generateCustomPrescription(m1: Member, m2: Member, score: number) {
  const m1Id = m1.id || "m1";
  const m2Id = m2.id || "m2";

  // Use a deterministic index to vary descriptions across pairs sharing the same elemental properties
  const variationIndex = getDeterministicHashScore(m1Id, m2Id, 77, 0, 2);

  // 1. Saju Daymaster Gan extraction
  const g1Full = m1.saju?.daymaster?.gan || "무토";
  const g2Full = m2.saju?.daymaster?.gan || "기토";
  const g1 = g1Full[0];
  const g2 = g2Full[0];
  const elem1 = m1.saju?.daymaster?.element || "토";
  const elem2 = m2.saju?.daymaster?.element || "토";

  const GAN_PROPERTIES: Record<string, { name: string; title: string; symbol: string; desc: string }> = {
    "갑": { name: "갑목(甲木)", title: "대림목(大林木)", symbol: "🌲", desc: "곧게 뻗어 오르는 소나무처럼 굽힘 없는 소신과 강한 추진력" },
    "을": { name: "을목(乙木)", title: "회목(𦇊木)", symbol: "🌿", desc: "유연하고 질기게 뻗어 나가는 넝쿨식물처럼 강인한 생명력과 적응력" },
    "병": { name: "병화(丙火)", title: "태양화(太陽火)", symbol: "☀️", desc: "하늘 높이 타오르는 태양처럼 화끈하고 뒤끝 없는 정열과 사교성" },
    "정": { name: "정화(丁火)", title: "등촉화(燈燭火)", symbol: "🕯️", desc: "어둠 속을 포근히 밝히는 등잔불처럼 사려 깊고 섬세한 배려와 헌신" },
    "무": { name: "무토(戊土)", title: "광산토(廣山土)", symbol: "⛰️", desc: "거대한 산맥과 대지처럼 신중하고 듬직하게 중심을 지키는 포용성" },
    "기": { name: "기토(己土)", title: "전원토(田園土)", symbol: "🏡", desc: "비옥하고 유연한 전원 흙처럼 부드러운 수용력과 꼼꼼한 관리능력" },
    "경": { name: "경금(庚金)", title: "원광금(原鑛金)", symbol: "⚔️", desc: "단단하고 굳센 무쇠처럼 선악 구분이 뚜렷하고 신뢰가 깊은 뚝심" },
    "신": { name: "신금(辛金)", title: "주옥금(珠玉金)", symbol: "💎", desc: "섬세하고 예리하게 세공된 보석처럼 정확하고 냉철하며 세련된 미감" },
    "임": { name: "임수(壬水)", title: "대해수(大海水)", symbol: "🌊", desc: "끝없이 넘실거리는 큰 바다처럼 지혜롭고 깊이 있는 수용과 임기응변" },
    "계": { name: "계수(癸水)", title: "우로수(雨露水)", symbol: "☔", desc: "만물을 촉촉이 적시는 봄비처럼 총명하고 다정하며 디테일에 강한 직관" }
  };

  const gp1 = GAN_PROPERTIES[g1] || { name: `${g1}토`, title: "토(土) 기운", symbol: "☯", desc: "듬직한 흙 기운" };
  const gp2 = GAN_PROPERTIES[g2] || { name: `${g2}토`, title: "토(土) 기운", symbol: "☯", desc: "듬직한 흙 기운" };

  let sajuTitle = "";
  let sajuDesc = "";
  let sajuRemedy = "";

  // Saju Relations computation: Grounded in authentic Myeongri Tong-gwan (通關) & realistic interpersonal psychology
  if ((elem1 === "금" && elem2 === "목") || (elem1 === "목" && elem2 === "금")) {
    sajuTitle = "금목상쟁(金木相爭) - 명확한 기준과 진취적 성장의 조율";
    const descOptions = [
      `${m1.nickname}님의 냉철하고 명확한 기준(${gp1.name})과 ${m2.nickname}님의 진취적인 기획력(${gp2.name})이 만났습니다. 한쪽은 현실적인 실현 가능성과 완성도를 중시하고, 다른 한쪽은 새로운 가능성과 확장을 우선하기에 피드백을 주고받는 과정에서 기준 충돌이 발생하기 쉽습니다.`,
      `${m1.nickname}님의 꼼꼼한 현실 감각과 원칙(${gp1.name})이 ${m2.nickname}님의 유연한 발상과 도전 정신(${gp2.name})과 부딪힐 수 있습니다. 서로의 관점이 다르다 보니, 상대방의 발전적 조언이 지나치게 비판적이거나 간섭으로 느껴질 수 있는 구조입니다.`,
      `${m1.nickname}님의 빈틈없는 분석력(${gp1.name})과 ${m2.nickname}님의 주도적인 실행력(${gp2.name})이 팽팽한 균형을 이룹니다. 의사결정의 속도와 우선순위가 달라, 의도치 않게 서로의 의욕을 꺾거나 서운함을 남길 수 있습니다.`
    ];
    const remedyOptions = [
      `[수(水) 기운 통관 처방: 맥락 경청법] 금(金)의 예리함과 목(木)의 추진력을 잇는 핵심은 수(水), 즉 '깊은 경청과 수용'입니다. 피드백을 전달하기 전에 상대방의 기획 의도와 고민을 5분간 먼저 온전히 들은 뒤 보완점을 제시하면, 서로를 가장 강력하게 보완해 주는 최고의 파트너가 됩니다.`,
      `[수(水) 기운 통관 처방: 공감 후 대안 제시] 결론을 먼저 재단하기보다 상대의 아이디어가 가진 강점을 먼저 인정한 후 현실적 디테일을 조율해 보세요. '지적'이 아닌 '협력적 다듬기'로 프레임을 전환할 때 놀라운 시너지가 발휘됩니다.`,
      `[수(水) 기운 통관 처방: 사전 질문 중심 소통] 단정적인 조언 대신 "이 방향으로 실행할 때 가장 고민되는 지점은 무엇인가요?"와 같이 질문으로 대화를 열어보세요. 불필요한 자존심 마찰을 사전에 방지할 수 있습니다.`
    ];
    sajuDesc = descOptions[variationIndex];
    sajuRemedy = remedyOptions[variationIndex];
  } else if ((elem1 === "화" && elem2 === "금") || (elem1 === "금" && elem2 === "화")) {
    sajuTitle = "화극금(火剋金) - 추진 속도와 디테일 완성도의 마찰";
    const descOptions = [
      `${m1.nickname}님의 거침없는 추진력과 열정(${gp1.name})과 ${m2.nickname}님의 신중하고 치밀한 완벽주의(${gp2.name})가 대조를 이룹니다. 일정이나 마감을 조율할 때 한쪽은 빠른 결단을 원하고 다른 한쪽은 충분한 검토를 필요로 하여 속도 차이에 따른 답답함이 생길 수 있습니다.`,
      `${m1.nickname}님의 역동적인 실행 에너지(${gp1.name})가 ${m2.nickname}님의 정교한 원칙(${gp2.name})을 앞서 나가려는 흐름입니다. 서로 주도권을 지키려 할 때 일시적으로 대화가 과열되거나 피로감을 느낄 수 있습니다.`,
      `${m1.nickname}님의 빠른 직관(${gp1.name})과 ${m2.nickname}님의 논리적 검증 스타일(${gp2.name})이 조우합니다. 상대의 신중함이 소극적으로 보이거나, 상대의 적극성이 성급함으로 오해될 소지가 있습니다.`
    ];
    const remedyOptions = [
      `[토(土) 기운 통관 처방: 중간 완충 단계 설정] 불(火)의 뜨거운 열정과 쇠(金)의 냉철함을 융합하려면 토(土), 즉 '안정적인 중간 검토 시간'이 필요합니다. 즉석에서 결론을 내기보다 "초안 검토 후 내일 오후에 최종 확정하자"는 식의 완충 타임라인을 두는 것이 가장 현명합니다.`,
      `[토(土) 기운 통관 처방: 역할 명확화] 추진과 실행의 큰 틀은 화(火) 성향이 이끌고, 리스크 관리와 최종 감수는 금(金) 성향이 맡는 분업 구조를 명확히 세우면 갈등이 곧바로 최적의 협업 엔진으로 바뀝니다.`,
      `[토(土) 기운 통관 처방: 사실 중심의 피드백] 감정적 표현을 배제하고 일정과 객관적인 데이터를 기준으로 소통해 보세요. 불필요한 오해 없이 명쾌하게 합의점에 도달할 수 있습니다.`
    ];
    sajuDesc = descOptions[variationIndex];
    sajuRemedy = remedyOptions[variationIndex];
  } else if ((elem1 === "수" && elem2 === "화") || (elem1 === "화" && elem2 === "수")) {
    sajuTitle = "수화기제(水火旣濟) - 신중한 사색과 열정적 표현의 간극";
    const descOptions = [
      `${m1.nickname}님의 깊이 있는 사색과 신중함(${gp1.name})과 ${m2.nickname}님의 솔직하고 즉각적인 표현력(${gp2.name})이 마주하고 있습니다. 한쪽은 충분히 생각한 뒤 말하길 원하고, 다른 한쪽은 대화 속에서 생각을 정리하길 원하여 감정의 템포가 어긋날 수 있습니다.`,
      `${m1.nickname}님의 차분한 관조적 태도(${gp1.name})와 ${m2.nickname}님의 역동적인 열정(${gp2.name})이 대조를 이룹니다. 서로의 반응 방식을 이해하지 못하면 한쪽은 무관심하다 느끼고, 다른 한쪽은 지나치게 서두른다고 느낄 수 있습니다.`,
      `${m1.nickname}님의 신중한 현실 검토(${gp1.name})가 ${m2.nickname}님의 즉각적인 제안(${gp2.name})에 찬물을 끼얹는 모양새가 되지 않도록 배려가 필요합니다.`
    ];
    const remedyOptions = [
      `[목(木) 기운 통관 처방: 단계적 생각 공유] 수(水)와 화(火)를 잇는 통관은 목(木), 즉 '성장과 과정에 대한 공감'입니다. 즉각적인 찬반을 내놓기보다 "흥미로운 생각인데, 구체적으로 어떤 방식으로 발전시킬 수 있을지 함께 단계별로 짚어보자"는 대화법이 서로의 열정을 유지해 줍니다.`,
      `[목(木) 기운 통관 처방: 반응 시간 인정] 외향적 표현과 내면적 숙고의 차이를 존중해 주세요. 제안을 받은 쪽에게 1~2일 정도 정리할 여유를 주면 훨씬 깊이 있고 완성도 높은 피드백이 돌아옵니다.`,
      `[목(木) 기운 통관 처방: 긍정적 의도 재확인] 의견 차이가 생길 때 "결국 우리는 더 좋은 결과를 만들기 위해 논의하고 있다"는 공통의 목표를 먼저 짚고 시작하세요.`
    ];
    sajuDesc = descOptions[variationIndex];
    sajuRemedy = remedyOptions[variationIndex];
  } else if ((elem1 === "목" && elem2 === "토") || (elem1 === "토" && elem2 === "목")) {
    sajuTitle = "목극토(木剋土) - 새로운 변화와 안정적 체계의 조화";
    const descOptions = [
      `${m1.nickname}님의 새로운 시도와 변화 추진력(${gp1.name})이 ${m2.nickname}님의 안정적인 체계와 원칙(${gp2.name})과 만났습니다. 기존의 틀을 유지하려는 신중함과 새로운 시도를 원하는 진취성이 맞부딪힐 수 있습니다.`,
      `${m1.nickname}님의 확장하려는 의지(${gp1.name})와 ${m2.nickname}님의 기반을 단단히 지키려는 태도(${gp2.name})가 소통에서 긴장을 부를 수 있습니다. 한쪽은 답답함을, 다른 한쪽은 불안정함을 호소할 수 있습니다.`,
      `${m1.nickname}님의 빠른 방향 전환(${gp1.name})과 ${m2.nickname}님의 진중한 속도(${gp2.name})가 마주할 때, 업무와 소통의 리듬을 조율하는 지혜가 요구됩니다.`
    ];
    const remedyOptions = [
      `[화(火) 기운 통관 처방: 인정과 따뜻한 소통] 나무(木)가 흙(土)을 해치지 않고 옥토로 바꾸는 매개는 화(火), 즉 '인정과 예의'입니다. 변화를 제안할 때 상대방이 지금까지 일구어 놓은 체계와 노고를 먼저 진심으로 인정한 뒤 새 제안을 건네보세요.`,
      `[화(火) 기운 통관 처방: 안전장치가 있는 점진적 실험] 전체를 한 번에 바꾸려 하지 말고, "작은 범위에서 1차 테스트를 해본 뒤 효과를 검증하자"는 점진적 제안 방식을 취하면 토(土) 성향도 안심하고 적극 협력합니다.`,
      `[화(火) 기운 통관 처방: 정기적인 감사 표현] 상대방의 묵묵한 서포트와 체계 관리에 대해 구체적인 감사의 말을 자주 전하세요. 신뢰의 토양이 단단해집니다.`
    ];
    sajuDesc = descOptions[variationIndex];
    sajuRemedy = remedyOptions[variationIndex];
  } else if ((elem1 === "토" && elem2 === "수") || (elem1 === "수" && elem2 === "토")) {
    sajuTitle = "토극수(土剋水) - 명확한 가이드라인과 유연한 자율성의 조화";
    const descOptions = [
      `${m1.nickname}님의 명확한 원칙과 경계선 설정(${gp1.name})이 ${m2.nickname}님의 유연하고 다각적인 임기응변(${gp2.name})을 통제하려는 구도가 될 수 있습니다. 한쪽은 엄격한 기준을 원하고 다른 한쪽은 자율성을 선호하여 미묘한 피로감이 생길 수 있습니다.`,
      `${m1.nickname}님의 보수적인 리스크 관리(${gp1.name})가 ${m2.nickname}님의 창의적이고 자율적인 접근(${gp2.name})과 부딪힐 때, 불필요한 감정 소모가 발생할 우려가 있습니다.`,
      `${m1.nickname}님의 체계적인 규정 중심 소통(${gp1.name})과 ${m2.nickname}님의 상황 적응형 소통(${gp2.name})의 차이를 인정하는 배려가 필요합니다.`
    ];
    const remedyOptions = [
      `[금(金) 기운 통관 처방: 명확한 기준과 자율 영역의 분리] 흙(土)과 물(水)의 조화는 금(金), 즉 '명문화된 기준과 상호 신뢰'에서 옵니다. 마감일과 핵심 필수 기준만 명확히 합의하고 세부 실행 방식은 자율에 맡기는 '선(先) 기준 합의, 후(後) 자율 위임' 방식을 도입하세요.`,
      `[금(金) 기운 통관 처방: 텍스트 기반의 명확한 기록] 모호한 구두 약속보다는 핵심 합의 사항을 텍스트나 체크리스트로 정리해 공유하면 서로에 대한 불필요한 의구심이 완전히 해소됩니다.`,
      `[금(金) 기운 통관 처방: 객관적 데이터 중심 논의] 개인적 느낌이 아닌 객관적 지표와 데이터를 기준으로 진행 상황을 점검하세요.`
    ];
    sajuDesc = descOptions[variationIndex];
    sajuRemedy = remedyOptions[variationIndex];
  } else if (elem1 === elem2) {
    sajuTitle = `비겁(比劫) 상조 - 동일한 '${elem1}' 기운이 만들어내는 깊은 공감과 의리`;
    const descOptions = [
      `${m1.nickname}님과 ${m2.nickname}님은 동일한 '${elem1}'의 오행 원소(${gp1.name}와 ${gp2.name})를 지녀, 별도의 긴 설명 없이도 상대방의 생각과 행동 동기를 직관적으로 깊이 이해하는 강한 유대감을 공유합니다.`,
      `${m1.nickname}님과 ${m2.nickname}님은 가치관과 삶의 우선순위가 거울처럼 닮아 있어 편안하고 진솔한 대화를 나누기에 최적의 조건입니다.`,
      `${m1.nickname}님과 ${m2.nickname}님은 서로의 장단점을 본인 일처럼 잘 이해하는 막역한 동지적 관계를 형성합니다.`
    ];
    const remedyOptions = [
      `[상호 존중 수칙: 자존심 대립 예방] 성향이 비슷한 만큼 한 번 의견 대립이 생기면 자존심 싸움으로 번질 수 있습니다. 논쟁이 시작될 조짐이 보이면 즉시 결론을 내리려 하지 말고 한 템포 쉬어가는 유연함이 필요합니다.`,
      `[상호 존중 수칙: 명확한 역할 분담] 같은 영역에서 경쟁하기보다는 각자의 장점을 살릴 수 있도록 역할을 분리하면 시너지가 배가됩니다.`,
      `[상호 존중 수칙: 상호 칭찬과 지지] "역시 당신의 판단이 정확했다"는 식의 지지적 피드백을 자주 나누면 평생의 든든한 아군이 됩니다.`
    ];
    sajuDesc = descOptions[variationIndex];
    sajuRemedy = remedyOptions[variationIndex];
  } else {
    // Check Sangseng
    const order = ["목", "화", "토", "금", "수"];
    const idx1 = order.indexOf(elem1);
    const idx2 = order.indexOf(elem2);
    const isSangseng = (idx1 !== -1 && idx2 !== -1 && (idx1 + 1) % 5 === idx2) || (idx2 !== -1 && idx1 !== -1 && (idx2 + 1) % 5 === idx1);

    if (isSangseng) {
      const giver = (idx1 + 1) % 5 === idx2 ? m1.nickname : m2.nickname;
      const receiver = giver === m1.nickname ? m2.nickname : m1.nickname;
      const gElem = giver === m1.nickname ? elem1 : elem2;
      const rElem = giver === m1.nickname ? elem2 : elem1;
      sajuTitle = `오행 상생(${elem1}생${elem2}) - 자연스러운 에너지 순환과 상호 발전`;
      const descOptions = [
        `${giver}님의 든든한 지원(${gElem} 기운)이 ${receiver}님의 비전과 결실(${rElem} 기운)을 자연스럽게 꽃피우게 돕는 상생의 흐름입니다. 함께 대화할수록 새로운 아이디어가 샘솟고 서로에게 큰 동기부여가 됩니다.`,
        `${giver}님의 따뜻한 격려와 현실적 조력이 ${receiver}님의 잠재력을 이끌어내는 이상적인 조합입니다. 서로에게 든든한 조력자이자 멘토가 되어주는 관계입니다.`,
        `서로의 강점이 상대방의 부족한 부분을 자연스럽게 보완해 주는 축복받은 상생 파트너십입니다.`
      ];
      const remedyOptions = [
        `[상생 유지 수칙: 감사의 명시적 표현] 받는 쪽에서는 상대방의 배려와 조력을 당연하게 여기지 않고, "당신의 도움 덕분에 해낼 수 있었다"는 구체적인 감사를 표현하는 것이 상생의 선순환을 영구히 유지하는 열쇠입니다.`,
        `[상생 유지 수칙: 공동 목표 설정] 함께 달성할 수 있는 프로젝트나 취미를 공유하면 유대감이 더욱 깊어집니다.`,
        `[상생 유지 수칙: 균형 있는 배려] 일방적인 헌신이 되지 않도록 서로 주고받는 배려의 균형을 꾸준히 점검하세요.`
      ];
      sajuDesc = descOptions[variationIndex];
      sajuRemedy = remedyOptions[variationIndex];
    } else {
      sajuTitle = "오행의 온화한 흐름 - 편안하고 자율적인 수평 공존";
      const descOptions = [
        `${m1.nickname}님의 성향(${gp1.name})과 ${m2.nickname}님의 성향(${gp2.name})이 불필요한 마찰 없이 잔잔하고 담백하게 어우러지는 수평적 관계입니다. 서로에게 과도한 기대를 하지 않고 편안한 신뢰를 형성합니다.`,
        `서로의 독립성과 사생활을 온전히 존중해 주는 담백한 인연입니다. 적당한 거리감을 유지하며 오래도록 안정적으로 지속되는 동반자적 관계입니다.`,
        `갈등 요인이 적고 서로에게 편안한 심리적 안식처가 되어주는 무던하고 평화로운 궁합입니다.`
      ];
      const remedyOptions = [
        `[관계 심화 수칙: 공통 관심사 확장] 잔잔한 흐름인 만큼 가끔 새로운 경험이나 취미 활동을 함께하며 대화의 폭을 넓히면 더욱 돈독해집니다.`,
        `[관계 심화 수칙: 정기적인 안부 소통] 부담 없는 가벼운 대화와 일상 공유를 통해 친밀감을 꾸준히 이어가세요.`,
        `[관계 심화 수칙: 상호 경계 존중] 지금처럼 서로의 시간과 공간을 존중해 주는 태도를 유지하는 것이 최상의 관계 유지법입니다.`
      ];
      sajuDesc = descOptions[variationIndex];
      sajuRemedy = remedyOptions[variationIndex];
    }
  }

  // 2. MBTI extraction and analysis
  const hasM1Mbti = isMbtiRegistered(m1);
  const hasM2Mbti = isMbtiRegistered(m2);
  const mbti1 = hasM1Mbti ? m1.mbti!.trim().toUpperCase() : "";
  const mbti2 = hasM2Mbti ? m2.mbti!.trim().toUpperCase() : "";

  const getMbtiConflictAndRemedy = (code1: string, code2: string) => {
    if (!hasM1Mbti || !hasM2Mbti) {
      const unreg: string[] = [];
      if (!hasM1Mbti) unreg.push(m1.nickname);
      if (!hasM2Mbti) unreg.push(m2.nickname);
      return {
        desc: `멤버(${unreg.join(", ")})님이 성향(MBTI) 정보를 등록하지 않아 기초 성향 비교만 제공됩니다. 프로필에서 MBTI를 등록하시면 인지 양식과 갈등 조율법이 상세히 분석됩니다.`,
        remedy: `[MBTI 등록 시 맞춤 분석 제공] 두 분 모두 성향 정보를 등록하시면 행동심리학 관점의 정교한 1:1 대화 조율 비법이 자동으로 연계됩니다.`
      };
    }

    if (code1.length !== 4 || code2.length !== 4) {
      return {
        desc: "두 사람의 성향 프로필이 서로를 향해 열려 있어 부드럽게 대화를 이어가기 좋은 구조입니다.",
        remedy: "서로 다른 소통 템포를 인정하고 경청하는 자세가 상생을 가속화합니다."
      };
    }

    if (code1[2] !== code2[2]) {
      return {
        desc: `한쪽은 객관적 인과관계와 팩트 중심의 이성적 사고형(T)이고, 다른 한쪽은 관계적 화합과 정서적 가치를 중시하는 공감형(F)입니다. 소통할 때 한쪽은 냉철한 피드백에 서운함을 느끼고, 다른 한쪽은 문제 해결보다 감정에 치우친다고 답답해할 수 있습니다.`,
        remedy: `[MBTI 사고(T)-감정(F) 조율법] 사고형(T)은 해결책을 제시하기 전에 "정말 고생 많았다"는 정서적 공감을 한 문장 먼저 건네고, 감정형(F)은 사고형의 피드백을 감정적 비판이 아닌 '과정 개선을 위한 실무적 제안'으로 담백하게 받아들이는 상호 연습이 중요합니다.`
      };
    }

    if (code1[3] !== code2[3]) {
      return {
        desc: `한쪽은 명확한 일정과 결론을 선호하는 체계적 판단형(J)이고, 다른 한쪽은 상황에 따른 자율성과 유연한 대안을 중시하는 인식형(P)입니다. 계획을 세우거나 실행할 때 일정의 엄격성과 융통성 사이에서 마찰이 생길 수 있습니다.`,
        remedy: `[MBTI 판단(J)-인식(P) 조율법] 판단형(J)은 세부 방식까지 통제하려 하지 말고 '최종 마감 기한과 핵심 목표'만 명확히 제시하고, 인식형(P)은 계획 변경이나 지연이 예상될 때 즉시 진행 상황을 투명하게 공유해 주는 소통 에티켓이 필요합니다.`
      };
    }

    if (code1[1] !== code2[1]) {
      return {
        desc: `한쪽은 구체적인 데이터와 과거의 실무 경험을 중시하는 감각형(S)이고, 다른 한쪽은 거시적인 맥락과 새로운 가능성을 중시하는 직관형(N)입니다. 논의 시 한쪽은 현실성이 부족하다고 느끼고, 다른 한쪽은 시야가 좁다고 답답해할 수 있습니다.`,
        remedy: `[MBTI 감각(S)-직관(N) 조율법] 직관형(N)은 아이디어를 제안할 때 '구체적인 1차 실행 방안과 예상 수치'를 덧붙여 설명하고, 감각형(S)은 상대방의 큰 그림과 비전을 먼저 긍정적으로 검토한 뒤 보완점을 논의하는 방식이 효과적입니다.`
      };
    }

    if (code1[0] !== code2[0]) {
      return {
        desc: `한쪽은 활발한 외부 교류를 통해 에너지를 얻는 외향형(E)이고, 다른 한쪽은 차분한 사색과 독립적 시간을 통해 충전하는 내향형(I)입니다. 대화의 빈도와 사교적 활동 범위에서 템포 차이를 느낄 수 있습니다.`,
        remedy: `[MBTI 외향(E)-내향(I) 조율법] 외향형(E)은 상대방이 조용히 생각을 정리할 시간과 공간을 배려해 주고, 내향형(I)은 에너지가 소진되었을 때 "잠시 정리 후 다시 이야기하자"고 미리 신호를 주는 배려가 원만한 관계를 유지해 줍니다.`
      };
    }

    return {
      desc: `두 분은 핵심 심리 기능이 일치하여 상대방의 의도와 행동 패턴을 직관적으로 이해하는 뛰어난 공감대를 형성하고 있습니다.`,
      remedy: `[MBTI 동조화 수칙] 생각이 너무 비슷한 만큼 중요한 결정 시 놓치는 맹점이 없는지 제3자의 시각이나 객관적 데이터를 한 번 더 점검하는 습관이 도움이 됩니다.`
    };
  };

  const mbtiRelation = getMbtiConflictAndRemedy(mbti1, mbti2);

  // 3. Ziwei Dou Shu star selection and relationship description
  const ziweiStars = [
    { name: "자미성", desc: "고귀한 중심을 잡아주는 제왕의 풍모" },
    { name: "천부성", desc: "온화하고 풍요로운 대지의 포용력" },
    { name: "태양성", desc: "어둠을 밝히는 공명정대함과 사교적 열정" },
    { name: "무곡성", desc: "한번 내린 결정을 밀어붙이는 강직한 단호함" },
    { name: "거문성", desc: "어두운 면을 치밀하게 분석하고 논리적으로 조율하는 지혜" },
    { name: "천기성", desc: "영민하게 기획하고 대안을 찾아내는 모사(策士)의 직관" },
    { name: "태음성", desc: "사색적이고 섬세하며 정서적 깊이를 지키는 감수성" },
    { name: "탐랑성", desc: "다재다능하고 사람을 매료시키는 매혹적인 기량" },
    { name: "칠살성", desc: "개척 정신으로 한계를 뛰어넘는 뜨거운 용기" },
    { name: "파군성", desc: "과감한 혁신으로 기존의 틀을 깨는 모험가적 추진력" }
  ];

  const getZStar = (m: any, seedOffset: number) => {
    if (m.saju?.ziwei?.palaces) {
      const palacesObj = m.saju.ziwei.palaces;
      const mingGong = Object.values(palacesObj).find(
        (p: any) => p.name === "命宮" || p.nameKr === "명궁"
      ) as any;
      if (mingGong && mingGong.stars && mingGong.stars.length > 0) {
        const mainStars = mingGong.stars.filter((s: any) => s.type === "main" || s.type === "lucky");
        if (mainStars.length > 0) {
          return { name: mainStars[0].nameKr || mainStars[0].name, desc: "하늘의 은하수 기저 기운" };
        }
      }
    }
    const combinedStr = (m.id || "mem") + seedOffset.toString();
    let charSum = 0;
    for (let i = 0; i < combinedStr.length; i++) {
      charSum += combinedStr.charCodeAt(i);
    }
    const idx = Math.abs(charSum) % ziweiStars.length;
    return ziweiStars[idx];
  };

  const zStar1 = getZStar(m1, 101);
  const zStar2 = getZStar(m2, 202);

  const ziweiDesc = `자미두수 명궁의 주성인 ${zStar1.name}(${zStar1.desc})과 ${zStar2.name}(${zStar2.desc})의 조합은 서로의 전문성과 영역을 상호 존중할 때 가장 큰 결실을 맺는 구조입니다. 일방적인 간섭보다는 각자의 역할과 권한을 명확히 인정해 주는 수평적 에티켓을 지킬 때, 든든한 신뢰와 강력한 동료애가 형성됩니다.`;

  // 4. Western Zodiac analysis and its element pairing
  const zod1 = getWesternZodiac(m1.birth_date);
  const zod2 = getWesternZodiac(m2.birth_date);

  const getZodiacElement = (sign: string) => {
    if (["양자리", "사자자리", "사수자리"].includes(sign)) return "불(火) 원소";
    if (["황소자리", "처녀자리", "염소자리"].includes(sign)) return "흙(土) 원소";
    if (["쌍둥이자리", "천칭자리", "물병자리"].includes(sign)) return "공기(風) 원소";
    if (["게자리", "전갈자리", "물고기자리"].includes(sign)) return "물(水) 원소";
    return "기타 원소";
  };

  const ze1 = getZodiacElement(zod1.name);
  const ze2 = getZodiacElement(zod2.name);

  const getZodiacRelation = (e1: string, e2: string, s1: string, s2: string, vIdx: number) => {
    if (e1 === e2) {
      const descOptions = [
        `동일한 '${e1}'를 공유하고 있어 세상을 바라보는 감성과 가치관의 결이 매우 흡사합니다. ${s1}와 ${s2}의 만남은 긴 설명 없이도 직관적인 공감대를 형성하기에 유리합니다.`,
        `기질적으로 같은 '${e1}'를 지닌 구성으로, 정서적 반응과 일상적 생활관이 자연스럽게 맞아떨어집니다.`,
        `동일한 원소 영역을 바탕으로 하여 깊은 대화 없이도 편안함을 느끼며, 서로에게 좋은 이해자가 되어줄 수 있습니다.`
      ];
      const remedyOptions = [
        `[조화 가이드] 공감대가 높은 만큼 편안함이 자칫 매너리즘으로 흐르지 않도록, 새로운 취미나 대화 주제를 주기적으로 함께 시도해 보세요.`,
        `[조화 가이드] 생각이 닮아 있는 장점을 살려 공동의 목표를 설정하고 협력하면 훨씬 빠르고 일관된 성과를 낼 수 있습니다.`,
        `[조화 가이드] 편안한 분위기 속에서 서로의 생각과 감정을 진솔하게 나누는 정기적인 티타임이 관계를 더욱 풍요롭게 만듭니다.`
      ];
      return { desc: descOptions[vIdx], remedy: remedyOptions[vIdx] };
    }
    if ((e1 === "불(火) 원소" && e2 === "공기(風) 원소") || (e2 === "불(火) 원소" && e1 === "공기(風) 원소")) {
      const descOptions = [
        `열정적인 불 원소(${e1 === "불(火) 원소" ? s1 : s2})와 아이디어를 확산시키는 바람 원소(${e1 === "공기(風) 원소" ? s1 : s2})의 만남입니다. 대화를 나눌수록 생각과 실행의 영감이 빠르게 번져나갑니다.`,
        `행동력(${e1 === "불(火) 원소" ? s1 : s2})과 기획·정보력(${e1 === "공기(風) 원소" ? s1 : s2})이 결합하여 창의적인 시너지를 발휘하는 역동적인 조합입니다.`,
        `서로에게 영감과 추진력을 불어넣어 주는 조화로운 배치로, 새로운 프로젝트나 도전을 함께할 때 큰 힘을 발휘합니다.`
      ];
      const remedyOptions = [
        `[조화 가이드] 아이디어가 넘칠 때 이를 실행 가능한 구체적 계획으로 정리하는 마감 기준을 함께 세우면 이상적인 결실을 맺습니다.`,
        `[조화 가이드] 의견 교환 시 서로의 기발한 발상을 적극적으로 칭찬하고 지지해 주는 태도가 시너지를 극대화합니다.`,
        `[조화 가이드] 추진 속도가 붙을 때 사소한 이견이 생기더라도 차분하게 핵심 목표에 집중하여 조율해 나가세요.`
      ];
      return { desc: descOptions[vIdx], remedy: remedyOptions[vIdx] };
    }
    if ((e1 === "흙(土) 원소" && e2 === "물(水) 원소") || (e2 === "흙(土) 원소" && e1 === "물(水) 원소")) {
      const descOptions = [
        `안정적이고 묵직한 흙 원소(${e1 === "흙(土) 원소" ? s1 : s2})와 감수성이 풍부한 물 원소(${e1 === "물(水) 원소" ? s1 : s2})의 배합입니다. 신뢰의 깊이가 깊고 정서적 안정감이 뛰어납니다.`,
        `성실함(${e1 === "흙(土) 원소" ? s1 : s2})과 따뜻한 포용력(${e1 === "물(水) 원소" ? s1 : s2})이 어우러져 서로에게 든든한 심리적 방파제이자 안식처가 되어주는 관계입니다.`,
        `현실적 지지 기반과 정서적 공감이 조화를 이루어, 시간이 지날수록 서로에 대한 신뢰가 더욱 두터워지는 성숙한 조합입니다.`
      ];
      const remedyOptions = [
        `[조화 가이드] 조용하고 차분한 공간에서 속마음을 터놓고 나누는 시간이 두 사람의 유대감을 한층 견고하게 만듭니다.`,
        `[조화 가이드] 서로의 진심 어린 지지와 격려를 아끼지 않고 표현해 주는 것이 장기적인 신뢰의 바탕이 됩니다.`,
        `[조화 가이드] 일상의 사소한 고민을 나누며 서로의 현실적 해결책과 감정적 위로를 자연스럽게 주고받으세요.`
      ];
      return { desc: descOptions[vIdx], remedy: remedyOptions[vIdx] };
    }
    const descOptions = [
      `서로 다른 기질의 원소(${e1}의 ${s1}와 ${e2}의 ${s2})가 만나 신선한 관점과 배움을 나누는 보완적 조합입니다.`,
      `접근 방식이 달라 처음에는 조율이 필요하지만, 서로가 보지 못하는 사각지대를 보완해 주는 훌륭한 파트너가 될 수 있습니다.`,
      `서로의 다른 시각이 새로운 영감과 균형 감각을 제공하며, 함께할 때 더 넓은 시야를 확보할 수 있습니다.`
    ];
    const remedyOptions = [
      `[조화 가이드] 다름을 틀림으로 보지 않고 "서로 다른 관점이 균형을 잡아준다"는 인식을 바탕으로 유연하게 경청하세요.`,
      `[조화 가이드] 중요한 결정을 내릴 때 각자의 강점을 살려 한쪽은 직관과 가능성을, 다른 한쪽은 현실성을 검토하는 역할 분담을 추천합니다.`,
      `[조화 가이드] 상대방의 독창적인 시각을 존중하고 긍정적인 호기심으로 접근할 때 최고의 협력 관계가 완성됩니다.`
    ];
    return { desc: descOptions[vIdx], remedy: remedyOptions[vIdx] };
  };

  const zodiacRelation = getZodiacRelation(ze1, ze2, zod1.name, zod2.name, variationIndex);

  const isM1MbtiOk = isMbtiRegistered(m1);
  const isM2MbtiOk = isMbtiRegistered(m2);
  const bothMbtiOk = isM1MbtiOk && isM2MbtiOk;

  const mbtiAnalysisText = bothMbtiOk
    ? `\n\n[현대 성향심리 MBTI 분석]\n${mbtiRelation.desc}`
    : `\n\n[현대 성향심리 MBTI 분석]\n일부 또는 전체 멤버가 MBTI 성향 정보를 등록하지 않아, 사주 명식과 동양 천문 주성 조화 분석을 강화하여 인연 처방을 도출하였습니다.`;

  const mbtiRemedyText = bothMbtiOk
    ? `${mbtiRelation.remedy}\n\n`
    : "";

  // Compile final custom prescription
  return {
    clashTitle: sajuTitle,
    clashDesc: `${sajuDesc}${mbtiAnalysisText}\n\n[자미두수 동양천문 국면]\n${ziweiDesc}`,
    remedy1: sajuRemedy,
    remedy2: `${mbtiRemedyText}[서양 점성학 가이드 - ${zod1.name} × ${zod2.name}]\n${zodiacRelation.desc}\n${zodiacRelation.remedy}`
  };
}


function getWesternZodiac(birthStr?: string): { name: string; emoji: string } {
  if (!birthStr) return { name: "알 수 없음", emoji: "⭐" };
  const parts = birthStr.split("-");
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
  if ((month === 10 && day >= 23) || (month === 11 && day <= 22)) return { name: "전갈자리", emoji: "♏" };
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return { name: "사수자리", emoji: "♐" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "염소자리", emoji: "♑" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "물병자리", emoji: "♒" };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: "물고기자리", emoji: "♓" };

  return { name: "알 수 없음", emoji: "⭐" };
}

interface GroupViewProps {
  code: string;
}

// Module-level global memory cache for GroupView to prevent recurring full-screen loading on tab switching
const groupViewCache: Record<string, {
  room: Room | null;
  members: Member[];
  rawAnalysisDoc: any;
  hasLoadedOnce: boolean;
}> = {};

export default function GroupView({ code }: GroupViewProps) {
  const [room, setRoom] = useState<Room | null>(() => {
    return groupViewCache[code]?.room || null;
  });
  const [members, setMembers] = useState<Member[]>(() => {
    return groupViewCache[code]?.members || [];
  });
  const [analysis, setAnalysis] = useState<CachedAnalysisResult | null>(null);
  const [pageLoading, setPageLoading] = useState(() => {
    return !groupViewCache[code]?.hasLoadedOnce;
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [circuitNotice, setCircuitNotice] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAllPairs, setShowAllPairs] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isGroupUnlocked, setIsGroupUnlocked] = useState(false);
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [isPdfUnlocked, setIsPdfUnlocked] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState<"pdf" | "secret" | "group">("group");
  const [rawAnalysisDoc, setRawAnalysisDoc] = useState<any>(() => {
    return groupViewCache[code]?.rawAnalysisDoc || null;
  });
  const [capturedImgUrl, setCapturedImgUrl] = useState<string | null>(null);
  const [showLongPressGuide, setShowLongPressGuide] = useState(false);

  // Inline Coupon State
  const [inlineCoupon, setInlineCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineCoupon.trim()) {
      setCouponMsg({ type: "error", text: "쿠폰 번호를 입력해 주세요." });
      return;
    }

    const membership = getUserMembershipInfo(auth.currentUser);
    if (!membership.canUseCoupon) {
      setCouponMsg({
        type: "error",
        text: "쿠폰 등록은 Google 정회원 전용 기능이에요. 아래 해금창에서 로그인하거나 계정을 연동해 주세요."
      });
      setIsShopOpen(true);
      return;
    }

    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await redeemCoupon(inlineCoupon.trim());
      if (res.success) {
        setCouponMsg({ type: "success", text: "쿠폰이 적용되어 전체 분석이 해금되었어요." });
        setInlineCoupon("");
        await syncUnlockStates();
      } else {
        setCouponMsg({ type: "error", text: res.message || "유효하지 않거나 이미 사용된 쿠폰입니다." });
      }
    } catch (err: any) {
      setCouponMsg({ type: "error", text: "쿠폰 적용 중 오류가 발생했습니다." });
    } finally {
      setCouponLoading(false);
    }
  };

  const isSchemaValid = React.useMemo(() => {
    if (!rawAnalysisDoc || !rawAnalysisDoc.personal || !rawAnalysisDoc.group || !rawAnalysisDoc.pairs) return false;
    const firstPersonal = Object.values(rawAnalysisDoc.personal)[0] as any;
    const hasNewSchema = firstPersonal && firstPersonal.four_areas && 'essence' in firstPersonal.four_areas;
    return !!(hasNewSchema && typeof rawAnalysisDoc.group.overall_score === "number" && rawAnalysisDoc.group.overall_score > 0 && rawAnalysisDoc.pairs.length > 0);
  }, [rawAnalysisDoc]);

  const isCacheValid = React.useMemo(() => {
    if (!isSchemaValid || members.length < 2) return false;
    
    const currentMemberIds = members.map(m => m.id);
    const cachedMemberIds = Object.keys(rawAnalysisDoc.personal);
    const isMemberMatch = currentMemberIds.length === cachedMemberIds.length &&
                          currentMemberIds.every(id => cachedMemberIds.includes(id));

    return isMemberMatch;
  }, [members, isSchemaValid, rawAnalysisDoc]);

  const hoursSinceCreated = React.useMemo(() => {
    if (!rawAnalysisDoc || !rawAnalysisDoc.created_at) return null;
    const createdTime = new Date(rawAnalysisDoc.created_at).getTime();
    if (isNaN(createdTime)) return null;
    return (Date.now() - createdTime) / (1000 * 60 * 60);
  }, [rawAnalysisDoc]);

  const isWithin24HoursLimit = React.useMemo(() => {
    return hoursSinceCreated !== null && hoursSinceCreated < 24;
  }, [hoursSinceCreated]);

  const timeLeftText = React.useMemo(() => {
    if (hoursSinceCreated === null) return "";
    const remainingMs = (24 - hoursSinceCreated) * 60 * 60 * 1000;
    if (remainingMs <= 0) return "";
    
    const h = Math.floor(remainingMs / (1000 * 60 * 60));
    const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}시간 ${m}분`;
  }, [hoursSinceCreated]);

  useEffect(() => {
    if (rawAnalysisDoc) {
      if (isCacheValid) {
        setAnalysis(rawAnalysisDoc);
        setPageLoading(false);
        setAnalyzing(false);
      } else if (isWithin24HoursLimit && isSchemaValid) {
        // Members list has changed, but we are within 24h limit, so we show the previous cached analysis as fallback
        setAnalysis(rawAnalysisDoc);
        setPageLoading(false);
        setAnalyzing(false);
      } else {
        setAnalysis(null);
      }
    } else {
      setAnalysis(null);
    }
  }, [isCacheValid, isWithin24HoursLimit, isSchemaValid, rawAnalysisDoc]);

  const syncUnlockStates = async () => {
    const status = await checkPremiumStatus();
    setIsPremium(status);
    const groupStatus = await checkProductUnlock("group");
    const secretStatus = await checkProductUnlock("secret");
    const pdfStatus = await checkProductUnlock("pdf");
    setIsGroupUnlocked(status || groupStatus);
    setIsSecretUnlocked(status || secretStatus);
    setIsPdfUnlocked(status || pdfStatus);
  };

  useEffect(() => {
    syncUnlockStates();

    const unsubscribe = auth.onAuthStateChanged(() => {
      syncUnlockStates();
    });
    return () => unsubscribe();
  }, []);

  const captureRef = useRef<HTMLDivElement>(null);

  const spaceKey = React.useMemo(() => calculateSpaceKey(members), [members]);
  const [spaceImgFailed, setSpaceImgFailed] = useState(false);
  const spaceSrcCandidate = React.useMemo(() => spaceImageSrc(spaceKey), [spaceKey]);
  useEffect(() => setSpaceImgFailed(false), [spaceSrcCandidate]);
  const spaceSrc = spaceImgFailed ? null : spaceSrcCandidate;

  // Score to color helper — 점수는 먹 농담으로, 최고 구간(90+)에만 인주 포인트
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-seal bg-sunken";
    if (score >= 70) return "text-ink bg-sunken";
    if (score >= 50) return "text-ink-soft bg-sunken";
    if (score >= 30) return "text-ink-soft bg-sunken";
    return "text-ink-faint bg-sunken";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-seal";
    if (score >= 70) return "bg-ink";
    if (score >= 50) return "bg-ink/60";
    if (score >= 30) return "bg-ink/40";
    return "bg-ink/30";
  };

  const acquireLockAndAnalyze = async (currentMembers: Member[], roomTitle: string) => {
    try {
      console.log("Acquiring AI analysis lock in Firestore...");
      backgroundAnalysisManager.startTracking(code, roomTitle);
      const lockPayload = {
        status: "processing",
        started_at: new Date().toISOString(),
        members_analyzed: currentMembers.map(m => m.id)
      };
      await setDoc(doc(db, "rooms", code, "analysis", "result"), lockPayload);
      
      // Call the API
      await triggerAIAnalysis(currentMembers, roomTitle);
    } catch (err: any) {
      console.error("Failed to acquire lock or trigger analysis:", err);
      setError(err.message || "AI 사주 융합 풀이 과정에서 지연이 발생했습니다.");
      
      // On failure, delete the processing doc so others can retry
      await deleteDoc(doc(db, "rooms", code, "analysis", "result")).catch((delErr) => {
        console.error("Failed to clear processing lock on error:", delErr);
      });
      setAnalyzing(false);
      setPageLoading(false);
    }
  };

  // Call backend API /api/analyze and write to Firestore for caching (eliminates N^2 bills)
  const triggerAIAnalysis = async (currentMembers: Member[], roomTitle: string) => {
    setAnalyzing(true);
    setError("");
    try {
      // Enrich currentMembers with any existing personal analyses from the cached analysis doc to prevent redundant AI requests
      const enrichedMembers = currentMembers.map(m => {
        const existingPersonal = analysis?.personal?.[m.id];
        if (existingPersonal) {
          return {
            ...m,
            personal_analysis: existingPersonal
          };
        }
        return m;
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room_title: roomTitle, members: enrichedMembers }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errObj = await response.json().catch(() => ({}));
          throw new Error(errObj.error || "Gemini 인공지능 명식 조율에 실패했습니다.");
        } else {
          throw new Error("서버 혼잡 또는 일시적인 네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("서버 혼잡 또는 일시적인 네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      }

      const aiData = await response.json();

      if (aiData.circuit_breaker?.triggered && aiData.circuit_breaker?.message) {
        setCircuitNotice(aiData.circuit_breaker.message);
      }

      // Ensure the user is authenticated prior to writing cache for security rules standard
      try {
        if (!auth.currentUser) {
          await getAnonymousUser();
        }
      } catch (authErr) {
        console.warn("Authentication prior to cache write failed, writing anyway:", authErr);
      }

      // Write results to Firestore Rooms/{code}/analysis/result
      const payload: CachedAnalysisResult = {
        personal: aiData.personal,
        pairs: aiData.pairs,
        group: aiData.group,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, "rooms", code, "analysis", "result"), payload);
      console.log("Analysis data set:", payload);
      setAnalysis(payload);
    } catch (err: any) {
      console.error("AI aggregation analysis failed:", err);
      throw err; // Re-throw so acquireLockAndAnalyze can clear the lock
    }
  };

  useEffect(() => {
    let unsubscribeAnalysis: (() => void) | null = null;

    const startDataFetch = async () => {
      const isFirstLoad = !groupViewCache[code]?.hasLoadedOnce;
      if (isFirstLoad) {
        setPageLoading(true);
      }
      setError("");
      try {
        // 1. Fetch Room Info
        const roomSnap = await getDoc(doc(db, "rooms", code));
        if (!roomSnap.exists()) {
          setError("방이 만료되거나 존재하지 않는 코드입니다.");
          setPageLoading(false);
          return;
        }
        const roomData = roomSnap.data();
        if (roomData && roomData.expire_at) {
          const expireDate = new Date(roomData.expire_at);
          if (expireDate < new Date()) {
            setError("만료된 모임입니다 (생성 후 30일 경과).");
            setPageLoading(false);
            return;
          }
        }
        const rData = { code, ...roomData } as Room;
        setRoom(rData);

        // 2. Fetch Members list in subcollection
        const membersSnap = await getDocs(collection(db, "rooms", code, "members"));
        const mList: Member[] = [];
        membersSnap.forEach((docSnap) => {
          mList.push({ id: docSnap.id, ...docSnap.data() } as Member);
        });

        if (mList.length < 2) {
          setError("인연 궁합을 엮으려면 최소 2명 이상 사주를 등록해야 합니다.");
          setPageLoading(false);
          return;
        }

        setMembers(mList);
        console.log("Members loaded:", mList);

        // Update in cache
        if (!groupViewCache[code]) {
          groupViewCache[code] = {
            room: rData,
            members: mList,
            rawAnalysisDoc: groupViewCache[code]?.rawAnalysisDoc || null,
            hasLoadedOnce: false,
          };
        } else {
          groupViewCache[code].room = rData;
          groupViewCache[code].members = mList;
        }

        // 3. Listen to real-time analysis doc
        const analysisRef = doc(db, "rooms", code, "analysis", "result");
        unsubscribeAnalysis = onSnapshot(analysisRef, async (analysisSnap) => {
          try {
            if (analysisSnap.exists()) {
              const docData = analysisSnap.data();
              setRawAnalysisDoc(docData);

              if (!groupViewCache[code]) {
                groupViewCache[code] = {
                  room: rData,
                  members: mList,
                  rawAnalysisDoc: docData,
                  hasLoadedOnce: true,
                };
              } else {
                groupViewCache[code].rawAnalysisDoc = docData;
                groupViewCache[code].hasLoadedOnce = true;
              }

              // Check if another client is currently processing
              if (docData.status === "processing") {
                const startedAt = docData.started_at ? new Date(docData.started_at).getTime() : 0;
                const now = Date.now();
                const elapsedSeconds = (now - startedAt) / 1000;

                if (elapsedSeconds < 90) {
                  console.log("Another client is currently performing AI analysis... waiting.");
                  backgroundAnalysisManager.startTracking(code, rData.title || "모임");
                  setAnalyzing(true);
                  setPageLoading(false);
                  return;
                } else {
                  console.warn("AI analysis lock expired (elapsed seconds:", elapsedSeconds, "). Clearing orphaned lock...");
                  setAnalyzing(false);
                  setPageLoading(false);
                  await deleteDoc(analysisRef).catch((delErr) => {
                    console.error("Failed to clear expired processing lock:", delErr);
                  });
                  return;
                }
              }
            } else {
              setRawAnalysisDoc(null);
              if (groupViewCache[code]) {
                groupViewCache[code].rawAnalysisDoc = null;
              }
            }
            // Turn off initial page loading once we get snapshot
            setPageLoading(false);
          } catch (listenerErr: any) {
            console.error("Error in real-time analysis listener:", listenerErr);
            setError(listenerErr.message || "실시간 분석 중 오류가 발생했습니다.");
            setAnalyzing(false);
            setPageLoading(false);
          }
        });

      } catch (err: any) {
        console.error("Failed to load group details:", err);
        setError(err.message || "모임 정보를 불러오는 중 오류가 발생했어요.");
        setPageLoading(false);
      }
    };

    startDataFetch();

    return () => {
      if (unsubscribeAnalysis) {
        unsubscribeAnalysis();
      }
    };
  }, [code, refreshTrigger]);

  // Separate effect for auto-trigger on room size <= 6 when no analysis exists
  useEffect(() => {
    if (pageLoading || members.length < 2 || !room || analyzing) return;

    const autoTrigger = async () => {
      // Auto-trigger only on initial load if no analysis document exists,
      // and the room size is <= 6.
      if (!rawAnalysisDoc && members.length <= 6) {
        console.log("Auto-triggering AI analysis for room.");
        await acquireLockAndAnalyze(members, room.title);
      }
    };
    autoTrigger();
  }, [members, room, rawAnalysisDoc, pageLoading, analyzing]);

  // Image capture & sharing utilizing html2canvas
  const handleShareResult = async () => {
    if (!captureRef.current) return;
    setShareStatus("캡처화면 준비 중...");

    logAnalyticsEvent({
      eventName: "result_capture_click",
      category: "viral",
      metadata: { memberCount: members.length, roomTitle: room?.title },
      roomCode: code
    });

    try {
      // Create high-contrast canvas capture
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, // Double resolution for ultra crisp vector render
        backgroundColor: "#FCFCFA",
        useCORS: true,
        logging: false,
        onclone: (clonedDoc, clonedElement) => {
          // 1. Copy all dynamic style tags from original head to cloned head
          try {
            const originalStyles = document.querySelectorAll("style");
            originalStyles.forEach((styleTag) => {
              clonedDoc.head.appendChild(styleTag.cloneNode(true));
            });
          } catch (e) {
            console.warn("Failed to clone style tags in GroupView:", e);
          }

          // 2. Explicitly serialize rules from linked stylesheets safely
          let compiledCss = "";
          try {
            for (let i = 0; i < document.styleSheets.length; i++) {
              try {
                const sheet = document.styleSheets[i];
                const rules = sheet.cssRules || sheet.rules;
                if (rules) {
                  for (let j = 0; j < rules.length; j++) {
                    compiledCss += rules[j].cssText + "\n";
                  }
                }
              } catch (sheetErr) {
                // Ignore SecurityError
              }
            }
          } catch (e) {
            console.warn("Failed to extract stylesheet rules in GroupView:", e);
          }

          if (compiledCss) {
            try {
              const styleTag = clonedDoc.createElement("style");
              styleTag.innerHTML = compiledCss;
              clonedDoc.head.appendChild(styleTag);

              const innerStyleTag = clonedDoc.createElement("style");
              innerStyleTag.innerHTML = compiledCss;
              clonedElement.appendChild(innerStyleTag);
            } catch (e) {
              console.warn("Failed to inject style blocks in GroupView:", e);
            }
          }
        }
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("캡처 이미지 생성에 실패했습니다.");
          setShareStatus("");
          return;
        }

        const dataUrl = canvas.toDataURL("image/png");
        setCapturedImgUrl(dataUrl);

        const file = new File([blob], `saju_chemistry_${code}.png`, { type: "image/png" });
        const isInstagramOrKakao = /instagram|kakaotalk/i.test(navigator.userAgent);

        // Mobile Native Share Check
        if (
          !isInstagramOrKakao &&
          navigator.share && 
          navigator.canShare && 
          navigator.canShare({ files: [file] }) &&
          /mobile|android|iphone|ipad/i.test(navigator.userAgent)
        ) {
          try {
            await navigator.share({
              files: [file],
              title: `${room?.title || "모임"} 사주 종합 궁합`,
              text: "우리 모임 사주 궁합 결과를 확인해 보세요.",
            });
            setShareStatus("인연 공유완료!");
          } catch (shareErr) {
            console.log("Navigator share failed, fallback to long-press guide", shareErr);
            setShowLongPressGuide(true);
            setShareStatus("");
          }
        } else {
          if (!/mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            // Desktop: Download file directly
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `saju_group_chemistry_${code}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShareStatus("결과 이미지 저장됨!");
          } else {
            // Mobile / Kakao / Instagram in-app browser: Show long press guide
            setShowLongPressGuide(true);
            setShareStatus("");
          }
        }
      }, "image/png");

    } catch (err) {
      console.error("Failed to capture group dashboard:", err);
      setShareStatus("캡처 오류 발생");
    } finally {
      setTimeout(() => setShareStatus(""), 2000);
    }
  };

  if (pageLoading && !room) {
    return (
      <LoadingOverlay
        message="모임방 기록을 불러오는 중이에요..."
      />
    );
  }

  if (error || !room) {
    return (
      <Layout title="모임 궁합 오류" showHomeButton>
        <div className="text-center py-12 space-y-4">
          <p className="text-sm font-medium text-ink leading-relaxed">
            {error || "궁합 분석 결과를 불러오지 못했어요."}
          </p>
          <div className="flex flex-col space-y-3 max-w-xs mx-auto pt-2">
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="flex items-center justify-center space-x-1.5 py-3 bg-seal hover:bg-seal-deep text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>다시 시도하기</span>
            </button>
            <a
              href={`#/room/${code}`}
              className="inline-block py-3 bg-sunken hover:bg-line text-ink rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            >
              모임방으로 돌아가기
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Find member object helper
  const findMemberObj = (inputVal: string) => {
    if (!inputVal) return undefined;
    const normInput = inputVal.trim().toLowerCase().replace(/님$/, "");
    return members.find((m) => {
      const normId = m.id ? m.id.trim().toLowerCase() : "";
      const normNick = m.nickname ? m.nickname.trim().toLowerCase().replace(/님$/, "") : "";
      return (
        normId === normInput ||
        normNick === normInput ||
        normId.includes(normInput) ||
        normInput.includes(normId) ||
        normNick.includes(normInput) ||
        normInput.includes(normNick)
      );
    });
  };

  // Check and upgrade generic boilerplate pairs to dynamic premium chemistry pairs
  const upgradedPairs = analysis && Array.isArray(analysis.pairs) ? analysis.pairs.map((p) => {
    const m1 = findMemberObj(p.member_id_1);
    const m2 = findMemberObj(p.member_id_2);
    const isGeneric = p.label === "상생과 화합의 인연 메이트" ||
                      p.label === "상생과 화합의 인연 조합" ||
                      p.label === "대조합" ||
                      isDummyPair(p) ||
                      (p.description && p.description.includes("서로 다른 기운이 자연스럽게 합을 이루는 조화로운 인연입니다"));
    if (m1 && m2 && isGeneric) {
      return generateDynamicPairCompatibility(m1, m2);
    }
    return p;
  }) : [];

  // Sort pairs by score desc to highlight best matches
  const sortedPairs = [...upgradedPairs].sort((a, b) => b.score - a.score);

  // We show at most 3 pairs for free users, and all pairs for premium users.
  const displayedPairs = (() => {
    if (isGroupUnlocked) {
      return sortedPairs;
    }
    if (sortedPairs.length <= 3) {
      return sortedPairs;
    }
    const topTwo = sortedPairs.slice(0, 2);
    const bottomOne = sortedPairs.slice(-1);
    return [...topTwo, ...bottomOne];
  })();

  return (
    <Layout title={`${room.title} 궁합도`} showHomeButton>
      <div className="space-y-6 py-2">
        
        {/* Back Link & Refresh Action */}
        <div className="flex items-center justify-between">
          <a
            href={`#/room/${code}`}
            className="inline-flex items-center text-xs font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            모임방으로 돌아가기
          </a>
          <button
            onClick={() => {
              if (isWithin24HoursLimit) {
                alert(`종합 궁합 분석은 분석 품질 유지를 위해 24시간에 한 번만 가능해요. 새로운 멤버 구성으로 재분석하려면 ${timeLeftText} 후에 시도해 주세요.`);
                return;
              }
              acquireLockAndAnalyze(members, room.title);
            }}
            disabled={analyzing}
            className={`inline-flex items-center text-xs font-semibold transition-colors px-3 py-1.5 rounded-xl cursor-pointer ${
              isWithin24HoursLimit
                ? "bg-sunken text-ink-faint cursor-not-allowed"
                : "bg-sunken hover:bg-line text-ink"
            }`}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{isWithin24HoursLimit ? `재분석 잠금 (${timeLeftText})` : "다시 분석하기"}</span>
          </button>
        </div>

        {/* Background AI Analysis Progress Indicator Banner */}
        {analyzing && (
          <div className="bg-surface border border-seal/30 bg-seal/[0.02] p-4 rounded-xl shadow-xs flex items-center justify-between gap-3 animate-fade-in text-left">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-seal/10 text-seal shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-seal" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-seal opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-seal"></span>
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <span>AI 사주 융합 백그라운드 분석 진행 중</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-seal/10 text-seal rounded font-medium">실시간</span>
                </p>
                <p className="text-[11px] text-ink-soft leading-tight">
                  분석 중에도 모임원 프로필과 사주 명식을 자유롭게 둘러보실 수 있어요. 분석이 완료되면 결과가 자동으로 갱신됩니다.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="text-xs font-mono font-semibold text-seal bg-sunken px-2 py-1 rounded-md">
                조율 중...
              </span>
            </div>
          </div>
        )}

        {/* AI Circuit Breaker Traffic Surge Alert Banner */}
        {circuitNotice && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl shadow-xs flex items-start justify-between gap-2.5 animate-fade-in text-left text-xs text-amber-200">
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">⚡</span>
              <div className="space-y-0.5">
                <p className="font-semibold text-amber-300">인공지능(AI) 사용량 폭주 보호 모드 가동</p>
                <p className="text-amber-200/90 leading-relaxed">{circuitNotice}</p>
              </div>
            </div>
            <button
              onClick={() => setCircuitNotice(null)}
              className="text-amber-400/60 hover:text-amber-200 p-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {isWithin24HoursLimit && !isCacheValid && (
          <div className="bg-surface border border-line p-5 rounded-xl space-y-1.5">
            <h4 className="text-[15px] font-semibold text-ink">
              멤버 구성이 바뀌었어요
            </h4>
            <p className="text-xs text-ink-soft leading-relaxed">
              멤버 목록에 변동(입퇴장 또는 사주 수정)이 있었어요. 종합 궁합 분석은 24시간에 한 번만 가능해서, 다음 분석 가능 시간까지는 기존 멤버 기준의 마지막 결과를 보여드려요.
            </p>
            <div className="text-xs text-ink-faint flex items-center space-x-1">
              <span>재분석 가능까지</span>
              <span className="text-ink font-mono font-semibold bg-sunken px-1.5 py-0.5 rounded-md">{timeLeftText}</span>
              <span>남음</span>
            </div>
          </div>
        )}

        {!analysis ? (
          analyzing ? (
            <div className="bg-surface border border-line rounded-xl p-6 text-center space-y-6 py-12">
              <div className="w-14 h-14 mx-auto rounded-full bg-seal/10 flex items-center justify-center text-seal">
                <RefreshCw className="w-6 h-6 animate-spin text-seal" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="font-serif text-lg font-semibold text-ink">
                  모임 사주 궁합을 백그라운드에서 풀이 중이에요
                </h4>
                <p className="text-xs text-ink-soft leading-relaxed">
                  인공지능이 멤버 {members.length}명의 사주 원국, 자미두수, MBTI 성향을 종합 대조하고 있어요. 잠시만 기다려 주시면 결과가 자동으로 나타납니다.
                </p>
              </div>

              {/* Members Preview while waiting */}
              <div className="pt-2 text-left space-y-2 max-w-md mx-auto">
                <p className="text-xs font-semibold text-ink-faint">참여 멤버 목록 ({members.length}명)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((m) => (
                    <div key={`waiting-${m.id}`} className="flex items-center space-x-2 p-2.5 bg-sunken rounded-xl">
                      <ZodiacAvatar member={m} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-ink truncate">{m.nickname}</p>
                        <p className="text-[10px] text-ink-faint truncate">
                          {m.saju?.daymaster?.gan || ""} {m.saju?.daymaster?.element || ""} 기운 · {m.mbti || "MBTI 미입력"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-xl p-8 text-center space-y-4 py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-sunken flex items-center justify-center font-serif text-2xl text-ink">
                緣
              </div>
              <div className="space-y-3 max-w-sm mx-auto">
                <h4 className="font-serif text-lg font-semibold text-ink">아직 궁합 분석 전이에요</h4>
                <p className="text-sm text-ink-soft leading-relaxed">
                  모임 전체 멤버의 사주를 함께 대조한 종합 궁합 결과가 아직 없어요. 아래 버튼을 눌러 분석을 시작해 보세요.
                </p>
                <button
                  onClick={async () => {
                    await acquireLockAndAnalyze(members, room.title);
                  }}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center space-x-1.5 px-6 py-3 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer mt-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                  <span>궁합 분석하기</span>
                </button>
              </div>
            </div>
          )
        ) : (
          <>
            {/* --- SHARING CAPTURE TARGET START --- */}
            <div id="capture-target" ref={captureRef} className="space-y-6">
              
              {/* =========================================================================
                  STAGE 1 (FREE): FRONT GROUP SOUL CARD (규격 380px, #FFFFFF, radius 28px)
                 ========================================================================= */}
              <div className="w-full bg-surface rounded-xl p-6 sm:p-7 border border-line text-left select-none">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono tracking-[0.14em] text-ink-faint">
                    GROUP · {members.length}인
                  </span>
                  <span className="text-xs font-medium text-seal bg-seal/10 px-2.5 py-1 rounded-lg">
                    {SPACE_NAMES[spaceKey]}
                  </span>
                </div>

                {/* Circular Geometric Emblem or Space Image */}
                <div className="w-[104px] h-[104px] mx-auto mb-4 rounded-full bg-sunken flex items-center justify-center overflow-hidden">
                  {spaceSrc ? (
                    <img
                      src={spaceSrc}
                      alt={`${SPACE_NAMES[spaceKey]} 심볼`}
                      decoding="async"
                      onError={() => setSpaceImgFailed(true)}
                      className="w-[92px] h-[92px] object-contain select-none"
                    />
                  ) : (
                    <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
                      <circle cx="24" cy="24" r="16" />
                      <circle cx="24" cy="14" r="6" />
                      <circle cx="15" cy="29" r="6" />
                      <circle cx="33" cy="29" r="6" />
                      <line x1="24" y1="14" x2="15" y2="29" opacity="0.4" />
                      <line x1="24" y1="14" x2="33" y2="29" opacity="0.4" />
                      <line x1="15" y1="29" x2="33" y2="29" opacity="0.4" />
                    </svg>
                  )}
                </div>

                <h3 className="text-center font-serif text-2xl font-semibold tracking-tight leading-snug text-ink mb-2">
                  모임 케미 <span className="text-seal">{analysis.group.overall_score}점</span>
                </h3>

                <p className="text-center text-sm leading-relaxed text-ink-soft max-w-[320px] mx-auto mb-5">
                  {analysis.group.title} · {analysis.group.atmosphere}
                </p>

                {/* 계산 지표 (다양성·순환) */}
                <div className="space-y-2.5 pt-4 border-t border-line">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-xs font-medium text-ink w-[48px] shrink-0 text-left">다양성</span>
                    <div className="h-[7px] bg-sunken rounded-full overflow-hidden flex-1">
                      <div className="h-full rounded-full bg-ink/70" style={{ width: `${Math.min(98, (new Set(members.map(m => m.saju?.daymaster?.element))).size * 22)}%` }} />
                    </div>
                    <span className="text-xs font-mono text-right text-ink-faint w-[30px] shrink-0">{Math.min(98, (new Set(members.map(m => m.saju?.daymaster?.element))).size * 22)}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-xs font-medium text-ink w-[48px] shrink-0 text-left">순환력</span>
                    <div className="h-[7px] bg-sunken rounded-full overflow-hidden flex-1">
                      <div className="h-full rounded-full bg-ink/70" style={{ width: `${analysis.group.overall_score}%` }} />
                    </div>
                    <span className="text-xs font-mono text-right text-ink-faint w-[30px] shrink-0">{analysis.group.overall_score}</span>
                  </div>
                </div>
              </div>

              {/* Free Section 1: 전체 기운 요강 & 화합 극대화 비책 */}
              <div className="bg-surface border border-line p-5 sm:p-6 rounded-xl text-left space-y-4">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-[15px] font-semibold text-ink">모임 전체 기운 요강</span>
                  <span className="text-xs font-medium text-ink-faint bg-sunken px-2 py-0.5 rounded-md">
                    무료 공개
                  </span>
                </div>

                <p className="text-left text-sm text-ink-soft leading-relaxed">
                  {analysis.group.description}
                </p>

                <div className="p-4 bg-sunken rounded-xl text-left text-xs text-ink-soft leading-relaxed">
                  <span className="font-semibold text-ink block mb-1">화합을 높이는 팁</span>
                  {analysis.group.synergy_tips}
                </div>
              </div>

              {/* Free Section 2: SVG Circular Network Graph */}
              <GroupNetwork members={members} pairs={upgradedPairs} isPremium={isGroupUnlocked} />

              {/* =========================================================================
                  STAGE 2 (PREMIUM / COUPON): 심층 비밀 역학 및 전수 1:1 케미 해금
                 ========================================================================= */}
              <div id="secret-dynamics-panel" className="bg-surface border border-line p-5 sm:p-6 rounded-xl text-left space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between pb-2.5">
                  <div className="flex items-center space-x-1.5">
                    {!isSecretUnlocked && <Lock className="w-3.5 h-3.5 text-ink-faint" />}
                    <h4 className="text-[15px] font-semibold text-ink">
                      비밀 인연 등급과 상성 궤적
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-ink-faint bg-sunken px-2 py-0.5 rounded-md flex items-center gap-1">
                    {isSecretUnlocked ? "해금 완료" : "쿠폰·프리미엄 전용"}
                  </span>
                </div>

                {/* Inline Coupon Input Bar */}
                {!isSecretUnlocked && (
                  <div className="p-4 bg-sunken rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-ink-faint" />
                      <span className="text-xs font-semibold text-ink">쿠폰 번호로 해금하기</span>
                    </div>
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={inlineCoupon}
                        onChange={(e) => setInlineCoupon(e.target.value)}
                        placeholder="쿠폰 번호"
                        maxLength={20}
                        className="flex-1 min-w-0 px-3 py-2 text-xs bg-surface rounded-xl focus:outline-none focus:ring-1 focus:ring-ink font-mono uppercase text-ink placeholder:text-ink-faint"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading}
                        className="px-4 py-2 bg-surface hover:bg-line text-ink rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {couponLoading ? "확인 중..." : "쿠폰 적용"}
                      </button>
                    </form>
                    {couponMsg && (
                      <p className={`text-xs font-medium ${couponMsg.type === "success" ? "text-ink" : "text-seal"}`}>
                        {couponMsg.text}
                      </p>
                    )}
                  </div>
                )}

            <div className={!isSecretUnlocked ? "filter blur-[3.5px] opacity-35 select-none pointer-events-none space-y-4" : "space-y-4"}>
              {/* S-등급 천생연분 짝꿍 추천 */}
              {(() => {
                const sGradePairs = sortedPairs.filter(p => p.score >= 88);
                const aGradePairs = sortedPairs.filter(p => p.score >= 80 && p.score < 88);

                return (
                  <div className="space-y-2.5">
                    <span className="text-xs text-ink font-semibold block">
                      모임에서 가장 조화로운 S등급 조합
                    </span>
                    {sGradePairs.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {sGradePairs.slice(0, 3).map((p, idx) => {
                          const m1 = findMemberObj(p.member_id_1);
                          const m2 = findMemberObj(p.member_id_2);
                          if (!m1 || !m2) return null;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-sunken rounded-xl">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <ZodiacAvatar member={m1} size={20} fallbackEmoji={m1.character_emoji} />
                                  <span className="text-sm font-semibold text-ink">{m1.nickname}</span>
                                </div>
                                <span className="text-ink-faint font-sans">·</span>
                                <div className="flex items-center gap-1.5">
                                  <ZodiacAvatar member={m2} size={20} fallbackEmoji={m2.character_emoji} />
                                  <span className="text-sm font-semibold text-ink">{m2.nickname}</span>
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-seal bg-surface px-2 py-0.5 rounded-md">
                                {p.score >= 95 ? "S+ 등급" : "S 등급"} · {p.score}점
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-sunken rounded-xl text-center text-xs text-ink-faint">
                        모임 안에 S등급(90점 이상) 조합은 없어요. 가장 조화로운 A등급 조합({aGradePairs[0]?.score || 78}점)을 참고해 보세요.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 속마음 상성 지도 다이어그램 (Grid listing grades of all pairs) */}
              <div className="space-y-2.5">
                <span className="text-xs text-ink font-semibold block">
                  오행 충·합 기반 전체 등급표
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {sortedPairs.map((p, idx) => {
                    const m1 = findMemberObj(p.member_id_1);
                    const m2 = findMemberObj(p.member_id_2);
                    if (!m1 || !m2) return null;

                    // Get Grade — 등급은 먹 농담(진하게=높음), S에만 인주 포인트
                    let grade = "C";
                    let gradeColor = "text-ink-soft bg-sunken";
                    if (p.score >= 90) {
                      grade = "S";
                      gradeColor = "text-white bg-seal";
                    } else if (p.score >= 80) {
                      grade = "A";
                      gradeColor = "text-ink bg-sunken";
                    } else if (p.score >= 70) {
                      grade = "B";
                      gradeColor = "text-ink bg-sunken";
                    } else if (p.score >= 60) {
                      grade = "C";
                      gradeColor = "text-ink-soft bg-sunken";
                    } else if (p.score >= 50) {
                      grade = "D";
                      gradeColor = "text-ink-faint bg-sunken";
                    } else {
                      grade = "F";
                      gradeColor = "text-ink-faint bg-sunken";
                    }

                    return (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-sunken rounded-xl text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate text-ink font-medium">{m1.nickname} × {m2.nickname}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-ink-faint font-mono">{p.score}점</span>
                          <span className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center font-serif leading-none ${gradeColor}`}>
                            {grade}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 성향 충돌을 영리하게 예방하는 맞춤형 비밀 완충 수칙 */}
              {(() => {
                const lowestPair = sortedPairs[sortedPairs.length - 1];
                if (!lowestPair) return null;
                const m1 = findMemberObj(lowestPair.member_id_1);
                const m2 = findMemberObj(lowestPair.member_id_2);
                if (!m1 || !m2) return null;

                return (
                  <div className="p-4 bg-sunken rounded-xl space-y-1.5">
                    <span className="text-xs text-ink font-semibold block">
                      성향 충돌을 줄이는 완충 수칙 ({m1.nickname} × {m2.nickname})
                    </span>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      두 분은 천간(天干)과 지지(地支) 기류상 생각이 직접 부딪힐 수 있는 오행 상극 구간을 안고 있어요.
                      의견을 조율할 때는 단답형 메시지보다, 차 한잔을 곁들인 대화나 칭찬을 먼저 건네는 대화를 활용해 보세요.
                      상대의 다른 기운을 나를 보완해 주는 윤활유로 여기는 것이 좋은 완충 전략이에요.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Locked Gateway Cover */}
            {!isSecretUnlocked && (
              <div className="absolute inset-0 bg-surface/85 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-surface rounded-xl p-5 shadow-lg max-w-sm space-y-3.5">
                  <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center mx-auto">
                    <Lock className="w-4 h-4 text-ink-soft" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-ink">
                      비밀 인연 등급 해독권이 필요해요
                    </h5>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      해독권을 등록하면 모임 전체 멤버의 인연 등급(S~F)과 상성 궤적, 성향 충돌 완충 수칙을 볼 수 있어요.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShopInitialTab("secret");
                      setIsShopOpen(true);
                    }}
                    className="px-4 py-2 bg-sunken hover:bg-line text-ink rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    해금 안내 보기
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
        {/* --- SHARING CAPTURE TARGET END --- */}

        {/* Share Action bar in Hanji style */}
        <div className="bg-surface border border-line p-5 rounded-xl flex flex-col items-center justify-center space-y-3.5 text-center">
          <p className="text-xs text-ink-soft leading-relaxed">
            궁합 결과 이미지를 저장해 단톡방이나 지인에게 공유할 수 있어요.
          </p>
          <button
            id="share-dashboard-btn"
            onClick={handleShareResult}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareStatus || "결과 이미지 공유하기"}</span>
          </button>
        </div>

        {/* 1:1 Chemical lists details */}
        <div className="space-y-4 text-left">
          <div className="flex flex-col space-y-1 border-b border-line pb-3 text-left">
            <div className="flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-ink-faint" />
              <h4 className="font-serif text-lg font-semibold text-ink">
                {isGroupUnlocked ? `멤버 간 1:1 궁합 (전체 ${sortedPairs.length}쌍)` : "멤버 간 1:1 궁합 (대표 3쌍)"}
              </h4>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {isGroupUnlocked
                ? `모임 안 전체 ${sortedPairs.length}쌍의 사주·자미두수·MBTI 융합 궁합 해설이 열려 있어요.`
                : `전체 ${sortedPairs.length}쌍 중 조화가 가장 좋은 2쌍과 서로 조심이 필요한 1쌍을 골랐어요. 개별 멤버 페이지에서는 본인의 모든 궁합을 볼 수 있어요.`
              }
            </p>
          </div>

          <div id="pairs-list" className="space-y-4">
            {sortedPairs.length === 0 && (
              <div className="text-center py-8 text-sm text-ink-soft bg-surface border border-line rounded-xl">
                분석된 궁합 데이터가 없어요.
                <button
                  onClick={() => triggerAIAnalysis(members, room.title)}
                  className="block mx-auto mt-3 px-4 py-2 bg-sunken hover:bg-line text-ink rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  분석 다시 시도
                </button>
              </div>
            )}
            {displayedPairs.map((pair, index) => {
              const findMember = (idOrName: string) => {
                if (!idOrName) return undefined;
                const norm = idOrName.trim().toLowerCase();
                
                // 1. Exact ID match
                let found = members.find((m) => m.id.trim().toLowerCase() === norm);
                if (found) return found;
                
                // 2. Nickname match (stripping '님')
                const cleanNorm = norm.replace(/님$/, "");
                found = members.find((m) => m.nickname.trim().toLowerCase().replace(/님$/, "") === cleanNorm);
                if (found) return found;
                
                // 3. Fuzzy substring match
                found = members.find((m) => {
                  const dbNick = m.nickname.trim().toLowerCase().replace(/님$/, "");
                  return dbNick.includes(cleanNorm) || cleanNorm.includes(dbNick);
                });
                return found;
              };

              const m1 = findMember(pair.member_id_1);
              const m2 = findMember(pair.member_id_2);

              if (!m1 || !m2) return null;
              
              const originalIndex = sortedPairs.indexOf(pair);
              const isBest = originalIndex === 0 || originalIndex === 1;
              const isWorst = originalIndex === sortedPairs.length - 1 && sortedPairs.length > 2;

              return (
                <div
                  key={`pair-${originalIndex}`}
                  className="bg-surface border border-line p-5 rounded-xl space-y-3.5 text-left"
                >
                  {/* Pair header participants */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center space-x-1.5 text-sm font-semibold text-ink min-w-0 flex-1 flex-wrap gap-y-1">
                      <span className="w-6 h-6 rounded-full bg-sunken flex items-center justify-center shrink-0 overflow-hidden">
                        <ZodiacAvatar member={m1} size={22} fallbackEmoji={m1.character_emoji} />
                      </span>
                      <span className="truncate">{m1.nickname}</span>
                      <span className="text-[11px] font-normal text-ink-faint bg-sunken px-1.5 py-0.5 rounded shrink-0">
                        {calculateMemberRole(m1).role}
                      </span>
                      <span className="text-ink-faint font-normal shrink-0">×</span>
                      <span className="w-6 h-6 rounded-full bg-sunken flex items-center justify-center shrink-0 overflow-hidden">
                        <ZodiacAvatar member={m2} size={22} fallbackEmoji={m2.character_emoji} />
                      </span>
                      <span className="truncate">{m2.nickname}</span>
                      <span className="text-[11px] font-normal text-ink-faint bg-sunken px-1.5 py-0.5 rounded shrink-0">
                        {calculateMemberRole(m2).role}
                      </span>
                    </div>

                    {/* Score & Special Status Badge Group */}
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {isBest && (
                        <span className="text-xs font-semibold text-seal bg-sunken px-2 py-0.5 rounded-md shrink-0">
                          가장 잘 맞는 조합
                        </span>
                      )}
                      {isWorst && (
                        <span className="text-xs font-medium text-ink-faint bg-sunken px-2 py-0.5 rounded-md shrink-0">
                          조율이 필요한 조합
                        </span>
                      )}
                      <span className="text-xs font-mono font-semibold text-ink bg-sunken px-2.5 py-0.5 rounded-md shrink-0">
                        {pair.score}점
                      </span>
                    </div>
                  </div>

                  {/* Full-width label callout */}
                  <div className={`px-3 py-2 rounded-xl text-center text-xs font-semibold leading-normal ${getScoreColor(pair.score)}`}>
                    {pair.label}
                  </div>

                  {/* Chemistry description of 2-3 sentences */}
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {pair.description}
                  </p>

                  {/* Detailed 4-Area Compatibility Breakdown */}
                  {pair.saju && pair.ziwei && pair.mbti && pair.zodiac && (
                    <div className="mt-3.5 pt-3.5 space-y-3">
                      <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        4대 영역별 상세 궁합 {!isSecretUnlocked && <span className="text-xs bg-sunken text-ink-faint px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> 잠김</span>}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {/* Saju */}
                        <div className="bg-sunken p-3 rounded-xl space-y-1.5 relative overflow-hidden">
                          <div className="flex justify-between items-center pb-1">
                            <span className="font-semibold text-xs text-ink">사주 궁합</span>
                            {isSecretUnlocked ? (
                              <span className="text-xs font-mono font-semibold text-ink bg-surface px-1.5 py-0.5 rounded-md">
                                평균 {Math.round((pair.saju.score_1_to_2 + pair.saju.score_2_to_1) / 2)}점
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-ink-faint bg-surface px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> 잠김
                              </span>
                            )}
                          </div>
                          {isSecretUnlocked ? (
                            <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap">
                              {pair.saju.description}
                            </p>
                          ) : (
                            <div className="relative pt-0.5">
                              <p className="text-xs text-ink-faint/50 leading-relaxed whitespace-pre-wrap blur-[2.5px] select-none pointer-events-none">
                                두 사람의 사주 오행 분포와 상호 지지 형충파해 작용을 대조한 궁합 해설이에요.
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-ink bg-surface px-2 py-0.5 rounded-md shadow-sm">
                                  상세 해설 잠김
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ziwei */}
                        <div className="bg-sunken p-3 rounded-xl space-y-1.5 relative overflow-hidden">
                          <div className="flex justify-between items-center pb-1">
                            <span className="font-semibold text-xs text-ink">자미두수 궁합</span>
                            {isSecretUnlocked ? (
                              <span className="text-xs font-mono font-semibold text-ink bg-surface px-1.5 py-0.5 rounded-md">
                                평균 {Math.round((pair.ziwei.score_1_to_2 + pair.ziwei.score_2_to_1) / 2)}점
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-ink-faint bg-surface px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> 잠김
                              </span>
                            )}
                          </div>
                          {isSecretUnlocked ? (
                            <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap">
                              {pair.ziwei.description}
                            </p>
                          ) : (
                            <div className="relative pt-0.5">
                              <p className="text-xs text-ink-faint/50 leading-relaxed whitespace-pre-wrap blur-[2.5px] select-none pointer-events-none">
                                자미두수 명반의 부부궁과 인연궁을 교차 대조해 두 사람의 마음이 소통하는 깊이를 해설한 리포트예요.
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-ink bg-surface px-2 py-0.5 rounded-md shadow-sm">
                                  상세 해설 잠김
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* MBTI */}
                        <div className="bg-sunken p-3 rounded-xl space-y-1.5 relative overflow-hidden">
                          {isMbtiRegistered(m1) && isMbtiRegistered(m2) ? (
                            <>
                              <div className="flex justify-between items-center pb-1">
                                <span className="font-semibold text-xs text-ink">MBTI 성향 궁합</span>
                                {isSecretUnlocked ? (
                                  <span className="text-xs font-mono font-semibold text-ink bg-surface px-1.5 py-0.5 rounded-md">
                                    평균 {Math.round((pair.mbti.score_1_to_2 + pair.mbti.score_2_to_1) / 2)}점
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-ink-faint bg-surface px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> 잠김
                                  </span>
                                )}
                              </div>
                              {isSecretUnlocked ? (
                                <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap">
                                  {pair.mbti.description}
                                </p>
                              ) : (
                                <div
                                  onClick={() => {
                                    setShopInitialTab("secret");
                                    setIsShopOpen(true);
                                  }}
                                  className="relative pt-0.5 cursor-pointer group"
                                  title="쿠폰 번호로 해금하기"
                                >
                                  <p className="text-xs text-ink-faint/50 leading-relaxed whitespace-pre-wrap blur-[2.5px] select-none pointer-events-none">
                                    MBTI 가치관 결합과 소통 성향 호환도, 갈등의 원인과 해결 수칙을 담은 해설이에요.
                                  </p>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-medium text-ink bg-surface group-hover:bg-line px-2 py-0.5 rounded-md shadow-sm transition-colors">
                                      쿠폰으로 해금
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-center pb-1">
                                <span className="font-semibold text-xs text-ink">MBTI 성향 궁합</span>
                                <span className="text-xs text-ink-faint bg-surface px-1.5 py-0.5 rounded-md">
                                  미등록
                                </span>
                              </div>
                              <p className="text-xs text-ink-faint leading-relaxed">
                                {!isMbtiRegistered(m1) && !isMbtiRegistered(m2)
                                  ? `두 멤버(${m1?.nickname}, ${m2?.nickname}) 모두 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없어요.`
                                  : !isMbtiRegistered(m1)
                                  ? `${m1?.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없어요.`
                                  : `${m2?.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없어요.`}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Zodiac */}
                        <div className="bg-sunken p-3 rounded-xl space-y-1.5 relative overflow-hidden">
                          <div className="flex justify-between items-center pb-1">
                            <span className="font-semibold text-xs text-ink">별자리 궁합</span>
                            {isSecretUnlocked ? (
                              <span className="text-xs font-mono font-semibold text-ink bg-surface px-1.5 py-0.5 rounded-md">
                                평균 {Math.round((pair.zodiac.score_1_to_2 + pair.zodiac.score_2_to_1) / 2)}점
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-ink-faint bg-surface px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> 잠김
                              </span>
                            )}
                          </div>
                          {isSecretUnlocked ? (
                            <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap">
                              {pair.zodiac.description}
                            </p>
                          ) : (
                            <div
                              onClick={() => {
                                logAnalyticsEvent({
                                  eventName: "click_locked_feature",
                                  category: "conversion",
                                  metadata: { feature: "secret_zodiac", pair: `${m1.nickname}-${m2.nickname}` },
                                  roomCode: code
                                });
                                setShopInitialTab("secret");
                                setIsShopOpen(true);
                              }}
                              className="relative pt-0.5 cursor-pointer group"
                              title="쿠폰 번호로 해금하기"
                            >
                              <p className="text-xs text-ink-faint/50 leading-relaxed whitespace-pre-wrap blur-[2.5px] select-none pointer-events-none">
                                황도 12궁의 결합도를 바탕으로 두 사람이 공유하는 일상·감성 가치관 호환도를 해설해요.
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-ink bg-surface group-hover:bg-line px-2 py-0.5 rounded-md shadow-sm transition-colors">
                                  확인권으로 해금
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* [인연사주 피드백 수용] 관계 극복 상생 처방전 & 행동 수칙 */}
                      {(() => {
                        const prescription = generateCustomPrescription(m1, m2, pair.score);
                        return (
                          <div id={`remedy-${originalIndex}`} className="bg-sunken p-4 rounded-xl space-y-2 mt-2.5">
                            <div className="flex items-center gap-1.5 text-ink font-semibold text-xs">
                              <Smile className="w-4 h-4 text-ink-faint shrink-0" />
                              <span>인연 처방전 — 두 사람의 상생 솔루션</span>
                            </div>
                            <div className="text-xs text-ink-soft leading-relaxed space-y-1.5">
                              <div className="bg-surface p-3 rounded-xl">
                                <span className="text-ink font-semibold block mb-0.5">
                                  {prescription.clashTitle}
                                </span>
                                {prescription.clashDesc}
                              </div>
                              <div className="bg-surface p-3 rounded-xl space-y-1.5">
                                <span className="text-ink font-semibold block mb-0.5">상생 화합 처방</span>
                                <p>{prescription.remedy1}</p>
                                <p>{prescription.remedy2}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          {/* Unified Room Unlock Dashboard */}
          <div className="mt-8 bg-surface border border-line rounded-xl p-5 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2.5">
              <h4 className="text-[15px] font-semibold text-ink">
                이 모임방의 해금 현황
              </h4>
              <span className="text-xs bg-sunken text-ink-faint font-medium px-2 py-0.5 rounded-md">
                쿠폰 전용
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Product 1: PDF */}
              <div 
                onClick={() => {
                  logAnalyticsEvent({
                    eventName: "open_shop_modal",
                    category: "conversion",
                    metadata: { target: "pdf", source: "group_dashboard_card" },
                    roomCode: code
                  });
                  setShopInitialTab("pdf");
                  setIsShopOpen(true);
                }}
                className="p-3.5 rounded-xl bg-sunken hover:bg-line flex flex-col justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-xs font-semibold text-ink block mb-1">AI 심층 리포트 (PDF)</span>
                  <p className="text-xs text-ink-faint leading-tight">개인 상세 사주명식과 평생 대운 감정서</p>
                </div>
                <div className="mt-3 text-right">
                  {isPdfUnlocked ? (
                    <span className="text-xs font-medium text-ink flex items-center justify-end gap-1"><Check className="w-3 h-3" /> 해금 완료</span>
                  ) : (
                    <span className="text-xs font-semibold text-ink">쿠폰으로 해금하기</span>
                  )}
                </div>
              </div>

              {/* Product 2: Secret Harmony */}
              <div 
                onClick={() => {
                  logAnalyticsEvent({
                    eventName: "open_shop_modal",
                    category: "conversion",
                    metadata: { target: "secret", source: "group_dashboard_card" },
                    roomCode: code
                  });
                  setShopInitialTab("secret");
                  setIsShopOpen(true);
                }}
                className="p-3.5 rounded-xl bg-sunken hover:bg-line flex flex-col justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-xs font-semibold text-ink block mb-1">비밀 인연·속마음</span>
                  <p className="text-xs text-ink-faint leading-tight">멤버 간 비밀 속궁합과 인연 등급(S~F)</p>
                </div>
                <div className="mt-3 text-right">
                  {isSecretUnlocked ? (
                    <span className="text-xs font-medium text-ink flex items-center justify-end gap-1"><Check className="w-3 h-3" /> 해금 완료</span>
                  ) : (
                    <span className="text-xs font-semibold text-ink">쿠폰으로 해금하기</span>
                  )}
                </div>
              </div>

              {/* Product 3: Group Analysis */}
              <div 
                onClick={() => {
                  logAnalyticsEvent({
                    eventName: "open_shop_modal",
                    category: "conversion",
                    metadata: { target: "group", source: "group_dashboard_card" },
                    roomCode: code
                  });
                  setShopInitialTab("group");
                  setIsShopOpen(true);
                }}
                className="p-3.5 rounded-xl bg-sunken hover:bg-line flex flex-col justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-xs font-semibold text-ink block mb-1">그룹 오행 총괄 분석</span>
                  <p className="text-xs text-ink-faint leading-tight">모임 전체 케미 매트릭스와 오행 지도</p>
                </div>
                <div className="mt-3 text-right">
                  {isGroupUnlocked ? (
                    <span className="text-xs font-medium text-ink flex items-center justify-end gap-1"><Check className="w-3 h-3" /> 해금 완료</span>
                  ) : (
                    <span className="text-xs font-semibold text-ink">쿠폰으로 해금하기</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsShopOpen(true)}
              className="w-full py-3 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Ticket className="w-3.5 h-3.5 text-ink-faint" />
              <span>확인권·초대 보상 센터 열기</span>
            </button>
          </div>
        </div>
        </>
        )}

        {/* Real-time Google Ads Slot / Premium promo */}
        <GoogleAds layout="banner" className="mb-4" hasContent={!!analysis && !pageLoading && members.length >= 2} />

        {/* Direct Footer Control */}
        <div className="pt-6 border-t border-line">
          <a
            href={`#/room/${code}`}
            className="w-full py-3.5 bg-sunken hover:bg-line text-ink text-center text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-ink-faint" />
            <span>모임방으로 돌아가기</span>
          </a>
        </div>

      </div>

      {isShopOpen && (
        <PremiumPaywall 
          isModal
          roomCode={code}
          initialTab={shopInitialTab}
          onClose={() => setIsShopOpen(false)}
          onStatusChange={syncUnlockStates}
          memberCount={members.length}
        />
      )}

      {/* Kakaotalk/In-App Browser Long Press Image Sharing Overlay */}
      {showLongPressGuide && capturedImgUrl && (
        <div className="fixed inset-0 z-[1100] bg-ink/60 flex flex-col items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 max-w-[360px] w-full text-center shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                이미지 공유 안내
              </h3>
              <button
                type="button"
                onClick={() => setShowLongPressGuide(false)}
                className="text-ink-faint hover:text-ink text-xs font-semibold cursor-pointer"
              >
                닫기
              </button>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed">
              카카오톡 등 인앱 브라우저에서는 이미지를 직접 전송할 수 없어요.
              <strong> 아래 이미지를 길게 누르면</strong> 카카오톡 전달 또는 이미지 저장을 할 수 있어요.
            </p>

            <div className="bg-sunken p-2 rounded-xl flex items-center justify-center">
              <img
                src={capturedImgUrl}
                alt="Captured Saju chemistry chart"
                referrerPolicy="no-referrer"
                className="max-h-[320px] rounded-xl object-contain cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLongPressGuide(false)}
                className="w-full py-2.5 rounded-xl bg-sunken hover:bg-line text-ink text-xs font-semibold transition-colors cursor-pointer"
              >
                닫고 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

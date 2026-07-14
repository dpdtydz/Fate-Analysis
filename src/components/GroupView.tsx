import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import GroupNetwork from "./GroupNetwork";
import LoadingOverlay from "./LoadingOverlay";
import { db, getAnonymousUser, auth, checkPremiumStatus, checkProductUnlock } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { Member, Room, CachedAnalysisResult } from "../types";
import { Sparkles, MessageSquare, TrendingUp, Download, Share2, Award, Heart, HelpCircle, ArrowLeft, RefreshCw, Crown, Smile } from "lucide-react";
import html2canvas from "html2canvas";
import PremiumPaywall from "./PremiumPaywall";

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

function generateCustomPrescription(m1: Member, m2: Member, score: number) {
  const m1Id = m1.id || "m1";
  const m2Id = m2.id || "m2";

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

  // Saju Relations computation
  if ((elem1 === "금" && elem2 === "목") || (elem1 === "목" && elem2 === "금")) {
    sajuTitle = "⚔️ 금목상쟁(金木相爭) - 현실주의와 영감의 긴장 기류";
    sajuDesc = `${m1.nickname}님의 단호하고 칼같이 예리한 안목(${gp1.name})과 ${m2.nickname}님의 진취적으로 뻗어 오르는 생명력(${gp2.name})이 만났습니다. 한쪽은 현실성이나 꼼꼼함을 먼저 보고, 다른 한쪽은 큰 흐름의 비전과 도전을 보기에 피드백 과정에서 예기치 못한 차가운 지적이나 자존심 충돌이 생길 수 있습니다.`;
    sajuRemedy = `💧 흘려보내는 물(수)의 완충 윤활유 작용이 필수입니다. 차가운 아이스 음료를 곁들이거나 수변을 조망할 수 있는 통유리 카페에서 소통하면 서로의 날카로운 텐션이 온화하게 풀려 영감을 공유하는 완벽한 추진력으로 승화됩니다.`;
  } else if ((elem1 === "화" && elem2 === "금") || (elem1 === "금" && elem2 === "화")) {
    sajuTitle = "🔥 화극금(火剋金) - 열정과 규율의 템포 마찰";
    sajuDesc = `${m1.nickname}님의 화끈하고 거침없는 사교적 기상(${gp1.name})과 ${m2.nickname}님의 정확하고 한 치 오차 없는 신중함(${gp2.name})이 대조를 이룹니다. 일의 타임라인을 당기려 하거나 마감의 완성도를 독촉할 때 불꽃 튀는 자존심 마찰이나 생각의 속도차가 부각될 수 있습니다.`;
    sajuRemedy = `⛰️ 뜨거운 열기를 품어 안정적으로 식혀줄 묵직한 흙(토) 기운을 채용하십시오. 차분한 황색 조명의 따뜻한 우드 인테리어 공간에서 소통하거나, 한식 디저트를 웃으며 건네며 소통의 호흡을 아늑하게 조율하면 갈등이 말끔히 해소됩니다.`;
  } else if ((elem1 === "수" && elem2 === "화") || (elem1 === "화" && elem2 === "수")) {
    sajuTitle = "🌊 수화상쟁(수화상쟁) - 사색과 리액션의 감정 엇박자";
    sajuDesc = `${m1.nickname}님의 사색적이고 차분히 가라앉는 신비로움(${gp1.name})과 ${m2.nickname}님의 즉흥적이고 솔직하며 밝은 표현력(${gp2.name})이 마주 보고 있습니다. 서로가 조율할 때 한쪽은 너무 즉흥적이고 리액션이 과하다 생각하고, 다른 한쪽은 너무 소극적이고 생각을 숨긴다 느껴 속마음 오해가 깃들기 쉽습니다.`;
    sajuRemedy = `🌳 물과 불 사이를 연결하는 싱그러운 나무(목) 기운의 그리너리 처방이 적합합니다. 식물이 가득한 정원형 베이커리나 공원 산책을 하며 생각을 정돈해 보세요. 싱그러운 잎사귀들이 서로의 감정적 텐션을 따뜻한 생명력으로 치환해 줍니다.`;
  } else if ((elem1 === "목" && elem2 === "토") || (elem1 === "토" && elem2 === "목")) {
    sajuTitle = "🌲 목극토(목극토) - 거침없는 질주와 경계 수호의 마찰";
    sajuDesc = `${m1.nickname}님의 속도감 넘치는 아이디어(${gp1.name})가 ${m2.nickname}님의 굳건하고 변함없는 원칙과 넓은 영토(${gp2.name})를 뚫고 진입하려는 모양새입니다. 상대방이 성실히 정립해 놓은 영역이나 일정 기준을 무심코 건드리거나, 주도권을 쥐려 할 때 은근한 대치 상태를 부를 소지가 있습니다.`;
    sajuRemedy = `🔥 나무가 흙을 다치지 않고 든든히 생해주게 이끄는 불(화)의 활력이 필요합니다. 조명이 활발하고 이국적인 맛집에서 가벼운 식사를 나누거나 화사한 공간에서 수다를 나눠 보세요. 붉고 밝은 에너지가 서로의 방어벽을 기적처럼 허물어 줍니다.`;
  } else if ((elem1 === "토" && elem2 === "수") || (elem1 === "수" && elem2 === "토")) {
    sajuTitle = "⛰️ 토극수(토극수) - 정밀한 가이드라인과 자율성의 대립";
    sajuDesc = `${m1.nickname}님의 무겁고 흔들림 없는 계획과 규칙론(${gp1.name})이 ${m2.nickname}님의 자유롭게 넘실거리며 지혜를 도모하려는 자율 기류(${gp2.name})를 제한하고 통제하려는 구도입니다. 소통할 때 한쪽은 답답한 구속감을, 다른 한쪽은 질서 없음에 불안정함을 표출하기 쉽습니다.`;
    sajuRemedy = `💎 흙과 물을 정화하고 정교하게 여과해 줄 맑은 바위인 쇠(금) 기운이 시급합니다. 세련되고 시크한 메탈릭 인테리어 공간에서 조율하거나, 애매한 구두 약속 대신 구체적인 숫자와 확실한 약속 문항을 텍스트로 깔끔하게 정리해 공지하는 것이 서로의 오해를 완벽하게 차단하는 비방입니다.`;
  } else if (elem1 === elem2) {
    sajuTitle = `🤝 비겁(비겁) 공명 - 같은 '${elem1}' 기운을 나누는 의리 콤비`;
    sajuDesc = `${m1.nickname}님과 ${m2.nickname}님은 동일한 '${elem1}'의 오행 원소(${gp1.name}와 ${gp2.name})를 지녀, 굳이 많은 설명을 늘어놓지 않아도 서로가 왜 그렇게 행동하고 판단하는지 직관적으로 깊게 이해하는 유대감과 의리를 지니고 있습니다.`;
    sajuRemedy = `📢 같은 기운이라 편안하지만 한편으론 자존심 대립 시 정면충돌할 수 있으니, 대화 전에 반드시 상대의 노고를 먼저 치하하는 "칭찬 선제권"을 발휘해 보십시오. 의리가 두 배로 증폭됩니다.`;
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
      sajuTitle = `✨ 오행 상생(${elem1}생${elem2}) - 무한한 자양분의 순환 지대`;
      sajuDesc = `${giver}님의 넘쳐나는 천연 자양분(${gElem} 기운)이 ${receiver}님의 원대한 꿈과 결실(${rElem} 기운)에 끊임없이 땔감이나 수분을 부어주는 환상적인 우주적 순환 배합입니다. 두 분이 대화할수록 사기가 솟구치고 서로의 잠재력이 최고조로 꽃을 피우게 됩니다.`;
      sajuRemedy = `🚀 서로의 재능을 빛내는 공동의 역할을 분담해 보세요. "네 비전 덕분에 더 용기를 낼 수 있었어"라는 솔직하고 명확한 존중의 감사를 자주 발설하는 것이 이 상생 흐름을 평생의 든든한 궤도로 고정해 줍니다.`;
    } else {
      sajuTitle = "🍀 오행의 온화한 흐름 - 유기적 수평 공존";
      sajuDesc = `${m1.nickname}님의 ${gp1.name}과 ${m2.nickname}님의 ${gp2.name}이 서로 자극이나 마찰 없이 물 흐르듯 잔잔하게 어우러지는 수평적이고 담백한 역학적 배치입니다. 가만히 있어도 내어주는 심리적 편안함과 든든한 동반자적 신뢰를 맛볼 수 있습니다.`;
      sajuRemedy = `🍵 기분 좋은 힐링 가득한 소소한 티타임이나 일상의 가벼운 취미를 함께 공유하며 결속력을 더해 보세요. 잔잔하게 깔려 있는 우주의 온화한 행운이 두 분의 앞길을 안전하고 따스하게 지켜줍니다.`;
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
        desc: `멤버(${unreg.join(", ")})님이 현대 심리 성향(MBTI)을 등록하지 않았으므로, 본 탭의 현대 성향심리 해독 부분은 활성화되지 않습니다. 프로필에서 MBTI를 등록하시면 두 분의 오행 충합과 1:1 성향 성정(T-F, J-P 대립과 완화 방안)이 이곳에 완전한 해독서로 자동 조립됩니다.`,
        remedy: `💡 [MBTI 등록 시 활성화] 두 분 모두 성향 프로필(MBTI) 정보를 등록한 후 해독을 진행하시면, 행동과학 관점의 정교한 1:1 대화 조율 비법과 상생 수칙이 이 자리에 자동으로 완벽 수록됩니다.`
      };
    }

    if (code1.length !== 4 || code2.length !== 4) {
      return {
        desc: "두 사람의 성향 프로필이 서로를 향해 자연스레 열려 있어 부드럽게 대화를 이어가기 좋은 구조입니다.",
        remedy: "서로 다른 소통 템포를 인정하고 대화를 한 템포 부드럽게 이어가는 자세가 상생을 가속화합니다."
      };
    }

    if (code1[2] !== code2[2]) {
      return {
        desc: `한쪽은 객관적 인과관계와 팩트 중심의 이성적 사고형(T)이고, 다른 한쪽은 관계적 화합과 감정적 가치 중심의 공감형(F)입니다. 소통할 때 한쪽은 '너무 차가워서 내 편을 안 들어준다'고 서운해하고, 한쪽은 '감정에 치우쳐 비합리적인 대화를 한다'고 답답해할 우려가 있습니다.`,
        remedy: `💬 [MBTI T-F 완화] 사고형(T)은 상대방이 제안이나 속상함을 토로할 때 즉각적인 분석이나 충고보다는 "많이 수고했다", "그럴 만하다"는 정서적 공감을 선제적으로 보충하고, 감정형(F)은 사고형의 이성적 솔루션을 본인에 대한 비난이 아니라 오직 더 나은 결과를 향한 애정의 보완책으로 유연하게 넘겨받는 조율법이 효과적입니다.`
      };
    }

    if (code1[3] !== code2[3]) {
      return {
        desc: `한쪽은 정교한 타임라인과 명확한 결론을 선호하는 체계적 판단형(J)이고, 다른 한쪽은 자율성과 임기응변, 새로운 대안의 자유로움을 사랑하는 유연한 인식형(P)입니다. 일을 전개하거나 일정을 정할 때 한쪽은 '불안정하고 무계획하다'고 우려하고, 다른 한쪽은 '지나치게 숨 막히게 숨 쉴 틈 없이 조인다'며 답답해할 수 있습니다.`,
        remedy: `💬 [MBTI J-P 완화] 판단형(J)은 상대에게 1분 단위 of 촘촘한 가이드라인을 요구하지 않고 큰 마감 기한과 목표만 설정해 주어 상대의 즉흥적 시너지를 보장하고, 인식형(P)은 계획이 중간에 변경되거나 딜레이가 우려되면 즉시 카톡이나 공지 등을 통해 투명하게 중간 진척 상황을 전달해 예측 가능성을 더해주어야 합니다.`
      };
    }

    if (code1[1] !== code2[1]) {
      return {
        desc: `한쪽은 구체적인 데이터와 과거의 풍부한 실무 경험을 신뢰하는 현실 감각형(S)이고, 다른 한쪽은 거시적인 맥락과 보이지 않는 가능성, 아이디어를 중시하는 통찰 직관형(N)입니다. 의견을 논할 때 한쪽은 '숲만 보느라 눈앞의 디테일과 현실성이 떨어진다'고 하고, 한쪽은 '너무 현실에 갇혀 새 도전의 스케일을 막는다'며 마찰할 소지가 존재합니다.`,
        remedy: `💬 [MBTI S-N 완화] 직관형(N)은 매력적인 아이디어를 선포할 때 반드시 구체적이고 바로 이행할 수 있는 '1차 실행안과 간단한 수치'를 보태어 말해주고, 감각형(S)은 상대의 영감에 대해 무조건 칼을 대기 전에 "비전의 스케일이 대단하네요!"라며 영감의 방향을 먼저 흔쾌히 승인해 주는 것이 좋습니다.`
      };
    }

    if (code1[0] !== code2[0]) {
      return {
        desc: `한쪽은 외부와의 적극적인 반응 속에서 생기를 얻는 활발한 외향형(E)이고, 다른 한쪽은 자기 내면의 사색과 조용히 충전되는 독립적인 내향형(I)입니다. 함께 지낼 때 소극적으로 보이거나, 너무 에너지를 많이 뺏겨 탈진되는 피로감을 느낄 수 있습니다.`,
        remedy: `💬 [MBTI E-I 완화] 외향형(E)은 상대가 말이 줄어들거나 독립적인 힐링의 태도를 취할 때 서운해하는 일 없이 '일시적 정돈 구간'임을 따뜻하게 보장해 주고, 내향형(I)은 한계가 오기 전에 "기운을 살짝만 충전한 뒤 다시 즐겁게 대화할게요!"라며 정중한 안내 템포를 지켜보세요.`
      };
    }

    return {
      desc: `두 분은 주요 심리 소통 방식이 고도로 일치하여, 구태여 많은 조율이나 피로감 없이 서로의 마음과 감정 궤적을 단번에 이해하는 아름다운 공감 코드를 공유하고 있습니다.`,
      remedy: `💬 [MBTI 동조화 수칙] 너무 닮은 탓에 가끔 예기치 않은 자존심 대립이 있을 때 정면충돌할 수 있으니, 평소 일상적인 유머 코드를 아낌없이 표출하고 애교 있는 리액션을 건네주어 편안함을 유지하세요.`
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

  const ziweiDesc = `🌌 명궁을 수호하는 주성 ${zStar1.name}(${zStar1.desc})과 ${zStar2.name}(${zStar2.desc})의 하늘 별자리 결합은 서로가 지닌 정신적 가치와 수완을 정중히 예우하라는 메세지를 품고 있습니다. 비합리적인 언쟁 대신 상대방의 독립성과 전문성을 깍듯이 인정해 주는 지적인 에티켓을 지킬 때, 이 성좌 조합은 일상뿐만 아니라 공동의 목표를 이룩해 주는 막강한 동료애(의리)로 급부상하게 됩니다.`;

  // 4. Western Zodiac analysis and its element pairing
  const zod1 = getWesternZodiac(m1.birth_date);
  const zod2 = getWesternZodiac(m2.birth_date);

  const getZodiacElement = (sign: string) => {
    if (["양자리", "사자자리", "사수자리"].includes(sign)) return "불(火) 원소";
    if (["황소자리", "처녀자리", "염소자리"].includes(sign)) return "흙(土) 원소";
    if (["쌍둥이자리", "천칭자리", "물병자리"].includes(sign)) return "공기(風) 원소";
    if (["게자리", "전갈자리", "물고기자리"].includes(sign)) return "물(水) 원소";
    return "에테르 원소";
  };

  const ze1 = getZodiacElement(zod1.name);
  const ze2 = getZodiacElement(zod2.name);

  const getZodiacRelation = (e1: string, e2: string, s1: string, s2: string) => {
    if (e1 === e2) {
      return {
        desc: `서로 같은 황도 12궁의 '${e1}'를 공유하고 있습니다. ${s1}와 ${s2}의 동조 공명은 서로가 세상을 받아들이는 감성과 유머 코드가 완벽히 흡사함을 가리킵니다.`,
        remedy: `🌌 [우주 별자리 처방] 서로 주파수가 같은 만큼 은은한 밤바다, 노을 뷰가 비치는 테라스나 모던하고 세련된 야간 분위기 속에서 대화해 보세요. 우주의 정서적 친밀도가 비약적으로 향상됩니다.`
      };
    }
    if ((e1 === "불(火) 원소" && e2 === "공기(風) 원소") || (e2 === "불(火) 원소" && e1 === "공기(風) 원소")) {
      return {
        desc: `열정의 불꽃(${e1 === "불(火) 원소" ? s1 : s2})과 불꽃을 자유롭게 번지게 이끄는 바람(${e1 === "공기(風) 원소" ? s1 : s2})의 배합입니다. 대화할수록 아이디어가 꼬리를 물며 창조적 에너지를 터뜨립니다.`,
        remedy: `🌌 [우주 별자리 처방] 활기찬 아이디어 회동을 위해 넓은 통창이 있는 개방적인 대형 카페나 도심 야외 명소를 활용해 소통해 보십시오. 무한한 아이디어가 시너지로 불타오릅니다.`
      };
    }
    if ((e1 === "흙(土) 원소" && e2 === "물(水) 원소") || (e2 === "흙(土) 원소" && e1 === "물(水) 원소")) {
      return {
        desc: `묵직하고 비옥한 대지(${e1 === "흙(土) 원소" ? s1 : s2})와 그 땅을 비옥하게 살려주는 단비(${e1 === "물(水) 원소" ? s1 : s2})의 만남입니다. 신뢰도가 최고 수준으로 정서적 깊이감이 대단히 깊습니다.`,
        remedy: `🌌 [우주 별자리 처방] 조용히 속마음을 나눌 수 있는 따스하고 아늑한 자연 친화적 찻집이나 프라이빗 다도 공간에서 대화해 보세요. 서로에게 그 어떤 곳보다 훌륭한 평화의 심리적 대피소가 마련됩니다.`
      };
    }
    return {
      desc: `서로 사뭇 다른 궤도의 우주 원소(${e1}의 ${s1}와 ${e2}의 ${s2})가 새로운 가치 조율을 꾀하는 흥미진진한 교차 배치입니다. 다소의 관점 차이가 도리어 독특하고 신선한 대안과 참신한 피드백을 이끌어냅니다.`,
      remedy: `🌌 [우주 별자리 처방] 대화 중 이질감이 들 때 다름을 지적하기보다 "우주의 공전 주기가 달라 신선한 자극이 되네요!"라며 상대의 독창적인 가치관을 포용력 있게 품어내는 넓은 도량을 보충해 보세요.`
    };
  };

  const zodiacRelation = getZodiacRelation(ze1, ze2, zod1.name, zod2.name);

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
    remedy2: `${mbtiRemedyText}[서양 점성학 가이드 - ${zod1.emoji}${zod1.name} × ${zod2.emoji}${zod2.name}]\n${zodiacRelation.desc}\n${zodiacRelation.remedy}`
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

function generateDynamicPairCompatibility(m1: Member, m2: Member): any {
  const getDeterministicHashScore = (str1: string, str2: string, seed: number, min = 65, max = 95) => {
    const combined = [str1, str2].sort().join("");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs((hash + seed) % (max - min + 1)) + min;
  };

  const m1Id = m1.id || "m1";
  const m2Id = m2.id || "m2";

  const g1 = m1.saju?.daymaster?.gan || "무토";
  const g2 = m2.saju?.daymaster?.gan || "기토";
  const elem1 = m1.saju?.daymaster?.element || "토";
  const elem2 = m2.saju?.daymaster?.element || "토";

  const GAN_META: Record<string, { nick: string, desc: string }> = {
    "갑목": { nick: "우직한 거목", desc: "곧고 굳센 기상과 진취적인 리더십" },
    "을목": { nick: "유연한 화초", desc: "끈질긴 친화력과 아름답고 부드러운 유연성" },
    "병화": { nick: "눈부신 태양", desc: "사방을 비추는 열정과 화끈하고 솔직한 사교성" },
    "정화": { nick: "따뜻한 등불", desc: "내면을 세심하게 읽는 세심한 지혜와 강한 집중력" },
    "무토": { nick: "광활한 태산", desc: "흔들리지 않는 든든한 신용과 묵직한 포용력" },
    "기토": { nick: "기름진 정원", desc: "주변을 알뜰살뜰 보살피는 포근함과 뛰어난 대처능력" },
    "경금": { nick: "강인한 원석", desc: "우직한 뚝심과 확실한 의리, 칼날 같은 단호함" },
    "신금": { nick: "반짝이는 보석", desc: "눈부신 지적 영민함과 세심하고 정교한 완벽주의" },
    "임수": { nick: "도도한 강물", desc: "웅장한 포용력과 물길처럼 흐르는 깊은 지혜" },
    "계수": { nick: "촉촉한 이슬", desc: "메마른 세상을 적시는 맑고 지혜로운 임기응변" }
  };

  const meta1 = GAN_META[g1] || { nick: `${elem1}기운`, desc: `${elem1}의 기운` };
  const meta2 = GAN_META[g2] || { nick: `${elem2}기운`, desc: `${elem2}의 기운` };

  let sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 11, 70, 96);
  let sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 33, 70, 96);
  let sajuLabel = "상생과 화합의 인연 조합";
  let sajuDesc = "";

  const isGeneratingSajuSupport = 
    (elem1 === "목" && elem2 === "화") || 
    (elem1 === "화" && elem2 === "토") || 
    (elem1 === "토" && elem2 === "금") || 
    (elem1 === "금" && elem2 === "수") || 
    (elem1 === "수" && elem2 === "목");   

  const isReceivingSajuSupport = 
    (elem2 === "목" && elem1 === "화") || 
    (elem2 === "화" && elem1 === "토") || 
    (elem2 === "토" && elem1 === "금") || 
    (elem2 === "금" && elem1 === "수") || 
    (elem2 === "수" && elem1 === "목");   

  const isSajuClash = 
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

  if (isGeneratingSajuSupport) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 17, 85, 97);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 41, 80, 95);
    sajuLabel = "오행상생의 창조적 파트너";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g1}의 기운이 ${g2}을 촉진해 주어, ${m1.nickname}님의 추진력이 ${m2.nickname}님의 성과로 부드럽게 이어지는 완벽한 창조적 흐름입니다.`;
  } else if (isReceivingSajuSupport) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 23, 80, 95);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 59, 85, 97);
    sajuLabel = "상생과 든든한 조력 기류";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g2}의 포근한 기운이 ${g1}을 든든하게 생(生)해 주어, 서로 신뢰가 대단히 깊고 함께 대화하면 심리적 안정감을 얻는 훌륭한 관계입니다.`;
  } else if (elem1 === elem2) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 15, 78, 92);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 45, 78, 92);
    sajuLabel = "거울을 보듯 통하는 소울 조합";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. 서로 같은 '${elem1}'의 오행 기운을 공유하여, 굳이 많은 설명을 하지 않아도 깊은 동질감과 끈끈한 유대감을 나누는 완벽한 동료입니다.`;
  } else if (isSajuClash) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 19, 65, 80);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 37, 65, 80);
    sajuLabel = "긴장 속에서 꽃피는 혁신 조합";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g1}과 ${g2}의 기운이 극(剋)하며 팽팽한 텐션을 형성하나, 적절한 거리와 예의를 유지하면 서로의 빈틈을 칼같이 메워주는 최고의 지적 자극제가 됩니다.`;
  } else {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 21, 75, 88);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 51, 75, 88);
    sajuLabel = "온화하고 편안한 상생 조합";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. 서로 간섭하지 않는 온화한 오행 기운의 조화로, 편안한 소통과 담백한 신뢰를 지켜나가는 물 흐르듯 잔잔한 인연 기류입니다.`;
  }

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

  let zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 25, 70, 95);
  let zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 65, 70, 95);
  let zodiacDesc = "";

  if (ze1 === ze2) {
    zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 29, 85, 96);
    zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 69, 85, 96);
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. 두 분 다 같은 '${ze1}'의 별자리 원소를 지녀 가치관과 유머 코드가 아주 흡사하며, 함께 있으면 어색함 없이 유쾌하고 명쾌한 소통이 가능합니다.`;
  } else if (
    (ze1 === "불" && ze2 === "공기") || (ze1 === "공기" && ze2 === "불") ||
    (ze1 === "흙" && ze2 === "물") || (ze1 === "물" && ze2 === "흙")
  ) {
    zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 31, 82, 94);
    zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 71, 82, 94);
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. ${z1.emoji}${z1.name}의 기운과 ${z2.emoji}${z2.name}의 기운이 활력 있게 만나 에너지를 지피거나 대지를 촉촉하게 가꿔주듯, 활기차고 성장을 자극하는 궁합입니다.`;
  } else {
    zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 33, 68, 85);
    zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 73, 68, 85);
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. 서로 사뭇 다른 우주 별자리 영역에 속해 있으나, 그렇기에 더욱 신선하고 평소 생각지 못한 각도에서 독창적인 아이디어와 신선한 관점을 제공해 줍니다.`;
  }

  let ziweiScore1to2 = getDeterministicHashScore(m1Id, m2Id, 44, 70, 94);
  let ziweiScore2to1 = getDeterministicHashScore(m1Id, m2Id, 88, 70, 94);
  
  const ziweiStars = [
    { name: "자미성", desc: "고귀한 중심을 잡아주는 리더의 기상" },
    { name: "거문성", desc: "명쾌하고 치밀하며 어두운 틈을 찾아내는 수완" },
    { name: "천부성", desc: "풍요롭고 너그러우며 다정히 품어주는 기량" },
    { name: "태양성", desc: "공명정대하고 시원시원하며 정의를 사랑하는 열정" },
    { name: "무곡성", desc: "한번 맺은 약속은 철저히 지키는 강직한 재물 성정" }
  ];
  
  const m1ZIndex = getDeterministicHashScore(m1Id, m2Id, 1, 0, ziweiStars.length - 1);
  const m2ZIndex = getDeterministicHashScore(m1Id, m2Id, 9, 0, ziweiStars.length - 1);
  const m1ZStar = ziweiStars[m1ZIndex];
  const m2ZStar = ziweiStars[m2ZIndex];
  
  let ziweiDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${ziweiScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${ziweiScore2to1}점. ${m1.nickname}님의 명궁 기저에 깃든 ${m1ZStar.name}(${m1ZStar.desc})과 ${m2.nickname}님의 ${m2ZStar.name}(${m2ZStar.desc})이 절묘한 별자리 기류로 만나, 서로의 자리를 빛내주고 존중해주는 품격 있는 관계를 지향합니다.`;

  let mbtiScore1to2 = 80;
  let mbtiScore2to1 = 80;
  let mbtiDesc = "";

  const code1 = m1.mbti?.trim().toUpperCase() || "";
  const code2 = m2.mbti?.trim().toUpperCase() || "";
  const isMbti1Ok = isMbtiRegistered(m1);
  const isMbti2Ok = isMbtiRegistered(m2);

  if (isMbti1Ok && isMbti2Ok) {
    let sameCount = 0;
    if (code1[0] === code2[0]) sameCount++; 
    if (code1[1] === code2[1]) sameCount++; 
    if (code1[2] === code2[2]) sameCount++; 
    if (code1[3] === code2[3]) sameCount++; 

    mbtiScore1to2 = 70 + sameCount * 7 + getDeterministicHashScore(m1Id, m2Id, 5, 0, 5);
    mbtiScore2to1 = 70 + sameCount * 7 + getDeterministicHashScore(m1Id, m2Id, 15, 0, 5);

    let synergyBullet = "";
    if (code1[2] === code2[2] && code1[2] === "T") {
      synergyBullet = "이성적이고 담백한 팩트 체크와 효율 중심 소통이 완벽하게 일치합니다.";
    } else if (code1[2] === code2[2] && code1[2] === "F") {
      synergyBullet = "따뜻하고 속 깊은 정서적 교감과 따뜻한 리액션이 어우러져 한없이 포근합니다.";
    } else {
      synergyBullet = "냉철한 피드백(T)과 따뜻한 심리적 위로(F)가 결합하여 지성과 감성을 고루 다듬어줍니다.";
    }

    let detailDiff = "";
    if (code1[1] !== code2[1]) {
      detailDiff += " 현실 감각(S)과 넓은 상상력(N)의 조화로 시너지를 내며,";
    }
    if (code1[3] !== code2[3]) {
      detailDiff += " 체계적인 정리(J)와 민첩하고 유연한 대처(P)가 어우러져 돌발 상황에 무척 강합니다.";
    }

    mbtiDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${mbtiScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${mbtiScore2to1}점. ${code1}와 ${code2} 성향이 만나,${detailDiff} ${synergyBullet}`;
  } else {
    mbtiScore1to2 = getDeterministicHashScore(m1Id, m2Id, 55, 75, 85);
    mbtiScore2to1 = getDeterministicHashScore(m1Id, m2Id, 85, 75, 85);
    const unreg = !isMbti1Ok ? m1.nickname : m2.nickname;
    mbtiDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${mbtiScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${mbtiScore2to1}점. ${unreg}님이 현대 심리 성향(MBTI)을 등록하지 않았으므로, 오직 천문 사주와 우주 별자리 데이터를 근간 삼아 입체적 관계를 다듬어 나갑니다.`;
  }

  const avgScore = Math.round((sajuScore1to2 + sajuScore2to1 + ziweiScore1to2 + ziweiScore2to1 + zodiacScore1to2 + zodiacScore2to1 + mbtiScore1to2 + mbtiScore2to1) / 8);

  // Dynamic label & description builder
  let finalLabel = "";
  let finalDesc = "";

  const getGanNick = (gan: string, elem?: string) => {
    const g = String(gan || "");
    if (g.includes("갑")) return "거목";
    if (g.includes("을")) return "화초";
    if (g.includes("병")) return "태양";
    if (g.includes("정")) return "등불";
    if (g.includes("무")) return "태산";
    if (g.includes("기")) return "정원";
    if (g.includes("경")) return "원석";
    if (g.includes("신")) return "보석";
    if (g.includes("임")) return "강물";
    if (g.includes("계")) return "이슬";

    const e = String(elem || "");
    if (e.includes("목") || g.includes("목")) return "목 기운";
    if (e.includes("화") || g.includes("화")) return "화 기운";
    if (e.includes("토") || g.includes("토")) return "토 기운";
    if (e.includes("금") || g.includes("금")) return "금 기운";
    if (e.includes("수") || g.includes("수")) return "수 기운";

    return "고유 기운";
  };

  const nick1 = getGanNick(g1, elem1);
  const nick2 = getGanNick(g2, elem2);

  if (isGeneratingSajuSupport) {
    const labelOptions = [
      `${nick1}과 ${nick2}의 상생적 영감`,
      `오행상생의 창조적 파트너십`,
      `${z1.emoji}${z1.name}와 ${z2.emoji}${z2.name}의 시너지 기류`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m1.nickname}님의 ${meta1.nick} 성정(${meta1.desc})이 ${m2.nickname}님의 ${meta2.nick} 성정(${meta2.desc})을 촉진하여 기적 같은 성장을 만들어내는 흐름입니다. 오행상 ${elem1}의 활기찬 에너지가 ${elem2}을 생(生)하며 촉발하여, 대화를 나눌수록 창조적인 영감이 끝없이 솟구치는 환상적인 파트너십이 발휘됩니다.`,
      `${m1.nickname}님의 진취적인 기획력과 ${m2.nickname}님의 안정적인 디테일이 합을 맞춰 하나의 아름다운 작품을 완성해 가듯, 두 분이 힘을 합쳤을 때 상상을 초월하는 완성도와 시너지를 보여주는 아름다운 궁합입니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];

  } else if (isReceivingSajuSupport) {
    const labelOptions = [
      `${nick2}과 ${nick1}의 든든한 상생 기류`,
      `따뜻한 조력과 편안한 교감`,
      `${z2.emoji}${z2.name}가 품어주는 우주적 연대`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m2.nickname}님의 포근하고 넓은 ${meta2.nick} 기운이 ${m1.nickname}님의 섬세한 ${meta1.nick} 성정을 든든하게 받쳐주고 생(生)해주는 완벽한 조력의 기류입니다. 두 분이 함께하면 일상에서 쌓였던 불안과 피로가 마법처럼 해소되며 서로에 대한 대단한 신뢰가 굳건하게 형성됩니다.`,
      `${m2.nickname}님의 깊은 포용력이 ${m1.nickname}님의 무한한 가능성을 자상하게 이끌어내어 주는 기라성 같은 인연입니다. 힘든 고난이 찾아와도 서로를 향한 변치 않는 위로와 격려를 아끼지 않는 단단하고 돈독한 상생 조합입니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];

  } else if (elem1 === elem2) {
    const labelOptions = [
      `같은 ${elem1} 기운의 소울 메이트`,
      `거울을 보듯 깊이 공감하는 소통`,
      `${z1.emoji}${z1.name}와 ${z2.emoji}${z2.name}의 깊은 우정`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `서로 같은 '${elem1}'의 오행 원소를 풍부하게 공유하고 있어, 처음 만난 순간부터 영혼 깊숙이 통하는 대단한 동질감을 경험하는 조합입니다. 굳이 말 한마디를 나누지 않아도 눈빛만으로 상대의 의도와 마음을 꿰뚫어 보며, 변함없이 곁을 지켜주는 든든한 동반자가 되어줍니다.`,
      `서로 닮은꼴의 성향과 가치관을 지니고 있어 같은 방향을 바라보고 시원시원하게 나아가는 영혼의 단짝입니다. 갈등의 여지가 지극히 적으며, 서로에게 거울 같은 자극을 주며 동반 성장할 수 있는 완벽한 화합의 파트너십을 보여줍니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];

  } else if (isSajuClash) {
    const labelOptions = [
      `${nick1}과 ${nick2}의 긴장 속 혁신 케미`,
      `서로의 맹점을 완벽하게 메우는 퍼즐`,
      `뜨겁고 날카로운 자극의 관계 기류`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m1.nickname}님의 ${meta1.nick}과 ${m2.nickname}님의 ${meta2.nick}이 오행상 서로 극(剋)하며 은근한 텐션을 형성합니다. 하지만 이는 갈등이 아닌 서로의 맹점을 날카롭게 깨워주는 지적 자극제가 되며, 적절한 존중을 유지할 때 세상 어떤 조합보다 완벽하게 서로를 메워주는 훌륭한 퍼즐이 됩니다.`,
      `서로 다른 시선과 가치관을 지녀 가끔씩 신선한 충격을 나누지만, 오히려 그렇기 때문에 평소에 생각해내지 못한 전혀 다른 창의적 각도의 해결책을 이끌어내며, 지적인 성장과 혁신을 최고치로 유도하는 파트너입니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];

  } else {
    const labelOptions = [
      `온화함 속에서 은은히 피어나는 신뢰`,
      `담백하고 편안한 우주 메이트`,
      `${z1.emoji}${z1.name}와 ${z2.emoji}${z2.name}의 온화한 화합`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `서로에게 불필요한 간섭과 요구를 하지 않으며, 한없이 편안하고 담백한 흐름을 지속하는 오행 조화입니다. 서로의 속도와 경계를 온전하게 존중하면서도, 보이지 않는 곳에서 항상 서로를 응원하며 오랜 신뢰를 묵직하게 쌓아 나가는 훌륭한 파트너십입니다.`,
      `${z1.name}와 ${z2.name}의 유연한 기조가 사주는 온화함과 결합하여, 거친 파도가 없는 잔잔한 바다처럼 편안하게 동행할 수 있는 궁합을 형성합니다. 서로에게 훌륭한 쉼터이자 영감이 되어주며 안정감 있는 전진을 이끕니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];
  }

  return {
    member_id_1: m1Id,
    member_id_2: m2Id,
    score: avgScore,
    label: finalLabel,
    description: finalDesc,
    saju: {
      score_1_to_2: sajuScore1to2,
      score_2_to_1: sajuScore2to1,
      description: sajuDesc
    },
    ziwei: {
      score_1_to_2: ziweiScore1to2,
      score_2_to_1: ziweiScore2to1,
      description: ziweiDesc
    },
    mbti: {
      score_1_to_2: mbtiScore1to2,
      score_2_to_1: mbtiScore2to1,
      description: mbtiDesc
    },
    zodiac: {
      score_1_to_2: zodiacScore1to2,
      score_2_to_1: zodiacScore2to1,
      description: zodiacDesc
    }
  };
}

interface GroupViewProps {
  code: string;
}

export default function GroupView({ code }: GroupViewProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [analysis, setAnalysis] = useState<CachedAnalysisResult | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [showAllPairs, setShowAllPairs] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isGroupUnlocked, setIsGroupUnlocked] = useState(false);
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [isPdfUnlocked, setIsPdfUnlocked] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState<"pdf" | "secret" | "group">("group");

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

  // Score to color helper
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#f97316] border-[#f97316]/30 bg-[#f97316]/10";
    if (score >= 70) return "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10";
    if (score >= 50) return "text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10";
    if (score >= 30) return "text-[#fb923c] border-[#fb923c]/30 bg-[#fb923c]/10";
    return "text-[#f87171] border-[#f87171]/30 bg-[#f87171]/10";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-[#f97316]";
    if (score >= 70) return "bg-[#4ade80]";
    if (score >= 50) return "bg-[#facc15]";
    if (score >= 30) return "bg-[#fb923c]";
    return "bg-[#f87171]";
  };

  // Fetch Room, Members, and check for existing Cached Analysis
  const performDataFetch = async () => {
    setPageLoading(true);
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

      // 3. Check for existing analysis in rooms/{code}/analysis/result
      const analysisSnap = await getDoc(doc(db, "rooms", code, "analysis", "result"));
      console.log("Analysis snap exists:", analysisSnap.exists(), "Data:", analysisSnap.data());

      if (analysisSnap.exists()) {
        const cachedData = analysisSnap.data() as CachedAnalysisResult;
        
        // Ensure cache personal data is present and matches the updated essence/talent schema structure
        const firstPersonal = cachedData && cachedData.personal && Object.values(cachedData.personal)[0];
        const hasNewSchema = firstPersonal && firstPersonal.four_areas && 'essence' in firstPersonal.four_areas;

        const isCacheValid = cachedData && 
                             cachedData.group && 
                             typeof cachedData.group.overall_score === "number" && 
                             cachedData.group.overall_score > 0 && 
                             cachedData.group.description &&
                             cachedData.group.atmosphere &&
                             cachedData.group.synergy_tips &&
                             cachedData.pairs &&
                             cachedData.pairs.length > 0 &&
                             cachedData.personal &&
                             Object.keys(cachedData.personal).length > 0 &&
                             hasNewSchema;

        if (isCacheValid) {
          console.log("Cached group analysis found, loading directly.");
          setAnalysis(cachedData);
          setPageLoading(false);
        } else {
          console.log("Cached group analysis was incomplete, corrupted or 0 score. Re-triggering AI Analysis...");
          await triggerAIAnalysis(mList, rData.title);
        }
      } else {
        // No cache: Trigger Gemini AI aggregation analysis immediately
        console.log("No cache found. Compiling members and invoking analyze API.");
        await triggerAIAnalysis(mList, rData.title);
      }

    } catch (err: any) {
      console.error("Failed to load group details:", err);
      setError(err.message || "기록을 조율하는 와중 장치간 장애가 일어났습니다.");
      setPageLoading(false);
    }
  };

  // Call backend API /api/analyze and write to Firestore for caching (eliminates N^2 bills)
  const triggerAIAnalysis = async (currentMembers: Member[], roomTitle: string) => {
    setAnalyzing(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room_title: roomTitle, members: currentMembers }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errObj = await response.json().catch(() => ({}));
          throw new Error(errObj.error || "Gemini 인공지능 명식 조율에 실패했습니다.");
        } else {
          throw new Error("서버 혼잡 또는 네트워크 일시적 타임아웃이 발생했습니다. 잠시 후 상단의 업데이트 버튼을 눌러 다시 시도해 주세요!");
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("서버 혼잡 또는 네트워크 일시적 타임아웃이 발생했습니다. 잠시 후 상단의 업데이트 버튼을 눌러 다시 시도해 주세요!");
      }

      const aiData = await response.json();

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
      // Detailed error logging to help debug
      if (err.response) {
        console.error("AI response error:", await err.response.text());
      }
      setError(err.message || "AI 사주 융합 풀이 완료에 난조가 생겼습니다. 재시도해 주세요.");
    } finally {
      setAnalyzing(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    performDataFetch();
  }, [code]);

  // Image capture & sharing utilizing html2canvas
  const handleShareResult = async () => {
    if (!captureRef.current) return;
    setShareStatus("캡처화면 준비 중...");

    try {
      // Create high-contrast canvas capture
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, // Double resolution for ultra crisp vector render
        backgroundColor: "#FAF7F2",
        useCORS: true,
        logging: false,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("캡처 이미지 생성에 난처함이 벌어졌습니다.");
          setShareStatus("");
          return;
        }

        const file = new File([blob], `saju_chemistry_${code}.png`, { type: "image/png" });

        // Mobile Native Share Check
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${room?.title || "모임"} 사주 종합 궁합`,
              text: "우리 모임 사주 궁합인망도를 확인해 보세요! ☯",
            });
            setShareStatus("인연 공유완료!");
          } catch (shareErr) {
            console.log("Navigator share failed, fallback downloads:", shareErr);
            triggerDownload(canvas);
          }
        } else {
          // Desktop Fallback: Download file directly
          triggerDownload(canvas);
        }
      }, "image/png");

    } catch (err) {
      console.error("Failed to capture group dashboard:", err);
      setShareStatus("캡처 오류 발생");
    } finally {
      setTimeout(() => setShareStatus(""), 2000);
    }
  };

  const triggerDownload = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `saju_group_chemistry_${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareStatus("결과 이미지 저장됨!");
  };

  if (pageLoading || analyzing) {
    return (
      <LoadingOverlay
        message={
          analyzing
            ? "단원들의 사주를 총합 대조하는 중..."
            : "인연방의 명부 기록을 수소문하는 중..."
        }
      />
    );
  }

  if (error || !room || !analysis) {
    return (
      <Layout title="중합 궁합 오류" showHomeButton>
        <div className="text-center py-12 space-y-4">
          <div className="text-3xl text-[#C0392B]">⚠️</div>
          <p className="text-sm font-semibold text-[#C0392B] leading-relaxed">
            {error || "궁합 분석 결과를 도출할 수 없었습니다."}
          </p>
          <div className="flex flex-col space-y-3 max-w-xs mx-auto pt-2">
            <button
              onClick={performDataFetch}
              className="flex items-center justify-center space-x-1.5 py-3.5 bg-[#C0392B] text-white rounded-xl font-serif font-bold text-xs tracking-wider cursor-pointer shadow-lg shadow-[#C0392B]/15 hover:bg-[#A93226]"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>우주의 천기 다시 연결해 보기</span>
            </button>
            <a
              href={`#/room/${code}`}
              className="inline-block py-3 bg-[#2C3E50] text-[#FAF7F2] rounded-xl text-xs font-serif font-bold hover:bg-[#1A252F] cursor-pointer"
            >
              모임방 목록으로 대피
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
  const upgradedPairs = analysis.pairs.map((p) => {
    const m1 = findMemberObj(p.member_id_1);
    const m2 = findMemberObj(p.member_id_2);
    const isGeneric = p.label === "상생과 화합의 인연 메이트" ||
                      p.label === "상생과 화합의 인연 조합" ||
                      (p.description && p.description.includes("서로 다른 기운이 자연스럽게 합을 이루는 조화로운 인연입니다"));
    if (m1 && m2 && isGeneric) {
      return generateDynamicPairCompatibility(m1, m2);
    }
    return p;
  });

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
            className="inline-flex items-center text-xs font-medium text-[#8C7B6E] hover:text-[#C0392B] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            모임방 메인 대기실로 돌아가기
          </a>
          <button
            onClick={() => triggerAIAnalysis(members, room.title)}
            className="inline-flex items-center text-xs font-semibold text-[#C0392B] hover:text-[#A93226] transition bg-white border border-[#D6CCBC] px-3 py-1.5 rounded-xl shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            <span>정밀 AI 재해석</span>
          </button>
        </div>

        {/* --- SHARING CAPTURE TARGET START --- */}
        <div id="capture-target" ref={captureRef} className="p-5 bg-[#FAF7F2] border border-[#D6CCBC] rounded-[24px] space-y-5 shadow-sm">
          
          {/* Group Header Title */}
          <div className="text-center space-y-1.5 pt-1">
            <span className="text-[9px] bg-[#C0392B] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-[0.2em] font-sans">
              인연명당
            </span>
            <h3 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight">
              {room.title}
            </h3>
            <p className="text-[10px] text-[#8C7B6E] font-medium tracking-tight">
              천문 조율 일자 : {new Date(analysis.created_at).toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Group Compatibility Rating Card */}
          <div className="bg-white border border-[#D6CCBC] p-5 rounded-2xl text-left space-y-4 relative shadow-xs">
            <span className="text-[10px] text-[#8C7B6E] font-bold uppercase tracking-[0.15em] block text-center">우리 모임 종합 인연 지수</span>
            
            <div className="flex justify-center items-center space-x-4">
              <div className={`w-20 h-20 rounded-full flex flex-col justify-center items-center text-white shrink-0 shadow-md ${getScoreBg(analysis.group.overall_score)}`}>
                <span className="text-[9px] font-serif font-bold leading-none mb-0.5 uppercase">인연도</span>
                <span className="text-2xl font-bold font-sans leading-none">{analysis.group.overall_score}</span>
              </div>
              <div className="text-left py-1">
                <span className="font-serif font-bold text-sm text-[#C0392B] block">
                  🎨 {analysis.group.title}
                </span>
                <span className="text-[10px] text-[#8C7B6E] font-bold block mt-1">
                  분위기 : {analysis.group.atmosphere}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8E0D0] text-left text-xs text-[#5A4D41] leading-relaxed font-semibold">
              <span className="font-bold block text-[#2C3E50] mb-1 font-serif">☯ 전체 기운 요강 :</span>
              {analysis.group.description}
            </div>

            <div className="p-4 bg-[#FAF8F5]/80 border border-[#D6CCBC] rounded-xl text-left text-[11px] text-[#8C7B6E] leading-relaxed">
              <span className="font-bold text-[#C0392B] block mb-1 font-serif">💡 화합 극대화 비책 (시너지 팁) :</span>
              {analysis.group.synergy_tips}
            </div>
          </div>

          {/* SVG Circular Network Graph */}
          <GroupNetwork members={members} pairs={analysis.pairs} isPremium={isGroupUnlocked} />

          {/* NEW PREMIUM FEATURE: 모임 구성원 비밀 인연 등급 & 속마음 상성 해독권 Dashboard */}
          <div id="secret-dynamics-panel" className="bg-white border border-[#D6CCBC] p-5 rounded-2xl text-left space-y-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-2.5">
              <div className="flex items-center space-x-1.5">
                <span className="text-base">🔓</span>
                <h4 className="font-serif text-xs font-bold text-[#2C3E50] tracking-tight">
                  👥 비밀 인연 등급 & 속마음 상성 지도 (은밀한 내면 역학 해독)
                </h4>
              </div>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                {isSecretUnlocked ? "👑 PREMIUM UNLOCKED" : "🔒 PREMIUM GATED"}
              </span>
            </div>

            <div className={!isSecretUnlocked ? "filter blur-[3.5px] opacity-35 select-none pointer-events-none space-y-4" : "space-y-4"}>
              {/* S-등급 천생연분 짝꿍 추천 */}
              {(() => {
                const sGradePairs = sortedPairs.filter(p => p.score >= 88);
                const aGradePairs = sortedPairs.filter(p => p.score >= 80 && p.score < 88);

                return (
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-amber-900 font-extrabold uppercase font-sans tracking-wider block">
                      💖 모임 내 가장 조화로운 운명적 S등급 짝꿍 조합
                    </span>
                    {sGradePairs.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {sGradePairs.slice(0, 3).map((p, idx) => {
                          const m1 = findMemberObj(p.member_id_1);
                          const m2 = findMemberObj(p.member_id_2);
                          if (!m1 || !m2) return null;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{m1.character_emoji} {m1.nickname}</span>
                                <span className="text-[#8C7B6E] font-sans">↔</span>
                                <span className="text-sm font-semibold">{m2.character_emoji} {m2.nickname}</span>
                              </div>
                              <span className="text-xs font-black text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded-lg">
                                👑 {p.score >= 95 ? "최상의 S+ 등급" : "S 등급"} ({p.score}점)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-[11px] text-gray-500 font-medium">
                        모임 내 S등급(90점 이상) 찰떡 궁합이 존재하지 않습니다. 가장 조화로운 A등급 조합({aGradePairs[0]?.score || 78}점)을 참고해 보세요!
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 속마음 상성 지도 다이어그램 (Grid listing grades of all pairs) */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-amber-900 font-extrabold uppercase font-sans tracking-wider block">
                  🔮 오행 충/합 기반 은밀한 속마음 궤적도 (전체 등급 서열표)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {sortedPairs.map((p, idx) => {
                    const m1 = findMemberObj(p.member_id_1);
                    const m2 = findMemberObj(p.member_id_2);
                    if (!m1 || !m2) return null;

                    // Get Grade
                    let grade = "C";
                    let gradeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                    if (p.score >= 90) {
                      grade = "S";
                      gradeColor = "text-amber-800 bg-amber-50 border-amber-200";
                    } else if (p.score >= 80) {
                      grade = "A";
                      gradeColor = "text-rose-700 bg-rose-50 border-rose-200";
                    } else if (p.score >= 70) {
                      grade = "B";
                      gradeColor = "text-orange-700 bg-orange-50 border-orange-200";
                    } else if (p.score >= 60) {
                      grade = "C";
                      gradeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                    } else if (p.score >= 50) {
                      grade = "D";
                      gradeColor = "text-blue-700 bg-blue-50 border-blue-200";
                    } else {
                      grade = "F";
                      gradeColor = "text-gray-600 bg-gray-50 border-gray-200";
                    }

                    return (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white border border-[#E8E0D0]/80 rounded-xl text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate text-[#5A4D41] font-semibold">{m1.nickname} × {m2.nickname}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-[#8C7B6E] font-mono">{p.score}점</span>
                          <span className={`text-[10px] font-black w-6 h-6 rounded-full border flex items-center justify-center font-serif leading-none ${gradeColor}`}>
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
                  <div className="p-3.5 bg-rose-50/30 border border-rose-200/50 rounded-xl space-y-1.5">
                    <span className="text-[10px] text-rose-800 font-extrabold uppercase font-sans tracking-wider block">
                      🛡️ 성향 충돌 방지 맞춤형 비밀 완충 수칙 ({m1.nickname} × {m2.nickname} 밀착 처방)
                    </span>
                    <p className="text-[10px] text-[#5A4D41] leading-relaxed font-semibold">
                      두 분은 우주적 천간 기류상 생각이 직접 부딪힐 수 있는 오행 대립 구간을 안고 있습니다. 
                      의견 조율 시 단답형 톡방 소통을 지양하고 부드럽고 예의 깊은 '음료 대화법'이나 칭찬 선행 대화를 가치있게 활용해 보세요. 
                      상대의 다른 기운을 나를 보완해주는 윤활유처럼 소중히 여김이 최상의 비밀 완충 전략입니다.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Locked Gateway Cover */}
            {!isSecretUnlocked && (
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/10 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white/95 border border-amber-300 rounded-2xl p-5 shadow-xl max-w-sm space-y-3.5">
                  <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-3xs">
                    <Crown className="w-5 h-5 text-amber-600 fill-amber-300" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-serif text-xs font-bold text-[#2C3E50]">
                      🔑 모임 구성원 비밀 인연 등급 & 속마음 상성 해독권
                    </h5>
                    <p className="text-[10px] text-[#8C7B6E] leading-relaxed font-semibold">
                      모임 전체 멤버들의 은밀한 내면 서열 등급(S, A, B, C, D, F)과 궤적도, 그리고 성향 충돌을 완벽하게 예방하는 비밀 완충 수칙 대시보드가 즉시 영구 개방됩니다!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShopInitialTab("secret");
                      setIsShopOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded-lg text-[10px] font-serif font-extrabold hover:shadow-md hover:scale-[1.01] transition cursor-pointer"
                  >
                    👑 비밀 인연·상성 해금 상점 열기
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
        {/* --- SHARING CAPTURE TARGET END --- */}

        {/* Share Action bar in Hanji style */}
        <div className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-5 rounded-2xl flex flex-col items-center justify-center space-y-3.5 shadow-xs text-center">
          <p className="text-[11px] text-[#8C7B6E] font-medium leading-relaxed font-sans">
            명당인망도 캡처화면을 단톡방이나 지인분들께 손쉽게 보여줄 수 있습니다.
          </p>
          <button
            id="share-dashboard-btn"
            onClick={handleShareResult}
            className="w-full flex items-center justify-center space-x-2 py-4 bg-[#C0392B] text-white font-serif font-bold text-xs tracking-widest rounded-xl border border-transparent hover:bg-[#A93226] hover:scale-[0.99] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#C0392B]/20 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareStatus || "종합 궁합 이미지 결과 공유 / 저장"}</span>
          </button>
        </div>

        {/* 1:1 Chemical lists details */}
        <div className="space-y-4 text-left">
          <div className="flex flex-col space-y-1 border-b border-[#E8E0D0] pb-2 text-left">
            <div className="flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-[#C0392B]" />
              <h4 className="font-serif text-sm font-bold text-[#2C3E50]">
                {isGroupUnlocked ? `👑 멤버 간 1:1 개별 인연 케미 (전수 ${sortedPairs.length}쌍 해금됨)` : "멤버 간 1:1 개별 인연 케미 (핵심 3쌍)"}
              </h4>
            </div>
            <p className="text-[10px] text-[#8C7B6E] font-medium leading-relaxed">
              {isGroupUnlocked 
                ? `👑 프리미엄 회원 등급 혜택으로 모임 내 전체 ${sortedPairs.length}쌍의 사주/자미/MBTI 융합 궁합 해설서가 무제한 개방되었습니다.`
                : `전체 ${sortedPairs.length}쌍 중, 우주의 흐름 상 가장 기운이 강하게 얽힌 최고 궁합 2쌍과 서로 조심과 양보가 필요한 1쌍을 엄선했습니다. (개별 멤버 정보방에서는 본인의 모든 인연 궁합을 확인할 수 있습니다.)`
              }
            </p>
          </div>

          <div id="pairs-list" className="space-y-4">
            {sortedPairs.length === 0 && (
              <div className="text-center py-8 text-sm text-[#8C7B6E] font-medium border border-dashed border-[#D6CCBC] rounded-xl">
                분석된 인연 케미 데이터가 없습니다. (데이터 오류 가능성)
                <button
                  onClick={() => triggerAIAnalysis(members, room.title)}
                  className="block mx-auto mt-3 px-4 py-2 bg-[#C0392B] text-white rounded-lg text-xs"
                >
                  분석 재시도
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
                  className={`border p-4.5 rounded-2xl space-y-3.5 shadow-xs text-left ${
                    isBest ? 'border-amber-400 bg-amber-50/50' : isWorst ? 'border-sky-400 bg-sky-50/50' : 'border-[#D6CCBC] bg-white'
                  }`}
                >
                  {/* Pair header participants */}
                  <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-[#2C3E50] min-w-0 flex-1">
                      <span className="p-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] text-sm leading-none shrink-0">
                        {m1.character_emoji}
                      </span>
                      <span className="truncate">{m1.nickname}</span>
                      <span className="text-[#8C7B6E] font-sans font-normal shrink-0">x</span>
                      <span className="p-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] text-sm leading-none shrink-0">
                        {m2.character_emoji}
                      </span>
                      <span className="truncate">{m2.nickname}</span>
                    </div>

                    {/* Score & Special Status Badge Group */}
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {isBest && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                          🏆 최고의 케미
                        </span>
                      )}
                      {isWorst && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200 shrink-0">
                          ⚠️ 앙숙의 기운
                        </span>
                      )}
                      <span className="text-xs font-serif font-bold text-[#FAF7F2] bg-[#C0392B] px-2.5 py-0.5 rounded-lg shrink-0">
                        {pair.score}점
                      </span>
                    </div>
                  </div>

                  {/* Elegant Full-width humorous label callout */}
                  <div className={`px-3 py-2 border rounded-xl text-center text-xs font-bold leading-normal shadow-3xs ${getScoreColor(pair.score)}`}>
                    ✨ {pair.label}
                  </div>

                  {/* Chemistry description of 2-3 sentences */}
                  <p className="text-xs text-[#5A4D41] leading-relaxed font-semibold">
                    {pair.description}
                  </p>

                  {/* Detailed 4-Area Compatibility Breakdown */}
                  {pair.saju && pair.ziwei && pair.mbti && pair.zodiac && (
                    <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#FAF0DE] space-y-3">
                      <h4 className="text-[10px] font-extrabold text-[#C0392B] uppercase tracking-wider flex items-center gap-1">
                        🔑 4대 영역별 상세 궁합 분석 {!isSecretUnlocked && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-sans font-bold flex items-center gap-0.5"><Crown className="w-2.5 h-2.5 fill-amber-300" /> LOCK</span>}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {/* Saju */}
                        <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-1.5 shadow-2xs relative overflow-hidden">
                          <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1">
                            <span className="font-bold text-[11px] text-[#2C3E50]">☯️ 사주 궁합 분석</span>
                            {isSecretUnlocked ? (
                              <span className="text-[9px] font-extrabold text-[#C0392B] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                평균 {Math.round((pair.saju.score_1_to_2 + pair.saju.score_2_to_1) / 2)}점
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                🔒 LOCK
                              </span>
                            )}
                          </div>
                          {isSecretUnlocked ? (
                            <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/40 font-medium">
                              {pair.saju.description}
                            </p>
                          ) : (
                            <div className="relative pt-0.5">
                              <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                두 사람의 명리학적 사주 오행 분포와 상호 지지 형충파해 작용을 융합 대조한 기운 소통과 전반적인 궁합 해독 결과입니다.
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                                <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-1.5 py-0.5 rounded shadow-3xs">
                                  🔒 프리미엄 상세 해설
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ziwei */}
                        <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-1.5 shadow-2xs relative overflow-hidden">
                          <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1">
                            <span className="font-bold text-[11px] text-[#2C3E50]">🔮 자미두수 궁합 분석</span>
                            {isSecretUnlocked ? (
                              <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                평균 {Math.round((pair.ziwei.score_1_to_2 + pair.ziwei.score_2_to_1) / 2)}점
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                🔒 LOCK
                              </span>
                            )}
                          </div>
                          {isSecretUnlocked ? (
                            <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-indigo-500/40 font-medium">
                              {pair.ziwei.description}
                            </p>
                          ) : (
                            <div className="relative pt-0.5">
                              <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                전생의 부부궁과 인연 궁의 천문 명반 교차 매핑 분석을 통해 서로의 혼과 깊은 의식이 소통하는 깊이를 해설한 리포트입니다.
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                                <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-1.5 py-0.5 rounded shadow-3xs">
                                  🔒 프리미엄 상세 해설
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* MBTI */}
                        <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-1.5 shadow-2xs relative overflow-hidden">
                          {isMbtiRegistered(m1) && isMbtiRegistered(m2) ? (
                            <>
                              <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1">
                                <span className="font-bold text-[11px] text-[#2C3E50]">🧠 MBTI 성향 궁합 분석</span>
                                {isSecretUnlocked ? (
                                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    평균 {Math.round((pair.mbti.score_1_to_2 + pair.mbti.score_2_to_1) / 2)}점
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    🔒 LOCK
                                  </span>
                                )}
                              </div>
                              {isSecretUnlocked ? (
                                <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-emerald-500/40 font-medium">
                                  {pair.mbti.description}
                                </p>
                              ) : (
                                <div className="relative pt-0.5">
                                  <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                    현대 MBTI 가치관 결합 및 커뮤니케이션 성향 호환도 해독, 갈등 발생 원인과 해결 수칙 분석 결과입니다.
                                  </p>
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                                    <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-1.5 py-0.5 rounded shadow-3xs">
                                      🔒 프리미엄 상세 해설
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1">
                                <span className="font-bold text-[11px] text-[#2C3E50]">🧠 MBTI 성향 궁합 분석</span>
                                <span className="text-[9px] text-[#8C7B6E] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                  미등록
                                </span>
                              </div>
                              <p className="text-[10px] text-[#8C7B6E] leading-relaxed pl-1.5 border-l border-gray-300 font-medium italic">
                                {!isMbtiRegistered(m1) && !isMbtiRegistered(m2)
                                  ? `두 멤버(${m1?.nickname}, ${m2?.nickname}) 모두 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없습니다.`
                                  : !isMbtiRegistered(m1)
                                  ? `${m1?.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없습니다.`
                                  : `${m2?.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없습니다.`}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Zodiac */}
                        <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-1.5 shadow-2xs relative overflow-hidden">
                          <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1">
                            <span className="font-bold text-[11px] text-[#2C3E50]">⭐ 별자리 궁합 분석</span>
                            {isSecretUnlocked ? (
                              <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                평균 {Math.round((pair.zodiac.score_1_to_2 + pair.zodiac.score_2_to_1) / 2)}점
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                🔒 LOCK
                              </span>
                            )}
                          </div>
                          {isSecretUnlocked ? (
                            <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-rose-500/40 font-medium">
                              {pair.zodiac.description}
                            </p>
                          ) : (
                            <div className="relative pt-0.5">
                              <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                황도 12궁 점성술 하우스 결합도를 분석하여, 두 사람이 이상적으로 공유하는 일상 및 감성 가치관 호환도 해설입니다.
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                                <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-1.5 py-0.5 rounded shadow-3xs">
                                  🔒 프리미엄 상세 해설
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 🩹 [인연사주 피드백 수용] 관계 극복 상생 처방전 & 행동 수칙 */}
                      {(() => {
                        const prescription = generateCustomPrescription(m1, m2, pair.score);
                        return (
                          <div id={`remedy-${originalIndex}`} className="bg-emerald-50/50 border border-emerald-200/60 p-3.5 rounded-xl space-y-2 mt-2.5">
                            <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px] font-serif">
                              <Smile className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>🩹 [인연 처방전] 갈등 극복을 위한 두 사람의 상생 솔루션</span>
                            </div>
                            <div className="text-[10px] text-[#5A4D41] leading-relaxed space-y-1.5">
                              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 font-semibold shadow-3xs">
                                <span className={`${pair.score < 75 ? "text-amber-800" : "text-emerald-800"} font-extrabold block mb-0.5`}>
                                  {prescription.clashTitle}
                                </span>
                                {prescription.clashDesc}
                              </div>
                              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 font-semibold shadow-3xs space-y-1.5">
                                <span className="text-emerald-800 font-extrabold block mb-0.5">💡 상생 화합 처방 (이렇게 행동하면 좋아집니다!)</span>
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
          <div className="mt-8 bg-[#FAF7F2] border border-[#D6CCBC] rounded-2xl p-5.5 space-y-4 shadow-3xs text-left">
            <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-2.5">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-300 animate-pulse" />
                <h4 className="font-serif text-xs font-black text-[#2C3E50] tracking-tight">
                  👑 이 모임방의 프리미엄 혜택 해금 대시보드
                </h4>
              </div>
              <span className="text-[9px] bg-amber-50 text-amber-800 font-extrabold border border-amber-200 px-1.5 py-0.5 rounded">
                인연상점
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Product 1: PDF */}
              <div 
                onClick={() => {
                  setShopInitialTab("pdf");
                  setIsShopOpen(true);
                }}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all ${
                  isPdfUnlocked 
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" 
                    : "bg-white border-[#E8E0D0] text-[#5A4D41]"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold block mb-1">📄 AI 심층 리포트 (PDF)</span>
                  <p className="text-[9px] text-gray-500 leading-tight">개인 상세 사주명식 및 평생 대운 감정서</p>
                </div>
                <div className="mt-3 text-right">
                  {isPdfUnlocked ? (
                    <span className="text-[9px] font-bold text-emerald-600">🔓 해금 완료</span>
                  ) : (
                    <span className="text-[9px] font-bold text-[#C0392B] hover:underline">🔒 미해금 (1,900원)</span>
                  )}
                </div>
              </div>

              {/* Product 2: Secret Harmony */}
              <div 
                onClick={() => {
                  setShopInitialTab("secret");
                  setIsShopOpen(true);
                }}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all ${
                  isSecretUnlocked 
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" 
                    : "bg-white border-[#E8E0D0] text-[#5A4D41]"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold block mb-1">🔒 비밀 인연·속마음</span>
                  <p className="text-[9px] text-gray-500 leading-tight">멤버 간 비밀 속궁합 및 인연 등급(S-F)</p>
                </div>
                <div className="mt-3 text-right">
                  {isSecretUnlocked ? (
                    <span className="text-[9px] font-bold text-emerald-600">🔓 해금 완료</span>
                  ) : (
                    <span className="text-[9px] font-bold text-[#C0392B] hover:underline">🔒 미해금 (2,900원)</span>
                  )}
                </div>
              </div>

              {/* Product 3: Group Analysis */}
              <div 
                onClick={() => {
                  setShopInitialTab("group");
                  setIsShopOpen(true);
                }}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all ${
                  isGroupUnlocked 
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" 
                    : "bg-white border-[#E8E0D0] text-[#5A4D41]"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold block mb-1">👥 그룹 오행 총괄 분석</span>
                  <p className="text-[9px] text-gray-500 leading-tight">모임 전체 케미 매트릭스 & 오행 지도</p>
                </div>
                <div className="mt-3 text-right">
                  {isGroupUnlocked ? (
                    <span className="text-[9px] font-bold text-emerald-600">🔓 해금 완료</span>
                  ) : (
                    <span className="text-[9px] font-bold text-[#C0392B] hover:underline">🔒 미해금 ({members.length <= 10 ? "4,900" : members.length <= 20 ? "6,900" : members.length <= 30 ? "9,900" : "14,900"}원)</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsShopOpen(true)}
              className="w-full py-3 bg-[#C0392B] text-white hover:bg-[#A93226] text-xs font-serif font-black tracking-widest rounded-xl transition duration-150 cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
            >
              <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>전체 해금 상태 관리 및 프리미엄 상점 열기</span>
            </button>
          </div>
        </div>

        {/* Direct Footer Control */}
        <div className="pt-6 border-t border-[#E8E0D0]">
          <a
            href={`#/room/${code}`}
            className="block w-full py-4 bg-[#2C3E50] text-[#FAF7F2] hover:bg-[#1A252F] hover:scale-[0.99] text-center font-serif font-bold text-xs rounded-xl tracking-widest transition duration-200 cursor-pointer"
          >
            ← 모임 대기실 목록으로 돌아가기
          </a>
        </div>

      </div>

      {isShopOpen && (
        <PremiumPaywall 
          isModal
          initialTab={shopInitialTab}
          onClose={() => setIsShopOpen(false)}
          onStatusChange={syncUnlockStates}
          memberCount={members.length}
        />
      )}
    </Layout>
  );
}

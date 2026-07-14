import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuVisual from "./SajuVisual";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { db, auth, signInWithGoogle, checkPremiumStatus, checkProductUnlock, activatePremiumSimulation } from "../lib/firebase";
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection } from "firebase/firestore";
import { Member, PersonalAnalysis } from "../types";
import { Sparkles, ArrowLeft, Compass, Coins, Heart, Activity, LogIn, Crown, Printer } from "lucide-react";
import MbtiTest, { MBTI_EXPLANATIONS } from "./MbtiTest";
import PremiumPaywall from "./PremiumPaywall";
import { getSajuPillarsComprehensiveSynthesis } from "../utils/sajuSynthesis";

const isMbtiRegistered = (m?: any): boolean => {
  if (!m || !m.mbti) return false;
  const val = String(m.mbti).trim();
  return val !== "" && val !== "null" && val.toLowerCase() !== "미입력" && !val.toLowerCase().includes("미입력");
};

interface MeViewProps {
  code: string;
  memberId: string;
}

function getSajuMbtiSynthesis(daymasterElement: string, mbti: string): { title: string; text: string } {
  const code = mbti.toUpperCase();
  const group = code.includes("N") && code.includes("F") ? "NF"
              : code.includes("N") && code.includes("T") ? "NT"
              : code.includes("S") && code.includes("J") ? "SJ"
              : "SP";

  const data: Record<string, Record<string, { title: string; text: string }>> = {
    "목": {
      "NF": { title: "성장형 인도자 (木 + NF)", text: "뿌리 내리는 푸른 나무와 따뜻한 이상이 만났습니다. 척박한 땅에서도 끝끝내 새싹을 틔우듯, 세상을 더 이롭고 따뜻하게 바꾸기 위해 곧은 신념을 품고 사람들을 품어주는 자비로운 치유자형 기운입니다." },
      "NT": { title: "지적 개척가 (木 + NT)", text: "뚫고 올라가는 맹렬한 나무의 성장세와 지적인 두뇌가 결합했습니다. 세상에 없는 새로운 이론이나 질서를 기획하고 추진하는 혁신적인 설계자이자, 학구적인 집념이 돋보이는 기획형 기운입니다." },
      "SJ": { title: "안정적인 수호목 (木 + SJ)", text: "대지를 든든히 지키는 늠름한 수호목처럼 성실하고 책임감이 넘칩니다. 규칙을 지키고 정이 많아, 자신이 속한 가정과 조직의 안정을 위해 헌신하며 한결같은 신용을 제공하는 듬직한 지킴이입니다." },
      "SP": { title: "자유로운 재주꾼 (木 + SP)", text: "바람을 타고 뻗어나가는 덩굴나무처럼 유연하고 임기응변에 뛰어납니다. 이론에 갇히기보다 실제 행동으로 부딪쳐 결과물을 만들어내며, 센스 있는 미적 감각이나 손재주가 돋보이는 타고난 모험가입니다." }
    },
    "화": {
      "NF": { title: "열정의 횃불 (火 + NF)", text: "활활 타오르는 횃불 같은 열정과 타인을 울리는 깊은 영감이 결합했습니다. 사람들의 마음을 단숨에 사로잡고 따뜻한 온기와 에너지를 불어넣는 영혼의 치어리더이자, 이상을 전파하는 등대 같은 기운입니다." },
      "NT": { title: "화려한 기획자 (火 + NT)", text: "모든 것을 명백하게 비추는 햇살 같은 총명함และ 고도의 이성이 만났습니다. 머리 회전이 기가 막히게 빠르며 트렌드를 앞서 선점하고, 기발한 분석력과 프레젠테이션 수완으로 청중을 압도하는 브레인입니다." },
      "SJ": { title: "사교적인 등불 (火 + SJ)", text: "모두를 따뜻하게 덮어주는 모닥불처럼 사교성과 질서감이 대단히 우수합니다. 약속을 생명처럼 아끼며, 지인들을 화기애애하게 챙겨주는 모임의 명랑하고 책임감 강한 활력 충전기입니다." },
      "SP": { title: "불꽃 같은 예술가 (火 + SP)", text: "어둠 속을 밝히는 네온사인처럼 끼와 매력이 사방으로 분출됩니다. 순간적인 몰입도와 미적 센스가 타의 추종을 불허하여, 무대 위나 현장 비즈니스에서 독보적인 존재감을 과시하는 주인공입니다." }
    },
    "토": {
      "NF": { title: "대지의 치유사 (土 + NF)", text: "모든 생명을 길러내는 비옥한 어머니의 대지처럼 깊은 포용력과 성스러운 마음을 지녔습니다. 타인의 이야기에 깊이 공감하고 신념을 품으며, 묵묵하고 자비롭게 사람들을 성장시켜 나가는 대인배입니다." },
      "NT": { title: "중후한 전략가 (土 + NT)", text: "흔들리지 않는 거대한 태산처럼 깊고 진중한 이성이 결합했습니다. 소동에 흔들리지 않고 거시적인 안목에서 판을 읽는 묵직한 분석력을 가졌으며, 철저한 포용력과 이성을 겸비한 듬직한 책사형 인재입니다." },
      "SJ": { title: "굳건한 파수꾼 (土 + SJ)", text: "비바람에도 흔들리지 않는 굳건한 바위산처럼 타협하지 않는 원칙과 무한한 신용을 보여줍니다. 시간과 규칙을 칼같이 지키며, 자신이 맡은 일은 소리 소문 없이 완벽하게 끝마치는 진국 중의 진국입니다." },
      "SP": { title: "실용적인 중재가 (土 + SP)", text: "흙을 만지며 유연하게 형태를 빚는 도예가처럼 현실 감각과 대처 능력이 훌륭합니다. 까다롭거나 무뚝뚝해 보여도 알짜 실속을 챙길 줄 알며, 갈등 상황에서 치우침 없이 완벽하게 화해를 도모하는 숨은 고수입니다." }
    },
    "금": {
      "NF": { title: "정의의 칼날 (金 + NF)", text: "불순물을 잘라내는 단호한 칼날에 고귀한 신념이 깃들었습니다. 불의를 보면 참지 못하는 대단히 정의롭고 강직한 성품으로, 약자를 지키기 위해 기꺼이 칼자루를 쥐는 따뜻하면서도 서슬 퍼런 개혁가입니다." },
      "NT": { title: "예리한 조각가 (金 + NT)", text: "티끌 하나 없는 완벽한 강철 검처럼 한 치의 오차도 허용하지 않는 날카로운 결단력과 분석을 과시합니다. 팩트에 기반해 문제를 칼같이 해부하며, 고도의 기획 능력과 실행력으로 최고의 실적을 도출해 냅니다." },
      "SJ": { title: "강직한 수호자 (金 + SJ)", text: "원칙을 사수하는 철옹성의 보초처럼 충성심과 성실함이 뼈속까지 깃들었습니다. 거짓말을 혐오하고 약속을 철저히 지키며, 철두철미한 시스템과 완벽주의로 가정과 회사의 뼈대를 튼튼하게 지탱합니다." },
      "SP": { title: "예술적인 장인 (金 + SP)", text: "정교한 보석을 깎아내는 장인처럼 놀라운 정밀 도구 활용력과 미적 감각을 지녔습니다. 평소엔 말이 없거나 시크해 보이지만, 관심 있는 특정한 기술이나 예술 분야에서는 기적 같은 퍼포먼스를 내는 고수입니다." }
    },
    "수": {
      "NF": { title: "고요한 심연 (水 + NF)", text: "끝없는 바다처럼 깊고 고요한 지적 세계와 따뜻한 마음이 조화를 이룹니다. 상대방의 내면을 거울처럼 고스란히 비추어 읽는 신비로운 통찰력을 지녔으며, 문학적인 서정성과 영성이 돋보이는 현자형 성품입니다." },
      "NT": { title: "심연의 사색가 (水 + NT)", text: "빙산 속 깊은 지혜처럼 고요하면서도 철저한 탐구력을 발휘합니다. 사물의 작동 원리를 파고드는 것을 즐기며, 혼자만의 사색과 이론적 완성을 추구하는 극상의 브레인이자 분석 책사입니다." },
      "SJ": { title: "흐르는 신용 (水 + SJ)", text: "만물을 이롭게 하며 한결같이 아래로 흐르는 맑은 시냇물처럼 겸손하고 성실합니다. 갈등을 피하고 조화를 추구하면서도, 자신의 자리는 끝끝내 빈틈없이 지켜내는 믿을 수 있는 내실의 달인입니다." },
      "SP": { title: "자유로운 파도 (水 + SP)", text: "정해진 틀이 없이 컵에 담기면 컵의 모양이 되는 유연한 물처럼 최고의 상황 적응력을 자랑합니다. 예술적 낭만과 자유를 즐기며, 정해진 틀에 갇히는 것을 거부하고 물길이 흐르듯 유유자적 인생을 모험하는 낭만파입니다." }
    }
  };

  const elemKey = ["목", "화", "토", "금", "수"].includes(daymasterElement) ? daymasterElement : "토";
  return data[elemKey]?.[group] || { title: "음양오행과 MBTI의 조화", text: "사주의 일간 기운과 MBTI의 성향이 어우러져 당신만의 독창적인 자아를 형성하고 있습니다." };
}

function getWesternZodiac(birthDate: string): { name: string; emoji: string } {
  if (!birthDate) return { name: "알 수 없음", emoji: "⭐" };
  const parts = birthDate.split('-');
  if (parts.length < 3) return { name: "알 수 없음", emoji: "⭐" };
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

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
      `${m2.nickname}님의 포근하고 넓은 ${meta2.nick} 기운이 ${m1.nickname}님의 섬세한 ${meta1.nick} 성정을 든든하게 받쳐주고 생(生)해주는 완벽한 조력의 기류입니다. 두 분이 함께하면 일상에서 쌓였던 불안 and 피로가 마법처럼 해소되며 서로에 대한 대단한 신뢰가 굳건하게 형성됩니다.`,
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
      `${z1.name}와 ${z2.name}의 유연한 기조가 사주의 온화함과 결합하여, 거친 파도가 없는 잔잔한 바다처럼 편안하게 동행할 수 있는 궁합을 형성합니다. 서로에게 훌륭한 쉼터이자 영감이 되어주며 안정감 있는 전진을 이끕니다.`
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

export default function MeView({ code, memberId }: MeViewProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<PersonalAnalysis | null>(null);
  const [allPairs, setAllPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isPdfUnlocked, setIsPdfUnlocked] = useState(false);
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [isGroupUnlocked, setIsGroupUnlocked] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState<"pdf" | "secret" | "group">("pdf");
  const [activeTab, setActiveTab] = useState<"free" | "premium">("free");
  const [showSoulCharExplanation, setShowSoulCharExplanation] = useState(false);
  const [expandedPairs, setExpandedPairs] = useState<Record<string, boolean>>({});

  // Premium Horoscope States
  const [horoscope, setHoroscope] = useState<any | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState("");
  const [activeHoroscopeTab, setActiveHoroscopeTab] = useState<"today" | "weekly" | "monthly" | "yearly">("today");

  const fetchHoroscope = async (force = false) => {
    if (!member) return;

    // Check localStorage cache first to avoid unnecessary API requests (token-saving optimization)
    try {
      const cached = localStorage.getItem(`saju_horoscope_${memberId}`);
      if (cached && !force) {
        const parsed = JSON.parse(cached);
        const cacheDate = parsed.cachedDate;
        const todayDate = new Date().toDateString();
        if (cacheDate === todayDate) {
          setHoroscope(parsed.data);
          return;
        }
      }
    } catch (e) {
      console.log("Failed to load cached horoscope, fetching fresh:", e);
    }

    if (horoscope && !force) return;

    setHoroscopeLoading(true);
    setHoroscopeError("");
    try {
      const response = await fetch("/api/horoscope", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ member }),
      });

      if (!response.ok) {
        throw new Error("서버에서 실시간 운세를 생성하는 데 실패했습니다.");
      }

      const data = await response.json();
      setHoroscope(data);

      // Save to localStorage cache with today's date
      try {
        localStorage.setItem(`saju_horoscope_${memberId}`, JSON.stringify({
          cachedDate: new Date().toDateString(),
          data
        }));
      } catch (e) {}
    } catch (err: any) {
      console.error("Failed to fetch horoscope:", err);
      setHoroscopeError(err.message || "실시간 운세를 불러오지 못했습니다.");
    } finally {
      setHoroscopeLoading(false);
    }
  };

  const togglePairExpand = (otherMemberId: string) => {
    setExpandedPairs(prev => ({
      ...prev,
      [otherMemberId]: !prev[otherMemberId]
    }));
  };

  const syncUnlockStates = async () => {
    const status = await checkPremiumStatus();
    setIsPremium(status);
    const pdfStatus = await checkProductUnlock("pdf");
    const secretStatus = await checkProductUnlock("secret");
    const groupStatus = await checkProductUnlock("group");
    setIsPdfUnlocked(status || pdfStatus);
    setIsSecretUnlocked(status || secretStatus);
    setIsGroupUnlocked(status || groupStatus);
  };

  useEffect(() => {
    // Rely exclusively on onAuthStateChanged to sync initial unlock states,
    // avoiding unauthenticated requests before the transport layer resolves.
    const unsubscribe = auth.onAuthStateChanged(() => {
      syncUnlockStates();
    });
    return () => unsubscribe();
  }, []);

  // Trigger horoscope loading when premium tab is viewed & unlocked
  useEffect(() => {
    if (activeTab === "premium" && isPdfUnlocked && member && !horoscope && !horoscopeLoading) {
      fetchHoroscope();
    }
  }, [activeTab, isPdfUnlocked, member]);

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  const [roomOwnerUid, setRoomOwnerUid] = useState<string>("");
  const [roomTitle, setRoomTitle] = useState<string>("");
  const [editOverlayMessage, setEditOverlayMessage] = useState("내 정보를 저장하고 만세력을 해독하는 중...");

  // MBTI Speed Test & Direct Selection States
  const [isTestingMbti, setIsTestingMbti] = useState(false);
  const [isSelectingMbtiDirectly, setIsSelectingMbtiDirectly] = useState(false);
  const [selectedMbtiLetter1, setSelectedMbtiLetter1] = useState("I");
  const [selectedMbtiLetter2, setSelectedMbtiLetter2] = useState("N");
  const [selectedMbtiLetter3, setSelectedMbtiLetter3] = useState("F");
  const [selectedMbtiLetter4, setSelectedMbtiLetter4] = useState("J");

  const reanalyzeWithMbti = async (updatedMembers: Member[]) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room_title: roomTitle || "친목모임", members: updatedMembers }),
      });

      if (!response.ok) {
        throw new Error("AI 분석 갱신에 실패했습니다. 잠시 후 상단의 업데이트 버튼을 다시 눌러주세요.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("서버 혼잡 또는 네트워크 일시적 타임아웃이 발생했습니다. 잠시 후 상단의 업데이트 버튼을 눌러 다시 시도해 주세요!");
      }

      const aiData = await response.json();

      // Write results to Firestore Rooms/{code}/analysis/result
      const payload = {
        personal: aiData.personal,
        pairs: aiData.pairs,
        group: aiData.group,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, "rooms", code, "analysis", "result"), payload);

      // Update local states immediately
      if (aiData.personal && aiData.personal[memberId]) {
        setAiAnalysis(aiData.personal[memberId]);
      }
      if (aiData.pairs) {
        setAllPairs(aiData.pairs);
      }
    } catch (err) {
      console.error("AI Reanalysis after MBTI update failed:", err);
    }
  };

  const handleUpdateAnalysis = async () => {
    setEditOverlayMessage("모임의 전체 인연 지도를 다시 설계하고 AI 동서양 융합 궁합을 해독하는 중...");
    setEditLoading(true);
    setEditError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room_title: roomTitle || "친목모임", members: allMembers }),
      });

      if (!response.ok) {
        throw new Error("서버에서 AI 분석을 생성하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("서버 혼잡 또는 네트워크 일시적 타임아웃이 발생했습니다. 잠시 후 실시간 인연 궁합 업데이트 버튼을 눌러 다시 시도해 주세요!");
      }

      const aiData = await response.json();

      const payload = {
        personal: aiData.personal,
        pairs: aiData.pairs,
        group: aiData.group,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, "rooms", code, "analysis", "result"), payload);

      // Update local states immediately
      if (aiData.personal && aiData.personal[memberId]) {
        setAiAnalysis(aiData.personal[memberId] as PersonalAnalysis);
      } else {
        setAiAnalysis(null);
      }
      if (aiData.pairs) {
        setAllPairs(aiData.pairs);
      }
    } catch (err: any) {
      console.error("Failed to update AI analysis:", err);
      setEditError(err.message || "AI 분석 업데이트 도중 오류가 발생했습니다.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveMbti = async (selectedMbti: string) => {
    if (!member) return;
    setEditOverlayMessage("MBTI 성향이 반영된 새로운 AI 총운세 해설을 생성하는 중...");
    setEditLoading(true);
    try {
      const memberRef = doc(db, "rooms", code, "members", memberId);
      const updatedMember = {
        ...member,
        mbti: selectedMbti
      };
      const { id, ...saveData } = updatedMember;
      await setDoc(memberRef, saveData);

      setMember(updatedMember);
      setIsTestingMbti(false);
      setIsSelectingMbtiDirectly(false);

      // Update allMembers array locally
      const updatedMembersList = allMembers.map((m) =>
        m.id === memberId ? { ...m, mbti: selectedMbti } : m
      );
      setAllMembers(updatedMembersList);

      // Trigger automatic reanalysis to update individual/group interpretations!
      await reanalyzeWithMbti(updatedMembersList);
    } catch (err: any) {
      console.error("Failed to save MBTI:", err);
      setEditError(err.message || "MBTI 저장 중 오류가 발생했습니다.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDirectMbtiSubmit = () => {
    const mbti = `${selectedMbtiLetter1}${selectedMbtiLetter2}${selectedMbtiLetter3}${selectedMbtiLetter4}`;
    handleSaveMbti(mbti);
  };

  const handleClearMbti = async () => {
    if (!member) return;
    setEditOverlayMessage("MBTI 기운을 제거하고 전통 사주 해석을 다시 조율하는 중...");
    setEditLoading(true);
    try {
      const memberRef = doc(db, "rooms", code, "members", memberId);
      const updatedMember = { ...member };
      delete updatedMember.mbti;
      const { id, ...saveData } = updatedMember;
      await setDoc(memberRef, saveData);

      setMember(updatedMember);

      // Update allMembers array locally
      const updatedMembersList = allMembers.map((m) => {
        if (m.id === memberId) {
          const copy = { ...m };
          delete copy.mbti;
          return copy;
        }
        return m;
      });
      setAllMembers(updatedMembersList);

      // Trigger automatic reanalysis
      await reanalyzeWithMbti(updatedMembersList);
    } catch (err: any) {
      console.error("Failed to clear MBTI:", err);
      setEditError(err.message || "MBTI 제거 중 오류가 발생했습니다.");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const localMemberId = localStorage.getItem(`saju_member_id_${code}`) || "";

  const handleEditSubmit = async (formData: {
    nickname: string;
    gender: string;
    birth_date: string;
    birth_time: string | null;
    saju: any;
    character_emoji: string;
    character_animal: string;
    character_color: string;
    mbti?: string | null;
  }) => {
    if (!member) return;
    setEditOverlayMessage("내 정보를 안전하게 저장하고 우주 융합 운세를 재해석하는 중...");
    setEditLoading(true);
    setEditError("");

    try {
      const memberRef = doc(db, "rooms", code, "members", memberId);
      const payload: any = {
        nickname: formData.nickname,
        gender: formData.gender,
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        saju: formData.saju,
        character_emoji: formData.character_emoji,
        character_animal: formData.character_animal,
        character_color: formData.character_color,
        user_uid: member.user_uid || auth.currentUser?.uid || "",
        joined_at: member.joined_at || new Date().toISOString(),
      };
      if (formData.mbti) {
        payload.mbti = formData.mbti;
      } else {
        payload.mbti = null;
      }

      await setDoc(memberRef, payload);

      // Clear cached analysis since details changed
      const cacheRef = doc(db, "rooms", code, "analysis", "result");
      await deleteDoc(cacheRef).catch((e) => {
        console.log("No cached analysis to delete during edit, continuing safely.");
      });

      const updatedMember = {
        ...member,
        ...payload,
      };

      setMember(updatedMember);

      // Update allMembers array locally
      const updatedMembersList = allMembers.map((m) =>
        m.id === memberId ? updatedMember : m
      );
      setAllMembers(updatedMembersList);

      // Reclear cached aiAnalysis locally so they are forced to recalculate
      setAiAnalysis(null);
      setIsEditing(false);

      // Trigger automatic reanalysis to update individual/group interpretations immediately!
      await reanalyzeWithMbti(updatedMembersList);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setEditError(err.message || "수정 사항을 저장하는 중 오류가 발생했습니다.");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");

    const fetchAllData = async () => {
      try {
        // 1. Fetch Room Doc to get owner_uid
        const roomRef = doc(db, "rooms", code);
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          setRoomOwnerUid(roomData.owner_uid || "");
          setRoomTitle(roomData.title || "친목모임");
        }

        // 2. Fetch Member Doc
        const memberRef = doc(db, "rooms", code, "members", memberId);
        const memberSnap = await getDoc(memberRef);
        
        if (!memberSnap.exists()) {
          setError("참여자를 찾을 수 없거나 방에서 이미 나간 상태입니다.");
          setLoading(false);
          return;
        }

        const mData = { id: memberId, ...memberSnap.data() } as Member;
        setMember(mData);

        // Fetch All Members
        const membersSnap = await getDocs(collection(db, "rooms", code, "members"));
        const mList: Member[] = [];
        membersSnap.forEach((docSnap) => {
          mList.push({ id: docSnap.id, ...docSnap.data() } as Member);
        });
        setAllMembers(mList);

        // 2. Fetch Cached AI Report
        const analysisRef = doc(db, "rooms", code, "analysis", "result");
        const analysisSnap = await getDoc(analysisRef);

        if (analysisSnap.exists()) {
          const cacheData = analysisSnap.data();
          if (cacheData.personal && cacheData.personal[memberId]) {
            setAiAnalysis(cacheData.personal[memberId] as PersonalAnalysis);
          }
          if (cacheData.pairs) {
            setAllPairs(cacheData.pairs);
          }
        }
      } catch (err: any) {
        console.error("Failed to load personal report:", err);
        setError("기록을 수신하는 도중 기술상 에러가 생겼습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [code, memberId]);

  if (loading) {
    return (
      <Layout title="인연명부 대조 중">
        <div className="flex flex-col items-center justify-center py-24 select-none">
          <div className="animate-spin text-3xl text-[#C0392B] font-serif">☯</div>
          <p className="text-xs text-[#8C7B6E] mt-3">사주 해석 단자를 해독하는 중...</p>
        </div>
      </Layout>
    );
  }

  if (error || !member) {
    return (
      <Layout title="조회 실패" showHomeButton>
        <div className="text-center py-12 space-y-4">
          <div className="text-3xl">⚠️</div>
          <p className="text-sm font-semibold text-[#C0392B]">{error || "기록을 찾을 수 없습니다."}</p>
          <a
            href={`#/room/${code}`}
            className="inline-block px-5 py-2.5 bg-[#2C3E50] text-[#FAF7F2] rounded text-xs font-serif font-bold tracking-tight shadow-sm"
          >
            모임방으로 돌아가기
          </a>
        </div>
      </Layout>
    );
  }

  const isRoomOwner = roomOwnerUid && currentUser?.uid === roomOwnerUid;
  const isMyProfile = (member.id === localMemberId) || (member.user_uid && currentUser && member.user_uid === currentUser.uid) || isRoomOwner;
  const isMyOwnProfile = (member.id === localMemberId) || (member.user_uid && currentUser && member.user_uid === currentUser.uid);
  const isLoginRequiredToEdit = member.user_uid && (!currentUser || currentUser.uid !== member.user_uid) && !isRoomOwner;

  const otherMembersList = allMembers.filter((m) => m.id !== memberId);
  const missingPairsCount = otherMembersList.filter((otherMember) => {
    const matchMember = (idOrName: string, targetMember: Member) => {
      if (!idOrName || !targetMember) return false;
      const normInput = idOrName.trim().toLowerCase().replace(/님$/, "");
      const normId = targetMember.id.trim().toLowerCase();
      const normNick = targetMember.nickname.trim().toLowerCase().replace(/님$/, "");
      return (
        normId === normInput ||
        normNick === normInput ||
        normId.includes(normInput) ||
        normInput.includes(normId) ||
        normNick.includes(normInput) ||
        normInput.includes(normNick)
      );
    };

    const foundInPairs = allPairs.find(
      (p) =>
        (matchMember(p.member_id_1, member) && matchMember(p.member_id_2, otherMember)) ||
        (matchMember(p.member_id_2, member) && matchMember(p.member_id_1, otherMember))
    );
    return !foundInPairs;
  }).length;

  const hasMissingOrNewMembers = allMembers.length > 1 && (missingPairsCount > 0 || !aiAnalysis);

  return (
    <Layout title={`${member.nickname}의 사주명식`} showHomeButton>
      {editLoading && <LoadingOverlay message={editOverlayMessage} />}
      
      <div className="space-y-6 py-2">
        
        {/* Back Link */}
        <div>
          <a
            href={`#/room/${code}`}
            className="inline-flex items-center text-xs font-medium text-[#8C7B6E] hover:text-[#C0392B] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            모임 메인 목록으로 돌아가기
          </a>
        </div>

        {isEditing ? (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="bg-[#FAF7F2] border border-[#D6CCBC] p-4.5 rounded-2xl text-center space-y-1 shadow-xs">
              <h4 className="font-serif text-sm font-bold text-[#C0392B]">내 사주 정보 수정</h4>
              <p className="text-[11px] text-[#8C7B6E]">
                태어난 생년월일, 시각, 별명, 성별 정보를 알맞게 정정할 수 있습니다.
              </p>
            </div>

            {editError && (
              <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded-xl border border-[#FADBD8] font-bold text-center">
                ⚠️ {editError}
              </div>
            )}

            {isLoginRequiredToEdit ? (
              <div className="bg-white border border-[#D6CCBC] p-6 rounded-2xl text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C0392B]/10 flex items-center justify-center text-[#C0392B]">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-sm font-bold text-[#2C3E50]">소셜 로그인 연동 필요</h4>
                  <p className="text-[11px] text-[#8C7B6E] leading-relaxed max-w-xs mx-auto">
                    이 프로필은 소셜 계정으로 보호되어 있습니다. 정보를 정정하려면 이전에 가입/참여하셨던 Google 계정으로 로그인해 주셔야 합니다.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setEditLoading(true);
                    setEditError("");
                    try {
                      await signInWithGoogle();
                    } catch (err: any) {
                      setEditError("로그인 실패: " + (err.message || err));
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  className="mx-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C0392B] hover:bg-[#A0281B] text-white rounded-xl text-xs font-serif font-bold tracking-tight shadow-xs cursor-pointer transition duration-200"
                >
                  ☯ Google 계정으로 로그인하기
                </button>
              </div>
            ) : (
              <SajuForm
                onSubmit={handleEditSubmit}
                submitButtonText="최종 정보 저장 및 우주 기운 재해석"
                initialNickname={member.nickname}
                initialGender={member.gender as "남성" | "여성"}
                initialBirthDate={member.birth_date}
                initialBirthTime={member.birth_time}
                initialMbti={member.mbti}
              />
            )}

            <button
              onClick={() => {
                setIsEditing(false);
                setEditError("");
              }}
              className="w-full py-3.5 bg-[#7F8C8D] hover:bg-[#95A5A6] text-white font-serif font-bold text-xs rounded-xl tracking-widest transition duration-200 cursor-pointer text-center"
            >
              수정 취소하고 돌아가기
            </button>
          </div>
        ) : (
          <>
            {/* Header Character Card */}
            <div className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-6 rounded-2xl text-center space-y-4 relative overflow-hidden shadow-xs">
              {/* Accent flag */}
              <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                <div className="w-16 h-4 bg-[#C0392B] text-white text-[8px] font-bold text-center rotate-45 translate-x-3 translate-y-2 uppercase tracking-wide">
                  주인공
                </div>
              </div>

              <div
                className="w-16 h-16 rounded-full border-2 mx-auto flex items-center justify-center text-3xl font-serif shadow-xs"
                style={{
                  backgroundColor: `${member.character_color}10`,
                  borderColor: `${member.character_color}60`,
                }}
              >
                {member.character_emoji}
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-[#2C3E50]">
                  {member.nickname} ({member.gender === "남성" ? "건명 (남성)" : "곤명 (여성)"})
                </h4>
                <p className="text-xs text-[#8C7B6E] font-medium">
                  생일: {member.birth_date} {member.birth_time ? `(${member.birth_time}시)` : "(출생시모름)"}
                </p>
                {isMyProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#C0392B]/30 hover:bg-[#C0392B] hover:text-white text-[#C0392B] rounded-xl text-[11px] font-bold font-serif shadow-xs transition duration-200 cursor-pointer animate-pulse"
                  >
                    ✏️ 내 정보 및 MBTI 통합 수정
                  </button>
                )}
              </div>

              <span
                className="inline-block px-3 py-1.5 rounded-xl border text-xs font-serif font-bold shadow-xs animate-fade-in"
                style={{
                  backgroundColor: `${member.character_color}18`,
                  borderColor: `${member.character_color}50`,
                  color: member.character_color,
                }}
              >
                소울 캐릭터 : {member.character_animal}
              </span>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowSoulCharExplanation(!showSoulCharExplanation)}
                  className="text-[10px] text-[#8C7B6E] hover:text-[#C0392B] font-semibold underline cursor-pointer focus:outline-hidden"
                >
                  {showSoulCharExplanation ? "💡 소울 캐릭터 설명 접기" : "💡 소울 캐릭터는 왜 일반 '띠'와 다를까요?"}
                </button>
                {showSoulCharExplanation && (
                  <div className="p-3 bg-[#FCFAF6] border border-[#E8E0D0] rounded-xl text-left text-[11px] text-[#8C7B6E] leading-relaxed max-w-sm mx-auto mt-2 animate-fade-in">
                    사주명리학에서 나 자신을 상징하는 진짜 기운은 태어난 해(년)의 동물(띠)이 아닌, <strong>태어난 날(일)의 기운</strong>입니다. 본 앱은 단순한 출생 연도별 띠를 벗어나, 당신이 태어난 날의 <strong>일주(천간 색상 + 지지 동물)</strong>를 기준으로 정밀하게 계산된 고유한 '소울 캐릭터'를 보여드립니다!
                  </div>
                )}
              </div>
            </div>

            {!isMyOwnProfile && !isSecretUnlocked ? (
              /* PREMIUM LOCK GATEWAY FOR OTHER MEMBERS' PROFILES */
              <div className="bg-gradient-to-br from-[#FAF8F5] via-amber-50/20 to-[#FCFAF6] border border-amber-300 rounded-3xl p-6 shadow-md space-y-6 text-center animate-fade-in relative overflow-hidden text-left mt-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                  <Crown className="w-6 h-6 text-amber-600 fill-amber-300" />
                </div>

                <div className="space-y-2 text-center">
                  <h4 className="font-serif text-sm font-black text-[#2C3E50] tracking-tight">
                    👑 타인 상세 사주명식 및 평생 감정서 열람 제한
                  </h4>
                  <p className="text-[11px] text-[#8C7B6E] max-w-sm mx-auto leading-relaxed font-medium">
                    모임 참여자 <strong>{member.nickname}</strong>님의 상세한 사주명식, 일주 총평, 현대 성향심리(MBTI) 결합 조화 해독, 그리고 4대 영역 통합 우주 평생 감정서 정보는 프리미엄 회원에게만 공개됩니다.
                  </p>
                </div>

                {/* Premium Feature Checkpoints */}
                <div className="max-w-md mx-auto bg-white/75 backdrop-blur-xs border border-amber-200/60 p-4 rounded-xl text-left space-y-3 shadow-3xs">
                  <h5 className="text-[9px] text-amber-800 font-extrabold tracking-wider uppercase">🔒 포함된 프리미엄 명품 기능 목록</h5>
                  <div className="space-y-2.5 text-[11px] text-[#5A4D41] font-medium">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs mt-0.5">✔</span>
                      <div>
                        <span className="font-bold text-[#2C3E50] text-[11px]">타인의 사주명식(만세력) 및 천기/지기 정밀 정보</span>
                        <p className="text-[10px] text-gray-500 leading-normal">상대의 일간/일지 및 오행 구성 분포와 만세력 텍스트 정보</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs mt-0.5">✔</span>
                      <div>
                        <span className="font-bold text-[#2C3E50] text-[11px]">현대 성향심리(MBTI)와 사주오행의 상생 조화 해독</span>
                        <p className="text-[10px] text-gray-500 leading-normal">상대의 본질 기질과 심리 지표가 어우러져 만들어내는 통합 인격</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs mt-0.5">✔</span>
                      <div>
                        <span className="font-bold text-[#2C3E50] text-[11px]">동서양 4대 영역 통합 우주 평생 감정서</span>
                        <p className="text-[10px] text-gray-500 leading-normal">상대의 타고난 기질, 평생 키워드, 천직과 재능, 10년 인생 대운(大運) 통합 로드맵 및 삶의 리듬</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex flex-col items-center">
                  <button
                    onClick={() => {
                      setShopInitialTab("secret");
                      setIsShopOpen(true);
                    }}
                    className="w-full py-3.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-black tracking-widest rounded-xl shadow-md hover:shadow-lg hover:scale-[1.005] transition-all cursor-pointer text-center flex items-center justify-center gap-2 text-xs"
                  >
                    <Crown className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                    <span>비밀 인연·속마음 상성 해독권으로 즉시 해금하기 (2,900원)</span>
                  </button>
                  <p className="text-[10px] text-[#8C7B6E] mt-2 font-medium">
                    💡 터치 시 상품 설명, 가상 결제 시뮬레이션 및 100% 무료체험 데모 상점이 열립니다.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 2-TAB LAYOUT: FREE VS PREMIUM */}
                <div className="flex border-b border-[#D6CCBC] gap-1.5 pt-4 pb-1">
                  <button
                    id="free-zone-tab"
                    type="button"
                    onClick={() => setActiveTab("free")}
                    className={`flex-1 py-3 px-3 font-serif font-bold text-xs rounded-t-xl transition duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      activeTab === "free"
                        ? "bg-[#2C3E50] text-[#FAF7F2] border-t-2 border-t-[#C0392B]"
                        : "bg-[#FCFAF6] text-[#8C7B6E] hover:bg-[#F2EFE6] hover:text-[#5A4D41]"
                    }`}
                  >
                    {isGroupUnlocked ? (
                      <>
                        <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-500 animate-bounce" />
                        <span className="text-amber-950 font-extrabold">👥 1:1 인연 궁합 (해금됨) & 성향</span>
                      </>
                    ) : (
                      <span>🌟 무료 기본 분석 & 성향</span>
                    )}
                  </button>
                  <button
                    id="premium-zone-tab"
                    type="button"
                    onClick={() => setActiveTab("premium")}
                    className={`flex-1 py-3 px-3 font-serif font-bold text-xs rounded-t-xl transition duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 relative overflow-hidden ${
                      activeTab === "premium"
                        ? "bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 border-t-2 border-t-amber-400"
                        : "bg-amber-50/55 text-amber-800 hover:bg-amber-100/60"
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-300" />
                    <span>👑 평생 감정서 & 궁합</span>
                    {!isPdfUnlocked && (
                      <span className="text-[8px] bg-[#C0392B] text-white px-1.5 py-0.5 rounded font-sans font-extrabold tracking-tight scale-95 animate-pulse">PRO</span>
                    )}
                  </button>
                </div>

                {/* 1단계: 동양의 명리학적 일주 및 사주명식 */}
                {activeTab === "free" && (
                  <div className="space-y-3 text-left animate-fade-in">
                    <div className="flex items-center space-x-1.5 border-b border-[#E8E0D0] pb-2">
                      <span className="text-base text-[#C0392B]">☯</span>
                      <h4 className="font-serif text-sm font-bold text-[#2C3E50] tracking-tight">
                        [1단계] 동양의 명리학적 일주 및 사주명식
                      </h4>
                    </div>
                    <SajuVisual saju={member.saju} hideMix={true} isPremium={isPdfUnlocked} />
                  </div>
                )}

            {/* 2단계: 현대 성향심리 결합 (MBTI 분석) */}
            {activeTab === "free" && (
              <div className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-5 rounded-2xl space-y-4 shadow-xs text-left animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-2.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-base">🧬</span>
                  <h4 className="font-serif text-sm font-bold text-[#2C3E50] tracking-tight">
                    [2단계] 현대 성향심리 결합 (MBTI)
                  </h4>
                </div>
                {member.mbti && isMyProfile && (
                  <button
                    onClick={handleClearMbti}
                    className="text-[10px] text-gray-400 hover:text-[#C0392B] underline cursor-pointer"
                  >
                    초기화
                  </button>
                )}
              </div>

              {isTestingMbti ? (
                <MbtiTest
                  onComplete={handleSaveMbti}
                  onCancel={() => setIsTestingMbti(false)}
                />
              ) : isSelectingMbtiDirectly ? (
                <div className="space-y-4 bg-[#FCFAF6] border border-[#E8E0D0] p-4 rounded-xl animate-fade-in">
                  <h5 className="font-serif text-xs font-bold text-[#2C3E50]">내 MBTI 코드 직접 선택</h5>
                  <div className="grid grid-cols-4 gap-2">
                    <select
                      value={selectedMbtiLetter1}
                      onChange={(e) => setSelectedMbtiLetter1(e.target.value)}
                      className="p-2 border border-[#D6CCBC] rounded-lg bg-white text-xs text-center font-bold"
                    >
                      <option value="E">E (외향)</option>
                      <option value="I">I (내향)</option>
                    </select>
                    <select
                      value={selectedMbtiLetter2}
                      onChange={(e) => setSelectedMbtiLetter2(e.target.value)}
                      className="p-2 border border-[#D6CCBC] rounded-lg bg-white text-xs text-center font-bold"
                    >
                      <option value="S">S (감각)</option>
                      <option value="N">N (직관)</option>
                    </select>
                    <select
                      value={selectedMbtiLetter3}
                      onChange={(e) => setSelectedMbtiLetter3(e.target.value)}
                      className="p-2 border border-[#D6CCBC] rounded-lg bg-white text-xs text-center font-bold"
                    >
                      <option value="T">T (사고)</option>
                      <option value="F">F (감정)</option>
                    </select>
                    <select
                      value={selectedMbtiLetter4}
                      onChange={(e) => setSelectedMbtiLetter4(e.target.value)}
                      className="p-2 border border-[#D6CCBC] rounded-lg bg-white text-xs text-center font-bold"
                    >
                      <option value="J">J (판단)</option>
                      <option value="P">P (인식)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => setIsSelectingMbtiDirectly(false)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDirectMbtiSubmit}
                      className="px-3.5 py-1.5 bg-[#C0392B] text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      등록하기
                    </button>
                  </div>
                </div>
              ) : member.mbti ? (
                (() => {
                  const info = MBTI_EXPLANATIONS[member.mbti.toUpperCase()] || { title: "신비로운 성향가", desc: "나만의 고유한 인생관을 지닌 존재", icon: "⭐" };
                  const daymasterElement = member.saju.daymaster.element;
                  const synthesis = getSajuMbtiSynthesis(daymasterElement, member.mbti);
                  
                  return (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center space-x-3 bg-[#FCFAF6] border border-[#E8E0D0] p-4 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-white border border-[#D6CCBC] flex items-center justify-center text-2xl shrink-0">
                          {info.icon}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-base font-black text-[#2C3E50]">{member.mbti.toUpperCase()}</span>
                            <span className="text-[10px] bg-[#C0392B]/10 text-[#C0392B] px-1.5 py-0.5 rounded font-serif font-bold">{info.title}</span>
                          </div>
                          <p className="text-[11px] text-[#8C7B6E] leading-normal">{info.desc}</p>
                        </div>
                      </div>

                      {/* Synthesis Card */}
                      <div className="bg-[#FAF7F2] border border-[#C0392B]/20 p-4 rounded-xl space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-[#C0392B]/10" />
                        <h5 className="font-serif text-xs font-bold text-[#C0392B] flex items-center gap-1">
                          ☯ 오행과 MBTI의 조화 해독 : <span className="underline">{isPdfUnlocked ? synthesis.title : "🔒 프리미엄 전용 조화 해독"}</span>
                        </h5>
                        {isPdfUnlocked ? (
                          <p className="text-[11px] text-[#5A4D41] leading-relaxed font-medium">
                            {synthesis.text}
                          </p>
                        ) : (
                          <div className="relative">
                            <p className="text-[11px] text-[#5A4D41]/40 leading-relaxed font-medium blur-[3.5px] select-none pointer-events-none">
                              이 일주의 고유한 사주 오행 분포와 {member.mbti.toUpperCase()} 성향의 완벽한 융합 해설입니다. 타고난 기운과 사회적 성격의 상생 조화 분석을 통해 진정한 나의 정체성을 완벽하게 파악하실 수 있습니다.
                            </p>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/20 backdrop-blur-[0.5px]">
                              <span className="text-[10px] font-extrabold text-[#C0392B] flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg shadow-3xs">
                                <Crown className="w-3 h-3 fill-amber-300 text-amber-600" />
                                <span>프리미엄 융합 성향 해설 잠금</span>
                              </span>
                              <p className="text-[9px] text-[#8C7B6E] mt-1 font-semibold">프리미엄 구독 시 즉시 해금됩니다</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {isMyProfile && (
                        <div className="text-right">
                          <button
                            onClick={() => setIsSelectingMbtiDirectly(true)}
                            className="text-[10px] text-[#C0392B] hover:underline font-bold cursor-pointer"
                          >
                            ✏️ 내 MBTI 정보 정정하기
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="bg-[#FCFAF6] border border-[#E8E0D0] p-4 rounded-xl text-center space-y-3.5">
                  <p className="text-[11px] text-[#8C7B6E] leading-relaxed">
                    아직 등록된 MBTI 정보가 없습니다. <br />
                    전통 오행(목·화·토·금·수)과 현대 심리학 MBTI의 결합 시너지를 풀기 위해 MBTI를 등록해 보세요!
                  </p>
                  
                  {isMyProfile ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setIsSelectingMbtiDirectly(true)}
                        className="py-2.5 bg-white border border-[#D6CCBC] hover:bg-[#F2EFE6] text-[#5A4D41] font-serif font-bold text-[11px] rounded-lg cursor-pointer shadow-xs"
                      >
                        코드 직접 입력
                      </button>
                      <button
                        onClick={() => setIsTestingMbti(true)}
                        className="py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-bold text-[11px] rounded-lg cursor-pointer shadow-xs"
                      >
                        ⚡ 12문항 스피드 검사
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic font-medium">이 사용자는 아직 MBTI 정보를 등록하지 않았습니다.</p>
                  )}
                </div>
              )}
            </div>
            )}

            {/* 무료 궁합 맛보기 영역 (비과금 탭 전용) - (통합된 인연 궁합 탭으로 대체) */}
            {activeTab === "free" && (
              <div className="space-y-4 pt-6 border-t border-[#E8E0D0] animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-2 flex-wrap gap-2">
                  <div className="flex items-center space-x-1.5">
                    {isGroupUnlocked ? (
                      <>
                        <Crown className="w-4 h-4 text-amber-600 fill-amber-200 animate-bounce" />
                        <h4 className="font-serif text-xs font-bold text-amber-950 tracking-tight">
                          👥 모임 멤버들과의 1:1 인연 궁합 케미 (전체 해금 완료)
                        </h4>
                      </>
                    ) : (
                      <>
                        <span className="text-base">🎁</span>
                        <h4 className="font-serif text-xs font-bold text-[#2C3E50] tracking-tight">
                          [맛보기] 모임 멤버와의 1:1 인연 궁합 케미 (1명 무료)
                        </h4>
                      </>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShopInitialTab("group");
                      setIsShopOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 font-serif font-bold text-[10px] rounded-lg shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                  >
                    <Crown className="w-3 h-3 fill-amber-300 text-amber-500" />
                    <span>👑 프리미엄 상점</span>
                  </button>
                </div>

                {allMembers.filter((m) => m.id !== memberId).length === 0 ? (
                  <p className="text-xs text-center text-[#8C7B6E] py-4 italic font-serif">
                    아직 모임방에 다른 멤버가 가입하지 않았습니다. 초대 코드를 공유해 다른 멤버를 초대해 보세요!
                  </p>
                ) : (() => {
                  const otherMembers = allMembers.filter((m) => m.id !== memberId);
                  const membersToRender = isGroupUnlocked ? otherMembers : [otherMembers[0]];
                  
                  const matchMember = (idOrName: string, targetMember: Member) => {
                    if (!idOrName || !targetMember) return false;
                    const normInput = idOrName.trim().toLowerCase().replace(/님$/, "");
                    const normId = targetMember.id.trim().toLowerCase();
                    const normNick = targetMember.nickname.trim().toLowerCase().replace(/님$/, "");
                    return (
                      normId === normInput ||
                      normNick === normInput ||
                      normId.includes(normInput) ||
                      normInput.includes(normId) ||
                      normNick.includes(normInput) ||
                      normInput.includes(normNick)
                    );
                  };

                  return (
                    <div className="space-y-4">
                      {membersToRender.map((other, idx) => {
                        let pair = allPairs.find(
                          (p) =>
                            (matchMember(p.member_id_1, member) && matchMember(p.member_id_2, other)) ||
                            (matchMember(p.member_id_2, member) && matchMember(p.member_id_1, other))
                        );

                        const isGenericPair = pair && (
                          pair.label === "상생과 화합의 인연 메이트" ||
                          pair.label === "상생과 화합의 인연 조합" ||
                          (pair.description && pair.description.includes("서로 다른 기운이 자연스럽게 합을 이루는 조화로운 인연입니다"))
                        );

                        if (!pair || isGenericPair) {
                          pair = generateDynamicPairCompatibility(member, other);
                        }

                        const isM1First = matchMember(pair.member_id_1, member);
                        const isUnlockedItem = isGroupUnlocked || idx === 0;

                        return (
                          <div key={other.id} className="bg-white border border-[#D6CCBC] p-5 rounded-2xl space-y-4 shadow-xs text-left relative overflow-hidden">
                            <div className="flex items-center space-x-2 border-b border-[#E8E0D0] pb-2 text-xs font-serif font-bold text-[#2C3E50]">
                              <span className="p-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] text-sm leading-none shrink-0">
                                {member.character_emoji}
                              </span>
                              <span>{member.nickname}</span>
                              <span className="text-[#8C7B6E] font-sans">x</span>
                              <span className="p-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] text-sm leading-none shrink-0">
                                {other.character_emoji}
                              </span>
                              <span>{other.nickname}</span>
                              <span className="ml-auto bg-[#C0392B] text-white px-2.5 py-0.5 rounded-lg text-[11px] font-sans font-bold">{pair.score}점</span>
                              {idx === 0 && !isGroupUnlocked && (
                                <span className="ml-1.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                  FREE
                                </span>
                              )}
                              {isGroupUnlocked && (
                                <span className="ml-1.5 text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                  👑 UNLOCKED
                                </span>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div className="px-3 py-2 border border-amber-400/30 bg-amber-50/20 rounded-xl text-center text-xs font-bold leading-normal text-[#C0392B]">
                                ✨ {pair.label}
                              </div>

                              <p className="text-xs text-[#5A4D41] leading-relaxed font-semibold">{pair.description}</p>

                              {/* 4-Area Compatibility Breakdown inside MeView */}
                              {pair.saju && pair.ziwei && pair.mbti && pair.zodiac && (
                                <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#FAF0DE] space-y-3">
                                  <h5 className="text-[10px] font-extrabold text-[#C0392B] uppercase tracking-wider flex items-center gap-1">
                                    🔑 4대 영역별 상세 궁합 분석 ({member.nickname} ➔ {other.nickname} 상호작용)
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Saju */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs relative overflow-hidden">
                                      <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                        <span className="font-bold text-[11px] text-[#2C3E50]">☯️ 사주 궁합 분석</span>
                                        {isUnlockedItem ? (
                                          <span className="text-[9px] font-extrabold text-[#C0392B] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                            평균 {Math.round((pair.saju.score_1_to_2 + pair.saju.score_2_to_1) / 2)}점
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5 fill-amber-300" /> LOCK
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>나의 기운 ➔ {other.nickname}:</span>
                                        <span className="font-bold text-red-500">{isUnlockedItem ? (isM1First ? pair.saju.score_1_to_2 : pair.saju.score_2_to_1) : "🔒"}점</span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>{other.nickname} 기운 ➔ 나:</span>
                                        <span className="font-bold text-green-600">{isUnlockedItem ? (isM1First ? pair.saju.score_2_to_1 : pair.saju.score_1_to_2) : "🔒"}점</span>
                                      </div>
                                      {isUnlockedItem ? (
                                        <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/40 font-medium pt-1">
                                          {pair.saju.description}
                                        </p>
                                      ) : (
                                        <div className="relative pt-1">
                                          <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                            두 사람의 타고난 일주와 오행의 결합도를 정밀 해독하여, 서로에게 흘러가는 정신적 자양분과 천기간의 궁합 작용을 완전 해독한 결과입니다.
                                          </p>
                                          <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[0.2px]">
                                            <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-3xs flex items-center gap-0.5">
                                              🔒 프리미엄 전용 상세 해독
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Ziwei */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs relative overflow-hidden">
                                      <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                        <span className="font-bold text-[11px] text-[#2C3E50]">🌌 자미두수 궁합</span>
                                        {isUnlockedItem ? (
                                          <span className="text-[9px] font-extrabold text-[#C0392B] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{pair.ziwei.score}점</span>
                                        ) : (
                                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5 fill-amber-300" /> LOCK
                                          </span>
                                        )}
                                      </div>
                                      {isUnlockedItem ? (
                                        <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/40 font-medium pt-1">
                                          {pair.ziwei.description}
                                        </p>
                                      ) : (
                                        <div className="relative pt-1">
                                          <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                            별자리의 자미두수 명반 배치를 통해 본 전생의 인연 점수와, 두 사람의 혼의 교감 및 내면적 성격 궁합도를 동양 점성술로 완전히 규명한 분석 리포트입니다.
                                          </p>
                                          <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[0.2px]">
                                            <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-3xs flex items-center gap-0.5">
                                              🔒 프리미엄 전용 상세 해독
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* MBTI */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs relative overflow-hidden">
                                      {isMbtiRegistered(member) && isMbtiRegistered(other) ? (
                                        <>
                                          <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                            <span className="font-bold text-[11px] text-[#2C3E50]">🧠 MBTI 성향 궁합 분석</span>
                                            {isUnlockedItem ? (
                                              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                평균 {Math.round((pair.mbti.score_1_to_2 + pair.mbti.score_2_to_1) / 2)}점
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                                <Crown className="w-2.5 h-2.5 fill-amber-300" /> LOCK
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                            <span>나의 성정 ➔ {other.nickname}:</span>
                                            <span className="font-bold text-red-500">{isUnlockedItem ? (isM1First ? pair.mbti.score_1_to_2 : pair.mbti.score_2_to_1) : "🔒"}점</span>
                                          </div>
                                          <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                            <span>{other.nickname} 성정 ➔ 나:</span>
                                            <span className="font-bold text-green-600">{isUnlockedItem ? (isM1First ? pair.mbti.score_2_to_1 : pair.mbti.score_1_to_2) : "🔒"}점</span>
                                          </div>
                                          {isUnlockedItem ? (
                                            <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-emerald-500/40 font-medium pt-1">
                                              {pair.mbti.description}
                                            </p>
                                          ) : (
                                            <div className="relative pt-1">
                                              <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                                두 사람의 MBTI 유형 성향과 인지 기능 조화를 정밀 분석하여 행동양식 상성 조화를 완전 분석한 결과입니다.
                                              </p>
                                              <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[0.2px]">
                                                <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-3xs flex items-center gap-0.5">
                                                  🔒 프리미엄 전용 상세 해독
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                            <span className="font-bold text-[11px] text-[#2C3E50]">🧠 MBTI 성향 궁합 분석</span>
                                            <span className="text-[9px] text-[#8C7B6E] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                              미등록
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-[#8C7B6E] leading-relaxed pl-1.5 border-l border-gray-300 font-medium italic">
                                            {!isMbtiRegistered(member) && !isMbtiRegistered(other)
                                              ? `두 사람 모두 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없습니다.`
                                              : !isMbtiRegistered(member)
                                              ? `본인의 MBTI 정보가 등록되지 않아 성향 궁합을 분석할 수 없습니다.`
                                              : `${other.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없습니다.`}
                                          </p>
                                        </>
                                      )}
                                    </div>

                                    {/* Zodiac */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs relative overflow-hidden">
                                      <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                        <span className="font-bold text-[11px] text-[#2C3E50]">⭐ 별자리 궁합 분석</span>
                                        {isUnlockedItem ? (
                                          <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                            평균 {Math.round((pair.zodiac.score_1_to_2 + pair.zodiac.score_2_to_1) / 2)}점
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5 fill-amber-300" /> LOCK
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>나의 별자리 ➔ {other.nickname}:</span>
                                        <span className="font-bold text-red-500">{isUnlockedItem ? (isM1First ? pair.zodiac.score_1_to_2 : pair.zodiac.score_2_to_1) : "🔒"}점</span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>{other.nickname} 별자리 ➔ 나:</span>
                                        <span className="font-bold text-green-600">{isUnlockedItem ? (isM1First ? pair.zodiac.score_2_to_1 : pair.zodiac.score_1_to_2) : "🔒"}점</span>
                                      </div>
                                      {isUnlockedItem ? (
                                        <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-rose-500/40 font-medium pt-1">
                                          {pair.zodiac.description}
                                        </p>
                                      ) : (
                                        <div className="relative pt-1">
                                          <p className="text-[10px] text-[#5A4D41]/30 leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/20 font-medium blur-[2.5px] select-none pointer-events-none">
                                            두 사람의 태양 성좌 배치를 기반으로 한 수호행성의 기운 상호작용과 성격 조화를 해독한 결과입니다.
                                          </p>
                                          <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[0.2px]">
                                            <span className="text-[9px] font-black text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-3xs flex items-center gap-0.5">
                                              🔒 프리미엄 전용 상세 해독
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

                {activeTab === "premium" && (
                  <div className="space-y-6 text-left animate-fade-in">
                    {/* 4-Dimensional Cosmic Fusion Badges */}
                    {(() => {
                          const zodiacInfo = getWesternZodiac(member.birth_date);
                          const dmGan = member.saju.daymaster.gan;
                          const dmElem = member.saju.daymaster.element;
                          const dayPillarDetail = member.saju.pillars_detail?.find((p) => p.type === "일주")?.ganzi || `${member.saju.pillars.day.gan}${member.saju.pillars.day.ji}`;
                          
                          let ziweiStarsSummary = "명성 가득한 성좌";
                          if (member.saju.ziwei?.palaces) {
                            const mingGong = Object.values(member.saju.ziwei.palaces).find((p: any) => p.name === "命宮" || p.nameKr === "명궁") as any;
                            if (mingGong && mingGong.stars?.length) {
                              ziweiStarsSummary = mingGong.stars.slice(0, 3).map((s: any) => s.nameKr).join(" · ");
                            }
                          }

                          return (
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                              {/* 1. Saju */}
                              <div className="bg-white/70 border border-[#D6CCBC]/60 p-3 rounded-xl flex items-center space-x-2 shadow-2xs">
                                <span className="text-lg text-[#C0392B]">☯</span>
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] font-bold text-[#8C7B6E] uppercase tracking-wider">동양 사주명리</span>
                                  <span className="block text-[11px] font-bold text-[#5A4D41]">{dmGan}({dmElem}) · {dayPillarDetail}일주</span>
                                </div>
                              </div>

                              {/* 2. Zi Wei */}
                              <div className="bg-white/70 border border-[#D6CCBC]/60 p-3 rounded-xl flex items-center space-x-2 shadow-2xs">
                                <span className="text-lg text-[#C0392B]">🌌</span>
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] font-bold text-[#8C7B6E] uppercase tracking-wider">천상 자미두수</span>
                                  <span className="block text-[11px] font-bold text-[#5A4D41] truncate max-w-[130px] font-serif" title={ziweiStarsSummary}>{ziweiStarsSummary}</span>
                                </div>
                              </div>

                              {/* 3. Western Zodiac */}
                              <div className="bg-white/70 border border-[#D6CCBC]/60 p-3 rounded-xl flex items-center space-x-2 shadow-2xs">
                                <span className="text-lg text-[#C0392B]">{zodiacInfo.emoji}</span>
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] font-bold text-[#8C7B6E] uppercase tracking-wider">서양 황도별자리</span>
                                  <span className="block text-[11px] font-bold text-[#5A4D41]">{zodiacInfo.name}</span>
                                </div>
                              </div>

                              {/* 4. MBTI */}
                              <div className="bg-white/70 border border-[#D6CCBC]/60 p-3 rounded-xl flex items-center space-x-2 shadow-2xs">
                                <span className="text-lg text-[#C0392B]">🧬</span>
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] font-bold text-[#8C7B6E] uppercase tracking-wider">현대 성향심리</span>
                                  <span className="block text-[11px] font-bold text-[#5A4D41]">{member.mbti ? `${member.mbti.toUpperCase()}형 기운` : "미등록 상태"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Real-time Premium Horoscope Section */}
                        <div className="bg-gradient-to-br from-[#FCFAF2] via-white to-[#FAF6EE] border-2 border-amber-300 rounded-3xl p-5.5 space-y-5 shadow-md text-left relative overflow-hidden animate-fade-in no-print">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                          <div className="border-b border-amber-200 pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <Crown className="w-4 h-4 text-amber-600 fill-amber-300 animate-bounce" />
                                <h4 className="font-serif text-sm font-black text-[#2C3E50] tracking-tight flex items-center gap-1">
                                  실시간 동서양 우주 융합 운세 예보
                                </h4>
                              </div>
                              <p className="text-[10px] text-[#8C7B6E] leading-normal font-semibold">
                                타고난 사주명식 일주론과 오늘 하늘의 행성 궤도 기류, 그리고 나의 현대 성향(MBTI)을 융합한 고품격 개운 리포트입니다.
                              </p>
                            </div>
                          </div>

                          {horoscopeLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-3.5 text-center">
                              <div className="w-10 h-10 border-4 border-amber-200 border-t-[#C0392B] rounded-full animate-spin" />
                              <div className="space-y-1">
                                <p className="text-xs font-serif font-bold text-[#2C3E50] animate-pulse">오늘의 천기(氣) 기류와 우주 만세력을 연동하여 융합 운세를 해석하는 중...</p>
                                <p className="text-[10px] text-[#8C7B6E]">사주 일주론, 황도 백자리, MBTI 심리 데이터를 융합하고 있습니다.</p>
                              </div>
                            </div>
                          ) : horoscopeError ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
                              <p className="text-xs font-semibold text-red-700">{horoscopeError}</p>
                              <button
                                onClick={() => fetchHoroscope(true)}
                                className="px-3.5 py-1.5 bg-white border border-red-300 text-red-800 text-[10px] font-bold rounded-lg hover:bg-red-50"
                              >
                                다시 해독하기
                              </button>
                            </div>
                          ) : horoscope ? (
                            <div className="space-y-4">
                              {/* Period Tabs */}
                              <div className="grid grid-cols-4 gap-1 bg-[#FAF6EE] p-1 border border-amber-200 rounded-xl">
                                {(["today", "weekly", "monthly", "yearly"] as const).map((tab) => {
                                  const label = tab === "today" ? "오늘의 운세" : tab === "weekly" ? "주간 예보" : tab === "monthly" ? "월간 리포트" : "연간 대명운";
                                  const isActive = activeHoroscopeTab === tab;
                                  return (
                                    <button
                                      key={tab}
                                      type="button"
                                      onClick={() => setActiveHoroscopeTab(tab)}
                                      className={`py-2 text-center text-[10.5px] font-bold rounded-lg cursor-pointer transition-all ${
                                        isActive
                                          ? "bg-[#C0392B] text-white shadow-xs scale-[1.01]"
                                          : "text-[#5A4D41] hover:bg-amber-100/50"
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Selected Tab Content */}
                              {(() => {
                                const currentData = horoscope[activeHoroscopeTab];
                                if (!currentData) return null;

                                const renderRichText = (text: string) => {
                                  if (!text) return null;
                                  const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
                                  return (
                                    <div className="space-y-4 pt-1">
                                      {paragraphs.map((para, idx) => (
                                        <p key={idx} className="text-xs sm:text-[13px] md:text-[14px] text-[#4A3B2E] leading-relaxed md:leading-loose font-medium text-left">
                                          {para.startsWith("-") || para.startsWith("•") || para.startsWith("*") ? (
                                            <span className="flex items-start">
                                              <span className="text-amber-600 mr-2 shrink-0 mt-1">•</span>
                                              <span>{para.replace(/^[-•*]\s*/, "")}</span>
                                            </span>
                                          ) : para}
                                        </p>
                                      ))}
                                    </div>
                                  );
                                };

                                return (
                                  <div className="space-y-5 animate-fade-in">
                                    {/* Score and Summary Card */}
                                    <div className="bg-white border-2 border-[#D6CCBC] p-6 rounded-2xl space-y-4 shadow-xs relative overflow-hidden text-left">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C0392B]/5 to-transparent pointer-events-none" />
                                      <div className="flex items-center space-x-3 border-b border-amber-100 pb-3 flex-wrap gap-2">
                                        <div className="flex flex-col items-center justify-center bg-[#FAF6EE] border border-amber-300 rounded-xl px-3.5 py-1.5 shrink-0 shadow-3xs">
                                          <span className="text-[9px] text-amber-900 font-black leading-none uppercase tracking-wider mb-1">행운 지수</span>
                                          <span className="text-sm font-serif font-black text-[#C0392B] leading-none">{currentData.score}점</span>
                                        </div>
                                        <h4 className="font-serif text-sm md:text-base font-black text-[#2C3E50] tracking-tight flex items-center gap-1.5">
                                          🌟 {activeHoroscopeTab === "today" ? "오늘의 운세 (今日之運)" : activeHoroscopeTab === "weekly" ? "주간 예보 (週間之運)" : activeHoroscopeTab === "monthly" ? "월간 리포트 (月間之運)" : "연간 대명운 (年間之運)"}
                                        </h4>
                                      </div>
                                      
                                      <div className="space-y-3 font-serif leading-relaxed">
                                        {renderRichText(currentData.summary)}
                                      </div>
                                    </div>

                                    {/* Today Fortune Details */}
                                    {activeHoroscopeTab === "today" && (
                                      <div className="space-y-4">
                                        {/* Lucky Items Grid */}
                                        <div className="bg-white border-2 border-[#D6CCBC]/80 rounded-2xl p-5 space-y-4 shadow-3xs">
                                          <span className="text-xs font-black text-amber-900 uppercase tracking-wider block border-b border-amber-100 pb-2 text-left">🔑 오행 개운(開運)의 무기 & 행운 처방</span>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                            {/* Lucky Color */}
                                            <div className="bg-[#FCFAF6] border border-[#FAF0DE] p-4 rounded-xl space-y-2 shadow-xs">
                                              <div className="flex items-center space-x-2 border-b border-amber-100/60 pb-1.5">
                                                <span className="text-sm">🎨</span>
                                                <span className="text-[10px] font-black text-[#8C7B6E] tracking-wider uppercase">행운의 컬러 (吉色)</span>
                                              </div>
                                              <p className="text-xs md:text-sm text-[#5A4D41] leading-relaxed font-serif pt-0.5">
                                                {currentData.lucky_items?.color}
                                              </p>
                                            </div>

                                            {/* Lucky Number */}
                                            <div className="bg-[#FCFAF6] border border-[#FAF0DE] p-4 rounded-xl space-y-2 shadow-xs">
                                              <div className="flex items-center space-x-2 border-b border-amber-100/60 pb-1.5">
                                                <span className="text-sm">🔢</span>
                                                <span className="text-[10px] font-black text-[#8C7B6E] tracking-wider uppercase">행운의 숫자 (吉數)</span>
                                              </div>
                                              <p className="text-xs md:text-sm text-[#5A4D41] leading-relaxed font-serif pt-0.5">
                                                {currentData.lucky_items?.number}
                                              </p>
                                            </div>

                                            {/* Lucky Direction */}
                                            <div className="bg-[#FCFAF6] border border-[#FAF0DE] p-4 rounded-xl space-y-2 shadow-xs">
                                              <div className="flex items-center space-x-2 border-b border-amber-100/60 pb-1.5">
                                                <span className="text-sm">🧭</span>
                                                <span className="text-[10px] font-black text-[#8C7B6E] tracking-wider uppercase">행운의 길방 (吉方)</span>
                                              </div>
                                              <p className="text-xs md:text-sm text-[#5A4D41] leading-relaxed font-serif pt-0.5">
                                                {currentData.lucky_items?.direction}
                                              </p>
                                            </div>

                                            {/* Lucky Time */}
                                            <div className="bg-[#FCFAF6] border border-[#FAF0DE] p-4 rounded-xl space-y-2 shadow-xs">
                                              <div className="flex items-center space-x-2 border-b border-amber-100/60 pb-1.5">
                                                <span className="text-sm">⏰</span>
                                                <span className="text-[10px] font-black text-[#8C7B6E] tracking-wider uppercase">최적 개운 시간대 (吉時)</span>
                                              </div>
                                              <p className="text-xs md:text-sm text-[#5A4D41] leading-relaxed font-serif pt-0.5">
                                                {currentData.lucky_items?.time}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                              {/* Weekly Fortune Details */}
                              {activeHoroscopeTab === "weekly" && (
                                <div className="space-y-5">
                                  {/* Weekly Core Aspects Stack */}
                                  <div className="space-y-4">
                                    <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                        <span className="text-base">🤝</span>
                                        <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">대인관계 & 소셜 파트너십 (人際關係)</span>
                                      </div>
                                      <div className="space-y-2.5">
                                        {renderRichText(currentData.love_and_social)}
                                      </div>
                                    </div>

                                    <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                        <span className="text-base">💰</span>
                                        <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">재물 흐름 & 직업적 비결 (財物職境)</span>
                                      </div>
                                      <div className="space-y-2.5">
                                        {renderRichText(currentData.wealth_and_job)}
                                      </div>
                                    </div>

                                    <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                        <span className="text-base">🔋</span>
                                        <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">건강 에너지 & 오행 보충법 (健康五行)</span>
                                      </div>
                                      <div className="space-y-2.5">
                                        {renderRichText(currentData.health_and_energy)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Daily Flow Timeline */}
                                  {currentData.daily_flow && Array.isArray(currentData.daily_flow) && (
                                    <div className="bg-white border-2 border-[#D6CCBC]/80 rounded-2xl p-5 space-y-4 shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-2">
                                        <span className="text-base">📅</span>
                                        <span className="text-xs sm:text-sm font-black text-amber-900 tracking-tight">주간 요일별 집중 운세 예보 (曜日運勢)</span>
                                      </div>
                                      <div className="relative pl-4 border-l-2 border-amber-200/50 space-y-5 ml-4">
                                        {currentData.daily_flow.map((flowText: string, fIdx: number) => {
                                          const dayLabel = ["월", "화", "수", "목", "금", "토", "일"][fIdx] || "";
                                          const isWeekend = dayLabel === "토" || dayLabel === "일";
                                          return (
                                            <div key={fIdx} className="relative flex items-start space-x-3 text-left">
                                              {/* Timeline Node */}
                                              <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 ${
                                                isWeekend ? "bg-amber-100 border-[#C0392B]" : "bg-white border-amber-600"
                                              } flex items-center justify-center`} />
                                              
                                              <div className="space-y-1 flex-1">
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                                                  isWeekend ? "bg-amber-100 text-[#C0392B]" : "bg-neutral-100 text-neutral-800"
                                                }`}>
                                                  {dayLabel}요일
                                                </span>
                                                <p className="text-xs sm:text-[13px] text-[#4A3B2E] font-medium leading-relaxed font-serif pt-1">
                                                  {flowText}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Monthly Fortune Details */}
                              {activeHoroscopeTab === "monthly" && (
                                <div className="space-y-5">
                                  {/* Monthly Core Aspects Stack */}
                                  <div className="space-y-4">
                                    <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                        <span className="text-base">🔮</span>
                                        <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">이번 달 지배적 대주제 (大主題)</span>
                                      </div>
                                      <div className="space-y-2.5">
                                        {renderRichText(currentData.key_theme)}
                                      </div>
                                    </div>

                                    <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-emerald-100 pb-2 mb-3">
                                        <span className="text-base">🎯</span>
                                        <span className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight">포착해야 할 우주적 기회 (宇宙機會)</span>
                                      </div>
                                      <div className="space-y-2.5">
                                        {renderRichText(currentData.opportunities)}
                                      </div>
                                    </div>

                                    <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-rose-100 pb-2 mb-3">
                                        <span className="text-base">⚠️</span>
                                        <span className="text-xs sm:text-sm font-black text-rose-950 tracking-tight">경계해야 할 운명적 돌발 장해 (運命陷阱)</span>
                                      </div>
                                      <div className="space-y-2.5">
                                        {renderRichText(currentData.precautions)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Weeks Flow Timeline */}
                                  {currentData.weeks_flow && Array.isArray(currentData.weeks_flow) && (
                                    <div className="bg-white border-2 border-[#D6CCBC]/80 rounded-2xl p-5 space-y-4 shadow-3xs text-left">
                                      <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-2">
                                        <span className="text-base">📅</span>
                                        <span className="text-xs sm:text-sm font-black text-amber-900 tracking-tight">주차별 집중 흐름 리포트 (週次運勢)</span>
                                      </div>
                                      <div className="relative pl-4 border-l-2 border-amber-200/50 space-y-5 ml-4">
                                        {currentData.weeks_flow.map((weekText: string, wIdx: number) => (
                                          <div key={wIdx} className="relative flex items-start space-x-3 text-left">
                                            {/* Timeline Node */}
                                            <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 bg-white border-amber-600 flex items-center justify-center" />
                                            
                                            <div className="space-y-1 flex-1">
                                              <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded-md text-[10px] font-black">
                                                {wIdx + 1}주차
                                              </span>
                                              <p className="text-xs sm:text-[13px] text-[#4A3B2E] font-medium leading-relaxed font-serif pt-1">
                                                {weekText}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Yearly Fortune Details */}
                              {activeHoroscopeTab === "yearly" && (
                                <div className="space-y-4">
                                  <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                    <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                      <span className="text-base">🌀</span>
                                      <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">올해 거시적 운명의 변곡점 (大變局)</span>
                                    </div>
                                    <div className="space-y-2.5">
                                      {renderRichText(currentData.grand_trend)}
                                    </div>
                                  </div>

                                  <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                    <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                      <span className="text-base">💰</span>
                                      <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">대재운(財運) 축적 로드맵 (積財之路)</span>
                                    </div>
                                    <div className="space-y-2.5">
                                      {renderRichText(currentData.wealth_flow)}
                                    </div>
                                  </div>

                                  <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                    <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                      <span className="text-base">💼</span>
                                      <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">진로·이직·승진 비즈니스 비결 (官運事業)</span>
                                    </div>
                                    <div className="space-y-2.5">
                                      {renderRichText(currentData.career_path)}
                                    </div>
                                  </div>

                                  <div className="bg-[#FCFAF6] border-2 border-[#D6CCBC]/60 p-5 rounded-2xl shadow-3xs text-left">
                                    <div className="flex items-center space-x-2 border-b border-amber-100 pb-2 mb-3">
                                      <span className="text-base">🧠</span>
                                      <span className="text-xs sm:text-sm font-black text-[#2C3E50] tracking-tight">내면의 수양 및 무한한 자아성장 (心靈成長)</span>
                                    </div>
                                    <div className="space-y-2.5">
                                      {renderRichText(currentData.personal_growth)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                        <p className="text-xs text-[#8C7B6E] font-semibold leading-normal">
                          실시간 우주 융합 운세를 해독할 수 있습니다.
                        </p>
                        <button
                          type="button"
                          onClick={() => fetchHoroscope(true)}
                          className="px-4 py-2 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-black rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
                        >
                          🔮 실시간 운세 해독 시작하기
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Premium-Gated Lifetime Report Content */}
                  {aiAnalysis ? (
                    <div className="relative overflow-hidden rounded-2xl">
                    <div className={!isPdfUnlocked ? "filter blur-md opacity-30 select-none pointer-events-none space-y-5" : "space-y-5"}>
                      {/* Keywords representation */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {aiAnalysis.keywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-3.5 py-1.5 bg-[#FCFAF6] border border-[#C0392B]/20 rounded-full text-xs font-bold text-[#C0392B]"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>

                      {/* Character overview description */}
                      <div className="p-5 bg-white border border-[#D6CCBC] rounded-2xl text-xs leading-relaxed text-[#5A4D41] shadow-xs relative">
                        <span className="font-serif text-2xl text-[#C0392B] absolute -top-2 left-4 bg-white px-1 leading-none select-none">
                          “
                        </span>
                        <p className="pt-2 pl-3 line-clamp-none font-medium">{aiAnalysis.character_desc}</p>
                      </div>

                      {/* 4 areas of interpreting */}
                      <div className="grid grid-cols-1 gap-4">
                        {/* 1. Essence */}
                        <div id="essence-area" className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-5 rounded-2xl space-y-2.5 shadow-xs transition hover:shadow-sm">
                          <div className="flex items-center text-[#C0392B] font-serif text-xs font-bold border-b border-[#E8E0D0] pb-2 uppercase tracking-wide">
                            <Compass className="w-3.5 h-3.5 mr-1.5" />
                            <span>{isMyOwnProfile ? "본질 - 본연의 특별한 기질과 천성" : `${member.nickname}님의 본질 - 본연의 특별한 기질과 천성`}</span>
                          </div>
                          <p className="text-xs text-[#5A4D41] leading-relaxed font-medium whitespace-pre-line">
                            {aiAnalysis.four_areas.essence}
                          </p>
                        </div>

                        {/* 2. Talent */}
                        <div id="talent-area" className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-5 rounded-2xl space-y-2.5 shadow-xs transition hover:shadow-sm">
                          <div className="flex items-center text-[#C0392B] font-serif text-xs font-bold border-b border-[#E8E0D0] pb-2 uppercase tracking-wide">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            <span>{isMyOwnProfile ? "재능 - 타고난 천직과 재주 발휘법" : `${member.nickname}님의 재능 - 타고난 천직과 재주 발휘법`}</span>
                          </div>
                          <p className="text-xs text-[#5A4D41] leading-relaxed font-bold whitespace-pre-line bg-[#FAF7F2]/40 p-2.5 rounded-lg border border-[#E8E0D0]/40">
                            {aiAnalysis.four_areas.talent}
                          </p>
                        </div>

                        {/* 3. Flow */}
                        <div id="flow-area" className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-5 rounded-2xl space-y-3.5 shadow-xs transition hover:shadow-sm">
                          <div className="flex items-center text-[#C0392B] font-serif text-xs font-bold border-b border-[#E8E0D0] pb-2 uppercase tracking-wide">
                            <Activity className="w-3.5 h-3.5 mr-1.5" />
                            <span>{isMyOwnProfile ? "흐름 - 현재 나의 10년 인생 대운(大運) 통합 로드맵" : `흐름 - ${member.nickname}님의 10년 인생 대운(大運) 통합 로드맵`}</span>
                          </div>
                          <p className="text-xs text-[#5A4D41] leading-relaxed font-medium whitespace-pre-line">
                            {aiAnalysis.four_areas.flow}
                          </p>
                          <div className="mt-2.5 pt-3.5 border-t border-[#E8E0D0]/50">
                            <SajuVisual saju={member.saju} showOnlyDaewoon={true} isPremium={isPdfUnlocked} />
                          </div>
                        </div>

                        {/* 4. Fortune */}
                        <div id="fortune-area" className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-5 rounded-2xl space-y-2.5 shadow-xs transition hover:shadow-sm">
                          <div className="flex items-center text-[#C0392B] font-serif text-xs font-bold border-b border-[#E8E0D0] pb-2 uppercase tracking-wide">
                            <Coins className="w-3.5 h-3.5 mr-1.5" />
                            <span>{isMyOwnProfile ? "생활 기운 - 재물 · 인연 · 사업 · 건강 총평" : `${member.nickname}님의 생활 기운 - 재물 · 인연 · 사업 · 건강 총평`}</span>
                          </div>
                          <p className="text-xs text-[#5A4D41] leading-relaxed font-medium whitespace-pre-line">
                            {aiAnalysis.four_areas.fortune}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Premium Upgrade Overlay for 3단계 */}
                    {!isPdfUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/35 flex items-center justify-center p-4 text-center">
                        <div className="w-full max-w-sm bg-[#FAF7F2] border border-amber-300 rounded-[24px] p-6 shadow-2xl space-y-4 text-center animate-scale-up">
                          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-3xs">
                            <Crown className="w-5 h-5 text-amber-600 fill-amber-300 animate-pulse" />
                          </div>
                          <div className="space-y-1.5">
                            <h5 className="font-serif text-xs font-black text-[#2C3E50]">
                              🔑 3단계: 통합 우주 평생 감정서 잠김
                            </h5>
                            <p className="text-[10px] text-[#8C7B6E] leading-relaxed font-semibold">
                              {isMyOwnProfile 
                                ? "나의 평생 키워드, 천성과 기질(본질), 직업/천직(재능), 그리고 10년 인생 대운(大運) 통합 로드맵과 인생 리듬 주기(흐름/생활기운)가 즉시 융합 해설서로 해금됩니다."
                                : `${member.nickname}님의 평생 키워드, 천성과 기질(본질), 직업/천직(재능), 그리고 10년 인생 대운(大運) 통합 로드맵과 인생 리듬 주기(흐름/생활기운)가 즉시 융합 해설서로 해금됩니다.`
                              }
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShopInitialTab("pdf");
                              setIsShopOpen(true);
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded-lg text-[10px] font-serif font-extrabold hover:shadow-md hover:scale-[1.01] transition cursor-pointer"
                          >
                            🔓 AI 심층 리포트 (PDF) 해금하러 가기
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                  ) : (
                <div className="bg-white border border-[#D6CCBC] p-5.5 rounded-2xl text-center space-y-4 shadow-xs">
                  <p className="text-xs text-[#8C7B6E] leading-relaxed font-serif">
                    아직 본인의 <strong>우주 평생 감정서</strong>가 설계되지 않았습니다.
                    <br />
                    상단의 <strong>[실시간 인연 궁합 전체 업데이트]</strong> 버튼을 탭하시거나,
                    모임 대기판에서 <strong>[우리 모임 궁합 보기]</strong>를 한 번 실행해 주시면,
                    AI가 즉시 나의 평생 운세 해석과 키워드를 완벽하게 해독해 냅니다!
                  </p>
                </div>
              )}

              {/* 모임 멤버들과의 동서양 인연 궁합 케미 (무제한 해금됨) */}
              <div className="space-y-4 pt-6 border-t border-[#E8E0D0] animate-fade-in text-left">
                <div className="flex items-center space-x-1.5 pb-1">
                  <Crown className="w-4 h-4 text-amber-600 fill-amber-300 animate-pulse" />
                  <h4 className="font-serif text-sm font-bold text-[#2C3E50]">
                    모임 멤버들과의 동서양 인연 궁합 케미 (무제한 해금됨)
                  </h4>
                </div>

                {allMembers.filter((m) => m.id !== memberId).length === 0 ? (
                  <p className="text-xs text-center text-[#8C7B6E] py-4 italic font-serif">
                    아직 모임방에 다른 멤버가 가입하지 않았습니다. 초대 코드를 공유해 다른 멤버를 초대해 보세요!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {allMembers
                      .filter((m) => m.id !== memberId)
                      .map((otherMember, idx) => {
                        const matchMember = (idOrName: string, targetMember: Member) => {
                          if (!idOrName || !targetMember) return false;
                          const normInput = idOrName.trim().toLowerCase().replace(/님$/, "");
                          const normId = targetMember.id.trim().toLowerCase();
                          const normNick = targetMember.nickname.trim().toLowerCase().replace(/님$/, "");
                          return (
                            normId === normInput ||
                            normNick === normInput ||
                            normId.includes(normInput) ||
                            normInput.includes(normId) ||
                            normNick.includes(normInput) ||
                            normInput.includes(normNick)
                          );
                        };

                        let pair = allPairs.find(
                          (p) =>
                            (matchMember(p.member_id_1, member) && matchMember(p.member_id_2, otherMember)) ||
                            (matchMember(p.member_id_2, member) && matchMember(p.member_id_1, otherMember))
                        );

                        const isGenericPair = pair && (
                          pair.label === "상생과 화합의 인연 메이트" ||
                          pair.label === "상생과 화합의 인연 조합" ||
                          (pair.description && pair.description.includes("서로 다른 기운이 자연스럽게 합을 이루는 조화로운 인연입니다"))
                        );

                        if (!pair || isGenericPair) {
                          pair = generateDynamicPairCompatibility(member, otherMember);
                        }

                        const isM1First = matchMember(pair.member_id_1, member);
                        const isLocked = !isSecretUnlocked && idx > 0;

                        return (
                          <div key={otherMember.id} className="bg-white border border-[#D6CCBC] p-5 rounded-2xl space-y-4 shadow-xs text-left relative overflow-hidden">
                            <div className="flex items-center space-x-2 border-b border-[#E8E0D0] pb-2 text-xs font-serif font-bold text-[#2C3E50]">
                              <span className="p-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] text-sm leading-none shrink-0">
                                {member.character_emoji}
                              </span>
                              <span>{member.nickname}</span>
                              <span className="text-[#8C7B6E] font-sans">x</span>
                              <span className="p-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] text-sm leading-none shrink-0">
                                {otherMember.character_emoji}
                              </span>
                              <span>{otherMember.nickname}</span>
                              <span className="ml-auto bg-[#C0392B] text-white px-2.5 py-0.5 rounded-lg text-[11px] font-sans font-bold">{pair.score}점</span>
                              {isLocked && (
                                <span className="ml-1.5 text-[9px] font-black text-[#C0392B] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-700" /> Locked
                                </span>
                              )}
                            </div>

                            <div className={isLocked ? "filter blur-sm opacity-25 select-none pointer-events-none space-y-4" : "space-y-4"}>
                              {/* Elegant Full-width humorous label callout */}
                              <div className="px-3 py-2 border border-amber-400/30 bg-amber-50/20 rounded-xl text-center text-xs font-bold leading-normal text-[#C0392B]">
                                ✨ {pair.label}
                              </div>

                              <p className="text-xs text-[#5A4D41] leading-relaxed font-semibold">{pair.description}</p>

                              {/* Detailed 4-Area Compatibility Breakdown inside MeView */}
                              {pair.saju && pair.ziwei && pair.mbti && pair.zodiac && (
                                <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#FAF0DE] space-y-3">
                                  <h5 className="text-[10px] font-extrabold text-[#C0392B] uppercase tracking-wider flex items-center gap-1">
                                    🔑 4대 영역별 상세 궁합 분석 ({member.nickname} ➔ {otherMember.nickname} 상호작용)
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Saju */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs">
                                      <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                        <span className="font-bold text-[11px] text-[#2C3E50]">☯️ 사주 궁합 분석</span>
                                        <span className="text-[9px] font-extrabold text-[#C0392B] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                          평균 {Math.round((pair.saju.score_1_to_2 + pair.saju.score_2_to_1) / 2)}점
                                        </span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>나의 기운 ➔ {otherMember.nickname}:</span>
                                        <span className="font-bold text-red-500">{isM1First ? pair.saju.score_1_to_2 : pair.saju.score_2_to_1}점</span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>{otherMember.nickname} 기운 ➔ 나:</span>
                                        <span className="font-bold text-green-600">{isM1First ? pair.saju.score_2_to_1 : pair.saju.score_1_to_2}점</span>
                                      </div>
                                      <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-[#C0392B]/40 font-medium pt-1">
                                        {pair.saju.description}
                                      </p>
                                    </div>

                                    {/* Ziwei */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs">
                                      <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                        <span className="font-bold text-[11px] text-[#2C3E50]">🔮 자미두수 궁합 분석</span>
                                        <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                          평균 {Math.round((pair.ziwei.score_1_to_2 + pair.ziwei.score_2_to_1) / 2)}점
                                        </span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>나의 명궁 ➔ {otherMember.nickname}:</span>
                                        <span className="font-bold text-red-500">{isM1First ? pair.ziwei.score_1_to_2 : pair.ziwei.score_2_to_1}점</span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>{otherMember.nickname} 명궁 ➔ 나:</span>
                                        <span className="font-bold text-green-600">{isM1First ? pair.ziwei.score_2_to_1 : pair.ziwei.score_1_to_2}점</span>
                                      </div>
                                      <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-indigo-500/40 font-medium pt-1">
                                        {pair.ziwei.description}
                                      </p>
                                    </div>

                                    {/* MBTI */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs">
                                      {isMbtiRegistered(member) && isMbtiRegistered(otherMember) ? (
                                        <>
                                          <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                            <span className="font-bold text-[11px] text-[#2C3E50]">🧠 MBTI 성향 궁합 분석</span>
                                            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                              평균 {Math.round((pair.mbti.score_1_to_2 + pair.mbti.score_2_to_1) / 2)}점
                                            </span>
                                          </div>
                                          <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                            <span>나의 성정 ➔ {otherMember.nickname}:</span>
                                            <span className="font-bold text-red-500">{isM1First ? pair.mbti.score_1_to_2 : pair.mbti.score_2_to_1}점</span>
                                          </div>
                                          <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                            <span>{otherMember.nickname} 성정 ➔ 나:</span>
                                            <span className="font-bold text-green-600">{isM1First ? pair.mbti.score_2_to_1 : pair.mbti.score_1_to_2}점</span>
                                          </div>
                                          <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-emerald-500/40 font-medium pt-1">
                                            {pair.mbti.description}
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                            <span className="font-bold text-[11px] text-[#2C3E50]">🧠 MBTI 성향 궁합 분석</span>
                                            <span className="text-[9px] text-[#8C7B6E] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                              미등록
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-[#8C7B6E] leading-relaxed pl-1.5 border-l border-gray-300 font-medium italic">
                                            {!isMbtiRegistered(member) && !isMbtiRegistered(otherMember)
                                              ? `두 사람 모두 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없습니다. 상단에서 MBTI를 등록해보세요!`
                                              : !isMbtiRegistered(member)
                                              ? `본인의 MBTI 정보가 등록되지 않아 성향 궁합을 분석할 수 없습니다. 상단에서 MBTI를 등록해보세요!`
                                              : `${otherMember.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 분석할 수 없습니다.`}
                                          </p>
                                        </>
                                      )}
                                    </div>

                                    {/* Zodiac */}
                                    <div className="bg-[#FAF9F6] border border-[#FAF0DE] p-3 rounded-xl space-y-2 shadow-2xs">
                                      <div className="flex justify-between items-center border-b border-[#FAF0DE]/50 pb-1 flex-wrap gap-1">
                                        <span className="font-bold text-[11px] text-[#2C3E50]">⭐ 별자리 궁합 분석</span>
                                        <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                          평균 {Math.round((pair.zodiac.score_1_to_2 + pair.zodiac.score_2_to_1) / 2)}점
                                        </span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>나의 별자리 ➔ {otherMember.nickname}:</span>
                                        <span className="font-bold text-red-500">{isM1First ? pair.zodiac.score_1_to_2 : pair.zodiac.score_2_to_1}점</span>
                                      </div>
                                      <div className="text-[9px] text-[#8C7B6E] flex justify-between">
                                        <span>{otherMember.nickname} 별자리 ➔ 나:</span>
                                        <span className="font-bold text-green-600">{isM1First ? pair.zodiac.score_2_to_1 : pair.zodiac.score_1_to_2}점</span>
                                      </div>
                                      <p className="text-[10px] text-[#5A4D41] leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-rose-500/40 font-medium pt-1">
                                        {pair.zodiac.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Elegant Lock Overlay for idx > 0 */}
                            {isLocked && (
                              <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/95 to-white/90 flex flex-col items-center justify-center p-4 text-center">
                                <span className="p-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full mb-1.5">
                                  <Crown className="w-4 h-4 fill-amber-400 text-amber-700" />
                                </span>
                                <h6 className="font-serif text-[11px] font-black text-[#2C3E50] leading-none mb-1">
                                  🔒 두 번째 멤버와의 궁합부터는 프리미엄 전용입니다
                                </h6>
                                <p className="text-[9px] text-[#8C7B6E] max-w-[280px] leading-relaxed mb-3 font-medium">
                                  첫 번째 인연({allMembers.filter((m) => m.id !== memberId)[0]?.nickname || "첫 멤버"})의 정보는 무료로 감상하실 수 있습니다. 이 방의 전체 멤버들과의 상세 궁합 분석을 모두 열람해 보시겠어요?
                                </p>
                                <button
                                  onClick={async () => {
                                    const success = await activatePremiumSimulation("secret");
                                    if (success) {
                                      syncUnlockStates();
                                    }
                                  }}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-serif font-bold text-[10px] shadow-sm active:scale-[0.98] transition cursor-pointer"
                                >
                                  ✨ 7일 무료체험 시뮬레이션 즉시 활성화
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )}

        {/* Back Button */}
        <div className="pt-4 border-t border-[#E8E0D0]">
          <a
            href={`#/room/${code}`}
            className="block w-full py-3.5 bg-[#2C3E50] text-[#FAF7F2] hover:bg-[#1A252F] hover:scale-[0.99] text-center font-serif font-bold text-xs rounded-xl tracking-widest transition duration-200 cursor-pointer"
          >
            ← 다시 대기실 목록으로 돌아가기
          </a>
        </div>
      </div>

      {/* Floating Premium Shop Trigger */}
      <button
        type="button"
        onClick={() => {
          setShopInitialTab("pdf");
          setIsShopOpen(true);
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-serif font-extrabold text-[11px] tracking-wider rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-[0.97] transition-all cursor-pointer ring-4 ring-amber-100/50"
      >
        <Crown className="w-3.5 h-3.5 fill-amber-300 animate-pulse text-amber-200" />
        <span>인연 상점</span>
      </button>

      {/* Premium Shop Modal */}
      {isShopOpen && (
        <PremiumPaywall 
          isModal
          initialTab={shopInitialTab}
          onClose={() => setIsShopOpen(false)}
          onStatusChange={syncUnlockStates}
          memberCount={allMembers.length}
        />
      )}
    </Layout>
  );
}

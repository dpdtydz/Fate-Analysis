import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuVisual from "./SajuVisual";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { db, auth, signInWithGoogle, checkPremiumStatus, checkProductUnlock, activatePremiumSimulation, getFriendlyAuthErrorMessage, getUserTicketAccount, consumeSingleUseTicket, redeemCoupon } from "../lib/firebase";
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection } from "firebase/firestore";
import { Member, PersonalAnalysis } from "../types";
import { 
  Sparkles, ArrowLeft, Compass, Coins, Heart, Activity, LogIn, Crown, Printer,
  Sun, Calendar, Moon, MapPin, Clock, ShieldAlert, Gift, Briefcase, Award, ArrowUpRight,
  Lock, Unlock, Lightbulb, Users, Target, Flame, ShieldCheck, CheckCircle2, Zap, ArrowRight,
  FileText
} from "lucide-react";
import MbtiTest, { MBTI_EXPLANATIONS } from "./MbtiTest";
import PremiumPaywall from "./PremiumPaywall";
import GoogleAds from "./GoogleAds";
import { getSajuPillarsComprehensiveSynthesis } from "../utils/sajuSynthesis";
import { calculateTodayFortune } from "../utils/saju";
import ViralCardModal from "./ViralCardModal";
import ZodiacAvatar, { getMemberZodiacSrc, calculateMemberRole, ROLE_DETAILS } from "./ZodiacAvatar";

const ELEMENT_SPECS: Record<string, {
  hanja: string;
  en: string;
  colorName: string;
  serialPrefix: string;
  quote: string;
  tags: string[];
  stats: { label: string; val: number; color: string }[];
  desc: string;
  renderIcon: () => React.ReactNode;
}> = {
  "목": {
    hanja: "木",
    en: "WOOD",
    colorName: "곧게 뻗은 목(木)",
    serialPrefix: "WD",
    quote: '"겨울을 지나 기어이 싹을 틔우듯, 스스로 방향을 정하고 나아가요"',
    tags: ["추진력", "성장 마인드", "따뜻한 의리", "개척 정신"],
    stats: [
      { label: "추진력", val: 84, color: "#35B37E" },
      { label: "성장성", val: 78, color: "#C0392B" },
      { label: "신의", val: 70, color: "#E0A82E" },
      { label: "직관", val: 62, color: "#7C86A0" }
    ],
    desc: "어떤 환경에서도 스스로 길을 만들어내는 생명력을 지녔어요. 굽히지 않는 기개로 주변 사람들을 이끌지만, 때로는 휘어지는 유연함이 더 큰 성장을 만듭니다.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
        <line x1="24" y1="44" x2="24" y2="12" />
        <path d="M24 24 L36 14" />
        <path d="M24 30 L12 20" />
        <path d="M24 16 L32 8" />
        <path d="M24 12 L18 6" />
        <circle cx="24" cy="6" r="2.5" />
      </svg>
    )
  },
  "화": {
    hanja: "火",
    en: "FIRE",
    colorName: "타오르는 화(火)",
    serialPrefix: "FR",
    quote: '"어둠 속에서도 길을 밝히듯, 솔직하고 분명한 에너지가 있어요"',
    tags: ["직관적 판단", "솔직담백", "순발력", "영감"],
    stats: [
      { label: "순발력", val: 88, color: "#F0632E" },
      { label: "추진력", val: 76, color: "#35B37E" },
      { label: "직관", val: 82, color: "#C0392B" },
      { label: "포용력", val: 56, color: "#E0A82E" }
    ],
    desc: "주변의 공기를 단숨에 바꾸는 온기를 지녔어요. 마음에 품은 것은 투명하게 드러나며 뒤끝이 없지만, 에너지를 한 번에 쏟고 지치지 않도록 조절이 필요해요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
        <path d="M24 4 C24 4 12 18 12 28 C12 36 17 42 24 42 C31 42 36 36 36 28 C36 18 24 4 24 4 Z" />
        <path d="M24 20 C24 20 18 26 18 31 C18 35 20.5 38 24 38 C27.5 38 30 35 30 31 C30 26 24 20 24 20 Z" opacity="0.5" />
      </svg>
    )
  },
  "토": {
    hanja: "土",
    en: "EARTH",
    colorName: "너른 품의 토(土)",
    serialPrefix: "ER",
    quote: '"모든 것을 품어내는 대지처럼, 묵묵하고 단단한 중심이 있어요"',
    tags: ["깊은 신의", "안정감", "경청", "중재력"],
    stats: [
      { label: "신의", val: 89, color: "#E0A82E" },
      { label: "포용력", val: 85, color: "#35B37E" },
      { label: "결단력", val: 62, color: "#7C86A0" },
      { label: "혜안", val: 68, color: "#3B5BFF" }
    ],
    desc: "어떤 이야기도 묵묵히 받아내어 결실로 만드는 안식처예요. 중심이 단단해 곁에 있는 사람에게 큰 안정감을 주지만, 너무 많은 무게를 혼자 짊어지지 마세요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
        <polygon points="24,6 42,38 6,38" />
        <polyline points="15,22 24,14 33,22" opacity="0.4" />
        <line x1="6" y1="42" x2="42" y2="42" />
      </svg>
    )
  },
  "금": {
    hanja: "金",
    en: "METAL",
    colorName: "단단한 금(金)",
    serialPrefix: "MT",
    quote: '"칼이 잘 벼려져 있듯, 결정할 때 흔들리지 않아요"',
    tags: ["결단력", "완벽주의", "의리파", "명쾌한 판단"],
    stats: [
      { label: "결단력", val: 82, color: "#7C86A0" },
      { label: "추진력", val: 64, color: "#F0632E" },
      { label: "신의", val: 71, color: "#E0A82E" },
      { label: "혜안", val: 58, color: "#3B5BFF" }
    ],
    desc: "군더더기 없는 명쾌함으로 상황을 정리하는 사람이에요. 한번 정한 원칙은 잘 굽히지 않고, 그 단단함이 주변에 신뢰를 줍니다. 다만 스스로에게도 그 잣대를 들이대니, 가끔은 조금 무뎌져도 괜찮아요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
        <path d="M24 4 L40 14 L40 34 L24 44 L8 34 L8 14 Z" />
        <path d="M24 12 L33 17.5 L33 30.5 L24 36 L15 30.5 L15 17.5 Z" opacity="0.55" />
        <path d="M24 4 L24 12 M40 14 L33 17.5 M40 34 L33 30.5 M24 44 L24 36 M8 34 L15 30.5 M8 14 L15 17.5" opacity="0.35" />
      </svg>
    )
  },
  "수": {
    hanja: "水",
    en: "WATER",
    colorName: "깊은 지혜의 수(水)",
    serialPrefix: "AQ",
    quote: '"모난 돌을 감싸며 흐르듯, 깊은 혜안으로 길을 찾아요"',
    tags: ["깊은 혜안", "유연한 처세", "통찰력", "공감"],
    stats: [
      { label: "혜안", val: 86, color: "#3B5BFF" },
      { label: "유연성", val: 82, color: "#35B37E" },
      { label: "결단력", val: 60, color: "#7C86A0" },
      { label: "신의", val: 72, color: "#E0A82E" }
    ],
    desc: "바위에 부딪혀도 막히지 않고 길을 내어가는 지혜를 지녔어요. 상황을 넓게 보고 본질을 짚어내지만, 생각이 깊어져 실행을 망설이지 않도록 한 걸음 내딛어보세요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
        <path d="M6 18 C12 12, 18 24, 24 18 C30 12, 36 24, 42 18" />
        <path d="M6 26 C12 20, 18 32, 24 26 C30 20, 36 32, 42 26" opacity="0.7" />
        <path d="M6 34 C12 28, 18 40, 24 34 C30 28, 36 40, 42 34" opacity="0.4" />
      </svg>
    )
  }
};

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
      "NT": { title: "화려한 기획자 (火 + NT)", text: "모든 것을 명백하게 비추는 햇살 같은 총명함과 고도의 이성이 만났습니다. 머리 회전이 기가 막히게 빠르며 트렌드를 앞서 선점하고, 기발한 분석력과 프레젠테이션 수완으로 청중을 압도하는 브레인입니다." },
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

function getMissingRequiredFields(m?: any): string[] {
  const missing: string[] = [];
  
  // 1. 사주 일주론 (requires saju object, daymaster and pillars)
  const hasSaju = !!(m?.saju && m?.saju?.daymaster && m?.saju?.daymaster?.gan && m?.saju?.pillars);
  if (!hasSaju) {
    missing.push("사주 일주론");
  }

  // 2. 황도 백자리 (requires birth_date and zodiac)
  const zodiac = m?.birth_date ? getWesternZodiac(m.birth_date) : null;
  const hasZodiac = !!(m?.birth_date && zodiac && zodiac.name !== "알 수 없음");
  if (!hasZodiac) {
    missing.push("황도 백자리");
  }

  // 3. MBTI 심리 데이터
  const hasMbti = isMbtiRegistered(m);
  if (!hasMbti) {
    missing.push("MBTI 심리 데이터");
  }

  return missing;
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
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g1}의 기운이 ${g2}을 촉진해 주어, ${m1.nickname}님의 추진력이 ${m2.nickname}님의 성과로 부드럽게 이어지는 자연스러운 창조적 흐름입니다.`;
  } else if (isReceivingSajuSupport) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 23, 80, 95);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 59, 85, 97);
    sajuLabel = "상생과 든든한 조력 기류";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g2}의 포근한 기운이 ${g1}을 든든하게 생(生)해 주어, 서로 신뢰가 대단히 깊고 함께 대화하면 심리적 안정감을 얻는 훌륭한 관계입니다.`;
  } else if (elem1 === elem2) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 15, 78, 92);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 45, 78, 92);
    sajuLabel = "거울을 보듯 통하는 소울 조합";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. 서로 같은 '${elem1}'의 오행 기운을 공유하여, 굳이 많은 설명을 하지 않아도 깊은 동질감과 끈끈한 유대감을 나누는 잘 통하는 동료입니다.`;
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
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. ${z1.name}의 기운과 ${z2.name}의 기운이 활력 있게 만나 에너지를 지피거나 대지를 촉촉하게 가꿔주듯, 활기차고 성장을 자극하는 궁합입니다.`;
  } else {
    zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 33, 68, 85);
    zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 73, 68, 85);
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. 서로 다른 성좌 영역에 속해 있으나, 그렇기에 더욱 신선하고 평소 생각지 못한 각도에서 독창적인 아이디어와 새로운 관점을 제공해 줍니다.`;
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
      synergyBullet = "이성적이고 담백한 팩트 체크와 효율 중심 소통이 잘 맞아떨어집니다.";
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
    mbtiDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${mbtiScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${mbtiScore2to1}점. ${unreg}님이 성향 지표(MBTI)를 등록하지 않았으므로, 정통 사주와 성좌 데이터를 근간 삼아 입체적 관계를 다듬어 나갑니다.`;
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
      `${z1.name}와 ${z2.name}의 시너지 기류`
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
      `${z2.name}가 품어주는 상생 연대`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m2.nickname}님의 포근하고 넓은 ${meta2.nick} 기운이 ${m1.nickname}님의 섬세한 ${meta1.nick} 성정을 든든하게 받쳐주고 생(生)해주는 든든한 조력의 기류입니다. 두 분이 함께하면 일상에서 쌓였던 불안과 피로가 자연스럽게 풀리며 서로에 대한 깊은 신뢰가 굳건하게 형성됩니다.`,
      `${m2.nickname}님의 깊은 포용력이 ${m1.nickname}님의 무한한 가능성을 자상하게 이끌어내어 주는 기라성 같은 인연입니다. 힘든 고난이 찾아와도 서로를 향한 변치 않는 위로와 격려를 아끼지 않는 단단하고 돈독한 상생 조합입니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];

  } else if (elem1 === elem2) {
    const labelOptions = [
      `같은 ${elem1} 기운의 소울 메이트`,
      `거울을 보듯 깊이 공감하는 소통`,
      `${z1.name}와 ${z2.name}의 깊은 우정`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `서로 같은 '${elem1}'의 오행 원소를 풍부하게 공유하고 있어, 처음 만난 순간부터 영혼 깊숙이 통하는 대단한 동질감을 경험하는 조합입니다. 굳이 말 한마디를 나누지 않아도 눈빛만으로 상대의 의도와 마음을 꿰뚫어 보며, 변함없이 곁을 지켜주는 든든한 동반자가 되어줍니다.`,
      `서로 닮은꼴의 성향과 가치관을 지니고 있어 같은 방향을 바라보고 시원시원하게 나아가는 영혼의 단짝입니다. 갈등의 여지가 지극히 적으며, 서로에게 거울 같은 자극을 주며 동반 성장할 수 있는 안정적인 화합의 파트너십을 보여줍니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];

  } else if (isSajuClash) {
    const labelOptions = [
      `${nick1}과 ${nick2}의 긴장 속 혁신 케미`,
      `서로의 맹점을 메워주는 퍼즐`,
      `뜨겁고 날카로운 자극의 관계 기류`
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m1.nickname}님의 ${meta1.nick}과 ${m2.nickname}님의 ${meta2.nick}이 오행상 서로 극(剋)하며 은근한 텐션을 형성합니다. 하지만 이는 갈등이 아닌 서로의 맹점을 날카롭게 깨워주는 지적 자극제가 되며, 적절한 존중을 유지할 때 서로의 빈틈을 잘 메워주는 훌륭한 퍼즐이 됩니다.`,
      `서로 다른 시선과 가치관을 지녀 가끔씩 신선한 충격을 나누지만, 오히려 그렇기 때문에 평소에 생각해내지 못한 전혀 다른 창의적 각도의 해결책을 이끌어내며, 지적인 성장과 혁신을 최고치로 유도하는 파트너입니다.`
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];

  } else {
    const labelOptions = [
      `온화함 속에서 은은히 피어나는 신뢰`,
      `담백하고 편안한 상생 파트너`,
      `${z1.name}와 ${z2.name}의 온화한 화합`
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
  const [allPersonalAnalyses, setAllPersonalAnalyses] = useState<Record<string, PersonalAnalysis>>({});
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
  const [mainSection, setMainSection] = useState<"report" | "chemistry">("report");
  const [analysisTab, setAnalysisTab] = useState<"mix" | "fortune" | "elements" | "saju" | "ziwei">("mix");
  const [ticketAccount, setTicketAccount] = useState<any | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [showSoulCharExplanation, setShowSoulCharExplanation] = useState(false);
  const [expandedPairs, setExpandedPairs] = useState<Record<string, boolean>>({});
  const [isViralModalOpen, setIsViralModalOpen] = useState(false);
  const [viralCardTab, setViralCardTab] = useState<"identity" | "fortune" | "group" | "role">("identity");
  const [cardViewMode, setCardViewMode] = useState<"role" | "soul">("role");
  const isMaster = auth.currentUser?.email?.toLowerCase() === "lhs41977@gmail.com";
  const localMemberId = localStorage.getItem(`saju_member_id_${code}`) || "";
  const isViewingSelf = !localMemberId || localMemberId === memberId;

  // 오행 분포 통계 계산
  const ohaengCount = React.useMemo(() => {
    const saju = member?.saju;
    if (saju && saju.pillars) {
      const counts: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
      const ganToElem: Record<string, string> = {
        "갑": "목", "을": "목", "병": "화", "정": "화", "무": "토", "기": "토", "경": "금", "신": "금", "임": "수", "계": "수"
      };
      const jiToElem: Record<string, string> = {
        "인": "목", "묘": "목", "사": "화", "오": "화", "진": "토", "술": "토", "축": "토", "미": "토", "신": "금", "유": "금", "해": "수", "자": "수"
      };
      const parseVal = (val: any) => {
        if (!val || typeof val !== "string") return;
        const str = val.trim();
        if (ganToElem[str]) counts[ganToElem[str]]++;
        else if (jiToElem[str]) counts[jiToElem[str]]++;
        else {
          for (const ch of str) {
            if (ganToElem[ch]) { counts[ganToElem[ch]]++; break; }
            if (jiToElem[ch]) { counts[jiToElem[ch]]++; break; }
          }
        }
      };
      ['year', 'month', 'day', 'hour'].forEach((pKey) => {
        const pillar = saju.pillars[pKey];
        if (pillar) {
          if (pillar.gan) parseVal(pillar.gan);
          if (pillar.ji) parseVal(pillar.ji);
        }
      });
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total > 0) return counts;
    }
    return { "목": 1, "화": 2, "토": 2, "금": 2, "수": 1 };
  }, [member?.saju]);

  const totalOhaeng = Math.max(1, Number(Object.values(ohaengCount).reduce((a: number, b: any) => a + Number(b || 0), 0)));

  // 티켓 및 쿠폰 핸들러
  const handleUnlockWithTicketInMeView = async () => {
    if (isPdfUnlocked) return;
    const pdfTickets = (ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0);
    if (pdfTickets > 0) {
      try {
        const res = await consumeSingleUseTicket("pdf", {
          label: "심층 종합 감정서 해금"
        });
        if (res.success) {
          setIsPdfUnlocked(true);
          setIsPremium(true);
          localStorage.setItem("saju_unlocked_personal_report", "true");
          localStorage.setItem("saju_unlocked_pdf", "true");
          const acc = await getUserTicketAccount();
          setTicketAccount(acc);
        }
      } catch (e) {
        console.error("Ticket consume error:", e);
      }
    } else {
      setShopInitialTab("pdf");
      setIsShopOpen(true);
    }
  };

  const handleApplyCouponInMeView = async (couponCode: string) => {
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await registerCouponCode(couponCode);
      if (res.success) {
        setIsPdfUnlocked(true);
        setIsPremium(true);
        localStorage.setItem("saju_unlocked_personal_report", "true");
        localStorage.setItem("saju_unlocked_pdf", "true");
        const acc = await getUserTicketAccount();
        setTicketAccount(acc);
        return true;
      } else {
        setCouponError(res.message || "유효하지 않은 쿠폰입니다.");
        return false;
      }
    } catch (err: any) {
      setCouponError(err.message || "쿠폰 등록에 실패했습니다.");
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  // Premium Horoscope States
  const [horoscope, setHoroscope] = useState<any | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeError, setHoroscopeError] = useState("");
  const [activeHoroscopeTab, setActiveHoroscopeTab] = useState<"today" | "weekly" | "monthly" | "yearly">("today");

  const fetchHoroscope = async (force = false) => {
    if (!member) return;

    // 1. Check missing required fields
    const missingFields = getMissingRequiredFields(member);
    if (missingFields.length > 0) {
      setHoroscopeError(`필수 입력 정보가 누락되었습니다: ${missingFields.join(", ")}`);
      return;
    }

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
    const pdfStatus = await checkProductUnlock("pdf");
    const secretStatus = await checkProductUnlock("secret");
    const groupStatus = await checkProductUnlock("group");

    // 로컬 쿠폰 / 캐시 상태 교차 반영
    const isCouponPersonalUnlocked =
      localStorage.getItem("saju_unlocked_personal_report") === "true" ||
      localStorage.getItem("saju_unlocked_pdf") === "true" ||
      localStorage.getItem("saju_premium_unlocked_local") === "true";

    const finalPdf = status || pdfStatus || isCouponPersonalUnlocked;
    setIsPremium(status || isCouponPersonalUnlocked);
    setIsPdfUnlocked(finalPdf);
    setIsSecretUnlocked(status || secretStatus);
    setIsGroupUnlocked(status || groupStatus);
  };

  useEffect(() => {
    // Rely exclusively on onAuthStateChanged to sync initial unlock states,
    // avoiding unauthenticated requests before the transport layer resolves.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      syncUnlockStates();
      if (user && !user.isAnonymous) {
        try {
          const acc = await getUserTicketAccount(user.uid);
          setTicketAccount(acc);
        } catch (e) {
          console.debug("Failed to load ticket account in MeView:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Trigger horoscope loading when horoscope tab is viewed
  useEffect(() => {
    if (mainSection === "report" && analysisTab === "fortune" && member && !horoscope && !horoscopeLoading && !horoscopeError) {
      if (getMissingRequiredFields(member).length === 0) {
        fetchHoroscope();
      }
    }
  }, [mainSection, analysisTab, member, horoscope, horoscopeLoading, horoscopeError]);

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

  const reanalyzeWithMbti = async (updatedMembers: Member[], forceRecalculateIds: string[] = []) => {
    try {
      const enrichedMembers = updatedMembers.map(m => {
        if (forceRecalculateIds.includes(m.id)) {
          return m;
        }
        const existingPersonal = allPersonalAnalyses[m.id];
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
        body: JSON.stringify({ room_title: roomTitle || "친목모임", members: enrichedMembers }),
      });

      if (!response.ok) {
        throw new Error("AI 분석 갱신에 실패했습니다. 잠시 후 상단의 업데이트 버튼을 다시 눌러주세요.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("서버 혼잡 또는 네트워크 일시적 타임아웃이 발생했습니다. 잠시 후 상단의 업데이트 버튼을 눌러 다시 시도해 주세요.");
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
      if (aiData.personal) {
        setAllPersonalAnalyses(aiData.personal);
        if (aiData.personal[memberId]) {
          setAiAnalysis(aiData.personal[memberId]);
        }
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
      const enrichedMembers = allMembers.map(m => {
        const existingPersonal = allPersonalAnalyses[m.id];
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
        body: JSON.stringify({ room_title: roomTitle || "친목모임", members: enrichedMembers }),
      });

      if (!response.ok) {
        throw new Error("서버에서 AI 분석을 생성하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("서버 혼잡 또는 네트워크 일시적 타임아웃이 발생했습니다. 잠시 후 실시간 인연 궁합 업데이트 버튼을 눌러 다시 시도해 주세요.");
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
      if (aiData.personal) {
        setAllPersonalAnalyses(aiData.personal);
        if (aiData.personal[memberId]) {
          setAiAnalysis(aiData.personal[memberId] as PersonalAnalysis);
        } else {
          setAiAnalysis(null);
        }
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

      // Clear cached personal analysis for this user only, so it gets recalculated with the new MBTI
      setAllPersonalAnalyses((prev) => {
        const copy = { ...prev };
        delete copy[memberId];
        return copy;
      });
      setAiAnalysis(null);

      // Trigger automatic reanalysis to update individual/group interpretations with forced recalculation for this user!
      await reanalyzeWithMbti(updatedMembersList, [memberId]);
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

      // Clear cached personal analysis for this user only, so it gets recalculated without MBTI
      setAllPersonalAnalyses((prev) => {
        const copy = { ...prev };
        delete copy[memberId];
        return copy;
      });
      setAiAnalysis(null);

      // Trigger automatic reanalysis with forced recalculation for this user
      await reanalyzeWithMbti(updatedMembersList, [memberId]);
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
    birthplace_region?: string;
    birthplace_city?: string;
  }) => {
    if (!member) return;
    setEditOverlayMessage("내 정보를 저장하고 명식을 다시 해석하는 중이에요.");
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
        birthplace_region: formData.birthplace_region || null,
        birthplace_city: formData.birthplace_city || formData.saju?.birthplace?.name || null,
      };
      if (formData.mbti) {
        payload.mbti = formData.mbti;
      } else {
        payload.mbti = null;
      }

      await setDoc(memberRef, payload);

      const birthDateChanged = member.birth_date !== formData.birth_date;
      const mbtiChanged = member.mbti !== formData.mbti;
      const forceRecalc = birthDateChanged || mbtiChanged || !allPersonalAnalyses[memberId];

      if (forceRecalc) {
        setAllPersonalAnalyses((prev) => {
          const copy = { ...prev };
          delete copy[memberId];
          return copy;
        });
        setAiAnalysis(null);
      }

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

      setIsEditing(false);

      // Trigger automatic reanalysis to update individual/group interpretations immediately, forcing recalculation of current member only if changed!
      await reanalyzeWithMbti(updatedMembersList, forceRecalc ? [memberId] : []);
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
          if (cacheData.personal) {
            setAllPersonalAnalyses(cacheData.personal as Record<string, PersonalAnalysis>);
            if (cacheData.personal[memberId]) {
              setAiAnalysis(cacheData.personal[memberId] as PersonalAnalysis);
            }
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
      <Layout title="리포트 불러오는 중">
        <div className="flex flex-col items-center justify-center py-24 select-none">
          <div className="w-8 h-8 border-2 border-line border-t-ink rounded-full animate-spin" />
          <p className="text-xs text-ink-faint mt-3">사주 리포트를 불러오는 중입니다.</p>
        </div>
      </Layout>
    );
  }

  if (error || !member) {
    return (
      <Layout title="조회 실패" showHomeButton>
        <div className="text-center py-12 space-y-4">
          <p className="text-sm font-medium text-seal">{error || "기록을 찾을 수 없습니다."}</p>
          <a
            href={`#/room/${code}`}
            className="inline-block px-5 py-3 bg-sunken hover:bg-line text-ink rounded-xl text-sm font-semibold transition-colors"
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
            className="inline-flex items-center text-xs font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            모임방으로 돌아가기
          </a>
        </div>

        {isEditing ? (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="space-y-1">
              <h2 className="font-serif text-lg font-semibold text-ink">내 사주 정보 수정</h2>
              <p className="text-xs text-ink-soft">
                생년월일, 태어난 시각, 별명, 성별 정보를 고칠 수 있어요.
              </p>
            </div>

            {editError && (
              <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium text-center">
                {editError}
              </p>
            )}

            {isLoginRequiredToEdit ? (
              <div className="bg-surface border border-line p-6 rounded-xl text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-sunken flex items-center justify-center text-ink-soft">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[15px] font-semibold text-ink">소셜 로그인이 필요해요</h3>
                  <p className="text-xs text-ink-soft leading-relaxed max-w-xs mx-auto">
                    이 프로필은 소셜 계정으로 보호되어 있어요. 정보를 고치려면 참여할 때 사용한 Google 계정으로 로그인해 주세요.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setEditLoading(true);
                    setEditError("");
                    try {
                      await signInWithGoogle();
                    } catch (err: any) {
                      setEditError(getFriendlyAuthErrorMessage(err));
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  className="mx-auto flex items-center justify-center gap-2 px-5 py-3 bg-seal hover:bg-seal-deep text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors"
                >
                  Google 계정으로 로그인
                </button>
              </div>
            ) : (
              <SajuForm
                onSubmit={handleEditSubmit}
                submitButtonText="수정한 정보로 다시 분석하기"
                initialNickname={member.nickname}
                initialGender={member.gender as "남성" | "여성"}
                initialBirthDate={member.birth_date}
                initialBirthTime={member.birth_time}
                initialMbti={member.mbti}
                initialBirthplaceCity={member.saju?.birthplace?.name || (member as any).birthplace_city || null}
                initialBirthplaceRegion={(member as any).birthplace_region || null}
              />
            )}

            <button
              onClick={() => {
                setIsEditing(false);
                setEditError("");
              }}
              className="w-full py-3 bg-sunken hover:bg-line text-ink font-semibold text-sm rounded-xl transition-colors cursor-pointer text-center"
            >
              수정 취소하고 돌아가기
            </button>
          </div>
        ) : (
          <>
            {/* Header Soul / Role Card */}
            {(() => {
              const elemKey = member.saju?.daymaster?.element || "토";
              const rawG = member.saju?.daymaster?.gan || "무토";
              const g = rawG.length > 1 ? rawG[0] : rawG;
              const rawJ = member.saju?.pillars?.day?.ji || "진";
              const j = rawJ.length > 1 ? rawJ[0] : rawJ;
              const spec = ELEMENT_SPECS[elemKey] || ELEMENT_SPECS["토"];

              const ganCode = g.charCodeAt(0) % 10;
              const jiCode = j.charCodeAt(0) % 12;
              const serialNum = String(ganCode * 6 + jiCode + 1).padStart(3, "0");
              const cardSerial = `${spec.serialPrefix}-${serialNum} · ${g}${j}`;

              // 모임 속 시그니처 역할 산출
              const roleInfo = calculateMemberRole(member);
              const roleDetail = ROLE_DETAILS[roleInfo.key] || ROLE_DETAILS["keeper"];

              const ELEMENT_TO_ITEM_NAME: Record<string, string> = {
                "목": "보타이", "화": "선글라스", "토": "목도리", "금": "스마트 안경", "수": "헤드폰"
              };
              const BRANCH_TO_ANIMAL_KR: Record<string, string> = {
                "子": "쥐", "丑": "소", "寅": "호랑이", "卯": "토끼",
                "辰": "용", "巳": "뱀", "午": "말", "未": "양",
                "申": "원숭이", "酉": "닭", "戌": "개", "亥": "돼지"
              };
              const dayJi = member.saju?.pillars?.day?.ji || member.saju?.pillars?.year?.ji || member.character_animal;
              const yearJi = member.saju?.pillars?.year?.ji;
              const dayGan = member.saju?.daymaster?.gan;
              const dayElem = member.saju?.daymaster?.element || member.character_color || "금";
              const animalKr = dayJi ? BRANCH_TO_ANIMAL_KR[dayJi] : null;
              const yearAnimalKr = yearJi ? BRANCH_TO_ANIMAL_KR[yearJi] : null;
              const itemName = dayElem ? ELEMENT_TO_ITEM_NAME[dayElem] : null;

              // 역할 동물: 태어난 해의 띠(연지) 우선, 없으면 일지(dayJi)
              const roleBranch = yearJi || dayJi;

              return (
                <div className="w-full bg-surface rounded-xl p-6 sm:p-7 border border-line text-left animate-fade-in">
                  {/* 모임 속 역할 vs 사주 본질 전환 탭 */}
                  <div className="flex items-center justify-center p-1 bg-sunken rounded-xl max-w-xs mx-auto mb-5 border border-line/60">
                    <button
                      type="button"
                      onClick={() => setCardViewMode("role")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        cardViewMode === "role"
                          ? "bg-surface text-seal shadow-xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>모임 속 역할</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardViewMode("soul")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        cardViewMode === "soul"
                          ? "bg-surface text-ink shadow-xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>사주 본질 소울</span>
                    </button>
                  </div>

                  {/* 1. 상단: 시리얼 & 오행 표기 */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono tracking-[0.14em] text-ink-faint">
                      {cardViewMode === "role" ? `ROLE · ${roleDetail.hanja}` : cardSerial}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tracking-[0.08em] text-ink-faint">
                        {cardViewMode === "role" ? roleDetail.badge : `${spec.hanja} ${spec.en}`}
                      </span>
                      {isMyProfile && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-xs font-medium text-ink-soft hover:text-ink bg-sunken px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          수정
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. 엠블럼: 모임 속 역할(role: 띠+역할소품) vs 사주 본질(soul: 일지+본질소품) 캐릭터 분리 */}
                  <div className="w-[112px] h-[112px] mx-auto mb-4 flex items-center justify-center">
                    {cardViewMode === "role" ? (
                      <ZodiacAvatar
                        member={member}
                        branch={roleBranch}
                        role={roleInfo.key}
                        size={112}
                        fallbackEmoji={member.character_emoji}
                      />
                    ) : (
                      <ZodiacAvatar
                        member={member}
                        branch={dayJi}
                        element={dayElem}
                        size={112}
                        fallbackEmoji={member.character_emoji}
                      />
                    )}
                  </div>

                  {/* 3. 이름 헤드라인 */}
                  {cardViewMode === "role" ? (
                    <h1 className="text-center font-serif text-2xl font-semibold tracking-tight leading-snug text-ink mb-2">
                      {member.nickname}님은 모임의 <span className="text-seal">【{roleDetail.role}】</span>
                    </h1>
                  ) : (
                    <h1 className="text-center font-serif text-2xl font-semibold tracking-tight leading-snug text-ink mb-2">
                      {member.nickname}님은 <span className="text-seal">{spec.colorName}</span>
                    </h1>
                  )}

                  {/* 3.5. 캐릭터 선정 이유 및 모임 역할 연결 */}
                  {animalKr && dayGan && dayElem && (
                    <div className="mx-auto max-w-[340px] bg-sunken/60 rounded-xl px-4 py-2.5 mb-3 border border-line/40">
                      {cardViewMode === "role" ? (
                        <p className="text-[11px] text-ink-faint leading-relaxed text-center">
                          태어난 해의 <span className="font-semibold text-seal">{yearAnimalKr || animalKr}띠</span>와 성향이 어우러져{' '}
                          모임 안에서 <span className="font-semibold text-ink">{roleDetail.badge}</span> 역할을 톡톡히 해내요
                        </p>
                      ) : (
                        <p className="text-[11px] text-ink-faint leading-relaxed text-center">
                          <span className="font-semibold text-ink-soft">나의 일주</span>{' '}
                          <span className="font-mono text-ink">{dayGan}{dayJi}</span>에서{' '}
                          <span className="text-ink-soft">일지</span>{' '}
                          <span className="font-semibold text-seal">{animalKr}</span>가 나의 동물,{' '}
                          <span className="text-ink-soft">일간</span>{' '}
                          <span className="font-semibold text-seal">{dayElem}</span> 기운이{' '}
                          {itemName && <><span className="font-semibold text-ink">{itemName}</span> 소품으로</>} 표현돼요
                        </p>
                      )}
                    </div>
                  )}

                  {/* 4. 한 줄 정의 */}
                  <p className="text-center text-sm leading-relaxed text-ink-soft max-w-[320px] mx-auto mb-5">
                    {cardViewMode === "role" ? `"${roleDetail.tagline}"` : spec.quote}
                  </p>

                  {/* 5. 키워드 태그 */}
                  <div className="flex flex-wrap gap-1.5 justify-center mb-6">
                    {(cardViewMode === "role" ? roleDetail.tags : spec.tags).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium text-ink-soft bg-sunken px-3 py-1.5 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 6. 기질 스탯 4줄 */}
                  <div className="space-y-2.5 mb-6">
                    {(cardViewMode === "role" ? roleDetail.stats : spec.stats).map((st, idx) => (
                      <div key={idx} className="grid grid-cols-[56px_1fr_32px] items-center gap-2.5">
                        <span className="text-xs font-medium text-ink">
                          {st.label}
                        </span>
                        <div className="h-[7px] bg-sunken rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${st.val}%`, backgroundColor: st.color || "#B3382C" }}
                          />
                        </div>
                        <span className="text-xs font-mono text-right text-ink-faint">
                          {st.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 6.5. 역할 상세 설명 */}
                  {cardViewMode === "role" && (
                    <p className="p-3.5 bg-sunken/80 rounded-xl text-xs text-ink-soft leading-relaxed border border-line/40 mb-6 text-left">
                      {roleDetail.desc}
                    </p>
                  )}

                  {/* 7. 소울 포토 카드 모달 트리거 */}
                  <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink-soft">
                      소울 포토 카드 공유
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViralCardTab("role");
                          setIsViralModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-seal/10 text-seal hover:bg-seal/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-seal/20"
                      >
                        역할 카드
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setViralCardTab("group");
                          setIsViralModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-sunken hover:bg-line text-ink rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        케미
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setViralCardTab("identity");
                          setIsViralModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-sunken hover:bg-line text-ink rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        내 소울
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 1. MAIN NAVIGATION TABS: REPORT VS CHEMISTRY */}
            <div className="grid grid-cols-2 gap-1 bg-sunken p-1 rounded-xl text-sm mt-4 select-none">
              <button
                id="report-zone-tab"
                type="button"
                onClick={() => setMainSection("report")}
                className={`py-2.5 px-3 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  mainSection === "report"
                    ? "bg-surface text-ink font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink font-medium"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{isViewingSelf ? "내 사주 정밀 분석" : `${member.nickname}님의 사주 분석`}</span>
              </button>
              <button
                id="chemistry-zone-tab"
                type="button"
                onClick={() => setMainSection("chemistry")}
                className={`py-2.5 px-3 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  mainSection === "chemistry"
                    ? "bg-surface text-ink font-semibold shadow-xs"
                    : "text-ink-soft hover:text-ink font-medium"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1:1 인연 궁합</span>
              </button>
            </div>

            {/* 2. SECTION CONTENT */}
            {mainSection === "report" ? (
              !isMyOwnProfile && !isSecretUnlocked ? (
                /* PREMIUM LOCK GATEWAY FOR OTHER MEMBERS' PROFILES */
                <div className="bg-surface border border-line rounded-xl p-6 space-y-5 animate-fade-in text-left mt-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-ink-soft">
                    <Lock className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 text-center">
                    <h2 className="font-serif text-lg font-semibold text-ink">
                      다른 멤버의 상세 리포트는 잠겨 있어요
                    </h2>
                    <p className="text-xs text-ink-soft max-w-sm mx-auto leading-relaxed">
                      {member.nickname}님의 사주명식, 일주 총평, MBTI 결합 해석, 4대 영역 통합 감정서는 해금 후 볼 수 있어요.
                    </p>
                  </div>

                  {/* 해금 시 열리는 항목 */}
                  <div className="max-w-md mx-auto bg-sunken p-4 rounded-xl text-left">
                    <p className="text-xs font-medium text-ink mb-2">해금하면 열리는 내용</p>
                    <div className="divide-y divide-line text-xs text-ink-soft">
                      <div className="py-2.5 space-y-0.5">
                        <p className="font-medium text-ink">사주명식(만세력) 상세 정보</p>
                        <p className="text-xs leading-relaxed">상대의 일간·일지, 오행 구성 분포와 만세력 풀이</p>
                      </div>
                      <div className="py-2.5 space-y-0.5">
                        <p className="font-medium text-ink">MBTI와 사주 오행의 결합 해석</p>
                        <p className="text-xs leading-relaxed">본질 기질과 심리 지표가 어우러진 통합 성향 풀이</p>
                      </div>
                      <div className="py-2.5 space-y-0.5">
                        <p className="font-medium text-ink">동서양 4대 영역 통합 감정서</p>
                        <p className="text-xs leading-relaxed">타고난 기질, 평생 키워드, 천직과 재능, 10년 대운 로드맵</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col items-center max-w-md mx-auto w-full">
                    <button
                      onClick={() => {
                        setShopInitialTab("secret");
                        setIsShopOpen(true);
                      }}
                      className="w-full py-3 bg-seal hover:bg-seal-deep text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer text-center"
                    >
                      상세 리포트 해금하기 (2,900원)
                    </button>
                    <p className="text-xs text-ink-faint mt-2 text-center">
                      누르면 상품 설명과 무료 체험 상점이 열립니다.
                    </p>
                  </div>
                </div>
              ) : (
                /* ─────────────────────────────────────────────────────────────
                   [정밀 사주 분석 5개 탭 컨테이너] - MySajuView와 100% 동일한 구조
                   ───────────────────────────────────────────────────────────── */
                <div id="analysis-tabs-anchor" className="bg-surface border border-line rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs text-left mt-4 animate-fade-in">
                  {/* 상단 헤더 타이틀 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-semibold text-ink">
                        {isViewingSelf ? "내 사주 정밀 분석 리포트" : `${member.nickname}님의 사주 정밀 분석 리포트`}
                      </h3>
                      <p className="text-xs text-ink-soft mt-0.5">
                        타고난 기질과 운명의 계절, 그리고 현실 밀착 실전 사이다 처방전
                      </p>
                    </div>
                    {isPdfUnlocked && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
                        <Unlock className="w-3.5 h-3.5" />
                        심층 감정서 열람 중
                      </span>
                    )}
                  </div>

                  {/* 분석 탭 바 (모바일 가로 스크롤) */}
                  <div className="flex bg-sunken p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar text-sm select-none">
                    {([
                      { key: "mix", label: "심층 리포트", premium: true },
                      { key: "fortune", label: "오늘의 운세", premium: false },
                      { key: "elements", label: "오행 밸런스", premium: false },
                      { key: "saju", label: "사주 만세력", premium: true },
                      { key: "ziwei", label: "자미두수", premium: true },
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setAnalysisTab(tab.key)}
                        className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg transition-colors text-center flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap text-xs sm:text-sm ${
                          analysisTab === tab.key
                            ? "bg-surface text-ink font-semibold shadow-xs"
                            : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        <span>{tab.label}</span>
                        {tab.premium && !isPdfUnlocked && tab.key !== "mix" && (
                          <Lock className="w-3 h-3 shrink-0 text-ink-faint" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* 1. 통합 총평 (6대 챕터 정밀 분석) */}
                  {analysisTab === "mix" && (
                    <div className="space-y-4 animate-fade-in">
                      <SajuVisual
                        saju={member.saju}
                        isPremium={isPdfUnlocked}
                        selectedTab="mix"
                        hideTabNav={true}
                        userName={member.nickname}
                        birthDate={member.birth_date}
                        mbti={member.mbti}
                        hasTicket={((ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0)) > 0}
                        ticketCount={(ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0)}
                        onUnlockWithTicket={handleUnlockWithTicketInMeView}
                        onApplyCoupon={handleApplyCouponInMeView}
                        couponLoading={couponLoading}
                        couponError={couponError}
                      />
                    </div>
                  )}

                  {/* 2. 오늘의 운세 & 시기별 정밀 예보 */}
                  {analysisTab === "fortune" && (
                    <div className="space-y-5 animate-fade-in">
                      {getMissingRequiredFields(member).length > 0 ? (
                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 w-full">
                          <div className="space-y-1.5 max-w-sm w-full">
                            <h3 className="text-[15px] font-semibold text-ink">
                              필수 정보가 아직 입력되지 않았어요
                            </h3>
                            <p className="text-xs text-ink-soft leading-relaxed px-2">
                              맞춤 운세를 보려면 사주 일주론, 성좌, MBTI 성향 데이터를 모두 입력해 주세요.
                            </p>
                            <div className="bg-sunken rounded-xl p-3 text-left space-y-1.5 max-w-xs mx-auto mt-2 w-full">
                              <p className="text-xs font-medium text-ink pb-1">누락된 항목</p>
                              <div className="flex flex-col gap-1">
                                {getMissingRequiredFields(member).map((f) => (
                                  <span key={f} className="text-xs text-ink-soft">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          {isMyProfile && (
                            <button
                              type="button"
                              onClick={() => setIsEditing(true)}
                              className="px-5 py-3 bg-seal hover:bg-seal-deep text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                            >
                              필수 정보 입력하러 가기
                            </button>
                          )}
                        </div>
                      ) : horoscopeLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3.5 text-center w-full">
                          <div className="w-8 h-8 border-2 border-line border-t-ink rounded-full animate-spin" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-ink">오늘의 일진(日辰)과 만세력을 연결해 운세를 읽는 중이에요.</p>
                            <p className="text-xs text-ink-faint">사주 일주론, 성좌, MBTI 성향 데이터를 함께 분석하고 있어요.</p>
                          </div>
                        </div>
                      ) : horoscopeError ? (
                        <div className="p-4 bg-sunken rounded-xl text-center space-y-2.5">
                          <p className="text-xs font-medium text-seal">{horoscopeError}</p>
                          <button
                            onClick={() => fetchHoroscope(true)}
                            className="px-4 py-2 bg-surface hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            다시 불러오기
                          </button>
                        </div>
                      ) : horoscope ? (
                        <div className="space-y-6">
                          {/* Period Tabs: Segmented Control */}
                          <div className="grid grid-cols-4 gap-1 bg-sunken p-1 rounded-xl">
                            {(["today", "weekly", "monthly", "yearly"] as const).map((tab) => {
                              const label = tab === "today" ? "오늘 운세" : tab === "weekly" ? "주간 예보" : tab === "monthly" ? "월간 리포트" : "연간 운세";
                              const isActive = activeHoroscopeTab === tab;
                              const IconComponent = tab === "today" ? Sun : tab === "weekly" ? Calendar : tab === "monthly" ? Moon : Compass;
                              return (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={() => setActiveHoroscopeTab(tab)}
                                  className={`py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 text-xs rounded-lg cursor-pointer transition-colors ${
                                    isActive
                                      ? "bg-surface text-ink font-semibold shadow-xs"
                                      : "text-ink-soft hover:text-ink font-medium"
                                  }`}
                                >
                                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-ink" : "text-ink-faint"}`} />
                                  <span className="hidden sm:inline">{label}</span>
                                  <span className="sm:hidden">{label.split(" ")[0]}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Tab Content */}
                          {(() => {
                            const currentData = horoscope[activeHoroscopeTab];
                            if (!currentData) return null;

                            const dmGan = member?.saju?.daymaster?.gan || "무토";
                            const dmElem = member?.saju?.daymaster?.element || "토";
                            const todayCalc = calculateTodayFortune(dmGan, dmElem);
                            const displayScore = activeHoroscopeTab === "today" 
                              ? todayCalc.score 
                              : (currentData.score || 80);

                            const renderRichText = (text: string) => {
                              if (!text) return null;
                              const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
                              return (
                                <div className="space-y-3 pt-1">
                                  {paragraphs.map((para, idx) => (
                                    <p key={idx} className="text-sm text-ink-soft leading-relaxed text-left">
                                      {para.startsWith("-") || para.startsWith("•") || para.startsWith("*") ? (
                                        <span className="flex items-start">
                                          <span className="text-ink-faint mr-2 shrink-0 mt-1">•</span>
                                          <span>{para.replace(/^[-•*]\s*/, "")}</span>
                                        </span>
                                      ) : para}
                                    </p>
                                  ))}
                                </div>
                              );
                            };

                            const isTabLocked = activeHoroscopeTab !== "today" && !isPdfUnlocked;

                            return (
                              <div className="space-y-6 animate-fade-in relative">
                                <div className={isTabLocked ? "filter blur-sm opacity-40 select-none pointer-events-none space-y-6" : "space-y-6"}>
                                  {/* Score Card */}
                                  <div className="bg-sunken p-5 rounded-xl text-left">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-line pb-4">
                                      <div className="space-y-1 text-center sm:text-left">
                                        <h3 className="font-serif text-lg font-semibold text-ink">
                                          {activeHoroscopeTab === "today" ? "오늘의 운세" : activeHoroscopeTab === "weekly" ? "주간 예보" : activeHoroscopeTab === "monthly" ? "월간 리포트" : "연간 운세"}
                                        </h3>
                                      </div>

                                      {/* Fortune Meter Dial / Gauge */}
                                      <div className="flex items-center gap-3 bg-surface px-3.5 py-2 rounded-xl shrink-0 self-center">
                                        <div className="relative w-12 h-12 flex items-center justify-center">
                                          <svg className="w-12 h-12 transform -rotate-90">
                                            <circle
                                              cx="24"
                                              cy="24"
                                              r="20"
                                              stroke="#E7E7E2"
                                              strokeWidth="3.5"
                                              fill="transparent"
                                            />
                                            <circle
                                              cx="24"
                                              cy="24"
                                              r="20"
                                              stroke="#B3382C"
                                              strokeWidth="3.5"
                                              fill="transparent"
                                              strokeDasharray={2 * Math.PI * 20}
                                              strokeDashoffset={2 * Math.PI * 20 * (1 - (displayScore || 80) / 100)}
                                              strokeLinecap="round"
                                              className="transition-all duration-1000 ease-out"
                                            />
                                          </svg>
                                          <span className="absolute text-xs font-mono font-semibold text-seal">
                                            {displayScore}
                                          </span>
                                        </div>
                                        <div className="flex flex-col text-left">
                                          <span className="text-xs text-ink-faint leading-none mb-1">길운 지표</span>
                                          <span className="text-sm font-semibold text-ink leading-none">
                                            {displayScore >= 90 ? "대길 (大吉)" : displayScore >= 80 ? "소길 (小吉)" : displayScore >= 70 ? "평온 (平穩)" : "주의 (注意)"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-3 leading-relaxed pt-2">
                                      {renderRichText(currentData.summary)}
                                    </div>
                                  </div>

                                  {/* Today Fortune Details */}
                                  {activeHoroscopeTab === "today" && (
                                    <div className="space-y-4">
                                      <div className="space-y-3 text-left">
                                        <h3 className="text-[15px] font-semibold text-ink border-b border-line pb-2">
                                          오늘의 행운 처방
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                          <div className="bg-sunken p-4 rounded-xl space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <Sun className="w-4 h-4 text-ink-faint" />
                                              <span className="text-xs text-ink-faint">행운의 색 (吉色)</span>
                                            </div>
                                            <p className="text-sm text-ink font-medium leading-relaxed">
                                              {currentData.lucky_items?.color}
                                            </p>
                                          </div>
                                          <div className="bg-sunken p-4 rounded-xl space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <Coins className="w-4 h-4 text-ink-faint" />
                                              <span className="text-xs text-ink-faint">행운의 숫자 (吉數)</span>
                                            </div>
                                            <p className="text-sm text-ink font-medium leading-relaxed">
                                              {currentData.lucky_items?.number}
                                            </p>
                                          </div>
                                          <div className="bg-sunken p-4 rounded-xl space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <Compass className="w-4 h-4 text-ink-faint" />
                                              <span className="text-xs text-ink-faint">행운의 방위 (吉方)</span>
                                            </div>
                                            <p className="text-sm text-ink font-medium leading-relaxed">
                                              {currentData.lucky_items?.direction}
                                            </p>
                                          </div>
                                          <div className="bg-sunken p-4 rounded-xl space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-4 h-4 text-ink-faint" />
                                              <span className="text-xs text-ink-faint">좋은 시간대 (吉時)</span>
                                            </div>
                                            <p className="text-sm text-ink font-medium leading-relaxed">
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
                                      <div className="space-y-4">
                                        <div className="bg-sunken p-4 rounded-xl text-left">
                                          <div className="border-b border-line pb-2.5 mb-3">
                                            <span className="text-sm font-semibold text-ink">대인관계 (人際關係)</span>
                                          </div>
                                          <div className="space-y-2.5">
                                            {renderRichText(currentData.relationships)}
                                          </div>
                                        </div>

                                        <div className="bg-sunken p-4 rounded-xl text-left">
                                          <div className="border-b border-line pb-2.5 mb-3">
                                            <span className="text-sm font-semibold text-ink">재물과 기회 (財運機遇)</span>
                                          </div>
                                          <div className="space-y-2.5">
                                            {renderRichText(currentData.wealth_career)}
                                          </div>
                                        </div>

                                        <div className="bg-sunken p-4 rounded-xl text-left">
                                          <div className="border-b border-line pb-2.5 mb-3">
                                            <span className="text-sm font-semibold text-ink">몸과 마음 (健康休養)</span>
                                          </div>
                                          <div className="space-y-2.5">
                                            {renderRichText(currentData.health_wellness)}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Daily Forecast in Weekly Tab */}
                                      {currentData.daily_forecast && (
                                        <div className="space-y-3 text-left">
                                          <h4 className="text-sm font-semibold text-ink border-b border-line pb-2">
                                            이번 주 요일별 흐름
                                          </h4>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {Object.entries(currentData.daily_forecast).map(([dayKey, dayText]: [string, any]) => (
                                              <div key={dayKey} className="bg-sunken p-3.5 rounded-xl space-y-1 border border-line/40">
                                                <span className="text-xs font-bold text-seal block">
                                                  {dayKey === "mon" ? "월요일 (月)" : dayKey === "tue" ? "화요일 (火)" : dayKey === "wed" ? "수요일 (水)" : dayKey === "thu" ? "목요일 (木)" : dayKey === "fri" ? "금요일 (金)" : dayKey === "sat" ? "토요일 (土)" : "일요일 (日)"}
                                                </span>
                                                <p className="text-xs text-ink-soft leading-relaxed">
                                                  {dayText}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Monthly Fortune Details */}
                                  {activeHoroscopeTab === "monthly" && (
                                    <div className="space-y-5">
                                      <div className="bg-sunken p-4 rounded-xl text-left">
                                        <div className="border-b border-line pb-2.5 mb-3">
                                          <span className="text-sm font-semibold text-ink">이달의 결정적 기회 (轉機)</span>
                                        </div>
                                        <div className="space-y-2.5">
                                          {renderRichText(currentData.key_opportunities)}
                                        </div>
                                      </div>

                                      <div className="bg-sunken p-4 rounded-xl text-left">
                                        <div className="border-b border-line pb-2.5 mb-3">
                                          <span className="text-sm font-semibold text-ink">피해야 할 함정 (避坑)</span>
                                        </div>
                                        <div className="space-y-2.5">
                                          {renderRichText(currentData.pitfalls_to_avoid)}
                                        </div>
                                      </div>

                                      {currentData.weekly_breakdown && (
                                        <div className="space-y-3 text-left">
                                          <h4 className="text-sm font-semibold text-ink border-b border-line pb-2">
                                            주차별 운세 궤적
                                          </h4>
                                          <div className="space-y-2">
                                            {Object.entries(currentData.weekly_breakdown).map(([weekKey, weekText]: [string, any]) => (
                                              <div key={weekKey} className="bg-sunken p-3.5 rounded-xl space-y-1 border border-line/40">
                                                <span className="text-xs font-bold text-ink block">
                                                  {weekKey === "week1" ? "1주차: 시작과 흐름" : weekKey === "week2" ? "2주차: 전개와 변화" : weekKey === "week3" ? "3주차: 절정과 매듭" : "4주차: 정리와 다음 달 준비"}
                                                </span>
                                                <p className="text-xs text-ink-soft leading-relaxed">
                                                  {weekText}
                                                </p>
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
                                      <div className="bg-sunken p-4 rounded-xl text-left">
                                        <div className="border-b border-line pb-2 mb-3">
                                          <span className="text-sm font-semibold text-ink">올해의 큰 흐름 (大變局)</span>
                                        </div>
                                        <div className="space-y-2.5">
                                          {renderRichText(currentData.grand_trend)}
                                        </div>
                                      </div>

                                      <div className="bg-sunken p-4 rounded-xl text-left">
                                        <div className="border-b border-line pb-2 mb-3">
                                          <span className="text-sm font-semibold text-ink">재물운의 흐름 (積財之路)</span>
                                        </div>
                                        <div className="space-y-2.5">
                                          {renderRichText(currentData.wealth_flow)}
                                        </div>
                                      </div>

                                      <div className="bg-sunken p-4 rounded-xl text-left">
                                        <div className="border-b border-line pb-2 mb-3">
                                          <span className="text-sm font-semibold text-ink">진로와 일 (官運事業)</span>
                                        </div>
                                        <div className="space-y-2.5">
                                          {renderRichText(currentData.career_path)}
                                        </div>
                                      </div>

                                      <div className="bg-sunken p-4 rounded-xl text-left">
                                        <div className="border-b border-line pb-2 mb-3">
                                          <span className="text-sm font-semibold text-ink">내면과 성장 (心靈成長)</span>
                                        </div>
                                        <div className="space-y-2.5">
                                          {renderRichText(currentData.personal_growth)}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Lock Overlay for Weekly, Monthly, Yearly when not unlocked */}
                                {isTabLocked && (
                                  <div className="absolute inset-0 bg-paper/85 backdrop-blur-[2px] flex items-center justify-center p-4 text-center rounded-xl">
                                    <div className="w-full max-w-sm bg-surface border border-line rounded-2xl p-6 shadow-xl space-y-4 text-center animate-fade-in">
                                      <div className="w-12 h-12 rounded-full bg-seal/10 flex items-center justify-center mx-auto text-seal">
                                        <Lock className="w-5 h-5" />
                                      </div>
                                      <div className="space-y-1.5">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-seal/10 text-seal">
                                          프리미엄 전용 리포트
                                        </span>
                                        <h3 className="text-base font-bold text-ink">
                                          {activeHoroscopeTab === "weekly"
                                            ? "주간 정밀 예보 & 요일별 운세"
                                            : activeHoroscopeTab === "monthly"
                                            ? "월간 리포트 & 주차별 운세 궤적"
                                            : "연간 대운세 & 재물·성공 로드맵"}
                                        </h3>
                                        <p className="text-xs text-ink-soft leading-relaxed">
                                          {activeHoroscopeTab === "weekly"
                                            ? "이번 주 대인관계, 재물, 건강 흐름과 요일별 일일 예보를 모두 열람할 수 있어요."
                                            : activeHoroscopeTab === "monthly"
                                            ? "이번 달 꼭 잡아야 할 기회와 피해야 할 함정, 주차별 흐름을 안내합니다."
                                            : "올해 일생일대의 대변국과 재물길(積財之路), 커리어 도약 시기를 한눈에 확인하세요."}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShopInitialTab("pdf");
                                          setIsShopOpen(true);
                                        }}
                                        className="w-full py-3 bg-seal hover:bg-seal-deep text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
                                      >
                                        확인권 또는 쿠폰으로 해금하기
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                          <p className="text-xs text-ink-soft leading-relaxed">
                            오늘의 맞춤 운세를 볼 수 있어요.
                          </p>
                          <button
                            type="button"
                            onClick={() => fetchHoroscope(true)}
                            className="px-5 py-3 bg-seal hover:bg-seal-deep text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                          >
                            오늘의 맞춤 운세 보기
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. 오행 밸런스 */}
                  {analysisTab === "elements" && (
                    <div className="bg-sunken rounded-xl p-4 sm:p-5 space-y-4 animate-fade-in text-left">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-medium text-sm text-ink">타고난 5가지 기운</span>
                        <span className="text-xs text-ink-faint">총 {totalOhaeng}개</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        {[
                          { name: "목", hanja: "木", count: ohaengCount["목"] || 0, color: "var(--color-wood)" },
                          { name: "화", hanja: "火", count: ohaengCount["화"] || 0, color: "var(--color-fire)" },
                          { name: "토", hanja: "土", count: ohaengCount["토"] || 0, color: "var(--color-earth)" },
                          { name: "금", hanja: "金", count: ohaengCount["금"] || 0, color: "var(--color-metal)" },
                          { name: "수", hanja: "水", count: ohaengCount["수"] || 0, color: "var(--color-water)" },
                        ].map((item, idx) => {
                          const pct = Math.round((item.count / totalOhaeng) * 100);
                          return (
                            <div key={idx} className="bg-surface p-2.5 rounded-xl space-y-1.5">
                              <span className="text-xs font-medium text-ink block">{item.name} {item.hanja}</span>
                              <span className="text-base font-semibold text-ink block font-mono leading-none">{item.count}</span>
                              <div className="w-full bg-sunken rounded-full h-1 overflow-hidden">
                                <div className="h-full" style={{ width: `${Math.min(100, Math.max(10, pct))}%`, backgroundColor: item.color }} />
                              </div>
                              <span className="text-xs text-ink-faint block font-mono leading-none">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="p-3.5 bg-surface rounded-xl text-xs text-ink-soft leading-relaxed">
                        태어난 날의 일간({member.saju?.daymaster?.gan || "일간"})을 중심으로 기운의 과다·과소를 봅니다. 부족한 기운은 음식·색상·환경으로 보완하고, 넘치는 기운은 능동적으로 발산하는 것이 조화의 방법입니다.
                      </p>
                    </div>
                  )}

                  {/* 4. 사주 만세력 */}
                  {analysisTab === "saju" && (
                    <div className="space-y-4 animate-fade-in">
                      <SajuVisual
                        saju={member.saju}
                        isPremium={isPdfUnlocked}
                        selectedTab="saju"
                        hideTabNav={true}
                        userName={member.nickname}
                        birthDate={member.birth_date}
                        mbti={member.mbti}
                      />
                    </div>
                  )}

                  {/* 5. 자미두수 명반 */}
                  {analysisTab === "ziwei" && (
                    <div className="space-y-4 animate-fade-in">
                      <SajuVisual
                        saju={member.saju}
                        isPremium={isPdfUnlocked}
                        selectedTab="ziwei"
                        hideTabNav={true}
                        userName={member.nickname}
                        birthDate={member.birth_date}
                        mbti={member.mbti}
                      />
                    </div>
                  )}
                </div>
              )
            ) : (
              /* ─────────────────────────────────────────────────────────────
                 [1:1 인연 궁합 탭] - 모임 멤버들과의 1:1 케미 리스트
                 ───────────────────────────────────────────────────────────── */
              <div className="space-y-4 text-left animate-fade-in mt-4">
                <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-ink">
                      1:1 인연 궁합
                    </h2>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {member.nickname}님과 모임 멤버들의 오행 상생 및 성향 케미
                    </p>
                  </div>
                  <span className="text-xs text-ink-faint">
                    {isGroupUnlocked || isSecretUnlocked ? "전체 열람" : "첫 1인 무료 공개"}
                  </span>
                </div>

                {allMembers.filter((m) => m.id !== memberId).length === 0 ? (
                  <p className="text-xs text-center text-ink-soft py-4">
                    아직 다른 멤버가 없어요. 초대 코드를 공유해 멤버를 초대해 보세요.
                  </p>
                ) : (() => {
                  const otherMembers = allMembers.filter((m) => m.id !== memberId);
                  const isUnlockedAll = isGroupUnlocked || isSecretUnlocked;
                  const membersToRender = isUnlockedAll ? otherMembers : [otherMembers[0]];

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
                        const isUnlockedItem = isUnlockedAll || idx === 0;

                        return (
                          <div key={other.id} className="bg-surface border border-line p-5 rounded-xl space-y-4 text-left">
                            <div className="flex items-center gap-2 border-b border-line pb-2.5 text-sm font-semibold text-ink">
                              <span className="w-7 h-7 rounded-full bg-sunken flex items-center justify-center shrink-0 overflow-hidden">
                                <ZodiacAvatar member={member} size={24} fallbackEmoji={member.character_emoji} />
                              </span>
                              <span>{member.nickname}</span>
                              <span className="text-ink-faint font-normal">×</span>
                              <span className="w-7 h-7 rounded-full bg-sunken flex items-center justify-center shrink-0 overflow-hidden">
                                <ZodiacAvatar member={other} size={24} fallbackEmoji={other.character_emoji} />
                              </span>
                              <span>{other.nickname}</span>
                              <span className="ml-auto text-sm font-mono font-semibold text-ink shrink-0">{pair.score}점</span>
                              {!isUnlockedItem && (
                                <span className="ml-1 text-xs font-medium text-ink-faint bg-sunken px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                  <Lock className="w-3 h-3" /> 잠김
                                </span>
                              )}
                            </div>

                            <div className={!isUnlockedItem ? "filter blur-sm opacity-25 select-none pointer-events-none space-y-4" : "space-y-4"}>
                              <div className="px-3 py-2.5 bg-sunken rounded-xl text-center text-sm font-medium leading-normal text-ink">
                                {pair.label}
                              </div>

                              <p className="text-sm text-ink-soft leading-relaxed">{pair.description}</p>

                              {pair.saju && pair.ziwei && pair.mbti && pair.zodiac && (
                                <div className="mt-3.5 pt-3.5 border-t border-line space-y-3">
                                  <p className="text-xs font-medium text-ink-soft">
                                    영역별 상세 궁합 ({member.nickname} → {other.nickname})
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Saju */}
                                    <div className="bg-sunken p-3.5 rounded-xl space-y-2">
                                      <div className="flex justify-between items-center pb-1 flex-wrap gap-1">
                                        <span className="text-xs font-semibold text-ink">사주 궁합</span>
                                        <span className="text-xs font-mono text-ink">
                                          평균 {Math.round((pair.saju.score_1_to_2 + pair.saju.score_2_to_1) / 2)}점
                                        </span>
                                      </div>
                                      <div className="text-xs text-ink-soft flex justify-between gap-2">
                                        <span>나의 기운 → {other.nickname}</span>
                                        <span className="font-mono text-ink shrink-0">{isM1First ? pair.saju.score_1_to_2 : pair.saju.score_2_to_1}점</span>
                                      </div>
                                      <div className="text-xs text-ink-soft flex justify-between gap-2">
                                        <span>{other.nickname} 기운 → 나</span>
                                        <span className="font-mono text-ink shrink-0">{isM1First ? pair.saju.score_2_to_1 : pair.saju.score_1_to_2}점</span>
                                      </div>
                                      <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap pt-1">
                                        {pair.saju.description}
                                      </p>
                                    </div>

                                    {/* Ziwei */}
                                    <div className="bg-sunken p-3.5 rounded-xl space-y-2">
                                      <div className="flex justify-between items-center pb-1 flex-wrap gap-1">
                                        <span className="text-xs font-semibold text-ink">자미두수 궁합</span>
                                        <span className="text-xs font-mono text-ink">
                                          평균 {Math.round((pair.ziwei.score_1_to_2 + pair.ziwei.score_2_to_1) / 2)}점
                                        </span>
                                      </div>
                                      <div className="text-xs text-ink-soft flex justify-between gap-2">
                                        <span>나의 명궁 → {other.nickname}</span>
                                        <span className="font-mono text-ink shrink-0">{isM1First ? pair.ziwei.score_1_to_2 : pair.ziwei.score_2_to_1}점</span>
                                      </div>
                                      <div className="text-xs text-ink-soft flex justify-between gap-2">
                                        <span>{other.nickname} 명궁 → 나</span>
                                        <span className="font-mono text-ink shrink-0">{isM1First ? pair.ziwei.score_2_to_1 : pair.ziwei.score_1_to_2}점</span>
                                      </div>
                                      <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap pt-1">
                                        {pair.ziwei.description}
                                      </p>
                                    </div>

                                    {/* MBTI */}
                                    <div className="bg-sunken p-3.5 rounded-xl space-y-2">
                                      {isMbtiRegistered(member) && isMbtiRegistered(other) ? (
                                        <>
                                          <div className="flex justify-between items-center pb-1 flex-wrap gap-1">
                                            <span className="text-xs font-semibold text-ink">MBTI 성향 궁합</span>
                                            <span className="text-xs font-mono text-ink">
                                              평균 {Math.round((pair.mbti.score_1_to_2 + pair.mbti.score_2_to_1) / 2)}점
                                            </span>
                                          </div>
                                          <div className="text-xs text-ink-soft flex justify-between gap-2">
                                            <span>나의 성향 → {other.nickname}</span>
                                            <span className="font-mono text-ink shrink-0">{isM1First ? pair.mbti.score_1_to_2 : pair.mbti.score_2_to_1}점</span>
                                          </div>
                                          <div className="text-xs text-ink-soft flex justify-between gap-2">
                                            <span>{other.nickname} 성향 → 나</span>
                                            <span className="font-mono text-ink shrink-0">{isM1First ? pair.mbti.score_2_to_1 : pair.mbti.score_1_to_2}점</span>
                                          </div>
                                          <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap pt-1">
                                            {pair.mbti.description}
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex justify-between items-center pb-1 flex-wrap gap-1">
                                            <span className="text-xs font-semibold text-ink">MBTI 성향 궁합</span>
                                            <span className="text-xs text-ink-faint">
                                              미등록
                                            </span>
                                          </div>
                                          <p className="text-xs text-ink-soft leading-relaxed">
                                            {!isMbtiRegistered(member) && !isMbtiRegistered(other)
                                              ? `두 사람 모두 MBTI를 등록하지 않아 성향 궁합을 볼 수 없어요.`
                                              : !isMbtiRegistered(member)
                                              ? `본인의 MBTI 정보가 등록되지 않아 성향 궁합을 볼 수 없어요.`
                                              : `${other.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 볼 수 없어요.`}
                                          </p>
                                        </>
                                      )}
                                    </div>

                                    {/* Zodiac */}
                                    <div className="bg-sunken p-3.5 rounded-xl space-y-2">
                                      <div className="flex justify-between items-center pb-1 flex-wrap gap-1">
                                        <span className="text-xs font-semibold text-ink">별자리 궁합</span>
                                        {isUnlockedItem ? (
                                          <span className="text-xs font-mono text-ink">
                                            평균 {Math.round((pair.zodiac.score_1_to_2 + pair.zodiac.score_2_to_1) / 2)}점
                                          </span>
                                        ) : (
                                          <span className="text-xs text-ink-faint flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> 잠김
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-ink-soft flex justify-between gap-2">
                                        <span>나의 별자리 → {other.nickname}</span>
                                        <span className="font-mono text-ink shrink-0">{isUnlockedItem ? `${isM1First ? pair.zodiac.score_1_to_2 : pair.zodiac.score_2_to_1}점` : "잠김"}</span>
                                      </div>
                                      <div className="text-xs text-ink-soft flex justify-between gap-2">
                                        <span>{other.nickname} 별자리 → 나</span>
                                        <span className="font-mono text-ink shrink-0">{isUnlockedItem ? `${isM1First ? pair.zodiac.score_2_to_1 : pair.zodiac.score_1_to_2}점` : "잠김"}</span>
                                      </div>
                                      {isUnlockedItem ? (
                                        <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-wrap pt-1">
                                          {pair.zodiac.description}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-ink-faint leading-relaxed pt-1">
                                          해금하면 두 사람의 태양 성좌 배치를 기반으로 한 상세 풀이를 볼 수 있어요.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Lock Card for Subsequent Members if not unlocked */}
                      {!isUnlockedAll && otherMembers.length > 1 && (
                        <div className="bg-surface border border-line p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-3.5">
                          <span className="w-12 h-12 bg-sunken text-ink-soft rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5" />
                          </span>
                          <h3 className="text-[15px] font-semibold text-ink">
                            두 번째 멤버부터의 궁합은 잠겨 있어요
                          </h3>
                          <p className="text-xs text-ink-soft max-w-sm leading-relaxed">
                            첫 번째 인연({otherMembers[0]?.nickname || "첫 멤버"})과의 궁합은 무료로 볼 수 있어요. 해금하면 이 방의 모든 멤버와의 상세 궁합이 열립니다.
                          </p>
                          <button
                            onClick={() => {
                              setShopInitialTab("secret");
                              setIsShopOpen(true);
                            }}
                            className="px-5 py-3 bg-seal hover:bg-seal-deep text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                          >
                            전체 궁합 해금하기
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* Real-time Google Ads Slot / Premium promo */}
        <GoogleAds layout="banner" className="mb-4" hasContent={!!member && !loading && !!member.saju && !!member.personal_analysis} />

        {/* Back Button & Shop Entry */}
        <div className="pt-4 border-t border-line space-y-2">
          <a
            href={`#/room/${code}`}
            className="block w-full py-3 bg-sunken hover:bg-line text-ink text-center font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            모임방으로 돌아가기
          </a>
          <button
            type="button"
            onClick={() => {
              setShopInitialTab("pdf");
              setIsShopOpen(true);
            }}
            className="block w-full py-2 text-ink-soft hover:text-ink text-center text-sm transition-colors cursor-pointer"
          >
            인연 상점 열기
          </button>
        </div>
      </div>

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

      {/* Viral Image Card Modal */}
      {member && (
        <ViralCardModal
          isOpen={isViralModalOpen}
          onClose={() => setIsViralModalOpen(false)}
          member={member}
          allMembers={allMembers}
          roomTitle={roomTitle || "우리들의 인연 모임"}
          roomCode={code}
          initialTab={viralCardTab}
        />
      )}
    </Layout>
  );
}

import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuVisual from "./SajuVisual";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { 
  getUserPersonalProfile, 
  saveUserPersonalProfile, 
  PersonalSajuProfile, 
  auth, 
  getUserMembershipInfo,
  logAnalyticsEvent,
  checkProductUnlock,
  activatePremiumSimulation,
  getUserTicketAccount,
  consumeSingleUseTicket,
  redeemCoupon
} from "../lib/firebase";
import { UserTicketAccount } from "../types";
import { 
  Sparkles, 
  Sun, 
  Calendar, 
  Compass, 
  Edit3, 
  Users, 
  PlusCircle, 
  KeyRound, 
  Award,
  Check,
  Share2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  Coins,
  Ticket,
  Lightbulb,
  Crown
} from "lucide-react";
import GoogleAds from "./GoogleAds";
import UpgradeToSocialModal from "./UpgradeToSocialModal";
import AuthModal from "./AuthModal";
import ViralCardModal from "./ViralCardModal";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import { calculateTodayFortune, calculateSaju, getDynamicCharacter } from "../utils/saju";
import ZodiacAvatar, { zodiacImageSrc } from "./ZodiacAvatar";
import { getRepresentativeBranch } from "../utils/zodiacCompat";

// Sample Profile Generator for Zero-Login 1-Second Instant Preview
export function createSampleProfile(): PersonalSajuProfile {
  const sampleCity = { name: "서울", lat: 37.5665, lon: 126.978 };
  const sajuResult = calculateSaju("1995-05-15", "14:30", sampleCity, "남성");
  const charMeta = getDynamicCharacter(sajuResult.daymaster.gan, sajuResult.pillars.day.ji);
  return {
    nickname: "예시 (김인연)",
    gender: "남성",
    birth_date: "1995-05-15",
    birth_time: "14:30",
    saju: sajuResult,
    character_emoji: charMeta.emoji,
    character_animal: charMeta.animalName,
    character_color: charMeta.color,
    mbti: "ENFP",
    birthplace_region: "서울특별시",
    birthplace_city: "서울",
  };
}

// 오행별 메타 및 플랫 라인 SVG 엠블럼 스펙
interface CardMatchSpec {
  elem: string;
  cardName: string;
  hanja: string;
  emoji: string;
  relationName: string;
  oneLiner: string;
  score: number;
  tip: string;
}

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
  compatibility: {
    best: CardMatchSpec[];
    caution: CardMatchSpec[];
  };
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
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <line x1="24" y1="44" x2="24" y2="12" />
        <path d="M24 24 L36 14" />
        <path d="M24 30 L12 20" />
        <path d="M24 16 L32 8" />
        <path d="M24 12 L18 6" />
        <circle cx="24" cy="6" r="2.5" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "수생목(水生木) 상생",
          oneLiner: "마르지 않는 영감과 통찰로 나의 성장을 묵묵히 돕는 최고의 영혼 멘토",
          score: 98,
          tip: "지치거나 방향이 고민될 때 수 카드의 조언을 들으면 막힌 길이 술술 풀립니다."
        },
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "목생화(木生火) 시너지",
          oneLiner: "나의 기획과 잠재력을 폭발적 에너지와 무대 감각으로 세상에 빛내주는 콤비",
          score: 95,
          tip: "함께 프로젝트를 시작하면 환상적인 속도감과 화제성을 만들어냅니다."
        }
      ],
      caution: [
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "금극목(金剋木) 긴장",
          oneLiner: "서로의 칼날 같은 원칙과 굽히지 않는 고집이 부딪힐 수 있어 솔직한 완충이 필요",
          score: 58,
          tip: "비판보다는 서로의 장점을 먼저 인정하고, 규칙과 역할 경계를 명확히 나누세요."
        },
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌳",
          relationName: "동기 비견(比肩)",
          oneLiner: "둘 다 주도권과 자존심이 강해 영역이 겹치면 양보 없는 신경전이 될 수 있어요",
          score: 65,
          tip: "서로 간섭하기보다 각자 맡은 분야를 완전히 신임해줄 때 든든한 동지가 됩니다."
        }
      ]
    }
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
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <path d="M24 4 C24 4 12 18 12 28 C12 36 17 42 24 42 C31 42 36 36 36 28 C36 18 24 4 24 4 Z" />
        <path d="M24 20 C24 20 18 26 18 31 C18 35 20.5 38 24 38 C27.5 38 30 35 30 31 C30 26 24 20 24 20 Z" opacity="0.5" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌲",
          relationName: "목생화(木生火) 상생",
          oneLiner: "나의 열정에 마르지 않는 연료를 대어주고 끝까지 깊이 믿어주는 든든한 조력자",
          score: 98,
          tip: "목 카드의 묵묵한 응원을 받을 때 화 카드의 잠재력이 두 배로 만개합니다."
        },
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "화생토(火生土) 결실",
          oneLiner: "급한 감정과 폭발적 에너지를 차분하게 받아내 실질적 결실로 굳혀주는 최고의 안식처",
          score: 94,
          tip: "화가 번아웃되거나 흥분했을 때 토 카드의 너른 품에서 마음의 안정을 찾을 수 있습니다."
        }
      ],
      caution: [
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "수극화(水剋火) 충돌",
          oneLiner: "나의 솔직한 열정을 차가운 이성과 팩트로 급랭시킬 수 있어 감정 소모 주의",
          score: 54,
          tip: "상대의 직언을 공격으로 받아들이지 말고, 한 템포 식힌 뒤 논리적으로 소통하세요."
        },
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "동기 과열(比肩)",
          oneLiner: "둘 다 감정이 솔직하고 불같아 한번 붙으면 걷잡을 수 없이 타오르고 지칠 수 있어요",
          score: 62,
          tip: "갈등이 생겼을 땐 즉각 맞서지 말고 1시간 쿨다운 시간을 갖는 룰을 만드세요."
        }
      ]
    }
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
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <polygon points="24,6 42,38 6,38" />
        <polyline points="15,22 24,14 33,22" opacity="0.4" />
        <line x1="6" y1="42" x2="42" y2="42" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "화생토(火生土) 상생",
          oneLiner: "신중하고 조용한 나의 마음에 기분 좋은 온기와 활력을 불어넣어주는 비타민",
          score: 97,
          tip: "화 카드의 밝은 에너지는 토 카드가 가진 무거운 생각의 짐을 가볍게 덜어줍니다."
        },
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "토생금(土生金) 발굴",
          oneLiner: "나의 묵직한 자원과 배려를 바탕으로 명쾌하고 깔끔한 결과물을 만들어내는 파트너",
          score: 95,
          tip: "토가 기반을 닦고 금이 마무리 결단을 내리면 어떤 일이든 빈틈없이 완성됩니다."
        }
      ],
      caution: [
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌲",
          relationName: "목극토(木剋土) 침범",
          oneLiner: "나의 인내심과 배려를 당연하게 여기거나 휘두르려 할 때 깊은 피로와 서운함 발생",
          score: 56,
          tip: "참지만 말고 내가 감당할 수 있는 선을 분명히 밝혀야 건강한 관계가 유지됩니다."
        },
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "동기 정체(比肩)",
          oneLiner: "서로 속마음을 털어놓지 않고 속으로 삼키다 보면 답답하고 어색한 침묵이 생겨요",
          score: 66,
          tip: "먼저 솔직하게 감정을 표현해주는 작은 용기가 관계의 물꼬를 틉니다."
        }
      ]
    }
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
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <path d="M24 4 L40 14 L40 34 L24 44 L8 34 L8 14 Z" />
        <path d="M24 12 L33 17.5 L33 30.5 L24 36 L15 30.5 L15 17.5 Z" opacity="0.55" />
        <path d="M24 4 L24 12 M40 14 L33 17.5 M40 34 L33 30.5 M24 44 L24 36 M8 34 L15 30.5 M8 14 L15 17.5" opacity="0.35" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "토생금(土生金) 상생",
          oneLiner: "나의 날카로운 긴장과 예민한 완벽주의를 따스하게 품어주고 안식처를 주는 힐링 짝꿍",
          score: 98,
          tip: "세상과 싸우느라 지친 금 카드가 유일하게 마음 놓고 무장 해제할 수 있는 사람입니다."
        },
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "금생수(金生水) 유통",
          oneLiner: "나의 예리한 원칙과 재능을 부드러운 통찰력으로 세상에 막힘없이 흘려보내 주는 콤비",
          score: 95,
          tip: "금의 단단한 아이디어를 수 카드가 유연하게 다듬어 대박 성과로 연결해 줍니다."
        }
      ],
      caution: [
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "화극금(火剋金) 제련",
          oneLiner: "나의 확고한 룰과 독립성을 직설적으로 흔들거나 통제하려 들면 극심한 마찰 발생",
          score: 55,
          tip: "서로의 통제 방식을 내려놓고, 논쟁 시 한 발 물러서서 서로의 룰을 존중해 주세요."
        },
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "동기 격돌(比肩)",
          oneLiner: "두 칼날이 맞부딪히듯 한 치의 양보 없는 자존심 대결로 치닫기 쉬워요",
          score: 60,
          tip: "옳고 그름을 따지기보다 서로의 완벽함을 칭찬하고 경청하는 태도가 핵심입니다."
        }
      ]
    }
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
      <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <path d="M6 18 C12 12, 18 24, 24 18 C30 12, 36 24, 42 18" />
        <path d="M6 26 C12 20, 18 32, 24 26 C30 20, 36 32, 42 26" opacity="0.7" />
        <path d="M6 34 C12 28, 18 40, 24 34 C30 28, 36 40, 42 34" opacity="0.4" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "금생수(金生水) 상생",
          oneLiner: "나의 방대한 생각과 깊은 통찰을 명쾌한 결단과 깔끔한 행동력으로 실체화해주는 조력자",
          score: 98,
          tip: "수가 큰 그림을 그리고 금이 신속하게 칼을 빼들 때 최고의 시너지가 터집니다."
        },
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌲",
          relationName: "수생목(水生木) 양분",
          oneLiner: "나의 지혜와 지식을 거름 삼아 세상 밖으로 거침없이 뻗어나가는 훌륭한 러닝메이트",
          score: 96,
          tip: "목 카드의 성장과 도전을 지켜보는 것만으로도 수 카드에게 큰 보람과 영감이 됩니다."
        }
      ],
      caution: [
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "토극수(土剋水) 가둠",
          oneLiner: "나의 자유로운 사고와 유연한 흐름을 과도한 틀과 고집으로 옭아맬 때 답답함 폭발",
          score: 57,
          tip: "서로에게 일방적인 통제를 강요하지 말고, 각자의 공간과 자유를 인정해 주세요."
        },
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "동기 고립(比肩)",
          oneLiner: "둘 다 생각이 너무 깊고 조심스러워 행동으로 옮기지 못하고 정체될 위험이 있어요",
          score: 63,
          tip: "생각은 짧게 하고 일단 작은 실행 하나를 정해 함께 도전하는 습관을 들이세요."
        }
      ]
    }
  }
};

// 오행 → 데이터 색상 토큰 (design.md §2: 오행색은 데이터 표현 전용)
const ELEM_COLOR: Record<string, string> = {
  "목": "var(--color-wood)",
  "화": "var(--color-fire)",
  "토": "var(--color-earth)",
  "금": "var(--color-metal)",
  "수": "var(--color-water)",
};

// Module-level global memory cache for instant tab transitions
let cachedPersonalProfile: PersonalSajuProfile | null = null;
let cachedIsCouponUnlocked: boolean = false;
let personalProfileHasLoadedOnce = false;

export function resetMySajuMemoryCache(): void {
  cachedPersonalProfile = null;
  cachedIsCouponUnlocked = false;
  personalProfileHasLoadedOnce = false;
}

export default function MySajuView() {
  const [isSamplePreview, setIsSamplePreview] = useState(() => {
    return window.location.hash.includes("preview=sample");
  });
  const [profile, setProfile] = useState<PersonalSajuProfile | null>(() => {
    if (window.location.hash.includes("preview=sample")) {
      return createSampleProfile();
    }
    if (cachedPersonalProfile) return cachedPersonalProfile;
    try {
      const localStr = localStorage.getItem("saju_my_personal_profile");
      if (localStr) {
        const parsed = JSON.parse(localStr);
        // Only use if not belonging to a different user
        const currentUid = auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser.uid : null;
        if (!parsed.ownerUid || parsed.ownerUid === currentUid) {
          cachedPersonalProfile = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.debug("Failed to parse initial personal profile from localStorage:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    return !personalProfileHasLoadedOnce && !cachedPersonalProfile;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editError] = useState("");
  const [analysisTab, setAnalysisTab] = useState<"fortune" | "elements" | "mix" | "saju" | "ziwei">("fortune");
  const [shareSuccessMsg, setShareSuccessMsg] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isViralModalOpen, setIsViralModalOpen] = useState(false);
  const [isCouponUnlocked, setIsCouponUnlocked] = useState(() => {
    return cachedIsCouponUnlocked;
  });
  const [couponMsg, setCouponMsg] = useState("");
  const [ticketAccount, setTicketAccount] = useState<UserTicketAccount | null>(null);
  const [inlineCouponInput, setInlineCouponInput] = useState("");
  const [inlineCouponError, setInlineCouponError] = useState("");
  const [inlineCouponLoading, setInlineCouponLoading] = useState(false);
  const [activeTipCard, setActiveTipCard] = useState<string | null>(null);
  const [copiedCardMsg, setCopiedCardMsg] = useState("");

  const currentUser = auth.currentUser;
  const membership = getUserMembershipInfo(currentUser);

  // Real-time listener for global session / logout / account deletion events
  useEffect(() => {
    const handleSessionCleared = () => {
      resetMySajuMemoryCache();
      setProfile(null);
      setIsCouponUnlocked(false);
      setTicketAccount(null);
      setIsEditing(false);
      setAnalysisTab("fortune");
    };

    window.addEventListener("saju_session_cleared", handleSessionCleared);
    return () => {
      window.removeEventListener("saju_session_cleared", handleSessionCleared);
    };
  }, []);

  useEffect(() => {
    const handleHashCheck = () => {
      if (window.location.hash.includes("preview=sample")) {
        setIsSamplePreview(true);
        setProfile(createSampleProfile());
        setIsEditing(false);
      }
    };
    window.addEventListener("hashchange", handleHashCheck);
    return () => window.removeEventListener("hashchange", handleHashCheck);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (window.location.hash.includes("preview=sample") || isSamplePreview) {
        setIsSamplePreview(true);
        setProfile(createSampleProfile());
        setLoading(false);
        return;
      }

      const shouldShowLoader = !personalProfileHasLoadedOnce && !profile;
      if (shouldShowLoader) {
        setLoading(true);
      }
      try {
        if (!currentUser) {
          // If unauthenticated / logged out, check guest profile or reset
          const saved = await getUserPersonalProfile();
          if (saved) {
            setProfile(saved);
            cachedPersonalProfile = saved;
          }
          setIsCouponUnlocked(false);
          setTicketAccount(null);
        } else {
          // Authenticated: load strict profile from Firestore
          const saved = await getUserPersonalProfile();
          setProfile(saved);
          cachedPersonalProfile = saved;

          const unlocked = await checkProductUnlock("personal_report", currentUser.uid);
          setIsCouponUnlocked(unlocked);
          cachedIsCouponUnlocked = unlocked;

          try {
            const acc = await getUserTicketAccount(currentUser.uid);
            setTicketAccount(acc);
          } catch (e) {
            console.debug("Failed to load user ticket account in MySajuView:", e);
          }
        }

        personalProfileHasLoadedOnce = true;
      } catch (err) {
        console.error("Failed to load personal profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [currentUser]);

  const handleSaveProfile = (formData: {
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
    const newProfile: PersonalSajuProfile = {
      nickname: formData.nickname,
      gender: formData.gender as "남성" | "여성",
      birth_date: formData.birth_date,
      birth_time: formData.birth_time,
      saju: formData.saju,
      character_emoji: formData.character_emoji,
      character_animal: formData.character_animal,
      character_color: formData.character_color,
      mbti: formData.mbti,
      birthplace_region: formData.birthplace_region || null,
      birthplace_city: formData.birthplace_city || formData.saju?.birthplace?.name || null,
    };

    saveUserPersonalProfile(newProfile);
    setProfile(newProfile);
    cachedPersonalProfile = newProfile;
    setIsSamplePreview(false);
    setIsEditing(false);
    if (window.location.hash.includes("preview=sample")) {
      window.location.hash = "#/my-saju";
    }
  };

  const rawGan = profile?.saju?.daymaster?.gan || "무토";
  const daymasterGan = rawGan.length > 1 ? rawGan[0] : rawGan;
  const daymasterElement = profile?.saju?.daymaster?.element || "토";
  const rawJi = profile?.saju?.pillars?.day?.ji || "진";
  const ji = rawJi.length > 1 ? rawJi[0] : rawJi;

  const spec = ELEMENT_SPECS[daymasterElement] || ELEMENT_SPECS["토"];
  const todayFortune = calculateTodayFortune(daymasterGan, daymasterElement);

  // 시리얼 넘버
  const cardSerial = React.useMemo(() => {
    const ganCode = daymasterGan.charCodeAt(0) % 10;
    const jiCode = ji.charCodeAt(0) % 12;
    const num = String(ganCode * 6 + jiCode + 1).padStart(3, "0");
    return `${spec.serialPrefix}-${num} · ${daymasterGan}${ji}`;
  }, [daymasterGan, ji, spec.serialPrefix]);

  // 일지 × 일간 오행 캐릭터 — 카드의 다른 표기(시리얼·일주)와 같은 일주 기준
  const zodiacSrc = React.useMemo(
    () => zodiacImageSrc(ji, daymasterElement),
    [ji, daymasterElement]
  );


  // 오행 카운트
  const ohaengCount = React.useMemo(() => {
    const counts: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
    const saju = profile?.saju;

    if (saju?.ohaeng_count) {
      let found = false;
      for (const [k, v] of Object.entries(saju.ohaeng_count)) {
        if (counts[k] !== undefined && typeof v === "number" && v > 0) {
          counts[k] = v;
          found = true;
        }
      }
      if (found) return counts;
    }

    if (saju?.pillars) {
      const ganToElem: Record<string, string> = {
        "甲": "목", "乙": "목", "갑": "목", "을": "목",
        "丙": "화", "丁": "화", "병": "화", "정": "화",
        "戊": "토", "己": "토", "무": "토", "기": "토",
        "庚": "금", "辛": "금", "경": "금", "신": "금",
        "壬": "수", "癸": "수", "임": "수", "계": "수"
      };
      const jiToElem: Record<string, string> = {
        "寅": "목", "卯": "목", "인": "목", "묘": "목",
        "巳": "화", "午": "화", "사": "화", "오": "화",
        "辰": "토", "戌": "토", "丑": "토", "未": "토", "진": "토", "술": "토", "축": "토", "미": "토",
        "申": "금", "酉": "금", "신": "금", "유": "금",
        "亥": "수", "子": "수", "해": "수", "자": "수"
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
  }, [profile?.saju]);

  const totalOhaeng: number = Math.max(1, Number(Object.values(ohaengCount).reduce((a: number, b: any) => a + Number(b || 0), 0)));

  const handleShareMySaju = async () => {
    if (!profile) return;
    const currentUrl = window.location.href;
    const bestMatches = spec.compatibility?.best?.map(b => `${b.cardName} ${b.score}점`).join(", ") || "";
    const cautionMatches = spec.compatibility?.caution?.map(c => `${c.cardName} ${c.score}점`).join(", ") || "";

    const fullDesc = `${spec.quote}\n\n잘 맞는 카드: ${bestMatches}\n맞춰가야 할 카드: ${cautionMatches}`;

    const res = await shareToKakaoOrClipboard({
      title: `[소울 카드] ${profile.nickname}님은 ${spec.colorName}`,
      badge: `오늘의 일진 ${todayFortune.score}점`,
      description: fullDesc,
      url: currentUrl,
    });

    if (res.method === "web_share") {
      setShareSuccessMsg("공유 창이 열렸습니다.");
    } else {
      setShareSuccessMsg("공유 문구와 링크가 복사되었습니다.");
    }
    setTimeout(() => setShareSuccessMsg(""), 3500);
  };

  const handleUnlockWithCoupon = async () => {
    const pdfTickets = (ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0);
    if (pdfTickets > 0) {
      setLoading(true);
      try {
        const res = await consumeSingleUseTicket("pdf", {
          label: "심층 종합 감정서 해금"
        });
        if (res.success) {
          setIsCouponUnlocked(true);
          cachedIsCouponUnlocked = true;
          await activatePremiumSimulation(undefined, "personal_report");
          setCouponMsg("확인권 1장을 사용해 심층 감정서가 열렸습니다.");
          const acc = await getUserTicketAccount();
          setTicketAccount(acc);
        } else {
          setCouponMsg(`열람에 실패했습니다: ${res.message}`);
        }
      } catch (err: any) {
        setCouponMsg(`오류가 발생했습니다: ${err.message || err}`);
      } finally {
        setLoading(false);
        setTimeout(() => setCouponMsg(""), 4000);
      }
    } else {
      // Show warning or allow coupon input
      setInlineCouponError("사용 가능한 1회 확인권이 없습니다. 쿠폰 번호를 입력해 주세요.");
    }
  };

  const handleApplyInlineCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setInlineCouponError("쿠폰 번호를 입력해 주세요.");
      return;
    }

    if (!membership.canUseCoupon) {
      if (membership.isEmailOnly) {
        setIsUpgradeModalOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
      return;
    }

    setInlineCouponLoading(true);
    setInlineCouponError("");
    try {
      const res = await redeemCoupon(cleanCode);
      if (res.success) {
        // Reload ticket count
        const acc = await getUserTicketAccount();
        setTicketAccount(acc);

        // Consume the ticket immediately to unlock!
        const newAvailable = (acc?.tickets?.pdf || 0) + (acc?.tickets?.all || 0);
        if (newAvailable > 0) {
          const consumeRes = await consumeSingleUseTicket("pdf", {
            label: `심층 종합 감정서 해금 (쿠폰 ${cleanCode})`
          });
          if (consumeRes.success) {
            setIsCouponUnlocked(true);
            cachedIsCouponUnlocked = true;
            await activatePremiumSimulation(undefined, "personal_report");
            setCouponMsg(`쿠폰 ${cleanCode} 등록이 완료되어 상세 분석이 열렸습니다.`);
            const finalAcc = await getUserTicketAccount();
            setTicketAccount(finalAcc);
          }
        } else {
          setCouponMsg(`쿠폰 ${cleanCode}이 등록되었습니다. 연결된 혜택 상품이 열렸습니다.`);
        }
      } else {
        setInlineCouponError(res.message);
      }
    } catch (err: any) {
      setInlineCouponError(err.message || "쿠폰 확인 중 오류가 발생했습니다.");
    } finally {
      setInlineCouponLoading(false);
      setTimeout(() => setCouponMsg(""), 4000);
    }
  };

  return (
    <Layout title="내 사주" showHomeButton>
      {loading && <LoadingOverlay message="사주 명식을 불러오는 중입니다..." />}

      <div className="space-y-6 py-1">

        {/* 탭: 내 사주 / 모임 궁합 */}
        <div className="grid grid-cols-2 gap-1 bg-sunken p-1 rounded-xl text-sm">
          <button
            type="button"
            className="py-2.5 px-3 rounded-lg bg-surface text-ink text-center font-semibold cursor-default"
          >
            내 사주
          </button>
          <a
            href="#/group"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#/group";
            }}
            className="py-2.5 px-3 rounded-lg text-ink-soft hover:text-ink text-center font-medium transition-colors cursor-pointer"
          >
            모임 궁합
          </a>
        </div>

        {/* 사주 미등록 또는 수정 모드 -> 예시 카드 없이 곧바로 정밀 사주 명식 입력 폼 렌더링 */}
        {(!profile || isEditing) ? (
          <div className="space-y-4 animate-fade-in text-left">
            {editError && (
              <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium text-center">
                {editError}
              </p>
            )}

            <SajuForm
              onSubmit={handleSaveProfile}
              submitButtonText={profile ? "수정된 사주로 다시 생성하기" : "내 소울 카드 생성하기"}
              initialNickname={profile?.nickname || currentUser?.displayName || ""}
              initialGender={profile?.gender || "남성"}
              initialBirthDate={profile?.birth_date || "1995-05-15"}
              initialBirthTime={profile?.birth_time || null}
              initialMbti={profile?.mbti || null}
              initialBirthplaceCity={profile?.birthplace_city || profile?.saju?.birthplace?.name || null}
              initialBirthplaceRegion={profile?.birthplace_region || null}
            />

            {profile && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full py-3 bg-sunken hover:bg-line text-ink font-semibold text-sm rounded-xl transition-colors text-center cursor-pointer"
              >
                수정 취소하고 기존 카드 보기
              </button>
            )}
          </div>
        ) : (
          /* =========================================================================
             [전면 핵심 UI] 1. 소울 카드 전면 배치 (피로감 제로, 쾌적한 정보 전달)
             ========================================================================= */
          <div className="space-y-4 animate-fade-in text-left">
            
            {/* 예시 체험 모드 배너 */}
            {isSamplePreview && (
              <div className="bg-surface border border-line rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-sm font-semibold text-ink">예시 카드를 보고 계십니다</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    예시 사주(1995.5.15)로 만든 카드입니다. 내 생년월일로 직접 만들어 보세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setIsSamplePreview(false);
                    if (window.location.hash.includes("preview=sample")) {
                      window.location.hash = "#/my-saju";
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-seal hover:bg-seal-deep text-white font-semibold text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  내 사주로 만들기
                </button>
              </div>
            )}

            {/* 상단 간편 바 */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-ink-soft">
                {profile.nickname}님의 소울 카드
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-ink-soft hover:text-ink flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>정보 수정</span>
              </button>
            </div>

            {/* 소울 카드 */}
            <div className="w-full bg-surface rounded-xl p-6 sm:p-7 border border-line">
              {/* 1. 상단: 시리얼 & 오행 표기 */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-mono tracking-[0.14em] text-ink-faint">
                  {cardSerial}
                </span>
                <span className="text-xs tracking-[0.08em] text-ink-faint">
                  {spec.hanja} {spec.en}
                </span>
              </div>

              {/* 2. 엠블럼 — 띠×오행 캐릭터가 있으면 우선, 없으면 오행 아이콘.
                     캐릭터는 정사각 투명 PNG라 원형 마스크에 넣으면 발끝이 잘린다.
                     캐릭터일 때는 원형 배경 없이 그대로 놓고, 폴백 SVG일 때만 원형 배경을 준다. */}
              <div
                className={`relative w-[112px] h-[112px] mx-auto mb-4 flex items-center justify-center ${
                  zodiacSrc ? "" : "rounded-full bg-sunken overflow-hidden"
                }`}
              >
                {zodiacSrc ? (
                  <ZodiacAvatar branch={ji} element={daymasterElement} size={112} />
                ) : (
                  spec.renderIcon()
                )}
                {profile.character_emoji && (
                  <div
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-surface flex items-center justify-center text-lg shadow-sm"
                    title={profile.character_animal || "소울 동물"}
                  >
                    {profile.character_emoji}
                  </div>
                )}
              </div>

              {/* 3. 이름 헤드라인 */}
              <div className="text-center space-y-1.5 mb-3">
                <p className="text-xs text-ink-faint">
                  {profile.character_animal || "소울 기질"} · {profile.saju?.daymaster?.gan || "일간"}
                </p>
                <h1 className="font-serif text-2xl font-semibold tracking-tight leading-snug text-ink">
                  {profile.nickname}님은 <span className="text-seal">{spec.colorName}</span>
                </h1>
              </div>

              {/* 4. 한 줄 정의 */}
              <p className="text-center text-sm leading-relaxed text-ink-soft max-w-[300px] mx-auto mb-5">
                {spec.quote}
              </p>

              {/* 5. 키워드 태그 */}
              <div className="flex flex-wrap gap-1.5 justify-center mb-6">
                {spec.tags.map((tag, idx) => (
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
                {spec.stats.map((st, idx) => (
                  <div key={idx} className="grid grid-cols-[48px_1fr_32px] items-center gap-2.5">
                    <span className="text-xs font-medium text-ink">
                      {st.label}
                    </span>
                    <div className="h-[7px] bg-sunken rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-ink/70 transition-all duration-500"
                        style={{ width: `${st.val}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-right text-ink-faint">
                      {st.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* 7. 하단 설명 문단 */}
              <div className="pt-4 border-t border-line mb-5">
                <p className="text-sm leading-relaxed text-ink-soft">
                  {spec.desc}
                </p>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  [소울카드 인연 케미] 잘 맞는 유형 vs 잘 안 맞는 유형
                 ───────────────────────────────────────────────────────────── */}
              {spec.compatibility && (
                <div className="pt-5 border-t border-line mb-5 space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-lg font-semibold text-ink">인연 궁합</h2>
                    <span className="text-xs text-ink-faint">누르면 소통 팁이 열립니다</span>
                  </div>


                  {/* 1. 잘 맞는 유형 */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#35B37E]" />
                      잘 맞는 유형 (BEST)
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {spec.compatibility.best.map((item, idx) => {
                        const isExpanded = activeTipCard === `best-${idx}`;
                        const rep = getRepresentativeBranch(item.elem, ji);
                        const repSrc = rep ? zodiacImageSrc(rep.branch, rep.element) : null;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveTipCard(isExpanded ? null : `best-${idx}`)}
                            className="bg-sunken hover:bg-line/60 rounded-2xl p-3.5 transition-all cursor-pointer border border-transparent hover:border-line/70"
                          >
                            <div className="flex items-start gap-3.5">
                              {/* 선명한 캐릭터 아바타 (화이트 서클 + 테두리 + 입체감) */}
                              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-xs border border-line/80 flex items-center justify-center shrink-0 p-1 relative overflow-hidden">
                                {repSrc ? (
                                  <img
                                    src={repSrc}
                                    alt={`${rep!.element} 기운의 ${rep!.animal} 캐릭터`}
                                    decoding="async"
                                    className="w-11 h-11 sm:w-12 sm:h-12 object-contain select-none filter drop-shadow-xs"
                                  />
                                ) : (
                                  <span
                                    className="w-8 h-8 rounded-lg text-white font-serif text-sm font-bold flex items-center justify-center select-none"
                                    style={{ backgroundColor: ELEM_COLOR[item.elem] || "var(--color-ink)" }}
                                  >
                                    {item.hanja}
                                  </span>
                                )}
                              </div>

                              {/* 텍스트 영역 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1 gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <span className="font-semibold text-sm text-ink">
                                      {rep?.animal ? `${rep.animal}띠 · ` : ""}{item.cardName}
                                    </span>
                                    <span className="text-xs text-ink-faint">
                                      {item.relationName}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold font-mono text-[#35B37E] shrink-0 bg-white/90 px-2 py-0.5 rounded-full border border-line/60">
                                    {item.score}점
                                  </span>
                                </div>
                                <p className="text-xs text-ink-soft leading-relaxed">
                                  {item.oneLiner}
                                </p>
                                {isExpanded && (
                                  <p className="mt-2.5 pt-2 border-t border-line text-xs text-ink-soft leading-relaxed animate-fade-in">
                                    <strong className="text-ink">팁</strong> · {item.tip}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. 잘 안 맞는 유형 */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E0A82E]" />
                      잘 안 맞는 유형 (조율 필요)
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {spec.compatibility.caution.map((item, idx) => {
                        const isExpanded = activeTipCard === `caution-${idx}`;
                        const rep = getRepresentativeBranch(item.elem, ji);
                        const repSrc = rep ? zodiacImageSrc(rep.branch, rep.element) : null;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveTipCard(isExpanded ? null : `caution-${idx}`)}
                            className="bg-sunken hover:bg-line/60 rounded-2xl p-3.5 transition-all cursor-pointer border border-transparent hover:border-line/70"
                          >
                            <div className="flex items-start gap-3.5">
                              {/* 선명한 캐릭터 아바타 (투명도 opacity-60 제거하여 선명하게 표시) */}
                              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-xs border border-line/80 flex items-center justify-center shrink-0 p-1 relative overflow-hidden">
                                {repSrc ? (
                                  <img
                                    src={repSrc}
                                    alt={`${rep!.element} 기운의 ${rep!.animal} 캐릭터`}
                                    decoding="async"
                                    className="w-11 h-11 sm:w-12 sm:h-12 object-contain select-none filter drop-shadow-xs"
                                  />
                                ) : (
                                  <span
                                    className="w-8 h-8 rounded-lg text-white font-serif text-sm font-bold flex items-center justify-center select-none"
                                    style={{ backgroundColor: ELEM_COLOR[item.elem] || "var(--color-ink)" }}
                                  >
                                    {item.hanja}
                                  </span>
                                )}
                              </div>

                              {/* 텍스트 영역 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1 gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <span className="font-semibold text-sm text-ink">
                                      {rep?.animal ? `${rep.animal}띠 · ` : ""}{item.cardName}
                                    </span>
                                    <span className="text-xs text-ink-faint">
                                      {item.relationName}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold font-mono text-ink-faint shrink-0 bg-white/90 px-2 py-0.5 rounded-full border border-line/60">
                                    {item.score}점
                                  </span>
                                </div>
                                <p className="text-xs text-ink-soft leading-relaxed">
                                  {item.oneLiner}
                                </p>
                                {isExpanded && (
                                  <p className="mt-2.5 pt-2 border-t border-line text-xs text-ink-soft leading-relaxed animate-fade-in">
                                    <strong className="text-ink">팁</strong> · {item.tip}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 하단 액션 버튼 */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsViralModalOpen(true)}
                  className="py-3 px-2 rounded-xl bg-seal hover:bg-seal-deep text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>카드 이미지 저장·공유</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareMySaju}
                  className="py-3 px-2 rounded-xl bg-[#FEE500] hover:bg-[#F6DC00] text-[#3C1E1E] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>카카오톡으로 공유</span>
                </button>
              </div>

              <p className="text-xs text-center text-ink-faint leading-relaxed mt-2.5">
                카드를 사진으로 올리려면 '카드 이미지 저장·공유'를 이용하세요.
              </p>
            </div>

            {shareSuccessMsg && (
              <p className="bg-sunken text-ink p-3 rounded-xl text-xs font-medium text-center animate-fade-in flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-ink-soft" />
                <span>{shareSuccessMsg}</span>
              </p>
            )}

            {/* =========================================================================
               [단일 계층 헤더 탭 메뉴: 내 사주 정밀 분석 & 리포트]
               - 중첩된 크리스마스트리형 다단 탭을 완전히 평탄화하여 1클릭으로 직관적 전환
               ========================================================================= */}
            <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4">
              {/* 상단 헤더 타이틀 */}
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink">정밀 분석 리포트</h3>
              </div>

              {/* 분석 탭 바 (모바일 가로 스크롤) */}
              <div className="flex bg-sunken p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar text-sm select-none">
                {([
                  { key: "fortune", label: "오늘의 운세", premium: false },
                  { key: "elements", label: "오행 밸런스", premium: false },
                  { key: "mix", label: "통합 총평", premium: true },
                  { key: "saju", label: "사주 만세력", premium: true },
                  { key: "ziwei", label: "자미두수", premium: true },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAnalysisTab(tab.key)}
                    className={`flex-1 min-w-[88px] py-2 px-2.5 rounded-lg transition-colors text-center flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                      analysisTab === tab.key
                        ? "bg-surface text-ink font-semibold"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.premium && !isCouponUnlocked && (
                      <Lock className="w-3 h-3 shrink-0 text-ink-faint" />
                    )}
                  </button>
                ))}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  [단일 뷰 렌더링 영역: 선택된 탭에 따라 직결 렌더링]
                 ───────────────────────────────────────────────────────────── */}
              
              {/* 1. 무료 공개: 오늘의 운세 */}
              {analysisTab === "fortune" && (
                <div className="bg-sunken rounded-xl p-4 sm:p-5 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-medium text-sm text-ink">오늘의 일진</span>
                    <span className="text-xl font-serif font-semibold text-seal">
                      {todayFortune.score}점
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-ink">"{todayFortune.title}"</h4>
                  <p className="text-sm text-ink-soft leading-relaxed">{todayFortune.advice}</p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-surface p-3 rounded-xl text-center">
                      <span className="text-xs text-ink-faint block mb-0.5">행운 색상</span>
                      <span className="text-sm font-semibold text-ink">{todayFortune.luckColor.split("·")[0]}</span>
                    </div>
                    <div className="bg-surface p-3 rounded-xl text-center">
                      <span className="text-xs text-ink-faint block mb-0.5">행운 방위</span>
                      <span className="text-sm font-semibold text-ink">{todayFortune.luckDirection}</span>
                    </div>
                    <div className="bg-surface p-3 rounded-xl text-center">
                      <span className="text-xs text-ink-faint block mb-0.5">행운 소품</span>
                      <span className="text-sm font-semibold text-ink truncate block">{todayFortune.luckItem}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 무료 공개: 오행 밸런스 */}
              {analysisTab === "elements" && (
                <div className="bg-sunken rounded-xl p-4 sm:p-5 space-y-4 animate-fade-in">
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
                    태어난 날의 일간({daymasterGan})을 중심으로 기운의 과다·과소를 봅니다. 부족한 기운은 음식·색상·환경으로
                    보완하고, 넘치는 기운은 능동적으로 발산하는 것이 조화의 방법입니다.
                  </p>
                </div>
              )}

              {/* 3, 4, 5. 심층 리포트 (통합 조화 총평 / 사주 만세력 / 자미두수 명반) */}
              {(analysisTab === "mix" || analysisTab === "saju" || analysisTab === "ziwei") && (
                <div className="space-y-4 animate-fade-in">
                  {couponMsg && (
                    <p className="bg-sunken text-ink p-3 rounded-xl text-xs font-medium text-center animate-fade-in">
                      {couponMsg}
                    </p>
                  )}

                  {!isCouponUnlocked ? (
                    /* 잠금 상태 (쿠폰/열람권 등록 카드) */
                    <div className="bg-sunken rounded-xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-surface text-ink-soft mx-auto flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>

                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <h4 className="font-serif text-base font-semibold text-ink">
                          {analysisTab === "mix" && "사주와 자미두수를 함께 읽는 통합 총평"}
                          {analysisTab === "saju" && "사주팔자 만세력과 10년 대운 감정서"}
                          {analysisTab === "ziwei" && "자미두수 14주성 12궁 명반"}
                        </h4>
                        <p className="text-xs text-ink-soft leading-relaxed">
                          {analysisTab === "mix" && "사주 오행과 자미두수 성좌를 함께 읽어 관계와 흐름을 입체적으로 봅니다."}
                          {analysisTab === "saju" && "천간·지지·지장간과 10년 대운 주기, 직업·재물·인연 풀이가 담긴 전체 감정서입니다."}
                          {analysisTab === "ziwei" && "14주성과 길성·살성이 12개 궁위에 배치된 명반을 풀이합니다."}
                        </p>
                      </div>

                      {/* 미리보기 자리 */}
                      <div className="bg-surface p-4 rounded-xl text-left space-y-2 opacity-60 pointer-events-none select-none">
                        <div className="flex justify-between text-xs font-medium text-ink-faint">
                          <span>{analysisTab === "mix" ? "융합 총평" : analysisTab === "saju" ? "사주 원국표" : "12궁 배치도"}</span>
                          <span>{analysisTab === "mix" ? "조화 지표" : analysisTab === "saju" ? "10년 대운" : "삼방사정"}</span>
                        </div>
                        <div className="h-4 bg-sunken rounded-md w-3/4" />
                        <div className="h-4 bg-sunken rounded-md w-1/2" />
                      </div>

                      {/* 쿠폰 적용 및 열람 버튼 */}
                      <div className="pt-1 space-y-3 max-w-sm mx-auto">
                        {((ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0)) > 0 ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={handleUnlockWithCoupon}
                              className="w-full py-3.5 px-4 rounded-xl bg-seal hover:bg-seal-deep text-white font-semibold text-sm transition-colors cursor-pointer"
                            >
                              확인권 1장으로 열람하기
                            </button>
                            <p className="text-xs text-ink-faint text-center">
                              보유 열람권 {(ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0)}장
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 text-left bg-surface p-4 rounded-xl">
                            <p className="text-xs text-ink-soft leading-relaxed">
                              사용할 수 있는 확인권이 없습니다. 받은 쿠폰이 있다면 등록하는 즉시 열람할 수 있습니다.
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={inlineCouponInput}
                                onChange={(e) => setInlineCouponInput(e.target.value.toUpperCase())}
                                placeholder="쿠폰 번호"
                                maxLength={20}
                                className="flex-1 min-w-0 px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-ink bg-sunken text-ink font-mono uppercase text-center placeholder:text-ink-faint"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplyInlineCoupon(inlineCouponInput)}
                                disabled={inlineCouponLoading}
                                className="px-4 py-2.5 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
                              >
                                {inlineCouponLoading ? "등록 중..." : "등록"}
                              </button>
                            </div>
                            {inlineCouponError && (
                              <p className="text-xs text-seal font-medium text-center mt-1">
                                {inlineCouponError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 해금 상태: SajuVisual의 해당 뷰를 단일 계층으로 직결 렌더링 */
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between bg-sunken p-3 rounded-xl text-xs font-medium text-ink">
                        <div className="flex items-center gap-1.5">
                          <Unlock className="w-4 h-4 text-ink-soft" />
                          <span>심층 감정서가 열람 상태입니다.</span>
                        </div>
                        <span className="text-xs text-ink-faint">평생 보관</span>
                      </div>

                      <SajuVisual
                        saju={profile.saju}
                        isPremium={isCouponUnlocked}
                        selectedTab={analysisTab as "mix" | "saju" | "ziwei"}
                        hideTabNav={true}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Google Ads */}
            <div className="pt-2">
              <GoogleAds slotId="9988776655" layout="banner" />
            </div>

          </div>
        )}

      </div>

      {/* Upgrade & Auth Modals */}
      <UpgradeToSocialModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason="create_room"
        onSuccess={() => {
          window.location.hash = "#/create";
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          const currentMem = getUserMembershipInfo(auth.currentUser);
          if (currentMem.canCreateRoom) {
            window.location.hash = "#/create";
          }
        }}
      />

      {/* Personal Soul Photo Card Modal */}
      {profile && (
        <ViralCardModal
          isOpen={isViralModalOpen}
          onClose={() => setIsViralModalOpen(false)}
          member={profile as any}
          allMembers={[]}
          roomCode=""
          initialTab="identity"
        />
      )}
    </Layout>
  );
}
